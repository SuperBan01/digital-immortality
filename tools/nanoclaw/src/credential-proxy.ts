/**
 * Credential proxy for container isolation.
 * Containers connect here instead of directly to the Anthropic API.
 * The proxy injects real credentials so containers never see them.
 *
 * Two auth modes:
 *   API key:  Proxy injects x-api-key on every request.
 *   OAuth:    Container CLI exchanges its placeholder token for a temp
 *             API key via /api/oauth/claude_cli/create_api_key.
 *             Proxy injects real OAuth token on that exchange request;
 *             subsequent requests carry the temp key which is valid as-is.
 *
 * MiniMax support:
 *   When MINIMAX_API_KEY is configured, the proxy translates Anthropic-format
 *   requests to MiniMax (OpenAI-compatible) format and translates responses back.
 */
import { createServer, Server } from 'http';
import { request as httpsRequest } from 'https';
import { request as httpRequest, RequestOptions } from 'http';

import { readEnvFile } from './env.js';
import { logger } from './logger.js';

export type AuthMode = 'api-key' | 'oauth';

export interface ProxyConfig {
  authMode: AuthMode;
}

// MiniMax API configuration
interface MiniMaxConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// Default MiniMax model
const DEFAULT_MINIMAX_MODEL = 'abab6.5s-chat';

function getMiniMaxConfig(): MiniMaxConfig | null {
  const secrets = readEnvFile(['MINIMAX_API_KEY', 'MINIMAX_BASE_URL', 'MINIMAX_MODEL']);

  if (!secrets.MINIMAX_API_KEY) {
    return null;
  }

  return {
    apiKey: secrets.MINIMAX_API_KEY,
    baseUrl: secrets.MINIMAX_BASE_URL || 'https://api.minimax.chat',
    model: secrets.MINIMAX_MODEL || DEFAULT_MINIMAX_MODEL,
  };
}

/**
 * Convert Anthropic request format to MiniMax (OpenAI-compatible) format
 */
function anthropicToMiniMax(body: Buffer, miniMaxModel: string): string {
  try {
    const anthropicReq = JSON.parse(body.toString('utf-8'));

    // Map Anthropic messages to OpenAI format
    const messages = anthropicReq.messages?.map((msg: { role: string; content: string | any[] }) => {
      let content: string;

      if (typeof msg.content === 'string') {
        content = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Handle content blocks (text, image, etc.)
        content = msg.content
          .filter((block: { type: string }) => block.type === 'text')
          .map((block: { text: string }) => block.text)
          .join('\n');
      } else {
        content = String(msg.content);
      }

      // Map 'assistant' role to 'assistant' (same in OpenAI)
      // Anthropic uses 'user' and 'assistant' roles
      return {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: content,
      };
    }) || [];

    // Build MiniMax request - always use non-streaming for simpler conversion
    // Streaming SSE responses are harder to translate back to Anthropic format
    const miniMaxReq: any = {
      model: miniMaxModel,
      messages,
      temperature: anthropicReq.temperature,
      top_p: anthropicReq.top_p,
      max_tokens: anthropicReq.max_tokens || 4096,
      stream: false, // Force non-streaming for easier translation
    };

    // Handle system messages (Anthropic uses 'system' role in messages array)
    const systemMessages = messages.filter((m: { role: string }) => m.role === 'system');
    if (systemMessages.length > 0) {
      miniMaxReq.system = systemMessages.map((m: { content: string }) => m.content).join('\n');
      // Remove system from messages
      miniMaxReq.messages = messages.filter((m: { role: string }) => m.role !== 'system');
    }

    return JSON.stringify(miniMaxReq);
  } catch (err) {
    logger.warn({ err }, 'Failed to convert request to MiniMax format, passing through');
    return body.toString('utf-8');
  }
}

/**
 * Convert MiniMax (OpenAI-compatible) response to Anthropic format
 */
function miniMaxToAnthropic(miniMaxResponse: string): string {
  try {
    const miniMaxResp = JSON.parse(miniMaxResponse);

    // If it's a streaming response, handle each chunk
    if (miniMaxResp.object === 'chat.completion.chunk') {
      // For streaming, we need to convert to Anthropic's stream format
      // This is complex - for simplicity, we'll return the raw response
      // and let the SDK handle it (SDK might not support this fully)
      return miniMaxResponse;
    }

    // Convert non-streaming response
    const anthropicResp: any = {
      id: miniMaxResp.id,
      type: 'message',
      role: 'assistant',
      content: [],
      model: miniMaxResp.model,
      stop_reason: miniMaxResp.choices?.[0]?.finish_reason || 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: miniMaxResp.usage?.prompt_tokens || 0,
        output_tokens: miniMaxResp.usage?.completion_tokens || 0,
      },
    };

    // Add content block
    const messageContent = miniMaxResp.choices?.[0]?.message?.content || '';
    if (messageContent) {
      anthropicResp.content.push({
        type: 'text',
        text: messageContent,
      });
    }

    return JSON.stringify(anthropicResp);
  } catch (err) {
    logger.warn({ err }, 'Failed to convert response from MiniMax format');
    return miniMaxResponse;
  }
}

