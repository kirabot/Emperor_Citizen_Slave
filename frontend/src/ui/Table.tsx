
import React, { useEffect, useMemo, useState } from "react";
import { socket } from "../api/socket";
import Card from "./Card";
import emperorImg from "../assets/card-emperor.jpg";
import slaveImg   from "../assets/card-slave.jpg";
import citizenImg from "../assets/card-citizen.jpg";

type Player = { id: string; name: string; role?: "EMPEROR_SIDE" | "SLAVE_SIDE" };

const IMG: Record<string, string> = { EMPEROR: emperorImg, SLAVE: slaveImg, CITIZEN: citizenImg };

type HistoryCardProps = { card: "EMPEROR" | "SLAVE" | "CITIZEN"; result: "win" | "loss" | "draw"; label?: string };

function HistoryCard({ card, result, label }: HistoryCardProps){
  return (
    <div className={`history-card ${result}`}>
      <div className="history-card-img" aria-label={card.toLowerCase()} role="img" style={{ backgroundImage: `url(${IMG[card]})` }} />
      <div className="history-card-label">
        <span className="history-card-name">{label || card.toLowerCase()}</span>
        <span className="history-card-outcome">{result}</span>
      </div>
    </div>
  );
}

export default function Table({ room, snap, youName }:{ room:string; snap:any; youName:string }){
  const players: Player[] = snap?.players || [];
  const you = players.find(p => p.id === snap?.you);
  const opp  = players.find(p => p.id !== snap?.you);

  const [opponentLocked, setOpponentLocked] = useState(false);
  const [pendingPick, setPendingPick] = useState<string | null>(null);
  useEffect(() => {
    const onLock = () => setOpponentLocked(true);
    socket.on("opponent:locked", onLock);
    return () => socket.off("opponent:locked", onLock);
  }, []);

  const hand: string[] = snap?.hand || [];
  const phase: "sets" | "tiebreak" | "done" | undefined = snap?.state?.phase;
  const setIdx: number = (snap?.state?.setIndex ?? 0) + 1;
  const inSet: number = snap?.state?.roundInSet ?? 1;
  const wins: Record<string, number> = snap?.state?.roundWins || {};
  const history: any[] = snap?.state?.history || [];
  const matchWinner: string | null | undefined = snap?.state?.matchWinner ?? null;
  const matchFlavor: string | null | undefined = snap?.state?.matchFlavor ?? null;

  const canStart = players.length === 2 && !snap?.state;
  const remaining = snap?.opponentRemaining || null;

  const youWins = wins[you?.id || ""] || 0;
  const oppWins = wins[opp?.id || ""] || 0;

  const roleLabel = (p?: Player) =>
    p?.role === "EMPEROR_SIDE" ? "emperor side" :
    p?.role === "SLAVE_SIDE" ? "slave side" : "unassigned";

  function start(){ socket.emit("game:start", { room }); }
  function play(card: string){
    if (yourPick || pendingPick) return;
    setPendingPick(card);
    socket.emit("game:pick", { room, card });
  }
  function rematch(){ socket.emit("game:rematch", { room }); }

  const yourPick = snap?.picks ? snap.picks[you?.id || ""] : null;
  const oppPick = snap?.picks ? snap.picks[opp?.id || ""] : null;
  const selectedPick = yourPick || pendingPick;
  const youPicked = Boolean(selectedPick);
  const opponentPicked = Boolean(oppPick);

  useEffect(() => {
    if (!yourPick) return;
    setPendingPick(yourPick);
  }, [yourPick]);

  useEffect(() => {
    setPendingPick(null);
    setOpponentLocked(false);
  }, [history.length, snap?.state?.phase, snap?.state?.setIndex, snap?.state?.roundInSet]);

  useEffect(() => {
    if (!opponentPicked) setOpponentLocked(false);
  }, [opponentPicked]);

  const lockHint = useMemo(() => {
    if (youPicked && opponentPicked) return "both players locked in.";
    if (youPicked && !opponentPicked) return "you locked in — waiting for opponent...";
    if (!youPicked && (opponentPicked || opponentLocked)) return `${opp?.name || "opponent"} locked in — choose your card!`;
    return "";
  }, [youPicked, opponentPicked, opponentLocked, opp?.name]);

  const nameById = useMemo(() => {
    const map: Record<string,string> = {};
    for (const p of players) map[p.id] = p.name;
    return map;
  }, [players]);

  const groupedHistory = useMemo(() => {
    const groups: { key:string; set:number; round:number; entries:any[] }[] = [];
    for (const h of history) {
      const setNum = h.round?.set ?? 0;
      const roundNum = h.round?.inSet ?? 0;
      const key = `${setNum}-${roundNum}`;
      let group = groups.find(g => g.key === key);
      if (!group) {
        group = { key, set: setNum, round: roundNum, entries: [] };
        groups.push(group);
      }
      group.entries.push(h);
    }
    return groups.reverse();
  }, [history]);

  const historySection = (
    <div>
      <div className="muted">history:</div>
      {groupedHistory.length === 0 && <div className="history-empty">no rounds played yet.</div>}
      <div className="history-list">
        {groupedHistory.map((group, gIdx) => {
          const latestEntry = group.entries[group.entries.length - 1];
          const draw = !latestEntry.winnerId;
          const youWon = latestEntry.winnerId && latestEntry.winnerId === you?.id;
          const tone = draw ? "history-draw" : youWon ? "history-win" : "history-loss";

          return (
            <div key={group.key} className={`history-round-segment ${tone} ${gIdx === 0 ? "history-latest" : ""}`}>
              <div className="history-round-header">
                <div className="history-round-line" />
                <div className="history-round-label">ROUND {group.round} • SET {group.set}</div>
                <div className="history-round-line" />
              </div>
              <div className="history-hands-row">
                {group.entries.map((h:any, idx:number) => {
                  const isDraw = !h.winnerId;
                  const aResult = isDraw ? "draw" : (h.winnerId === h.a.id ? "win" : "loss");
                  const bResult = isDraw ? "draw" : (h.winnerId === h.b.id ? "win" : "loss");
                  const youWonThis = h.winnerId && h.winnerId === you?.id;
                  const resultLine = isDraw ? "draw" : youWonThis ? "you win" : `${opp?.name || "opponent"} wins`;
                  return (
                    <div key={idx} className="history-hand">
                      <div className="history-hand-cards">
                        <HistoryCard card={h.a.card} result={aResult} label={nameById[h.a.id] || "player"} />
                        <div className="history-versus">vs</div>
                        <HistoryCard card={h.b.card} result={bResult} label={nameById[h.b.id] || "player"} />
                      </div>
                      <div className="history-flavor">{h.flavor || "…"}</div>
                      <div className="history-result">{resultLine}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return <div>
    <div className="row" style={{justifyContent:"space-between"}}>
      <div className="row">
        <div className="pill">{you?.name || youName} • {roleLabel(you)}</div>
        <div className="pill">{opp?.name || "waiting..."} • {roleLabel(opp)}</div>
      </div>
      {!snap?.state && <button disabled={!canStart} onClick={start}>start</button>}
    </div>

    <div className="sep"></div>

    {snap?.state && <>
      <div className="row" style={{justifyContent:"space-between"}}>
        <div>{phase==="tiebreak" ? "sudden death" : `set ${setIdx} / 4 • round ${inSet} / 3`}</div>
        <div>rounds won: {youWins} – {oppWins}</div>
      </div>

      <div className="sep"></div>

      {matchWinner ? (
        <div className="big">
          {matchFlavor || `match over — ${(matchWinner===you?.id) ? "you" : (opp?.name || "opponent")} win.`}
          <div className="row" style={{marginTop:12}}>
            <button onClick={rematch}>rematch</button>
          </div>
          <div className="sep"></div>
          {historySection}
        </div>
      ) : (
        <>
          <div className="muted">your hand:</div>
          {lockHint && <div className={`muted lock-hint ${opponentPicked || opponentLocked ? "lock-alert" : ""}`} style={{ marginTop: 6 }}>{lockHint}</div>}
          <div className="hand" style={{gap:16}}>
            {hand.map((c, i)=>(
              <Card key={i} kind={c as any} selected={selectedPick === c} disabled={Boolean(selectedPick)} onClick={()=>play(c)} />
            ))}
          </div>

          <div className="sep"></div>
          <div className="muted">opponent remaining (counts): {remaining ? `E:${remaining.EMPEROR} S:${remaining.SLAVE} C:${remaining.CITIZEN}` : "?"}</div>
          <div className="sep"></div>

          {historySection}
        </>
      )}
    </>}
  </div>;
}
