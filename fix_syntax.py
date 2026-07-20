import re

with open('src/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The incorrect catch block at the end of syncData
bad_catch = """    updateAllViews();
    } catch(err) {
        console.error('CRASH IN switchView:', err);
        alert('Navigation Error: ' + err.message + '\\nPlease open console for details.');
    }
}"""
good_end = """    updateAllViews();
}"""
content = content.replace(bad_catch, good_end)

# The injected try block in switchView
bad_try = """function switchView(viewId) {
    try {
        console.log('--- switchView called for:', viewId, '---');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));"""
good_start = """function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));"""
content = content.replace(bad_try, good_start)

with open('src/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax errors!")
