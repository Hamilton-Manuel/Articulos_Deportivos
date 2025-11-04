export const getCartKey = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const uid = user?.id || "guest";
  return `cart_${uid}`;
};

export const readCart = () => {
  const key = getCartKey();
  try {
    // migración: si antes usabas "cart" global, tráelo una vez
    const old = localStorage.getItem("cart");
    const cur = localStorage.getItem(key);
    if (!cur && old) {
      localStorage.setItem(key, old);
      localStorage.removeItem("cart");
    }
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch { return []; }
};

export const saveCart = (items) => {
  localStorage.setItem(getCartKey(), JSON.stringify(items || []));
};

export const clearCart = () => {
  localStorage.setItem(getCartKey(), "[]");
};
