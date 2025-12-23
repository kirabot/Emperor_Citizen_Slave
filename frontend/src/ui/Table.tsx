
import React, { useEffect, useMemo, useState } from "react";
import { socket } from "../api/socket";
import Card from "./Card";
import Rulebook from "./Rulebook";
import emperorImg from "../assets/card-emperor.jpg";
import slaveImg   from "../assets/card-slave.jpg";
import citizenImg from "../assets/card-citizen.jpg";

type Player = { id: string; name: string; role?: "EMPEROR_SIDE" | "SLAVE_SIDE" };

const IMG: Record<string, string> = { EMPEROR: emperorImg, SLAVE: slaveImg, CITIZEN: citizenImg };

type HistoryCardProps = { card: "EMPEROR" | "SLAVE" | "CITIZEN"; result: "win" | "loss" | "draw"; label?: string };

function HistoryCard({ card, result, label }: HistoryCardProps){
  const displayLabel = label || `${card.charAt(0)}${card.slice(1).toLowerCase()}`;
  const outcomeLabel = `${result.charAt(0).toUpperCase()}${result.slice(1)}`;
  return (
    <div className={`history-card ${result}`}>
      <div className="history-card-img" aria-label={card.toLowerCase()} role="img" style={{ backgroundImage: `url(${IMG[card]})` }} />
      <div className="history-card-label">
        <span className="history-card-name">{displayLabel}</span>
        <span className="history-card-outcome">{outcomeLabel}</span>
      </div>
    </div>
  );
}

