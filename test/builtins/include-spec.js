/*jshint browser:true*/
/*global define, describe, it, expect */

define([
	'ist',
	'ist!test/builtins/include/include',
	'text!test/builtins/include/include.ist',
	'text!test/builtins/include/includetext.ist',
	'text!test/builtins/include/includeinvalid.ist',
	
	// These ones are only preloaded
	'test/builtins/include/included_invalid',
	'ist!test/builtins/include/included_ist',
	'text!test/builtins/include/included_text.ist',
	'test/builtins/include/included_string',
	'test/builtins/include/included_compiled'
], function(ist, tInclude, textInclude, textIncludeText, textIncludeInvalid) {
	'use strict';
	
	return function() {
		describe('[Builtin @include]', function() {
			var inclTextFragment = ist(textIncludeText).render({});
			
			it('should allow including relative template paths when loaded with the ist! plugin', function() {
				var inclFragment = tInclude.render({ variable: 'value' });
				
				expect( inclFragment.querySelector('.parent .included') ).toNotBe( null );
				expect( inclFragment.querySelector('.parent .included .includedchild') ).toNotBe( null );
			});
			
			it('should allow including templates from <script type=\'text/x-ist\' id=\'...\'> tags', function() {
				var inclFragment = tInclude.render({ variable: 'value' });
				
				expect( inclFragment.querySelector('.parent .insideScriptTag' ) ).toNotBe( null );
				expect( inclFragment.querySelector('.parent .insideScriptTag .child' ) ).toNotBe( null );
				expect( inclFragment.querySelector('.parent .insideScriptTag .child .conditional' ) ).toNotBe( null );
			});
			
			it('should render includes in current context', function() {
				var inclFragment = tInclude.render({ variable: 'value' });
				
				expect( inclFragment.querySelector('.parent .included .includedchild').firstChild.textContent ).toBe( 'value' );
			});
			
			it('should fail to render templates with missing @include files/<script> tags', function() {
				expect( function() { ist(textInclude).render(); } ).toThrow( 'Cannot find included template \'included.ist\' in \'<unknown>\' on line 2' );
			});
			
			it('should use templates previously loaded with the ist! plugin when rendering a string template', function() {
				expect( inclTextFragment.querySelector('.elements1 .included') ).toNotBe( null );
				expect( inclTextFragment.querySelector('.elements2 .included') ).toNotBe( null );
			});
			
			it('should use templates previously loaded as text when rendering a string template', function() {
				expect( inclTextFragment.querySelector('.elements3 .included') ).toNotBe( null );
				expect( inclTextFragment.querySelector('.elements4 .included') ).toNotBe( null );
			});
			
			it('should use previously loaded modules resolving to compiled templates when rendering a string template', function() {
				expect( inclTextFragment.querySelector('.elements5 .included') ).toNotBe( null );
			});
			
			it('should use previously loaded modules resolving to template strings when rendering a string template', function() {
				expect( inclTextFragment.querySelector('.elements6 .included') ).toNotBe( null );
			});
			
			it('should fail to render templates with invalid includes', function() {
				expect( function() { ist(textIncludeInvalid).render(); } ).toThrow( 'Invalid included template \'test/builtins/include/included_invalid\' in \'<unknown>\' on line 1' );
			});
		});
	};
});
