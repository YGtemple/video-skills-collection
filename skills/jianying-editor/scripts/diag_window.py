import sys, os
sys.path.insert(0, r'C:\Users\temple\AppData\Local\Doubao\User Data\Profile 2\.doubao\agent_mode\workspace\.user_skills\jianying-editor\scripts')
sys.path.insert(0, r'C:\Users\temple\AppData\Local\Doubao\User Data\Profile 2\.doubao\agent_mode\workspace\.user_skills\jianying-editor\scripts\vendor')
from utils.env_setup import setup_env
setup_env()
import uiautomation as uia

# Find all windows with '剪映' in name
print("=== Searching for JianYing windows ===")
root = uia.GetRootControl()
for win in root.GetChildren():
    if '剪映' in win.Name or 'JianYing' in win.Name or 'lv' in win.ClassName.lower():
        print(f"Window: Name='{win.Name}', Class='{win.ClassName}', Handle={win.NativeWindowHandle}")
