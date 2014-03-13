/*jshint browser:true*/
/*global define, describe, it, expect, renderAndGetNode */

define([
	'ist',
	'ist!test/interpolation/base',
	'ist!test/interpolation/properties',
	'ist!test/interpolation/this',
	'ist!test/interpolation/expressions',
	'ist!test/interpolation/errors'
], function(ist, tBase, tProperties, tThis, tExpressions, tErrors) {
	'use strict';

	describe('interpolation', function() {
		var obj = { a: 1, b: '2', aNumber: 1234 },
			propObj = {
				sub: { property: 'value' },
				access: { to: { deeply: { nested: { property: 'value' } } } }
			};

		function getBaseNode(index) {
			return tBase.render({ variable: 'value', object: obj }).childNodes[index];
		}

		function getPropNode(index) {
			return tProperties.render(propObj).childNodes[index];
		}

		function getThisNode(index) {
			return tThis.render('value').childNodes[index];
		}
		
		it('should interpolate variables in text nodes', function() {
			expect( renderAndGetNode(tBase, { variable: 'value', object: obj }, 0).textContent ).toBe( 'before value after' );
		});
		
		it('should interpolate variables in attribute values', function() {
			expect( renderAndGetNode(tBase, { variable: 'value', object: obj }, 1).getAttribute('attribute') ).toBe( 'before value after' );
		});
		
		it('should interpolate variables in property values', function() {
			expect( renderAndGetNode(tBase, { variable: 'value', object: obj }, 2).property ).toBe( 'before value after' );
		});
		
		it('should ignore space inside interpolation braces', function() {
			expect( renderAndGetNode(tBase, { variable: 'value', object: obj }, 3).textContent ).toBe( 'value' );
			expect( renderAndGetNode(tBase, { variable: 'value', object: obj }, 4).textContent ).toBe( 'value' );
		});
		
		it('should convert non-string variables to string', function() {
			expect( renderAndGetNode(tBase, { variable: 'value', object: obj }, 5).getAttribute('attribute') ).toBe( obj.toString() );
		});
		
		it('should interpolate context properties', function() {
			expect( renderAndGetNode(tProperties, propObj, 0).textContent ).toBe( 'value' );
			expect( renderAndGetNode(tProperties, propObj, 1).textContent ).toBe( 'value' );
		});
		
		it('should interpolate \'this\' as the rendering context itself', function() {
			expect( renderAndGetNode(tThis, 'value', 0).textContent ).toBe( 'value' );
		});
		
		it('should interpolate undefined subproperties as \'undefined\'', function() {
			propObj.sub = {};
			expect( tProperties.render(propObj).childNodes[0].textContent ).toBe( '' + undefined );
		});
		
		it('should fail to render when accessing properties of undefined context parts', function() {
			propObj.access = {};
			expect( function() { tProperties.render(propObj); } )
				.toThrowRefError('deeply', 'access.to', 'test/interpolation/properties', 2);
		});
		
		document.myClassValue = 'document property value';
		
		it('should evaluate expressions', function() {
			expect( renderAndGetNode(tExpressions, obj, 0).textContent ).toBe( '' + (1 + 17 - 3 / 2) );
			expect( renderAndGetNode(tExpressions, obj, 1).textContent ).toBe( '' + (obj.aNumber + 3) );
		});
		
		it('should allow accessing the rendering document inside expressions using \'document\'', function() {
			expect( renderAndGetNode(tExpressions, obj, 2).className ).toBe( document.myClassValue + 'suffix' );
		});
		
		it('should execute arbitrary JS code inside expressions', function() {
			expect( renderAndGetNode(tExpressions, obj, 3).textContent ).toBe( '' + (function(arg) { return arg.reduce(function(a,b) { return a+b; }, 0); })([1, 2]) );
		});

		it('should report syntax error in expressions when compiling', function() {
			expect( function() { ist('\'{{ syntax error }}\''); })
				.toThrowSyntaxError('error', '<unknown>', 1);

			expect( function() { ist('div[attr={{ syntax error }}]'); } )
				.toThrowSyntaxError('error', '<unknown>', 1);

			expect( function() { ist('div[.prop={{ syntax error }}]'); } )
				.toThrowSyntaxError('error', '<unknown>', 1);
			
			expect( function() { ist('@with syntax error\n \'test\''); } )
				.toThrowSyntaxError('error', '<unknown>', 1);
				
		});
		
		it('should report errors thrown by expressions in strings when rendering', function() {
			expect( function() { tErrors.render({ test: 'type' }); } )
				.toThrowUndefined('a', 'test/interpolation/errors', 2);
				
			expect( function() { tErrors.render({ test: 'throw' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 15');
		});
		
		it('should report errors thrown by expressions in attributes when rendering', function() {
			expect( function() { tErrors.render({ test: 'type2' }); } )
				.toThrowUndefined('a', 'test/interpolation/errors', 5);
				
			expect( function() { tErrors.render({ test: 'throw2' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 18');
		});
		
		it('should report errors thrown by expressions in properties when rendering', function() {
			expect( function() { tErrors.render({ test: 'type3' }); } )
				.toThrowUndefined('a', 'test/interpolation/errors', 8);
				
			expect( function() { tErrors.render({ test: 'throw3' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 21');
		});
		
		it('should report errors thrown by expressions in directives when rendering', function() {
			expect( function() { tErrors.render({ test: 'type4' }); } )
				.toThrowUndefined('a', 'test/interpolation/errors', 11);
				
			expect( function() { tErrors.render({ test: 'throw4' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 24');
		});
	});
});
