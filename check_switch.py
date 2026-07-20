import re
with open('src/app.js', 'r', encoding='utf-8') as f:
    app = f.read()
match = re.search(r'function switchView.*?catch\(err\).*?\}', app, re.DOTALL)
if match:
    print(match.group(0))
