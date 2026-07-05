import psycopg2
conn = psycopg2.connect(host='localhost', port=5432, dbname='real_estate_db', user='postgres', password='123456')
cur = conn.cursor()
cur.execute("""
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name='plot_details'
    ORDER BY ordinal_position
""")
print("plot_details NOT NULL columns:")
for r in cur.fetchall():
    if r[1] == 'NO':
        print(f"  {r[0]}: NOT NULL, default={r[2]}")
conn.close()
