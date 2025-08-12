
import React, { useEffect, useState } from "react";
import Lobby from "./Lobby";
import Table from "./Table";
import { socket } from "../api/socket";

type Player = { id:string; name:string; role?: "EMPEROR_SIDE" | "SLAVE_SIDE" }
type State = any;

export default function App(){
  const [room, setRoom] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [snap, setSnap] = useState<State|null>(null);

  useEffect(() => {
    const onState = (s:any)=> setSnap(s);
    const onUpdate = (r:any)=> setSnap(prev => prev ? { ...prev, ...r } : r);
    socket.on("state", onState);
    socket.on("room:update", onUpdate);
    return () => { socket.off("state", onState); socket.off("room:update", onUpdate); };
  }, []);

  if (!room) {
    return <div className="app">
      <div className="card">
        <Lobby onReady={(r,n)=>{ setRoom(r); setName(n); }} />
      </div>
    </div>;
  }

  return <div className="app">
    <div className="card">
      <div className="row" style={{justifyContent:"space-between"}}>
        <div className="row">
          <div className="pill">room {room}</div>
          <div className="pill">you: {name}</div>
        </div>
        <button onClick={()=>navigator.clipboard.writeText(room)}>copy code</button>
      </div>
      <div className="sep"></div>
      <Table room={room} snap={snap} youName={name} />
    </div>
  </div>;
}
