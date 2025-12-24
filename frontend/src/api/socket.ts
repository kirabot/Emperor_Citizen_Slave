
import { io, Socket } from "socket.io-client";

const fallbackBackendUrl = window.location.port
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : window.location.origin;

export const socket: Socket = io(import.meta.env.VITE_BACKEND_URL || fallbackBackendUrl, {
  transports: ["websocket"]
});
