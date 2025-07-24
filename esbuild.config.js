const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const manifestJsoncPlugin = require('./utils/manifest-jsonc-plugin');

// Helper to copy static assets
function copyAssets(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.readdirSync(src).forEach(file => {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  });
}

// Build entry points
const entryPoints = [
  'src/pages/Newtab/index.jsx',
  'src/pages/Options/index.jsx',
  'src/pages/Popup/index.jsx',
  'src/pages/Background/index.js',
  'src/pages/Content/index.js',
  'src/pages/Devtools/index.js',
  'src/pages/Panel/index.jsx',
];

esbuild.build({
  entryPoints,
  outdir: 'build',
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  splitting: true,
  format: 'esm',
  target: ['chrome58', 'firefox57'],
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
}).then(() => {
  // Copy static assets
  copyAssets('src/assets/img', 'build');
  copyAssets('src/assets/static', 'build');
  copyAssets('src/pages/Content', 'build'); // for content.styles.css
  // Copy HTML files
  [
    ['src/pages/Newtab/index.html', 'build/newtab.html'],
    ['src/pages/Options/index.html', 'build/options.html'],
    ['src/pages/Popup/index.html', 'build/popup.html'],
    ['src/pages/Devtools/index.html', 'build/devtools.html'],
    ['src/pages/Panel/index.html', 'build/panel.html'],
  ].forEach(([src, dest]) => {
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
  });
  // Copy manifest
  if (fs.existsSync('src/manifest.jsonc')) manifestJsoncPlugin({
  input: 'src/manifest.jsonc',
  output: 'build/manifest.json',
  packageJson: 'package.json',
}).apply();
  console.log('Build complete!');
}).catch(() => process.exit(1));