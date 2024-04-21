import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";

import redis from "../lib/redis.js";
import { upvote, downvote } from "../lib/votes.js";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "NEYNAR_FROG_FM";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const ACTION_URL = `${BASE_URL}/api/frame/submit`;
const INSTALL_URL = `https://warpcast.com/~/add-cast-action?url=${encodeURI(ACTION_URL)}`;

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api/frame",
  //hub: neynar({ apiKey: NEYNAR_API_KEY }),
  imageOptions: {
    height: 1200,
    width: 1200,
  },
});

app.hono.get("/submit", async (c) => {
  return c.json({
    name: "Jumbotron (exprmntl)",
    icon: "star",
    description: "Submit a cast to the Jumbotron",
    action: {
      type: "post",
    },
  });
});

app.castAction("/submit", async (c) => {
  await upvote(c.actionData.fid, c.actionData.castId.hash);
  return c.res({ message: "Sent to Jumbotron" });
});

app.hono.get("/image/jumbotron", async (c) => {
  const [hash] = await redis.zrevrange("casts_sorted", 0, 0);
  return c.redirect(
    `https://client.warpcast.com/v2/cast-image?castHash=${hash}`
  );
});

app.frame("/", async (c) => {
  return c.res({
    imageAspectRatio: "1:1",
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
    },
    image: `${BASE_URL}/api/frame/image/jumbotron`,
    intents: [
      <Button action="/refresh">🔄 Refresh</Button>,
      <Button action="/vote">🗳️ Vote</Button>,
      <Button.Link href={INSTALL_URL}>Add action</Button.Link>,
    ],
  });
});

app.frame("/refresh", async (c) => {
  const [hash] = await redis.zrevrange("casts_sorted", 0, 0);
  return c.res({
    imageAspectRatio: "1:1",
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
    },
    image: `https://client.warpcast.com/v2/cast-image?castHash=${hash}`,
    intents: [
      <Button action="/refresh">🔄 Refresh</Button>,
      <Button action="/vote">🗳️ Vote</Button>,
      <Button.Link href={INSTALL_URL}>Add action</Button.Link>,
    ],
  });
});

app.frame("/vote", async (c) => {
  const { buttonValue, frameData } = c;

  const [hash] = await redis.zrevrange("casts_sorted", 0, 0);

  if (frameData) {
    if (buttonValue === "upvote") {
      await upvote(frameData.fid, hash);
    } else if (buttonValue === "downvote") {
      await downvote(frameData.fid, hash);
    }
  }

  return c.res({
    imageAspectRatio: "1:1",
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
    },
    image: `https://client.warpcast.com/v2/cast-image?castHash=${hash}`,
    intents: [
      <Button action="/refresh">⬅️ Back</Button>,
      <Button value="upvote">👍 Upvote</Button>,
      <Button value="downvote">👎 Downvote</Button>,
    ],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
