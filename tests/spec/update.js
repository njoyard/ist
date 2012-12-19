define(["ist"], function(ist) {
	return function() {
		it("should enable updating by passing a new context object and " +
			"previously rendered nodes to Template#update()", function() {
			var template = ist("div '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				updated = template.update({ variable: "new value" }, nodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should update nodes and not create new ones when updating",
			function() {
			var template = ist("div '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				node = nodes.firstChild,
				updated = template.update({ variable: "new value" }, nodes);
			
			expect( node ).toBeSameNodeAs( updated.firstChild );
		});
		
		it("should accept node arrays in Template#update()", function() {
			var template = ist("div '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				upnodes = Array.prototype.slice.call(nodes.childNodes),
				updated = template.update({ variable: "new value" }, upnodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should accept NodeLists in Template#update()", function() {
			var template = ist("div '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				upnodes = nodes.childNodes,
				updated = template.update({ variable: "new value" }, upnodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should accept DocumentFragments in Template#update()", function() {
			var template = ist("div '{{ variable }}'"),
				nodes = template.render({ variable: "value" }),
				upnodes = document.createDocumentFragment(),
				updated;
				
			upnodes.appendChild(nodes);
			updated = template.update({ variable: "new value" }, upnodes);
			
			expect( updated.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should render into container when using Template#renderInto",
			function() {
			var template = ist("div '{{ variable }}'"),
				container = document.createElement("div");
				
			template.renderInto(container, { variable: "value" });
				
			expect( container.firstChild ).toBeElement( "div" );
			expect( container.firstChild ).toHaveTextContent( "value" );
		});
		
		it("should enable updating by using #update() on the return value of " +
			"Template#renderInto", function() {
			var template = ist("div '{{ variable }}'"),
				div = document.createElement("div"),
				rendered = template.renderInto(div, { variable: "value" });
				
			rendered.update({ variable: "new value" });
			expect( div.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should enable updating when using Template#renderInto even when " +
			"no nodes have been rendered in the first place", function() {
			var template = ist("@if cond\n div '{{ variable }}'"),
				container = document.createElement("div"),
				rendered = template.renderInto(container, {
					cond: false, variable: "value"
				});
				
			rendered.update({ cond: true, variable: "new value" });
			expect( container.firstChild ).toHaveTextContent( "new value" );
		});
		
		it("should pass a LiveFragment with previously rendered nodes to " +
			"directive helpers when updating", function() {
			var template = ist("@test"),
				container = document.createElement("div"),
				nodelists = [],
				rendered;
			
			ist.registerHelper("test", function(ctx, tmpl, fragment) {
				nodelists.push(Array.prototype.slice.call(fragment.childNodes));
				
				if (!fragment.hasChildNodes()) {
					fragment.appendChild(this.createTextNode("original node"));
				} else {
					fragment.appendChild(this.createTextNode("new node"));
				}
			});
			
			rendered = template.renderInto(container);
			rendered.update();
			
			expect( nodelists[1].length ).toBe( 1 );
			expect( nodelists[1][0] ).toHaveTextContent( "original node" );
			
			expect( container.childNodes.length ).toBe( 2 );
			expect( container.lastChild ).toHaveTextContent( "new node" );
		});
	};
});
