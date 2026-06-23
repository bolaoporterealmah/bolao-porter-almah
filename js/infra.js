
Auth.init=function(){var r=localStorage.getItem('bolao_user');if(!r){SPA.navigate('login');return false;}this.user=JSON.parse(r);return true;};
Auth.logout=function(){Sess.clear();SPA.navigate('login');};
// Confirma admin no SERVIDOR (profiles.role via JWT). Tri-state:
//   true = admin · false = NÃO admin (confirmado) · null = inconclusivo (rede/401)
Auth.verifyAdmin=async function(){
  var uid=this.user&&this.user.id; if(!uid) return false;
  try{
    await Sess.ensure();              // renova o JWT se estiver perto de expirar
    var r=await fetch(SUPABASE_URL+'/rest/v1/profiles?id=eq.'+encodeURIComponent(uid)+'&select=role&limit=1',{headers:Sess.headers(false)});
    if(!r.ok) return null;            // 401/erro: não conclui (RLS ainda barra ações)
    var rows=await r.json();
    return !!(rows&&rows[0]&&rows[0].role==='admin');
  }catch(e){ return null; }           // rede caiu: não desloga à toa
};

// ═══════════════════════════════════════════════════════════════════
// SUPABASE LAYER — dados compartilhados em tempo real
// ═══════════════════════════════════════════════════════════════════
var SUPABASE_URL = 'https://ldygmzsqjoxlxtrdgstv.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeWdtenNxam94bHh0cmRnc3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTYwODQsImV4cCI6MjA5NjA5MjA4NH0.nMmVTWHZukubtRrTSe486ducJkvQiTAhd8pNrV6I_Ts';

// ── Sessão / Auth (Supabase Auth + JWT) ──────────────────────────────
var SUPABASE_ANON = SUPABASE_KEY; // chave pública (anon) — só leitura permitida por RLS
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var Sess = {
  get:function(){ try{return JSON.parse(localStorage.getItem('bolao_session')||'null');}catch(e){return null;} },
  set:function(s){ localStorage.setItem('bolao_session', JSON.stringify(s)); },
  clear:function(){ localStorage.removeItem('bolao_session'); localStorage.removeItem('bolao_user'); },
  token:function(){ var s=this.get(); return s&&s.access_token; },
  headers:function(json){ var h={'apikey':SUPABASE_ANON,'Authorization':'Bearer '+(this.token()||SUPABASE_ANON)}; if(json!==false){h['Content-Type']='application/json';} return h; },
  ensure:async function(){ var s=this.get(); if(!s)return false; if(s.expires_at && (Date.now()/1000)>(s.expires_at-60)){ return await this.refresh(); } return true; },
  refresh:async function(){ var s=this.get(); if(!s||!s.refresh_token)return false;
    try{ var r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':SUPABASE_ANON,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});
      if(!r.ok){this.clear();return false;} var d=await r.json(); this.set({access_token:d.access_token,refresh_token:d.refresh_token,expires_at:d.expires_at,user:d.user}); return true;
    }catch(e){return false;} }
};
async function loadProfile(){
  var s=Sess.get(); if(!s||!s.user)return null;
  var uid=s.user.id, email=s.user.email, prof=null;
  try{ var r=await fetch(SUPABASE_URL+'/rest/v1/profiles?id=eq.'+encodeURIComponent(uid)+'&select=*&limit=1',{headers:Sess.headers(false)}); if(r.ok){var rows=await r.json(); prof=rows&&rows[0];} }catch(e){}
  var u = prof || { id:uid, email:email, name:(email||'').split('@')[0], role:'participant', company:'Porter', initials:(email||'??').slice(0,2).toUpperCase() };
  localStorage.setItem('bolao_user', JSON.stringify(u)); Auth.user=u; return u;
}
async function sbLogin(email,password){
  var r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':SUPABASE_ANON,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:password})});
  var d=await r.json(); if(!r.ok) throw new Error(d.error_description||d.msg||'E-mail ou senha incorretos.');
  Sess.set({access_token:d.access_token,refresh_token:d.refresh_token,expires_at:d.expires_at,user:d.user});
  var u=await loadProfile();
  // Conta desativada pelo admin → não entra (RLS também barra gravações).
  if(u && u.active===false){ Sess.clear(); Auth.user=null; throw new Error('Conta desativada. Fale com o administrador do bolão.'); }
  await initSupabase();
  if(window.reconcileLocalBets) await reconcileLocalBets();
  return u;
}
async function sbSignup(email,password,meta){
  var r=await fetch(SUPABASE_URL+'/auth/v1/signup',{method:'POST',headers:{'apikey':SUPABASE_ANON,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:password,data:meta||{}})});
  var d=await r.json(); if(!r.ok) throw new Error(d.error_description||d.msg||d.error||'Cadastro falhou.');
  if(d.access_token){ Sess.set({access_token:d.access_token,refresh_token:d.refresh_token,expires_at:d.expires_at,user:d.user}); var u=await loadProfile(); await initSupabase(); return u; }
  return await sbLogin(email,password);
}
// cria conta SEM trocar a sessão atual (admin cadastrando outro usuário)
async function sbCreateUser(email,password,meta){
  var r=await fetch(SUPABASE_URL+'/auth/v1/signup',{method:'POST',headers:{'apikey':SUPABASE_ANON,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:password,data:meta||{}})});
  var d=await r.json(); if(!r.ok) throw new Error(d.error_description||d.msg||d.error||'erro'); return d;
}
async function syncProfilesFromSupabase(){
  try{ var r=await fetch(SUPABASE_URL+'/rest/v1/profiles?select=*',{headers:Sess.headers(false)}); if(!r.ok)return false; var rows=await r.json(); if(rows&&rows.length){ DB.set('users', rows); } return true; }catch(e){return false;}
}

