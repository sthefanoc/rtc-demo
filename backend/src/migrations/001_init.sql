create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists games (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_x uuid not null references users(id),
  player_o uuid not null references users(id),
  winner uuid references users(id),
  status text not null, -- "in_progress" | "finished"
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists game_moves (
  id bigserial primary key,
  game_id uuid not null references games(id) on delete cascade,
  by_user uuid not null references users(id),
  idx int not null check (idx between 0 and 8),
  symbol text not null check (symbol in ('X','O')),
  created_at timestamptz not null default now()
);