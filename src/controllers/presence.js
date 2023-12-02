const { Router } = require("express");
const { DateTime } = require("luxon");
const router = Router();

const { normalizeId } = require("../utils/normalizeid");
const database = require("../utils/database");
const { QRCode } = require("../models/qr");
const { User } = require("../models/users");
const { Presence } = require("../models/presences");

router.get("/all", async (req, res) => {
  console.log("Me chamaram");
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

    const codesPerDay = {
      1: "11933",
      2: "11934",
      3: { 1: "11935", 2: "11938" },
      4: "11936",
      5: "11937",
    };

    const today = new Date().getDay();
    const expectedCode = codesPerDay[today];

    let index = null;

    if (today === 1 || today === 2 || today === 4 || today === 5) {
      index = user.class.findIndex((item) => item.startsWith(expectedCode));
    } else if (today === 3) {
      const subCodes = Object.values(expectedCode);
      const now = DateTime.local().setZone("America/Sao_Paulo");

      if (now.hour >= 19 && now.hour < 20 && now.minute <= 40) {
        index = user.class.findIndex((item) => item.startsWith(subCodes[1]));
      } else if (
        (now.hour === 20 && now.minute >= 50) ||
        (now.hour >= 21 && now.minute <= 59) ||
        (now.hour === 22 && now.minute <= 30)
      ) {
        index = user.class.findIndex((item) => item.startsWith(subCodes[2]));
      }
    }

    if (user) {
      const newCode = await QRCode.findOne({ code: req.body.code });

      const presenceObj = {
        estudant_RA: user.RA,
        professor_id: newCode.professor_id,
        code: newCode.code,
        fingerprint: req.body.fingerprint,
        class: user.class[index ?? 2].substring(8),
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

      if (presences.length === 1) {
        await Presence.deleteMany({ estudant_RA: user.RA });
        res.status(204).json({
          message: `${presences.length} presença excluida`,
          presences,
        });
      } else if (presences.length > 1) {
        await Presence.deleteMany({ estudant_RA: user.RA });
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

router.delete("/delete/info", async (req, res) => {
  try {
    const { data } = req.body;
    await database.connection();
    const students = await User.find({
      RA: { $in: data.map((entry) => entry.ra) },
    });
    const foundStudentRAs = students.map((student) => student.RA);
    const foundStudentRAsSet = new Set(foundStudentRAs.map(String));
    const filteredData = data.filter((entry) => {
      const entryRA = String(entry.ra);
      return foundStudentRAsSet.has(entryRA);
    });

    if (filteredData.length > 0) {
      const presences = await Presence.find({
        $or: filteredData.map((entry) => ({
          estudant_RA: entry.ra,
          code: entry.code,
          date_create: entry.date,
        })),
      });

      if (presences.length === 1) {
        await Presence.deleteMany({
          $or: filteredData.map((entry) => ({
            estudant_RA: entry.ra,
            code: entry.code,
            date_create: entry.date,
          })),
        });

        res.status(204).json({
          message: `${presences.length} presenças excluidas`,
          presences,
        });
      } else if (presences.length > 1) {
        await Presence.deleteMany({
          $or: filteredData.map((entry) => ({
            estudant_RA: entry.ra,
            code: entry.code,
            date_create: entry.date,
          })),
        });

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