// Ativa/desativa um participante (admin). Inativo some do ranking (a RPC filtra
// `active` → posições recalculam sozinhas) e é bloqueado no login + RLS.
// Após o PATCH, re-sincroniza perfis e ranking p/ refletir a reclassificação.
window.setUserActive = async function(email, active){
  await Sess.ensure();
  var r = await fetch(SUPABASE_URL+'/rest/v1/profiles?email=eq.'+encodeURIComponent(email), {
    method:'PATCH',
    headers: Object.assign({}, Sess.headers(), {'Prefer':'return=minimal'}),
    body: JSON.stringify({active: !!active})
  });
  if(!r.ok){ var t=await r.text(); throw new Error(r.status+' '+t.slice(0,140)); }
  // Snapshots do movement (▲▼) só são reconstruídos pela trigger ao mudar
  // resultado de jogo. Desativar/reativar não dispara isso → reconstrói aqui,
  // senão quem estava abaixo do inativo apareceria com ▲ falso até o próximo placar.
  try {
    await fetch(SUPABASE_URL+'/rest/v1/rpc/rebuild_ranking_snapshots', {method:'POST', headers:Sess.headers(), body:'{}'});
  } catch(e) { /* movement se auto-corrige no próximo resultado */ }
  if(window.syncProfilesFromSupabase) await syncProfilesFromSupabase();
  if(window.syncRankingFromSupabase) await syncRankingFromSupabase();
  if(window.syncRankingMovementFromSupabase) await syncRankingMovementFromSupabase();
  return true;
};

var SB = {
  _cache: {},

  headers: function() {
    return Object.assign({}, Sess.headers(), {'Prefer': 'return=representation'});
  },

  async get(table, query) {
    var url = SUPABASE_URL + '/rest/v1/' + table + '?' + (query||'select=*');
    var r = await fetch(url, {headers: this.headers()});
    if (!r.ok) throw new Error('SB GET ' + table + ' ' + r.status);
    return r.json();
  },

  async upsert(table, data, conflict) {
    var url = SUPABASE_URL + '/rest/v1/' + table;
    var headers = Object.assign({}, this.headers(), {'Prefer': 'resolution=merge-duplicates,return=representation'});
    var r = await fetch(url, {method:'POST', headers:headers, body:JSON.stringify(data)});
    if (!r.ok) {
      var err = await r.text();
      throw new Error('SB UPSERT ' + table + ' ' + r.status + ': ' + err);
    }
    return r.json();
  },

  async delete(table, filter) {
    var url = SUPABASE_URL + '/rest/v1/' + table + '?' + filter;
    var r = await fetch(url, {method:'DELETE', headers:this.headers()});
    if (!r.ok) throw new Error('SB DELETE ' + table + ' ' + r.status);
    return true;
  }
};

// ── Override DB methods to use Supabase ──────────────────────────────────────
var _localDB = Object.assign({}, DB); // keep local as fallback

