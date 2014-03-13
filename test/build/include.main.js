/*jshint browser:true*/
/*global require*/

require(['ist!include'], function(compiled) {
	'use strict';

	window.__run__(function(expect, done) {
		expect(typeof compiled.render).toBe('function');

		var rendered = compiled.render({ foo: 'bar' });
		expect(nonCommentChildren(rendered).length).toBe(1);
		expect(nthNonCommentChild(rendered, 0).childNodes[0].textContent).toBe('bar');

		done();
	});
});