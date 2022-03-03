import React from 'react'
import { render } from "react-dom"
import DistBuilder from "./components/DistBuilder"

var root = document.querySelector("#app")

if (!(root == null)) {
  render(<DistBuilder />, root)
}
