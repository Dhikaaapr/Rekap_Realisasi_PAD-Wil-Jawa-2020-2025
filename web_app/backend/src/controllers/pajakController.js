const supabase = require('../config/supabase');

// --- PAJAK PROVINSI ---

exports.getProvinsi = async (req, res) => {
  try {
    const { year, region } = req.query;
    let query = supabase.from('pajak_provinsi').select('*');
    if (year) query = query.eq('tahun', year);
    if (region) query = query.eq('daerah', region);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upsertProvinsi = async (req, res) => {
  try {
    const { records } = req.body; // Expect array of records
    const { data, error } = await supabase
      .from('pajak_provinsi')
      .upsert(records, { onConflict: 'daerah, tahun' })
      .select();
    
    if (error) throw error;
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- PAJAK KABUPATEN/KOTA ---

exports.getKabKota = async (req, res) => {
  try {
    const { year, region } = req.query;
    let query = supabase.from('pajak_kabupaten_kota').select('*, pbjt_objek(*)');
    if (year) query = query.eq('tahun', year);
    if (region) query = query.eq('daerah', region);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upsertKabKota = async (req, res) => {
  try {
    const { record, pbjt_items } = req.body; 
    
    // 1. Upsert main KabKota record
    const { data: mainData, error: mainError } = await supabase
      .from('pajak_kabupaten_kota')
      .upsert(record, { onConflict: 'daerah, tahun' })
      .select()
      .single();
    
    if (mainError) throw mainError;

    // 2. If PBJT items provided, upsert them
    if (pbjt_items && Array.isArray(pbjt_items)) {
      const itemsToUpsert = pbjt_items.map(item => ({
        ...item,
        pajak_kabkota_id: mainData.id
      }));
      
      const { error: pbjtError } = await supabase
        .from('pbjt_objek')
        .upsert(itemsToUpsert, { onConflict: 'pajak_kabkota_id, jenis' }); // Need to add unique constraint for this to work well
        
      if (pbjtError) throw pbjtError;
    }

    res.json({ success: true, data: mainData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
