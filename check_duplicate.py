html = open('index.html', encoding='utf-8').read()
print("billingHubView count:", html.count('id="billingHubView"'))
print("datamanagement count:", html.count('id="datamanagement"'))
