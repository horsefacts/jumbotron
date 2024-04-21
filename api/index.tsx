import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { handle } from "frog/vercel";

import redis from "../lib/redis.js";
import { submit } from "../lib/submit.js";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "NEYNAR_FROG_FM";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";

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
    name: "Jumbotron Dev",
    icon: "star",
    action: {
      type: "post",
    },
  });
});

app.castAction("/submit", async (c) => {
  await submit(c.actionData.castId.hash);
  return c.res({ message: "OK" });
});

app.hono.get("/image/jumbotron", async (c) => {
  const hash = await redis.get("cast");
  return c.redirect(`https://client.warpcast.com/v2/cast-image?castHash=${hash}`);
});

app.frame("/", async (c) => {
  return c.res({
    imageAspectRatio: "1:1",
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
    },
    image: `${BASE_URL}/api/frame/image/jumbotron`,
    intents: [
      <Button action="/refresh">Refresh</Button>
      <Button action="/vote">Vote</Button>
      <Button action="/vote">Add action</Button>
    ],
  });
});

app.frame("/refresh", async (c) => {
  const hash = await redis.get("cast");
  return c.res({
    imageAspectRatio: "1:1",
    headers: {
      "cache-control": "public, max-age=0, must-revalidate",
    },
    image: `https://client.warpcast.com/v2/cast-image?castHash=${hash}`,
    intents: [
      <Button action="/refresh">Refresh</Button>
    ],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
