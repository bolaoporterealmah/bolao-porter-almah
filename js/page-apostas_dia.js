SPA.pages["apostas_dia"]={style:"",script:function(){

(function(){
  var user = Auth.user;
  var pc = document.getElementById('pageContent');
  if (!pc) return;

  function render() {
    var games = DB.getGames();
    var allBets = DB.getBets();
    var users = DB.getUsers();
    var today = new Date();
    var todayStr = today.toISOString().slice(0,10);

    // Games with actual teams (not TBD)
    var realGames = games.filter(function(g){ return !g.tbd && g.home && g.away; });

    // Today's games
    var todayGames = realGames.filter(function(g){
      return g.date.slice(0,10) === todayStr;
    }).sort(function(a,b){ return new Date(a.date)-new Date(b.date); });

    // If no games today, show the next upcoming games (up to 3)
    var displayGames = todayGames;
    var displayLabel = 'Hoje — ' + today.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});

    if (todayGames.length === 0) {
      // Find next games from today forward
      var upcoming = realGames
        .filter(function(g){ return new Date(g.date) >= today; })
        .sort(function(a,b){ return new Date(a.date)-new Date(b.date); })
        .slice(0,3);

      // If still before Copa starts, show first 3 games of the tournament
      if (upcoming.length === 0) {
        upcoming = realGames
          .sort(function(a,b){ return new Date(a.date)-new Date(b.date); })
          .slice(0,3);
        displayLabel = '📋 Primeiros Jogos da Copa — Palpites Registrados';
      } else {
        var nextDate = upcoming[0].date.slice(0,10);
        var nextDateObj = new Date(nextDate + 'T12:00:00');
        displayLabel = '📅 Próximos Jogos — ' + nextDateObj.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
        // Get all games of that day
        upcoming = realGames
          .filter(function(g){ return g.date.slice(0,10) === nextDate; })
          .sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
      }
      displayGames = upcoming;
    }

    // Conta só os SEUS palpites (privacidade — sem dados de outros)
    var myAll = allBets[user.email] || {};
    var myBetsCount = Object.keys(myAll).length;

    var h = '';

    // Header
    h += '<div style="background:linear-gradient(135deg,#1B2B6B,#3D5AC8);border-radius:14px;padding:18px 24px;color:white;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">';
    h += '<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.8rem;font-weight:900;text-transform:uppercase;">📋 Palpites do Dia</div>';
    h += '<div style="font-size:.82rem;opacity:.75;margin-top:2px;">'+displayLabel+'</div></div>';
    h += '<div style="display:flex;gap:12px;">';
    h += '<div style="text-align:center;background:rgba(255,255,255,.15);padding:8px 14px;border-radius:10px;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.4rem;font-weight:900;">'+myBetsCount+'</div>';
    h += '<div style="font-size:.65rem;opacity:.75;text-transform:uppercase;letter-spacing:.5px;">seus palpites</div>';
    h += '</div>';
    h += '</div></div>';

    if (displayGames.length === 0) {
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:48px;text-align:center;">';
      h += '<div style="font-size:3rem;opacity:.25;margin-bottom:12px;">📅</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:1rem;text-transform:uppercase;color:#9CA3BF;">Nenhum jogo encontrado</div>';
      h += '</div>';
      pc.innerHTML = h;
      return;
    }

    displayGames.forEach(function(game) {
      var gameDate = new Date(game.date);
      var canBet = Utils.canBet(game);
      var isFinished = !!game.result;

      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;margin-bottom:16px;overflow:hidden;box-shadow:0 1px 4px rgba(27,43,107,.07);">';

      // Game header
      h += '<div style="background:#1B2B6B;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;">';
      h += '<div>';
      h += '<div style="font-size:.65rem;color:rgba(255,255,255,.65);font-weight:600;text-transform:uppercase;">'+Utils.phaseName(game.phase)+(game.group?' · Grupo '+game.group:'')+'</div>';
      h += '<div style="font-size:.65rem;color:rgba(255,255,255,.5);">📍 '+game.city+'</div>';
      h += '</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;font-weight:800;color:white;">🕐 '+Utils.formatTime(game.date)+'</div>';
      h += '</div>';

      // Teams row
      h += '<div style="padding:14px 16px 10px;display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:1.5px solid #EEF0F6;">';
      h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">';
      h += teamFlag(game.home, '2.2rem');
      h += '<span style="font-size:.82rem;font-weight:700;color:#2D3557;text-align:center;">'+game.home+'</span>';
      h += '</div>';
      h += '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">';
      if (isFinished) {
        h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.8rem;font-weight:900;color:#1B2B6B;">'+game.result.home_score+' × '+game.result.away_score+'</span>';
        h += '<span style="background:rgba(34,197,94,.1);color:#16A34A;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;">Finalizado</span>';
      } else if (canBet) {
        h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.4rem;font-weight:900;color:#9CA3BF;">×</span>';
        h += '<span style="background:rgba(245,197,24,.15);color:#92400E;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;">⏰ Aberto</span>';
      } else {
        h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.4rem;font-weight:900;color:#9CA3BF;">×</span>';
        h += '<span style="background:rgba(239,68,68,.08);color:#DC2626;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:99px;">🔒 Fechado</span>';
      }
      h += '</div>';
      h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">';
      h += teamFlag(game.away, '2.2rem');
      h += '<span style="font-size:.82rem;font-weight:700;color:#2D3557;text-align:center;">'+game.away+'</span>';
      h += '</div>';
      h += '</div>';

      // Bets table
      // privacidade: só o SEU palpite (nunca os de outros)
      var myUser = { email:user.email, name:user.name, company:user.company, initials:user.initials, role:user.role };
      var myUb = allBets[user.email] || {};
      var betters = myUb[game.id] ? [myUser] : [];
      var noBet   = myUb[game.id] ? [] : [myUser];

      // Status do SEU palpite (sem dados de outros)
      h += '<div style="padding:8px 16px;background:#F8F9FC;border-bottom:1px solid #EEF0F6;font-size:.75rem;font-weight:600;color:'+(betters.length?'#16A34A':'#92400E')+';">'+(betters.length?'✓ Você palpitou':'⏳ Você ainda não palpitou')+'</div>';

      if (betters.length === 0) {
        h += '<div style="padding:18px;text-align:center;font-size:.82rem;color:#9CA3BF;font-style:italic;">Você ainda não palpitou neste jogo</div>';
      } else {
        // Table header
        h += '<div style="overflow-x:auto;max-height:400px;overflow-y:auto;">';
        h += '<table style="width:100%;border-collapse:collapse;min-width:400px;">';
        h += '<thead><tr style="border-bottom:1.5px solid #EEF0F6;">';
        h += '<th style="position:sticky;top:0;padding:8px 14px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:left;background:#FAFAFA;z-index:1;">Participante</th>';
        h += '<th style="position:sticky;top:0;padding:8px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:center;background:#FAFAFA;z-index:1;">Empresa</th>';
        h += '<th style="position:sticky;top:0;padding:8px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:center;background:#FAFAFA;z-index:1;">Palpite</th>';
        h += '<th style="position:sticky;top:0;padding:8px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:center;background:#FAFAFA;z-index:1;">Status</th>';
        h += '</tr></thead><tbody>';

        // Sort betters by company then name
        betters.sort(function(a,b){
          // If game finished, sort by points desc
          if (game.result) {
            var ubA = allBets[a.email] || allBets[a.id] || {};
            var ubB = allBets[b.email] || allBets[b.id] || {};
            var betA = ubA[game.id], betB = ubB[game.id];
            var ptsA = betA ? Scoring.calculate(betA, {home_score:game.result.home_score, away_score:game.result.away_score, phase:game.phase}).total : 0;
            var ptsB = betB ? Scoring.calculate(betB, {home_score:game.result.home_score, away_score:game.result.away_score, phase:game.phase}).total : 0;
            if (ptsB !== ptsA) return ptsB - ptsA;
          }
          return a.name.localeCompare(b.name);
        });

        betters.forEach(function(u){
          var ub = allBets[u.email] || allBets[u.id] || {};
          var bet = ub[game.id];
          var isMe = u.email === user.email;
          var pts = null;
          var exact = false;
          if (isFinished && bet) {
            var sc = Scoring.calculate(bet, {home_score:game.result.home_score, away_score:game.result.away_score, phase:game.phase});
            pts = sc.total;
            exact = sc.breakdown.some(function(b){ return b.label==='Placar exato'; });
          }

          h += '<tr style="border-bottom:1px solid #EEF0F6;'+(isMe?'background:rgba(27,43,107,.03);':'')+'">';

          h += '<td style="padding:9px 14px;">';
          h += '<div style="display:flex;align-items:center;gap:8px;">';
          h += '<div style="width:28px;height:28px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:white;flex-shrink:0;">'+u.initials+'</div>';
          h += '<div style="font-size:.85rem;font-weight:'+(isMe?'700':'500')+';color:#2D3557;">'+esc(u.name)+(isMe?' <span style="font-size:.62rem;color:#3D5AC8">(você)</span>':'')+'</div>';
          h += '</div></td>';

          h += '<td style="padding:9px 12px;text-align:center;">';
          h += '<span style="padding:2px 8px;border-radius:99px;font-size:.65rem;font-weight:800;background:'+(u.company==='Porter'?'rgba(27,43,107,.08)':'rgba(245,197,24,.15)')+';color:'+(u.company==='Porter'?'#1B2B6B':'#92400E')+';">'+esc(u.company)+'</span>';
          h += '</td>';

          h += '<td style="padding:9px 12px;text-align:center;">';
          if (isFinished) {
            // Show palpite only after game ends
            h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.15rem;font-weight:900;color:#1B2B6B;">'+bet.home_score+' × '+bet.away_score+'</span>';
            if (exact) h += ' <span style="font-size:.7rem;">🎯</span>';
          } else {
            // Hide palpite while game is open or not started — show only ✓
            h += '<span style="font-size:.78rem;color:#16A34A;font-weight:700;">✓ Palpitou</span>';
          }
          h += '</td>';

          h += '<td style="padding:9px 12px;text-align:center;">';
          if (isFinished && pts !== null) {
            h += '<span style="font-size:.82rem;font-weight:800;color:'+(pts>0?'#16A34A':'#DC2626')+'">'+(pts>0?'+'+pts+' pts':'Errou')+'</span>';
          } else {
            h += '<span style="font-size:.72rem;color:#9CA3BF;">—</span>';
          }
          h += '</td>';
          h += '</tr>';
        });

        h += '</tbody></table></div>';
      }

      h += '</div>'; // game card
    });

    // Auto refresh notice
    h += '<div style="text-align:center;padding:12px;font-size:.72rem;color:#9CA3BF;">🔄 Atualização automática a cada 30 segundos</div>';

    pc.innerHTML = h;
  }

  // Sync and render
  (async function(){
    if (window.syncBetsFromSupabase) await window.syncBetsFromSupabase();
    render();
  })();

  var _ri = setInterval(function(){
    if (SPA.current !== 'apostas_dia') { clearInterval(_ri); return; }
    if (window.syncBetsFromSupabase) {
      window.syncBetsFromSupabase().then(function(){ render(); });
    } else {
      render();
    }
  }, 30000);
})();




}};
