
import React from "react";
import emperorImg from "../assets/card-emperor.jpg";
import slaveImg   from "../assets/card-slave.jpg";
import citizenImg from "../assets/card-citizen.jpg";

const IMG: Record<string,string> = { EMPEROR: emperorImg, SLAVE: slaveImg, CITIZEN: citizenImg };

export default function Card({ kind, disabled, onClick }:{ kind:"EMPEROR"|"SLAVE"|"CITIZEN"; disabled?: boolean; onClick?:()=>void }){
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width:120, height:168, borderRadius:14, border:"none", background:"transparent", padding:0, cursor: disabled ? "not-allowed" : "pointer", boxShadow:"0 6px 24px rgba(0,0,0,.35)" }}
      title={kind.toLowerCase()}>
      <img src={IMG[kind]} alt={kind.toLowerCase()} style={{ width:"100%", height:"100%", borderRadius:14, display:"block" }}/>
    </button>
  );
}
