/**
 * Weibo Channel for NanoClaw
 * Uses Playwright for browser automation to operate Weibo
 *
 * Supports:
 * - Posting new weibos (text + images)
 * - Reading timeline
 * - Replying to comments
 * - Liking posts
 * - Polling for mentions/comments
 */
import { Channel, OnInboundMessage, OnChatMetadata, RegisteredGroup, NewMessage } from '../types.js';
import { registerChannel } from './registry.js';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

// Weibo channel configuration
const WEIBO_CONFIG = {
  // Cookies file path for persistent login
  cookiesPath: path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json'),
  // Polling interval in milliseconds
  pollInterval: 60000,
  // Base URLs
  baseUrl: 'https://weibo.com',
  mblogUrl: 'https://m.weibo.cn',
};

interface WeiboPost {
  id: string;
  text: string;
  user: {
    id: string;
    screen_name: string;
    profile_url: string;
  };
  created_at: string;
  reposts_count: number;
  comments_count: number;
  attitudes_count: number;
}

class WeiboChannel implements Channel {
  name = 'weibo';
  private connected = false;
  private onMessage: OnInboundMessage;
  private onChatMetadata: OnChatMetadata;
  private registeredGroups: () => Record<string, RegisteredGroup>;
  private browser: any = null;
  private page: any = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastCheckedIds: Set<string> = new Set();
  private userId: string = '';
  private screenName: string = '';
  private playwright: any = null;
  private playwrightAvailable = false;

  constructor(
    onMessage: OnInboundMessage,
    onChatMetadata: OnChatMetadata,
    registeredGroups: () => Record<string, RegisteredGroup>,
  ) {
    this.onMessage = onMessage;
    this.onChatMetadata = onChatMetadata;
    this.registeredGroups = registeredGroups;
  }

  /**
   * Initialize Playwright and launch browser
   */
  private async initBrowser(): Promise<boolean> {
    try {
      // Dynamically import Playwright
      const { chromium } = await import('playwright');
      this.playwright = { chromium };
      this.playwrightAvailable = true;
    } catch (err) {
      console.warn('[weibo] Playwright not available. Run "npx playwright install chromium" to enable Weibo functionality.');
      this.playwrightAvailable = false;
      return false;
    }

    try {
      this.browser = await this.playwright.chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      // Create new context with stealth properties
      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
      });

      // Load existing cookies if available
      await this.loadCookies(context);

      this.page = await context.newPage();

