/**
 * Custom HTTPS dev server untuk akses LAN dengan SSL.
 * Jalankan dengan: npm run dev:https
 */
const https = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.HTTPS_PORT || "3000", 10);
const HOSTNAME = "0.0.0.0";

const certPath = path.join(__dirname, "certs/local-cert.pem");
const keyPath = path.join(__dirname, "certs/local-key.pem");

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error("\n❌  Sertifikat SSL tidak ditemukan di folder certs/");
  console.error("   Jalankan dulu: npm run gen-certs\n");
  process.exit(1);
}

const app = next({ dev: true, hostname: HOSTNAME, port: PORT });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  https
    .createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    })
    .listen(PORT, HOSTNAME, () => {
      const interfaces = require("os").networkInterfaces();
      let lanIp = "";
      for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
          if (alias.family === "IPv4" && !alias.internal) {
            lanIp = alias.address;
            break;
          }
        }
        if (lanIp) break;
      }
      console.log(`\n  ▲ Next.js (HTTPS Dev Server)`);
      console.log(`  - Local:   https://localhost:${PORT}`);
      if (lanIp) console.log(`  - Network: https://${lanIp}:${PORT}`);
      console.log("");
    });
});
