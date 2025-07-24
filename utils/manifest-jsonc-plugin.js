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

    parse(){
        let manifestContent = fs.readFileSync(this.inputPath, 'utf8');
        manifestContent = stripJsonComments(manifestContent);
        let manifest = JSON.parse(manifestContent);

        // Optionally inject description and version from package.json
        if (fs.existsSync(this.pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(this.pkgPath, 'utf8'));
            manifest.description = pkg.description || manifest.description;
            manifest.version = pkg.version || manifest.version;
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
