const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');
const path = require('path');
const fs = require('fs');
const { ManifestJsoncPlugin } = require('./utils/manifest-jsonc-plugin');
const ignorePlugin = require('./utils/ignore-plugin');
const progress = require('esbuild-plugin-progress');
const packageJson = require('../package.json');

// Helper to copy static assets
function copyAssets(src, dest) {
    if (!fs.existsSync(src)) return;
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

esbuild.build({
    entryPoints,
    outdir: 'build',
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
    splitting: true,
    format: 'esm',
    target: ['chrome58', 'firefox57'],
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
    },
    plugins: [sassPlugin(), progress()],
}).then(() => {
    // Copy static assets
    copyAssets('src/assets/img', 'build');
    copyAssets('src/assets/static', 'build');
    copyAssets('src/pages/Content', 'build'); // for content.styles.css
    // Inject script tags into HTML files
    const htmlScriptMap = [
        { html: 'src/pages/Newtab/index.html', out: 'build/newtab.html', script: 'newtab.bundle.js', css: 'newtab.bundle.css' },
        { html: 'src/pages/Options/index.html', out: 'build/options.html', script: 'options.bundle.js', css: 'options.bundle.css' },
        { html: 'src/pages/Popup/index.html', out: 'build/popup.html', script: 'popup.bundle.js', css: 'popup.bundle.css' },
        { html: 'src/pages/Devtools/index.html', out: 'build/devtools.html', script: 'devtools.bundle.js', css: 'devtools.bundle.css' },
        { html: 'src/pages/Panel/index.html', out: 'build/panel.html', script: 'panel.bundle.js', css: 'panel.bundle.css' },
    ];
    htmlScriptMap.forEach(({ html, out, script, css }) => {
        injectScriptToHtml(html, out, script, css);
    });
    // Copy manifest
    if (fs.existsSync('src/manifest.jsonc')) new ManifestJsoncPlugin({
        input: 'src/manifest.jsonc',
        output: 'build/manifest.json',
        packageJson: 'package.json',
    }).apply();
    //console.log('Build complete!');
}).catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
});