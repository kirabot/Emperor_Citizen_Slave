
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const ORIGIN = FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN;

app.use(cors({ origin: ORIGIN, credentials: false }));
app.get("/", (_req, res) => res.json({ ok: true, service: "ecard-backend" }));

const io = new Server(server, {
  cors: { origin: ORIGIN, methods: ["GET","POST"] }
});

const ROLES = ["EMPEROR_SIDE", "SLAVE_SIDE"];
const CARD = { EMPEROR: "EMPEROR", SLAVE: "SLAVE", CITIZEN: "CITIZEN" };
const SET_ROUNDS = 3;
const TOTAL_SETS = 4;

function playerName(room, id) {
  return room.players.find(p => p.id === id)?.name || "player";
}
function clashLine(aPick, bPick) {
  const pair = [aPick, bPick].sort().join("+");
  switch (pair) {
    case "CITIZEN+CITIZEN": return "two citizens glare. nothing happens.";
    case "CITIZEN+EMPEROR": return "the emperor tramples the citizen.";
    case "CITIZEN+SLAVE":   return "the citizen squashes the slave.";
    case "EMPEROR+SLAVE":   return "the emperor is BRUTALIZED by the slave.";
    default: return "it’s chaos.";
  }
}

function makeDeck(role) {
  if (role === "EMPEROR_SIDE") return [CARD.EMPEROR, CARD.CITIZEN, CARD.CITIZEN, CARD.CITIZEN, CARD.CITIZEN];
  return [CARD.SLAVE, CARD.CITIZEN, CARD.CITIZEN, CARD.CITIZEN, CARD.CITIZEN];
}

function redeal(room){
  const [p1, p2] = room.players;
  room.state.hands = {
    [p1.id]: makeDeck(p1.role),
    [p2.id]: makeDeck(p2.role)
  };
}
function flipRoles(room){
  const [p1, p2] = room.players;
  const tmp = p1.role; p1.role = p2.role; p2.role = tmp;
  redeal(room);
}
function push(room){
  for (const p of room.players) io.to(p.id).emit("state", tailoredState(room, p.id));
  io.to(room.code).emit("room:update", roomSnapshot(room));
}
function sendInitialState(room, socket, spectator){
  if (!room.state) return;
  if (spectator) {
    socket.emit("state", roomSnapshot(room));
    return;
  }
  socket.emit("state", tailoredState(room, socket.id));
}

const rooms = new Map();
function randomCode(){ return Math.random().toString(36).slice(2, 6).toUpperCase(); }

function roomSnapshot(room){
  if (!room.state) return { code: room.code, players: room.players.map(p=>({id:p.id,name:p.name,role:p.role})), spectators: room.spectators.map(s=>({id:s.id,name:s.name})), state:null };
  const s = room.state;
  return {
    code: room.code,
    players: room.players.map(p=>({id:p.id,name:p.name,role:p.role})),
    spectators: room.spectators.map(s=>({id:s.id,name:s.name})),
    state: {
      phase: s.phase,
      setIndex: s.setIndex,
      roundInSet: s.roundInSet,
      roundsPerSet: SET_ROUNDS,
      totalSets: TOTAL_SETS,
      roundWins: s.roundWins,
      history: s.history,
      matchWinner: s.matchWinner ?? null,
      matchFlavor: s.matchFlavor ?? null,
    }
  };
}
function tailoredState(room, forId){
  const snap = roomSnapshot(room);
  const myHand = room.state?.hands?.[forId] || [];
  const opp = room.players.find(p=>p.id!==forId);
  let oppCounts = null;
  if (opp && room.state?.hands?.[opp.id]) {
    const rem = room.state.hands[opp.id];
    const counts = { EMPEROR:0, SLAVE:0, CITIZEN:0 };
    for (const c of rem) counts[c]++;
    oppCounts = counts;
  }
  return { ...snap, you: forId, hand: myHand, opponentRemaining: oppCounts, picks: room.state?.picks ?? {} };
}

