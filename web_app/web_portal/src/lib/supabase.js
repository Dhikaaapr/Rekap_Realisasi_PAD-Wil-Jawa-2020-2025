import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xerkytrweahuniqrnabi.supabase.co';
const supabaseAnonKey = 'sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// JAWA 119 WHITELIST (EXACT MATCH)
// Matches User's Database exactly.
// Total 119 entries = 6 Provinsi + 113 Kab/Kota
// =============================================

/** Canonical 119 Jawa region names, matching the database exactly */
export const JAWA_WHITELIST = new Set([
  // === 6 PROVINSI ===
  'DKI Jakarta',
  'Prov. Banten',
  'Prov. Jawa Barat',
  'Prov. Jawa Tengah',
  'Prov. DI Yogyakarta',
  'Prov. Jawa Timur',

  // === BANTEN (4 Kab + 4 Kota = 8) ===
  'Kab. Lebak',
  'Kab. Pandeglang',
  'Kab. Serang',
  'Kab. Tangerang',
  'Kota Cilegon',
  'Kota Serang',
  'Kota Tangerang',
  'Kota Tangerang Selatan',

  // === JAWA BARAT (18 Kab + 9 Kota = 27) ===
  'Kab. Bandung',
  'Kab. Bandung Barat',
  'Kab. Bekasi',
  'Kab. Bogor',
  'Kab. Ciamis',
  'Kab. Cianjur',
  'Kab. Cirebon',
  'Kab. Garut',
  'Kab. Indramayu',
  'Kab. Karawang',
  'Kab. Kuningan',
  'Kab. Majalengka',
  'Kab. Pangandaran',
  'Kab. Purwakarta',
  'Kab. Subang',
  'Kab. Sukabumi',
  'Kab. Sumedang',
  'Kab. Tasikmalaya',
  'Kota Bandung',
  'Kota Banjar',
  'Kota Bekasi',
  'Kota Bogor',
  'Kota Cimahi',
  'Kota Cirebon',
  'Kota Depok',
  'Kota Sukabumi',
  'Kota Tasikmalaya',

  // === JAWA TENGAH (29 Kab + 6 Kota = 35) ===
  'Kab. Banjarnegara',
  'Kab. Banyumas',
  'Kab. Batang',
  'Kab. Blora',
  'Kab. Boyolali',
  'Kab. Brebes',
  'Kab. Cilacap',
  'Kab. Demak',
  'Kab. Grobogan',
  'Kab. Jepara',
  'Kab. Karanganyar',
  'Kab. Kebumen',
  'Kab. Kendal',
  'Kab. Klaten',
  'Kab. Kudus',
  'Kab. Magelang',
  'Kab. Pati',
  'Kab. Pekalongan',
  'Kab. Pemalang',
  'Kab. Purbalingga',
  'Kab. Purworejo',
  'Kab. Rembang',
  'Kab. Semarang',
  'Kab. Sragen',
  'Kab. Sukoharjo',
  'Kab. Tegal',
  'Kab. Temanggung',
  'Kab. Wonogiri',
  'Kab. Wonosobo',
  'Kota Magelang',
  'Kota Pekalongan',
  'Kota Salatiga',
  'Kota Semarang',
  'Kota Surakarta',
  'Kota Tegal',

  // === DI YOGYAKARTA (4 Kab + 1 Kota = 5) ===
  'Kab. Bantul',
  'Kab. Gunung Kidul',
  'Kab. Kulon Progo',
  'Kab. Sleman',
  'Kota Yogyakarta',

  // === JAWA TIMUR (29 Kab + 9 Kota = 38) ===
  'Kab. Bangkalan',
  'Kab. Banyuwangi',
  'Kab. Blitar',
  'Kab. Bojonegoro',
  'Kab. Bondowoso',
  'Kab. Gresik',
  'Kab. Jember',
  'Kab. Jombang',
  'Kab. Kediri',
  'Kab. Lamongan',
  'Kab. Lumajang',
  'Kab. Madiun',
  'Kab. Magetan',
  'Kab. Malang',
  'Kab. Mojokerto',
  'Kab. Nganjuk',
  'Kab. Ngawi',
  'Kab. Pacitan',
  'Kab. Pamekasan',
  'Kab. Pasuruan',
  'Kab. Ponorogo',
  'Kab. Probolinggo',
  'Kab. Sampang',
  'Kab. Sidoarjo',
  'Kab. Situbondo',
  'Kab. Sumenep',
  'Kab. Trenggalek',
  'Kab. Tuban',
  'Kab. Tulungagung',
  'Kota Batu',
  'Kota Blitar',
  'Kota Kediri',
  'Kota Madiun',
  'Kota Malang',
  'Kota Mojokerto',
  'Kota Pasuruan',
  'Kota Probolinggo',
  'Kota Surabaya',
]);

/** Map alternate DB names → canonical name */
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

