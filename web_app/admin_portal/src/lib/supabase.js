import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xerkytrweahuniqrnabi.supabase.co';
const supabaseAnonKey = 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const JAWA_KABKOTA = [
  // Jawa Barat
  'bandung', 'bandung barat', 'bogor', 'bekasi', 'depok', 'cimahi', 'tasikmalaya',
  'cirebon', 'sukabumi', 'banjar', 'cianjur', 'garut', 'indramayu', 'karawang',
  'kuningan', 'majalengka', 'pangandaran', 'purwakarta', 'subang', 'sumedang', 'ciamis',
  // Banten
  'tangerang', 'serang', 'cilegon', 'lebak', 'pandeglang',
  // DKI Jakarta
  'jakarta', 'kepulauan seribu',
  // Jawa Tengah
  'semarang', 'surakarta', 'solo', 'magelang', 'pekalongan', 'salatiga', 'tegal',
  'banyumas', 'batang', 'blora', 'boyolali', 'brebes', 'cilacap', 'demak', 'grobogan',
  'jepara', 'kebumen', 'kendal', 'klaten', 'kudus', 'pati', 'pemalang', 'purbalingga',
  'purworejo', 'rembang', 'sragen', 'sukoharjo', 'temanggung', 'wonogiri', 'wonosobo',
  'banjarnegara', 'karanganyar',
  // DIY Yogyakarta
  'yogyakarta', 'sleman', 'bantul', 'kulon progo', 'gunung kidul',
  // Jawa Timur
  'surabaya', 'malang', 'batu', 'blitar', 'kediri', 'madiun', 'mojokerto',
  'pasuruan', 'probolinggo', 'bangkalan', 'banyuwangi', 'bojonegoro', 'bondowoso',
  'gresik', 'jember', 'jombang', 'lamongan', 'lumajang', 'magetan', 'nganjuk',
  'ngawi', 'pacitan', 'pamekasan', 'ponorogo', 'sampang', 'sidoarjo', 'situbondo',
  'sumenep', 'trenggalek', 'tuban', 'tulungagung',
];

const JAWA_PROV_KEYWORDS = ['jawa barat', 'jawa tengah', 'jawa timur', 'banten', 'dki jakarta', 'di yogyakarta', 'yogyakarta'];

// Non-Jawa regions that sneak in due to similar names
const NON_JAWA_EXCLUSIONS = ['batu bara', 'banjar baru', 'banjarbaru'];

function isJawaRegion(daerah) {
  if (!daerah) return false;
  const lower = daerah.toLowerCase().trim();
  
  // Exclude aggregates
  if (lower === 'jumlah' || lower.includes('total')) return false;

  // Exclude known non-Jawa
  if (NON_JAWA_EXCLUSIONS.some(ex => lower.includes(ex))) return false;

  // Check province-level
  if (JAWA_PROV_KEYWORDS.some(k => lower.includes(k))) return true;

  // Check kab/kota level fuzzy
  return JAWA_KABKOTA.some(k => lower.includes(k));
}

function normalizeDaerah(daerah) {
  if (!daerah) return daerah;
  return daerah.replace(/^Provinsi\s+/i, 'Prov. ');
}

export async function fetchAllRegions() {
  let allData = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('pad_data')
      .select('daerah')
      .order('daerah')
      .range(from, from + pageSize - 1);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  const regions = [...new Set(allData.map(d => normalizeDaerah(d.daerah)))];
  return regions.filter(isJawaRegion);
}

export async function fetchPadYears() {
  let allYears = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('pad_data')
      .select('tahun')
      .order('tahun', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allYears = allYears.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return [...new Set(allYears.map(d => d.tahun))];
}

export async function fetchDetailForEdit(daerah, tahun) {
  console.log(`[Admin] Fetching details for ${daerah} ${tahun}...`);
  const { data, error } = await supabase
    .from('detail_pad_data')
    .select('*, ref_kategori_pad(nama)')
    .eq('daerah', daerah)
    .eq('tahun', tahun)
    .order('kategori_kode');
  
  if (error) {
    console.error(`[Admin] Fetch error:`, error);
    throw error;
  }
  console.log(`[Admin] Received ${data?.length || 0} rows.`);
  return data;
}

export async function updateDetailRow(id, payload) {
  console.log(`[Admin] Updating row ${id}:`, payload);
  const { data, error } = await supabase
    .from('detail_pad_data')
    .update(payload)
    .eq('id', id);
  if (error) {
    console.error(`[Admin] Update error:`, error);
    throw error;
  }
  return data;
}

export async function upsertDetailRows(rows) {
  console.log(`[Admin] Upserting ${rows.length} rows...`);
  const { data, error } = await supabase
    .from('detail_pad_data')
    .upsert(rows, { onConflict: 'id' });
  
  if (error) {
    console.error(`[Admin] Upsert error:`, error);
    throw error;
  }
  return data;
}

// Add function to recalculate parent totals in pad_data table
export async function syncPadTotals(daerah, tahun) {
    // This is complex for client-side, normally better in edge function
    // But we'll implement a basic version for the Admin UI to call after edits
    const { data: details, error: detErr } = await supabase
        .from('detail_pad_data')
        .select('kategori_kode, anggaran, realisasi')
        .eq('daerah', daerah)
        .eq('tahun', tahun);
    
    if (detErr) throw detErr;

    // Find summary rows
    const findValue = (prefixes) => {
        for (const p of prefixes) {
            const row = details.find(d => d.kategori_kode === p);
            if (row) return { ang: row.anggaran, real: row.realisasi };
        }
        return { ang: 0, real: 0 };
    };

    const pajak = findValue(['4.1.0.1.0', '4.1.01', '4.1.1']);
    const retribusi = findValue(['4.1.0.2.0', '4.1.02', '4.1.2']);
    const pengelolaan = findValue(['4.1.0.3.0', '4.1.03', '4.1.3']);
    const lain = findValue(['4.1.0.4.0', '4.1.04', '4.1.4']);

    const { error: updErr } = await supabase
        .from('pad_data')
        .update({
            pajak_anggaran: pajak.ang,
            pajak_realisasi: pajak.real,
            retribusi_anggaran: retribusi.ang,
            retribusi_realisasi: retribusi.real,
            pengelolaan_anggaran: pengelolaan.ang,
            pengelolaan_realisasi: pengelolaan.real,
            lain_pad_anggaran: lain.ang,
            lain_pad_realisasi: lain.real
        })
        .eq('daerah', daerah)
        .eq('tahun', tahun);

    if (updErr) throw updErr;
}

export async function loginAdmin(username, password) {
  const { data, error } = await supabase
    .from('admin_accounts')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();
  
  if (error) throw new Error('Username atau Password salah bro!');
  return data;
}
