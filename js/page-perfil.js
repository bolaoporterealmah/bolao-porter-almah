SPA.pages["perfil"]={style:`.profile-header {
  background: linear-gradient(135deg, var(--porter-blue) 0%, var(--porter-blue-light) 100%);
  border-radius: var(--radius-xl);
  padding: 28px;
  color: white; margin-bottom: 24px;
  display: flex; align-items: center; gap: 20px;
  position: relative; overflow: hidden;
}
.profile-header::before { content:'👤'; position:absolute; right:20px; top:50%; transform:translateY(-50%); font-size:100px; opacity:0.06; }
.profile-avatar { width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:700; border:3px solid rgba(255,255,255,0.3); flex-shrink:0; }
.profile-info .name { font-family:var(--font-display); font-size:1.6rem; font-weight:900; text-transform:uppercase; line-height:1.1; }
.profile-info .company { opacity:0.7; font-size:0.85rem; margin-top:2px; }
.profile-info .email { opacity:0.5; font-size:0.78rem; }

.profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media(max-width:700px){ .profile-grid{grid-template-columns:1fr;} }
.profile-grid .span2 { grid-column:1/-1; }

.bet-history-item {
  display:flex; align-items:center; gap:12px;
  padding:12px 0; border-bottom:1px solid var(--porter-gray-100);
}
.bet-history-item:last-child { border-bottom:none; }
.bh-match { flex:1; }
.bh-teams { font-weight:600; font-size:0.88rem; }
.bh-meta { font-size:0.72rem; color:var(--porter-gray-400); margin-top:2px; }
.bh-bet { font-family:var(--font-display); font-size:1rem; font-weight:800; color:var(--porter-blue); min-width:50px; text-align:center; }
.bh-pts { min-width:60px; text-align:right; }

.evolution-bar { display:flex; flex-direction:column; gap:4px; }
.evo-item { display:flex; align-items:center; gap:8px; }
.evo-label { font-size:0.72rem; color:var(--porter-gray-400); min-width:80px; }
.evo-track { flex:1; height:8px; background:var(--porter-gray-100); border-radius:99px; overflow:hidden; }
.evo-fill { height:100%; border-radius:99px; background:linear-gradient(90deg,var(--porter-blue),var(--porter-blue-light)); transition:width 0.8s ease; }
.evo-val { font-size:0.75rem; font-weight:700; color:var(--porter-blue); min-width:32px; text-align:right; }`,script:function(){

(function(){
  var user = Auth.user;
  var pc = document.getElementById('pageContent');
  if (!pc) return;

  function render() {
    var ranking = DB.getRanking();
    var myRank = ranking.find(function(r){ return r.email===user.email; }) || {position:'—',totalPts:0,exactScores:0,betCount:0};
    var bets = DB.getUserBets(user.id||user.email);
    var betCount = Object.keys(bets).length;

    var h = '';

    // Profile card
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">';

    // Left: identity
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="background:linear-gradient(135deg,#1B2B6B,#3D5AC8);padding:24px;text-align:center;">';
    h += '<div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800;color:white;margin:0 auto 12px;">'+user.initials+'</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;text-transform:uppercase;color:white;">'+esc(user.name)+'</div>';
    h += '<div style="font-size:.78rem;color:rgba(255,255,255,.65);margin-top:4px;">'+esc(user.email)+'</div>';
    h += '<span style="display:inline-block;margin-top:8px;padding:3px 12px;background:rgba(255,255,255,.15);border-radius:99px;font-size:.72rem;color:white;font-weight:600;">'+esc(user.company)+'</span>';
    h += '</div>';
    h += '<div style="padding:16px 18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
    h += statBox('Posição', myRank.position+(myRank.position!=='—'?'º':''), '#D4A80F');
    h += statBox('Pontos', myRank.totalPts, '#1B2B6B');
    h += statBox('Exatos', myRank.exactScores, '#16A34A');
    h += statBox('Apostas', betCount, '#2563EB');
    h += '</div></div>';

    // Right: edit profile + change password
    h += '<div style="display:flex;flex-direction:column;gap:14px;">';

    // Edit profile
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:20px;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:14px;">✏️ Editar Perfil</div>';
    h += fld('Nome', 'pf-name', esc(user.name), 'text');
    h += '<div style="margin-bottom:12px;"><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Empresa</label>';
    h += '<select id="pf-company" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;background:white;">';
    h += '<option'+(esc(user.company)==='Porter'?' selected':'')+'>Porter</option>';
    h += '<option'+(esc(user.company)==='Almah'?' selected':'')+'>Almah</option>';
    h += '</select></div>';
    h += '<button id="btn-save-profile" style="width:100%;padding:10px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.88rem;cursor:pointer;">💾 Salvar Perfil</button>';
    h += '</div>';

    // Change password
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:20px;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:14px;">🔑 Alterar Senha</div>';
    h += fld('Senha Atual', 'pw-current', '', 'password');
    h += fld('Nova Senha', 'pw-new', '', 'password');
    h += fld('Confirmar Nova Senha', 'pw-confirm', '', 'password');
    h += '<div id="pw-msg" style="display:none;padding:8px 12px;border-radius:8px;font-size:.8rem;margin-bottom:10px;"></div>';
    h += '<button id="btn-change-pw" style="width:100%;padding:10px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.88rem;cursor:pointer;">🔑 Alterar Senha</button>';
    h += '</div>';

    h += '</div></div>'; // right col + grid

    // My bets history
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    h += '<div style="padding:14px 18px;border-bottom:1px solid #EEF0F6;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.9rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">📝 Histórico de Palpites</div>';

    var games = DB.getGames();
    var bettedGames = games.filter(function(g){ return bets[g.id]; })
      .sort(function(a,b){ return new Date(b.date).getTime()-new Date(a.date).getTime(); });

    if (bettedGames.length === 0) {
      h += '<div style="padding:32px;text-align:center;color:#9CA3BF;font-size:.85rem;">Você ainda não fez nenhum palpite.</div>';
    } else {
      h += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:500px;">';
      h += '<thead><tr style="background:#F8F9FC;border-bottom:1.5px solid #DDE1EE;">';
      h += '<th style="padding:9px 14px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:left;">Data</th>';
      h += '<th style="padding:9px 14px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:left;">Jogo</th>';
      h += '<th style="padding:9px 14px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:center;">Meu Palpite</th>';
      h += '<th style="padding:9px 14px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:center;">Resultado</th>';
      h += '<th style="padding:9px 14px;font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;text-align:right;">Pontos</th>';
      h += '</tr></thead><tbody>';

      bettedGames.forEach(function(g) {
        var bet = bets[g.id];
        var pts = null, scP = null;
        if (g.result) {
          scP = Scoring.calculate(bet, {home_score:g.result.home_score, away_score:g.result.away_score, phase:g.phase});
          pts = scP.total;
        }
        var exact = g.result && bet.home_score===g.result.home_score && bet.away_score===g.result.away_score;

        h += '<tr style="border-bottom:1px solid #EEF0F6;">';
        h += '<td style="padding:10px 14px;font-size:.78rem;color:#9CA3BF;white-space:nowrap;">'+Utils.formatDate(g.date)+'</td>';
        h += '<td style="padding:10px 14px;font-size:.85rem;font-weight:600;">'+flag(g.home)+' '+g.home+' × '+g.away+' '+flag(g.away)+'</td>';
        h += '<td style="padding:10px 14px;text-align:center;font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;color:#1B2B6B;">'+bet.home_score+' × '+bet.away_score+(exact?' 🎯':'')+'</td>';
        h += '<td style="padding:10px 14px;text-align:center;">';
        if (g.result) {
          h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;font-weight:800;color:#5A6385;">'+g.result.home_score+' × '+g.result.away_score+'</span>';
        } else {
          h += '<span style="font-size:.75rem;color:#9CA3BF;">Aguardando</span>';
        }
        h += '</td>';
        h += '<td style="padding:10px 14px;text-align:right;">';
        if (pts !== null) {
          var multP = scP ? (scP.multiplier||1) : 1;
          h += '<span title="'+(scP?Scoring.breakdownText(scP):'')+'" style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.1rem;font-weight:900;cursor:help;color:'+(pts>0?'#16A34A':'#DC2626')+'">'+(pts>0?'+'+pts:'0')+(pts>0&&multP>1?' <span style="font-family:inherit;font-size:.6rem;background:#7C3AED;color:white;padding:0 5px;border-radius:99px;vertical-align:middle;">🔥'+multP+'×</span>':'')+'</span>';
        } else {
          h += '<span style="font-size:.75rem;color:#9CA3BF;">—</span>';
        }
        h += '</td></tr>';
      });

      h += '</tbody></table></div>';
    }
    h += '</div>';

    pc.innerHTML = h;
    bindEvents(pc);
  }

  function fld(label, id, val, type) {
    return '<div style="margin-bottom:12px;"><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">'+label+'</label>'+
      '<input id="'+id+'" type="'+type+'" value="'+val+'" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;" /></div>';
  }

  function statBox(label, val, color) {
    return '<div style="background:#F8F9FC;border-radius:10px;padding:12px;text-align:center;">'+
      '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:3px;">'+label+'</div>'+
      '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.5rem;font-weight:900;color:'+color+';line-height:1;">'+val+'</div>'+
      '</div>';
  }

  function showMsg(msg, type) {
    var el = document.getElementById('pw-msg');
    if (!el) return;
    el.style.display = 'block';
    el.style.background = type==='success' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)';
    el.style.color = type==='success' ? '#16A34A' : '#DC2626';
    el.style.border = '1px solid ' + (type==='success' ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)');
    el.textContent = msg;
  }

  function bindEvents(pc) {
    // Save profile
    var saveBtn = document.getElementById('btn-save-profile');
    if (saveBtn) saveBtn.addEventListener('click', function() {
      var name = (document.getElementById('pf-name')||{}).value||'';
      var company = (document.getElementById('pf-company')||{}).value||'Porter';
      name = name.trim();
      if (!name) { Utils.toast('Nome não pode ser vazio','error'); return; }
      var initials = name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase();
      var updated = Object.assign({}, user, {name:name, company:company, initials:initials});
      localStorage.setItem('bolao_user', JSON.stringify(updated));
      Auth.user = updated;
      user = updated;
      // Update no Supabase (profiles, autenticado via JWT — RLS exige ser o dono)
      Sess.ensure().then(function(){
        fetch(SUPABASE_URL+'/rest/v1/profiles?id=eq.'+encodeURIComponent(user.id), {
          method: 'PATCH',
          headers: Sess.headers(),
          body: JSON.stringify({name:name, company:company, initials:initials})
        });
      });
      Utils.toast('Perfil atualizado! ✓','success');
      render();
    });

    // Change password (via Supabase Auth — a sessão JWT prova a identidade)
    var pwBtn = document.getElementById('btn-change-pw');
    if (pwBtn) pwBtn.addEventListener('click', async function() {
      var novo = (document.getElementById('pw-new')||{}).value||'';
      var confirm = (document.getElementById('pw-confirm')||{}).value||'';

      if (!novo || !confirm) { showMsg('Preencha a nova senha e a confirmação','error'); return; }
      if (novo.length < 6) { showMsg('A nova senha deve ter pelo menos 6 caracteres','error'); return; }
      if (novo !== confirm) { showMsg('A nova senha e a confirmação não coincidem','error'); return; }

      try {
        await Sess.ensure();
        var r = await fetch(SUPABASE_URL+'/auth/v1/user', {
          method: 'PUT', headers: Sess.headers(),
          body: JSON.stringify({password: novo})
        });
        var d = await r.json();
        if (r.ok) {
          var cur = document.getElementById('pw-current'); if (cur) cur.value='';
          document.getElementById('pw-new').value='';
          document.getElementById('pw-confirm').value='';
          showMsg('✅ Senha alterada com sucesso!','success');
          Utils.toast('Senha alterada! ✓','success');
        } else {
          showMsg(d.msg || d.error_description || 'Erro ao atualizar senha.','error');
        }
      } catch(e) { showMsg('Erro: '+e.message,'error'); }
    });
  }

  render();
})();


}};
