
import React from "react";
import { socket } from "../api/socket";
import Card from "./Card";

type Player = { id: string; name: string; role?: "EMPEROR_SIDE" | "SLAVE_SIDE" };

export default function Table({ room, snap, youName }:{ room:string; snap:any; youName:string }){
  const players: Player[] = snap?.players || [];
  const you = players.find(p => p.id === snap?.you);
  const opp  = players.find(p => p.id !== snap?.you);

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
  function play(card: string){ socket.emit("game:pick", { room, card }); }
  function rematch(){ socket.emit("game:rematch", { room }); }

  const yourPick = snap?.picks ? snap.picks[you?.id || ""] : null;
  const oppPick = snap?.picks ? snap.picks[opp?.id || ""] : null;
  const lockHint = yourPick && !oppPick ? "waiting for opponent..." : (!yourPick && oppPick ? "opponent locked" : "");

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
        </div>
      ) : (
        <>
          <div className="muted">your hand:</div>
          {lockHint && <div className="muted" style={{ marginTop: 6 }}>{lockHint}</div>}
          <div className="hand" style={{gap:16}}>
            {hand.map((c, i)=>(
              <Card key={i} kind={c as any} onClick={()=>play(c)} />
            ))}
          </div>

          <div className="sep"></div>
          <div className="muted">opponent remaining (counts): {remaining ? `E:${remaining.EMPEROR} S:${remaining.SLAVE} C:${remaining.CITIZEN}` : "?"}</div>
          <div className="sep"></div>

          <div>
            <div className="muted">history:</div>
            <div className="grid">
              {history.map((h:any, idx:number)=>(
                <div key={idx} className="pill">
                  {h.round?.set ? `s${h.round.set} r${h.round.inSet}` : "r?"}: {h.flavor || "…"}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>}
  </div>;
}
