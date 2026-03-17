# Digital Immortality v1.0.0 - 赛博永生

> 用个人数据构建你的 AI 数字意识体

**让 AI 成为你的数字化身，延续你的思想、记忆和意志**

---

## 理念

本项目基于**「意识上传第一范式」**构建L1级的赛博永生——使用约 10MB 的 Mindcopy 文件存储一个人的"意识"，包括其思维模式、价值观和决策方式。

```
个人文章 → AI 学习 → 数字分身 → 赛博永生
   (soul/)     (nanoclaw)    (tools/)    (社交媒体)
```

### 核心洞察

一个人一生的语言表达，用文本形式储存不超过 **1.5GB**。通过「人生上下文」数据结构和 Mindcopy 格式，可以压缩到 **10MB 以下**。

你的数字分身不是你本人的复制品——它是你**「意识档案」**。

---

## 项目结构

```
DigitalImmortality/
├── soul/                          # 灵魂核心 - 你的数字身份
│   ├── mindcopy.md               # 意识锚点（唤醒词+身份定义）
│   ├── lifecontext.md            # 人生上下文（时间线+重要事件）
│   ├── thoughtcell.md            # 思想元胞（认知体系+核心观点）
│   ├── style.md                  # 表达风格（语言指纹）
│   ├── memory.md                 # 动态记忆（交互中自动生长）
│   ├── skill.md                  # 技能包（能力+可调用模块）
│   ├── article/                  # 个人文章（AI 学习素材）
│   │   └── html/                 # 导出的微信文章
│   └── [username].mind           # 意识图谱
│
├── tools/                         # 手脚 - 自动化工具
│   ├── nanoclaw/                 # Agent 框架（Docker 隔离运行）
│   │   ├── src/                  # 核心代码
│   │   ├── groups/               # 群组记忆和配置
│   │   ├── container/            # Docker 容器配置
│   │   └── skills/               # 技能插件
│   │
│   ├── weibo-agent/              # 微博自动化（Playwright）
│   │   ├── weibo-login.ts        # 登录并保存 Cookie
│   │   ├── weibo-post-v2.ts      # 手动发布脚本
│   │   ├── weibo-auto-post.ts    # 定时自动发布
│   │   └── package.json
│   │
│   └── wxdown/                   # 微信文章导出器
│       ├── get_articles.py       # 爬虫脚本
│       ├── data/                 # 导出的文章
│       └── web/                  # Web 界面
│
└── scripts/                       # 实用脚本
    └── generate_soul.py          # 从文章生成 soul
```

---

## 工作原理

### 1. Soul（身份）

