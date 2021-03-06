/*jshint browser:true*/
/*global define, describe, it, expect*/

define([
	'ist',
	'ist!test/syntax/emptylines',
	'ist!test/syntax/children',
	'ist!test/syntax/siblings',
	'text!test/syntax/notextchildren.ist',
	'text!test/syntax/nomatchingindent.ist',
	'ist!test/syntax/indentedroot',
	'ist!test/syntax/comments',
	'ist!test/syntax/escapednl'
], function(
	ist,
	tEmptyLines, tChildren, tSiblings,
	textNoTextChildren, textNoMatchingIndent,
	tIndentedRoot, tComments, tEscapedNl) {
	'use strict';
	
	var elNodes = tEmptyLines.render().childNodes,
		childrenNodes = tChildren.render().childNodes,
		siblingsNodes = tSiblings.render().childNodes,
		irootNodes = tIndentedRoot.render().childNodes,
		cmtNodes = tComments.render().childNodes,
		enlNodes = tEscapedNl.render().childNodes;
	
	describe('syntax', function() {
		it('should ignore empty and whitespace-only lines', function() {
			expect( elNodes.length ).toBe(2);
			expect( typeof elNodes[0] ).toNotBe('undefined');
			expect( typeof elNodes[0].tagName ).toNotBe('undefined');
			expect( elNodes[0].tagName.toLowerCase() ).toBe('div');
			expect( elNodes[1].tagName.toLowerCase() ).toBe('span');
		});
		
		it('should use previous node as parent node when indent is bigger', function() {
			expect( childrenNodes.length ).toBe(5);
			
			for (var i = 0; i < 4; i++) {
				expect( childrenNodes[i].childNodes.length ).toBe(1);
				expect( childrenNodes[i].firstChild.className ).toBe('child');
			}
			
			expect( childrenNodes[4].childNodes.length ).toBe(1);
			expect( childrenNodes[4].firstChild.className ).toBe('parent');
			expect( childrenNodes[4].firstChild.childNodes.length ).toBe(1);
			expect( childrenNodes[4].firstChild.firstChild.className ).toBe('child');
		});
		
		it('should append nodes to the same parent when at the same indent', function() {
			var brotherhoods = {},
				slice = Array.prototype.slice;
			
			// Walk the whole tree, sorting nodes by className
			function walk(nodes) {
				slice.call(nodes).forEach(function(child) {
					brotherhoods[child.className] = brotherhoods[child.className] || [];
					brotherhoods[child.className].push(child);
					
					walk(child.childNodes);
				});
			}
			walk(siblingsNodes);
			
			// Check that nodes are only siblings in each brotherhood
			Object.keys(brotherhoods).forEach(function(key) {
				var bhood = brotherhoods[key];
				
				expect( bhood[0].previousSibling ).toBeFalsy();
				for (var i = 0, len = bhood.length; i < len - 1; i++) {
					expect( bhood[i].nextSibling ).toBe( bhood[i+1] );
				}
				expect( bhood[i].nextSibling ).toBeFalsy();
			});
		});
		
		it('should fail to add children to text nodes', function() {
			expect( function() {
				ist(textNoTextChildren);
			}).toThrow('Cannot add children to text node in \'<unknown>\' on line 2');
		});
		
		it('should fail to parse deindented nodes without any matching sibling', function() {
			expect( function() {
				ist(textNoMatchingIndent, 'templateName');
			}).toThrow('Unexpected indent in \'templateName\' on line 3, character 1');
		});
		
		it('should support indented root nodes', function() {
			expect( irootNodes.length ).toBe( 2 );
		});
		
		it('should support /* block comments */', function() {
			expect( cmtNodes[0].className ).toBe( 'class1' );
			expect( cmtNodes[1].className ).toBe( 'class2' );
			expect( cmtNodes[1].childNodes[0].className ).toBe( 'class3' );
			expect( cmtNodes[1].childNodes[0].childNodes[0].className ).toBe( 'class4' );
			expect( cmtNodes[2].className ).toBe( 'class5' );
			expect( cmtNodes[2].childNodes[0].className ).toBe( 'class6' );
		});

		it('should ignore escaped new lines', function() {
			expect( enlNodes[0].className ).toBe( 'class' );
			expect( enlNodes[1].className ).toBe( 'class' );
			expect( enlNodes[2].className ).toBe( 'class' );
			expect( enlNodes[2].id ).toBe( 'id' );
		});
	});
});
