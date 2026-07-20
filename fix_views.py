import os
import re

def fix_views():
    views_dir = 'src/views'
    for filename in os.listdir(views_dir):
        if filename.endswith('.html'):
            filepath = os.path.join(views_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 1. Remove style="display:none;" (with or without spaces)
            content = re.sub(r'style\s*=\s*"display:\s*none;?"', '', content)
            
            # 2. Ensure class contains "view"
            # Find the first <div id="..." class="...">
            match = re.search(r'<div\s+id="([^"]+)"([^>]*)>', content)
            if match:
                div_id = match.group(1)
                rest = match.group(2)
                
                # Check if it has a class attribute
                class_match = re.search(r'class="([^"]+)"', rest)
                if class_match:
                    classes = class_match.group(1).split()
                    if 'view' not in classes:
                        # replace view-section with view, or just append view
                        if 'view-section' in classes:
                            classes.remove('view-section')
                        classes.insert(0, 'view')
                        new_class = 'class="' + ' '.join(classes) + '"'
                        new_rest = rest.replace(class_match.group(0), new_class)
                        new_div = f'<div id="{div_id}"{new_rest}>'
                        content = content.replace(match.group(0), new_div, 1)
                else:
                    # add class="view"
                    new_div = f'<div id="{div_id}" class="view"{rest}>'
                    content = content.replace(match.group(0), new_div, 1)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
    # 3. Add missing render functions in app.js
    with open('src/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()
        
    missing_funcs = []
    
    if 'function renderOnboardingHub' not in app_js:
        missing_funcs.append("""
function renderOnboardingHub() {
    const grid = document.getElementById('onboarding-grid');
    if(grid) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-light); background: white; border-radius: 8px; border: 1px dashed var(--border);"><h3>No Active Onboardings</h3><p>Move a candidate to "Hired" to track their onboarding progress.</p></div>';
    }
}
""")

    if 'function renderClientView' not in app_js:
        missing_funcs.append("""
function renderClients() {
    const table = document.querySelector('#clientview table tbody');
    if(table) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-light);"><h3>No Clients Configured</h3><p>Use Data Management to generate client credentials.</p></td></tr>';
    }
}
""")

    if 'function renderBillingHub' not in app_js:
        missing_funcs.append("""
function renderBillingHub() {
    const table = document.querySelector('#billingHubView table tbody');
    if(table) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-light);"><h3>No Billing Records</h3><p>Timesheets and invoices will appear here once a candidate is placed.</p></td></tr>';
    }
}
""")

    if 'function renderAutomations' not in app_js:
        missing_funcs.append("""
function renderAutomations() {
    const table = document.getElementById('automations-table');
    if(table) {
        table.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-light);"><h3>No Active Automations</h3><p>Click "Create New Rule" to automate your workflows.</p></td></tr>';
    }
}
""")
        
    if missing_funcs:
        app_js += "\\n// --- Auto-generated placeholders for empty views ---\\n" + "\\n".join(missing_funcs)
        with open('src/app.js', 'w', encoding='utf-8') as f:
            f.write(app_js)

if __name__ == "__main__":
    fix_views()
