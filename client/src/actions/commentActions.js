import axios from "axios";
import {
  NEW_COMMENT_REQUEST,
  NEW_COMMENT_SUCCESS,
  NEW_REPLY_REQUEST,
  NEW_REPLY_SUCCESS,
  VOTE_CAST,
} from "../types";
export function newCommentRequest() {
  return {
    type: NEW_COMMENT_REQUEST,
  };
}
function newCommentSuccess(savedComment, postId, parentId) {
  return (dispatch, getState) => {
    dispatch({
      type: NEW_COMMENT_SUCCESS,
      savedComment,
      postId,
      parentId,
    });
  };
}
export function newComment(content, postId) {
  return (dispatch, getState) => {
    dispatch(newCommentRequest());
    return axios({
      url: "/api/comment/new",
      method: "POST",
      data: {
        content,
        postId,
      },
      withCredentials: true,
    }).then((res) => {
      dispatch(newCommentSuccess(res.data, postId));
    });
  };
}
export function newReplyRequest() {
  return {
    type: NEW_REPLY_REQUEST,
    test: {},
  };
}
export function test(test) {
  return (dispatch, getState) => {
    dispatch(test.push("sdfsdf"));
  };
}
export function changeCommentPoint(point, postId, commentId) {
  return (dispatch, getState) => {
    const currentCommentId = commentId;
    const currentComment = getState().comments.byId[currentCommentId];
    const currentVoteState = currentComment.voteState;
    dispatch({
      type: VOTE_CAST,
      point,
      commentId,
      currentVoteState,
    });
    if (point === 1) {
      axios({
        url: "/api/comment/vote-up",
        method: "PUT",
        data: {
          postId,
          commentId,
        },
        withCredentials: true,
      });
    } else if (point === -1) {
      axios({
        url: "/api/comment/vote-down",
        method: "PUT",
        data: {
          postId,
          commentId,
        },
        withCredentials: true,
      });
    }
  };
}
export function newReply(content, postId, commentId) {
  return (dispatch, getState) =>
    axios({
      url: `/api/comments/${commentId}/replies`,
      method: "POST",
      data: {
        content,
        postId,
      },
      withCredentials: true,
    }).then((res) => {
      dispatch({
        type: NEW_REPLY_SUCCESS,
        reply: res.data,
        postId,
        commentId,
      });
    });
}
