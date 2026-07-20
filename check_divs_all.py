import os
from html.parser import HTMLParser

class DivParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        
    def handle_starttag(self, tag, attrs):
        if tag == 'div':
            self.depth += 1
            
    def handle_endtag(self, tag):
        if tag == 'div':
            self.depth -= 1

views_dir = 'src/views'
for filename in sorted(os.listdir(views_dir)):
    if filename.endswith('.html'):
        filepath = os.path.join(views_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
        parser = DivParser()
        parser.feed(html)
        if parser.depth != 0:
            print(f"{filename}: Unbalanced divs! Net depth: {parser.depth}")
