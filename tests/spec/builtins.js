define([
	'builtins/if',
	'builtins/unless',
	'builtins/with',
	'builtins/each',
	'builtins/eachkey',
	'builtins/include',
	'builtins/define'
], function(ifDesc, unlessDesc, withDesc, eachDesc, eachkeyDesc, includeDesc, defineDesc) {
	return function() {
		ifDesc();
		unlessDesc();
		withDesc();
		eachDesc();
		eachkeyDesc();
		includeDesc();
		defineDesc();
	};
});
