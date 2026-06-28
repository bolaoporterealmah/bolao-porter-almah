SPA.pages["admin"]={style:``,script:function(){
(function(){

// ── State ────────────────────────────────────────────────────────────────────
var activeTab = 'results';
var editingGameId = null;
var selectedApi = 'thesportsdb';
var apiKey = '';
var fetchedResults = [];

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  var games = DB.getGames();
  var users = DB.getUsers();
  var ranking = DB.getRanking();
  var bets = DB.getBets();
  var totalBets = Object.values(bets).reduce(function(s,ub){ return s+Object.keys(ub).length; }, 0);
  var gamesWithResult = games.filter(function(g){ return g.result; }).length;

  var pc = document.getElementById('pageContent');
  if (!pc) return;

  var h = '';

  // Stat cards
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px;">';
  h += sCard('Jogos', games.length, '#1B2B6B');
  h += sCard('Resultados', gamesWithResult, '#16A34A');
  h += sCard('Participantes', users.filter(function(u){return u.role!=='admin';}).length, '#2563EB');
  h += sCard('Apostas', totalBets, '#D4A80F');
  h += '</div>';

  // Tabs
  h += '<div style="display:flex;gap:2px;border-bottom:2px solid #DDE1EE;margin-bottom:22px;overflow-x:auto;">';
  [
    ['results','⚽ Resultados'],
    ['api','🌐 Buscar via API'],
    ['games','📋 Jogos'],
    ['users','👥 Participantes'],
    ['ranking_admin','🏆 Ranking']
  ].forEach(function(t){
    var active = activeTab===t[0];
    h += '<button data-tab="'+t[0]+'" style="padding:9px 16px;font-size:.82rem;font-weight:700;cursor:pointer;border:none;background:none;white-space:nowrap;color:'+(active?'#1B2B6B':'#9CA3BF')+';border-bottom:2px solid '+(active?'#1B2B6B':'transparent')+';margin-bottom:-2px;font-family:inherit;">'+t[1]+'</button>';
  });
  h += '</div>';

  // ── Tab: Resultados manuais ──────────────────────────────────────────────
  if (activeTab === 'results') {
    h += '<div style="background:rgba(27,43,107,.04);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:.82rem;color:#5A6385;">';
    h += '<span style="font-size:1.2rem;">✏️</span>';
    h += '<div>Digite o placar de cada jogo e clique em <strong>Salvar</strong>. A pontuação de todos os participantes é calculada automaticamente.</div>';
    h += '</div>';

    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;">';

    var playableGames = games.filter(function(g){ return !g.tbd; });
    if (playableGames.length === 0) {
      h += '<div style="padding:40px;text-align:center;color:#9CA3BF;">Nenhum jogo cadastrado ainda.</div>';
    } else {
      playableGames.forEach(function(game, idx) {
        var hasBorder = idx < playableGames.length - 1;
        h += '<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;'+(hasBorder?'border-bottom:1px solid #EEF0F6;':'')+'">';

        // Match info
        h += '<div style="flex:1;min-width:0;">';
        h += '<div style="font-weight:700;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(flag(game.home))+' '+game.home+' × '+game.away+' '+(flag(game.away))+'</div>';
        h += '<div style="font-size:.72rem;color:#9CA3BF;margin-top:2px;">'+Utils.formatDateTime(game.date)+' · '+Utils.phaseName(game.phase)+(game.group?' · Grupo '+game.group:'')+'</div>';
        h += '</div>';

        if (game.result) {
          // Show result + clear button
          h += '<div style="display:flex;align-items:center;gap:10px;">';
          h += '<span style="background:rgba(34,197,94,.1);color:#16A34A;padding:5px 14px;border-radius:99px;font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;">'+game.result.home_score+' × '+game.result.away_score+'</span>';
          h += '<button data-clearresult="'+game.id+'" style="padding:5px 10px;background:rgba(239,68,68,.08);color:#DC2626;border:1px solid rgba(239,68,68,.2);border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;">✕ Remover</button>';
          h += '</div>';
        } else {
          // Score inputs + save
          h += '<div style="display:flex;align-items:center;gap:8px;">';
          h += '<input id="rh-'+game.id+'" type="number" min="0" max="20" placeholder="0" style="width:48px;height:40px;text-align:center;border:1.5px solid #DDE1EE;border-radius:8px;font-family:\'Barlow Condensed\',sans-serif;font-size:1.2rem;font-weight:900;color:#1B2B6B;outline:none;"/>';
          h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:#9CA3BF;">×</span>';
          h += '<input id="ra-'+game.id+'" type="number" min="0" max="20" placeholder="0" style="width:48px;height:40px;text-align:center;border:1.5px solid #DDE1EE;border-radius:8px;font-family:\'Barlow Condensed\',sans-serif;font-size:1.2rem;font-weight:900;color:#1B2B6B;outline:none;"/>';
          h += '<button data-saveresult="'+game.id+'" style="padding:7px 14px;background:#1B2B6B;color:white;border:none;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;">💾 Salvar</button>';
          h += '</div>';
        }
        h += '</div>';
      });
    }
    h += '</div>';
  }

  // ── Tab: API ──────────────────────────────────────────────────────────────
  else if (activeTab === 'api') {
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">';

    // Instruction card
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.95rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:12px;">Como funciona</div>';
    h += '<div style="display:flex;flex-direction:column;gap:10px;font-size:.82rem;color:#5A6385;">';
    h += step('1','Escolha uma API','TheSportsDB não precisa de cadastro. As outras precisam de uma chave gratuita.');
    h += step('2','Clique em Buscar','O sistema consulta a API e mostra os resultados encontrados.');
    h += step('3','Revise e Aplique','Veja os resultados antes de aplicar. Após aplicar, as pontuações são calculadas automaticamente.');
    h += step('4','Se não funcionar','Use a aba ⚽ Resultados para inserir manualmente. Funciona sempre!');
    h += '</div></div>';

    // API config card
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.95rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:12px;">Selecione a API</div>';

    // API options
    [
      ['thesportsdb','TheSportsDB','Sem cadastro','✅ Recomendada','#16A34A'],
      ['football-data','Football-Data.org','Chave gratuita no site','🔑 Grátis','#2563EB'],
      ['apifootball','API-Football','100 req/dia grátis','🔑 Grátis','#7C3AED'],
    ].forEach(function(opt){
      var active = selectedApi===opt[0];
      h += '<div data-apiopt="'+opt[0]+'" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:2px solid '+(active?'#1B2B6B':'#DDE1EE')+';border-radius:10px;margin-bottom:8px;cursor:pointer;background:'+(active?'rgba(27,43,107,.04)':'white')+'">';
      h += '<div style="flex:1;"><div style="font-weight:700;font-size:.85rem;color:#2D3557;">'+opt[1]+'</div>';
      h += '<div style="font-size:.7rem;color:#9CA3BF;">'+opt[2]+'</div></div>';
      h += '<span style="background:'+opt[4]+';color:white;padding:2px 8px;border-radius:99px;font-size:.65rem;font-weight:700;">'+opt[3]+'</span>';
      h += '</div>';
    });

    if (selectedApi !== 'thesportsdb') {
      h += '<div style="margin-top:6px;">';
      h += '<label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">API Key</label>';
      h += '<input id="inp-apikey" value="'+apiKey+'" placeholder="Cole sua chave aqui..." style="width:100%;padding:8px 12px;border:1.5px solid #DDE1EE;border-radius:8px;font-size:.82rem;outline:none;"/>';
      var link = selectedApi==='football-data'?'https://www.football-data.org/client/register':'https://dashboard.api-football.com/register';
      h += '<a href="'+link+'" target="_blank" style="font-size:.7rem;color:#2563EB;display:inline-block;margin-top:4px;">Criar conta gratuita →</a>';
      h += '</div>';
    }
    h += '</div></div>'; // grid

    // Fetch button + results
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px;">';
    h += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;">';
    h += '<button id="btn-fetch-api" style="padding:10px 22px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.9rem;cursor:pointer;">🔄 Buscar Resultados</button>';
    h += '<button id="btn-apply-api" style="padding:10px 22px;background:#16A34A;color:white;border:none;border-radius:9px;font-weight:700;font-size:.9rem;cursor:pointer;display:none;">✅ Aplicar ao Bolão</button>';
    h += '<span style="font-size:.78rem;color:#9CA3BF;">→ Se não funcionar, use a aba <strong style="color:#1B2B6B">⚽ Resultados</strong> para inserir manualmente</span>';
    h += '</div>';
    h += '<div id="api-result-area"></div>';
    h += '</div>';
  }

  // ── Tab: Jogos ────────────────────────────────────────────────────────────
  else if (activeTab === 'games') {
    h += '<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">';
    h += '<button data-action="opengamemodal" style="padding:9px 18px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;">+ Cadastrar Jogo</button>';
    h += '</div>';
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">';
    h += '<thead><tr style="background:#F8F9FC;border-bottom:2px solid #DDE1EE;">';
    ['Data','Times','Fase','Local','Resultado','Ações'].forEach(function(th){
      h += '<th style="padding:10px 14px;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;text-align:left;white-space:nowrap;">'+th+'</th>';
    });
    h += '</tr></thead><tbody>';
    games.forEach(function(g){
      h += '<tr style="border-bottom:1px solid #EEF0F6;">';
      h += '<td style="padding:11px 14px;font-size:.8rem;white-space:nowrap;">'+Utils.formatDateTime(g.date)+'</td>';
      h += '<td style="padding:11px 14px;font-size:.85rem;font-weight:600;">'+(g.tbd?'A definir':(flag(g.home))+' '+g.home+' × '+g.away+' '+(flag(g.away)))+'</td>';
      h += '<td style="padding:11px 14px;"><span style="background:rgba(27,43,107,.08);color:#1B2B6B;padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:700;">'+Utils.phaseName(g.phase)+'</span></td>';
      h += '<td style="padding:11px 14px;font-size:.78rem;color:#9CA3BF;">'+g.city+'</td>';
      h += '<td style="padding:11px 14px;">'+(g.result?'<span style="color:#16A34A;font-weight:700;font-family:\'Barlow Condensed\',sans-serif;">'+g.result.home_score+' × '+g.result.away_score+'</span>':'<span style="color:#9CA3BF;font-size:.75rem;">Pendente</span>')+'</td>';
      h += '<td style="padding:11px 14px;"><button data-editgame="'+g.id+'" style="margin-right:4px;padding:4px 9px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:6px;font-size:.72rem;cursor:pointer;">✏️</button>';
      h += '<button data-deletegame="'+g.id+'" style="padding:4px 9px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:6px;font-size:.72rem;cursor:pointer;color:#DC2626;">🗑️</button></td>';
      h += '</tr>';
    });
    h += '</tbody></table></div></div>';
  }

  // ── Tab: Usuários ─────────────────────────────────────────────────────────
  else if (activeTab === 'users') {
    h += '<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">';
    h += '<button data-action="openusermodal" style="padding:9px 18px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;">+ Cadastrar Participante</button>';
    h += '</div>';
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    users.forEach(function(u, idx){
      var inactive = (u.active===false);
      h += '<div style="display:flex;align-items:center;gap:12px;padding:13px 18px;'+(idx<users.length-1?'border-bottom:1px solid #EEF0F6;':'')+(inactive?'opacity:.55;':'')+'">';
      h += '<div style="width:38px;height:38px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:.85rem;flex-shrink:0;">'+u.initials+'</div>';
      h += '<div style="flex:1;"><div style="font-weight:700;font-size:.88rem;">'+esc(u.name)+(inactive?' <span style="font-size:.6rem;color:#DC2626;font-weight:800;">DESATIVADO</span>':'')+'</div>';
      h += '<div style="font-size:.72rem;color:#9CA3BF;">'+esc(u.email)+'</div></div>';
      h += '<span style="background:'+(u.company==='Porter'?'rgba(27,43,107,.1)':'rgba(245,197,24,.2)')+';color:'+(u.company==='Porter'?'#1B2B6B':'#92400E')+';padding:3px 10px;border-radius:99px;font-size:.68rem;font-weight:700;">'+esc(u.company)+'</span>';
      h += '<span style="background:'+(u.role==='admin'?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)')+';color:'+(u.role==='admin'?'#DC2626':'#16A34A')+';padding:3px 10px;border-radius:99px;font-size:.68rem;font-weight:700;">'+u.role+'</span>';
      h += '<button data-userbets="'+esc(u.email)+'" style="padding:5px 10px;background:rgba(27,43,107,.06);border:1px solid rgba(27,43,107,.2);border-radius:7px;font-size:.72rem;cursor:pointer;color:#1B2B6B;font-weight:700;">📝 Palpites</button>';
      // Admins não têm toggle (evita auto-trancar acesso). Participantes: desativar/reativar.
      if (u.role==='admin') {
        h += '<span style="width:96px;text-align:center;font-size:.66rem;color:#C0C5D6;">—</span>';
      } else if (inactive) {
        h += '<button data-toggleactive="'+esc(u.email)+'" data-active="0" style="padding:5px 10px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.3);border-radius:7px;font-size:.72rem;cursor:pointer;color:#16A34A;font-weight:700;">✅ Reativar</button>';
      } else {
        h += '<button data-toggleactive="'+esc(u.email)+'" data-active="1" style="padding:5px 10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:7px;font-size:.72rem;cursor:pointer;color:#DC2626;font-weight:700;">🚫 Desativar</button>';
      }
      h += '</div>';
    });
    h += '</div>';
  }

  // ── Tab: Ranking ─────────────────────────────────────────────────────────
  else if (activeTab === 'ranking_admin') {
    h += '<div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">';
    h += '<button data-action="reprocess" style="padding:8px 16px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.82rem;cursor:pointer;">🔄 Reprocessar Pontuações</button>';
    h += '<button data-action="exportcsv" style="padding:8px 16px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.82rem;cursor:pointer;">📥 Exportar CSV</button>';
    h += '</div>';
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">';
    h += '<thead><tr style="background:#F8F9FC;border-bottom:2px solid #DDE1EE;">';
    ['#','Participante','Empresa','Pontos','Exatos','Vencedores','Apostas'].forEach(function(th){
      h += '<th style="padding:10px 14px;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;text-align:left;white-space:nowrap;">'+th+'</th>';
    });
    h += '</tr></thead><tbody>';
    ranking.forEach(function(r){
      var posBg = r.position===1?'linear-gradient(135deg,#FFD700,#FFA500)':r.position===2?'linear-gradient(135deg,#C0C0C0,#A8A8A8)':r.position===3?'linear-gradient(135deg,#CD7F32,#A0522D)':'#EEF0F6';
      var posColor = r.position<=3?'white':'#5A6385';
      h += '<tr style="border-bottom:1px solid #EEF0F6;">';
      h += '<td style="padding:11px 14px;"><div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;background:'+posBg+';color:'+posColor+';">'+r.position+'</div></td>';
      h += '<td style="padding:11px 14px;"><div style="display:flex;align-items:center;gap:8px;"><div style="width:30px;height:30px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:white;">'+esc(r.initials)+'</div><div><div style="font-weight:600;font-size:.85rem;">'+esc(r.name)+'</div></div></div></td>';
      h += '<td style="padding:11px 14px;font-size:.82rem;">'+esc(r.company)+'</td>';
      h += '<td style="padding:11px 14px;font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:#1B2B6B;">'+r.totalPts+'</td>';
      h += '<td style="padding:11px 14px;font-size:.85rem;color:#5A6385;">'+r.exactScores+'</td>';
      h += '<td style="padding:11px 14px;font-size:.85rem;color:#5A6385;">'+r.correctWinners+'</td>';
      h += '<td style="padding:11px 14px;font-size:.85rem;color:#5A6385;">'+r.betCount+'</td>';
      h += '</tr>';
    });
    h += '</tbody></table></div></div>';
  }

  pc.innerHTML = h;
  bindEvents(pc);
}

function sCard(label, val, color) {
  return '<div style="background:white;border-radius:12px;border:1px solid #DDE1EE;padding:14px 16px;"><div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#9CA3BF;margin-bottom:4px;">'+label+'</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.7rem;font-weight:900;color:'+color+';line-height:1;">'+val+'</div></div>';
}

function step(n, title, desc) {
  return '<div style="display:flex;gap:10px;"><div style="width:22px;height:22px;border-radius:50%;background:#1B2B6B;color:white;display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;flex-shrink:0;">'+n+'</div><div><strong style="color:#2D3557;">'+title+'</strong><br/>'+desc+'</div></div>';
}

// ── Events ───────────────────────────────────────────────────────────────────
function bindEvents(pc) {
  // render() roda várias vezes no MESMO #pageContent (boot + após sync).
  // Sem guard, cada chamada empilha outro listener → 1 clique abre N modais.
  if (pc.__adminBound) return;
  pc.__adminBound = true;
  pc.addEventListener('click', function(e) {

    // Tabs
    var tab = e.target.closest('[data-tab]');
    if (tab) { activeTab = tab.getAttribute('data-tab'); render(); return; }

    // API option select
    var apiOpt = e.target.closest('[data-apiopt]');
    if (apiOpt) { selectedApi = apiOpt.getAttribute('data-apiopt'); render(); return; }

    // Save result (manual)
    var saveRes = e.target.closest('[data-saveresult]');
    if (saveRes) {
      var gid = saveRes.getAttribute('data-saveresult');
      var hEl = document.getElementById('rh-'+gid), aEl = document.getElementById('ra-'+gid);
      if (!hEl||!aEl) return;
      if (hEl.value===''||aEl.value==='') { Utils.toast('Preencha o placar dos dois times','error'); return; }
      var games = DB.getGames();
      var g = games.find(function(x){return x.id===gid;});
      if (g) {
        var hs=parseInt(hEl.value), as=parseInt(aEl.value);
        g.result={home_score:hs,away_score:as};
        DB.set('games', games);                 // cache local (sem upsert em massa)
        Utils.toast('Resultado salvo! ✓','success'); render();
        if (window.upsertGameResult) window.upsertGameResult(gid, hs, as)
          .then(function(){ render(); })
          .catch(function(e){ Utils.toast('Falha ao salvar no servidor: '+e.message,'error'); });
      }
      return;
    }

    // Clear result
    var clearRes = e.target.closest('[data-clearresult]');
    if (clearRes) {
      if (!confirm('Remover resultado? As pontuações serão recalculadas.')) return;
      var gid = clearRes.getAttribute('data-clearresult');
      var games = DB.getGames();
      var g = games.find(function(x){return x.id===gid;});
      if (g) {
        g.result=null;
        DB.set('games', games);                 // cache local
        Utils.toast('Resultado removido','info'); render();
        if (window.upsertGameResult) window.upsertGameResult(gid, null, null)   // limpa no servidor + recalcula
          .then(function(){ render(); })
          .catch(function(e){ Utils.toast('Falha ao remover no servidor: '+e.message,'error'); });
      }
      return;
    }

    // Fetch API
    var fetchBtn = e.target.closest('#btn-fetch-api');
    if (fetchBtn) { fetchFromApi(); return; }

    // Apply API results
    var applyBtn = e.target.closest('#btn-apply-api');
    if (applyBtn) { applyApiResults(); return; }

    // Games tab actions
    var editGame = e.target.closest('[data-editgame]');
    if (editGame) { openGameModal(editGame.getAttribute('data-editgame')); return; }

    var delGame = e.target.closest('[data-deletegame]');
    if (delGame) {
      if (!confirm('Excluir jogo?')) return;
      var delId = delGame.getAttribute('data-deletegame');
      DB.saveGames(DB.getGames().filter(function(g){return g.id!==delId;}));
      if (window.deleteGame) {
        window.deleteGame(delId).catch(function(err){
          console.warn('[Supabase] deleteGame failed:', err.message);
          Utils.toast('Removido localmente, mas falhou ao sincronizar com o servidor','error');
        });
      }
      Utils.toast('Jogo removido','info'); render(); return;
    }

    // Users tab actions
    var userBets = e.target.closest('[data-userbets]');
    if (userBets) { openUserBetsModal(userBets.getAttribute('data-userbets')); return; }

    var tgl = e.target.closest('[data-toggleactive]');
    if (tgl) {
      var em = tgl.getAttribute('data-toggleactive');
      var toActive = tgl.getAttribute('data-active')==='0'; // está inativo → vai ativar
      var msg = toActive
        ? 'Reativar este participante? Ele volta ao ranking e pode logar de novo.'
        : 'Desativar este participante? Ele sai do ranking, as posições recalculam e o login fica bloqueado. Os palpites são preservados.';
      if (!confirm(msg)) return;
      tgl.disabled = true; var _orig = tgl.textContent; tgl.textContent = '...';
      window.setUserActive(em, toActive).then(function(){
        Utils.toast(toActive?'Participante reativado ✓':'Participante desativado ✓', toActive?'success':'info');
        render();
      }).catch(function(err){
        tgl.disabled = false; tgl.textContent = _orig;
        Utils.toast('Falha: '+err.message,'error');
      });
      return;
    }

    // Actions
    var action = e.target.closest('[data-action]');
    if (action) {
      var act = action.getAttribute('data-action');
      if (act==='opengamemodal') openGameModal(null);
      if (act==='openusermodal') openUserModal();
      if (act==='reprocess') { Utils.toast('Pontuações reprocessadas ✓','success'); render(); }
      if (act==='exportcsv') exportCsv();
    }
  });
}

// ── API Fetch ─────────────────────────────────────────────────────────────────
async function fetchFromApi() {
  var btn = document.getElementById('btn-fetch-api');
  var area = document.getElementById('api-result-area');
  if (!area) return;

  var keyInput = document.getElementById('inp-apikey');
  if (keyInput) apiKey = keyInput.value.trim();

  if (btn) { btn.textContent = '⏳ Buscando...'; btn.disabled = true; }
  area.innerHTML = '<div style="padding:14px;color:#9CA3BF;font-size:.82rem;">Consultando API...</div>';

  try {
    var results = [];

    if (selectedApi === 'thesportsdb') {
      // TheSportsDB free API - FIFA World Cup 2026
      var res = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026');
      var data = await res.json();
      if (data && data.events) {
        data.events.forEach(function(ev) {
          if (ev.intHomeScore !== null && ev.intHomeScore !== '' && ev.intAwayScore !== null) {
            results.push({ home: ev.strHomeTeam, away: ev.strAwayTeam, home_score: parseInt(ev.intHomeScore), away_score: parseInt(ev.intAwayScore), date: ev.dateEvent });
          }
        });
      }
    } else if (selectedApi === 'football-data') {
      if (!apiKey) { throw new Error('Cole sua API key primeiro'); }
      var res = await fetch('https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=FINISHED', {
        headers: { 'X-Auth-Token': apiKey }
      });
      if (!res.ok) throw new Error('Erro '+res.status+' — verifique sua API key');
      var data = await res.json();
      if (data && data.matches) {
        data.matches.forEach(function(m) {
          if (m.score && m.score.fullTime && m.score.fullTime.home !== null) {
            results.push({ home: m.homeTeam.name, away: m.awayTeam.name, home_score: m.score.fullTime.home, away_score: m.score.fullTime.away, date: m.utcDate });
          }
        });
      }
    } else if (selectedApi === 'apifootball') {
      if (!apiKey) { throw new Error('Cole sua API key primeiro'); }
      var res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&status=FT', {
        headers: { 'x-apisports-key': apiKey }
      });
      if (!res.ok) throw new Error('Erro '+res.status+' — verifique sua API key');
      var data = await res.json();
      if (data && data.response) {
        data.response.forEach(function(f) {
          results.push({ home: f.teams.home.name, away: f.teams.away.name, home_score: f.goals.home, away_score: f.goals.away, date: f.fixture.date });
        });
      }
    }

    fetchedResults = results;

    if (results.length === 0) {
      area.innerHTML = '<div style="padding:14px;background:#FFF3CD;border-radius:10px;font-size:.82rem;color:#92400E;">⚠️ Nenhum resultado encontrado ainda.<br/><span style="font-size:.75rem;">A Copa pode ainda não ter começado, ou a API não retornou dados para 2026.</span><br/><strong style="margin-top:6px;display:inline-block;">→ Use a aba ⚽ Resultados para inserir manualmente!</strong></div>';
    } else {
      var h = '<div style="font-weight:700;font-size:.85rem;color:#16A34A;margin-bottom:10px;">✅ '+results.length+' resultado(s) encontrado(s)!</div>';
      h += '<div style="display:flex;flex-direction:column;gap:5px;max-height:260px;overflow-y:auto;margin-bottom:12px;">';
      results.slice(0,15).forEach(function(r){
        h += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F8F9FC;border-radius:8px;font-size:.82rem;">';
        h += '<span style="flex:1;font-weight:600;">'+(flag(r.home))+' '+r.home+' × '+r.away+' '+(flag(r.away))+'</span>';
        h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:1.1rem;color:#1B2B6B;">'+r.home_score+' × '+r.away_score+'</span>';
        h += '</div>';
      });
      if (results.length>15) h += '<div style="font-size:.72rem;color:#9CA3BF;padding:6px 12px;">...e mais '+(results.length-15)+' resultados</div>';
      h += '</div>';
      area.innerHTML = h;
      var applyBtn = document.getElementById('btn-apply-api');
      if (applyBtn) applyBtn.style.display = 'inline-block';
    }
  } catch(err) {
    area.innerHTML = '<div style="padding:14px;background:rgba(239,68,68,.08);border-radius:10px;font-size:.82rem;color:#DC2626;">❌ '+err.message+'</div>'+
      '<div style="padding:12px;margin-top:8px;background:#F8F9FC;border-radius:10px;font-size:.82rem;color:#5A6385;">👉 <strong>Não se preocupe!</strong> Use a aba <strong style="color:#1B2B6B">⚽ Resultados</strong> para inserir manualmente — funciona sempre.</div>';
  }

  if (btn) { btn.textContent = '🔄 Buscar Resultados'; btn.disabled = false; }
}

function applyApiResults() {
  if (!fetchedResults.length) return;
  var games = DB.getGames();
  var applied = 0;
  fetchedResults.forEach(function(r) {
    var g = games.find(function(g) {
      if (!g.home||!g.away||g.result) return false;
      var rh=r.home.toLowerCase(), ra=r.away.toLowerCase();
      var gh=g.home.toLowerCase(), ga=g.away.toLowerCase();
      return (gh.includes(rh.substring(0,5))||rh.includes(gh.substring(0,5)))&&
             (ga.includes(ra.substring(0,5))||ra.includes(ga.substring(0,5)));
    });
    if (g) { g.result={home_score:r.home_score,away_score:r.away_score}; applied++; }
  });
  if (applied>0) {
    DB.saveGames(games);
    Utils.toast(applied+' resultado(s) aplicado(s)! ✓','success');
    render();
  } else {
    Utils.toast('Nenhum jogo correspondente encontrado. Tente a inserção manual.','error');
  }
}

// ── Game Modal ────────────────────────────────────────────────────────────────
function openGameModal(id) {
  editingGameId = id;
  var g = id ? DB.getGames().find(function(x){return x.id===id;}) : null;
  var modal = document.createElement('div');
  modal.id = 'gameModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML =
    '<div style="background:white;border-radius:18px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 50px rgba(0,0,0,.25);">'+
    '<div style="padding:20px 24px 14px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">'+
    '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.1rem;text-transform:uppercase;color:#1B2B6B;">'+(id?'Editar Jogo':'Cadastrar Jogo')+'</div>'+
    '<button id="closeGameModal" style="background:#EEF0F6;border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div style="padding:20px 24px;display:grid;grid-template-columns:1fr 1fr;gap:14px;">'+
    fld('Time da Casa','gHome',g?g.home:'','text','Ex: Brasil')+
    fld('Time Visitante','gAway',g?g.away:'','text','Ex: França')+
    fld('Data e Hora','gDate',g?g.date.slice(0,16):'','datetime-local','')+
    '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Fase</label>'+
    '<select id="gPhase" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.85rem;outline:none;background:white;">'+
    ['groups','round_of_32','round_of_16','quarterfinals','semifinals','third_place','final'].map(function(p){
      return '<option value="'+p+'"'+(g&&g.phase===p?' selected':'')+'>'+Utils.phaseName(p)+'</option>';
    }).join('')+
    '</select></div>'+
    fld('Grupo (A–L)','gGroup',g&&g.group?g.group:'','text','A')+
    fld('Estádio','gStadium',g&&g.stadium?g.stadium:'','text','MetLife Stadium')+
    fld('Cidade','gCity',g&&g.city?g.city:'','text','Nova York')+
    '</div>'+
    '<div style="padding:14px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #EEF0F6;">'+
    '<button id="cancelGameModal" style="padding:9px 18px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.85rem;cursor:pointer;">Cancelar</button>'+
    '<button id="saveGameModal" style="padding:9px 18px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;">Salvar Jogo</button>'+
    '</div></div>';
  document.body.appendChild(modal);

  document.getElementById('closeGameModal').addEventListener('click', function(){modal.remove();});
  document.getElementById('cancelGameModal').addEventListener('click', function(){modal.remove();});
  document.getElementById('saveGameModal').addEventListener('click', function(){
    var home=document.getElementById('gHome').value.trim();
    var away=document.getElementById('gAway').value.trim();
    var date=document.getElementById('gDate').value;
    var phase=document.getElementById('gPhase').value;
    var group=document.getElementById('gGroup').value.trim()||null;
    var stadium=document.getElementById('gStadium').value.trim();
    var city=document.getElementById('gCity').value.trim();
    if(!home||!away||!date){Utils.toast('Preencha os campos obrigatórios','error');return;}
    var games=DB.getGames();
    if(editingGameId){
      var g=games.find(function(x){return x.id===editingGameId;});
      if(g){Object.assign(g,{home:home,away:away,date:date,phase:phase,group:group,stadium:stadium,city:city,tbd:false});}
    } else {
      games.push({id:'g_'+Date.now(),phase:phase,group:group,home:home,away:away,date:date,stadium:stadium,city:city,result:null,tbd:false});
    }
    DB.saveGames(games);
    var savedGame = games.find(function(x){return x.id===(editingGameId||games[games.length-1].id);});
    if (window.upsertGame && savedGame) {
      window.upsertGame(savedGame).catch(function(err){
        console.warn('[Supabase] upsertGame failed:', err.message);
        Utils.toast('Salvo localmente, mas falhou ao sincronizar com o servidor','error');
      });
    }
    Utils.toast(editingGameId?'Jogo atualizado!':'Jogo cadastrado!','success');
    modal.remove(); render();
  });
  modal.addEventListener('click', function(e){if(e.target===modal)modal.remove();});
}

function fld(label, id, val, type, placeholder) {
  return '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">'+label+'</label>'+
    '<input id="'+id+'" type="'+type+'" value="'+val+'" placeholder="'+placeholder+'" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.85rem;outline:none;"/></div>';
}

// ── User Modal ────────────────────────────────────────────────────────────────
function openUserModal() {
  var modal = document.createElement('div');
  modal.id = 'userModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML =
    '<div style="background:white;border-radius:18px;width:100%;max-width:420px;box-shadow:0 20px 50px rgba(0,0,0,.25);">'+
    '<div style="padding:20px 24px 14px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">'+
    '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.1rem;text-transform:uppercase;color:#1B2B6B;">Cadastrar Participante</div>'+
    '<button id="closeUserModal" style="background:#EEF0F6;border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div style="padding:20px 24px;display:flex;flex-direction:column;gap:12px;">'+
    fld('Nome Completo','nuName','','text','Nome Sobrenome')+
    fld('E-mail','nuEmail','','email','email@empresa.com.br')+
    fld('Senha Inicial','nuPass','123456','text','')+
    '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Empresa</label>'+
    '<select id="nuCompany" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.85rem;outline:none;background:white;"><option>Porter</option><option>Almah</option></select></div>'+
    '</div>'+
    '<div style="padding:14px 24px 20px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #EEF0F6;">'+
    '<button id="cancelUserModal" style="padding:9px 18px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.85rem;cursor:pointer;">Cancelar</button>'+
    '<button id="saveUserModal" style="padding:9px 18px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;">Cadastrar</button>'+
    '</div></div>';
  document.body.appendChild(modal);

  document.getElementById('closeUserModal').addEventListener('click', function(){modal.remove();});
  document.getElementById('cancelUserModal').addEventListener('click', function(){modal.remove();});
  document.getElementById('saveUserModal').addEventListener('click', async function(){
    var name=document.getElementById('nuName').value.trim();
    var email=document.getElementById('nuEmail').value.trim().toLowerCase();
    var pass=document.getElementById('nuPass').value.trim()||'123456';
    var company=document.getElementById('nuCompany').value;
    if(!name||!email){Utils.toast('Nome e e-mail são obrigatórios','error');return;}
    if(pass.length<6){Utils.toast('Senha inicial precisa de 6+ caracteres','error');return;}
    var initials=name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase();
    var b=document.getElementById('saveUserModal'); b.disabled=true; b.textContent='Cadastrando...';
    try{
      await sbCreateUser(email,pass,{name:name,company:company,role:'participant',initials:initials});
      Utils.toast(name+' cadastrado(a)! ✓','success');
      modal.remove();
      if(window.syncProfilesFromSupabase) await syncProfilesFromSupabase();
      render();
    }catch(e){
      b.disabled=false; b.textContent='Cadastrar';
      Utils.toast(/registered|already|exists/i.test(e.message)?'E-mail já cadastrado':('Erro: '+e.message),'error');
    }
  });
  modal.addEventListener('click', function(e){if(e.target===modal)modal.remove();});
}

// ── Palpites do participante (admin corrige) ──────────────────────────────────
async function openUserBetsModal(email) {
  var ex = document.getElementById('userBetsModal'); if (ex) ex.remove(); // evita duplicado
  var u = DB.getUsers().find(function(x){return x.email===email;}) || {name:email, email:email, initials:'?'};
  var modal = document.createElement('div');
  modal.id = 'userBetsModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML =
    '<div style="background:white;border-radius:18px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.25);">'+
    '<div style="padding:18px 22px 12px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;gap:10px;">'+
      '<div style="width:34px;height:34px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:.78rem;flex-shrink:0;">'+esc(u.initials||'?')+'</div>'+
      '<div style="flex:1;min-width:0;"><div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.05rem;text-transform:uppercase;color:#1B2B6B;">Palpites de '+esc(u.name)+'</div>'+
      '<div style="font-size:.7rem;color:#9CA3BF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(email)+'</div></div>'+
      '<button id="closeUserBets" style="background:#EEF0F6;border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:1rem;flex-shrink:0;">✕</button>'+
    '</div>'+
    '<div id="userBetsBody" style="padding:14px 18px;overflow-y:auto;">'+
      '<div style="padding:20px;text-align:center;color:#9CA3BF;font-size:.85rem;">⏳ Carregando palpites...</div>'+
    '</div></div>';
  document.body.appendChild(modal);
  document.getElementById('closeUserBets').addEventListener('click', function(){modal.remove();});
  modal.addEventListener('click', function(e){if(e.target===modal)modal.remove();});

  // Palpites do participante vêm do servidor (RLS bets_admin permite ao admin).
  var body = document.getElementById('userBetsBody');
  var betsArr = [];
  try {
    await Sess.ensure();
    var r = await fetch(SUPABASE_URL+'/rest/v1/bets?user_email=eq.'+encodeURIComponent(email)+'&select=game_id,home_score,away_score,saved_at', {headers: Sess.headers(false)});
    if (!r.ok) throw new Error('HTTP '+r.status);
    betsArr = await r.json();
  } catch(e) {
    body.innerHTML = '<div style="padding:18px;color:#DC2626;font-size:.82rem;">❌ Erro ao carregar palpites: '+esc(e.message)+'</div>';
    return;
  }
  var betMap = {};
  betsArr.forEach(function(b){ betMap[b.game_id] = b; });

  var games = DB.getGames().filter(function(g){ return !g.tbd && g.home && g.away; })
    .sort(function(a,b){ return new Date(a.date) - new Date(b.date); });

  function fmtTs(ts){ if(!ts) return ''; var d=new Date(ts); if(isNaN(d.getTime())) return ''; var p=function(n){return ('0'+n).slice(-2);}; return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes()); }

  var h = '<div style="font-size:.72rem;color:#9CA3BF;margin-bottom:10px;">Edite o placar e salve. Mantém o horário original do palpite; o ranking recalcula no servidor.</div>';
  games.forEach(function(g){
    var b = betMap[g.id];
    var bh = b && b.home_score!=null ? b.home_score : '';
    var ba = b && b.away_score!=null ? b.away_score : '';
    var res = g.result ? (g.result.home_score+'×'+g.result.away_score) : '—';
    var when = b && b.saved_at ? ('🕒 '+fmtTs(b.saved_at)) : '— sem palpite';
    h += '<div style="display:flex;align-items:center;gap:7px;padding:8px 4px;border-bottom:1px solid #F1F3F8;">';
    h += '<div style="flex:1;min-width:0;">';
    h += '<div style="font-size:.78rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+flag(g.home)+' '+esc(g.home)+' × '+esc(g.away)+' '+flag(g.away)+'</div>';
    h += '<div style="font-size:.6rem;color:'+(b&&b.saved_at?'#9CA3BF':'#C0C5D6')+';margin-top:2px;" title="Data do palpite">'+when+'</div>';
    h += '</div>';
    h += '<span style="font-size:.6rem;color:#9CA3BF;white-space:nowrap;" title="Resultado oficial">R:'+res+'</span>';
    h += '<input id="ab-h-'+g.id+'" type="number" min="0" value="'+bh+'" style="width:36px;padding:5px 2px;border:1.5px solid #DDE1EE;border-radius:7px;text-align:center;font-size:.85rem;"/>';
    h += '<span style="color:#9CA3BF;font-size:.75rem;">×</span>';
    h += '<input id="ab-a-'+g.id+'" type="number" min="0" value="'+ba+'" style="width:36px;padding:5px 2px;border:1.5px solid #DDE1EE;border-radius:7px;text-align:center;font-size:.85rem;"/>';
    h += '<button data-savebet="'+g.id+'" style="padding:5px 9px;background:#1B2B6B;color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;white-space:nowrap;">Salvar</button>';
    h += '</div>';
  });
  body.innerHTML = h;

  body.addEventListener('click', function(e){
    var sv = e.target.closest('[data-savebet]');
    if (!sv) return;
    var gid = sv.getAttribute('data-savebet');
    var hv = document.getElementById('ab-h-'+gid).value;
    var av = document.getElementById('ab-a-'+gid).value;
    if (hv===''||av===''){ Utils.toast('Preencha os dois placares','error'); return; }
    var prev = betMap[gid];
    adminSaveBet(email, gid, parseInt(hv,10), parseInt(av,10), prev&&prev.saved_at, sv, betMap);
  });
}

