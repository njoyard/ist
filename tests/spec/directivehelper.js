define([
	'ist',
	'text!directivehelper/directivehelper.ist',
	'text!directivehelper/string.ist',
	'text!directivehelper/none.ist'
], function(ist, textDirectivehelper, textString, textNone) {
	return function() {
		it("should allow parsing templates with unknown @directives", function() {
			var thrown = false;
			
			ist.registerHelper('testDirective', undefined);
			
			try {
				ist(textDirectivehelper);
			} catch(e) {
				thrown = true;
			}
			
			expect( thrown ).toBe( false );
		});
		
		it("should fail to render templates with unknown @directives", function() {
			var context = { context: { value: 'context' } };
			
			ist.registerHelper('testDirective', undefined);
			
			expect( function() { ist(textDirectivehelper).render(context); } ).toThrow('No directive helper for @testDirective has been registered');
		});
	
		it("should call helpers when the corresponding @directive is rendered", function() {
			var called = false,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testDirective', function() {
				called = true;
			});
			ist(textDirectivehelper).render(context);
			
			expect( called ).toBe( true );
		});
		
		it("should pass the current context to helpers as 'this'", function() {
			var hthis,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testDirective', function() {
				hthis = this;
			});
			ist(textDirectivehelper).render(context);
			
			expect( hthis.value ).toBe( context );
		});
		
		it("should pass the narrowed down context to helpers as 1st argument", function() {
			var arg,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testDirective', function(subcontext) {
				arg = subcontext;
			});
			ist(textDirectivehelper).render(context);
			
			expect( arg.value ).toBe( context.context );
		});
		
		it("should allow helpers to create document fragments in the rendering document with this.createDocumentFragment", function() {
			var frag, context = { context: { value: 'context' } };
			
			ist.registerHelper('testDirective', function(subcontext, subtemplate) {
				frag = this.createDocumentFragment();
			});
			ist(textDirectivehelper).render(context);
			
			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( frag.ownerDocument ).toBe( document );
		});
		
		it("should allow helpers to create elements in the rendering document with this.createElement", function() {
			var elem, context = { context: { value: 'context' } };
			
			ist.registerHelper('testDirective', function(subcontext, subtemplate) {
				elem = this.createElement('div');
			});
			ist(textDirectivehelper).render(context);
			
			expect( elem.nodeType ).toBe( document.ELEMENT_NODE );
			expect( elem.ownerDocument ).toBe( document );
			expect( elem.nodeName.toLowerCase() ).toBe( 'div' );
		});
		
		it("should allow helpers to create text nodes in the rendering document with this.createTextNode", function() {
			var text, context = { context: { value: 'context' } };
			
			ist.registerHelper('testDirective', function(subcontext, subtemplate) {
				text = this.createTextNode('text value');
			});
			ist(textDirectivehelper).render(context);
			
			expect( text.nodeType ).toBe( document.TEXT_NODE );
			expect( text.ownerDocument ).toBe( document );
			expect( text.textContent ).toBe( 'text value' );
		});
		
		it("should enable helpers rendering the subtemplate with a custom context", function() {
			var result,
				context = { context: { value: 'context' } };
				
			ist.registerHelper('testDirective', function(subcontext, subtemplate) {
				result = subtemplate.render({ value: 'my value' });
			});
			ist(textDirectivehelper).render(context);
			
			expect( result.querySelector('.child') ).toNotBe( null );
			expect( result.querySelector('.child').firstChild ).toNotBe( null );
			expect( result.querySelector('.child').firstChild.textContent ).toBe( 'interpolated my value' );
		});
		
		it("should pass an empty LiveFragment to helpers as third argument", function() {
			var frag,
				context = { context: { value: 'context' } };
			
			ist.registerHelper('testDirective', function(subctx, tmpl, fragment) {
				frag = fragment;
			});
			ist(textDirectivehelper).render(context);
			
			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( typeof frag.extend ).toBe( 'function' );
		});
		
		it("should insert what helpers insert in their LiveFragment into the parent template node", function() {
			var node, frag;
				
			ist.registerHelper('testDirective', function(subcontext, subtemplate, fragment) {
				node = this.createElement('div');
				node.className = 'generated';
				fragment.appendChild(node);
			});
			frag = ist(textDirectivehelper).render({ context: undefined });
			
			expect( frag.querySelector("div.parent div.generated") ).toNotBe( null );
			expect( frag.querySelector("div.parent div.generated") ).toBe( node );
		});
		
		it("should allow passing a quoted string instead of a context path", function() {
			var value;
			
			ist.registerHelper('otherDirective', function(subcontext, subtemplate) {
				value = subcontext.value;
			});
			
			ist(textString).render({});
			expect( value ).toBe( "direct string value" );
		});
		
		it("should pass undefined when no narrowed down context is present", function() {
			var arg = 'defined', arg2 = 'defined', options,
				context = { context: { value: 'context' } };
				
			ist.registerHelper('noParamDirective', function(subcontext) {
				arg = subcontext;
			});
			ist(textNone).render(context);
			
			expect( typeof arg ).toBe( 'undefined' );
		});
		
		it("should allow pushing variables to a rendering context", function() {
			ist.registerHelper('pushDirective', function(subcontext, subtemplate, fragment) {
				subcontext.pushScope({ variable: "value" });
				fragment.appendChild(subtemplate.render(subcontext));
			});
			expect(
				ist("@pushDirective this\n '{{ variable }}'").render({}).childNodes[0]
			).toHaveTextContent( "value" );
		});
		
		it("should allow overwriting existing rendering context properties when pushing variables", function() {
			ist.registerHelper('pushDirective', function(subcontext, subtemplate, fragment) {
				subcontext.pushScope({ variable: "new value" });
				fragment.appendChild(subtemplate.render(subcontext));
			});
			expect(
				ist("@pushDirective this\n '{{ variable }}'").render({ variable: "value" }).childNodes[0]
			).toHaveTextContent( "new value" );
		});
		
		it("should allow stacking pushed variables in rendering contexts", function() {
			var frag;
			
			ist.registerHelper('pushDirective1', function(subcontext, subtemplate, fragment) {
				subcontext.pushScope({ variable: "value 1" });
				fragment.appendChild(subtemplate.render(subcontext));
			});
			ist.registerHelper('pushDirective2', function(subcontext, subtemplate, fragment) {
				subcontext.pushScope({ variable: "value 2" });
				fragment.appendChild(subtemplate.render(subcontext));
			});
			
			frag = ist("@pushDirective1 this\n '0 {{ variable }}'\n @pushDirective2 this\n  '1 {{ variable }}'\n '2 {{ variable }}'").render({});
			
			expect( frag.childNodes[0] ).toHaveTextContent( "0 value 1" );
			expect( frag.childNodes[1] ).toHaveTextContent( "1 value 2" );
			expect( frag.childNodes[2] ).toHaveTextContent( "2 value 1" );
		});
		
		it("should allow popping pushed variables from rendering contexts", function() {
			ist.registerHelper('pushDirective', function(subcontext, subtemplate, fragment) {
				subcontext.pushScope({ variable: "new value" });
				subcontext.popScope();
				fragment.appendChild(subtemplate.render(subcontext));
			});
			expect(
				ist("@pushDirective this\n '{{ variable }}'").render({ variable: "value" }).childNodes[0]
			).toHaveTextContent( "value" );
		});
	};
});
