%raw(`import('./styles/index.css')`)
switch ReactDOM.querySelector("#app") {
| Some(root) => ReactDOM.render(<App />, root)
| None => ()
}
