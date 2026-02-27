const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const s = createClient('https://xerkytrweahuniqrnabi.supabase.co', 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7');

async function main() {
  const lines = [];
  const log = (msg) => { lines.push(msg); };
  
  // 1. Get all ref categories
  log('=== REF_KATEGORI_PAD ===');
  const {data: refs} = await s.from('ref_kategori_pad').select('kode, nama, tingkat_pemerintahan, parent_kode, level').order('kode');
  refs.forEach(d => {
    const indent = '  '.repeat((d.level || 1) - 1);
    log(indent + 'L' + d.level + ' | ' + d.kode + ' | ' + d.nama + ' | ' + d.tingkat_pemerintahan + ' | parent:' + (d.parent_kode||'-'));
  });
  
  log('\n=== SAMPLE: Prov. Jawa Barat 2024 ===');
  const {data: prov} = await s.from('detail_pad_data').select('kategori_kode, anggaran, realisasi').eq('daerah','Prov. Jawa Barat').eq('tahun',2024).order('kategori_kode');
  prov.forEach(d => log('  ' + d.kategori_kode + ' | ang: ' + d.anggaran + ' | real: ' + d.realisasi));
  log('  Total rows: ' + prov.length);
  
  log('\n=== SAMPLE: Kab. Sidoarjo 2024 ===');
  const {data: kab} = await s.from('detail_pad_data').select('kategori_kode, anggaran, realisasi').eq('daerah','Kab. Sidoarjo').eq('tahun',2024).order('kategori_kode');
  kab.forEach(d => log('  ' + d.kategori_kode + ' | ang: ' + d.anggaran + ' | real: ' + d.realisasi));
  log('  Total rows: ' + kab.length);

  log('\n=== SAMPLE: DKI Jakarta 2024 ===');
  const {data: dki} = await s.from('detail_pad_data').select('kategori_kode, anggaran, realisasi').eq('daerah','DKI Jakarta').eq('tahun',2024).order('kategori_kode');
  dki.forEach(d => log('  ' + d.kategori_kode + ' | ang: ' + d.anggaran + ' | real: ' + d.realisasi));
  log('  Total rows: ' + dki.length);

  // Check unique kategori_kode across ALL data
  log('\n=== ALL UNIQUE kategori_kode in detail_pad_data ===');
  const {data: allCodes} = await s.from('detail_pad_data').select('kategori_kode').order('kategori_kode').limit(5000);
  const unique = [...new Set(allCodes.map(d => d.kategori_kode))];
  unique.forEach(c => log('  ' + c));
  log('  Total unique codes: ' + unique.length);
  
  // Check for duplicate records
  log('\n=== CHECK DUPLICATES ===');
  const {data: all} = await s.from('detail_pad_data').select('daerah, tahun, kategori_kode').order('daerah').limit(5000);
  const dupMap = {};
  all.forEach(d => {
    const key = d.daerah + '|' + d.tahun + '|' + d.kategori_kode;
    dupMap[key] = (dupMap[key] || 0) + 1;
  });
  let dupCount = 0;
  Object.entries(dupMap).forEach(function(entry) {
    if (entry[1] > 1) {
      dupCount++;
      if (dupCount <= 20) log('  DUP: ' + entry[0] + ' (' + entry[1] + ' entries)');
    }
  });
  log('  Total duplicate groups: ' + dupCount);
  
  // Check years
  log('\n=== YEARS WITH DETAIL DATA ===');
  const {data: years} = await s.from('detail_pad_data').select('tahun').order('tahun').limit(5000);
  const uniqueYears = [...new Set(years.map(d => d.tahun))];
  log('  Years: ' + uniqueYears.join(', '));

  for (const y of uniqueYears) {
    const {count} = await s.from('detail_pad_data').select('*', {count: 'exact', head: true}).eq('tahun', y);
    log('  Year ' + y + ': ' + count + ' rows');
  }

  fs.writeFileSync('db_check_result.txt', lines.join('\n'), 'utf8');
  console.log('Done! Output written to db_check_result.txt');
}

main().catch(e => console.error(e));
