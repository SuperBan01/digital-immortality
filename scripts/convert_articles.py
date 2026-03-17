#!/usr/bin/env python3
"""
微信公众号文章 HTML 转 Markdown 工具

将 article/html 目录下的 HTML 文章转换为 Markdown 格式。
"""

import os
import re
from pathlib import Path
from html import unescape

# 配置
PROJECT_ROOT = Path(__file__).parent.parent
HTML_DIR = PROJECT_ROOT / "article" / "html"
OUTPUT_DIR = PROJECT_ROOT / "data" / "wechat"

def clean_html_tags(html):
    """清理 HTML 标签，提取纯文本"""
    # 移除 script 和 style 标签
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # 处理 p 和 section 标签，提取文本
    text_parts = []

    # 提取带有样式的文本
    strong_pattern = r'<strong[^>]*>(.*?)</strong>'
    em_pattern = r'<em[^>]*>(.*?)</em>'
    span_pattern = r'<span[^>]*>(.*?)</span>'
    p_pattern = r'<p[^>]*>(.*?)</p>'
    section_pattern = r'<section[^>]*>(.*?)</section>'

    # 提取所有文本内容
    content = html
    # 移除 HTML 注释
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    # 移除 mp-style-type
    content = re.sub(r'<mp-style-type[^>]*>.*?</mp-style-type>', '', content)
    # 移除 jump_wx_qrcode_desc
    content = re.sub(r'<p class="jump_wx_qrcode_desc[^>]*>.*?</p>', '', content)

    # 提取纯文本，保留换行
    content = re.sub(r'<(?:p|section)[^>]*>', '\n\n', content)
    content = re.sub(r'</(?:p|section)>', '', content)
    content = re.sub(r'<br\s*/?>', '\n', content)

    # 清理剩余标签
    content = re.sub(r'<[^>]+>', '', content)

    # 解码 HTML 实体
    content = unescape(content)

    # 清理空白
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = content.strip()

    return content

def extract_title_from_filename(filename):
    """从文件名提取标题"""
    name = Path(filename).stem
    # 移除日期前缀
    name = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', name)
    return name

def convert_html_to_md(html_file):
    """转换单个 HTML 文件为 Markdown"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # 提取标题
        title = extract_title_from_filename(html_file.name)

        # 清理 HTML
        content = clean_html_tags(html_content)

        # 构建 Markdown
        md_content = f"# {title}\n\n"
        md_content += content

        return md_content

    except Exception as e:
        print(f"  错误: {e}")
        return None

def main():
    """主函数"""
    print("="*50)
    print("HTML 转 Markdown 转换器")
    print("="*50)

    # 创建输出目录
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 获取所有 HTML 文件
    html_files = list(HTML_DIR.glob("*.html"))

    if not html_files:
        print(f"\n错误：未找到 HTML 文件")
        print(f"请确认文章保存在: {HTML_DIR}")
        return

    print(f"\n找到 {len(html_files)} 个 HTML 文件")

    converted = 0
    for html_file in sorted(html_files):
        # 生成输出文件名
        output_file = OUTPUT_DIR / f"{html_file.stem}.md"

        # 检查是否已存在
        if output_file.exists():
            print(f"  跳过: {html_file.stem[:40]}... (已存在)")
            continue

        # 转换
        md_content = convert_html_to_md(html_file)

        if md_content:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(md_content)
            converted += 1
            print(f"  转换: {html_file.stem[:50]}...")

    print(f"\n完成！转换了 {converted} 篇文章")
    print(f"输出目录: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
