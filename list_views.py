import re
html = open('index.html', encoding='utf-8').read()
matches = re.findall(r'<!-- View: .*? -->', html)
print(matches)
