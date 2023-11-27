const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  RA: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  type: { type: String, required: true },
  photo: { type: String, required: false },
  curse: { type: String, required: true },
  periode: { type: String, required: true },
  class: { type: Array, required: true },
});

const User = mongoose.models.User || mongoose.model("User", Schema);

module.exports = {
  User,
};
