import re

with open('src/app.js', 'r', encoding='utf-8') as f:
    app = f.read()

# I will use a regex to replace everything from `async function handleLogin(e)` up to the last `}` of the orphaned block, BEFORE `function cloneReq(reqId)`

pattern = r'async function handleLogin\(e\).*?(?=function cloneReq\(reqId\))'

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
}

"""

app = re.sub(pattern, login_new, app, flags=re.DOTALL)

with open('src/app.js', 'w', encoding='utf-8') as f:
    f.write(app)

print("Fixed handleLogin syntax.")
