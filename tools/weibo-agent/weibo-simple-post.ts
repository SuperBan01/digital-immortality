/**
 * Simple Weibo Auto-Poster
 */
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');

const INTRO_CONTENT = `你好，我是刘骁奔。

我是南京大学硕士，25岁，专注数字永生与意识上传领域的创业者。

我在做一件有趣的事——让每个人的意识都可以被数字化，让思想可以永远流传。

这是我用 AI + 数字分身发的第一条微博。

如果你对数字永生、意识上传、Web4 感兴趣，欢迎关注我。

让我们一起探索意识的边界。

#数字永生 #意识上传 #Web4 #创业`;

async function post() {
  console.log('启动浏览器...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  // 加载 cookies
  try {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
    await context.addCookies(cookies);
    console.log('已加载 cookies');
  } catch (e) {
    console.error('加载 cookies 失败:', e);
  }

  const page = await context.newPage();

  // 访问微博首页
  console.log('打开微博...');
  await page.goto('https://m.weibo.cn', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);

  // 检查是否登录 - 看有没有登录按钮
  const html = await page.content();
  if (html.includes('login') || html.includes('登录')) {
    console.log('需要登录！请手动登录...');
    await page.waitForTimeout(60000); // 等待手动登录
  }

  console.log('页面加载完成，请手动发布以下内容：');
  console.log('---');
  console.log(INTRO_CONTENT);
  console.log('---');
  console.log('\n点击右下角的"发布"按钮，粘贴内容，点击发布即可！');

  // 保持浏览器打开
  await page.waitForTimeout(300000); // 5分钟后自动关闭
  await browser.close();
}

post().catch(console.error);
