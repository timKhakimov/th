import axios from "axios";

export const sendToBot = async (text: string) => {
  const token = "6324276078:AAEGmvX4RI-qoJnKkNpBFhVYuYJTyHweCIo";
  const sendMessageUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  const chatIds = ["483779758", "324820826", "6957002018"];

  try {
    await Promise.all(
      chatIds.map((chatId) =>
        axios.post(sendMessageUrl, {
          chat_id: chatId,
          text,
        })
      )
    );
  } catch (error: any) {
    console.log(`Error sending message to bot: ${error.message}`);
  }
};
