// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
    path = require('path'),
    fs = require('fs'),
    config = require('../webpack.config'),
    ZipPlugin = require('zip-webpack-plugin');

// Get browser target from command line arguments
const args = process.argv.slice(2);
const browserIndex = args.indexOf('--browser');
const browser = browserIndex !== -1 && args[browserIndex + 1] ? args[browserIndex + 1] : 'chrome';

console.log(`Building for ${browser}...`);

// Set browser environment variable
process.env.TARGET_BROWSER = browser;

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Create browser-specific output directory
const outputDir = path.join(__dirname, '../', 'build', browser);
config.output.path = outputDir;

// Update manifest plugin configuration for browser-specific manifest
const manifestPlugin = config.plugins.find(plugin =>
    plugin.constructor.name === 'ManifestJsoncPlugin'
);

if (manifestPlugin) {
    const pluginIndex = config.plugins.indexOf(manifestPlugin);
    const ManifestJsoncPlugin = require('./manifest-jsonc-plugin');

    config.plugins[pluginIndex] = new ManifestJsoncPlugin.ManifestJsoncPlugin({
        input: `src/manifest-${browser}.jsonc`,
        output: `build/${browser}/manifest.json`,
        packageJson: 'package.json',
        browser: browser,
    });
}

config.plugins = (config.plugins || []).concat(
    new ZipPlugin({
        filename: `${packageInfo.name}-${browser}-${packageInfo.version}.zip`,
        path: path.join(__dirname, '../', 'zip'),
    })
);

webpack(config, function (err) {
    if (err) throw err;
    console.log(`Build completed for ${browser}`);
});
