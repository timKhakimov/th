from telethon import TelegramClient, functions


async def check_spam(client: TelegramClient):
    try:
        print('Начинаю проверять аккаунт на спамблок')
        await client(functions.contacts.UnblockRequest("@SpamBot"))

        async with client.conversation("@SpamBot") as conv:
            await conv.send_message("/start")
            msg = await conv.get_response()

        if "no limits are currently applied" in msg.text:
            return False

        return True
    except Exception as e:
        print(e)
        return True