export default function Table({ room, snap, youName, spectator }:{ room:string; snap:any; youName:string; spectator?: boolean }){
  const players: Player[] = snap?.players || [];
  const youId = snap?.you;
  const you = youId
    ? players.find(p => p.id === youId)
    : (!isSpectator ? (players.find(p => p.name === youName) || players[0]) : undefined);
  const opp  = players.find(p => p.id !== you?.id);
  const spectatorList: Player[] = (snap?.spectators || []) as Player[];
  const isSpectator = Boolean(spectator);

  const [opponentLocked, setOpponentLocked] = useState(false);
  const [pendingPick, setPendingPick] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
  const matchWinnerName = matchWinner ? players.find(p => p.id === matchWinner)?.name : null;
  const roundLabel = phase === "tiebreak" ? "Sudden Death" : `Set ${setIdx} / ${snap?.state?.totalSets || 4} • Round ${inSet} / ${snap?.state?.roundsPerSet || 3}`;

  const canStart = players.length === 2 && !snap?.state && !isSpectator;
  const remaining = snap?.opponentRemaining || null;

  const [leftSeat, rightSeat] = players;
  const leftWins = leftSeat ? wins[leftSeat.id] || 0 : 0;
  const rightWins = rightSeat ? wins[rightSeat.id] || 0 : 0;

  const roleLabel = (p?: Player) =>
    p?.role === "EMPEROR_SIDE" ? "Emperor Side" :
    p?.role === "SLAVE_SIDE" ? "Slave Side" : "Unassigned";

  function start(){ socket.emit("game:start", { room }); }
  function play(card: string, idx: number){
    if (isSpectator || yourPick || pendingPick) return;
    setPendingPick(card);
    setSelectedIndex(idx);
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
    setSelectedIndex(prev => {
      if (prev !== null && hand[prev] === yourPick) return prev;
      const idx = hand.findIndex(c => c === yourPick);
      return idx >= 0 ? idx : prev;
    });
  }, [yourPick, hand]);

  useEffect(() => {
    setPendingPick(null);
    setSelectedIndex(null);
    setOpponentLocked(false);
  }, [history.length, snap?.state?.phase, snap?.state?.setIndex, snap?.state?.roundInSet]);

  useEffect(() => {
    if (!opponentPicked) setOpponentLocked(false);
  }, [opponentPicked]);

  const lockHint = useMemo(() => {
    if (isSpectator) return "You are spectating this match.";
    if (youPicked && opponentPicked) return "Both players are locked in.";
    if (youPicked && !opponentPicked) return "You locked in — waiting for your opponent.";
    if (!youPicked && (opponentPicked || opponentLocked)) return `${opp?.name || "Opponent"} locked in — Choose your card.`;
    return "";
  }, [youPicked, opponentPicked, opponentLocked, opp?.name, isSpectator]);

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
      <div className="muted">History</div>
      {groupedHistory.length === 0 && <div className="history-empty">No rounds played yet.</div>}
      <div className="history-list">
        {groupedHistory.map((group, gIdx) => {
          const latestEntry = group.entries[group.entries.length - 1];
          const draw = !latestEntry.winnerId;
          const youWon = latestEntry.winnerId && latestEntry.winnerId === you?.id;
          const tone = draw ? "history-draw" : (you ? (youWon ? "history-win" : "history-loss") : "history-win");

          return (
            <div key={group.key} className={`history-round-segment ${tone} ${gIdx === 0 ? "history-latest" : ""}`}>
              <div className="history-round-header">
                <div className="history-round-line" />
                <div className="history-round-label">Set {group.set} • Round {group.round}</div>
                <div className="history-round-line" />
              </div>
              <div className="history-hands-row">
                {group.entries.map((h:any, idx:number) => {
                  const isDraw = !h.winnerId;
                  const aResult = isDraw ? "draw" : (h.winnerId === h.a.id ? "win" : "loss");
                  const bResult = isDraw ? "draw" : (h.winnerId === h.b.id ? "win" : "loss");
                  const youWonThis = h.winnerId && h.winnerId === you?.id;
                  const resultLine = isDraw ? "Draw" : (you ? (youWonThis ? "You Win" : `${opp?.name || "Opponent"} Wins`) : `${nameById[h.winnerId] || "Player"} Wins`);
                  return (
                    <div key={idx} className="history-hand">
                      <div className="history-hand-cards">
                        <HistoryCard card={h.a.card} result={aResult} label={nameById[h.a.id] || "Player"} />
                        <div className="history-versus">VS</div>
                        <HistoryCard card={h.b.card} result={bResult} label={nameById[h.b.id] || "Player"} />
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

  const spectatorCount = spectatorList.length;

  return <div>
    <div className="row" style={{justifyContent:"space-between"}}>
      <div className="row">
        <div className="pill">{you?.name || youName} • {roleLabel(you)}</div>
        <div className="pill">{opp?.name || "Awaiting Opponent"} • {roleLabel(opp)}</div>
        {spectatorCount > 0 && <div className="pill accent">{spectatorCount} Spectator{spectatorCount === 1 ? "" : "s"}</div>}
        {isSpectator && <div className="pill accent">Spectator</div>}
      </div>
      {!snap?.state && <button disabled={!canStart} onClick={start}>{canStart ? "Begin Match" : "Waiting..."}</button>}
    </div>

    <div className="sep"></div>

    {snap?.state ? (
      <>
        <div className="row" style={{justifyContent:"space-between"}}>
          <div>{roundLabel}</div>
          <div>Rounds Won: {(leftSeat?.name || "Player 1")} {leftWins} – {rightWins} {(rightSeat?.name || "Player 2")}</div>
        </div>

        <div className="sep"></div>

        {matchWinner ? (
          <div className="big">
            {matchFlavor || `Match Over — ${(matchWinner===you?.id) ? "You" : (matchWinnerName || "Opponent")} Win.`}
            <div className="row" style={{marginTop:12}}>
              {!isSpectator && <button onClick={rematch}>Request Rematch</button>}
            </div>
            <div className="sep"></div>
            {historySection}
          </div>
        ) : isSpectator ? (
          <>
            {lockHint && <div className={`muted lock-hint ${opponentPicked || opponentLocked ? "lock-alert" : ""}`} style={{ marginTop: 6 }}>{lockHint}</div>}
            <div className="muted">Live history updates below.</div>
            <div className="sep"></div>
            {historySection}
          </>
        ) : (
          <>
            <div className="muted">Your Hand</div>
            {lockHint && <div className={`muted lock-hint ${opponentPicked || opponentLocked ? "lock-alert" : ""}`} style={{ marginTop: 6 }}>{lockHint}</div>}
            <div className="hand" style={{gap:16}}>
              {hand.map((c, i)=>(
                <Card key={i} kind={c as any} selected={selectedIndex === i} disabled={Boolean(selectedPick)} onClick={()=>play(c, i)} />
              ))}
            </div>

            <div className="sep"></div>
            <div className="muted">Opponent Remaining (Counts): {remaining ? `E:${remaining.EMPEROR} S:${remaining.SLAVE} C:${remaining.CITIZEN}` : "?"}</div>
            <div className="sep"></div>

            {historySection}
          </>
        )}
      </>
    ) : (
      <>
        <div className="muted">Waiting for both players to be ready.</div>
        <div className="sep"></div>
        <Rulebook />
      </>
    )}
  </div>;
}
