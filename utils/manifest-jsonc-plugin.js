import fs from 'fs';
import path from 'path';
import stripJsonComments from 'strip-json-comments';

// Webpack plugin to parse manifest.jsonc and output manifest.json
export class ManifestJsoncPlugin {
    constructor(options = {}) {
        this.input = options.input || 'src/manifest.jsonc';
        this.output = options.output || 'build/manifest.json';
        this.packageJson = options.packageJson || 'package.json';
        this.browser = options.browser || 'chrome'; // 'chrome' or 'firefox'
    }

    parse() {
        let manifestContent = fs.readFileSync(this.inputPath, 'utf8');
        manifestContent = stripJsonComments(manifestContent);
        let manifest = JSON.parse(manifestContent);

        // Optionally inject description and version from package.json
        if (fs.existsSync(this.pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(this.pkgPath, 'utf8'));
            manifest.description = pkg.description || manifest.description;
            manifest.version = pkg.version || manifest.version;
        }

        // Browser-specific adjustments
        if (this.browser === 'firefox') {
            // Firefox-specific manifest adjustments
            manifest.applications = {
                gecko: {
                    id: "quasar@stellarischain.connor33341.dev",
                    strict_min_version: "91.0"
                }
            };

            // Convert Chrome APIs to Firefox equivalents if needed
            if (manifest.host_permissions) {
                manifest.permissions = manifest.permissions || [];
                manifest.permissions = manifest.permissions.concat(manifest.host_permissions);
                delete manifest.host_permissions;
            }
        }

        this.json = JSON.stringify(manifest, null, 2);
    }

    apply(compiler) {
        if (compiler && compiler.hooks) {
            // Webpack environment
            compiler.hooks.emit.tapAsync('ManifestJsoncPlugin', (compilation, callback) => {
                try {
                    // Use the same logic as the standalone function, but add to compilation.assets
                    this.context = compiler.context;
                    this.inputPath = path.resolve(this.context, this.input);
                    this.outputPath = path.resolve(this.context, this.output);
                    this.pkgPath = path.resolve(this.context, this.packageJson);

                    /*let manifestContent = fs.readFileSync(this.inputPath, 'utf8');
                    manifestContent = stripJsonComments(manifestContent);
                    let manifest = JSON.parse(manifestContent);

                    // Optionally inject description and version from package.json
                    if (fs.existsSync(this.pkgPath)) {
                        const pkg = JSON.parse(fs.readFileSync(this.pkgPath, 'utf8'));
                        manifest.description = pkg.description || manifest.description;
                        manifest.version = pkg.version || manifest.version;
                    }

                    const json = JSON.stringify(manifest, null, 2);*/
                    this.parse();
                    // Add to Webpack assets
                    compilation.assets[path.basename(this.output)] = {
                        source: () => this.json,
                        size: () => this.json.length,
                    };
                } catch (err) {
                    compilation.errors.push(err);
                }
                callback();
            });
        } else {
            // Fallback for direct invocation (ESBuild/Node)
            this.context = process.cwd();
            this.inputPath = path.resolve(this.context, this.input);
            this.outputPath = path.resolve(this.context, this.output);
            this.pkgPath = path.resolve(this.context, this.packageJson);
            this.parse();

            // Write to output file
            fs.writeFileSync(this.outputPath, this.json);
        }
    }
}

//module.exports = ManifestJsoncPlugin;
