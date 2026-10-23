const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { self: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../static/calculator.js'), 'utf8'), context);
const calc = context.self.RollCalculator;

test('Komma und Punkt ergeben denselben Preis in ganzen Cent', () => {
  assert.equal(calc.parse('3,99', 'price'), 399);
  assert.equal(calc.parse('3.99', 'price'), 399);
  assert.equal(calc.parse(' 3,9 ', 'price'), 390);
});
test('Ungültige, negative und übergroße Werte werden abgewiesen', () => {
  for (const value of ['0', '-1', '1e3', '1.5', 'Infinity', '', '1000001']) assert.equal(calc.parse(value, 'count'), null);
  for (const value of ['0', '-1', '3,999', 'NaN', '1.000,00', '1000000.01']) assert.equal(calc.parse(value, 'price'), null);
  assert.equal(calc.calculate({ rolls: '0', sheets: '100', price: '3' }), null);
});
test('Unterschiedliche Packungsgrößen werden nach ungerundetem Blattpreis verglichen', () => {
  const a = calc.calculate({ rolls: '8', sheets: '200', price: '3,99' });
  const b = calc.calculate({ rolls: '4', sheets: '100', price: '0,99' });
  assert.equal(a.total, 1600);
  assert.equal(a.perSheet, 399 / 1600);
  assert.ok(b.perSheet < a.perSheet);
  assert.ok(Math.abs((a.perSheet / b.perSheet - 1) * 100 - 0.75757575757576) < 1e-10);
});
test('Gleiche Blattpreise werden auch bei doppelter Packung als gleich erkannt', () => {
  const a = calc.calculate({ rolls: '8', sheets: '200', price: '3,99' });
  const b = calc.calculate({ rolls: '16', sheets: '200', price: '7,98' });
  assert.ok(calc.isEqual(a.perSheet, b.perSheet));
  assert.equal(calc.isEqual(a.perSheet, 99 / 400), false);
});

test('Referenzen nutzen die angegebenen Normalpreise pro Blatt', () => {
  assert.equal(calc.calculate(calc.references.toilet).perSheet, 375 / 2200);
  assert.equal(calc.calculate(calc.references.kitchen).perSheet, 275 / 296);
});
test('Referenzvergleich erkennt günstigere, teurere und gleiche Blattpreise', () => {
  const reference = calc.calculate(calc.references.toilet).perSheet;
  assert.ok(Math.abs(calc.percentDifference(reference / 2, reference) + 50) < 1e-10);
  assert.ok(Math.abs(calc.percentDifference(reference * 1.2, reference) - 20) < 1e-10);
  assert.equal(calc.percentDifference(750 / 4400, reference), 0);
  const kitchen = calc.calculate(calc.references.kitchen).perSheet;
  assert.ok(calc.percentDifference(reference, kitchen) < -80);
});
