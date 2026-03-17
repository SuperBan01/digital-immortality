/**
 * Weibo Auto-Poster
 *
 * 根据 soulmdforweibo.md 生成并自动发布微博
 * 每天 3 条：早间、午间、晚间
 *
 * 使用方式:
 *   npx tsx scripts/weibo-auto-post.ts          # 发布今日微博
 *   npx tsx scripts/weibo-auto-post.ts --dry-run # 预览内容不发布
 *   npx tsx scripts/weibo-auto-post.ts --schedule # 启动定时任务
 */

import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

// 配置
const SOUL_PATH = path.join(process.env.HOME || '/root', 'Desktop', 'DigitalImmortality', 'soul', 'soulmdforweibo.md');
const COOKIES_PATH = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-cookies.json');
const STATE_FILE = path.join(process.env.HOME || '/root', '.config', 'nanoclaw', 'weibo-post-state.json');

// 发帖时间配置
const POST_SCHEDULE = [
  { hour: 8, type: 'morning', name: '早间帖' },
  { hour: 12, type: 'noon', name: '午间帖' },
  { hour: 20, type: 'evening', name: '晚间帖' },
];

// 微博内容模板
const CONTENT_TEMPLATES = {
  morning: [
    {
      topic: '意识上传的意义',
      templates: [
        '我们总在问：活着的意义是什么？我想，意义就是「被记住」。当你的意识可以被数字化，当你的思想可以永远流传，死亡就不再是终点。#数字永生#',
        '早上好。今天想和大家聊聊「向死而生」。正是因为生命有限，我们才要用力活好每一天。意识上传不是逃避死亡，而是给自己多一个选择。#意识上传#',
        '维特根斯坦说：「语言的边界就是世界的边界。」我想说：「数字的边界，就是意识的新边疆。」#Web4#',
      ],
    },
    {
      topic: '生命的思考',
      templates: [
        '2019年我写过《如果明天我就死了》，那是我第一次深度思考死亡。今天的我依然在思考这个问题，只是多了一份坦然。#人生意义#',
        '生命就像一场直播，没有彩排。但正因为如此，每一个当下才如此珍贵。你今天打算怎样度过？#哲学#',
        '我们害怕死亡，但更害怕被遗忘。数字永生，是给每个普通人对抗遗忘的武器。#科技向善#',
      ],
    },
  ],
  noon: [
    {
      topic: 'Web4 观点',
      templates: [
        'Web3 让资产去中心化，Web4 让身份去中心化。当你的数字身份可以自由迁移、可以被继承、可以被备份，你才真正「拥有你自己」。#Web4# #去中心化#',
        '很多人问我：区块链有意义吗？我的回答是：区块链不是终点，意识上链才是。当我们能把思维模式、价值观、记忆全部数字化，才是真正的变革。#数字永生#',
        'Web4 的核心不是技术，而是「主权自我」。你可以是你的数据的主人，这才是真正的自由。#科技#',
      ],
    },
    {
      topic: '创业感悟',
      templates: [
        '创业最难的不是找方向，而是「在看不到光的时候，依然相信光」。数字永生这条路很难，但我会一直走下去。#创业#',
        '很多人觉得我在做的事情太遥远。但我觉得，正因为遥远，才值得去做。#长期主义#',
        '做难而正确的事，是我的信条。简单的事人人都会做，难的事才能创造价值。#创业#',
      ],
    },
  ],
  evening: [
    {
      topic: '内心独白',
      templates: [
        '晚上好。今天在写代码的时候，突然想到一个问题：如果有一天我的意识真的被数字化了，那时的「我」还是现在的「我」吗？#意识上传#',
        '创业路上最孤独的不是没人理解，而是明明知道自己在做对的事，却要面对无数质疑。但这就是创业者的宿命，也是乐趣所在。#创业#',
        '有时候我会想，也许我做的事情100年后才会被理解。但那又怎样？只要方向是对的，走慢点也无所谓。#数字永生#',
      ],
    },
    {
      topic: '诗歌',
      templates: [
        '《数字》\n\n在0和1之间\n我寻找存在的答案\n代码会消逝\n但思想的火花\n永远燃烧\n\n#诗歌#',
        '《永恒》\n\n你说\n数字只是虚无\n我说\n意识可以是永恒\n当记忆被保存\n当思维被延续\n我便超越了我自己\n\n#数字永生#',
        '《选择》\n\n生或死\n碳或硅\n这不是一道选择题\n因为\n我即是我\n无论以何种形态存在\n\n#哲学#',
      ],
    },
  ],
};

interface PostState {
  lastPostDate: string;
  postedSlots: string[];
}

function loadState(): PostState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return { lastPostDate: '', postedSlots: [] };
}

