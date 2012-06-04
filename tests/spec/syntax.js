define([
	'ist',
	'ist!syntax/emptylines',
	'ist!syntax/children',
	'ist!syntax/siblings',
	'text!syntax/notextchildren.ist',
	'text!syntax/nomatchingindent.ist',
	'ist!syntax/indentedroot',
	'ist!syntax/comments'
], function(
	ist,
	tEmptyLines, tChildren, tSiblings,
	textNoTextChildren, textNoMatchingIndent,
	tIndentedRoot, tComments) {
	
	var elNodes = tEmptyLines.render().childNodes,
		childrenNodes = tChildren.render().childNodes,
		siblingsNodes = tSiblings.render().childNodes,
		irootNodes = tIndentedRoot.render().childNodes,
		cmtNodes = tComments.render().childNodes;
	
	describe('syntax', function() {
		it("should ignore empty and whitespace-only lines", function() {
			expect( elNodes.length ).toBe(2);
			expect( typeof elNodes[0] ).toNotBe('undefined');
			expect( typeof elNodes[0].tagName ).toNotBe('undefined');
			expect( elNodes[0].tagName.toLowerCase() ).toBe('div');
			expect( elNodes[1].tagName.toLowerCase() ).toBe('span');
		});
		
		it("should use previous node as parent node when indent is bigger", function() {
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
		
		it("should append nodes to the same parent when at the same indent", function() {
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
		
		it("should fail to add children to text nodes", function() {
			expect( function() {
				ist(textNoTextChildren);
			}).toThrow("Cannot add children to TextNode");
		});
		
		it("should fail to parse deindented nodes without any matching sibling", function() {
			expect( function() {
				ist(textNoMatchingIndent, 'templateName');
			}).toThrow("Unexpected indent in templateName on line 3");
		});
		
		it("should support indented root nodes", function() {
			expect( irootNodes.length ).toBe( 2 );
		});
		
		it("should support /* block comments */", function() {
			
		});
	});
});
