const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Get target from command line arguments
const args = process.argv.slice(2);
const targetIndex = args.indexOf('--target');
const target = targetIndex !== -1 && args[targetIndex + 1] ? args[targetIndex + 1] : 'chrome';

const PORT = process.env.PORT || 3000;

// Determine the build directory based on target
let buildDir;
if (target === 'web') {
    buildDir = path.join(__dirname, '../build/web');
} else {
    buildDir = path.join(__dirname, '../build');
}

console.log(`Starting server for ${target} target...`);
console.log(`Serving from: ${buildDir}`);

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
    console.error(`❌ Build directory ${buildDir} does not exist!`);
    console.log(`Run 'npm run esbuild:${target}' first to build the application.`);
    process.exit(1);
}

// Simple MIME type mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Handle root path
    if (pathname === '/') {
        if (target === 'web') {
            pathname = '/index.html';
        } else {
            // For browser extensions, list available pages
            const files = fs.readdirSync(buildDir).filter(file => file.endsWith('.html'));
            const links = files.map(file => `<li><a href="/${file}">${file}</a></li>`).join('');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <h1>Quasar Browser Extension - ${target}</h1>
                <h2>Available Pages:</h2>
                <ul>${links}</ul>
                <p>Build directory: ${buildDir}</p>
            `);
            return;
        }
    }
    
    // Construct file path
    const filePath = path.join(buildDir, pathname);
    
    // Check if file exists
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (target === 'web') {
                // For web SPA, serve index.html for all routes
                const indexPath = path.join(buildDir, 'index.html');
                if (fs.existsSync(indexPath)) {
                    serveFile(indexPath, res);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('index.html not found. Please run "npm run esbuild:web" first.');
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            }
            return;
        }
        
        serveFile(filePath, res);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    if (target === 'web') {
        console.log(`📱 Web wallet available at http://localhost:${PORT}`);
        console.log(`   - Mobile view: resize browser to < 768px width`);
        console.log(`   - Desktop view: resize browser to >= 768px width`);
    } else {
        console.log(`🔧 Extension files available at http://localhost:${PORT}`);
    }
    console.log(`📂 Serving from: ${buildDir}`);
});
