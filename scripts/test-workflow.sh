#!/bin/bash

# Test script to simulate the GitHub workflow locally
# This helps debug issues before pushing to GitHub

set -e  # Exit on any error

echo "🚀 Testing Quasar Build Workflow Locally"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

print_status "Checking Node.js and pnpm versions..."
echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Get current version
VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $VERSION"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf build/ zip/

# Build for all browsers
print_status "Building extension for all browsers..."
NODE_ENV=production pnpm run dist:all

# Verify build outputs
print_status "Verifying build outputs..."

# Check directories exist
if [ ! -d "build/chrome" ]; then
    print_error "Chrome build directory not found"
    exit 1
fi

if [ ! -d "build/firefox" ]; then
    print_error "Firefox build directory not found"
    exit 1
fi

# Check key files exist
REQUIRED_FILES=(
    "build/chrome/manifest.json"
    "build/chrome/background.bundle.js"
    "build/chrome/popup.html"
    "build/firefox/manifest.json"
    "build/firefox/background.bundle.js"
    "build/firefox/popup.html"
    "zip/quasar-chrome-$VERSION.zip"
    "zip/quasar-firefox-$VERSION.zip"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file not found: $file"
        exit 1
    fi
done

# Verify manifest versions
CHROME_MV=$(node -p "JSON.parse(require('fs').readFileSync('build/chrome/manifest.json', 'utf8')).manifest_version")
FIREFOX_MV=$(node -p "JSON.parse(require('fs').readFileSync('build/firefox/manifest.json', 'utf8')).manifest_version")

if [ "$CHROME_MV" != "3" ]; then
    print_error "Chrome should use Manifest V3, got V$CHROME_MV"
    exit 1
fi

if [ "$FIREFOX_MV" != "2" ]; then
    print_error "Firefox should use Manifest V2, got V$FIREFOX_MV"
    exit 1
fi

# Check zip file sizes
CHROME_SIZE=$(stat -c%s "zip/quasar-chrome-$VERSION.zip" 2>/dev/null || stat -f%z "zip/quasar-chrome-$VERSION.zip" 2>/dev/null || echo "unknown")
FIREFOX_SIZE=$(stat -c%s "zip/quasar-firefox-$VERSION.zip" 2>/dev/null || stat -f%z "zip/quasar-firefox-$VERSION.zip" 2>/dev/null || echo "unknown")

# Display summary
echo ""
echo "🎉 Build Test Completed Successfully!"
echo "====================================="
echo ""
echo "📊 Build Summary:"
echo "  Version: $VERSION"
echo "  Chrome: Manifest V$CHROME_MV ($CHROME_SIZE bytes)"
echo "  Firefox: Manifest V$FIREFOX_MV ($FIREFOX_SIZE bytes)"
echo ""
echo "📦 Generated Files:"
echo "  • build/chrome/ - Chrome extension (Manifest V3)"
echo "  • build/firefox/ - Firefox extension (Manifest V2)"
echo "  • zip/quasar-chrome-$VERSION.zip - Chrome distribution"
echo "  • zip/quasar-firefox-$VERSION.zip - Firefox distribution"
echo ""
echo "🔧 To test the extensions:"
echo ""
echo "Chrome:"
echo "  1. Open chrome://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked' → select build/chrome/"
echo ""
echo "Firefox:"
echo "  1. Open about:debugging"
echo "  2. Click 'This Firefox' → 'Load Temporary Add-on'"
echo "  3. Select any file in build/firefox/"
echo ""
print_status "Ready for GitHub workflow! 🚀"
