# Weibo Agent

> 微博自动化发布工具 - 基于 Playwright

## 快速开始

### 1. 安装依赖

```bash
cd ~/Desktop/DigitalImmortality/tools/weibo-agent
npm install
npx playwright install chromium
```

### 2. 登录微博

```bash
npx tsx weibo-login.ts
```

浏览器会自动打开，请在 30 秒内完成登录。Cookies 会自动保存到 `~/.config/nanoclaw/weibo-cookies.json`。

### 3. 发布微博

```bash
# 手动发布 - 修改脚本中的 CONTENT
npx tsx weibo-post-v2.ts

# 定时自动发布（根据 soulmdforweibo.md 配置）
npx tsx weibo-auto-post.ts --schedule
```

## 脚本说明

| 脚本 | 功能 |
|------|------|
| `weibo-login.ts` | 登录并保存 cookies |
| `weibo-post-v2.ts` | 手动发布微博 |
| `weibo-auto-post.ts` | 自动生成内容并定时发布 |
| `weibo-simple-post.ts` | 简易版，只打开浏览器 |
| `weibo-post-paradigm.ts` | 意识上传第一范式主题发布 |

## 配置

编辑 `~/Desktop/DigitalImmortality/soul/soulmdforweibo.md` 配置你的：

- 发布计划（每天几条、几点发布）
- 核心话题
- 发言风格

```yaml
schedule:
  enabled: true
  posts_per_day: 3
  times:
    - 8:00   # 早间帖
    - 12:00  # 午间帖
    - 20:00  # 晚间帖

topics:
  - Web4 与去中心化
  - 意识上传
  - 数字永生

style:
  tone: "真诚直接，哲学思辨，科技乐观主义"
  length: "短中长结合"
```

## 文件结构

```
weibo-agent/
├── weibo-login.ts         # 登录脚本
├── weibo-post-v2.ts       # 手动发布脚本
├── weibo-auto-post.ts     # 自动发布脚本
├── weibo-simple-post.ts   # 简易版
├── weibo-post-paradigm.ts # 主题发布
├── package.json
└── README.md
```

## Cookies

登录后 cookies 保存在：`~/.config/nanoclaw/weibo-cookies.json`

## 问题排查

### 登录失效

重新运行 `npx tsx weibo-login.ts`

### 发布失败

确保微博已登录，cookies 未过期

### 浏览器被拦截

尝试使用 headless 模式或将浏览器添加到白名单
