/*jshint browser:true*/
/*global describe, define, it, expect */

define(['ist!test/update/template'], function(template) {
	'use strict';
	
	var obj = { foo: 'bar' };

	describe('update', function() {
		it('should provide an update() method on rendered fragments', function() {
			expect( typeof template.render(obj).update ).toBe( 'function' );
		});
		

		it('should update rendered nodes when passing a new context to update()', function() {
			var rendered = template.render(obj),
				container = document.createElement('div');

			container.appendChild(rendered);
			var div = container.querySelector('div');

			rendered.update({ foo: 'baz' });
			expect( div.textContent ).toBe( 'baz' );
		});


		it('should update rendered nodes using the same context when calling update() with no arguments', function() {
			obj.foo = 'bing';

			var rendered = template.render(obj),
				container = document.createElement('div');

			container.appendChild(rendered);
			var div = container.querySelector('div');

			rendered.update();
			expect( div.textContent ).toBe( 'bing' );

			obj.foo = 'bar';
		});
	});
});