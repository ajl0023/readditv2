import React, { useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { newComment } from "../actions/commentActions";
import { changePoint, editPost } from "../actions/postActions";
import downvote, {
  ReactComponent as DownArrow,
} from "../images/down-arrow.svg";
import { ReactComponent as Edit } from "../images/edit.svg";
import upvote, { ReactComponent as UpArrow } from "../images/up-arrow.svg";
import Comment from "./Comment";
const PostModal = (props) => {
  const params = useParams();
  const dispatch = useDispatch();
  const history = useHistory();
  const [commentText, setCommentText] = useState("");
  const [edit, setEdit] = useState(false);
  const [editText, setEditText] = useState("");
  const currentUser = useSelector((state) => state.currentUser._id);
  const comments = useSelector((state) => {
    return state.comments.byId;
  });
  const loggedIn = useSelector((state) => state.login.isLoggedIn);
  let currentPost = props.post;
  const back = (e) => {
    e.stopPropagation();
  };
  const handleReroute = () => {
    history.push("/");
  };
  const handleSubmitComment = () => {
    dispatch(newComment(commentText, props.post._id));
    setCommentText("");
  };
  const handleUpvote = () => {
    if (loggedIn) {
      dispatch(changePoint(1, params.id));
    } else {
      props.handleShowLogin();
    }
  };
  const checkDisplay = useSelector((state) => {
    return state.display.display;
  });
  const handleDownVote = () => {
    if (loggedIn) {
      dispatch(changePoint(-1, params.id));
    } else {
      props.handleShowLogin();
    }
  };
  const handleEdit = () => {
    setEdit(true);
  };
  const handleCancelEdit = () => {
    setEdit(false);
  };
  const saveEdit = (id) => {
    dispatch(editPost(id, editText));
    setEdit(false);
  };
  if (!currentPost) {
    return <div></div>;
  }
  const date = new Date(currentPost.createdAt);
  const formatDate = new Intl.DateTimeFormat("en-US", {}).format(date);
  const commentsArr = [];
  const findAllComments = (currentComments) => {
    const dict = comments;
    for (let i = 0; i < currentComments.length; i++) {
      commentsArr.push(currentComments[i]);
      if (currentComments[i].comments.length > 0) {
        const nested = currentComments[i].comments.map((id) => {
          return comments[id];
        });
        findAllComments(nested);
      }
    }
    return [];
  };
  const postComments = currentPost.comments.map((id) => {
    return comments[id];
  });
  if (postComments.length > 0) {
    findAllComments(postComments);
  }
  return (
    <div
      onClick={handleReroute}
      className={`modal-wrapper ${checkDisplay === "dark" ? "dark-mode" : ""}`}
    >
      <input type="checkbox" id="trigger" className={"burger-input"} />
      <label
        htmlFor="trigger"
        className={`close-label ${
          checkDisplay === "dark" ? "dark-mode-burger" : ""
        }`}
      >
        <div onClick={handleReroute} className={"main-close-icon-container"}>
          <span className={"main-close-icon"}></span>
        </div>
      </label>
      <div
        onClick={back}
        className={`card-modal ${
          checkDisplay === "dark" ? "dark-mode-border" : ""
        }`}
      >
        {currentPost.author ? (
          <>
            <p className="card-modal-author">
              {" "}
              u/{currentPost.author.username}
            </p>
            <p
              className={`modal-date ${
                checkDisplay === "dark" ? "dark-mode-font" : ""
              }`}
            >
              {formatDate}
            </p>
            <h4
              className={`card-modal-title ${
                checkDisplay === "dark" ? "dark-mode-font" : ""
              }`}
            >
              {currentPost.title}
            </h4>
            {currentUser === currentPost.author._id ? (
              <div className="edit-container">
                <p
                  className={`card-modal-content ${edit ? "inactive" : null} `}
                >
                  {currentPost.content}
                </p>
                <textarea
                  onChange={(e) => {
                    setEditText(e.target.value);
                  }}
                  className={edit ? "edit-text-area" : "inactive"}
                  value={editText}
                ></textarea>
                <div className={edit ? `edit-button-container` : `inactive`}>
                  <button
                    onClick={() => saveEdit(currentPost._id)}
                    className="edit-submit-button"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="edit-cancel-button"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  className={`edit-button ${edit ? "inactive" : null}`}
                  onClick={handleEdit}
                >
                  <Edit />
                </button>
              </div>
            ) : null}
            <div className="post-image-container">
              <img className="post-image" src={props.post.image} alt="" />
            </div>
            {currentUser ? (
              <div className="new-comment-container">
                <textarea
                  className="new-comment"
                  name=""
                  id=""
                  placeholder="What are your thoughts?"
                  rows="6"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                ></textarea>
                <span className="submit-comment-container">
                  <button
                    onClick={() => {
                      handleSubmitComment();
                    }}
                    className="submit-comment-button"
                  >
                    Comment
                  </button>
                </span>
              </div>
            ) : (
              <div
                className={`no-user-comment-container ${
                  checkDisplay === "dark" ? "dark-mode-border" : ""
                } `}
              >
                <p className="no-user-comment">
                  Log in or sign up to leave a comment
                </p>
                <div className="auth-button-container">
                  <button
                    className={checkDisplay === "dark" ? "dark-mode" : ""}
                    onClick={props.handleShowLogin}
                  >
                    log in
                  </button>
                  <button onClick={props.handleShowSignup}>sign up</button>
                </div>
              </div>
            )}
            <div className="card-modal-vote-container">
              <li onClick={handleUpvote}>
                <UpArrow
                  className={
                    currentPost.voteState === 1
                      ? `vote-button-color`
                      : `${
                          checkDisplay === "dark"
                            ? "dark-mode-arrow"
                            : "vote-button"
                        }`
                  }
                  src={upvote}
                  alt=""
                />
              </li>
              <li className={checkDisplay === "dark" ? "dark-mode-font" : ""}>
                {currentPost.voteTotal}
              </li>
              <li onClick={handleDownVote}>
                <DownArrow
                  className={
                    currentPost.voteState === -1
                      ? `vote-button-color`
                      : `${
                          checkDisplay === "dark"
                            ? "dark-mode-arrow"
                            : "vote-button"
                        }`
                  }
                  src={downvote}
                  alt=""
                />
              </li>
            </div>
            <h4
              className={`comment-section-header ${
                checkDisplay === "dark" ? "dark-mode-font" : ""
              } `}
            >
              Comments
            </h4>
            <div className="main-comment-container">
              {console.log(commentsArr)}
              {commentsArr.map((comment) => {
                console.log(comment);
                return (
                  <Comment
                    allComments={comments}
                    handleShowLogin={props.handleShowLogin}
                    key={comment._id}
                    comment={comment}
                  />
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
function mapStateToProps(state, ownProps) {
  let id = ownProps.match.params.id;
  let post;
  post = state.posts.byId[id];
  return {
    post: post,
  };
}
export default connect(mapStateToProps)(PostModal);
