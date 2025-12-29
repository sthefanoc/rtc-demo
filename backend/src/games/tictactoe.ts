export type Cell = "X" | "O" | null;
export type Board = Cell[];

export function emptyBoard(): Board {
  return Array(9).fill(null);
}

export function winnerOf(board: Board): "X" | "O" | null {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of lines) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }
  return null;
}

export function isDraw(board: Board) {
  return board.every((c) => c !== null) && !winnerOf(board);
}