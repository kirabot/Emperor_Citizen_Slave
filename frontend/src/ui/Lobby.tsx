
import React, { useState } from "react";
import { socket } from "../api/socket";
import Rulebook from "./Rulebook";

export default function Lobby({ onReady }:{ onReady:(room:string, name:string, spectator?: boolean)=>void }){
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  return <div>
    <div className="hero-stack">
      <h1 className="display">Emperor Citizen Slave</h1>
      <p className="lead">Host or join a room with a 4-letter code.</p>
      <div className="hero-name hero-band">
        <div className="input-label">Your Name</div>
        <input placeholder="Your Name" value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div className="hero-actions hero-band">
        <button className="cta-button" disabled={!name} onClick={()=>{
          socket.emit("guest:create", { name }, ({ room }) => onReady(room, name, false));
        }}>Create Room</button>
        <div className="or-divider">or</div>
        <div className="join-panel">
          <div className="input-label">Enter a Room Code</div>
          <div className="row">
            <input placeholder="Room Code" value={room} onChange={e=>setRoom(e.target.value.toUpperCase())} />
            <button disabled={!name || room.length < 4} onClick={()=>{
              socket.emit("guest:join", { room, name }, (res:any)=>{
                if (res?.error) alert(res.error); else onReady(room, name, res?.spectator);
              })
            }}>Join</button>
          </div>
        </div>
      </div>
    </div>

    <div className="sep"></div>

    <Rulebook />
  </div>;
}
