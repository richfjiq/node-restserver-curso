const express = require("express");
const {
    verificaToken,
    verificaAdmin_Role,
} = require("../middlewares/autenticacion");

let app = express();
let Producto = require("../models/producto");

// =====================
// Mostrar todas los productos
// =====================
app.get("/productos", verificaToken, (req, res) => {
    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 10;
    limite = Number(limite);

    Producto.find({ disponible: true })
        .sort("nombre")
        .populate("usuario", "nombre email")
        .populate("categoria", "descripcion")
        .skip(desde)
        .limit(limite)
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            Producto.countDocuments({}, (err, conteo) => {
                res.json({
                    ok: true,
                    productos,
                    cantidad: conteo,
                });
            });
        });
});

// =====================
// Obtener un producto por id
// =====================
app.get("/productos/:id", verificaToken, (req, res) => {
    let id = req.params.id;

    Producto.findById(id)
        .populate("usuario", "nombre email")
        .populate("categoria", "descripcion")
        .exec((err, producto) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            if (!producto) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: "El id no es correcto",
                    },
                });
            }

            res.json({
                ok: true,
                producto,
            });
        });
});

// =====================
// Buscar productos
// =====================
app.get("/productos/buscar/:termino", verificaToken, (req, res) => {
    let termino = req.params.termino;

    let regex = new RegExp(termino, "i");

    Producto.find({ nombre: regex })
        .populate("categoria", "descripcion")
        .exec((err, productos) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            res.json({
                ok: true,
                productos,
            });
        });
});

// =====================
// Crear un nuevo producto
// =====================
app.post("/productos", verificaToken, (req, res) => {
    let body = req.body;

    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        disponible: body.disponible,
        categoria: body.categoria,
        usuario: req.usuario._id,
    });

    producto.save((err, productoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err,
            });
        }

        res.status(201).json({ ok: true, producto: productoDB });
    });
});

// =====================
// Actualizar un producto
// =====================
app.put("/productos/:id", (req, res) => {
    let id = req.params.id;
    let body = req.body;

    let descProducto = {
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        disponible: body.disponible,
        categoria: body.categoria,
    };

    Producto.findByIdAndUpdate(
        id,
        descProducto, { new: true, runValidators: true },
        (err, productoDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            if (!productoDB) {
                return res.status(400).json({
                    ok: false,
                    err: { message: "El producto (id) no existe" },
                });
            }

            res.json({
                ok: true,
                producto: productoDB,
            });
        }
    );
});

// =====================
// Borrar un producto
// =====================
app.delete(
    "/productos/:id", [verificaToken, verificaAdmin_Role],
    (req, res) => {
        let id = req.params.id;

        let cambiaDisponible = {
            disponible: false,
        };

        Producto.findByIdAndUpdate(
            id,
            cambiaDisponible, { new: true },
            (err, productoBorrado) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err,
                    });
                }

                if (!productoBorrado) {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: "ID no existe",
                        },
                    });
                }

                res.json({
                    ok: true,
                    producto: productoBorrado,
                });
            }
        );
    }
);

module.exports = app;