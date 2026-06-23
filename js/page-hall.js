SPA.pages["hall"]={style:`.hall-hero {
  background: linear-gradient(135deg, var(--porter-blue) 0%, #0f1e4a 100%);
  border-radius: var(--radius-xl);
  padding: 40px 32px;
  text-align: center; color: white;
  margin-bottom: 28px;
  position: relative; overflow: hidden;
}
.hall-hero::before { content:'🏆'; position:absolute; font-size:180px; opacity:0.05; right:-20px; top:50%; transform:translateY(-50%); }
.hall-hero .label { font-size:0.7rem; letter-spacing:2px; text-transform:uppercase; opacity:0.6; margin-bottom:8px; }
.hall-hero .title { font-family:var(--font-display); font-size:clamp(2rem,4vw,3.5rem); font-weight:900; text-transform:uppercase; line-height:1; }
.hall-hero .sub { font-size:0.9rem; opacity:0.6; margin-top:8px; }

.award-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-bottom:24px; }

.award-card {
  background: white;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--porter-gray-200);
  box-shadow: var(--shadow-md);
  text-align: center;
}
.award-banner { padding: 20px 16px 16px; }
.award-banner.gold { background: linear-gradient(135deg,#FFD700,#FFA500); }
.award-banner.silver { background: linear-gradient(135deg,#E8E8E8,#C0C0C0); }
.award-banner.bronze { background: linear-gradient(135deg,#CD9B6B,#8B4513); }
.award-banner.blue { background: linear-gradient(135deg,var(--porter-blue),var(--porter-blue-light)); }
.award-banner.purple { background: linear-gradient(135deg,#7c3aed,#a855f7); }
.award-banner.red { background: linear-gradient(135deg,#dc2626,#ef4444); }

.award-icon { font-size: 2.5rem; margin-bottom: 6px; }
.award-label { font-family:var(--font-display); font-size:0.8rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; opacity:0.75; }
.award-label.dark { color:rgba(0,0,0,0.6); }
.award-label.light { color:rgba(255,255,255,0.8); }

.award-
.award-winner { font-size:0.78rem; color:var(--porter-gray-400); text-transform:uppercase; letter-spacing:0.5px; font-weight:700; margin-bottom:4px; }
.award-name { font-weight:800; font-size:1rem; color:var(--porter-gray-900); }
.award-val { font-family:var(--font-display); font-size:1.4rem; font-weight:900; color:var(--porter-blue); }
.award-company { font-size:0.72rem; color:var(--porter-gray-400); }

.medal-section { margin-top:24px; }
.medal-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }
.medal-card {
  background:white; border-radius:var(--radius-lg); padding:16px;
  display:flex; align-items:center; gap:14px;
  border:1px solid var(--porter-gray-200); box-shadow:var(--shadow-sm);
}
.medal-icon { font-size:2rem; min-width:44px; text-align:center; }
.medal-info .medal-name { font-weight:700; font-size:0.9rem; }
.medal-info .medal-desc { font-size:0.75rem; color:var(--porter-gray-400); }
.medal-holder { margin-left:auto; text-align:right; }
.medal-holder .h-name { font-size:0.8rem; font-weight:700; }
.medal-holder .h-val { font-family:var(--font-display); font-size:1rem; font-weight:900; color:var(--porter-blue); }

.tbd-badge { display:inline-flex; align-items:center; gap:4px; background:var(--porter-gray-100); border-radius:99px; padding:4px 12px; font-size:0.72rem; color:var(--porter-gray-400); font-weight:600; }`,script:function(){

function renderHall(){
  var user = Auth.user;
  var ranking = DB.getRanking();
  var games = DB.getGames();

  var top1 = ranking[0], top2 = ranking[1], top3 = ranking[2];

  // Rei dos placares (mais placares exatos)
  var reiPlacares = ranking.slice().sort(function(a,b){ return b.exactScores - a.exactScores; })[0];

  // Apostador dedicado (mais palpites feitos — TOTAL, não só jogos encerrados)
  var maisApostas = ranking.slice().sort(function(a,b){ return (b.totalBets||0) - (a.totalBets||0); })[0];

  // Prêmios por JOGO — GLOBAIS, vêm de RPC (privacidade: cliente só tem os próprios palpites).
  var finishedGames = games.filter(function(g){ return g.result && !g.tbd; });
  var mostExact = DB.get('most_exact_game', null);     // jogo com mais placares exatos cravados
  var topDist   = DB.get('top_distributing_game', null); // jogo que mais distribuiu pontos
  var botDist   = DB.get('bottom_distributing_game', null); // jogo que menos distribuiu pontos

  // ── Prêmios "de graça" (derivados do ranking já em memória) ──────────────
  var parts = ranking.filter(function(r){ return r.role !== 'admin'; });
  function byDesc(arr, fn){ return arr.slice().sort(function(a,b){ return fn(b)-fn(a); })[0]; }
  var madrugador     = parts.filter(function(r){ return r.avgBetTime>0; }).sort(function(a,b){ return a.avgBetTime-b.avgBetTime; })[0];
  var aproveitamento = byDesc(parts.filter(function(r){ return (r.betCount||0)>=5; }), function(r){ return r.totalPts/r.betCount; });
  var bestPorter     = parts.filter(function(r){ return r.company==='Porter'; })[0]; // ranking já vem ordenado por pos
  var bestAlmah      = parts.filter(function(r){ return r.company==='Almah'; })[0];
  var faroGol        = byDesc(parts, function(r){ return r.oneTeam||0; });
  var mestreSaldo    = byDesc(parts, function(r){ return r.goalDiff||0; });

  // ── Prêmios extras via RPC (cache local) ─────────────────────────────────
  var climb   = DB.get('biggest_climb', null);
  var streak  = DB.get('hottest_streak', null);
  var vidente = DB.get('rarest_exact', null);
  var prophet = DB.get('knockout_prophet', null);
  var perfect = DB.get('perfect_predictors', []) || [];
  var duel    = DB.get('company_duel', []) || [];

  var copa_started = finishedGames.length > 0;
  var pc = document.getElementById('pageContent');
  if (!pc) return;

  var h = '';

  // Hero
  h += '<div style="background:linear-gradient(135deg,#1B2B6B,#0f1e4a);border-radius:16px;padding:32px;text-align:center;color:white;margin-bottom:24px;position:relative;overflow:hidden;">';
  h += '<div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:160px;opacity:.05;">🏆</div>';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2.5rem;font-weight:900;text-transform:uppercase;letter-spacing:1px;">🌟 Hall da Fama</div>';
  h += '<div style="font-size:.88rem;opacity:.6;margin-top:6px;">Os grandes nomes do Bolão Copa 2026 · Porter & Almah</div>';
  h += '</div>';

  // Awards grid — 5 distinct awards (removed duplicate)
  var awards = [
    { bg:'linear-gradient(135deg,#FFD700,#FFA500)', textColor:'rgba(0,0,0,.65)', icon:'🏆', title:'Campeão do Bolão',    sub:'1º lugar no ranking final',           person: top1,        val: top1 ? top1.totalPts+' pts' : null },
    { bg:'linear-gradient(135deg,#E0E0E0,#BDBDBD)', textColor:'rgba(0,0,0,.6)',  icon:'🥈', title:'Vice-Campeão',         sub:'2º lugar no ranking final',           person: top2,        val: top2 ? top2.totalPts+' pts' : null },
    { bg:'linear-gradient(135deg,#CD9B6B,#A0522D)', textColor:'white',           icon:'🥉', title:'3º Lugar',             sub:'3º lugar no ranking final',           person: top3,        val: top3 ? top3.totalPts+' pts' : null },
    { bg:'linear-gradient(135deg,#1B2B6B,#3D5AC8)', textColor:'white',           icon:'🎯', title:'Rei dos Placares',     sub:'Mais placares exatos na Copa',        person: reiPlacares, val: reiPlacares ? reiPlacares.exactScores+' exatos' : null },
  ];

  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px;">';
  awards.forEach(function(aw){
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;box-shadow:0 2px 8px rgba(27,43,107,.08);">';
    h += '<div style="background:'+aw.bg+';padding:20px 16px 16px;text-align:center;">';
    h += '<div style="font-size:2.2rem;margin-bottom:6px;">'+aw.icon+'</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:'+aw.textColor+';opacity:.85;">'+aw.title+'</div>';
    h += '</div>';
    h += '<div style="padding:16px;text-align:center;">';
    if (aw.person && copa_started) {
      h += '<div style="width:44px;height:44px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;margin:0 auto 8px;font-size:.9rem;">'+aw.person.initials+'</div>';
      h += '<div style="font-weight:800;font-size:.95rem;color:#2D3557;">'+esc(aw.person.name)+'</div>';
      h += '<div style="font-size:.72rem;color:#9CA3BF;margin-bottom:6px;">'+aw.person.company+'</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:#1B2B6B;">'+aw.val+'</div>';
    } else {
      h += '<div style="font-size:.85rem;color:#9CA3BF;margin-bottom:8px;">Aguardando</div>';
      h += '<span style="display:inline-flex;align-items:center;gap:4px;background:#EEF0F6;border-radius:99px;padding:4px 12px;font-size:.72rem;color:#9CA3BF;font-weight:600;">⏳ Em disputa</span>';
      h += '<div style="font-size:.7rem;color:#9CA3BF;margin-top:8px;">'+aw.sub+'</div>';
    }
    h += '</div></div>';
  });

  // Card de JOGO no grid (no lugar do antigo "Palpitador Dedicado"): jogo mais cravado.
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;box-shadow:0 2px 8px rgba(27,43,107,.08);">';
  h += '<div style="background:linear-gradient(135deg,#16A34A,#22C55E);padding:20px 16px 16px;text-align:center;">';
  h += '<div style="font-size:2.2rem;margin-bottom:6px;">🎯</div>';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:white;opacity:.9;">Jogo Mais Cravado</div>';
  h += '</div>';
  h += '<div style="padding:16px;text-align:center;">';
  if (mostExact && copa_started && mostExact.exact_count > 0) {
    h += '<div style="font-weight:800;font-size:.9rem;color:#2D3557;">'+flag(mostExact.home)+' '+esc(mostExact.home)+' × '+esc(mostExact.away)+' '+flag(mostExact.away)+'</div>';
    h += '<div style="font-size:.72rem;color:#9CA3BF;margin-bottom:6px;">placar '+mostExact.result_home+' × '+mostExact.result_away+'</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:#16A34A;">'+mostExact.exact_count+(mostExact.exact_count==1?' cravou':' cravaram')+'</div>';
  } else {
    h += '<div style="font-size:.85rem;color:#9CA3BF;margin-bottom:8px;">Aguardando</div>';
    h += '<span style="display:inline-flex;align-items:center;gap:4px;background:#EEF0F6;border-radius:99px;padding:4px 12px;font-size:.72rem;color:#9CA3BF;font-weight:600;">⏳ Em disputa</span>';
    h += '<div style="font-size:.7rem;color:#9CA3BF;margin-top:8px;">Jogo com mais placares exatos cravados</div>';
  }
  h += '</div></div>';

  h += '</div>';

  // Highlight: jogo que mais distribuiu pontos (substitui "Maior Pontuação em Único Jogo")
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px 22px;margin-bottom:20px;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.95rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:12px;">🔥 Jogo que Mais Distribuiu Pontos</div>';
  if (topDist && copa_started && topDist.total_pts > 0) {
    h += '<div style="display:flex;align-items:center;gap:14px;">';
    h += '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#ef4444);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🔥</div>';
    h += '<div style="flex:1;"><div style="font-weight:700;font-size:.9rem;">'+flag(topDist.home)+' '+esc(topDist.home)+' × '+esc(topDist.away)+' '+flag(topDist.away)+'</div>';
    h += '<div style="font-size:.72rem;color:#9CA3BF;">placar '+topDist.result_home+' × '+topDist.result_away+' · '+topDist.contributors+(topDist.contributors==1?' participante pontuou':' participantes pontuaram')+'</div></div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2rem;font-weight:900;color:#1B2B6B;">'+topDist.total_pts+' pts</div>';
    h += '</div>';
  } else {
    h += '<div style="color:#9CA3BF;font-size:.85rem;">⏳ Definido após os primeiros jogos</div>';
  }
  h += '</div>';

  // Highlight: jogo que MENOS distribuiu pontos (a zebra que enganou a galera)
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px 22px;margin-bottom:20px;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.95rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:12px;">🧊 Jogo que Menos Distribuiu Pontos</div>';
  if (botDist && copa_started) {
    h += '<div style="display:flex;align-items:center;gap:14px;">';
    h += '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#475569,#64748b);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🧊</div>';
    h += '<div style="flex:1;"><div style="font-weight:700;font-size:.9rem;">'+flag(botDist.home)+' '+esc(botDist.home)+' × '+esc(botDist.away)+' '+flag(botDist.away)+'</div>';
    h += '<div style="font-size:.72rem;color:#9CA3BF;">placar '+botDist.result_home+' × '+botDist.result_away+' · '+botDist.contributors+(botDist.contributors==1?' participante pontuou':' participantes pontuaram')+'</div></div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2rem;font-weight:900;color:#475569;">'+botDist.total_pts+' pts</div>';
    h += '</div>';
  } else {
    h += '<div style="color:#9CA3BF;font-size:.85rem;">⏳ Definido após os primeiros jogos</div>';
  }
  h += '</div>';

  // ── Destaques da Galera ──────────────────────────────────────────────────
  function fmtAvg(ms){ var d=new Date(ms); if(isNaN(d.getTime())) return ''; var p=function(n){return ('0'+n).slice(-2);}; return p(d.getDate())+'/'+p(d.getMonth()+1)+' '+p(d.getHours())+':'+p(d.getMinutes()); }
  function personBody(per, valText, valColor, extra){
    var s = '<div style="width:42px;height:42px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;margin:0 auto 6px;font-size:.85rem;">'+esc(per.initials||'?')+'</div>';
    s += '<div style="font-weight:800;font-size:.9rem;color:#2D3557;">'+esc(per.name)+'</div>';
    s += '<div style="font-size:.7rem;color:#9CA3BF;margin-bottom:5px;">'+esc(per.company||'')+'</div>';
    s += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.2rem;font-weight:900;color:'+(valColor||'#1B2B6B')+';">'+valText+'</div>';
    if(extra) s += '<div style="font-size:.66rem;color:#9CA3BF;margin-top:3px;">'+extra+'</div>';
    return s;
  }
  function awardCard(icon,title,bg,textColor,ready,body,waitSub){
    var s = '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;box-shadow:0 2px 8px rgba(27,43,107,.08);">';
    s += '<div style="background:'+bg+';padding:18px 14px 14px;text-align:center;">';
    s += '<div style="font-size:2rem;margin-bottom:4px;">'+icon+'</div>';
    s += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.74rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:'+textColor+';opacity:.92;">'+title+'</div>';
    s += '</div><div style="padding:14px;text-align:center;">';
    if(ready){ s += body; }
    else { s += '<div style="font-size:.8rem;color:#9CA3BF;margin-bottom:6px;">Aguardando</div><span style="display:inline-flex;background:#EEF0F6;border-radius:99px;padding:4px 12px;font-size:.7rem;color:#9CA3BF;font-weight:600;">⏳ Em disputa</span>'+(waitSub?'<div style="font-size:.66rem;color:#9CA3BF;margin-top:6px;">'+waitSub+'</div>':''); }
    s += '</div></div>';
    return s;
  }

  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.1rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin:4px 0 12px;">✨ Destaques da Galera</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px;">';
  h += awardCard('🐦','Madrugador','linear-gradient(135deg,#4f46e5,#6366f1)','white', !!(copa_started&&madrugador), madrugador?personBody(madrugador,'média '+fmtAvg(madrugador.avgBetTime),'#4f46e5'):'', 'Quem palpita mais cedo');
  h += awardCard('⚖️','Melhor Aproveitamento','linear-gradient(135deg,#0d9488,#14b8a6)','white', !!(copa_started&&aproveitamento), aproveitamento?personBody(aproveitamento,(aproveitamento.totalPts/aproveitamento.betCount).toFixed(1)+' pts/palpite','#0d9488'):'', 'Mais pontos por palpite (mín. 5)');
  h += awardCard('🏢','Melhor da Porter','linear-gradient(135deg,#1B2B6B,#3D5AC8)','white', !!(copa_started&&bestPorter), bestPorter?personBody(bestPorter,bestPorter.totalPts+' pts'):'', '1º colocado da Porter');
  h += awardCard('🏢','Melhor da Almah','linear-gradient(135deg,#D4A80F,#F5C518)','rgba(0,0,0,.6)', !!(copa_started&&bestAlmah), bestAlmah?personBody(bestAlmah,bestAlmah.totalPts+' pts'):'', '1º colocado da Almah');
  h += awardCard('🎰','Faro de Gol','linear-gradient(135deg,#EA580C,#f97316)','white', !!(copa_started&&faroGol&&faroGol.oneTeam>0), (faroGol&&faroGol.oneTeam>0)?personBody(faroGol,faroGol.oneTeam+' acertos','#EA580C'):'', 'Mais acertos de gols de um time');
  h += awardCard('📊','Mestre do Saldo','linear-gradient(135deg,#7c3aed,#a855f7)','white', !!(copa_started&&mestreSaldo&&mestreSaldo.goalDiff>0), (mestreSaldo&&mestreSaldo.goalDiff>0)?personBody(mestreSaldo,mestreSaldo.goalDiff+' saldos','#7c3aed'):'', 'Mais acertos de saldo de gols');
  h += awardCard('🚀','Maior Escalada','linear-gradient(135deg,#16A34A,#22C55E)','white', !!(climb&&climb.climb>0), climb?personBody(climb,'▲ '+climb.climb+' posições','#16A34A','do '+climb.from_pos+'º ao '+climb.to_pos+'º'):'', 'Quem mais subiu no ranking');
  h += awardCard('🔥','Em Chamas','linear-gradient(135deg,#dc2626,#ef4444)','white', !!(streak&&streak.streak>=2), streak?personBody(streak,streak.streak+' jogos','#dc2626','pontuando seguidos'):'', 'Maior sequência pontuando');
  h += awardCard('🦓','Vidente','linear-gradient(135deg,#475569,#64748b)','white', !!vidente, vidente?personBody(vidente,esc(vidente.home)+' × '+esc(vidente.away),'#475569','só '+vidente.scorers+(vidente.scorers==1?' cravou':' cravaram')):'', 'Cravou o exato mais raro');
  h += awardCard('🎯','Profeta do Mata-Mata','linear-gradient(135deg,#0f1e4a,#1B2B6B)','white', !!prophet, prophet?personBody(prophet,prophet.avg_pts+' pts/jogo','#1B2B6B',prophet.ko_pts+' pts em '+prophet.ko_bets+' palpites'):'', 'Melhor nas fases finais');
  var perfReady = perfect.length>0;
  var perfBody = '';
  if(perfReady){
    perfBody += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.8rem;font-weight:900;color:#D4A80F;line-height:1;">'+perfect.length+'</div>';
    perfBody += '<div style="font-size:.72rem;color:#5A6385;margin:4px 0;">'+(perfect.length==1?'palpitou em todos':'palpitaram em todos')+'</div>';
    perfBody += '<div style="font-size:.68rem;color:#9CA3BF;">'+perfect.slice(0,3).map(function(x){return esc((x.name||'').split(' ')[0]);}).join(', ')+(perfect.length>3?' +'+(perfect.length-3):'')+'</div>';
  }
  h += awardCard('💯','Cartola Perfeito','linear-gradient(135deg,#D4A80F,#F5C518)','rgba(0,0,0,.6)', perfReady, perfBody, 'Palpitou em 100% dos jogos');
  h += '</div>';

  // ⚔️ Duelo de Empresas
  var pPorter = duel.filter(function(d){return d.company==='Porter';})[0];
  var pAlmah  = duel.filter(function(d){return d.company==='Almah';})[0];
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px 22px;margin-bottom:20px;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.95rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:14px;">⚔️ Duelo de Empresas</div>';
  if((pPorter||pAlmah) && copa_started){
    var aP = pPorter?Number(pPorter.avg_pts):0, aA = pAlmah?Number(pAlmah.avg_pts):0;
    var winP = aP>=aA;
    var duelSide = function(d, lead, color){
      var s = '<div style="flex:1;text-align:center;padding:12px;border-radius:12px;background:'+(lead?'rgba(27,43,107,.05)':'transparent')+';border:1px solid '+(lead?color:'#EEF0F6')+';">';
      s += '<div style="font-weight:800;font-size:.95rem;color:'+color+';">'+(d?esc(d.company):'—')+(lead?' 👑':'')+'</div>';
      s += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.9rem;font-weight:900;color:'+color+';line-height:1.1;">'+(d?Number(d.avg_pts).toFixed(1):'0')+'</div>';
      s += '<div style="font-size:.66rem;color:#9CA3BF;">média de pts · '+(d?d.participants:0)+' jogadores</div>';
      s += '</div>';
      return s;
    };
    h += '<div style="display:flex;align-items:stretch;gap:12px;">';
    h += duelSide(pPorter, winP, '#1B2B6B');
    h += '<div style="display:flex;align-items:center;font-family:\'Barlow Condensed\',sans-serif;font-weight:900;color:#9CA3BF;font-size:1.1rem;">VS</div>';
    h += duelSide(pAlmah, !winP, '#92400E');
    h += '</div>';
  } else {
    h += '<div style="color:#9CA3BF;font-size:.85rem;">⏳ Definido após os primeiros jogos</div>';
  }
  h += '</div>';

  // Medals section
  var medals = [
    { icon:'🏆', name:'Campeão do Bolão',      desc:'1º lugar no ranking final',              holder: copa_started&&top1?top1:null },
    { icon:'🎯', name:'Rei dos Placares',       desc:'Mais placares exatos na Copa',           holder: copa_started&&reiPlacares?reiPlacares:null },
    { icon:'📝', name:'Palpitador Dedicado',     desc:'Mais palpites realizadas',                holder: copa_started&&maisApostas?maisApostas:null },
    { icon:'🌟', name:'Top 15 do Bolão',        desc:'Terminar entre os 15 melhores',          holder: null },
    { icon:'💯', name:'100% de Palpites',        desc:'Palpitar em todos os jogos',              holder: null },
    { icon:'⚡', name:'Melhor da Empresa',      desc:'1º colocado de cada empresa',            holder: null },
  ];

  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
  h += '<div style="padding:14px 20px;border-bottom:1px solid #EEF0F6;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">🏅 Sistema de Medalhas</div>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0;">';
  medals.forEach(function(m, i){
    h += '<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #EEF0F6;border-right:'+(i%2===0?'1px solid #EEF0F6':'none')+';">';
    h += '<span style="font-size:1.8rem;flex-shrink:0;">'+m.icon+'</span>';
    h += '<div style="flex:1;"><div style="font-weight:700;font-size:.88rem;color:#2D3557;">'+esc(m.name)+'</div>';
    h += '<div style="font-size:.72rem;color:#9CA3BF;">'+m.desc+'</div></div>';
    if (m.holder) {
      h += '<div style="text-align:right;"><div style="font-size:.78rem;font-weight:700;color:#1B2B6B;">'+esc(m.holder.name).split(' ')[0]+'</div></div>';
    } else {
      h += '<span style="background:#EEF0F6;border-radius:99px;padding:3px 10px;font-size:.68rem;color:#9CA3BF;font-weight:600;">⏳</span>';
    }
    h += '</div>';
  });
  h += '</div></div>';

  pc.innerHTML = h;
}
renderHall();
// re-sincroniza do servidor e re-renderiza. ranking → prêmios "de graça"; RPCs → prêmios globais.
if (window.syncRankingFromSupabase) syncRankingFromSupabase().then(renderHall);
[ 'syncMostExactGameFromSupabase','syncTopDistributingGameFromSupabase','syncBottomDistributingGameFromSupabase',
  'syncBiggestClimbFromSupabase','syncHottestStreakFromSupabase','syncRarestExactFromSupabase',
  'syncKnockoutProphetFromSupabase','syncPerfectPredictorsFromSupabase','syncCompanyDuelFromSupabase'
].forEach(function(fn){ if (window[fn]) window[fn]().then(renderHall); });


}};
