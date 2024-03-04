import asyncio
import socks
import os
import requests

from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors.rpcerrorlist import FloodWaitError
from sender.modules.auto_response import auto_response
from sender.modules.auto_sender import auto_sender
from sender.config_reader import config

proxy = (
    socks.HTTP,
    config.proxy_url,
    int(config.proxy_port),
    True,
    config.proxy_login,
    config.proxy_password,
)


def get_account_data(acc_id):
    try:
        response = requests.get(f"{config.backend_url}/accounts/{acc_id}")
        response.raise_for_status()
        account_data = response.json()
        return account_data
    except requests.RequestException as e:
        print(f"Failed to retrieve account data for account #{acc_id}: {e}")
        return None


async def main():
    acc_id = os.environ.get("ID")
    account_data = get_account_data(acc_id)

    if not account_data or not acc_id:
        print(f"There is not enough data for account #{acc_id}")
        return

    session = account_data.get("session")
    api_id = account_data.get("api_id")
    api_hash = account_data.get("api_hash")
    device_model = account_data.get("device_model")
    system_version = account_data.get("system_version")
    app_version = account_data.get("app_version")
    lang_code = account_data.get("lang_code")
    system_lang_code = account_data.get("system_lang_code")

    if (
        not session
        or not api_id
        or not api_hash
        or not device_model
        or not system_version
        or not app_version
        or not lang_code
        or not system_lang_code
    ):
        print(f"There is not enough data for account #{acc_id}")
        return

    print(
        f"DATA FOR #{acc_id} CORRECT: {session}:{api_id}:{api_hash}:{device_model}:{system_version}:{app_version}:{lang_code}:{system_lang_code}"
    )

    client = TelegramClient(
        StringSession(session),
        api_id=api_id,
        api_hash=api_hash,
        device_model=device_model.replace("/", " "),
        system_version=system_version.replace("/", " "),
        app_version=app_version,
        lang_code=lang_code,
        system_lang_code=system_lang_code,
        proxy=proxy,
    )

    try:
        print(f"Account #{acc_id} before client.start.")
        await asyncio.wait_for(client.start(), timeout=60)
        print(f"Account #{acc_id} initialized. Starting work.")

        await auto_response(client, account_data)
        await auto_sender(client, account_data)

        await client.disconnect()
        await asyncio.sleep(45)

        print(f"Account #{acc_id} disconnected. Ending work.")
    except FloodWaitError as e:
        print("Session flood", e.seconds)
        await asyncio.sleep(e.seconds)
    except Exception as e:
        print(f"Global exception: {e}")


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
