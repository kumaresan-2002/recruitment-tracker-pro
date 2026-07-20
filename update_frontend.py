import re

def update_app_js():
    with open('src/app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    # Change port from 3000 to 5000
    app = app.replace('http://127.0.0.1:3000', 'http://127.0.0.1:5000')

    # Update handleLogin to hit backend auth
    login_old = """async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<span class="loader"></span>';
    const email = document.getElementById('email').value;
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    let role = 'Management';
    if(email.includes('admin')) role = 'Admin';
    else if(email.includes('client')) role = 'Client';
    else if(email.includes('manager')) role = 'Hiring Manager';
    else if(email.includes('recruiter')) role = 'Recruiter';
    
    localStorage.setItem('role', role);
    localStorage.setItem('token', 'mock_token_' + Date.now()); // issue mock token
    
    initApp();
}"""
    
    login_new = """async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const originalText = btn.innerText;
    btn.innerHTML = '<span class="loader" style="width: 16px; height: 16px; display: inline-block; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; box-sizing: border-box; animation: rotation 1s linear infinite;"></span>';
    const email = document.getElementById('email').value;
    const pwd = document.getElementById('password').value || 'admin123';
    
    try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: email, password: pwd})
        });
        if (!res.ok) throw new Error('Invalid credentials');
        
        const data = await res.json();
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('token', data.token);
        
        initApp();
    } catch(err) {
        alert(err.message);
    } finally {
        btn.innerText = originalText;
    }
}"""
    
    if "async function handleLogin(e)" in app:
        # regex replace handleLogin
        app = re.sub(r'async function handleLogin\(e\).*?\}', login_new, app, flags=re.DOTALL)
        
    # Prevent mock data initialization from overriding our backend
    mock_injection = """if (!localStorage.getItem(STORE_KEYS.reqs) || JSON.parse(localStorage.getItem(STORE_KEYS.reqs)).length === 0) {
    localStorage.setItem(STORE_KEYS.reqs, JSON.stringify(MOCK_REQS));
}
if (!localStorage.getItem(STORE_KEYS.candidates) || JSON.parse(localStorage.getItem(STORE_KEYS.candidates)).length === 0) {
    localStorage.setItem(STORE_KEYS.candidates, JSON.stringify(MOCK_CANDS));
}
if (!localStorage.getItem(STORE_KEYS.worklogs) || JSON.parse(localStorage.getItem(STORE_KEYS.worklogs)).length === 0) {
    localStorage.setItem(STORE_KEYS.worklogs, JSON.stringify(MOCK_WORKLOGS));
}"""
    app = app.replace(mock_injection, "")

    with open('src/app.js', 'w', encoding='utf-8') as f:
        f.write(app)
        
update_app_js()
print("app.js updated.")
