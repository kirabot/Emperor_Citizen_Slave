
import React, { useState } from "react";
import { socket } from "../api/socket";

export default function Lobby({ onReady }:{ onReady:(room:string, name:string)=>void }){
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  return <div>
    <h2 className="big">e-card (guest)</h2>
    <p className="muted">no accounts. share a 4-letter code with a friend.</p>
    <div className="row" style={{marginTop:12}}>
      <input placeholder="your name" value={name} onChange={e=>setName(e.target.value)} />
      <button disabled={!name} onClick={()=>{
        socket.emit("guest:create", { name }, ({ room }) => onReady(room, name));
      }}>create room</button>
    </div>
    <div className="sep"></div>
    <div className="row">
      <input placeholder="enter room code" value={room} onChange={e=>setRoom(e.target.value.toUpperCase())} />
      <button disabled={!name || room.length < 4} onClick={()=>{
        socket.emit("guest:join", { room, name }, (res:any)=>{
          if (res?.error) alert(res.error); else onReady(room, name);
        })
      }}>join</button>
    </div>
  </div>;
}