// Load all data from Supabase into localStorage cache on startup
async function initSupabase() {
  try {
    // Load games
    var games = await SB.get('games', 'select=*&order=date.asc');
    if (games && games.length > 0) {
      var mapped = games.map(function(g) {
        return {
          id: g.id, phase: g.phase, group: g.group,
          home: g.home, away: g.away, date: g.date,
          city: g.city, stadium: g.stadium,
          result: (g.result_home !== null && g.result_home !== undefined)
            ? {home_score: g.result_home, away_score: g.result_away}
            : null,
          tbd: g.tbd, desc: g.description
        };
      });
      DB.saveGames(mapped);
      console.log('[Supabase] Loaded', games.length, 'games');
    } else {
      // First run: seed games to Supabase
      await seedGamesToSupabase();
    }

    // (perfis de TODOS não são carregados no boot — só admin carrega, sob demanda)

    // Bets: SÓ os próprios (delega p/ syncBetsFromSupabase, que também busca o ranking via RPC)
    if (window.syncBetsFromSupabase) await syncBetsFromSupabase();

    // Specials: SÓ os próprios
    var meInit = Auth.user && Auth.user.email;
    if (meInit) {
      var specials = await SB.get('specials', 'user_email=eq.' + encodeURIComponent(meInit) + '&select=*');
      var specsObj = {};
      (specials || []).forEach(function(s) {
        specsObj[s.user_email] = { champion: s.champion, runner_up: s.runner_up, third: s.third, qualified: s.qualified || [] };
      });
      DB.set('specials', specsObj);
    }

    // Load settings (final results)
    var settings = await SB.get('settings', 'select=*');
    if (settings) {
      settings.forEach(function(s) {
        if (s.key === 'final_results') DB.saveFinalResults(s.value);
      });
    }

    window._supabaseReady = true;
    console.log('[Supabase] ✅ All data loaded');

  } catch(e) {
    console.warn('[Supabase] Error loading data, using local:', e.message);
    window._supabaseReady = false;
  }
}

async function seedGamesToSupabase() {
  var games = DEFAULT_GAMES;
  var rows = games.map(function(g) {
    return {
      id: g.id, phase: g.phase, group: g.group || null,
      home: g.home || null, away: g.away || null,
      date: g.date, city: g.city || null, stadium: g.stadium || null,
      result_home: g.result ? g.result.home_score : null,
      result_away: g.result ? g.result.away_score : null,
      tbd: g.tbd || false, description: g.desc || null
    };
  });
  // Insert in batches of 20
  var inserted = 0;
  for (var i=0; i<rows.length; i+=20) {
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/games', {
        method: 'POST',
        headers: {
          ...Sess.headers(),
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(rows.slice(i, i+20))
      });
      if (res.ok) inserted += Math.min(20, rows.length - i);
    } catch(e) { console.warn('[Supabase] seed games batch error:', e); }
  }
  console.log('[Supabase] Seeded', inserted, 'games');
}

// Override saveBet to also write to Supabase
var _origSaveBet = DB.saveBet.bind(DB);
DB.saveBet = async function(userId, gameId, bet) {
  // 1. Always save to localStorage first (instant, never fails)
  _origSaveBet(userId, gameId, bet);
  
  // 2. Save to Supabase with retry
  var u = Auth.user;
  if (!u || !u.email) return;
  
  var payload = {
    user_email: u.email,
    game_id: gameId,
    home_score: bet.home_score,
    away_score: bet.away_score,
    saved_at: new Date().toISOString()
  };
  
  // Try upsert
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var res = await fetch(SUPABASE_URL + '/rest/v1/bets?on_conflict=user_email,game_id', {
        method: 'POST',
        headers: {
          ...Sess.headers(),
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        console.log('[SB] Bet saved OK:', gameId, bet.home_score+'x'+bet.away_score);
        if (window.syncRankingFromSupabase) syncRankingFromSupabase();
        return; // success
      }
      
      var errText = await res.text();
      console.warn('[SB] Bet attempt '+attempt+' failed ('+res.status+'):', errText.substring(0,100));
      
      // If FK error on game_id, try without game_id reference (fallback)
      if (errText.includes('fkey') || errText.includes('foreign key')) {
        // Store as note in user_email field workaround: just log, localStorage has it
        console.warn('[SB] FK error - bet saved only in localStorage');
        return;
      }
      
      // Wait before retry
      await new Promise(function(r){ setTimeout(r, 500 * attempt); });
      
    } catch(e) {
      console.warn('[SB] Bet network error attempt '+attempt+':', e.message);
      if (attempt === 3) console.error('[SB] All retries failed, bet only in localStorage');
    }
  }
}

