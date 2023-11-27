const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
  professor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  qrcode: { type: String, required: true },
  date_create: { type: Date, default: Date.now, required: true },
});

const QRCode = mongoose.models.QRCode || mongoose.model("QRCode", Schema);

module.exports = {
  QRCode,
};