// Upsert do palpite com o user_email do PARTICIPANTE (não o do admin).
async function adminSaveBet(email, gameId, hs, as, savedAt, btn, betMap) {
  var orig = btn.textContent; btn.disabled = true; btn.textContent = '...';
  var payload = { user_email: email, game_id: gameId, home_score: hs, away_score: as, saved_at: savedAt || new Date().toISOString() };
  try {
    await Sess.ensure();
    var res = await fetch(SUPABASE_URL+'/rest/v1/bets?on_conflict=user_email,game_id', {
      method:'POST',
      headers: Object.assign({}, Sess.headers(), {'Prefer':'resolution=merge-duplicates,return=minimal'}),
      body: JSON.stringify(payload)
    });
    if (!res.ok) { var t = await res.text(); throw new Error(res.status+' '+t.slice(0,90)); }
    if (betMap) betMap[gameId] = {game_id:gameId, home_score:hs, away_score:as, saved_at:payload.saved_at};
    btn.textContent = '✓'; btn.style.background = '#16A34A';
    Utils.toast('Palpite corrigido ✓','success');
    if (window.syncRankingFromSupabase) await syncRankingFromSupabase();
    setTimeout(function(){ btn.disabled=false; btn.textContent=orig; btn.style.background='#1B2B6B'; }, 1200);
  } catch(e) {
    btn.disabled = false; btn.textContent = orig;
    Utils.toast('Falha ao salvar: '+e.message,'error');
  }
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCsv() {
  var ranking = DB.getRanking();
  var csv = 'Posição,Nome,Empresa,Pontos,Exatos,Vencedores,Palpites\n'+
    ranking.map(function(r){return r.position+',"'+esc(r.name)+'","'+esc(r.company)+'",'+r.totalPts+','+r.exactScores+','+r.correctWinners+','+r.betCount;}).join('\n');
  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href=url; a.download='ranking-copa2026.csv'; a.click();
  Utils.toast('CSV exportado!','success');
}

render();
// admin: carrega a lista de perfis sob demanda (não vem no boot)
if (Auth.isAdmin() && window.syncProfilesFromSupabase) syncProfilesFromSupabase().then(render);
})();

}};
