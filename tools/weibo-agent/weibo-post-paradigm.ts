/**
 * Weibo Poster - 意识上传第一范式
 */
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');

const CONTENT = `「意识上传第一范式」：用10MB数据存储一个人的"意识"

这是我在研究数字永生过程中最震撼的发现：

一个人一生的语言表达，加密后不超过1.5GB。
而通过"人生上下文"数据结构（Thoughtcell + Mindcopy），
可以压缩到10MB以内。

这就是意识上传第一范式的核心：
不是复制你的全部记忆，
而是提取你思维模式、价值观、决策方式的核心要素。

你的数字分身，不是你的副本，而是你的"意识压缩包"。

#数字永生 #意识上传 #Mindcopy
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
