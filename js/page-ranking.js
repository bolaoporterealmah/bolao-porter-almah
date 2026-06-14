SPA.pages["ranking"]={style:`
.rk-table{width:100%;border-collapse:collapse;min-width:680px;}
.rk-table thead th{position:sticky;top:0;z-index:2;background:#F8F9FC;}
.rk-row{border-bottom:1px solid #EEF0F6;cursor:pointer;transition:background .12s;}
.rk-row:hover{background:rgba(27,43,107,.04);}
.rk-row.me{background:rgba(27,43,107,.06);box-shadow:inset 3px 0 0 #D4A80F;}
.rk-scroll{max-height:62vh;overflow:auto;}
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
  .rk-table td.rk-name::before{display:none;}
  .rk-table td.rk-pos::before{display:none;}
}
`,script:function(){

(function(){
  var user = Auth.user;
  var filterCompany = 'all';
  var searchTerm = '';
  var bound = false;
  var didScrollToMe = false;
  var lastSig = '';

  function rStats(r){ return {exact:r.exactScores||0, winner:r.correctWinners||0, goalDiff:r.goalDiff||0, oneTeam:r.oneTeam||0}; }

  function render() {
    var pc = document.getElementById('pageContent');
    if (!pc) return;

    var ranking = DB.getRanking() || [];
    var movement = DB.get('ranking_movement', {}) || {}; // { email: prev_position }
    var hasMovement = Object.keys(movement).length > 0; // sem RPC deployado → não mostra ▲▼
    var myRank = ranking.find(function(r){ return r.email === user.email; }) || {position:'—',totalPts:0,exactScores:0,betCount:0};

    var companies = [];
    ranking.forEach(function(r){ if(companies.indexOf(esc(r.company))<0) companies.push(esc(r.company)); });

    var filtered = filterCompany==='all' ? ranking : ranking.filter(function(r){ return esc(r.company)===filterCompany; });
    if (searchTerm) {
      var q = searchTerm.toLowerCase();
      filtered = filtered.filter(function(r){ return (r.name||'').toLowerCase().indexOf(q) >= 0; });
    }

    // gap pro líder / próximo (sobre o ranking completo, não o filtrado)
    var leader = ranking[0];
    var gapLeader = (leader && typeof myRank.totalPts==='number' && myRank.position!=='—') ? (leader.totalPts - myRank.totalPts) : null;
    var nextUp = (myRank.position!=='—') ? ranking.find(function(r){ return r.position === myRank.position-1; }) : null;
    var gapNext = nextUp ? (nextUp.totalPts - myRank.totalPts) : null;

    var h = '';

    // ── Stat cards ──
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;">';
    var posSub;
    if (myRank.position==='—') posSub = 'sem palpites computados';
    else if (gapLeader===0) posSub = '👑 você lidera!';
    else if (gapNext===0) posSub = 'empatado com o '+(myRank.position-1)+'º';
    else if (gapNext>0) posSub = 'faltam '+gapNext+' pts pro '+(myRank.position-1)+'º';
    else posSub = '';
    var ptsSub = gapLeader>0 ? (gapLeader+' pts atrás do líder') : (gapLeader===0 ? 'topo da tabela' : '');
    h += sCard('Minha Posição', myRank.position+(myRank.position!=='—'?'º':''), '#D4A80F', posSub);
    h += sCard('Minha Pontuação', myRank.totalPts+' pts', '#1B2B6B', ptsSub);
    h += sCard('Placares Exatos', myRank.exactScores||0, '#16A34A', '');
    h += sCard('Participantes', ranking.length, '#2563EB', myRank.position!=='—' && ranking.length ? ('top '+Math.max(1,Math.round(myRank.position/ranking.length*100))+'%') : '');
    h += '</div>';

    // ── Empty state ──
    if (!ranking.length) {
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;text-align:center;padding:50px 24px;">';
      h += '<div style="font-size:3rem;opacity:.3;margin-bottom:10px;">📊</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:1.1rem;color:#9CA3BF;text-transform:uppercase;">Ranking ainda vazio</div>';
      h += '<div style="font-size:.8rem;color:#9CA3BF;margin-top:6px;">Assim que os primeiros jogos forem computados, a classificação aparece aqui.</div>';
      h += '</div>';
      pc.innerHTML = h;
      bindOnce(pc);
      return;
    }

    // ── Filtro empresa + busca ──
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">';
    var filters = [['all','Todos']].concat(companies.map(function(co){return [co,co];}));
    filters.forEach(function(f){
      var active = f[0]===filterCompany;
      h += '<button data-rankfilter="'+f[0]+'" style="padding:5px 14px;border-radius:99px;font-size:.78rem;font-weight:600;cursor:pointer;border:1px solid '+(active?'#1B2B6B':'#DDE1EE')+';background:'+(active?'#1B2B6B':'white')+';color:'+(active?'white':'#5A6385')+';">'+f[1]+'</button>';
    });
    h += '<div style="flex:1;min-width:160px;position:relative;">';
    h += '<span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:.85rem;opacity:.5;">🔎</span>';
    h += '<input id="rk-search" type="text" placeholder="Buscar participante..." value="'+esc(searchTerm)+'" style="width:100%;padding:7px 12px 7px 30px;border:1px solid #DDE1EE;border-radius:99px;font-size:.8rem;outline:none;" />';
    h += '</div></div>';

    // ── Pódio (top 3 do filtro atual, sem busca) ──
    if (!searchTerm && filtered.length >= 2) {
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;margin-bottom:14px;overflow:hidden;">';
      h += '<div style="padding:12px 18px;border-bottom:1px solid #EEF0F6;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">🏆 Pódio</div>';
      h += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:10px;padding:20px 16px 0;">';
      h += podItem(filtered[1],2)+podItem(filtered[0],1)+podItem(filtered[2],3);
      h += '</div></div>';
    }

    // ── Tabela ──
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="padding:12px 18px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">📋 Classificação'+(searchTerm?(' · '+filtered.length+' resultado'+(filtered.length===1?'':'s')):'')+'</div>';
    h += '<span id="rk-updated" style="font-size:.72rem;color:#9CA3BF;">'+updatedLabel()+'</span>';
    h += '</div>';

    if (!filtered.length) {
      h += '<div style="padding:30px;text-align:center;color:#9CA3BF;font-size:.85rem;">Nenhum participante encontrado para "'+esc(searchTerm)+'".</div>';
    } else {
      h += '<div class="rk-scroll"><table class="rk-table">';
      h += '<thead><tr style="border-bottom:1.5px solid #DDE1EE;">';
      h += th('#','left','#9CA3BF')+th('Participante','left','#9CA3BF')
         + th('🎯 Exatos','center','#1B2B6B','Placar exato')+th('✅ Vencedor','center','#2563EB','Vencedor correto')
         + th('📊 Saldo','center','#7C3AED','Saldo de gols')+th('⚽ 1 Time','center','#EA580C','Gols de um time')
         + th('Palpites','center','#9CA3BF')+th('Pontos','right','#1B2B6B');
      h += '</tr></thead><tbody>';

      filtered.forEach(function(r) {
        var isMe = r.email === user.email;
        var st = rStats(r);
        var posBg = r.position===1?'linear-gradient(135deg,#FFD700,#FFA500)':r.position===2?'linear-gradient(135deg,#C0C0C0,#A8A8A8)':r.position===3?'linear-gradient(135deg,#CD7F32,#A0522D)':'#EEF0F6';
        var posColor = r.position<=3?'white':'#5A6385';
        var medal = r.position===1?'🥇':r.position===2?'🥈':r.position===3?'🥉':'';

        h += '<tr class="rk-row'+(isMe?' me':'')+'" data-userbets="'+esc(r.email)+'"'+(isMe?' data-me="1"':'')+' title="Ver resultados palpitados">';

        // # + movimento
        h += '<td class="rk-pos" data-label="Pos" style="padding:10px 12px;">';
        h += '<div style="display:flex;align-items:center;gap:6px;">';
        h += '<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:'+(medal?'.95rem':'.72rem')+';font-weight:800;background:'+(medal?'transparent':posBg)+';color:'+posColor+';">'+(medal||r.position)+'</div>';
        h += hasMovement ? moveBadge(movement, r) : '';
        h += '</div></td>';

        // Participante
        h += '<td class="rk-name" data-label="" style="padding:10px 12px;">';
        h += '<div style="display:flex;align-items:center;gap:8px;">';
        h += '<div style="width:30px;height:30px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.72rem;color:white;flex-shrink:0;">'+esc(r.initials)+'</div>';
        h += '<div style="min-width:0;"><div style="font-weight:600;font-size:.85rem;color:#1B2B6B;text-decoration:underline;text-decoration-color:#DDE1EE;text-underline-offset:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.name)+(isMe?' <span style="font-size:.6rem;color:#3D5AC8">(você)</span>':'')+' <span style="font-size:.6rem;opacity:.5;">👁️</span></div>';
        h += '<div style="font-size:.68rem;color:#9CA3BF;">'+esc(r.company)+'</div></div></div>';
        h += '</td>';

        h += numCell('🎯 Exatos', st.exact, '#1B2B6B');
        h += numCell('✅ Vencedor', st.winner, '#2563EB');
        h += numCell('📊 Saldo', st.goalDiff, '#7C3AED');
        h += numCell('⚽ 1 Time', st.oneTeam, '#EA580C');
        h += '<td data-label="Palpites" style="padding:10px 12px;text-align:center;font-size:.85rem;color:#5A6385;">'+r.betCount+'</td>';
        h += '<td data-label="Pontos" style="padding:10px 12px;text-align:right;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:#1B2B6B;">'+r.totalPts+'</span></td>';

        h += '</tr>';
      });

      h += '</tbody></table></div>';
    }

    h += '<div style="padding:10px 16px;background:#F8F9FC;font-size:.68rem;color:#9CA3BF;">📏 Desempate: 1º Mais exatos · 2º Mais vencedores · 3º Mais palpites · 4º Menor tempo de envio &nbsp;·&nbsp; ▲▼ = mudança desde o último placar</div>';
    h += '</div>';

    pc.innerHTML = h;
    bindOnce(pc);

    // auto-scroll até minha linha (só 1x por carga)
    if (!didScrollToMe) {
      var meRow = pc.querySelector('.rk-row.me');
      if (meRow) { try { meRow.scrollIntoView({block:'center'}); } catch(e){ meRow.scrollIntoView(); } }
      didScrollToMe = true;
    }
  }

  // movimento: prev - current (positivo = subiu)
  function moveBadge(movement, r) {
    var prev = movement[r.email];
    if (prev == null) return '<span title="Novo no ranking" style="font-size:.58rem;font-weight:800;color:#3D5AC8;">novo</span>';
    var d = prev - r.position;
    if (d > 0) return '<span title="Subiu '+d+'" style="font-size:.62rem;font-weight:800;color:#16A34A;">▲'+d+'</span>';
    if (d < 0) return '<span title="Caiu '+(-d)+'" style="font-size:.62rem;font-weight:800;color:#DC2626;">▼'+(-d)+'</span>';
    return '<span title="Manteve" style="font-size:.7rem;color:#C0C5D6;">–</span>';
  }

  function numCell(label, val, color) {
    return '<td data-label="'+label+'" style="padding:10px 12px;text-align:center;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:'+(val>0?color:'#9CA3BF')+';">'+val+'</span></td>';
  }

  function th(txt, align, color, tip) {
    return '<th'+(tip?' title="'+tip+'"':'')+' style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:'+color+';text-align:'+align+';white-space:nowrap;">'+txt+'</th>';
  }

  function podItem(r, pos) {
    if (!r) return '';
    var bgs = {1:'linear-gradient(180deg,#FFD700,#FFA500)',2:'linear-gradient(180deg,#E0E0E0,#BDBDBD)',3:'linear-gradient(180deg,#CD9B6B,#A0522D)'};
    var heights = {1:'100px',2:'75px',3:'60px'};
    var orders = {1:'0',2:'-1',3:'1'};
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1;max-width:140px;order:'+orders[pos]+'">' +
      (pos===1?'<div style="font-size:1.1rem;">👑</div>':'') +
      '<div style="width:42px;height:42px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:.85rem;">'+esc(r.initials)+'</div>' +
      '<div style="font-size:.78rem;font-weight:700;text-align:center;">'+esc(r.name).split(' ')[0]+'</div>' +
      '<div style="font-size:.65rem;color:#9CA3BF;">'+esc(r.company)+'</div>' +
      '<div style="width:100%;background:'+bgs[pos]+';border-radius:8px 8px 0 0;height:'+heights[pos]+';display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:8px;">' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.88rem;font-weight:800;color:rgba(0,0,0,.4);">'+r.totalPts+' pts</div>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:rgba(0,0,0,.22);">'+pos+'</div>' +
      '</div></div>';
  }

  function sCard(label, val, color, sub) {
    return '<div style="background:white;border-radius:12px;border:1px solid #DDE1EE;padding:13px 16px;box-shadow:0 1px 3px rgba(27,43,107,.06);">' +
      '<div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;margin-bottom:3px;">'+label+'</div>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:'+color+';line-height:1;">'+val+'</div>' +
      (sub?'<div style="font-size:.66rem;color:#9CA3BF;margin-top:4px;font-weight:600;">'+sub+'</div>':'') +
      '</div>';
  }

  var _lastSyncAt = null;
  function updatedLabel(){
    if (!_lastSyncAt) return 'Atualizando...';
    var d = _lastSyncAt;
    var hh = ('0'+d.getHours()).slice(-2), mm = ('0'+d.getMinutes()).slice(-2);
    return 'Atualizado às '+hh+':'+mm;
  }

  // listener ÚNICO (delegado) — antes empilhava a cada render
  function bindOnce(pc) {
    if (bound) return;
    bound = true;
    pc.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-rankfilter]');
      if (btn) { filterCompany = btn.getAttribute('data-rankfilter'); render(); return; }
      var ub = e.target.closest('[data-userbets]');
      if (ub) { window.openParticipantResultsModal(ub.getAttribute('data-userbets')); }
    });
    pc.addEventListener('input', function(e){
      var s = e.target.closest('#rk-search');
      if (!s) return;
      searchTerm = s.value;
      render();
      // re-render recria o input → restaura foco e cursor no fim
      var ns = document.getElementById('rk-search');
      if (ns) { ns.focus(); var v=ns.value; ns.setSelectionRange(v.length, v.length); }
    });
  }

  function dataSig(){
    var r = DB.getRanking() || [];
    var m = DB.get('ranking_movement', {}) || {};
    return r.map(function(x){return x.email+':'+x.position+':'+x.totalPts;}).join('|') + '#' + Object.keys(m).length;
  }

  function syncAndMaybeRender(force){
    var done = function(){
      _lastSyncAt = new Date();
      var sig = dataSig();
      // só re-renderiza se mudou (evita piscar/perder scroll) — e nunca enquanto busca
      var searching = !!document.getElementById('rk-search') && document.activeElement && document.activeElement.id==='rk-search';
      if (force || (sig !== lastSig && !searching)) { lastSig = sig; render(); }
      else { var u=document.getElementById('rk-updated'); if(u) u.textContent = updatedLabel(); }
    };
    var jobs = [];
    if (window.syncBetsFromSupabase) jobs.push(window.syncBetsFromSupabase());
    if (window.syncRankingMovementFromSupabase) jobs.push(window.syncRankingMovementFromSupabase());
    if (jobs.length) Promise.all(jobs).then(done, done); else done();
  }

  // boot
  render();                // pinta já com o cache que tiver
  syncAndMaybeRender(true); // busca fresco

  var _ri = setInterval(function(){
    if (SPA.current !== 'ranking') { clearInterval(_ri); return; }
    syncAndMaybeRender(false);
  }, 30000);
})();

}};
