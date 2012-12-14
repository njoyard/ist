{
	name: 'ist',
	
	optimize: 'uglify2',
	
	onBuildWrite: function (moduleName, path, contents) {
        return contents.replace(/^/mg, '\t');
    },
    
	wrap: {
		startFile: 'parts/build.header.part',
		endFile: 'parts/build.footer.part'
	}
}
