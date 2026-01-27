const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ECARD_DESKTOP", {
  backendUrl: process.env.BACKEND_URL || "http://euclidean.ddns.net:2456"
});
