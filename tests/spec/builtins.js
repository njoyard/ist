define([
	'builtins/if',
	'builtins/unless',
	'builtins/with',
	'builtins/each',
	'builtins/include',
	'builtins/define'
], function(ifDesc, unlessDesc, withDesc, eachDesc, includeDesc, defineDesc) {
	return function() {
		ifDesc();
		unlessDesc();
		withDesc();
		eachDesc();
		includeDesc();
		defineDesc();
	};
});
