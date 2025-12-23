
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
      <div className="card-chip-label">{label}</div>
      {typeof count === "number" && <div className="card-chip-count">×{count}</div>}
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
    <div className="hero-stack">
      <h1 className="display">Emperor Citizen Slave</h1>
      <p className="lead">Host or join a room with a 4-letter code.</p>
      <div className="hero-name">
        <div className="input-label">Your Name</div>
        <input placeholder="Your Name" value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div className="hero-actions">
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

    <div className="rulebook">
      <div className="rulebook-header">
        <div>
          <div className="big">How Emperor Citizen Slave Works</div>
          <div className="muted">Roles, matchups, and what each hand looks like.</div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-block">
          <div className="info-title">Quick objective</div>
          <ul className="info-list">
            <li>Two players face off across four sets of three rounds each. The Emperor side wins with the single Emperor card but fears the Slave.</li>
            <li>The Slave side wins with the lone Slave card but loses to Citizen cards. Citizens outnumber everything.</li>
            <li>Each round, both players secretly choose a card. Reveal determines the winner instantly—there are no combos or turns.</li>
          </ul>
        </div>

        <div className="info-block">
          <div className="info-title">Roles &amp; hands</div>
          <HandExample
            title="Emperor Hand"
            flavor="One Haughty Emperor obeyed by four Citizens."
            cards={[
              { label: "Emperor", art: CARD_ART.EMPEROR, count: 1 },
              { label: "Citizen", art: CARD_ART.CITIZEN, count: 4 },
            ]}
          />
          <HandExample
            title="Slave Hand"
            flavor="One Desperate Slave emboldened by four Citizens."
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
                  <span className="matchup-arrow">dominates</span>
                  <CardPreview label="Citizen" art={CARD_ART.CITIZEN} />
                </div>
                <div className="matchup-note">Emperor crushes any Citizen.</div>
              </div>

              <div className="matchup-card">
                <div className="matchup-header">Slave vs Emperor</div>
                <div className="matchup-body">
                  <CardPreview label="Slave" art={CARD_ART.SLAVE} />
                  <span className="matchup-arrow">brutalizes</span>
                  <CardPreview label="Emperor" art={CARD_ART.EMPEROR} />
                </div>
                <div className="matchup-note">The Slave is the only card that can topple the Emperor.</div>
              </div>

              <div className="matchup-card">
                <div className="matchup-header">Citizen vs Slave</div>
                <div className="matchup-body">
                  <CardPreview label="Citizen" art={CARD_ART.CITIZEN} />
                  <span className="matchup-arrow">ostracizes</span>
                  <CardPreview label="Slave" art={CARD_ART.SLAVE} />
                </div>
                <div className="matchup-note">Any Citizen will overwhelm the Slave.</div>
              </div>

              <div className="matchup-card">
                <div className="matchup-header">Citizen vs Citizen</div>
                <div className="matchup-body">
                  <CardPreview label="Citizen" art={CARD_ART.CITIZEN} />
                  <span className="matchup-arrow">interlocutes</span>
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
            <li>Each set runs for three rounds, and a full match spans four sets. Win more rounds than your opponent, and the overall match goes to the player who wins the majority of sets.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>;
}
