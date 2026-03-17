#!/usr/bin/env python3
"""
Digital Immortality - Soul Document Generator

这个脚本会收集你的所有文章，生成 soul.md 供 AI 学习。
"""

import os
from pathlib import Path

# 配置
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
SOUL_DIR = PROJECT_ROOT / "soul"
OUTPUT_FILE = SOUL_DIR / "soul.md"

def read_file(filepath):
    """读取文件内容"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return None

def collect_articles():
    """收集所有文章"""
    articles = []

    # 收集所有 markdown 文件
    for md_file in DATA_DIR.rglob("*.md"):
        # 跳过模板文件
        if "template" in md_file.name:
            continue

        content = read_file(md_file)
        if content:
            # 提取标题作为参考
            title = content.split('\n')[0].replace('#', '').strip()
            if not title:
                title = md_file.stem

            articles.append({
                "file": str(md_file.relative_to(PROJECT_ROOT)),
                "title": title,
                "content": content
            })

    return articles

def generate_soul():
    """生成 soul.md"""
    print("=" * 50)
    print("Digital Immortality - Soul Document Generator")
    print("=" * 50)

    articles = collect_articles()

    if not articles:
        print("\n错误：没有找到任何文章！")
        print(f"请先在 {DATA_DIR} 目录下添加你的文章")
        return

    print(f"\n找到 {len(articles)} 篇文章：")
    for a in articles:
        print(f"  - {a['title']}")

    # 读取模板
    template_path = SOUL_DIR / "soul_template.md"
    if not template_path.exists():
        print("\n错误：找不到 soul_template.md")
        print(f"请先编辑 {template_path}")
        return

    print(f"\n模板已就绪：{template_path}")
    print("\n下一步：")
    print(f"1. 编辑 {SOUL_DIR}/soul_template.md，填入你的信息")
    print(f"2. 将文件重命名为 soul.md")
    print(f"3. 在 NanoClaw 中配置 soul.md 作为记忆")

    print("\n收集到的文章列表：")
    for a in articles:
        print(f"  - {a['file']}")

if __name__ == "__main__":
    generate_soul()
