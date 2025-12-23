
import React from "react";
import emperorImg from "../assets/card-emperor.jpg";
import slaveImg   from "../assets/card-slave.jpg";
import citizenImg from "../assets/card-citizen.jpg";

const IMG: Record<string,string> = { EMPEROR: emperorImg, SLAVE: slaveImg, CITIZEN: citizenImg };

export default function Card({ kind, disabled, selected, onClick }:{ kind:"EMPEROR"|"SLAVE"|"CITIZEN"; disabled?: boolean; selected?: boolean; onClick?:()=>void }){
  const glow = selected ? "0 0 0 3px rgba(248,241,223,.35), 0 10px 28px rgba(0,0,0,.55)" : "0 8px 26px rgba(0,0,0,.4)";
  const outline = selected ? "2px solid #f8f1df" : "1px solid rgba(255,255,255,.12)";

  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width:120, height:168, borderRadius:14, border:outline, background:"transparent", padding:0, cursor: disabled ? "not-allowed" : "pointer", boxShadow: glow, transition:"transform 80ms ease, box-shadow 120ms ease", transform: selected ? "translateY(-2px)" : "none" }}
      title={kind.toLowerCase()}
      aria-pressed={selected}
    >
      <img src={IMG[kind]} alt={kind.toLowerCase()} style={{ width:"100%", height:"100%", borderRadius:14, display:"block" }}/>
    </button>
  );
}
