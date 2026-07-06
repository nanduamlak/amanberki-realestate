import subprocess
import os
import time
import psycopg2

PPK_PATH   = r"C:\Users\andua\Downloads\id_rsa (7).ppk"
PASSPHRASE = "Nandu25588032,"
PEM_PATH   = r"C:\Users\andua\Downloads\id_rsa_temp.pem"
SSH_HOST   = "91.204.209.50"
SSH_PORT   = 22
SSH_USER   = "amanbeqj"

REMOTE_DB = dict(
    dbname   = "amanbeqj_realestatedb",
    user     = "amanbeqj_dbuser",
    password = "Nandu25588032,",
)

def convert_ppk_to_pem():
    if os.path.exists(PEM_PATH):
        return True
    puttygen = r"C:\Program Files\PuTTY\puttygen.exe"
    result = subprocess.run(
        [puttygen, PPK_PATH,
         "--old-passphrase", PASSPHRASE,
         "-O", "private-openssh",
         "-o", PEM_PATH],
        capture_output=True, text=True, timeout=15
    )
    return os.path.exists(PEM_PATH)

def main():
    if not convert_ppk_to_pem():
        print("Failed to convert PPK to PEM.")
        return
        
    ssh_exe = r"C:\Windows\System32\OpenSSH\ssh.exe"
    tunnel_cmd = [
        ssh_exe,
        "-i", PEM_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-o", "BatchMode=yes",
        "-N",
        "-L", "5433:127.0.0.1:5432",
        f"{SSH_USER}@{SSH_HOST}",
        "-p", str(SSH_PORT)
    ]
    
    tunnel_proc = subprocess.Popen(tunnel_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(4)
    
    try:
        conn = psycopg2.connect(
            host="127.0.0.1",
            port=5433,
            dbname=REMOTE_DB["dbname"],
            user=REMOTE_DB["user"],
            password=REMOTE_DB["password"],
            connect_timeout=5
        )
        cur = conn.cursor()
        cur.execute("SELECT id, block_number, zone, sold_plots, active_plots FROM properties ORDER BY block_number")
        rows = cur.fetchall()
        print("\n=== Remote Properties List ===")
        for r in rows:
            print(f"  ID: {r[0]} | Block Number: {r[1]} | Zone: {r[2]} | Sold: {r[3]} | Avail: {r[4]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        tunnel_proc.terminate()
        tunnel_proc.wait()

if __name__ == "__main__":
    main()