io.on("connection", (socket) => {
  socket.on("guest:create", ({ name }, cb) => {
    const code = randomCode();
    const room = { code, players: [{ id: socket.id, name: String(name||"guest") }], spectators: [], state: null };
    rooms.set(code, room);
    socket.join(code);
    cb?.({ room: code });
    io.to(code).emit("room:update", roomSnapshot(room));
  });

  socket.on("guest:join", ({ room: code, name }, cb) => {
    const room = rooms.get(String(code || "").toUpperCase());
    if (!room) return cb?.({ error: "room not found" });
    const entrant = { id: socket.id, name: String(name||"guest") };
    let spectator = false;
    if (room.players.length >= 2) {
      room.spectators.push(entrant);
      spectator = true;
    } else {
      room.players.push(entrant);
    }
    socket.join(room.code);
    cb?.({ ok: true, spectator });
    io.to(room.code).emit("room:update", roomSnapshot(room));
    sendInitialState(room, socket, spectator);
  });

  socket.on("game:start", ({ room: code }, cb) => {
    const room = rooms.get(code);
    if (!room) return;
    if (!room.players.some(p => p.id === socket.id)) return cb?.({ error: "only players can start" });
    if (room.players.length !== 2) return cb?.({ error: "need 2 players" });
    const [p1, p2] = room.players;
    if (Math.random() < 0.5) { p1.role = "EMPEROR_SIDE"; p2.role = "SLAVE_SIDE"; }
    else { p1.role = "SLAVE_SIDE"; p2.role = "EMPEROR_SIDE"; }

    room.state = {
      phase: "sets",
      setIndex: 0,
      roundInSet: 1,
      hands: {}, picks: { [p1.id]: null, [p2.id]: null },
      roundWins: { [p1.id]: 0, [p2.id]: 0 },
      history: [],
      matchWinner: null, matchFlavor: null,
      _resolving: false
    };
    redeal(room);
    push(room);
  });

  socket.on("game:pick", ({ room: code, card }, cb) => {
    const room = rooms.get(code);
    if (!room || !room.state) return;
    if (!room.players.some(p => p.id === socket.id)) return cb?.({ error: "spectators cannot play" });
    const myHand = room.state.hands[socket.id] || [];
    if (!myHand.includes(card)) return cb?.({ error: "card not in hand" });
    room.state.picks[socket.id] = card;
    cb?.({ ok: true });

    const other = room.players.find(p => p.id !== socket.id);
    if (!other) return;
    const aId = socket.id;
    const bId = other.id;
    const aPick = room.state.picks[aId];
    const bPick = room.state.picks[bId];

    if (!aPick || !bPick) { io.to(bId).emit("opponent:locked", true); return; }
    if (room.state._resolving) return;
    room.state._resolving = true;

    try {
      const emperorPlayerId = room.players.find(p => p.role === "EMPEROR_SIDE")?.id;
      const slavePlayerId   = room.players.find(p => p.role === "SLAVE_SIDE")?.id;

      const key = [aPick, bPick].sort().join("+");
      const outcome = {
        "CITIZEN+CITIZEN": { type: "draw" },
        "CITIZEN+EMPEROR": { type: "win", side: "emperor" },
        "CITIZEN+SLAVE":   { type: "win", side: "emperor" },
        "EMPEROR+SLAVE":   { type: "win", side: "slave" }
      }[key];

      if (!outcome) {
        room.state.picks[aId] = null; room.state.picks[bId] = null;
        return push(room);
      }

      const base = clashLine(aPick, bPick);

      const ha = room.state.hands[aId] || [];
      const hb = room.state.hands[bId] || [];
      const ia = ha.indexOf(aPick);
      const ib = hb.indexOf(bPick);
      if (ia >= 0) ha.splice(ia, 1);
      if (ib >= 0) hb.splice(ib, 1);

      if (outcome.type === "draw") {
        room.state.history.push({
          round: { set: room.state.setIndex + 1, inSet: room.state.roundInSet },
          a: { id: aId, card: aPick },
          b: { id: bId, card: bPick },
          winnerId: null,
          flavor: `${base} draw.`
        });
        room.state.picks[aId] = null;
        room.state.picks[bId] = null;

        const haLeft = (room.state.hands[aId] || []).length;
        const hbLeft = (room.state.hands[bId] || []).length;

        // out of cards ⇒ round ends as draw
        if (haLeft === 0 || hbLeft === 0) {
          if (room.state.phase === "tiebreak") {
            // sudden death but draw: redeal and try again until someone wins
            room.state.roundInSet = 1;
            redeal(room);
            return push(room);
          }

          // normal sets flow (same as decisive end, but no win added)
          if (room.state.roundInSet < SET_ROUNDS) {
            room.state.roundInSet += 1;
            redeal(room);
            return push(room);
          }

          if (room.state.setIndex < TOTAL_SETS - 1) {
            room.state.setIndex += 1;
            room.state.roundInSet = 1;
            flipRoles(room); // includes redeal
            return push(room);
          }

          // end of all sets → decide winner or go to tiebreak
          const [p1, p2] = room.players;
          const w1 = room.state.roundWins[p1.id] || 0;
          const w2 = room.state.roundWins[p2.id] || 0;
          if (w1 !== w2) {
            const matchWinner = (w1 > w2) ? p1.id : p2.id;
            room.state.matchWinner = matchWinner;
            room.state.matchFlavor = `Match Over — ${playerName(room, matchWinner)} wins ${w1}-${w2}.`;
            room.state.phase = "done";
            return push(room);
          } else {
            // tie → sudden death, one decisive round (repeat if drawn)
            if (Math.random() < 0.5) { p1.role = "EMPEROR_SIDE"; p2.role = "SLAVE_SIDE"; }
            else { p1.role = "SLAVE_SIDE"; p2.role = "EMPEROR_SIDE"; }
            room.state.phase = "tiebreak";
            room.state.roundInSet = 1;
            redeal(room);
            return push(room);
          }
        }

        // still have cards → continue same round
        return push(room);
      }

      const winnerId = outcome.side === "emperor" ? emperorPlayerId : slavePlayerId;
      const winName = playerName(room, winnerId);
      room.state.history.push({
        round: { set: room.state.setIndex + 1, inSet: room.state.roundInSet },
        a: { id: aId, card: aPick }, b: { id: bId, card: bPick },
        winnerId, flavor: `${base} ${winName} wins.`
      });

      if (!(winnerId in room.state.roundWins)) room.state.roundWins[winnerId] = 0;
      room.state.roundWins[winnerId] += 1;

      room.state.picks[aId] = null; room.state.picks[bId] = null;

      if (room.state.phase === "tiebreak") {
        room.state.matchWinner = winnerId;
        room.state.matchFlavor = `Sudden Death — ${base} ${winName} wins.`;
        room.state.phase = "done";
        return push(room);
      }

      if (room.state.roundInSet < SET_ROUNDS) {
        room.state.roundInSet += 1;
        redeal(room);
        return push(room);
      }

      if (room.state.setIndex < TOTAL_SETS - 1) {
        room.state.setIndex += 1;
        room.state.roundInSet = 1;
        flipRoles(room);
        return push(room);
      }

      const [p1, p2] = room.players;
      const w1 = room.state.roundWins[p1.id] || 0;
      const w2 = room.state.roundWins[p2.id] || 0;
      if (w1 !== w2) {
        const matchWinner = (w1 > w2) ? p1.id : p2.id;
        room.state.matchWinner = matchWinner;
        room.state.matchFlavor = `Match Over — ${playerName(room, matchWinner)} wins ${w1}-${w2}.`;
        room.state.phase = "done";
        return push(room);
      }

      if (Math.random() < 0.5) { p1.role = "EMPEROR_SIDE"; p2.role = "SLAVE_SIDE"; }
      else { p1.role = "SLAVE_SIDE"; p2.role = "EMPEROR_SIDE"; }
      room.state.phase = "tiebreak";
      room.state.roundInSet = 1;
      redeal(room);
      return push(room);

    } finally {
      room.state._resolving = false;
    }
  });

  socket.on("game:rematch", ({ room: code }) => {
    const room = rooms.get(code);
    if (!room || room.players.length !== 2) return;
    if (!room.players.some(p => p.id === socket.id)) return;
    const [p1, p2] = room.players;
    if (Math.random() < 0.5) { p1.role = "EMPEROR_SIDE"; p2.role = "SLAVE_SIDE"; }
    else { p1.role = "SLAVE_SIDE"; p2.role = "EMPEROR_SIDE"; }

    room.state = {
      phase: "sets",
      setIndex: 0,
      roundInSet: 1,
      hands: {}, picks: { [p1.id]: null, [p2.id]: null },
      roundWins: { [p1.id]: 0, [p2.id]: 0 },
      history: [],
      matchWinner: null, matchFlavor: null,
      _resolving: false
    };
    redeal(room);
    push(room);
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms) {
      const before = room.players.length;
      room.players = room.players.filter(p => p.id !== socket.id);
      const spectatorBefore = room.spectators.length;
      room.spectators = room.spectators.filter(s => s.id !== socket.id);
      if (room.players.length === 0 && room.spectators.length === 0) rooms.delete(code);
      else if (room.players.length !== before || room.spectators.length !== spectatorBefore) io.to(code).emit("room:update", roomSnapshot(room));
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("ecard backend listening on", PORT));
