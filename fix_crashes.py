def fix_crashes():
    with open('src/app.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Fix applyRolePermissions
    old_role = """function applyRolePermissions() {
    document.querySelectorAll('.nav-item').forEach(nav => {
        const allowedRoles = nav.getAttribute('data-role-visible').split(',');"""
    
    new_role = """function applyRolePermissions() {
    document.querySelectorAll('.nav-item').forEach(nav => {
        const attr = nav.getAttribute('data-role-visible');
        if (!attr) return;
        const allowedRoles = attr.split(',');"""
    content = content.replace(old_role, new_role)
    
    # 2. Fix renderTalentPool
    old_pool = """document.getElementById('nav-pool-count').innerText = poolCans.length;
    document.getElementById('kb-count-TalentPool').innerText = poolCans.length;"""
    
    new_pool = """const navCount = document.getElementById('nav-pool-count');
    if (navCount) navCount.innerText = poolCans.length;
    const kbCount = document.getElementById('kb-count-TalentPool');
    if (kbCount) kbCount.innerText = poolCans.length;"""
    content = content.replace(old_pool, new_pool)
    
    with open('src/app.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_crashes()
