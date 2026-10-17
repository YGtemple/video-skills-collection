#!/usr/bin/env python3
"""
爆款搜索关键词生成器
根据题材生成多平台搜索关键词组合。
用法: python search_viral.py --theme 父爱 --platform douyin
"""

import argparse


KEYWORDS = {
    "父爱": {
        "douyin": [
            "抖音 AI短片 父爱 爆款",
            "抖音 AI故事 父亲 催泪",
            "抖音AI创作大赛 父亲",
            "何止三千遍 全部作品",
            "旧梦留声机 父亲",
            "AI短片 爸爸 看哭了",
            "AI剧情 父爱如山",
        ],
        "bilibili": [
            "AI短片 父爱 B站",
            "AIGC 亲情 故事",
            "AI剧情短片 父亲",
            "AI催泪短片 亲情",
        ],
        "general": [
            "抖音 AI亲情短片 爆款 2026",
            "旧梦留声机 风格分析",
            "何止三千遍 作品拆解",
            "AI短片 百万点赞 父亲",
        ],
    },
    "母爱": {
        "douyin": [
            "抖音 AI短片 母爱 爆款",
            "抖音 AI故事 妈妈 催泪",
            "AI短片 妈妈 看哭了",
            "母亲节 AI短片 爆款",
        ],
        "bilibili": [
            "AI短片 母爱 B站",
            "AIGC 亲情 母亲",
        ],
        "general": [
            "抖音 AI亲情短片 母爱 爆款",
            "AI短片 妈妈 百万点赞",
        ],
    },
    "奶奶": {
        "douyin": [
            "抖音 AI短片 奶奶 爆款",
            "拾光者 奶奶 作品",
            "蒙太神奇 油条两半",
            "AI短片 奶奶 看哭了",
            "早餐奶奶 AI短片",
        ],
        "bilibili": [
            "AI短片 奶奶 B站",
            "AIGC 隔代亲",
        ],
        "general": [
            "抖音 AI亲情短片 奶奶 爆款",
            "AI短片 爷爷 奶奶 百万赞",
        ],
    },
    "打拐": {
        "douyin": [
            "抖音 AI短片 打拐 爆款",
            "旧梦留声机 宝贝回家",
            "AI短片 寻亲 催泪",
            "AI剧情 打拐 真实事件",
        ],
        "bilibili": [
            "AI短片 打拐 B站",
            "AIGC 寻亲故事",
        ],
        "general": [
            "抖音 AI短片 打拐 爆款 2026",
            "宝贝回家 AI短片 分析",
        ],
    },
    "怀旧": {
        "douyin": [
            "抖音 AI短片 童年 怀旧",
            "AI短片 80后 90后 回忆",
            "纸手机 AI短片",
            "AI故事 小时候 治愈",
        ],
        "bilibili": [
            "AI短片 怀旧 B站",
            "AIGC 童年回忆",
        ],
        "general": [
            "抖音 AI怀旧短片 爆款",
            "AI短片 童年 百万点赞",
        ],
    },
    "历史人物": {
        "douyin": [
            "编导李让 被贬 告别",
            "抖音 AI短片 历史人物",
            "AI故事 诗人 失意",
            "李白 杜甫 AI短片",
        ],
        "bilibili": [
            "AI短片 历史人物 B站",
            "AIGC 历史故事",
        ],
        "general": [
            "AI短片 历史人物 爆款",
            "编导李让 作品分析",
        ],
    },
}


def generate_keywords(theme: str, platform: str = "all") -> str:
    """生成搜索关键词"""

    if theme not in KEYWORDS:
        available = ', '.join(KEYWORDS.keys())
        return f"不支持的题材：{theme}\n支持的题材：{available}"

    kws = KEYWORDS[theme]

    lines = []
    lines.append(f"# 搜索关键词清单 - 题材：{theme}\n")

    if platform in ("all", "douyin") and "douyin" in kws:
        lines.append("## 抖音搜索关键词")
        for kw in kws["douyin"]:
            lines.append(f"- `{kw}`")
        lines.append("")

    if platform in ("all", "bilibili") and "bilibili" in kws:
        lines.append("## B站搜索关键词")
        for kw in kws["bilibili"]:
            lines.append(f"- `{kw}`")
        lines.append("")

    if platform in ("all", "general") and "general" in kws:
        lines.append("## 通用搜索引擎关键词")
        for kw in kws["general"]:
            lines.append(f"- `{kw}`")
        lines.append("")

    lines.append("## 搜索建议")
    lines.append("1. 先用通用搜索关键词找行业分析文章")
    lines.append("2. 找到头部创作者后，搜索其全部作品")
    lines.append("3. 从爆款视频顺藤摸瓜找同类创作者")
    lines.append("4. 每周定期搜索最新爆款，保持信息更新")

    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='生成爆款搜索关键词')
    parser.add_argument('--theme', required=True,
                        help='题材：父爱/母爱/奶奶/打拐/怀旧/历史人物')
    parser.add_argument('--platform', default='all',
                        choices=['all', 'douyin', 'bilibili', 'general'],
                        help='平台：all/douyin/bilibili/general')
    parser.add_argument('--output', default=None, help='输出文件路径（可选）')

    args = parser.parse_args()

    result = generate_keywords(args.theme, args.platform)

    if args.output:
        from pathlib import Path
        Path(args.output).write_text(result, encoding='utf-8')
        print(f"关键词清单已保存到: {args.output}")
    else:
        print(result)


if __name__ == "__main__":
    main()
