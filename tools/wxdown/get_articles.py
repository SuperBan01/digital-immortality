#!/usr/bin/env python3
"""
WeChat Article Crawler for Digital Immortality

这个脚本用于抓取微信公众号文章链接列表。
需要在 wxdown 运行时使用。
"""

import requests
import json
import sys
from urllib.parse import urljoin

# 配置
WXDOWN_HOST = "http://127.0.0.1:81"

def get_article_links():
    """获取已采集的文章列表"""
    # 尝试从 wxdown API 获取
    endpoints = [
        f"{WXDOWN_HOST}/api/list",
        f"{WXDOWN_HOST}/api/articles",
        f"{WXDOWN_HOST}/api/medias",
    ]

    for endpoint in endpoints:
        try:
            resp = requests.get(endpoint, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                print(f"找到 API: {endpoint}")
                print(json.dumps(data, indent=2, ensure_ascii=False)[:500])
        except Exception as e:
            print(f"API {endpoint} 不可用: {e}")

    print("\n" + "="*50)
    print("wxdown 需要通过浏览器手动操作")
    print("="*50)
    print("""
请按以下步骤操作：

1. 打开浏览器访问：http://127.0.0.1:81
2. 扫码登录微信
3. 搜索公众号"刘骁奔"
4. 抓取所有文章
5. 导出为 Markdown

导出后，文章会保存在 wxdown 的 data 目录中。
""")

def search_sogou(keyword):
    """通过搜狗搜索公众号"""
    print(f"正在搜索公众号: {keyword}")

    url = f"https://weixin.sogou.com/weixin?type=1&query={keyword}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"搜狗搜索状态: {resp.status_code}")

        # 解析搜索结果
        import re
        # 查找公众号文章链接
        links = re.findall(r'href=["\']([^"\']*mp\.weixin\.qq\.com[^"\']*)["\']', resp.text)
        print(f"找到 {len(links)} 个链接")

        for link in links[:5]:
            print(f"  - {link[:100]}...")

    except Exception as e:
        print(f"搜索失败: {e}")

def main():
    """主函数"""
    print("="*50)
    print("微信公众号文章链接获取工具")
    print("="*50)

    if len(sys.argv) > 1:
        if sys.argv[1] == "--search" and len(sys.argv) > 2:
            search_sogou(sys.argv[2])
        else:
            print("用法:")
            print("  python get_articles.py          # 查看 wxdown 状态")
            print("  python get_articles.py --search 刘骁奔  # 搜索公众号")
    else:
        get_article_links()

if __name__ == "__main__":
    main()
