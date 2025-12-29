import { query } from "../db.js";

export async function createRoom(userId: string) {
  const res = await query<{ id: string }>(
    `insert into rooms (created_by) values ($1) returning id`,
    [userId]
  );
  const roomId = res.rows[0].id;

  await query(
    `insert into room_members (room_id, user_id) values ($1,$2)`,
    [roomId, userId]
  );

  return { id: roomId };
}

export async function joinRoom(roomId: string, userId: string) {
  await query(
    `insert into room_members (room_id, user_id)
     values ($1,$2)
     on conflict do nothing`,
    [roomId, userId]
  );
}

export async function listHistoryForRoom(roomId: string, userId: string) {
  // Basic: list games in the room with players + winner
  const res = await query<{
    id: string;
    status: string;
    created_at: string;
    finished_at: string | null;
    winner: string | null;
    player_x: string;
    player_o: string;
  }>(
    `select id, status, created_at, finished_at, winner, player_x, player_o
     from games
     where room_id = $1
     order by created_at desc
     limit 20`,
    [roomId]
  );

  // In a real app you’d also check membership; for MVP, keep it simple.
  return res.rows;
}