const rollup = require("rollup");
const fs = require("fs-extra");
const path = require("path");
const ts = require("typescript");
const exec = require("child_process").execSync;
const dtsBuilder = require('dts-builder');

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

	const rootFile = path.resolve("src", "sagalight.ts");
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
		banner: "/** SagaLight - (c) Daniil Samoylov 2017 - MIT Licensed */",
		exports: "named"
	}));
}

function generateUmd() {
	console.log("Generating sagalight.umd.js");
	const browserify = require('browserify');

	exec(`${binFolder}/browserify -s sagalight -e lib/sagalight.js -o lib/sagalight.umd.js`);
}

function generateMinified() {
	console.log("Generating sagalight.min.js and sagalight.umd.min.js");
	exec(
		`${binFolder}/uglifyjs -m sort,toplevel -c warnings=false --screw-ie8 --preamble "/** SagaLight - (c) Daniil Samoylov 2017 - MIT Licensed */" --source-map -o lib/sagalight.min.js lib/sagalight.js`
	);
	exec(
		`${binFolder}/uglifyjs -m sort,toplevel -c warnings=false --screw-ie8 --preamble "/** SagaLight - (c) Daniil Samoylov 2017 - MIT Licensed */" --source-map -o lib/sagalight.umd.min.js lib/sagalight.umd.js`
	);
}

function buildDeclarations(inputDir, outputDir) {

	console.log(`Buuilding declarations`);

	return dtsBuilder.generateBundles([
		{
			name: 'sagalight',
			sourceDir: inputDir,
			destDir: outputDir,
			wrap: false
		}
	]);
}

function build() {
	runTypeScriptBuild(".build", ts.ScriptTarget.ES5, true);
	return Promise.all([

		generateBundledModule(
			path.resolve(".build", "sagalight.js"),
			path.resolve("lib", "sagalight.js"),
			"cjs"
		),

		generateBundledModule(
			path.resolve(".build", "sagalight.js"),
			path.resolve("lib", "sagalight.module.js"),
			"es"
		),

		buildDeclarations(
			path.resolve(".build"),
			path.resolve("lib")
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