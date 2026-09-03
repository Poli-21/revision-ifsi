// core/ai.js — Client Gemini : clé API, appel générique, + 3 fonctions dédiées
// (correction de réponse rédigée, génération de questions d'entraînement, chat tuteur).
// Appel direct depuis le navigateur avec la clé de l'utilisateur (comme le token
// GitHub de core/sync.js) : pas de serveur, la clé reste locale au navigateur.
'use strict';
window.App = window.App || {};

App.AI = (() => {
  const KEY           = 'ifsi_gemini_config';
  const DEFAULT_MODEL = 'gemini-3.8-flash';

  let config = { apiKey: '', model: DEFAULT_MODEL };

  function loadConfig() {
    try { config = { ...config, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch(e) {}
    if (!config.model) config.model = DEFAULT_MODEL;
  }
  function saveConfig()   { localStorage.setItem(KEY, JSON.stringify(config)); }
  function isConfigured() { return !!config.apiKey; }
  function setKey(k)      { config.apiKey = (k || '').trim(); saveConfig(); }
  function setModel(m)    { config.model  = (m || '').trim() || DEFAULT_MODEL; saveConfig(); }
  function getModel()     { return config.model || DEFAULT_MODEL; }
  function clear()        { config = { apiKey: '', model: DEFAULT_MODEL }; saveConfig(); }

  function _endpoint() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(getModel())}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  }

  // ── Appel générique ──────────────────────────────────────────────
  // contents: [{ role:'user'|'model', text }] — dernier message inclus dedans.
  async function _call(contents, { temperature = 0.6, maxTokens = 1024, systemText = '' } = {}) {
    if (!isConfigured()) throw new Error("Aucune clé API Gemini configurée — ajoute-la dans Réglages → Intelligence artificielle.");
    const body = {
      contents: contents.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      generationConfig: { temperature, maxOutputTokens: maxTokens }
    };
    if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };

    let res;
    try {
      res = await fetch(_endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch(e) {
      throw new Error("Impossible de joindre l'API Gemini (problème réseau).");
    }

    let data = null;
    try { data = await res.json(); } catch(e) {}

    if (!res.ok) {
      const msg = data?.error?.message || `Erreur HTTP ${res.status}`;
      if (res.status === 400 && /API.?key/i.test(msg)) throw new Error('Clé API invalide — vérifie-la dans Réglages → Intelligence artificielle.');
      if (res.status === 404) throw new Error(`Modèle "${getModel()}" introuvable. Vérifie le nom du modèle dans Réglages → IA (regarde le nom exact sur Google AI Studio, ex : gemini-3.8-flash).`);
      if (res.status === 429) throw new Error('Quota Gemini atteint pour le moment — réessaie dans quelques minutes.');
      throw new Error(msg);
    }

    const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason;
      throw new Error(reason ? `Réponse vide de Gemini (raison : ${reason}).` : 'Réponse vide de Gemini.');
    }
    return text;
  }

  async function testConnection() {
    try {
      const text = await _call([{ role: 'user', text: 'Réponds uniquement le mot OK, rien d\'autre.' }], { maxTokens: 10 });
      return { ok: true, msg: `Connecté ✓ (${getModel()}) — réponse : "${text.trim().slice(0, 40)}"` };
    } catch(e) {
      return { ok: false, msg: e.message };
    }
  }

  // ── 1. Correction de réponse rédigée ──────────────────────────────
  async function correctAnswer(question, answer, ueLabel) {
    const sys = "Tu es un formateur IFSI rigoureux et bienveillant qui corrige des copies d'étudiants infirmiers, dans le cadre du référentiel de formation infirmier 2026. Tu notes comme à un vrai partiel.";
    const prompt = `UE concernée : ${ueLabel || 'non précisée'}

Question posée :
"""${question}"""

Réponse de l'étudiant :
"""${answer}"""

Corrige cette réponse. Réponds STRICTEMENT selon ce format, une ligne par balise, sans rien ajouter avant ou après :
NOTE: [note sur 20, un nombre uniquement]
POINTS_FORTS: [2-3 points forts séparés par ;]
A_AMELIORER: [2-3 points à améliorer séparés par ;]
MANQUANT: [éléments de réponse attendus qui manquent, séparés par ; — écris "aucun" si rien ne manque]
COMMENTAIRE: [2-3 phrases de commentaire général]`;
    const raw = await _call([{ role: 'user', text: prompt }], { temperature: 0.4, maxTokens: 700, systemText: sys });
    return _parseCorrection(raw);
  }

  function _parseCorrection(raw) {
    const grab = (tag) => {
      const re = new RegExp(tag + ':\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)');
      const m = raw.match(re);
      return m ? m[1].trim() : '';
    };
    const noteStr = grab('NOTE');
    const noteNum = parseFloat((noteStr.match(/[\d.,]+/) || [''])[0].replace(',', '.'));
    return {
      note:        isNaN(noteNum) ? null : Math.max(0, Math.min(20, noteNum)),
      pointsForts: grab('POINTS_FORTS').split(';').map(s => s.trim()).filter(Boolean),
      aAmeliorer:  grab('A_AMELIORER').split(';').map(s => s.trim()).filter(Boolean),
      manquant:    grab('MANQUANT').split(';').map(s => s.trim()).filter(s => s && !/^aucun/i.test(s)),
      commentaire: grab('COMMENTAIRE'),
      raw
    };
  }

  // ── 2. Génération de questions d'entraînement ─────────────────────
  async function generatePracticeQuestions(ueLabel, n = 3) {
    const sys = "Tu es un formateur IFSI qui rédige des sujets de partiels, dans le cadre du référentiel de formation infirmier 2026.";
    const prompt = `Génère ${n} questions d'entraînement de type partiel pour l'UE "${ueLabel}", niveau étudiant infirmier de 1ère/2e année. Mélange des questions de cours à réponse courte et, si pertinent, une question de raisonnement clinique.
Réponds STRICTEMENT en JSON valide : un tableau d'objets {"question": "...", "reponse_attendue": "..."}. Aucun texte avant ou après, aucune balise markdown.`;
    const raw = await _call([{ role: 'user', text: prompt }], { temperature: 0.85, maxTokens: 1400, systemText: sys });
    return _parseJSONArray(raw);
  }

  function _parseJSONArray(raw) {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    try {
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr)) return arr.filter(x => x && x.question);
    } catch(e) {}
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        const arr = JSON.parse(m[0]);
        if (Array.isArray(arr)) return arr.filter(x => x && x.question);
      } catch(e) {}
    }
    throw new Error('Réponse de Gemini illisible — réessaie.');
  }

  // ── 3. Chat tuteur multi-tours ─────────────────────────────────────
  // history: [{role:'user'|'model', text}] — inclut déjà le dernier message utilisateur.
  async function chat(history) {
    const sys = "Tu es un tuteur pour un étudiant en IFSI (institut de formation en soins infirmiers, France, référentiel 2026). Réponds en français, de façon claire, pédagogique et concise (format chat, pas de longue dissertation sauf si demandé). Tu peux t'appuyer sur des exemples cliniques simples.";
    return _call(history, { temperature: 0.7, maxTokens: 800, systemText: sys });
  }

  loadConfig();
  return {
    DEFAULT_MODEL,
    loadConfig, isConfigured, setKey, setModel, getModel, clear,
    testConnection, correctAnswer, generatePracticeQuestions, chat,
    get config() { return config; }
  };
})();
