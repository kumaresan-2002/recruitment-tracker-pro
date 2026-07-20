import re

def inject_switch_view_debugger():
    with open('src/app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find switchView function
    old_switch = """function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));"""
    
    new_switch = """function switchView(viewId) {
    try {
        console.log('--- switchView called for:', viewId, '---');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));"""
        
    if old_switch in content:
        content = content.replace(old_switch, new_switch)
        
        # Now find the end of switchView and add the catch
        # We look for:
        #     updateAllViews();
        # }
        old_end = """    updateAllViews();
}"""
        new_end = """    updateAllViews();
    } catch(err) {
        console.error('CRASH IN switchView:', err);
        alert('Navigation Error: ' + err.message + '\\nPlease open console for details.');
    }
}"""
        content = content.replace(old_end, new_end)
        
        with open('src/app.js', 'w', encoding='utf-8') as f:
            f.write(content)
            
        print("Debugger injected into switchView!")
    else:
        print("Could not find switchView signature.")

if __name__ == "__main__":
    inject_switch_view_debugger()
