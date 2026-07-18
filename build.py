import os

def read_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

def build():
    # Read components
    css = read_file('src/style.css')
    layout = read_file('src/layout.html')
    app_js = read_file('src/app.js')
    
    # Read views
    views_dir = 'src/views'
    views_html = ""
    if os.path.exists(views_dir):
        for filename in sorted(os.listdir(views_dir)):
            if filename.endswith('.html'):
                views_html += read_file(os.path.join(views_dir, filename)) + "\n"

    # Assemble HTML
    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recruitment Tracker Pro</title>
    <!-- Chart.js for Dashboards -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
{css}
    </style>
</head>
<body>
{layout}

<div class="main-content">
    <div class="header">
        <h3 id="current-view-title">Dashboard</h3>
        <div>
            <button class="btn" onclick="openModal('reqModal')">+ New Requirement</button>
            <button class="btn btn-outline" onclick="openModal('candidateModal')">+ New Candidate</button>
        </div>
    </div>
    
    <div class="content" id="view-container">
{views_html}
    </div>
</div>

<script>
{app_js}
</script>
</body>
</html>"""

    # Write output
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    print("Successfully built index.html!")

if __name__ == "__main__":
    build()
