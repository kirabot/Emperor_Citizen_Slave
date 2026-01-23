const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ECARD_DESKTOP", {
  backendUrl: process.env.BACKEND_URL || ""
});
