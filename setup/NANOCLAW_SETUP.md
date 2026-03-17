# Digital Immortality - NanoClaw 配置指南

## 当前状态

- [x] Node.js 20+ (v22.14.0)
- [x] Claude Code (2.0.19)
- [ ] Docker (需要安装)

---

## 第一步：安装 Docker

**下载 Docker Desktop（免费）**：
https://www.docker.com/products/docker-desktop/

安装步骤：
1. 下载 macOS 版本的 Docker Desktop
2. 双击安装
3. 启动 Docker Desktop
4. 等待状态栏显示 Docker 图标

---

## 第二步：克隆 NanoClaw

安装 Docker 后，运行：

```bash
# Fork 并克隆 NanoClaw
gh repo fork qwibitai/nanoclaw --clone

# 进入目录
cd nanoclaw
```

---

## 第三步：配置

### 1. 创建 .env 文件

```bash
cp .env.example .env
```

编辑 `.env`，添加你的 Anthropic API Key：

```bash
nano .env
```

添加：
```
ANTHROPIC_API_KEY=你的-api-key
```

获取 API Key：https://console.anthropic.com/

### 2. 链接你的 soul.md

```bash
mkdir -p groups/main
ln -sf ~/Desktop/DigitalImmortality/soul/soul.md groups/main/CLAUDE.md
```

---

## 第四步：运行 Setup

```bash
claude
```

在 Claude Code 中输入：
```
/setup
```

这会帮你完成所有配置。

---

## 第五步：使用

配置完成后，你可以这样与你的 AI 化身交互：

```
@YourAI 今天帮我发一条微博分享我对AI的看法
@YourAI 总结一下我最近的思考
@YourAI 记住今天会议的重要内容
```

---

## 配置脚本

你也可以使用项目中的自动配置脚本：

```bash
~/Desktop/DigitalImmortality/tools/nanoclaw/setup.sh
```

但需要先安装 Docker。
