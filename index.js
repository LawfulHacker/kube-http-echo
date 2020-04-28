const express = require("express");
const fs = require("fs");
const os = require("os");
const ws = require("ws");

const app = express();
const wss = new ws.Server({ clientTracking: false, noServer: true });

const port = process.env.PORT || 5000;
const host = process.env.HOST || "0.0.0.0";

const router = express.Router();

app.set("json spaces", 2);

const kubernetesData = () => {
  let data = {};

  try {
    data.namespace = fs.readFileSync(
      "/var/run/secrets/kubernetes.io/serviceaccount/namespace",
      "utf8"
    );
  } catch (e) {}

  return data;
};

const dumpData = (req) => {
  return {
    method: req.method,
    httpVersion: req.httpVersion,
    path: req.path,
    query: req.query,
    url: req.url,
    localAddress: req.client.localAddress,
    localPort: req.client.localPort,
    remoteAddress: req.client.remoteAddress,
    remotePort: req.client.remotePort,
    headers: {
      ...req.headers,
    },
    kubernetes: {
      ...kubernetesData(),
    },
    environment: {
      ...process.env,
    },
    host: {
      hostname: os.hostname(),
    },
  };
};

router.use((req, res, next) => {
  res.json(dumpData(req));
});

app.use("/", router);

const server = app.listen(port, host, () =>
  console.log(`Listening at http://${host}:${port}`)
);

server.on("upgrade", function (request, socket, head) {
  wss.handleUpgrade(request, socket, head, function (ws) {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", function (ws) {
  ws.on("message", function (msg) {
    ws.send(msg);
  });
});

var signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
};

const shutdown = (signal, value) => {
  console.log("Shutting down...");
  server.close(() => {
    console.log(`Server stopped by ${signal}`);
    process.exit(128 + value);
  });
};

Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`Process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});
