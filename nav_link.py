def inject():
    with open('src/layout.html', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # find Data Management line
    for i, line in enumerate(lines):
        if "Data Management" in line and 'switchView' in line:
            lines.insert(i + 1, '        <div class="nav-item" onclick="switchView(\'automationsView\')" data-role-visible="Management,Admin" style="color:var(--purple); font-weight:600;">⚡ Automations Engine</div>\n')
            break
            
    with open('src/layout.html', 'w', encoding='utf-8') as f:
        f.writelines(lines)

if __name__ == "__main__":
    inject()
