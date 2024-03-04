export async function wrapPromise<T>(
  promiseFn: () => Promise<T>
): Promise<void> {
  while (true) {
    try {
      await promiseFn();
      break;
    } catch (e) {
      console.log(e);
    }
  }
}
