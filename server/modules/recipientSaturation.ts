import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import makeRequestGPT from "./makeRequestGPT";
import generatePartFirstMessage from "./generatePartFirstMessage";

const defaultSecondMessageWithBioPrompt =
  "Твоя задача - составить сообщение длиною до 12 слов, используя данные о пользователе и его описании: '${userData}. ${userDescription}.'. Формат сообщения: '''${firstPart} {факт}, ${secondPart}?'''.Важно выбрать лучший, простой и понятный факт о собеседнике, перед фактом добавить фразу '${firstPart}', а после факта уточнить '${secondPart}?'. Имя и фамилия собеседника в сообщении использоваться не должны. Не приветствуй. Не здоровайся.";
const defaultSecondMessageWithoutBioPrompt =
  "Твоя задача - составить сообщение длиною до 12 слов, используя данные о пользователе и его описании: '${userData}. Занимаюсь предпринимательской деятельностью.'. Формат сообщения: '''${firstPart} {факт}, ${secondPart}?'''.Важно выбрать лучший, простой и понятный факт о собеседнике, перед фактом добавить фразу '${firstPart}', а после факта уточнить '${secondPart}?'. Имя и фамилия собеседника в сообщении использоваться не должны. Не приветствуй. Не здоровайся.";
const defaultFirstMessagePrompt =
  'Данные о пользователе: ${userData}. Твоя задача – проанализировать предоставленную строку данных о пользователе и извлечь из неё имя. Используя это имя, сформируй корректное приветствие, начинающееся с фразы "Здравствуйте". Если имя извлечь не удаётся, твоё сообщение должно состоять из одного слова "Здравствуйте!" без дополнительных символов, вопросов или предложений. При успешном извлечении имени, не используй плейсхолдеры, а вставь имя напрямую в приветствие, как часть естественной речи. Имя не должно быть длиною больше, чем одно слово! Если имя пользователя на иностранном языке, переведи его на русский язык и включи в приветствие. Например, если имя пользователя – "John", твой ответ должен быть "Здравствуйте, Джон!".';

function extractValuesFromHTML(htmlString: string) {
  const titleRegex =
    /class="tgme_page_title"><span dir="auto">([^<]+)<\/span><\/d/;
  const descriptionRegex = /class="tgme_page_description ">([^<]+)<\/div>/;

  const titleMatch = htmlString.match(titleRegex);
  const descriptionMatch = htmlString.match(descriptionRegex);

  const title = titleMatch ? titleMatch[1] : null;
  const description = descriptionMatch ? descriptionMatch[1] : null;

  const htmlRegex = /(<([^>]+)>)/gi;
  var emojiRegex =
    /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+/gu;
  console.log(`DO: ${title}`);
  console.log(`DO: ${description}`);
  const filteredTitle =
    title
      ?.replace(htmlRegex, "")
      ?.replace(emojiRegex, "")
      ?.replace("&quot", "")
      ?.replace("&amp;", "")
      ?.trim() || null;

  const filteredDescription =
    description
      ?.replace(htmlRegex, "")
      ?.replace(emojiRegex, "")
      ?.replace("&quot", "")
      ?.replace("&amp;", "")
      ?.trim() || null;

  console.log(`POSLE: ${filteredTitle}`);
  console.log(`POSLE: ${filteredDescription}`);

  return {
    title: filteredTitle,
    description: filteredDescription,
  };
}

const addContext = (
  userData: string,
  userDescription: string,
  message: string
) => {
  const userRegExp = new RegExp("\\${userDescription}", "g");
  const userDataRegExp = new RegExp("\\${userData}", "g");
  const firstPart = new RegExp("\\${firstPart}", "g");
  const secondPart = new RegExp("\\${secondPart}", "g");

  const { first, second } = generatePartFirstMessage();

  return message
    .replace(userRegExp, userDescription)
    .replace(userDataRegExp, userData)
    .replace(firstPart, first)
    .replace(secondPart, second);
};

export const recipientSaturation = async (recipient: any) => {
  const {
    username,
    groupId,
    firstMessagePrompt: resFirstMessagePrompt,
    secondMessagePrompt: resSecondMessagePrompt,
    secondMessagePromptWithBio: resSecondMessagePromptWithBio,
    secondMessagePromptWithoutBio: resSecondMessagePromptWithoutBio,
  } = recipient;

  while (true) {
    try {
      const httpsAgent = new HttpsProxyAgent(
        `http://${process.env.PROXY_LOGIN}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_URL}:${process.env.PROXY_PORT}`
      );

      const config = {
        url: `https://t.me/${username}`,
        httpsAgent,
      };
      const { data } = await axios.request(config);
      const extracted = extractValuesFromHTML(data);
      console.log(extracted);

      if (!extracted.title) {
        console.log(`Пользователь не найден ${username}`);
        return null;
      }
      const firstMessagePrompt =
        resFirstMessagePrompt || defaultFirstMessagePrompt;
      const secondMessagePromptWithBio =
        resSecondMessagePromptWithBio ||
        resSecondMessagePrompt ||
        defaultSecondMessageWithBioPrompt;
      const secondMessagePromptWithoutBio =
        resSecondMessagePromptWithoutBio ||
        resSecondMessagePrompt ||
        defaultSecondMessageWithoutBioPrompt;

      const secondMessagePrompt = addContext(
        extracted.title,
        extracted?.description || "",
        `${
          extracted.description
            ? secondMessagePromptWithBio
            : secondMessagePromptWithoutBio
        }`
      );
      const nowFirstMessagePrompt = addContext(
        extracted.title,
        extracted?.description || "",
        firstMessagePrompt
      );

      const firstMessage = await makeRequestGPT(
        [{ role: "system", content: nowFirstMessagePrompt }],
        0.5,
        false
      );
      const secondMessage = await makeRequestGPT(
        [{ role: "system", content: secondMessagePrompt }],
        0.2
      );

      console.log(`ПЕРВЫЙ ПРОМПТ: ${nowFirstMessagePrompt}`);
      console.log(`ВТОРОЙ ПРОМПТ: ${secondMessagePrompt}`);

      if (firstMessage === "error" || secondMessage === "error") {
        console.log(`Ебаная ошибка при запросе в gpt ${username}`);

        return null;
      }

      return {
        firstMessage,
        secondMessage: secondMessage.replace(/\n/g, "").replace(/['"`]/g, ""),
        username,
        groupId,
        bio: extracted.description,
        title: extracted.title,
      };
    } catch (e: any) {
      console.log(e.message);
    }
  }
};
