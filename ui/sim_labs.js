// ui/sim_labs.js — Simulation clinique : « autres paramètres » de la consigne du médecin (bilan sanguin à lire, radio du thorax à décrire).
// Exercice de raisonnement, HORS SCORE : l'étudiant fait une lecture sommaire (trop bas / normal / trop haut ; ce que je vois sur l'image),
// le médecin interprète et décide. Valeurs et image FICTIVES, à valider avec ton formateur et ton cours.
// Données : scn.rx.labs(c) → { bio: { title, intro, rows:[{id,name,unit,val,ref,lo,hi,why}], note }, radio: { title, intro, svg, items:[{id,t,yes,why}], note } }
'use strict';
window.App = window.App || {};

App.SimLabs = (() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmt = n => String(n).replace('.', ',');
  const kindOf = r => r.val < r.lo ? 'low' : (r.val > r.hi ? 'high' : 'ok');
  const LAB = { low: 'Trop bas', ok: 'Normal', high: 'Trop haut' };

  function _bio(cfg, st) {
    const a = (st && st.a) || {}, n = cfg.rows.length, done = cfg.rows.filter(r => a[r.id]).length;
    const rows = cfg.rows.map(r => {
      const k = kindOf(r), ch = a[r.id], good = ch === k;
      const span = (r.hi - r.lo), min = r.lo - span * 0.9, max = r.hi + span * 0.9, pos = Math.max(2, Math.min(98, 100 * (r.val - min) / (max - min)));
      const zl = 100 * (r.lo - min) / (max - min), zw = 100 * span / (max - min);
      const gauge = `<div class="lab-g" aria-hidden="true"><i class="lab-z" style="left:${zl.toFixed(1)}%;width:${zw.toFixed(1)}%"></i>${ch ? `<b class="lab-m ${k === 'ok' ? 'ok' : 'bad'}" style="left:${pos.toFixed(1)}%"></b>` : ''}</div>`;
      const btns = ['low', 'ok', 'high'].map(x => `<button type="button" class="lab-b ${ch === x ? (good ? 'good' : 'bad') : ''}" ${ch ? 'disabled' : ''} onclick="App.Sim.rxLab('${r.id}','${x}')">${LAB[x]}</button>`).join('');
      return `<div class="lab-r ${ch ? (good ? 'is-good' : 'is-bad') : ''}"><div class="lab-h"><span class="lab-n">${esc(r.name)}</span><span class="lab-v">${fmt(r.val)} <small>${esc(r.unit)}</small></span><span class="lab-ref">normale : ${esc(r.ref)}</span></div>
        ${gauge}<div class="lab-bs" role="group" aria-label="${esc(r.name)}">${btns}</div>
        ${ch ? `<div class="lab-fb ${good ? 'good' : 'avoid'}">${good ? '✓ ' : '✗ C\'est « ' + LAB[k].toLowerCase() + ' ». '}${esc(r.why)}</div>` : ''}</div>`;
    }).join('');
    return `<div class="lab-card"><div class="lab-t">🧪 ${esc(cfg.title)} <span class="lab-cnt">${done}/${n}</span></div><p class="sim-muted sim-small">${esc(cfg.intro)}</p>${rows}<p class="sim-muted sim-small">${esc(cfg.note)}</p></div>`;
  }

  function _radio(cfg, st) {
    const sel = (st && st.sel) || {}, chk = !!(st && st.checked);
    const items = cfg.items.map(it => {
      const on = !!sel[it.id], good = chk && (on === !!it.yes);
      return `<div class="lab-it ${chk ? (good ? 'is-good' : 'is-bad') : ''}"><label class="lab-lb"><input type="checkbox" ${on ? 'checked' : ''} ${chk ? 'disabled' : ''} onchange="App.Sim.rxRadioTog('${it.id}')"><span>${esc(it.t)}</span></label>
        ${chk ? `<div class="lab-fb ${good ? 'good' : 'avoid'}">${good ? '✓ ' : (it.yes ? '✗ Tu l\'as manqué : ' : '✗ Ce n\'est pas sur cette image : ')}${esc(it.why)}</div>` : ''}</div>`;
    }).join('');
    const nOk = chk ? cfg.items.filter(it => !!sel[it.id] === !!it.yes).length : 0;
    return `<div class="lab-card"><div class="lab-t">🩻 ${esc(cfg.title)}${chk ? ` <span class="lab-cnt">${nOk}/${cfg.items.length}</span>` : ''}</div><p class="sim-muted sim-small">${esc(cfg.intro)}</p>
      <div class="lab-xr" role="img" aria-label="${esc(cfg.alt || 'Radio du thorax simulée')}">${cfg.svg}</div>
      <div class="lab-its">${items}</div>
      ${chk ? '' : `<div class="sim-row"><button type="button" class="btn btn-primary btn-sm" onclick="App.Sim.rxRadioCheck()">Vérifier ma description</button></div>`}
      <p class="sim-muted sim-small">${esc(cfg.note)}</p></div>`;
  }

  function html(cfg, st) {
    if (!cfg) return '';
    return `<div class="lab-wrap">${cfg.bio ? _bio(cfg.bio, st && st.labs) : ''}${cfg.radio ? _radio(cfg.radio, st && st.radio) : ''}</div>`;
  }
  return { html, kindOf };
})();
