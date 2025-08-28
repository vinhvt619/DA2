import React from "react";
import ReactDOM from "react-dom/client";
import App from "./Pages/App.jsx";
//localhost:4000/

// import "./flags.css";
// import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primeicons/primeicons.css";
import { PrimeReactProvider, PrimeReactContext } from "primereact/api";
// import { ThemeProvider } from "@material-tailwind/react";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* <PrimeReactProvider> */}
    <App />
    {/* </PrimeReactProvider> */}
  </React.StrictMode>
);
