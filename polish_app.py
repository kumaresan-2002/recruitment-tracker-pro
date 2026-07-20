def polish_app():
    with open('src/app.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update renderRequirements empty state
    old_req_empty = "<tr><td colspan=\"8\" style=\"text-align:center;\">No requirements found.</td></tr>"
    new_req_empty = "<tr><td colspan=\"8\"><div class=\"empty-state\"><div class=\"empty-state-icon\">📋</div><h3>No Requirements Found</h3><p>There are no active requirements matching this view.</p></div></td></tr>"
    content = content.replace(old_req_empty, new_req_empty)
    
    # 2. Update renderCandidates empty state
    old_can_empty = "<tr><td colspan=\"7\" style=\"text-align:center;\">No candidates found in this stage.</td></tr>"
    new_can_empty = "<tr><td colspan=\"7\"><div class=\"empty-state\"><div class=\"empty-state-icon\">👥</div><h3>No Candidates Found</h3><p>There are no candidates currently in this stage of the pipeline.</p></div></td></tr>"
    content = content.replace(old_can_empty, new_can_empty)

    # 3. Update alert logic to allow stacking by tracking active alerts
    alert_js_old = """function createAlert(message, type = 'success') {
    const existing = document.querySelector('.alert');
    if (existing) existing.remove();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.padding = '15px 20px';
    alert.style.borderRadius = '8px';
    alert.style.color = 'white';
    alert.style.zIndex = '9999';
    alert.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    alert.style.transition = 'opacity 0.3s ease';
    
    if (type === 'success') alert.style.background = 'var(--success)';
    if (type === 'error') alert.style.background = 'var(--danger)';
    if (type === 'warning') alert.style.background = 'var(--warning)';
    if (type === 'info') alert.style.background = 'var(--primary)';
    
    alert.innerText = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}"""

    alert_js_new = """let activeAlerts = [];
function createAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error' || type === 'danger') icon = '🚨';
    if (type === 'warning') icon = '⚠️';
    
    alert.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    document.body.appendChild(alert);
    
    // Calculate top position based on existing alerts
    const offset = 20 + (activeAlerts.length * 70);
    alert.style.top = `${offset}px`;
    
    activeAlerts.push(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => {
            alert.remove();
            activeAlerts = activeAlerts.filter(a => a !== alert);
            // Reposition remaining alerts
            activeAlerts.forEach((a, i) => {
                a.style.top = `${20 + (i * 70)}px`;
            });
        }, 400);
    }, 4000);
}"""
    content = content.replace(alert_js_old, alert_js_new)
    
    with open('src/app.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    polish_app()
