{
	name: 'ist',
	
	optimize: 'uglify2',
	
	onBuildWrite: function (moduleName, path, contents) {
		// Replace define calls
		return contents.replace(
			/define\s*\(["']([^"']+)["']\s*,\s*\[((?:\n|[^\]])*)\]\s*,((?:\n|.)*)\)/g,
			function(match, p1, p2, p3) {
				var deps = p2.replace(
						/["']([^"']+)["']/g, 
						function(match, p1) {
							return "modules[\"" + p1 + "\"]";
						}
					);
				return "modules[\"" + p1 + "\"] = (" + p3 + "(" + deps + "))";
			}
		).replace(/^/mg, '\t');
    },
    
	wrap: {
		startFile: 'parts/build.header.part',
		endFile: 'parts/build.footer.part'
	}
}
