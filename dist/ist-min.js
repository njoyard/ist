/** @license
 * IST: Indented Selector Templating
 * version 0.5.2
 *
 * Copyright (c) 2012 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://github.com/k-o-x/ist
 */(function(e){"use strict";var t=typeof e.define=="function"&&e.define.amd,n=function(e){var n,r,i,s,o,u,a,f,l,c,h,p,d,v,m,g=["break","case","catch","class","continue","debugger","default","delete","do","else","enum","export","extends","false","finally","for","function","if","import","in","instanceof","new","null","return","super","switch","this","throw","true","try","typeof","undefined","var","void","while","with"],y={},b=["Msxml2.XMLHTTP","Microsoft.XMLHTTP","Msxml2.XMLHTTP.4.0"],w=[],E;return Array.isArray||(Array.isArray=function(e){return Object.prototype.toString.call(e)==="[object Array]"}),o=function(e){return e.replace(/(['\\])/g,"\\$1").replace(/[\f]/g,"\\f").replace(/[\b]/g,"\\b").replace(/[\t]/g,"\\t").replace(/[\n]/g,"\\n").replace(/[\r]/g,"\\r")},l=function(e){var t,n;try{n=document.querySelectorAll("script#"+e)}catch(r){return}return n&&Array.prototype.slice.call(n).forEach(function(e){!t&&e.getAttribute("type")==="text/x-ist"&&(t=e.innerHTML)}),t},s=function(e,t,n){t.prototype=new e,Object.keys(n).forEach(function(e){t.prototype[e]=n[e]})},c=function(e,t){this.value=e,this.doc=t||document,this.variables={document:[this.doc]}},c.prototype={createDocumentFragment:function(){return this.doc.createDocumentFragment()},createElement:function(e,t){return typeof t!="undefined"?this.doc.createElementNS(t,e):this.doc.createElement(e)},createTextNode:function(e){return this.doc.createTextNode(this.interpolate(e))},pushEvalVar:function(e,t){typeof this.variables[e]=="undefined"&&(this.variables[e]=[]),this.variables[e].push(t)},popEvalVar:function(e){var t=this.variables[e].pop();return this.variables[e].length===0&&delete this.variables[e],t},evaluate:function(e){var t=this,n=typeof this.value=="object"?Object.keys(this.value):[],r=Object.keys(this.variables),i,s,o;return n=n.filter(function(e){return g.indexOf(e)===-1}),i=n.map(function(e){return t.value[e]}),s=r.map(function(e){return t.variables[e][0]}),o=new Function(n.concat(r).join(","),"return "+e+";"),o.apply(this.value,i.concat(s))},interpolate:function(e){return e.replace(/{{((?:}(?!})|[^}])*)}}/g,function(e,t){return this.evaluate(t)}.bind(this))},createContext:function(e){return new c(e,this.doc)}},h=function(){},h.prototype={sourceLine:"<unknown>",sourceFile:"<unknown>",completeError:function(e){var t="in '"+(this.sourceFile||"<unknown>")+"'";return typeof this.sourceLine!="undefined"&&(t+=" on line "+this.sourceLine),typeof e.istStack=="undefined"&&(e.message+=" "+t,e.istStack=[]),e.istStack.push(t),e},render:function(e,t){return e instanceof c||(e=new c(e,t)),this._render(e)},_render:function(e){throw new Error("Cannot render base Node")}},v=function(e,t){this.text=e,this.sourceFile=E,this.sourceLine=t},s(h,v,{_render:function(e){try{return e.createTextNode(this.text)}catch(t){throw this.completeError(t)}},appendChild:function(e){throw new Error("Cannot add children to TextNode")}}),p=function(){this.children=[]},s(h,p,{appendChild:function(e){this.children.push(e)},_render:function(e){var t=e.createDocumentFragment();return this.children.forEach(function(n){t.appendChild(n._render(e))}),t}}),m=function(e,t){p.call(this),this.tagName=e,this.sourceFile=E,this.sourceLine=t,this.attributes={},this.properties={},this.classes=[],this.id=undefined},s(p,m,{setAttribute:function(e,t){this.attributes[e]=t},setProperty:function(e,t){this.properties[e]=t},setClass:function(e){this.classes.push(e)},setId:function(e){this.id=e},_render:function(e){var t=this,n=e.createElement(this.tagName);return n.appendChild(p.prototype._render.call(this,e)),Object.keys(this.attributes).forEach(function(r){try{var i=e.interpolate(t.attributes[r])}catch(s){throw this.completeError(s)}n.setAttribute(r,i)}),Object.keys(this.properties).forEach(function(r){try{var i=e.interpolate(t.properties[r])}catch(s){throw this.completeError(s)}n[r]=i}),this.classes.forEach(function(e){n.classList.add(e)}),typeof this.id!="undefined"&&(n.id=this.id),n}}),d=function(e,t,n){p.call(this),this.name=e,this.expr=t,this.sourceFile=E,this.sourceLine=n},s(p,d,{_render:function(e){var t=this,n={},r,i;if(typeof y[this.name]!="function")throw new Error("No block helper for @"+this.name+" has been registered");if(typeof this.expr!="undefined")try{r=e.createContext(e.evaluate(this.expr))}catch(s){throw this.completeError(s)}n.render=p.prototype.render.bind(n),n._render=p.prototype._render.bind(t);try{i=y[this.name].call(e,r,n)}catch(s){throw this.completeError(s)}return typeof i=="undefined"?e.createDocumentFragment():i}}),r=function(){function e(e){return'"'+e.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\x08/g,"\\b").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\f/g,"\\f").replace(/\r/g,"\\r").replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g,escape)+'"'}var t={parse:function(t,n){function a(e,t,n){var r=e,i=n-e.length;for(var s=0;s<i;s++)r=t+r;return r}function f(e){var t=e.charCodeAt(0),n,r;return t<=255?(n="x",r=2):(n="u",r=4),"\\"+n+a(t.toString(16).toUpperCase(),"0",r)}function l(e){var t={};for(var n in e)t[n]=e[n];return t}function c(e,n){var r=e.offset+n;for(var i=e.offset;i<r;i++){var s=t.charAt(i);s==="\n"?(e.seenCR||e.line++,e.column=1,e.seenCR=!1):s==="\r"||s==="\u2028"||s==="\u2029"?(e.line++,e.column=1,e.seenCR=!0):(e.column++,e.seenCR=!1)}e.offset+=n}function h(e){if(i.offset<o.offset)return;i.offset>o.offset&&(o=l(i),u=[]),u.push(e)}function g(){var e,t,n,r,s,o,u,a;o=l(i),u=l(i),e=[],t=E();while(t!==null)e.push(t),t=E();if(e!==null){t=y(),t=t!==null?t:"";if(t!==null){n=[],a=l(i),s=E();if(s!==null){r=[];while(s!==null)r.push(s),s=E()}else r=null;r!==null?(s=y(),s!==null?r=[r,s]:(r=null,i=l(a))):(r=null,i=l(a));while(r!==null){n.push(r),a=l(i),s=E();if(s!==null){r=[];while(s!==null)r.push(s),s=E()}else r=null;r!==null?(s=y(),s!==null?r=[r,s]:(r=null,i=l(a))):(r=null,i=l(a))}if(n!==null){r=[],s=E();while(s!==null)r.push(s),s=E();r!==null?e=[e,t,n,r]:(e=null,i=l(u))}else e=null,i=l(u)}else e=null,i=l(u)}else e=null,i=l(u);return e!==null&&(e=function(e,t,n,r,i){return K(r,i)}(o.offset,o.line,o.column,e[1],e[2])),e===null&&(i=l(o)),e}function y(){var e,n,r,o,u,a;u=l(i),a=l(i),e=w();if(e!==null){n=A(),n===null&&(n=_(),n===null&&(n=q()));if(n!==null){r=[],/^[ \t]/.test(t.charAt(i.offset))?(o=t.charAt(i.offset),c(i,1)):(o=null,s===0&&h("[ \\t]"));while(o!==null)r.push(o),/^[ \t]/.test(t.charAt(i.offset))?(o=t.charAt(i.offset),c(i,1)):(o=null,s===0&&h("[ \\t]"));r!==null?e=[e,n,r]:(e=null,i=l(a))}else e=null,i=l(a)}else e=null,i=l(a);return e!==null&&(e=function(e,t,n,r,i){return{indent:r,item:i,num:t}}(u.offset,u.line,u.column,e[0],e[1])),e===null&&(i=l(u)),e}function b(){var e;return s++,/^[ \t]/.test(t.charAt(i.offset))?(e=t.charAt(i.offset),c(i,1)):(e=null,s===0&&h("[ \\t]")),s--,s===0&&e===null&&h("whitespace"),e}function w(){var e,t,n;s++,n=l(i),e=[],t=b();while(t!==null)e.push(t),t=b();return e!==null&&(e=function(e,t,n,r){return Q(r,t)}(n.offset,n.line,n.column,e)),e===null&&(i=l(n)),s--,s===0&&e===null&&h("indent"),e}function E(){var e;return s++,t.charCodeAt(i.offset)===10?(e="\n",c(i,1)):(e=null,s===0&&h('"\\n"')),s--,s===0&&e===null&&h("new line"),e}function S(){var e;return s++,/^[^\n]/.test(t.charAt(i.offset))?(e=t.charAt(i.offset),c(i,1)):(e=null,s===0&&h("[^\\n]")),s--,s===0&&e===null&&h("character"),e}function x(){var e,n,r,o,u;s++,o=l(i),u=l(i),/^[a-z_]/i.test(t.charAt(i.offset))?(e=t.charAt(i.offset),c(i,1)):(e=null,s===0&&h("[a-z_]i"));if(e!==null){n=[],/^[a-z0-9_\-]/i.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h("[a-z0-9_\\-]i"));while(r!==null)n.push(r),/^[a-z0-9_\-]/i.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h("[a-z0-9_\\-]i"));n!==null?e=[e,n]:(e=null,i=l(u))}else e=null,i=l(u);return e!==null&&(e=function(e,t,n,r,i){return r+i.join("")}(o.offset,o.line,o.column,e[0],e[1])),e===null&&(i=l(o)),s--,s===0&&e===null&&h("identifier"),e}function T(){var e,n,r,o;return r=l(i),o=l(i),t.charCodeAt(i.offset)===35?(e="#",c(i,1)):(e=null,s===0&&h('"#"')),e!==null?(n=x(),n!==null?e=[e,n]:(e=null,i=l(o))):(e=null,i=l(o)),e!==null&&(e=function(e,t,n,r){return{id:r}}(r.offset,r.line,r.column,e[1])),e===null&&(i=l(r)),e}function N(){var e,n,r,o;return r=l(i),o=l(i),t.charCodeAt(i.offset)===46?(e=".",c(i,1)):(e=null,s===0&&h('"."')),e!==null?(n=x(),n!==null?e=[e,n]:(e=null,i=l(o))):(e=null,i=l(o)),e!==null&&(e=function(e,t,n,r){return{className:r}}(r.offset,r.line,r.column,e[1])),e===null&&(i=l(r)),e}function C(){var e,n,r,o,u,a,f;a=l(i),f=l(i),t.charCodeAt(i.offset)===91?(e="[",c(i,1)):(e=null,s===0&&h('"["'));if(e!==null){n=x();if(n!==null){t.charCodeAt(i.offset)===61?(r="=",c(i,1)):(r=null,s===0&&h('"="'));if(r!==null){o=[],/^[^\n\]]/.test(t.charAt(i.offset))?(u=t.charAt(i.offset),c(i,1)):(u=null,s===0&&h("[^\\n\\]]"));while(u!==null)o.push(u),/^[^\n\]]/.test(t.charAt(i.offset))?(u=t.charAt(i.offset),c(i,1)):(u=null,s===0&&h("[^\\n\\]]"));o!==null?(t.charCodeAt(i.offset)===93?(u="]",c(i,1)):(u=null,s===0&&h('"]"')),u!==null?e=[e,n,r,o,u]:(e=null,i=l(f))):(e=null,i=l(f))}else e=null,i=l(f)}else e=null,i=l(f)}else e=null,i=l(f);return e!==null&&(e=function(e,t,n,r,i){return{attr:r,value:i.join("")}}(a.offset,a.line,a.column,e[1],e[3])),e===null&&(i=l(a)),e}function k(){var e,n,r,o,u,a,f,p;f=l(i),p=l(i),t.charCodeAt(i.offset)===91?(e="[",c(i,1)):(e=null,s===0&&h('"["'));if(e!==null){t.charCodeAt(i.offset)===46?(n=".",c(i,1)):(n=null,s===0&&h('"."'));if(n!==null){r=x();if(r!==null){t.charCodeAt(i.offset)===61?(o="=",c(i,1)):(o=null,s===0&&h('"="'));if(o!==null){u=[],/^[^\n\]]/.test(t.charAt(i.offset))?(a=t.charAt(i.offset),c(i,1)):(a=null,s===0&&h("[^\\n\\]]"));while(a!==null)u.push(a),/^[^\n\]]/.test(t.charAt(i.offset))?(a=t.charAt(i.offset),c(i,1)):(a=null,s===0&&h("[^\\n\\]]"));u!==null?(t.charCodeAt(i.offset)===93?(a="]",c(i,1)):(a=null,s===0&&h('"]"')),a!==null?e=[e,n,r,o,u,a]:(e=null,i=l(p))):(e=null,i=l(p))}else e=null,i=l(p)}else e=null,i=l(p)}else e=null,i=l(p)}else e=null,i=l(p);return e!==null&&(e=function(e,t,n,r,i){return{prop:r,value:i.join("")}}(f.offset,f.line,f.column,e[2],e[4])),e===null&&(i=l(f)),e}function L(){var e;return s++,e=T(),e===null&&(e=N(),e===null&&(e=C(),e===null&&(e=k()))),s--,s===0&&e===null&&h("element qualifier"),e}function A(){var e;return s++,e=O(),e===null&&(e=M()),s--,s===0&&e===null&&h("element"),e}function O(){var e,t,n;n=l(i),t=L();if(t!==null){e=[];while(t!==null)e.push(t),t=L()}else e=null;return e!==null&&(e=function(e,t,n,r){return Z("div",r,t)}(n.offset,n.line,n.column,e)),e===null&&(i=l(n)),e}function M(){var e,t,n,r,s;r=l(i),s=l(i),e=x();if(e!==null){t=[],n=L();while(n!==null)t.push(n),n=L();t!==null?e=[e,t]:(e=null,i=l(s))}else e=null,i=l(s);return e!==null&&(e=function(e,t,n,r,i){return Z(r,i,t)}(r.offset,r.line,r.column,e[0],e[1])),e===null&&(i=l(r)),e}function _(){var e,t;return s++,t=l(i),e=I(),e!==null&&(e=function(e,t,n,r){return Y(r,t)}(t.offset,t.line,t.column,e)),e===null&&(i=l(t)),s--,s===0&&e===null&&h("text node"),e}function D(){var e,n,r,o,u,a,f,p;s++,u=l(i),a=l(i),e=x();if(e!==null){n=[],f=l(i),p=l(i),t.charCodeAt(i.offset)===46?(r=".",c(i,1)):(r=null,s===0&&h('"."')),r!==null?(o=x(),o!==null?r=[r,o]:(r=null,i=l(p))):(r=null,i=l(p)),r!==null&&(r=function(e,t,n,r){return r}(f.offset,f.line,f.column,r[1])),r===null&&(i=l(f));while(r!==null)n.push(r),f=l(i),p=l(i),t.charCodeAt(i.offset)===46?(r=".",c(i,1)):(r=null,s===0&&h('"."')),r!==null?(o=x(),o!==null?r=[r,o]:(r=null,i=l(p))):(r=null,i=l(p)),r!==null&&(r=function(e,t,n,r){return r}(f.offset,f.line,f.column,r[1])),r===null&&(i=l(f));n!==null?e=[e,n]:(e=null,i=l(a))}else e=null,i=l(a);return e!==null&&(e=function(e,t,n,r,i){return i.unshift(r),i.join(".")}(u.offset,u.line,u.column,e[0],e[1])),e===null&&(i=l(u)),s--,s===0&&e===null&&h("context property path"),e}function P(){var e,n,r,o,u,a,f;return a=l(i),f=l(i),t.charCodeAt(i.offset)===117?(e="u",c(i,1)):(e=null,s===0&&h('"u"')),e!==null?(/^[0-9a-z]/i.test(t.charAt(i.offset))?(n=t.charAt(i.offset),c(i,1)):(n=null,s===0&&h("[0-9a-z]i")),n!==null?(/^[0-9a-z]/i.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h("[0-9a-z]i")),r!==null?(/^[0-9a-z]/i.test(t.charAt(i.offset))?(o=t.charAt(i.offset),c(i,1)):(o=null,s===0&&h("[0-9a-z]i")),o!==null?(/^[0-9a-z]/i.test(t.charAt(i.offset))?(u=t.charAt(i.offset),c(i,1)):(u=null,s===0&&h("[0-9a-z]i")),u!==null?e=[e,n,r,o,u]:(e=null,i=l(f))):(e=null,i=l(f))):(e=null,i=l(f))):(e=null,i=l(f))):(e=null,i=l(f)),e!==null&&(e=function(e,t,n,r,i,s,o){return""+r+i+s+o}(a.offset,a.line,a.column,e[1],e[2],e[3],e[4])),e===null&&(i=l(a)),e}function H(){var e,n,r,o,u;return o=l(i),u=l(i),t.charCodeAt(i.offset)===120?(e="x",c(i,1)):(e=null,s===0&&h('"x"')),e!==null?(/^[0-9a-z]/i.test(t.charAt(i.offset))?(n=t.charAt(i.offset),c(i,1)):(n=null,s===0&&h("[0-9a-z]i")),n!==null?(/^[0-9a-z]/i.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h("[0-9a-z]i")),r!==null?e=[e,n,r]:(e=null,i=l(u))):(e=null,i=l(u))):(e=null,i=l(u)),e!==null&&(e=function(e,t,n,r,i){return""+r+i}(o.offset,o.line,o.column,e[1],e[2])),e===null&&(i=l(o)),e}function B(){var e,n,r,o;return r=l(i),o=l(i),t.charCodeAt(i.offset)===92?(e="\\",c(i,1)):(e=null,s===0&&h('"\\\\"')),e!==null?(n=P(),n===null&&(n=H(),n===null&&(n=S())),n!==null?e=[e,n]:(e=null,i=l(o))):(e=null,i=l(o)),e!==null&&(e=function(e,t,n,r){return G(r)}(r.offset,r.line,r.column,e[1])),e===null&&(i=l(r)),e}function j(){var e,n,r,o,u;o=l(i),u=l(i),t.charCodeAt(i.offset)===34?(e='"',c(i,1)):(e=null,s===0&&h('"\\""'));if(e!==null){n=[],r=B(),r===null&&(/^[^\\\n"]/.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h('[^\\\\\\n"]')));while(r!==null)n.push(r),r=B(),r===null&&(/^[^\\\n"]/.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h('[^\\\\\\n"]')));n!==null?(t.charCodeAt(i.offset)===34?(r='"',c(i,1)):(r=null,s===0&&h('"\\""')),r!==null?e=[e,n,r]:(e=null,i=l(u))):(e=null,i=l(u))}else e=null,i=l(u);return e!==null&&(e=function(e,t,n,r){return r.join("")}(o.offset,o.line,o.column,e[1])),e===null&&(i=l(o)),e}function F(){var e,n,r,o,u;o=l(i),u=l(i),t.charCodeAt(i.offset)===39?(e="'",c(i,1)):(e=null,s===0&&h('"\'"'));if(e!==null){n=[],r=B(),r===null&&(/^[^\\\n']/.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h("[^\\\\\\n']")));while(r!==null)n.push(r),r=B(),r===null&&(/^[^\\\n']/.test(t.charAt(i.offset))?(r=t.charAt(i.offset),c(i,1)):(r=null,s===0&&h("[^\\\\\\n']")));n!==null?(t.charCodeAt(i.offset)===39?(r="'",c(i,1)):(r=null,s===0&&h('"\'"')),r!==null?e=[e,n,r]:(e=null,i=l(u))):(e=null,i=l(u))}else e=null,i=l(u);return e!==null&&(e=function(e,t,n,r){return r.join("")}(o.offset,o.line,o.column,e[1])),e===null&&(i=l(o)),e}function I(){var e;return s++,e=j(),e===null&&(e=F()),s--,s===0&&e===null&&h("quoted text"),e}function q(){var e;return s++,e=U(),e===null&&(e=R()),s--,s===0&&e===null&&h("directive"),e}function R(){var e,n,r,o;return r=l(i),o=l(i),t.charCodeAt(i.offset)===64?(e="@",c(i,1)):(e=null,s===0&&h('"@"')),e!==null?(n=x(),n!==null?e=[e,n]:(e=null,i=l(o))):(e=null,i=l(o)),e!==null&&(e=function(e,t,n,r){return et(r,undefined,t)}(r.offset,r.line,r.column,e[1])),e===null&&(i=l(r)),e}function U(){var e,n,r,o,u,a,f;a=l(i),f=l(i),t.charCodeAt(i.offset)===64?(e="@",c(i,1)):(e=null,s===0&&h('"@"'));if(e!==null){n=x();if(n!==null){o=b();if(o!==null){r=[];while(o!==null)r.push(o),o=b()}else r=null;if(r!==null){u=S();if(u!==null){o=[];while(u!==null)o.push(u),u=S()}else o=null;o!==null?e=[e,n,r,o]:(e=null,i=l(f))}else e=null,i=l(f)}else e=null,i=l(f)}else e=null,i=l(f);return e!==null&&(e=function(e,t,n,r,i){return et(r,i.join(""),t)}(a.offset,a.line,a.column,e[1],e[3])),e===null&&(i=l(a)),e}function z(e){e.sort();var t=null,n=[];for(var r=0;r<e.length;r++)e[r]!==t&&(n.push(e[r]),t=e[r]);return n}var r={templateLines:g,line:y,__:b,indent:w,newline:E,character:S,identifier:x,elemId:T,elemClass:N,elemAttribute:C,elemProperty:k,elemQualifier:L,element:A,implicitElement:O,explicitElement:M,textNode:_,contextPath:D,escapedUnicode:P,escapedASCII:H,escapedCharacter:B,doubleQuotedText:j,singleQuotedText:F,quotedText:I,directive:q,simpleDirective:R,exprDirective:U};if(n!==undefined){if(r[n]===undefined)throw new Error("Invalid rule name: "+e(n)+".")}else n="templateLines";var i={offset:0,line:1,column:1,seenCR:!1},s=0,o={offset:0,line:1,column:1,seenCR:!1},u=[],W="U",X="I",V="D",$,J=[0],K,Q,G,Y,Z,et;K=function(e,t){var n=[new p],r=0,i,s,o,u;if(!e)return n[0];s=function(){return n[n.length-1]},o=function(e){r++,n.push(e)},u=function(e){var t;if(n.length<2)throw new Error("Could not pop node from stack");return t=n.pop(),s().appendChild(t),t},i=t.map(function(e){return e.pop()}),i.unshift(e),i.forEach(function(e,t){var n=e.indent,i=e.item,a=e.num,f;if(n[0]instanceof Error)throw n[0];if(r>0)if(n[0]===W)u();else if(n[0]===V){u();while(n.length>0)n.pop(),u()}else if(n[0]===X&&s()instanceof v)throw f=new Error("Cannot add children to text node"),f.line=a,f;o(i)});while(n.length>1)u();return s()},Q=function(e,t){var n=e.length,r=[],i;n.length===0&&J.push(n);if(n==J[0])return[W];if(n>J[0])return J.unshift(n),[X];while(n<J[0])J.shift(),r.push(V);return n!=J[0]?(i=new Error("Unexpected indent"),i.line=t,i.column=1,[i]):r},Y=function(e,t){return new v(e,t)},Z=function(e,t,n){var r=new m(e,n);return t.forEach(function(e){typeof e.id!="undefined"?r.setId(e.id):typeof e.className!="undefined"?r.setClass(e.className):typeof e.attr!="undefined"?r.setAttribute(e.attr,e.value):typeof e.prop!="undefined"&&r.setProperty(e.prop,e.value)}),r},et=function(e,t,n){return new d(e,t,n)},G=function(e){return e.length>1?String.fromCharCode(parseInt(e,16)):{f:"\f",b:"\b",t:"	",n:"\n",r:"\r"}[e]||e};var tt=r[n]();if(tt===null||i.offset!==t.length){var nt=Math.max(i.offset,o.offset),rt=nt<t.length?t.charAt(nt):null,it=i.offset>o.offset?i:o;throw new this.SyntaxError(z(u),rt,nt,it.line,it.column)}return tt},toSource:function(){return this._source}};return t.SyntaxError=function(t,n,r,i,s){function o(t,n){var r,i;switch(t.length){case 0:r="end of input";break;case 1:r=t[0];break;default:r=t.slice(0,t.length-1).join(", ")+" or "+t[t.length-1]}return i=n?e(n):"end of input","Expected "+r+" but "+i+" found."}this.name="SyntaxError",this.expected=t,this.found=n,this.message=o(t,n),this.offset=r,this.line=i,this.column=s},t.SyntaxError.prototype=Error.prototype,t}(),u=function(e){var t=/\r\n|\r|\n/,n=/^[ \t]*$/,r=/\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,i=e.split(t);return i.forEach(function(e,t){e.match(n)&&(i[t]="")}),e=i.join("\n"),e=e.replace(r,function(e,n){return n.split(t).map(function(e){return""}).join("\n")}),e},n=function(e,t){var n;E=t||"<unknown>";try{n=r.parse(u(e))}catch(i){throw i.message+=" in '"+E+"' on line "+i.line+(typeof i.column!="undefined"?", character "+i.column:""),E=undefined,i}return E=undefined,n},n.createNode=function(e,t,r){var i=e.split(">").map(function(e){return e.trim()}),s="",o="",u;return i.forEach(function(e){o+="\n"+s+e,s+=" "}),u=n(o).render(t,r),u.childNodes.length===1?u.firstChild:u},n.fromScriptTag=function(e){var t=l(e);if(t)return n(t)},n.registerHelper=function(e,t){y[e]=t},n.registerHelper("if",function(e,t){if(e.value)return t.render(this)}),n.registerHelper("unless",function(e,t){if(!e.value)return t.render(this)}),n.registerHelper("with",function(e,t){return t.render(e)}),n.registerHelper("each",function(e,t){var n=this.createDocumentFragment(),r=this.value,i=e.value;return i&&Array.isArray(i)&&i.forEach(function(s,o){var u=e.createContext(s);u.pushEvalVar("loop",{first:o==0,index:o,last:o==i.length-1,length:i.length,outer:r}),n.appendChild(t.render(u)),u.popEvalVar("loop")}),n}),n.registerHelper("include",function(r,i){var s=r.value.replace(/\.ist$/,""),o,u,a;u=l(s);if(t){a=[s,s+".ist","ist!"+s,"text!"+s+".ist"];while(!u&&a.length)try{u=e(a.shift())}catch(f){}}if(!u)throw new Error("Cannot find included template '"+s+"'");typeof u=="string"&&(u=n(u,s));if(typeof u.render=="function")return u.render(this,i.document);throw new Error("Invalid included template '"+s+"'")}),t&&(typeof window!="undefined"&&window.navigator&&window.document?(a=function(){var e,t,n;if(typeof XMLHttpRequest!="undefined")return new XMLHttpRequest;for(t=0;t<3;t++){n=b[t];try{e=new ActiveXObject(n)}catch(r){}if(e){b=[n];break}}if(!e)throw new Error("getXhr(): XMLHttpRequest not available");return e},f=function(e,t){var n=a();n.open("GET",e,!0),n.onreadystatechange=function(r){if(n.readyState===4){if(n.status!==200)throw new Error("HTTP status "+n.status+" when loading "+e);t(n.responseText)}},n.send(null)}):typeof process!="undefined"&&process.versions&&!!process.versions.node&&(i=require.nodeRequire("fs"),f=function(e,t){var n=i.readFileSync(e,"utf8");n.indexOf("﻿")===0&&(n=n.substring(1)),t(n)}),n.write=function(e,t,n){var r="ist!"+t;if(w.hasOwnProperty(r)){var i=w[r];n(i)}},n.load=function(e,t,n,r){var i=t.toUrl(e+".ist"),s=e.indexOf("/")===-1?".":e.replace(/\/[^\/]*$/,"");f(i,function(u){var a,f,c=["ist"];u=u.replace(/^(\s*)@include\s+(?:text=)?(['"])((?:(?=(\\?))\4.)*?)\2/gm,function(e,t,n,r){if(!l(r)){var i=s+"/"+r.replace(/\.ist$/,"");return c.indexOf("ist!"+i)===-1&&c.push("ist!"+i),t+'@include "'+i+'"'}return e}),r.isBuild?(u=o(u),u="define('ist!"+e+"',"+JSON.stringify(c)+",function(ist){"+"var template='"+u+"';"+"return ist(template,'"+e+"');"+"});"):(u=o(u).replace(/\\n/g,"\\n' +\n	               '"),u="define('ist!"+e+"',"+JSON.stringify(c)+", function(ist){ \n"+"	var template = '"+u+"';\n"+"	return ist(template, '"+e+"');\n"+"});\n"),r.isBuild&&(w["ist!"+e]=u),r.isBuild||(u+="\r\n//@ sourceURL="+i),n.fromText("ist!"+e,u),t(["ist!"+e],function(e){n(e)})})}),n};if(t)define("ist",["require"],n);else{var r=e.ist;e.ist=n(),e.ist.noConflict=function(){var t=e.ist;return e.ist=r,t}}})(this);