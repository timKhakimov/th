import axios from "axios";

const sendToBotByChatIdText = async (chatId: string, text: string) => {
  const token = "6324276078:AAEGmvX4RI-qoJnKkNpBFhVYuYJTyHweCIo";
  const sendMessageUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  const splitTextIntoChunks = (text: string, chunkSize = 4096) => {
    const chunks = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      chunks.push(text.slice(currentIndex, currentIndex + chunkSize));
      currentIndex += chunkSize;
    }
    return chunks;
  };

  const textChunks = splitTextIntoChunks(text);

  for (const chunk of textChunks) {
    await axios.post(sendMessageUrl, {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: true,
    });
  }
};

export const sendToBot = async (text: string) => {
  const chatIds = ["483779758", "7938128354"];

  try {
    await Promise.all(
      chatIds.map(async (chatId) => {
        await sendToBotByChatIdText(chatId, text);
      })
    );
  } catch {}
};
