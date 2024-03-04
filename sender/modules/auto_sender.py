import datetime
import pytz

from telethon import TelegramClient

from sender.helpers.check_spam import check_spam
from sender.helpers.get_recipient_user import get_recipient_user
from sender.helpers.save_recipient_user import save_recipient_user


async def auto_sender(client: TelegramClient, account_data):
    try:
        current_time = datetime.datetime.now(tz=pytz.UTC)
        print(account_data.get("remainingTime"))
        remaining_time = datetime.datetime.fromisoformat(
            account_data.get("remainingTime") or str(current_time)
        ).replace(tzinfo=pytz.UTC)
        print('qqq')
        if current_time >= remaining_time:
            if await check_spam(client):
                print(f"На аккаунте #{account_data['id']} присутствует спамблок.")
                return
            else:
                print(
                    f"Аккаунт #{account_data['id']} чист от спамблока, начинаю генерацию сообщения для отправки"
                )

            try:
                recipient_user = await get_recipient_user(account_data["id"])
                print(f"Сгенерированные данные для отправки: {recipient_user}")
                print(
                    f"Начало отправки сообщений пользователю {recipient_user['username']}"
                )

                sent_first_message = await client.send_message(
                    recipient_user["username"], recipient_user["firstMessage"]
                )
                sent_second_message = await client.send_message(
                    recipient_user["username"], recipient_user["secondMessage"]
                )
                print(
                    f"Отправка сообщений к пользователю {recipient_user['username']} прошла успешно!"
                )

                recipient_id = sent_second_message.peer_id.user_id

                print(
                    f"Получен id пользователя, которому были отправлены сообщения: {recipient_id}"
                )

                await client.edit_folder(recipient_id, 1)
                print(f"Добавил чат с пользователем {recipient_id} в архив")

                messages = [
                    {
                        "sender_id": account_data["id"],
                        "message_id": sent_first_message.id,
                        "text": sent_first_message.message,
                        "recipient_viewed": False,
                        "date": sent_first_message.date.isoformat(),
                    },
                    {
                        "sender_id": account_data["id"],
                        "message_id": sent_second_message.id,
                        "text": sent_second_message.message,
                        "recipient_viewed": False,
                        "date": sent_second_message.date.isoformat(),
                    },
                ]

                await save_recipient_user(
                    client,
                    recipient_id,
                    account_data["id"],
                    recipient_user["groupId"],
                    recipient_user,
                    messages,
                )
            except Exception as e:
                print(f"Ошибка при отправке сообщения пользователю: {e}")

            return

        print("Отправка сообщений на текущий момент недоступна")
        print(
            f"Следующая отправка сообщения будет через {str(remaining_time - current_time).split('.')[0]}"
        )

    except Exception as e:
        print(f"Auto sender: {e}")
