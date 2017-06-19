module.exports = function (config) {
	config.set({
		files: [
			{
				pattern: "src/**/*.ts"
			},
		],
		frameworks: ["jasmine", "karma-typescript"],
		preprocessors: {
			"**/*.ts": ["karma-typescript"], // *.tsx for React Jsx 
		},
		reporters: ["progress", "karma-typescript"],
		browsers: ["Chrome"],

		karmaTypescriptConfig: {
			bundlerOptions: {
				entrypoints: /\.spec\.ts$/
			},
			// coverageOptions: {
			// 	instrumentation : false
			// },
			compilerOptions: {
				//target: 'es5',
				//module: 'commonjs',
				sourceMap: true,
				lib: ['es5', 'dom', 'es2015.promise', 'es2015.generator', 'es2015.iterable']
			}
		}
	});
};