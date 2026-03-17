/**
 * Manual Weibo login - opens browser and waits for you to log in
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');

async function login() {
  console.log('Opening browser for Weibo login...');
  console.log('Please log in manually. I will wait 30 seconds before saving cookies.\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Open Weibo login page
  await page.goto('https://weibo.com/login', { waitUntil: 'domcontentloaded' });

  // Wait 30 seconds for user to log in
  console.log('Waiting 30 seconds for login...');
  await page.waitForTimeout(30000);

  // Save cookies
  const cookies = await context.cookies();
  fs.mkdirSync(path.dirname(COOKIES_PATH), { recursive: true });
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

  console.log(`\nCookies saved to: ${COOKIES_PATH}`);
  console.log(`Total cookies: ${cookies.length}`);

  await browser.close();
  console.log('Done! You can now use Weibo with NanoClaw.');
}

login().catch(console.error);
