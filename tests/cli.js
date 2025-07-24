#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname);
const testFiles = fs.readdirSync(testsDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .filter(f => f !== 'cli.js');

function printUsage() {
    console.log('Usage: node cli.js <test-file>');
    console.log('Available test files:');
    testFiles.forEach(f => console.log('  -', f));
}


const arg = process.argv[2];
const { spawn } = require('child_process');
function runTestFile(file) {
    const ext = path.extname(file);
    const testPath = path.join(testsDir, file);
    if (ext === '.js') {
        // Run JS file in a child process for consistent behavior
        const child = spawn(process.argv[0], [testPath], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('exit', code => {
            process.exit(code);
        });
    } else if (ext === '.ts') {
        // Run ts-node as a child process for proper module resolution
        const tsNodeBin = require.resolve('ts-node/dist/bin.js', { paths: [process.cwd()] });
        const child = spawn(process.argv[0], [tsNodeBin, testPath], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        child.on('exit', code => {
            process.exit(code);
        });
    } else {
        console.error(`Error: Cannot run file with extension '${ext}'. Only .js and .ts files are supported.`);
        process.exit(1);
    }
}

if (!arg) {
    // Interactive terminal GUI
    const readline = require('readline');
    console.log('Select a test file to run:');
    testFiles.forEach((f, i) => {
        console.log(`  [${i + 1}] ${f}`);
    });
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter number: ', answer => {
        const idx = parseInt(answer, 10) - 1;
        rl.close();
        if (isNaN(idx) || idx < 0 || idx >= testFiles.length) {
            console.error('Invalid selection.');
            process.exit(1);
        }
        runTestFile(testFiles[idx]);
    });
} else if (!testFiles.includes(arg)) {
    printUsage();
    process.exit(1);
} else {
    runTestFile(arg);
}