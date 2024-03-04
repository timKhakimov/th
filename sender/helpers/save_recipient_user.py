import requests
import datetime

from sender.config_reader import config


async def save_recipient_user(
    client, recipient_id, account_id, group_id, recipient_user, messages
):
    while True:
        try:
            user = await client.get_entity(recipient_id)
            print(
                f"Получена полная информация о пользователе, которому были отправлены сообщения, начинаю сохранять информацию в бд"
            )

            data = {
                "status": "done",
                "account_id": account_id,
                "group_id": group_id,
                "dialogue": {
                    "group_id": group_id,
                    "account_id": account_id,
                    "recipient_id": recipient_id,
                    "recipient_username": (
                        user.username.lower()
                        if hasattr(user, "username")
                        else (
                            recipient_user.get("username", "").lower()
                            if "username" in recipient_user
                            else recipient_user.get("recipient_username", "").lower()
                        )
                    ),
                    "recipient_title": recipient_user.get("title")
                    or recipient_user.get("recipient_title", None)
                    or (
                        user.first_name
                        if hasattr(user, "first_name")
                        else "Неизвестный пользователь"
                    ),
                    "recipient_bio": (
                        recipient_user.get("bio")
                        or recipient_user.get("recipient_bio", None)
                    ),
                    "recipient_phone": user.phone,
                    "messages": messages,
                    "operator_viewed": False,
                    "date_сreated": datetime.datetime.now().isoformat(),
                },
            }

            print(f"Данные перед сохранением: {data}")
            response_data = requests.post(
                f"{config.backend_url}/recipient",
                json=data,
            )
            if response_data.status_code == 200:
                print(
                    f"Сохранил информацию о пользователе {data['dialogue']['recipient_username']} в бд!"
                )
                return
            else:
                print(
                    f"Информация о пользователе {data['dialogue']['recipient_username']} не сохраенена в бд, status code: {response_data.status_code}!"
                )
        except Exception as e:
            print(f"Recipient Save Error: {e}")
