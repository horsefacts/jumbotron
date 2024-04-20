import redis from "./redis.js";

export async function submit(castId: string) {
  await redis.set("cast", castId);
}
