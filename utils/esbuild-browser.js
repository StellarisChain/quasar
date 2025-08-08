const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');
const path = require('path');
const fs = require('fs');
const { ManifestJsoncPlugin } = require('./manifest-jsonc-plugin');
const progress = require('esbuild-plugin-progress');
const packageJson = require('../package.json');

// Get browser target from command line arguments
const args = process.argv.slice(2);
const browserIndex = args.indexOf('--browser');
const browser = browserIndex !== -1 && args[browserIndex + 1] ? args[browserIndex + 1] : 'chrome';

console.log(`Building for ${browser} using esbuild...`);

// Set browser environment variable
process.env.TARGET_BROWSER = browser;

// Helper to copy static assets
function copyAssets(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Helper to inject script tag into HTML files
function injectScriptToHtml(srcHtml, destHtml, scriptName, cssName) {
    if (!fs.existsSync(srcHtml)) return;
    let html = fs.readFileSync(srcHtml, 'utf8');

    // Add version comment at the top of the HTML file
    const versionComment = `<!-- Version: ${packageJson.version} -->\n`;
    html = versionComment + html;

    // Insert CSS link before </head> or at start if not found
    let cssTag = '';
    if (cssName) {
        cssTag = `<link rel="stylesheet" href="./${cssName}">`;
        if (/<\/head>/i.test(html)) {
            html = html.replace(/<\/head>/i, `${cssTag}\n</head>`);
        } else {
            html = `${cssTag}\n` + html;
        }
    }
    // Insert script before </body> or at end if not found
    const scriptTag = `<script type="module" src="./${scriptName}"></script>`;
    if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
        html += `\n${scriptTag}`;
    }
    fs.writeFileSync(destHtml, html);
}

// Create browser-specific output directory
const outputDir = `build/${browser}`;

// Build entry points
const entryPoints = {
    // newtab: 'src/pages/Newtab/index.jsx',
    options: 'src/pages/Options/index.jsx',
    popup: 'src/pages/Popup/index.jsx',
    background: 'src/pages/Background/index.js',
    content: 'src/pages/Content/index.js',
    devtools: 'src/pages/Devtools/index.js',
    panel: 'src/pages/Panel/index.jsx',
};

// Browser-specific build configuration
const buildConfig = {
    entryPoints,
    outdir: outputDir,
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
    splitting: true,
    format: 'esm',
    target: browser === 'firefox' ? ['firefox78'] : ['chrome88'],
    entryNames: '[name].bundle',
    loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'ts',
        '.tsx': 'tsx',
        '.css': 'css',
        '.png': 'file',
        '.svg': 'file',
        '.jpg': 'file',
        '.jpeg': 'file',
        '.gif': 'file',
        '.eot': 'file',
        '.otf': 'file',
        '.ttf': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.html': 'file',
        '.xml': 'file',
    },
    define: {
        'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
        'process.env.TARGET_BROWSER': `"${browser}"`,
        // Firefox-specific polyfills
        ...(browser === 'firefox' && {
            'chrome': 'browser',
            'global': 'globalThis',
        }),
    },
    plugins: [
        sassPlugin(),
        progress(),
        // Browser-specific plugin configurations
        ...(browser === 'firefox' ? [] : []), // Add Firefox-specific plugins if needed
    ],
};

// For Firefox, we might need different settings
if (browser === 'firefox') {
    // Firefox-specific adjustments
    buildConfig.format = 'iife'; // Firefox sometimes works better with IIFE
    buildConfig.splitting = false; // Disable code splitting for Firefox compatibility
}

esbuild.build(buildConfig).then(() => {
    // Copy static assets to browser-specific directory
    copyAssets('src/assets/img', outputDir);
    copyAssets('src/assets/static', outputDir);
    copyAssets('src/pages/Content', outputDir); // for content.styles.css

    // Inject script tags into HTML files
    const htmlScriptMap = [
        { html: 'src/pages/Newtab/index.html', out: `${outputDir}/newtab.html`, script: 'newtab.bundle.js', css: 'newtab.bundle.css' },
        { html: 'src/pages/Options/index.html', out: `${outputDir}/options.html`, script: 'options.bundle.js', css: 'options.bundle.css' },
        { html: 'src/pages/Popup/index.html', out: `${outputDir}/popup.html`, script: 'popup.bundle.js', css: 'popup.bundle.css' },
        { html: 'src/pages/Devtools/index.html', out: `${outputDir}/devtools.html`, script: 'devtools.bundle.js', css: 'devtools.bundle.css' },
        { html: 'src/pages/Panel/index.html', out: `${outputDir}/panel.html`, script: 'panel.bundle.js', css: 'panel.bundle.css' },
    ];

    // Ensure output directory exists for HTML files
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    htmlScriptMap.forEach(({ html, out, script, css }) => {
        injectScriptToHtml(html, out, script, css);
    });

    // Copy browser-specific manifest
    const manifestInput = `src/manifest-${browser}.jsonc`;
    const manifestOutput = `${outputDir}/manifest.json`;

    if (fs.existsSync(manifestInput)) {
        new ManifestJsoncPlugin({
            input: manifestInput,
            output: manifestOutput,
            packageJson: 'package.json',
            browser: browser,
        }).apply();
    } else {
        console.warn(`Warning: ${manifestInput} not found, falling back to src/manifest.jsonc`);
        if (fs.existsSync('src/manifest.jsonc')) {
            new ManifestJsoncPlugin({
                input: 'src/manifest.jsonc',
                output: manifestOutput,
                packageJson: 'package.json',
                browser: browser,
            }).apply();
        }
    }

    console.log(`✅ Build complete for ${browser}! Output: ${outputDir}`);
}).catch((err) => {
    console.error(`❌ Build failed for ${browser}:`, err);
    process.exit(1);
});
