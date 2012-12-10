define([
	'ist',
	'text!blockhelper/blockhelper.ist',
	'text!blockhelper/string.ist',
	'text!blockhelper/none.ist'
], function(ist, textBlockhelper, textString, textNone) {
	return function() {
		it("should allow parsing templates with unknown @blocks", function() {
			var thrown = false;
			
			ist.registerHelper('testBlock', undefined);
			
			try {
				ist(textBlockhelper);
			} catch(e) {
				thrown = true;
			}
			
			expect( thrown ).toBe( false );
		});
		
		it("should fail to render templates with unknown @blocks", function() {
			var context = { context: { value: 'context' } };
			
			ist.registerHelper('testBlock', undefined);
			
			expect( function() { ist(textBlockhelper).render(context); } ).toThrow('No block helper for @testBlock has been registered');
		});
	
		it("should call helpers when the corresponding @block is rendered", function() {
			var called = false,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function() {
				called = true;
			});
			ist(textBlockhelper).render(context);
			
			expect( called ).toBe( true );
		});
		
		it("should pass the current context to helpers as 'this'", function() {
			var hthis,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function() {
				hthis = this;
			});
			ist(textBlockhelper).render(context);
			
			expect( hthis.value ).toBe( context );
		});
		
		it("should pass the narrowed down context to helpers as 1st argument", function() {
			var arg,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function(subcontext) {
				arg = subcontext;
			});
			ist(textBlockhelper).render(context);
			
			expect( arg.value ).toBe( context.context );
		});
		
		it("should allow helpers to create document fragments in the rendering document with this.createDocumentFragment", function() {
			var frag, context = { context: { value: 'context' } };
			
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				frag = this.createDocumentFragment();
				return frag;
			});
			ist(textBlockhelper).render(context);
			
			expect( frag.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( frag.ownerDocument ).toBe( document );
		});
		
		it("should allow helpers to create elements in the rendering document with this.createElement", function() {
			var elem, context = { context: { value: 'context' } };
			
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				elem = this.createElement('div');
				return this.createDocumentFragment();
			});
			ist(textBlockhelper).render(context);
			
			expect( elem.nodeType ).toBe( document.ELEMENT_NODE );
			expect( elem.ownerDocument ).toBe( document );
			expect( elem.nodeName.toLowerCase() ).toBe( 'div' );
		});
		
		it("should allow helpers to create text nodes in the rendering document with this.createTextNode", function() {
			var text, context = { context: { value: 'context' } };
			
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				text = this.createTextNode('text value');
			});
			ist(textBlockhelper).render(context);
			
			expect( text.nodeType ).toBe( document.TEXT_NODE );
			expect( text.ownerDocument ).toBe( document );
			expect( text.textContent ).toBe( 'text value' );
		});
		
		it("should enable helpers rendering the subtemplate with a custom context", function() {
			var result,
				context = { context: { value: 'context' } };
				
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				result = subtemplate.render({ value: 'my value' });
			});
			ist(textBlockhelper).render(context);
			
			expect( result.querySelector('.child') ).toNotBe( null );
			expect( result.querySelector('.child').firstChild ).toNotBe( null );
			expect( result.querySelector('.child').firstChild.textContent ).toBe( 'interpolated my value' );
		});
		
		it("should insert what helpers return into the parent template node", function() {
			var node, fragment;
				
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				node = this.createElement('div');
				node.className = 'generated';
				return node;
			});
			fragment = ist(textBlockhelper).render({ context: undefined });
			
			expect( fragment.querySelector("div.parent div.generated") ).toNotBe( null );
			expect( fragment.querySelector("div.parent div.generated") ).toBe( node );
		});
		
		it("should allow passing a quoted string instead of a context path", function() {
			var value;
			
			ist.registerHelper('otherBlock', function(subcontext, subtemplate) {
				value = subcontext.value;
			});
			
			ist(textString).render({});
			expect( value ).toBe( "direct string value" );
		});
		
		it("should pass undefined when no narrowed down context is present", function() {
			var arg = 'defined', arg2 = 'defined', options,
				context = { context: { value: 'context' } };
				
			ist.registerHelper('noParamBlock', function(subcontext) {
				arg = subcontext;
			});
			ist(textNone).render(context);
			
			expect( typeof arg ).toBe( 'undefined' );
		});
		
		it("should allow pushing variables to a rendering context", function() {
			ist.registerHelper('pushBlock', function(subcontext, subtemplate) {
				subcontext.pushScope({ variable: "value" });
				return subtemplate.render(subcontext);
			});
			expect(
				ist("@pushBlock this\n '{{ variable }}'").render({}).childNodes[0]
			).toHaveTextContent( "value" );
		});
		
		it("should allow overwriting existing rendering context properties when pushing variables", function() {
			ist.registerHelper('pushBlock', function(subcontext, subtemplate) {
				subcontext.pushScope({ variable: "new value" });
				return subtemplate.render(subcontext);
			});
			expect(
				ist("@pushBlock this\n '{{ variable }}'").render({ variable: "value" }).childNodes[0]
			).toHaveTextContent( "new value" );
		});
		
		it("should allow stacking pushed variables in rendering contexts", function() {
			var fragment;
			
			ist.registerHelper('pushBlock1', function(subcontext, subtemplate) {
				subcontext.pushScope({ variable: "value 1" });
				return subtemplate.render(subcontext);
			});
			ist.registerHelper('pushBlock2', function(subcontext, subtemplate) {
				subcontext.pushScope({ variable: "value 2" });
				return subtemplate.render(subcontext);
			});
			
			fragment = ist("@pushBlock1 this\n '0 {{ variable }}'\n @pushBlock2 this\n  '1 {{ variable }}'\n '2 {{ variable }}'").render({});
			
			expect( fragment.childNodes[0] ).toHaveTextContent( "0 value 1" );
			expect( fragment.childNodes[1] ).toHaveTextContent( "1 value 2" );
			expect( fragment.childNodes[2] ).toHaveTextContent( "2 value 1" );
		});
		
		it("should allow popping pushed variables from rendering contexts", function() {
			ist.registerHelper('pushBlock', function(subcontext, subtemplate) {
				subcontext.pushScope({ variable: "new value" });
				subcontext.popScope();
				return subtemplate.render(subcontext);
			});
			expect(
				ist("@pushBlock this\n '{{ variable }}'").render({ variable: "value" }).childNodes[0]
			).toHaveTextContent( "value" );
		});
	};
});
