import subprocess
import os

PPK_PATH   = r"C:\Users\andua\Downloads\id_rsa (7).ppk"
PASSPHRASE = "nandu25588032,"
PEM_PATH   = r"C:\Users\andua\Downloads\id_rsa_temp.pem"
SSH_HOST   = "91.204.209.50"
SSH_PORT   = 22
SSH_USER   = "amanbeqj"

def convert_ppk_to_pem():
    if os.path.exists(PEM_PATH):
        return True
    puttygen = r"C:\Program Files\PuTTY\puttygen.exe"
    result = subprocess.run(
        [puttygen, PPK_PATH,
         "-P", PASSPHRASE,
         "-O", "private-openssh",
         "-o", PEM_PATH],
        capture_output=True, text=True, timeout=15
    )
    return os.path.exists(PEM_PATH)

def main():
    if not convert_ppk_to_pem():
        print("Failed to convert key")
        return
        
    ssh_exe = r"C:\Windows\System32\OpenSSH\ssh.exe"
    ssh_cmd = [
        ssh_exe,
        "-i", PEM_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-o", "BatchMode=yes",
        f"{SSH_USER}@{SSH_HOST}",
        "-p", str(SSH_PORT),
        "find /home/amanbeqj/ -name .next -type d"
    ]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True)
    print("STDOUT:")
    print(res.stdout.strip())
    print("STDERR:")
    print(res.stderr.strip())
    
    if os.path.exists(PEM_PATH):
        os.remove(PEM_PATH)

if __name__ == "__main__":
    main()
