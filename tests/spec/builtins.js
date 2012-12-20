define([
	'builtins/if',
	'builtins/unless',
	'builtins/with',
	'builtins/each',
	'builtins/include'
], function(ifDesc, unlessDesc, withDesc, eachDesc, includeDesc) {
	return function() {
		ifDesc();
		unlessDesc();
		withDesc();
		eachDesc();
		includeDesc();
	};
});
