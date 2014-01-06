/* Initialization */
{
	var depths = [0];
}

/* PEGjs rules */

templateLines
= newline* first:line? tail:(newline+ line)* newline*
{ return helpers.generateNodeTree(first, tail); }

__ "whitespace"
= [ \t]

line
= depth:indent s:(element / textNode / directive) __*
{ return { indent: depth, item: s }; }

indent "indent"
= s:__*
{ return helpers.parseIndent(depths, s, line()); }

newline "new line"
= "\n"

character "character"
= [^\n]

identifier "identifier"
= h:[a-z_]i t:[a-z0-9_-]i*
{ return h + t.join(''); }

dottedpath "dotted path"
= h:identifier t:("." identifier)*
{ return t.length ? [h].concat(t.map(function(i) { return i[1]; })) : [h] }

partial
= "!" name:identifier
{ return name; }

elemId
= "#" id:identifier
{ return { 'id': id }; }

elemClass
= "." cls:identifier
{ return { 'className': cls }; }

squareBracketsValue
= chars:(escapedCharacter / [^\\\n\]])*
{ return chars.join(''); }

elemAttribute
= "[" attr:identifier "=" value:squareBracketsValue "]"
{ return { 'attr': attr, 'value': value }; }

elemProperty
= "[" "." prop:dottedpath "=" value:squareBracketsValue "]"
{ return { 'prop': prop, 'value': value }; }

elemEventHandler
= "[" "!" event:identifier "=" value:squareBracketsValue "]"
{ return { 'event': event, 'value': value }; }

elemQualifier "element qualifier"
= elemId / elemClass / elemAttribute / elemProperty / elemEventHandler

element "element"
= implicitElement / explicitElement

implicitElement
= qualifiers:elemQualifier+ additions:elementAdditions
{ return helpers.createElement('div', qualifiers, additions, line()); }

explicitElement
= tagName:identifier qualifiers:elemQualifier* additions:elementAdditions
{ return helpers.createElement(tagName, qualifiers, additions, line()); }

elementAdditions
= t:(__+ t:textNode { return t; } )? p:(__+ p:partial { return p; } )?
{ return { textnode: t, partial: p }; }

textNode "text node"
= text:quotedText
{ return helpers.createTextNode(text, line()); }

escapedUnicode
= "u" a:[0-9a-z]i b:[0-9a-z]i c:[0-9a-z]i d:[0-9a-z]i
{ return '' + a + b + c + d; }

escapedASCII
= "x" a:[0-9a-z]i b:[0-9a-z]i
{ return '' + a + b; }

escapedCharacter 
= "\\" c:(escapedUnicode / escapedASCII / character)
{ return helpers.escapedCharacter(c); }

doubleQuotedText
= "\"" chars:(escapedCharacter / [^\\\n\"])* "\""
{ return chars.join(''); }

singleQuotedText
= "'" chars:(escapedCharacter / [^\\\n'])* "'"
{ return chars.join(''); }

quotedText "quoted text"
= doubleQuotedText / singleQuotedText

directive "directive"
= exprDirective / simpleDirective

simpleDirective
= "@" name:identifier
{ return helpers.createDirective(name, undefined, line()); }

exprDirective
= "@" name:identifier __+ expr:character+
{ return helpers.createDirective(name, expr.join(''), line()); }

