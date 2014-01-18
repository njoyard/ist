/*jshint browser:true*/
/*global define, describe, it, expect*/

define(['ist'], function(ist) {
	'use strict';

	return function() {
		describe('[ist.create()]', function() {
			it('should be able to create single nodes using the create interface', function() {
				var node = ist.create('div.class#id[attr=val][.prop=val]');
				
				expect( node ).toNotBe( null );
				expect( node.tagName.toLowerCase() ).toBe( 'div' );
				expect( node.classList.contains('class') ).toBe( true );
				expect( node.id ).toBe( 'id' );
				expect( node.getAttribute('attr') ).toBe( 'val' );
				expect( node.prop ).toBe( 'val' );
			});
			
			it('should be able to create several nodes when using angle brackets', function() {
				var node = ist.create('div.parent > div.child > div.subchild');
				
				expect( node.querySelector('.child') ).toNotBe( null );
				expect( node.querySelector('.child .subchild') ).toNotBe( null );
			});
			
			it('should support context rendering', function() {
				var node = ist.create(
					'div.parent[prop={{ prop }}] > "{{ text }}"',
					{ prop: 'val', text: 'text content' }
				);
				
				expect( node.getAttribute('prop') ).toBe( 'val' );
				expect( node.firstChild.textContent ).toBe( 'text content' );
			});
			
			it('should support directives', function() {
				var ctx = { people: [ { name: 'alice' }, { name: 'bob' }, { name: 'carl' } ] },
					node = ist.create('div.parent > @each people > "{{ name }}"', ctx);
					
				expect( node.childNodes.length ).toBe( ctx.people.length );
				Array.prototype.slice.call(node.childNodes).forEach(function(node, i) {
					expect( node.textContent ).toBe( ctx.people[i].name );
				});
			});
			
			it('should return a document fragment when rendering anything else than 1 root node', function() {
				var zero = ist.create(''),
					mult = ist.create('@each arr > "{{ this }}"', { arr: [ 'a', 'b', 'c' ] });
					
				expect( zero.toString().indexOf('DocumentFragment') ).toNotBe( -1 );
				expect( mult.toString().indexOf('DocumentFragment') ).toNotBe( -1 );
			});
		});
	};
});
