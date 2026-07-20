def inject():
    with open('src/app.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if "function loadData()" in line:
            for j in range(i, i+50):
                if "candidates =" in lines[j]:
                    lines.insert(j + 1, "    automations = JSON.parse(localStorage.getItem('automations')) || [];\n")
                    break
            break
            
    for i, line in enumerate(lines):
        if "function saveData()" in line:
            for j in range(i, i+50):
                if "localStorage.setItem('candidates'" in lines[j]:
                    lines.insert(j + 1, "    localStorage.setItem('automations', JSON.stringify(automations));\n")
                    break
            break
            
    for i, line in enumerate(lines):
        if "function updateAllViews()" in line:
            for j in range(i, i+50):
                if "renderCandidates()" in lines[j]:
                    lines.insert(j + 1, "    renderAutomations();\n    runAutomationsEngine();\n")
                    break
            break

    with open('src/app.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    # Append automations.js
    with open('automations.js', 'r', encoding='utf-8') as f:
        auto_js = f.read()
    with open('src/app.js', 'a', encoding='utf-8') as f:
        f.write('\n' + auto_js)

if __name__ == "__main__":
    inject()