      // Inject stealth script to avoid detection
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      console.log('[weibo] Browser initialized');
      return true;
    } catch (err) {
      console.error('[weibo] Failed to initialize browser:', err);
      return false;
    }
  }

  /**
   * Load cookies from file
   */
  private async loadCookies(context: any): Promise<boolean> {
    try {
      if (fs.existsSync(WEIBO_CONFIG.cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(WEIBO_CONFIG.cookiesPath, 'utf-8'));
        await context.addCookies(cookies);
        console.log('[weibo] Loaded cookies from file');
        return true;
      }
    } catch (err) {
      console.warn('[weibo] Failed to load cookies:', err);
    }
    return false;
  }

  /**
   * Save cookies to file
   */
  private async saveCookies(): Promise<void> {
    try {
      const cookies = await this.page.context().cookies();
      const configDir = path.dirname(WEIBO_CONFIG.cookiesPath);
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(WEIBO_CONFIG.cookiesPath, JSON.stringify(cookies, null, 2));
      console.log('[weibo] Saved cookies to file');
    } catch (err) {
      console.warn('[weibo] Failed to save cookies:', err);
    }
  }

  /**
   * Check if logged in
   */
  private async checkLogin(): Promise<boolean> {
    try {
      // Try mobile API first (more reliable)
      try {
        await this.page.goto(`${WEIBO_CONFIG.mblogUrl}/profile/info`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });

        const bodyText = await this.page.$eval('body', (el) => el.innerText);
        // Check if we got valid user data (not login page)
        if (bodyText && !bodyText.includes('登录') && !bodyText.includes('login')) {
          // Try to extract user info from the response
          const idMatch = bodyText.match(/用户ID[：:]\s*(\d+)/);
          const nameMatch = bodyText.match(/昵称[：:]\s*(\S+)/);

          if (idMatch || nameMatch) {
            this.userId = idMatch ? idMatch[1] : 'unknown';
            this.screenName = nameMatch ? nameMatch[1] : 'Weibo User';
            console.log(`[weibo] Logged in as: ${this.screenName} (${this.userId})`);
            return true;
          }
        }
      } catch (e) {
        // Mobile version failed, try desktop
      }

      // Fallback to desktop
      await this.page.goto(WEIBO_CONFIG.baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Check for login elements or user avatar
      const userAvatar = await this.page.$('.avatar');
      if (userAvatar) {
        // Try to get user info
        const userInfo = await this.page.$eval('.username', (el: any) => el.textContent).catch(() => null);
        console.log('[weibo] Logged in as:', userInfo);
        return true;
      }

      // Check for login button (not logged in)
      const loginBtn = await this.page.$('[node-type="loginBtn"]');
      return !loginBtn;
    } catch (err) {
      console.error('[weibo] Login check failed:', err);
      return false;
    }
  }

  /**
   * Login to Weibo using username/password
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      if (!this.browser) {
        await this.initBrowser();
      }

      await this.page.goto(`${WEIBO_CONFIG.baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });

      // Click login tab if needed
      const loginTab = await this.page.$('.tab-item[node-type="login_tab"]');
      if (loginTab) {
        await loginTab.click();
      }

      // Enter username
      await this.page.fill('#loginName', username);
      // Enter password
      await this.page.fill('#loginPassword', password);

      // Click login button
      await this.page.click('[node-type="loginBtn"]');

      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

      // Verify login
      const isLoggedIn = await this.checkLogin();
      if (isLoggedIn) {
        await this.saveCookies();
        await this.fetchUserInfo();
      }

      return isLoggedIn;
    } catch (err) {
      console.error('[weibo] Login failed:', err);
      return false;
    }
  }

  /**
   * Fetch current user info
   */
  private async fetchUserInfo(): Promise<void> {
    try {
      // Try to get user ID from the page
      const userInfoScript = await this.page.$eval('script', (script: any) => script.textContent).catch(() => '');

      // Try mobile version for easier parsing
      await this.page.goto(`${WEIBO_CONFIG.mblogUrl}/profile/info`, { waitUntil: 'networkidle', timeout: 15000 });
      const userData = await this.page.$eval('body', (body: any) => {
        const text = body.innerText;
        const idMatch = text.match(/用户ID[：:]\s*(\d+)/);
        const nameMatch = text.match(/昵称[：:]\s*(\S+)/);
        return {
          id: idMatch ? idMatch[1] : null,
          name: nameMatch ? nameMatch[1] : null,
        };
      }).catch(() => ({ id: null, name: null }));

      this.userId = userData.id || 'unknown';
      this.screenName = userData.name || 'Weibo User';

      console.log(`[weibo] User info: ${this.screenName} (${this.userId})`);
    } catch (err) {
      console.warn('[weibo] Failed to fetch user info:', err);
      this.userId = 'unknown';
      this.screenName = 'Weibo User';
    }
  }

  /**
   * Post a new weibo
   */
  async postWeibo(text: string, images?: string[]): Promise<{ success: boolean; weiboId?: string; error?: string }> {
    try {
      if (!this.page) {
        return { success: false, error: 'Browser not initialized' };
      }

      // Go to compose page
      await this.page.goto(WEIBO_CONFIG.baseUrl, { waitUntil: 'networkidle', timeout: 20000 });

      // Click compose button
      const composeBtn = await this.page.$('[node-type="publish"]') ||
                         await this.page.$('.W_icon_aite') ||
                         await this.page.$('textarea[ node-type="textare"]');

      if (composeBtn) {
        await composeBtn.click();
      }

      // Wait for compose area
      await this.page.waitForSelector('textarea[node-type="textare"]', { timeout: 10000 });

      // Fill text
      await this.page.fill('textarea[node-type="textare"]', text);

      // If images provided, upload them
      if (images && images.length > 0) {
        // Find image upload button
        const imageInput = await this.page.$('input[node-type="uploadImg"]');
        if (imageInput) {
          for (const imagePath of images) {
            await imageInput.setInputFiles(imagePath);
          }
        }
      }

      // Click send button
      await this.page.click('[node-type="publish"]');

      // Wait for post to complete
      await this.page.waitForTimeout(3000);

      // Check if successful (look for success toast or new post)
      const successIndicator = await this.page.$('.layer_point') ||
                                await this.page.$('.toast_success');

      if (successIndicator) {
        // Try to get the weibo ID from URL
        const currentUrl = this.page.url();
        const weiboIdMatch = currentUrl.match(/m\.weibo\.cn\/detail\/(\d+)/);

        return {
          success: true,
          weiboId: weiboIdMatch ? weiboIdMatch[1] : undefined,
        };
      }

      return { success: true }; // Assume success if no error
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[weibo] Post failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get home timeline
   */
  async getTimeline(count: number = 20): Promise<WeiboPost[]> {
    try {
      // Use mobile API for easier parsing
      const response = await this.page.request.get(
        `${WEIBO_CONFIG.mblogUrl}/statuses/following.json`,
        {
          params: {
            page: 1,
            count: count,
          },
        }
      );

      const data = await response.json();
      if (data.ok === 1 && data.data) {
        return data.data.map((item: any) => ({
          id: item.id,
          text: item.text,
          user: {
            id: item.user.id,
            screen_name: item.user.screen_name,
            profile_url: item.user.profile_url,
          },
          created_at: item.created_at,
          reposts_count: item.reposts_count,
          comments_count: item.comments_count,
          attitudes_count: item.attitudes_count,
        }));
      }
      return [];
    } catch (err) {
      console.error('[weibo] Failed to get timeline:', err);
      return [];
    }
  }

  /**
   * Like a weibo
   */
  async likeWeibo(weiboId: string): Promise<boolean> {
    try {
      await this.page.goto(`${WEIBO_CONFIG.mblogUrl}/detail/${weiboId}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      // Click like button
      const likeBtn = await this.page.$('[node-type="like"]') ||
                      await this.page.$('.heart') ||
                      await this.page.$('[action-type="like"]');

      if (likeBtn) {
        await likeBtn.click();
        await this.page.waitForTimeout(1000);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[weibo] Like failed:', err);
      return false;
    }
  }

  /**
   * Comment on a weibo
   */
  async commentWeibo(weiboId: string, text: string): Promise<{ success: boolean; commentId?: string; error?: string }> {
    try {
      await this.page.goto(`${WEIBO_CONFIG.mblogUrl}/detail/${weiboId}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      // Find comment input
      const commentInput = await this.page.$('[node-type="comment_input"]') ||
                           await this.page.$('.comment_txt');

      if (!commentInput) {
        return { success: false, error: 'Comment input not found' };
      }

      await commentInput.fill(text);

      // Click submit
      const submitBtn = await this.page.$('[node-type="comment_submit"]') ||
                        await this.page.$('.comment_btn');

      if (submitBtn) {
        await submitBtn.click();
        await this.page.waitForTimeout(2000);
        return { success: true };
      }

      return { success: false, error: 'Submit button not found' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[weibo] Comment failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Repost (forward) a weibo
   */
  async repostWeibo(weiboId: string, text?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.page.goto(`${WEIBO_CONFIG.mblogUrl}/detail/${weiboId}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      // Click repost button
      const repostBtn = await this.page.$('[node-type="forward"]') ||
                        await this.page.$('.forward');

      if (!repostBtn) {
        return { success: false, error: 'Repost button not found' };
      }

      await repostBtn.click();

      // Wait for modal
      await this.page.waitForSelector('[node-type="repost_text"]', { timeout: 10000 });

      // Add comment if provided
      if (text) {
        await this.page.fill('[node-type="repost_text"]', text);
      }

      // Submit repost
      const submitBtn = await this.page.$('[node-type="repost_submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await this.page.waitForTimeout(2000);
        return { success: true };
      }

      return { success: false, error: 'Submit button not found' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[weibo] Repost failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Check for mentions and comments
   */
  private async checkMentions(): Promise<void> {
    try {
      if (!this.page || !this.userId) return;

      // Check mentions
      const mentionsResponse = await this.page.request.get(
        `${WEIBO_CONFIG.mblogUrl}/statuses/mentions`,
        {
          params: {
            page: 1,
            count: 20,
          },
        }
      );

      const mentionsData = await mentionsResponse.json();
      if (mentionsData.ok === 1 && mentionsData.data) {
        const mentions = mentionsData.data;

        for (const mention of mentions) {
          if (!this.lastCheckedIds.has(mention.id)) {
            this.lastCheckedIds.add(mention.id);

            const message: NewMessage = {
              id: `weibo:mention:${mention.id}`,
              chat_jid: 'weibo:mentions',
              sender: mention.user.id,
              sender_name: mention.user.screen_name,
              content: mention.text,
              timestamp: new Date(mention.created_at).toISOString(),
            };

            console.log(`[weibo] New mention from ${message.sender_name}: ${message.content.substring(0, 50)}...`);
            this.onMessage('weibo:mentions', message);
          }
        }
      }

      // Check comments on my posts
      const commentsResponse = await this.page.request.get(
        `${WEIBO_CONFIG.mblogUrl}/comments/by_me`,
        {
          params: {
            page: 1,
            count: 20,
          },
        }
      );

      const commentsData = await commentsResponse.json();
      if (commentsData.ok === 1 && commentsData.data) {
        const comments = commentsData.data;

        for (const comment of comments) {
          if (!this.lastCheckedIds.has(`comment:${comment.id}`)) {
            this.lastCheckedIds.add(`comment:${comment.id}`);

            const message: NewMessage = {
              id: `weibo:comment:${comment.id}`,
              chat_jid: 'weibo:comments',
              sender: comment.user.id,
              sender_name: comment.user.screen_name,
              content: `Comment on your post: ${comment.text}`,
              timestamp: new Date(comment.created_at).toISOString(),
            };

            console.log(`[weibo] New comment from ${message.sender_name}: ${comment.text.substring(0, 50)}...`);
            this.onMessage('weibo:comments', message);
          }
        }
      }
    } catch (err) {
      console.warn('[weibo] Failed to check mentions:', err);
    }
  }

  /**
   * Start polling for new messages
   */
  private startPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    this.pollTimer = setInterval(async () => {
      if (this.connected) {
        await this.checkMentions();
      }
    }, WEIBO_CONFIG.pollInterval);

    console.log('[weibo] Started polling for mentions/comments');
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async connect(): Promise<void> {
    try {
      // Initialize browser
      await this.initBrowser();

      // Check login status
      const isLoggedIn = await this.checkLogin();

      if (!isLoggedIn) {
        // Try to login with credentials if provided
        const username = process.env.WEIBO_USERNAME;
        const password = process.env.WEIBO_PASSWORD;

        if (username && password) {
          console.log('[weibo] Attempting login...');
          const loginSuccess = await this.login(username, password);
          if (!loginSuccess) {
            console.warn('[weibo] Login failed. Please log in manually and save cookies.');
            console.log('[weibo] After logging in, the cookies will be saved automatically.');
          }
        } else {
          console.warn('[weibo] Not logged in. Please set WEIBO_USERNAME and WEIBO_PASSWORD or log in manually.');
        }
      }

      // Fetch user info if logged in
      if (await this.checkLogin()) {
        await this.fetchUserInfo();
      }

      this.connected = true;

      // Notify about available chats
      // Main weibo chat
      this.onChatMetadata('weibo:timeline', new Date().toISOString(), 'Weibo Timeline', 'weibo', false);
      this.onChatMetadata('weibo:mentions', new Date().toISOString(), 'Weibo Mentions', 'weibo', false);
      this.onChatMetadata('weibo:comments', new Date().toISOString(), 'Weibo Comments', 'weibo', false);

      console.log('[weibo] Connected.');

      // Start polling for mentions
      this.startPolling();
    } catch (err) {
      console.error('[weibo] Connect failed:', err);
      throw err;
    }
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Weibo channel not connected');
    }

    // Parse command from text
    // Format: @weibo post <content>
    //         @weibo like <weibo_id>
    //         @weibo comment <weibo_id> <content>
    //         @weibo repost <weibo_id> [comment]
    //         @weibo timeline

    const lines = text.split('\n');
    const firstLine = lines[0].trim();

    // Check if this is a command
    if (firstLine.startsWith('@weibo ')) {
      const command = firstLine.slice(7).trim();
      const parts = command.split(' ');
      const action = parts[0]?.toLowerCase();

      switch (action) {
        case 'post':
        case 'publish': {
          const content = parts.slice(1).join(' ') || lines.slice(1).join('\n');
          const result = await this.postWeibo(content);
          if (result.success) {
            console.log(`[weibo] Posted successfully: ${result.weiboId}`);
          } else {
            console.error(`[weibo] Post failed: ${result.error}`);
          }
          break;
        }

        case 'like': {
          const weiboId = parts[1];
          if (weiboId) {
            const success = await this.likeWeibo(weiboId);
            console.log(`[weibo] Like ${success ? 'successful' : 'failed'}`);
          }
          break;
        }

        case 'comment': {
          const weiboId = parts[1];
          const content = parts.slice(2).join(' ') || lines.slice(1).join('\n');
          if (weiboId && content) {
            const result = await this.commentWeibo(weiboId, content);
            console.log(`[weibo] Comment ${result.success ? 'successful' : 'failed'}`);
          }
          break;
        }

        case 'repost': {
          const weiboId = parts[1];
          const comment = parts.slice(2).join(' ') || lines.slice(1).join('\n');
          if (weiboId) {
            const result = await this.repostWeibo(weiboId, comment || undefined);
            console.log(`[weibo] Repost ${result.success ? 'successful' : 'failed'}`);
          }
          break;
        }

        case 'timeline': {
          const posts = await this.getTimeline(10);
          console.log('[weibo] Timeline:');
          for (const post of posts) {
            console.log(`  - ${post.user.screen_name}: ${post.text.substring(0, 50)}...`);
          }
          break;
        }

        default:
          console.log('[weibo] Unknown command. Available commands: post, like, comment, repost, timeline');
      }
    } else {
      // Default: post a new weibo
      const result = await this.postWeibo(text);
      if (result.success) {
        console.log(`[weibo] Posted successfully: ${result.weiboId}`);
      } else {
        console.error(`[weibo] Post failed: ${result.error}`);
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  ownsJid(jid: string): boolean {
    return jid.startsWith('weibo:');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.stopPolling();

    // Save cookies before closing
    if (this.page) {
      await this.saveCookies();
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    console.log('[weibo] Disconnected');
  }
}

export function init() {
  registerChannel('weibo', (opts) => {
    // Check if WEIBO_USERNAME or cookies exist
    const hasCredentials = process.env.WEIBO_USERNAME ||
                          process.env.WEIBO_COOKIES ||
                          fs.existsSync(WEIBO_CONFIG.cookiesPath);

    if (!hasCredentials) {
      console.log('[weibo] Channel available but not configured. Set WEIBO_USERNAME and WEIBO_PASSWORD or provide cookies to use.');
    }

    return new WeiboChannel(opts.onMessage, opts.onChatMetadata, opts.registeredGroups);
  });
}

init();
