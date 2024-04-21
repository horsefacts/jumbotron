import redis from "./redis.js";

const DECAY_FACTOR = 0.7;

function calculateScore(votes: string, timestamp: string) {
  const age = (Date.now() - parseInt(timestamp)) / 3600000;
  return parseInt(votes) / Math.pow(age + 1, DECAY_FACTOR);
}

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

  let timestamp = await redis.zscore("casts_timestamp", castId);
  if (!timestamp) {
    timestamp = Date.now().toString();
    await redis.zadd("casts_timestamp", timestamp, castId);
  }

  const votes = await redis.zscore("casts", castId);

  if (timestamp && votes) {
    const score = calculateScore(votes, timestamp);
    await redis.zadd("casts_sorted", score, castId);
  }
}

export async function downvote(fid: number, castId: string) {
  if (await hasVoted(fid, castId)) {
    return;
  }
  await redis.zincrby("casts", -1, castId);
  await redis.sadd(`votes:${fid}`, castId);

  const timestamp = await redis.zscore("casts_timestamp", castId);
  if (!timestamp) {
    await redis.zadd("casts_timestamp", Date.now(), castId);
  }

  const votes = await redis.zscore("casts", castId);

  if (timestamp && votes) {
    const score = calculateScore(votes, timestamp);
    await redis.zadd("casts_sorted", score, castId);
  }
}
