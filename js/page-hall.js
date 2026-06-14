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

  // Maior pontuação em jogo único — GLOBAL, vem do RPC (cache 'best_game').
  // (não dá pra calcular local: privacidade só sincroniza os próprios palpites)
  var finishedGames = games.filter(function(g){ return g.result && !g.tbd; });
  var bg = DB.get('best_game', null);
  var bestRound = (bg && bg.pts > 0)
    ? { user: { name: bg.name, company: bg.company, initials: bg.initials }, pts: bg.pts, game: { home: bg.home, away: bg.away } }
    : { user: null, pts: 0, game: null };

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
    { bg:'linear-gradient(135deg,#7c3aed,#a855f7)', textColor:'white',           icon:'📝', title:'Palpitador Dedicado',   sub:'Mais palpites realizadas',             person: maisApostas, val: maisApostas ? (maisApostas.totalBets||0)+' palpites' : null },
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
  h += '</div>';

  // Best single game card (separate highlight)
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px 22px;margin-bottom:20px;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.95rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:12px;">🔥 Maior Pontuação em um Único Jogo</div>';
  if (bestRound.user && copa_started) {
    h += '<div style="display:flex;align-items:center;gap:14px;">';
    h += '<div style="width:48px;height:48px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;">'+bestRound.user.initials+'</div>';
    h += '<div style="flex:1;"><div style="font-weight:700;font-size:.9rem;">'+esc(bestRound.user.name)+'</div>';
    h += '<div style="font-size:.72rem;color:#9CA3BF;">'+esc(bestRound.user.company)+' · '+flag(bestRound.game.home)+' '+esc(bestRound.game.home)+' × '+esc(bestRound.game.away)+' '+flag(bestRound.game.away)+'</div></div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2rem;font-weight:900;color:#1B2B6B;">+'+bestRound.pts+' pts</div>';
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
// re-sincroniza do servidor e re-renderiza (ranking p/ total de palpites, best_game p/ o card)
if (window.syncRankingFromSupabase) syncRankingFromSupabase().then(renderHall);
if (window.syncBestGameFromSupabase) syncBestGameFromSupabase().then(renderHall);


}};
