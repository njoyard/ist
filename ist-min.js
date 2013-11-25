/**
 * IST: Indented Selector Templating
 * version 0.6
 *
 * Copyright (c) 2012-2013 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://njoyard.github.com/ist
 */

!function(e){var n,t,r="function"==typeof e.define&&e.define.amd,l="undefined"!=typeof process&&process.versions&&!!process.versions.node,i="undefined"!=typeof window&&window.navigator&&window.document;t={require:e.require},t.misc=function(){return{jsEscape:function(e){return e.replace(/(['\\])/g,"\\$1").replace(/[\f]/g,"\\f").replace(/[\b]/g,"\\b").replace(/[\t]/g,"\\t").replace(/[\n]/g,"\\n").replace(/[\r]/g,"\\r")},findScript:function(e){var n,t,r,l,i;try{i=document.querySelectorAll("script#"+e)}catch(u){return}if(i)for(n=0,t=i.length;t>n;n++)if(r=i[n],"text/x-ist"===r.getAttribute("type"))return r.innerHTML;return l},appendNodeSegment:function(e,n,t){for(var r,l=e,i=n?n.nextSibling:null;l&&l!=i;)r=l.nextSibling,t.appendChild(l),l=r},insertNodeSegmentBefore:function(e,n,t,r){for(var l,i=e,u=n?n.nextSibling:null;i&&i!=u;)l=i.nextSibling,t.insertBefore(i,r),i=l}}}(),t.codegen=function(e){var n=/{{\s*((?:}(?!})|[^}])*?)\s*}}/,t={},r=function(){};return{expression:function(e){var n="{{ "+e+" }}";return n in t||(t[n]="function(document,_istScope){if(this!==null&&this!==undefined){with(this){with(_istScope){return "+e+";"+"}"+"}"+"}else{"+"with(_istScope){"+"return "+e+";"+"}"+"}"+"}"),t[n]},interpolation:function(r){return r in t||(t[r]=this.expression(r.split(n).map(function(n,t){return t%2?"("+n+")":"'"+e.jsEscape(n)+"'"}).filter(function(e){return"''"!==e}).join("+"))),t[r]},directiveEvaluator:function(e){return"expr"in e?new Function("document,_istScope","return ("+this.expression(e.expr)+").call(this,document,_istScope);"):r},elementUpdater:function(e){var n=[],t=this,r=e.attributes,l=e.properties,i=e.events;return Object.keys(r).forEach(function(e){n.push('element.setAttribute("'+e+'",'+"("+t.interpolation(r[e])+").call(this,document,_istScope)"+");")}),l.forEach(function(e){for(var r=[],l=0,i=e.path.length;i>l;l++){var u=e.path[l];l===i-1?r.push('current["'+u+'"] = value;'):r.push('if (!("'+u+'" in current)) {'+'current["'+u+'"] = {};'+"}"+'current = current["'+u+'"];')}n.push("(function(value) {var current = element;"+r.join("")+"})(("+t.interpolation(e.value)+").call(this,document,_istScope));")}),Object.keys(i).forEach(function(e){n.push('element.addEventListener("'+e+'",'+"("+t.expression(i[e])+").call(this,document,_istScope),"+"false"+");")}),new Function("document,_istScope,element",n.join(""))},textUpdater:function(e){return new Function("document,_istScope,textNode","textNode.textContent=("+this.interpolation(e.text)+").call(this,document,_istScope);")}}}(t.misc),t.context=function(){function e(e,n){this.value=e,this.values=[e],this.doc=n||document,this.rootScope=this.scope={}}return e.prototype={importNode:function(e,n){return e.ownerDocument===this.doc?e.cloneNode(n):this.doc.importNode(e,n)},createDocumentFragment:function(){return this.doc.createDocumentFragment()},createElement:function(e,n){return"undefined"!=typeof n?this.doc.createElementNS(n,e):this.doc.createElement(e)},createTextNode:function(e){return this.doc.createTextNode(e)},createComment:function(e){return this.doc.createComment(e)},pushScope:function(e){var n=Object.create(this.scope);Object.keys(e).forEach(function(t){n[t]=e[t]}),this.scope=n},popScope:function(){var e=this.scope;if(e===this.rootScope)throw new Error("No scope left to pop out");this.scope=Object.getPrototypeOf(e)},pushValue:function(e){this.values.unshift(e),this.value=e,void 0!==e&&null!==e&&"string"!=typeof e&&"number"!=typeof e?this.pushScope(e):this.pushScope({})},popValue:function(){this.popScope(),this.values.shift(),this.value=this.values[0]},createContext:function(n){return new e(n,this.doc)},scopedCall:function(e,n){return e.call(this.value,this.doc,this.scope,n)}},e}(),t.directives=function(){function e(e,n,t,r){var l=r.extractRenderedFragment();n&&(l?l.update(e):l=t.render(e),r.appendRenderedFragment(l))}function n(e,n,t,r,l,i){var u=e.value,o=i.extractRenderedFragments(),s=o.keys,c=o.fragments;n.forEach(function(o,f){e.pushValue(o);var a={first:0===f,index:f,last:f==n.length-1,length:n.length,outer:u};r&&Object.keys(r).forEach(function(e){a[e]=r[e]}),e.pushScope({loop:a});var d,p=s.indexOf(t[f]);-1===p?d=l.render(e):(d=c[p],d.update(e)),e.popScope(),e.popValue(),i.appendRenderedFragment(d,t[f])})}var t,r,l={};return r={"if":function(n,t,r,l){e.call(null,n,t,r,l)},unless:function(n,t,r,l){e.call(null,n,!t,r,l)},"with":function(e,n,t,r){var l=r.extractRenderedFragment();e.pushValue(n),l?l.update(e):l=t.render(e),e.popValue(),r.appendChild(t.render(n))},each:function(e,t,r,l){if(!Array.isArray(t))throw new Error(t+" is not an array");n(e,t,t,null,r,l)},eachkey:function(){function e(e){return{key:e,value:this[e]}}return function(t,r,l,i){var u,o=Object.keys(r);u=o.map(e,r),n(t,u,o,{object:r},l,i)}}(),dom:function(e,n,t,r){for(n.ownerDocument!==e.doc&&(n=e.doc.importNode(n));r.hasChildNodes();)r.removeChild(r.firstChild);r.appendChild(n)},define:function(e,n,t){l[n]=t},use:function(e,n,t,r){var i=l[n];if(!i)throw new Error("Template '"+n+"' has not been @defined");var u=r.extractRenderedFragment();u?u.update(e):u=i.render(e),r.appendRenderedFragment(u)}},t={register:function(e,n){r[e]=n},get:function(e){return r[e]}}}(),t.rendereddirective=function(e){function n(e,n){this._istKeyIndex.push(n),this._istFragIndex.push({firstChild:e.firstChild,lastChild:e.lastChild,update:e.update}),this.appendChild(e)}function t(){var n=this._istContext,t=this._istKeyIndex,r=this._istFragIndex,l={keys:t.slice(),fragments:r.map(function(t){var r=n.createDocumentFragment();return e.appendNodeSegment(t.firstChild,t.lastChild,r),r.update=t.update,r})};return t.splice(0,t.length),r.splice(0,r.length),l}function r(n){var t,r,l=this._istContext,i=this._istKeyIndex,u=this._istFragIndex,o=i.indexOf(n);return-1!==o?(t=u[o],r=l.createDocumentFragment(),e.appendNodeSegment(t.firstChild,t.lastChild,r),r.update=t.update,i.splice(o,1),u.splice(o,1),r):void 0}function l(){this.firstChild=null,this.lastChild=null,this.keyIndex=[],this.fragIndex=[]}return l.prototype.createFragment=function(l){var i=l.createDocumentFragment();return i._istContext=l,i._istKeyIndex=this.keyIndex,i._istFragIndex=this.fragIndex,i.appendRenderedFragment=n,i.extractRenderedFragment=r,i.extractRenderedFragments=t,e.appendNodeSegment(this.firstChild,this.lastChild,i),i},l.prototype.updateFromFragment=function(e){this.firstChild=e.firstChild,this.lastChild=e.lastChild},l}(t.misc),t.renderedtree=function(e,n){function t(e,n){this.element=e,this.childrenIndex=n||[],this.appendDone=!1}return t.prototype.forEach=function(e,n,t){var r=this.childrenIndex;e.forEach(function(e,t){r[t]=n.call(this,e,r[t])},t)},t.prototype.updateParent=function(){var n=this.childrenIndex[0];n&&(this.element=null,this.element=n instanceof t?n.element.parentNode:n instanceof e?n.firstChild.parentNode:n.parentNode)},t.prototype.appendChildren=function(){var r=this.element,l=this.childrenIndex;if(r)if(this.appendDone)for(var i=null,u=l.length-1;u>=0;u--){var o=l[u];o instanceof t?i=o.element:o instanceof e?(n.insertNodeSegmentBefore(o.firstChild,o.lastChild,r,i),i=o.firstChild||i):i=o}else l.forEach(function(l){l instanceof t?r.appendChild(l.element):l instanceof e?n.appendNodeSegment(l.firstChild,l.lastChild,r):r.appendChild(l)}),this.appendDone=!0},t}(t.rendereddirective,t.misc),t.renderer=function(e,n,t,r){function l(e){this.template=e,this.context=void 0}return l.prototype.setContext=function(n,t){t=t||(this.context?this.context.doc:document),this.context=n instanceof e?n:new e(n,t)},l.prototype._completeError=function(e,n){return this.template._completeError(e,n)},l.prototype._renderTextNode=function(e,n){var t=this.context;if(n||(n="pr"in e?t.importNode(e.pr,!1):t.createTextNode("")),!("pr"in e))try{t.scopedCall(e.updater,n)}catch(r){throw this._completeError(r,e)}return n},l.prototype._renderElement=function(e,n){var t=this.context;n||(n=t.importNode(e.pr,!1));try{t.scopedCall(e.updater,n)}catch(r){throw this._completeError(r,e)}return n},l.prototype._renderDirective=function(e,t){var l=this.context,i=e.pr,u=n.get(e.directive);if("function"!=typeof u)throw new Error("No directive helper for @"+e.directive+" has been registered");t||(t=new r);var o=t.createFragment(l);o.firstChild&&o.firstChild._isISTPlaceHolder&&o.removeChild(o.firstChild);try{u.call(null,l,l.scopedCall(i.evaluator),i.template,o)}catch(s){throw this._completeError(s,e)}if(0===o.childNodes.length){var c=l.createComment("");c._isISTPlaceHolder=!0,o.appendChild(c)}return t.updateFromFragment(o),t},l.prototype._renderRec=function(e,n){return"text"in e&&(n=this._renderTextNode(e,n)),"tagName"in e&&(n?n.element=this._renderElement(e,n.element):n=new t(this._renderElement(e)),this._renderNodes(e.children,n)),"directive"in e&&(n=this._renderDirective(e,n)),n},l.prototype._renderNodes=function(e,n){n.forEach(e,this._renderRec,this),n.appendChildren()},l.prototype.render=function(){var e=this,n=this.context.createDocumentFragment(),r=this.template.nodes,l=new t(n);return this._renderNodes(r,l),n.update=function(n){n&&e.setContext(n),l.updateParent(),e._renderNodes(r,l)},n},l}(t.context,t.directives,t.renderedtree,t.rendereddirective),t.template=function(e,n,t){function r(e,n){var t,l,i,u=n.filter(function(n){return n.partial===e});if(u.length)return u[0];for(l=0,i=n.length;i>l;l++)if("undefined"!=typeof n[l].children&&(t=r(e,n[l].children)))return t}function l(e,n){this.name=e||"<unknown>",this.nodes=n,this.nodes.forEach(this._preRenderRec,this)}var i=/{{((?:}(?!})|[^}])*)}}/;return l.prototype._preRenderRec=function(n){var t;if(!("pr"in n||"updater"in n)){if("children"in n&&n.children.forEach(this._preRenderRec,this),"text"in n)if(i.test(n.text))try{n.updater=e.textUpdater(n)}catch(r){throw this._completeError(r,n)}else n.pr=document.createTextNode(n.text);if("tagName"in n){n.pr=t=document.createElement(n.tagName),n.classes.forEach(function(e){t.classList.add(e)}),"undefined"!=typeof n.id&&(t.id=n.id);try{n.updater=e.elementUpdater(n)}catch(r){throw this._completeError(r,n)}}if("directive"in n)try{n.pr={template:new l(this.name,n.children),evaluator:e.directiveEvaluator(n)}}catch(r){throw this._completeError(r,n)}}},l.prototype._completeError=function(e,n){var t="in '"+this.name+"' on line "+(n.line||"<unknown>");return"undefined"==typeof e.istStack&&(e.message+=" "+t,e.istStack=[]),e.istStack.push(t),e},l.prototype.findPartial=function(e){return console&&(console.warn||console.log)("Warning: Template#findPartial is deprecated, use Template#partial instead"),this.partial(e)},l.prototype.partial=function(e){var n;if("undefined"!=typeof e)return n=r(e,this.nodes),"undefined"!=typeof n?new l(this.name,[n]):void 0},l.prototype.render=function(e,n){var r=this,l=new t(r);return l.setContext(e,n),l.render()},l.prototype.getCode=function(e){return"new ist.Template("+JSON.stringify(this.name)+", "+JSON.stringify(this.nodes,null,e?1:0)+");"},l}(t.codegen,t.context,t.renderer),t.parsehelpers=function(){var e,n,t,r="U",l="I",i="D",u={};return e=function(){return{text:this.text,line:this.line}},n=function(){var e={tagName:this.tagName,line:this.line,classes:this.classes,attributes:this.attributes,properties:this.properties,events:this.events,children:this.children};return"undefined"!=typeof this.id&&(e.id=this.id),"undefined"!=typeof this.partial&&(e.partial=this.partial),e},t=function(){return{directive:this.directive,expr:this.expr,line:this.line,children:this.children}},u.generateNodeTree=function(e,n){var t,l,u,o,s={children:[]},c=[s],f=0;if(!e)return s.children;for(l=function(){return c[c.length-1]},u=function(e){f++,c.push(e)},o=function(){var e,n,t;if(c.length<2)throw new Error("Could not pop node from stack");if(e=c.pop(),n=l(),"undefined"!=typeof n.text)throw t=new Error("Cannot add children to text node"),t.line=e.line,t;if("else"===e.directive){var r=n.children[n.children.length-1];if(r&&!r.wasElse&&"if"===r.directive)e.directive="unless";else{if(!r||r.wasElse||"unless"!==r.directive)throw t=new Error("@else directive has no matching @if or @unless directive"),t.line=e.line,t;e.directive="if"}e.expr=r.expr,e.wasElse=!0}return n.children.push(e),e},t=n.map(function(e){return e.pop()}),t.unshift(e),t.forEach(function(e){var n=e.indent,t=e.item;if(n[0]instanceof Error)throw n[0];if(f>0)if(n[0]===r)o();else if(n[0]===i)for(o();n.length>0;)n.pop(),o();u(t)});c.length>1;)o();return s.children},u.parseIndent=function(e,n,t){var u,o=n.length,s=[];if(0===o.length&&e.push(o),o==e[0])return[r];if(o>e[0])return e.unshift(o),[l];for(;o<e[0];)e.shift(),s.push(i);return o!=e[0]?(u=new Error("Unexpected indent"),u.line=t,u.column=1,[u]):s},u.createTextNode=function(n,t){return{text:n,line:t,toJSON:e}},u.createElement=function(e,t,r,l){var i={tagName:e,line:l,classes:[],attributes:{},properties:[],events:{},children:[],toJSON:n};return t.forEach(function(e){"undefined"!=typeof e.id?i.id=e.id:"undefined"!=typeof e.className?i.classes.push(e.className):"undefined"!=typeof e.attr?i.attributes[e.attr]=e.value:"undefined"!=typeof e.prop?i.properties.push({path:e.prop,value:e.value}):"undefined"!=typeof e.event&&("undefined"==typeof i.events[e.event]&&(i.events[e.event]=[]),i.events[e.event].push(e.value))}),"undefined"!=typeof r&&(r.partial.length>0&&(i.partial=r.partial),"undefined"!=typeof r.textnode&&"undefined"!=typeof r.textnode.text&&i.children.push(r.textnode)),i},u.createDirective=function(e,n,r){return{directive:e,expr:n,line:r,children:[],toJSON:t}},u.escapedCharacter=function(e){return e.length>1?String.fromCharCode(parseInt(e,16)):{f:"\f",b:"\b",t:"	",n:"\n",r:"\r"}[e]||e},u}(),t.parser=function(e){var n;return n=function(){function n(e){return'"'+e.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\x08/g,"\\b").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\f/g,"\\f").replace(/\r/g,"\\r").replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g,escape)+'"'}var t={parse:function(t,r){function l(e){var n={};for(var t in e)n[t]=e[t];return n}function i(e,n){for(var r=e.offset+n,l=e.offset;r>l;l++){var i=t.charAt(l);"\n"===i?(e.seenCR||e.line++,e.column=1,e.seenCR=!1):"\r"===i||"\u2028"===i||"\u2029"===i?(e.line++,e.column=1,e.seenCR=!0):(e.column++,e.seenCR=!1)}e.offset+=n}function u(e){P.offset<M.offset||(P.offset>M.offset&&(M=l(P),U=[]),U.push(e))}function o(){var n,t,r,i,u,o,s,f;for(o=l(P),s=l(P),n=[],t=a();null!==t;)n.push(t),t=a();if(null!==n)if(t=c(),t=null!==t?t:"",null!==t){if(r=[],f=l(P),u=a(),null!==u)for(i=[];null!==u;)i.push(u),u=a();else i=null;for(null!==i?(u=c(),null!==u?i=[i,u]:(i=null,P=l(f))):(i=null,P=l(f));null!==i;){if(r.push(i),f=l(P),u=a(),null!==u)for(i=[];null!==u;)i.push(u),u=a();else i=null;null!==i?(u=c(),null!==u?i=[i,u]:(i=null,P=l(f))):(i=null,P=l(f))}if(null!==r){for(i=[],u=a();null!==u;)i.push(u),u=a();null!==i?n=[n,t,r,i]:(n=null,P=l(s))}else n=null,P=l(s)}else n=null,P=l(s);else n=null,P=l(s);return null!==n&&(n=function(n,t,r,l,i){return e.generateNodeTree(l,i)}(o.offset,o.line,o.column,n[1],n[2])),null===n&&(P=l(o)),n}function s(){var e;return L++,/^[ \t]/.test(t.charAt(P.offset))?(e=t.charAt(P.offset),i(P,1)):(e=null,0===L&&u("[ \\t]")),L--,0===L&&null===e&&u("whitespace"),e}function c(){var e,n,t,r,i,u;if(i=l(P),u=l(P),e=f(),null!==e)if(n=E(),null===n&&(n=b(),null===n&&(n=k())),null!==n){for(t=[],r=s();null!==r;)t.push(r),r=s();null!==t?e=[e,n,t]:(e=null,P=l(u))}else e=null,P=l(u);else e=null,P=l(u);return null!==e&&(e=function(e,n,t,r,l){return{indent:r,item:l}}(i.offset,i.line,i.column,e[0],e[1])),null===e&&(P=l(i)),e}function f(){var n,t,r;for(L++,r=l(P),n=[],t=s();null!==t;)n.push(t),t=s();return null!==n&&(n=function(n,t,r,l){return e.parseIndent(B,l,t)}(r.offset,r.line,r.column,n)),null===n&&(P=l(r)),L--,0===L&&null===n&&u("indent"),n}function a(){var e;return L++,10===t.charCodeAt(P.offset)?(e="\n",i(P,1)):(e=null,0===L&&u('"\\n"')),L--,0===L&&null===e&&u("new line"),e}function d(){var e;return L++,/^[^\n]/.test(t.charAt(P.offset))?(e=t.charAt(P.offset),i(P,1)):(e=null,0===L&&u("[^\\n]")),L--,0===L&&null===e&&u("character"),e}function p(){var e,n,r,o,s;if(L++,o=l(P),s=l(P),/^[a-z_]/i.test(t.charAt(P.offset))?(e=t.charAt(P.offset),i(P,1)):(e=null,0===L&&u("[a-z_]i")),null!==e){for(n=[],/^[a-z0-9_\-]/i.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u("[a-z0-9_\\-]i"));null!==r;)n.push(r),/^[a-z0-9_\-]/i.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u("[a-z0-9_\\-]i"));null!==n?e=[e,n]:(e=null,P=l(s))}else e=null,P=l(s);return null!==e&&(e=function(e,n,t,r,l){return r+l.join("")}(o.offset,o.line,o.column,e[0],e[1])),null===e&&(P=l(o)),L--,0===L&&null===e&&u("identifier"),e}function h(){var e,n,r,o,s,c,f;if(L++,s=l(P),c=l(P),e=p(),null!==e){for(n=[],f=l(P),46===t.charCodeAt(P.offset)?(r=".",i(P,1)):(r=null,0===L&&u('"."')),null!==r?(o=p(),null!==o?r=[r,o]:(r=null,P=l(f))):(r=null,P=l(f));null!==r;)n.push(r),f=l(P),46===t.charCodeAt(P.offset)?(r=".",i(P,1)):(r=null,0===L&&u('"."')),null!==r?(o=p(),null!==o?r=[r,o]:(r=null,P=l(f))):(r=null,P=l(f));null!==n?e=[e,n]:(e=null,P=l(c))}else e=null,P=l(c);return null!==e&&(e=function(e,n,t,r,l){return l.length?[r].concat(l.map(function(e){return e[1]})):[r]}(s.offset,s.line,s.column,e[0],e[1])),null===e&&(P=l(s)),L--,0===L&&null===e&&u("dotted path"),e}function m(){var e,n,r,o;return r=l(P),o=l(P),33===t.charCodeAt(P.offset)?(e="!",i(P,1)):(e=null,0===L&&u('"!"')),null!==e?(n=p(),null!==n?e=[e,n]:(e=null,P=l(o))):(e=null,P=l(o)),null!==e&&(e=function(e,n,t,r){return r}(r.offset,r.line,r.column,e[1])),null===e&&(P=l(r)),e}function v(){var e,n,r,o;return r=l(P),o=l(P),35===t.charCodeAt(P.offset)?(e="#",i(P,1)):(e=null,0===L&&u('"#"')),null!==e?(n=p(),null!==n?e=[e,n]:(e=null,P=l(o))):(e=null,P=l(o)),null!==e&&(e=function(e,n,t,r){return{id:r}}(r.offset,r.line,r.column,e[1])),null===e&&(P=l(r)),e}function g(){var e,n,r,o;return r=l(P),o=l(P),46===t.charCodeAt(P.offset)?(e=".",i(P,1)):(e=null,0===L&&u('"."')),null!==e?(n=p(),null!==n?e=[e,n]:(e=null,P=l(o))):(e=null,P=l(o)),null!==e&&(e=function(e,n,t,r){return{className:r}}(r.offset,r.line,r.column,e[1])),null===e&&(P=l(r)),e}function x(){var e,n,r;for(r=l(P),e=[],n=R(),null===n&&(/^[^\\\n\]]/.test(t.charAt(P.offset))?(n=t.charAt(P.offset),i(P,1)):(n=null,0===L&&u("[^\\\\\\n\\]]")));null!==n;)e.push(n),n=R(),null===n&&(/^[^\\\n\]]/.test(t.charAt(P.offset))?(n=t.charAt(P.offset),i(P,1)):(n=null,0===L&&u("[^\\\\\\n\\]]")));return null!==e&&(e=function(e,n,t,r){return r.join("")}(r.offset,r.line,r.column,e)),null===e&&(P=l(r)),e}function C(){var e,n,r,o,s,c,f;return c=l(P),f=l(P),91===t.charCodeAt(P.offset)?(e="[",i(P,1)):(e=null,0===L&&u('"["')),null!==e?(n=p(),null!==n?(61===t.charCodeAt(P.offset)?(r="=",i(P,1)):(r=null,0===L&&u('"="')),null!==r?(o=x(),null!==o?(93===t.charCodeAt(P.offset)?(s="]",i(P,1)):(s=null,0===L&&u('"]"')),null!==s?e=[e,n,r,o,s]:(e=null,P=l(f))):(e=null,P=l(f))):(e=null,P=l(f))):(e=null,P=l(f))):(e=null,P=l(f)),null!==e&&(e=function(e,n,t,r,l){return{attr:r,value:l}}(c.offset,c.line,c.column,e[1],e[3])),null===e&&(P=l(c)),e}function y(){var e,n,r,o,s,c,f,a;return f=l(P),a=l(P),91===t.charCodeAt(P.offset)?(e="[",i(P,1)):(e=null,0===L&&u('"["')),null!==e?(46===t.charCodeAt(P.offset)?(n=".",i(P,1)):(n=null,0===L&&u('"."')),null!==n?(r=h(),null!==r?(61===t.charCodeAt(P.offset)?(o="=",i(P,1)):(o=null,0===L&&u('"="')),null!==o?(s=x(),null!==s?(93===t.charCodeAt(P.offset)?(c="]",i(P,1)):(c=null,0===L&&u('"]"')),null!==c?e=[e,n,r,o,s,c]:(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a)),null!==e&&(e=function(e,n,t,r,l){return{prop:r,value:l}}(f.offset,f.line,f.column,e[2],e[4])),null===e&&(P=l(f)),e}function w(){var e,n,r,o,s,c,f,a;return f=l(P),a=l(P),91===t.charCodeAt(P.offset)?(e="[",i(P,1)):(e=null,0===L&&u('"["')),null!==e?(33===t.charCodeAt(P.offset)?(n="!",i(P,1)):(n=null,0===L&&u('"!"')),null!==n?(r=p(),null!==r?(61===t.charCodeAt(P.offset)?(o="=",i(P,1)):(o=null,0===L&&u('"="')),null!==o?(s=x(),null!==s?(93===t.charCodeAt(P.offset)?(c="]",i(P,1)):(c=null,0===L&&u('"]"')),null!==c?e=[e,n,r,o,s,c]:(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a))):(e=null,P=l(a)),null!==e&&(e=function(e,n,t,r,l){return{event:r,value:l}}(f.offset,f.line,f.column,e[2],e[4])),null===e&&(P=l(f)),e}function A(){var e;return L++,e=v(),null===e&&(e=g(),null===e&&(e=C(),null===e&&(e=y(),null===e&&(e=w())))),L--,0===L&&null===e&&u("element qualifier"),e}function E(){var e;return L++,e=S(),null===e&&(e=N()),L--,0===L&&null===e&&u("element"),e}function S(){var n,t,r,i;if(r=l(P),i=l(P),t=A(),null!==t)for(n=[];null!==t;)n.push(t),t=A();else n=null;return null!==n?(t=_(),null!==t?n=[n,t]:(n=null,P=l(i))):(n=null,P=l(i)),null!==n&&(n=function(n,t,r,l,i){return e.createElement("div",l,i,t)}(r.offset,r.line,r.column,n[0],n[1])),null===n&&(P=l(r)),n}function N(){var n,t,r,i,u;if(i=l(P),u=l(P),n=p(),null!==n){for(t=[],r=A();null!==r;)t.push(r),r=A();null!==t?(r=_(),null!==r?n=[n,t,r]:(n=null,P=l(u))):(n=null,P=l(u))}else n=null,P=l(u);return null!==n&&(n=function(n,t,r,l,i,u){return e.createElement(l,i,u,t)}(i.offset,i.line,i.column,n[0],n[1],n[2])),null===n&&(P=l(i)),n}function _(){var e,n,t,r,i,u,o;if(r=l(P),i=l(P),u=l(P),o=l(P),n=s(),null!==n)for(e=[];null!==n;)e.push(n),n=s();else e=null;if(null!==e?(n=b(),null!==n?e=[e,n]:(e=null,P=l(o))):(e=null,P=l(o)),null!==e&&(e=function(e,n,t,r){return r}(u.offset,u.line,u.column,e[1])),null===e&&(P=l(u)),e=null!==e?e:"",null!==e){if(u=l(P),o=l(P),t=s(),null!==t)for(n=[];null!==t;)n.push(t),t=s();else n=null;null!==n?(t=m(),null!==t?n=[n,t]:(n=null,P=l(o))):(n=null,P=l(o)),null!==n&&(n=function(e,n,t,r){return r}(u.offset,u.line,u.column,n[1])),null===n&&(P=l(u)),n=null!==n?n:"",null!==n?e=[e,n]:(e=null,P=l(i))}else e=null,P=l(i);return null!==e&&(e=function(e,n,t,r,l){return{textnode:r,partial:l}}(r.offset,r.line,r.column,e[0],e[1])),null===e&&(P=l(r)),e}function b(){var n,t;return L++,t=l(P),n=O(),null!==n&&(n=function(n,t,r,l){return e.createTextNode(l,t)}(t.offset,t.line,t.column,n)),null===n&&(P=l(t)),L--,0===L&&null===n&&u("text node"),n}function F(){var e,n,r,o,s,c,f;return c=l(P),f=l(P),117===t.charCodeAt(P.offset)?(e="u",i(P,1)):(e=null,0===L&&u('"u"')),null!==e?(/^[0-9a-z]/i.test(t.charAt(P.offset))?(n=t.charAt(P.offset),i(P,1)):(n=null,0===L&&u("[0-9a-z]i")),null!==n?(/^[0-9a-z]/i.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u("[0-9a-z]i")),null!==r?(/^[0-9a-z]/i.test(t.charAt(P.offset))?(o=t.charAt(P.offset),i(P,1)):(o=null,0===L&&u("[0-9a-z]i")),null!==o?(/^[0-9a-z]/i.test(t.charAt(P.offset))?(s=t.charAt(P.offset),i(P,1)):(s=null,0===L&&u("[0-9a-z]i")),null!==s?e=[e,n,r,o,s]:(e=null,P=l(f))):(e=null,P=l(f))):(e=null,P=l(f))):(e=null,P=l(f))):(e=null,P=l(f)),null!==e&&(e=function(e,n,t,r,l,i,u){return""+r+l+i+u}(c.offset,c.line,c.column,e[1],e[2],e[3],e[4])),null===e&&(P=l(c)),e}function T(){var e,n,r,o,s;return o=l(P),s=l(P),120===t.charCodeAt(P.offset)?(e="x",i(P,1)):(e=null,0===L&&u('"x"')),null!==e?(/^[0-9a-z]/i.test(t.charAt(P.offset))?(n=t.charAt(P.offset),i(P,1)):(n=null,0===L&&u("[0-9a-z]i")),null!==n?(/^[0-9a-z]/i.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u("[0-9a-z]i")),null!==r?e=[e,n,r]:(e=null,P=l(s))):(e=null,P=l(s))):(e=null,P=l(s)),null!==e&&(e=function(e,n,t,r,l){return""+r+l}(o.offset,o.line,o.column,e[1],e[2])),null===e&&(P=l(o)),e}function R(){var n,r,o,s;return o=l(P),s=l(P),92===t.charCodeAt(P.offset)?(n="\\",i(P,1)):(n=null,0===L&&u('"\\\\"')),null!==n?(r=F(),null===r&&(r=T(),null===r&&(r=d())),null!==r?n=[n,r]:(n=null,P=l(s))):(n=null,P=l(s)),null!==n&&(n=function(n,t,r,l){return e.escapedCharacter(l)}(o.offset,o.line,o.column,n[1])),null===n&&(P=l(o)),n}function I(){var e,n,r,o,s;if(o=l(P),s=l(P),34===t.charCodeAt(P.offset)?(e='"',i(P,1)):(e=null,0===L&&u('"\\""')),null!==e){for(n=[],r=R(),null===r&&(/^[^\\\n"]/.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u('[^\\\\\\n"]')));null!==r;)n.push(r),r=R(),null===r&&(/^[^\\\n"]/.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u('[^\\\\\\n"]')));null!==n?(34===t.charCodeAt(P.offset)?(r='"',i(P,1)):(r=null,0===L&&u('"\\""')),null!==r?e=[e,n,r]:(e=null,P=l(s))):(e=null,P=l(s))}else e=null,P=l(s);return null!==e&&(e=function(e,n,t,r){return r.join("")}(o.offset,o.line,o.column,e[1])),null===e&&(P=l(o)),e}function j(){var e,n,r,o,s;if(o=l(P),s=l(P),39===t.charCodeAt(P.offset)?(e="'",i(P,1)):(e=null,0===L&&u('"\'"')),null!==e){for(n=[],r=R(),null===r&&(/^[^\\\n']/.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u("[^\\\\\\n']")));null!==r;)n.push(r),r=R(),null===r&&(/^[^\\\n']/.test(t.charAt(P.offset))?(r=t.charAt(P.offset),i(P,1)):(r=null,0===L&&u("[^\\\\\\n']")));null!==n?(39===t.charCodeAt(P.offset)?(r="'",i(P,1)):(r=null,0===L&&u('"\'"')),null!==r?e=[e,n,r]:(e=null,P=l(s))):(e=null,P=l(s))}else e=null,P=l(s);return null!==e&&(e=function(e,n,t,r){return r.join("")}(o.offset,o.line,o.column,e[1])),null===e&&(P=l(o)),e}function O(){var e;return L++,e=I(),null===e&&(e=j()),L--,0===L&&null===e&&u("quoted text"),e}function k(){var e;return L++,e=z(),null===e&&(e=D()),L--,0===L&&null===e&&u("directive"),e}function D(){var n,r,o,s;return o=l(P),s=l(P),64===t.charCodeAt(P.offset)?(n="@",i(P,1)):(n=null,0===L&&u('"@"')),null!==n?(r=p(),null!==r?n=[n,r]:(n=null,P=l(s))):(n=null,P=l(s)),null!==n&&(n=function(n,t,r,l){return e.createDirective(l,void 0,t)}(o.offset,o.line,o.column,n[1])),null===n&&(P=l(o)),n}function z(){var n,r,o,c,f,a,h;if(a=l(P),h=l(P),64===t.charCodeAt(P.offset)?(n="@",i(P,1)):(n=null,0===L&&u('"@"')),null!==n)if(r=p(),null!==r){if(c=s(),null!==c)for(o=[];null!==c;)o.push(c),c=s();else o=null;if(null!==o){if(f=d(),null!==f)for(c=[];null!==f;)c.push(f),f=d();else c=null;null!==c?n=[n,r,o,c]:(n=null,P=l(h))}else n=null,P=l(h)}else n=null,P=l(h);else n=null,P=l(h);return null!==n&&(n=function(n,t,r,l,i){return e.createDirective(l,i.join(""),t)}(a.offset,a.line,a.column,n[1],n[3])),null===n&&(P=l(a)),n}function q(e){e.sort();for(var n=null,t=[],r=0;r<e.length;r++)e[r]!==n&&(t.push(e[r]),n=e[r]);return t}var H={templateLines:o,__:s,line:c,indent:f,newline:a,character:d,identifier:p,dottedpath:h,partial:m,elemId:v,elemClass:g,squareBracketsValue:x,elemAttribute:C,elemProperty:y,elemEventHandler:w,elemQualifier:A,element:E,implicitElement:S,explicitElement:N,elementAdditions:_,textNode:b,escapedUnicode:F,escapedASCII:T,escapedCharacter:R,doubleQuotedText:I,singleQuotedText:j,quotedText:O,directive:k,simpleDirective:D,exprDirective:z};if(void 0!==r){if(void 0===H[r])throw new Error("Invalid rule name: "+n(r)+".")}else r="templateLines";var P={offset:0,line:1,column:1,seenCR:!1},L=0,M={offset:0,line:1,column:1,seenCR:!1},U=[],B=[0],J=H[r]();if(null===J||P.offset!==t.length){var X=Math.max(P.offset,M.offset),V=X<t.length?t.charAt(X):null,$=P.offset>M.offset?P:M;throw new this.SyntaxError(q(U),V,X,$.line,$.column)}return J},toSource:function(){return this._source}};return t.SyntaxError=function(e,t,r,l,i){function u(e,t){var r,l;switch(e.length){case 0:r="end of input";break;case 1:r=e[0];break;default:r=e.slice(0,e.length-1).join(", ")+" or "+e[e.length-1]}return l=t?n(t):"end of input","Expected "+r+" but "+l+" found."}this.name="SyntaxError",this.expected=e,this.found=t,this.message=u(e,t),this.offset=r,this.line=l,this.column=i},t.SyntaxError.prototype=Error.prototype,t}()}(t.parsehelpers),t.preprocessor=function(){var e,n,t=/\r\n|\r|\n/,r=/^[ \t]*$/,l=/\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g;return e=function(e,n){return n.split(t).map(function(){return""}).join("\n")},n=function(e){return e.match(r)?"":e},function(r){return r=r.replace(l,e),r=r.split(t).map(n).join("\n")}}(),t.amdplugin=function(e,n){function t(t){var r,u,o=["Msxml2.XMLHTTP","Microsoft.XMLHTTP","Msxml2.XMLHTTP.4.0"],s={};if(i)r=function(){var e,n,t;if("undefined"!=typeof XMLHttpRequest)return new XMLHttpRequest;for(n=0;3>n;n++){t=o[n];try{e=new ActiveXObject(t)}catch(r){}if(e){o=[t];break}}if(!e)throw new Error("getXhr(): XMLHttpRequest not available");return e},u=function(e,n){var t=r();t.open("GET",e,!0),t.onreadystatechange=function(){if(4===t.readyState){if(200!==t.status)throw new Error("HTTP status "+t.status+" when loading "+e);n(t.responseText)}},t.send(null)};else if(l){var c=e.nodeRequire("fs");u=function(e,n){var t=c.readFileSync(e,"utf8");0===t.indexOf("﻿")&&(t=t.substring(1)),n(t)}}t.write=function(e,n,t){var r="ist!"+n;if(s.hasOwnProperty(r)){var l=s[r];t(l)}},t.load=function(e,r,l,i){var o,c,f=!0;/!bare$/.test(e)&&(f=!1,e=e.replace(/!bare$/,"")),o=r.toUrl(e+".ist"),c=-1===e.indexOf("/")?".":e.replace(/\/[^\/]*$/,""),u(o,function(u){var a,d=["ist"];u=u.replace(/^(\s*)@include\s+(?:text=)?(['"])((?:(?=(\\?))\4.)*?)\2/gm,function(e,t,r,l){if(n.findScript(l))return e;var i=c+"/"+l.replace(/\.ist$/,"");return-1===d.indexOf("ist!"+i)&&d.push("ist!"+i),t+'@include "'+i+'"'}),f?(a=t(u,e).getCode(!0),u="define('ist!"+e+"',"+JSON.stringify(d)+", function(ist) {\n"+"  return "+a+";\n"+"});\n"):i.isBuild?(u=n.jsEscape(u),u="define('ist!"+e+"',"+JSON.stringify(d)+",function(ist){"+"var template='"+u+"';"+"return ist(template,'"+e+"');"+"});"):(u=n.jsEscape(u).replace(/\\n/g,"\\n' +\n	               '"),u="define('ist!"+e+"',"+JSON.stringify(d)+", function(ist){ \n"+"	var template = '"+u+"';\n"+"	return ist(template, '"+e+"');\n"+"});\n"),i.isBuild&&(s["ist!"+e]=u),i.isBuild||(u+="\r\n//@ sourceURL="+o),l.fromText("ist!"+e,u),r(["ist!"+e],function(e){l(e)})})}}return t}(t.require,t.misc),t.ist=function(e,n,t,u,o,s){function c(n,r){var l;r=r||"<unknown>";try{l=t.parse(u(n))}catch(i){throw i.message+=" in '"+r+"' on line "+i.line+("undefined"!=typeof i.column?", character "+i.column:""),i}return new e(r,l)}return c.Template=e,c.fromScriptTag=function(e){return console&&(console.warn||console.log)("Warning: ist.fromScriptTag is deprecated, use ist.script instead"),c.script(e)},c.registerHelper=function(e,n){console&&(console.warn||console.log)("Warning: ist.registerHelper is deprecated, use ist.helper instead"),c.helper(e,n)},c.createNode=function(e,n,t){return console&&(console.warn||console.log)("Warning: ist.createNode is deprecated, use ist.create instead"),c.create(e,n,t)},c.create=function(e,n,t){var r,l=e.split(">").map(function(e){return e.trim()}),i="",u="";return l.forEach(function(e){u+="\n"+i+e,i+=" "}),r=c(u).render(n,t),1===r.childNodes.length?r.firstChild:r},c.script=function(e){var n=s.findScript(e);return n?c(n):void 0},c.helper=function(e,t){n.register(e,t)},c.helper("include",function(e,n,t,l){var i,u,o=n,f=o.replace(/\.ist$/,"");if(i=s.findScript(o),r)for(u=[f,f+".ist","ist!"+f,"text!"+f+".ist"];!i&&u.length;)try{i=requirejs(u.shift())}catch(a){}if(!i)throw new Error("Cannot find included template '"+o+"'");if("string"==typeof i&&(i=c(i,f)),"function"!=typeof i.render)throw new Error("Invalid included template '"+o+"'");l.appendChild(i.render(e))}),(l||i&&r)&&o(c),c}(t.template,t.directives,t.parser,t.preprocessor,t.amdplugin,t.misc),r?e.define("ist",[],function(){return t.ist}):(n=e.ist,e.ist=t.ist,e.ist.noConflict=function(){var t=e.ist;return e.ist=n,t})}(this);