import React from 'react';
import { createRoot } from 'react-dom/client';

import Panel from './Panel';
import './index.css';
import { TranslationProvider } from '../../lib/i18n';

const container = document.getElementById('app-container');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
    <TranslationProvider>
        <Panel />
    </TranslationProvider>
);
