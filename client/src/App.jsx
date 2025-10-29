// client/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

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

        {/* dashboard protegido */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* cualquier otra ruta -> dashboard (o cambia a /login si prefieres) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
