import axios from "axios";

export const sendToBot = async (text: string) => {
  const token = "7568412709:AAGOa-nfjFB0qKqpmTJroYX5bjI6xXZcb2Q";
  const sendMessageUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  const chatIds = ["483779758", "324820826"];

  try {
    await Promise.all(
      chatIds.map((chatId) =>
        axios.post(sendMessageUrl, {
          chat_id: chatId,
          text,
        })
      )
    );
  } catch {}
};
