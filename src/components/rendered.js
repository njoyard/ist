define(function() {
	var RenderedTemplate = function(template, context, nodes) {
		this.template = template;
		this.context = context;
		this.nodes = nodes;
	};
	
	
	RenderedTemplate.prototype = {
		update: function(context) {
			this.template.update(context || this.context, this.nodes);
		}
	};
	
	return RenderedTemplate;
});
