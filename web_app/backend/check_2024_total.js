const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://xerkytrweahuniqrnabi.supabase.co', 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7');

async function check2024Total() {
  const { data, error } = await sb.from('pad_data')
    .select('daerah, pajak_realisasi, retribusi_realisasi, pengelolaan_realisasi, lain_pad_realisasi, pajak_anggaran, retribusi_anggaran, pengelolaan_anggaran, lain_pad_anggaran')
    .eq('tahun', 2024);
  
  if (error) {
    console.error(error);
    return;
  }

  // Use the same normalization and deduplication logic as in supabase.js
  const JAWA_WHITELIST = new Set([
    'DKI Jakarta', 'Prov. Banten', 'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. DI Yogyakarta', 'Prov. Jawa Timur'
    // ... ignoring kab/kota for now just to see province-level or total
  ]);
  const ALTERNATE_NAMES = {
    'Prov. DKI Jakarta': 'DKI Jakarta',
    'Provinsi DKI Jakarta': 'DKI Jakarta',
    'Jakarta': 'DKI Jakarta',
    'DKI JAKARTA': 'DKI Jakarta',
    'PROVINSI DKI JAKARTA': 'DKI Jakarta',
    'Provinsi Banten': 'Prov. Banten',
    'Provinsi Jawa Barat': 'Prov. Jawa Barat',
    'Provinsi Jawa Tengah': 'Prov. Jawa Tengah',
    'Provinsi DI Yogyakarta': 'Prov. DI Yogyakarta',
    'Provinsi Jawa Timur': 'Prov. Jawa Timur',
    'DI Yogyakarta': 'Prov. DI Yogyakarta',
  };

  const seen = new Map();
  data.forEach(d => {
    let canon = d.daerah;
    if (ALTERNATE_NAMES[d.daerah]) canon = ALTERNATE_NAMES[d.daerah];
    
    // Check if it's one of the 6 provinces
    if (['DKI Jakarta', 'Prov. Banten', 'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. DI Yogyakarta', 'Prov. Jawa Timur'].includes(canon)) {
        const existing = seen.get(canon);
        const real = (d.pajak_realisasi || 0) + (d.retribusi_realisasi || 0) + (d.pengelolaan_realisasi || 0) + (d.lain_pad_realisasi || 0);
        const angg = (d.pajak_anggaran || 0) + (d.retribusi_anggaran || 0) + (d.pengelolaan_anggaran || 0) + (d.lain_pad_anggaran || 0);
        
        if (!existing || real > existing.real) {
            seen.set(canon, { real, angg });
        }
    }
  });

  let totalR = 0;
  let totalA = 0;
  seen.forEach(v => {
    totalR += v.real;
    totalA += v.angg;
  });

  console.log(`TOTAL JAWA (SUM OF 6 PROVINCES):`);
  console.log(`Real: ${totalR}`);
  console.log(`Angg: ${totalA}`);
  console.log(`Percent: ${(totalR / totalA * 100).toFixed(2)}%`);

  // Now calculate based on 119 regions if possible
}

check2024Total();
