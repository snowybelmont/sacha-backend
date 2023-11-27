const mongoose = require("mongoose");
const URI = process.env.URI;

const connection = async () => {
  if (!global.mongoose) {
    mongoose.set("strictQuery", false);
    global.mongoose = await mongoose.connect(URI);
  }
};

module.exports = {
  connection,
};
