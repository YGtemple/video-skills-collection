#!/usr/bin/env python3
"""
原创剧本生成器模板
基于爆款结构模板生成剧本骨架。
用法: python generate_script.py --theme 父爱 --duration 90 --object 工具箱
"""

import sys
import argparse


TEMPLATES = {
    "父爱": {
        "hook_options": [
            "我爸好像，越来越不会修东西了。",
            "我爸，好像一直活在过去。",
            "我爸那双手，曾经什么都能修。",
        ],
        "object_options": ["工具箱", "自行车", "一碗面", "旧手表", "修车摊"],
        "conflict_options": [
            "他连智能手机都不会用了",
            "他忘了今天是什么日子",
            "他迷路了，找不到回家的路",
        ],
        "twist_options": [
            "但他还记得你最爱吃的那道菜",
            "他偷偷把你弄坏的每样东西都留着",
            "他学用手机，就为了给你打个电话",
        ],
        "tagline_options": [
            "时间带走了父亲的记忆，但带不走他爱你的习惯。",
            "他变老的速度，比你长大的速度快多了。",
            "他修好了你的童年，却修不好自己的时光。",
        ],
    },
    "母爱": {
        "hook_options": [
            "我妈做的饭，全世界最好吃。",
            "我妈好像，从来不会累。",
            "我妈总说她不爱吃。",
        ],
        "object_options": ["围裙", "菜篮子", "毛衣", "针线盒", "热汤"],
        "conflict_options": [
            "她的手越来越粗糙了",
            "她开始忘事了",
            "她走路越来越慢了",
        ],
        "twist_options": [
            "她把最好的都留给了你",
            "她一辈子没吃过自己爱吃的",
            "她在你看不见的地方偷偷哭",
        ],
        "tagline_options": [
            "母亲一辈子都在说'我不爱吃'。",
            "她不是不累，她只是不敢累。",
            "全世界最无私的谎言，就是'我不爱吃'。",
        ],
    },
    "奶奶": {
        "hook_options": [
            "奶奶的菜篮子，永远是满的。",
            "奶奶总说：再吃点。",
            "我奶奶，七十岁了还在等我回家。",
        ],
        "object_options": ["菜篮子", "油条", "蒲扇", "老花镜", "小板凳"],
        "conflict_options": [
            "她的记性越来越差了",
            "她的背越来越驼了",
            "她走不动路了",
        ],
        "twist_options": [
            "她记得你爱吃的每一样东西",
            "她把你带回家的东西留到过期",
            "她每天都在路口等你",
        ],
        "tagline_options": [
            "有人尚在深渊，却拼命把另一个他推向光亮。",
            "奶奶的爱，都在菜篮子里。",
            "她等了你一辈子，你回来了几天？",
        ],
    },
    "爷爷": {
        "hook_options": [
            "我爷爷有一块怀表，从来不让人碰。",
            "爷爷总坐在摇椅上，看着门口。",
            "我爷爷，守了一个秘密几十年。",
        ],
        "object_options": ["怀表", "烟斗", "旧照片", "摇椅", "竹椅子"],
        "conflict_options": [
            "他的身体越来越差了",
            "他开始说胡话了",
            "他走不动了",
        ],
        "twist_options": [
            "怀表停在他等的那个人离开的时间",
            "他等的人，再也不会回来了",
            "他把所有东西都留给了你",
        ],
        "tagline_options": [
            "他守了一辈子的秘密，是爱。",
            "时间停在了他最舍不得的那一刻。",
        ],
    },
    "打拐": {
        "hook_options": [
            "我的记忆，好像停在了那一年。",
            "妈妈找了我二十年。",
            "这张寻人启事，贴了二十年。",
        ],
        "object_options": ["寻人启事", "旧照片", "毛绒玩具", "相机"],
        "conflict_options": [
            "她走遍了全国，找遍了所有车站",
            "她的头发白了，眼睛花了",
            "她被人骗了无数次",
        ],
        "twist_options": [
            "她终于找到了，在一个完全没想到的地方",
            "她的孩子，也在找她",
            "团圆的那一刻，她哭不出来了",
        ],
        "tagline_options": [
            "愿天下无拐，所念皆归。",
            "二十年的寻找，只为一句'妈妈，我回来了'。",
        ],
    },
}


