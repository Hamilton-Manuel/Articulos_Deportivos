// controllers/reportes.controller.js
const db = require("../models");
const { Op } = db.Sequelize;

const Pago     = db.pagos;
const Pedido   = db.pedidos;
const Detalle  = db.detalle_pedido;
const Producto = db.productos;
const Cliente  = db.clientes;
const Usuario  = db.usuarios;

/* Util: rango de fecha día completo [00:00, 23:59:59.999) */
function rangoDia(fechaStr) {
  // fechaStr esperado "YYYY-MM-DD"
  const [y, m, d] = (fechaStr || "").split("-").map(Number);
  const ini = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0));
  const fin = new Date(ini); fin.setUTCDate(fin.getUTCDate() + 1);
  return { ini, fin };
}

/* GET /api/reportes/ventas?fecha=YYYY-MM-DD
   También acepta fecha_ini y fecha_fin (rango) si lo necesitas. */
exports.ventas = async (req, res) => {
  try {
    const strFecha = req.query.fecha || "";
    const strIni   = req.query.fecha_ini || "";
    const strFin   = req.query.fecha_fin || "";

    let ini, fin;

    if (strIni && strFin) {
      ini = new Date(`${strIni}T00:00:00.000Z`);
      fin = new Date(`${strFin}T00:00:00.000Z`); fin.setUTCDate(fin.getUTCDate() + 1);
    } else if (strFecha) {
      ({ ini, fin } = rangoDia(strFecha));
    } else {
      // por defecto: hoy (UTC)
      const hoy = new Date();
      const yyyy = hoy.getUTCFullYear();
      const mm   = String(hoy.getUTCMonth() + 1).padStart(2, "0");
      const dd   = String(hoy.getUTCDate()).padStart(2, "0");
      ({ ini, fin } = rangoDia(`${yyyy}-${mm}-${dd}`));
    }

    // Traer pagos PAGADOS con su pedido del rango, y detalles+productos y cliente+usuario
    const pagos = await Pago.findAll({
      where: { estado: "PAGADO" },
      include: [
        {
          model: Pedido,
          required: true,
          where: {
            // usamos la fecha del pedido para el rango
            creado_en: { [Op.gte]: ini, [Op.lt]: fin },
          },
          include: [
            { model: Detalle, include: [{ model: Producto }] },
            { model: Cliente, include: [{ model: Usuario, attributes: ["id","correo","nombre_completo","rol"] }] }
          ]
        }
      ],
      order: [[{ model: Pedido }, "creado_en", "ASC"]]
    });

    // Armar filas resumidas por pedido
    const rows = [];
    let totalPedidos = 0;
    let totalItems   = 0;
    let totalQ       = 0;

    for (const p of pagos) {
      const ped = p.pedido;
      if (!ped) continue;

      const detalles = ped.detalles || ped.detalle_pedidos || [];
      let suma = 0;
      let cnt  = 0;

      for (const it of detalles) {
        const precio = Number(it.precio_unitario ?? it.producto?.precio_venta ?? 0);
        const qty    = Number(it.cantidad ?? 0);
        suma += precio * qty;
        cnt  += qty;
      }

      totalPedidos += 1;
      totalItems   += cnt;
      totalQ       += suma;

      const cli = ped.cliente;
      const nombreCliente =
        cli?.usuario?.nombre_completo ||
        cli?.correo ||
        p.correo || "—";

      rows.push({
        pedido_id   : ped.id,
        pago_id     : p.id,
        fecha       : ped.creado_en,
        cliente     : nombreCliente,
        correo      : cli?.usuario?.correo || cli?.correo || p.correo || "",
        items       : cnt,
        total       : Number(suma.toFixed(2)),
      });
    }

    res.json({
      fecha_ini : ini.toISOString(),
      fecha_fin : fin.toISOString(),
      totales   : {
        pedidos: totalPedidos,
        items  : totalItems,
        monto  : Number(totalQ.toFixed(2))
      },
      rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error generando reporte." });
  }
};

// Agrega por productos considerando SOLO pedidos PAGADOS
exports.topProductos = async (req, res) => {
  try {
    const intLimit = Math.max(1, parseInt(req.query.limit || "5", 10));

    // Traer todos los detalles de pedidos pagados (con Producto)
    const arrDetalles = await Detalle.findAll({
      include: [
        { model: Pedido, attributes: ["id", "estado"], where: { estado: "PAGADO" } },
        { model: Producto, attributes: ["id", "nombre", "sku"] }
      ]
    });

    // Acumular { producto_id: { nombre, vendidos, ingresos } }
    const map = new Map();
    for (const d of arrDetalles) {
      const pid = d.producto_id;
      const nombre = d.producto?.nombre || `Prod ${pid}`;
      const vendidos = Number(d.cantidad || 0);
      const ingresos = Number(d.total_linea || 0);

      if (!map.has(pid)) map.set(pid, { producto_id: pid, nombre, vendidos: 0, ingresos: 0 });
      const obj = map.get(pid);
      obj.vendidos += vendidos;
      obj.ingresos += ingresos;
    }

    // Ordenar por vendidos desc (y cortar al límite)
    const rows = [...map.values()]
      .sort((a, b) => b.vendidos - a.vendidos || b.ingresos - a.ingresos)
      .slice(0, intLimit);

    return res.json({ rows });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// GET /api/reportes/top-usuarios?limit=5
// Suma monto e ítems por usuario considerando SOLO pedidos PAGADOS
// --- TOP USUARIOS (desde pagos PAGADOS) ---
exports.topUsuarios = async (req, res) => {
  try {
    const intLimit = Math.max(1, parseInt(req.query.limit || "5", 10));

    // Traer pagos en estado PAGADO con su pedido -> cliente -> usuario
    const arrPagos = await Pago.findAll({
      where: { estado: "PAGADO" },
      include: [{
        model: Pedido,
        attributes: ["id", "cliente_id", "total"],
        include: [{
          model: Cliente,
          attributes: ["id", "usuario_id"],
          include: [{ model: Usuario, attributes: ["id", "nombre_completo", "correo"] }]
        }]
      }],
      order: [["creado_en", "DESC"]]
    });

    // Acumular por usuario
    const map = new Map(); // key = usuario_id
    for (const p of arrPagos) {
      const user = p?.pedido?.cliente?.usuario;
      if (!user) continue;

      const uid     = String(user.id);
      const totalQ  = Number(p?.pedido?.total || 0); // tomamos total del pedido (Q)

      if (!map.has(uid)) {
        map.set(uid, {
          usuario_id: uid,
          usuario_nombre: user.nombre_completo || "",
          usuario_correo: user.correo || "",
          pedidos: 0,
          total_q: 0
        });
      }
      const acc = map.get(uid);
      acc.pedidos += 1;       // 1 pago confirmado = 1 pedido pagado
      acc.total_q += totalQ;  // sumar total del pedido (en Q)
    }

    const rows = [...map.values()]
      .sort((a, b) => b.total_q - a.total_q || b.pedidos - a.pedidos)
      .slice(0, intLimit);

    return res.json({ rows });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};