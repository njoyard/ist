define(['components/context'], function(Context) {	
	var RenderedTemplate,
		slice = Array.prototype.slice;
	
	RenderedTemplate = function(template, context, nodes, parent) {
		this.nodes = nodes;
		this.parent = parent;
		this.template = template;
		this.context = context;
	};
	
	RenderedTemplate.prototype.update = function(newContext) {	
		var fragment, rendered;
		
		if (newContext) {
			if (!(newContext instanceof Context)) {
				this.context = this.context.createContext(newContext);
			} else {
				this.context = newContext;
			}
		}
		
		if (!this.nodes) {
			rendered = this.template.renderInto(this.context, this.parent);
			this.nodes = rendered.nodes;
		} else {
			fragment = this.template.update(this.context, this.nodes);
			this.nodes = slice.Call(fragment.childNodes);
		}
		
		return this;
	};
	
	return RenderedTemplate;
});
