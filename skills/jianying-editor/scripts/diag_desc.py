import sys, os
sys.path.insert(0, r'C:\Users\temple\AppData\Local\Doubao\User Data\Profile 2\.doubao\agent_mode\workspace\.user_skills\jianying-editor\scripts')
sys.path.insert(0, r'C:\Users\temple\AppData\Local\Doubao\User Data\Profile 2\.doubao\agent_mode\workspace\.user_skills\jianying-editor\scripts\vendor')
from utils.env_setup import setup_env
setup_env()
import uiautomation as uia

win = uia.WindowControl(searchDepth=1, Name='剪映专业版')
if not win.Exists(3):
    print("Window not found")
    sys.exit(1)

print("=== Scanning depth=2 controls for draft titles ===")
# Walk the tree to depth 2
def walk(ctrl, depth, max_depth):
    if depth > max_depth:
        return
    try:
        children = ctrl.GetChildren()
    except:
        return
    for child in children:
        try:
            desc = child.GetPropertyValue(30159) or ""
        except:
            desc = ""
        name = child.Name or ""
        if depth == max_depth:
            if desc or name:
                print(f"  [d{depth}] Name='{name[:40]}', Desc='{desc[:80]}', Class='{child.ClassName}'")
        walk(child, depth+1, max_depth)

walk(win, 1, 2)
print("\n=== Also searching for 'GTA' or '情歌' anywhere ===")
# Try to find any control with GTA in description
all_text = []
def walk_all(ctrl, depth):
    if depth > 5:
        return
    try:
        children = ctrl.GetChildren()
    except:
        return
    for child in children:
        try:
            desc = child.GetPropertyValue(30159) or ""
        except:
            desc = ""
        name = child.Name or ""
        if 'GTA' in desc or '情歌' in desc or 'GTA' in name or '情歌' in name:
            print(f"  FOUND [d{depth}]: Name='{name[:50]}', Desc='{desc[:100]}'")
        walk_all(child, depth+1)
walk_all(win, 1)
