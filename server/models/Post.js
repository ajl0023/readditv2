const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Comment = require("./Comment");
var mongoosePaginate = require("mongoose-paginate");

const PostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  image: { type: String },
  subreddit: { type: String },
  comments: [Comment.schema],
  author: { type: Schema.Types.ObjectId, ref: "user", required: true },
  upVotes: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
  downVotes: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
  voteTotal: { type: Number, default: 0 },
  hotScore: { type: Number, default: 0 },
  topScore: { type: Number, default: 0 },
});
PostSchema.plugin(mongoosePaginate);

PostSchema.methods.getHotScore = function getHotScore() {
  return (this.hotScore = 323);
};
const Post = mongoose.model("post", PostSchema);

module.exports = Post;
