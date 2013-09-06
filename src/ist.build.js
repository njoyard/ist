{
	name: 'ist',
	
	optimize: 'uglify2',
	
	onBuildWrite: function (moduleName, path, contents) {
		var mangleModuleName,
			replaceModuleCalls,
			replaceDefineCalls;
			
		mangleModuleName = function(name) {
			return name.split('/').pop();
		};
			
		replaceModuleCalls = function(match, p1) {
			return "istComponents." + mangleModuleName(p1);
		};
		
		replaceDefineCalls = function(match, p1, p2, p3) {
			var deps = p2.replace(
					/["']([^"']+)["']/g, 
					replaceModuleCalls
				);
			return "istComponents." + mangleModuleName(p1) + " = (" + p3 + "(" + deps + "))";
		};
	
		// Replace define calls
		return contents.replace(
			/define\s*\(["']([^"']+)["']\s*,\s*\[((?:\n|[^\]])*)\]\s*,((?:\n|.)*)\)/g,
			replaceDefineCalls
		).replace(/^/mg, '\t');
    },
    
	wrap: {
		startFile: 'parts/build.header.part',
		endFile: 'parts/build.footer.part'
	}
}
