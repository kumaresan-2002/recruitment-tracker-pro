def update_dashboard():
    with open('src/views/1_dashboard.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We will rewrite the dashboard cards to show the requested metrics
    new_cards = """
<div class="dashboard-grid">
    <div class="card">
        <h3>Total Requirements</h3>
        <div class="value" id="dash_total_reqs">0</div>
        <div style="font-size:0.8rem; color:var(--text-light); margin-top:8px;">Across all clients</div>
    </div>
    <div class="card">
        <h3>Candidates Submitted</h3>
        <div class="value" id="dash_total_subs">0</div>
        <div style="font-size:0.8rem; color:var(--text-light); margin-top:8px;">To client portals/emails</div>
    </div>
    <div class="card">
        <h3>Revenue Forecast</h3>
        <div class="value" id="dash_revenue_forecast" style="color:var(--success);">$0.00</div>
        <div style="font-size:0.8rem; color:var(--text-light); margin-top:8px;">Based on hourly margins</div>
    </div>
    <div class="card">
        <h3>Active Requirements</h3>
        <div class="value" id="dash_active_reqs">0</div>
        <div style="font-size:0.8rem; color:var(--text-light); margin-top:8px;">Currently open</div>
    </div>
</div>
"""
    # Replace the existing dashboard-grid
    content = re.sub(r'<div class="dashboard-grid">.*?</div>\n</div>\n\n<div class="charts-grid">', new_cards + '\n<div class="charts-grid">', content, flags=re.DOTALL)
    
    with open('src/views/1_dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    with open('src/app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()
        
    new_render_dash = """function renderDashboard() {
    const totalReqsEl = document.getElementById('dash_total_reqs');
    const totalSubsEl = document.getElementById('dash_total_subs');
    const revForecastEl = document.getElementById('dash_revenue_forecast');
    const activeReqsEl = document.getElementById('dash_active_reqs');
    
    if(!totalReqsEl) return;
    
    totalReqsEl.innerText = requirements.length;
    
    const activeReqs = requirements.filter(r => r.status === 'Open').length;
    activeReqsEl.innerText = activeReqs;
    
    let totalSubs = 0;
    requirements.forEach(r => { totalSubs += (r.submittedCount || 0); });
    totalSubsEl.innerText = totalSubs;
    
    let forecast = 0;
    requirements.forEach(r => {
        if(r.hourlyRate && r.marginTarget && r.submittedCount) {
            forecast += (r.hourlyRate * (r.marginTarget/100)) * r.submittedCount * 160; // Assuming 160 hours a month per placement
        }
    });
    
    revForecastEl.innerText = '$' + forecast.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    // Existing Chart rendering logic if any...
}"""
    app_js = re.sub(r'function renderDashboard\(\) \{.*?\n\}', new_render_dash, app_js, flags=re.DOTALL)
    
    with open('src/app.js', 'w', encoding='utf-8') as f:
        f.write(app_js)

if __name__ == "__main__":
    import re
    update_dashboard()