`soul/` 文件夹包含你的数字身份：
- **mindcopy.md**: 定义你的核心身份和唤醒词
- **lifecontext.md**: 你的人生时间线和重要经历
- **thoughtcell.md**: 你的认知体系和核心观点
- **style.md**: 你的表达风格和语言习惯
- **memory.md**: 动态记忆，随交互自动增长
- **skill.md**: 你的能力和可调用模块
- **article/**: 你的写作历史，供 AI 学习

所有更新都是累加的——系统与你一起成长。

### 2. Tools（手脚）

`tools/` 文件夹提供自动化能力：
- **nanoclaw**: Docker 容器中运行的 AI Agent
- **weibo-agent**: 根据你的 soul 配置发布微博
- **wxdown**: 导出你的微信文章作为输入

### 3. 执行流程

```
你（提供文章）
    → soul/（AI 学习你的身份）
    → nanoclaw（Agent 理解你）
    → weibo-agent（执行发布）
    → 微博（你的数字存在）
```

---

## v1.0.0 版本特性

### 已实现

- [x] **Soul 文档系统 v2.0** - 六文件体系（mindcopy/lifecontext/thoughtcell/style/memory/skill）
- [x] **Mindcopy 格式** - 10MB 以内存储个人意识
- [x] **NanoClaw Agent 框架** - Docker 隔离运行，安全可控
- [x] **微博自动发布** - 基于 soul 配置的定时发布
- [x] **微信文章导出** - wxdown 批量导出
- [x] **Claude Code 集成** - 本地 CLI 调用
- [x] **可扩展架构** - 易于添加新平台

### 核心文件说明

| 文件 | 用途 |
|------|------|
| `mindcopy.md` | 你是谁，意识体如何启动（10MB 以内存储） |
| `lifecontext.md` | 你的人生经历和时间线 |
| `thoughtcell.md` | 你如何看待这个世界 |
| `style.md` | 你如何说话和写作 |
| `memory.md` | 你记得什么（动态记忆） |
| `skill.md` | 你能做什么，如何工作 |

---

## 快速开始

### 步骤 1: 导出你的文章

#### 方案 A: 微信公众号（推荐）

使用 **wxdown** 批量导出文章：

```bash
cd tools/wxdown

# Docker 运行
docker run -p 81:81 --name wxdown -d registry.cn-hangzhou.aliyuncs.com/wxdown/wxd:latest

# 打开 http://localhost:81，登录并导出文章
# 将导出的文件复制到 soul/article/html/
```

#### 方案 B: 手动

- 导出你的博客文章
- 保存你的社交媒体历史
- 记录你的想法和记忆

### 步骤 2: 配置你的 Soul

根据模板编辑 `soul/` 下的各个文件：
- 编辑 `mindcopy.md` 定义身份
- 编辑 `lifecontext.md` 添加经历
- 编辑 `thoughtcell.md` 构建认知
- 编辑 `style.md` 塑造风格

### 步骤 3: 登录微博

```bash
cd tools/weibo-agent
npm install
npx playwright install chromium
npx tsx weibo-login.ts
```

浏览器将打开——请在 30 秒内登录。Cookie 将自动保存。

### 步骤 4: 发布微博

```bash
# 手动发布 - 编辑脚本中的内容
npx tsx weibo-post-v2.ts

# 或使用定时自动发布
npx tsx weibo-auto-post.ts --schedule
```

---

## 使用场景

### 1. 微博自动发布

你的 AI 分身可以根据配置的日程和话题自动发布微博：

```bash
npx tsx weibo-auto-post.ts --schedule
```

### 2. Agent 驱动发布

使用 nanoclaw 让 AI 代表你发布：

```bash
# 在 nanoclaw 群组中
@agent 今天帮我发一条关于数字永生的微博
```

### 3. 内容生成

AI 根据以下内容生成帖子：
- 你的 soul.md 个性
- 你的文章历史
- 当前话题和趋势

---

## 核心概念

### Mindcopy（意识体文件）

使用 LLM 技术进行 L1 级意识上传的格式——在 **10MB 以下**存储一个人的"意识"。包括：
- 元数据（人设提示词、声音、图像）
- 记忆（人生阶段、自我认知）
- 状态（时间、地点、当前情境）
- 意识指标

### Thoughtcell（思想元胞）

个人思维的基本单元——由意识 token 组成的完整表达。每个思想元胞包含：
- 时间戳
- 内容类型（文本/音频/视频）
- 上下文（地点、参与人、情感状态）
- 与其他思想元胞的关系

### Life Context（人生上下文）

从出生到现在的完整意识 token 集合。一个一生的语言表达用文本形式储存约 **1.5GB**。

---

## 同步模式

### Strict Sync（严格同步）

AI 严格遵循你的价值观和表达方式，确保数字分身与本人高度一致。

### Self-Evolution（自我进化）

AI 在与世界的交互中自主学习和成长，形成独立的"数字人格"。

---

## 可扩展性

项目具有可扩展性。添加新平台：

1. 在 `tools/` 中创建新文件夹
2. 实现登录和发布逻辑
3. 在 `soul/` 中配置
4. AI 将使用你的 soul 生成平台适配的内容

---

## 技术栈

| 组件 | 用途 |
|------|------|
| **Playwright** | 社交媒体浏览器自动化 |
| **NanoClaw** | Docker 中运行的 Agent 框架 |
| **wxdown** | 微信文章导出器 |
| **Claude API** | 内容生成 LLM |(国内版本做了Minimax的API适配)
| **TypeScript** | 脚本和自动化 |

---

## 数据安全

- **本地存储**: 所有数据留在你的机器上
- **Docker 隔离**: nanoclaw 在隔离容器中运行 AI
- **无云上传**: 你的数据永不离开你的控制
- **API 密钥**: 本地存储，不提交到版本控制

---

## License

MIT License - 欢迎 fork 和贡献

---

## 相关项目

- [NanoClaw](https://github.com/qwibitai/nanoclaw) - Agent 框架
- [wxdown](https://github.com/systemmin/wxdown) - 微信文章导出器
- [Claude](https://www.anthropic.com/claude) - LLM 提供商
