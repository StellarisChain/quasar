/**
 * Returns the image path for a given token ticker for use in <img src=...>.
 * If the image does not exist, returns null after checking with Image().
 * @param ticker Token ticker (e.g., 'ETH')
 */
export function getTokenImagePath(ticker: string): Promise<string | null> {
  const fileName = `${ticker.toLowerCase()}.png`;
  // Path relative to public or build output
  const imgPath = `${fileName}`;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(imgPath);
    img.onerror = () => resolve(null);
    img.src = imgPath;
  });
}
