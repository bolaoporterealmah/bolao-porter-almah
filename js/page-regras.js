SPA.pages["regras"]={style:``,script:function(){
(function(){
  var pc = document.getElementById('pageContent');
  if (!pc) return;

  var h = '';

  // Header
  h += '<div style="background:linear-gradient(135deg,#1B2B6B,#3D5AC8);border-radius:16px;padding:24px 28px;color:white;margin-bottom:24px;position:relative;overflow:hidden;">';
  h += '<div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:100px;opacity:.07;">📋</div>';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:2rem;font-weight:900;text-transform:uppercase;">Regras & Pontuação</div>';
  h += '<div style="font-size:.85rem;opacity:.75;margin-top:4px;">Bolão Copa do Mundo FIFA 2026 · Porter & Almah</div>';
  h += '</div>';

  // Pontuação por acerto
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;">';

  // Tabela de pontos
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #EEF0F6;background:#1B2B6B;border-radius:13px 13px 0 0;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;text-transform:uppercase;color:white;letter-spacing:.5px;">⚽ Pontos por Jogo</div></div>';
  [
    ['🎯','Placar exato','15 pts','Acertou o placar certinho: ex. 2×1','#16A34A'],
    ['✅','Vencedor correto','5 pts','Acertou quem ganhou (ou empate)','#2563EB'],
    ['📊','Saldo de gols','3 pts','Ex. palpitou 2×0, saiu 3×1 (saldo +2 nos dois)','#7C3AED'],
    ['⚽','Gols de 1 time','2 pts','Ex. palpitou 2×1, saiu 2×0 (acertou gols do home)','#EA580C'],
  ].forEach(function(row){
    h += '<div style="display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid #EEF0F6;">';
    h += '<span style="font-size:1.4rem;">'+row[0]+'</span>';
    h += '<div style="flex:1;"><div style="font-weight:700;font-size:.9rem;color:#2D3557;">'+row[1]+'</div>';
    h += '<div style="font-size:.72rem;color:#9CA3BF;margin-top:2px;">'+row[3]+'</div></div>';
    h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;font-weight:900;color:'+row[4]+';white-space:nowrap;">'+row[2]+'</span>';
    h += '</div>';
  });
  h += '<div style="padding:12px 18px;background:#F8F9FC;border-radius:0 0 13px 13px;">';
  h += '<div style="font-size:.72rem;color:#9CA3BF;font-weight:600;">💡 Os pontos são cumulativos: acertar o placar exato dá +15 e já inclui os outros acertos.</div>';
  h += '</div></div>';

  // Multiplicadores
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #EEF0F6;background:#1B2B6B;border-radius:13px 13px 0 0;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;text-transform:uppercase;color:white;letter-spacing:.5px;">✖️ Multiplicadores por Fase</div></div>';
  [
    ['🌎','Fase de Grupos','×1','Pontos base normais','#9CA3BF'],
    ['🔥','Oitavas de Final','×1.2','20% a mais','#2563EB'],
    ['💥','Quartas de Final','×1.5','50% a mais','#7C3AED'],
    ['⭐','Semifinais','×2','Dobro dos pontos','#EA580C'],
    ['🏆','Final','×3','Triplo dos pontos','#16A34A'],
  ].forEach(function(row){
    h += '<div style="display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid #EEF0F6;">';
    h += '<span style="font-size:1.2rem;">'+row[0]+'</span>';
    h += '<div style="flex:1;"><div style="font-weight:700;font-size:.88rem;color:#2D3557;">'+row[1]+'</div>';
    h += '<div style="font-size:.7rem;color:#9CA3BF;">'+row[3]+'</div></div>';
    h += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.5rem;font-weight:900;color:'+row[4]+';white-space:nowrap;">'+row[2]+'</span>';
    h += '</div>';
  });
  h += '<div style="padding:12px 18px;background:#F8F9FC;border-radius:0 0 13px 13px;">';
  h += '<div style="font-size:.72rem;color:#9CA3BF;font-weight:600;">💡 Ex: Acertar placar exato na Final = 15 × 3 = 45 pts!</div>';
  h += '</div></div>';

  h += '</div>'; // grid

  // Palpites especiais
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;margin-bottom:20px;">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #EEF0F6;background:#1B2B6B;border-radius:13px 13px 0 0;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;text-transform:uppercase;color:white;letter-spacing:.5px;">🎯 Palpites Especiais (bônus)</div></div>';
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0;">';
  [
    ['🏆','Campeão','50 pts','Acertar o campeão da Copa','#FFD700','#FFA500','rgba(0,0,0,.6)'],
    ['🥈','Vice-Campeão','25 pts','Acertar o finalista perdedor','#E0E0E0','#BDBDBD','rgba(0,0,0,.55)'],
    ['🥉','3º Lugar','15 pts','Acertar o terceiro colocado','#CD9B6B','#A0522D','white'],
    ['⚡','Classificados','5 pts cada','Cada time correto das Oitavas (máx. 16)','#3D5AC8','#1B2B6B','white'],
  ].forEach(function(row){
    h += '<div style="padding:16px 18px;border-right:1px solid #EEF0F6;border-bottom:1px solid #EEF0F6;">';
    h += '<div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,'+row[4]+','+row[5]+');font-size:1.3rem;margin-bottom:8px;">'+row[0]+'</div>';
    h += '<div style="font-weight:800;font-size:.9rem;color:#2D3557;margin-bottom:2px;">'+row[1]+'</div>';
    h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:1.5rem;font-weight:900;color:#1B2B6B;line-height:1;margin-bottom:4px;">'+row[2]+'</div>';
    h += '<div style="font-size:.72rem;color:#9CA3BF;">'+row[3]+'</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div style="padding:13px 18px;background:#F8F9FC;border-radius:0 0 13px 13px;display:flex;align-items:center;gap:8px;">';
  h += '<span style="font-size:1.1rem;">🔒</span>';
  h += '<div style="font-size:.78rem;color:#5A6385;font-weight:600;">Palpites especiais fecham em <strong>11/06/2026 às 15h00</strong> — antes do primeiro jogo.</div>';
  h += '</div></div>';

  // Regras gerais
  h += '<div style="background:white;border-radius:14px;border:1px solid #DDE1EE;margin-bottom:20px;">';
  h += '<div style="padding:14px 18px;border-bottom:1px solid #EEF0F6;background:#1B2B6B;border-radius:13px 13px 0 0;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;text-transform:uppercase;color:white;letter-spacing:.5px;">📋 Regras Gerais</div></div>';
  h += '<div style="padding:4px 0;">';
  [
    ['⏰','Prazo para palpites','Os palpites fecham <strong>1 hora antes</strong> do início de cada jogo. Após esse prazo não é possível alterar.'],
    ['🔒','Palpites Especiais','Devem ser feitos até <strong>11/06/2026 às 15h00</strong>. Após esse prazo não é possível editar.'],
    ['📊','Desempate no Ranking','Em caso de empate em pontos: 1º mais placares exatos · 2º mais palpites feitos · 3º menor tempo médio de envio.'],
    ['🔄','Atualização','Os resultados são inseridos pelo administrador. A pontuação é calculada automaticamente após cada resultado.'],
    ['👥','Participação','Aberto para colaboradores da Porter e Almah. Cada participante tem sua própria conta e histórico de palpites.'],
    ['🎯','Palpite Especial Extra','Máximo de 16 times para os classificados às Oitavas. Cada acerto vale +5 pts (máx. 80 pts extras).'],
  ].forEach(function(rule){
    h += '<div style="display:flex;align-items:flex-start;gap:12px;padding:13px 18px;border-bottom:1px solid #EEF0F6;">';
    h += '<span style="font-size:1.2rem;flex-shrink:0;margin-top:1px;">'+rule[0]+'</span>';
    h += '<div><div style="font-weight:700;font-size:.88rem;color:#2D3557;margin-bottom:2px;">'+rule[1]+'</div>';
    h += '<div style="font-size:.78rem;color:#5A6385;line-height:1.5;">'+rule[2]+'</div></div>';
    h += '</div>';
  });
  h += '</div></div>';

  // Exemplo prático
  h += '<div style="background:linear-gradient(135deg,rgba(27,43,107,.05),rgba(61,90,200,.08));border-radius:14px;border:1px solid rgba(27,43,107,.15);padding:20px 22px;">';
  h += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;text-transform:uppercase;color:#1B2B6B;letter-spacing:.5px;margin-bottom:14px;">💡 Exemplo Prático — Final da Copa</div>';
  h += '<div style="font-size:.85rem;color:#5A6385;line-height:1.8;">';
  h += 'Resultado real: <strong>Brasil 2 × 1 França</strong> (Final) &nbsp;·&nbsp; Seu palpite: <strong>Brasil 2 × 1 França</strong><br/>';
  h += '→ Placar exato: <strong style="color:#16A34A">+15 pts</strong><br/>';
  h += '→ Multiplicador Final: <strong style="color:#16A34A">×3</strong><br/>';
  h += '→ Total: <strong style="color:#16A34A;font-size:1.1rem;">45 pts</strong> só neste jogo!<br/>';
  h += '<br/>Se você também palpitou no Brasil como campeão: <strong style="color:#16A34A">+50 pts</strong> extras.';
  h += '</div></div>';

  pc.innerHTML = h;
})();

}};
