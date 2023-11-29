const { Router } = require("express");
const router = Router();

const { normalizeId } = require("../utils/normalizeid");
const database = require("../utils/database");
const { QRCode } = require("../models/qr");
const { User } = require("../models/users");
const { Presence } = require("../models/presences");

router.get("/all", async (req, res) => {
  try {
    await database.connection();
    const presences = await Presence.find();

    if (presences.length > 0) {
      if (presences.length === 1) {
        res.status(200).json({
          message: "1 presença encontrada",
          presences,
        });
      } else {
        res.status(200).json({
          message: `${presences.length} presenças encontradas`,
          presences,
        });
      }
    } else {
      return res.status(404).json({ message: "Nenhuma presença encontrada" });
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
    const presence = await Presence.findById(newId);

    if (presence) {
      res.status(200).json({
        message: `1 presença encontrada`,
        presence,
      });
    } else {
      return res.status(404).json({ message: "Nenhuma presença encontrada" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.get("/single/ra", async (req, res) => {
  try {
    const id = req.query.id;
    const code = req.query.code;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const newCode = await QRCode.findOne({ code: code });

      const presence = await Presence.findOne({
        $and: [
          { estudant_RA: user.RA },
          { professor_id: newCode.professor_id },
          { date_create: { $gte: today } },
        ],
      });

      if (presence) {
        res.status(401).json({
          message: `1 presença encontrada`,
          presence,
        });
      } else {
        res.status(200).json({ message: "Nenhuma presença encontrada" });
      }
    } else {
      return res.status(404).json({ message: "Usuário não encontrado" });
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
      const presences = await Presence.find({ professor_id: newId });

      if (presences.length === 1) {
        res
          .status(200)
          .json({ message: `${qrs.length} presença encontrada`, presences });
      } else if (presences.length > 1) {
        res.status(200).json({
          message: `${presences.length} presenças encontradas`,
          presences,
        });
      } else {
        return res.status(404).json({ message: `Nenhuma presença encontrada` });
      }
    } else {
      return res.status(404).json({ message: "Professor não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.get("/estudant", async (req, res) => {
  try {
    const id = req.query.id;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user && user.type !== "professor") {
      const presences = await Presence.find({ estudant_RA: user.RA });

      if (presences.length === 1) {
        res
          .status(200)
          .json({ message: `${qrs.length} presença encontrada`, presences });
      } else if (presences.length > 1) {
        res.status(200).json({
          message: `${presences.length} presenças encontradas`,
          presences,
        });
      } else {
        return res.status(404).json({ message: `Nenhuma presença encontrada` });
      }
    } else {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const id = req.body.token;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user) {
      const newCode = await QRCode.findOne({ code: req.body.code });

      const presenceObj = {
        estudant_RA: user.RA,
        professor_id: newCode.professor_id,
        code: newCode.code,
        fingerprint: req.body.fingerprint,
      };

      const presence = await Presence.create(presenceObj);
      const find = await Presence.findById(presence.id);
      res.status(201).json({ message: "Presença Registrada", find });
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
    const presence = await Presence.findById(newId);

    if (presence) {
      await Presence.findByIdAndDelete(presence.id);
      res.status(204).json({ message: "Presença excluída" });
    } else {
      return res.status(404).json({ message: "Presença não encontrada" });
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
      const presences = await Presence.find({ professor_id: newId });
      await Presence.deleteMany({ professor_id: newId });

      if (presences.length === 1) {
        res.status(204).json({
          message: `${presences.length} presença excluida`,
          presences,
        });
      } else if (presences.length > 1) {
        res.status(204).json({
          message: `${presences.length} presenças excluidas`,
          presences,
        });
      } else {
        return res.status(404).json({ message: `Nenhuma presença encontrada` });
      }
    } else {
      return res.status(404).json({ message: "Professor não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.delete("/delete/estudant", async (req, res) => {
  try {
    const id = req.query.id;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user && user.type !== "professor") {
      const presences = await Presence.find({ estudant_RA: user.RA });
      await Presence.deleteMany({ estudant_RA: user.RA });

      if (presences.length === 1) {
        res.status(204).json({
          message: `${presences.length} presença excluida`,
          presences,
        });
      } else if (presences.length > 1) {
        res.status(204).json({
          message: `${presences.length} presenças excluidas`,
          presences,
        });
      } else {
        return res.status(404).json({ message: `Nenhuma presença encontrada` });
      }
    } else {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

module.exports = router;