/** Province → Kab/Kota mapping for drill-down */
export const PROVINCE_KABKOTA = {
  'DKI Jakarta': [], // Jakarta is its own single entry in this 119 dataset
  'Prov. Banten': [
    'Kab. Lebak', 'Kab. Pandeglang', 'Kab. Serang', 'Kab. Tangerang',
    'Kota Cilegon', 'Kota Serang', 'Kota Tangerang', 'Kota Tangerang Selatan',
  ],
  'Prov. Jawa Barat': [
    'Kab. Bandung', 'Kab. Bandung Barat', 'Kab. Bekasi', 'Kab. Bogor',
    'Kab. Ciamis', 'Kab. Cianjur', 'Kab. Cirebon', 'Kab. Garut',
    'Kab. Indramayu', 'Kab. Karawang', 'Kab. Kuningan', 'Kab. Majalengka',
    'Kab. Pangandaran', 'Kab. Purwakarta', 'Kab. Subang', 'Kab. Sukabumi',
    'Kab. Sumedang', 'Kab. Tasikmalaya',
    'Kota Bandung', 'Kota Banjar', 'Kota Bekasi', 'Kota Bogor',
    'Kota Cimahi', 'Kota Cirebon', 'Kota Depok', 'Kota Sukabumi', 'Kota Tasikmalaya',
  ],
  'Prov. Jawa Tengah': [
    'Kab. Banjarnegara', 'Kab. Banyumas', 'Kab. Batang', 'Kab. Blora',
    'Kab. Boyolali', 'Kab. Brebes', 'Kab. Cilacap', 'Kab. Demak',
    'Kab. Grobogan', 'Kab. Jepara', 'Kab. Karanganyar', 'Kab. Kebumen',
    'Kab. Kendal', 'Kab. Klaten', 'Kab. Kudus', 'Kab. Magelang',
    'Kab. Pati', 'Kab. Pekalongan', 'Kab. Pemalang', 'Kab. Purbalingga',
    'Kab. Purworejo', 'Kab. Rembang', 'Kab. Semarang', 'Kab. Sragen',
    'Kab. Sukoharjo', 'Kab. Tegal', 'Kab. Temanggung', 'Kab. Wonogiri', 'Kab. Wonosobo',
    'Kota Magelang', 'Kota Pekalongan', 'Kota Salatiga', 'Kota Semarang',
    'Kota Surakarta', 'Kota Tegal',
  ],
  'Prov. DI Yogyakarta': [
    'Kab. Bantul', 'Kab. Gunung Kidul', 'Kab. Kulon Progo', 'Kab. Sleman',
    'Kota Yogyakarta',
  ],
  'Prov. Jawa Timur': [
    'Kab. Bangkalan', 'Kab. Banyuwangi', 'Kab. Blitar', 'Kab. Bojonegoro',
    'Kab. Bondowoso', 'Kab. Gresik', 'Kab. Jember', 'Kab. Jombang',
    'Kab. Kediri', 'Kab. Lamongan', 'Kab. Lumajang', 'Kab. Madiun',
    'Kab. Magetan', 'Kab. Malang', 'Kab. Mojokerto', 'Kab. Nganjuk',
    'Kab. Ngawi', 'Kab. Pacitan', 'Kab. Pamekasan', 'Kab. Pasuruan',
    'Kab. Ponorogo', 'Kab. Probolinggo', 'Kab. Sampang', 'Kab. Sidoarjo',
    'Kab. Situbondo', 'Kab. Sumenep', 'Kab. Trenggalek', 'Kab. Tuban', 'Kab. Tulungagung',
    'Kota Batu', 'Kota Blitar', 'Kota Kediri', 'Kota Madiun',
    'Kota Malang', 'Kota Mojokerto', 'Kota Pasuruan', 'Kota Probolinggo', 'Kota Surabaya',
  ],
};

/**
 * Normalize daerah name to its canonical form.
 * Returns null if daerah is not a Jawa region.
 */
function normalizeDaerah(daerah) {
  if (!daerah) return null;

  // Direct whitelist match
  if (JAWA_WHITELIST.has(daerah)) return daerah;

  // Check alternate names
  if (ALTERNATE_NAMES[daerah]) return ALTERNATE_NAMES[daerah];

  // Not a valid Jawa region
  return null;
}

/**
 * Fetch all PAD data, filtered to exactly 119 Jawa regions.
 * Uses whitelist for zero false positives and zero false negatives.
 */
