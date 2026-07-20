html = open('index.html', encoding='utf-8').read()
s = html.find('id="candidates"')
e = html.find('<!-- View: Interviews Dashboard -->')
if s != -1 and e != -1:
    print('Size between candidates and next view:', e - s)
else:
    print('Not found')
