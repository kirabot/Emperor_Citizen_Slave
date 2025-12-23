
import React, { useState } from "react";
import { socket } from "../api/socket";
import emperorImg from "../assets/card-emperor.jpg";
import slaveImg from "../assets/card-slave.jpg";
import citizenImg from "../assets/card-citizen.jpg";

const CARD_ART: Record<string, string> = {
  EMPEROR: emperorImg,
  SLAVE: slaveImg,
  CITIZEN: citizenImg,
};

type PreviewCard = {
  label: string;
  art: string;
  count?: number;
};

function CardPreview({ label, art, count }: PreviewCard){
  return (
    <div className="card-chip" aria-label={label}>
      <div className="card-chip-img" style={{ backgroundImage: `url(${art})` }} />
      <div className="card-chip-body">
        <div className="card-chip-label">{label}</div>
        {typeof count === "number" && <div className="card-chip-count">×{count}</div>}
      </div>
    </div>
  );
}

function HandExample({ title, cards, flavor }:{ title:string; flavor:string; cards: PreviewCard[] }){
  return (
    <div className="hand-visual">
      <div className="hand-visual-header">
        <div className="big">{title}</div>
        <div className="muted">{flavor}</div>
      </div>
      <div className="hand-visual-cards">
        {cards.map((c, idx) => (
          <CardPreview key={idx} {...c} />
        ))}
      </div>
    </div>
  );
}

export default function Lobby({ onReady }:{ onReady:(room:string, name:string, spectator?: boolean)=>void }){
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  return <div>
    <h2 className="big">E-Card (Guest)</h2>
    <p className="muted">No accounts needed. Share a 4-letter code with a friend.</p>
    <div className="row" style={{marginTop:12}}>
      <input placeholder="Your Name" value={name} onChange={e=>setName(e.target.value)} />
      <button disabled={!name} onClick={()=>{
        socket.emit("guest:create", { name }, ({ room }) => onReady(room, name, false));
      }}>Create Room</button>
    </div>
    <div className="sep"></div>
    <div className="row">
      <input placeholder="Enter Room Code" value={room} onChange={e=>setRoom(e.target.value.toUpperCase())} />
      <button disabled={!name || room.length < 4} onClick={()=>{
        socket.emit("guest:join", { room, name }, (res:any)=>{
          if (res?.error) alert(res.error); else onReady(room, name, res?.spectator);
        })
      }}>Join</button>
    </div>

    <div className="sep"></div>

    <div className="rulebook">
      <div className="rulebook-header">
        <div>
          <div className="big">How E-Card Works</div>
          <div className="muted">Roles, matchups, and what each hand looks like.</div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-block">
          <div className="info-title">Quick objective</div>
          <p className="info-text">Two players face off across several rounds. The Emperor side wins with the single Emperor card but fears the Slave. The Slave side wins with the lone Slave card but loses to Citizen cards.</p>
          <p className="info-text">Each round, both players secretly choose a card. Reveal determines the winner instantly—there are no combos or turns.</p>
        </div>

        <div className="info-block">
          <div className="info-title">Roles &amp; hands</div>
          <HandExample
            title="Emperor Hand"
            flavor="One Emperor backed by four Citizens."
            cards={[
              { label: "Emperor", art: CARD_ART.EMPEROR, count: 1 },
              { label: "Citizen", art: CARD_ART.CITIZEN, count: 4 },
            ]}
          />
          <HandExample
            title="Slave Hand"
            flavor="One desperate Slave supported by four Citizens."
            cards={[
              { label: "Slave", art: CARD_ART.SLAVE, count: 1 },
              { label: "Citizen", art: CARD_ART.CITIZEN, count: 4 },
            ]}
          />
        </div>
      </div>

      <div className="info-grid">
        <div className="info-block">
          <div className="info-title">Round results</div>
          <div className="matchup-grid">
            <div className="matchup-card">
              <div className="matchup-header">Emperor vs Citizen</div>
              <div className="matchup-body">
                <CardPreview label="Emperor" art={CARD_ART.EMPEROR} />
                <span className="matchup-arrow">overpowers</span>
                <CardPreview label="Citizen" art={CARD_ART.CITIZEN} />
              </div>
              <div className="matchup-note">Emperor crushes any Citizen.</div>
            </div>

            <div className="matchup-card">
              <div className="matchup-header">Slave vs Emperor</div>
              <div className="matchup-body">
                <CardPreview label="Slave" art={CARD_ART.SLAVE} />
                <span className="matchup-arrow">defeats</span>
                <CardPreview label="Emperor" art={CARD_ART.EMPEROR} />
              </div>
              <div className="matchup-note">The Slave is the only card that can topple the Emperor.</div>
            </div>

            <div className="matchup-card">
              <div className="matchup-header">Citizen vs Slave</div>
              <div className="matchup-body">
                <CardPreview label="Citizen" art={CARD_ART.CITIZEN} />
                <span className="matchup-arrow">beats</span>
                <CardPreview label="Slave" art={CARD_ART.SLAVE} />
              </div>
              <div className="matchup-note">Any Citizen will overwhelm the Slave.</div>
            </div>

            <div className="matchup-card">
              <div className="matchup-header">Citizen vs Citizen</div>
              <div className="matchup-body">
                <CardPreview label="Citizen" art={CARD_ART.CITIZEN} />
                <span className="matchup-arrow">ties</span>
                <CardPreview label="Citizen" art={CARD_ART.CITIZEN} />
              </div>
              <div className="matchup-note">Citizen mirror results in a draw.</div>
            </div>
          </div>
        </div>

        <div className="info-block">
          <div className="info-title">Flow of play</div>
          <ul className="info-list">
            <li>Pick your side: Emperor player gets one Emperor card; Slave player gets one Slave card. Both receive four Citizens.</li>
            <li>Select a card each round and lock it in. Once both are locked, cards are revealed and the result is recorded.</li>
            <li>Sets run for a fixed number of rounds. Win more rounds than your opponent, and the overall match goes to the player who wins the majority of sets.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>;
}