export async function fetchPadData(year = null) {
  let allData = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    let query = supabase.from('pad_data').select('*').order('daerah').range(from, from + pageSize - 1);
    if (year) query = query.eq('tahun', year);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // Filter & normalize to canonical Jawa names only
  const jawaData = [];
  for (const d of allData) {
    const canonical = normalizeDaerah(d.daerah);
    if (canonical) {
      jawaData.push({ ...d, daerah: canonical });
    }
  }

  // Deduplicate: keep record with higher total realisasi per daerah+tahun
  const seen = new Map();
  jawaData.forEach(d => {
    const key = `${d.daerah}|${d.tahun}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, d);
    } else {
      const existTot = (existing.pajak_realisasi || 0) + (existing.retribusi_realisasi || 0) + (existing.pengelolaan_realisasi || 0) + (existing.lain_pad_realisasi || 0);
      const newTot = (d.pajak_realisasi || 0) + (d.retribusi_realisasi || 0) + (d.pengelolaan_realisasi || 0) + (d.lain_pad_realisasi || 0);
      if (newTot > existTot) {
        seen.set(key, d);
      }
    }
  });

  const dedupedData = [...seen.values()];
  console.log(`[Supabase] Fetched ${allData.length} total -> ${jawaData.length} Jawa -> ${dedupedData.length} deduplicated (119 wilayah target)`);
  return dedupedData;
}

/**
 * Fetch detail data for a specific region and year
 * Paginates automatically if > 1000 rows
 */
export async function fetchDetailData(year, region) {
  let allData = [];
  let from = 0;
  const pageSize = 1000;

  // Try exact match first
  while (true) {
    const { data, error } = await supabase
      .from('detail_pad_data')
      .select('*, ref_kategori_pad(nama, kategori_utama, sub_kategori)')
      .eq('tahun', year)
      .eq('daerah', region)
      .order('kategori_kode')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  // If no data and region starts with "Prov.", try "Provinsi" version too
  if (allData.length === 0 && (region.startsWith('Prov. ') || region === 'DKI Jakarta')) {
    const altNames = [
      region.replace('Prov. ', 'Provinsi '),
      region === 'DKI Jakarta' ? 'Prov. DKI Jakarta' : null,
      region === 'DKI Jakarta' ? 'Provinsi DKI Jakarta' : null,
      region === 'DKI Jakarta' ? 'Jakarta' : null,
    ].filter(Boolean);

    for (const alt of altNames) {
      from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('detail_pad_data')
          .select('*, ref_kategori_pad(nama, kategori_utama, sub_kategori)')
          .eq('tahun', year)
          .eq('daerah', alt)
          .order('kategori_kode')
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      if (allData.length > 0) break;
    }
  }

  return allData;
}

/**
 * Fetch available years from the data
 */
export async function fetchAvailableYears() {
  const { data, error } = await supabase
    .from('pad_data')
    .select('tahun')
    .order('tahun', { ascending: false });

  if (error) throw error;
  const years = [...new Set(data.map(d => d.tahun))];
  return years;
}

/**
 * Fetch summary statistics for a given year
 */
export async function fetchSummaryStats(year) {
  const { data, error } = await supabase
    .from('pad_data')
    .select('daerah, pajak_realisasi, retribusi_realisasi, pengelolaan_realisasi, lain_pad_realisasi, pajak_anggaran, retribusi_anggaran, pengelolaan_anggaran, lain_pad_anggaran')
    .eq('tahun', year);

  if (error) throw error;

  // Filter to Jawa whitelist only
  const jawaData = data.filter(d => normalizeDaerah(d.daerah) !== null);

  const totals = jawaData.reduce((acc, curr) => ({
    totalRealisasi: acc.totalRealisasi + (curr.pajak_realisasi || 0) + (curr.retribusi_realisasi || 0) + (curr.pengelolaan_realisasi || 0) + (curr.lain_pad_realisasi || 0),
    totalAnggaran: acc.totalAnggaran + (curr.pajak_anggaran || 0) + (curr.retribusi_anggaran || 0) + (curr.pengelolaan_anggaran || 0) + (curr.lain_pad_anggaran || 0),
    totalPajak: acc.totalPajak + (curr.pajak_realisasi || 0),
    totalRetribusi: acc.totalRetribusi + (curr.retribusi_realisasi || 0),
    totalPengelolaan: acc.totalPengelolaan + (curr.pengelolaan_realisasi || 0),
    totalLain: acc.totalLain + (curr.lain_pad_realisasi || 0),
  }), { totalRealisasi: 0, totalAnggaran: 0, totalPajak: 0, totalRetribusi: 0, totalPengelolaan: 0, totalLain: 0 });

  return { ...totals, totalDaerah: jawaData.length };
}

/**
 * Fetch detail data for multiple CATEGORIES across ALL regions 
 */
export async function fetchDetailDataByCategory(year, categoryKodes = []) {
  if (!categoryKodes || categoryKodes.length === 0) return [];

  let allData = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    let query = supabase
      .from('detail_pad_data')
      .select('daerah, tahun, realisasi, anggaran, kategori_kode')
      .in('kategori_kode', categoryKodes)
      .range(from, from + pageSize - 1);
      
    if (year && year !== 'all') {
      query = query.eq('tahun', year);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allData;
}

/**
 * Fetch reference categories
 */
export async function fetchKategoriPad() {
  const { data, error } = await supabase
    .from('ref_kategori_pad')
    .select('*')
    .order('kode');

  if (error) throw error;
  return data;
}
