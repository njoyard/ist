define([
	'ist',
	'text!blockhandler/blockhandler.ist',
	'text!blockhandler/nocontext.ist'
], function(ist, textBlockhandler, textNocontext) {
	describe('blockhandlers', function() {
		it("should call helpers when the corresponding block is parsed", function() {
			var called = false,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function() {
				called = true;
				return document.createDocumentFragment();
			});
			ist(textBlockhandler).render(context);
			
			expect( called ).toBe( true );
		});
		
		it("should pass the current context to helpers as 'this'", function() {
			var hthis,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function() {
				hthis = this;
				return document.createDocumentFragment();
			});
			ist(textBlockhandler).render(context);
			
			expect( hthis ).toBe( context );
		});
		
		it("should pass the narrowed down context to helpers as 1st argument", function() {
			var arg,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function(subcontext) {
				arg = subcontext;
				return document.createDocumentFragment();
			});
			ist(textBlockhandler).render(context);
			
			expect( arg ).toBe( context.context );
		});
		
		it("should pass undefined when no narrowed down context is present", function() {
			var arg = 'defined'
				context = { context: { value: 'context' } };
				
			ist.registerHelper('noContext', function(subcontext) {
				arg = subcontext;
				return document.createDocumentFragment();
			});
			ist(textNocontext).render(context);
			
			expect( typeof arg ).toBe( 'undefined' );
		});
		
		it("should pass the rendering document to helper as a property of the 2nd argument", function() {
			var arg,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				arg = subtemplate.document;
				return document.createDocumentFragment();
			});
			ist(textBlockhandler).render(context);
			
			expect( arg ).toBe( document );
		});
		
		it("should enable helpers rendering the subtemplate with a custom context", function() {
			var result,
				context = { context: { value: 'context' } };
				
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				result = subtemplate.render({ value: 'my value' });
				return document.createDocumentFragment();
			});
			ist(textBlockhandler).render(context);
			
			expect( result.querySelector('.child') ).toNotBe( null );
			expect( result.querySelector('.child').firstChild ).toNotBe( null );
			expect( result.querySelector('.child').firstChild.textContent ).toBe( 'interpolated my value' );
		});
		
		it("should insert what helpers return into the parent template node", function() {
			var node, fragment;
				
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				node = subtemplate.document.createElement('div');
				node.className = 'generated';
				return node;
			});
			fragment = ist(textBlockhandler).render({ context: undefined });
			
			expect( fragment.querySelector("div.parent div.generated") ).toNotBe( null );
			expect( fragment.querySelector("div.parent div.generated") ).toBe( node );
		});
	});
});