// Sync all bets from Supabase into localStorage
// ── Resultados palpitados por um participante (público, só jogos encerrados) ───
// Fonte: RPC user_finished_bets (SECURITY DEFINER) — só devolve palpites de jogos já
// encerrados. Palpite de jogo em aberto NUNCA é exposto (privacidade preservada).
window.openParticipantResultsModal = async function(email) {
  var ex = document.getElementById('participantResultsModal'); if (ex) ex.remove();
  var u = DB.getRanking().find(function(x){return x.email===email;})
       || DB.getUsers().find(function(x){return x.email===email;})
       || {name:email, email:email, initials:'?', company:''};
  var modal = document.createElement('div');
  modal.id = 'participantResultsModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML =
    '<div style="background:white;border-radius:18px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.25);">'+
    '<div style="padding:18px 22px 12px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;gap:10px;">'+
      '<div style="width:38px;height:38px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:.82rem;flex-shrink:0;">'+esc(u.initials||'?')+'</div>'+
      '<div style="flex:1;min-width:0;"><div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.05rem;text-transform:uppercase;color:#1B2B6B;">'+esc(u.name)+'</div>'+
      '<div style="font-size:.7rem;color:#9CA3BF;">Resultados palpitados · jogos encerrados</div></div>'+
      '<button id="closePartRes" style="background:#EEF0F6;border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:1rem;flex-shrink:0;">✕</button>'+
    '</div>'+
    '<div id="partResBody" style="padding:14px 18px;overflow-y:auto;">'+
      '<div style="padding:20px;text-align:center;color:#9CA3BF;font-size:.85rem;">⏳ Carregando...</div>'+
    '</div></div>';
  document.body.appendChild(modal);
  document.getElementById('closePartRes').addEventListener('click', function(){modal.remove();});
  modal.addEventListener('click', function(e){if(e.target===modal)modal.remove();});

  var body = document.getElementById('partResBody');
  var betsArr = [];
  try {
    await Sess.ensure();
    var r = await fetch(SUPABASE_URL+'/rest/v1/rpc/user_finished_bets', {
      method:'POST', headers: Sess.headers(), body: JSON.stringify({p_email: email})
    });
    if (!r.ok) throw new Error('HTTP '+r.status);
    betsArr = await r.json();
  } catch(e) {
    body.innerHTML = '<div style="padding:18px;color:#DC2626;font-size:.82rem;">❌ Erro ao carregar: '+esc(e.message)+'</div>';
    return;
  }

  var betMap = {};
  betsArr.forEach(function(b){ betMap[b.game_id] = b; });

  var games = DB.getGames()
    .filter(function(g){ return g.result && !g.tbd && betMap[g.id]; })
    .sort(function(a,b){ return new Date(b.date) - new Date(a.date); });

  if (!games.length) {
    body.innerHTML = '<div style="padding:32px;text-align:center;color:#9CA3BF;font-size:.85rem;">Nenhum palpite em jogos encerrados ainda.</div>';
    return;
  }

  var totalPts = 0, exactCount = 0;
  var rows = '';
  games.forEach(function(g){
    var b = betMap[g.id];
    var sc = Scoring.calculate(b, {home_score:g.result.home_score, away_score:g.result.away_score, phase:g.phase});
    var pts = sc ? sc.total : 0;
    totalPts += pts;
    var isExact = !!(sc && sc.base === 15);
    if (isExact) exactCount++;
    rows += '<div style="border:1px solid '+(isExact?'#F5C518':'#EEF0F6')+';border-radius:11px;padding:10px 12px;margin-bottom:8px;'+(isExact?'background:linear-gradient(135deg,rgba(245,197,24,.1),rgba(34,197,94,.06));':'')+'">';
    rows += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">';
    rows += '<span style="font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;">'+Utils.phaseName(g.phase)+(g.group?' · Grupo '+g.group:'')+'</span>';
    rows += '<span style="font-size:.62rem;color:#9CA3BF;">'+Utils.formatDate(g.date)+'</span>';
    rows += '</div>';
    rows += '<div style="display:flex;align-items:center;gap:10px;">';
    rows += '<div style="flex:1;text-align:right;font-size:.8rem;font-weight:700;color:#2D3557;">'+esc(g.home)+' '+flag(g.home)+'</div>';
    rows += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:#1B2B6B;white-space:nowrap;">'+g.result.home_score+' × '+g.result.away_score+'</div>';
    rows += '<div style="flex:1;text-align:left;font-size:.8rem;font-weight:700;color:#2D3557;">'+flag(g.away)+' '+esc(g.away)+'</div>';
    rows += '</div>';
    rows += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #EEF0F6;font-size:.74rem;">';
    rows += '<span style="color:#5A6385;">Palpite: <strong style="color:#2D3557;">'+b.home_score+' × '+b.away_score+'</strong>'+(isExact?' 🎯':'')+'</span>';
    rows += '<span style="background:'+(pts>0?'rgba(34,197,94,.12)':'rgba(0,0,0,.05)')+';color:'+(pts>0?'#16A34A':'#9CA3BF')+';padding:2px 10px;border-radius:99px;font-weight:800;">'+(pts>0?'+'+pts+' pts':'0 pts')+'</span>';
    rows += '</div>';
    rows += '</div>';
  });

  var head = '<div style="display:flex;gap:8px;margin-bottom:12px;">';
  head += '<div style="flex:1;background:#F8F9FC;border-radius:10px;padding:9px;text-align:center;"><div style="font-size:.6rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;">Jogos</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.4rem;font-weight:900;color:#1B2B6B;line-height:1;">'+games.length+'</div></div>';
  head += '<div style="flex:1;background:#F8F9FC;border-radius:10px;padding:9px;text-align:center;"><div style="font-size:.6rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;">Exatos</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.4rem;font-weight:900;color:#16A34A;line-height:1;">'+exactCount+'</div></div>';
  head += '<div style="flex:1;background:#F8F9FC;border-radius:10px;padding:9px;text-align:center;"><div style="font-size:.6rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;">Pontos</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.4rem;font-weight:900;color:#D4A80F;line-height:1;">'+totalPts+'</div></div>';
  head += '</div>';

  body.innerHTML = head + rows;
}

