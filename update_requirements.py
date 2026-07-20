def update_req_view():
    with open('src/app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    old_render = """function renderRequirements() {
    const tbody = document.querySelector('#requirements table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filtered = requirements;
    const search = document.getElementById('searchReq')?.value.toLowerCase();
    if (search) {
        filtered = filtered.filter(r => r.role.toLowerCase().includes(search) || r.id.toLowerCase().includes(search));
    }
    const country = document.getElementById('filterCountry')?.value;
    if (country && country !== 'All') {
        filtered = filtered.filter(r => r.country === country);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📋</div><h3>No Requirements Found</h3><p>There are no active requirements matching this view.</p></div></td></tr>';
        return;
    }
    
    filtered.forEach(req => {
        tbody.innerHTML += `
        <tr class="fade-in">
            <td><strong>${req.id}</strong><br><span style="font-size:0.75rem; color:var(--text-light);">${req.country} Req</span></td>
            <td>${req.role}</td>
            <td>${req.experience}</td>
            <td>${req.location}</td>
            <td><span class="badge ${req.priority === 'High' ? 'badge-primary' : 'badge-secondary'}">${req.priority}</span></td>
            <td><span class="badge active">${req.status}</span></td>
            <td class="actions-cell">
                <span class="actions-menu-btn" onclick="toggleDropdown('req-menu-${req.id}')">•••</span>
                <div id="req-menu-${req.id}" class="actions-dropdown">
                    <div class="actions-item" onclick="alert('Viewing req: ${req.id}')">View Details</div>
                    <div class="actions-item" onclick="alert('Edit req: ${req.id}')">Edit</div>
                    <div class="actions-item" style="color:var(--danger)" onclick="deleteRequirement('${req.id}')">Delete</div>
                </div>
            </td>
        </tr>
        `;
    });
}"""

    new_render = """function renderRequirements() {
    const tbody = document.querySelector('#requirements table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let filtered = requirements;
    const search = document.getElementById('searchReq')?.value.toLowerCase();
    if (search) {
        filtered = filtered.filter(r => r.role.toLowerCase().includes(search) || r.id.toLowerCase().includes(search) || (r.client || '').toLowerCase().includes(search));
    }
    const country = document.getElementById('filterCountry')?.value;
    if (country && country !== 'All') {
        filtered = filtered.filter(r => r.country === country);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📋</div><h3>No Requirements Found</h3><p>There are no active requirements matching this view.</p></div></td></tr>';
        return;
    }
    
    filtered.forEach(req => {
        let revForecast = (req.hourlyRate && req.marginTarget) ? (req.hourlyRate * (req.marginTarget/100)).toFixed(2) : '0.00';
        
        tbody.innerHTML += `
        <tr class="fade-in">
            <td><strong>${req.client || 'Internal'}</strong><br><span style="font-size:0.75rem; color:var(--text-light);">${req.id}</span></td>
            <td><strong>${req.role}</strong><br><span style="font-size:0.75rem; color:var(--text-light);">${req.experience}</span></td>
            <td>${req.location}<br><span style="font-size:0.75rem; color:var(--success); font-weight:600;">$${req.hourlyRate || 0}/hr (+$${revForecast} Margin)</span></td>
            <td>
                <div style="font-size:0.8rem;"><strong>${req.submittedCount || 0}</strong> Submitted</div>
                <div style="font-size:0.75rem; color:var(--text-light);">${req.sourcedCount || 0} Sourced</div>
            </td>
            <td><span class="badge ${req.status === 'Open' ? 'active' : 'badge-secondary'}">${req.status}</span></td>
            <td class="actions-cell">
                <span class="actions-menu-btn" onclick="toggleDropdown('req-menu-${req.id}')">•••</span>
                <div id="req-menu-${req.id}" class="actions-dropdown">
                    <div class="actions-item" onclick="openAttachCandidateModal('${req.id}')">🔗 Attach Candidate</div>
                    <div class="actions-item" onclick="alert('Viewing req: ${req.id}')">View Details</div>
                    <div class="actions-item" style="color:var(--danger)" onclick="deleteRequirement('${req.id}')">Delete</div>
                </div>
            </td>
        </tr>
        `;
    });
}

// Attach Candidate Logic
let attachReqId = null;
function openAttachCandidateModal(reqId) {
    attachReqId = reqId;
    const req = requirements.find(r => r.id === reqId);
    if(!req) return;
    
    document.getElementById('attach_req_title').innerText = `${req.client} - ${req.role}`;
    
    const select = document.getElementById('attach_candidate_select');
    select.innerHTML = '<option value="">-- Select a Candidate --</option>';
    
    candidates.forEach(c => {
        if(c.stage !== 'Submitted to Client' && c.stage !== 'Hired' && c.stage !== 'Rejected') {
            select.innerHTML += `<option value="${c.id}">${c.name} (${c.stage})</option>`;
        }
    });
    
    openModal('attachCandidateModal');
}

function submitAttachCandidate() {
    if(!attachReqId) return;
    const canId = document.getElementById('attach_candidate_select').value;
    if(!canId) {
        createAlert('Please select a candidate', 'warning');
        return;
    }
    attachCandidateToReq(canId, attachReqId);
    closeModal('attachCandidateModal');
}
"""
    if old_render in content:
        content = content.replace(old_render, new_render)
    else:
        print("old_render not found in app.js")
    
    with open('src/app.js', 'w', encoding='utf-8') as f:
        f.write(content)

    # Append Attach Candidate Modal to layout.html
    modal_html = """
<!-- Modal: Attach Candidate -->
<div id="attachCandidateModal" class="modal" style="z-index: 10000;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h2>🔗 Attach Candidate</h2>
            <span class="close-btn" onclick="closeModal('attachCandidateModal')">&times;</span>
        </div>
        <p style="color:var(--text-light); margin-bottom:15px;">Submitting a candidate to: <strong id="attach_req_title" style="color:var(--primary);"></strong></p>
        <div class="form-group">
            <label>Select Candidate from Pipeline</label>
            <select id="attach_candidate_select" class="form-control">
                <!-- populated dynamically -->
            </select>
        </div>
        <button class="btn btn-primary" style="width:100%; background:var(--primary);" onclick="submitAttachCandidate()">Attach & Submit to Client</button>
    </div>
</div>
"""
    with open('src/layout.html', 'a', encoding='utf-8') as f:
        f.write(modal_html)

if __name__ == "__main__":
    update_req_view()
