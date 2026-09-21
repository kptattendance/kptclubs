import { createServer } from "https";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import next from "next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hostname = "local.clubs.kptmangaluru.in";
const port = 443;

const app = next({
  dev: true,
  hostname,
  port,
});

const handle = app.getRequestHandler();

await app.prepare();

const httpsOptions = {
  key: readFileSync(
    path.join(
      __dirname,
      "cert",
      "local.clubs.kptmangaluru.in-key.pem"
    )
  ),

  cert: readFileSync(
    path.join(
      __dirname,
      "cert",
      "local.clubs.kptmangaluru.in.pem"
    )
  ),
};

createServer(httpsOptions, async (req, res) => {
  try {
    await handle(req, res);
  } catch (error) {
    console.error("Error handling request:", error);

    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}).listen(port, hostname, () => {
  console.log("");
  console.log(`> Ready on https://${hostname}`);
  console.log("");
});