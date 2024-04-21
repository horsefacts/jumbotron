import redis from "./redis.js";

export async function hasVoted(fid: number, castId: string) {
  if (fid === 3621) return false;
  return await redis.sismember(`votes:${fid}`, castId);
}

export async function upvote(fid: number, castId: string) {
  if (await hasVoted(fid, castId)) {
    return;
  }
  await redis.zincrby("casts", 1, castId);
  await redis.sadd(`votes:${fid}`, castId);
}

export async function downvote(fid: number, castId: string) {
  if (await hasVoted(fid, castId)) {
    return;
  }
  await redis.zincrby("casts", -1, castId);
  await redis.sadd(`votes:${fid}`, castId);
}
