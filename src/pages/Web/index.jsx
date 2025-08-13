import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';

import WebWallet from './WebWallet';
import './index.css';

const container = document.getElementById('app-container');
const root = createRoot(container);

// Make Buffer globally available (needed for crypto operations)
window.Buffer = Buffer;

// Detect device type for responsive behavior
const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Set up responsive scaling
if (isMobile) {
    document.body.classList.add('mobile-device');
} else {
    document.body.classList.add('desktop-device');
}

root.render(<WebWallet isMobile={isMobile} />);
