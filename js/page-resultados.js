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
      var iCravei = !!(sc && sc.base === 15); // usuário acessando cravou o placar exato
      var mult = Utils.phaseMultiplier(g.phase); // 1.0, 1.2, 1.5, 2.0, 3.0...
      // Card destacado (borda + brilho dourado) quando EU cravei este jogo.
      h += '<div style="background:white;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;'+
        (iCravei
          ? 'border:2px solid #F5C518;box-shadow:0 0 0 3px rgba(245,197,24,.22),0 4px 14px rgba(245,197,24,.18);'
          : 'border:1px solid #DDE1EE;')+'">';
      // faixa "você cravou" no topo do card
      if (iCravei) {
        h += '<div style="background:linear-gradient(135deg,#F5C518,#E5A100);color:#1B2B6B;font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:.72rem;text-transform:uppercase;letter-spacing:1px;text-align:center;padding:4px;">🎯 Você cravou este placar!</div>';
      }
      // header: fase + data
      h += '<div style="padding:9px 14px;background:#F8F9FC;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">';
      h += '<span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#1B2B6B;">'+Utils.phaseName(g.phase)+(g.group?' · Grupo '+g.group:'')+(mult>1?' <span style="background:#7C3AED;color:white;padding:1px 7px;border-radius:99px;font-size:.6rem;margin-left:4px;" title="Pontos desta fase valem '+mult+'×">🔥 '+mult+'×</span>':'')+'</span>';
      h += '<span style="font-size:.65rem;color:#9CA3BF;">'+Utils.formatDate(g.date)+'</span>';
      h += '</div>';
      // confronto + placar oficial
      h += '<div style="padding:14px;display:flex;align-items:center;justify-content:center;gap:12px;">';
      h += '<div style="flex:1;text-align:right;font-size:.85rem;font-weight:700;color:#2D3557;">'+esc(g.home)+' '+flag(g.home)+'</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:#1B2B6B;white-space:nowrap;">'+g.result.home_score+' × '+g.result.away_score+'</div>';
      h += '<div style="flex:1;text-align:left;font-size:.85rem;font-weight:700;color:#2D3557;">'+flag(g.away)+' '+esc(g.away)+'</div>';
      h += '</div>';
      // meu palpite + pontos
      h += '<div style="padding:10px 14px;border-top:1px solid #EEF0F6;font-size:.75rem;'+(iCravei?'background:rgba(245,197,24,.1);':'')+'">';
      if (bet) {
        var pts = sc ? sc.total : 0;
        var base = sc ? sc.base : 0;
        var bonus = pts - base;
        h += '<div style="display:flex;align-items:center;justify-content:space-between;">';
        h += '<span style="color:#5A6385;">Seu palpite: <strong style="color:'+(iCravei?'#B8860B':'#2D3557')+';">'+bet.home_score+' × '+bet.away_score+'</strong>'+(iCravei?' 🎯':'')+'</span>';
        h += '<span style="background:'+(pts>0?'rgba(34,197,94,.12)':'rgba(0,0,0,.05)')+';color:'+(pts>0?'#16A34A':'#9CA3BF')+';padding:2px 10px;border-radius:99px;font-weight:800;">'+(pts>0?'+'+pts+' pts':'0 pts')+'</span>';
        h += '</div>';
        // breakdown do bônus: só quando a fase multiplica e você pontuou
        if (mult>1 && pts>0) {
          h += '<div style="margin-top:6px;display:flex;align-items:center;gap:6px;font-size:.66rem;color:#7C3AED;flex-wrap:wrap;">';
          h += '<span style="background:rgba(124,58,237,.1);padding:2px 8px;border-radius:6px;font-weight:700;">'+base+' base × '+mult+' = '+pts+'</span>';
          h += '<span style="font-weight:700;">🔥 +'+bonus+' de bônus da fase</span>';
          h += '</div>';
        }
      } else {
        h += '<span style="color:#9CA3BF;">Você não palpitou neste jogo</span>';
      }
      h += '</div>';

      // cravadores: só quem acertou o placar exato deste jogo (destaque + parabéns)
      var cravadores = scorers[g.id] || [];
      if (cravadores.length) {
        // bloco preenche todo o resto do card (flex:1): header topo, lista meio, parabéns fundo
        h += '<div style="flex:1;min-height:0;display:flex;flex-direction:column;border-top:1px dashed #E5C100;background:linear-gradient(135deg,rgba(245,197,24,.14),rgba(34,197,94,.08));">';
        // header fixo (topo)
        h += '<div style="flex-shrink:0;display:flex;align-items:center;gap:6px;padding:10px 14px 8px;font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.8rem;text-transform:uppercase;letter-spacing:.5px;color:#B8860B;">🎯 Cravaram o placar <span style="background:#F5C518;color:#1B2B6B;border-radius:99px;padding:1px 8px;font-size:.7rem;line-height:1.5;">'+cravadores.length+'</span></div>';
        // lista: cap ~10 linhas, scroll interno se passar; não estica (footer vai pro fundo via margin-top:auto)
        h += '<div style="flex-shrink:0;display:flex;flex-direction:column;gap:5px;max-height:330px;overflow-y:auto;padding:0 14px 4px;">';
        cravadores.forEach(function(c){
          var ini = esc(c.initials || (c.name ? c.name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase() : '?'));
          var isMe = (c.name && user && c.name === user.name && (!c.company || !user.company || c.company === user.company));
          h += '<div style="display:flex;align-items:center;gap:8px;background:'+(isMe?'linear-gradient(135deg,#FFF3C4,#FFE08A)':'white')+';border:'+(isMe?'2px':'1.5px')+' solid #F5C518;border-radius:99px;padding:3px 12px 3px 3px;box-shadow:0 1px 3px rgba(0,0,0,.06);">';
          h += '<span style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#1B2B6B,#3D5AC8);color:white;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;flex-shrink:0;">'+ini+'</span>';
          h += '<span style="font-size:.8rem;font-weight:700;color:#2D3557;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(c.name||'')+(isMe?' <span style="font-size:.6rem;color:#B8860B;">(você)</span>':'')+'</span>';
          if (c.company) h += '<span style="font-size:.62rem;color:#9CA3BF;flex-shrink:0;">'+esc(c.company)+'</span>';
          h += '</div>';
        });
        h += '</div>';
        // footer fixo (fundo) — margin-top:auto cola no rodapé do card
        h += '<div style="flex-shrink:0;margin-top:auto;font-size:.68rem;color:#16A34A;font-weight:700;padding:8px 14px 12px;border-top:1px solid rgba(229,193,0,.35);">🎉 Parabéns! +15 pts de placar exato.</div>';
        h += '</div>';
      } else {
        // ninguém cravou: preenche o card todo (bg cobre tudo) com estado triste
        h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border-top:1px solid #EEF0F6;background:linear-gradient(135deg,#F4F5F9,#E7E9F1);padding:24px 18px;text-align:center;">';
        h += '<div style="font-size:2rem;opacity:.5;line-height:1;">😢</div>';
        h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.85rem;text-transform:uppercase;letter-spacing:.5px;color:#9CA3BF;">Ninguém cravou</div>';
        h += '<div style="font-size:.7rem;color:#AEB4C7;">Nenhum participante acertou o placar exato</div>';
        h += '</div>';
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
