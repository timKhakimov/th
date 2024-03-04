import requests

from sender.config_reader import config


async def get_recipient_user(account_id):
    while True:
        try:
            data = requests.get(
                f"{config.backend_url}/recipient",
                params={"accountId": account_id, "language": "РУССКИЙ"},
            )

            recipient_user = data.json()
            if (
                recipient_user["firstMessage"]
                and recipient_user["secondMessage"]
                and recipient_user["username"]
                and recipient_user["groupId"]
                and recipient_user["title"]
            ):
                return data.json()
        except Exception as e:
            print(f"Recipient User Error: {e}")
