import re
import requests

from sender.config_reader import config


def count_sentences(paragraph):
    sentence_enders = [".", "!", "?"]
    sentence_count = 0

    for char in paragraph:
        if char in sentence_enders:
            sentence_count += 1

    return sentence_count


def capitalize_first_letter(s):
    return s[0].upper() + s[1:]


def remove_question_sentences(text):
    question_and_exclamation_pattern = r"[^.!?]*(?:[!?])"
    result = re.sub(question_and_exclamation_pattern, "", text)
    return result.strip()


def make_request_complete(
    prompt,
    disable_link=False,
    delete_question=False,
    minimal_proposal_length=1,
    part=None,
):
    print(prompt)
    while True:
        try:
            response = requests.post(
                f"{config.gpt_url}/complete",
                json={"prompt": prompt},
            )
            data = response.text.strip()

            if not data:
                raise ValueError("Пустое сообщение")

            message = data.replace("\n", "").strip()
            pattern = r"((http|https|www):\/\/.)?([a-zA-Z0-9\'\/\.\-])+\.[a-zA-Z]{2,5}([a-zA-Z0-9\/\&\;\:\.\,\?\\=\-\_\+\%\'\~]*)"
            has_text_link = re.search(pattern, message)

            if has_text_link and disable_link:
                print(
                    "\x1b[4mПотенциальное сообщение:\x1b[0m \x1b[36m{}\x1b[0m".format(
                        message
                    )
                )
                raise ValueError(
                    "В ответе содержится ссылка на этапе, когда ссылки отправлять запрещено"
                )

            if part is not None and part not in message:
                raise ValueError(
                    f"Потенциальное сообщение не содержит часть {part}, хотя должно"
                )

            if delete_question and ("?" in message or "!" in message):
                print(
                    "\x1b[4mПотенциальное сообщение до удаления вопроса:\x1b[0m \x1b[36m{}\x1b[0m".format(
                        message
                    )
                )
                message = remove_question_sentences(message)
                print(
                    "\x1b[4mПотенциальное сообщение после удаления вопроса:\x1b[0m \x1b[36m{}\x1b[0m".format(
                        message
                    )
                )

            if any(
                char in message
                for char in ["[", "]", "{", "}", "(", ")", "*", "<", ">"]
            ):
                print(
                    "\x1b[4mПотенциальное сообщение:\x1b[0m \x1b[36m{}\x1b[0m".format(
                        message
                    )
                )
                raise ValueError("В ответе содержатся подозрительные символы")

            var_message = capitalize_first_letter(
                message.replace("Приветствую! ", "")
                .replace("Приветствую!", "")
                .replace("Приветствую, ", "")
                .replace("Приветствую,", "")
                .replace("Приветствую", "")
                .replace("приветствую", "")
                .replace("Привет, ", "")
                .replace("Привет,", "")
                .replace("Привет! ", "")
                .replace("Привет!", "")
                .replace("Здравствуйте, ", "")
                .replace("Здравствуйте,", "")
                .replace("Здравствуйте! ", "")
                .replace("Здравствуйте!", "")
                .replace("Здравствуй, ", "")
                .replace("Здравствуй,", "")
                .replace("Здравствуй! ", "")
                .replace("Здравствуй!", "")
                .replace("Доброе утро, ", "")
                .replace("Доброе утро,", "")
                .replace("Доброе утро! ", "")
                .replace("Доброе утро!", "")
                .replace("Добрый вечер,", "")
                .replace("Добрый вечер! ", "")
                .replace("Добрый вечер!", "")
                .replace("Добрый день,", "")
                .replace("Добрый день! ", "")
                .replace("Добрый день!", "")
                .replace("Привет", "")
                .replace("Здравствуйте", "")
                .replace("Здравствуй", "")
                .replace("Доброе утро", "")
                .replace("Добрый вечер", "")
                .replace("Добрый день", "")
                .replace("привет", "")
                .replace("здравствуйте", "")
                .replace("здравствуй", "")
                .replace("доброе утро", "")
                .replace("добрый вечер", "")
                .replace("добрый день", "")
                .replace("Hi,", "")
                .replace("Hi! ", "")
                .replace("Hi!", "")
                .replace("Hi", "")
                .replace("hi", "")
                .replace("Hello,", "")
                .replace("Hello! ", "")
                .replace("Hello!", "")
                .replace("Hello", "")
                .replace("hello", "")
                .replace("Good morning,", "")
                .replace("Good morning! ", "")
                .replace("Good morning!", "")
                .replace("Good morning", "")
                .replace("good morning", "")
                .replace("Good evening,", "")
                .replace("Good evening! ", "")
                .replace("Good evening!", "")
                .replace("Good evening", "")
                .replace("good evening", "")
                .replace("Good afternoon,", "")
                .replace("Good afternoon! ", "")
                .replace("Good afternoon!", "")
                .replace("Good afternoon", "")
                .replace("good afternoon", "")
            )

            if len(var_message) < 60:
                raise ValueError("Минимальная длина 60 символов")

            if minimal_proposal_length > count_sentences(var_message):
                raise ValueError(
                    f"Минимальное количество сообщений - {minimal_proposal_length}"
                )

            return var_message
        except Exception as e:
            print("Ошибка запроса. {}".format(e))
