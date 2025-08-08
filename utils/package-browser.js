const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Get browser target from command line arguments
const args = process.argv.slice(2);
const browserIndex = args.indexOf('--browser');
const browser = browserIndex !== -1 && args[browserIndex + 1] ? args[browserIndex + 1] : 'chrome';

// Get build tool from command line arguments
const toolIndex = args.indexOf('--tool');
const buildTool = toolIndex !== -1 && args[toolIndex + 1] ? args[toolIndex + 1] : 'webpack';

console.log(`Creating distribution package for ${browser} (built with ${buildTool})...`);

const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const sourceDir = path.join(__dirname, '..', 'build', browser);
const outputDir = path.join(__dirname, '..', 'zip');
const outputFile = path.join(outputDir, `${packageInfo.name}-${browser}-${packageInfo.version}.zip`);

// Create zip directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory ${sourceDir} does not exist. Please build the extension first.`);
    console.log(`Run: npm run ${buildTool}:${browser}`);
    process.exit(1);
}

// Create a file to stream archive data to
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function () {
    console.log(`✅ Created ${outputFile} (${archive.pointer()} total bytes)`);
    console.log(`📦 Distribution package ready for ${browser}`);
});

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
    } else {
        throw err;
    }
});

// Good practice to catch this error explicitly
archive.on('error', function (err) {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Append files from the build directory
archive.directory(sourceDir, false);

// Finalize the archive (ie we are done appending files but streams have to finish yet)
archive.finalize();
