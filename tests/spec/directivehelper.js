/*global define, it, expect */
define([
	'ist',
	'text!directivehelper/directivehelper.ist',
	'text!directivehelper/string.ist',
	'text!directivehelper/none.ist',
	'ist!directivehelper/errors',
	'ist!directivehelper/update'
], function(ist, textDirectivehelper, textString, textNone, tErrors, tUpdate) {
	return function() {
		it("should allow parsing templates with unknown @directives", function() {
			var thrown = false;
			
			ist.helper('testDirective', undefined);
			
			try {
				ist(textDirectivehelper);
			} catch(e) {
				thrown = true;
			}
			
			expect( thrown ).toBe( false );
		});
		
		it("should fail to render templates with unknown @directives", function() {
			var context = { context: { value: 'context' } };
			
			ist.helper('testDirective', undefined);
			
			expect( function() { ist(textDirectivehelper).render(context); } ).toThrow('No directive helper for @testDirective has been registered');
		});
	
		it("should call helpers when the corresponding @directive is rendered", function() {
			var called = false,
				context = { context: { value: 'context' } };
				
				
			ist.helper('testDirective', function() {
				called = true;
			});
			ist(textDirectivehelper).render(context);
			
			expect( called ).toBe( true );
		});
		
		it("should pass the current context to helpers as 1st argument", function() {
			var param,
				context = { context: { value: 'context' } };
				
				
			ist.helper('testDirective', function(outer) {
				param = outer;
			});
			ist(textDirectivehelper).render(context);
			
			expect( param.value ).toBe( context );
		});
		
		it("should pass the narrowed down context to helpers as 2nd argument", function() {
			var param,
				context = { context: { value: 'context' } };
				
				
			ist.helper('testDirective', function(inner, outer) {
				param = outer;
			});
			ist(textDirectivehelper).render(context);
			
			expect( param.value ).toBe( context.context );
		});
		
		it("should allow helpers to create document fragments in the rendering document with outer.createDocumentFragment", function() {
			var frag, context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(outer, inner, subtemplate) {
				frag = outer.createDocumentFragment();
			});
			ist(textDirectivehelper).render(context);
			
			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( frag.ownerDocument ).toBe( document );
		});
		
		it("should allow helpers to create elements in the rendering document with outer.createElement", function() {
			var elem, context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(outer, inner, subtemplate) {
				elem = outer.createElement('div');
			});
			ist(textDirectivehelper).render(context);
			
			expect( elem.nodeType ).toBe( document.ELEMENT_NODE );
			expect( elem.ownerDocument ).toBe( document );
			expect( elem.nodeName.toLowerCase() ).toBe( 'div' );
		});
		
		it("should allow helpers to create text nodes in the rendering document with outer.createTextNode", function() {
			var text, context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(outer, inner, subtemplate) {
				text = outer.createTextNode('text value');
			});
			ist(textDirectivehelper).render(context);
			
			expect( text.nodeType ).toBe( document.TEXT_NODE );
			expect( text.ownerDocument ).toBe( document );
			expect( text.textContent ).toBe( 'text value' );
		});
		
		it("should enable helpers rendering the subtemplate with a custom context", function() {
			var result,
				context = { context: { value: 'context' } };
				
			ist.helper('testDirective', function(outer, inner, subtemplate) {
				result = subtemplate.render({ value: 'my value' });
			});
			ist(textDirectivehelper).render(context);
			
			expect( result.querySelector('.child') ).toNotBe( null );
			expect( result.querySelector('.child').firstChild ).toNotBe( null );
			expect( result.querySelector('.child').firstChild.textContent ).toBe( 'interpolated my value' );
		});
		
		it("should pass an empty DocumentFragment to helpers as 4th argument", function() {
			var frag,
				context = { context: { value: 'context' } };
			
			ist.helper('testDirective', function(outer, inner, tmpl, fragment) {
				frag = fragment;
			});
			ist(textDirectivehelper).render(context);
			
			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
		});
		
		it("should insert what helpers insert in their LiveFragment into the parent template node", function() {
			var node, frag;
				
			ist.helper('testDirective', function(outer, inner, subtemplate, fragment) {
				node = outer.createElement('div');
				node.className = 'generated';
				fragment.appendChild(node);
			});
			frag = ist(textDirectivehelper).render({ context: undefined });
			
			expect( frag.querySelector("div.parent div.generated") ).toNotBe( null );
			expect( frag.querySelector("div.parent div.generated") ).toBe( node );
		});
		
		it("should allow passing a quoted string instead of a context path", function() {
			var value;
			
			ist.helper('otherDirective', function(outer, inner, subtemplate) {
				value = inner.value;
			});
			
			ist(textString).render({});
			expect( value ).toBe( "direct string value" );
		});
		
		it("should pass undefined when no narrowed down context is present", function() {
			var arg = 'defined', arg2 = 'defined', options,
				context = { context: { value: 'context' } };
				
			ist.helper('noParamDirective', function(outer, inner) {
				arg = inner;
			});
			ist(textNone).render(context);
			
			expect( typeof arg ).toBe( 'undefined' );
		});
		
		it("should allow pushing variables to a rendering context", function() {
			ist.helper('pushDirective', function(outer, inner, subtemplate, fragment) {
				inner.pushScope({ variable: "value" });
				fragment.appendChild(subtemplate.render(inner));
			});
			expect(
				ist("@pushDirective this\n '{{ variable }}'").render({}).childNodes[0]
			).toHaveTextContent( "value" );
		});
		
		it("should allow overwriting existing rendering context properties when pushing variables", function() {
			ist.helper('pushDirective', function(outer, inner, subtemplate, fragment) {
				inner.pushScope({ variable: "new value" });
				fragment.appendChild(subtemplate.render(inner));
			});
			expect(
				ist("@pushDirective this\n '{{ variable }}'").render({ variable: "value" }).childNodes[0]
			).toHaveTextContent( "new value" );
		});
		
		it("should allow stacking pushed variables in rendering contexts", function() {
			var frag;
			
			ist.helper('pushDirective1', function(outer, inner, subtemplate, fragment) {
				inner.pushScope({ variable: "value 1" });
				fragment.appendChild(subtemplate.render(inner));
			});
			ist.helper('pushDirective2', function(outer, inner, subtemplate, fragment) {
				inner.pushScope({ variable: "value 2" });
				fragment.appendChild(subtemplate.render(inner));
			});
			
			frag = ist("@pushDirective1 this\n '0 {{ variable }}'\n @pushDirective2 this\n  '1 {{ variable }}'\n '2 {{ variable }}'").render({});
			
			expect( frag.childNodes[0] ).toHaveTextContent( "0 value 1" );
			expect( frag.childNodes[1] ).toHaveTextContent( "1 value 2" );
			expect( frag.childNodes[2] ).toHaveTextContent( "2 value 1" );
		});
		
		it("should allow popping pushed variables from rendering contexts", function() {
			ist.helper('pushDirective', function(outer, inner, subtemplate, fragment) {
				inner.pushScope({ variable: "new value" });
				inner.popScope();
				fragment.appendChild(subtemplate.render(inner));
			});
			expect(
				ist("@pushDirective this\n '{{ variable }}'").render({ variable: "value" }).childNodes[0]
			).toHaveTextContent( "value" );
		});
		
		it("should report errors thrown by expressions when rendering", function() {
			expect( function() { tErrors.render({ test: 'syntax' }); } )
				.toThrowAny([
					"Unexpected identifier in 'directivehelper/errors' on line 2",
					"missing ; before statement in 'directivehelper/errors' on line 2",
					"Expected an identifier but found 'error' instead in 'directivehelper/errors' on line 2"
				]);
				
			expect( function() { tErrors.render({ test: 'type' }); } )
				.toThrowAny([
					"a is not defined in 'directivehelper/errors' on line 6",
					"Can't find variable: a in 'directivehelper/errors' on line 6"
				]);
				
			expect( function() { tErrors.render({ test: 'throw' }); } )
				.toThrow("custom error in 'directivehelper/errors' on line 10");
		});

		it("should report errors thrown by helpers when rendering", function() {
			ist.helper("throwingHelper", function() {
				throw new Error("Helper error");
			});

			expect( function() { tErrors.render({ test: 'throwingHelper' }); } )
				.toThrow("Helper error in 'directivehelper/errors' on line 14");
		});

		it("should allow helpers to save and retrieve rendered templates with arbitrary keys across updates", function() {
			var frag;
			ist.helper("test", function(outer, inner, template, fragment) {
				frag = fragment;
			});

			ist("@test").render();
			expect( typeof frag.extractRenderedFragment ).toBe( "function" );
			expect( typeof frag.appendRenderedFragment ).toBe( "function" );

			var key = { a: 1, b: "2" },
				test, retrieved;

			ist.helper("test", function(outer, inner, template, fragment) {
				switch (test) {
					case "save":
						fragment.appendRenderedFragment(template.render(outer), key);
						break;

					case "retrieve":
						retrieved = fragment.extractRenderedFragment(key);
						break;

					case "update":
						retrieved = fragment.extractRenderedFragment(key);

						if (retrieved)
							retrieved.update(outer);
						else
							retrieved = template.render(outer);

						fragment.appendRenderedFragment(template.render(outer), key);
						break;
				}
			});

			test = "save";
			var rendered = tUpdate.render({ foo: 1, bar: 2 });

			expect( rendered.firstChild.textContent ).toBe( "1" );
			expect( rendered.firstChild.nextSibling.textContent ).toBe( "2" );

			test = "retrieve";
			rendered.update({ foo: 3, bar: 4 });

			expect( retrieved.firstChild.textContent ).toBe( "1" );
			expect( retrieved.firstChild.nextSibling.textContent ).toBe( "2" );
			expect( rendered.hasChildNodes() ).toBe( false );

			test = "update";
			var rendered = tUpdate.render({ foo: 1, bar: 2 });

			expect( rendered.firstChild.textContent ).toBe( "1" );
			expect( rendered.firstChild.nextSibling.textContent ).toBe( "2" );

			rendered.update({ foo: 3, bar: 4 });

			expect( rendered.firstChild.textContent ).toBe( "3" );
			expect( rendered.firstChild.nextSibling.textContent ).toBe( "4" );
		});
	};
});
