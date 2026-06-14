SPA.pages["resultados"]={style:``,script:function(){
(function(){
  var user = Auth.user;

  function render(){
    var pc = document.getElementById('pageContent');
    if (!pc) return;
    var games = DB.getGames()
      .filter(function(g){ return g.result && !g.tbd; })
      .sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
    var myBets = DB.getUserBets((user && (user.id || user.email)) || '');
    var scorers = DB.get('exact_scorers', {}); // { gameId: [{name,company,initials}] } — só quem cravou (vem do RPC)

    var h = '';
    // Hero
    h += '<div style="background:linear-gradient(135deg,#1B2B6B,#0f1e4a);border-radius:16px;padding:24px 28px;color:white;margin-bottom:20px;position:relative;overflow:hidden;">';
    h += '<div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:130px;opacity:.06;">🏟️</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2rem;font-weight:900;text-transform:uppercase;letter-spacing:1px;">🏟️ Resultados</div>';
    h += '<div style="font-size:.85rem;opacity:.6;margin-top:4px;">Jogos encerrados · placar oficial e seus pontos</div>';
    h += '</div>';

    if (!games.length) {
      h += '<div style="text-align:center;padding:60px 24px;">';
      h += '<div style="font-size:3rem;opacity:.3;margin-bottom:12px;">⚽</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:1.1rem;color:#9CA3BF;text-transform:uppercase;">Nenhum jogo encerrado ainda</div>';
      h += '</div>';
      pc.innerHTML = h; return;
    }

    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">';
    games.forEach(function(g){
      var bet = myBets[g.id];
      var sc = bet ? Scoring.calculate(bet, {home_score:g.result.home_score, away_score:g.result.away_score, phase:g.phase}) : null;
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
      // header: fase + data
      h += '<div style="padding:9px 14px;background:#F8F9FC;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">';
      h += '<span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#1B2B6B;">'+Utils.phaseName(g.phase)+(g.group?' · Grupo '+g.group:'')+'</span>';
      h += '<span style="font-size:.65rem;color:#9CA3BF;">'+Utils.formatDate(g.date)+'</span>';
      h += '</div>';
      // confronto + placar oficial
      h += '<div style="padding:14px;display:flex;align-items:center;justify-content:center;gap:12px;">';
      h += '<div style="flex:1;text-align:right;font-size:.85rem;font-weight:700;color:#2D3557;">'+esc(g.home)+' '+flag(g.home)+'</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:#1B2B6B;white-space:nowrap;">'+g.result.home_score+' × '+g.result.away_score+'</div>';
      h += '<div style="flex:1;text-align:left;font-size:.85rem;font-weight:700;color:#2D3557;">'+flag(g.away)+' '+esc(g.away)+'</div>';
      h += '</div>';
      // meu palpite + pontos
      h += '<div style="padding:10px 14px;border-top:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;font-size:.75rem;">';
      if (bet) {
        var pts = sc ? sc.total : 0;
        h += '<span style="color:#5A6385;">Seu palpite: <strong style="color:#2D3557;">'+bet.home_score+' × '+bet.away_score+'</strong></span>';
        h += '<span style="background:'+(pts>0?'rgba(34,197,94,.12)':'rgba(0,0,0,.05)')+';color:'+(pts>0?'#16A34A':'#9CA3BF')+';padding:2px 10px;border-radius:99px;font-weight:800;">'+(pts>0?'+'+pts+' pts':'0 pts')+'</span>';
      } else {
        h += '<span style="color:#9CA3BF;">Você não palpitou neste jogo</span>';
      }
      h += '</div>';

      // cravadores: só quem acertou o placar exato deste jogo (destaque + parabéns)
      var cravadores = scorers[g.id] || [];
      if (cravadores.length) {
        h += '<div style="border-top:1px dashed #E5C100;background:linear-gradient(135deg,rgba(245,197,24,.14),rgba(34,197,94,.08));">';
        // header fixo
        h += '<div style="display:flex;align-items:center;gap:6px;padding:10px 14px 8px;font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.5px;color:#B8860B;">🎯 Cravaram o placar <span style="background:#F5C518;color:#1B2B6B;border-radius:99px;padding:1px 8px;font-size:.7rem;line-height:1.5;">'+cravadores.length+'</span></div>';
        // lista: 1 por linha, altura p/ ~10 usuários, scroll interno se passar
        h += '<div style="display:flex;flex-direction:column;gap:5px;max-height:330px;overflow-y:auto;padding:0 14px;">';
        cravadores.forEach(function(c){
          var ini = esc(c.initials || (c.name ? c.name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase() : '?'));
          h += '<div style="display:flex;align-items:center;gap:8px;background:white;border:1.5px solid #F5C518;border-radius:99px;padding:3px 12px 3px 3px;box-shadow:0 1px 3px rgba(0,0,0,.06);">';
          h += '<span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#1B2B6B,#3D5AC8);color:white;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;flex-shrink:0;">'+ini+'</span>';
          h += '<span style="font-size:.8rem;font-weight:700;color:#2D3557;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(c.name||'')+'</span>';
          if (c.company) h += '<span style="font-size:.62rem;color:#9CA3BF;flex-shrink:0;">'+esc(c.company)+'</span>';
          h += '</div>';
        });
        h += '</div>';
        // footer fixo
        h += '<div style="font-size:.68rem;color:#16A34A;font-weight:700;padding:8px 14px 12px;">🎉 Parabéns! +15 pts de placar exato.</div>';
        h += '</div>';
      } else {
        h += '<div style="padding:9px 14px;border-top:1px solid #EEF0F6;background:#FAFBFD;display:flex;align-items:center;gap:6px;font-size:.72rem;color:#9CA3BF;font-weight:600;">😬 Ninguém cravou este placar.</div>';
      }

      h += '</div>';
    });
    h += '</div>';

    pc.innerHTML = h;
  }

  render();
  // busca quem cravou (RPC server-side; nunca expõe palpite alheio que não cravou) e re-renderiza
  if (window.syncExactScorersFromSupabase) window.syncExactScorersFromSupabase().then(function(ok){ if (ok) render(); });
})();
}};
