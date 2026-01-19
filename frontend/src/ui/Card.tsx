
import React from "react";
import emperorImg from "../assets/card-emperor.png";
import slaveImg   from "../assets/card-slave.png";
import citizenEmperorImg from "../assets/card-citizen-emperor.png";
import citizenSlaveImg from "../assets/card-citizen-slave.png";

const IMG: Record<string,string> = { EMPEROR: emperorImg, SLAVE: slaveImg };

type Side = "EMPEROR_SIDE" | "SLAVE_SIDE" | undefined;

export default function Card({ kind, side, disabled, selected, onClick }:{ kind:"EMPEROR"|"SLAVE"|"CITIZEN"; side?: Side; disabled?: boolean; selected?: boolean; onClick?:()=>void }){
  const glow = selected ? "0 0 0 3px rgba(248,241,223,.35), 0 10px 28px rgba(0,0,0,.55)" : "0 8px 26px rgba(0,0,0,.4)";
  const outline = selected ? "2px solid #f8f1df" : "1px solid rgba(255,255,255,.12)";
  const art = kind === "CITIZEN"
    ? (side === "SLAVE_SIDE" ? citizenSlaveImg : citizenEmperorImg)
    : IMG[kind];

  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width:120, height:168, borderRadius:14, border:outline, background:"transparent", padding:0, cursor: disabled ? "not-allowed" : "pointer", boxShadow: glow, transition:"transform 80ms ease, box-shadow 120ms ease", transform: selected ? "translateY(-2px)" : "none" }}
      title={kind.toLowerCase()}
      aria-pressed={selected}
    >
      <img src={art} alt={kind.toLowerCase()} style={{ width:"100%", height:"100%", borderRadius:14, display:"block" }}/>
    </button>
  );
}
