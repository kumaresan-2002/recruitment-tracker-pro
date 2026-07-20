html=open('index.html', encoding='utf-8').read()
print('email:', 'id="email"' in html)
print('login_username:', 'id="login_username"' in html)
