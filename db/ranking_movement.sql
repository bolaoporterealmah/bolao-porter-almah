-- ============================================================================
-- Movimento do ranking (▲▼) — snapshots no Supabase
-- Roda no SQL Editor do Supabase. Reusa a função public.ranking() já existente.
-- Estratégia: a cada placar adicionado/alterado, guarda a classificação
-- IMEDIATAMENTE ANTES da mudança (snapshot "pré-jogo"). O front compara a
-- posição atual (ranking()) com a do último snapshot → delta = prev - atual.
-- ============================================================================

-- 1) Tabela de snapshots ------------------------------------------------------
create table if not exists public.ranking_snapshots (
  id              bigserial primary key,
  taken_at        timestamptz not null default now(),
  trigger_game_id text,          -- jogo que disparou (null = baseline/backfill)
  email           text not null,
  position        int  not null,
  total_pts       int  not null
);
create index if not exists ix_rank_snap_taken on public.ranking_snapshots (taken_at desc);

-- 1b) RLS: habilita SEM políticas → acesso direto via anon/authenticated NEGADO.
-- As funções abaixo são SECURITY DEFINER, então ignoram a RLS e seguem lendo/gravando.
-- (Dados aqui não são sigilosos — posição/pontos já são públicos via ranking() — mas
--  RLS ligada é a prática segura e remove o aviso do Supabase.)
alter table public.ranking_snapshots enable row level security;

-- 2) Função que tira um snapshot do ranking ATUAL ----------------------------
-- OBS: assume que public.ranking() devolve colunas email, pos, total_pts.
-- Se os nomes forem outros, ajuste o SELECT abaixo.
create or replace function public.snapshot_ranking(p_game_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ranking_snapshots (taken_at, trigger_game_id, email, position, total_pts)
  select now(), p_game_id, r.email, r.pos, r.total_pts
  from public.ranking() r;
end;
$$;

-- 3) Trigger: snapshot do estado PRÉ-jogo quando o placar é definido/alterado -
-- BEFORE UPDATE → ranking() ainda enxerga o resultado ANTIGO (= classificação
-- anterior). É exatamente o "de onde cada um saiu".
create or replace function public.trg_snapshot_on_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (NEW.result_home is not null and NEW.result_away is not null)
     and (OLD.result_home is distinct from NEW.result_home
       or OLD.result_away is distinct from NEW.result_away) then
    perform public.snapshot_ranking(NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists snapshot_on_result on public.games;
create trigger snapshot_on_result
before update on public.games
for each row execute function public.trg_snapshot_on_result();

-- 4) RPC lida pelo front: posição anterior de cada participante ---------------
-- Devolve o snapshot mais recente (estado logo antes do último placar).
create or replace function public.ranking_movement()
returns table(email text, prev_position int)
language sql
security definer
set search_path = public
as $$
  -- posição mais recente de cada participante (à prova de snapshots com taken_at igual)
  select distinct on (s.email) s.email, s.position as prev_position
  from public.ranking_snapshots s
  order by s.email, s.taken_at desc, s.id desc;
$$;

grant execute on function public.ranking_movement() to anon, authenticated;

-- 5) BACKFILL (baseline) ------------------------------------------------------
-- Cria 1 snapshot com a classificação ATUAL como ponto de partida. A partir do
-- PRÓXIMO placar, as setas ▲▼ ficam precisas. (Antes disso o front mostra "–".)
insert into public.ranking_snapshots (taken_at, trigger_game_id, email, position, total_pts)
select now(), 'baseline', r.email, r.pos, r.total_pts
from public.ranking() r;

-- ----------------------------------------------------------------------------
-- NOTA sobre histórico real (jogo a jogo):
-- ranking() calcula com TODOS os resultados atuais, não "até a data X". Para
-- reconstruir a posição após cada jogo passado seria preciso uma versão
-- "as-of" da ranking(). Se quiser isso, me mande a definição de public.ranking()
-- (o SQL dela) que eu escrevo o replay cronológico que popula um snapshot por
-- jogo já encerrado.
-- ============================================================================
