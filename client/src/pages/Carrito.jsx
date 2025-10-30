import React, { useMemo, useState } from "react";

const CART_KEY = "cart";
const readCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
};
const saveCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));

export default function Carrito(){
  const [items, setItems] = useState(readCart());

  const total = useMemo(
    () => items.reduce((a,i) => a + Number(i.precio || 0) * Number(i.qty || 0), 0),
    [items]
  );

  const setAndSave = (arr) => { setItems(arr); saveCart(arr); };

  const inc = (id) => setAndSave(items.map(i => i.id === id ? {...i, qty: Number(i.qty||0)+1} : i));
  const dec = (id) => setAndSave(items.map(i => i.id === id ? {...i, qty: Math.max(1, Number(i.qty||0)-1)} : i));
  const del = (id) => setAndSave(items.filter(i => i.id !== id));
  const clear = () => setAndSave([]);

  return (
    <div style={{padding:"18px 22px", maxWidth:1000, margin:"0 auto"}}>
      <h2>Carrito</h2>

      {items.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <>
          <table style={{width:"100%", borderCollapse:"collapse", marginTop:12}}>
            <thead>
              <tr>
                <th align="left">Producto</th>
                <th>Precio</th>
                <th>Cant.</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} style={{borderTop:"1px solid rgba(255,255,255,.1)"}}>
                  <td>
                    <div style={{display:"flex", alignItems:"center", gap:10}}>
                      {i.imagen_url && <img src={i.imagen_url} alt={i.nombre} width={48} height={48} style={{objectFit:"cover", borderRadius:8}} />}
                      <div>
                        <div style={{fontWeight:700}}>{i.nombre}</div>
                        <div style={{opacity:.8, fontSize:12}}>SKU: {i.sku || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{textAlign:"center"}}>
                    {new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ"}).format(i.precio||0)}
                  </td>
                  <td style={{textAlign:"center"}}>
                    <button onClick={()=>dec(i.id)}>-</button>
                    <span style={{display:"inline-block", width:28, textAlign:"center"}}>{i.qty}</span>
                    <button onClick={()=>inc(i.id)}>+</button>
                  </td>
                  <td style={{textAlign:"center"}}>
                    {new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ"}).format((i.precio||0)*(i.qty||0))}
                  </td>
                  <td style={{textAlign:"center"}}>
                    <button onClick={()=>del(i.id)}>Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{display:"flex", justifyContent:"space-between", marginTop:16}}>
            <button onClick={clear}>Vaciar carrito</button>
            <div style={{fontSize:18, fontWeight:800}}>
              Total: {new Intl.NumberFormat("es-GT",{style:"currency",currency:"GTQ"}).format(total)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
