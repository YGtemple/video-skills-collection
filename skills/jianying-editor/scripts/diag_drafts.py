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

print("=== Window found, scanning text controls ===")
# Find all text controls containing 'GTA' or '情歌' or '草稿'
texts = win.GetChildren()
print(f"Top-level children: {len(texts)}")
for child in texts:
    print(f"  Child: {child.ControlTypeName}, Name='{child.Name[:50] if child.Name else ''}', Class='{child.ClassName}'")

# Search deeper for draft names
print("\n=== Searching for draft titles ===")
for depth in range(2, 6):
    found = win.GetChildren()
    for _ in range(depth-1):
        new_found = []
        for c in found:
            try:
                new_found.extend(c.GetChildren())
            except:
                pass
        found = new_found
    for c in found:
        if c.ControlTypeName == 'TextControl' and c.Name:
            if any(k in c.Name for k in ['GTA', '情歌', '草稿', '冰箱', '防火', '老人']):
                print(f"  [Depth {depth}] Text: '{c.Name}'")
