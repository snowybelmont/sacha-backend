const { Router } = require("express");
const router = Router();

const { normalizeId } = require("../utils/normalizeid");
const database = require("../utils/database");
const { User } = require("../models/users");

const { Scrap } = require("../utils/scrapping");
const bcrypt = require("bcrypt");

router.get("/all", async (req, res) => {
  try {
    await database.connection();
    const users = await User.find();

    if (users.length > 0) {
      const formattedData = users.map((user) => ({
        ID: user.id,
        Nome: user.name,
        Tipo: user.type,
        Foto: user.photo,
        Curso: user.curse,
        Periodo: user.periode,
        Classe: user.class,
      }));

      if (users.length === 1) {
        res.status(200).json({
          message: "1 usuário encontrado",
          formattedData,
        });
      } else {
        res.status(200).json({
          message: `${users.length} usuários encontrados`,
          formattedData,
        });
      }
    } else {
      return res.status(404).json({ message: "Nenhum usuário encontrado" });
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
    const user = await User.findById(newId);

    if (user) {
      const formattedData = {
        Nome: user.name,
        Tipo: user.type,
        Foto: user.photo,
        Curso: user.curse,
        Periodo: user.periode,
        Classe: user.class,
      };
      res.status(200).json({ message: "Usuário encontrado", formattedData });
    } else {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.get("/single/ra", async (req, res) => {
  try {
    const ra = req.query.ra;
    await database.connection();
    const user = await User.findOne({ RA: ra });

    if (user) {
      const formattedData = {
        Nome: user.name,
        Tipo: user.type,
        Foto: user.photo,
        Curso: user.curse,
        Periodo: user.periode,
        Classe: user.class,
      };
      res.status(200).json({ message: "Usuário encontrado", formattedData });
    } else {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.post("/createManual", async (req, res) => {
  try {
    await database.connection();
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      return res
        .status(409)
        .json({ message: "Um usuário com esse endereço de e-mail já existe" });
    } else {
      await User.create(req.body);
      res.status(201).json({ message: "Usúario criado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.post("/create", async (req, res) => {
  try {
    await database.connection();
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      const userData = await Scrap(req.body);

      if (userData === null) {
        throw new Error("Nenhum dado");
      }

      await User.create(userData);
      const data = await User.findOne({ email: req.body.email });
      res.status(201).json({ message: "Usuário criado", token: data.id });
    } else {
      const isPasswordCorrect = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Senha incorreta" });
      } else {
        if (req.body.type !== user.type) {
          if (req.body.type === "aluno") {
            return res.status(409).json({ message: "Tipo incorreto (aluno)" });
          } else if (req.body.type === "professor") {
            return res
              .status(409)
              .json({ message: "Tipo incorreto (professor)" });
          }
        } else {
          res
            .status(200)
            .json({ message: "Usuário encontrado", token: user.id });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

router.delete("/delete", async (req, res) => {
  try {
    const id = req.query.id;
    const newId = await normalizeId(id);
    await database.connection();
    const user = await User.findById(newId);

    if (user) {
      await User.findByIdAndDelete(user.id);
      res.status(204).json({ message: "Usuário excluído" });
    } else {
      return res.status(404).json({ message: "Usário não encontrado" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

module.exports = router;
