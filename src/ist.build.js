{
	name: 'main',
	
	optimize: 'uglify2',
	
	onBuildWrite: function (moduleName, path, contents) {
		// Remove jshint comments
		return contents.replace(/\/\*(jshint|global) [^*\/]*\*\//g, '');
	},

	onModuleBundleComplete: function (data) {
		var fs = module.require('fs'),
			amdclean = module.require('amdclean'),
			outputFile = data.path;

		fs.writeFileSync(outputFile, amdclean.clean({
			'filePath': outputFile,
			'ignoreModules': ['ist']
		}));
	},

	wrap: {
		startFile: 'parts/build.header.part',
		endFile: 'parts/build.footer.part'
	}
}
