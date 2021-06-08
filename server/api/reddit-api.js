const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");
const Comment = require("../models/Comment");
const User = require("../models/User");
const Post = require("../models/Post");
const checkQuery = async (req, sort) => {
  let query;
  let sortOrder;
  if (!sort) {
    sortOrder = {
      _id: 1,
    };
    if (req.query.after) {
      query = {
        _id: {
          $gt: req.query.after,
        },
      };
    }
  } else if (sort === "new") {
    const post = await Post.findById(req.query.after);
    sortOrder = {
      createdAt: -1,
    };
    if (req.query.after) {
      query = {
        createdAt: {
          $lt: post.createdAt,
        },
      };
    }
  } else if (sort === "top") {
    const post = await Post.findById(req.query.after);
    sortOrder = {
      topScore: -1,
    };
    if (req.query.after) {
      query = {
        topScore: {
          $lt: post.topScore,
        },
      };
    }
  } else if (sort === "hot") {
    const post = await Post.findById(req.query.after);
    sortOrder = {
      hotScore: -1,
    };
    if (req.query.after) {
      query = {
        hotScore: {
          $lt: post.hotScore,
        },
      };
    }
  }
  return {
    query,
    sortOrder,
  };
};
const checkVoteState = (posts, user, comment) => {
  if (posts) {
    posts.forEach((post) => {
      const { upVotes, downVotes } = post || comment;
      const upVotestoString = upVotes.map((id) => id.toString());
      const downVotestoString = downVotes.map((id) => id.toString());
      if (user && upVotestoString.includes(user._id)) {
        post.voteState = 1;
      } else if (user && downVotestoString.includes(user._id)) {
        post.voteState = -1;
      } else {
        post.voteState = 0;
      }
    });
    return posts;
  }
  if (comment) {
    const { upVotes, downVotes } = comment;
    const upVotestoString = upVotes.map((id) => id.toString());
    const downVotestoString = downVotes.map((id) => id.toString());
    if (user && upVotestoString.includes(user._id)) {
      comment.voteState = 1;
    } else if (user && downVotestoString.includes(user._id)) {
      comment.voteState = -1;
    } else {
      comment.voteState = 0;
    }
    return comment;
  }
};
const findComment = (comment, commentId) => {
  const { length } = comment;
  for (let i = 0; i < length; i++) {
    if (comment[i]._id.toString() === commentId) {
      return comment[i];
    }
    if (comment[i].comments.length > 0) {
      for (let j = 0; j < comment[i].comments.length; j++) {
        if (comment[i].comments[j]._id.toString() === commentId) {
          return comment[i].comments[j];
        }
        if (findComment(comment[i].comments[j].comments, commentId)) {
          return findComment(comment[i].comments[j].comments, commentId);
        }
      }
    }
  }
};
const calculateHotScore = (score, date) => {
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const order = Math.log(Math.max(Math.abs(score), 1)) / Math.LN10;
  const seconds = epochSeconds(date);
  const product = order + (sign * seconds) / 45000;
  return Math.round(product * 10000000) / 10000000;
};
const epochSeconds = (d) => d.getTime() / 1000 - 1134028003;
const voteUp = (post, user, foundComment) => {
  const { upVotes, downVotes } = post || foundComment;
  const upVotestoString = upVotes.map((id) => id.toString());
  const downVotestoString = downVotes.map((id) => id.toString());
  if (upVotestoString.includes(user._id)) {
    const upVoteIndex = upVotestoString.indexOf(user._id);
    upVotes.splice(upVoteIndex, 1);
  } else if (
    !upVotestoString.includes(user._id) &&
    !downVotestoString.includes(user._id)
  ) {
    upVotes.push(user._id);
  } else if (
    !upVotestoString.includes(user._id) &&
    downVotestoString.includes(user._id)
  ) {
    const downVoteIndex = downVotestoString.indexOf(user._id);
    downVotes.splice(downVoteIndex, 1);
    upVotes.push(user._id);
  }
};
const voteDown = (post, user, foundComment) => {
  const { upVotes, downVotes } = post || foundComment;
  const upVotestoString = upVotes.map((id) => id.toString());
  const downVotestoString = downVotes.map((id) => id.toString());
  if (downVotestoString.includes(user._id)) {
    const downVoteIndex = downVotestoString.indexOf(user._id);
    downVotes.splice(downVoteIndex, 1);
  } else if (
    !upVotestoString.includes(user._id) &&
    !downVotestoString.includes(user._id)
  ) {
    downVotes.push(user._id);
  } else if (
    upVotestoString.includes(user._id) &&
    !downVotestoString.includes(user._id)
  ) {
    const upVoteIndex = upVotestoString.indexOf(user._id);
    upVotes.splice(upVoteIndex, 1);
    downVotes.push(user._id);
  }
};
module.exports = (app) => {
  app.get("/api/posts", async (req, res) => {
    const { query, sortOrder } = await checkQuery(req);
    posts = await Post.find(query)
      .populate("author", "username")
      .limit(10)
      .sort(sortOrder)
      .lean();
    const check = await Post.find({
      _id: {
        $gt: posts[posts.length - 1]._id,
      },
    })
      .cursor()
      .next();
    const postsVote = checkVoteState(posts, req.user);
    res.json({
      posts: postsVote,
      offset: check ? posts[posts.length - 1]._id : null,
    });
  });
  app.get("/api/posts/new", async (req, res) => {
    const { query, sortOrder } = await checkQuery(req, "new");
    const posts = await Post.find(query)
      .populate("author", "username")
      .limit(20)
      .sort(sortOrder)
      .lean();
    const check = await Post.find({
      createdAt: {
        $lt: new Date(posts[posts.length - 1].createdAt),
      },
    })
      .cursor()
      .next();
    const postsVote = checkVoteState(posts, req.user);
    res.json({
      posts: postsVote,
      offset: check ? posts[posts.length - 1]._id : null,
    });
  });
  app.get("/api/posts/top", async (req, res) => {
    const { query, sortOrder } = await checkQuery(req, "top");
    const posts = await Post.find(query)
      .populate("author", "username")
      .limit(20)
      .sort(sortOrder)
      .lean();
    const check = await Post.find({
      topScore: {
        $lt: posts[posts.length - 1].topScore,
      },
    })
      .cursor()
      .next();
    const postsVote = checkVoteState(posts, req.user);
    res.json({
      posts: postsVote,
      offset: check ? posts[posts.length - 1]._id : null,
    });
  });
  app.get("/api/posts/hot", async (req, res) => {
    const { query, sortOrder } = await checkQuery(req, "hot");
    const posts = await Post.find(query)
      .populate("author", "username")
      .limit(20)
      .sort(sortOrder)
      .lean();
    const check = await Post.find({
      hotScore: {
        $lt: posts[posts.length - 1].hotScore,
      },
    })
      .cursor()
      .next();
    const postsVote = checkVoteState(posts, req.user);
    res.json({
      posts: postsVote,
      offset: check ? posts[posts.length - 1]._id : null,
    });
  });
  app.get("/api/post/:postid", async (req, res) => {
    const post = await Post.findById(req.params.postid)
      .populate("author", "username")
      .lean();
    const { user } = req;
    const postVote = checkVoteState([post], user, null);
    const commentVoteState = (comments, test) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]) {
          comments[i] = checkVoteState(null, user, comments[i]);
        }
        if (comments[i].comments.length > 0) {
          commentVoteState(comments[i].comments);
        }
      }
    };
    commentVoteState(post.comments);
    res.json(postVote[0]);
  });
  const upload = multer();
  app.post("/api/post/new", upload.single("file"), async (req, res) => {
    let locationUrl;
    AWS.config.setPromisesDependency();
    if (req.file) {
      const s3 = new AWS.S3();
      const params = {
        ACL: "public-read",
        Bucket: process.env.BUCKET_NAME,
        Body: fs.createReadStream(req.file.path),
        Key: `post/${req.file.originalname}`,
      };
      const upload = s3.upload(params).promise();
      locationUrl = await upload;
    }
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      createdAt: Date.now(),
      voteTotal: 1,
      author: req.user._id,
      image: locationUrl && locationUrl.Location,
      upVotes: [req.user._id],
      downVotes: [],
    });
    const postToObject = newPost.toObject();
    const score = 1;
    const hotScore = calculateHotScore(score, newPost.createdAt);
    postToObject.hotScore = hotScore;
    postToObject.voteTotal = score;
    postToObject.voteState = 1;
    postToObject.topScore =
      new Date(postToObject.createdAt).getTime() / Math.pow(10, 6);
    res.status(200).json(postToObject);
    await newPost.save();
  });
  app.put("/api/posts/vote-up/:id", async (req) => {
    const { user } = req;
    const postId = req.params.id;
    if (user) {
      const post = await Post.findById({ _id: postId });
      voteUp(post, user);
      const score = post.upVotes.length - post.downVotes.length;
      const hotScore = calculateHotScore(score, post.createdAt);
      post.hotScore = hotScore;
      post.voteTotal = score;
      post.topScore = new Date(post.createdAt).getTime() / Math.pow(10, 6);
      await post.save();
    }
  });
  app.put("/api/posts/vote-down/:id", async (req) => {
    const { user } = req;
    const postId = req.params.id;
    if (req.user) {
      const post = await Post.findById({ _id: postId });
      voteDown(post, user);
      const score = post.upVotes.length - post.downVotes.length;
      const hotScore = calculateHotScore(score, post.createdAt);
      post.hotScore = hotScore;
      post.voteTotal = score;
      post.topScore = new Date(post.createdAt).getTime() / Math.pow(10, 6);
      await post.save();
    }
  });
  app.put("/api/comment/vote-up", async (req) => {
    const { postId } = req.body;
    const { user } = req;
    const { commentId } = req.body;
    const post = await Post.findById(postId);
    const foundComment = findComment(post.comments, commentId);
    voteUp(null, user, foundComment);
    const score = foundComment.upVotes.length - foundComment.downVotes.length;
    foundComment.voteTotal = score;
    post.markModified("comments");
    await post.save();
  });
  app.put("/api/comment/vote-down", async (req) => {
    const { postId } = req.body;
    const { user } = req;
    const { commentId } = req.body;
    const post = await Post.findById(postId);
    const foundComment = findComment(post.comments, commentId);
    voteDown(null, user, foundComment);
    const score = foundComment.upVotes.length - foundComment.downVotes.length;
    foundComment.voteTotal = score;
    post.markModified("comments");
    await post.save();
  });
  app.post("/api/comment/new", async (req, res) => {
    const { postId } = req.body;
    const { user } = req;
    const newComment = new Comment({
      content: req.body.content,
      postId,
      author: user._id,
      depth: 0,
      upVotes: [req.user._id],
      voteTotal: 1,
      downVotes: [],
      createdAt: Date.now(),
      authorName: user.username,
    });
    const modified = newComment.toObject();
    modified.voteState = 1;
    const post = await Post.findById(postId);
    post.comments.push(newComment);
    await post.save();
    res.status(200).json(modified);
  });
  app.post("/api/comments/:commentId/replies", async (req, res) => {
    const { user } = req;
    const { postId } = req.body;
    const { commentId } = req.params;
    const post = await Post.findById(postId);
    const foundComment = findComment(post.comments, commentId);
    const newComment = new Comment({
      content: req.body.content,
      postId,
      depth: foundComment.depth + 1,
      author: user._id,
      upVotes: [req.user._id],
      voteTotal: 1,
      downVotes: [],
      createdAt: Date.now(),
      authorName: user.username,
    });
    const modified = newComment.toObject();
    modified.voteState = 1;
    foundComment.comments.push(newComment);
    post.markModified("comments");
    await post.save();
    res.status(200).json(modified);
  });
  app.post("/api/signup", (req, res) => {
    const saltRounds = 10;
    const { password } = req.body;
    User.find({ username: req.body.username }, (err, result) => {
      if (result.length === 0) {
        bcrypt.genSalt(saltRounds, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {
            const newUser = new User({
              username: req.body.username,
              password: hash,
              createdAt: Date.now(),
            });
            newUser.save().then(res.json("done"));
          });
        });
      } else {
        res.status(409).json("Username already taken");
      }
    });
  });
  app.post("/api/login", (req, res) => {
    User.findOne({ username: req.body.username }).then((user) => {
      if (user) {
        const hash = user.password;
        const { password } = req.body;
        bcrypt.compare(password, hash).then((result) => {
          if (!result) {
            res.status(401).json("Unauthorized");
          } else {
            const token = jwt.sign(
              {
                _id: user._id,
                username: user.username,
              },
              process.env.ACCESS_TOKEN,
              { expiresIn: 1.2 * Math.pow(10, 6) }
            );
            const refreshToken = jwt.sign(
              { _id: user._id, username: user.username },
              process.env.REFRESH_TOKEN,
              {
                expiresIn: "60 days",
              }
            );
            res.cookie("refresh", refreshToken, {
              maxAge: 365 * 24 * 60 * 60 * 1000,
            });
            res.json({
              jwt_token: token,
              username: user.username,
              _id: user._id,
            });
          }
        });
      } else {
        res.status(401).json("Unauthorized");
      }
    });
  });
  app.post("/api/refresh", (req, res) => {
    if (!req.cookies.refresh) {
      res.status(403);
    }
    const refreshToken = req.cookies.refresh;
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "unauth" : err.message;
        res.status(403).json({ err: message });
      } else {
        const token = jwt.sign(
          { _id: payload, username: payload.username },
          process.env.ACCESS_TOKEN,
          { expiresIn: 1.2 * Math.pow(10, 6) }
        );
        res.json({
          jwt_token: token,
          _id: payload._id,
          username: payload.username,
        });
      }
    });
  });
  app.post("/api/logout", (req, res, next) => {
    res.clearCookie("refresh");
    res.status(200).json("logged out");
  });
  app.get("/api/logged-in", (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    if (!req.cookies.refresh) {
      res.status(403).json("refresh token expired");
    } else {
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, data) => {
        if (err) {
          const message =
            err.name === "JsonWebTokenError" ? "unauth" : err.message;
          res.status(403).json({
            error: message,
          });
        } else {
          res.json({ username: data.username, _id: data._id });
        }
      });
    }
  });
  app.delete("/api/delete/:postId", (req, res) => {
    const currentId = req.params.postId;
    const user = req.user._id.toString();
    Post.findById(currentId).then((post) => {
      const stringedAuthor = post.author.toString();
      if (stringedAuthor === user) {
        Post.deleteOne({ _id: currentId }, (err) => {
          if (err) {
          } else {
          }
        });
      }
    });
    res.json("deleted");
  });
  app.put("/api/edit/:postId", async (req, res) => {
    const { postId } = req.params;
    const { user } = req;
    const post = await Post.findById(postId);
    const postAuthorString = post.author._id.toString();
    if (postAuthorString === user._id) {
      post.content = req.body.content;
      await post.save();
      res.status(200).json("updated");
    }
  });
};
