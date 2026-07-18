// Data Store Keys
const STORE_KEYS = {
    reqs: 'recruitmentTracker_requirements_v1',
    candidates: 'recruitmentTracker_candidates_v1',
    worklogs: 'recruitmentTracker_worklogs_v1',
    settings: 'recruitmentTracker_settings_v1',
    role: 'recruitmentTracker_role_v1'
};

// Initialize State
let requirements = JSON.parse(localStorage.getItem(STORE_KEYS.reqs)) || [];
let candidates = JSON.parse(localStorage.getItem(STORE_KEYS.candidates)) || [];
let worklogs = JSON.parse(localStorage.getItem(STORE_KEYS.worklogs)) || [];
let appSettings = JSON.parse(localStorage.getItem(STORE_KEYS.settings)) || { inactivity: 3, sla: 7, minMargin: 15 };
let currentRole = localStorage.getItem(STORE_KEYS.role) || "Management";
let editingReqId = null;
let currentCandidateTab = "All";
let editingCandidateId = null;

// Aging filter state variables
let reqAgeFilterMin = null;
let reqAgeFilterMax = null;

// Save to LocalStorage
function saveData() {
    localStorage.setItem(STORE_KEYS.reqs, JSON.stringify(requirements));
    localStorage.setItem(STORE_KEYS.candidates, JSON.stringify(candidates));
    localStorage.setItem(STORE_KEYS.worklogs, JSON.stringify(worklogs));
    localStorage.setItem(STORE_KEYS.settings, JSON.stringify(appSettings));
    localStorage.setItem(STORE_KEYS.role, currentRole);
    updateAllViews();
}

// Navigation & Modals
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Reset aging filters if navigating away from requirements
    if (viewId !== 'requirements') {
        reqAgeFilterMin = null;
        reqAgeFilterMax = null;
    }
    
    const targetView = document.getElementById(viewId);
    if(targetView) targetView.classList.add('active');
    
    const sidebarItems = document.querySelectorAll('.nav-item');
    sidebarItems.forEach(n => {
        if(n.getAttribute('onclick') && n.getAttribute('onclick').includes(viewId)) {
            n.classList.add('active');
        }
    });
    
    const titleMap = {
        'dashboard': 'Executive Dashboard',
        'requirements': 'All Requirements',
        'us_reqs': 'US Recruitment Queue',
        'in_reqs': 'India Recruitment Queue',
        'candidates': 'Candidate Pipeline',
        'interviews': 'Interviews Dashboard',
        'offers': 'Offers & Onboarding Tracker',
        'performance': 'Recruiter Activity & Performance',
        'clientview': 'Client Accounts View',
        'reports': 'Reports & Analytics',
        'datamanagement': 'Data Storage Control',
        'settings': 'System Configurations'
    };
    document.getElementById('current-view-title').innerText = titleMap[viewId] || 'Workspace';
    
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar-menu').style.display = 'none';
    }
    
    updateAllViews();
}

function openModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
}
function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
    if (id === 'reqModal') {
        editingReqId = null;
        document.getElementById('reqForm').reset();
        switchFormTab('req', 'req-basic');
        const simTip = document.getElementById('req-similarity-tip');
        if (simTip) {
            simTip.style.display = 'none';
            simTip.innerText = '';
        }
    } else if (id === 'candidateModal') {
        editingCandidateId = null;
        document.getElementById('candidateForm').reset();
    }
}

// Mobile Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-menu');
    const closeBtn = document.getElementById('sidebar-close');
    if (sidebar.style.display === 'flex') {
        sidebar.style.display = 'none';
        closeBtn.style.display = 'none';
    } else {
        sidebar.style.display = 'flex';
        closeBtn.style.display = 'block';
    }
}

