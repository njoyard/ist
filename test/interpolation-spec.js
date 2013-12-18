/*jshint browser:true*/
/*global define, describe, it, expect*/

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
			},
			baseNodes = tBase.render({ variable: 'value', object: obj }).childNodes,
			propNodes = tProperties.render(propObj).childNodes,
			thisNodes = tThis.render('value').childNodes;
		
		it('should interpolate variables in text nodes', function() {
			expect( baseNodes[0].textContent ).toBe( 'before value after' );
		});
		
		it('should interpolate variables in attribute values', function() {
			expect( baseNodes[1].getAttribute('attribute') ).toBe( 'before value after' );
		});
		
		it('should interpolate variables in property values', function() {
			expect( baseNodes[2].property ).toBe( 'before value after' );
		});
		
		it('should ignore space inside interpolation braces', function() {
			expect( baseNodes[3].textContent ).toBe( 'value' );
			expect( baseNodes[4].textContent ).toBe( 'value' );
		});
		
		it('should convert non-string variables to string', function() {
			expect( baseNodes[5].getAttribute('attribute') ).toBe( obj.toString() );
		});
		
		it('should interpolate context properties', function() {
			expect( propNodes[0].textContent ).toBe( 'value' );
			expect( propNodes[1].textContent ).toBe( 'value' );
		});
		
		it('should interpolate \'this\' as the rendering context itself', function() {
			expect( thisNodes[0].textContent ).toBe( 'value' );
		});
		
		it('should interpolate undefined subproperties as \'undefined\'', function() {
			propObj.sub = {};
			expect( tProperties.render(propObj).childNodes[0].textContent ).toBe( '' + undefined );
		});
		
		it('should fail to render when accessing properties of undefined context parts', function() {
			propObj.access = {};
			expect( function() { tProperties.render(propObj); } ).toThrowAny([
				'Cannot read property \'deeply\' of undefined in \'test/interpolation/properties\' on line 2',
				'access.to is undefined in \'test/interpolation/properties\' on line 2',
				'\'undefined\' is not an object (evaluating \'access.to.deeply\') in \'test/interpolation/properties\' on line 2'
			]);
		});
		
		document.myClassValue = 'document property value';
		var exprNodes = tExpressions.render(obj).childNodes;
		
		it('should evaluate expressions', function() {
			expect( exprNodes[0].textContent ).toBe( '' + (1 + 17 - 3 / 2) );
			expect( exprNodes[1].textContent ).toBe( '' + (obj.aNumber + 3) );
		});
		
		it('should allow accessing the rendering document inside expressions using \'document\'', function() {
			expect( exprNodes[2].className ).toBe( document.myClassValue + 'suffix' );
		});
		
		it('should execute arbitrary JS code inside expressions', function() {
			expect( exprNodes[3].textContent ).toBe( '' + (Math.PI + (function(arg) { return Array.isArray(arg); })([1, 2])) );
		});

		it('should report syntax error in expressions when compiling', function() {
			expect( function() { ist('\'{{ syntax error }}\''); })
				.toThrowAny([
					'Unexpected identifier in \'<unknown>\' on line 1',
					'missing ; before statement in \'<unknown>\' on line 1',
					'Expected an identifier but found \'error\' instead in \'<unknown>\' on line 1',
					'Parse error in \'<unknown>\' on line 1'
				]);

			expect( function() { ist('div[attr={{ syntax error }}]'); } )
				.toThrowAny([
					'Unexpected identifier in \'<unknown>\' on line 1',
					'missing ; before statement in \'<unknown>\' on line 1',
					'Expected an identifier but found \'error\' instead in \'<unknown>\' on line 1',
					'Parse error in \'<unknown>\' on line 1'
				]);

			expect( function() { ist('div[.prop={{ syntax error }}]'); } )
				.toThrowAny([
					'Unexpected identifier in \'<unknown>\' on line 1',
					'missing ; before statement in \'<unknown>\' on line 1',
					'Expected an identifier but found \'error\' instead in \'<unknown>\' on line 1',
					'Parse error in \'<unknown>\' on line 1'
				]);
			
			expect( function() { ist('@with syntax error\n \'test\''); } )
				.toThrowAny([
					'Unexpected identifier in \'<unknown>\' on line 1',
					'missing ; before statement in \'<unknown>\' on line 1',
					'Expected an identifier but found \'error\' instead in \'<unknown>\' on line 1',
					'Parse error in \'<unknown>\' on line 1'
				]);
				
		});
		
		it('should report errors thrown by expressions in strings when rendering', function() {
			expect( function() { tErrors.render({ test: 'type' }); } )
				.toThrowAny([
					'a is not defined in \'test/interpolation/errors\' on line 2',
					'Can\'t find variable: a in \'test/interpolation/errors\' on line 2'
				]);
				
			expect( function() { tErrors.render({ test: 'throw' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 15');
		});
		
		it('should report errors thrown by expressions in attributes when rendering', function() {
			expect( function() { tErrors.render({ test: 'type2' }); } )
				.toThrowAny([
					'a is not defined in \'test/interpolation/errors\' on line 5',
					'Can\'t find variable: a in \'test/interpolation/errors\' on line 5'
				]);
				
			expect( function() { tErrors.render({ test: 'throw2' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 18');
		});
		
		it('should report errors thrown by expressions in properties when rendering', function() {
			expect( function() { tErrors.render({ test: 'type3' }); } )
				.toThrowAny([
					'a is not defined in \'test/interpolation/errors\' on line 8',
					'Can\'t find variable: a in \'test/interpolation/errors\' on line 8'
				]);
				
			expect( function() { tErrors.render({ test: 'throw3' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 21');
		});
		
		it('should report errors thrown by expressions in directives when rendering', function() {
			expect( function() { tErrors.render({ test: 'type4' }); } )
				.toThrowAny([
					'a is not defined in \'test/interpolation/errors\' on line 11',
					'Can\'t find variable: a in \'test/interpolation/errors\' on line 11'
				]);
				
			expect( function() { tErrors.render({ test: 'throw4' }); } )
				.toThrow('custom error in \'test/interpolation/errors\' on line 24');
		});
	});
});
