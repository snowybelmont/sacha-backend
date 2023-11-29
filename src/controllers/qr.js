const { Router } = require("express");
const router = Router();
const qrCodeGen = require("qrcode");

const { normalizeId } = require("../utils/normalizeid");
const database = require("../utils/database");
const { QRCode } = require("../models/qr");
const { User } = require("../models/users");

router.get("/all", async (req, res) => {
  try {
    await database.connection();
    const qrs = await QRCode.find();

    if (qrs.length > 0) {
      if (qrs.length === 1) {
        res.status(200).json({
          message: "1 qr code encontrado",
          qrs,
        });
      } else {
        res.status(200).json({
          message: `${qrs.length} qr codes encontrados`,
          qrs,
        });
      }
    } else {
      return res.status(404).json({ message: "Nenhum qr code encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.get("/single", async (req, res) => {
  try {
    const id = req.query.id;
    const newId = await normalizeId(id);
    await database.connection();
    const qr = await QRCode.findById(newId);

    if (qr) {
      res.status(200).json({ message: "Qr code encontrado", qr });
    } else {
      return res.status(404).json({ message: "Qr code não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.get("/teacher", async (req, res) => {
  try {
    const id = req.query.id;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user && user.type !== "aluno") {
      const qrs = await QRCode.find({ professor_id: newId });

      if (qrs.length === 1) {
        res
          .status(200)
          .json({ message: `${qrs.length} qr code encontrado`, qrs });
      } else if (qrs.length > 1) {
        res
          .status(200)
          .json({ message: `${qrs.length} qr codes encontrados`, qrs });
      } else {
        return res.status(404).json({ message: `Nenhum qr code encontrado` });
      }
    } else {
      return res.status(404).json({ message: "Professor não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const id = req.body.token;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user) {
      if (user.type !== "professor") {
        return res.status(401).json({ message: "Não é professor" });
      }

      const qrCodeOptions = {
        type: "svg",
        rendererOpts: {
          quality: 0.3,
        },
      };

      async function generateCode() {
        let code = Math.floor(100000 + Math.random() * 900000);

        while (await QRCode.exists({ code: code })) {
          code = Math.floor(100000 + Math.random() * 900000);
        }

        return code;
      }

      const newCode = await generateCode();

      const qrCodeData = JSON.stringify(newCode);

      qrCodeGen.toString(qrCodeData, qrCodeOptions, async (err, qrCodeSVG) => {
        if (err) {
          throw new Error("Erro ao gerar QR Code");
        }

        const qrObj = {
          professor_id: newId,
          qrcode: qrCodeSVG,
          code: newCode,
        };

        const qr = await QRCode.create(qrObj);
        const find = await QRCode.findById(qr.id);
        res.status(201).json({ message: "QR Code gerado", find });
      });
    } else {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.delete("/delete/single", async (req, res) => {
  try {
    const id = req.query.id;
    const newId = await normalizeId(id);
    await database.connection();
    const qr = await QRCode.findById(newId);

    if (qr) {
      await QRCode.findByIdAndDelete(qr.id);
      res.status(204).json({ message: "Qr code excluído" });
    } else {
      return res.status(404).json({ message: "Qr code não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.delete("/delete/teacher", async (req, res) => {
  try {
    const id = req.query.id;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user && user.type !== "aluno") {
      const qrs = await QRCode.find({ professor_id: newId });
      await QRCode.deleteMany({ professor_id: newId });

      if (qrs.length === 1) {
        res
          .status(204)
          .json({ message: `${qrs.length} qr code excluido`, qrs });
      } else if (qrs.length > 1) {
        res
          .status(204)
          .json({ message: `${qrs.length} qr codes excluidos`, qrs });
      } else {
        return res.status(404).json({ message: `Nenhum qr code encontrado` });
      }
    } else {
      return res.status(404).json({ message: "Professor não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

module.exports = router;
