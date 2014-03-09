/**
 * IST: Indented Selector Templating
 * version 0.6.6
 *
 * Copyright (c) 2012-2014 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://njoyard.github.com/ist
 */

!function(e){var t,n,r="function"==typeof e.define&&e.define.amd,i="undefined"!=typeof process&&process.versions&&!!process.versions.node,o="undefined"!=typeof window&&window.navigator&&window.document;n={require:e.require},n.misc=function(){return{jsEscape:function(e){return e.replace(/(['\\])/g,"\\$1").replace(/[\f]/g,"\\f").replace(/[\b]/g,"\\b").replace(/[\t]/g,"\\t").replace(/[\n]/g,"\\n").replace(/[\r]/g,"\\r")},findScript:function(e){var t,n,r,i,o;try{o=document.querySelectorAll("script#"+e)}catch(c){return}if(o)for(t=0,n=o.length;n>t;t++)if(r=o[t],"text/x-ist"===r.getAttribute("type"))return r.innerHTML;return i},appendNodeSegment:function(e,t,n){for(var r,i=e,o=t?t.nextSibling:null;i&&i!=o;)r=i.nextSibling,n.appendChild(i),i=r},insertNodeSegmentBefore:function(e,t,n,r){for(var i,o=e,c=t?t.nextSibling:null;o&&o!=c;)i=o.nextSibling,n.insertBefore(o,r),o=i}}}(),n.codegen=function(e){var t=/{{\s*((?:}(?!})|[^}])*?)\s*}}/,n={},r=function(){};return{expression:function(e){var t="{{ "+e+" }}";return t in n||(n[t]="function(document,_istScope){if(this!==null&&this!==undefined){with(this){with(_istScope){return "+e+";}}}else{with(_istScope){return "+e+";}}}"),n[t]},interpolation:function(r){return r in n||(n[r]=this.expression(r.split(t).map(function(t,n){return n%2?"("+t+")":"'"+e.jsEscape(t)+"'"}).filter(function(e){return"''"!==e}).join("+"))),n[r]},directiveEvaluator:function(e){return"expr"in e?new Function("document,_istScope","return ("+this.expression(e.expr)+").call(this,document,_istScope);"):r},elementUpdater:function(e){var t=[],n=this,r=e.attributes,i=e.properties,o=e.events;return Object.keys(r).forEach(function(e){t.push('element.setAttribute("'+e+'",('+n.interpolation(r[e])+").call(this,document,_istScope));")}),i.forEach(function(e){for(var r=[],i=0,o=e.path.length;o>i;i++){var c=e.path[i];i===o-1?r.push('current["'+c+'"] = value;'):r.push('if (!("'+c+'" in current)) {current["'+c+'"] = {};}current = current["'+c+'"];')}t.push("(function(value) {var current = element;"+r.join("")+"})(("+n.interpolation(e.value)+").call(this,document,_istScope));")}),Object.keys(o).forEach(function(e){t.push('element.addEventListener("'+e+'",('+n.expression(o[e])+").call(this,document,_istScope),false);")}),new Function("document,_istScope,element",t.join(""))},textUpdater:function(e){return new Function("document,_istScope,textNode",'textNode.textContent=""+('+this.interpolation(e.text)+").call(this,document,_istScope);")}}}(n.misc),n.context=function(){function e(t,n){this.value=t,this.values=[t],this.doc=n||document,this.rootScope=this.scope=e.globalScope}return e.globalScope={},e.prototype={importNode:function(e,t){return e.ownerDocument===this.doc?e.cloneNode(t):this.doc.importNode(e,t)},createDocumentFragment:function(){return this.doc.createDocumentFragment()},createElement:function(e,t){return"undefined"!=typeof t?this.doc.createElementNS(t,e):this.doc.createElement(e)},createTextNode:function(e){return this.doc.createTextNode(e)},createComment:function(e){return this.doc.createComment(e)},pushScope:function(e){var t=Object.create(this.scope);Object.keys(e).forEach(function(n){t[n]=e[n]}),this.scope=t},popScope:function(){var e=this.scope;if(e===this.rootScope)throw new Error("No scope left to pop out");this.scope=Object.getPrototypeOf(e)},pushValue:function(e){this.values.unshift(e),this.value=e,void 0!==e&&null!==e&&"string"!=typeof e&&"number"!=typeof e?this.pushScope(e):this.pushScope({})},popValue:function(){this.popScope(),this.values.shift(),this.value=this.values[0]},createContext:function(t){return new e(t,this.doc)},scopedCall:function(e,t){return e.call(this.value,this.doc,this.scope,t)}},e}(),n.directives=function(){function e(e,t,n,r){var i=r.extractRenderedFragment();t&&(i?i.update(e):i=n.render(e),r.appendRenderedFragment(i))}function t(e,t,n,r,i,o){var c=e.value,a=o.extractRenderedFragments(),s=a.keys,u=a.fragments;t.forEach(function(a,l){e.pushValue(a);var d={first:0===l,index:l,last:l==t.length-1,length:t.length,outer:c};r&&Object.keys(r).forEach(function(e){d[e]=r[e]}),e.pushScope({loop:d});var p,f=s.indexOf(n[l]);-1===f?p=i.render(e):(p=u[f],p.update(e)),e.popScope(),e.popValue(),o.appendRenderedFragment(p,n[l])})}var n,r,i={};return r={"if":function(t,n,r,i){e.call(null,t,n,r,i)},unless:function(t,n,r,i){e.call(null,t,!n,r,i)},"with":function(e,t,n,r){var i=r.extractRenderedFragment();e.pushValue(t),i?i.update(e):i=n.render(e),e.popValue(),r.appendChild(n.render(t))},each:function(e,n,r,i){if(!Array.isArray(n))throw new Error(n+" is not an array");t(e,n,n,null,r,i)},eachkey:function(){function e(e){return{key:e,value:this[e]}}return function(n,r,i,o){var c,a=Object.keys(r);c=a.map(e,r),t(n,c,a,{object:r},i,o)}}(),dom:function(e,t,n,r){for(t.ownerDocument!==e.doc&&(t=e.doc.importNode(t,!0));r.hasChildNodes();)r.removeChild(r.firstChild);r.appendChild(t)},define:function(e,t,n){i[t]=n},use:function(e,t,n,r){var o=i[t];if(!o)throw new Error("Template '"+t+"' has not been @defined");var c=r.extractRenderedFragment();c?c.update(e):c=o.render(e),r.appendRenderedFragment(c)}},n={register:function(e,t){r[e]=t},get:function(e){return r[e]}}}(),n.rendereddirective=function(e){function t(e,t){this._istKeyIndex.push(t),this._istFragIndex.push({firstChild:e.firstChild,lastChild:e.lastChild,update:e.update}),this.appendChild(e)}function n(){var t=this._istContext,n=this._istKeyIndex,r=this._istFragIndex,i={keys:n.slice(),fragments:r.map(function(n){var r=t.createDocumentFragment();return e.appendNodeSegment(n.firstChild,n.lastChild,r),r.update=n.update,r})};return n.splice(0,n.length),r.splice(0,r.length),i}function r(t){var n,r,i=this._istContext,o=this._istKeyIndex,c=this._istFragIndex,a=o.indexOf(t);return-1!==a?(n=c[a],r=i.createDocumentFragment(),e.appendNodeSegment(n.firstChild,n.lastChild,r),r.update=n.update,o.splice(a,1),c.splice(a,1),r):void 0}function i(){this.firstChild=null,this.lastChild=null,this.keyIndex=[],this.fragIndex=[]}return i.prototype.createFragment=function(i){var o=i.createDocumentFragment();return o._istContext=i,o._istKeyIndex=this.keyIndex,o._istFragIndex=this.fragIndex,o.appendRenderedFragment=t,o.extractRenderedFragment=r,o.extractRenderedFragments=n,e.appendNodeSegment(this.firstChild,this.lastChild,o),o},i.prototype.updateFromFragment=function(e){this.firstChild=e.firstChild,this.lastChild=e.lastChild},i}(n.misc),n.renderedtree=function(e,t){function n(e,t){this.element=e,this.childrenIndex=t||[],this.appendDone=!1}return n.prototype.forEach=function(e,t,n){var r=this.childrenIndex;e.forEach(function(e,n){r[n]=t.call(this,e,r[n])},n)},n.prototype.updateParent=function(){var t=this.childrenIndex[0];t&&(this.element=null,this.element=t instanceof n?t.element.parentNode:t instanceof e?t.firstChild.parentNode:t.parentNode)},n.prototype.appendChildren=function(){var r=this.element,i=this.childrenIndex;if(r)if(this.appendDone)for(var o=null,c=i.length-1;c>=0;c--){var a=i[c];a instanceof n?o=a.element:a instanceof e?(t.insertNodeSegmentBefore(a.firstChild,a.lastChild,r,o),o=a.firstChild||o):o=a}else i.forEach(function(i){i instanceof n?r.appendChild(i.element):i instanceof e?t.appendNodeSegment(i.firstChild,i.lastChild,r):r.appendChild(i)}),this.appendDone=!0},n}(n.rendereddirective,n.misc),n.renderer=function(e,t,n,r){function i(e){this.template=e,this.context=void 0}return i.prototype.setContext=function(t,n){n=n||(this.context?this.context.doc:document),this.context=t instanceof e?t:new e(t,n)},i.prototype._completeError=function(e,t){return this.template._completeError(e,t)},i.prototype._renderTextNode=function(e,t){var n=this.context;if(t||(t="pr"in e?n.importNode(e.pr,!1):n.createTextNode("")),!("pr"in e))try{n.scopedCall(e.updater,t)}catch(r){throw this._completeError(r,e)}return t},i.prototype._renderElement=function(e,t){var n=this.context;t||(t=n.importNode(e.pr,!1));try{n.scopedCall(e.updater,t)}catch(r){throw this._completeError(r,e)}return t},i.prototype._renderDirective=function(e,n){var i=this.context,o=e.pr,c=t.get(e.directive);if("function"!=typeof c)throw new Error("No directive helper for @"+e.directive+" has been registered");n||(n=new r);var a=n.createFragment(i);a.firstChild&&a.firstChild._isISTPlaceHolder&&a.removeChild(a.firstChild);try{c.call(null,i,i.scopedCall(o.evaluator),o.template,a)}catch(s){throw this._completeError(s,e)}if(0===a.childNodes.length){var u=i.createComment("");u._isISTPlaceHolder=!0,a.appendChild(u)}return n.updateFromFragment(a),n},i.prototype._renderRec=function(e,t){return"text"in e&&(t=this._renderTextNode(e,t)),"tagName"in e&&(t?t.element=this._renderElement(e,t.element):t=new n(this._renderElement(e)),this._renderNodes(e.children,t)),"directive"in e&&(t=this._renderDirective(e,t)),t},i.prototype._renderNodes=function(e,t){t.forEach(e,this._renderRec,this),t.appendChildren()},i.prototype.render=function(){var e=this,t=this.context.createDocumentFragment(),r=this.template.nodes,i=new n(t);return this._renderNodes(r,i),t.update=function(t){t&&e.setContext(t),i.updateParent(),e._renderNodes(r,i)},t},i}(n.context,n.directives,n.renderedtree,n.rendereddirective),n.template=function(e,t,n){function r(e,t){var n,i,o,c=t.filter(function(t){return t.partial===e});if(c.length)return c[0];for(i=0,o=t.length;o>i;i++)if("undefined"!=typeof t[i].children&&(n=r(e,t[i].children)))return n}function i(e,t){this.name=e||"<unknown>",this.nodes=t,"undefined"!=typeof document&&this.nodes.forEach(this._preRenderRec,this)}var o=/{{((?:}(?!})|[^}])*)}}/;return i.prototype._preRenderRec=function(t){var n;if(!("pr"in t||"updater"in t)){if("children"in t&&t.children.forEach(this._preRenderRec,this),"text"in t)if(o.test(t.text))try{t.updater=e.textUpdater(t)}catch(r){throw this._completeError(r,t)}else t.pr=document.createTextNode(t.text);if("tagName"in t){t.pr=n=document.createElement(t.tagName),t.classes.forEach(function(e){n.classList.add(e)}),"undefined"!=typeof t.id&&(n.id=t.id);try{t.updater=e.elementUpdater(t)}catch(r){throw this._completeError(r,t)}}if("directive"in t)try{t.pr={template:new i(this.name,t.children),evaluator:e.directiveEvaluator(t)}}catch(r){throw this._completeError(r,t)}}},i.prototype._completeError=function(e,t){var n="in '"+this.name+"' on line "+(t.line||"<unknown>");return"undefined"==typeof e.istStack&&(e.message+=" "+n,e.istStack=[]),e.istStack.push(n),e},i.prototype.findPartial=function(e){return console&&(console.warn||console.log)("Warning: Template#findPartial is deprecated, use Template#partial instead"),this.partial(e)},i.prototype.partial=function(e){var t;if("undefined"!=typeof e)return t=r(e,this.nodes),"undefined"!=typeof t?new i(this.name,[t]):void 0},i.prototype.render=function(e,t){var r=this,i=new n(r);return i.setContext(e,t),i.render()},i.prototype.getCode=function(e){return"new ist.Template("+JSON.stringify(this.name)+", "+JSON.stringify(this.nodes,null,e?1:0)+")"},i}(n.codegen,n.context,n.renderer),n.parsehelpers=function(){var e,t,n,r="U",i="I",o="D",c={};return e=function(){return{text:this.text,line:this.line}},t=function(){var e={tagName:this.tagName,line:this.line,classes:this.classes,attributes:this.attributes,properties:this.properties,events:this.events,children:this.children};return"undefined"!=typeof this.id&&(e.id=this.id),"undefined"!=typeof this.partial&&(e.partial=this.partial),e},n=function(){return{directive:this.directive,expr:this.expr,line:this.line,children:this.children}},c.generateNodeTree=function(e,t){var n,i,c,a,s={children:[]},u=[s],l=0;if(!e)return s.children;for(i=function(){return u[u.length-1]},c=function(e){l++,u.push(e)},a=function(){var e,t,n;if(u.length<2)throw new Error("Could not pop node from stack");if(e=u.pop(),t=i(),"undefined"!=typeof t.text)throw n=new Error("Cannot add children to text node"),n.line=e.line,n;if("else"===e.directive){var r=t.children[t.children.length-1];if(r&&!r.wasElse&&"if"===r.directive)e.directive="unless";else{if(!r||r.wasElse||"unless"!==r.directive)throw n=new Error("@else directive has no matching @if or @unless directive"),n.line=e.line,n;e.directive="if"}e.expr=r.expr,e.wasElse=!0}return t.children.push(e),e},n=t.map(function(e){return e.pop()}),n.unshift(e),n.forEach(function(e){var t=e.indent,n=e.item;if(t[0]instanceof Error)throw t[0];if(l>0)if(t[0]===r)a();else if(t[0]===o)for(a();t.length>0;)t.pop(),a();c(n)});u.length>1;)a();return s.children},c.parseIndent=function(e,t,n){var c,a=t.length,s=[];if(0===a.length&&e.push(a),a==e[0])return[r];if(a>e[0])return e.unshift(a),[i];for(;a<e[0];)e.shift(),s.push(o);return a!=e[0]?(c=new Error("Unexpected indent"),c.line=n,c.column=1,[c]):s},c.createTextNode=function(t,n){return{text:t,line:n,toJSON:e}},c.createElement=function(e,n,r,i){var o={tagName:e,line:i,classes:[],attributes:{},properties:[],events:{},children:[],toJSON:t};return n.forEach(function(e){"undefined"!=typeof e.id?o.id=e.id:"undefined"!=typeof e.className?o.classes.push(e.className):"undefined"!=typeof e.attr?o.attributes[e.attr]=e.value:"undefined"!=typeof e.prop?o.properties.push({path:e.prop,value:e.value}):"undefined"!=typeof e.event&&("undefined"==typeof o.events[e.event]&&(o.events[e.event]=[]),o.events[e.event].push(e.value))}),"undefined"!=typeof r&&(r.partial&&(o.partial=r.partial),r.textnode&&"undefined"!=typeof r.textnode.text&&o.children.push(r.textnode)),o},c.createDirective=function(e,t,r){return{directive:e,expr:t,line:r,children:[],toJSON:n}},c.escapedCharacter=function(e){return e.length>1?String.fromCharCode(parseInt(e,16)):{f:"\f",b:"\b",t:"	",n:"\n",r:"\r"}[e]||e},c}(),n.parser=function(e){var t;return t=function(){function t(e,t){function n(){this.constructor=e}n.prototype=t.prototype,e.prototype=new n}function n(e,t,n,r,i,o){this.message=e,this.expected=t,this.found=n,this.offset=r,this.line=i,this.column=o,this.name="SyntaxError"}function r(t){function r(){return i(hn).line}function i(e){function n(e,n,r){var i,o;for(i=n;r>i;i++)o=t.charAt(i),"\n"===o?(e.seenCR||e.line++,e.column=1,e.seenCR=!1):"\r"===o||"\u2028"===o||"\u2029"===o?(e.line++,e.column=1,e.seenCR=!0):(e.column++,e.seenCR=!1)}return vn!==e&&(vn>e&&(vn=0,mn={line:1,column:1,seenCR:!1}),n(mn,vn,e),vn=e),mn}function o(e){gn>fn||(fn>gn&&(gn=fn,yn=[]),yn.push(e))}function c(e,r,o){function c(e){var t=1;for(e.sort(function(e,t){return e.description<t.description?-1:e.description>t.description?1:0});t<e.length;)e[t-1]===e[t]?e.splice(t,1):t++}function a(e,t){function n(e){function t(e){return e.charCodeAt(0).toString(16).toUpperCase()}return e.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\x08/g,"\\b").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\f/g,"\\f").replace(/\r/g,"\\r").replace(/[\x00-\x07\x0B\x0E\x0F]/g,function(e){return"\\x0"+t(e)}).replace(/[\x10-\x1F\x80-\xFF]/g,function(e){return"\\x"+t(e)}).replace(/[\u0180-\u0FFF]/g,function(e){return"\\u0"+t(e)}).replace(/[\u1080-\uFFFF]/g,function(e){return"\\u"+t(e)})}var r,i,o,c=new Array(e.length);for(o=0;o<e.length;o++)c[o]=e[o].description;return r=e.length>1?c.slice(0,-1).join(", ")+" or "+c[e.length-1]:c[0],i=t?'"'+n(t)+'"':"end of input","Expected "+r+" but "+i+" found."}var s=i(o),u=o<t.length?t.charAt(o):null;return null!==r&&c(r),new n(null!==e?e:a(r,u),r,u,o,s.line,s.column)}function a(){var e,t,n,r,i,o,c;for(e=fn,t=[],n=d();n!==U;)t.push(n),n=d();if(t!==U)if(n=u(),n===U&&(n=L),n!==U){if(r=[],i=fn,o=[],c=d(),c!==U)for(;c!==U;)o.push(c),c=d();else o=J;for(o!==U?(c=u(),c!==U?(o=[o,c],i=o):(fn=i,i=J)):(fn=i,i=J);i!==U;){if(r.push(i),i=fn,o=[],c=d(),c!==U)for(;c!==U;)o.push(c),c=d();else o=J;o!==U?(c=u(),c!==U?(o=[o,c],i=o):(fn=i,i=J)):(fn=i,i=J)}if(r!==U){for(i=[],o=d();o!==U;)i.push(o),o=d();i!==U?(hn=e,t=V(n,r),e=t):(fn=e,e=J)}else fn=e,e=J}else fn=e,e=J;else fn=e,e=J;return e}function s(){var e,n;return xn++,K.test(t.charAt(fn))?(e=t.charAt(fn),fn++):(e=U,0===xn&&o(W)),xn--,e===U&&(n=U,0===xn&&o($)),e}function u(){var e,t,n,r,i;if(e=fn,t=l(),t!==U)if(n=E(),n===U&&(n=F(),n===U&&(n=k())),n!==U){for(r=[],i=s();i!==U;)r.push(i),i=s();r!==U?(hn=e,t=M(t,n),e=t):(fn=e,e=J)}else fn=e,e=J;else fn=e,e=J;return e}function l(){var e,t,n;for(xn++,e=fn,t=[],n=s();n!==U;)t.push(n),n=s();return t!==U&&(hn=e,t=X(t)),e=t,xn--,e===U&&(t=U,0===xn&&o(G)),e}function d(){var e,n;return xn++,10===t.charCodeAt(fn)?(e=Y,fn++):(e=U,0===xn&&o(Z)),xn--,e===U&&(n=U,0===xn&&o(Q)),e}function p(){var e,n;return xn++,tt.test(t.charAt(fn))?(e=t.charAt(fn),fn++):(e=U,0===xn&&o(nt)),xn--,e===U&&(n=U,0===xn&&o(et)),e}function f(){var e,n,r,i;if(xn++,e=fn,it.test(t.charAt(fn))?(n=t.charAt(fn),fn++):(n=U,0===xn&&o(ot)),n!==U){for(r=[],ct.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(at));i!==U;)r.push(i),ct.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(at));r!==U?(hn=e,n=st(n,r),e=n):(fn=e,e=J)}else fn=e,e=J;return xn--,e===U&&(n=U,0===xn&&o(rt)),e}function h(){var e,n,r,i,c,a;if(xn++,e=fn,n=f(),n!==U){for(r=[],i=fn,46===t.charCodeAt(fn)?(c=lt,fn++):(c=U,0===xn&&o(dt)),c!==U?(a=f(),a!==U?(c=[c,a],i=c):(fn=i,i=J)):(fn=i,i=J);i!==U;)r.push(i),i=fn,46===t.charCodeAt(fn)?(c=lt,fn++):(c=U,0===xn&&o(dt)),c!==U?(a=f(),a!==U?(c=[c,a],i=c):(fn=i,i=J)):(fn=i,i=J);r!==U?(hn=e,n=pt(n,r),e=n):(fn=e,e=J)}else fn=e,e=J;return xn--,e===U&&(n=U,0===xn&&o(ut)),e}function v(){var e,n,r;return e=fn,33===t.charCodeAt(fn)?(n=ft,fn++):(n=U,0===xn&&o(ht)),n!==U?(r=f(),r!==U?(hn=e,n=vt(r),e=n):(fn=e,e=J)):(fn=e,e=J),e}function m(){var e,n,r;return e=fn,35===t.charCodeAt(fn)?(n=mt,fn++):(n=U,0===xn&&o(gt)),n!==U?(r=f(),r!==U?(hn=e,n=yt(r),e=n):(fn=e,e=J)):(fn=e,e=J),e}function g(){var e,n,r;return e=fn,46===t.charCodeAt(fn)?(n=lt,fn++):(n=U,0===xn&&o(dt)),n!==U?(r=f(),r!==U?(hn=e,n=xt(r),e=n):(fn=e,e=J)):(fn=e,e=J),e}function y(){var e,n,r;for(e=fn,n=[],r=T(),r===U&&(Ct.test(t.charAt(fn))?(r=t.charAt(fn),fn++):(r=U,0===xn&&o(wt)));r!==U;)n.push(r),r=T(),r===U&&(Ct.test(t.charAt(fn))?(r=t.charAt(fn),fn++):(r=U,0===xn&&o(wt)));return n!==U&&(hn=e,n=At(n)),e=n}function x(){var e,n,r,i,c,a;return e=fn,91===t.charCodeAt(fn)?(n=Et,fn++):(n=U,0===xn&&o(St)),n!==U?(r=f(),r!==U?(61===t.charCodeAt(fn)?(i=Nt,fn++):(i=U,0===xn&&o(_t)),i!==U?(c=y(),c!==U?(93===t.charCodeAt(fn)?(a=Ft,fn++):(a=U,0===xn&&o(bt)),a!==U?(hn=e,n=Rt(r,c),e=n):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J),e}function C(){var e,n,r,i,c,a,s;return e=fn,91===t.charCodeAt(fn)?(n=Et,fn++):(n=U,0===xn&&o(St)),n!==U?(46===t.charCodeAt(fn)?(r=lt,fn++):(r=U,0===xn&&o(dt)),r!==U?(i=h(),i!==U?(61===t.charCodeAt(fn)?(c=Nt,fn++):(c=U,0===xn&&o(_t)),c!==U?(a=y(),a!==U?(93===t.charCodeAt(fn)?(s=Ft,fn++):(s=U,0===xn&&o(bt)),s!==U?(hn=e,n=Tt(i,a),e=n):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J),e}function w(){var e,n,r,i,c,a,s;return e=fn,91===t.charCodeAt(fn)?(n=Et,fn++):(n=U,0===xn&&o(St)),n!==U?(33===t.charCodeAt(fn)?(r=ft,fn++):(r=U,0===xn&&o(ht)),r!==U?(i=f(),i!==U?(61===t.charCodeAt(fn)?(c=Nt,fn++):(c=U,0===xn&&o(_t)),c!==U?(a=y(),a!==U?(93===t.charCodeAt(fn)?(s=Ft,fn++):(s=U,0===xn&&o(bt)),s!==U?(hn=e,n=It(i,a),e=n):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J),e}function A(){var e,t;return xn++,e=m(),e===U&&(e=g(),e===U&&(e=x(),e===U&&(e=C(),e===U&&(e=w())))),xn--,e===U&&(t=U,0===xn&&o(jt)),e}function E(){var e,t;return xn++,e=S(),e===U&&(e=N()),xn--,e===U&&(t=U,0===xn&&o(Ot)),e}function S(){var e,t,n;if(e=fn,t=[],n=A(),n!==U)for(;n!==U;)t.push(n),n=A();else t=J;return t!==U?(n=_(),n!==U?(hn=e,t=kt(t,n),e=t):(fn=e,e=J)):(fn=e,e=J),e}function N(){var e,t,n,r;if(e=fn,t=f(),t!==U){for(n=[],r=A();r!==U;)n.push(r),r=A();n!==U?(r=_(),r!==U?(hn=e,t=Dt(t,n,r),e=t):(fn=e,e=J)):(fn=e,e=J)}else fn=e,e=J;return e}function _(){var e,t,n,r,i;if(e=fn,t=fn,n=[],r=s(),r!==U)for(;r!==U;)n.push(r),r=s();else n=J;if(n!==U?(r=F(),r!==U?(hn=t,n=qt(r),t=n):(fn=t,t=J)):(fn=t,t=J),t===U&&(t=L),t!==U){if(n=fn,r=[],i=s(),i!==U)for(;i!==U;)r.push(i),i=s();else r=J;r!==U?(i=v(),i!==U?(hn=n,r=zt(i),n=r):(fn=n,n=J)):(fn=n,n=J),n===U&&(n=L),n!==U?(hn=e,t=Pt(t,n),e=t):(fn=e,e=J)}else fn=e,e=J;return e}function F(){var e,t;return xn++,e=fn,t=O(),t!==U&&(hn=e,t=Ht(t)),e=t,xn--,e===U&&(t=U,0===xn&&o(Ut)),e}function b(){var e,n,r,i,c,a;return e=fn,117===t.charCodeAt(fn)?(n=Bt,fn++):(n=U,0===xn&&o(Jt)),n!==U?(Lt.test(t.charAt(fn))?(r=t.charAt(fn),fn++):(r=U,0===xn&&o(Vt)),r!==U?(Lt.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(Vt)),i!==U?(Lt.test(t.charAt(fn))?(c=t.charAt(fn),fn++):(c=U,0===xn&&o(Vt)),c!==U?(Lt.test(t.charAt(fn))?(a=t.charAt(fn),fn++):(a=U,0===xn&&o(Vt)),a!==U?(hn=e,n=$t(r,i,c,a),e=n):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J),e}function R(){var e,n,r,i;return e=fn,120===t.charCodeAt(fn)?(n=Kt,fn++):(n=U,0===xn&&o(Wt)),n!==U?(Lt.test(t.charAt(fn))?(r=t.charAt(fn),fn++):(r=U,0===xn&&o(Vt)),r!==U?(Lt.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(Vt)),i!==U?(hn=e,n=Mt(r,i),e=n):(fn=e,e=J)):(fn=e,e=J)):(fn=e,e=J),e}function T(){var e,n,r;return e=fn,92===t.charCodeAt(fn)?(n=Gt,fn++):(n=U,0===xn&&o(Xt)),n!==U?(r=b(),r===U&&(r=R(),r===U&&(r=p())),r!==U?(hn=e,n=Qt(r),e=n):(fn=e,e=J)):(fn=e,e=J),e}function I(){var e,n,r,i;if(e=fn,34===t.charCodeAt(fn)?(n=Yt,fn++):(n=U,0===xn&&o(Zt)),n!==U){for(r=[],i=T(),i===U&&(en.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(tn)));i!==U;)r.push(i),i=T(),i===U&&(en.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(tn)));r!==U?(34===t.charCodeAt(fn)?(i=Yt,fn++):(i=U,0===xn&&o(Zt)),i!==U?(hn=e,n=At(r),e=n):(fn=e,e=J)):(fn=e,e=J)}else fn=e,e=J;return e}function j(){var e,n,r,i;if(e=fn,39===t.charCodeAt(fn)?(n=nn,fn++):(n=U,0===xn&&o(rn)),n!==U){for(r=[],i=T(),i===U&&(on.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(cn)));i!==U;)r.push(i),i=T(),i===U&&(on.test(t.charAt(fn))?(i=t.charAt(fn),fn++):(i=U,0===xn&&o(cn)));r!==U?(39===t.charCodeAt(fn)?(i=nn,fn++):(i=U,0===xn&&o(rn)),i!==U?(hn=e,n=At(r),e=n):(fn=e,e=J)):(fn=e,e=J)}else fn=e,e=J;return e}function O(){var e,t;return xn++,e=I(),e===U&&(e=j()),xn--,e===U&&(t=U,0===xn&&o(an)),e}function k(){var e,t;return xn++,e=q(),e===U&&(e=D()),xn--,e===U&&(t=U,0===xn&&o(sn)),e}function D(){var e,n,r;return e=fn,64===t.charCodeAt(fn)?(n=un,fn++):(n=U,0===xn&&o(ln)),n!==U?(r=f(),r!==U?(hn=e,n=dn(r),e=n):(fn=e,e=J)):(fn=e,e=J),e}function q(){var e,n,r,i,c,a;if(e=fn,64===t.charCodeAt(fn)?(n=un,fn++):(n=U,0===xn&&o(ln)),n!==U)if(r=f(),r!==U){if(i=[],c=s(),c!==U)for(;c!==U;)i.push(c),c=s();else i=J;if(i!==U){if(c=[],a=p(),a!==U)for(;a!==U;)c.push(a),a=p();else c=J;c!==U?(hn=e,n=pn(r,c),e=n):(fn=e,e=J)}else fn=e,e=J}else fn=e,e=J;else fn=e,e=J;return e}var z,P=arguments.length>1?arguments[1]:{},U={},H={templateLines:a},B=a,J=U,L=null,V=function(t,n){return e.generateNodeTree(t,n)},$={type:"other",description:"whitespace"},K=/^[ \t]/,W={type:"class",value:"[ \\t]",description:"[ \\t]"},M=function(e,t){return{indent:e,item:t}},G={type:"other",description:"indent"},X=function(t){return e.parseIndent(Cn,t,r())},Q={type:"other",description:"new line"},Y="\n",Z={type:"literal",value:"\n",description:'"\\n"'},et={type:"other",description:"character"},tt=/^[^\n]/,nt={type:"class",value:"[^\\n]",description:"[^\\n]"},rt={type:"other",description:"identifier"},it=/^[a-z_]/i,ot={type:"class",value:"[a-z_]i",description:"[a-z_]i"},ct=/^[a-z0-9_\-]/i,at={type:"class",value:"[a-z0-9_\\-]i",description:"[a-z0-9_\\-]i"},st=function(e,t){return e+t.join("")},ut={type:"other",description:"dotted path"},lt=".",dt={type:"literal",value:".",description:'"."'},pt=function(e,t){return t.length?[e].concat(t.map(function(e){return e[1]})):[e]},ft="!",ht={type:"literal",value:"!",description:'"!"'},vt=function(e){return e},mt="#",gt={type:"literal",value:"#",description:'"#"'},yt=function(e){return{id:e}},xt=function(e){return{className:e}},Ct=/^[^\\\n\]]/,wt={type:"class",value:"[^\\\\\\n\\]]",description:"[^\\\\\\n\\]]"},At=function(e){return e.join("")},Et="[",St={type:"literal",value:"[",description:'"["'},Nt="=",_t={type:"literal",value:"=",description:'"="'},Ft="]",bt={type:"literal",value:"]",description:'"]"'},Rt=function(e,t){return{attr:e,value:t}},Tt=function(e,t){return{prop:e,value:t}},It=function(e,t){return{event:e,value:t}},jt={type:"other",description:"element qualifier"},Ot={type:"other",description:"element"},kt=function(t,n){return e.createElement("div",t,n,r())},Dt=function(t,n,i){return e.createElement(t,n,i,r())},qt=function(e){return e},zt=function(e){return e},Pt=function(e,t){return{textnode:e,partial:t}},Ut={type:"other",description:"text node"},Ht=function(t){return e.createTextNode(t,r())},Bt="u",Jt={type:"literal",value:"u",description:'"u"'},Lt=/^[0-9a-z]/i,Vt={type:"class",value:"[0-9a-z]i",description:"[0-9a-z]i"},$t=function(e,t,n,r){return""+e+t+n+r},Kt="x",Wt={type:"literal",value:"x",description:'"x"'},Mt=function(e,t){return""+e+t},Gt="\\",Xt={type:"literal",value:"\\",description:'"\\\\"'},Qt=function(t){return e.escapedCharacter(t)},Yt='"',Zt={type:"literal",value:'"',description:'"\\""'},en=/^[^\\\n"]/,tn={type:"class",value:'[^\\\\\\n"]',description:'[^\\\\\\n"]'},nn="'",rn={type:"literal",value:"'",description:'"\'"'},on=/^[^\\\n']/,cn={type:"class",value:"[^\\\\\\n']",description:"[^\\\\\\n']"},an={type:"other",description:"quoted text"},sn={type:"other",description:"directive"},un="@",ln={type:"literal",value:"@",description:'"@"'},dn=function(t){return e.createDirective(t,void 0,r())},pn=function(t,n){return e.createDirective(t,n.join(""),r())},fn=0,hn=0,vn=0,mn={line:1,column:1,seenCR:!1},gn=0,yn=[],xn=0;if("startRule"in P){if(!(P.startRule in H))throw new Error("Can't start parsing from rule \""+P.startRule+'".');B=H[P.startRule]}var Cn=[0];if(z=B(),z!==U&&fn===t.length)return z;throw z!==U&&fn<t.length&&o({type:"end",description:"end of input"}),c(null,yn,gn)}return t(n,Error),{SyntaxError:n,parse:r}}()}(n.parsehelpers),n.preprocessor=function(){var e,t,n=/\r\n|\r|\n/,r=/^[ \t]*$/,i=/\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g;return e=function(e,t){return t.split(n).map(function(){return""}).join("\n")},t=function(e){return e.match(r)?"":e},function(r){return r.replace(i,e).split(n).map(t).reduce(function(e,t){if(e.length){var n=e[e.length-1];"\\"===n[n.length-1]?e[e.length-1]=n.replace(/\s*\\$/,"")+t.replace(/^\s*/,""):e.push(t)}else e.push(t);return e},[]).join("\n")}}(),n.amdplugin=function(e){function t(t){var n,r={};if(o)n=function(e,t){var n=new XMLHttpRequest;n.open("GET",e,!0),n.onreadystatechange=function(){if(4===n.readyState){if(200!==n.status)throw new Error("HTTP status "+n.status+" when loading "+e);t(n.responseText)}},n.send(null)};else if(i){var c=require.nodeRequire("fs");n=function(e,t){var n=c.readFileSync(e,"utf8");0===n.indexOf("﻿")&&(n=n.substring(1)),t(n)}}t.write=function(e,t,n){var i="ist!"+t;if(r.hasOwnProperty(i)){var o=r[i];n(o)}},t.load=function(i,o,c,a){var s,u;s=o.toUrl(i+".ist"),u=-1===i.indexOf("/")?".":i.replace(/\/[^\/]*$/,""),n(s,function(n){var l,d=["ist"];n=n.replace(/^(\s*)@include\s+(?:text=)?(['"])((?:(?=(\\?))\4.)*?)\2/gm,function(t,n,r,i){if(e.findScript(i))return t;var o=u+"/"+i.replace(/\.ist$/,"");return-1===d.indexOf("ist!"+o)&&d.push("ist!"+o),n+'@include "'+o+'"'}),l=t(n,i).getCode(!0),n="define('ist!"+i+"',"+JSON.stringify(d)+", function(ist) {\n  return "+l+";\n});\n",a.isBuild&&(r["ist!"+i]=n),a.isBuild||(n+="\r\n//@ sourceURL="+s),c.fromText("ist!"+i,n),o(["ist!"+i],function(e){c(e)})})}}return t}(n.misc),n.ist=function(e,t,n,c,a,s,u){function l(t,n){var r;n=n||"<unknown>";try{r=c.parse(a(t))}catch(i){throw i.message+=" in '"+n+"' on line "+i.line+("undefined"!=typeof i.column?", character "+i.column:""),i}return new e(n,r)}return l.Template=e,l.fromScriptTag=function(e){return console&&(console.warn||console.log)("Warning: ist.fromScriptTag is deprecated, use ist.script instead"),l.script(e)},l.registerHelper=function(e,t){console&&(console.warn||console.log)("Warning: ist.registerHelper is deprecated, use ist.helper instead"),l.helper(e,t)},l.createNode=function(e,t,n){return console&&(console.warn||console.log)("Warning: ist.createNode is deprecated, use ist.create instead"),l.create(e,t,n)},l.create=function(e,t,n){var r,i=e.split(">").map(function(e){return e.trim()}),o="",c="";return i.forEach(function(e){c+="\n"+o+e,o+=" "}),r=l(c).render(t,n),1===r.childNodes.length?r.firstChild:r},l.script=function(e){var t=u.findScript(e);return t?l(t):void 0},l.helper=function(e,n){t.register(e,n)},l.helper("include",function(e,t,n,i){var o,c,a=t,s=a.replace(/\.ist$/,"");if(o=u.findScript(a),r)for(c=[s,s+".ist","ist!"+s,"text!"+s+".ist"];!o&&c.length;)try{o=requirejs(c.shift())}catch(d){}if(!o)throw new Error("Cannot find included template '"+a+"'");if("string"==typeof o&&(o=l(o,s)),"function"!=typeof o.render)throw new Error("Invalid included template '"+a+"'");i.appendChild(o.render(e))}),l.global=function(e,t){n.globalScope[e]=t},(i||o&&r)&&s(l),l}(n.template,n.directives,n.context,n.parser,n.preprocessor,n.amdplugin,n.misc),r||i?define("ist",[],function(){return n.ist}):(t=e.ist,e.ist=n.ist,e.ist.noConflict=function(){var n=e.ist;return e.ist=t,n})}(this);