// Form tab switcher
function switchFormTab(prefix, tabId) {
    const parent = document.getElementById(tabId).parentElement;
    parent.querySelectorAll('.form-tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    
    const headerRow = parent.previousElementSibling;
    headerRow.querySelectorAll('button').forEach(btn => btn.classList.add('btn-outline'));
    event.currentTarget.classList.remove('btn-outline');
}

// Dynamic Form Fields & Calculations
function toggleCountryFields() {
    const isUS = document.getElementById('r_country').value === 'US';
    document.querySelectorAll('.us-field').forEach(el => el.classList.toggle('active', isUS));
    document.querySelectorAll('.in-field').forEach(el => el.classList.toggle('active', !isUS));
}

function updateRatesMargin() {
    const bill = parseFloat(document.getElementById('r_us_billrate').value || 0);
    const pay = parseFloat(document.getElementById('r_us_payrate').value || 0);
    document.getElementById('r_us_margin').value = (bill - pay).toFixed(2);
}

function toggleStageFields() {
    const stage = document.getElementById('s_newStage').value;
    document.querySelectorAll('.stage-submit').forEach(el => el.style.display = stage === 'Submitted to Client' ? 'block' : 'none');
    document.querySelectorAll('.stage-interview').forEach(el => el.style.display = stage === 'Interview Scheduled' ? 'block' : 'none');
    document.querySelectorAll('.stage-offer').forEach(el => el.style.display = stage === 'Offer Released' ? 'block' : 'none');
    document.querySelectorAll('.stage-joined').forEach(el => el.style.display = stage === 'Joined' ? 'block' : 'none');
    document.querySelectorAll('.stage-reject').forEach(el => el.style.display = stage === 'Rejected' ? 'block' : 'none');
    document.querySelectorAll('.stage-withdraw').forEach(el => el.style.display = stage === 'Candidate Withdrew' ? 'block' : 'none');
}

// Duplicate Req Check (Section 24)
function checkDuplicateReq() {
    const title = document.getElementById('r_title').value.trim().toLowerCase();
    const client = document.getElementById('r_client').value.trim().toLowerCase();
    const location = document.getElementById('r_location').value.trim().toLowerCase();
    const warningDiv = document.getElementById('req-duplicate-warning');
    
    const duplicate = requirements.some(r => r.id !== editingReqId && r.title.toLowerCase() === title && r.client.toLowerCase() === client && r.location.toLowerCase() === location);
    warningDiv.style.display = duplicate ? 'block' : 'none';
}

function checkSimilarRequirements() {
    const inputVal = document.getElementById('r_skills').value.trim().toLowerCase();
    const tipDiv = document.getElementById('req-similarity-tip');
    if (!tipDiv) return;
    
    if (inputVal.length < 3) {
        tipDiv.style.display = 'none';
        return;
    }
    
    // Split user input by comma, trim whitespace
    const inputSkills = inputVal.split(',').map(s => s.trim()).filter(s => s !== "");
    if (inputSkills.length < 1) {
        tipDiv.style.display = 'none';
        return;
    }
    
    const matches = [];
    requirements.forEach(req => {
        if (req.id === editingReqId) return;
        if (!['Active', 'New'].includes(req.status)) return;
        
        const reqSkills = (req.skills || '').toLowerCase().split(',').map(s => s.trim()).filter(s => s !== "");
        const overlap = inputSkills.filter(s => reqSkills.includes(s));
        
        if (overlap.length >= 2) {
            matches.push({ id: req.id, title: req.title, overlap: overlap });
        }
    });
    
    if (matches.length > 0) {
        tipDiv.style.display = 'block';
        tipDiv.innerHTML = matches.map(m => `
            💡 <strong>Sourcing Pool Tip:</strong> Active Job <span style="color:var(--text-dark);">${m.id} (${m.title})</span> also requires similar skills [${m.overlap.join(', ')}]. You can share candidate pipelines!
        `).join('<br>');
    } else {
        tipDiv.style.display = 'none';
    }
}

// Duplicate Candidate Warning (Section 24)
function checkDuplicateCandidate() {
    const email = document.getElementById('c_email').value.trim().toLowerCase();
    const phone = document.getElementById('c_phone').value.trim();
    const reqId = document.getElementById('c_reqId').value;
    const warningDiv = document.getElementById('duplicate-warning');
    
    const duplicateEmail = candidates.some(c => c.id !== editingCandidateId && c.email.toLowerCase() === email && email !== "");
    const duplicatePhone = candidates.some(c => c.id !== editingCandidateId && c.phone === phone && phone !== "");
    const duplicateSubmission = candidates.some(c => c.id !== editingCandidateId && c.email.toLowerCase() === email && c.reqId === reqId && email !== "");
    
    if (duplicateEmail || duplicatePhone || duplicateSubmission) {
        warningDiv.style.display = 'block';
    } else {
        warningDiv.style.display = 'none';
    }
}

// Actions Dropdown Toggle
function toggleActionsDropdown(id) {
    event.stopPropagation();
    document.querySelectorAll('.actions-dropdown').forEach(d => {
        if(d.id !== 'dropdown-' + id) d.classList.remove('show');
    });
    document.getElementById('dropdown-' + id).classList.toggle('show');
}

// Close dropdowns on window click
window.onclick = function() {
    document.querySelectorAll('.actions-dropdown').forEach(d => d.classList.remove('show'));
};

// Requirements CRUD
function handleReqSubmit(e) {
    e.preventDefault();
    const country = document.getElementById('r_country').value;
    const isUS = country === 'US';
    
    // Strict Math Form Validation checks
    const minExp = parseInt(document.getElementById('r_minexp').value || 0);
    const maxExp = parseInt(document.getElementById('r_maxexp').value || 0);
    if (maxExp > 0 && minExp > maxExp) {
        alert("Validation Error: Minimum Experience cannot be greater than Maximum Experience.");
        return;
    }
    
    if (isUS) {
        const bill = parseFloat(document.getElementById('r_us_billrate').value || 0);
        const pay = parseFloat(document.getElementById('r_us_payrate').value || 0);
        if (pay > bill) {
            alert("Validation Error: Recruiter pay rate cannot exceed client billing rate.");
            return;
        }
    }
    
    const reqData = {
        title: document.getElementById('r_title').value,
        client: document.getElementById('r_client').value,
        endClient: document.getElementById('r_endclient').value,
        country: country,
        location: document.getElementById('r_location').value,
        workMode: document.getElementById('r_workmode').value,
        headcount: parseInt(document.getElementById('r_headcount').value),
        priority: document.getElementById('r_priority').value,
        am: document.getElementById('r_am').value,
        bd: document.getElementById('r_bd').value,
        recruiter: document.getElementById('r_recruiter').value,
        lead: document.getElementById('r_lead').value,
        minexp: minExp,
        maxexp: maxExp,
        skills: document.getElementById('r_skills').value,
        jd: document.getElementById('r_jd').value,
        type: isUS ? document.getElementById('r_us_postype').value : document.getElementById('r_in_emptype').value,
        billRate: isUS ? parseFloat(document.getElementById('r_us_billrate').value || 0) : 0,
        payRate: isUS ? parseFloat(document.getElementById('r_us_payrate').value || 0) : 0,
        margin: isUS ? parseFloat(document.getElementById('r_us_margin').value || 0) : 0,
        budget: !isUS ? parseFloat(document.getElementById('r_in_budget').value || 0) : 0,
        noticePeriod: !isUS ? document.getElementById('r_in_notice').value : ''
    };

    if (editingReqId) {
        const req = requirements.find(r => r.id === editingReqId);
        if(req) Object.assign(req, reqData);
        editingReqId = null;
    } else {
        const newReq = Object.assign({
            id: `${country}-${new Date().getFullYear()}-${String(requirements.length + 1).padStart(4, '0')}`,
            status: 'New',
            workStatus: document.getElementById('r_workstatus').value || 'Not Yet Picked Up',
            dateOpened: new Date().toISOString().split('T')[0],
            filled: 0
        }, reqData);
        requirements.push(newReq);
    }
    
    saveData();
    closeModal('reqModal');
    e.target.reset();
}

function editRequirement(reqId) {
    editingReqId = reqId;
    const r = requirements.find(req => req.id === reqId);
    if(r) {
        document.getElementById('r_title').value = r.title;
        document.getElementById('r_client').value = r.client;
        document.getElementById('r_endclient').value = r.endClient || '';
        document.getElementById('r_country').value = r.country;
        document.getElementById('r_workmode').value = r.workMode;
        document.getElementById('r_location').value = r.location;
        document.getElementById('r_headcount').value = r.headcount;
        document.getElementById('r_priority').value = r.priority;
        
        document.getElementById('r_am').value = r.am || '';
        document.getElementById('r_bd').value = r.bd || '';
        document.getElementById('r_recruiter').value = r.recruiter || '';
        document.getElementById('r_lead').value = r.lead || '';
        document.getElementById('r_workstatus').value = r.workStatus || 'Not Yet Picked Up';
        
        document.getElementById('r_minexp').value = r.minexp || '';
        document.getElementById('r_maxexp').value = r.maxexp || '';
        document.getElementById('r_skills').value = r.skills || '';
        document.getElementById('r_jd').value = r.jd || '';
        
        toggleCountryFields();
        if(r.country === 'US') {
            document.getElementById('r_us_postype').value = r.type;
            document.getElementById('r_us_billrate').value = r.billRate;
            document.getElementById('r_us_payrate').value = r.payRate;
            document.getElementById('r_us_margin').value = r.margin;
        } else {
            document.getElementById('r_in_emptype').value = r.type;
            document.getElementById('r_in_budget').value = r.budget;
            document.getElementById('r_in_notice').value = r.noticePeriod || '';
        }
        
        openModal('reqModal');
    }
}

function duplicateRequirement(reqId) {
    const r = requirements.find(req => req.id === reqId);
    if(r) {
        const country = r.country;
        const newReq = Object.assign({}, r, {
            id: `${country}-${new Date().getFullYear()}-${String(requirements.length + 1).padStart(4, '0')}`,
            dateOpened: new Date().toISOString().split('T')[0],
            filled: 0,
            status: 'New',
            workStatus: 'Not Yet Picked Up'
        });
        requirements.push(newReq);
        saveData();
        alert(`Requirement duplicated as ${newReq.id}`);
    }
}

function deleteRequirement(reqId) {
    if(confirm(`Are you absolutely sure you want to delete requirement ${reqId}? This will remove it permanently.`)) {
        requirements = requirements.filter(r => r.id !== reqId);
        saveData();
    }
}

// Requirement Closure Wizard triggers
function openClosureModal(reqId) {
    document.getElementById('c_closeReqId').value = reqId;
    openModal('closureModal');
}

function openHistoryModal(canId) {
    const can = candidates.find(c => c.id === canId);
    if(can) {
        document.getElementById('history-candidate-name').innerText = `${can.name} (${can.id})`;
        const container = document.getElementById('history-timeline-container');
        container.innerHTML = '';
        
        const history = can.history || [];
        history.forEach(h => {
            const ev = document.createElement('div');
            ev.className = 'timeline-event';
            
            let markerClass = '';
            if (h.stage === 'Joined') markerClass = 'joined';
            else if (h.stage === 'Rejected' || h.stage === 'Candidate Withdrew') markerClass = 'rejected';
            
            ev.innerHTML = `
                <div class="timeline-marker ${markerClass}"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${h.stage}</div>
                    <div class="timeline-date">${h.date}</div>
                    <div class="timeline-desc">${h.comment}</div>
                </div>
            `;
            container.appendChild(ev);
        });
        openModal('historyModal');
    }
}

function openReqDetailsModal(reqId) {
    const r = requirements.find(req => req.id === reqId);
    if (r) {
        const age = Math.floor((new Date() - new Date(r.dateOpened)) / (1000 * 60 * 60 * 24));
        const rateDetails = r.country === 'US' ? `
            <p><strong>Employment Type:</strong> ${r.type}</p>
            <p><strong>Billing Rate:</strong> $${r.billRate}/hr</p>
            <p><strong>Pay Rate:</strong> $${r.payRate}/hr</p>
            <p><strong>Margin:</strong> $${r.margin}/hr</p>
        ` : `
            <p><strong>Employment Type:</strong> ${r.type}</p>
            <p><strong>Max Budget:</strong> ${r.budget} LPA</p>
            <p><strong>Notice Period Required:</strong> ${r.noticePeriod || 'N/A'}</p>
        `;
        
        document.getElementById('req-details-content').innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                <div>
                    <p><strong>Requirement ID:</strong> ${r.id}</p>
                    <p><strong>Job Title:</strong> ${r.title}</p>
                    <p><strong>Client Name:</strong> ${r.client}</p>
                    <p><strong>End Client:</strong> ${r.endClient || 'Direct'}</p>
                    <p><strong>Location:</strong> ${r.location} (${r.workMode})</p>
                </div>
                <div>
                    <p><strong>Priority Level:</strong> <span class="badge ${r.priority === 'Critical' ? 'rejected' : 'pending'}">${r.priority}</span></p>
                    <p><strong>Headcount Target:</strong> ${r.filled} / ${r.headcount} Filled</p>
                    <p><strong>Job Status:</strong> ${r.status} (${r.workStatus || 'Active Sourcing'})</p>
                    <p><strong>Open Age:</strong> ${age} Days ago (Opened: ${r.dateOpened})</p>
                </div>
            </div>
            <div style="border-top:1.5px solid var(--border); padding-top:15px; margin-bottom:15px;">
                <h4 style="margin-bottom:8px; color:var(--primary);">Compensation & Contract Metrics</h4>
                ${rateDetails}
            </div>
            <div style="border-top:1.5px solid var(--border); padding-top:15px; margin-bottom:15px;">
                <h4 style="margin-bottom:8px; color:var(--primary);">Experience & Skills Required</h4>
                <p><strong>Experience Level:</strong> ${r.minexp || '0'} - ${r.maxexp || 'Any'} Years</p>
                <p><strong>Target Skills:</strong> ${r.skills || 'N/A'}</p>
            </div>
            <div style="border-top:1.5px solid var(--border); padding-top:15px;">
                <h4 style="margin-bottom:8px; color:var(--primary);">Full Job Description (JD)</h4>
                <pre style="white-space: pre-wrap; font-family:inherit; background:var(--bg-light); padding:10px; border-radius:6px; font-size:0.85rem; border:1px solid var(--border);">${r.jd || 'No description supplied.'}</pre>
            </div>
        `;
        openModal('reqDetailsModal');
    }
}

function openCandidateDetailsModal(canId) {
    const can = candidates.find(c => c.id === canId);
    if(can) {
        document.getElementById('candidate-details-content').innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                <div>
                    <p><strong>Candidate ID:</strong> ${can.id}</p>
                    <p><strong>Full Name:</strong> ${can.name}</p>
                    <p><strong>Email Address:</strong> ${can.email}</p>
                    <p><strong>Phone Contact:</strong> ${can.phone}</p>
                </div>
                <div>
                    <p><strong>Target Country:</strong> <span class="badge active">${can.country || 'US'}</span></p>
                    <p><strong>Current Pipeline Stage:</strong> <span class="badge ${getBadgeClass(can.stage)}">${can.stage}</span></p>
                    <p><strong>Visa / Work Auth:</strong> ${can.visa || 'N/A'}</p>
                    <p><strong>Notice Period:</strong> ${can.notice || 'Immediate'}</p>
                </div>
            </div>
            <div style="border-top:1.5px solid var(--border); padding-top:15px; margin-bottom:15px;">
                <p><strong>Submitted to Requisition:</strong> <span style="color:var(--primary); font-weight:bold; cursor:pointer;" onclick="closeModal('candidateDetailsModal'); openReqDetailsModal('${can.reqId}')">${can.reqId} ➔</span></p>
                <p><strong>Candidate Source:</strong> ${can.source || 'Referral'}</p>
                <p><strong>Profile Last Updated:</strong> ${can.lastUpdated}</p>
            </div>
            <div style="border-top:1.5px solid var(--border); padding-top:15px;">
                <h4 style="margin-bottom:8px; color:var(--primary);">Transition & Audit Journey</h4>
                <div class="timeline" style="max-height: 250px; overflow-y: auto;">
                    ${(can.history || []).map(h => `
                        <div class="timeline-event" style="margin-bottom:12px;">
                            <div class="timeline-marker" style="width:12px; height:12px; left:15px;"></div>
                            <div class="timeline-content" style="padding:8px;">
                                <div class="timeline-title" style="font-size:0.8rem;">${h.stage}</div>
                                <div style="font-size:0.7rem; color:var(--text-light);">${h.date}</div>
                                <div style="font-size:0.75rem; color:var(--text-dark);">${h.comment}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        openModal('candidateDetailsModal');
    }
}

function openClientDetailsModal(clientName) {
    const clientReqs = requirements.filter(r => r.client.toLowerCase() === clientName.toLowerCase());
    const clientJobsCount = clientReqs.length;
    const activeJobsCount = clientReqs.filter(r => ['Active', 'New'].includes(r.status)).length;
    
    // Aggregate financial metrics
    let totalBill = 0, totalPay = 0, totalMargin = 0;
    clientReqs.forEach(r => {
        if (r.country === 'US') {
            totalBill += r.billRate;
            totalPay += r.payRate;
            totalMargin += r.margin;
        }
    });

    const clientCans = candidates.filter(c => {
        const req = requirements.find(r => r.id === c.reqId);
        return req && req.client.toLowerCase() === clientName.toLowerCase();
    });

    const financeSection = currentRole === 'Recruiter' ? '' : `
        <div style="border-top:1.5px solid var(--border); padding-top:15px; margin-bottom:15px;">
            <h4 style="margin-bottom:8px; color:var(--primary);">Accumulated Hourly Margins (US Reqs Only)</h4>
            <p><strong>Combined Bill Rate:</strong> $${totalBill.toFixed(2)}/hr</p>
            <p><strong>Combined Pay Rate:</strong> $${totalPay.toFixed(2)}/hr</p>
            <p><strong>Combined Hourly Net Margin:</strong> <strong style="color:var(--success)">$${totalMargin.toFixed(2)}/hr</strong></p>
        </div>
    `;

    document.getElementById('client-details-content').innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
            <div>
                <p><strong>Client Account:</strong> ${clientName}</p>
                <p><strong>Total Requisitions:</strong> ${clientJobsCount}</p>
                <p><strong>Active Requisitions:</strong> ${activeJobsCount}</p>
            </div>
            <div>
                <p><strong>Total Candidate Submissions:</strong> ${clientCans.length}</p>
                <p><strong>Active Pipeline Stages:</strong> ${clientCans.filter(c => !['Joined','Rejected'].includes(c.stage)).length} Sourced/Scheduled</p>
            </div>
        </div>
        ${financeSection}
        <div style="border-top:1.5px solid var(--border); padding-top:15px; margin-bottom:15px;">
            <h4 style="margin-bottom:8px; color:var(--primary);">Requisition Roster</h4>
            <div style="max-height: 150px; overflow-y:auto;">
                <table style="font-size:0.8rem; min-width: 100%;">
                    <thead>
                        <tr>
                            <th>Job ID</th>
                            <th>Title</th>
                            <th>Priority</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientReqs.map(r => `
                            <tr>
                                <td><span style="color:var(--primary); cursor:pointer; font-weight:bold;" onclick="closeModal('clientDetailsModal'); openReqDetailsModal('${r.id}')">${r.id}</span></td>
                                <td>${r.title}</td>
                                <td>${r.priority}</td>
                                <td>${r.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div style="border-top:1.5px solid var(--border); padding-top:15px;">
            <h4 style="margin-bottom:8px; color:var(--primary);">Sourcing Pool Roster</h4>
            <div style="max-height: 150px; overflow-y:auto;">
                <table style="font-size:0.8rem; min-width: 100%;">
                    <thead>
                        <tr>
                            <th>Candidate</th>
                            <th>Req ID</th>
                            <th>Stage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientCans.map(c => `
                            <tr>
                                <td><span style="color:var(--primary); cursor:pointer; font-weight:bold;" onclick="closeModal('clientDetailsModal'); openCandidateDetailsModal('${c.id}')">${c.name}</span></td>
                                <td>${c.reqId}</td>
                                <td><span class="badge ${getBadgeClass(c.stage)}" style="font-size:0.65rem; padding:2px 6px;">${c.stage}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    openModal('clientDetailsModal');
}

function handleClosureSubmit(e) {
    e.preventDefault();
    const reqId = document.getElementById('c_closeReqId').value;
    const status = document.getElementById('c_closeStatus').value;
    const reason = document.getElementById('c_closeReason').value;
    const feedback = document.getElementById('c_closeFeedback').value;
    
    const req = requirements.find(r => r.id === reqId);
    if(req) {
        req.status = status;
        req.closureReason = reason;
        req.closureFeedback = feedback;
        req.closureDate = new Date().toISOString().split('T')[0];
    }
    saveData();
    closeModal('closureModal');
    e.target.reset();
}

// Clickable Aging Filter Trigger
function filterRequirementsByAge(minDays, maxDays) {
    reqAgeFilterMin = minDays;
    reqAgeFilterMax = maxDays;
    
    switchView('requirements');
}

// Candidates CRUD
function openCandidateModal() {
    const reqSelect = document.getElementById('c_reqId');
    reqSelect.innerHTML = '<option value="">Select Requirement...</option>' + 
        requirements.map(r => `<option value="${r.id}">${r.id} - ${r.title} (${r.client})</option>`).join('');
    openModal('candidateModal');
}

function handleCandidateSubmit(e) {
    e.preventDefault();
    const country = document.getElementById('c_country').value;
    
    const canData = {
        name: `${document.getElementById('c_firstname').value} ${document.getElementById('c_lastname').value}`,
        email: document.getElementById('c_email').value,
        phone: document.getElementById('c_phone').value,
        reqId: document.getElementById('c_reqId').value,
        source: document.getElementById('c_source').value,
        visa: document.getElementById('c_visa').value,
        notice: document.getElementById('c_notice').value,
        country: country,
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingCandidateId) {
        const can = candidates.find(c => c.id === editingCandidateId);
        if (can) {
            Object.assign(can, canData);
            if (!can.history) can.history = [];
            can.history.push({ stage: can.stage, date: new Date().toISOString().split('T')[0], comment: 'Candidate details edited' });
        }
        editingCandidateId = null;
    } else {
        const newCan = Object.assign({
            id: `CAN-${new Date().getFullYear()}-${String(candidates.length + 1).padStart(4, '0')}`,
            stage: 'Sourced',
            history: [{ stage: 'Sourced', date: new Date().toISOString().split('T')[0], comment: 'Candidate registered' }]
        }, canData);
        candidates.push(newCan);
    }
    
    saveData();
    closeModal('candidateModal');
    e.target.reset();
    document.getElementById('duplicate-warning').style.display = 'none';
}

function editCandidate(canId) {
    editingCandidateId = canId;
    const can = candidates.find(c => c.id === canId);
    if(can) {
        // Split name
        const names = can.name.split(' ');
        document.getElementById('c_firstname').value = names[0] || '';
        document.getElementById('c_lastname').value = names.slice(1).join(' ') || '';
        document.getElementById('c_email').value = can.email;
        document.getElementById('c_phone').value = can.phone;
        
        // Populate requirements dropdown
        const reqSelect = document.getElementById('c_reqId');
        reqSelect.innerHTML = '<option value="">Select Requirement...</option>' + 
            requirements.map(r => `<option value="${r.id}">${r.id} - ${r.title} (${r.client})</option>`).join('');
        reqSelect.value = can.reqId;
        
        document.getElementById('c_visa').value = can.visa || '';
        document.getElementById('c_notice').value = can.notice || '';
        document.getElementById('c_source').value = can.source;
        document.getElementById('c_country').value = can.country || 'US';
        
        openModal('candidateModal');
    }
}

function deleteCandidate(canId) {
    if(confirm(`Are you absolutely sure you want to delete candidate ${canId}? This is permanent.`)) {
        candidates = candidates.filter(c => c.id !== canId);
        saveData();
    }
}

// Update Stage & Validate Inputs (Section 10)
function openStageModal(canId) {
    document.getElementById('s_candidateId').value = canId;
    const can = candidates.find(c => c.id === canId);
    if(can) {
        document.getElementById('s_newStage').value = can.stage;
        toggleStageFields();
    }
    openModal('stageModal');
}

function handleStageUpdate(e) {
    e.preventDefault();
    const canId = document.getElementById('s_candidateId').value;
    const newStage = document.getElementById('s_newStage').value;
    const comment = document.getElementById('s_comments').value || 'Stage updated';
    const can = candidates.find(c => c.id === canId);
    
    if (can) {
        // Validation Checks
        if (newStage === 'Submitted to Client' && (!document.getElementById('s_submitRate').value || !document.getElementById('s_availability').value)) {
            alert("Submitted compensation rate and availability are required for Client Submission.");
            return;
        }
        if (newStage === 'Interview Scheduled' && (!document.getElementById('s_interviewDate').value || !document.getElementById('s_timezone').value || !document.getElementById('s_interviewRound').value)) {
            alert("Interview date, round, and timezone are required to schedule an interview.");
            return;
        }
        if (newStage === 'Offer Released' && (!document.getElementById('s_offerDate').value || !document.getElementById('s_offeredComp').value || !document.getElementById('s_expectJoin').value)) {
            alert("Offer date, offered compensation, and expected joining date are required to release an offer.");
            return;
        }
        if (newStage === 'Joined' && (!document.getElementById('s_actualJoin').value || !document.getElementById('s_finalComp').value)) {
            alert("Actual joining date and final agreed compensation are required to confirm onboarding.");
            return;
        }
        if (newStage === 'Rejected' && !document.getElementById('s_rejectReason').value) {
            alert("Please supply a rejection reason.");
            return;
        }
        if (newStage === 'Candidate Withdrew' && !document.getElementById('s_withdrawReason').value) {
            alert("Please supply a candidate withdrawal reason.");
            return;
        }

        // Apply state updates
        can.stage = newStage;
        can.lastUpdated = new Date().toISOString().split('T')[0];
        
        let extraComment = "";
        if (newStage === 'Submitted to Client') {
            can.submitRate = document.getElementById('s_submitRate').value;
            can.availability = document.getElementById('s_availability').value;
            extraComment = `Rate: ${can.submitRate}, Avail: ${can.availability}`;
        } else if (newStage === 'Interview Scheduled') {
            can.interviewDate = document.getElementById('s_interviewDate').value;
            can.interviewRound = document.getElementById('s_interviewRound').value;
            can.interviewTimezone = document.getElementById('s_timezone').value;
            can.interviewMode = document.getElementById('s_interviewMode').value;
            extraComment = `Round: ${can.interviewRound} on ${new Date(can.interviewDate).toLocaleString()} ${can.interviewTimezone}`;
        } else if (newStage === 'Offer Released') {
            can.offerDate = document.getElementById('s_offerDate').value;
            can.offeredComp = document.getElementById('s_offeredComp').value;
            can.expectedJoining = document.getElementById('s_expectJoin').value;
            can.joiningRisk = document.getElementById('s_joiningrisk').value;
            can.counterDetails = document.getElementById('s_counterdetails').value;
            extraComment = `Comp: ${can.offeredComp}, Joining: ${can.expectedJoining}, Risk: ${can.joiningRisk}`;
        } else if (newStage === 'Joined') {
            can.actualJoining = document.getElementById('s_actualJoin').value;
            can.finalComp = document.getElementById('s_finalComp').value;
            extraComment = `Onboarded on ${can.actualJoining} with comp ${can.finalComp}`;
            
            const req = requirements.find(r => r.id === can.reqId);
            if (req) {
                req.filled = (req.filled || 0) + 1;
                if (req.filled >= req.headcount) {
                    req.status = 'Filled';
                }
            }
        } else if (newStage === 'Rejected') {
            can.rejectionReason = document.getElementById('s_rejectReason').value;
            extraComment = `Reason: ${can.rejectionReason}`;
        } else if (newStage === 'Candidate Withdrew') {
            can.withdrawalReason = document.getElementById('s_withdrawReason').value;
            extraComment = `Reason: ${can.withdrawalReason}`;
        }

        if(!can.history) can.history = [];
        can.history.push({ stage: newStage, date: new Date().toISOString().split('T')[0], comment: comment + (extraComment ? ` (${extraComment})` : "") });
    }
    saveData();
    closeModal('stageModal');
    e.target.reset();
}

// Work Log Handlers
function openWorklogModal(reqId) {
    document.getElementById('w_reqId').value = reqId;
    openModal('worklogModal');
}

function handleWorklogSubmit(e) {
    e.preventDefault();
    const newLog = {
        date: new Date().toISOString().split('T')[0],
        reqId: document.getElementById('w_reqId').value,
        recruiter: document.getElementById('w_recruiter').value,
        activity: document.getElementById('w_activity').value,
        sourced: parseInt(document.getElementById('w_sourced').value || 0),
        screened: parseInt(document.getElementById('w_screened').value || 0),
        submitted: parseInt(document.getElementById('w_submitted').value || 0),
        challenges: document.getElementById('w_challenges').value
    };
    worklogs.push(newLog);
    saveData();
    closeModal('worklogModal');
    e.target.reset();
}

function switchCandidateTab(tab) {
    currentCandidateTab = tab;
    
    const btnAll = document.getElementById('btn-can-all');
    const btnUs = document.getElementById('btn-can-us');
    const btnIn = document.getElementById('btn-can-in');
    
    if(btnAll && btnUs && btnIn) {
        btnAll.classList.toggle('btn-outline', tab !== 'All');
        btnUs.classList.toggle('btn-outline', tab !== 'US');
        btnIn.classList.toggle('btn-outline', tab !== 'IN');
    }
    
    updateAllViews();
}

// Access Control Logic
function changeRole(role) {
    currentRole = role;
    saveData();
}

function applyRolePermissions() {
    document.querySelectorAll('.nav-item').forEach(nav => {
        const allowedRoles = nav.getAttribute('data-role-visible').split(',');
        nav.style.display = allowedRoles.includes(currentRole) ? 'flex' : 'none';
    });

    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && activeNav.style.display === 'none') {
        const dbNav = document.querySelector('.nav-item[onclick*="dashboard"]');
        if (dbNav) dbNav.click();
    }

    document.querySelectorAll('[data-role-hide]').forEach(el => {
        const hiddenRoles = el.getAttribute('data-role-hide').split(',');
        el.style.display = hiddenRoles.includes(currentRole) ? 'none' : 'block';
    });
}

// Render Views
function updateAllViews() {
    applyRolePermissions();
    renderRequirements();
    renderUSRequirements();
    renderINRequirements();
    renderCandidates();
    renderInterviews();
    renderOffers();
    renderPerformance();
    renderClients();
    updateDashboard();
    calculateReportsTAT();
    
    // Update nav badges
    document.getElementById('nav-req-count').innerText = requirements.length;
    document.getElementById('nav-us-count').innerText = requirements.filter(r => r.country === 'US').length;
    document.getElementById('nav-in-count').innerText = requirements.filter(r => r.country === 'IN').length;
    document.getElementById('nav-can-count').innerText = candidates.length;
    document.getElementById('nav-int-count').innerText = candidates.filter(c => c.stage.includes('Interview')).length;
    document.getElementById('nav-off-count').innerText = candidates.filter(c => c.stage === 'Offer Released' || c.stage === 'Joined').length;
}

function getBadgeClass(status) {
    const s = status.toLowerCase();
    if (['active', 'joined'].includes(s)) return 'active';
    if (['pending', 'stalled', 'sourced', 'new'].includes(s)) return 'pending';
    if (['filled', 'closed', 'rejected', 'lost'].includes(s)) return 'closed';
    if (s.includes('interview')) return 'interview';
    if (s.includes('offer')) return 'offer';
    return 'pending';
}

function renderRequirements() {
    const tbody = document.getElementById('req-table');
    if(!tbody) return;
    const search = (document.getElementById('searchReq')?.value || '').toLowerCase();
    const filter = document.getElementById('filterCountry')?.value || 'All';
    
    tbody.innerHTML = '';
    requirements.filter(req => {
        const matchesSearch = req.title.toLowerCase().includes(search) || req.id.toLowerCase().includes(search) || req.client.toLowerCase().includes(search);
        const matchesCountry = filter === 'All' || req.country === filter;
        
        const age = Math.floor((new Date() - new Date(req.dateOpened)) / (1000 * 60 * 60 * 24));
        let matchesAge = true;
        if(reqAgeFilterMin !== null && reqAgeFilterMax !== null) {
            matchesAge = age >= reqAgeFilterMin && age <= reqAgeFilterMax;
        }
        
        return matchesSearch && matchesCountry && matchesAge;
    }).forEach(req => {
        const age = Math.floor((new Date() - new Date(req.dateOpened)) / (1000 * 60 * 60 * 24));
        const slaExceeded = age > appSettings.sla;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openReqDetailsModal('${req.id}')">${req.id}</strong></td>
            <td>${req.title}<br><small style="color:var(--text-light)">${req.client} (End: ${req.endClient || 'N/A'})</small></td>
            <td>${req.location} (${req.workMode})</td>
            <td>${req.priority}</td>
            <td>${req.filled || 0} / ${req.headcount}</td>
            <td>
                ${age} days 
                ${slaExceeded ? '<span class="badge" style="background:var(--danger-light); color:var(--danger); font-size:0.65rem; padding:2px 6px;">⚠️ SLA</span>' : ''}
            </td>
            <td>
                <span class="badge ${getBadgeClass(req.status)}">${req.status}</span>
                ${getReqInactivityDays(req.id, req.dateOpened) > appSettings.inactivity && ['Active', 'New'].includes(req.status) ? '<span class="badge" style="background:var(--warning-light); color:var(--warning); font-size:0.65rem; padding:2px 6px;">⚠️ Inactive</span>' : ''}
                <br><small style="font-size:0.75rem; color:var(--text-light);">${req.workStatus || 'Not Started'}</small>
            </td>
            <td class="actions-cell">
                <span class="actions-menu-btn" onclick="toggleActionsDropdown('${req.id}')">Actions ▾</span>
                <div class="actions-dropdown" id="dropdown-${req.id}">
                    <div class="actions-item" onclick="editRequirement('${req.id}')" ${currentRole === 'Recruiter' ? 'style="display:none;"' : ''}>Edit Job</div>
                    <div class="actions-item" onclick="openWorklogModal('${req.id}')" ${currentRole === 'Account Manager' ? 'style="display:none;"' : ''}>Log Activity</div>
                    <div class="actions-item" onclick="duplicateRequirement('${req.id}')" ${currentRole === 'Recruiter' ? 'style="display:none;"' : ''}>Duplicate</div>
                    <div class="actions-item" onclick="openClosureModal('${req.id}')" ${currentRole === 'Recruiter' ? 'style="display:none;"' : ''} style="color:var(--danger)">Close Job</div>
                    <div class="actions-item" onclick="deleteRequirement('${req.id}')" ${currentRole === 'Recruiter' ? 'style="display:none;"' : ''} style="color:var(--danger); font-weight:600;">Delete</div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUSRequirements() {
    const tbody = document.getElementById('us-req-table');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const usReqs = requirements.filter(r => r.country === 'US');
    document.getElementById('kpi-us-w2').innerText = usReqs.filter(r => r.type === 'W2').length;
    document.getElementById('kpi-us-c2c').innerText = usReqs.filter(r => r.type === 'C2C').length;
    document.getElementById('kpi-us-active').innerText = usReqs.filter(r => r.status === 'Active' || r.status === 'New').length;

    usReqs.forEach(req => {
        const age = Math.floor((new Date() - new Date(req.dateOpened)) / (1000 * 60 * 60 * 24));
        const slaExceeded = age > appSettings.sla;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openReqDetailsModal('${req.id}')">${req.id}</strong></td>
            <td>${req.title}<br><small style="color:var(--text-light)">${req.client}</small></td>
            <td>${req.location}</td>
            <td>${req.type}</td>
            <td>
                $${req.billRate}/hr
                <br><small style="color: ${req.margin < (appSettings.minMargin || 15) ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">Margin: $${req.margin}/hr</small>
            </td>
            <td>$${req.payRate}/hr ${slaExceeded ? '<span class="badge" style="background:var(--danger-light); color:var(--danger); font-size:0.65rem; padding:2px 6px;">SLA</span>' : ''}</td>
            <td>
                <span class="badge ${getBadgeClass(req.status)}">${req.status}</span>
                ${getReqInactivityDays(req.id, req.dateOpened) > appSettings.inactivity && ['Active', 'New'].includes(req.status) ? '<span class="badge" style="background:var(--warning-light); color:var(--warning); font-size:0.65rem; padding:2px 6px;">Inactive</span>' : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderINRequirements() {
    const tbody = document.getElementById('in-req-table');
    if(!tbody) return;
    tbody.innerHTML = '';

    const inReqs = requirements.filter(r => r.country === 'IN');
    document.getElementById('kpi-in-perm').innerText = inReqs.filter(r => r.type === 'Permanent').length;
    document.getElementById('kpi-in-contract').innerText = inReqs.filter(r => r.type === 'Contract').length;
    document.getElementById('kpi-in-active').innerText = inReqs.filter(r => r.status === 'Active' || r.status === 'New').length;

    inReqs.forEach(req => {
        const age = Math.floor((new Date() - new Date(req.dateOpened)) / (1000 * 60 * 60 * 24));
        const slaExceeded = age > appSettings.sla;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openReqDetailsModal('${req.id}')">${req.id}</strong></td>
            <td>${req.title}<br><small style="color:var(--text-light)">${req.client}</small></td>
            <td>${req.location}</td>
            <td>${req.type}</td>
            <td>${req.budget} LPA ${slaExceeded ? '<span class="badge" style="background:var(--danger-light); color:var(--danger); font-size:0.65rem; padding:2px 6px;">SLA</span>' : ''}</td>
            <td>
                <span class="badge ${getBadgeClass(req.status)}">${req.status}</span>
                ${getReqInactivityDays(req.id, req.dateOpened) > appSettings.inactivity && ['Active', 'New'].includes(req.status) ? '<span class="badge" style="background:var(--warning-light); color:var(--warning); font-size:0.65rem; padding:2px 6px;">Inactive</span>' : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCandidates() {
    const tbody = document.getElementById('candidate-table');
    if(!tbody) return;
    const search = (document.getElementById('searchCan')?.value || '').toLowerCase();
    const filterStage = document.getElementById('filterStage')?.value || 'All';
    
    tbody.innerHTML = '';
    candidates.filter(can => {
        const matchesSearch = can.name.toLowerCase().includes(search) || can.email.toLowerCase().includes(search);
        const matchesStage = filterStage === 'All' || can.stage === filterStage;
        const matchesCountry = currentCandidateTab === 'All' || (can.country || 'US') === currentCandidateTab;
        return matchesSearch && matchesStage && matchesCountry;
    }).forEach(can => {
        const historyText = can.history ? can.history.map(h => `${h.date}: ${h.stage} (${h.comment})`).join(' | ') : 'No history';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${can.id}</td>
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openCandidateDetailsModal('${can.id}')">${can.name}</strong><br><small style="color:var(--text-light)">${can.email} | ${can.phone}</small></td>
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openReqDetailsModal('${can.reqId}')">${can.reqId}</strong> <span class="badge ${getBadgeClass(can.country === 'IN' ? 'joined' : 'active')}" style="padding: 2px 6px; font-size: 0.65rem;">${can.country || 'US'}</span></td>
            <td>${can.source}</td>
            <td><span class="badge ${getBadgeClass(can.stage)}">${can.stage}</span><br><small style="font-size:0.75rem; color:var(--primary); cursor:pointer; font-weight:600;" onclick="openHistoryModal('${can.id}')">History (${can.history ? can.history.length : 0}) ➔</small></td>
            <td>${can.lastUpdated}</td>
            <td class="actions-cell">
                <span class="actions-menu-btn" onclick="toggleActionsDropdown('${can.id}')">Actions ▾</span>
                <div class="actions-dropdown" id="dropdown-${can.id}">
                    <div class="actions-item" onclick="openCandidateDetailsModal('${can.id}')">View Profile</div>
                    <div class="actions-item" onclick="openStageModal('${can.id}')">Update Stage</div>
                    <div class="actions-item" onclick="editCandidate('${can.id}')" ${currentRole === 'Recruiter' ? 'style="display:none;"' : ''}>Edit Info</div>
                    <div class="actions-item" onclick="deleteCandidate('${can.id}')" ${currentRole === 'Recruiter' ? 'style="display:none;"' : ''} style="color:var(--danger)">Delete</div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderInterviews() {
    const tbody = document.getElementById('interview-table');
    if(!tbody) return;
    tbody.innerHTML = '';
    candidates.filter(c => c.stage.includes('Interview')).forEach(can => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${can.name}</strong></td>
            <td>${can.reqId}</td>
            <td>${can.interviewDate ? new Date(can.interviewDate).toLocaleString() : 'Not Set'} ${can.interviewTimezone || ''}</td>
            <td>${can.interviewRound || '-'} (${can.interviewMode || '-'})</td>
            <td><span class="badge interview">${can.stage}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderOffers() {
    const tbody = document.getElementById('offers-onboarding-table');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const outstandingOffers = candidates.filter(c => c.stage === 'Offer Released');
    const atRiskOffers = outstandingOffers.filter(c => ['Medium', 'High'].includes(c.joiningRisk));
    
    // Calculate pending margin sum
    let pendingMargin = 0;
    outstandingOffers.forEach(c => {
        const req = requirements.find(r => r.id === c.reqId);
        if (req && req.country === 'US') {
            pendingMargin += (req.margin || 0);
        }
    });

    const outstandingKpi = document.getElementById('kpi-off-outstanding');
    const atRiskKpi = document.getElementById('kpi-off-at-risk');
    const marginKpi = document.getElementById('kpi-off-margin-pipeline');
    
    if(outstandingKpi) outstandingKpi.innerText = outstandingOffers.length;
    if(atRiskKpi) atRiskKpi.innerText = atRiskOffers.length;
    if(marginKpi) marginKpi.innerText = `$${pendingMargin.toFixed(2)}/hr`;

    // Render Risk roster list
    const riskRoster = document.getElementById('onboarding-risk-roster');
    if (riskRoster) {
        if (atRiskOffers.length === 0) {
            riskRoster.innerHTML = '<div style="color:var(--text-light); padding:10px 0;">No outstanding counter-offer risks.</div>';
        } else {
            riskRoster.innerHTML = atRiskOffers.map(can => `
                <div style="border-bottom:1.5px solid var(--border); padding: 8px 0; line-height: 1.4;">
                    👤 <strong>${can.name}</strong> (<span style="color:var(--danger); font-weight:bold;">${can.joiningRisk} Risk</span>)<br>
                    <small><strong>Job:</strong> ${can.reqId} | <strong>Notice:</strong> ${can.notice || 'N/A'}</small><br>
                    <small style="color:hsl(220, 9%, 30%)"><strong>Counter Info:</strong> ${can.counterDetails || 'No feedback logged.'}</small>
                </div>
            `).join('');
        }
    }

    candidates.filter(c => c.stage === 'Offer Released' || c.stage === 'Joined').forEach(can => {
        const risk = can.joiningRisk ? can.joiningRisk : 'Low';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openCandidateDetailsModal('${can.id}')">${can.name}</strong></td>
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openReqDetailsModal('${can.reqId}')">${can.reqId}</strong></td>
            <td>${can.offerDate || '-'}</td>
            <td>${currentRole === 'Recruiter' ? 'Confidential' : (can.offeredComp || '-')}</td>
            <td>${can.expectedJoining || '-'}</td>
            <td><span class="badge ${getBadgeClass(can.stage)}">${can.stage}</span><br><small style="color:var(--danger)">Risk: ${risk}</small></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPerformance() {
    const filter = document.getElementById('filterRecruiter')?.value || 'All';
    const tbody = document.getElementById('worklog-table');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filteredLogs = worklogs.filter(log => filter === 'All' || log.recruiter === filter);
    filteredLogs.reverse().forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.date}</td>
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openReqDetailsModal('${log.reqId}')">${log.reqId}</strong></td>
            <td>${log.recruiter}</td>
            <td>${log.activity}</td>
            <td>${log.sourced}</td>
            <td>${log.screened}</td>
            <td>${log.submitted}</td>
        `;
        tbody.appendChild(tr);
    });

    // Compute Recruiter Cumulative Leaderboard
    const leaderboardBody = document.getElementById('recruiter-leaderboard-table');
    if (leaderboardBody) {
        leaderboardBody.innerHTML = '';
        
        // Find list of recruiters
        const recruitersList = ["Recruiter A", "Recruiter B", "Recruiter C"];
        const stats = {};
        recruitersList.forEach(rec => {
            stats[rec] = { sourced: 0, screened: 0, submitted: 0, interviews: 0, joined: 0, totalTatDays: 0 };
        });

        // Sum up from worklogs
        worklogs.forEach(log => {
            if (stats[log.recruiter]) {
                stats[log.recruiter].sourced += (log.sourced || 0);
                stats[log.recruiter].screened += (log.screened || 0);
                stats[log.recruiter].submitted += (log.submitted || 0);
            }
        });

        // Sum up from candidates (Interviews and Placements)
        candidates.forEach(can => {
            // Find recruiter assigned to this candidate's req
            const req = requirements.find(r => r.id === can.reqId);
            if (req && req.recruiter && stats[req.recruiter]) {
                if (can.stage.includes('Interview')) {
                    stats[req.recruiter].interviews += 1;
                }
                if (can.stage === 'Joined') {
                    stats[req.recruiter].joined += 1;
                    
                    // Compute individual candidate TAT
                    const openDate = new Date(req.dateOpened);
                    const joinDate = can.expectedJoining ? new Date(can.expectedJoining) : new Date(can.lastUpdated);
                    const diffTime = Math.abs(joinDate - openDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    stats[req.recruiter].totalTatDays += diffDays;
                }
            }
        });

        // Render rows sorted by placements (Joined)
        Object.keys(stats).sort((a,b) => stats[b].joined - stats[a].joined).forEach(rec => {
            const s = stats[rec];
            const ratio = s.sourced > 0 ? Math.round((s.joined / s.sourced) * 100) : 0;
            const avgTat = s.joined > 0 ? `${(s.totalTatDays / s.joined).toFixed(1)} Days` : 'N/A';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${rec}</strong></td>
                <td>${s.sourced}</td>
                <td>${s.screened}</td>
                <td>${s.submitted}</td>
                <td>${s.interviews}</td>
                <td><strong style="color:var(--success)">${s.joined}</strong></td>
                <td><strong>${ratio}%</strong></td>
                <td style="font-weight:600; color:var(--primary);">${avgTat}</td>
            `;
            leaderboardBody.appendChild(tr);
        });
    }

    const subCount = candidates.filter(c => filter === 'All' || c.source.includes(filter) || true).length;
    const intCount = candidates.filter(c => c.stage.includes('Interview')).length;
    const offCount = candidates.filter(c => c.stage.includes('Offer') || c.stage === 'Joined').length;
    const joinCount = candidates.filter(c => c.stage === 'Joined').length;

    const subIntRatio = subCount > 0 ? Math.round((intCount / subCount) * 100) : 0;
    const intOffRatio = intCount > 0 ? Math.round((offCount / intCount) * 100) : 0;
    const offJoinRatio = offCount > 0 ? Math.round((joinCount / offCount) * 100) : 0;

    document.getElementById('kpi-ratio-sub-int').innerText = `${subIntRatio}%`;
    document.getElementById('kpi-ratio-int-off').innerText = `${intOffRatio}%`;
    document.getElementById('kpi-ratio-off-join').innerText = `${offJoinRatio}%`;
}

function renderClients() {
    const tbody = document.getElementById('client-summary-table');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const clientMap = {};
    requirements.forEach(req => {
        if (!clientMap[req.client]) {
            clientMap[req.client] = { reqs: 0, active: 0, headcount: 0, filled: 0, sourced: 0 };
        }
        clientMap[req.client].reqs += 1;
        clientMap[req.client].headcount += req.headcount;
        clientMap[req.client].filled += (req.filled || 0);
        if (req.status === 'Active' || req.status === 'New') clientMap[req.client].active += 1;
    });

    candidates.forEach(can => {
        const req = requirements.find(r => r.id === can.reqId);
        if (req && clientMap[req.client]) {
            clientMap[req.client].sourced += 1;
        }
    });

    Object.keys(clientMap).forEach(name => {
        const c = clientMap[name];
        const fillRatio = c.headcount > 0 ? Math.round((c.filled / c.headcount) * 100) : 0;
        const tr = document.createElement('tr');
        
        let healthBadge = '';
        if (fillRatio >= 50) {
            healthBadge = '<span class="badge active">Healthy</span>';
        } else if (fillRatio >= 20) {
            healthBadge = '<span class="badge pending">At Risk</span>';
        } else {
            healthBadge = '<span class="badge rejected">Needs Attention</span>';
        }

        tr.innerHTML = `
            <td><strong style="color:var(--primary); cursor:pointer;" onclick="openClientDetailsModal('${name}')">${name}</strong></td>
            <td>${c.reqs}</td>
            <td>${c.active}</td>
            <td>${c.headcount}</td>
            <td>${c.sourced}</td>
            <td>${c.filled}</td>
            <td><strong style="color:var(--success)">${fillRatio}%</strong></td>
            <td>${healthBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Add User Role dropdown to layout header automatically and bind toggle
function renderHeaderRoleSwitcher() {
    const header = document.querySelector('.header');
    if (header && !document.getElementById('header-role-selector')) {
        const switcherDiv = document.createElement('div');
        switcherDiv.style.display = 'flex';
        switcherDiv.style.alignItems = 'center';
        switcherDiv.style.gap = '10px';
        switcherDiv.innerHTML = `
            <span class="menu-toggle" onclick="toggleSidebar()">&#9776;</span>
            <small style="color:var(--text-light); font-weight:bold;">View As:</small>
            <select id="header-role-selector" onchange="changeRole(this.value)" style="padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 0.85rem; font-weight: 500;">
                <option value="Management" ${currentRole === 'Management' ? 'selected' : ''}>Management</option>
                <option value="Account Manager" ${currentRole === 'Account Manager' ? 'selected' : ''}>Account Manager</option>
                <option value="Recruiter" ${currentRole === 'Recruiter' ? 'selected' : ''}>Recruiter</option>
            </select>
        `;
        header.insertBefore(switcherDiv, header.firstChild);
    }
}

function getReqInactivityDays(reqId, dateOpened) {
    let latestActivity = new Date(dateOpened);
    
    // Check candidate history transitions for this req
    candidates.forEach(can => {
        if (can.reqId === reqId && can.history) {
            can.history.forEach(h => {
                const hDate = new Date(h.date);
                if (hDate > latestActivity) latestActivity = hDate;
            });
        }
    });

    // Check work logs for this req
    worklogs.forEach(log => {
        if (log.reqId === reqId) {
            const lDate = new Date(log.date);
            if (lDate > latestActivity) latestActivity = lDate;
        }
    });

    const diff = Math.abs(new Date() - latestActivity);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Turnaround Time (TAT) reports computation (Section 21)
function calculateReportsTAT() {
    const closedReqs = requirements.filter(r => ['Closed', 'Filled', 'Lost'].includes(r.status));
    const kpiAvgTat = document.getElementById('kpi-avg-tat');
    if(!kpiAvgTat) return;
    
    if (closedReqs.length === 0) {
        kpiAvgTat.innerText = "0 Days";
        return;
    }
    
    let totalDays = 0;
    closedReqs.forEach(r => {
        const opened = new Date(r.dateOpened);
        const closed = r.closureDate ? new Date(r.closureDate) : new Date(); // fallback to today if closureDate missing
        const diffTime = Math.abs(closed - opened);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
    });
    
    const avg = Math.round(totalDays / closedReqs.length);
    kpiAvgTat.innerText = `${avg} Days`;
}

function updateDashboard() {
    document.getElementById('kpi-total-req').innerText = requirements.length;
    document.getElementById('kpi-active-req').innerText = requirements.filter(r => r.status === 'Active' || r.status === 'New').length;
    document.getElementById('kpi-stalled-req').innerText = requirements.filter(r => r.status === 'Pending' || r.status === 'Stalled').length;
    document.getElementById('kpi-joined').innerText = candidates.filter(c => c.stage === 'Joined').length;
    
    let a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0;
    const bottleneckReasons = {};
    const unassignedJobs = [];
    const zeroSubmissionJobs = [];

    requirements.forEach(req => {
        const age = Math.floor((new Date() - new Date(req.dateOpened)) / (1000 * 60 * 60 * 24));
        if (age <= 3) a1++;
        else if (age <= 7) a2++;
        else if (age <= 15) a3++;
        else if (age <= 30) a4++;
        else a5++;

        const isReqActive = ['Active', 'New'].includes(req.status);
        if (isReqActive) {
            if (!req.recruiter || req.recruiter.trim() === '') {
                unassignedJobs.push(req);
            }
            
            const submissions = candidates.filter(c => c.reqId === req.id).length;
            if (submissions === 0 && age >= 2) {
                zeroSubmissionJobs.push(req);
            }
        }

        if (req.status === 'Stalled' || req.status === 'Pending' || req.workStatus === 'Stalled') {
            const reason = req.priority === 'Critical' ? 'Critical Priority' : 'Bandwidth Shortage';
            bottleneckReasons[reason] = (bottleneckReasons[reason] || 0) + 1;
        }
    });

    document.getElementById('aging-0-3').innerText = a1;
    document.getElementById('aging-4-7').innerText = a2;
    document.getElementById('aging-8-15').innerText = a3;
    document.getElementById('aging-16-30').innerText = a4;
    document.getElementById('aging-30plus').innerText = a5;

    const bList = document.getElementById('bottleneck-list');
    if (Object.keys(bottleneckReasons).length > 0) {
        bList.innerHTML = Object.keys(bottleneckReasons).map(r => `<div>⚠️ <strong>${r}:</strong> ${bottleneckReasons[r]} requirements</div>`).join('');
    } else {
        bList.innerHTML = 'No active bottlenecks identified.';
    }

    // Compute Overdue Interviews
    const overdueInterviews = [];
    const now = new Date();
    candidates.forEach(can => {
        if (can.stage === 'Interview Scheduled' && can.interviewDate) {
            const intDate = new Date(can.interviewDate);
            if (intDate < now) {
                overdueInterviews.push(can);
            }
        }
    });

    // Populate Alerts Container
    const alertsContainer = document.getElementById('management-alerts-container');
    if(alertsContainer) {
        let alertHTML = "";
        
        if (unassignedJobs.length > 0) {
            alertHTML += `<div style="margin-bottom: 5px;">👤 <strong>${unassignedJobs.length} Unassigned Requisitions:</strong> Requisitions [${unassignedJobs.map(j => j.id).join(', ')}] have no recruiter assigned.</div>`;
        }
        if (zeroSubmissionJobs.length > 0) {
            alertHTML += `<div style="margin-bottom: 5px;">⏳ <strong>${zeroSubmissionJobs.length} Zero-Submission Requisitions:</strong> Requisitions [${zeroSubmissionJobs.map(j => j.id).join(', ')}] have been open for >48 hours with no candidates.</div>`;
        }
        
        // Find inactive jobs
        const inactiveJobsList = requirements.filter(r => ['Active', 'New'].includes(r.status) && getReqInactivityDays(r.id, r.dateOpened) > appSettings.inactivity);
        if (inactiveJobsList.length > 0) {
            alertHTML += `<div style="margin-bottom: 5px;">💤 <strong>${inactiveJobsList.length} Inactive Requisitions:</strong> Requisitions [${inactiveJobsList.map(j => j.id).join(', ')}] have received no candidate updates or work logs for >${appSettings.inactivity} days.</div>`;
        }

        if (overdueInterviews.length > 0) {
            alertHTML += `<div>📅 <strong>${overdueInterviews.length} Overdue Interview Feedbacks:</strong> Candidates [${overdueInterviews.map(c => c.name).join(', ')}] have completed scheduled interviews but stage is not updated.</div>`;
        }
        
        if (alertHTML === "") {
            alertsContainer.innerHTML = '✅ All operations running smoothly. No active alerts.';
            alertsContainer.parentElement.style.display = 'none';
        } else {
            alertsContainer.innerHTML = alertHTML;
            alertsContainer.parentElement.style.display = 'block';
        }
    }

    const pTable = document.getElementById('dash-priority-table');
    pTable.innerHTML = '';
    requirements.filter(req => {
        const age = Math.floor((new Date() - new Date(req.dateOpened)) / (1000 * 60 * 60 * 24));
        return req.priority === 'Critical' || age > appSettings.sla;
    }).forEach(req => {
        const age = Math.floor((new Date() - new Date(req.dateOpened)) / (1000 * 60 * 60 * 24));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.id}</td>
            <td>${req.title}</td>
            <td>${req.client}</td>
            <td>${req.location}</td>
            <td style="${age > appSettings.sla ? 'color:var(--danger); font-weight:bold' : ''}">${age}</td>
            <td><span class="badge ${getBadgeClass(req.status)}">${req.status}</span></td>
        `;
        pTable.appendChild(tr);
    });

    renderCharts();
}

// Chart.js Setup
let funnelChart, geoChart, dropoutChart;
function renderCharts() {
    if (typeof Chart === 'undefined') return;
    
    const ctxFunnel = document.getElementById('funnelChart');
    if(ctxFunnel) {
        if(funnelChart) funnelChart.destroy();
        const stages = ['Sourced', 'Screened', 'Interview Scheduled', 'Offer Released', 'Joined'];
        const data = stages.map(st => candidates.filter(c => c.stage.includes(st) || c.stage === 'Joined').length);
        
        funnelChart = new Chart(ctxFunnel, {
            type: 'bar',
            data: {
                labels: stages,
                datasets: [{ label: 'Candidates', data: data, backgroundColor: 'rgba(37, 99, 235, 0.7)' }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
        });
    }

    const ctxGeo = document.getElementById('geoChart');
    if(ctxGeo) {
        if(geoChart) geoChart.destroy();
        const usCount = requirements.filter(r => r.country === 'US').length;
        const inCount = requirements.filter(r => r.country === 'IN').length;
        
        geoChart = new Chart(ctxGeo, {
            type: 'doughnut',
            data: {
                labels: ['US', 'India'],
                datasets: [{ data: [usCount, inCount], backgroundColor: ['#3b82f6', '#10b981'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const ctxDropout = document.getElementById('dropoutChart');
    if(ctxDropout) {
        if(dropoutChart) dropoutChart.destroy();
        
        // Count drop-out reasons
        const reasonsMap = {};
        candidates.forEach(c => {
            if (c.stage === 'Rejected' && c.rejectionReason) {
                reasonsMap[c.rejectionReason] = (reasonsMap[c.rejectionReason] || 0) + 1;
            } else if (c.stage === 'Candidate Withdrew' && c.withdrawalReason) {
                reasonsMap[c.withdrawalReason] = (reasonsMap[c.withdrawalReason] || 0) + 1;
            }
        });
        
        const labels = Object.keys(reasonsMap);
        const data = Object.values(reasonsMap);
        
        if (labels.length === 0) {
            labels.push("No drop-outs logged");
            data.push(1);
        }

        dropoutChart = new Chart(ctxDropout, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// CSV Export Helper
function exportToCSV(filename, headers, rows) {
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(",")].concat(rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportRequirementsCSV() {
    const headers = ["Requirement ID", "Title", "Client", "Country", "Location", "Priority", "Status", "Headcount", "Filled"];
    const rows = requirements.map(r => [r.id, r.title, r.client, r.country, r.location, r.priority, r.status, r.headcount, r.filled]);
    exportToCSV("requirements_report.csv", headers, rows);
}

function exportCandidatesCSV() {
    const headers = ["Candidate ID", "Name", "Email", "Requirement ID", "Current Stage", "Source", "Last Updated"];
    const rows = candidates.map(c => [c.id, c.name, c.email, c.reqId, c.stage, c.source, c.lastUpdated]);
    exportToCSV("candidates_report.csv", headers, rows);
}

// JSON Import & Merge Logic (Section 26)
function importData(overwrite) {
    const fileInput = document.getElementById('importFile');
    if(!fileInput.files.length) {
        alert("Please select a file to import.");
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.requirements || !data.candidates) {
                throw new Error("Invalid backup format. Must contain requirements and candidates.");
            }
            
            if (overwrite) {
                requirements = data.requirements;
                candidates = data.candidates;
                worklogs = data.worklogs || [];
            } else {
                data.requirements.forEach(req => {
                    if (!requirements.some(r => r.id === req.id)) requirements.push(req);
                });
                data.candidates.forEach(can => {
                    if (!candidates.some(c => c.id === can.id)) candidates.push(can);
                });
                if(data.worklogs) {
                    data.worklogs.forEach(log => {
                        worklogs.push(log);
                    });
                }
            }
            saveData();
            alert("Data restored and saved successfully!");
        } catch(err) {
            alert("Error parsing backup: " + err.message);
        }
    };
    reader.readAsText(file);
}

// Configurable Settings (Section 22)
function saveSettings() {
    appSettings.inactivity = parseInt(document.getElementById('cfg_inactivity').value || 3);
    appSettings.sla = parseInt(document.getElementById('cfg_sla').value || 7);
    appSettings.minMargin = parseFloat(document.getElementById('cfg_margin_threshold').value || 15);
    saveData();
    alert("Settings saved!");
}

// Utilities
function loadSampleData() {
    if (requirements.length > 0) {
        if(!confirm("Existing data found. Overwrite?")) return;
    }
    requirements = [
        { id: "US-2026-0001", title: "SAP CPI Lead", client: "TechCorp", endClient: "Walmart", country: "US", location: "Charlotte, NC", workMode: "Onsite", headcount: 2, status: "Active", workStatus: "Sourcing Started", dateOpened: "2026-06-01", priority: "Critical", type: "W2", billRate: 85, payRate: 65, margin: 20, filled: 1, recruiter: "Recruiter A" },
        { id: "IN-2026-0001", title: "Python Engineer", client: "Innovate Ltd", country: "IN", location: "Bangalore", workMode: "Hybrid", headcount: 5, status: "Pending", workStatus: "Assigned but Not Started", dateOpened: "2026-07-10", priority: "High", type: "Permanent", budget: 18, noticePeriod: "30 days", filled: 0, recruiter: "Recruiter B" }
    ];
    candidates = [
        { id: "CAN-2026-0001", name: "John Doe", email: "john@example.com", phone: "+1-202-555-0199", reqId: "US-2026-0001", stage: "Joined", source: "LinkedIn", visa: "US Citizen", notice: "Immediate", country: "US", lastUpdated: "2026-07-05", history: [{stage:'Joined', date:'2026-07-05', comment:'Joined company'}] },
        { id: "CAN-2026-0002", name: "Jane Smith", email: "jane@example.com", phone: "+91-98765-43210", reqId: "IN-2026-0001", stage: "Interview Scheduled", interviewDate: "2026-07-20T10:00", interviewRound: "Technical", interviewTimezone: "IST", interviewMode: "Video", source: "Naukri", visa: "Immediate", notice: "Immediate", country: "IN", lastUpdated: "2026-07-16", history: [{stage:'Interview Scheduled', date:'2026-07-16', comment:'L1 scheduled'}] },
        { id: "CAN-2026-0003", name: "Bob Ross", email: "bob@example.com", phone: "+1-303-555-0144", reqId: "US-2026-0001", stage: "Screened", source: "Dice", visa: "Green Card", notice: "2 weeks", country: "US", lastUpdated: "2026-07-15", history: [{stage:'Screened', date:'2026-07-15', comment:'Internal screening passed'}] }
    ];
    worklogs = [
        { date: "2026-07-16", reqId: "US-2026-0001", recruiter: "Recruiter A", activity: "Candidate Screening", sourced: 5, screened: 3, submitted: 2, challenges: "None" },
        { date: "2026-07-17", reqId: "IN-2026-0001", recruiter: "Recruiter B", activity: "LinkedIn Search", sourced: 12, screened: 5, submitted: 0, challenges: "High Notice Period" }
    ];
    saveData();
    switchView('dashboard');
}

function clearData() {
    if(confirm("Are you sure? This deletes ALL data from this browser.")) {
        localStorage.removeItem(STORE_KEYS.reqs);
        localStorage.removeItem(STORE_KEYS.candidates);
        localStorage.removeItem(STORE_KEYS.worklogs);
        localStorage.removeItem(STORE_KEYS.settings);
        localStorage.removeItem(STORE_KEYS.role);
        requirements = [];
        candidates = [];
        worklogs = [];
        currentRole = "Management";
        appSettings = { inactivity: 3, sla: 7 };
        updateAllViews();
    }
}

// Intercept Add Candidate modal open to override button behavior
const oldOpenModal = openModal;
openModal = function(id) {
    if (id === 'candidateModal') openCandidateModal();
    else oldOpenModal(id);
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    renderHeaderRoleSwitcher();
    if (document.getElementById('cfg_inactivity')) {
        document.getElementById('cfg_inactivity').value = appSettings.inactivity;
        document.getElementById('cfg_sla').value = appSettings.sla;
        document.getElementById('cfg_margin_threshold').value = appSettings.minMargin || 15;
    }
    updateAllViews();
});
