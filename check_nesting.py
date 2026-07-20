from html.parser import HTMLParser

class DivParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.view_depth = -1
        self.in_view = False
        self.nested_views = []
        
    def handle_starttag(self, tag, attrs):
        if tag == 'div':
            self.depth += 1
            attr_dict = dict(attrs)
            classes = attr_dict.get('class', '')
            view_id = attr_dict.get('id', '')
            
            if 'view' in classes.split():
                if self.in_view:
                    self.nested_views.append(f"Nested View: {view_id} inside at depth {self.depth}")
                else:
                    self.in_view = True
                    self.view_depth = self.depth
                    
    def handle_endtag(self, tag):
        if tag == 'div':
            if self.in_view and self.depth == self.view_depth:
                self.in_view = False
                self.view_depth = -1
            self.depth -= 1

parser = DivParser()
html = open('index.html', encoding='utf-8').read()
parser.feed(html)

if parser.nested_views:
    for nv in parser.nested_views:
        print(nv)
else:
    print("No nested views found!")
    
if parser.depth != 0:
    print("Warning: Unbalanced div tags! Final depth:", parser.depth)
