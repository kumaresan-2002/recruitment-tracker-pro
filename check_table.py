import re
html = open('src/views/3_candidates.html', encoding='utf-8').read()
if 'candidate-table' in html:
    print("Found candidate-table")
else:
    print("Not found candidate-table")
