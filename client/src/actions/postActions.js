import axios from "axios";
import { normalize } from "normalizr";
import { post } from "../schemas";
import "cross-fetch/polyfill";

import {
  DELETE_POST,
  EDIT_POST,
  NEW_POST_REQUEST,
  NEW_POST_SUCCESS,
  NEXT_PAGE,
  POST_CREATION_CHANGE_SUBMISSION_TYPE,
  PREV_PAGE,
  RECEIVE_POSTS,
  RECEIVE_SINGLE_POSTS,
  REQUEST_POSTS,
  REQUEST_SINGLE_POST,
  RESET_POST,
  SET_POST,
  SET_POST_MODAL,
  SORT_POSTS,
  VOTE_CAST,
} from "../types";

function requestPosts(e) {
  return {
    type: REQUEST_POSTS,
    
  };
}
function submitPostSuccess(post) {
  let id = post._id;
  post["newPost"] = true;
  return (dispatch) => {
    dispatch({ type: NEW_POST_SUCCESS, post, id });
  };
}
export function newPostSubmissionType(postType) {
  return (dispatch) => {
    dispatch({ type: POST_CREATION_CHANGE_SUBMISSION_TYPE, postType });
  };
}
export function changePostSubmissionType(postType) {
  return (dispatch, getState) => {
    let currentValue = getState().changeNewSubmissionType.submissionType;
    if (postType === currentValue) {
      return;
    } else {
      dispatch({
        type: POST_CREATION_CHANGE_SUBMISSION_TYPE,
        postType,
      });
    }
  };
}
export function changePoint(point, postId) {
  return (dispatch, getState) => {
    let currentPostId = postId;
    let currentPost = getState().posts.byId[currentPostId];
    let currentVoteState = currentPost.voteState;
    dispatch({
      type: VOTE_CAST,
      postId,
      point,
      currentVoteState,
    });
    if (point === 1) {
      return axios({
        url: `/api/posts/vote-up/${currentPostId}`,
        method: "PUT",
        withCredentials: true,
      });
    }
    if (point === -1) {
      return axios({
        url: `/api/posts/vote-down/${currentPostId}`,
        method: "PUT",
        withCredentials: true,
      });
    }
  };
}
export function setPostModal(post) {
  return {
    type: SET_POST_MODAL,
    post,
  };
}
export function submitPostAttempt() {
  return {
    type: NEW_POST_REQUEST,
  };
}
export function submitPost(form) {
  return (dispatch) => {
    return axios({
      url: `/api/post/new/`,
      method: "POST",
      data: form,
      withCredentials: true,
    }).then((res) => {
      if (res.status === 200) {
        dispatch(submitPostSuccess(res.data));
      }
    });
  };
}
function requestSinglePost() {
  return {
    type: REQUEST_SINGLE_POST,
  };
}
export function reset() {
  return {
    type: RESET_POST,
  };
}
function getNormalizeData(myData, params) {
  const normalizedData = normalize(myData.posts, [post]);
  return normalizedData;
}
export function sortPosts() {}
export function deletePost(postId, params) {
  return (dispatch) => {
    dispatch({
      type: DELETE_POST,
      postId,
      params: params ? params : "default",
    });
    return axios({
      url: `/api/delete/${postId}`,
      method: "DELETE",
      withCredentials: true,
    });
  };
}
export function editPost(postId, content) {
  return (dispatch) => {
    dispatch({ type: EDIT_POST, postId, content });
    return axios({
      url: `/api/edit/${postId}`,
      method: "PUT",
      withCredentials: true,
      data: {
        content: content,
      },
    });
  };
}

export function fetchPosts(query, id, params, e) {
  return (dispatch) => {
    dispatch(requestPosts(e));
    return axios
      .get(
        `/api/posts/${params && params.sort ? params.sort : ""}${
          query ? `?${query}=${id}` : ""
        }`,
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        
        const normalizedData = getNormalizeData(
          { posts: res.data.posts },
          params
        );
      

        dispatch({
          type:
            params && params.sort && e === "click" ? SORT_POSTS : RECEIVE_POSTS,
          normalizedData,
          offset: res.data.offset,
          sort: params && params.sort ? params.sort : "default",
        });
        return res.data;
      });
  };
}
export function prevPage(id, params) {
  return (dispatch) => {
    dispatch(requestPosts());
    return new Promise((resolve) => {
      axios({
        url: `/api/posts/${
          params.length > 0 ? params : ""
        }?page[size]=${10}&before=${id}`,
        method: "GET",
        withCredentials: true,
      }).then((res) => {
        if (res.status === 200) {
          const normalizedData = getNormalizeData(
            { posts: res.data.posts },
            params
          );
          dispatch({
            type: PREV_PAGE,
            normalizedData,
            offset: res.data.offset,
            sort: params.sort ? params.sort : "default",
          });
          resolve("completed");
        }
      });
    });
  };
}
export function nextPage(id, params) {
  return (dispatch) => {
    dispatch(requestPosts());
    return new Promise((resolve) => {
      axios({
        url: `/api/posts/${
          params && params.sort ? params.sort : ""
        }?page[size]=${10}&after=${id}`,
        method: "GET",
        withCredentials: true,
      }).then((res) => {
        if (res.status === 200) {
          const normalizedData = getNormalizeData(
            { posts: res.data.posts },
            params
          );
          dispatch({
            type: NEXT_PAGE,
            normalizedData,
            offset: res.data.offset,
            sort: params.sort ? params.sort : "default",
          });
          resolve("completed");
        }
      });
    });
  };
}
export function setPostRange(before, after) {
  return { type: SET_POST, before, after };
}
export function fetchSinglePost(id) {
  return (dispatch) => {
    dispatch(requestSinglePost());
    return axios({
      url: `/api/post/${id}`,
      method: "GET",
      withCredentials: true,
    }).then((res) => {
      const normalizedData = getNormalizeData({ posts: [res.data] });
      dispatch({ normalizedData, type: RECEIVE_SINGLE_POSTS });
    });
  };
}