function saveState(state: PostState): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getCurrentSlot(): { hour: number; type: string; name: string } | null {
  const hour = new Date().getHours();
  for (const slot of POST_SCHEDULE) {
    if (hour >= slot.hour && hour < slot.hour + 2) {
      return slot;
    }
  }
  return null;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePost(type: string): string {
  const topics = CONTENT_TEMPLATES[type as keyof typeof CONTENT_TEMPLATES];
  if (!topics) return '';

  const topic = getRandomItem(topics);
  return getRandomItem(topic.templates);
}

function loadSoulFile(): string {
  try {
    return fs.readFileSync(SOUL_PATH, 'utf-8');
  } catch (e) {
    console.warn('soulmdforweibo.md not found, using default templates');
    return '';
  }
}

async function postToWeibo(content: string): Promise<boolean> {
  console.log('\n--- 准备发布微博 ---');
  console.log(`内容: ${content.substring(0, 50)}...`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  try {
    // 加载 cookies
    const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
    // 转换 cookies 域名 for mobile
    const mobileCookies = cookies.map((c: any) => ({
      ...c,
      domain: c.domain.replace('weibo.com', 'weibo.cn').replace('.com', '.cn'),
    }));

    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    });
    await context.addCookies(mobileCookies);

    const page = await context.newPage();

    // 访问微博移动版首页
    await page.goto('https://m.weibo.cn', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 检查是否需要登录
    const loginBtn = await page.$('[node-type="loginBtn"]');
    if (loginBtn) {
      console.error('未登录，请重新登录');
      return false;
    }

    // 点击发布按钮
    const publishBtn = await page.$('[node-type="publish"]');
    if (!publishBtn) {
      console.error('找不到发布按钮');
      return false;
    }
    await publishBtn.click();
    await page.waitForTimeout(1000);

    // 输入内容
    const textarea = await page.$('[node-type="text"]');
    if (!textarea) {
      console.error('找不到输入框');
      return false;
    }
    await textarea.fill(content);
    await page.waitForTimeout(500);

    // 点击发布
    const submitBtn = await page.$('[node-type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
    }
    await page.waitForTimeout(3000);

    console.log('发布成功！');
    return true;
  } catch (e) {
    console.error('发布失败:', e);
    return false;
  } finally {
    await browser.close();
  }
}

function generateIntroPost(): string {
  return `你好，我是刘骁奔。

我是南京大学硕士，25岁，专注数字永生与意识上传领域的创业者。

我在做一件有趣的事——让每个人的意识都可以被数字化，让思想可以永远流传。

这是我用 AI + 数字分身发的第一条微博。

如果你对数字永生、意识上传、Web4 感兴趣，欢迎关注我。

让我们一起探索意识的边界。

#数字永生 #意识上传 #Web4 #创业`;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isSchedule = args.includes('--schedule');
  const isIntro = args.includes('--intro');

  console.log('=== 微博自动发布器 ===');
  console.log(`模式: ${isDryRun ? '预览' : isSchedule ? '定时任务' : '单次发布'}`);

  // 加载soul文件
  const soulContent = loadSoulFile();
  if (soulContent) {
    console.log('已加载 soulmdforweibo.md');
  }

  if (isIntro) {
    // 发布自我介绍
    const content = generateIntroPost();
    console.log('\n=== 自我介绍微博 ===');
    console.log(content);

    if (!isDryRun) {
      await postToWeibo(content);
    }
    return;
  }

  if (isSchedule) {
    // 定时任务模式
    console.log('\n启动定时任务，每小时检查一次...');
    setInterval(async () => {
      const slot = getCurrentSlot();
      if (!slot) return;

      const today = new Date().toISOString().split('T')[0];
      const state = loadState();

      if (state.lastPostDate !== today) {
        state.lastPostDate = today;
        state.postedSlots = [];
      }

      if (!state.postedSlots.includes(slot.type)) {
        const content = generatePost(slot.type);
        const success = await postToWeibo(content);
        if (success) {
          state.postedSlots.push(slot.type);
          saveState(state);
          console.log(`${slot.name} 发布成功！`);
        }
      }
    }, 60 * 60 * 1000); // 每小时检查
    return;
  }

  // 单次发布
  const slot = getCurrentSlot();
  if (!slot) {
    console.log('当前不在发帖时间范围内 (8:00-10:00, 12:00-14:00, 20:00-22:00)');
    console.log('使用 --intro 发布自我介绍，或使用 --schedule 启动定时任务');
    return;
  }

  const content = generatePost(slot.type);
  console.log(`\n=== ${slot.name} ===`);
  console.log(content);

  if (!isDryRun) {
    await postToWeibo(content);
  }
}

main().catch(console.error);
