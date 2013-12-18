/*jshint browser:true */
/*global define, describe, it, expect */

define([
	'ist',
	'text!test/directivehelper/directivehelper.ist',
	'text!test/directivehelper/string.ist',
	'text!test/directivehelper/none.ist',
	'ist!test/directivehelper/errors',
	'ist!test/directivehelper/update'
], function(ist, textDirectivehelper, textString, textNone, tErrors, tUpdate) {
	'use strict';

	describe('directive helpers', function() {
		it('should allow parsing templates with unknown @directives', function() {
			var thrown = false;
			
			ist.helper('testDirective', undefined);
			
			try {
				ist(textDirectivehelper);
			} catch(e) {
				thrown = true;
			}
			
			expect( thrown ).toBe( false );
		});
		
		it('should fail to render templates with unknown @directives', function() {
			var context = { context: { value: 'context' } };
			
			ist.helper('testDirective', undefined);
			
			expect( function() { ist(textDirectivehelper).render(context); } ).toThrow('No directive helper for @testDirective has been registered');
		});
	
		it('should call helpers when the corresponding @directive is rendered', function() {
			var called = false,
				context = { context: { value: 'context' } };
				
				
			ist.helper('testDirective', function() {
				called = true;
			});
			ist(textDirectivehelper).render(context);
			
			expect( called ).toBe( true );
		});
		
		it('should pass the current context to helpers as 1st argument', function() {
			var param,
				context = { context: { value: 'context' } };
				
				
			ist.helper('testDirective', function(ctx) {
				param = ctx;
			});
			ist(textDirectivehelper).render(context);
			
			expect( param.value ).toBe( context );
		});
		
		it('should pass the narrowed down context value to helpers as 2nd argument', function() {
			var param,
				context = { context: { value: 'context' } };
				
				
			ist.helper('testDirective', function(ctx, value) {
				param = value;
			});
			ist(textDirectivehelper).render(context);
			
			expect( param ).toBe( context.context );
		});
		
		it('should allow helpers to create document fragments in the rendering document with ctx.createDocumentFragment', function() {
			var frag, context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(ctx, value, subtemplate) {
				frag = ctx.createDocumentFragment();
			});
			ist(textDirectivehelper).render(context);
			
			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( frag.ownerDocument ).toBe( document );
		});
		
		it('should allow helpers to create elements in the rendering document with ctx.createElement', function() {
			var elem, context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(ctx, value, subtemplate) {
				elem = ctx.createElement('div');
			});
			ist(textDirectivehelper).render(context);
			
			expect( elem.nodeType ).toBe( document.ELEMENT_NODE );
			expect( elem.ownerDocument ).toBe( document );
			expect( elem.nodeName.toLowerCase() ).toBe( 'div' );
		});
		
		it('should allow helpers to create text nodes in the rendering document with ctx.createTextNode', function() {
			var text, context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(ctx, value, subtemplate) {
				text = ctx.createTextNode('text value');
			});
			ist(textDirectivehelper).render(context);
			
			expect( text.nodeType ).toBe( document.TEXT_NODE );
			expect( text.ownerDocument ).toBe( document );
			expect( text.textContent ).toBe( 'text value' );
		});
		
		it('should enable helpers rendering the subtemplate with a custom context', function() {
			var result,
				context = { context: { value: 'context' } };
				
			ist.helper('testDirective', function(ctx, value, subtemplate) {
				result = subtemplate.render({ value: 'my value' });
			});
			ist(textDirectivehelper).render(context);
			
			expect( result.querySelector('.child') ).toNotBe( null );
			expect( result.querySelector('.child').firstChild ).toNotBe( null );
			expect( result.querySelector('.child').firstChild.textContent ).toBe( 'interpolated my value' );
		});
		
		it('should pass an empty DocumentFragment to helpers as 4th argument', function() {
			var frag,
				context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(ctx, value, tmpl, fragment) {
				frag = fragment;
			});
			ist(textDirectivehelper).render(context);
			
			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
		});
		
		it('should insert what helpers insert in their LiveFragment into the parent template node', function() {
			var node, frag;
				
			ist.helper('testDirective', function(ctx, value, subtemplate, fragment) {
				node = ctx.createElement('div');
				node.className = 'generated';
				fragment.appendChild(node);
			});
			frag = ist(textDirectivehelper).render({ context: undefined });
			
			expect( frag.querySelector('div.parent div.generated') ).toNotBe( null );
			expect( frag.querySelector('div.parent div.generated') ).toBe( node );
		});
		
		it('should allow passing a quoted string instead of a context path', function() {
			var val;
			
			ist.helper('otherDirective', function(ctx, value, subtemplate) {
				val = value;
			});
			
			ist(textString).render({});
			expect( val ).toBe( 'direct string value' );
		});
		
		it('should pass undefined when no narrowed down context is present', function() {
			var arg = 'defined', arg2 = 'defined', options,
				context = { context: { value: 'context' } };
				
			ist.helper('noParamDirective', function(ctx, value) {
				arg = value;
			});
			ist(textNone).render(context);
			
			expect( typeof arg ).toBe( 'undefined' );
		});
		
		it('should allow pushing variables to a rendering context', function() {
			ist.helper('pushDirective', function(ctx, value, subtemplate, fragment) {
				ctx.pushScope({ variable: 'value' });
				fragment.appendChild(subtemplate.render(ctx));
				ctx.popScope();
			});
			expect(
				ist('@pushDirective\n \'{{ variable }}\'').render({}).childNodes[0]
			).toHaveTextContent( 'value' );
		});
		
		it('should allow overwriting existing rendering context properties when pushing variables', function() {
			ist.helper('pushDirective', function(ctx, value, subtemplate, fragment) {
				ctx.pushScope({ variable: 'new value' });
				fragment.appendChild(subtemplate.render(ctx));
				ctx.popScope();
			});
			expect(
				ist('@pushDirective\n \'{{ variable }}\'').render({ variable: 'value' }).childNodes[0]
			).toHaveTextContent( 'new value' );
		});
		
		it('should allow stacking pushed variables in rendering contexts', function() {
			var frag;
			
			ist.helper('pushDirective1', function(ctx, value, subtemplate, fragment) {
				ctx.pushScope({ variable: 'value 1' });
				fragment.appendChild(subtemplate.render(ctx));
				ctx.popScope();
			});
			ist.helper('pushDirective2', function(ctx, value, subtemplate, fragment) {
				ctx.pushScope({ variable: 'value 2' });
				fragment.appendChild(subtemplate.render(ctx));
				ctx.popScope();
			});
			
			frag = ist('@pushDirective1\n \'0 {{ variable }}\'\n @pushDirective2\n  \'1 {{ variable }}\'\n \'2 {{ variable }}\'').render({});
			
			expect( frag.childNodes[0] ).toHaveTextContent( '0 value 1' );
			expect( frag.childNodes[1] ).toHaveTextContent( '1 value 2' );
			expect( frag.childNodes[2] ).toHaveTextContent( '2 value 1' );
		});
		
		it('should allow popping pushed variables from rendering contexts', function() {
			ist.helper('pushDirective', function(ctx, value, subtemplate, fragment) {
				ctx.pushScope({ variable: 'new value' });
				ctx.popScope();
				fragment.appendChild(subtemplate.render(ctx));
			});
			expect(
				ist('@pushDirective\n \'{{ variable }}\'').render({ variable: 'value' }).childNodes[0]
			).toHaveTextContent( 'value' );
		});
		
		it('should report errors thrown by expressions when rendering', function() {
			expect( function() { tErrors.render({ test: 'type' }); } )
				.toThrowAny([
					'a is not defined in \'test/directivehelper/errors\' on line 2',
					'Can\'t find variable: a in \'test/directivehelper/errors\' on line 2'
				]);
				
			expect( function() { tErrors.render({ test: 'throw' }); } )
				.toThrow('custom error in \'test/directivehelper/errors\' on line 6');
		});

		it('should report errors thrown by helpers when rendering', function() {
			ist.helper('throwingHelper', function() {
				throw new Error('Helper error');
			});

			expect( function() { tErrors.render({ test: 'throwingHelper' }); } )
				.toThrow('Helper error in \'test/directivehelper/errors\' on line 10');
		});

		it('should allow helpers to save and retrieve rendered templates with arbitrary keys across updates', function() {
			var frag;
			ist.helper('test', function(ctx, value, template, fragment) {
				frag = fragment;
			});

			ist('@test').render();
			expect( typeof frag.extractRenderedFragment ).toBe( 'function' );
			expect( typeof frag.appendRenderedFragment ).toBe( 'function' );

			var key = { a: 1, b: '2' },
				test, retrieved;

			ist.helper('test', function(ctx, value, template, fragment) {
				switch (test) {
					case 'save':
						fragment.appendRenderedFragment(template.render(ctx), key);
						break;

					case 'retrieve':
						retrieved = fragment.extractRenderedFragment(key);
						break;

					case 'update':
						retrieved = fragment.extractRenderedFragment(key);

						if (retrieved)
							retrieved.update(ctx);
						else
							retrieved = template.render(ctx);

						fragment.appendRenderedFragment(template.render(ctx), key);
						break;

					case 'retrieveall':
						retrieved = fragment.extractRenderedFragments();
						break;
				}
			});

			test = 'save';
			var rendered = tUpdate.render({ foo: 1, bar: 2 });

			expect( rendered.firstChild.textContent ).toBe( '1' );
			expect( rendered.firstChild.nextSibling.textContent ).toBe( '2' );

			test = 'retrieve';
			rendered.update({ foo: 3, bar: 4 });

			expect( retrieved.firstChild.textContent ).toBe( '1' );
			expect( retrieved.firstChild.nextSibling.textContent ).toBe( '2' );

			// rendered should be empty except for placeholder comment nodes
			expect( [].slice.call(rendered.childNodes).some(function(child) { return child.nodeType !== document.COMMENT_NODE; }) ).toBe( false );

			test = 'update';
			rendered = tUpdate.render({ foo: 1, bar: 2 });

			expect( rendered.firstChild.textContent ).toBe( '1' );
			expect( rendered.firstChild.nextSibling.textContent ).toBe( '2' );

			rendered.update({ foo: 3, bar: 4 });

			expect( rendered.firstChild.textContent ).toBe( '3' );
			expect( rendered.firstChild.nextSibling.textContent ).toBe( '4' );

			test = 'save';
			rendered = tUpdate.render({ foo: 1, bar: 2 });

			test = 'retrieveall';
			rendered.update({ foo: 3, bar: 4 });

			expect( 'keys' in retrieved ).toBe( true );
			expect( 'fragments' in retrieved ).toBe( true );

			expect( Array.isArray(retrieved.keys) ).toBe( true );
			expect( Array.isArray(retrieved.fragments) ).toBe( true );

			expect( retrieved.keys.length ).toBe( 1 );
			expect( retrieved.fragments.length ).toBe( 1 );

			expect( retrieved.keys[0] ).toBe( key );
			expect( retrieved.fragments[0].firstChild.textContent ).toBe( '1' );
			expect( retrieved.fragments[0].firstChild.nextSibling.textContent ).toBe( '2' );

			// rendered should be empty except for placeholder comment nodes
			expect( [].slice.call(rendered.childNodes).some(function(child) { return child.nodeType !== document.COMMENT_NODE; }) ).toBe( false );
		});
	});
});
