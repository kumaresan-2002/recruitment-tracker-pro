html = open('index.html', encoding='utf-8').read()
if 'id="candidates"' in html:
    print("Found candidates in index.html")
else:
    print("Not found candidates in index.html")
