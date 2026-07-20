with open('src/app.js', 'r', encoding='utf-8') as f:
    app = f.read()

app = app.replace("document.getElementById('email')", "document.getElementById('login_username')")
app = app.replace("document.getElementById('password')", "document.getElementById('login_password')")

with open('src/app.js', 'w', encoding='utf-8') as f:
    f.write(app)
