import subprocess
import requests


def execute_command(command):
    print(command)
    try:
        result = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT)
        print(result.decode("utf-8"))
    except subprocess.CalledProcessError as e:
        print(f"Command '{command}' failed with error: {e.output.decode('utf-8')}")


def get_accounts():
    try:
        response = requests.get("http://localhost:5050/accounts/ids")
        response.raise_for_status()
        accounts = response.json()
        return accounts
    except requests.RequestException as e:
        print(f"Failed to retrieve accounts: {e}")
        return []


ids = get_accounts()

for acc_id in ids:
    execute_command(f"pm2 start 'ID={acc_id} python3 -m sender' --name 'sender {acc_id}'")
