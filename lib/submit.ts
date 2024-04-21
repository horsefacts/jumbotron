import redis from "./redis.js";

export async function upvote(castId: string) {
  await redis.zincrby("casts", 1, castId);
}

export async function downvote(castId: string) {
  await redis.zincrby("casts", -1, castId);
}
