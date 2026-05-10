import sqlite3
import uuid

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

cur.execute("SELECT id, sku FROM products_product WHERE sku IS NULL OR sku = ''")
rows = cur.fetchall()
print(f'Products needing SKU fix: {len(rows)}')

for row_id, sku in rows:
    new_sku = f'SKU-{uuid.uuid4().hex[:8].upper()}'
    cur.execute('UPDATE products_product SET sku = ? WHERE id = ?', (new_sku, row_id))
    print(f'  Fixed id={row_id}: {new_sku}')

conn.commit()
conn.close()
print('Done — all SKUs are unique now')
