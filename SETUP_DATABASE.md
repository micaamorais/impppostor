# Configuración de la Base de Datos

Para que el juego funcione, necesitas ejecutar este SQL en tu proyecto de Supabase:

## Pasos:

1. Ve a https://mubegqdmcxtxsrciolnn.supabase.co
2. Entra al **SQL Editor**
3. Copia y pega el siguiente código SQL
4. Ejecuta el script

## SQL a ejecutar:

```sql
-- Si ya ejecutaste el setup inicial, ejecuta esto primero para agregar las columnas faltantes:
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS secret_word text;
ALTER TABLE public.rounds DROP COLUMN IF EXISTS current_turn_player_id;
ALTER TABLE public.rounds DROP COLUMN IF EXISTS secret_word;

-- Tabla de salas
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null check (status in ('waiting', 'playing', 'finished')),
  max_players int not null default 6,
  impostor_count int not null default 1,
  max_rounds int not null default 3,
  current_round int not null default 0,
  secret_word text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  finished_at timestamp with time zone
);

-- Tabla de jugadores
create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  name text not null,
  role text not null default 'player' check (role in ('player', 'impostor')),
  is_alive boolean not null default true,
  is_host boolean not null default false,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de rondas
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  round_number int not null,
  status text not null check (status in ('waiting_clues', 'voting', 'finished')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  finished_at timestamp with time zone
);

-- Tabla de pistas
create table public.clues (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  clue_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(round_id, player_id)
);

-- Tabla de votos
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds(id) on delete cascade not null,
  voter_id uuid references public.players(id) on delete cascade not null,
  voted_for_id uuid references public.players(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(round_id, voter_id)
);

-- Habilitar Row Level Security
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.rounds enable row level security;
alter table public.clues enable row level security;
alter table public.votes enable row level security;

-- Políticas RLS (permitir acceso público para el juego)
create policy "Anyone can read rooms"
  on public.rooms for select
  using (true);

create policy "Anyone can create rooms"
  on public.rooms for insert
  with check (true);

create policy "Anyone can update rooms"
  on public.rooms for update
  using (true);

create policy "Anyone can read players"
  on public.players for select
  using (true);

create policy "Anyone can create players"
  on public.players for insert
  with check (true);

create policy "Anyone can update players"
  on public.players for update
  using (true);

create policy "Anyone can read rounds"
  on public.rounds for select
  using (true);

create policy "Anyone can create rounds"
  on public.rounds for insert
  with check (true);

create policy "Anyone can update rounds"
  on public.rounds for update
  using (true);

create policy "Anyone can read clues"
  on public.clues for select
  using (true);

create policy "Anyone can create clues"
  on public.clues for insert
  with check (true);

create policy "Anyone can read votes"
  on public.votes for select
  using (true);

create policy "Anyone can create votes"
  on public.votes for insert
  with check (true);

-- Habilitar realtime
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table clues;
alter publication supabase_realtime add table votes;
```

Una vez ejecutado el SQL, el juego funcionará correctamente.
