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
    puttygen = r"C:\Program Files\PuTTY\puttygen.exe"
    if not os.path.exists(puttygen):
        print("ERROR: puttygen.exe not found at default PuTTY path.")
        return False
        
    # Attempt conversion
    result = subprocess.run(
        [puttygen, PPK_PATH,
         "--old-passphrase", PASSPHRASE,
         "-O", "private-openssh",
         "-o", PEM_PATH],
        capture_output=True, text=True, timeout=15
    )
    if not os.path.exists(PEM_PATH):
        result = subprocess.run(
            [puttygen, PPK_PATH,
             "-P", PASSPHRASE,
             "-O", "private-openssh",
             "-o", PEM_PATH],
            capture_output=True, text=True, timeout=15
        )
    return os.path.exists(PEM_PATH)

def run_ssh_command(cmd_str):
    ssh_exe = r"C:\Windows\System32\OpenSSH\ssh.exe"
    ssh_cmd = [
        ssh_exe,
        "-i", PEM_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-o", "BatchMode=yes",
        f"{SSH_USER}@{SSH_HOST}",
        "-p", str(SSH_PORT),
        cmd_str
    ]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=15)
    return res.returncode, res.stdout, res.stderr

def test_db_connection():
    # Start SSH tunnel for DB connection test
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
    
    # Check if port 5433 is already in use, kill existing ssh if needed
    if os.name == 'nt':
        # Find any existing ssh.exe holding port 5433 or similar
        pass

    tunnel_proc = subprocess.Popen(tunnel_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(4)
    
    if tunnel_proc.poll() is not None:
        stdout, stderr = tunnel_proc.communicate()
        print("  Tunnel failed to start:")
        print(f"  stdout: {stdout.decode()}")
        print(f"  stderr: {stderr.decode()}")
        return False
        
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
        
        # Check plots status count
        cur.execute("""
            SELECT 
                COUNT(*) AS total_plots,
                COUNT(CASE WHEN purchaser_name <> '' AND UPPER(TRIM(purchaser_name)) NOT IN ('TULU DIMTU REAL ESTATE', 'TULU DIMTU REAL ESTATE (B*)') THEN 1 END) as sold,
                COUNT(CASE WHEN purchaser_name = '' OR UPPER(TRIM(purchaser_name)) IN ('TULU DIMTU REAL ESTATE', 'TULU DIMTU REAL ESTATE (B*)') THEN 1 END) as avail
            FROM plot_details
        """)
        counts = cur.fetchone()
        
        # Check active blocks count
        cur.execute("SELECT COUNT(*) FROM properties")
        blocks_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        print("\n=== Remote PostgreSQL Status ===")
        print(f"  Connection: Success (via SSH Tunnel)")
        print(f"  Total Blocks: {blocks_count}")
        print(f"  Total Plots in DB: {counts[0]}")
        print(f"  Sold Plots in DB: {counts[1]}")
        print(f"  Available Plots in DB: {counts[2]}")
        return True
    except Exception as e:
        print(f"\n  Database connection test failed: {e}")
        return False
    finally:
        tunnel_proc.terminate()
        tunnel_proc.wait()

def main():
    print("Converting PPK to OpenSSH PEM...")
    if not convert_ppk_to_pem():
        print("Failed to convert PPK to PEM.")
        return
        
    print("Testing SSH Connection & Remote Health...")
    
    # 1. Check disk space
    code, out, err = run_ssh_command("df -h /")
    print("\n=== Remote Disk Status (Root) ===")
    if code == 0:
        print(out.strip())
    else:
        print(f"Failed to check disk: {err.strip()}")
        
    # 2. Check memory usage
    code, out, err = run_ssh_command("free -h")
    print("\n=== Remote Memory Status ===")
    if code == 0:
        print(out.strip())
    else:
        print(f"Failed to check memory (trying cat /proc/meminfo)...")
        # Try reading meminfo if free is not available
        code, out, err = run_ssh_command("cat /proc/meminfo | head -n 4")
        if code == 0:
            print(out.strip())
        else:
            print(f"Failed: {err.strip()}")

    # 3. Check pg_isready
    code, out, err = run_ssh_command("pg_isready")
    print("\n=== Remote Postgres Service Status ===")
    if code == 0 or "accepting connections" in out:
        print("  PostgreSQL is running and accepting connections.")
    else:
        print(f"  Status: {out.strip() or err.strip() or 'Unknown/Stopped'}")
        
    # 4. Check DB records
    test_db_connection()

if __name__ == "__main__":
    main()
