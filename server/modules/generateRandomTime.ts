export const generateRandomTime = () => {
  const minTime = 3600000 * 4; // 2 hours in milliseconds
  const maxTime = 3600000 * 8; // 4 hours in milliseconds

  const randomTime =
    Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
  return randomTime;
};
