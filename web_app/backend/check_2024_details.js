const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://xerkytrweahuniqrnabi.supabase.co', 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7');

async function check2024Details() {
  const { data, error } = await sb.from('pad_data')
    .select('daerah, pajak_realisasi, retribusi_realisasi, pengelolaan_realisasi, lain_pad_realisasi, pajak_anggaran, retribusi_anggaran, pengelolaan_anggaran, lain_pad_anggaran')
    .eq('tahun', 2024);
  
  if (error) {
    console.error(error);
    return;
  }
  
  const results = data.map(d => {
    const real = (d.pajak_realisasi || 0) + (d.retribusi_realisasi || 0) + (d.pengelolaan_realisasi || 0) + (d.lain_pad_realisasi || 0);
    const angg = (d.pajak_anggaran || 0) + (d.retribusi_anggaran || 0) + (d.pengelolaan_anggaran || 0) + (d.lain_pad_anggaran || 0);
    return { name: d.daerah, real, angg, percent: angg > 0 ? (real/angg)*100 : 0 };
  });
  
  results.sort((a,b) => b.percent - a.percent);
  
  console.log("TOP 10 % CAPAIAN:");
  results.slice(0, 10).forEach(r => {
    console.log(`${r.name}: ${r.percent.toFixed(2)}% (Real: ${r.real}, Angg: ${r.angg})`);
  });
  
  console.log("\nBOTTOM 5 % CAPAIAN (with angg > 0):");
  results.filter(r => r.angg > 0).slice(-5).forEach(r => {
    console.log(`${r.name}: ${r.percent.toFixed(2)}% (Real: ${r.real}, Angg: ${r.angg})`);
  });
}

check2024Details();
