SPA.pages["dashboard"]={style:``,script:function(){
(function(){
  var user = Auth.user;
  var intervalId = null;

  function render() {
    // Guard: only run if we're still on dashboard
    if (SPA.current !== 'dashboard') {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      return;
    }
    var pc = document.getElementById('pageContent');
    if (!pc) return;

    var games = DB.getGames();
    var ranking = DB.getRanking();
    var userBets = DB.getUserBets(user.email || user.id);
    var myRank = ranking.find(function(r){ return r.email===user.email; }) || {position:'—',totalPts:0,exactScores:0,betCount:0};
    var now = Date.now();
    var finishedGames = games.filter(function(g){ return g.result && !g.tbd; });
    var nextGames = games.filter(function(g){ return !g.result && !g.tbd && new Date(g.date).getTime() > now; }).slice(0,5);
    var pendingBets = nextGames.filter(function(g){ return Utils.canBet(g) && !userBets[g.id]; });

    var h = '';

    // Hero banner
    h += '<div style="background:linear-gradient(135deg,#1B2B6B 0%,#3D5AC8 100%);border-radius:16px;padding:22px 26px;color:white;display:flex;align-items:center;justify-content:flex-start;gap:22px;margin-bottom:20px;position:relative;overflow:hidden;">';
    h += '<img src="'+FIFA_LOGO+'" style="height:108px;width:auto;flex-shrink:0;filter:drop-shadow(0 4px 12px rgba(0,0,0,.25));" alt="FIFA World Cup 2026"/>';
    h += '<div style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">';
    h += '<div><div style="font-size:.78rem;opacity:.7;margin-bottom:4px;">Olá, '+esc(user.name).split(' ')[0]+' 👋</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.8rem;font-weight:900;text-transform:uppercase;line-height:1.1;">Copa do Mundo<br/>FIFA 2026</div>';
    h += '<div style="font-size:.78rem;opacity:.6;margin-top:4px;">USA · Canada · México &nbsp;|&nbsp; Porter & Almah</div></div>';
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    h += '<button data-nav="palpites" style="padding:11px 20px;background:#F5C518;color:#1B2B6B;border:none;border-radius:10px;font-weight:800;font-size:.9rem;cursor:pointer;">⚽ Palpitar</button>';
    h += '<button data-nav="ranking" style="padding:11px 20px;background:rgba(255,255,255,.15);color:white;border:1.5px solid rgba(255,255,255,.4);border-radius:10px;font-weight:700;font-size:.9rem;cursor:pointer;">🏆 Ranking</button>';
    h += '</div></div></div>';

    if (pendingBets.length > 0) {
      h += '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(245,197,24,.12);border-radius:10px;border-left:3px solid #F5C518;font-size:.875rem;color:#92400E;margin-bottom:20px;">';
      h += '⚠️ Você tem <strong style="margin:0 4px;">'+pendingBets.length+' palpite(s) pendente(s)</strong>.';
      h += '<button data-nav="palpites" style="margin-left:8px;background:none;border:none;cursor:pointer;font-weight:700;color:#92400E;text-decoration:underline;font-size:.875rem;">Palpitar agora →</button>';
      h += '</div>';
    }

    // My position
    h += '<div style="background:linear-gradient(135deg,#1B2B6B,#2A3F9A);border-radius:14px;padding:20px 24px;color:white;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;">';
    [[myRank.position+'º','Posição',true],[myRank.totalPts+' pts','Pontuação',false],[myRank.exactScores,'Exatos',false],[myRank.betCount,'Apostas',false]].forEach(function(x){
      h += '<div><div style="font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.6;margin-bottom:2px;">'+x[1]+'</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.7rem;font-weight:900;line-height:1;color:'+(x[2]?'#F5C518':'white')+';">'+x[0]+'</div></div>';
    });
    h += '</div>';

    // Two columns
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">';

    // Ranking
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="padding:14px 18px 10px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">';
    h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">🏆 Top Ranking</span>';
    h += '<button data-nav="ranking" style="padding:4px 10px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:7px;font-size:.72rem;font-weight:600;cursor:pointer;color:#5A6385;">Ver tudo →</button>';
    h += '</div><div style="padding:6px 16px 12px;">';
    ranking.slice(0,8).forEach(function(r){
      var isMe = r.email===user.email;
      var posBg = r.position===1?'linear-gradient(135deg,#FFD700,#FFA500)':r.position===2?'linear-gradient(135deg,#C0C0C0,#A8A8A8)':r.position===3?'linear-gradient(135deg,#CD7F32,#A0522D)':'#EEF0F6';
      var posColor = r.position<=3?'white':'#5A6385';
      h += '<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #EEF0F6;">';
      h += '<div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;background:'+posBg+';color:'+posColor+';flex-shrink:0;">'+r.position+'</div>';
      h += '<div style="width:28px;height:28px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:white;flex-shrink:0;">'+esc(r.initials)+'</div>';
      h += '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.name)+(isMe?' <span style="font-size:.58rem;color:#3D5AC8">(você)</span>':'')+'</div>';
      h += '<div style="font-size:.65rem;color:#9CA3BF;">'+esc(r.company)+'</div></div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.05rem;font-weight:900;color:#1B2B6B;">'+r.totalPts+'</div></div>';
    });
    h += '</div></div>';

    // Right col
    h += '<div style="display:flex;flex-direction:column;gap:14px;">';

    // Proximos
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="padding:12px 16px 8px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">';
    h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">🔥 Próximos Jogos</span>';
    h += '<button data-nav="palpites" style="padding:4px 10px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:7px;font-size:.72rem;font-weight:600;cursor:pointer;color:#5A6385;">Palpitar →</button>';
    h += '</div><div style="padding:8px 14px 12px;">';
    if (!nextGames.length) {
      h += '<div style="text-align:center;padding:16px;color:#9CA3BF;font-size:.8rem;">📅 Nenhum jogo agendado</div>';
    } else {
      nextGames.forEach(function(g){
        var bet=userBets[g.id], canBet=Utils.canBet(g);
        h += '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #EEF0F6;">';
        h += '<div style="flex:1;min-width:0;"><div style="font-size:.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(flag(g.home))+' '+g.home+' × '+g.away+' '+(flag(g.away))+'</div>';
        h += '<div style="font-size:.65rem;color:#9CA3BF;">'+Utils.formatDateTime(g.date)+'</div></div>';
        if(bet) h+='<span style="font-size:.7rem;font-weight:700;color:#16A34A;">✓ '+bet.home_score+'×'+bet.away_score+'</span>';
        else if(canBet) h+='<button data-nav="palpites" style="padding:4px 9px;background:#F5C518;color:#1B2B6B;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;">Palpitar</button>';
        else h+='<span style="font-size:.68rem;color:#9CA3BF;">🔒</span>';
        h += '</div>';
      });
    }
    h += '</div></div>';

    // Resultados
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="padding:12px 16px 8px;border-bottom:1px solid #EEF0F6;">';
    h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">⚽ Últimos Resultados</span>';
    h += '</div><div style="padding:8px 14px 12px;">';
    if (!finishedGames.length) {
      h += '<div style="text-align:center;padding:16px;color:#9CA3BF;font-size:.8rem;">Nenhum resultado ainda</div>';
    } else {
      finishedGames.slice(-4).reverse().forEach(function(g){
        var bet=userBets[g.id], pts='';
        if(bet&&g.result){var sc=Scoring.calculate(bet,{home_score:g.result.home_score,away_score:g.result.away_score,phase:g.phase});pts='<span style="font-size:.7rem;font-weight:700;color:'+(sc.total>0?'#16A34A':'#DC2626')+'">'+(sc.total>0?'+'+sc.total+' pts':'Errou')+'</span>';}
        h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid #EEF0F6;">';
        h += '<div style="flex:1;min-width:0;font-size:.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(flag(g.home))+' '+g.home+' × '+g.away+' '+(flag(g.away))+'</div>';
        h += '<div style="display:flex;align-items:center;gap:6px;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.05rem;font-weight:900;color:#1B2B6B;">'+g.result.home_score+' × '+g.result.away_score+'</span>'+pts+'</div>';
        h += '</div>';
      });
    }
    h += '</div></div>';
    h += '</div></div>'; // right + grid

    // Stats bar
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:18px;">';
    var leader=ranking[0];
    [{icon:'🥇',val:leader?esc(leader.name).split(' ')[0]:'—',lbl:'Líder'},{icon:'🎯',val:Math.max.apply(null,[0].concat(ranking.map(function(r){return r.exactScores;}))),lbl:'Mais Exatos'},{icon:'⚽',val:finishedGames.length,lbl:'Computados'},{icon:'👥',val:ranking.length,lbl:'Participantes'}].forEach(function(s){
      h += '<div style="background:white;border-radius:12px;border:1px solid #DDE1EE;padding:11px 14px;display:flex;align-items:center;gap:10px;">';
      h += '<span style="font-size:1.5rem;">'+s.icon+'</span>';
      h += '<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.15rem;font-weight:900;color:#1B2B6B;line-height:1;">'+s.val+'</div>';
      h += '<div style="font-size:.65rem;color:#9CA3BF;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">'+s.lbl+'</div></div>';
      h += '</div>';
    });
    h += '</div>';

    pc.innerHTML = h;
    pc.addEventListener('click', function(e){
      var btn=e.target.closest('[data-nav]');
      if(btn) SPA.navigate(btn.getAttribute('data-nav'));
    });
  }

  render();
  // Store interval ID and guard with SPA.current check inside render()
  intervalId = setInterval(render, 30000);
})();

}};
