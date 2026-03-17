/**
 * Direct Weibo Poster
 */
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');

const CONTENT = `你好，我是刘骁奔。

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
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });

  // 加载 cookies
  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  await context.addCookies(cookies);
  console.log('已加载 cookies');

  const page = await context.newPage();

  // 访问微博
  console.log('打开微博...');
  await page.goto('https://m.weibo.cn', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // 点击发布按钮 - 使用更通用的选择器
  console.log('点击发布按钮...');
  try {
    // 尝试找到发布按钮
    const publishBtn = await page.$('[node-type="publish"]') ||
                      await page.$('.iconfont') ||
                      await page.$('[class*="publish"]');
    if (publishBtn) {
      await publishBtn.click();
    } else {
      // 直接点击屏幕右下角附近
      await page.mouse.click(350, 750);
    }
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('点击发布按钮失败，尝试直接访问发布页面');
  }

  // 找到输入框并输入内容
  console.log('输入内容...');
  const textarea = await page.$('textarea') || await page.$('[node-type="text"]');
  if (textarea) {
    await textarea.fill(CONTENT);
  } else {
    console.log('找不到输入框，尝试键盘输入...');
    await page.keyboard.press('Tab');
    await page.keyboard.type(CONTENT);
  }

  await page.waitForTimeout(1000);

  // 点击发送
  console.log('点击发送...');
  const sendBtn = await page.$('[node-type="submit"]') ||
                  await page.$('a[class*="send"]') ||
                  await page.$('a[class*="submit"]');
  if (sendBtn) {
    await sendBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  await page.waitForTimeout(3000);
  console.log('完成！请检查微博是否发布成功。');

  await browser.close();
}

post().catch(console.error);
