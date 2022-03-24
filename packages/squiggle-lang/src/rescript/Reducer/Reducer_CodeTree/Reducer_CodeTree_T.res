module CTV = Reducer_Extension.CodeTreeValue

type codeTreeValue = CTV.codeTreeValue

type rec codeTree =
| CtList(list<codeTree>)  // A list to map-reduce
| CtValue(codeTreeValue)  // Irreducable built-in value. Reducer should not know the internals. External libraries are responsible