window.syncBetsFromSupabase = async function() {
  var me = Auth.user && Auth.user.email;
  if (!me) return false;
  try {
    // Puxa SOMENTE os próprios palpites (privacidade: ninguém vê palpite alheio)
    var res = await fetch(SUPABASE_URL + '/rest/v1/bets?user_email=eq.' + encodeURIComponent(me) + '&select=game_id,home_score,away_score,saved_at', { headers: Sess.headers(false) });
    if (!res.ok) return false;
    var mine = await res.json();
    // Cache local SÓ com os meus — sobrescreve e apaga qualquer resíduo de outros
    var mineObj = {};
    mine.forEach(function(b){ mineObj[b.game_id] = { home_score: b.home_score, away_score: b.away_score, savedAt: new Date(b.saved_at).getTime() }; });
    var only = {}; only[me] = mineObj;
    DB.saveBets(only);
    // Ranking vem pronto do servidor (RPC), sem expor palpite de ninguém
    if (window.syncRankingFromSupabase) await syncRankingFromSupabase();
    return true;
  } catch(e) { return false; }
};

// Ranking calculado no servidor (RPC public.ranking) — só agregado, nunca palpite cru de outro
window.syncRankingFromSupabase = async function() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/rpc/ranking', { method: 'POST', headers: Sess.headers(), body: '{}' });
    if (!r.ok) return false;
    var rows = await r.json();
    var mapped = (rows || []).map(function(u){ return {
      email: u.email, name: u.name, company: u.company, role: u.role, initials: u.initials,
      totalPts: u.total_pts, exactScores: u.exact_scores, correctWinners: u.correct_winners,
      goalDiff: u.goal_diff, oneTeam: u.one_team,
      betCount: u.bet_count, totalBets: u.total_bets, avgBetTime: u.avg_bet_time, position: u.pos
    }; });
    DB.set('ranking', mapped);
    return true;
  } catch(e) { return false; }
};

// Maior pontuação em um único jogo (global) — vem do RPC, sem palpite cru de ninguém.
window.syncBestGameFromSupabase = async function() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/rpc/best_single_game', { method: 'POST', headers: Sess.headers(), body: '{}' });
    if (!r.ok) return false;
    var rows = await r.json();
    DB.set('best_game', (rows && rows[0]) || null);
    return true;
  } catch(e) { return false; }
};

// Hall: jogo que mais gente cravou (placar exato). RPC most_exact_game (agregado).
window.syncMostExactGameFromSupabase = async function() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/rpc/most_exact_game', { method: 'POST', headers: Sess.headers(), body: '{}' });
    if (!r.ok) return false;
    var rows = await r.json();
    DB.set('most_exact_game', (rows && rows[0]) || null);
    return true;
  } catch(e) { return false; }
};

// Hall: jogo que mais distribuiu pontos (soma de todos os ativos). RPC top_distributing_game.
window.syncTopDistributingGameFromSupabase = async function() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/rpc/top_distributing_game', { method: 'POST', headers: Sess.headers(), body: '{}' });
    if (!r.ok) return false;
    var rows = await r.json();
    DB.set('top_distributing_game', (rows && rows[0]) || null);
    return true;
  } catch(e) { return false; }
};

