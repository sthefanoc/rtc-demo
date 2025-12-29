import { Server } from "socket.io";
import http from "node:http";
import { verifyToken } from "../auth/auth.service.js";
import { emptyBoard, winnerOf, isDraw, Board } from "../games/tictactoe.js";
import { query } from "../db.js";

type RoomState = {
  board: Board;
  gameId: string | null;
  playerX: string | null;
  playerO: string | null;
  turn: "X" | "O";
};

const states = new Map<string, RoomState>();

function getState(roomId: string): RoomState {
  const existing = states.get(roomId);
  if (existing) return existing;
  const s: RoomState = { board: emptyBoard(), gameId: null, playerX: null, playerO: null, turn: "X" };
  states.set(roomId, s);
  return s;
}

export function initSocket(server: http.Server) {
  const io = new Server(server, {
    cors: { origin: true, methods: ["GET","POST"] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("unauthorized"));
    try {
      const user = verifyToken(token);
      (socket as any).user = user;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user as { userId: string; email: string };

    socket.on("room:join", async ({ roomId }: { roomId: string }) => {
      socket.join(roomId);
      // ensure membership in DB (idempotent)
      await query(
        `insert into room_members (room_id, user_id) values ($1,$2) on conflict do nothing`,
        [roomId, user.userId]
      );

      const state = getState(roomId);
      io.to(roomId).emit("room:presence", { userId: user.userId, email: user.email });
      socket.emit("game:state", state);
    });

    // WebRTC signaling passthrough
    socket.on("rtc:signal", ({ roomId, data }: { roomId: string; data: any }) => {
      socket.to(roomId).emit("rtc:signal", { from: user.userId, data });
    });

    socket.on("game:start", async ({ roomId }: { roomId: string }) => {
      const state = getState(roomId);
      // Assign X/O if empty
      if (!state.playerX) state.playerX = user.userId;
      else if (!state.playerO && state.playerX !== user.userId) state.playerO = user.userId;

      // Start a new DB game if none
      if (!state.gameId && state.playerX && state.playerO) {
        const res = await query<{ id: string }>(
          `insert into games (room_id, player_x, player_o, status)
           values ($1,$2,$3,'in_progress')
           returning id`,
          [roomId, state.playerX, state.playerO]
        );
        state.gameId = res.rows[0].id;
        state.board = emptyBoard();
        state.turn = "X";
      }

      io.to(roomId).emit("game:state", state);
    });

    socket.on("game:move", async ({ roomId, idx }: { roomId: string; idx: number }) => {
      const state = getState(roomId);
      if (!state.gameId) return;
      if (idx < 0 || idx > 8) return;
      if (state.board[idx]) return;

      // turn + permissions
      const symbol = state.turn;
      const expectedUser = symbol === "X" ? state.playerX : state.playerO;
      if (!expectedUser || expectedUser !== user.userId) return;

      state.board[idx] = symbol;

      await query(
        `insert into game_moves (game_id, by_user, idx, symbol) values ($1,$2,$3,$4)`,
        [state.gameId, user.userId, idx, symbol]
      );

      const win = winnerOf(state.board);
      if (win) {
        const winnerUser = win === "X" ? state.playerX : state.playerO;
        await query(
          `update games set status='finished', winner=$1, finished_at=now() where id=$2`,
          [winnerUser, state.gameId]
        );
        // keep state but mark as finished by nulling gameId to allow new game
        state.gameId = null;
      } else if (isDraw(state.board)) {
        await query(
          `update games set status='finished', finished_at=now() where id=$1`,
          [state.gameId]
        );
        state.gameId = null;
      } else {
        state.turn = symbol === "X" ? "O" : "X";
      }

      io.to(roomId).emit("game:state", state);
    });
  });

  return io;
}