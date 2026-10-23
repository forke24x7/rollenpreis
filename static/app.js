(() => {
  const $ = selector => document.querySelector(selector);
  const calc = RollCalculator;
  const number = (value, digits = 2) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const integer = value => new Intl.NumberFormat('de-DE').format(value);
  const blank = () => ({ name: '', rolls: '', sheets: '', price: '' });
  let state = { category: 'toilet', toilet: [blank(), blank()], kitchen: [blank(), blank()] };
  let storageOK = true;
  try {
    const saved = JSON.parse(localStorage.getItem('rollenpreis-v1'));
    if (saved && ['toilet', 'kitchen'].every(key => Array.isArray(saved[key]) && saved[key].length >= 2 && saved[key].length <= 20 && saved[key].every(offer => offer && ['name', 'rolls', 'sheets', 'price'].every(field => typeof offer[field] === 'string' && offer[field].length <= 80)))) {
      state = { ...saved, category: saved.category === 'kitchen' ? 'kitchen' : 'toilet' };
    }
  } catch { storageOK = false; }
  function save() {
    try { localStorage.setItem('rollenpreis-v1', JSON.stringify(state)); storageOK = true; } catch { storageOK = false; }
    storageStatus();
  }
  function storageStatus() {
    $('#storage-message').hidden = storageOK;
    $('#storage-message').textContent = 'Speichern auf diesem Gerät nicht möglich. Die Werte bleiben nur bis zum Schließen erhalten.';
    $('#offline-status').textContent = !navigator.onLine ? 'Offline · bereit zum Rechnen' : storageOK ? 'Lokal gespeichert' : 'Nicht gespeichert';
  }
  function title(index) { return state[state.category][index].name.trim() || `Angebot ${index + 1}`; }
  function update() {
    const reference = calc.references[state.category];
    const referenceResult = calc.calculate(reference);
    $('#reference-name').textContent = reference.name;
    $('#reference-pack').textContent = `${reference.rolls} Rollen × ${reference.sheets} Blatt · ${reference.price} €`;
    $('#reference-price').textContent = `${number(referenceResult.perSheet)} ct`;
    const offers = state[state.category];
    const results = offers.map(offer => calc.calculate(offer));
    const valid = results.filter(Boolean);
    const best = valid.length ? Math.min(...valid.map(result => result.perSheet)) : null;
    const winners = results.map((result, index) => result && calc.isEqual(result.perSheet, best) ? index : -1).filter(index => index >= 0);
    const summary = $('#summary');
    summary.classList.toggle('has-result', valid.length > 0);
    summary.replaceChildren();
    const info = document.createElement('div');
    const label = document.createElement('p'); label.className = 'summary-label';
    label.textContent = valid.length >= 2 ? (winners.length > 1 ? 'GLEICHER BESTPREIS' : 'GÜNSTIGSTES ANGEBOT') : valid.length ? 'DEIN BLATTPREIS' : 'DEIN PREISVERGLEICH';
    const heading = document.createElement('h2'); heading.textContent = valid.length ? winners.map(title).join(' & ') : 'Was kostet ein Blatt?';
    const detail = document.createElement('p'); detail.className = 'summary-detail';
    detail.textContent = valid.length >= 2 ? `${valid.length} Angebote im Vergleich` : valid.length ? 'Ein weiteres Angebot zum Vergleichen eingeben.' : 'Rollen, Blätter und Packungspreis eingeben.';
    info.append(label, heading, detail); summary.append(info);
    const value = document.createElement('div'); value.className = 'summary-value';
    const strong = document.createElement('strong'); strong.textContent = best === null ? '—' : `${number(best)} ct`;
    const unit = document.createElement('span'); unit.textContent = 'pro Blatt'; value.append(strong, unit); summary.append(value);
    document.querySelectorAll('.offer').forEach((card, index) => {
      const result = results[index];
      const winner = result && valid.length >= 2 && winners.includes(index);
      card.classList.toggle('best', Boolean(winner));
      card.querySelector('.offer-badge').textContent = winner ? (winners.length > 1 ? 'Gleicher Bestpreis' : 'Bester Preis') : `ANGEBOT ${String(index + 1).padStart(2, '0')}`;
      card.querySelector('.result-number').textContent = result ? `${number(result.perSheet)} ct` : '—';
      card.querySelector('.result-detail').textContent = result ? `${number(result.perSheet)} € / 100 Blatt · ${integer(result.total)} Blatt gesamt` : 'pro Blatt';
      const difference = card.querySelector('.difference');
      difference.textContent = result && valid.length >= 2 ? winner ? '✓ Günstigster Blattpreis' : `+${number((result.perSheet / best - 1) * 100, 1)} % zum Bestpreis` : '';
      const referenceDifference = card.querySelector('.reference-difference');
      const percent = result ? calc.percentDifference(result.perSheet, referenceResult.perSheet) : null;
      referenceDifference.hidden = percent === null;
      referenceDifference.classList.toggle('cheaper', percent !== null && percent < 0);
      referenceDifference.classList.toggle('dearer', percent !== null && percent > 0);
      referenceDifference.textContent = percent === null ? '' : percent === 0 ? `Gleicher Blattpreis wie ${reference.name}` : `${Math.abs(percent) < 0.05 ? 'Weniger als 0,1' : number(Math.abs(percent), 1)} % ${percent < 0 ? 'günstiger' : 'teurer'} als ${reference.name}`;
      card.querySelectorAll('[data-field]').forEach(input => {
        const invalid = input.dataset.field !== 'name' && input.value.trim() !== '' && calc.parse(input.value, input.dataset.field === 'price' ? 'price' : 'count') === null;
        input.setAttribute('aria-invalid', String(invalid));
      });
      const invalidFields = ['rolls', 'sheets', 'price'].filter(field => offers[index][field].trim() && calc.parse(offers[index][field], field === 'price' ? 'price' : 'count') === null);
      card.querySelector('.field-error').textContent = invalidFields.length ? 'Positive ganze Stückzahlen und einen Preis mit höchstens zwei Nachkommastellen eingeben.' : '';
    });
    $('#offer-count').textContent = offers.length;
    $('#add').disabled = offers.length >= 20;
  }
  function render() {
    document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
    $('#offers').replaceChildren();
    state[state.category].forEach((offer, index) => {
      const card = document.createElement('article'); card.className = 'offer'; card.setAttribute('aria-label', `Angebot ${index + 1}`);
      card.innerHTML = `<div class="offer-top"><span class="offer-badge"></span><button class="remove" aria-label="Angebot ${index + 1} entfernen" title="Angebot entfernen">×</button></div><label class="name-field">Name <span>(optional)</span><input class="offer-name" data-field="name" maxlength="80" aria-label="Name für Angebot ${index + 1} (optional)" placeholder="Angebot ${index + 1}"></label><div class="fields"><label>Rollen<input data-field="rolls" inputmode="numeric" type="text" maxlength="7" autocomplete="off" placeholder="z. B. 8"></label><span class="multiply" aria-hidden="true">×</span><label>Blatt je Rolle<input data-field="sheets" inputmode="numeric" type="text" maxlength="7" autocomplete="off" placeholder="z. B. 200"></label><label class="price-field">Packungspreis<div class="price-input"><input data-field="price" inputmode="decimal" type="text" maxlength="12" autocomplete="off" placeholder="z. B. 3,99"><span aria-hidden="true">€</span></div></label></div><p class="field-error" role="status"></p><div class="result"><div><span class="result-label">PREIS PRO BLATT</span><strong class="result-number"></strong><span class="result-detail"></span></div><span class="difference"></span></div><p class="reference-difference" hidden></p>`;
      card.querySelectorAll('[data-field]').forEach(input => {
        input.value = offer[input.dataset.field];
        input.addEventListener('input', () => { offer[input.dataset.field] = input.value; save(); update(); });
      });
      const remove = card.querySelector('.remove'); remove.disabled = state[state.category].length <= 2;
      remove.addEventListener('click', () => { state[state.category].splice(index, 1); save(); render(); $('#add').focus(); });
      $('#offers').append(card);
    });
    update();
  }
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { state.category = button.dataset.category; save(); render(); }));
  $('#add').addEventListener('click', () => { state[state.category].push(blank()); save(); render(); $('#offers').lastElementChild.querySelector('.offer-name').focus(); });
  $('#reset').addEventListener('click', () => { $('#reset-message').textContent = `Alle Angebote für ${state.category === 'toilet' ? 'Klorollen' : 'Küchenrollen'} werden auf diesem Gerät geleert.`; $('#reset-dialog').returnValue = 'cancel'; $('#reset-dialog').showModal(); });
  $('#reset-dialog').addEventListener('close', () => { if ($('#reset-dialog').returnValue === 'reset') { state[state.category] = [blank(), blank()]; save(); render(); } });
  $('#version').textContent = `v${APP_VERSION}`;
  window.addEventListener('online', storageStatus); window.addEventListener('offline', storageStatus);
  render(); storageStatus();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {
    $('#storage-message').hidden = false;
    $('#storage-message').textContent = 'Offline-Modus nicht verfügbar. Zum Einrichten die App über HTTPS öffnen.';
  });
})();
