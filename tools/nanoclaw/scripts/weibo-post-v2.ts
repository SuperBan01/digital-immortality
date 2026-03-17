/**
 * Direct Weibo Poster v2 - 使用发布页面
 */
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');

const CONTENT = process.argv[2] || `你好，我是刘骁奔。

我是南京大学硕士，25岁，专注数字永生与意识上传领域的创业者。

我在做一件有趣的事——让每个人的意识都可以被数字化，让思想可以永远流传。

这是我用 AI + 数字分身发的第一条微博。

如果你对数字永生、意识上传、Web4 感兴趣，欢迎关注我。

让我们一起探索意识的边界。

#数字永生 #意识上传 #Web4 #创业`;

async function post() {
  console.log('启动浏览器...');
  console.log('发送内容:', CONTENT.substring(0, 50) + '...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  // 加载 cookies
  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  await context.addCookies(cookies);
  console.log('已加载 cookies');

  const page = await context.newPage();

  // 直接访问发布页面
  console.log('打开微博发布页面...');
  await page.goto('https://m.weibo.cn/compose', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // 打印页面内容用于调试
  const title = await page.title();
  console.log('页面标题:', title);

  // 尝试找到所有输入相关的元素
  const inputs = await page.$$('input, textarea');
  console.log('找到输入框数量:', inputs.length);

  // 找到输入框并输入内容
  console.log('输入内容...');
  try {
    await page.fill('textarea', CONTENT);
    console.log('已填写内容');
  } catch (e) {
    console.log('textarea fill 失败');
    // 尝试使用 type
    try {
      await page.type('textarea', CONTENT);
    } catch (e2) {
      console.log('type 也失败');
    }
  }

  await page.waitForTimeout(1000);

  // 点击发送按钮
  console.log('点击发送...');
  try {
    // 尝试找到发送按钮
    const buttons = await page.$$('a, button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && (text.includes('发布') || text.includes('发送') || text.includes('submit'))) {
        console.log('找到按钮:', text);
        await btn.click();
        break;
      }
    }
  } catch (e) {
    console.log('点击发送失败');
  }

  await page.waitForTimeout(3000);
  console.log('完成！');

  // 保持浏览器打开
  console.log('浏览器将保持打开 60 秒...');
  await page.waitForTimeout(60000);
  await browser.close();
}

post().catch(console.error);
