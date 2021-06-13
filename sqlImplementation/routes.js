const bcrypt = require("bcrypt");
module.exports = (app, db) => {
  app.get("/api/posts", (req, res) => {
    var sql = `
    select posts.*, votes.score as voteState, ( select sum(votes.score) from votes where votes.postid = posts._id  )as voteTotal, username
    FROM posts
    LEFT JOIN votes ON 
	  posts._id = votes.postid 
    LEFT JOIN users ON
    posts.author = users._id
    GROUP BY posts._id`;
    console.log(sql);
    db.query(sql, function (err, result) {
      if (err) throw err;
      res.json(result);
    });
  });
  app.post("/api/posts", (req, res) => {
    const postTabledata = `"${req.body.title}","${req.user}",uuid(),NOW(),"${req.body.content}", log10(1)* 86400 / .301029995663981 + UNIX_TIMESTAMP(posts.createdAt)`;
    console.log(`INSERT INTO posts (title,author,_id,createdAt,content,hotscore) VALUES (${postTabledata});
      SET @_id = uuid()
      SET @last = last_insert_id();
      SET @inserted = (SELECT posts._id FROM posts WHERE main_id = @last);
      INSERT INTO votes (_id,postid,authorid,score,uid) VALUES (@_id,@inserted,"${req.user}",1,CONCAT(${req.user},@_id));
      `);
    db.query(
      `INSERT INTO posts (title,author,_id,createdAt,content,hotscore) VALUES (${postTabledata});
      SET @_id = uuid();
      SET @last = last_insert_id();
      SET @inserted = (SELECT posts._id FROM posts WHERE main_id = @last);
      INSERT INTO votes (_id,postid,authorid,score,uid) VALUES (@_id,@inserted,"${req.user}",1,CONCAT("${req.user}",@_id));
      `,
      (err, result) => {
        res.json(result);
      }
    );
  });
  app.post("/api/comments", (req, res) => {
    const userid = req.user;
    const newComment = req.body;
    const sql = `
    SET @parent_depth = ${
      req.body.parentid
        ? `ifnull((SELECT depth from comments where _id = '${req.body.parentid}' ),0)+1;`
        : `${0};`
    }
    SET @_id = uuid();
    INSERT INTO comments (Author,CreatedAt,Content,_id,Postid,ParentId,depth)
    VALUES ("${userid}",NOW(),"${newComment.content}",@_id,"${
      newComment.postid
    }",${req.body.parentid ? `'${req.body.parentid}'` : null},@parent_depth );
    SET @last = last_insert_id();
   
    SET @inserted = (SELECT comments._id FROM comments WHERE main_id = @last);
    INSERT INTO votes (_id,commentid,authorid,score,uid) VALUES (@_id,@inserted,"${
      req.user
    }",1,CONCAT("${req.user}",@_id));
    `;
    console.log(sql);
    db.query(sql, function (err, result) {
      if (err) throw err;
      res.json(result);
    });
  });
  app.get("/api/comments/:id", (req, res) => {
    const postid = req.params.id;
    const commentsQuery = `
     
      SELECT comments.*,
      (SELECT sum(score) FROM votes WHERE commentid = comments._id) as voteTotal,
      (SELECT score FROM votes WHERE authorid = '${req.user}' AND commentid = comments._id) as voteState
      FROM
      comments 
      WHERE Postid = "${postid}"`;
    db.query(commentsQuery, function (err, comments) {
      res.json(comments);
    });
  });
  app.get("/api/posts/:id", (req, res) => {
    const postid = req.params.id;
    const sql = `
    SET @vote_total = (
    SELECT sum(score) AS voteTotal FROM votes
    WHERE postid = "${postid}");
    
    SELECT posts.*, votes.score AS voteState, @vote_total as voteTotal FROM posts
    LEFT JOIN votes 
    on votes.postid ="${postid}"
    AND votes.authorid = "${req.user}"
    WHERE posts._id = "${postid}"`;
    db.query(sql, function (err, post) {
      res.json(post && post[1] && post[1][0]);
    });
  });
  app.put("/api/voteup/:id", (req, res) => {
    const id = req.params.id;

    const sql = `
    update votes
    SET score = 
      CASE
        WHEN votes.score = 1 THEN 0
        WHEN votes.score = -1 THEN 1
        WHEN votes.score = 0 THEN 1
      END
    where authorid = '${req.user}' AND ${req.body.type} = "${id}" ;
INSERT IGNORE INTO votes
    SET ${req.body.type} = "${id}", authorid = '${
      req.user
    }', score = 1, _id = uuid(),uid = '${id + req.user}';
    ${
      req.body.type === "postid"
        ? `update posts
    SET hotscore = log10((select sum(votes.score) from votes where votes.${req.body.type} = "${id}")+1)* 86400 / .301029995663981 + UNIX_TIMESTAMP(posts.createdAt)
     WHERE _id = "${id}";`
        : ";"
    }
    `;
    console.log(sql);
    db.query(sql, function (err, resp) {
      res.json(resp);
    });
  });
  app.put("/api/votedown/:id", (req, res) => {
    const id = req.params.id;
    const sql = `
update votes
SET score = 
   CASE
    WHEN votes.score = 1 THEN -1
    WHEN votes.score = -1 THEN 0
    WHEN votes.score = 0 THEN -1
END
where authorid = '${req.user}' AND ${req.body.type} = "${id}" ;
INSERT IGNORE INTO votes
    SET ${req.body.type} = "${id}", authorid = '${
      req.user
    }', score = -1, _id = uuid(),uid = '${id + req.user}';
    ${
      req.body.type === "postid"
        ? `update posts
    SET hotscore = log10((select sum(votes.score) from votes where votes.${req.body.type} = "${id}")+1)* 86400 / .301029995663981 + UNIX_TIMESTAMP(posts.createdAt)
     WHERE _id = "${id}";`
        : ";"
    }


`;
    console.log(sql);
    db.query(sql, function (err, resp) {
      res.json(resp);
    });
  });
  app.put("/api/posts/:id", (req, res) => {
    const postid = req.params.id;
    const userid = req.user;
    const sql = `
      update posts
SET content =
    CASE
      WHEN posts.author = '${userid}' THEN '${req.body.text}'
    ELSE posts.content

END
WHERE _id = '${postid}'
        
`;
    db.query(sql, function (err, resp) {
      res.json(resp);
    });
  });
  app.post("/api/signup", async (req, res) => {
    const saltRounds = 10;
    const { username, password } = req.body;

    const genSalt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, genSalt);

    const sql = `
      INSERT INTO users (_id,password,createdAt,username) VALUES (uuid(),"${hash}",NOW(),'${username}')
    `;

    db.query(sql, function (err, resp) {
      res.json(resp);
    });
  });
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    const sql = `SELECT password FROM users 
    
    WHERE username = '${username}'`;

    db.query(sql, function (err, resp) {
      const hash = resp[0].password;
      bcrypt.compare(password, hash, (err, result) => {
        if (result) {
          res.json("success");
        }
        if (result === false) {
          res.json("Incorrect password of username");
        }
      });
    });
  });
};
