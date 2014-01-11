/*global define, require, isBrowser, isNode */
define(['util/misc'], function(misc) {
	'use strict';

	function pluginify(ist) {
		var fetchText, buildMap = {};

		if (isBrowser) {
			fetchText = function(url, callback) {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.onreadystatechange = function () {
					//Do not explicitly handle errors, those should be
					//visible via console output in the browser.
					if (xhr.readyState === 4) {
						if (xhr.status !== 200) {
							throw new Error('HTTP status '  + xhr.status + ' when loading ' + url);
						}
	
						callback(xhr.responseText);
					}
				};
				xhr.send(null);
			};
		} else if (isNode) {
			var fs = require.nodeRequire('fs');

			fetchText = function(url, callback) {
				var file = fs.readFileSync(url, 'utf8');

				//Remove BOM (Byte Mark Order) from utf8 files if it is there.
				if (file.indexOf('\uFEFF') === 0) {
				    file = file.substring(1);
				}

				callback(file);
			};
		}

		ist.write = function (pluginName, name, write) {
			var bmName = 'ist!' + name;

			if (buildMap.hasOwnProperty(bmName)) {
				var text = buildMap[bmName];
				write(text);
			}
		};

		ist.load = function (name, parentRequire, load, config) {
			var path, dirname;
			
			path = parentRequire.toUrl(name + '.ist');

			dirname = name.indexOf('/') === -1 ? '.' : name.replace(/\/[^\/]*$/, '');

			fetchText(path, function (text) {
				var code, deps = ['ist'];
	
				/* Find @include calls and replace them with 'absolute' paths
				   (ie @include 'inc/include' in 'path/to/template'
					 becomes @include 'path/to/inc/include')
				   while recording all distinct include paths
				 */
					 
				text = text.replace(
					/^(\s*)@include\s+(?:text=)?(['"])((?:(?=(\\?))\4.)*?)\2/gm,
					function(m, p1, p2, p3) {
						if (misc.findScript(p3)) {
							// Script tag found, do not change directive
							return m;
						}
						
						var dpath = dirname + '/' + p3.replace(/\.ist$/, '');
		
						if (deps.indexOf('ist!' + dpath) === -1) {
							deps.push('ist!' + dpath);
						}

						return p1 + '@include "' + dpath + '"';
					}
				);
				
				/* Get parsed code */
				code = ist(text, name).getCode(true);
				text = 'define(\'ist!' + name + '\',' + JSON.stringify(deps) + ', function(ist) {\n' +
					   '  return ' + code + ';\n' +
					   '});\n';
				   
				//Hold on to the transformed text if a build.
				if (config.isBuild) {
					buildMap['ist!' + name] = text;
				}

				//IE with conditional comments on cannot handle the
				//sourceURL trick, so skip it if enabled.
				/*@if (@_jscript) @else @*/
				if (!config.isBuild) {
					text += '\r\n//@ sourceURL=' + path;
				}
				/*@end@*/
	
				load.fromText('ist!' + name, text);

				// Finish loading and give result to load()
				parentRequire(['ist!' + name], function (value) {
					load(value);
				});
			});
		};
	}
	
	return pluginify;
});
