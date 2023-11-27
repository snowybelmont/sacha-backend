require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = process.env.PORT;

const userController = require("./controllers/user");
const qrController = require("./controllers/qr");

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Permitir solicitações de qualquer origem
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(bodyParser.json());
app.use("/users", userController);
app.use("/qrcode", qrController);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
