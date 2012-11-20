/* Initialization */
{
	var depths = [0];
}

/* PEGjs rules */

templateLines
= newline* first:line? tail:(newline+ line)* newline*
{ return generateNodeTree(first, tail); }

__ "whitespace"
= [ \t]

line
= depth:indent s:(element / textNode / directive) __*
{ return { indent: depth, item: s, num: line }; }

indent "indent"
= s:__*
{ return parseIndent(depths, s, line); }

newline "new line"
= "\n"

character "character"
= [^\n]

identifier "identifier"
= h:[a-z_]i t:[a-z0-9_-]i*
{ return h + t.join(''); }

partial
= "!" name:identifier
{ return name; }

elemId
= "#" id:identifier
{ return { 'id': id }; }

elemClass
= "." cls:identifier
{ return { 'className': cls }; }

elemAttribute
= "[" attr:identifier "=" value:[^\n\]]* "]"
{ return { 'attr': attr, 'value': value.join('') }; }

elemProperty
= "[" "." prop:identifier "=" value:[^\n\]]* "]"
{ return { 'prop': prop, 'value': value.join('') }; }

elemQualifier "element qualifier"
= elemId / elemClass / elemAttribute / elemProperty

element "element"
= implicitElement / explicitElement

implicitElement
= qualifiers:elemQualifier+ additions:elementAdditions
{ return createElement('div', qualifiers, additions, line); }

explicitElement
= tagName:identifier qualifiers:elemQualifier* additions:elementAdditions
{ return createElement(tagName, qualifiers, additions, line); }

elementAdditions
= t:(__+ t:textNode { return t; } )? p:(__+ p:partial { return p; } )?
{ return { textnode: t, partial: p }; }

textNode "text node"
= text:quotedText
{ return createTextNode(text, line); }

escapedUnicode
= "u" a:[0-9a-z]i b:[0-9a-z]i c:[0-9a-z]i d:[0-9a-z]i
{ return '' + a + b + c + d; }

escapedASCII
= "x" a:[0-9a-z]i b:[0-9a-z]i
{ return '' + a + b; }

escapedCharacter 
= "\\" c:(escapedUnicode / escapedASCII / character)
{ return escapedCharacter(c); }

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
{ return createDirective(name, undefined, line); }

exprDirective
= "@" name:identifier __+ expr:character+
{ return createDirective(name, expr.join(''), line); }