def generate_script(theme: str, duration: int, object_item: str = None, style: str = None) -> str:
    """生成剧本骨架"""

    if theme not in TEMPLATES:
        available = ', '.join(TEMPLATES.keys())
        return f"不支持的题材：{theme}\n支持的题材：{available}"

    t = TEMPLATES[theme]
    obj = object_item or t["object_options"][0]

    lines = []
    lines.append(f"# 《[标题待定]》- {theme}题材短片脚本\n")
    lines.append(f"- 时长：{duration}秒")
    lines.append(f"- 核心物件：{obj}")
    lines.append(f"- 风格参考：{style or '旧梦留声机式温情写实'}\n")

    lines.append("## 分镜脚本\n")
    lines.append("| 镜号 | 时长 | 画面 | 台词/旁白 | 情绪 |")
    lines.append("|------|------|------|-----------|------|")

    # 钩子
    hook_duration = max(3, int(duration * 0.07))
    lines.append(f"| 1 | {hook_duration}s | 特写：{obj}的特写画面 | {t['hook_options'][0]} | 好奇 |")

    # 铺垫
    buildup_duration = int(duration * 0.28)
    lines.append(f"| 2-5 | {buildup_duration}s | 2-3个日常场景，展现人物关系 | （日常对话） | 温暖 |")

    # 冲突
    conflict_duration = int(duration * 0.35)
    lines.append(f"| 6-10 | {conflict_duration}s | 矛盾显现：{t['conflict_options'][0]} | （情绪升级） | 心酸 |")

    # 反转
    twist_duration = int(duration * 0.2)
    lines.append(f"| 11-13 | {twist_duration}s | 真相揭示：{t['twist_options'][0]} | （情绪爆发） | 泪目 |")

    # 金句
    tagline_duration = duration - hook_duration - buildup_duration - conflict_duration - twist_duration
    lines.append(f"| 14 | {tagline_duration}s | 远景/留白画面 | **{t['tagline_options'][0]}** | 释然 |\n")

    lines.append("## 备选方案")
    lines.append(f"- 备选钩子：{' / '.join(t['hook_options'])}")
    lines.append(f"- 备选物件：{' / '.join(t['object_options'])}")
    lines.append(f"- 备选冲突：{' / '.join(t['conflict_options'])}")
    lines.append(f"- 备选反转：{' / '.join(t['twist_options'])}")
    lines.append(f"- 备选金句：{' / '.join(t['tagline_options'])}\n")

    lines.append("## 爆款自检")
    lines.append("- [ ] 前5秒有钩子？")
    lines.append("- [ ] 有具体物件承载情感？")
    lines.append("- [ ] 核心反差明确？")
    lines.append("- [ ] 有明确泪点？")
    lines.append("- [ ] 结尾有可转发金句？")

    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='生成爆款故事短片脚本骨架')
    parser.add_argument('--theme', required=True, help='题材：父爱/母爱/奶奶/爷爷/打拐')
    parser.add_argument('--duration', type=int, default=90, help='时长（秒），默认90')
    parser.add_argument('--object', default=None, help='核心物件（可选）')
    parser.add_argument('--style', default=None, help='风格参考（可选）')
    parser.add_argument('--output', default=None, help='输出文件路径（可选）')

    args = parser.parse_args()

    result = generate_script(args.theme, args.duration, args.object, args.style)

    if args.output:
        from pathlib import Path
        Path(args.output).write_text(result, encoding='utf-8')
        print(f"脚本骨架已保存到: {args.output}")
    else:
        print(result)


if __name__ == "__main__":
    main()
