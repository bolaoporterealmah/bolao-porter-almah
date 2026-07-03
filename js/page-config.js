SPA.pages["config"]={style:`.config-section{margin-bottom:28px}.config-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}.user-card{background:white;border-radius:var(--radius-lg);border:1px solid var(--porter-gray-200);padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow-sm)}.user-card .u-info{flex:1}.user-card .u-name{font-weight:700;font-size:.88rem}.user-card .u-email{font-size:.7rem;color:var(--porter-gray-400)}.role-pill{padding:3px 8px;border-radius:99px;font-size:.65rem;font-weight:800;text-transform:uppercase}.role-pill.admin{background:rgba(27,43,107,.1);color:var(--porter-blue)}.role-pill.participant{background:rgba(34,197,94,.1);color:#16A34A}.mult-row{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--porter-gray-100)}.mult-row:last-child{border-bottom:none}`,script:function(){

function render() {
  var user = Auth.user;
  var users = DB.getUsers();
  var isAdmin = Auth.isAdmin();
  var pc = document.getElementById('pageContent');
  if (!pc) return;

  var h = '';

  // My profile
  h += '<div style="margin-bottom:24px;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;font-weight:800;text-transform:uppercase;color:#1B2B6B;margin-bottom:12px;letter-spacing:.5px;">👤 Meu Perfil</div>';
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:20px;max-width:460px;">';
  h += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">';
  h += '<div style="width:56px;height:56px;border-radius:50%;background:#1B2B6B;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:1.1rem;">'+user.initials+'</div>';
  h += '<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;text-transform:uppercase;">' + esc(user.name) + '</div>';
  h += '<div style="font-size:.78rem;color:#9CA3BF;">' + user.email + '</div>';
  h += '<span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:99px;font-size:.65rem;font-weight:800;background:' + (user.role==='admin'?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)') + ';color:' + (user.role==='admin'?'#DC2626':'#16A34A') + ';">' + (user.role==='admin'?'Administrador':'Participante') + '</span>';
  h += '</div></div>';
  h += '<div style="display:flex;flex-direction:column;gap:12px;">';
  h += '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Nome</label><input class="form-input" id="cfgName" value="' + esc(user.name).replace(/"/g,'&quot;') + '" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;"/></div>';
  h += '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Empresa</label><select id="cfgCompany" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;background:white;"><option' + (esc(user.company)==='Porter'?' selected':'') + '>Porter</option><option' + (esc(user.company)==='Almah'?' selected':'') + '>Almah</option></select></div>';
  h += '<button id="btn-save-profile" style="padding:9px 20px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.88rem;cursor:pointer;align-self:flex-start;">💾 Salvar Perfil</button>';
  h += '</div></div></div>';

  if (isAdmin) {
    // Users section
    h += '<div style="margin-bottom:24px;">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;font-weight:800;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;">👥 Participantes (' + users.length + ')</div>';
    h += '<div style="display:flex;gap:8px;">';
    h += '<button id="btn-import-excel" style="padding:7px 14px;background:white;border:1.5px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.82rem;cursor:pointer;color:#5A6385;">📥 Importar Excel</button>';
    h += '<button id="btn-new-user" style="padding:7px 14px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.82rem;cursor:pointer;">+ Cadastrar</button>';
    h += '</div></div>';

    // Excel template download
    h += '<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:12px 16px;margin-bottom:12px;font-size:.8rem;color:#16A34A;">';
    h += '📋 <strong>Template Excel:</strong> Colunas necessárias: <strong>nome | email | empresa | senha</strong>';
    h += ' &nbsp;·&nbsp; <button id="btn-download-template" style="background:none;border:none;cursor:pointer;color:#16A34A;font-weight:700;font-size:.8rem;text-decoration:underline;">Baixar template .csv</button>';
    h += '</div>';

    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;overflow:hidden;">';
    users.forEach(function(u, i) {
      h += '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;' + (i<users.length-1?'border-bottom:1px solid #EEF0F6;':'') + '">';
      h += '<div style="width:36px;height:36px;border-radius:50%;background:#3D5AC8;display:flex;align-items:center;justify-content:center;font-weight:700;color:white;font-size:.82rem;flex-shrink:0;">' + u.initials + '</div>';
      h += '<div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:.88rem;">' + esc(u.name) + '</div><div style="font-size:.7rem;color:#9CA3BF;">' + esc(u.email) + '</div></div>';
      h += '<span style="padding:2px 8px;border-radius:99px;font-size:.65rem;font-weight:800;background:' + (u.company==='Porter'?'rgba(27,43,107,.08)':'rgba(245,197,24,.15)') + ';color:' + (u.company==='Porter'?'#1B2B6B':'#92400E') + ';">' + esc(u.company) + '</span>';
      h += '<span style="padding:2px 8px;border-radius:99px;font-size:.65rem;font-weight:800;background:' + (u.role==='admin'?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)') + ';color:' + (u.role==='admin'?'#DC2626':'#16A34A') + ';">' + u.role + '</span>';
      h += '<button data-toggleadmin="' + u.id + '" style="padding:4px 8px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:6px;font-size:.7rem;cursor:pointer;" title="' + (u.role==='admin'?'Remover admin':'Tornar admin') + '">' + (u.role==='admin'?'👑':'⬆️') + '</button>';
      h += '<button data-deleteuser="' + u.id + '" style="padding:4px 8px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:6px;font-size:.7rem;cursor:pointer;color:#DC2626;">🗑️</button>';
      h += '</div>';
    });
    h += '</div></div>';

    // Scoring config
    h += '<div style="margin-bottom:24px;">';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;font-weight:800;text-transform:uppercase;color:#1B2B6B;margin-bottom:12px;letter-spacing:.5px;">⚙️ Configurações do Bolão</div>';
    h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;padding:18px;max-width:460px;">';
    h += '<div style="margin-bottom:14px;"><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Resultado Final — Campeão</label><input id="frChampion" list="teamsList" placeholder="Ex: Brasil" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;"/></div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">';
    h += '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Vice-Campeão</label><input id="frVice" list="teamsList" placeholder="Ex: França" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;"/></div>';
    h += '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">3º Lugar</label><input id="frThird" list="teamsList" placeholder="Ex: Espanha" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;"/></div>';
    h += '</div>';
    h += '<datalist id="teamsList"><option>Brasil</option><option>Argentina</option><option>França</option><option>Inglaterra</option><option>Espanha</option><option>Alemanha</option><option>Portugal</option><option>Holanda</option><option>Bélgica</option><option>Uruguai</option></datalist>';
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    h += '<button id="btn-save-config" style="padding:9px 18px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.88rem;cursor:pointer;">💾 Salvar</button>';
    h += '<button id="btn-reset-data" style="padding:9px 18px;background:white;border:1.5px solid rgba(239,68,68,.3);border-radius:9px;font-weight:600;font-size:.88rem;cursor:pointer;color:#DC2626;">🗑️ Resetar Dados Demo</button>';
    h += '</div></div></div>';
  }

  // Logout
  h += '<button data-action="logout" style="padding:9px 20px;background:white;border:1.5px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.88rem;cursor:pointer;color:#5A6385;">🚪 Sair da conta</button>';

  pc.innerHTML = h;
  bindEvents(pc);
}

function bindEvents(pc) {
  // Save profile
  var saveProfile = document.getElementById('btn-save-profile');
  if (saveProfile) saveProfile.addEventListener('click', function() {
    var name = (document.getElementById('cfgName')||{}).value||'';
    var company = (document.getElementById('cfgCompany')||{}).value||'Porter';
    name = name.trim();
    if (!name) { Utils.toast('Nome não pode ser vazio','error'); return; }
    var initials = name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase();
    var u = Object.assign({}, Auth.user, {name:name, company:company, initials:initials});
    localStorage.setItem('bolao_user', JSON.stringify(u));
    Auth.user = u;
    Utils.toast('Perfil atualizado! ✓','success');
    render();
  });

  // New user
  var newUser = document.getElementById('btn-new-user');
  if (newUser) newUser.addEventListener('click', openNewUserModal);

  // Import Excel
  var importBtn = document.getElementById('btn-import-excel');
  if (importBtn) importBtn.addEventListener('click', openImportModal);

  // Download template
  var tplBtn = document.getElementById('btn-download-template');
  if (tplBtn) tplBtn.addEventListener('click', downloadTemplate);

  // Save config
  var saveConfig = document.getElementById('btn-save-config');
  if (saveConfig) saveConfig.addEventListener('click', function() {
    var champ = (document.getElementById('frChampion')||{}).value||'';
    var vice = (document.getElementById('frVice')||{}).value||'';
    var third = (document.getElementById('frThird')||{}).value||'';
    if (!champ) { Utils.toast('Informe ao menos o campeão','error'); return; }
    // Mescla p/ não apagar os classificados (qualified) já salvos.
    var merged = Object.assign({}, DB.getFinalResults() || {}, {champion:champ, runner_up:vice, third:third});
    DB.saveFinalResults(merged);
    Utils.toast('Resultados finais salvos! ✓','success');
  });

  // Reset data
  var resetBtn = document.getElementById('btn-reset-data');
  if (resetBtn) resetBtn.addEventListener('click', function() {
    if (!confirm('Limpar TODOS os dados de demonstração?')) return;
    ['games','bets','users','specials','final_results','ranking'].forEach(function(k){ DB.set(k, undefined); });
    Utils.toast('Cache limpo! Recarregando do Supabase...','info');
    setTimeout(function(){ SPA.navigate('login'); }, 1200);
  });

  // Logout
  var logoutBtn = pc.querySelector('[data-action="logout"]');
  if (logoutBtn) logoutBtn.addEventListener('click', function(){ SPA.logout(); });

  // Toggle admin / delete user
  pc.addEventListener('click', function(e) {
    var ta = e.target.closest('[data-toggleadmin]');
    if (ta) {
      var users = DB.getUsers(), id = ta.getAttribute('data-toggleadmin');
      var u = users.find(function(x){return x.id===id;});
      if (u) { u.role = u.role==='admin'?'participant':'admin'; DB.saveUsers(users); Utils.toast(u.name+(u.role==='admin'?' agora é admin':' removido de admin'),'success'); render(); }
      return;
    }
    var du = e.target.closest('[data-deleteuser]');
    if (du) {
      if (!confirm('Remover participante?')) return;
      DB.saveUsers(DB.getUsers().filter(function(u){return u.id!==du.getAttribute('data-deleteuser');}));
      Utils.toast('Removido','info'); render();
    }
  });
}

function openNewUserModal() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  var box = document.createElement('div');
  box.style.cssText = 'background:white;border-radius:16px;width:100%;max-width:420px;box-shadow:0 20px 50px rgba(0,0,0,.25);overflow:hidden;';
  box.innerHTML =
    '<div style="padding:18px 22px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">' +
    '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.1rem;text-transform:uppercase;color:#1B2B6B;">Cadastrar Participante</div>' +
    '<button id="modal-close" style="background:#EEF0F6;border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:1rem;">✕</button>' +
    '</div>' +
    '<div style="padding:18px 22px;display:flex;flex-direction:column;gap:12px;">' +
    '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Nome Completo *</label><input id="nu-name" type="text" placeholder="Nome Sobrenome" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;"/></div>' +
    '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">E-mail *</label><input id="nu-email" type="email" placeholder="email@empresa.com.br" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;"/></div>' +
    '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Senha Inicial</label><input id="nu-pass" type="text" value="123456" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;"/></div>' +
    '<div><label style="display:block;font-size:.72rem;font-weight:700;text-transform:uppercase;color:#9CA3BF;margin-bottom:4px;">Empresa</label><select id="nu-company" style="width:100%;padding:9px 12px;border:1.5px solid #DDE1EE;border-radius:9px;font-size:.88rem;outline:none;background:white;"><option>Porter</option><option>Almah</option></select></div>' +
    '</div>' +
    '<div style="padding:14px 22px 18px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #EEF0F6;">' +
    '<button id="modal-cancel" style="padding:9px 18px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.85rem;cursor:pointer;">Cancelar</button>' +
    '<button id="modal-save" style="padding:9px 18px;background:#1B2B6B;color:white;border:none;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;">Cadastrar</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function closeModal() { overlay.remove(); }

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) closeModal(); });

  document.getElementById('modal-save').addEventListener('click', async function() {
    var name = document.getElementById('nu-name').value.trim();
    var email = document.getElementById('nu-email').value.trim().toLowerCase();
    var pass = document.getElementById('nu-pass').value.trim() || '123456';
    var company = document.getElementById('nu-company').value;
    if (!name || !email) { Utils.toast('Nome e e-mail obrigatórios','error'); return; }
    if (pass.length < 6) { Utils.toast('Senha inicial precisa de 6+ caracteres','error'); return; }
    var initials = name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase();
    var saveBtn = document.getElementById('modal-save'); saveBtn.disabled=true; saveBtn.textContent='Cadastrando...';
    try {
      await sbCreateUser(email, pass, {name:name, company:company, role:'participant', initials:initials});
      Utils.toast(name+' cadastrado(a)! ✓','success');
      closeModal();
      if (window.syncProfilesFromSupabase) await syncProfilesFromSupabase();
      render();
    } catch(e) {
      saveBtn.disabled=false; saveBtn.textContent='Cadastrar';
      Utils.toast(/registered|already|exists/i.test(e.message)?'E-mail já cadastrado':('Erro: '+e.message),'error');
    }
  });
}

