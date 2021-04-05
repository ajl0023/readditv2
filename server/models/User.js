const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date },
  profileImg: {
    type: String,
  },
  updatedAt: { type: Date },
  sign: { type: String },
});
const User = mongoose.model("user", UserSchema);
module.exports = User;
