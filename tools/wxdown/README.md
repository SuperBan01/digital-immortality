# wxdown 下载说明

## 方法一：手动下载（推荐）

### 1. 下载 wxdown

访问以下链接下载 macOS 版本：

**Apple Silicon (M1/M2/M3/M4)**：
https://github.com/systemmin/wxdown/releases/download/v1.1.2/wxdown_1.1.2_macOS_arm64

**Intel Mac**：
https://github.com/systemmin/wxdown/releases/download/v1.1.2/wxdown_1.1.2_macOS_x64

### 2. 安装

```bash
# 将下载的文件移动到工具目录
mv ~/Downloads/wxdown_1.1.2_macOS_arm64 ~/Desktop/DigitalImmortality/tools/wxdown/wxdown

# 添加执行权限
chmod +x ~/Desktop/DigitalImmortality/tools/wxdown/wxdown
```

### 3. 运行

```bash
cd ~/Desktop/DigitalImmortality/tools/wxdown
./wxdown
```

然后访问 http://localhost:81

---

## 方法二：Docker（如果手动下载失败）

```bash
# 创建数据目录
mkdir -p ~/Desktop/DigitalImmortality/tools/wxdown/data

# 启动 Docker 容器
docker run -p 81:81 --name wxdown \
  -v ~/Desktop/DigitalImmortality/tools/wxdown/data:/wx/data \
  -d registry.cn-hangzhou.aliyuncs.com/wxdown/wxd:latest

# 访问 http://localhost:81
```

---

## 使用步骤

1. 启动 wxdown
2. 访问 http://localhost:81
3. 扫码登录微信
4. 搜索公众号"刘骁奔"
5. 抓取所有文章
6. 导出为 Markdown
7. 将导出的文件复制到 `../../data/wechat/` 目录
