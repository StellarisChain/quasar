# GitHub Workflows Documentation

This repository includes automated GitHub Actions workflows for building, testing, and releasing the Quasar browser extension.

## Workflows

### 1. Build and Release (`build-and-release.yml`)

**Purpose**: Creates official releases with built extension packages for both Chrome and Firefox.

**Triggers**:
- **Automatic**: Push to `master` branch
- **Manual**: Workflow dispatch with options

**Manual Dispatch Options**:
- `release_type`: patch, minor, or major version bump
- `prerelease`: Mark release as prerelease

**What it does**:
1. ✅ Builds extension for Chrome (Manifest V3)
2. ✅ Builds extension for Firefox (Manifest V2)
3. ✅ Creates distribution zip files
4. ✅ Generates changelog from git commits
5. ✅ Creates GitHub release with assets
6. ✅ Uploads build artifacts

**Outputs**:
- GitHub release with zip files
- Artifacts: `quasar-chrome-extension` and `quasar-firefox-extension`

### 2. Continuous Integration (`ci.yml`)

**Purpose**: Validates builds on pull requests and dev branch pushes.

**Triggers**:
- Pull requests to `master` or `dev`
- Push to `dev` branch

**What it does**:
1. ✅ Tests on Node.js 18 and 20
2. ✅ Builds both browser versions
3. ✅ Validates build outputs
4. ✅ Verifies manifest versions
5. ✅ Uploads temporary artifacts

## Usage

### Creating a Release

#### Method 1: Automatic (Recommended)
1. Merge your changes to the `master` branch
2. The workflow will automatically create a release using the current `package.json` version

#### Method 2: Manual Dispatch
1. Go to **Actions** → **Build and Release**
2. Click **Run workflow**
3. Choose:
   - Branch: `master`
   - Release type: `patch`, `minor`, or `major`
   - Prerelease: `true` for beta releases
4. Click **Run workflow**

### Version Management

The workflow handles versioning in two ways:

1. **Automatic**: Uses the current version from `package.json`
2. **Manual**: Bumps version using npm semver rules

**Version Bump Rules**:
- `patch`: 1.0.0 → 1.0.1 (bug fixes)
- `minor`: 1.0.0 → 1.1.0 (new features)
- `major`: 1.0.0 → 2.0.0 (breaking changes)

### Release Assets

Each release includes:

1. **`quasar-chrome-{version}.zip`**
   - Ready for Chrome Web Store
   - Manifest V3 format
   - Optimized for Chrome

2. **`quasar-firefox-{version}.zip`**
   - Ready for Firefox Add-ons
   - Manifest V2 format
   - Optimized for Firefox

### Monitoring Builds

#### Check Workflow Status
- Go to **Actions** tab in GitHub
- Click on the workflow run
- Monitor progress and logs

#### Download Artifacts
- Build artifacts are available for 30 days (releases) or 7 days (CI)
- Click on the workflow run → **Artifacts** section
- Download the browser-specific builds

## Requirements

### Repository Settings
- **Actions**: Enabled
- **Permissions**: 
  - Contents: Write (for creating releases)
  - Packages: Write (for artifacts)

### Secrets
No additional secrets required! The workflow uses the built-in `GITHUB_TOKEN`.

## Troubleshooting

### Common Issues

1. **Build Fails**
   ```
   ❌ Chrome build directory not found
   ```
   - Check if `pnpm run dist:all` works locally
   - Verify build scripts in `package.json`

2. **Release Already Exists**
   ```
   ❌ Release already exists for this tag
   ```
   - Update version in `package.json`
   - Or use manual dispatch with version bump

3. **Permission Denied**
   ```
   ❌ Resource not accessible by integration
   ```
   - Check repository permissions
   - Ensure Actions have write permissions

### Debugging Steps

1. **Local Testing**:
   ```bash
   pnpm install
   pnpm run dist:all
   ls -la zip/
   ```

2. **Check Workflow Logs**:
   - Go to Actions → Failed workflow
   - Click on failed step
   - Check detailed logs

3. **Validate Build Outputs**:
   ```bash
   # Check manifest versions
   cat build/chrome/manifest.json | jq .manifest_version
   cat build/firefox/manifest.json | jq .manifest_version
   ```

## Workflow Files

- `.github/workflows/build-and-release.yml` - Release workflow
- `.github/workflows/ci.yml` - CI workflow

## Best Practices

1. **Development Flow**:
   - Create feature branches
   - Open PRs to `dev` (triggers CI)
   - Merge `dev` to `master` (triggers release)

2. **Version Management**:
   - Keep `package.json` version updated
   - Use semantic versioning
   - Tag important releases

3. **Testing**:
   - Always test locally before pushing
   - Monitor CI builds on PRs
   - Test extension in both browsers

4. **Release Notes**:
   - Write clear commit messages
   - They become part of the changelog
   - Use conventional commits for better automation
