type reducerError =
| RerrFunctionExpected( string )
| RerrJs(option<string>, option<string>)   // Javascript Exception
| RerrTodo(string) // To do
| RerrUnexecutedCode( string )
| RerrArrayIndexNotFound(string, int)
| RerrRecordPropertyNotFound(string, string)

let showError = (err) => switch err {
  | RerrTodo( msg ) => `TODO: ${msg}`
  | RerrJs( omsg, oname ) => {
      let answer = "JS Exception:"
      let answer = switch oname {
        | Some(name) => `${answer} ${name}`
        | _ => answer
      }
      let answer = switch omsg {
        | Some(msg) => `${answer}: ${msg}`
        | _ => answer
      }
      answer
    }
  | RerrArrayIndexNotFound(msg, index) => `${msg}: ${Js.String.make(index)}`
  | RerrRecordPropertyNotFound(msg, index) => `${msg}: ${index}`
  | RerrUnexecutedCode( codeString ) => `Unexecuted code remaining: ${codeString}`
  | RerrFunctionExpected( msg ) => `Function expected: ${msg}`
  }
