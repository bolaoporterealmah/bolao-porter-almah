SPA.pages["apostas"]={style:`.phase-section { margin-bottom: 28px; }
.phase-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--porter-gray-200);
}
.phase-title {
  font-family: var(--font-display);
  font-size: 1rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--porter-blue);
  display: flex; align-items: center; gap: 8px;
}
.phase-mult {
  font-size: 0.72rem; font-weight: 700;
  background: var(--porter-accent);
  color: var(--porter-blue);
  padding: 3px 8px; border-radius: 99px;
}

.games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px,1fr)); gap: 14px; }

.bet-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--porter-gray-200);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.bet-card.has-bet { border-color: rgba(34,197,94,0.4); }
.bet-card.closed { opacity: 0.65; }
.bet-card.tbd { opacity: 0.5; }
.bet-card:hover:not(.closed):not(.tbd) { box-shadow: var(--shadow-md); }

.bet-card-header {
  padding: 10px 14px;
  background: var(--porter-blue);
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
}
.bet-card-phase { font-size: 0.68rem; color: rgba(255,255,255,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.bet-card-date { font-size: 0.75rem; color: rgba(255,255,255,0.9); font-weight: 600; }
.bet-card-stadium { font-size: 0.65rem; color: rgba(255,255,255,0.5); }

.bet-card-

.bet-teams-row {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin-bottom: 14px;
}
.bet-team { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
.bet-flag { font-size: 2.2rem; line-height: 1; }
.bet-team-name { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: var(--porter-gray-800); text-align: center; }

.bet-score-row {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  margin-bottom: 14px;
}
.bet-score-ctrl {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.score-up-down { display: flex; gap: 4px; }
.score-btn {
  width: 24px; height: 24px;
  background: var(--porter-gray-100);
  border-radius: var(--radius-sm);
  font-size: 0.9rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s;
  user-select: none;
}
.score-btn:hover { background: var(--porter-gray-200); }
.bet-score-num {
  width: 52px; height: 52px;
  border: 2px solid var(--porter-gray-200);
  border-radius: var(--radius-md);
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.5rem; font-weight: 900;
  color: var(--porter-blue);
  outline: none;
  transition: border-color 0.2s;
}
.bet-score-num:focus { border-color: var(--porter-blue-light); box-shadow: 0 0 0 3px rgba(61,90,200,0.12); }
.bet-sep { font-family: var(--font-display); font-size: 1.6rem; font-weight: 900; color: var(--porter-gray-300); }

.bet-card-footer {
  padding: 10px 14px 14px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}

.bet-saved-tag {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.72rem; font-weight: 600; color: #16A34A;
}

.deadline-warn {
  font-size: 0.7rem; color: var(--porter-red); font-weight: 600;
  display: flex; align-items: center; gap: 3px;
}

.saved-score {
  background: rgba(34,197,94,0.08);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: 0.8rem; font-weight: 700; color: #16A34A;
}

.filter-bar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px; flex-wrap: wrap;
}
.filter-btn {
  padding: 6px 14px; border-radius: 99px;
  font-size: 0.8rem; font-weight: 600;
  background: var(--porter-gray-100);
  color: var(--porter-gray-600);
  border: 1px solid var(--porter-gray-200);
  cursor: pointer; transition: all 0.2s;
}
.filter-btn.active { background: var(--porter-blue); color: white; border-color: var(--porter-blue); }`,script:function(){

(function(){
  var user = Auth.user;
  var currentFilter = 'all';

  function render() {
    var games = DB.getGames().slice().sort(function(a,b){
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    var userBets = DB.getUserBets(user.email || user.id);
    var pc = document.getElementById('pageContent');
    if (!pc) return;

    var filtered = games.filter(function(g){
      if (currentFilter==='open') return Utils.canBet(g);
      if (currentFilter==='done') return !!userBets[g.id];
      if (currentFilter==='pending') return Utils.canBet(g) && !userBets[g.id];
      if (currentFilter==='finished') return !!g.result;
      return true;
    });

    var openCount = games.filter(function(g){ return Utils.canBet(g) && !userBets[g.id]; }).length;
    var doneCount = Object.keys(userBets).length;

    // Group by phase
    var phases = {};
    var phaseOrder = ['groups','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'];
    filtered.forEach(function(g){
      if (!phases[g.phase]) phases[g.phase] = [];
      phases[g.phase].push(g);
    });

    var h = '';

    // Stats
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px;">';
    h += sCard('Palpites Abertos', games.filter(function(g){return Utils.canBet(g);}).length, '#1B2B6B');
    h += sCard('Meus Palpites', doneCount, '#16A34A');
    h += sCard('Pendentes', openCount, '#D4A80F');
    h += sCard('Fecha 1h antes', '⏰', '#5A6385');
    h += '</div>';

    // Filter buttons
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;">';
    [['all','Todos'],['open','Abertos'],['pending','Pendentes'],['done','Palpitados'],['finished','Finalizados']].forEach(function(f){
      var active = f[0]===currentFilter;
      h += '<button data-betfilter="'+f[0]+'" style="padding:5px 14px;border-radius:99px;font-size:.78rem;font-weight:600;cursor:pointer;border:1px solid '+(active?'#1B2B6B':'#DDE1EE')+';background:'+(active?'#1B2B6B':'white')+';color:'+(active?'white':'#5A6385')+';">'+f[1]+'</button>';
    });
    h += '</div>';

    var hasGames = false;
    phaseOrder.forEach(function(phase){
      if (!phases[phase] || phases[phase].length===0) return;
      hasGames = true;
      var mult = Utils.phaseMultiplier(phase);
      h += '<div style="margin-bottom:28px;">';
      h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #DDE1EE;">';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.95rem;font-weight:800;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;display:flex;align-items:center;gap:8px;">';
      h += (phase==='groups'?'🌎':phase==='final'?'🏆':'⚡')+' '+Utils.phaseName(phase);
      if (mult>1) h += '<span style="background:#F5C518;color:#1B2B6B;padding:2px 8px;border-radius:99px;font-size:.65rem;font-weight:800;">'+mult+'x pontos</span>';
      h += '</div>';
      h += '<span style="font-size:.8rem;color:#9CA3BF;">'+phases[phase].length+' jogo(s)</span>';
      h += '</div>';
      // Sub-group by day (games already sorted chronologically)
      var dayKeys = [], byDay = {};
      phases[phase].forEach(function(g){
        var k = new Date(g.date).toDateString();
        if (!byDay[k]) { byDay[k] = []; dayKeys.push(k); }
        byDay[k].push(g);
      });
      dayKeys.forEach(function(k){
        var dayGames = byDay[k];
        h += '<div style="margin-bottom:18px;">';
        h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.82rem;font-weight:700;color:#5A6385;text-transform:capitalize;margin-bottom:8px;display:flex;align-items:center;gap:6px;">📅 '+Utils.formatDate(dayGames[0].date)+' <span style="color:#9CA3BF;font-weight:600;">· '+dayGames.length+' jogo(s)</span></div>';
        h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">';
        dayGames.forEach(function(g){ h += renderGameCard(g, userBets[g.id]); });
        h += '</div></div>';
      });
      h += '</div>';
    });

    if (!hasGames) {
      h += '<div style="text-align:center;padding:60px 24px;">';
      h += '<div style="font-size:3rem;opacity:.3;margin-bottom:12px;">⚽</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:1.1rem;color:#9CA3BF;text-transform:uppercase;">Nenhum jogo nesta categoria</div>';
      h += '</div>';
    }

    pc.innerHTML = h;


    // Expose handlers for global listener (registered once at app boot)
    window._apostasSetFilter = function(f) { currentFilter = f; render(); };
    window._apostasSave = function(gameId) {
      var h_el = document.getElementById('score-home-'+gameId);
      var a_el = document.getElementById('score-away-'+gameId);
      if (!h_el||!a_el) return;
      var hv=h_el.value, av=a_el.value;
      if(hv===''||av===''){Utils.toast('Informe o placar completo!','error');return;}
      var game=DB.getGames().find(function(g){return g.id===gameId;});
      if(!game||!Utils.canBet(game)){Utils.toast('Palpites encerrados.','error');return;}
      DB.saveBet(user.email||user.id,gameId,{home_score:parseInt(hv),away_score:parseInt(av)});
      Utils.toast('Palpite salvo: '+game.home+' '+hv+'×'+av+' '+game.away+' ✓','success');
      render();
    };
  }

  function sCard(label, val, color) {
    return '<div style="background:white;border-radius:12px;border:1px solid #DDE1EE;padding:14px 16px;box-shadow:0 1px 3px rgba(27,43,107,.08);">' +
      '<div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;margin-bottom:4px;">'+label+'</div>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.7rem;font-weight:900;color:'+color+';line-height:1;">'+val+'</div>' +
      '</div>';
  }

  function renderGameCard(game, bet) {
    var canBet = Utils.canBet(game);
    var isFinished = !!game.result;
    var isTbd = game.tbd;
    var hasBet = !!bet;

    // Score earned (finished games) — drives header color / highlight
    var sc = (isFinished && bet) ? Scoring.calculate(bet, {home_score:game.result.home_score,away_score:game.result.away_score,phase:game.phase}) : null;
    var isExact = !!(sc && sc.base === 15);
    // Brazil game not yet played → patriotic highlight
    var isBrazil = !isFinished && (game.home === 'Brasil' || game.away === 'Brasil');
    var headerBg = '#1B2B6B';
    if (isFinished) headerBg = isExact ? 'linear-gradient(90deg,#15803D 0%,#F5C518 100%)' : (sc && sc.total > 0 ? '#16A34A' : '#DC2626');
    else if (isBrazil) headerBg = 'linear-gradient(135deg,#009C3B 0%,#00b347 45%,#002776 100%)';

    var borderColor = isExact ? '#F5C518' : (isBrazil ? '#FFDF00' : (hasBet ? 'rgba(34,197,94,.4)' : '#DDE1EE'));
    var cardShadow = isBrazil ? '0 0 0 1.5px #009C3B, 0 4px 16px rgba(0,156,59,.28)' : '0 1px 4px rgba(27,43,107,.07)';
    var opacity = (!canBet && !hasBet && !isFinished) ? '.6' : '1';

    var h = '<div style="background:white;border-radius:14px;border:'+(isBrazil?'2px':'1.5px')+' solid '+borderColor+';box-shadow:'+cardShadow+';overflow:hidden;opacity:'+opacity+';">';

    // Card header
    h += '<div style="background:'+headerBg+';padding:9px 14px;display:flex;align-items:center;justify-content:space-between;'+(isExact?'box-shadow:inset 0 0 0 2px rgba(255,255,255,.35);':'')+'">';
    h += '<div><div style="font-size:.65rem;color:rgba(255,255,255,.7);font-weight:600;text-transform:uppercase;">'+(isExact?'⭐ ':'')+(isBrazil?'🇧🇷 ':'')+Utils.phaseName(game.phase)+(game.group?' · Grupo '+game.group:'')+'</div>';
    if (isBrazil) h += '<div style="font-size:.64rem;font-weight:800;letter-spacing:.5px;color:#FFDF00;margin-top:1px;text-shadow:0 1px 2px rgba(0,0,0,.25);">SELEÇÃO EM CAMPO! 🏆</div>';
    else h += '<div style="font-size:.65rem;color:rgba(255,255,255,.5);margin-top:1px;">'+(game.city||'')+'</div>';
    h += '</div>';
    h += '<div style="font-size:.72rem;color:rgba(255,255,255,.95);font-weight:'+(isExact?'800':'600')+';">'+(isExact?'CRAVOU! ':'')+Utils.formatDateTime(game.date)+'</div>';
    h += '</div>';

    if (isTbd) {
      h += '<div style="padding:16px 14px;text-align:center;">';
      if (game.desc) {
        h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;font-weight:800;color:#1B2B6B;margin-bottom:4px;">'+game.desc+'</div>';
      }
      h += '<div style="font-size:.78rem;color:#9CA3BF;margin-bottom:8px;">⏳ Confronto a definir após a fase de grupos</div>';
      h += '<div style="display:flex;align-items:center;justify-content:center;gap:12px;font-size:.75rem;">';
      h += '<span style="color:#5A6385;font-weight:600;">📅 '+Utils.formatDate(game.date)+'</span>';
      h += '<span style="color:#5A6385;font-weight:600;">🕐 '+Utils.formatTime(game.date)+'</span>';
      h += '<span style="color:#9CA3BF;">📍 '+game.city+'</span>';
      h += '</div>';
      h += '</div>';
      h += '</div>'; return h;
    }

    var hFlag = flag(game.home), aFlag = flag(game.away);

    // Teams + score input
    h += '<div style="padding:14px;">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;">';

    // Home team
    h += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;">';
    h += '<div style="font-size:2rem;">'+hFlag+'</div>';
    h += '<div style="font-size:.68rem;font-weight:700;text-transform:uppercase;text-align:center;color:#2D3557;">'+game.home+'</div>';
    h += '</div>';

    // Score area
    h += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">';
    if (canBet) {
      h += '<div style="display:flex;align-items:center;gap:8px;">';
      // Home score ctrl
      h += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">';
      h += '<div style="display:flex;gap:3px;">';
      h += '<button data-score="'+game.id+'|home|1" style="width:22px;height:22px;background:#EEF0F6;border:none;border-radius:5px;cursor:pointer;font-size:.85rem;font-weight:700;">+</button>';
      h += '<button data-score="'+game.id+'|home|-1" style="width:22px;height:22px;background:#EEF0F6;border:none;border-radius:5px;cursor:pointer;font-size:.85rem;font-weight:700;">−</button>';
      h += '</div>';
      h += '<input id="score-home-'+game.id+'" type="number" min="0" max="20" value="'+(bet?bet.home_score:'')+'" placeholder="0" ';
      h += 'style="width:50px;height:50px;text-align:center;border:2px solid #DDE1EE;border-radius:10px;font-family:\'Barlow Condensed\',sans-serif;font-size:1.5rem;font-weight:900;color:#1B2B6B;outline:none;"/>';
      h += '</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:#9CA3BF;">×</div>';
      // Away score ctrl
      h += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">';
      h += '<div style="display:flex;gap:3px;">';
      h += '<button data-score="'+game.id+'|away|1" style="width:22px;height:22px;background:#EEF0F6;border:none;border-radius:5px;cursor:pointer;font-size:.85rem;font-weight:700;">+</button>';
      h += '<button data-score="'+game.id+'|away|-1" style="width:22px;height:22px;background:#EEF0F6;border:none;border-radius:5px;cursor:pointer;font-size:.85rem;font-weight:700;">−</button>';
      h += '</div>';
      h += '<input id="score-away-'+game.id+'" type="number" min="0" max="20" value="'+(bet?bet.away_score:'')+'" placeholder="0" ';
      h += 'style="width:50px;height:50px;text-align:center;border:2px solid #DDE1EE;border-radius:10px;font-family:\'Barlow Condensed\',sans-serif;font-size:1.5rem;font-weight:900;color:#1B2B6B;outline:none;"/>';
      h += '</div>';
      h += '</div>';
    } else if (hasBet) {
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2rem;font-weight:900;color:#1B2B6B;">'+bet.home_score+' × '+bet.away_score+'</div>';
      if (isFinished) {
        var sc = Scoring.calculate(bet, {home_score:game.result.home_score,away_score:game.result.away_score,phase:game.phase});
        h += '<div style="font-size:.72rem;font-weight:700;color:'+(sc.total>0?'#16A34A':'#DC2626')+';">'+(sc.total>0?'+'+sc.total+' pts':'Errou')+'</div>';
      }
    } else {
      h += '<div style="font-size:1.8rem;opacity:.25;font-family:\'Barlow Condensed\',sans-serif;font-weight:900;">?×?</div>';
    }
    if (isFinished) {
      h += '<div style="font-size:.65rem;color:#9CA3BF;margin-top:2px;">Resultado: '+game.result.home_score+'×'+game.result.away_score+'</div>';
    }
    h += '</div>';

    // Away team
    h += '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;">';
    h += '<div style="font-size:2rem;">'+aFlag+'</div>';
    h += '<div style="font-size:.68rem;font-weight:700;text-transform:uppercase;text-align:center;color:#2D3557;">'+game.away+'</div>';
    h += '</div>';

    h += '</div>'; // teams row

    // Fonte de cada ponto (largura total, abaixo dos times) — evita quebrar as colunas
    if (isFinished && sc && sc.total > 0) {
      h += '<div style="margin-bottom:10px;padding-top:10px;border-top:1px solid #EEF0F6;">'+Scoring.breakdownHtml(sc)+'</div>';
    }

    if (!isFinished && typeof Odds !== 'undefined') h += Odds.barHtml(game);

    // Footer
    h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">';
    if (hasBet && !isFinished && !canBet) {
      h += '<span style="font-size:.72rem;font-weight:700;color:#16A34A;">✓ Palpite salvo: '+bet.home_score+'×'+bet.away_score+'</span>';
    } else if (!canBet && !hasBet && !isFinished) {
      h += '<span style="font-size:.72rem;font-weight:700;color:#9CA3BF;">🔒 Encerrado</span>';
    } else if (canBet) {
      h += '<span class="bet-countdown" data-deadline="'+Utils.betDeadline(game).getTime()+'" style="font-size:.7rem;color:#9CA3BF;font-weight:600;">⏰ '+Utils.formatCountdown(Utils.betDeadline(game).getTime())+'</span>';
    } else { h += '<span></span>'; }

    if (canBet) {
      h += '<button data-savebet="'+game.id+'" style="padding:7px 16px;background:#1B2B6B;color:white;border:none;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;">💾 Salvar</button>';
    }
    h += '</div>';

    h += '</div></div>'; // padding + card
    return h;
  }

  render();
  if (window.syncBetsFromSupabase) window.syncBetsFromSupabase().then(function(){ if(SPA.current==='apostas') render(); });
  if (typeof Odds !== 'undefined') Odds.load().then(function(){ if(SPA.current==='apostas') render(); });
})();


}};
