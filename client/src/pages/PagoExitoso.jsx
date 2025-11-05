import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PagoExitoso() {
  const navigate = useNavigate();

  useEffect(() => {
    const user  = JSON.parse(localStorage.getItem("user") || "{}");
    const uid   = user?.id || "guest";

    const CART_KEY   = `cart_${uid}`;
    const PEDIDO_KEY = `pedido_${uid}`;

    // Borrar carrito y pedido local
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(PEDIDO_KEY);

    // (Opcional) marca temporal para que otras pestañas también reaccionen
    localStorage.setItem("last_payment_cleared", String(Date.now()));

    // Redirige a inicio (o a /dashboard si prefieres)
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return null;
}
    