SPA.pages["ranking"]={style:``,script:function(){

(function(){
  var user = Auth.user;
  var filterCompany = 'all';

  function render() {
    var ranking = DB.getRanking();
    var myRank = ranking.find(function(r){ return r.email === user.email; }) || {position:'—',totalPts:0,exactScores:0,betCount:0};
    var companies = [];
    ranking.forEach(function(r){ if(companies.indexOf(esc(r.company))<0) companies.push(esc(r.company)); });
    var filtered = filterCompany==='all' ? ranking : ranking.filter(function(r){ return esc(r.company)===filterCompany; });

    // Stats vêm AGREGADOS do servidor (RPC). Não dá p/ recomputar local:
    // privacidade só sincroniza os próprios palpites, não os alheios.
    function rStats(r){ return {exact:r.exactScores||0, winner:r.correctWinners||0, goalDiff:r.goalDiff||0, oneTeam:r.oneTeam||0}; }

    var pc = document.getElementById('pageContent');
    if (!pc) return;
    var h = '';

    // My stats
    var myStats = rStats(myRank);
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px;">';
    h += sCard('Minha Posição', myRank.position+(myRank.position!=='—'?'º':''), '#D4A80F');
    h += sCard('Minha Pontuação', myRank.totalPts+' pts', '#1B2B6B');
    h += sCard('Placares Exatos', myStats.exact, '#16A34A');
    h += sCard('Palpites Feitos', myRank.betCount, '#2563EB');
    h += '</div>';

    // Filter buttons
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">';
    var filters = [['all','Todos']].concat(companies.map(function(co){return [co,co];}));
    filters.forEach(function(f){
      var active = f[0]===filterCompany;
      h += '<button data-rankfilter="'+f[0]+'" style="padding:5px 14px;border-radius:99px;font-size:.78rem;font-weight:600;cursor:pointer;border:1px solid '+(active?'#1B2B6B':'#DDE1EE')+';background:'+(active?'#1B2B6B':'white')+';color:'+(active?'white':'#5A6385')+';">'+f[1]+'</button>';
    });
    h += '</div>';

    // Podium (top 3)
    if (filtered.length >= 2) {
      h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;margin-bottom:14px;overflow:hidden;">';
      h += '<div style="padding:12px 18px;border-bottom:1px solid #EEF0F6;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">🏆 Pódio</div>';
      h += '<div style="display:flex;align-items:flex-end;justify-content:center;gap:10px;padding:20px 16px 0;">';
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
      h += podItem(filtered[1],2)+podItem(filtered[0],1)+podItem(filtered[2],3);
      h += '</div></div>';
    }

    // Full ranking table
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="padding:12px 18px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">📋 Classificação Completa</div>';
    h += '<span style="font-size:.75rem;color:#9CA3BF;">Atualizado agora</span>';
    h += '</div>';

    h += '<div style="overflow-x:auto;">';
    h += '<table style="width:100%;border-collapse:collapse;min-width:700px;">';
    h += '<thead><tr style="background:#F8F9FC;border-bottom:1.5px solid #DDE1EE;">';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;text-align:left;white-space:nowrap;">#</th>';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;text-align:left;">Participante</th>';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#1B2B6B;text-align:center;" title="Placar exato">🎯 Exatos</th>';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#2563EB;text-align:center;" title="Vencedor correto">✅ Vencedor</th>';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#7C3AED;text-align:center;" title="Saldo de gols">📊 Saldo</th>';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#EA580C;text-align:center;" title="Gols de um time">⚽ 1 Time</th>';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;text-align:center;">Palpites</th>';
    h += '<th style="padding:9px 12px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#1B2B6B;text-align:right;">Pontos</th>';
    h += '</tr></thead><tbody>';

    filtered.forEach(function(r) {
      var isMe = r.email === user.email;
      var st = rStats(r);
      var posBg = r.position===1?'linear-gradient(135deg,#FFD700,#FFA500)':r.position===2?'linear-gradient(135deg,#C0C0C0,#A8A8A8)':r.position===3?'linear-gradient(135deg,#CD7F32,#A0522D)':'#EEF0F6';
      var posColor = r.position<=3?'white':'#5A6385';

      h += '<tr style="border-bottom:1px solid #EEF0F6;'+(isMe?'background:rgba(27,43,107,.03);':'')+'">';

      h += '<td style="padding:10px 12px;">';
      h += '<div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;background:'+posBg+';color:'+posColor+';">'+r.position+'</div>';
      h += '</td>';

      h += '<td data-userbets="'+esc(r.email)+'" title="Ver resultados palpitados" style="padding:10px 12px;cursor:pointer;">';
      h += '<div style="display:flex;align-items:center;gap:8px;">';
      h += '<div style="width:30px;height:30px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.72rem;color:white;flex-shrink:0;">'+esc(r.initials)+'</div>';
      h += '<div><div style="font-weight:600;font-size:.85rem;color:#1B2B6B;text-decoration:underline;text-decoration-color:#DDE1EE;text-underline-offset:2px;">'+esc(r.name)+(isMe?' <span style="font-size:.6rem;color:#3D5AC8">(você)</span>':'')+' <span style="font-size:.6rem;opacity:.5;">👁️</span></div>';
      h += '<div style="font-size:.68rem;color:#9CA3BF;">'+esc(r.company)+'</div></div></div>';
      h += '</td>';

      // 🎯 Exatos
      h += '<td style="padding:10px 12px;text-align:center;">';
      h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:'+(st.exact>0?'#1B2B6B':'#9CA3BF')+';">'+st.exact+'</span>';
      h += '</td>';

      // ✅ Vencedor
      h += '<td style="padding:10px 12px;text-align:center;">';
      h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:'+(st.winner>0?'#2563EB':'#9CA3BF')+';">'+st.winner+'</span>';
      h += '</td>';

      // 📊 Saldo
      h += '<td style="padding:10px 12px;text-align:center;">';
      h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:'+(st.goalDiff>0?'#7C3AED':'#9CA3BF')+';">'+st.goalDiff+'</span>';
      h += '</td>';

      // ⚽ 1 Time
      h += '<td style="padding:10px 12px;text-align:center;">';
      h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:'+(st.oneTeam>0?'#EA580C':'#9CA3BF')+';">'+st.oneTeam+'</span>';
      h += '</td>';

      // Apostas
      h += '<td style="padding:10px 12px;text-align:center;font-size:.85rem;color:#5A6385;">'+r.betCount+'</td>';

      // Pontos
      h += '<td style="padding:10px 12px;text-align:right;">';
      h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:#1B2B6B;">'+r.totalPts+'</span>';
      h += '</td>';

      h += '</tr>';
    });

    h += '</tbody></table></div>';
    h += '<div style="padding:10px 16px;background:#F8F9FC;font-size:.68rem;color:#9CA3BF;">📏 Desempate: 1º Mais exatos · 2º Mais vencedores acertados · 3º Mais palpites · 4º Menor tempo de envio</div>';
    h += '</div>';

    pc.innerHTML = h;

    pc.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-rankfilter]');
      if (btn) { filterCompany = btn.getAttribute('data-rankfilter'); render(); return; }
      var ub = e.target.closest('[data-userbets]');
      if (ub) { window.openParticipantResultsModal(ub.getAttribute('data-userbets')); }
    });
  }

  function sCard(label, val, color) {
    return '<div style="background:white;border-radius:12px;border:1px solid #DDE1EE;padding:13px 16px;box-shadow:0 1px 3px rgba(27,43,107,.06);">' +
      '<div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;margin-bottom:3px;">'+label+'</div>' +
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.6rem;font-weight:900;color:'+color+';line-height:1;">'+val+'</div>' +
      '</div>';
  }

  (async function(){
    if (window.syncBetsFromSupabase) await window.syncBetsFromSupabase();
    render();
  })();
  var _ri = setInterval(function(){
    if (SPA.current !== 'ranking') { clearInterval(_ri); return; }
    if (window.syncBetsFromSupabase) window.syncBetsFromSupabase().then(render);
    else render();
  }, 30000);
})();


}};