// Hall: prêmios extras. Cada RPC devolve 1 (ou poucas) linha(s) agregada(s).
// Helper genérico p/ RPC sem parâmetros → guarda no cache local sob `key`.
async function _rpcCacheOne(rpc, key, firstOnly){
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + rpc, { method: 'POST', headers: Sess.headers(), body: '{}' });
    if (!r.ok) return false;
    var rows = await r.json();
    DB.set(key, firstOnly ? ((rows && rows[0]) || null) : (rows || []));
    return true;
  } catch(e) { return false; }
}
window.syncBottomDistributingGameFromSupabase = function(){ return _rpcCacheOne('bottom_distributing_game', 'bottom_distributing_game', true); };
window.syncBiggestClimbFromSupabase     = function(){ return _rpcCacheOne('biggest_climb', 'biggest_climb', true); };
window.syncHottestStreakFromSupabase    = function(){ return _rpcCacheOne('hottest_streak', 'hottest_streak', true); };
window.syncRarestExactFromSupabase      = function(){ return _rpcCacheOne('rarest_exact', 'rarest_exact', true); };
window.syncKnockoutProphetFromSupabase  = function(){ return _rpcCacheOne('knockout_prophet', 'knockout_prophet', true); };
window.syncPerfectPredictorsFromSupabase= function(){ return _rpcCacheOne('perfect_predictors', 'perfect_predictors', false); };
window.syncCompanyDuelFromSupabase      = function(){ return _rpcCacheOne('company_duel', 'company_duel', false); };

// Movimento do ranking (▲▼). RPC ranking_movement devolve a posição ANTERIOR de cada
// participante (snapshot tirado antes do último placar). delta = prev - atual no client.
window.syncRankingMovementFromSupabase = async function() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/rpc/ranking_movement', { method: 'POST', headers: Sess.headers(), body: '{}' });
    if (!r.ok) return false;
    var rows = await r.json();
    var map = {};
    (rows || []).forEach(function(x){ if (x.email != null && x.prev_position != null) map[x.email] = x.prev_position; });
    DB.set('ranking_movement', map);
    return true;
  } catch(e) { return false; }
};

// Quem cravou o placar exato, por jogo (global). Vem do RPC exact_scorers (SECURITY DEFINER):
// só retorna palpites que BATERAM com o resultado de jogos já encerrados — nunca palpite cru de quem errou.
window.syncExactScorersFromSupabase = async function() {
  try {
    var r = await fetch(SUPABASE_URL + '/rest/v1/rpc/exact_scorers', { method: 'POST', headers: Sess.headers(), body: '{}' });
    if (!r.ok) return false;
    var rows = await r.json();
    var byGame = {};
    (rows || []).forEach(function(x){
      if (!byGame[x.game_id]) byGame[x.game_id] = [];
      byGame[x.game_id].push({ name: x.name, company: x.company, initials: x.initials });
    });
    DB.set('exact_scorers', byGame);
    return true;
  } catch(e) { return false; }
};

// Reconciliação ÚNICA por navegador: empurra palpites locais (verdade) p/ Supabase;
// depois marca sincronizado e o Supabase passa a ser a fonte.
window.reconcileLocalBets = async function() {
  var me = Auth.user && Auth.user.email; if (!me) return;
  var flag = 'bolao_synced_' + me;
  if (localStorage.getItem(flag)) return; // já reconciliado neste navegador
  try {
    // lê os palpites legados do localStorage do app ANTIGO (única vez)
    var localMine = {};
    try { localMine = (JSON.parse(localStorage.getItem('bolao_bets') || '{}')[me]) || {}; } catch(e) {}
    var r = await fetch(SUPABASE_URL + '/rest/v1/bets?user_email=eq.' + encodeURIComponent(me) + '&select=game_id,home_score,away_score', { headers: Sess.headers(false) });
    var remote = r.ok ? await r.json() : [];
    var rmap = {}; remote.forEach(function(b){ rmap[b.game_id] = b; });
    var toPush = [];
    Object.keys(localMine).forEach(function(gid){
      var lb = localMine[gid];
      if (!lb || lb.home_score == null || lb.away_score == null) return;     // sem placar válido: ignora
      var lh = Number(lb.home_score), la = Number(lb.away_score);
      if (isNaN(lh) || isNaN(la)) return;
      var rb = rmap[gid];
      if (!rb || Number(rb.home_score) !== lh || Number(rb.away_score) !== la) {   // faltando ou diferente → local vence
        toPush.push({ user_email: me, game_id: gid, home_score: lh, away_score: la, saved_at: new Date(lb.savedAt || Date.now()).toISOString() });
      }
    });
    if (toPush.length) {
      var up = await fetch(SUPABASE_URL + '/rest/v1/bets?on_conflict=user_email,game_id', { method: 'POST', headers: Object.assign({}, Sess.headers(), {'Prefer':'resolution=merge-duplicates,return=minimal'}), body: JSON.stringify(toPush) });
      if (!up.ok) { console.warn('[reconcile] push falhou', up.status, (await up.text()).slice(0,120)); return; } // não marca flag → tenta de novo no próximo load
      console.log('[reconcile] enviados', toPush.length, 'palpite(s) local → Supabase');
    }
    localStorage.setItem(flag, '1');                              // navegador sincronizado
    // purga qualquer dado legado do localStorage — daqui pra frente só Supabase (memória)
    ['bolao_bets','bolao_specials','bolao_games','bolao_users','bolao_final_results','bolao_ranking'].forEach(function(k){ localStorage.removeItem(k); });
    if (window.syncBetsFromSupabase) await syncBetsFromSupabase(); // a partir daqui, Supabase é a verdade
  } catch(e) { console.warn('[reconcile]', e.message); }
};

