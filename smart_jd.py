import re

def add_smart_jd():
    # 1. Add Smart JD button to Requirements view
    with open('src/views/2_requirements.html', 'r', encoding='utf-8') as f:
        req_html = f.read()
    
    btn_code = """<div style="display: flex; gap: 15px;">
            <button class="btn btn-primary" onclick="openModal('smartJdModal')" style="background:linear-gradient(135deg, #2563eb, #7c3aed);">✨ Smart JD Entry</button>
            <input type="text" """
    req_html = req_html.replace('<input type="text" ', btn_code, 1)
    
    with open('src/views/2_requirements.html', 'w', encoding='utf-8') as f:
        f.write(req_html)
        
    # 2. Append Smart JD Modal to layout.html
    modal_html = """
<!-- Modal: Smart JD Entry -->
<div id="smartJdModal" class="modal" style="z-index: 10000;">
    <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
            <h2>✨ Smart JD Entry</h2>
            <span class="close-btn" onclick="closeModal('smartJdModal')">&times;</span>
        </div>
        <p style="color:var(--text-light); margin-bottom:15px;">Paste the raw email or Job Description below. The AI Parser will automatically extract the Client, Role, Location, and Rate to create a new requirement.</p>
        <div class="form-group">
            <textarea id="smart_jd_text" rows="12" class="form-control" placeholder="Paste JD or Email text here..."></textarea>
        </div>
        <div class="form-group form-grid">
            <div>
                <label>Target Market</label>
                <select id="smart_jd_country" class="form-control">
                    <option value="US">US Requirement</option>
                    <option value="IN">India Requirement</option>
                </select>
            </div>
            <div>
                <label>Expected Margin (%)</label>
                <input type="number" id="smart_jd_margin" class="form-control" value="20">
            </div>
        </div>
        <button class="btn btn-primary" style="width:100%;" onclick="processSmartJD()">Auto-Fill & Create Requirement</button>
    </div>
</div>
"""
    with open('src/layout.html', 'a', encoding='utf-8') as f:
        f.write(modal_html)
        
    # 3. Add JS Parsing Logic to app.js
    js_code = """
// --- Phase 73: Smart JD Parsing & Submissions Tracking ---
function processSmartJD() {
    const text = document.getElementById('smart_jd_text').value;
    const country = document.getElementById('smart_jd_country').value;
    const margin = parseInt(document.getElementById('smart_jd_margin').value) || 20;
    
    if(!text.trim()) {
        createAlert('Please paste the JD text.', 'warning');
        return;
    }
    
    createAlert('Parsing Job Description...', 'info');
    
    // Simulate Smart AI Parsing using Regex heuristics
    let clientMatch = text.match(/(HTC Global Service|HTC|Infodynamics|TCS|Infosys|Client:[ ]*([a-zA-Z0-9 ]+))/i);
    let roleMatch = text.match(/(Role|Title|Position|Job Title):[ \\t]*([^\\n\\r]+)/i);
    let locationMatch = text.match(/(Location|Work Location):[ \\t]*([^\\n\\r]+)/i);
    let rateMatch = text.match(/(Rate|Pay|Per Hour|Hourly):[ \\t]*([$]?[0-9]+(\\.[0-9]{2})?)/i);
    let expMatch = text.match(/(Experience|Exp):[ \\t]*([^\\n\\r]+)/i);
    
    let clientName = clientMatch ? (clientMatch[2] || clientMatch[1]) : "Unknown Client";
    let role = roleMatch ? roleMatch[2].trim() : "Parsed Role";
    let location = locationMatch ? locationMatch[2].trim() : "Remote / TBD";
    let rateRaw = rateMatch ? rateMatch[2].replace('$', '') : "0";
    let rate = parseFloat(rateRaw);
    let exp = expMatch ? expMatch[2].trim() : "3-5 Years";
    
    // Clean up Client name
    if(clientName.toLowerCase().includes('htc')) clientName = 'HTC Global Service';
    if(clientName.toLowerCase().includes('infodynamics')) clientName = 'Infodynamics';
    
    setTimeout(() => {
        const id = `${country}-${new Date().getFullYear()}-${String(requirements.length + 1).padStart(4, '0')}`;
        
        const newReq = {
            id,
            client: clientName,
            role,
            experience: exp,
            location,
            country,
            priority: 'High',
            status: 'Open',
            hourlyRate: rate,
            marginTarget: margin,
            sourcedCount: 0,
            submittedCount: 0,
            description: text,
            createdAt: new Date().toISOString()
        };
        
        requirements.push(newReq);
        saveData();
        
        closeModal('smartJdModal');
        createAlert(`Requirement ${id} created for ${clientName}!`, 'success');
        document.getElementById('smart_jd_text').value = '';
        updateAllViews();
        
    }, 800); // simulate API delay
}

function attachCandidateToReq(canId, reqId) {
    const can = candidates.find(c => c.id === canId);
    const req = requirements.find(r => r.id === reqId);
    if(can && req) {
        can.reqId = reqId;
        can.client = req.client;
        can.stage = 'Submitted to Client';
        can.lastUpdated = new Date().toISOString();
        req.submittedCount = (req.submittedCount || 0) + 1;
        saveData();
        createAlert(`Attached ${can.name} to ${req.client} (${reqId})`, 'success');
        updateAllViews();
    }
}
"""
    with open('src/app.js', 'a', encoding='utf-8') as f:
        f.write('\n' + js_code)
        
if __name__ == "__main__":
    add_smart_jd()
