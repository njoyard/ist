/*jshint browser:true*/
/*global require*/

require(['ist'], function(ist) {
	'use strict';

	window.__run__(function(expect, done) {
		expect(typeof ist.script).toBe('function');

		var compiled = ist.script('scriptTag');
		expect(typeof compiled.render).toBe('function');

		var rendered = compiled.render({ foo: 'bar' });
		expect(rendered.childNodes.length).toBe(1);
		expect(rendered.childNodes[0].childNodes[0].textContent).toBe('bar');

		done();
	});
});