const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://xerkytrweahuniqrnabi.supabase.co', 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7');

async function checkProvinces() {
  const { data, error } = await sb.from('pad_data').select('*').eq('tahun', 2024);
  
  const alt = {
    'Provinsi DKI Jakarta': 'DKI Jakarta',
    'Prov. DKI Jakarta': 'DKI Jakarta',
    'Provinsi Banten': 'Prov. Banten',
    'Provinsi Jawa Barat': 'Prov. Jawa Barat',
    'Provinsi Jawa Tengah': 'Prov. Jawa Tengah',
    'Provinsi DI Yogyakarta': 'Prov. DI Yogyakarta',
    'Provinsi Jawa Timur': 'Prov. Jawa Timur'
  };

  const provs = ['DKI Jakarta', 'Prov. Banten', 'Prov. Jawa Barat', 'Prov. Jawa Tengah', 'Prov. DI Yogyakarta', 'Prov. Jawa Timur'];
  const stats = {};

  data.forEach(d => {
    const canon = alt[d.daerah] || d.daerah;
    if (provs.includes(canon)) {
      const real = (d.pajak_realisasi || 0) + (d.retribusi_realisasi || 0) + (d.pengelolaan_realisasi || 0) + (d.lain_pad_realisasi || 0);
      const angg = (d.pajak_anggaran || 0) + (d.retribusi_anggaran || 0) + (d.pengelolaan_anggaran || 0) + (d.lain_pad_anggaran || 0);
      
      if (!stats[canon] || real > stats[canon].real) {
        stats[canon] = { real, angg, originalDaerah: d.daerah };
      }
    }
  });

  console.log("=== RINCIAN CAPAIAN PROVINSI 2024 ===");
  Object.entries(stats).forEach(([name, s]) => {
    const pct = (s.real / s.angg) * 100;
    console.log(`${name}: ${pct.toFixed(2)}% (Real: ${s.real.toLocaleString()}, Target: ${s.angg.toLocaleString()})`);
  });
}

checkProvinces();
