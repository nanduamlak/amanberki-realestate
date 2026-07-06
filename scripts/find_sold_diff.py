import psycopg2
import openpyxl

def main():
    conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/real_estate_db')
    cur = conn.cursor()
    cur.execute("SELECT block_id, plot_number, purchaser_name FROM plot_details WHERE purchaser_name IS NOT NULL AND LOWER(TRIM(purchaser_name)) NOT IN ('tulu dimtu real estate','tulu dimtu','')")
    db_sold = { (r[0], r[1]): r[2] for r in cur.fetchall() }

    wb = openpyxl.load_workbook('Tulu Dimtu Inventory last final.xlsx')
    ws = wb['Sheet2']
    xl_sold = {}
    curr_block = None

    for row in ws.iter_rows(min_row=12, max_row=626, values_only=True):
        col0 = row[0]
        col1 = row[1]
        col4 = row[4]
        
        if col0 is not None:
            val_str = str(col0).strip()
            if val_str == "46A":
                curr_block = "BLOCK-046A"
            elif val_str == "46B":
                curr_block = "BLOCK-046B"
            else:
                try:
                    curr_block = f"BLOCK-{int(float(val_str)):03d}"
                except ValueError:
                    pass

        if col1 is not None and col4 is not None:
            try:
                plot_num = str(int(float(col1)))
                purchaser = str(col4).strip()
                if purchaser.lower() not in ('tulu dimtu real estate','tulu dimtu',''):
                    if curr_block:
                        xl_sold[(curr_block, plot_num)] = purchaser
            except ValueError:
                pass

    print(f"Sold in Excel: {len(xl_sold)}")
    print(f"Sold in DB: {len(db_sold)}")

    extra_in_db = set(db_sold.keys()) - set(xl_sold.keys())
    print("\nSold in DB but not in Excel:")
    for b, p in sorted(extra_in_db):
        print(f"  {b} - Plot {p} (Purchaser: {db_sold[(b, p)]})")

    missing_in_db = set(xl_sold.keys()) - set(db_sold.keys())
    print("\nSold in Excel but not in DB:")
    for b, p in sorted(missing_in_db):
        print(f"  {b} - Plot {p} (Excel Purchaser: {xl_sold[(b, p)]})")

if __name__ == "__main__":
    main()
