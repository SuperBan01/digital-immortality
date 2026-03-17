# 手动克隆 NanoClaw

由于网络问题，请手动执行以下步骤：

## 步骤 1：克隆仓库

打开终端，运行：

```bash
git clone --depth 1 https://github.com/qwibitai/nanoclaw.git ~/nanoclaw
```

## 步骤 2：配置 API Key

```bash
cd ~/nanoclaw
cp .env.example .env
```

然后编辑 `.env` 文件，添加你的 API Key：

```bash
nano .env
```

添加这一行：
```
ANTHROPIC_API_KEY=你的APIKey
```

获取 API Key：https://console.anthropic.com/

## 步骤 3：链接 soul.md

```bash
mkdir -p ~/nanoclaw/groups/main
ln -sf ~/Desktop/DigitalImmortality/soul/soul.md ~/nanoclaw/groups/main/CLAUDE.md
```

## 步骤 4：运行 Setup

```bash
cd ~/nanoclaw
claude
```

在 Claude Code 中输入：
```
/setup
```

完成后告诉我！
