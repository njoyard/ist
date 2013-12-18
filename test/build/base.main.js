/*jshint browser:true*/
/*global require*/

require(['ist'], function(ist) {
	'use strict';

	window.__run__(function(expect, done) {
		expect(typeof ist).toBe('function');

		var compiled = ist('div');
		expect(typeof compiled.render).toBe('function');

		var rendered = compiled.render();
		expect(rendered.childNodes.length).toBe(1);

		done();
	});
});