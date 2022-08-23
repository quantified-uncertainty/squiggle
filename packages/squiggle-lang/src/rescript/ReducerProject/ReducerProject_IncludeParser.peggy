// Includes are at the start of the file, before any other code. 
// There might be some comments before or between the includes.
// #include "string"
// #include "string2"

start
  = (newLine/_/comment/delimitedComment)* @includes newLine* ignore

includes
 = head:includeStatement tail:(newLine+ @includeStatement)* 
 {return [head, ...tail].filter( e => e != '');}
 / ignore 
 {return [];}

includeStatement
  = _* '#include' _* @string _* 
  / comment
  / delimitedComment

string 'string'
  = characters:("'" @([^'])* "'") {return characters.join('');} 
  / characters:('"' @([^"])* '"') {return characters.join('');}

ignore = (any / newLine / _)*

comment
= '//'any*
{ return '';}

delimitedComment  
= '/*' ([^*]*) '*/'
{ return '';}

_ "white space"
  = [ \t]

newLine "newline"
  = [\n\r]
  
any = [^\r\n]
