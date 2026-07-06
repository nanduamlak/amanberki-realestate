import psycopg2
import openpyxl

def main():
    conn = psycopg2.connect('postgresql://postgres:123456@localhost:5432/real_estate_db')
    cur = conn.cursor()
    cur.execute('SELECT block_id, plot_number, purchaser_name FROM plot_details')
    db_plots = { (r[0], r[1]): r[2] for r in cur.fetchall() }

    wb = openpyxl.load_workbook('Tulu Dimtu Inventory last final.xlsx')
    ws = wb['Sheet2']
    xl_plots = set()
    curr_block = None

    for row in ws.iter_rows(min_row=12, max_row=626, values_only=True):
        col0 = row[0]
        col1 = row[1]
        
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

        if col1 is not None:
            try:
                plot_num = str(int(float(col1)))
                if curr_block:
                    xl_plots.add((curr_block, plot_num))
            except ValueError:
                pass

    print(f"Total plots in Excel: {len(xl_plots)}")
    print(f"Total plots in DB: {len(db_plots)}")

    extra_in_db = set(db_plots.keys()) - xl_plots
    print("\nIn DB but not in Excel:")
    for b, p in sorted(extra_in_db):
        print(f"  {b} - Plot {p} (Purchaser: {db_plots[(b, p)]})")

    missing_in_db = xl_plots - set(db_plots.keys())
    print("\nIn Excel but not in DB:")
    for b, p in sorted(missing_in_db):
        print(f"  {b} - Plot {p}")

if __name__ == "__main__":
    main()
