SPA.pages["chaveamento"]={style:`.bracket-container {
  overflow-x: auto;
  padding: 20px 0;
}
.bracket-row {
  display: flex; align-items: flex-start; gap: 24px;
  min-width: max-content;
  padding: 0 4px;
}
.bracket-col { display:flex; flex-direction:column; gap:0; }
.bracket-stage { min-width: 170px; }
.bstage-title {
  font-family:var(--font-display); font-size:0.7rem; font-weight:800;
  text-transform:uppercase; letter-spacing:1px; color:var(--porter-gray-400);
  text-align:center; margin-bottom:10px; padding:0 4px;
}

.b-match {
  background:white; border:1px solid var(--porter-gray-200);
  border-radius:var(--radius-md); overflow:hidden;
  margin-bottom:8px; box-shadow:var(--shadow-sm);
  transition:box-shadow 0.2s;
}
.b-match:hover { box-shadow:var(--shadow-md); }
.b-match.tbd { opacity:0.5; border-style:dashed; }
.b-match.has-result { border-color:rgba(27,43,107,0.3); }

.b-team {
  display:flex; align-items:center; gap:8px;
  padding:7px 10px; font-size:0.8rem;
}
.b-team:first-child { border-bottom:1px solid var(--porter-gray-100); }
.b-team.winner { background:rgba(27,43,107,0.06); font-weight:700; color:var(--porter-blue); }
.b-flag { font-size:1.1rem; min-width:18px; }
.b-name { flex:1; font-weight:600; }
.b-score { font-family:var(--font-display); font-weight:900; font-size:1rem; color:var(--porter-blue); min-width:16px; text-align:center; }
.b-tbd { padding:10px; text-align:center; font-size:0.72rem; color:var(--porter-gray-400); font-weight:600; }
.b-date { padding:5px 10px 4px; font-size:0.62rem; font-weight:700; color:var(--porter-gray-400); background:var(--porter-gray-100); border-bottom:1px solid var(--porter-gray-200); letter-spacing:0.2px; }
.b-team.pending { color:var(--porter-gray-400); }
.b-team.pending .b-flag { opacity:0.5; }
.b-sub { display:block; font-size:0.6rem; font-weight:600; color:var(--porter-gray-400); text-transform:uppercase; letter-spacing:0.3px; margin-top:1px; }
.b-team.winner .b-sub { color:var(--porter-blue); opacity:0.7; }

.b-connector { display:flex; align-items:center; }

.groups-grid {
  display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:14px;
  margin-bottom:28px;
}
.group-card {
  background:white; border-radius:var(--radius-lg); border:1px solid var(--porter-gray-200);
  overflow:hidden; box-shadow:var(--shadow-sm);
}
.group-head {
  background:var(--porter-blue); color:white; padding:8px 14px;
  font-family:var(--font-display); font-size:0.85rem; font-weight:800; text-transform:uppercase;
  display:flex; align-items:center; justify-content:space-between;
}
.group-team {
  display:flex; align-items:center; gap:8px;
  padding:8px 14px; border-bottom:1px solid var(--porter-gray-100); font-size:0.82rem;
}
.group-team:last-child { border-bottom:none; }
.group-team .flag { font-size:1.1rem; }
.group-team .tname { flex:1; font-weight:600; }
.stand-table { width:100%; border-collapse:collapse; font-size:0.74rem; }
.stand-table th {
  font-family:var(--font-display); font-weight:800; text-transform:uppercase;
  color:var(--porter-gray-400); font-size:0.6rem; letter-spacing:0.3px;
  padding:6px 3px; text-align:center; border-bottom:1px solid var(--porter-gray-200);
}
.stand-table th.team-col { text-align:left; padding-left:10px; }
.stand-table td { padding:7px 3px; text-align:center; border-bottom:1px solid var(--porter-gray-100); }
.stand-table tr:last-child td { border-bottom:none; }
.stand-table td.team-col { text-align:left; padding-left:8px; font-weight:600; display:flex; align-items:center; gap:6px; }
.stand-table td.pts-col { font-family:var(--font-display); font-weight:900; color:var(--porter-blue); }
.stand-table tr.qualified { background:rgba(34,197,94,0.07); }
.stand-pos { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:5px; font-size:0.64rem; font-weight:800; }
.stand-pos.q { background:#16A34A; color:white; }
.stand-pos.nq { background:var(--porter-gray-100); color:var(--porter-gray-400); }
.stand-flag { font-size:1rem; }`,script:function(){

// Compute group standings from played group-phase games
function computeStandings(letter, teams) {
  const stats = {};
  teams.forEach(function(t){ stats[t] = {team:t, j:0, v:0, e:0, d:0, gp:0, gc:0, sg:0, pts:0}; });
  DB.getGames().forEach(function(g){
    if (g.phase !== 'groups' || g.group !== letter || !g.result || g.tbd) return;
    var hs = parseInt(g.result.home_score), as = parseInt(g.result.away_score);
    var H = stats[g.home], A = stats[g.away];
    if (!H || !A) return;
    H.j++; A.j++; H.gp += hs; H.gc += as; A.gp += as; A.gc += hs;
    if (hs > as) { H.v++; A.d++; H.pts += 3; }
    else if (as > hs) { A.v++; H.d++; A.pts += 3; }
    else { H.e++; A.e++; H.pts++; A.pts++; }
  });
  return teams.map(function(t){ var s = stats[t]; s.sg = s.gp - s.gc; return s; })
    .sort(function(a,b){ return b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || a.team.localeCompare(b.team); });
}

function render() {
  const games = DB.getGames();

  // Bracket games (ordenados por data — alinha com o vínculo das fases)
  const byDate = arr => arr.sort((a,b) => new Date(a.date) - new Date(b.date));
  const r32 = byDate(games.filter(g => g.phase === 'round_of_32'));
  const r16 = byDate(games.filter(g => g.phase === 'round_of_16'));
  const qf = byDate(games.filter(g => g.phase === 'quarterfinals'));
  const sf = byDate(games.filter(g => g.phase === 'semifinals'));
  const tp = games.filter(g => g.phase === 'third_place');
  const fin = games.filter(g => g.phase === 'final');

  // Vínculo do mata-mata (preenche descs faltantes das quartas em diante)
  _links = bracketLinks();

  // Após 28/06 o mata-mata vira a aba inicial
  const knockoutFirst = new Date() >= new Date('2026-06-28T00:00:00');

  document.getElementById('pageContent').innerHTML = `
  <div class="tabs" style="margin-bottom:24px;">
    <button class="tab-btn ${knockoutFirst?'':'active'}" onclick="showTab('groups',this)">🌎 Grupos</button>
    <button class="tab-btn ${knockoutFirst?'active':''}" onclick="showTab('bracket',this)">⚡ Mata-Mata</button>
  </div>

  <div id="tabGroups" style="display:${knockoutFirst?'none':'block'};">
    <div class="groups-grid">
      ${Object.entries(GROUPS).map(([letter, g]) => {
        const rows = computeStandings(letter, g.teams);
        const played = rows.reduce((n,s) => n + s.j, 0);
        return `
        <div class="group-card">
          <div class="group-head">
            <span>Grupo ${letter}</span>
            <span style="font-size:0.65rem;opacity:0.7;">${played > 0 ? played+' jogo(s)' : g.teams.length+' times'}</span>
          </div>
          <div style="overflow-x:auto;">
          <table class="stand-table">
            <thead>
              <tr>
                <th style="width:14px;"></th>
                <th class="team-col">Time</th>
                <th title="Pontos">P</th>
                <th title="Jogos">J</th>
                <th title="Vitórias">V</th>
                <th title="Empates">E</th>
                <th title="Derrotas">D</th>
                <th title="Gols pró">GP</th>
                <th title="Gols contra">GC</th>
                <th title="Saldo de gols">SG</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((s, i) => `
                <tr class="${i < 2 ? 'qualified' : ''}">
                  <td><span class="stand-pos ${i < 2 ? 'q' : 'nq'}">${i+1}</span></td>
                  <td class="team-col"><span class="stand-flag">${flag(s.team)}</span>${s.team}</td>
                  <td class="pts-col">${s.pts}</td>
                  <td>${s.j}</td>
                  <td>${s.v}</td>
                  <td>${s.e}</td>
                  <td>${s.d}</td>
                  <td>${s.gp}</td>
                  <td>${s.gc}</td>
                  <td>${s.sg > 0 ? '+'+s.sg : s.sg}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <div id="tabBracket" style="display:${knockoutFirst?'block':'none'};">
    <div class="alert alert-info" style="margin-bottom:20px;">
      📋 Cada confronto mostra de onde vêm os times (ex: <strong>1º Grupo C</strong>, <strong>Vencedor Jogo 73</strong>). Conforme os resultados forem saindo, os nomes reais aparecem automaticamente.
    </div>
    <div class="bracket-container">
      <div class="bracket-row">

        <!-- 16-avos -->
        <div class="bracket-stage">
          <div class="bstage-title">🎲 16-avos de Final</div>
          ${r32.length > 0 ? r32.map(g => renderBracketMatch(g)).join('') :
          Array.from({length:16}).map(() => renderTbdMatch()).join('')}
        </div>

        <!-- Oitavas -->
        <div class="bracket-stage">
          <div class="bstage-title">⚡ Oitavas de Final</div>
          ${r16.length > 0 ? r16.map(g => renderBracketMatch(g)).join('') :
          Array.from({length:8}).map(() => renderTbdMatch('Vencedor 16-avos')).join('')}
        </div>

        <!-- Quartas -->
        <div class="bracket-stage">
          <div class="bstage-title">🔥 Quartas de Final</div>
          ${qf.length > 0 ? qf.map(g => renderBracketMatch(g)).join('') :
          Array.from({length:4}).map(() => renderTbdMatch('Vencedor oitavas')).join('')}
        </div>

        <!-- Semi -->
        <div class="bracket-stage">
          <div class="bstage-title">⚡ Semifinais</div>
          ${sf.length > 0 ? sf.map(g => renderBracketMatch(g)).join('') :
          Array.from({length:2}).map(() => renderTbdMatch('Vencedor quartas')).join('')}
        </div>

        <!-- 3º + Final -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="bracket-stage">
            <div class="bstage-title">🥉 3º Lugar</div>
            ${tp.length > 0 ? tp.map(g => renderBracketMatch(g)).join('') : renderTbdMatch('Perdedores semi')}
          </div>
          <div class="bracket-stage">
            <div class="bstage-title">🏆 Final</div>
            ${fin.length > 0 ? fin.map(g => renderBracketMatch(g)).join('') : renderTbdMatch('Vencedores semi')}
          </div>
        </div>

      </div>
    </div>
  </div>
  `;
}

// Vínculo dos jogos: descs faltantes (quartas+) derivadas do round anterior por ordem de data
var _links = {};
function bracketLinks() {
  const games = DB.getGames();
  const byDate = arr => arr.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
  const num = id => id.replace(/^j/,'');
  const r16 = byDate(games.filter(g => g.phase === 'round_of_16'));
  const qf  = byDate(games.filter(g => g.phase === 'quarterfinals'));
  const sf  = byDate(games.filter(g => g.phase === 'semifinals'));
  const tp  = byDate(games.filter(g => g.phase === 'third_place'));
  const fin = byDate(games.filter(g => g.phase === 'final'));
  const links = {};
  qf.forEach((g,i) => { if (!g.desc && r16[i*2] && r16[i*2+1]) links[g.id] = 'W'+num(r16[i*2].id)+' x W'+num(r16[i*2+1].id); });
  sf.forEach((g,i) => { if (!g.desc && qf[i*2]  && qf[i*2+1])  links[g.id] = 'W'+num(qf[i*2].id)+' x W'+num(qf[i*2+1].id); });
  if (fin[0] && !fin[0].desc && sf[0] && sf[1]) links[fin[0].id] = 'W'+num(sf[0].id)+' x W'+num(sf[1].id);
  if (tp[0]  && !tp[0].desc  && sf[0] && sf[1]) links[tp[0].id]  = 'L'+num(sf[0].id)+' x L'+num(sf[1].id);
  return links;
}

function groupComplete(letter) {
  const gs = DB.getGames().filter(g => g.phase === 'groups' && g.group === letter);
  return gs.length > 0 && gs.every(g => !!g.result);
}
function groupPos(letter, pos) {
  if (!GROUPS[letter]) return null;
  const rows = computeStandings(letter, GROUPS[letter].teams);
  return rows[pos-1] ? rows[pos-1].team : null;
}

// Resolve um lado do confronto: W73/L73 (venc/perd jogo), 2A (posição grupo), 3ABCDF (melhor 3º)
function resolveSlot(token) {
  token = (token || '').trim();
  const mWL = token.match(/^([WL])(\d+)$/i);
  if (mWL) {
    const isW = mWL[1].toUpperCase() === 'W';
    const src = DB.getGames().find(g => g.id === 'j'+mWL[2]);
    if (src && src.result) {
      const hs = src.result.home_score, as = src.result.away_score;
      const team = isW ? (hs>as?src.home:as>hs?src.away:null) : (hs<as?src.home:as<hs?src.away:null);
      if (team) return {name:team, flag:flag(team), sub:'Jogo '+mWL[2], resolved:true};
    }
    return {name:(isW?'Vencedor':'Perdedor'), flag:(isW?'🏆':'🥈'), sub:'Jogo '+mWL[2], resolved:false};
  }
  const mP = token.match(/^([123])([A-L])$/);
  if (mP) {
    const pos = parseInt(mP[1]), letter = mP[2];
    if (groupComplete(letter)) {
      const t = groupPos(letter, pos);
      if (t) return {name:t, flag:flag(t), sub:pos+'º Grupo '+letter, resolved:true};
    }
    return {name:pos+'º Grupo '+letter, flag:'🏳️', sub:'', resolved:false};
  }
  const m3 = token.match(/^3([A-L]{2,})$/);
  if (m3) return {name:'3º colocado', flag:'🏳️', sub:'('+m3[1].split('').join('/')+')', resolved:false};
  return {name:token||'A definir', flag:'⚪', sub:'', resolved:false};
}

function teamRow(slot, score, won) {
  return '<div class="b-team '+(won?'winner':'')+(slot.resolved?'':' pending')+'">' +
    '<span class="b-flag">'+slot.flag+'</span>' +
    '<span class="b-name">'+slot.name+(slot.sub?'<span class="b-sub">'+slot.sub+'</span>':'')+'</span>' +
    '<span class="b-score">'+(score===''?'':score)+'</span></div>';
}

function renderBracketMatch(game) {
  const hasResult = !!game.result;
  let slotA, slotB;
  if (game.home && game.away) {
    slotA = {name:game.home, flag:flag(game.home), sub:'', resolved:true};
    slotB = {name:game.away, flag:flag(game.away), sub:'', resolved:true};
  } else {
    const desc = game.desc || _links[game.id];
    if (desc && desc.indexOf(' x ') > -1) {
      const parts = desc.split(' x ');
      slotA = resolveSlot(parts[0]);
      slotB = resolveSlot(parts[1]);
    } else {
      return renderTbdMatch();
    }
  }
  const scoreA = hasResult ? game.result.home_score : '';
  const scoreB = hasResult ? game.result.away_score : '';
  const aWon = hasResult && game.result.home_score > game.result.away_score;
  const bWon = hasResult && game.result.away_score > game.result.home_score;
  const d = new Date(game.date);
  const dateStr = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}) + ', ' +
                  d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  return '<div class="b-match '+(hasResult?'has-result':'')+'">' +
    '<div class="b-date">📅 '+dateStr+(game.city?' · '+game.city:'')+'</div>' +
    teamRow(slotA, scoreA, aWon) +
    teamRow(slotB, scoreB, bWon) +
    '</div>';
}

function renderTbdMatch(label='A definir') {
  return `
  <div class="b-match tbd">
    <div class="b-tbd">⏳ ${label}</div>
  </div>`;
}

window.showTab = function(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tabGroups').style.display = tab === 'groups' ? 'block' : 'none';
  document.getElementById('tabBracket').style.display = tab === 'bracket' ? 'block' : 'none';
};

render();
}};
