# 微信公众号文章抓取指南

> 本指南将帮助你使用 wxdown 在线服务抓取公众号文章并本地存储

---

## 方法一：wxdown 在线抓取（推荐）

### 步骤 1：访问 wxdown 在线服务

打开浏览器访问：https://www.wxdown.online

### 步骤 2：扫码登录

1. 使用微信扫描页面上的二维码
2. 在手机上确认登录

### 步骤 3：抓取公众号文章

1. 在搜索框输入公众号名称（如"刘骁奔"）
2. 找到公众号后，点击进入
3. 点击"抓取全部"或"采集"按钮
4. 等待抓取完成

### 步骤 4：导出文章

抓取完成后，选择导出格式：
- **Excel**：导出文章链接列表（可用于二次抓取）
- **HTML**：导出完整文章内容
- **Markdown**（如有）：导出 Markdown 格式

### 步骤 5：本地存储

将导出的文件移动到项目目录：

```bash
# 假设导出在 ~/Downloads 目录
mv ~/Downloads/微信公众号文章.xlsx ~/Desktop/DigitalImmortality/
mv ~/Downloads/微信公众号文章.json ~/Desktop/DigitalImmortality/
mv -r ~/Downloads/article ~/Desktop/DigitalImmortality/
```

---

## 方法二：Excel 链接 + 本地抓取（备选）

如果在线抓取失败，可以使用 Excel 导出的链接列表，通过本地 wxdown 批量抓取。

### 步骤 1：在线导出 Excel

1. 在 wxdown.online 抓取公众号
2. 导出为 Excel 格式（包含文章链接）

### 步骤 2：使用本地 wxdown 抓取

```bash
# 启动本地 wxdown
cd ~/Desktop/DigitalImmortality/tools/wxdown
./wxdown
```

然后在浏览器中：
1. 访问 http://127.0.0.1:81
2. 扫码登录微信
3. 从 Excel 中复制文章链接
4. 逐个粘贴到 wxdown 进行抓取

---

## 数据目录结构

抓取完成后，你的 DigitalImmortality 目录应该包含：

```
DigitalImmortality/
├── article/
│   └── html/              # HTML 格式的文章
│       ├── 2019-03-11-如果明天我就死了.html
│       ├── 2024-04-10-骁奔的创业日记.html
│       └── ...
├── 微信公众号文章.json      # JSON 格式的文章列表
├── 微信公众号文章.xlsx     # Excel 格式的文章链接
├── data/
│   └── wechat/           # 将转换后的 Markdown 放这里
└── soul/
    └── soul.md           # 你的灵魂文档
```

---

## 下一步

1. **转换格式**：运行脚本将 HTML 转换为 Markdown
2. **生成 soul.md**：根据文章内容生成你的灵魂文档

运行转换脚本：

```bash
cd ~/Desktop/DigitalImmortality
python3 scripts/convert_articles.py
```
