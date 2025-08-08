# Automatic Version Incrementing

This project is configured to automatically increment the patch version (0.0.x) on each commit. There are multiple approaches available:

## 🤖 GitHub Actions Auto-Versioning (Recommended)

The primary versioning mechanism uses GitHub Actions and automatically increments the patch version whenever code is pushed to the `master` branch.

### How it works:
1. When you push to `master`, the GitHub Actions workflow automatically runs
2. It increments the patch version (e.g., `5.0.4` → `5.0.5`)
3. Updates `package.json` with the new version
4. Builds the extension for Chrome and Firefox
5. Creates a GitHub release with the built artifacts
6. Commits the version bump back to the repository

### Features:
- ✅ Automatic patch version increment on every `master` push
- ✅ Manual version control via GitHub Actions dispatch
- ✅ Skips version bump if version was manually changed
- ✅ Includes `[skip ci]` to prevent infinite loops
- ✅ Creates releases with proper changelogs

## 🔧 Git Pre-commit Hook (Alternative)

A pre-commit hook is also available that increments the version locally before each commit.

### How it works:
1. Before each commit, the hook runs automatically
2. It increments the patch version in `package.json`
3. Stages the updated `package.json` file
4. The commit includes both your changes and the version bump

### Features:
- ✅ Automatic version increment on every commit
- ✅ Skips merge commits
- ✅ Skips if `[skip version]` is in commit message
- ✅ Skips if version was manually changed
- ✅ Works locally without requiring GitHub Actions

### To skip version increment in pre-commit hook:
```bash
git commit -m "fix: some bug [skip version]"
```

## 📝 Manual Version Control

You can also manually control versioning using the provided npm scripts:

```bash
# Increment patch version (0.0.x)
npm run version:patch

# Increment minor version (0.x.0)
npm run version:minor

# Increment major version (x.0.0)
npm run version:major

# Increment patch without creating git tag
npm run version:auto
```

## 🎯 GitHub Actions Manual Dispatch

You can manually trigger a release with custom version increment:

1. Go to GitHub Actions tab
2. Select "Build and Release Extension" workflow
3. Click "Run workflow"
4. Choose version increment type (patch/minor/major)
5. Optionally mark as prerelease

## 📋 Current Version: 5.0.4

The current version is automatically read from `package.json` and used throughout the build process for:
- Extension manifest files
- Build artifact names
- GitHub release tags
- Package distribution

## 🔄 Version Flow

```
Local Development → Commit → Push to master → GitHub Actions → Auto-increment → Build → Release
```

## ⚙️ Configuration

### To disable auto-versioning:
- **GitHub Actions**: Remove or comment out the "Auto-increment patch version" step
- **Pre-commit hook**: Delete or rename `.git/hooks/pre-commit`

### To change increment type:
- **GitHub Actions**: Change `patch` to `minor` or `major` in the auto-increment step
- **Pre-commit hook**: Change `npm version patch` to `npm version minor` or `npm version major`

## 🚨 Important Notes

1. **Choose one approach**: Use either GitHub Actions auto-versioning OR pre-commit hooks, not both
2. **Master branch**: Auto-versioning only works on the `master` branch by default
3. **CI/CD**: The `[skip ci]` tag prevents infinite build loops
4. **Conflicts**: If multiple developers are committing, merge conflicts may occur in `package.json`

## 🛠 Troubleshooting

### Version conflicts:
If you encounter version conflicts, manually resolve them and commit:
```bash
git add package.json
git commit -m "resolve: version conflict"
```

### Disable for specific commits:
```bash
# For pre-commit hook
git commit -m "docs: update readme [skip version]"

# For GitHub Actions
git commit -m "docs: update readme [skip ci]"
```
