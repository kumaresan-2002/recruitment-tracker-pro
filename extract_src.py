"""
extract_src.py - Extracts the committed index.html back into clean src/ source files.
This restores all features from Phases 47-53 that were only in index.html.
"""

import re
import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Written: {path} ({len(content)} bytes)")

html = read_file('index.html')

# --- 1. Extract CSS (between <style> and </style>) ---
css_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
if css_match:
    css = css_match.group(1).strip()
    write_file('src/style.css', css)
    print("[OK] Extracted CSS")
else:
    print("[ERR] CSS not found")

# --- 2. Extract JS (between <script> and </script> at the end) ---
# Last <script> block is the app JS
script_matches = list(re.finditer(r'<script>(.*?)</script>', html, re.DOTALL))
if script_matches:
    app_js = script_matches[-1].group(1).strip()
    write_file('src/app.js', app_js)
    print("[OK] Extracted app.js")
else:
    print("[ERR] app.js not found")

# --- 3. Extract body content (between <body> and </body>) ---
body_match = re.search(r'<body>(.*)</body>', html, re.DOTALL)
if not body_match:
    print("[ERR] body not found")
    exit(1)

body = body_match.group(1)

# Remove the <div class="main-content"> wrapper and extract views separately
# The body structure is:
#   sidebar + modals (layout.html)
#   <div class="main-content">
#     <div class="header">...</div>
#     <div class="content" id="view-container">
#       [views]
#     </div>
#   </div>
#   <script>...</script>

# --- 4. Extract views from view-container ---
view_container_match = re.search(
    r'<div class="content" id="view-container">(.*?)</div>\s*\n\s*</div>\s*\n\s*<script>',
    body, re.DOTALL
)
if view_container_match:
    views_block = view_container_match.group(1).strip()
    print("[OK] Found view-container")
else:
    print("[ERR] view-container not found - trying alternative pattern")
    view_container_match = re.search(r'id="view-container">(.*?)</div>\s*</div>\s*\n\s*<script>', body, re.DOTALL)
    if view_container_match:
        views_block = view_container_match.group(1).strip()
        print("[OK] Found view-container (alt)")
    else:
        # Fallback: extract each view div manually
        views_block = ""

# --- 5. Split individual views ---
# Each view is <div id="..." class="view ...">...</div>
view_map = {
    'dashboard': 'src/views/1_dashboard.html',
    'requirements': 'src/views/2_requirements.html',
    'us_reqs': 'src/views/2.5_us_reqs.html',
    'in_reqs': 'src/views/2.6_in_reqs.html',
    'candidates': 'src/views/3_candidates.html',
    'offers': 'src/views/3.5_offers.html',
    'onboarding': 'src/views/3.6_onboarding.html',
    'interviews': 'src/views/4_interviews.html',
    'performance': 'src/views/5_performance.html',
    'clientview': 'src/views/6_clientview.html',
    'clientportal': 'src/views/6.5_clientportal.html',
    'hiringmanager': 'src/views/6.6_hiringmanager.html',
    'agencyportal': 'src/views/6.7_agencyportal.html',
    'reports': 'src/views/4_reports.html',
    'datamanagement': 'src/views/5.5_datamanagement.html',
    'settings': 'src/views/5.6_settings.html',
    'auditlog': 'src/views/7_auditlog.html',
    'emailtemplates': 'src/views/8_emailtemplates.html',
    'careersPortal': 'src/views/9_careersportal.html',
    'kanban': 'src/views/10_kanban.html',
    'talentpool': 'src/views/11_talentpool.html',
}

# Extract each view block from the full body
views_found = []
for view_id, filepath in view_map.items():
    # Try to find the view div - handle multiple class patterns
    patterns = [
        rf'(<div id="{view_id}"[^>]*class="view[^"]*"[^>]*>)',
        rf'(<div id="{view_id}" class="view[^"]*">)',
        rf'(<div class="view[^"]*"[^>]*id="{view_id}"[^>]*>)',
    ]
    
    start_pos = None
    for pat in patterns:
        m = re.search(pat, body, re.DOTALL)
        if m:
            start_pos = m.start()
            break
    
    if start_pos is None:
        # Also try style-containing patterns
        m = re.search(rf'<div id="{view_id}"[^>]*>', body)
        if m:
            start_pos = m.start()
        else:
            print(f"  [WARN] View not found: {view_id}")
            continue
    
    # Find the matching closing </div> by counting depth
    depth = 0
    i = start_pos
    end_pos = None
    while i < len(body):
        if body[i:i+4] == '<div':
            depth += 1
            i += 4
        elif body[i:i+6] == '</div>':
            depth -= 1
            if depth == 0:
                end_pos = i + 6
                break
            i += 6
        else:
            i += 1
    
    if end_pos:
        view_content = body[start_pos:end_pos].strip()
        write_file(filepath, view_content + '\n')
        views_found.append(view_id)
        print(f"  [OK] Extracted view: {view_id}")
    else:
        print(f"  [ERR] Could not find end of view: {view_id}")

# --- 6. Extract layout.html ---
# Everything in body BEFORE <div class="main-content"> and not a view/script
main_content_pos = body.find('<div class="main-content">')
if main_content_pos == -1:
    main_content_pos = body.find('<div class="main-content" ')

if main_content_pos > 0:
    layout_content = body[:main_content_pos].strip()
    write_file('src/layout.html', layout_content + '\n')
    print("[OK] Extracted layout.html")
else:
    print("[ERR] main-content boundary not found")

print("\n" + "="*60)
print(f"Extraction complete. Views found: {views_found}")
print("Run: python build.py   to rebuild index.html from src/")
