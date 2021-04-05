import { schema } from "normalizr";
export const comment = new schema.Entity(
  "comments",
  {},
  { idAttribute: "_id" }
);
comment.define({
  comments: [comment],
});
export const post = new schema.Entity(
  "posts",
  {
    comments: [comment],
  },
  { idAttribute: "_id" }
);
