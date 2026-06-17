-- ============================================================================
-- Rebuild automático dos snapshots do ranking em QUALQUER mudança de resultado.
-- Sempre que um placar é adicionado / corrigido / REMOVIDO (ou o jogo é
-- inserido/deletado), reconstrói todo o histórico de snapshots (replay as-of).
--
-- Pré-requisitos: db/ranking_movement.sql (tabela/RPC) e db/ranking_backfill.sql
-- (cria public.ranking_asof). Roda no SQL Editor do Supabase.
--
-- IMPORTANTE: o Supabase liga a extensão pg-safeupdate no contexto da API
-- (role authenticator). Ela REJEITA DELETE/UPDATE sem WHERE com o erro
-- 21000 "DELETE requires a WHERE clause". Por isso o DELETE abaixo usa
-- "where true" — sem isso a trigger quebra ao salvar um resultado.
-- ============================================================================

-- 1) Função de rebuild: apaga tudo e replaya 1 snapshot pré-jogo por jogo encerrado
create or replace function public.rebuild_ranking_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare g record;
begin
  delete from public.ranking_snapshots where true;  -- where true: contorna pg-safeupdate (erro 21000)

  for g in
    select id, (date)::timestamptz as gdate
    from public.games
    where result_home is not null
      and result_away is not null
      and coalesce(tbd, false) = false
    order by (date)::timestamptz asc, id asc
  loop
    insert into public.ranking_snapshots (taken_at, trigger_game_id, email, position, total_pts)
    select g.gdate, g.id, a.email, a.pos, a.total_pts
    from public.ranking_asof(g.gdate) a;
  end loop;
end;
$$;

-- 2) Remove a trigger antiga (pré-jogo via BEFORE UPDATE), se existir
drop trigger  if exists snapshot_on_result on public.games;
drop function if exists public.trg_snapshot_on_result();

-- 3) Trigger: reconstrói em add/editar/remover resultado, ou insert/delete do jogo
create or replace function public.trg_rebuild_on_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'UPDATE') then
    if (OLD.result_home is distinct from NEW.result_home
        or OLD.result_away is distinct from NEW.result_away
        or coalesce(OLD.tbd,false) is distinct from coalesce(NEW.tbd,false)) then
      perform public.rebuild_ranking_snapshots();
    end if;
  elsif (TG_OP = 'INSERT') then
    if (NEW.result_home is not null and NEW.result_away is not null) then
      perform public.rebuild_ranking_snapshots();
    end if;
  elsif (TG_OP = 'DELETE') then
    if (OLD.result_home is not null and OLD.result_away is not null) then
      perform public.rebuild_ranking_snapshots();
    end if;
  end if;
  return null; -- AFTER trigger: retorno ignorado
end;
$$;

drop trigger if exists rebuild_on_result on public.games;
create trigger rebuild_on_result
after insert or update or delete on public.games
for each row execute function public.trg_rebuild_on_result();

-- 4) Roda 1x agora para deixar os snapshots consistentes
select public.rebuild_ranking_snapshots();
-- ============================================================================
