import fs from 'fs';
import path from 'path';
import stripJsonComments from 'strip-json-comments';

// Webpack plugin to parse manifest.jsonc and output manifest.json
export class ManifestJsoncPlugin {
    constructor(options = {}) {
        this.input = options.input || 'src/manifest.jsonc';
        this.output = options.output || 'build/manifest.json';
        this.packageJson = options.packageJson || 'package.json';
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('ManifestJsoncPlugin', (compilation, callback) => {
            try {
                const inputPath = path.resolve(compiler.context, this.input);
                const outputPath = path.resolve(compiler.context, this.output);
                const pkgPath = path.resolve(compiler.context, this.packageJson);

                let manifestContent = fs.readFileSync(inputPath, 'utf8');
                manifestContent = stripJsonComments(manifestContent);
                let manifest = JSON.parse(manifestContent);

                // Optionally inject description and version from package.json
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                    manifest.description = pkg.description || manifest.description;
                    manifest.version = pkg.version || manifest.version;
                }

                const json = JSON.stringify(manifest, null, 2);
                // Add to Webpack assets
                compilation.assets[path.basename(this.output)] = {
                    source: () => json,
                    size: () => json.length,
                };
            } catch (err) {
                compilation.errors.push(err);
            }
            callback();
        });
    }
}

//module.exports = ManifestJsoncPlugin;
