const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  estudant_RA: { type: Number, required: true },
  professor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: { type: Number, required: true },
  fingerprint: { type: String, required: true },
  class: { type: String, required: true },
  date_create: { type: Date, default: Date.now, required: true },
});

const Presence = mongoose.models.Presence || mongoose.model("Presence", Schema);

module.exports = {
  Presence,
};
