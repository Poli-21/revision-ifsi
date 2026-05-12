// ui/modal.js — Modales (ajout, détail, import/export)
'use strict';
window.App = window.App || {};

App.Modal = (() => {
  let _pendingImg = null;

  // ── Modal Ajout ────────────────────────────────────────────────
  function openAdd(prefillCat) {
    _pendingImg = null;
    document.getElementById('new-term').value    = '';
    document.getElementById('new-def').value     = '';
    document.getElementById('new-example').value = '';
    document.getElementById('new-cat-custom').style.display = 'none';
    document.getElementById('img-preview').style.display    = 'none';
    document.getElementById('img-placeholder').style.display = 'block';
    document.getElementById('img-remove-btn').style.display = 'none';
    document.getElementById('img-upload-zone').style.borderColor = 'var(--gray-300)';
    document.getElementById('new-img-input').value = '';
    // Populate catégories
    const cats = [...new Set(App.Store.state.cards.map(c => c.cat))].sort();
    const sel  = document.getElementById('new-cat');
    sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('') +
      '<option value="__new__">+ Nouvelle matière…</option>';
    if (prefillCat && cats.includes(prefillCat)) sel.value = prefillCat;
    document.getElementById('modal-overlay').classList.add('open');
    setTimeout(() => document.getElementById('new-term').focus(), 80);
  }

  function close() {
    document.getElementById('modal-overlay').classList.remove('open');
    _pendingImg = null;
  }

  function addCard(keepOpen) {
    const term = document.getElementById('new-term').value.trim();
    const def  = document.getElementById('new-def').value.trim();
    const ex   = document.getElementById('new-example').value.trim();
    let cat    = document.getElementById('new-cat').value;
    if (cat === '__new__') {
      cat = document.getElementById('new-cat-custom').value.trim();
      if (!cat) { alert('Saisis le nom de la nouvelle matière.'); document.getElementById('new-cat-custom').focus(); return; }
    }
    if (!cat)  { alert('Choisis ou crée une matière.'); return; }
    if (!term || !def) { alert('Le terme et la définition sont requis.'); return; }
    App.Store.state.cards.push({ id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2), cat, term, def, example: ex || null, customImage: _pendingImg || null, suspended: false, progress: null });
    App.Store.save();
    App.Render.all();
    if (keepOpen) {
      document.getElementById('new-term').value = '';
      document.getElementById('new-def').value  = '';
      document.getElementById('new-example').value = '';
      // L'image est conservée pour la carte suivante
      document.getElementById('new-term').focus();
      // Feedback
      const btn = document.querySelector('.btn-add-continue');
      if (btn) { const o = btn.textContent; btn.textContent = '✓ Ajoutée !'; setTimeout(() => btn.textContent = o, 1100); }
    } else { close(); }
  }

  // ── Modal Détail ───────────────────────────────────────────────
  function openDetail(id) {
    const c = App.Store.state.cards.find(x => x.id === id);
    if (!c) return;
    const { SRS } = App;
    const level  = SRS.getLevel(c);
    const ef     = c.progress ? c.progress.easeFactor : '—';
    const reps   = c.progress ? c.progress.repetitions : 0;
    const next   = c.progress ? c.progress.nextReview : 'Jamais';
    const hist   = (c.progress?.history || []).slice(-5).reverse();
    const histHTML = hist.length
      ? hist.map(h => `<tr><td>${h.date}</td><td>${['Raté','','','Difficile','Su','Facile'][h.quality] || h.quality}</td><td>J+${h.interval}</td><td>${h.ef}</td></tr>`).join('')
      : '<tr><td colspan="4" style="color:var(--gray-400)">Pas encore révisée</td></tr>';
    document.getElementById('detail-modal-body').innerHTML = `
      <div style="margin-bottom:12px">
        <span class="badge badge-blue">${_esc(c.cat)}</span>
        <span class="badge" style="background:${SRS.COLORS[level]}22;color:${SRS.COLORS[level]}">${SRS.LABELS[level]}</span>
        ${c.suspended ? '<span class="badge" style="background:#f3f4f6;color:#9ca3af">⏸ Suspendu</span>' : ''}
      </div>
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:10px">${_esc(c.term)}</h3>
      <div style="font-size:.9rem;color:var(--gray-700);line-height:1.65;margin-bottom:10px;white-space:pre-wrap">${_esc(c.def)}</div>
      ${c.example ? `<div style="font-style:italic;font-size:.84rem;color:var(--gray-500);border-left:3px solid var(--primary-light);padding-left:10px;margin-bottom:14px">${_esc(c.example)}</div>` : ''}
      ${c.customImage ? `<img src="${c.customImage}" style="max-height:200px;max-width:100%;object-fit:contain;border-radius:8px;margin-bottom:14px;display:block">` : ''}
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px">
        <div class="detail-stat"><div class="detail-stat-n">${ef}</div><div class="detail-stat-l">Ease Factor</div></div>
        <div class="detail-stat"><div class="detail-stat-n">${reps}</div><div class="detail-stat-l">Révisions</div></div>
        <div class="detail-stat"><div class="detail-stat-n">${next}</div><div class="detail-stat-l">Prochaine révision</div></div>
        <div class="detail-stat"><div class="detail-stat-n">${c.progress ? 'J+' + c.progress.interval : '—'}</div><div class="detail-stat-l">Intervalle actuel</div></div>
      </div>
      <h4 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--gray-400);margin-bottom:8px">Historique récent</h4>
      <table style="width:100%;font-size:.8rem;border-collapse:collapse">
        <thead><tr style="color:var(--gray-400)"><th style="text-align:left;padding:4px 0">Date</th><th>Résultat</th><th>Intervalle</th><th>EF</th></tr></thead>
        <tbody>${histHTML}</tbody>
      </table>
      <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="App.Modal.openEdit('${c.id}')">✏️ Modifier</button>
        <button class="btn btn-ghost btn-sm" onclick="App.Modal.suspendCard('${c.id}')">${c.suspended ? '▶ Réactiver' : '⏸ Suspendre'}</button>
        <button class="btn btn-ghost btn-sm" onclick="App.Modal.resetCard('${c.id}')" style="color:var(--warning)">↺ Réinitialiser</button>
        <button class="btn btn-ghost btn-sm" onclick="App.Modal.deleteCardFromDetail('${c.id}')" style="color:var(--danger)">✕ Supprimer</button>
      </div>`;
    document.getElementById('detail-overlay').classList.add('open');
  }

  // ── Édition d'une carte ────────────────────────────────────────
  function openEdit(id) {
    const c = App.Store.state.cards.find(x => x.id === id);
    if (!c) return;
    const cats = [...new Set(App.Store.state.cards.map(x => x.cat))].sort();
    const catOptions = cats.map(cat =>
      `<option value="${_esc(cat)}" ${cat === c.cat ? 'selected' : ''}>${_esc(cat)}</option>`
    ).join('') + '<option value="__new__">+ Nouvelle matière…</option>';

    document.getElementById('detail-modal-body').innerHTML = `
      <div class="form-group">
        <label>Terme *</label>
        <input type="text" id="edit-term" value="${_esc(c.term)}" placeholder="Terme">
      </div>
      <div class="form-group">
        <label>Définition *</label>
        <textarea id="edit-def" style="min-height:110px">${_esc(c.def)}</textarea>
      </div>
      <div class="form-group">
        <label>Exemple / contexte (optionnel)</label>
        <input type="text" id="edit-example" value="${_esc(c.example || '')}">
      </div>
      <div class="form-group">
        <label>Matière</label>
        <select id="edit-cat" onchange="App.Modal._editToggleCat()">${catOptions}</select>
        <input type="text" id="edit-cat-custom" placeholder="Nom de la nouvelle matière…"
          style="display:none;margin-top:5px;width:100%;padding:8px 11px;border:1px solid var(--primary);border-radius:8px;font-size:.88rem;font-family:inherit;box-shadow:0 0 0 3px var(--primary-light)">
      </div>
      <div class="form-group">
        <label>Image</label>
        ${c.customImage
          ? `<div style="margin-bottom:8px"><img src="${c.customImage}" style="max-height:120px;max-width:100%;object-fit:contain;border-radius:6px;display:block;margin-bottom:6px">
             <button type="button" class="btn btn-ghost btn-sm" onclick="App.Modal._editRemoveImg('${id}')">✕ Supprimer l'image</button></div>`
          : ''}
        <div id="edit-img-zone" onclick="document.getElementById('edit-img-input').click()"
          style="border:2px dashed var(--gray-300);border-radius:8px;padding:12px;text-align:center;cursor:pointer;background:var(--gray-50);font-size:.84rem;color:var(--gray-400)">
          📷 ${c.customImage ? 'Remplacer l\'image' : 'Ajouter une image'}
          <span style="display:block;font-size:.72rem;margin-top:2px">JPG, PNG, WEBP</span>
        </div>
        <input type="file" id="edit-img-input" accept="image/*" style="display:none" onchange="App.Modal._editImgSelect(event,'${id}')">
        <div id="edit-img-preview-wrap" style="display:none;margin-top:8px"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px;justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-ghost" onclick="App.Modal.openDetail('${id}')">← Annuler</button>
        <button class="btn btn-primary" onclick="App.Modal.saveEdit('${id}')">💾 Enregistrer</button>
      </div>`;
  }

  function _editToggleCat() {
    const v = document.getElementById('edit-cat').value;
    const custom = document.getElementById('edit-cat-custom');
    if (custom) { custom.style.display = v === '__new__' ? 'block' : 'none'; if (v === '__new__') custom.focus(); }
  }

  let _editPendingImg = null;

  function _editImgSelect(e, id) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900, q = 0.72;
        const ratio  = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        _editPendingImg = canvas.toDataURL('image/jpeg', q);
        const wrap = document.getElementById('edit-img-preview-wrap');
        if (wrap) {
          wrap.innerHTML = `<img src="${_editPendingImg}" style="max-height:120px;max-width:100%;object-fit:contain;border-radius:6px;display:block;margin-bottom:6px">
            <button type="button" class="btn btn-ghost btn-sm" onclick="App.Modal._editCancelNewImg()">✕ Annuler cette image</button>`;
          wrap.style.display = 'block';
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function _editCancelNewImg() {
    _editPendingImg = null;
    const wrap = document.getElementById('edit-img-preview-wrap');
    if (wrap) { wrap.innerHTML = ''; wrap.style.display = 'none'; }
    document.getElementById('edit-img-input').value = '';
  }

  function _editRemoveImg(id) {
    const c = App.Store.state.cards.find(x => x.id === id);
    if (!c) return;
    if (!confirm('Supprimer l\'image de cette carte ?')) return;
    c.customImage = null;
    App.Store.save();
    openEdit(id);
  }

  function saveEdit(id) {
    const c = App.Store.state.cards.find(x => x.id === id);
    if (!c) return;
    const term = document.getElementById('edit-term')?.value.trim();
    const def  = document.getElementById('edit-def')?.value.trim();
    const ex   = document.getElementById('edit-example')?.value.trim();
    let cat    = document.getElementById('edit-cat')?.value;
    if (cat === '__new__') {
      cat = document.getElementById('edit-cat-custom')?.value.trim();
      if (!cat) { alert('Saisis le nom de la nouvelle matière.'); return; }
    }
    if (!term) { alert('Le terme est requis.'); document.getElementById('edit-term')?.focus(); return; }
    if (!def)  { alert('La définition est requise.'); document.getElementById('edit-def')?.focus(); return; }
    c.term    = term;
    c.def     = def;
    c.example = ex || null;
    c.cat     = cat;
    if (_editPendingImg) { c.customImage = _editPendingImg; _editPendingImg = null; }
    App.Store.save();
    App.Render.all();
    openDetail(id);   // retour à la vue détail avec les nouvelles valeurs
  }

  function closeDetail() { document.getElementById('detail-overlay').classList.remove('open'); }

  function suspendCard(id) {
    const c = App.Store.state.cards.find(x => x.id === id);
    if (!c) return;
    c.suspended = !c.suspended;
    App.Store.save();
    closeDetail();
    App.Render.all();
  }

  function resetCard(id) {
    if (!confirm('Réinitialiser la progression de cette carte ?')) return;
    const c = App.Store.state.cards.find(x => x.id === id);
    if (!c) return;
    c.progress = null;
    App.Store.save();
    closeDetail();
    App.Render.all();
  }

  function deleteCard(id, event) {
    if (event) event.stopPropagation();
    const c = App.Store.state.cards.find(x => x.id === id);
    if (!c || !confirm(`Supprimer "${c.term}" ?`)) return;
    App.Store.state.cards = App.Store.state.cards.filter(x => x.id !== id);
    App.Store.save();
    App.Render.all();
  }

  function deleteCardFromDetail(id) {
    closeDetail();
    deleteCard(id, null);
  }

  // ── Image upload ───────────────────────────────────────────────
  function handleImgSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert('Image trop lourde (max 8 Mo).'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = ev => _compressAndSet(ev.target.result);
    reader.readAsDataURL(file);
  }

  function _compressAndSet(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const MAX = 900, q = 0.72;
      const ratio  = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      _pendingImg = canvas.toDataURL('image/jpeg', q);
      document.getElementById('img-preview').src          = _pendingImg;
      document.getElementById('img-preview').style.display = 'block';
      document.getElementById('img-placeholder').style.display = 'none';
      document.getElementById('img-remove-btn').style.display  = 'block';
      document.getElementById('img-upload-zone').style.borderColor = 'var(--primary)';
    };
    img.src = dataUrl;
  }

  function _removeImg(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    _pendingImg = null;
    document.getElementById('img-preview').src           = '';
    document.getElementById('img-preview').style.display = 'none';
    document.getElementById('img-placeholder').style.display = 'block';
    document.getElementById('img-remove-btn').style.display  = 'none';
    document.getElementById('img-upload-zone').style.borderColor = 'var(--gray-300)';
    document.getElementById('new-img-input').value = '';
  }

  function toggleNewCat() {
    const v = document.getElementById('new-cat').value;
    document.getElementById('new-cat-custom').style.display = v === '__new__' ? 'block' : 'none';
    if (v === '__new__') document.getElementById('new-cat-custom').focus();
  }

  // ── Export / Import ────────────────────────────────────────────
  function exportJSON() {
    const blob = new Blob([JSON.stringify(App.Store.state.cards, null, 2)], { type: 'application/json' });
    _download(blob, `ifsi_cartes_${App.SRS.todayStr()}.json`);
  }

  function exportCSV() {
    const rows = [['id','cat','terme','definition','exemple','easeFactor','interval','nextReview']];
    App.Store.state.cards.forEach(c => {
      rows.push([c.id, c.cat, c.term, c.def, c.example||'',
        c.progress?.easeFactor||'', c.progress?.interval||'', c.progress?.nextReview||'']);
    });
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    _download(blob, `ifsi_cartes_${App.SRS.todayStr()}.csv`);
  }

  function importJSON() { document.getElementById('import-input').click(); }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error();
        const existIds = new Set(App.Store.state.cards.map(c => c.id));
        let added = 0;
        imported.forEach(c => { if (!existIds.has(c.id)) { App.Store.state.cards.push(c); added++; } });
        App.Store.save();
        App.Render.all();
        alert(`✅ ${added} carte(s) importée(s) (${imported.length - added} déjà présente(s))`);
      } catch { alert('Fichier invalide.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function _download(blob, name) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return {
    openAdd, close, addCard,
    openDetail, closeDetail, openEdit, saveEdit, suspendCard, resetCard, deleteCard, deleteCardFromDetail,
    _editToggleCat, _editImgSelect, _editCancelNewImg, _editRemoveImg,
    handleImgSelect, removeImg: _removeImg, toggleNewCat,
    exportJSON, exportCSV, importJSON, handleImport
  };
})();