function openImportModal() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  var box = document.createElement('div');
  box.style.cssText = 'background:white;border-radius:16px;width:100%;max-width:500px;box-shadow:0 20px 50px rgba(0,0,0,.25);overflow:hidden;';
  box.innerHTML =
    '<div style="padding:18px 22px;border-bottom:1px solid #EEF0F6;display:flex;align-items:center;justify-content:space-between;">' +
    '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1.1rem;text-transform:uppercase;color:#1B2B6B;">📥 Importar Participantes</div>' +
    '<button id="imp-close" style="background:#EEF0F6;border:none;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:1rem;">✕</button>' +
    '</div>' +
    '<div style="padding:18px 22px;">' +
    '<div style="background:#F8F9FC;border-radius:10px;padding:14px;margin-bottom:14px;font-size:.82rem;color:#5A6385;">' +
    '<strong style="color:#2D3557;">Formato do arquivo:</strong> CSV ou Excel (.xlsx)<br/>' +
    '<div style="margin-top:8px;font-family:monospace;background:white;padding:8px;border-radius:6px;border:1px solid #DDE1EE;font-size:.78rem;">' +
    'nome,email,empresa,senha<br/>' +
    'João Silva,joao@porter.com.br,Porter,123456<br/>' +
    'Ana Costa,ana@almah.com.br,Almah,123456' +
    '</div>' +
    '<button id="btn-dl-tpl" style="margin-top:8px;background:none;border:none;cursor:pointer;color:#16A34A;font-weight:700;font-size:.78rem;text-decoration:underline;">⬇ Baixar template CSV</button>' +
    '</div>' +
    '<div style="border:2px dashed #DDE1EE;border-radius:10px;padding:24px;text-align:center;cursor:pointer;" id="drop-zone">' +
    '<div style="font-size:2rem;margin-bottom:8px;">📂</div>' +
    '<div style="font-weight:700;color:#2D3557;margin-bottom:4px;">Clique para selecionar ou arraste o arquivo</div>' +
    '<div style="font-size:.78rem;color:#9CA3BF;">.csv ou .xlsx — máx. 500 participantes</div>' +
    '<input id="file-input" type="file" accept=".csv,.xlsx" style="display:none;"/>' +
    '</div>' +
    '<div id="import-preview" style="margin-top:12px;"></div>' +
    '</div>' +
    '<div style="padding:14px 22px 18px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #EEF0F6;">' +
    '<button id="imp-cancel" style="padding:9px 18px;background:#EEF0F6;border:1px solid #DDE1EE;border-radius:9px;font-weight:600;font-size:.85rem;cursor:pointer;">Cancelar</button>' +
    '<button id="imp-confirm" style="padding:9px 18px;background:#16A34A;color:white;border:none;border-radius:9px;font-weight:700;font-size:.85rem;cursor:pointer;display:none;">✅ Importar</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  var parsedUsers = [];

  function closeModal() { overlay.remove(); }
  document.getElementById('imp-close').addEventListener('click', closeModal);
  document.getElementById('imp-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) closeModal(); });

  document.getElementById('btn-dl-tpl').addEventListener('click', downloadTemplate);

  var dropZone = document.getElementById('drop-zone');
  var fileInput = document.getElementById('file-input');

  dropZone.addEventListener('click', function(){ fileInput.click(); });
  dropZone.addEventListener('dragover', function(e){ e.preventDefault(); dropZone.style.background='#EEF0F6'; });
  dropZone.addEventListener('dragleave', function(){ dropZone.style.background=''; });
  dropZone.addEventListener('drop', function(e){ e.preventDefault(); dropZone.style.background=''; processFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', function(){ if(fileInput.files[0]) processFile(fileInput.files[0]); });

  function processFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      var lines = text.split('\n').map(function(l){return l.trim();}).filter(Boolean);
      // Skip header if it contains 'nome' or 'name'
      if (lines[0] && (lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('name'))) lines.shift();
      parsedUsers = [];
      var errors = [];
      lines.forEach(function(line, i) {
        var cols = line.split(',').map(function(c){ return c.trim().replace(/^"|"$/g,''); });
        var name=cols[0], email=cols[1], company=cols[2]||'Porter', pass=cols[3]||'123456';
        if (!name || !email || !email.includes('@')) { errors.push('Linha '+(i+2)+': dados inválidos'); return; }
        var initials = name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase();
        parsedUsers.push({id:'u_'+Date.now()+'_'+i, name:name, email:email.toLowerCase(), company:company, role:'participant', initials:initials, password:pass});
      });

      var preview = document.getElementById('import-preview');
      if (parsedUsers.length === 0) {
        preview.innerHTML = '<div style="color:#DC2626;font-size:.82rem;">❌ Nenhum participante válido encontrado</div>';
        return;
      }
      var ph = '<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:.82rem;color:#16A34A;font-weight:700;">✅ ' + parsedUsers.length + ' participante(s) encontrado(s)</div>';
      ph += '<div style="max-height:150px;overflow-y:auto;font-size:.8rem;">';
      parsedUsers.slice(0,5).forEach(function(u){ ph += '<div style="padding:4px 0;color:#5A6385;">• '+esc(u.name)+' ('+esc(u.email)+') — '+esc(u.company)+'</div>'; });
      if (parsedUsers.length > 5) ph += '<div style="color:#9CA3BF;">...e mais '+(parsedUsers.length-5)+'</div>';
      if (errors.length) { ph += '<div style="color:#DC2626;margin-top:6px;">⚠️ '+errors.length+' linha(s) ignorada(s)</div>'; }
      ph += '</div>';
      preview.innerHTML = ph;
      document.getElementById('imp-confirm').style.display = 'inline-block';
    };
    reader.readAsText(file, 'UTF-8');
  }

  document.getElementById('imp-confirm').addEventListener('click', async function() {
    if (!parsedUsers.length) return;
    var btn = document.getElementById('imp-confirm'); btn.disabled=true; btn.textContent='Importando...';
    var added = 0, skipped = 0;
    for (var i=0; i<parsedUsers.length; i++) {
      var u = parsedUsers[i];
      var pass = (u.password && u.password.length>=6) ? u.password : '123456';
      try { await sbCreateUser(u.email, pass, {name:u.name, company:u.company, role:'participant', initials:u.initials}); added++; }
      catch(e) { skipped++; }
    }
    if (window.syncProfilesFromSupabase) await syncProfilesFromSupabase();
    Utils.toast(added+' cadastrado(s), '+skipped+' falharam/já existiam ✓','success');
    closeModal(); render();
  });
}

function downloadTemplate() {
  var csv = 'nome,email,empresa,senha\nJoão Silva,joao@porter.com.br,Porter,123456\nAna Costa,ana@almah.com.br,Almah,123456\nCarlos Mendes,carlos@porter.com.br,Porter,123456';
  var blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href=url; a.download='template-participantes.csv'; a.click();
  Utils.toast('Template baixado!','success');
}

function saveFinalResults() {
  var champ = (document.getElementById('frChampion')||{}).value||'';
  var vice = (document.getElementById('frVice')||{}).value||'';
  var third = (document.getElementById('frThird')||{}).value||'';
  if (!champ) { Utils.toast('Informe ao menos o campeão','error'); return; }
  var merged = Object.assign({}, DB.getFinalResults() || {}, {champion:champ, runner_up:vice, third:third});
  DB.saveFinalResults(merged);
  Utils.toast('Resultados finais salvos! ✓','success');
}

render();
// config (admin): carrega a lista de perfis sob demanda
if (Auth.isAdmin() && window.syncProfilesFromSupabase) syncProfilesFromSupabase().then(render);


}};
