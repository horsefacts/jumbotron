import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { neynar as neynarMiddleware } from "frog/middlewares";
import { handle } from "frog/vercel";

import redis from "../lib/redis.js";
import { submit } from "../lib/submit.js";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "NEYNAR_FROG_FM";

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  //hub: neynar({ apiKey: NEYNAR_API_KEY }),
  imageOptions: {
    height: 1200,
    width: 1200,
  },
}).use(
  neynarMiddleware({
    apiKey: NEYNAR_API_KEY,
    features: ["interactor"],
  })
);

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
  await submit(c.actionData.castIdrhash);
  return c.res({ message: "OK" });
});

app.frame("/", async (c) => {
  const hash = await redis.get("cast");
  return c.res({
    imageAspectRatio: "1:1",
    headers: {
      "cache-control": "public, max-age=10, must-revalidate",
    },
    image: (
      <div
        style={{
          alignItems: "center",
          background: "white",
          backgroundSize: "100% 100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexWrap: "nowrap",
          height: "100%",
          width: "100%",
          textAlign: "center",
          letterSpacing: "-0.05em",
          textTransform: "uppercase",
        }}
      >
        <img
          src={`https://client.warpcast.com/v2/cast-image?castHash=${hash}`}
          width="1200"
          height="1200"
        />
      </div>
    ),
    intents: [],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || import.meta.env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
