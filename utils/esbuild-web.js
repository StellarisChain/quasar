const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');
const path = require('path');
const fs = require('fs');
const progress = require('esbuild-plugin-progress');
const packageJson = require('../package.json');

console.log('Building for web using esbuild...');

// Set web environment variable
process.env.TARGET_PLATFORM = 'web';

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

    // Add responsive viewport meta tag for mobile scaling
    const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">';
    if (/<head>/i.test(html)) {
        html = html.replace(/<head>/i, `<head>\n${viewportMeta}`);
    } else {
        html = `${viewportMeta}\n` + html;
    }

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

// Create web-specific output directory
const outputDir = 'build/web';

// Web-specific entry points - using the web entry point
const entryPoints = {
    app: 'src/pages/Web/index.jsx',
};

// Web build configuration
const buildConfig = {
    entryPoints,
    outdir: outputDir,
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
    splitting: true,
    format: 'esm',
    target: ['es2020'],
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
        'process.env.TARGET_PLATFORM': `"web"`,
        'global': 'globalThis',
    },
    plugins: [
        sassPlugin(),
        progress(),
    ],
};

esbuild.build(buildConfig).then(() => {
    // Copy static assets to web directory
    copyAssets('src/assets/img', outputDir);
    copyAssets('src/assets/static', outputDir);

    // Create the main HTML file for the web app
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quasar Wallet</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #000;
            color: #fff;
            overflow-x: hidden;
        }
        
        #app-container {
            min-height: 100vh;
            width: 100%;
        }
        
        /* Mobile-first responsive design */
        @media (max-width: 768px) {
            #app-container {
                font-size: 16px;
            }
        }
        
        @media (min-width: 769px) {
            #app-container {
                font-size: 14px;
                max-width: 400px;
                margin: 20px auto;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
        }
    </style>
</head>
<body>
    <div id="app-container"></div>
</body>
</html>`;

    // Ensure output directory exists for HTML files
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Inject script tags into the HTML template
    const htmlOutput = `${outputDir}/index.html`;
    fs.writeFileSync(htmlOutput, htmlTemplate);
    injectScriptToHtml(htmlOutput, htmlOutput, 'app.bundle.js', 'app.bundle.css');

    console.log(`✅ Web build complete! Output: ${outputDir}`);
    console.log(`📱 Mobile-responsive wallet ready at ${outputDir}/index.html`);
}).catch((err) => {
    console.error(`❌ Web build failed:`, err);
    process.exit(1);
});