// Sync specials from Supabase
window.syncSpecialsFromSupabase = async function() {
  var me = Auth.user && Auth.user.email;
  if (!me) return false;
  try {
    // SÓ os próprios especiais (privacidade)
    var res = await fetch(SUPABASE_URL + '/rest/v1/specials?user_email=eq.' + encodeURIComponent(me) + '&select=*', {
      headers: Sess.headers(false)
    });
    if (!res.ok) return false;
    var specials = await res.json();
    var specsObj = {};
    specials.forEach(function(s) {
      specsObj[s.user_email] = {
        champion: s.champion, runner_up: s.runner_up,
        third: s.third, qualified: s.qualified || []
      };
    });
    DB.set('specials', specsObj);
    return true;
  } catch(e) { return false; }
};

// Override saveSpecials
var _origSaveSpecials = DB.saveSpecials.bind(DB);
DB.saveSpecials = async function(userId, data) {
  _origSaveSpecials(userId, data);
  try {
    var u = Auth.user;
    if (!u || !u.email) return;
    var res = await fetch(SUPABASE_URL + '/rest/v1/specials?on_conflict=user_email', {
      method: 'POST',
      headers: {
        ...Sess.headers(),
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        user_email: u.email,
        champion: data.champion || null,
        runner_up: data.runner_up || null,
        third: data.third || null,
        qualified: data.qualified || []
      })
    });
    if (!res.ok) {
      var err = await res.text();
      console.error('[SB] saveSpecials failed:', res.status, err.substring(0,150));
    } else {
      console.log('[SB] Specials saved OK for', u.email);
      if (window.syncRankingFromSupabase) syncRankingFromSupabase();
    }
  } catch(e) { console.warn('[Supabase] saveSpecials failed', e.message); }
};

// Override saveGames (admin inserting results)
var _origSaveGames = DB.saveGames.bind(DB);
DB.saveGames = async function(games) {
  _origSaveGames(games);
  try {
    // Find games with results and update Supabase
    var withResults = games.filter(function(g){ return g.result; });
    for (var i=0; i<withResults.length; i++) {
      var g = withResults[i];
      await SB.upsert('games', {
        id: g.id, phase: g.phase, group: g.group||null,
        home: g.home||null, away: g.away||null,
        date: g.date, city: g.city||null, stadium: g.stadium||null,
        result_home: g.result.home_score,
        result_away: g.result.away_score,
        tbd: g.tbd||false
      });
    }
    if (window.syncRankingFromSupabase) await syncRankingFromSupabase(); // resultado mudou → recalcula ranking
  } catch(e) { console.warn('[Supabase] saveGames failed:', e.message); }
};

// Salva/limpa o resultado de UM jogo só (PATCH numa linha) → dispara 1 rebuild da trigger.
// Passe (gid, null, null) para REMOVER o resultado (corrige typo). Antes o save mandava
// upsert de TODOS os jogos com resultado, e o clear nunca chegava no servidor.
window.upsertGameResult = async function(gameId, homeScore, awayScore) {
  await Sess.ensure();
  var body = {
    result_home: (homeScore === null || homeScore === undefined) ? null : homeScore,
    result_away: (awayScore === null || awayScore === undefined) ? null : awayScore
  };
  var r = await fetch(SUPABASE_URL + '/rest/v1/games?id=eq.' + encodeURIComponent(gameId), {
    method: 'PATCH',
    headers: Object.assign({}, Sess.headers(), {'Prefer': 'return=minimal'}),
    body: JSON.stringify(body)
  });
  if (!r.ok) { var t = await r.text(); throw new Error(r.status + ' ' + t.slice(0,140)); }
  if (window.syncRankingFromSupabase) await syncRankingFromSupabase();
  if (window.syncRankingMovementFromSupabase) await syncRankingMovementFromSupabase();
  return true;
};

