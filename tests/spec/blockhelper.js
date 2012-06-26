define([
	'ist',
	'text!blockhelper/blockhelper.ist',
	'text!blockhelper/parameters.ist',
	'text!blockhelper/nocontext.ist'
], function(ist, textBlockhelper, textParameters, textNocontext) {
	describe('blockhelpers', function() {
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
				return document.createDocumentFragment();
			});
			ist(textBlockhelper).render(context);
			
			expect( called ).toBe( true );
		});
		
		it("should pass the current context to helpers as 'this'", function() {
			var hthis,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function() {
				hthis = this;
				return document.createDocumentFragment();
			});
			ist(textBlockhelper).render(context);
			
			expect( hthis.value ).toBe( context );
		});
		
		it("should pass the narrowed down context to helpers as 1st argument", function() {
			var arg,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function(subcontext) {
				arg = subcontext;
				return document.createDocumentFragment();
			});
			ist(textBlockhelper).render(context);
			
			expect( arg.value ).toBe( context.context );
		});
		
		it("FAIL-REWRITE should pass the rendering document to helper as a property of the 2nd argument", function() {
			var arg,
				context = { context: { value: 'context' } };
				
				
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				arg = subtemplate.document;
				return document.createDocumentFragment();
			});
			ist(textBlockhelper).render(context);
			
			expect( arg ).toBe( document );
		});
		
		it("should enable helpers rendering the subtemplate with a custom context", function() {
			var result,
				context = { context: { value: 'context' } };
				
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				result = subtemplate.render({ value: 'my value' });
				return document.createDocumentFragment();
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
		
		it("should allow helper named parameters passed as param=\"value\"", function() {
			var exception;
			
			try {
				ist(textParameters);
			} catch(e) {
				exception = e;
			}
			expect( typeof exception ).toBe( 'undefined' );
		});
		
		it("should pass named parameters to helpers as third parameter", function() {
			var options;
			
			ist.registerHelper('testBlock', function(subcontext, subtemplate, opt) {
				options = opt;
				return subtemplate.document.createDocumentFragment();
			});
			ist.registerHelper('otherBlock', function(subcontext, subtemplate, opt) {
				return subtemplate.document.createDocumentFragment();
			});
			fragment = ist(textParameters).render({ context: undefined });
			
			expect( typeof options ).toBe( 'object' );
			expect( options.first ).toBe( 'value' );
			expect( options.second ).toBe( 'va lu=e' );
		});
		
		it("should allow escaped characters in block parameter values", function() {
			var options;
			
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				options = subtemplate.options;
				return subtemplate.document.createDocumentFragment();
			});
			ist.registerHelper('otherBlock', function(subcontext, subtemplate) {
				return subtemplate.document.createDocumentFragment();
			});
			fragment = ist(textParameters).render({ context: undefined });
			
			expect( options.third ).toBe( "other\\" );
			expect( options.fourth ).toBe( "\n\\test\"" );
		});
		
		it("should allow block parameters without name and store the last one as 'text'", function() {
			var options;
			
			ist.registerHelper('testBlock', function(subcontext, subtemplate) {
				return subtemplate.document.createDocumentFragment();
			});
			ist.registerHelper('otherBlock', function(subcontext, subtemplate) {
				options = subtemplate.options;
				return subtemplate.document.createDocumentFragment();
			});
			fragment = ist(textParameters).render({ context: undefined });
			
			expect( options.text ).toBe( "second text without name" );
		});
		
		it("should pass undefined when no narrowed down context is present", function() {
			var arg = 'defined', arg2 = 'defined', options,
				context = { context: { value: 'context' } };
				
			ist.registerHelper('noContext', function(subcontext) {
				arg = subcontext;
				return document.createDocumentFragment();
			});
			ist.registerHelper('noContextParam', function(subcontext, subtemplate) {
				arg2 = subcontext;
				options = subtemplate.options;
				return document.createDocumentFragment();
			});
			ist(textNocontext).render(context);
			
			expect( typeof arg ).toBe( 'undefined' );
			expect( typeof arg2 ).toBe( 'undefined' );
			expect( typeof options ).toBe( 'object' );
			expect( options.param ).toBe( 'value' );
		});
	});
});
