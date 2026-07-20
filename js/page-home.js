// ============================================================================
// HOME — página comemorativa de felicitações ao TOP 3 do ranking.
// Primeira tela após login. Pódio festivo + confete + destaque do campeão.
// Lê DB.getRanking() (agregado do servidor, sem palpite cru de ninguém) e
// re-renderiza quando a sync termina.
// ============================================================================
SPA.pages["home"] = {style:`
.hm-stage{position:relative;overflow:hidden;border-radius:20px;background:radial-gradient(120% 120% at 50% 0%,#2A3F9A 0%,#1B2B6B 55%,#141F52 100%);color:#fff;padding:28px 20px 34px;box-shadow:0 20px 50px rgba(20,31,82,.35);}
.hm-confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;}
.hm-confetti i{position:absolute;top:-14px;width:9px;height:14px;opacity:.9;border-radius:2px;animation:hm-fall linear infinite;}
@keyframes hm-fall{0%{transform:translateY(-20px) rotate(0);opacity:0;}10%{opacity:.95;}100%{transform:translateY(680px) rotate(540deg);opacity:.15;}}
.hm-inner{position:relative;z-index:1;}
.hm-title{font-family:'Barlow Condensed',sans-serif;font-weight:900;text-transform:uppercase;text-align:center;letter-spacing:1px;line-height:1;font-size:clamp(1.8rem,6vw,2.9rem);text-shadow:0 3px 12px rgba(0,0,0,.3);}
.hm-sub{text-align:center;opacity:.82;font-size:.9rem;margin-top:8px;font-weight:600;}
.hm-podium{display:flex;align-items:flex-end;justify-content:center;gap:12px;margin-top:30px;}
.hm-col{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;max-width:170px;min-width:0;}
.hm-crown{font-size:1.7rem;filter:drop-shadow(0 3px 6px rgba(0,0,0,.3));animation:hm-bob 2.4s ease-in-out infinite;}
@keyframes hm-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
.hm-av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#1B2B6B;border:3px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.28);font-family:'Barlow Condensed',sans-serif;}
.hm-name{font-weight:800;text-align:center;font-size:.92rem;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.hm-co{font-size:.66rem;opacity:.7;text-align:center;}
.hm-pillar{width:100%;border-radius:12px 12px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:10px 6px 12px;position:relative;overflow:hidden;}
.hm-pillar::after{content:"";position:absolute;top:0;left:-40%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);animation:hm-shine 3.4s ease-in-out infinite;}
@keyframes hm-shine{0%{left:-40%;}55%,100%{left:120%;}}
.hm-rank{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:2rem;color:rgba(0,0,0,.22);line-height:1;}
.hm-pts{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:1.15rem;color:rgba(0,0,0,.5);}
.hm-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:22px;}
.hm-card{background:#fff;border:1px solid #E4E8F4;border-radius:14px;padding:14px 16px;box-shadow:0 2px 8px rgba(27,43,107,.06);}
.hm-badge{display:inline-flex;align-items:center;gap:5px;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:.9rem;padding:3px 11px;border-radius:99px;text-transform:uppercase;letter-spacing:.5px;}
.hm-mini{display:flex;gap:14px;margin-top:10px;flex-wrap:wrap;}
.hm-mini>div{text-align:center;}
.hm-mini b{font-family:'Barlow Condensed',sans-serif;font-size:1.25rem;color:#1B2B6B;display:block;line-height:1;}
.hm-mini span{font-size:.6rem;text-transform:uppercase;letter-spacing:.5px;color:#9CA3BF;font-weight:700;}
.hm-cta{display:flex;justify-content:center;margin-top:22px;}
.hm-cta button{background:#D4A80F;color:#3a2e05;border:none;border-radius:99px;padding:11px 26px;font-weight:800;font-size:.9rem;cursor:pointer;box-shadow:0 6px 16px rgba(212,168,15,.4);transition:transform .12s;}
.hm-cta button:hover{transform:translateY(-2px);}
@media(max-width:560px){
  .hm-podium{gap:6px;}
  .hm-name{font-size:.8rem;}
}
`,script:function(){

(function(){
  var user = Auth.user;

  var MEDALS = {1:'🥇',2:'🥈',3:'🥉'};
  var PILLAR = {1:'linear-gradient(180deg,#FFE27A,#F5B400)',2:'linear-gradient(180deg,#EDEDED,#B9BECB)',3:'linear-gradient(180deg,#E4A876,#B26B2E)'};
  var HEIGHT = {1:'118px',2:'88px',3:'66px'};
  var ORDER  = {1:'0',2:'-1',3:'1'};       // #1 no centro
  var AVSIZE = {1:'62px',2:'50px',3:'46px'};

  function confetti(){
    var cols=['#F5C518','#3D5AC8','#16A34A','#DC2626','#fff','#D4A80F'];
    var h='<div class="hm-confetti">';
    for(var i=0;i<34;i++){
      var l=Math.round(i/34*100);
      var c=cols[i%cols.length];
      var dur=(3.2+(i%5)*0.7).toFixed(1);
      var delay=(-(i%7)*0.9).toFixed(1);
      h+='<i style="left:'+l+'%;background:'+c+';animation-duration:'+dur+'s;animation-delay:'+delay+'s;"></i>';
    }
    return h+'</div>';
  }

  function col(r, place){
    if(!r) return '';
    var isMe = r.email===user.email;
    return '<div class="hm-col" style="order:'+ORDER[place]+'">'+
      (place===1?'<div class="hm-crown">👑</div>':'')+
      '<div class="hm-av" style="width:'+AVSIZE[place]+';height:'+AVSIZE[place]+';font-size:calc('+AVSIZE[place]+' * .38);background:'+(isMe?'#F5C518':'#fff')+';">'+esc(r.initials||'?')+'</div>'+
      '<div class="hm-name">'+esc((r.name||'').split(' ')[0])+' '+MEDALS[place]+(isMe?' <span style="font-size:.62rem;color:#F5C518">(você)</span>':'')+'</div>'+
      '<div class="hm-co">'+esc(r.company||'')+'</div>'+
      '<div class="hm-pillar" style="background:'+PILLAR[place]+';height:'+HEIGHT[place]+';">'+
        '<div class="hm-pts">'+(r.totalPts||0)+' pts</div>'+
        '<div class="hm-rank">'+place+'</div>'+
      '</div></div>';
  }

  function statCard(r, place){
    if(!r) return '';
    var bg={1:'linear-gradient(135deg,#FFD700,#FFA500)',2:'linear-gradient(135deg,#C0C0C0,#9AA0AE)',3:'linear-gradient(135deg,#CD7F32,#A0522D)'}[place];
    return '<div class="hm-card">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'+
        '<span class="hm-badge" style="background:'+bg+';color:rgba(0,0,0,.55);">'+MEDALS[place]+' '+place+'º Lugar</span>'+
        '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:1.5rem;color:#1B2B6B;">'+(r.totalPts||0)+'<span style="font-size:.8rem;color:#9CA3BF;"> pts</span></span>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:9px;margin-top:10px;">'+
        '<div style="width:34px;height:34px;border-radius:50%;background:#3D5AC8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.75rem;flex-shrink:0;">'+esc(r.initials||'?')+'</div>'+
        '<div style="min-width:0;"><div style="font-weight:700;color:#1B2B6B;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.name||'')+'</div>'+
        '<div style="font-size:.68rem;color:#9CA3BF;">'+esc(r.company||'')+'</div></div>'+
      '</div>'+
      '<div class="hm-mini">'+
        '<div><b>'+(r.exactScores||0)+'</b><span>🎯 Exatos</span></div>'+
        '<div><b>'+(r.correctWinners||0)+'</b><span>✅ Vencedor</span></div>'+
        '<div><b>'+(r.betCount||0)+'</b><span>📝 Palpites</span></div>'+
      '</div></div>';
  }

  function render(){
    var pc=document.getElementById('pageContent');
    if(!pc) return;
    var ranking=DB.getRanking()||[];
    var top=ranking.slice(0,3);
    var fr=DB.getFinalResults();
    var decided=!!(fr && fr.champion);   // torneio encerrado → felicitação definitiva

    var h='';

    if(!top.length){
      h+='<div class="hm-stage"><div class="hm-inner" style="text-align:center;padding:26px 6px;">';
      h+='<div style="font-size:3rem;">🏆</div>';
      h+='<div class="hm-title">O pódio está sendo montado</div>';
      h+='<div class="hm-sub">Assim que os primeiros jogos forem computados, os líderes aparecem aqui em grande estilo.</div>';
      h+='</div></div>';
      pc.innerHTML=h; return;
    }

    var champ=top[0];
    var isMeChamp=champ && champ.email===user.email;

    // ── Palco festivo ──
    h+='<div class="hm-stage">'+confetti()+'<div class="hm-inner">';
    h+='<div class="hm-title">'+(decided?'🎉 Campeões do Bolão! 🎉':'🎉 Pódio de Líderes 🎉')+'</div>';
    h+='<div class="hm-sub">'+(decided
        ? 'A Copa acabou — parabéns aos três melhores palpiteiros do Bolão Porter & Almah!'
        : 'Classificação em disputa · uma salva de palmas para o top 3 do momento 👏')+'</div>';
    if(isMeChamp) h+='<div class="hm-sub" style="color:#F5C518;font-weight:800;margin-top:6px;">👑 Você está no topo! Aproveite o brilho.</div>';
    h+='<div class="hm-podium">'+col(top[1],2)+col(top[0],1)+col(top[2],3)+'</div>';
    h+='</div></div>';

    // ── Cartões detalhados ──
    h+='<div class="hm-cards">'+statCard(top[0],1)+statCard(top[1],2)+statCard(top[2],3)+'</div>';

    // ── CTA ──
    h+='<div class="hm-cta"><button data-nav="ranking">Ver ranking completo 🏆</button></div>';

    // ── Hall da Fama (reaproveita o builder global de page-hall.js) ──
    h+='<div style="height:1px;background:#E4E8F4;margin:26px 0 4px;"></div>';
    h+='<div id="hm-hall"></div>';

    pc.innerHTML=h;
    fillHall();

    var btn=pc.querySelector('[data-nav="ranking"]');
    if(btn) btn.addEventListener('click',function(){ SPA.navigate('ranking'); });
  }

  // Injeta o conteúdo do Hall no container da home (guardado: se o builder ainda
  // não existir ou não estiver na home, sai quieto).
  function fillHall(){
    if(SPA.current!=='home') return;
    var el=document.getElementById('hm-hall');
    if(!el || typeof window.buildHallHtml!=='function') return;
    try { el.innerHTML = window.buildHallHtml(); } catch(e){}
  }

  render();
  // Puxa ranking + prêmios globais (RPCs) frescos e re-renderiza na home.
  // ranking → pódio + prêmios "de graça"; RPCs → prêmios globais do Hall.
  if(window.syncRankingFromSupabase) syncRankingFromSupabase().then(function(){ if(SPA.current==='home') render(); },function(){});
  [ 'syncMostExactGameFromSupabase','syncTopDistributingGameFromSupabase','syncBottomDistributingGameFromSupabase',
    'syncBiggestClimbFromSupabase','syncHottestStreakFromSupabase','syncRarestExactFromSupabase',
    'syncKnockoutProphetFromSupabase','syncPerfectPredictorsFromSupabase','syncCompanyDuelFromSupabase'
  ].forEach(function(fn){ if(window[fn]) window[fn]().then(fillHall,function(){}); });
})();

}};
