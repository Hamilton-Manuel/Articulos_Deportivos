import React from "react";
import { createRoot } from "react-dom/client";
import LoginPage from "./pages/Login";
import "./App.css";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
	<React.StrictMode>
		<LoginPage />
	</React.StrictMode>
);
