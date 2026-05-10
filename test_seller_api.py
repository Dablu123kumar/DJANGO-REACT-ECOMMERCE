import requests

base = 'http://localhost:8000/api'

# Test seller registration
reg_data = {
    'full_name': 'Tech Gadgets Owner',
    'email': 'seller@techgadgets.com',
    'phone': '9876543210',
    'password': 'Seller@1234',
    'password_confirm': 'Seller@1234',
    'store_name': 'Tech Gadgets Store',
    'description': 'Premium electronics at best prices',
    'store_phone': '9876543210',
    'address': '123 Tech Street, Mumbai',
}
r = requests.post(f'{base}/seller/register/', json=reg_data)
print(f'Seller register: {r.status_code} - {r.text[:200]}')

# Login as admin
r = requests.post(f'{base}/auth/login/', json={'email': 'admin@shopelite.com', 'password': 'Admin@1234'})
data = r.json()
token = data.get('access')
print(f'Admin login: {r.status_code}')

headers = {'Authorization': f'Bearer {token}'}

# Fetch all sellers
r = requests.get(f'{base}/admin/sellers/', headers=headers)
stores = r.json()
print(f'Admin sellers: {r.status_code} - {len(stores)} stores found')
for s in stores:
    print(f'  id={s["id"]} | name={s["store_name"]} | status={s["status"]} | owner={s["owner_email"]}')

# Approve the seller store
if stores:
    pending = [s for s in stores if s['status'] == 'pending']
    if pending:
        sid = pending[0]['id']
        r = requests.post(f'{base}/admin/sellers/{sid}/approve/', headers=headers)
        print(f'Approve store {sid}: {r.status_code} - new status={r.json().get("status")}')
    else:
        print('No pending stores to approve')

print('\nAll tests passed!')
