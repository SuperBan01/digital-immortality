/**
 * Export Weibo cookies from browser
 * Run this to export your logged-in cookies for Weibo automation
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');

async function exportCookies() {
  console.log('Opening browser...');

  const browser = await chromium.launch({
    headless: false, // Show browser so you can log in
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Please log in to Weibo in the browser window...');

  // Try mobile version which is more accessible
  try {
    await page.goto('https://m.weibo.cn', { waitUntil: 'networkidle', timeout: 60000 });
  } catch {
    console.log('Mobile version timeout, trying desktop...');
    await page.goto('https://weibo.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  // Wait for user to log in - check for login button or user info
  await page.waitForFunction(() => {
    // Check for logged in state
    const loggedIn = document.querySelector('.avatar') ||
                   document.querySelector('.user-name') ||
                   document.querySelector('[node-type="loginBtn"]') === null;
    return loggedIn;
  }, { timeout: 120000 });

  console.log('Detected login! Exporting cookies...');

  // Get cookies
  const cookies = await context.cookies();

  // Save to file
  fs.mkdirSync(path.dirname(COOKIES_PATH), { recursive: true });
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

  console.log(`Cookies saved to: ${COOKIES_PATH}`);

  // Get user info
  try {
    await page.goto('https://m.weibo.cn/profile/info', { waitUntil: 'networkidle', timeout: 30000 });
    const userInfo = await page.$eval('body', (body) => body.innerText).catch(() => 'Unknown');
    console.log('User page content:', userInfo.substring(0, 500));
  } catch (e) {
    console.log('Could not fetch user info');
  }

  await browser.close();
  console.log('Done!');
}

exportCookies().catch(console.error);
