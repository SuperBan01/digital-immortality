/**
 * Direct Weibo Poster - Introduce Digital Immortality
 */
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');

const CONTENT = `我在做一个有趣的项目：Digital Immortality（数字永生）。

通过结合个人文章和 AI 技术，让 AI 学习你的思维方式和价值观，在社交媒体上代表你发言，延续你的数字存在。

我的数字化身已经用 AI 发了第一条微博。这就是未来的趋势——让每个人都拥有自己的数字分身。

如果你对数字永生、意识上传感兴趣，欢迎关注我，一起探索。

©️Everlasting AI`;

async function post() {
  console.log('启动浏览器...');

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

  // 输入内容
  console.log('输入内容...');
  await page.fill('textarea', CONTENT);
  console.log('已填写内容');

  await page.waitForTimeout(1000);

  // 点击发送
  console.log('点击发送...');
  const buttons = await page.$$('a, button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && (text.includes('发布') || text.includes('发送'))) {
      console.log('找到按钮:', text.trim());
      await btn.click();
      break;
    }
  }

  await page.waitForTimeout(3000);
  console.log('完成！');

  await browser.close();
}

post().catch(console.error);
