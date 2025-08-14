# Web Build Documentation

This document explains the new web build feature for Quasar wallet, which allows the wallet to run as a responsive web application instead of just a browser extension.

## Overview

The `esbuild:web` script builds Quasar as a standalone web application with responsive design that adapts to both mobile and desktop viewports. This allows users to access their wallet through any modern web browser without needing to install a browser extension.

## Features

### Responsive Design
- **Mobile View**: Optimized for phones and tablets (viewport width ≤ 768px)
  - Full-screen layout
  - Touch-friendly interface
  - Larger buttons and text
  - Safe area support for devices with notches
  - Prevents double-tap zoom on iOS Safari

- **Desktop View**: Optimized for desktop browsers (viewport width > 768px)
  - Compact wallet window (400px width)
  - Centered layout with shadows
  - Smaller, more precise interface elements
  - Custom scrollbars

### Dynamic Scaling
- Automatically detects device type on load
- Responds to window resize events
- Smooth transitions between mobile and desktop layouts
- Environment variable support for different platforms

## Usage

### Building for Web
```bash
# Build the web version only
npm run esbuild:web

# Build all targets (Chrome, Firefox, and Web)
npm run esbuild:all
```

### Running the Web Wallet
```bash
# Build and serve the web wallet
npm run start:web

# This will:
# 1. Build the web version using esbuild
# 2. Start a local server on http://localhost:3000
# 3. Automatically handle routing for SPA behavior
```

### Accessing the Wallet
Once the server is running, open your browser to:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000 (for testing on mobile devices)

## Architecture

### Entry Point
- **File**: `src/pages/Web/index.jsx`
- **Purpose**: Web-specific entry point that:
  - Detects device type (mobile/desktop)
  - Sets up responsive behavior
  - Initializes Buffer polyfill for crypto operations
  - Applies appropriate CSS classes

### Main Component
- **File**: `src/pages/Web/WebWallet.tsx`
- **Purpose**: Wrapper component that:
  - Handles window resize events
  - Manages responsive state
  - Provides background patterns for desktop
  - Prevents zoom on mobile Safari
  - Reuses existing Popup component

### Styling
- **File**: `src/pages/Web/index.css` - Base responsive styles
- **File**: `src/pages/Web/WebWallet.css` - Component-specific styles

### Build Configuration
- **File**: `utils/esbuild-web.js`
- **Output**: `build/web/`
- **Features**:
  - ES modules with code splitting
  - CSS extraction and optimization
  - Asset copying and optimization
  - Responsive HTML template generation

## Technical Details

### Environment Variables
- `TARGET_PLATFORM=web` - Set during web builds
- Used for platform-specific code paths

### Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
```

### CSS Media Queries
```css
/* Mobile-first approach */
@media (max-width: 768px) { /* Mobile styles */ }
@media (min-width: 769px) { /* Desktop styles */ }
```

### Device Detection
```javascript
const isMobile = window.innerWidth <= 768 || 
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
```

## Development

### File Structure
```
src/pages/Web/
├── index.jsx          # Entry point
├── index.css          # Base responsive styles
├── WebWallet.tsx      # Main wrapper component
└── WebWallet.css      # Component styles

utils/
├── esbuild-web.js     # Web build script
└── webserver-simple.js # Development server
```

### Development Features
- Source maps for debugging
- Hot reload support (when used with development server)
- Device type indicator (development mode only)
- Console logging for device detection

## Deployment

### Static Hosting
The built files in `build/web/` are completely static and can be hosted on:
- Netlify
- Vercel
- GitHub Pages
- Amazon S3 + CloudFront
- Any static file server

### Server Requirements
- No server-side rendering required
- All files are pre-built static assets
- SPA routing handled client-side

### Production Optimizations
- Minified JavaScript and CSS
- Asset optimization
- Gzip compression (server dependent)
- CDN-friendly file naming

## Browser Compatibility
- Chrome/Chromium 88+
- Firefox 78+
- Safari 14+
- Edge 88+
- Mobile browsers with ES2020 support

## Security Considerations
- All crypto operations happen client-side
- No wallet data sent to servers
- Same security model as browser extension
- Local storage for wallet persistence
- HTTPS recommended for production

## Performance
- Code splitting for faster initial load
- Lazy loading of wallet components
- Optimized asset delivery
- Minimal bundle size for web target

## Troubleshooting

### Build Issues
```bash
# Clear build cache
rm -rf build/web
npm run esbuild:web
```

### Server Issues
```bash
# Check if port 3000 is available
lsof -i :3000

# Use different port
PORT=8080 npm run start:web
```

### Mobile Testing
1. Connect mobile device to same network
2. Find your computer's IP: `ifconfig` (macOS/Linux) or `ipconfig` (Windows)
3. Access: http://[computer-ip]:3000

## Future Enhancements
- PWA (Progressive Web App) support
- Offline functionality
- Push notifications
- Web3 provider integration
- Deep linking support
