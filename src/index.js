import { StrictMode } from "react";
import ReactDOM from "react-dom";

import "./magic/fruk.css";

import App from "./App/App.js";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  rootElement
);
