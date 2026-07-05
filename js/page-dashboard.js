SPA.pages["dashboard"]={style:`
.db-wrap{display:flex;flex-direction:column;gap:18px;}
.db-grid2{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;align-items:start;}
.db-col{display:flex;flex-direction:column;gap:16px;}
.db-card{background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;}
.db-cardhead{padding:13px 18px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;gap:8px;}
.db-cardtitle{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:.92rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;}
.db-link{padding:4px 10px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:7px;font-size:.72rem;font-weight:600;cursor:pointer;color:#5A6385;white-space:nowrap;}
.db-perfgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:14px;}
.db-statrow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
.db-hero{background:linear-gradient(135deg,#1B2B6B 0%,#3D5AC8 100%);border-radius:16px;padding:20px 24px;color:white;display:flex;align-items:center;gap:20px;position:relative;overflow:hidden;}
.db-herologo{height:96px;width:auto;flex-shrink:0;filter:drop-shadow(0 4px 12px rgba(0,0,0,.25));}
.db-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid #EEF0F6;}
.db-row:last-child{border-bottom:none;}
@media(max-width:860px){ .db-grid2{grid-template-columns:1fr;} }
@media(max-width:600px){
  .db-hero{padding:16px 18px;gap:14px;}
  .db-herologo{height:66px;}
  .db-statrow{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:400px){ .db-statrow{grid-template-columns:repeat(2,1fr);} }
`,script:function(){
(function(){
  var user = Auth.user;
  var intervalId = null;
  var bound = false;

  function moveBadge(movement, email, pos){
    if (pos === '—') return '';
    var prev = movement[email];
    if (prev == null) return '<span title="Novo no ranking" style="font-size:.6rem;font-weight:800;color:#3D5AC8;">novo</span>';
    var d = prev - pos;
    if (d > 0) return '<span title="Subiu '+d+'" style="font-size:.66rem;font-weight:800;color:#16A34A;">▲'+d+'</span>';
    if (d < 0) return '<span title="Caiu '+(-d)+'" style="font-size:.66rem;font-weight:800;color:#DC2626;">▼'+(-d)+'</span>';
    return '<span title="Manteve" style="font-size:.72rem;color:#C0C5D6;">–</span>';
  }

  function miniStat(label, val, color){
    return '<div style="text-align:center;">'+
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.35rem;font-weight:900;line-height:1;color:'+(color||'white')+';">'+val+'</div>'+
      '<div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;opacity:.65;margin-top:3px;">'+label+'</div></div>';
  }

  function pulseChip(icon, val, lbl){
    return '<div style="background:white;border-radius:12px;border:1px solid #DDE1EE;padding:11px 14px;display:flex;align-items:center;gap:10px;min-width:0;">'+
      '<span style="font-size:1.5rem;flex-shrink:0;">'+icon+'</span>'+
      '<div style="min-width:0;"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.15rem;font-weight:900;color:#1B2B6B;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+val+'</div>'+
      '<div style="font-size:.63rem;color:#9CA3BF;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">'+lbl+'</div></div></div>';
  }

  function render() {
    if (SPA.current !== 'dashboard') {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      return;
    }
    var pc = document.getElementById('pageContent');
    if (!pc) return;

    var games = DB.getGames();
    var ranking = DB.getRanking() || [];
    var movement = DB.get('ranking_movement', {}) || {};
    var hasMovement = Object.keys(movement).length > 0;
    var userBets = DB.getUserBets(user.email || user.id) || {};
    var myRank = ranking.find(function(r){ return r.email===user.email; })
      || {position:'—',totalPts:0,exactScores:0,correctWinners:0,goalDiff:0,oneTeam:0,betCount:0};
    var now = Date.now();

    var playable = games.filter(function(g){ return !g.tbd; });
    var finishedGames = playable.filter(function(g){ return g.result; });
    var nextGames = playable.filter(function(g){ return !g.result && new Date(g.date).getTime() > now; })
      .sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
    var pendingBets = nextGames.filter(function(g){ return Utils.canBet(g) && !userBets[g.id]; });

    // ── Métricas pessoais ──
    var mySpecials = DB.getUserSpecials(user.email) || {};
    var fr = DB.getFinalResults();
    var specPts = fr ? Scoring.calculateSpecials(mySpecials, fr) : 0;
    var gamePts = Math.max(0, (myRank.totalPts||0) - specPts);

    var myFinished = finishedGames.filter(function(g){ return userBets[g.id]; });
    var scoredCount = 0;
    myFinished.forEach(function(g){
      var sc = Scoring.calculate(userBets[g.id], {home_score:g.result.home_score, away_score:g.result.away_score, phase:g.phase});
      if (sc && sc.total > 0) scoredCount++;
    });
    var accuracy = myFinished.length ? Math.round(scoredCount/myFinished.length*100) : null;

    var leader = ranking[0];
    var gapLeader = (leader && myRank.position!=='—') ? (leader.totalPts - myRank.totalPts) : null;
    var nextUp = (myRank.position!=='—') ? ranking.find(function(r){ return r.position === myRank.position-1; }) : null;
    var gapNext = nextUp ? (nextUp.totalPts - myRank.totalPts) : null;

    var h = '<div class="db-wrap">';

    // ── Hero ──
    h += '<div class="db-hero">';
    h += '<img class="db-herologo" src="'+FIFA_LOGO+'" alt="FIFA World Cup 2026"/>';
    h += '<div style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;min-width:0;">';
    h += '<div style="min-width:0;"><div style="font-size:.78rem;opacity:.7;margin-bottom:4px;">Olá, '+esc(user.name).split(' ')[0]+' 👋</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.7rem;font-weight:900;text-transform:uppercase;line-height:1.05;">Copa do Mundo FIFA 2026</div>';
    h += '<div style="font-size:.75rem;opacity:.6;margin-top:4px;">USA · Canadá · México &nbsp;|&nbsp; Porter & Almah</div></div>';
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    h += '<button data-nav="apostas" style="padding:11px 20px;background:#F5C518;color:#1B2B6B;border:none;border-radius:10px;font-weight:800;font-size:.9rem;cursor:pointer;">⚽ Palpitar</button>';
    h += '<button data-nav="ranking" style="padding:11px 20px;background:rgba(255,255,255,.15);color:white;border:1.5px solid rgba(255,255,255,.4);border-radius:10px;font-weight:700;font-size:.9rem;cursor:pointer;">🏆 Ranking</button>';
    h += '</div></div></div>';

    // ── Alerta de pendências ──
    if (pendingBets.length > 0) {
      var soon = pendingBets[0];
      var dlTxt = Utils.formatCountdown(Utils.betDeadline(soon).getTime());
      h += '<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;background:rgba(245,197,24,.13);border-radius:12px;border-left:4px solid #F5C518;color:#92400E;flex-wrap:wrap;">';
      h += '<span style="font-size:1.3rem;">⚠️</span>';
      h += '<div style="flex:1;min-width:140px;font-size:.86rem;"><strong>'+pendingBets.length+' palpite(s) pendente(s)</strong>';
      h += dlTxt ? '<div style="font-size:.72rem;opacity:.85;">Mais próximo: '+esc(soon.home)+' × '+esc(soon.away)+' · '+dlTxt+'</div>' : '';
      h += '</div>';
      h += '<button data-nav="apostas" style="background:#92400E;border:none;cursor:pointer;font-weight:700;color:white;padding:8px 16px;border-radius:8px;font-size:.82rem;">Palpitar agora →</button>';
      h += '</div>';
    }

    // ── Painel de desempenho pessoal ──
    h += '<div style="background:linear-gradient(135deg,#1B2B6B,#2A3F9A);border-radius:16px;padding:20px 22px;color:white;">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:16px;">';
    h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;text-transform:uppercase;letter-spacing:.5px;">📊 Meu Desempenho</span>';
    h += '<button data-nav="perfil" style="padding:4px 11px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:7px;font-size:.72rem;font-weight:600;cursor:pointer;color:white;">Ver perfil →</button>';
    h += '</div>';

    // Blocos principais: posição / pontos
    h += '<div class="db-perfgrid" style="margin-bottom:16px;">';
    // Posição
    var posSub;
    if (myRank.position==='—') posSub='sem palpites computados';
    else if (gapLeader===0) posSub='👑 você lidera!';
    else if (gapNext===0) posSub='empatado com o '+(myRank.position-1)+'º';
    else if (gapNext>0) posSub='faltam '+gapNext+' pts pro '+(myRank.position-1)+'º';
    else posSub='';
    h += '<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;">';
    h += '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.6;margin-bottom:4px;">Posição</div>';
    h += '<div style="display:flex;align-items:baseline;gap:8px;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:2.4rem;font-weight:900;line-height:1;color:#F5C518;">'+myRank.position+(myRank.position!=='—'?'º':'')+'</span>';
    h += hasMovement ? moveBadge(movement, user.email, myRank.position) : '';
    h += '</div>';
    h += posSub ? '<div style="font-size:.68rem;opacity:.75;margin-top:5px;font-weight:600;">'+posSub+'</div>' : '';
    h += '</div>';
    // Pontos
    h += '<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;">';
    h += '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.6;margin-bottom:4px;">Pontuação Total</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2.4rem;font-weight:900;line-height:1;">'+(myRank.totalPts||0)+'<span style="font-size:1rem;opacity:.6;"> pts</span></div>';
    h += '<div style="display:flex;gap:12px;margin-top:6px;font-size:.68rem;opacity:.8;font-weight:600;">';
    h += '<span>⚽ Jogos: '+gamePts+'</span><span>🎯 Especiais: '+specPts+'</span></div>';
    h += (gapLeader>0 ? '<div style="font-size:.66rem;opacity:.7;margin-top:3px;">'+gapLeader+' pts atrás do líder</div>' : (gapLeader===0?'<div style="font-size:.66rem;color:#F5C518;margin-top:3px;font-weight:700;">🥇 topo da tabela</div>':''));
    h += '</div>';
    h += '</div>';

    // Linha de mini-stats
    h += '<div class="db-statrow" style="padding-top:14px;border-top:1px solid rgba(255,255,255,.12);">';
    h += miniStat('🎯 Exatos', myRank.exactScores||0, '#7DD3A0');
    h += miniStat('✅ Vencedor', myRank.correctWinners||0, 'white');
    h += miniStat('📊 Saldo', myRank.goalDiff||0, 'white');
    h += miniStat('⚽ 1 Time', myRank.oneTeam||0, 'white');
    h += miniStat('📈 Aproveit.', accuracy!=null ? accuracy+'%' : '—', accuracy!=null && accuracy>=50 ? '#7DD3A0' : '#F5C518');
    h += '</div>';
    h += '</div>'; // painel

    // ── Grid 2 colunas ──
    h += '<div class="db-grid2">';

    // Coluna esquerda: Próximos + Resultados
    h += '<div class="db-col">';

    // Próximos jogos
    h += '<div class="db-card"><div class="db-cardhead"><span class="db-cardtitle">🔥 Próximos Jogos</span>';
    h += '<button data-nav="apostas" class="db-link">Palpitar →</button></div>';
    h += '<div style="padding:6px 16px 12px;">';
    if (!nextGames.length) {
      h += '<div style="text-align:center;padding:20px;color:#9CA3BF;font-size:.82rem;">📅 Nenhum jogo agendado</div>';
    } else {
      nextGames.slice(0,6).forEach(function(g){
        var bet=userBets[g.id], canBet=Utils.canBet(g), needsBet=canBet&&!bet;
        var dl=Utils.betDeadline(g).getTime();
        h += '<div class="db-row"'+(needsBet?' style="padding:8px 8px;margin:0 -8px;background:rgba(245,197,24,.07);border-radius:8px;border-bottom:1px solid #EEF0F6;"':'')+'>';
        h += '<div style="flex:1;min-width:0;">';
        h += '<div style="font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+flag(g.home)+' '+esc(g.home)+' × '+esc(g.away)+' '+flag(g.away)+'</div>';
        h += '<div style="display:flex;align-items:center;gap:8px;font-size:.65rem;color:#9CA3BF;margin-top:2px;flex-wrap:wrap;">';
        h += '<span>'+Utils.formatDateTime(g.date)+'</span>';
        h += '<span style="color:#5A6385;font-weight:600;">'+Utils.phaseName(g.phase)+(g.group?' · Gr '+g.group:'')+'</span>';
        if (canBet) h += '<span class="bet-countdown" data-deadline="'+dl+'" style="color:#B45309;font-weight:700;">⏰ '+(Utils.formatCountdown(dl)||'')+'</span>';
        h += '</div>';
        h += (typeof Odds!=='undefined'?Odds.miniHtml(g):'');
        h += '</div>';
        if(bet) h+='<span style="font-size:.72rem;font-weight:700;color:#16A34A;white-space:nowrap;">✓ '+bet.home_score+'×'+bet.away_score+'</span>';
        else if(canBet) h+='<button data-nav="apostas" style="padding:5px 11px;background:#F5C518;color:#1B2B6B;border:none;border-radius:7px;font-size:.72rem;font-weight:800;cursor:pointer;white-space:nowrap;">Palpitar</button>';
        else h+='<span style="font-size:.7rem;color:#9CA3BF;">🔒</span>';
        h += '</div>';
      });
    }
    h += '</div></div>';

    // Últimos resultados
    h += '<div class="db-card"><div class="db-cardhead"><span class="db-cardtitle">⚽ Últimos Resultados</span>';
    h += '<button data-nav="resultados" class="db-link">Ver tudo →</button></div>';
    h += '<div style="padding:6px 16px 12px;">';
    if (!finishedGames.length) {
      h += '<div style="text-align:center;padding:20px;color:#9CA3BF;font-size:.82rem;">Nenhum resultado ainda</div>';
    } else {
      finishedGames.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date);}).slice(0,6).forEach(function(g){
        var bet=userBets[g.id], badge='';
        if(bet){
          var sc=Scoring.calculate(bet,{home_score:g.result.home_score,away_score:g.result.away_score,phase:g.phase});
          var ok=sc&&sc.total>0;
          var multD=sc?(sc.multiplier||1):1;
          badge='<span title="Palpite '+bet.home_score+'×'+bet.away_score+' — '+(sc?Scoring.breakdownText(sc):'')+'" style="font-size:.7rem;font-weight:800;padding:2px 8px;border-radius:99px;white-space:nowrap;cursor:help;background:'+(ok?'rgba(34,197,94,.12)':'rgba(239,68,68,.1)')+';color:'+(ok?'#16A34A':'#DC2626')+';">'+(ok?'+'+sc.total:'0')+(ok&&multD>1?' 🔥'+multD+'×':'')+'</span>';
        } else {
          badge='<span style="font-size:.64rem;color:#C0C5D6;">sem palpite</span>';
        }
        h += '<div class="db-row">';
        h += '<div style="flex:1;min-width:0;"><div style="font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+flag(g.home)+' '+esc(g.home)+' × '+esc(g.away)+' '+flag(g.away)+'</div>';
        h += '<div style="font-size:.64rem;color:#9CA3BF;margin-top:2px;">'+Utils.phaseName(g.phase)+'</div></div>';
        h += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:#1B2B6B;white-space:nowrap;">'+g.result.home_score+' × '+g.result.away_score+'</span>'+badge+'</div>';
        h += '</div>';
      });
    }
    h += '</div></div>';
    h += '</div>'; // col esquerda

    // Coluna direita: Ranking
    h += '<div class="db-col">';
    h += '<div class="db-card"><div class="db-cardhead"><span class="db-cardtitle">🏆 Top Ranking</span>';
    h += '<button data-nav="ranking" class="db-link">Ver tudo →</button></div>';
    h += '<div style="padding:6px 16px 12px;">';
    if (!ranking.length) {
      h += '<div style="text-align:center;padding:20px;color:#9CA3BF;font-size:.82rem;">Ranking ainda vazio</div>';
    } else {
      var top = ranking.slice(0,8);
      var meInTop = top.some(function(r){ return r.email===user.email; });
      function rankRow(r, dim){
        var isMe = r.email===user.email;
        var posBg = r.position===1?'linear-gradient(135deg,#FFD700,#FFA500)':r.position===2?'linear-gradient(135deg,#C0C0C0,#A8A8A8)':r.position===3?'linear-gradient(135deg,#CD7F32,#A0522D)':'#EEF0F6';
        var posColor = r.position<=3?'white':'#5A6385';
        var s = '<div class="db-row"'+(isMe?' style="background:rgba(27,43,107,.06);margin:0 -8px;padding:8px;border-radius:8px;box-shadow:inset 3px 0 0 #D4A80F;border-bottom:1px solid #EEF0F6;"':'')+'>';
        s += '<div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;background:'+posBg+';color:'+posColor+';flex-shrink:0;">'+r.position+'</div>';
        s += hasMovement ? '<div style="width:18px;flex-shrink:0;text-align:center;">'+moveBadge(movement,r.email,r.position)+'</div>' : '';
        s += '<div style="width:28px;height:28px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:white;flex-shrink:0;">'+esc(r.initials)+'</div>';
        s += '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.name)+(isMe?' <span style="font-size:.58rem;color:#3D5AC8">(você)</span>':'')+'</div>';
        s += '<div style="font-size:.64rem;color:#9CA3BF;">'+esc(r.company)+'</div></div>';
        s += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:#1B2B6B;">'+r.totalPts+'</div></div>';
        return s;
      }
      top.forEach(function(r){ h += rankRow(r); });
      // Minha linha, se fora do top 8
      if (!meInTop && myRank.position!=='—') {
        h += '<div style="text-align:center;color:#C0C5D6;font-size:.9rem;line-height:.6;padding:2px 0;">···</div>';
        h += rankRow(myRank);
      }
    }
    h += '</div></div>';
    h += '</div>'; // col direita
    h += '</div>'; // grid2

    // ── Pulso do torneio ──
    var totalPlayable = playable.length;
    var pct = totalPlayable ? Math.round(finishedGames.length/totalPlayable*100) : 0;
    var curPhase = nextGames.length ? Utils.phaseName(nextGames[0].phase) : (finishedGames.length?'Reta final':'A começar');
    var bestExact = Math.max.apply(null,[0].concat(ranking.map(function(r){return r.exactScores||0;})));

    h += '<div class="db-card"><div class="db-cardhead"><span class="db-cardtitle">🌍 Pulso do Torneio</span>';
    h += '<span style="font-size:.72rem;color:#9CA3BF;">Fase atual: <strong style="color:#1B2B6B;">'+curPhase+'</strong></span></div>';
    h += '<div style="padding:14px 18px;">';
    // Barra de progresso
    h += '<div style="display:flex;align-items:center;justify-content:space-between;font-size:.72rem;color:#5A6385;margin-bottom:6px;"><span style="font-weight:700;">Jogos computados</span><span><strong style="color:#1B2B6B;">'+finishedGames.length+'</strong> / '+totalPlayable+' ('+pct+'%)</span></div>';
    h += '<div style="height:9px;background:#EEF0F6;border-radius:99px;overflow:hidden;margin-bottom:16px;"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#1B2B6B,#3D5AC8);border-radius:99px;transition:width .4s;"></div></div>';
    // Chips
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">';
    h += pulseChip('🥇', leader?esc(leader.name).split(' ')[0]:'—', 'Líder');
    h += pulseChip('👥', ranking.length, 'Participantes');
    h += pulseChip('🎯', bestExact, 'Recorde de exatos');
    h += pulseChip('🔥', nextGames.length, 'Jogos por vir');
    h += '</div>';
    h += '</div></div>';

    h += '</div>'; // wrap

    pc.innerHTML = h;

    if (!bound) {
      bound = true;
      pc.addEventListener('click', function(e){
        var btn=e.target.closest('[data-nav]');
        if(btn) SPA.navigate(btn.getAttribute('data-nav'));
      });
    }
  }

  // Boot: pinta com cache, depois busca fresco (bets, ranking, movimento, especiais)
  render();
  (function(){
    var jobs=[];
    if (window.syncBetsFromSupabase) jobs.push(window.syncBetsFromSupabase());
    if (window.syncRankingMovementFromSupabase) jobs.push(window.syncRankingMovementFromSupabase());
    if (window.syncSpecialsFromSupabase) jobs.push(window.syncSpecialsFromSupabase());
    if (jobs.length) Promise.all(jobs).then(function(){ if(SPA.current==='dashboard') render(); }, function(){});
  })();
  if (typeof Odds !== 'undefined') Odds.load().then(function(){ if(SPA.current==='dashboard') render(); });

  intervalId = setInterval(render, 30000);
})();

}};
