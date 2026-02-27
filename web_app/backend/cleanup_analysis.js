const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || 'https://xerkytrweahuniqrnabi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAll(table, selectCols) {
  let allData = [], from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(selectCols).order('id').range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return allData;
}

async function main() {
  const lines = [];
  const log = (msg) => { lines.push(msg); console.log(msg); };
  
  const allRows = await fetchAll('detail_pad_data', 'id, daerah, tahun, kategori_kode, anggaran, realisasi');
  log('Total rows: ' + allRows.length);
  
  const zeroRows = allRows.filter(r => (r.anggaran || 0) === 0 && (r.realisasi || 0) === 0);
  const nonZeroRows = allRows.filter(r => (r.anggaran || 0) !== 0 || (r.realisasi || 0) !== 0);
  log('Zero-value rows: ' + zeroRows.length);
  log('Non-zero rows: ' + nonZeroRows.length);
  
  const grouped = {};
  nonZeroRows.forEach(r => {
    const key = r.daerah + '|' + r.tahun + '|' + r.kategori_kode;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });
  
  const dups = Object.entries(grouped).filter(([, e]) => e.length > 1);
  log('Duplicate groups in non-zero: ' + dups.length);
  
  let dupsToDelete = 0;
  dups.forEach(([key, entries]) => {
    dupsToDelete += entries.length - 1;
  });
  
  log('Total IDs to delete: ' + (zeroRows.length + dupsToDelete));
  log('Expected final count: ' + (allRows.length - zeroRows.length - dupsToDelete));
  
  // Per year breakdown
  const yearCounts = {};
  allRows.forEach(r => {
    if (!yearCounts[r.tahun]) yearCounts[r.tahun] = { total: 0, zero: 0, nonZero: 0 };
    yearCounts[r.tahun].total++;
  });
  zeroRows.forEach(r => yearCounts[r.tahun].zero++);
  nonZeroRows.forEach(r => yearCounts[r.tahun].nonZero++);
  
  log('\nPer Year Breakdown:');
  Object.entries(yearCounts).sort((a,b) => a[0]-b[0]).forEach(([y, c]) => {
    log('  ' + y + ': ' + c.total + ' total, ' + c.zero + ' zero, ' + c.nonZero + ' non-zero');
  });
  
  fs.writeFileSync('cleanup_report.txt', lines.join('\n'), 'utf8');
}

main().catch(e => console.error(e));
