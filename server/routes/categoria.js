const express = require("express");
let {
    verificaToken,
    verificaAdmin_Role,
} = require("../middlewares/autenticacion");
let app = express();
const _ = require("underscore");
let Categoria = require("../models/categoria");

// =====================
// Mostrar todas las categorias
// =====================
app.get("/categoria", verificaToken, (req, res) => {
    Categoria.find({})
        .sort("descripcion")
        .populate("usuario", "nombre email")
        .exec((err, categorias) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            Categoria.countDocuments({}, (err, conteo) => {
                res.json({
                    ok: true,
                    categorias,
                    cantidad: conteo,
                });
            });
        });
});

// =====================
// Mostrar una categoria por ID
// =====================
app.get("/categoria/:id", verificaToken, (req, res) => {
    let id = req.params.id;

    Categoria.findById(id, (err, categoria) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err,
            });
        }

        if (!categoria) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: "El id no es correcto",
                },
            });
        }

        res.json({
            ok: true,
            categoria,
        });
    });
});

// =====================
// Crear nueva categoria
// =====================
app.post("/categoria", verificaToken, (req, res) => {
    let body = req.body;

    let categoria = new Categoria({
        descripcion: body.descripcion,
        usuario: req.usuario._id,
    });

    categoria.save((err, categoriaDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err,
            });
        }

        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err,
            });
        }

        res.json({ ok: true, categoria: categoriaDB });
    });
});

// =====================
// Actualiza una categoria por ID
// =====================
app.put("/categoria/:id", verificaToken, (req, res) => {
    let id = req.params.id;
    // let body = _.pick(req.body, ["nombre", "descripcion", "usuario"]);
    let body = req.body;

    let descCategoria = {
        descripcion: body.descripcion,
    };

    Categoria.findByIdAndUpdate(
        id,
        descCategoria, { new: true, runValidators: true },
        (err, categoriaDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            if (!categoriaDB) {
                return res.status(400).json({
                    ok: false,
                    err,
                });
            }

            res.json({
                ok: true,
                categoria: categoriaDB,
            });
        }
    );
});

// =====================
// Elimina una categoria
// =====================
app.delete(
    "/categoria/:id", [verificaToken, verificaAdmin_Role],
    (req, res) => {
        let id = req.params.id;

        Categoria.findByIdAndRemove(id, (err, categoriaBorrada) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err,
                });
            }

            if (!categoriaBorrada) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: "El id no existe",
                    },
                });
            }

            res.json({
                ok: true,
                categoria: categoriaBorrada,
            });
        });
        // Solo un administrador puede borrar categorias
        // Categoria.findByIdAndRemove
    }
);

module.exports = app;