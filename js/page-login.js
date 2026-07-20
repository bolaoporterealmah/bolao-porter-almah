SPA.pages["login"]={style:`.login-bg {
  position: fixed; inset: 0;
  background: var(--porter-blue);
  overflow: hidden;
}
.login-bg::before {
  content: '';
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(61,90,200,0.3) 0%, transparent 70%);
  top: -200px; right: -100px;
}
.login-bg::after {
  content: '';
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,197,24,0.15) 0%, transparent 70%);
  bottom: -100px; left: -100px;
}
.bg-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

.login-wrap {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-height: 100vh;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 40px 40px 36px;
  width: 100%; max-width: 440px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.2);
  animation: fadeInUp 0.5s ease;
}

@media (max-width: 480px) {
  .login-wrap { padding: 14px; }
  .login-card { padding: 26px 20px 24px; }
  .login-logo { margin-bottom: 18px; }
  .login-hero { padding: 16px; margin-bottom: 20px; }
  .login-hero .copa-title { font-size: 1.5rem; }
}

.login-logo { text-align: center; margin-bottom: 28px; }
.login-logo img { height: 44px; }

.login-hero {
  text-align: center;
  margin-bottom: 28px;
  padding: 20px;
  background: var(--porter-blue);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}
.login-hero::before {
  content: '⚽';
  position: absolute;
  font-size: 80px;
  opacity: 0.06;
  right: -10px; bottom: -20px;
  transform: rotate(-20deg);
}
.login-hero .copa-label {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 2px;
  text-transform: uppercase; color: var(--porter-accent); margin-bottom: 4px;
}
.login-hero .copa-title {
  font-family: var(--font-display);
  font-size: 1.8rem; font-weight: 900;
  color: white; line-height: 1;
  text-transform: uppercase;
}
.login-hero .copa-sub {
  font-size: 0.78rem; color: rgba(255,255,255,0.6); margin-top: 4px;
}

.divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--porter-gray-200); }
.divider span { font-size: 0.75rem; color: var(--porter-gray-400); font-weight: 600; }

.btn-google {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 11px;
  border: 1.5px solid var(--porter-gray-200);
  border-radius: var(--radius-md);
  background: white;
  font-size: 0.9rem; font-weight: 600;
  color: var(--porter-gray-800);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-main);
}
.btn-google:hover { background: var(--porter-gray-50); border-color: var(--porter-gray-400); box-shadow: var(--shadow-sm); }
.google-icon { width: 18px; height: 18px; }

.login-footer { text-align: center; margin-top: 20px; font-size: 0.75rem; color: var(--porter-gray-400); }
.login-footer strong { color: var(--porter-blue); }

.error-msg { display: none; }
.error-msg.show { display: flex; }

#loginForm { display: flex; flex-direction: column; gap: 0; }`,script:function(){

(function(){
  if(Sess.get()){SPA.navigate('home');return;}
  // ── Login / Cadastro via Supabase Auth ──────────────────────────────
  var mode='login';
  var emailEl=document.getElementById('inp-email');
  var passEl=document.getElementById('inp-password');
  var nameEl=document.getElementById('inp-name');
  var compEl=document.getElementById('inp-company');
  var btnEl=document.getElementById('btn-entrar');
  var errEl=document.getElementById('login-error');
  var linkEl=document.getElementById('link-toggle-mode');
  var nameWrap=document.getElementById('su-name-wrap');
  var compWrap=document.getElementById('su-company-wrap');

  function showErr(msg){ if(errEl){ errEl.textContent='⚠️ '+msg; errEl.style.display='block'; } }
  function clearErr(){ if(errEl) errEl.style.display='none'; }
  function setMode(m){
    mode=m; clearErr();
    var su=(m==='signup');
    if(nameWrap) nameWrap.style.display=su?'block':'none';
    if(compWrap) compWrap.style.display=su?'block':'none';
    if(passEl) passEl.setAttribute('autocomplete', su?'new-password':'current-password');
    if(btnEl) btnEl.textContent=su?'Criar conta ⚽':'Entrar no Bolão ⚽';
    if(linkEl) linkEl.textContent=su?'← Já tenho conta':'Criar uma conta →';
  }
  async function submit(){
    clearErr();
    var email=((emailEl&&emailEl.value)||'').trim().toLowerCase();
    var pass=((passEl&&passEl.value)||'').trim();
    if(!email||!pass){ showErr('Preencha e-mail e senha.'); return; }
    if(mode==='signup' && pass.length<6){ showErr('A senha deve ter ao menos 6 caracteres.'); return; }
    if(btnEl){ btnEl.disabled=true; btnEl.textContent='🔄 Aguarde...'; }
    try{
      if(mode==='signup'){
        var name=((nameEl&&nameEl.value)||'').trim();
        if(!name){ showErr('Informe seu nome.'); if(btnEl){btnEl.disabled=false;} setMode('signup'); return; }
        var company=((compEl&&compEl.value)||'').trim()||'Porter';
        var initials=name.split(' ').slice(0,2).map(function(n){return n[0];}).join('').toUpperCase();
        await sbSignup(email,pass,{name:name,company:company,initials:initials});
      } else {
        await sbLogin(email,pass);
      }
      SPA.navigate('home');
    }catch(e){
      showErr((e&&e.message)||'Falha. Verifique os dados.');
      if(btnEl){ btnEl.disabled=false; }
      setMode(mode);
    }
  }
  if(btnEl) btnEl.addEventListener('click',submit);
  if(linkEl) linkEl.addEventListener('click',function(){ setMode(mode==='login'?'signup':'login'); });
  [emailEl,passEl,nameEl,compEl].forEach(function(el){ if(el) el.addEventListener('keydown',function(ev){ if(ev.key==='Enter') submit(); }); });
  setMode('login');
})();

}};
