import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';

import Popup from './Popup';
import './index.css';

const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
window.Buffer = Buffer; // Make Buffer globally available
root.render(<Popup />);
