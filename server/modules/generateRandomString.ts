export const generateRandomString = (template: string) => {
  const regex = /{(.*?)}/g;
  const randomString = template.replace(regex, (match, group) => {
    const options = group.split("|");
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex]
      .replace(/\n/g, "")
      .replace(/['"`]/g, "")
      .replace(/\s+/g, " ");
  });

  return randomString.charAt(0).toUpperCase() + randomString.slice(1);
};
