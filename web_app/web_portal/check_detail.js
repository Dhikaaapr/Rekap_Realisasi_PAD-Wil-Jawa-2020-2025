import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://xerkytrweahuniqrnabi.supabase.co',
  'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7'
);

async function main() {
  const lines = [];
  const log = (msg) => { lines.push(msg); };

  // Check which Jawa regions have detail data in years 2021-2024
  const jawaRegions = [
    'Prov. DKI Jakarta', 'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. Jawa Timur',
    'Prov. Banten', 'Prov. DI Yogyakarta',
    'Kab. Tangerang', 'Kota Bandung', 'Kota Surabaya', 'Kota Semarang', 'Kota Bekasi', 'Kota Depok',
  ];

  for (const year of [2021, 2022, 2023, 2024, 2025]) {
    log(`\n=== Year ${year} ===`);
    
    // Get all unique regions with detail data this year
    let allDetail = [];
    let from = 0;
    while (true) {
      const { data } = await supabase
        .from('detail_pad_data')
        .select('daerah')
        .eq('tahun', year)
        .range(from, from + 999);
      if (!data || data.length === 0) break;
      allDetail = allDetail.concat(data);
      if (data.length < 1000) break;
      from += 1000;
    }
    
    const uniqueRegions = [...new Set(allDetail.map(d => d.daerah))].sort();
    log(`Total unique regions with detail: ${uniqueRegions.length}`);
    
    // Check for Jawa regions specifically
    const jawaKeywords = ['jawa', 'jakarta', 'dki', 'banten', 'yogyakarta', 'diy',
      'bandung', 'bogor', 'bekasi', 'depok', 'tangerang', 'surabaya', 'semarang', 'malang'];
    
    const jawaDetail = uniqueRegions.filter(r => {
      const l = r.toLowerCase();
      return jawaKeywords.some(k => l.includes(k));
    });
    log(`Jawa-related regions with detail: ${jawaDetail.length}`);
    jawaDetail.forEach(r => {
      const count = allDetail.filter(d => d.daerah === r).length;
      log(`  ${r}: ${count} records`);
    });
    
    // Also check "Provinsi" vs "Prov." naming
    const provRegions = uniqueRegions.filter(r => r.startsWith('Provinsi'));
    if (provRegions.length > 0) {
      log(`\n  Regions with "Provinsi" prefix:`);
      provRegions.forEach(r => {
        const count = allDetail.filter(d => d.daerah === r).length;
        log(`    ${r}: ${count}`);
      });
    }
  }

  // Check source Excel files for potential LRA data
  log(`\n=== Checking for LRA source files ===`);

  writeFileSync('check_detail_years.txt', lines.join('\n'));
  console.log(`Done. Check check_detail_years.txt`);
}

main().catch(console.error);
