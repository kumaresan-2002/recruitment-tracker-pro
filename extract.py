import re

def extract():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    match = re.search(r'<body>\n(.*?)\n<div class="main-content">', html, re.DOTALL)
    if match:
        layout = match.group(1)
        with open('src/layout.html', 'w', encoding='utf-8') as f:
            f.write(layout)
        print("Extracted layout.html")
    else:
        print("Match not found")

if __name__ == "__main__":
    extract()
