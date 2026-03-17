# 微博自动化配置指南

## 概述

本文档介绍如何在 NanoClaw 中配置微博（Weibo）自动化。

## 两种发微博方式

### 方式一：Playwright 脚本（推荐）

直接使用 Playwright 控制浏览器发布微博，稳定可靠。

```bash
# 1. 登录并保存 cookies
cd ~/Desktop/DigitalImmortality/tools/nanoclaw
npx tsx scripts/weibo-login.ts

# 2. 发布微博
npx tsx scripts/weibo-post-v2.ts
```

### 方式二：NanoClaw 频道（开发中）

通过 AI Agent 调用 Weibo 频道发微博（目前 Agent 调用存在问题）。

## 快速开始

### 步骤 1：安装依赖

```bash
cd ~/Desktop/DigitalImmortality/tools/nanoclaw
npm install playwright
npx playwright install chromium
```

### 步骤 2：登录微博

```bash
npx tsx scripts/weibo-login.ts
```

- 浏览器会自动打开微博登录页面
- 请在 30 秒内完成登录
- Cookies 会自动保存到 `~/.config/nanoclaw/weibo-cookies.json`

### 步骤 3：发布微博

```bash
# 编辑内容
vim scripts/weibo-post-v2.ts  # 修改 CONTENT 变量

# 发布
npx tsx scripts/weibo-post-v2.ts
```

## 脚本说明

| 脚本 | 功能 |
|------|------|
| `scripts/weibo-login.ts` | 打开浏览器让你登录，然后保存 cookies |
| `scripts/weibo-post-v2.ts` | 加载 cookies，打开发布页面，自动填写内容并发送 |
| `scripts/weibo-auto-post.ts` | 自动生成内容并发布（定时任务模式） |
| `scripts/weibo-simple-post.ts` | 简易版脚本，只打开浏览器 |

## 微博内容配置

修改 `scripts/weibo-post-v2.ts` 中的 CONTENT 变量：

```typescript
const CONTENT = `你的微博内容...`;
```

或使用自动生成模式：

```bash
# 每天自动发 3 条（早、午、晚）
npx tsx scripts/weibo-auto-post.ts --schedule

# 发布自我介绍
npx tsx scripts/weibo-auto-post.ts --intro
```

## 常见问题

### Q: 微博登录失效

A: 重新运行登录脚本
```bash
npx tsx scripts/weibo-login.ts
```

### Q: 发布失败，提示"找不到输入框"

A: 可能页面加载较慢，增加等待时间：
```typescript
await page.waitForTimeout(5000); // 增加到 5 秒
```

### Q: 微博检测到自动化

A: 脚本使用了 `--headless: false` 非无头模式，并添加了反检测参数。如果仍然被检测，可以尝试使用用户已有的浏览器会话。

## Soul 文件

微博人格定义位于：
- `~/Desktop/DigitalImmortality/soul/soulmdforweibo.md`

这个文件定义了：
- 核心话题（Web4、意识上传、数字永生）
- 发文风格（早间帖、午间帖、晚间帖）
- 语气特点

## 技术原理

```
┌─────────────────┐     ┌──────────────────┐
│  Playwright     │     │  NanoClaw Agent  │
│  浏览器自动化    │     │  AI 决策         │
└────────┬────────┘     └────────┬─────────┘
         │                      │
         ▼                      ▼
    ┌─────────────────────────────────┐
    │  微博 Web / Mobile 页面         │
    │  - 登录验证                     │
    │  - 发布微博                      │
    │  - 获取时间线                   │
    └─────────────────────────────────┘
```

### 为什么用 Playwright 脚本？

1. **更稳定** - 直接控制浏览器，不依赖 Agent 决策
2. **更快速** - 跳过 AI 生成，直接执行
3. **更容易调试** - 可见的浏览器操作

### NanoClaw 频道的问题

Weibo 频道已经实现（`src/channels/weibo.ts`），但 Agent 没有正确调用它。Agent 只是回复"已发布"而没有真正调用 `postWeibo()` 方法。这是因为 Agent 的 Tool Use 配置问题，需要在 skill 文档中正确配置。

## 文件位置

| 文件 | 路径 |
|------|------|
| Weibo 频道 | `src/channels/weibo.ts` |
| 登录脚本 | `scripts/weibo-login.ts` |
| 发布脚本 | `scripts/weibo-post-v2.ts` |
| Cookies | `~/.config/nanoclaw/weibo-cookies.json` |
| Soul 文件 | `~/Desktop/DigitalImmortality/soul/soulmdforweibo.md` |

## 下一步

1. 修复 NanoClaw Agent 调用 Weibo 频道的问题
2. 添加定时任务自动发布
3. 添加图片上传支持
