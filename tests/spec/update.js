define(["ist"], function(ist) {
	return function() {
		it("should enable updating by passing a new context object and previously rendered nodes to Template#update()", function() {
			var template = ist("div\n '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				updated = template.update({ variable: "new value" }, nodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should update nodes and not create new ones when updating", function() {
			var template = ist("div\n '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				node = nodes.firstChild,
				updated = template.update({ variable: "new value" }, nodes);
			
			expect( node ).toBeSameNodeAs( updated.firstChild );
		});
		
		it("should accept node arrays in Template#update()", function() {
			var template = ist("div\n '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				upnodes = Array.prototype.slice.call(nodes.childNodes),
				updated = template.update({ variable: "new value" }, upnodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should accept NodeLists in Template#update()", function() {
			var template = ist("div\n '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				upnodes = nodes.childNodes,
				updated = template.update({ variable: "new value" }, upnodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should accept DocumentFragments in Template#update()", function() {
			var template = ist("div\n '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				upnodes = document.createDocumentFragment(),
				updated;
				
			upnodes.appendChild(nodes);
			updated = template.update({ variable: "new value" }, upnodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
	};
});
