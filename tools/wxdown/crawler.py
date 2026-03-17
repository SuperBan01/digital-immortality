#!/usr/bin/env python3
"""
公众号文章批量爬取脚本

使用方法:
1. 先通过 wxdown 手动扫码登录微信
2. 获取公众号的 biz 和 mid 参数
3. 运行此脚本爬取文章

示例:
    python crawler.py --biz ABCD123456789 --mid 1234567890123456789
"""

import requests
import argparse
import json
import time
import sys
from pathlib import Path

# 输出目录
OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "wechat"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def get_article_list(biz, mid, cookie=None):
    """获取公众号文章列表"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mp.weixin.qq.com/',
    }

    if cookie:
        headers['Cookie'] = cookie

    url = f"https://mp.weixin.qq.com/cgi-bin/appmsg"
    params = {
        'action': 'list_ex',
        'biz': biz,
        'mid': mid,
        'count': 10,
        'type': 0,
        'offset': 0,
    }

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        data = resp.json()

        if data.get('app_msg_list'):
            return data['app_msg_list']
        else:
            print(f"响应: {data}")
            return []

    except Exception as e:
        print(f"获取失败: {e}")
        return []

def download_article(article_url, cookie=None):
    """下载单篇文章"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    if cookie:
        headers['Cookie'] = cookie

    try:
        resp = requests.get(article_url, headers=headers, timeout=30)
        return resp.text
    except Exception as e:
        print(f"下载失败: {e}")
        return None

def save_articles(articles, biz):
    """保存文章到文件"""
    saved = 0

    for article in articles:
        title = article.get('title', 'untitled')
        # 清理文件名
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()[:50]

        # 检查是否已存在
        filename = OUTPUT_DIR / f"{safe_title}.md"
        if filename.exists():
            print(f"跳过 (已存在): {title}")
            continue

        # 获取文章链接
        link = article.get('link', '')
        if not link:
            continue

        print(f"保存: {title}")

        # 保存文章元数据
        content = f"""# {title}

来源: {link}
作者: {article.get('author', '')}
发布时间: {article.get('create_time', '')}

---

{link}
"""

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

        saved += 1
        time.sleep(0.5)  # 避免请求过快

    return saved

def main():
    parser = argparse.ArgumentParser(description='公众号文章爬取工具')
    parser.add_argument('--biz', type=str, help='公众号 biz 参数')
    parser.add_argument('--mid', type=str, help='公众号 mid 参数')
    parser.add_argument('--cookie', type=str, help='微信 Cookie (可选)')
    parser.add_argument('--url', type=str, help='单个文章链接')

    args = parser.parse_args()

    print("="*50)
    print("公众号文章爬取工具")
    print("="*50)

    if args.url:
        # 下载单个文章
        print(f"下载文章: {args.url}")
        content = download_article(args.url, args.cookie)
        if content:
            print(f"内容长度: {len(content)} 字符")
    elif args.biz and args.mid:
        # 批量获取文章
        print(f"获取公众号文章列表...")
        articles = get_article_list(args.biz, args.mid, args.cookie)

        if articles:
            print(f"找到 {len(articles)} 篇文章")
            saved = save_articles(articles, args.biz)
            print(f"保存了 {saved} 篇文章到 {OUTPUT_DIR}")
        else:
            print("未找到文章，可能需要登录微信")
            print("\n请通过 wxdown 浏览器界面手动操作:")
            print("1. 登录微信")
            print("2. 搜索公众号'刘骁奔'")
            print("3. 抓取文章")
    else:
        print("""
用法:

1. 爬取单个文章:
   python crawler.py --url "https://mp.weixin.qq.com/s/..."

2. 批量爬取公众号 (需要 Cookie):
   python crawler.py --biz "biz参数" --mid "mid参数" --cookie "你的cookie"

获取方法:
- 在 wxdown 浏览器中打开公众号页面
- 查看网络请求中的 biz 和 mid 参数
- 从请求头中获取 Cookie
""")

if __name__ == "__main__":
    main()
