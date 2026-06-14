-- ============================================================================
-- BACKFILL histórico do movimento do ranking, jogo a jogo, a partir dos
-- palpites JÁ salvos (tabela bets). Reproduz a pontuação do app em SQL.
--
-- Pré-requisito: rodar antes o db/ranking_movement.sql (cria ranking_snapshots).
-- Roda no SQL Editor do Supabase.
--
-- Como funciona:
--   ranking_asof(cutoff) = classificação considerando SÓ jogos encerrados com
--   date < cutoff. Para cada jogo encerrado (em ordem de data) gravamos um
--   snapshot do estado PRÉ-jogo (taken_at = data do jogo). Assim o snapshot mais
--   recente = classificação imediatamente antes do último placar — igual ao que
--   a trigger BEFORE UPDATE gravaria ao vivo.
--
-- Pontuação replicada do app (js/core.js → Scoring + MULTIPLIERS):
--   placar exato = 15 (não soma vencedor/saldo/um-time)
--   senão: vencedor +5, saldo de gols +3, gols de um time +2  (somam entre si)
--   total = round(base * mult), mult por fase abaixo.
--   Desempate: pontos ↓, exatos ↓, vencedores ↓, palpites ↓, tempo de envio ↑.
-- ASSUNÇÕES (ajuste se sua public.ranking() divergir):
--   * "vencedores" NÃO conta placar exato (espelha o breakdown do app).
--   * "tempo de envio" = média de bets.saved_at (mais cedo = melhor).
-- ============================================================================

-- 1) Classificação "as-of" (até uma data de corte) ---------------------------
create or replace function public.ranking_asof(p_cutoff timestamptz)
returns table(email text, pos int, total_pts int)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select
      b.user_email,
      g.phase,
      b.saved_at::timestamptz as saved_at,
      (b.home_score = g.result_home and b.away_score = g.result_away) as is_exact,
      ( (case when b.home_score > b.away_score then 'H' when b.away_score > b.home_score then 'A' else 'D' end)
        = (case when g.result_home > g.result_away then 'H' when g.result_away > g.result_home then 'A' else 'D' end) ) as winner_ok,
      ((b.home_score - b.away_score) = (g.result_home - g.result_away)) as saldo_ok,
      (b.home_score = g.result_home or b.away_score = g.result_away) as oneteam_ok
    from public.bets b
    join public.games g on g.id = b.game_id
    where g.result_home is not null
      and g.result_away is not null
      and coalesce(g.tbd, false) = false
      and g.date::timestamptz < p_cutoff   -- games.date é texto ("2026-06-14T17:00") → cast
  ),
  pts as (
    select
      user_email, saved_at, is_exact, winner_ok,
      ( case when is_exact then 15
             else (case when winner_ok then 5 else 0 end)
                + (case when saldo_ok then 3 else 0 end)
                + (case when oneteam_ok then 2 else 0 end)
        end ) as base,
      ( case phase
          when 'groups'        then 1.0
          when 'round_of_16'   then 1.2
          when 'quarterfinals' then 1.5
          when 'semifinals'    then 2.0
          when 'third_place'   then 1.5
          when 'final'         then 3.0
          else 1.0 end ) as mult
    from scored
  ),
  totals as (
    select
      user_email,
      coalesce(sum( round(base * mult)::int ), 0)      as total_pts,
      coalesce(sum( (is_exact)::int ), 0)              as exact_n,
      coalesce(sum( (winner_ok and not is_exact)::int ), 0) as winner_n,
      count(*)                                         as bets_n,
      coalesce(avg(extract(epoch from saved_at)), 9e18) as avg_send
    from pts
    group by user_email
  )
  select
    p.email,
    row_number() over (
      order by
        coalesce(t.total_pts, 0) desc,
        coalesce(t.exact_n, 0)   desc,
        coalesce(t.winner_n, 0)  desc,
        coalesce(t.bets_n, 0)    desc,
        coalesce(t.avg_send, 9e18) asc,
        p.email asc
    )::int as pos,
    coalesce(t.total_pts, 0)::int as total_pts
  from public.profiles p
  left join totals t on t.user_email = p.email;
$$;

grant execute on function public.ranking_asof(timestamptz) to anon, authenticated;

-- 2) Replay cronológico: 1 snapshot pré-jogo por jogo encerrado --------------
-- Limpa snapshots existentes (inclui o 'baseline') e reconstrói do zero a partir
-- do histórico real. A trigger continua adicionando os próximos ao vivo.
do $$
declare g record;
begin
  delete from public.ranking_snapshots;

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
end $$;

-- 3) Conferência rápida (opcional) -------------------------------------------
-- Compare a classificação ATUAL do replay com a sua public.ranking():
--   select * from public.ranking_asof(now()) order by pos limit 10;
--   select email, pos, total_pts from public.ranking() order by pos limit 10;
-- Os pontos/posições devem bater. Se divergir em empates, ajuste o ORDER BY
-- da ranking_asof (vencedores/tempo) para casar com a sua ranking().
-- ============================================================================
