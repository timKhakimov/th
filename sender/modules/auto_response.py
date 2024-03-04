import aiohttp
import os
import asyncio

from itertools import groupby

from telethon import TelegramClient, functions
from sender.config_reader import config
from sender.helpers.make_request_complete import make_request_complete
from sender.helpers.save_recipient_user import save_recipient_user


def _check_for_at_part(array_of_dicts, part):
    if part is None:
        return False

    for dictionary in array_of_dicts:
        if "text" in dictionary:
            if part in dictionary["text"]:
                return True
        if "group_id" in dictionary:
            if part in dictionary["group_id"]:
                return True
    return False


def _merge_consecutive_messages(messages):
    merged_messages = []

    for key, group in groupby(messages, key=lambda x: x["sender_id"]):
        merged_text = ""
        for msg in group:
            merged_text += msg["text"] + " "
        merged_message = {"sender_id": key, "text": merged_text.strip()}
        merged_messages.append(merged_message)

    return merged_messages


async def _get_dialog(account_id: str, recipient_id: str):
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{config.backend_url}/dialogues/{account_id}/{recipient_id}"
                async with session.get(url) as response:
                    if response.status == 200:
                        try:
                            data = await response.json()
                            return data
                        except Exception as e:
                            print(f"Get Dialog Error: {e}")
                            return None
                    else:
                        return None
        except Exception as e:
            print(f"Get Dialog Error: {e}")


async def _get_group_id(group_id: str):
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{config.backend_url}/groupid/{group_id}"
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        return None
        except Exception as e:
            print(f"Get Group ID Error: {e}")


async def _process_voice_message(message, client: TelegramClient):
    while True:
        file_path = None
        try:
            file_path = await client.download_media(message)

            async with aiohttp.ClientSession() as session:
                url = f"{config.gpt_url}/speech"
                async with session.post(
                    url, data={"file": open(file_path, "rb")}
                ) as response:
                    if response.status == 200:
                        result = await response.text()
                        return result
                    else:
                        return None
        except Exception as e:
            print(f"Get speech: {e}")
        finally:
            if file_path:
                os.remove(file_path)


async def _process_dialog(client: TelegramClient, dialog, dialog_db):
    messages = dialog_db.get("messages", [])
    messages_ids = {msg["message_id"] for msg in messages}

    async for message in client.iter_messages(dialog, reverse=True):
        if message.id in messages_ids or message.fwd_from is not None:
            continue

        if message.voice:
            await client(functions.messages.ReadMessageContentsRequest(id=[message.id]))
            text = await _process_voice_message(message, client)
        elif message.text:
            text = message.text
        elif message.media:
            if message.photo:
                text = "[Изображение]"
            elif message.video:
                text = "[Видео]"
            elif message.document:
                text = "[Документ]"
        else:
            text = "[Пустое сообщение]"

        messages.append(
            {
                "sender_id": message.sender_id,
                "message_id": message.id,
                "text": text,
                "date": message.date.isoformat(),
            }
        )
    for msg in messages:
        msg["recipient_viewed"] = True

    return messages


async def _response_message(client: TelegramClient, group_id, messages, dialog):
    me = await client.get_me()
    consecutive_messages = _merge_consecutive_messages(messages)
    part = group_id.get("offer", {}).get("part", None)
    has_part = _check_for_at_part(messages, part)

    dialog_history = "\n".join(
        [
            (
                f"#{me.first_name}: {message['text']}"
                if message["sender_id"] == me.id
                else f"#{dialog.entity.first_name}: {message['text']}"
            )
            for message in consecutive_messages
        ]
    )[-4000:]

    if len(consecutive_messages) > 2:
        goal_description = f"'''ЦЕЛЬ ДЛЯ '{me.first_name}': ответить на последнее сообщение пользователя '{dialog.entity.first_name}' с обязательным акцентом на привлечение внимания '{dialog.entity.first_name}' к предложению из 'ОПИСАНИЕ ПРЕДЛОЖЕНИЯ'."

        if len(consecutive_messages) >= 4 and not has_part:
            goal_description += f" {group_id.get('offer', {}).get('goal', '')}"
    else:
        goal_description = ""

    prompt = f"""
ТВОЕ ИМЯ: {me.first_name};
РОЛЬ '{me.first_name}': {group_id.get('offer', {}).get('aiRole', '')};
ОПИСАНИЕ ПРЕДЛОЖЕНИЯ: {group_id.get('offer', {}).get('companyDescription', '')};
{goal_description}
'''
{dialog_history}
#{me.first_name}:"""

    return make_request_complete(
        prompt,
        len(consecutive_messages) <= 2,
        True,
        2 if len(consecutive_messages) == 2 else 1,
        part if len(consecutive_messages) == 4 else None,
    )


def _qustion_message(messages, group_id):
    consecutive_messages = _merge_consecutive_messages(messages)

    if len(consecutive_messages) == 2:
        return group_id.get("offer", {}).get("addedQuestion", None)

    if len(consecutive_messages) == 4:
        return group_id.get("offer", {}).get("secondAddedQuestion", None)

    return None


async def auto_response(client: TelegramClient, account_data):
    async for dialog in client.iter_dialogs(archived=True):
        print(dialog)
        if (
            not dialog.is_user
            or dialog.entity.bot is True
            or dialog.entity.support is True
            or (
                dialog.message.from_id
                and dialog.message.from_id.user_id == account_data["id"]
                and dialog.unread_count == 0
            )
        ):
            continue

        dialog_db = (
            await _get_dialog(account_data["id"], dialog.message.peer_id.user_id)
        ) or {}
        group_id = await _get_group_id(dialog_db.get("group_id", 12343207729))
        messages = await _process_dialog(client, dialog, dialog_db)
        response_message = await _response_message(client, group_id, messages, dialog)
        question_message = _qustion_message(messages, group_id)

        await client.send_read_acknowledge(
            dialog, clear_mentions=True, clear_reactions=True
        )

        async with client.action(dialog, "typing"):
            typing_delay = len(response_message) * 0.1
            await asyncio.sleep(typing_delay)
            print(f"Сгенерированное сообщение для ответа: {response_message}")
            sent_message = await client.send_message(dialog, response_message)
            messages.append(
                {
                    "sender_id": account_data["id"],
                    "message_id": sent_message.id,
                    "text": response_message,
                    "recipient_viewed": True,
                    "date": sent_message.date.isoformat(),
                }
            )

        if question_message is not None:
            await asyncio.sleep(5)
            async with client.action(dialog, "typing"):
                typing_delay = len(question_message) * 0.2
                await asyncio.sleep(typing_delay)
                print(f"Дополнительный вопрос будет задан: {question_message}")
                sent_message = await client.send_message(dialog, question_message)
                messages.append(
                    {
                        "sender_id": account_data["id"],
                        "message_id": sent_message.id,
                        "text": question_message,
                        "recipient_viewed": True,
                        "date": sent_message.date.isoformat(),
                    }
                )

        await save_recipient_user(
            client,
            dialog.message.peer_id.user_id,
            account_data["id"],
            dialog_db.get("group_id", 12343207729),
            dialog_db,
            messages,
        )
