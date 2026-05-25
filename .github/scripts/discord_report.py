#!/usr/bin/env python3
"""
Rapport Discord quotidien — Révision IFSI
Lit les données depuis le Gist GitHub et envoie un rapport à Discord.
Lancé automatiquement par GitHub Actions à 17h00 (heure de Paris).
"""

import os, json, urllib.request, urllib.error, datetime, sys

# ── Variables d'environnement (GitHub Secrets) ─────────────────
GIST_TOKEN      = os.environ.get('GIST_TOKEN', '')
GIST_ID         = os.environ.get('GIST_ID', '')
DISCORD_WEBHOOK = os.environ.get('DISCORD_WEBHOOK', '')
GIST_FILENAME   = 'ifsi-srs-data.json'

def fail(msg):
    print(f'ERREUR : {msg}', file=sys.stderr)
    sys.exit(1)

if not DISCORD_WEBHOOK:
    fail('DISCORD_WEBHOOK secret manquant.')
if not GIST_TOKEN or not GIST_ID:
    fail('GIST_TOKEN ou GIST_ID secret manquant.')

# ── Lecture du Gist ────────────────────────────────────────────
print(f'Lecture du Gist {GIST_ID}...')
req = urllib.request.Request(
    f'https://api.github.com/gists/{GIST_ID}',
    headers={
        'Authorization': f'token {GIST_TOKEN}',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'revision-ifsi-bot'
    }
)
try:
    with urllib.request.urlopen(req) as r:
        gist_data = json.loads(r.read())
except urllib.error.HTTPError as e:
    fail(f'GitHub API {e.code} : {e.read().decode()}')

files = gist_data.get('files', {})
if GIST_FILENAME not in files:
    fail(f'Fichier {GIST_FILENAME} introuvable dans le Gist.')

raw = files[GIST_FILENAME].get('content', '')
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    fail('Impossible de parser le JSON du Gist.')

study_log = data.get('studyLog', {})
progress  = data.get('progress', {})   # { cardId: { nextReview, easeFactor, ... } }

# ── Date d'aujourd'hui (Paris ~ UTC+2 en été, +1 en hiver) ────
# On utilise l'heure UTC du runner + offset approximatif
utc_now   = datetime.datetime.utcnow()
paris_now = utc_now + datetime.timedelta(hours=2)   # CEST (été)
today_str = paris_now.date().isoformat()
print(f'Date Paris : {today_str}')

# ── Stats du jour ──────────────────────────────────────────────
entry    = study_log.get(today_str, {})
reviewed = entry.get('reviewed', 0)
ok       = entry.get('ok',       0)
hard     = entry.get('hard',     0)
nope     = entry.get('nope',     0)
seconds  = entry.get('seconds',  0)
oral_min = entry.get('oral_min', 0) or (seconds // 60 if reviewed == 0 else 0)
# Si oral_min est dans seconds (nouveau format), on calcule
total_min = seconds // 60

# ── Streak ────────────────────────────────────────────────────
streak = 0
for i in range(365):
    d = (paris_now.date() - datetime.timedelta(days=i)).isoformat()
    if study_log.get(d, {}).get('reviewed', 0) > 0:
        streak += 1
    elif i > 0:
        break

# ── Cartes en retard (depuis progress) ───────────────────────
due_count = 0
for card_id, prog in progress.items():
    nr = prog.get('nextReview', today_str)
    if nr <= today_str:
        due_count += 1

# ── Construction du message ────────────────────────────────────
def fr_date(d):
    jours = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche']
    mois  = ['janvier','février','mars','avril','mai','juin',
             'juillet','août','septembre','octobre','novembre','décembre']
    return f'{jours[d.weekday()]} {d.day} {mois[d.month - 1]} {d.year}'

lines = []
lines.append(f'# 📋 Rapport du {fr_date(paris_now.date())}')
lines.append('')

# Bilan du jour
lines.append('## 📊 Bilan du jour')
if reviewed > 0:
    accuracy = round(ok / reviewed * 100)
    lines.append(f'Tu as révisé **{reviewed} carte{"s" if reviewed > 1 else ""}** aujourd\'hui.')
    lines.append(f'✅ {ok} réussies · ⚠️ {hard} difficiles · ❌ {nope} ratées · 🎯 **{accuracy}%**')
    if accuracy >= 85:
        lines.append('> Excellente session ! 🌟')
    elif accuracy >= 65:
        lines.append('> Bonne session dans l\'ensemble. 👍')
    else:
        lines.append('> Session difficile — c\'est normal, continue ! 💪')
else:
    lines.append('> Aucune révision aujourd\'hui encore — il reste du temps ! 🕔')

if total_min > 0:
    lines.append(f'⏱ Temps de révision : **{total_min} min**')

lines.append(f'🔥 Série actuelle : **{streak} jour{"s" if streak != 1 else ""}**')
lines.append('')

# Cartes en retard
lines.append('## 📚 Cartes en attente')
if due_count > 0:
    lines.append(f'**{due_count} carte{"s" if due_count > 1 else ""}** à réviser ce soir.')
    if due_count >= 20:
        lines.append('> ⚠️ Grosse session en vue — commence tôt !')
    elif due_count >= 10:
        lines.append('> Lance une session ce soir pour ne pas prendre de retard.')
    else:
        lines.append('> Petit effort ce soir et c\'est réglé !')
else:
    lines.append('✨ **Aucun retard** — toutes tes cartes sont à jour, bravo !')
lines.append('')

# Conseil
lines.append('## 💡 Conseil du soir')
if streak >= 7:
    lines.append(f'🏆 {streak} jours de suite — tu es en feu ! Maintiens cette régularité jusqu\'aux examens.')
elif streak >= 3:
    lines.append('🔥 Belle régularité ! La répétition espacée ne fonctionne que si tu reviens chaque jour.')
elif reviewed == 0:
    lines.append('📖 Pas encore révisé aujourd\'hui ? Même 10 minutes valent mieux que rien — lance une session !')
else:
    lines.append('📈 Reviens demain pour consolider ce que tu as appris aujourd\'hui.')
lines.append('')
lines.append('▶️ https://poli-21.github.io/revision-ifsi/')

message = '\n'.join(lines)
print(f'Message ({len(message)} chars) :\n{message[:300]}...')

# ── Envoi Discord (découpe si > 1900 chars) ───────────────────
LIMIT = 1900

def split_message(text):
    if len(text) <= LIMIT:
        return [text]
    chunks, current = [], ''
    for line in text.split('\n'):
        candidate = current + '\n' + line if current else line
        if len(candidate) > LIMIT:
            if current:
                chunks.append(current)
            current = line[:LIMIT] if len(line) > LIMIT else line
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks

for i, chunk in enumerate(split_message(message)):
    payload = json.dumps({'content': chunk, 'username': 'Revision IFSI'}).encode('utf-8')
    req = urllib.request.Request(
        DISCORD_WEBHOOK,
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as r:
            print(f'Chunk {i+1} envoyé — HTTP {r.status}')
    except urllib.error.HTTPError as e:
        fail(f'Discord API {e.code} : {e.read().decode()}')

print('✅ Rapport envoyé avec succès !')
