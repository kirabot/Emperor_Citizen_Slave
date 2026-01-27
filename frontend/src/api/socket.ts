
import { io, Socket } from "socket.io-client";

const fallbackBackendUrl = window.location.port
  ? `${window.location.protocol}//${window.location.hostname}:2456`
  : window.location.origin;

const desktopBackendUrl = window.ECARD_DESKTOP?.backendUrl?.trim();

export const socket: Socket = io(
  desktopBackendUrl || import.meta.env.VITE_BACKEND_URL || fallbackBackendUrl,
  {
    transports: ["websocket"]
  }
);
