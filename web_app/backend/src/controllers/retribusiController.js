const supabase = require('../config/supabase');

exports.getRetribusi = async (req, res) => {
  try {
    const { year, region, kategori } = req.query;
    let query = supabase.from('retribusi').select('*, retribusi_detail(*)');
    if (year) query = query.eq('tahun', year);
    if (region) query = query.eq('daerah', region);
    if (kategori) query = query.eq('kategori', kategori);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.upsertRetribusi = async (req, res) => {
  try {
    const { record, details } = req.body;
    
    // 1. Upsert main Retribusi record (one of 3 categories)
    const { data: mainData, error: mainError } = await supabase
      .from('retribusi')
      .upsert(record, { onConflict: 'daerah, tahun, kategori' })
      .select()
      .single();
      
    if (mainError) throw mainError;

    // 2. Upsert details
    if (details && Array.isArray(details)) {
      const detailsToUpsert = details.map(d => ({
        ...d,
        retribusi_id: mainData.id
      }));
      
      const { error: detError } = await supabase
        .from('retribusi_detail')
        .upsert(detailsToUpsert); // Assumes details have IDs if updating
        
      if (detError) throw detError;
    }

    res.json({ success: true, data: mainData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
