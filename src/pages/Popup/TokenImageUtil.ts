/**
 * Returns the image path for a given token ticker for use in <img src=...>.
 * If the image does not exist, returns null after checking with Image().
 * @param ticker Token ticker (e.g., 'ETH')
 */
export function getTokenImagePath(ticker: string): Promise<string | null> {
  const fileName = `${ticker.toLowerCase()}.png`;
  
  // Try different possible paths based on the environment
  const possiblePaths = [
    fileName, // Direct filename for built extension
    `src/assets/img/${fileName}`, // Development path
    `assets/img/${fileName}`, // Alternative build path
    `img/${fileName}` // Another common path
  ];

  // Check if we're in a browser extension context
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    possiblePaths.unshift(chrome.runtime.getURL(fileName));
    possiblePaths.unshift(chrome.runtime.getURL(`assets/img/${fileName}`));
  } else if (typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.runtime && (globalThis as any).browser.runtime.getURL) {
    // Firefox compatibility
    possiblePaths.unshift((globalThis as any).browser.runtime.getURL(fileName));
    possiblePaths.unshift((globalThis as any).browser.runtime.getURL(`assets/img/${fileName}`));
  }

  return new Promise((resolve) => {
    let currentIndex = 0;
    
    function tryNextPath() {
      if (currentIndex >= possiblePaths.length) {
        resolve(null);
        return;
      }
      
      const imgPath = possiblePaths[currentIndex];
      const img = new window.Image();
      
      img.onload = () => resolve(imgPath);
      img.onerror = () => {
        currentIndex++;
        tryNextPath();
      };
      
      img.src = imgPath;
    }
    
    tryNextPath();
  });
}
