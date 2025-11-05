// client/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Carrito from "./pages/Carrito.jsx";
import PagoExitoso from "./pages/PagoExitoso";

const isAuthed = () => !!localStorage.getItem("token");

function PrivateRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="App">
      <Routes>
        {/* raíz -> dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

  {/* login público */}
  <Route path="/login" element={<Login />} />

  {/* registro público */}
  <Route path="/Register" element={<Register />} />
  <Route path="/register" element={<Register />} />
  <Route path="/products" element={<Products />} />

         {/* dashboard público */}
         <Route path="Dashboard" element={<Dashboard />} />
         <Route path="/Carrito" element={<Carrito />} />
         <Route path="/pago-exitoso" element={<PagoExitoso />} />


        {/* cualquier otra ruta -> dashboard (o cambia a /login si prefieres) */}
        <Route path="*" element={<Navigate to="/Dashboard" replace />} />
      </Routes>
    </div>
  );
}
