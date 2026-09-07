export function inferLeadScheduleTarget(accountCode: string, accountName: string): string {
  const code = String(accountCode || '').trim();
  const name = String(accountName || '').toLowerCase();

  if (/akumulasi.*penyusutan|accumulated depreciation/.test(name)) return 'WP-B.2';
  if (/pinjaman|utang bank|kredit bank|loan/.test(name)) return 'WP-D.1';
  if (/piutang|receivable/.test(name)) return 'WP-A.2';
  if (/persediaan|inventory/.test(name)) return 'WP-A.4';
  if (/uang muka|biaya dimuka|prepaid/.test(name)) return 'WP-A.5';
  if (/aset tetap|gedung|mesin|kendaraan|peralatan|fixed asset/.test(name)) return 'WP-B.1';
  if (/utang pajak|tax payable/.test(name)) return 'WP-C.2';
  if (/utang usaha|accounts payable|trade payable/.test(name)) return 'WP-C.1';
  if (/akrual|utang gaji|accrued/.test(name)) return 'WP-C.3';
  if (/modal|capital/.test(name)) return 'WP-E.1';
  if (/saldo laba|laba ditahan|retained/.test(name)) return 'WP-E.2';
  if (/harga pokok|beban pokok|hpp|cogs|cost of goods/.test(name)) return 'WP-F.2';
  if (/pendapatan|penjualan|revenue|sales/.test(name)) return 'WP-F.1';
  if (/beban|expense|gaji|sewa|utilitas/.test(name)) return 'WP-F.3';
  if (/kas|bank|cash/.test(name)) return 'WP-A.1';

  if (code.startsWith('10') || code.startsWith('11')) return 'WP-A.1';
  if (code.startsWith('12')) return 'WP-A.2';
  if (code.startsWith('13')) return 'WP-A.4';
  if (code.startsWith('14')) return 'WP-A.5';
  if (code.startsWith('15') || code.startsWith('16')) return 'WP-B.1';
  if (code.startsWith('20') || code.startsWith('21')) return 'WP-C.1';
  if (code.startsWith('22')) return 'WP-C.2';
  if (code.startsWith('23')) return 'WP-C.3';
  if (code.startsWith('25')) return 'WP-D.1';
  if (code.startsWith('30')) return 'WP-E.1';
  if (code.startsWith('31') || code.startsWith('32')) return 'WP-E.2';
  if (code.startsWith('4')) return 'WP-F.1';
  if (code.startsWith('5') || code.startsWith('6')) return 'WP-F.3';
  return 'WP-F.3';
}
