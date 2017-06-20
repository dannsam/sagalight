const rollup = require("rollup");
const fs = require("fs-extra");
const path = require("path");
const ts = require("typescript");
const exec = require("child_process").execSync;

// make sure we're in the right folder
process.chdir(path.resolve(__dirname, ".."));

const binFolder = path.resolve("node_modules/.bin/");

fs.removeSync("lib");
fs.removeSync(".build");

function runTypeScriptBuild(outDir, target, declarations) {
	console.log(`Running typescript build (target: ${ts.ScriptTarget[target]}) in ${outDir}/`);

	const tsConfig = path.resolve("tsconfig.json");
	const json = ts.parseConfigFileTextToJson(
		tsConfig,
		ts.sys.readFile(tsConfig),
		true
	);

	const { options } = ts.parseJsonConfigFileContent(
		json.config,
		ts.sys,
		path.dirname(tsConfig)
	);

	options.target = target;
	options.outDir = outDir;
	options.declaration = declarations;

	options.module = ts.ModuleKind.ES2015;
	options.importHelpers = true;
	options.noEmitHelpers = true;
	if (declarations)
		options.declarationDir = path.resolve(".", "lib");

	const rootFile = path.resolve("src", "saga-core.ts");
	const host = ts.createCompilerHost(options, true);
	const prog = ts.createProgram([rootFile], options, host);
	const result = prog.emit();
	if (result.emitSkipped) {
		const message = result.diagnostics.map(d =>
			`${ts.DiagnosticCategory[d.category]} ${d.code} (${d.fileName}:${d.start}): ${d.messageText}`
		).join("\n");

		throw new Error(`Failed to compile typescript:\n\n${message}`);
	}
}


const rollupPlugins = [
	require("rollup-plugin-node-resolve")(),
	require("rollup-plugin-progress")(),
	require("rollup-plugin-filesize")()
];

function generateBundledModule(inputFile, outputFile, format) {

	console.log(`Generating ${outputFile} bundle.`);

	return rollup.rollup({
		entry: inputFile,
		plugins: rollupPlugins
	}).then(bundle => bundle.write({
		dest: outputFile,
		format,
		banner: "/** saga-core - (c) Daniil Samoylov 2017 - MIT Licensed */",
		exports: "named"
	}));
}

function generateUmd() {
	console.log("Generating saga-core.umd.js");
    const browserify = require('browserify');

	exec(`${binFolder}/browserify -s saga-core -e lib/saga-core.js -o lib/saga-core.umd.js`);
}

function generateMinified() {
	console.log("Generating saga-core.min.js and saga-core.umd.min.js");
	exec(
		`${binFolder}/uglifyjs -m sort,toplevel -c warnings=false --screw-ie8 --preamble "/** saga-core - (c) Daniil Samoylov 2017 - MIT Licensed */" --source-map -o lib/saga-core.min.js lib/saga-core.js`
	);
	exec(
		`${binFolder}/uglifyjs -m sort,toplevel -c warnings=false --screw-ie8 --preamble "/** saga-core - (c) Daniil Samoylov 2017 - MIT Licensed */" --source-map -o lib/saga-core.umd.min.js lib/saga-core.umd.js`
	);
}

function build() {
	runTypeScriptBuild(".build", ts.ScriptTarget.ES5, true);
	return Promise.all([

		generateBundledModule(
			path.resolve(".build", "saga-core.js"),
			path.resolve("lib", "saga-core.js"),
			"cjs"
		),

		generateBundledModule(
			path.resolve(".build", "saga-core.js"),
			path.resolve("lib", "saga-core.module.js"),
			"es"
		)

	]).then(() => {
		generateUmd();
		generateMinified();
	});
}

build().catch(e => {
	console.error(e);
	if (e.frame) {
		console.error(e.frame);
	}
	process.exit(1);
});