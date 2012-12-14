/**
 * IST: Indented Selector Templating
 *
 * Copyright (c) 2012 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://njoyard.github.com/ist
 */
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
