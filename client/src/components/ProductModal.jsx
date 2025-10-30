// client/src/components/ProductModal.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import ProductForm from "./ProductForm";

export default function ProductModal({ product, onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback((shouldRefresh = false) => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(shouldRefresh);
    }, 200);
  }, [onClose]);

  const handleCloseRef = useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") handleCloseRef.current();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []); // listener se registra solo una vez

  return (
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{product ? "Editar Producto" : "Nuevo Producto"}</h2>
          <button 
            className="modal-close"
            onClick={() => handleClose()}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>
        <ProductForm
          product={product}
          onSuccess={() => handleClose(true)}
          onCancel={() => handleClose()}
        />
      </div>
    </div>
  );
}