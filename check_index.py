import re
html = open('index.html', encoding='utf-8').read()
match = re.search(r'<div id="billingHubView".*?>', html)
if match:
    print(match.group(0))
else:
    print("Not found!")
