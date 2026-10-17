#!/usr/bin/env python3
"""
剧本结构分析器
输入剧本文本，输出四段式结构拆解、情绪曲线标注、爆款元素提取。
用法: python analyze_script.py <script_file> [--output report.md]
"""

import sys
import re
import json
from pathlib import Path


def parse_script(text: str) -> dict:
    """解析剧本，提取结构和元素"""

    lines = [l.strip() for l in text.split('\n') if l.strip()]

    result = {
        "total_lines": len(lines),
        "hook": "",
        "buildup": [],
        "conflict": [],
        "twist": "",
        "tagline": "",
        "emotions": [],
        "objects": [],
        "dialogues": [],
    }

    # 提取第一句话作为钩子
    if lines:
        result["hook"] = lines[0]

    # 提取对话（带引号或冒号的行）
    for line in lines:
        if '"' in line or '"' in line or '"' in line or '：' in line:
            result["dialogues"].append(line)

    # 提取可能的物件关键词
    object_keywords = [
        '面', '饭', '鞋', '衣服', '照片', '相机', '手表', '自行车',
        '工具箱', '针线', '篮子', '杯子', '碗', '钥匙', '书包',
        '书', '玩具', '娃娃', '船', '车', '信', '纸条'
    ]
    for line in lines:
        for kw in object_keywords:
            if kw in line and kw not in result["objects"]:
                result["objects"].append(kw)

    # 提取情绪关键词
    emotion_keywords = {
        "心酸": ["忘", "老", "病", "孤单", "累", "苦", "省", "舍不得"],
        "温暖": ["笑", "暖", "爱", "陪", "抱", "牵", "煮", "做"],
        "心疼": ["哭", "泪", "疼", "伤", "病", "瘦", "皱", "白"],
        "震撼": ["原来", "竟然", "居然", "其实", "真相"],
        "释然": ["终于", "原来如此", "懂了", "明白了"],
    }
    for line in lines:
        for emotion, words in emotion_keywords.items():
            for w in words:
                if w in line:
                    result["emotions"].append({"line": line, "emotion": emotion})
                    break

    return result


def structure_analysis(text: str) -> str:
    """生成四段式结构分析"""

    parsed = parse_script(text)

    report = []
    report.append("# 剧本结构分析报告\n")

    report.append("## 基础信息")
    report.append(f"- 总行数：{parsed['total_lines']}")
    report.append(f"- 对话数量：{len(parsed['dialogues'])}")
    report.append(f"- 提及物件：{', '.join(parsed['objects']) if parsed['objects'] else '未检测到明显物件'}\n")

    report.append("## 四段式结构定位")
    report.append("| 节拍 | 推测内容 | 判断依据 |")
    report.append("|------|----------|----------|")

    lines = [l for l in text.split('\n') if l.strip()]
    total = len(lines)

    # 钩子：前10%
    hook_end = max(1, int(total * 0.1))
    hook_lines = lines[:hook_end]
    report.append(f"| 开场钩子（0-10%） | {' / '.join(hook_lines[:3])[:50]}... | 开头悬念/反常 |")

    # 铺垫：10-40%
    buildup_start = hook_end
    buildup_end = int(total * 0.4)
    buildup_lines = lines[buildup_start:buildup_end]
    report.append(f"| 日常铺垫（10-40%） | 约{len(buildup_lines)}行 | 建立人物关系 |")

    # 冲突：40-70%
    conflict_start = buildup_end
    conflict_end = int(total * 0.7)
    conflict_lines = lines[conflict_start:conflict_end]
    report.append(f"| 冲突升级（40-70%） | 约{len(conflict_lines)}行 | 矛盾显现 |")

    # 反转：70-90%
    twist_start = conflict_end
    twist_end = int(total * 0.9)
    twist_lines = lines[twist_start:twist_end]
    report.append(f"| 反转爆发（70-90%） | {' / '.join(twist_lines[:2])[:50]}... | 真相揭示 |")

    # 金句：最后10%
    tagline_lines = lines[twist_end:]
    report.append(f"| 金句收尾（90-100%） | {' / '.join(tagline_lines)[:50]} | 升华主题 |\n")

    report.append("## 情绪标注")
    if parsed["emotions"]:
        for e in parsed["emotions"][:10]:
            report.append(f"- **{e['emotion']}**：{e['line'][:40]}")
    else:
        report.append("- 未检测到明显情绪关键词，建议补充情绪标注")
    report.append("")

    report.append("## 爆款元素检查")
    checks = [
        ("有明确开场钩子", parsed["hook"] != ""),
        ("有具体物件承载情感", len(parsed["objects"]) > 0),
        ("有对话/台词", len(parsed["dialogues"]) > 3),
        ("有情绪变化", len(parsed["emotions"]) > 3),
    ]
    for item, ok in checks:
        report.append(f"- [{'x' if ok else ' '}] {item}")

    return '\n'.join(report)


def main():
    if len(sys.argv) < 2:
        print("用法: python analyze_script.py <剧本文件路径> [--output 输出文件]")
        print("示例: python analyze_script.py my_script.md")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    if not input_file.exists():
        print(f"错误：文件不存在 - {input_file}")
        sys.exit(1)

    text = input_file.read_text(encoding='utf-8')
    report = structure_analysis(text)

    # 输出
    output_file = None
    if '--output' in sys.argv:
        idx = sys.argv.index('--output')
        if idx + 1 < len(sys.argv):
            output_file = Path(sys.argv[idx + 1])

    if output_file:
        output_file.write_text(report, encoding='utf-8')
        print(f"分析报告已保存到: {output_file}")
    else:
        print(report)


if __name__ == "__main__":
    main()
