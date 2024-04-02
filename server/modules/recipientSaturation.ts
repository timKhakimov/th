import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import generatePartFirstMessage from "./generatePartFirstMessage";
import { generateRandomString } from "./generateRandomString";

const defaultFirstMessagePrompt = "Здравствуйте!";
const defaultSecondMessagePrompt =
  "{Я |}{заметил|увидел|обратил внимание|правильно понимаю|правильно понял|правильно предполагаю|предполагаю|обнаружил|верно понял|запомнил|подметил}, {что вы|что Вы|вы|Вы} {предприниматель|ведете бизнес|занимаетесь предпринимательской деятельностью|занимаетесь предпринимательством|занимаетесь ведением бизнеса|занимаетесь коммерческой деятельностью}{?|.|,} {это так|я прав|прав ли я|это правда|так ли это|это действительно так|действительно ли так|не ошибся|верно|это верно}?";

function extractValuesFromHTML(htmlString: string) {
  const titleRegex =
    /class="tgme_page_title"><span dir="auto">([^<]+)<\/span><\/d/;
  const titleMatch = htmlString.match(titleRegex);
  const title = titleMatch ? titleMatch[1] : null;

  return {
    title,
  };
}

export const recipientSaturation = async (recipient: any) => {
  const { username, groupId, offer = {} } = recipient;

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

      if (!extracted.title) {
        console.log(`Пользователь не найден ${username}`);
        return null;
      }

      const firstMessagePrompt =
        offer.fisrtMessagePrompt || defaultFirstMessagePrompt;
      const secondMessagePrompt =
        offer.secondMessagePrompt || defaultSecondMessagePrompt;

      return {
        groupId,
        firstMessage: generateRandomString(firstMessagePrompt).trim(),
        secondMessage: generateRandomString(secondMessagePrompt).trim(),
        recipientUsername: username.toLowerCase(),
      };
    } catch (e: any) {
      console.log(e.message);
    }
  }
};