export function startCredentialProxy(
  port: number,
  host = '127.0.0.1',
): Promise<Server> {
  const secrets = readEnvFile([
    'ANTHROPIC_API_KEY',
    'CLAUDE_CODE_OAUTH_TOKEN',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
  ]);

  // Check for MiniMax configuration
  const miniMaxConfig = getMiniMaxConfig();

  const authMode: AuthMode = secrets.ANTHROPIC_API_KEY ? 'api-key' : 'oauth';
  const oauthToken =
    secrets.CLAUDE_CODE_OAUTH_TOKEN || secrets.ANTHROPIC_AUTH_TOKEN;

  // Determine upstream URL and request handling based on config
  let upstreamUrl: URL;
  let isHttps: boolean;
  let makeRequest: typeof httpsRequest;

  if (miniMaxConfig) {
    // Use MiniMax as upstream
    upstreamUrl = new URL(miniMaxConfig.baseUrl);
    isHttps = upstreamUrl.protocol === 'https:';
    makeRequest = isHttps ? httpsRequest : httpRequest;
    logger.info({ miniMaxBaseUrl: miniMaxConfig.baseUrl, model: miniMaxConfig.model }, 'MiniMax mode enabled');
  } else {
    // Use Anthropic as upstream (original behavior)
    upstreamUrl = new URL(
      secrets.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    );
    isHttps = upstreamUrl.protocol === 'https:';
    makeRequest = isHttps ? httpsRequest : httpRequest;
  }

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const body = Buffer.concat(chunks);

        // Check if this is a MiniMax request (translate Anthropic -> MiniMax)
        if (miniMaxConfig && req.url?.includes('/v1/messages')) {
          // This is an Anthropic messages API call - translate to MiniMax
          const miniMaxBody = anthropicToMiniMax(body, miniMaxConfig.model);
          const miniMaxBodyBuffer = Buffer.from(miniMaxBody, 'utf-8');

          const miniMaxHeaders: Record<string, string | number | string[] | undefined> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${miniMaxConfig.apiKey}`,
            'content-length': miniMaxBodyBuffer.length,
          };

          // Determine the correct MiniMax endpoint path
          const miniMaxPath = '/v1/text/chatcompletion_v2';

          const upstream = makeRequest(
            {
              hostname: upstreamUrl.hostname,
              port: upstreamUrl.port || (isHttps ? 443 : 80),
              path: miniMaxPath,
              method: 'POST',
              headers: miniMaxHeaders,
            } as RequestOptions,
            (upRes) => {
              // Collect response and translate back to Anthropic format
              const responseChunks: Buffer[] = [];
              upRes.on('data', (chunk) => responseChunks.push(chunk));
              upRes.on('end', () => {
                const responseBody = Buffer.concat(responseChunks);
                const translatedBody = miniMaxToAnthropic(responseBody.toString('utf-8'));
                res.writeHead(upRes.statusCode!, {
                  ...upRes.headers,
                  'content-length': Buffer.byteLength(translatedBody),
                });
                res.end(translatedBody);
              });
            },
          );

          upstream.on('error', (err) => {
            logger.error(
              { err, url: req.url },
              'MiniMax upstream error',
            );
            if (!res.headersSent) {
              res.writeHead(502);
              res.end('Bad Gateway');
            }
          });

          upstream.write(miniMaxBodyBuffer);
          upstream.end();
          return;
        }

        // Standard proxy mode (original behavior or non-message requests)
        const headers: Record<string, string | number | string[] | undefined> =
          {
            ...(req.headers as Record<string, string>),
            host: upstreamUrl.host,
            'content-length': body.length,
          };

        // Strip hop-by-hop headers that must not be forwarded by proxies
        delete headers['connection'];
        delete headers['keep-alive'];
        delete headers['transfer-encoding'];

        if (authMode === 'api-key' && !miniMaxConfig) {
          // API key mode: inject x-api-key on every request
          delete headers['x-api-key'];
          headers['x-api-key'] = secrets.ANTHROPIC_API_KEY;
        } else if (authMode === 'oauth') {
          // OAuth mode: replace placeholder Bearer token with the real one
          // only when the container actually sends an Authorization header
          // (exchange request + auth probes). Post-exchange requests use
          // x-api-key only, so they pass through without token injection.
          if (headers['authorization']) {
            delete headers['authorization'];
            if (oauthToken) {
              headers['authorization'] = `Bearer ${oauthToken}`;
            }
          }
        }

        const upstream = makeRequest(
          {
            hostname: upstreamUrl.hostname,
            port: upstreamUrl.port || (isHttps ? 443 : 80),
            path: req.url,
            method: req.method,
            headers,
          } as RequestOptions,
          (upRes) => {
            res.writeHead(upRes.statusCode!, upRes.headers);
            upRes.pipe(res);
          },
        );

        upstream.on('error', (err) => {
          logger.error(
            { err, url: req.url },
            'Credential proxy upstream error',
          );
          if (!res.headersSent) {
            res.writeHead(502);
            res.end('Bad Gateway');
          }
        });

        upstream.write(body);
        upstream.end();
      });
    });

    server.listen(port, host, () => {
      logger.info({ port, host, authMode, mode: miniMaxConfig ? 'minimax' : 'anthropic' }, 'Credential proxy started');
      resolve(server);
    });

    server.on('error', reject);
  });
}

/** Detect which auth mode the host is configured for. */
export function detectAuthMode(): AuthMode {
  const secrets = readEnvFile(['ANTHROPIC_API_KEY']);
  return secrets.ANTHROPIC_API_KEY ? 'api-key' : 'oauth';
}
