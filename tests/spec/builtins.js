define([
	'builtins/if',
	'builtins/unless',
	'builtins/else',
	'builtins/with',
	'builtins/each',
	'builtins/eachkey',
	'builtins/include',
	'builtins/define'
], function(ifDesc, unlessDesc, elseDesc, withDesc, eachDesc, eachkeyDesc, includeDesc, defineDesc) {
	return function() {
		ifDesc();
		unlessDesc();
		elseDesc();
		withDesc();
		eachDesc();
		eachkeyDesc();
		includeDesc();
		defineDesc();
	};
});
