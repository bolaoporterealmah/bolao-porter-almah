SPA.pages["ranking"]={style:`
.rk-wrap{display:flex;flex-direction:column;gap:16px;}
.rk-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
.rk-perf{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;}
.rk-catrow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
.rk-duel{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.rk-table{width:100%;border-collapse:collapse;min-width:640px;}
.rk-table thead th{position:sticky;top:0;z-index:2;background:#F8F9FC;}
.rk-row{border-bottom:1px solid #EEF0F6;cursor:pointer;transition:background .12s;}
.rk-row:hover{background:rgba(27,43,107,.04);}
.rk-row.me{background:rgba(27,43,107,.06);box-shadow:inset 3px 0 0 #D4A80F;}
.rk-scroll{max-height:60vh;overflow:auto;}
@media(max-width:760px){ .rk-catrow{grid-template-columns:repeat(3,1fr);} }
@media(max-width:640px){
  .rk-scroll{max-height:none;overflow:visible;}
  .rk-table{min-width:0;display:block;}
  .rk-table thead{display:none;}
  .rk-table tbody,.rk-table tr,.rk-table td{display:block;width:100%;}
  .rk-row{border:1px solid #DDE1EE;border-radius:12px;margin-bottom:10px;padding:6px 12px;}
  .rk-row.me{box-shadow:inset 0 0 0 2px #D4A80F;}
  .rk-table td{display:flex;align-items:center;justify-content:space-between;gap:10px;border:none;padding:7px 2px;text-align:right;}
  .rk-table td::before{content:attr(data-label);font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9CA3BF;}
  .rk-table td.rk-name{padding-top:10px;}
  .rk-table td.rk-name::before,.rk-table td.rk-pos::before{display:none;}
}
@media(max-width:420px){ .rk-catrow{grid-template-columns:repeat(2,1fr);} }
`,script:function(){

(function(){
  var user = Auth.user;
  var filterCompany = 'all';
  var searchTerm = '';
  var sortBy = 'pts';           // pts | exact | acc | bets
  var bound = false;
  var didScrollToMe = false;
  var lastSig = '';
  var _lastSyncAt = null;

  // ── Métricas derivadas (do próprio usuário, p/ fallback quando a RPC v2 não estiver ativa)
  function myGameFinishedStats(){
    var myBets = DB.getUserBets(user.email) || {};
    var finished = DB.getGames().filter(function(g){ return g.result && !g.tbd; });
    var scored=0, onFin=0;
    finished.forEach(function(g){
      var b=myBets[g.id]; if(!b) return; onFin++;
      var sc=Scoring.calculate(b,{home_score:g.result.home_score,away_score:g.result.away_score,phase:g.phase});
      if(sc && sc.total>0) scored++;
    });
    return {scored:scored, onFin:onFin};
  }

  function mySpecPts(){
    var fr = DB.getFinalResults();
    return fr ? Scoring.calculateSpecials(DB.getUserSpecials(user.email)||{}, fr) : 0;
  }

  // split de pontos (jogos/especiais) — usa RPC v2 se disponível, senão calcula só p/ mim
  function splitOf(r, mySpec){
    if (typeof r.gamePts==='number' && typeof r.specPts==='number') return {game:r.gamePts, spec:r.specPts};
    if (r.email===user.email) { var s=mySpec; return {game:Math.max(0,(r.totalPts||0)-s), spec:s}; }
    return null;
  }
  function accOf(r, myStats){
    if (typeof r.scoredBets==='number' && r.betCount>0) return Math.round(r.scoredBets/r.betCount*100);
    if (r.email===user.email && myStats.onFin>0) return Math.round(myStats.scored/myStats.onFin*100);
    return null;
  }

  function moveBadge(movement, email, pos){
    var prev = movement[email];
    if (prev == null) return '<span title="Novo no ranking" style="font-size:.58rem;font-weight:800;color:#3D5AC8;">novo</span>';
    var d = prev - pos;
    if (d > 0) return '<span title="Subiu '+d+'" style="font-size:.62rem;font-weight:800;color:#16A34A;">▲'+d+'</span>';
    if (d < 0) return '<span title="Caiu '+(-d)+'" style="font-size:.62rem;font-weight:800;color:#DC2626;">▼'+(-d)+'</span>';
    return '<span title="Manteve" style="font-size:.7rem;color:#C0C5D6;">–</span>';
  }

  function splitBar(sp){
    if (!sp || (sp.game+sp.spec)<=0) return '';
    var tot=sp.game+sp.spec, gp=Math.round(sp.game/tot*100);
    return '<div title="⚽ Jogos: '+sp.game+' · 🎯 Especiais: '+sp.spec+'" style="display:flex;height:4px;border-radius:3px;overflow:hidden;background:#EEF0F6;margin-top:3px;max-width:120px;margin-left:auto;">'+
      '<div style="width:'+gp+'%;background:#3D5AC8;"></div><div style="flex:1;background:#F5C518;"></div></div>';
  }

  function sCard(label, val, color, sub) {
    return '<div style="background:white;border-radius:12px;border:1px solid #DDE1EE;padding:13px 16px;box-shadow:0 1px 3px rgba(27,43,107,.06);">' +
      '<div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;margin-bottom:3px;">'+label+'</div>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:'+color+';line-height:1;">'+val+'</div>' +
      (sub?'<div style="font-size:.66rem;color:#9CA3BF;margin-top:4px;font-weight:600;">'+sub+'</div>':'') +
      '</div>';
  }

  function miniStat(label, val, color){
    return '<div style="text-align:center;">'+
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.35rem;font-weight:900;line-height:1;color:'+(color||'white')+';">'+val+'</div>'+
      '<div style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;opacity:.65;margin-top:3px;">'+label+'</div></div>';
  }

  function th(txt, align, color, tip) {
    return '<th'+(tip?' title="'+tip+'"':'')+' style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:'+color+';text-align:'+align+';white-space:nowrap;">'+txt+'</th>';
  }
  function numCell(label, val, color) {
    return '<td data-label="'+label+'" style="padding:10px 12px;text-align:center;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:'+(val>0?color:'#9CA3BF')+';">'+val+'</span></td>';
  }

  function podItem(r, place, movement) {
    if (!r) return '';
    var bgs = {1:'linear-gradient(180deg,#FFD700,#FFA500)',2:'linear-gradient(180deg,#E0E0E0,#BDBDBD)',3:'linear-gradient(180deg,#CD9B6B,#A0522D)'};
    var heights = {1:'104px',2:'78px',3:'62px'};
    var orders = {1:'0',2:'-1',3:'1'};
    var isMe = r.email===user.email;
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1;max-width:150px;order:'+orders[place]+'">' +
      (place===1?'<div style="font-size:1.2rem;">👑</div>':'') +
      '<div style="position:relative;"><div style="width:46px;height:46px;border-radius:50%;background:'+(isMe?'#D4A80F':'#3D5AC8')+';display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:.9rem;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.15);">'+esc(r.initials)+'</div></div>' +
      '<div style="font-size:.78rem;font-weight:700;text-align:center;">'+esc(r.name).split(' ')[0]+(isMe?' <span style="font-size:.58rem;color:#3D5AC8">(você)</span>':'')+'</div>' +
      '<div style="font-size:.62rem;color:#9CA3BF;">'+esc(r.company)+'</div>' +
      '<div style="width:100%;background:'+bgs[place]+';border-radius:8px 8px 0 0;height:'+heights[place]+';display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:8px;">' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.9rem;font-weight:800;color:rgba(0,0,0,.45);">'+r.totalPts+' pts</div>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:rgba(0,0,0,.22);">'+place+'</div>' +
      '</div></div>';
  }

  function updatedLabel(){
    if (!_lastSyncAt) return 'Atualizando...';
    var d=_lastSyncAt, hh=('0'+d.getHours()).slice(-2), mm=('0'+d.getMinutes()).slice(-2);
    return 'Atualizado às '+hh+':'+mm;
  }

  function render() {
    var pc = document.getElementById('pageContent');
    if (!pc) return;

    var ranking = DB.getRanking() || [];
    var movement = DB.get('ranking_movement', {}) || {};
    var hasMovement = Object.keys(movement).length > 0;
    var myRank = ranking.find(function(r){ return r.email === user.email; }) || {position:'—',totalPts:0,exactScores:0,correctWinners:0,goalDiff:0,oneTeam:0,betCount:0};
    var myStats = myGameFinishedStats();
    var mySpec = mySpecPts();

    // companies
    var companies = [];
    ranking.forEach(function(r){ if(companies.indexOf(esc(r.company))<0) companies.push(esc(r.company)); });

    var h = '<div class="rk-wrap">';

    // ── Empty ──
    if (!ranking.length) {
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;text-align:center;padding:50px 24px;">';
      h += '<div style="font-size:3rem;opacity:.3;margin-bottom:10px;">📊</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:1.1rem;color:#9CA3BF;text-transform:uppercase;">Ranking ainda vazio</div>';
      h += '<div style="font-size:.8rem;color:#9CA3BF;margin-top:6px;">Assim que os primeiros jogos forem computados, a classificação aparece aqui.</div>';
      h += '</div></div>';
      pc.innerHTML = h; bindOnce(pc); return;
    }

    // ── Painel do usuário ──
    var leader = ranking[0];
    var gapLeader = (leader && myRank.position!=='—') ? (leader.totalPts - myRank.totalPts) : null;
    var nextUp = (myRank.position!=='—') ? ranking.find(function(r){ return r.position === myRank.position-1; }) : null;
    var gapNext = nextUp ? (nextUp.totalPts - myRank.totalPts) : null;
    var mySplit = splitOf(myRank, mySpec);
    var myAcc = accOf(myRank, myStats);
    var avgPer = myRank.betCount>0 ? (myRank.totalPts/myRank.betCount).toFixed(1) : '—';

    h += '<div style="background:linear-gradient(135deg,#1B2B6B,#2A3F9A);border-radius:16px;padding:20px 22px;color:white;">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:16px;flex-wrap:wrap;">';
    h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.05rem;text-transform:uppercase;letter-spacing:.5px;">🏆 Minha Classificação</span>';
    h += '<span style="font-size:.7rem;opacity:.6;">'+updatedLabel()+'</span>';
    h += '</div>';
    h += '<div class="rk-perf" style="margin-bottom:16px;">';
    // posição
    var posSub;
    if (myRank.position==='—') posSub='sem palpites computados';
    else if (gapLeader===0) posSub='👑 você lidera!';
    else if (gapNext===0) posSub='empatado com o '+(myRank.position-1)+'º';
    else if (gapNext>0) posSub='faltam '+gapNext+' pts pro '+(myRank.position-1)+'º';
    else posSub='';
    h += '<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;">';
    h += '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.6;margin-bottom:4px;">Posição</div>';
    h += '<div style="display:flex;align-items:baseline;gap:8px;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:2.4rem;font-weight:900;line-height:1;color:#F5C518;">'+myRank.position+(myRank.position!=='—'?'º':'')+'</span>'+(hasMovement&&myRank.position!=='—'?moveBadge(movement,user.email,myRank.position):'')+'</div>';
    h += posSub?'<div style="font-size:.68rem;opacity:.75;margin-top:5px;font-weight:600;">'+posSub+'</div>':'';
    h += '</div>';
    // pontos
    h += '<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;">';
    h += '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.6;margin-bottom:4px;">Pontuação</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2.4rem;font-weight:900;line-height:1;">'+(myRank.totalPts||0)+'<span style="font-size:1rem;opacity:.6;"> pts</span></div>';
    if (mySplit) h += '<div style="display:flex;gap:12px;margin-top:6px;font-size:.68rem;opacity:.8;font-weight:600;"><span>⚽ '+mySplit.game+'</span><span>🎯 '+mySplit.spec+'</span></div>';
    h += (gapLeader>0?'<div style="font-size:.66rem;opacity:.7;margin-top:3px;">'+gapLeader+' pts atrás do líder</div>':(gapLeader===0?'<div style="font-size:.66rem;color:#F5C518;margin-top:3px;font-weight:700;">🥇 topo da tabela</div>':''));
    h += '</div>';
    // aproveitamento
    h += '<div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px 16px;">';
    h += '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.6;margin-bottom:4px;">Aproveitamento</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2.4rem;font-weight:900;line-height:1;color:'+(myAcc!=null&&myAcc>=50?'#7DD3A0':'#F5C518')+';">'+(myAcc!=null?myAcc+'%':'—')+'</div>';
    h += '<div style="font-size:.66rem;opacity:.7;margin-top:5px;">'+avgPer+' pts por palpite</div>';
    h += '</div>';
    h += '</div>';
    // categorias
    h += '<div class="rk-catrow" style="padding-top:14px;border-top:1px solid rgba(255,255,255,.12);">';
    h += miniStat('🎯 Exatos', myRank.exactScores||0, '#7DD3A0');
    h += miniStat('✅ Vencedor', myRank.correctWinners||0, 'white');
    h += miniStat('📊 Saldo', myRank.goalDiff||0, 'white');
    h += miniStat('⚽ 1 Time', myRank.oneTeam||0, 'white');
    h += miniStat('📝 Palpites', myRank.betCount||0, 'white');
    h += '</div>';
    h += '</div>';

    // ── Duelo de empresas ──
    var byCo={};
    ranking.forEach(function(r){ var c=r.company||'—'; if(!byCo[c])byCo[c]={name:c,pts:0,n:0,exact:0}; byCo[c].pts+=r.totalPts||0; byCo[c].n++; byCo[c].exact+=r.exactScores||0; });
    var cos=Object.keys(byCo).map(function(k){return byCo[k];}).sort(function(a,b){return b.pts-a.pts;});
    if (cos.length>=2) {
      var totPts=cos[0].pts+cos[1].pts;
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
      h += '<div style="padding:12px 18px;border-bottom:1px solid #EEF0F6;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">⚔️ Duelo de Empresas</div>';
      h += '<div style="padding:14px 18px;">';
      // barra
      var w0 = totPts>0?Math.round(cos[0].pts/totPts*100):50;
      h += '<div style="display:flex;height:26px;border-radius:8px;overflow:hidden;margin-bottom:12px;font-size:.72rem;font-weight:800;color:white;">';
      h += '<div style="width:'+w0+'%;background:#1B2B6B;display:flex;align-items:center;padding:0 10px;white-space:nowrap;">'+esc(cos[0].name)+' '+w0+'%</div>';
      h += '<div style="flex:1;background:#D4A80F;display:flex;align-items:center;justify-content:flex-end;padding:0 10px;white-space:nowrap;">'+(100-w0)+'% '+esc(cos[1].name)+'</div>';
      h += '</div>';
      h += '<div class="rk-duel">';
      [cos[0],cos[1]].forEach(function(c,i){
        h += '<div style="border:1px solid #DDE1EE;border-radius:10px;padding:10px 12px;'+(i===0?'background:rgba(27,43,107,.04);':'')+'">';
        h += '<div style="display:flex;align-items:center;gap:6px;font-weight:800;color:#1B2B6B;font-size:.85rem;">'+(i===0?'🥇 ':'')+esc(c.name)+'</div>';
        h += '<div style="display:flex;gap:14px;margin-top:6px;font-size:.72rem;color:#5A6385;">';
        h += '<span><strong style="color:#1B2B6B;font-size:.95rem;">'+c.pts+'</strong> pts</span>';
        h += '<span><strong style="color:#1B2B6B;font-size:.95rem;">'+c.n+'</strong> part.</span>';
        h += '<span><strong style="color:#1B2B6B;font-size:.95rem;">'+(c.n?Math.round(c.pts/c.n):0)+'</strong> média</span>';
        h += '</div></div>';
      });
      h += '</div></div></div>';
    }

    // ── Pódio ──
    var podPool = (filterCompany==='all') ? ranking : ranking.filter(function(r){return esc(r.company)===filterCompany;});
    if (podPool.length>=2) {
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
      h += '<div style="padding:12px 18px;border-bottom:1px solid #EEF0F6;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">🏆 Pódio'+(filterCompany!=='all'?' · '+esc(filterCompany):'')+'</div>';
      h += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:10px;padding:20px 16px 0;">';
      h += podItem(podPool[1],2,movement)+podItem(podPool[0],1,movement)+podItem(podPool[2],3,movement);
      h += '</div></div>';
    }

    // ── Controles: filtro + busca + ordenação ──
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">';
    var filters=[['all','Todos']].concat(companies.map(function(co){return [co,co];}));
    filters.forEach(function(f){
      var active=f[0]===filterCompany;
      h += '<button data-rankfilter="'+f[0]+'" style="padding:5px 14px;border-radius:99px;font-size:.78rem;font-weight:600;cursor:pointer;border:1px solid '+(active?'#1B2B6B':'#DDE1EE')+';background:'+(active?'#1B2B6B':'white')+';color:'+(active?'white':'#5A6385')+';">'+f[1]+'</button>';
    });
    h += '<div style="flex:1;min-width:150px;position:relative;">';
    h += '<span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:.85rem;opacity:.5;">🔎</span>';
    h += '<input id="rk-search" type="text" placeholder="Buscar participante..." value="'+esc(searchTerm)+'" style="width:100%;padding:7px 12px 7px 30px;border:1px solid #DDE1EE;border-radius:99px;font-size:.8rem;outline:none;" /></div>';
    h += '</div>';
    // ordenação
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">';
    h += '<span style="font-size:.68rem;color:#9CA3BF;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Ordenar:</span>';
    [['pts','Pontos'],['exact','Exatos'],['acc','Aproveit.'],['bets','Palpites']].forEach(function(s){
      var active=s[0]===sortBy;
      h += '<button data-ranksort="'+s[0]+'" style="padding:4px 11px;border-radius:99px;font-size:.72rem;font-weight:600;cursor:pointer;border:1px solid '+(active?'#D4A80F':'#DDE1EE')+';background:'+(active?'rgba(212,168,15,.12)':'white')+';color:'+(active?'#92400E':'#5A6385')+';">'+s[1]+'</button>';
    });
    h += '</div>';

    // ── Lista filtrada + ordenada ──
    var filtered = filterCompany==='all' ? ranking.slice() : ranking.filter(function(r){ return esc(r.company)===filterCompany; });
    if (searchTerm) { var q=searchTerm.toLowerCase(); filtered=filtered.filter(function(r){ return (r.name||'').toLowerCase().indexOf(q)>=0; }); }
    if (sortBy==='exact') filtered.sort(function(a,b){ return (b.exactScores||0)-(a.exactScores||0) || a.position-b.position; });
    else if (sortBy==='bets') filtered.sort(function(a,b){ return (b.betCount||0)-(a.betCount||0) || a.position-b.position; });
    else if (sortBy==='acc') filtered.sort(function(a,b){ return (accOf(b,myStats)||-1)-(accOf(a,myStats)||-1) || a.position-b.position; });
    else filtered.sort(function(a,b){ return a.position-b.position; });

    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="padding:12px 18px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">📋 Classificação · '+filtered.length+'</div>';
    h += '<span style="font-size:.68rem;color:#9CA3BF;">Toque para ver os resultados palpitados 👁️</span>';
    h += '</div>';

    if (!filtered.length) {
      h += '<div style="padding:30px;text-align:center;color:#9CA3BF;font-size:.85rem;">Nenhum participante encontrado'+(searchTerm?' para "'+esc(searchTerm)+'"':'')+'.</div>';
    } else {
      h += '<div class="rk-scroll"><table class="rk-table"><thead><tr style="border-bottom:1.5px solid #DDE1EE;">';
      h += th('#','left','#9CA3BF')+th('Participante','left','#9CA3BF')
         + th('📈 Aprov.','center','#0EA5E9','Aproveitamento: % dos palpites que pontuaram')
         + th('🎯','center','#1B2B6B','Placar exato')+th('✅','center','#2563EB','Vencedor correto')
         + th('📊','center','#7C3AED','Saldo de gols')+th('⚽','center','#EA580C','Gols de um time')
         + th('📝','center','#9CA3BF','Palpites computados')+th('Pontos','right','#1B2B6B');
      h += '</tr></thead><tbody>';

      filtered.forEach(function(r){
        var isMe=r.email===user.email;
        var medal=r.position===1?'🥇':r.position===2?'🥈':r.position===3?'🥉':'';
        var posBg=r.position===1?'linear-gradient(135deg,#FFD700,#FFA500)':r.position===2?'linear-gradient(135deg,#C0C0C0,#A8A8A8)':r.position===3?'linear-gradient(135deg,#CD7F32,#A0522D)':'#EEF0F6';
        var posColor=r.position<=3?'white':'#5A6385';
        var sp=splitOf(r, mySpec), ac=accOf(r, myStats);

        h += '<tr class="rk-row'+(isMe?' me':'')+'" data-userbets="'+esc(r.email)+'"'+(isMe?' data-me="1"':'')+' title="Ver resultados palpitados">';
        // pos
        h += '<td class="rk-pos" data-label="Pos" style="padding:10px 12px;"><div style="display:flex;align-items:center;gap:6px;">';
        h += '<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:'+(medal?'.95rem':'.72rem')+';font-weight:800;background:'+(medal?'transparent':posBg)+';color:'+posColor+';">'+(medal||r.position)+'</div>';
        h += hasMovement?moveBadge(movement,r.email,r.position):'';
        h += '</div></td>';
        // nome
        h += '<td class="rk-name" data-label="" style="padding:10px 12px;"><div style="display:flex;align-items:center;gap:8px;">';
        h += '<div style="width:30px;height:30px;border-radius:50%;background:'+(isMe?'#D4A80F':'#3D5AC8')+';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.72rem;color:white;flex-shrink:0;">'+esc(r.initials)+'</div>';
        h += '<div style="min-width:0;"><div style="font-weight:600;font-size:.85rem;color:#1B2B6B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.name)+(isMe?' <span style="font-size:.6rem;color:#3D5AC8">(você)</span>':'')+'</div>';
        h += '<div style="font-size:.68rem;color:#9CA3BF;">'+esc(r.company)+'</div></div></div></td>';
        // aproveitamento
        h += '<td data-label="Aproveit." style="padding:10px 12px;text-align:center;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.05rem;font-weight:900;color:'+(ac!=null?(ac>=50?'#16A34A':'#5A6385'):'#C0C5D6')+';">'+(ac!=null?ac+'%':'—')+'</span></td>';
        // categorias
        h += numCell('🎯 Exatos', r.exactScores||0, '#1B2B6B');
        h += numCell('✅ Vencedor', r.correctWinners||0, '#2563EB');
        h += numCell('📊 Saldo', r.goalDiff||0, '#7C3AED');
        h += numCell('⚽ 1 Time', r.oneTeam||0, '#EA580C');
        h += '<td data-label="Palpites" style="padding:10px 12px;text-align:center;font-size:.85rem;color:#5A6385;">'+(r.betCount||0)+'</td>';
        // pontos + split
        h += '<td data-label="Pontos" style="padding:10px 12px;text-align:right;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:#1B2B6B;">'+r.totalPts+'</span>'+splitBar(sp)+'</td>';
        h += '</tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '<div style="padding:10px 16px;background:#F8F9FC;font-size:.66rem;color:#9CA3BF;">📏 Desempate: exatos · vencedores · palpites · menor tempo de envio &nbsp;·&nbsp; barra de pontos: <span style="color:#3D5AC8;font-weight:700;">■</span> jogos <span style="color:#D4A80F;font-weight:700;">■</span> especiais &nbsp;·&nbsp; ▲▼ desde o último placar</div>';
    h += '</div>';

    h += '</div>'; // wrap
    pc.innerHTML = h;
    bindOnce(pc);

    if (!didScrollToMe) {
      var meRow = pc.querySelector('.rk-row.me');
      if (meRow) { try { meRow.scrollIntoView({block:'center'}); } catch(e){ meRow.scrollIntoView(); } }
      didScrollToMe = true;
    }
  }

  function bindOnce(pc) {
    if (bound) return;
    bound = true;
    pc.addEventListener('click', function(e) {
      var f=e.target.closest('[data-rankfilter]'); if(f){ filterCompany=f.getAttribute('data-rankfilter'); render(); return; }
      var s=e.target.closest('[data-ranksort]'); if(s){ sortBy=s.getAttribute('data-ranksort'); render(); return; }
      var ub=e.target.closest('[data-userbets]'); if(ub){ window.openParticipantResultsModal(ub.getAttribute('data-userbets')); }
    });
    pc.addEventListener('input', function(e){
      var s=e.target.closest('#rk-search'); if(!s) return;
      searchTerm=s.value; render();
      var ns=document.getElementById('rk-search'); if(ns){ ns.focus(); var v=ns.value; ns.setSelectionRange(v.length,v.length); }
    });
  }

  function dataSig(){
    var r=DB.getRanking()||[], m=DB.get('ranking_movement',{})||{};
    return r.map(function(x){return x.email+':'+x.position+':'+x.totalPts;}).join('|')+'#'+Object.keys(m).length;
  }

  function syncAndMaybeRender(force){
    var done=function(){
      _lastSyncAt=new Date();
      var sig=dataSig();
      var searching=!!document.getElementById('rk-search') && document.activeElement && document.activeElement.id==='rk-search';
      if (force || (sig!==lastSig && !searching)) { lastSig=sig; render(); }
      // se está buscando ou nada mudou: não re-renderiza (evita perder foco do campo)
    };
    var jobs=[];
    if (window.syncBetsFromSupabase) jobs.push(window.syncBetsFromSupabase());
    if (window.syncRankingMovementFromSupabase) jobs.push(window.syncRankingMovementFromSupabase());
    if (window.syncSpecialsFromSupabase) jobs.push(window.syncSpecialsFromSupabase());
    if (jobs.length) Promise.all(jobs).then(done,done); else done();
  }

  render();
  syncAndMaybeRender(true);
  var _ri=setInterval(function(){ if(SPA.current!=='ranking'){clearInterval(_ri);return;} syncAndMaybeRender(false); },30000);
})();

}};
