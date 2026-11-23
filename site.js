function element(tag, content) {
  const node = document.createElement(tag);
  node.textContent = content;
  return node;
}

const statusLabels = new Map([
  ['online', 'En línea'],
  ['offline', 'Fuera de línea'],
  ['degraded', 'Con incidencias'],
  ['unknown', 'Sin confirmar'],
]);
const rulesetLabels = new Map([
  ['roleplay', 'Rol'],
  ['roleplay-pvp', 'Rol PvP'],
  ['pvp', 'PvP'],
  ['normal', 'Normal'],
]);
const overall = document.querySelector('#server-overall');
const rulesets = document.querySelector('#server-rulesets');
const checked = document.querySelector('#server-checked');

function showStatus(node, value) {
  const status = statusLabels.has(value) ? value : 'unknown';
  node.dataset.status = status;
  node.textContent = statusLabels.get(status);
}

async function refreshServerStatus() {
  try {
    const response = await fetch('https://wowforeverstatus.com/status', {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('El rastreador no respondió correctamente');
    const data = await response.json();
    const timestamp = Date.parse(data.checkedAt);
    if (data.region !== 'US' || !Number.isFinite(timestamp) || Date.now() - timestamp > 5 * 60_000) {
      throw new Error('La consulta no tiene datos recientes para la región US');
    }

    const rows = (Array.isArray(data.rulesets) ? data.rulesets : []).map((ruleset) => {
      const row = element('li', '');
      const label = rulesetLabels.get(ruleset.id) || ruleset.name || 'Modalidad';
      const value = element('strong', '');
      showStatus(value, ruleset.status);
      row.append(element('span', label), value);
      return row;
    });

    showStatus(overall, data.status);
    rulesets.replaceChildren(...rows);
    rulesets.hidden = rows.length === 0;
    const time = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(timestamp);
    checked.textContent = data.manualOverride
      ? 'Aviso manual del rastreador · Verificado ' + time
      : 'Verificado ' + time;
  } catch {
    overall.dataset.status = 'unknown';
    overall.textContent = 'No disponible';
    rulesets.hidden = true;
    checked.textContent = 'Consulta la fuente para ver si hay una actualización.';
  } finally {
    window.setTimeout(refreshServerStatus, 60_000);
  }
}

refreshServerStatus();
