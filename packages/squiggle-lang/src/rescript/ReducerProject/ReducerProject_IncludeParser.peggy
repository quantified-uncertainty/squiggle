// Includes are at the start of the file, before any other code. 
// There might be some comments before or between the includes.
// #include "string"
// #include "string2" as aVariable

start
  = (newLine/_/comment/delimitedComment)* @includes newLine* ignore

includes
 = head:dependencyStatement tail:(newLine+ @dependencyStatement)* 
 {return [head, ...tail].filter( e => e != '');}
 / ! '#'
 {return [];}

dependencyStatement
  = includeStatement
  / comment
  / delimitedComment

includeStatement
  = _* '#include' _+ file:string variable:(_+ 'as' _+ @identifier)? _* & newLine
  {return [!variable ? '' : variable, file]}

string 'string'
  = characters:("'" @([^'])* "'") {return characters.join('');} 
  / characters:('"' @([^"])* '"') {return characters.join('');}

ignore = (any / newLine / _)*

comment 'comment'
= '//'any* & newLine
{ return '';}

delimitedComment 'comment' 
= '/*' ([^*]*) '*/'
{ return '';}

_ "white space"
  = [ \t]

newLine "newline"
  = [\n\r]
  
any 'code'
 = [^\r\n]

identifier 'identifier'
  = ([_a-z]+[_a-z0-9]i*) {return text();} 
