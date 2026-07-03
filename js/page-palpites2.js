SPA.pages["palpites"]={style:``,script:function(){

(function(){
  var DEADLINE = new Date('2026-06-11T15:00:00-03:00');
  var LOCKED = Date.now() > DEADLINE.getTime();
  var user = Auth.user;
  var userId = user.id || user.email;

  var ALL_TEAMS = ["Alemanha", "Argentina", "Argélia", "Arábia Saudita", "Austrália", "Brasil", "Bélgica", "Bósnia e Herzegovina", "Cabo Verde", "Canadá", "Catar", "Colômbia", "Costa do Marfim", "Croácia", "Curaçau", "Egito", "Equador", "Escócia", "Espanha", "Estados Unidos", "França", "Gana", "Haiti", "Holanda", "Inglaterra", "Iraque", "Irã", "Japão", "Jordânia", "Marrocos", "México", "Noruega", "Nova Zelândia", "Panamá", "Paraguai", "Portugal", "República da Coreia", "República Democrática do Congo", "República Tcheca", "Senegal", "Suécia", "Suíça", "Tunísia", "Turquia", "Uruguai", "Uzbequistão", "África do Sul", "Áustria"];

  var saved = DB.getUserSpecials(userId);
  var sel = {
    champion: saved.champion || '',
    runner_up: saved.runner_up || '',
    third: saved.third || '',
    qualified: (saved.qualified || []).slice()
  };

  // Resultado oficial (settings.final_results) — usado p/ mostrar acertos + pontos.
  var finalResults = DB.getFinalResults() || null;

  var pc = document.getElementById('pageContent');
  if (!pc) return;

  // ── Single event listener — added ONCE, never inside render ──────────────
  pc.addEventListener('click', function(e) {
    if (LOCKED) return;

    // Save button
    if (e.target.closest('[data-action="save"]')) {
      var saveBtn = e.target.closest('[data-action="save"]');
      saveBtn.textContent = '⏳ Salvando...';
      saveBtn.disabled = true;
      var data = { champion:sel.champion, runner_up:sel.runner_up, third:sel.third, qualified:sel.qualified };
      // Cache em memória (só o próprio); verdade vai pro Supabase
      var ls = DB.get('specials', {}) || {};
      ls[user.email] = data;
      DB.set('specials', ls);
      // Save Supabase async
      (async function(){
        try {
          var r = await fetch('https://ldygmzsqjoxlxtrdgstv.supabase.co/rest/v1/specials?on_conflict=user_email',{
            method:'POST',
            headers:Object.assign({},Sess.headers(),{'Prefer':'resolution=merge-duplicates,return=minimal'}),
            body:JSON.stringify({user_email:user.email,champion:data.champion||null,runner_up:data.runner_up||null,third:data.third||null,qualified:data.qualified||[]})
          });
          if(r.ok){ Utils.toast('Palpites salvos! ✓','success'); }
          else { var e=await r.text(); console.error('[SB] specials:',r.status,e); Utils.toast('Salvos localmente ✓','info'); }
        } catch(e){ console.error('[SB] specials net:',e); Utils.toast('Salvos localmente ✓','info'); }
        var b=document.querySelector('[data-action="save"]');
        if(b){b.textContent='💾 Salvar';b.disabled=false;}
      })();
      return;
    }

    // Pick podium (data-pick="field|team")
    var podBtn = e.target.closest('[data-pick]');
    if (podBtn) {
      var raw = podBtn.getAttribute('data-pick');
      var sep = raw.indexOf('|');
      var field = raw.substring(0, sep);
      var team  = raw.substring(sep + 1);
      if (sel[field] === team) {
        sel[field] = '';
      } else {
        if (sel.champion  === team) sel.champion  = '';
        if (sel.runner_up === team) sel.runner_up = '';
        if (sel.third     === team) sel.third     = '';
        sel[field] = team;
      }
      render(); return;
    }

    // Remove qualified chip
    var chip = e.target.closest('[data-remove]');
    if (chip) {
      var t = chip.getAttribute('data-remove');
      sel.qualified = sel.qualified.filter(function(x){ return x !== t; });
      updateQualGrid(); return;
    }

    // Toggle qualified
    var qBtn = e.target.closest('[data-qualify]');
    if (qBtn) {
      var t = qBtn.getAttribute('data-qualify');
      var idx = sel.qualified.indexOf(t);
      if (idx >= 0) {
        sel.qualified.splice(idx, 1);
        qBtn.style.background = 'white';
        qBtn.style.border = '1px solid #DDE1EE';
      } else {
        if (sel.qualified.length >= 16) { Utils.toast('Máximo 16 seleções!','error'); return; }
        sel.qualified.push(t);
        qBtn.style.background = 'rgba(27,43,107,.1)';
        qBtn.style.border = '2px solid #1B2B6B';
      }
      var counter = document.getElementById('qual-count');
      if (counter) {
        counter.textContent = sel.qualified.length + '/16';
        counter.style.background = sel.qualified.length === 16 ? '#22C55E' : 'rgba(255,255,255,.2)';
      }
      updateChips(); return;
    }
  });

  // ── Full render (called on init and after podium picks) ──────────────────
  function render() {
    var days = Math.ceil((DEADLINE.getTime() - Date.now()) / 86400000);

    var h = '';

    // Header
    h += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:22px;">';
    h += '<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.8rem;font-weight:900;text-transform:uppercase;color:#1B2B6B;">🎯 Palpites Especiais</div>';
    h += '<div style="font-size:.82rem;color:#5A6385;">Bônus de pontuação — fecha 11/06/2026 às 15h</div></div>';
    if (!LOCKED) {
      h += '<div style="display:flex;align-items:center;gap:10px;">';
      h += '<div style="text-align:center;padding:8px 14px;background:rgba(245,197,24,.15);border-radius:10px;">';
      h += '<div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:#92400E;">Fecha em</div>';
      h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.4rem;font-weight:900;color:#92400E;">'+days+' dias</div></div>';
      h += '<button data-action="save" style="padding:11px 22px;background:#1B2B6B;color:white;border:none;border-radius:10px;font-weight:700;font-size:.9rem;cursor:pointer;">💾 Salvar</button>';
      h += '</div>';
    } else {
      h += '<span style="padding:8px 16px;background:rgba(239,68,68,.1);color:#DC2626;border-radius:99px;font-size:.8rem;font-weight:700;">🔒 Encerrado em 10/06</span>';
    }
    h += '</div>';

    // Acertos + pontuação (quando o resultado oficial já foi publicado)
    h += specialsResultsCard();

    // Podium cards
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:22px;">';
    h += podiumCard('champion','🏆','Campeão','+50 pts','#FFD700','#FFA500','rgba(0,0,0,.65)');
    h += podiumCard('runner_up','🥈','Vice-Campeão','+25 pts','#E0E0E0','#BDBDBD','rgba(0,0,0,.6)');
    h += podiumCard('third','🥉','3º Lugar','+15 pts','#CD9B6B','#A0522D','white');
    h += '</div>';

    // Qualified section
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;" id="qual-section">';
    h += qualifiedSection();
    h += '</div>';

    pc.innerHTML = h;
  }

  // ── Card de acertos + pontuação dos especiais ────────────────────────────
  function specialsResultsCard() {
    var fr = finalResults;
    if (!fr) return '';
    var hasPodium = !!(fr.champion || fr.runner_up || fr.third);
    var frQual = fr.qualified || [];
    // Nada publicado ainda → não mostra o card.
    if (!hasPodium && !frQual.length) return '';

    var qualHits = sel.qualified.filter(function(t){ return frQual.indexOf(t) >= 0; });
    var champOk  = fr.champion  && sel.champion  === fr.champion;
    var viceOk   = fr.runner_up && sel.runner_up === fr.runner_up;
    var thirdOk  = fr.third     && sel.third     === fr.third;
    var total = (champOk?50:0) + (viceOk?25:0) + (thirdOk?15:0) + qualHits.length*5;

    function podiumRow(icon, label, pick, official, ok, pts) {
      var showResult = !!official;
      var bg = ok ? 'rgba(34,197,94,.08)' : (showResult ? 'rgba(239,68,68,.05)' : '#F8F9FC');
      var h = '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:'+bg+';border-radius:10px;">';
      h += '<span style="font-size:1.3rem;">'+icon+'</span>';
      h += '<div style="flex:1;min-width:0;">';
      h += '<div style="font-size:.6rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;">'+label+'</div>';
      h += '<div style="font-size:.82rem;font-weight:700;color:#2D3557;">'+(pick?(flag(pick)+' '+esc(pick)):'<span style="color:#C0C5D6;">— sem palpite</span>')+'</div>';
      if (showResult && !ok) h += '<div style="font-size:.66rem;color:#9CA3BF;">Oficial: '+flag(official)+' '+esc(official)+'</div>';
      h += '</div>';
      if (ok) h += '<span style="background:rgba(34,197,94,.15);color:#16A34A;padding:3px 10px;border-radius:99px;font-weight:800;font-size:.72rem;white-space:nowrap;">✓ +'+pts+'</span>';
      else if (showResult) h += '<span style="color:#C0C5D6;font-size:.9rem;">✕</span>';
      h += '</div>';
      return h;
    }

    var h = '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;margin-bottom:22px;">';
    // Header com total
    h += '<div style="background:linear-gradient(135deg,#16A34A,#15803D);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;color:white;">';
    h += '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:1.4rem;">🎉</span>';
    h += '<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.95rem;font-weight:800;text-transform:uppercase;">Seus Acertos</div>';
    h += '<div style="font-size:.68rem;opacity:.85;">Pontos dos palpites especiais</div></div></div>';
    h += '<div style="text-align:right;"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2rem;font-weight:900;line-height:1;">+'+total+'</div><div style="font-size:.62rem;opacity:.85;text-transform:uppercase;font-weight:700;">pontos</div></div>';
    h += '</div>';
    h += '<div style="padding:14px 18px;">';

    if (hasPodium) {
      h += '<div style="display:grid;gap:8px;margin-bottom:12px;">';
      h += podiumRow('🏆','Campeão',    sel.champion,  fr.champion,  champOk, 50);
      h += podiumRow('🥈','Vice',       sel.runner_up, fr.runner_up, viceOk,  25);
      h += podiumRow('🥉','3º Lugar',   sel.third,     fr.third,     thirdOk, 15);
      h += '</div>';
    }

    // Classificados acertados
    h += '<div style="background:#F8F9FC;border-radius:10px;padding:12px;">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
    h += '<span style="font-size:.68rem;font-weight:800;text-transform:uppercase;color:#1B2B6B;">⚡ Classificados acertados</span>';
    h += '<span style="background:'+(qualHits.length?'rgba(34,197,94,.15)':'#EEF0F6')+';color:'+(qualHits.length?'#16A34A':'#9CA3BF')+';padding:3px 10px;border-radius:99px;font-weight:800;font-size:.72rem;">'+qualHits.length+' ✓ · +'+(qualHits.length*5)+'</span>';
    h += '</div>';
    if (qualHits.length) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:5px;">';
      qualHits.slice().sort(function(a,b){return a.localeCompare(b,'pt');}).forEach(function(t){
        h += '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:99px;padding:3px 9px;font-size:.75rem;font-weight:600;color:#15803D;">'+flag(t)+' '+esc(t)+'</span>';
      });
      h += '</div>';
    } else {
      h += '<div style="font-size:.75rem;color:#9CA3BF;">Nenhum classificado acertado ainda.</div>';
    }
    h += '</div>';

    h += '</div></div>';
    return h;
  }

  // ── Update only the qualified section (no full re-render) ────────────────
  function updateQualGrid() {
    var sec = document.getElementById('qual-section');
    if (sec) sec.innerHTML = qualifiedSection();
  }

  function updateChips() {
    var chipsEl = document.getElementById('qual-chips');
    if (!chipsEl) return;
    chipsEl.innerHTML = chipsHtml();
  }

  // ── Podium card builder ───────────────────────────────────────────────────
  function podiumCard(field, icon, title, pts, c1, c2, textColor) {
    var current = sel[field];
    // Teams not already used in other fields
    var blocked = [];
    ['champion','runner_up','third'].forEach(function(f){ if (f!==field && sel[f]) blocked.push(sel[f]); });
    var available = ALL_TEAMS.filter(function(t){ return blocked.indexOf(t) < 0 || t === current; }).sort(function(a,b){ return a.localeCompare(b,'pt'); });

    var h = '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    // Header
    h += '<div style="background:linear-gradient(135deg,'+c1+','+c2+');padding:13px 16px;display:flex;align-items:center;gap:10px;">';
    h += '<span style="font-size:1.8rem;">'+icon+'</span>';
    h += '<div style="flex:1"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.9rem;font-weight:800;text-transform:uppercase;color:'+textColor+'">'+title+'</div></div>';
    h += '<span style="background:rgba(0,0,0,.15);color:'+textColor+';padding:3px 10px;border-radius:99px;font-size:.72rem;font-weight:800;">'+pts+'</span>';
    h += '</div>';
    h += '<div style="padding:12px;">';

    // Current selection display
    if (current) {
      // Acerto do pódio (quando o oficial já saiu): verde=acertou, vermelho=errou.
      var official = finalResults ? finalResults[field] : null;
      var pStatus = official ? (current === official ? 'hit' : 'miss') : null;
      var selBg = pStatus==='hit' ? 'rgba(34,197,94,.12)' : (pStatus==='miss' ? 'rgba(239,68,68,.1)' : 'rgba(27,43,107,.05)');
      h += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:'+selBg+';border-radius:10px;margin-bottom:10px;'+(pStatus?'border:1.5px solid '+(pStatus==='hit'?'#16A34A':'#DC2626')+';':'')+'">';
      h += teamFlag(current, '2.2rem');
      h += '<div style="flex:1;"><div style="font-size:.62rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;">Selecionado</div>';
      h += '<div style="font-weight:800;color:#1B2B6B;">'+current+(pStatus==='hit'?' <span style="color:#16A34A;">✓ +'+pts.replace(/[^0-9]/g,'')+'</span>':'')+(pStatus==='miss'?' <span style="color:#DC2626;">✗</span>':'')+'</div>';
      if (pStatus==='miss') h += '<div style="font-size:.64rem;color:#9CA3BF;">Oficial: '+flag(official)+' '+esc(official)+'</div>';
      h += '</div>';
      if (!LOCKED) h += '<button data-pick="'+field+'|'+current+'" style="background:none;border:none;cursor:pointer;font-size:.72rem;color:#9CA3BF;padding:4px;">✕ trocar</button>';
      h += '</div>';
    } else if (!LOCKED) {
      h += '<div style="font-size:.8rem;color:#9CA3BF;margin-bottom:10px;">Toque em uma seleção para escolher:</div>';
    }

    // Team grid (only when not locked, or showing current)
    if (!LOCKED) {
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(75px,1fr));gap:4px;max-height:200px;overflow-y:auto;">';
      available.forEach(function(t) {
        var isSel = current === t;
        h += '<button data-pick="'+field+'|'+t+'" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 3px;';
        h += 'background:'+(isSel?'rgba(27,43,107,.1)':'white')+';';
        h += 'border:'+(isSel?'2px solid #1B2B6B':'1px solid #DDE1EE')+';';
        h += 'border-radius:8px;cursor:pointer;font-family:inherit;">';
        h += teamFlag(t, '1.6rem');
        h += '<span style="font-size:.58rem;font-weight:700;text-align:center;color:#2D3557;line-height:1.2;">'+t+'</span>';
        h += '</button>';
      });
      h += '</div>';
    }
    h += '</div></div>';
    return h;
  }

  // Resultado oficial dos classificados já publicado?
  function qualPublished() {
    return !!(finalResults && finalResults.qualified && finalResults.qualified.length);
  }
  // Estado de um time na grade de classificados (só após publicação):
  // 'hit'  = escolhido e classificou (acertou)
  // 'miss' = escolhido e NÃO classificou (errou)
  // 'gap'  = classificou mas você NÃO escolheu (deixou passar)
  function qualCellStatus(t) {
    if (!qualPublished()) return null;
    var picked = sel.qualified.indexOf(t) >= 0;
    var classified = finalResults.qualified.indexOf(t) >= 0;
    if (picked && classified) return 'hit';
    if (picked && !classified) return 'miss';
    if (!picked && classified) return 'gap';
    return null;
  }

  // ── Qualified section ─────────────────────────────────────────────────────
  function qualifiedSection() {
    var h = '';
    h += '<div style="background:#1B2B6B;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">';
    h += '<div style="display:flex;align-items:center;gap:10px;color:white;">';
    h += '<span style="font-size:1.4rem;">⚡</span>';
    h += '<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:.95rem;font-weight:800;text-transform:uppercase;">Classificados para as Oitavas</div>';
    h += '<div style="font-size:.68rem;opacity:.7;">+5 pts por seleção correta · máx. 16 times</div></div></div>';
    h += '<span id="qual-count" style="background:'+(sel.qualified.length===16?'#22C55E':'rgba(255,255,255,.2)')+';color:white;padding:5px 14px;border-radius:99px;font-weight:800;font-size:.88rem;">'+sel.qualified.length+'/16</span>';
    h += '</div>';
    h += '<div style="padding:14px 18px;">';
    h += '<div id="qual-chips">'+chipsHtml()+'</div>';
    // Legenda (só quando o resultado já saiu)
    if (qualPublished()) {
      h += '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:10px;font-size:.66rem;font-weight:600;color:#5A6385;">';
      h += '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:11px;height:11px;border-radius:3px;background:rgba(34,197,94,.2);border:2px solid #16A34A;"></span> acertou (+5)</span>';
      h += '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:11px;height:11px;border-radius:3px;background:rgba(239,68,68,.15);border:2px solid #DC2626;"></span> errou</span>';
      h += '<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:11px;height:11px;border-radius:3px;background:white;border:2px dashed #16A34A;"></span> classificou (não escolheu)</span>';
      h += '</div>';
    }
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:5px;">';
    ALL_TEAMS.slice().sort(function(a,b){return a.localeCompare(b,'pt');}).forEach(function(t) {
      var isSel = sel.qualified.indexOf(t) >= 0;
      var st = qualCellStatus(t);
      var bg, border, badge = '';
      if (st === 'hit')      { bg='rgba(34,197,94,.15)'; border='2px solid #16A34A'; badge='<span style="position:absolute;top:2px;right:3px;font-size:.7rem;color:#16A34A;font-weight:900;">✓</span>'; }
      else if (st === 'miss'){ bg='rgba(239,68,68,.12)'; border='2px solid #DC2626'; badge='<span style="position:absolute;top:2px;right:3px;font-size:.7rem;color:#DC2626;font-weight:900;">✗</span>'; }
      else if (st === 'gap') { bg='white'; border='2px dashed #16A34A'; }
      else                   { bg=(isSel?'rgba(27,43,107,.1)':'white'); border=(isSel?'2px solid #1B2B6B':'1px solid #DDE1EE'); }
      h += '<button data-qualify="'+t+'" style="position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 3px;';
      h += 'background:'+bg+';';
      h += 'border:'+border+';';
      h += 'border-radius:8px;cursor:'+(LOCKED?'default':'pointer')+';font-family:inherit;">';
      h += badge;
      h += teamFlag(t, '1.6rem');
      h += '<span style="font-size:.58rem;font-weight:700;text-align:center;color:#2D3557;line-height:1.2;">'+t+'</span>';
      h += '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function chipsHtml() {
    if (!sel.qualified.length) return '';
    var h = '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;">';
    sel.qualified.forEach(function(t) {
      var st = qualCellStatus(t); // 'hit' | 'miss' | null
      var bg = st==='hit' ? 'rgba(34,197,94,.12)' : (st==='miss' ? 'rgba(239,68,68,.1)' : 'rgba(27,43,107,.08)');
      var bd = st==='hit' ? 'rgba(34,197,94,.4)'  : (st==='miss' ? 'rgba(239,68,68,.35)' : 'rgba(27,43,107,.2)');
      var mark = st==='hit' ? ' <span style="color:#16A34A;font-weight:900;">✓</span>' : (st==='miss' ? ' <span style="color:#DC2626;font-weight:900;">✗</span>' : '');
      h += '<span data-remove="'+t+'" style="display:inline-flex;align-items:center;gap:4px;background:'+bg+';border:1px solid '+bd+';border-radius:99px;padding:3px 9px;font-size:.75rem;font-weight:600;cursor:'+(LOCKED?'default':'pointer')+';">';
      h += flag(t)+' '+t+mark;
      if (!LOCKED) h += ' <span style="opacity:.5;font-size:.7rem;">✕</span>';
      h += '</span>';
    });
    h += '</div>';
    return h;
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  // Sync specials from Supabase before rendering
  (async function() {
    // Resultado oficial (settings.final_results) — fresco do servidor p/ os acertos.
    try {
      var frRes = await fetch(SUPABASE_URL + '/rest/v1/settings?key=eq.final_results&select=value&limit=1', {
        headers: Sess.headers(false)
      });
      if (frRes.ok) {
        var frData = await frRes.json();
        if (frData && frData.length && frData[0].value) {
          finalResults = frData[0].value;
          DB.set('final_results', finalResults); // cache local (sem re-upsert no servidor)
        }
      }
    } catch(e) {}

    // Load directly from Supabase
    try {
      var sbRes = await fetch(SUPABASE_URL + '/rest/v1/specials?user_email=eq.' + encodeURIComponent(user.email) + '&select=*&limit=1', {
        headers: Sess.headers(false)
      });
      if (sbRes.ok) {
        var sbData = await sbRes.json();
        if (sbData && sbData.length > 0) {
          var saved = sbData[0];
          sel.champion  = saved.champion  || '';
          sel.runner_up = saved.runner_up || '';
          sel.third     = saved.third     || '';
          sel.qualified = saved.qualified || [];
          // Cache em memória
          var s = DB.get('specials', {}) || {};
          s[user.email] = {champion: sel.champion, runner_up: sel.runner_up, third: sel.third, qualified: sel.qualified};
          DB.set('specials', s);
        }
      }
    } catch(e) {
      // Fallback ao cache em memória
      var localSaved = DB.get('specials', {}) || {};
      var myLocal = localSaved[user.email] || {};
      if (myLocal.champion)  sel.champion  = myLocal.champion;
      if (myLocal.runner_up) sel.runner_up = myLocal.runner_up;
      if (myLocal.third)     sel.third     = myLocal.third;
      if (myLocal.qualified && myLocal.qualified.length) sel.qualified = myLocal.qualified.slice();
    }
    render();
  })();
})();


}};
