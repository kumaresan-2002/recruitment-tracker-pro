
// --- Phase 71: Automations Engine ---

function updateAutoConditionOptions() {
    const entity = document.getElementById('auto_entity').value;
    const stateSelect = document.getElementById('auto_state');
    stateSelect.innerHTML = '';
    if(entity === 'Candidate') {
        const stages = ['New','Screened','Submitted to Client','Interview Scheduled','Offered','Hired','Rejected','On Hold'];
        stages.forEach(s => stateSelect.innerHTML += `<option value="${s}">${s}</option>`);
    } else {
        const stages = ['Open','Hold','Closed','Cancelled'];
        stages.forEach(s => stateSelect.innerHTML += `<option value="${s}">${s}</option>`);
    }
}

function updateAutoActionOptions() {
    const actionType = document.getElementById('auto_actionType').value;
    const actionValue = document.getElementById('auto_actionValue');
    actionValue.innerHTML = '';
    
    if(actionType === 'ChangeStage') {
        const entity = document.getElementById('auto_entity').value;
        if(entity === 'Candidate') {
            const stages = ['New','Screened','Submitted to Client','Interview Scheduled','Offered','Hired','Rejected','On Hold'];
            stages.forEach(s => actionValue.innerHTML += `<option value="${s}">${s}</option>`);
        } else {
            const stages = ['Open','Hold','Closed','Cancelled'];
            stages.forEach(s => actionValue.innerHTML += `<option value="${s}">${s}</option>`);
        }
    } else {
        actionValue.innerHTML = '<option value="Flag Alert">Flag Alert (System Note)</option>';
    }
}

function saveAutomationRule() {
    const entity = document.getElementById('auto_entity').value;
    const state = document.getElementById('auto_state').value;
    const days = parseInt(document.getElementById('auto_days').value) || 0;
    const actionType = document.getElementById('auto_actionType').value;
    const actionValue = document.getElementById('auto_actionValue').value;
    
    const rule = {
        id: 'RULE-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        entity,
        state,
        days,
        actionType,
        actionValue,
        executions: 0,
        active: true,
        createdAt: new Date().toISOString()
    };
    
    automations.push(rule);
    saveData();
    closeModal('automationRuleModal');
    createAlert('Automation Rule Saved & Activated!', 'success');
    renderAutomations();
}

function deleteAutomationRule(id) {
    automations = automations.filter(r => r.id !== id);
    saveData();
    renderAutomations();
    createAlert('Automation rule deleted.', 'info');
}

function renderAutomations() {
    const tbody = document.getElementById('automations-table');
    if(!tbody) return;
    
    if (automations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No automation rules created yet.</td></tr>';
        return;
    }
    
    tbody.innerHTML = automations.map(r => `
        <tr>
            <td><strong>${r.id}</strong></td>
            <td>${r.entity}</td>
            <td>IF ${r.state} for > ${r.days} Days</td>
            <td>THEN ${r.actionType === 'ChangeStage' ? 'Move to ' + r.actionValue : 'Add Note'}</td>
            <td><span class="badge ${r.executions > 0 ? 'badge-primary' : 'badge-secondary'}">${r.executions}</span></td>
            <td><span style="color:var(--success)">Active</span></td>
            <td>
                <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="deleteAutomationRule('${r.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function runAutomationsEngine() {
    if(!automations || automations.length === 0) return;
    
    const now = new Date();
    let actionsTaken = 0;
    let anyChanges = false;
    
    automations.forEach(rule => {
        if(!rule.active) return;
        
        if(rule.entity === 'Candidate') {
            candidates.forEach(can => {
                if(can.stage === rule.state) {
                    const lastUp = new Date(can.lastUpdated);
                    const diffDays = Math.floor((now - lastUp) / (1000 * 60 * 60 * 24));
                    
                    if(diffDays > rule.days) {
                        // Execute rule!
                        if(rule.actionType === 'ChangeStage' && can.stage !== rule.actionValue) {
                            can.stage = rule.actionValue;
                            can.lastUpdated = now.toISOString();
                            addCandidateHistory(can.id, 'System Engine', `Automated Action: Changed stage to ${rule.actionValue} (in ${rule.state} > ${rule.days} days)`);
                            rule.executions++;
                            actionsTaken++;
                            anyChanges = true;
                        }
                    }
                }
            });
        }
    });
    
    if(anyChanges) {
        createAlert(`⚡ Automations Engine: Executed ${actionsTaken} background actions.`, 'info');
        saveData();
        renderAutomations();
    }
}
