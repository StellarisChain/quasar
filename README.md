# <img src="src/assets/img/icon-128.png" width="64" align="center"/> Quasar - Stellaris Wallet Browser Extension

[![Static Badge](https://img.shields.io/badge/telegram-voxacommunications-blue?link=https%3A%2F%2Ft.me%2Fvoxacommunications)](https://t.me/voxacommunications)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-MV3-green)](https://developer.chrome.com/docs/extensions/mv3/)

A secure, feature-rich browser wallet extension for Stellaris and Stellaris-based blockchain networks. Built with modern web technologies and designed for seamless cryptocurrency management directly in your browser.

## What's New

- **🔒 Enhanced Security**: Core cryptographic utilities now match the Python stellaris-wallet implementation
- **🔧 Browser-Compatible**: All wallet verification and cryptographic functions work natively in browsers
- **⚡ Performance Optimized**: Updated with React 18, Webpack 5, and modern TypeScript
- **🛡️ Secure Verification**: Two-layer password hashing (PBKDF2 + Scrypt-like), HMAC validation, and timing-safe comparisons
- **🌐 Node Validation**: Built-in blockchain node validation and connection testing
- **📱 Modern UI**: Clean, responsive interface with Tailwind CSS and Framer Motion

## Key Features

### Wallet Functionality
- **Multi-Chain Support**: Compatible with Stellaris and Stellaris-based networks
- **Secure Key Management**: Browser-compatible cryptographic utilities with secure password hashing
- **Transaction Handling**: Send, receive, and manage cryptocurrency transactions
- **Asset Management**: Support for multiple tokens and assets
- **Import/Export**: Wallet backup and recovery capabilities

### Security Features
- **Two-Factor Authentication**: TOTP support for enhanced security
- **Password Verification**: Multi-layer hashing with PBKDF2 and Scrypt-like algorithms
- **HMAC Validation**: Message authentication for data integrity
- **Node Validation**: Automatic blockchain node verification and validation
- **Secure Memory**: Best-effort secure memory cleanup in browser environment

### Technical Features
- **Chrome Extension Manifest V3**: Latest extension standards for enhanced security
- **TypeScript Support**: Full type safety and modern development experience
- **Hot Reload**: Automatic browser refresh during development
- **Modular Architecture**: Clean separation of concerns with reusable components

## Technology Stack

- **[Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/)** - Latest extension security standards
- **[React 18](https://reactjs.org)** - Modern UI framework with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development experience
- **[Webpack 5](https://webpack.js.org/)** - Advanced bundling and optimization
- **[Webpack Dev Server 4](https://webpack.js.org/configuration/dev-server/)** - Fast development server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready motion library
- **[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)** - Browser-native cryptographic operations

## Architecture

### Core Libraries (`src/lib/`)
- **`verification_utils.ts`** - Password verification, HMAC validation, node connectivity
- **`cryptographic_utils.ts`** - Encryption, TOTP, proof-of-work algorithms
- **`data_manipulation_utils.ts`** - Data scrambling, attempt tracking, secure cleanup
- **`wallet_generation_utils.ts`** - Wallet creation and key derivation
- **`wallet_client.ts`** - Blockchain interaction and transaction handling

### Browser Compatibility
All cryptographic operations have been adapted from the Python stellaris-wallet implementation to work natively in browser environments using the Web Crypto API and other browser-standard technologies.

## Installation & Development

### Prerequisites:
- [Node.js](https://nodejs.org/) version >= **18**
- Chrome or Chromium-based browser
- Git

### Setup Procedures:

1. **Clone the repository**
   ```bash
   git clone https://github.com/StellarisChain/quasar.git
   cd quasar
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Load extension in Chrome**
   1. Open `chrome://extensions/`
   2. Enable `Developer mode` (top right toggle)
   3. Click `Load unpacked extension`
   4. Select the `build` folder from the project directory

5. **Start developing!**
   - The extension will auto-reload on code changes
   - Check the browser console for any errors
   - Use Chrome DevTools to debug the extension

### Production Build

```bash
NODE_ENV=production npm run build
```

The `build` folder will contain the production-ready extension for Chrome Web Store submission.

## Project Structure

```
src/
├── components/          # Reusable React components
├── pages/              # Extension pages (popup, options, etc.)
├── lib/                # Core wallet libraries
│   ├── verification_utils.ts      # Password & node verification
│   ├── cryptographic_utils.ts     # Encryption & TOTP
│   ├── data_manipulation_utils.ts # Data handling & security
│   ├── wallet_generation_utils.ts # Wallet creation
│   └── wallet_client.ts          # Blockchain interaction
├── assets/             # Images, icons, static files
└── manifest.jsonc      # Extension configuration
```

The extension is structured as a modern React application with the following entry points:
- **Popup**: Main wallet interface (`src/pages/Popup/`)
- **Options**: Settings and configuration (`src/pages/Options/`)
- **Background**: Service worker for blockchain operations
- **Content Scripts**: Web page integration (if needed)

## Security Features

### Cryptographic Implementation
The wallet implements industry-standard security practices:

- **Password Hashing**: Two-layer approach using PBKDF2 (100,000 iterations) + Scrypt-like algorithm
- **HMAC Validation**: Message authentication for data integrity verification
- **Timing-Safe Comparisons**: Protection against timing attacks
- **Secure Memory Management**: Best-effort cleanup of sensitive data in browser environment

### Node Validation
- Automatic verification of blockchain nodes
- Block hash comparison with trusted reference nodes
- Connection testing with fallback protocols
- Protection against malicious or compromised nodes

## Development

### Hot Reload & Auto-refresh
The development server automatically reloads the extension when you save changes, making development fast and efficient.

**Custom Port:**
```bash
PORT=6002 npm run start
```

### TypeScript Support
Full TypeScript support with type checking and IntelliSense. All wallet libraries are written in TypeScript for better code quality and developer experience.

### Debugging
- Use Chrome DevTools to debug extension pages
- Background script logs appear in the extension's service worker console
- React DevTools work normally for component debugging

### Code Quality
- **ESLint**: Configured with `eslint-config-react-app`
- **Prettier**: Automatic code formatting
- **TypeScript**: Compile-time type checking

## Advanced Configuration

### Content Scripts
If you need to inject scripts into web pages, configure them in `webpack.config.js`:

```js
{
  entry: {
    myContentScript: "./src/js/myContentScript.js"
  },
  chromeExtensionBoilerplate: {
    notHotReload: ["myContentScript"]  // Exclude from hot reload
  }
}
```

And reference in `src/manifest.jsonc`:
```json
{
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["myContentScript.bundle.js"]
    }
  ]
}
```

### Environment Variables & Secrets
For API keys and environment-specific configuration:

**Development:** `./secrets.development.js`
```js
export default { 
  apiKey: 'dev-key-123',
  nodeUrl: 'https://test-node.stellaris.dev'
};
```

**Usage in code:**
```js
import secrets from 'secrets';
console.log(secrets.apiKey);
```

> **Note:** Files matching `secrets.*.js` are automatically ignored by git.

## Contributing

We welcome contributions to Quasar! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow TypeScript conventions** and maintain type safety
3. **Test your changes** thoroughly in both development and production builds
4. **Update documentation** if you're adding new features
5. **Submit a pull request** with a clear description of changes

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing code style and formatting
- Ensure browser compatibility for all cryptographic operations
- Test wallet functionality with multiple blockchain networks
- Maintain security best practices

## Resources & Documentation

- **[Stellaris Blockchain](https://stellaris.dev)** - Official Stellaris network documentation
- **[Chrome Extension Development](https://developer.chrome.com/docs/extensions/)** - Official Chrome extension guides
- **[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)** - Browser cryptography documentation
- **[Webpack Documentation](https://webpack.js.org/concepts/)** - Build system configuration
- **[React 18 Documentation](https://react.dev/)** - UI framework documentation

## Support & Community

- **Telegram**: [VoxaCommunications](https://t.me/voxacommunications)
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Join community discussions on GitHub

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Screenshots

<div style="display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;">
  <img src="https://github.com/StellarisChain/quasar/blob/master/docs/images/screenshot2.png?raw=true" alt="Quasar Wallet Interface" style="border-radius: 8px; max-width: 48%; height: auto; min-width: 300px;">
  <img src="https://github.com/StellarisChain/quasar/blob/master/docs/images/create.png?raw=true" alt="Wallet Creation Flow" style="border-radius: 8px; max-width: 48%; height: auto; min-width: 300px;">
</div>

*Quasar provides a clean, intuitive interface for managing your Stellaris assets directly in your browser.*

---

## Acknowledgments

This project builds upon the excellent work of the Chrome extension boilerplate community and integrates seamlessly with the Stellaris blockchain ecosystem. Special thanks to:

- **Michael Xieyang Liu** - Original Chrome extension boilerplate ([Website](https://lxieyang.github.io))
- **Stellaris Development Team** - Blockchain protocol and Python wallet implementation
- **Open Source Community** - Various cryptographic and web3 libraries

**Developed by Connor W** | [Website](https://connor33341.dev) | [Stellaris Chain](https://stellaris.dev)
