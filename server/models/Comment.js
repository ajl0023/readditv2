const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var CommentSchema = new Schema({
  content: { type: String, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  comments: [this],
  depth: { type: Number },
  author: { type: Schema.Types.ObjectId, ref: "user", required: true },
  authorName: { type: String, required: false },
  postId: { type: Schema.Types.ObjectId, ref: "post", required: true },
  upVotes: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
  downVotes: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
  voteTotal: { type: Number, default: 0 },
  parentId: {
    type: String,
  },
});
const Comment = mongoose.model("comment", CommentSchema);
module.exports = Comment;