// Override saveUsers
var _origSaveUsers = DB.saveUsers.bind(DB);
DB.saveUsers = async function(users) {
  _origSaveUsers(users);
  try {
    // Só persiste edições de perfis já existentes (id = uuid do Auth).
    // Criação de usuário é via Supabase Auth (signup), não aqui.
    var existing = users.filter(function(u){ return u.id && /-/.test(u.id); });
    for (var i=0; i<existing.length; i++) {
      var u = existing[i];
      await SB.upsert('profiles', {
        id: u.id, email: u.email, name: u.name,
        company: u.company, role: u.role, initials: u.initials
      });
    }
  } catch(e) { console.warn('[Supabase] saveUsers failed:', e.message); }
};

// Save final results to Supabase settings
var _origSaveFinal = DB.saveFinalResults.bind(DB);
DB.saveFinalResults = async function(r) {
  _origSaveFinal(r);
  try {
    await SB.upsert('settings', {key:'final_results', value: r});
  } catch(e) { console.warn('[Supabase] saveFinalResults failed:', e.message); }
};

// Periodic sync: reload bets from Supabase every 60s for real-time ranking
// Sync every 30 seconds
setInterval(async function() {
  try {
    // Sync bets
    if (window.syncBetsFromSupabase) await window.syncBetsFromSupabase();

    // Sync game results
    var res = await fetch(SUPABASE_URL + '/rest/v1/games?select=*&order=date.asc', {
      headers: Sess.headers(false)
    });
    if (res.ok) {
      var games = await res.json();
      if (games && games.length > 0) {
        var mapped = games.map(function(g) {
          return {
            id: g.id, phase: g.phase, group: g.group,
            home: g.home, away: g.away, date: g.date,
            city: g.city, stadium: g.stadium,
            result: (g.result_home !== null && g.result_home !== undefined)
              ? {home_score: g.result_home, away_score: g.result_away}
              : null,
            tbd: g.tbd, desc: g.description
          };
        });
        _origSaveGames(mapped);
      }
    }
  } catch(e) {}
}, 30000);

// Global apostas click handler — registered ONCE at app boot
document.addEventListener('click', function _apostasGlobalHandler(e) {
  if (SPA.current !== 'apostas') return;
  // Filter buttons
  var fb = e.target.closest('[data-betfilter]');
  if (fb) {
    var filter = fb.getAttribute('data-betfilter');
    // Find and call the apostas render via SPA
    if (window._apostasSetFilter) window._apostasSetFilter(filter);
    return;
  }
  // Score buttons
  var sb = e.target.closest('[data-score]');
  if (sb) {
    var info = sb.getAttribute('data-score').split('|');
    var inp = document.getElementById('score-'+info[1]+'-'+info[0]);
    if (inp) inp.value = Math.max(0, Math.min(20, (parseInt(inp.value)||0)+parseInt(info[2])));
    return;
  }
  // Save bet
  var saveBtn = e.target.closest('[data-savebet]');
  if (saveBtn && window._apostasSave) window._apostasSave(saveBtn.getAttribute('data-savebet'));
});

// Boot
(async function(){
  if (Sess.get()) {
    await Sess.ensure();
    try { Auth.user = JSON.parse(localStorage.getItem('bolao_user')||'null'); } catch(e){}
    // Conta desativada durante a sessão (JWT ainda válido) → desloga.
    try {
      var _uid = Auth.user && Auth.user.id;
      if (_uid) {
        var _pr = await fetch(SUPABASE_URL+'/rest/v1/profiles?id=eq.'+encodeURIComponent(_uid)+'&select=active&limit=1',{headers:Sess.headers(false)});
        if (_pr.ok) { var _prows = await _pr.json(); if (_prows && _prows[0] && _prows[0].active===false) { Sess.clear(); SPA.navigate('login'); return; } }
      }
    } catch(e){}
    await initSupabase();
    if (window.syncBetsFromSupabase) await syncBetsFromSupabase();
    if (window.reconcileLocalBets) await reconcileLocalBets();
  }
  var _h=(window.location.hash||'').replace('#','');
  SPA.navigate(SPA.pages[_h] ? _h : (Sess.get()?'dashboard':'login'));
})();
