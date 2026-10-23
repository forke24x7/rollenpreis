/* Integer cents avoid rounding errors when comparing package prices. */
self.RollCalculator = {
  parse(value, kind) {
    const text = String(value).trim();
    if (kind === 'price') {
      if (!/^\d+(?:[,.]\d{1,2})?$/.test(text)) return null;
      const [euros, cents = ''] = text.replace(',', '.').split('.');
      const amount = Number(euros) * 100 + Number(cents.padEnd(2, '0'));
      return Number.isSafeInteger(amount) && amount > 0 && amount <= 100000000 ? amount : null;
    }
    if (!/^\d+$/.test(text)) return null;
    const amount = Number(text);
    return Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000 ? amount : null;
  },
  calculate(offer) {
    const rolls = this.parse(offer.rolls, 'count');
    const sheets = this.parse(offer.sheets, 'count');
    const cents = this.parse(offer.price, 'price');
    return rolls && sheets && cents ? { total: rolls * sheets, perSheet: cents / (rolls * sheets), cents } : null;
  },
  isEqual(a, b) { return Math.abs(a - b) <= Math.max(a, b) * 1e-10; }
};
