import React from 'react';
const { useMemo } = React;
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar, 
  Cell, 
  PieChart, 
  Pie,
  LabelList
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  Map, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AiAnalysisPanel from './AiAnalysisPanel';

const Visualisasi = ({ 
  data, 
  chartDataProvinces = [], 
  chartDataKabKota = [], 
  activeInsight, 
  setActiveInsight, 
  aiAnalysisData,
  getProvinceName,
  selectedYear = 2025,
  activeMetric = 'rataRataPAD',
  metricLabel = 'PAD Total',
  isCompareMode = false,
  yearA,
  yearB,
  comparisonData = []
}) => {
  
  // Calculate Pie Data
  const currentProvince = activeInsight ? getProvinceName(activeInsight.daerah) : 'Jawa';
  
  const pieData = useMemo(() => {
    if (!activeInsight || activeInsight.tipe !== 'Provinsi') {
      const sumData = (type) => data.filter(d => d.tipe === type).reduce((acc, d) => acc + (d[activeMetric] || 0), 0);
      return [
        { name: 'Pemerintah Provinsi', value: sumData('Provinsi'), color: '#1e1b4b' },
        { name: 'Pemerintah Kabupaten', value: sumData('Kabupaten'), color: '#10b981' },
        { name: 'Pemerintah Kota', value: sumData('Kota'), color: '#3b82f6' },
      ].filter(d => d.value > 0);
    }
    
    // Filter children of the current province
    const children = data.filter(d => d.tipe !== 'Provinsi' && getProvinceName(d.daerah) === currentProvince);
    const sumChildren = (type) => children.filter(d => d.tipe === type).reduce((acc, d) => acc + (d[activeMetric] || 0), 0);
    
    return [
      { name: `Pemprov ${currentProvince}`, value: activeInsight[activeMetric] || 0, color: '#f59e0b' },
      { name: 'Seluruh Kabupaten', value: sumChildren('Kabupaten'), color: '#10b981' },
      { name: 'Seluruh Kota', value: sumChildren('Kota'), color: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, [data, activeInsight, currentProvince, getProvinceName, activeMetric]);

  // Helper for formatting
  const formatValue = (val) => {
    if (val >= 1e12) return `Rp ${(val/1e12).toFixed(2)} T`;
    if (val >= 1e9) return `Rp ${(val/1e9).toFixed(1)} M`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const formatShort = (val) => {
    if (val >= 1e12) return `${(val/1e12).toFixed(2)}T`;
    if (val >= 1e9) return `${(val/1e9).toFixed(1)}M`;
    return val.toLocaleString('id-ID');
  };

  // =====================
  // DYNAMIC ANALYSIS GENERATOR (Real-time from Database)
  // =====================
  const generateDynamicAnalysis = (item) => {
    if (!item) return null;

    if (isCompareMode) {
      const valA = item.valueA || 0;
      const valB = item.valueB || 0;
      const growth = item.growth || 0;
      const diff = valB - valA;
      
      return {
        title: `Analisis Komparatif: ${item.daerah} (${yearA} vs ${yearB})`,
        sections: [
          {
            type: "summary",
            icon: "📊",
            title: "Perbandingan Kinerja Fiskal",
            content: [
              `Analisis menunjukkan pergerakan nominal dari ${formatValue(valA)} (${yearA}) menjadi ${formatValue(valB)} (${yearB}).`,
              `Tercatat adanya **${growth >= 0 ? 'kenaikan' : 'penurunan'}** sebesar **${Math.abs(growth).toFixed(1)}%** (${formatValue(Math.abs(diff))}) pada sektor ${metricLabel}.`,
              `Performa ini mencerminkan ${growth > 10 ? 'ekspansi fiskal yang kuat' : growth > 0 ? 'pertumbuhan yang stabil' : 'tekanan pada sumber pendapatan'} di wilayah tersebut.`
            ],
          },
          {
            type: "list",
            icon: "📈",
            title: "Indikator Pertumbuhan",
            intro: "Detail perubahan nilai riil antar periode:",
            items: [
              { icon: '📅', title: `Realisasi ${yearA}`, details: [`Nilai: ${formatValue(valA)}`, "Tahun dasar perbandingan."] },
              { icon: '🚀', title: `Realisasi ${yearB}`, details: [`Nilai: ${formatValue(valB)}`, "Tahun target analisis."] },
              { icon: growth >= 0 ? '✅' : '⚠️', title: "Selisih Pertumbuhan", details: [`Delta: ${formatValue(diff)}`, `Persentase: ${growth.toFixed(1)}%`] },
            ]
          },
          {
            type: "conclusion",
            icon: "💡",
            title: "Rekomendasi Strategis",
            points: [
              growth > 0 
                ? `Mempertahankan momentum pertumbuhan di sektor ${metricLabel} dengan optimalisasi basis data perpajakan baru.` 
                : `Melakukan evaluasi mendalam terhadap potensi kebocoran atau penurunan objek pajak di sektor ${metricLabel}.`,
              `Membandingkan tren pertumbuhan ini dengan rata-rata regional untuk melihat daya saing wilayah.`,
              `Menyesuaikan target anggaran periode berikutnya berdasarkan realitas pertumbuhan **${growth.toFixed(1)}%** ini.`
            ],
          },
        ],
      };
    }

    const total = item.rataRataPAD || 0;
    const pjk = item.rataRataPajak || 0;
    const ret = item.rataRataRetribusi || 0;
    const pen = item.rataRataPengelolaan || 0;
    const lai = item.rataRataLain || 0;
    const ang = item.rataRataAnggaran || 0;
    const capaian = ang > 0 ? (total / ang) * 100 : 0;

    // Calculate percentages
    const sectors = [
      { name: 'Pajak Daerah', val: pjk, icon: '💰' },
      { name: 'Retribusi Daerah', val: ret, icon: '🎫' },
      { name: 'Hasil Pengelolaan Kekayaan', val: pen, icon: '🏦' },
      { name: 'Lain-lain PAD yang Sah', val: lai, icon: '📦' }
    ].sort((a, b) => b.val - a.val);

    return {
      title: `Analisis Fiskal: ${item.daerah} (${selectedYear === 'all' ? '2021-2025' : selectedYear})`,
      sections: [
        {
          type: "summary",
          icon: "📊",
          title: "Struktur Pendapatan Asli Daerah",
          content: [
            `${item.daerah} mencatatkan total realisasi sebesar ${formatValue(total)} pada periode ini.`,
            `Kontribusi sektor ${sectors[0].name} menjadi yang paling dominan dengan porsi sebesar ${total > 0 ? ((sectors[0].val/total)*100).toFixed(1) : 0}% dari total PAD.`,
            `Secara keseluruhan, wilayah ini mencapai tingkat efektivitas anggaran sebesar ${capaian.toFixed(1)}% terhadap target yang ditetapkan.`
          ],
        },
        {
          type: "list",
          icon: "📍",
          title: "Komposisi Sektor Unggulan",
          intro: "Berikut adalah rincian kontribusi per mata anggaran yang tercatat di database:",
          items: sectors.map(s => ({
            icon: s.icon,
            title: s.name,
            details: [
              `Realisasi: **${formatValue(s.val)}**`,
              `Kontribusi terhadap total PAD: **${total > 0 ? ((s.val/total)*100).toFixed(1) : 0}%**`,
              s.val > 1e12 ? "Sektor ini merupakan pilar utama stabilitas fiskal wilayah." : "Sektor ini menunjukkan potensi pertumbuhan yang bisa dioptimalkan."
            ]
          }))
        },
        {
          type: "conclusion",
          icon: "📈",
          title: "Executive Summary & Outlook",
          points: [
            `**Kesehatan Fiskal:** Dengan capaian ${capaian.toFixed(1)}%, wilayah ini masuk dalam kategori ${capaian >= 100 ? 'Sangat Berprestasi' : capaian >= 80 ? 'Stabil' : 'Perlu Perhatian Khusus'}.`,
            `**Strategi Utama:** Fokus pada intensifikasi ${sectors[0].name} terbukti efektif menjaga arus kas daerah.`,
            `**Rekomendasi:** Perlu adanya diversifikasi pada sektor-sektor non-pajak untuk mengurangi ketergantungan pada satu sumber pendapatan saja.`
          ],
        },
      ],
    };
  };

  // Generate dynamic data from database record
  const dynamicAiData = useMemo(() => generateDynamicAnalysis(activeInsight), [activeInsight, selectedYear]);
  
  // Use expert manual analysis as override if available, otherwise use dynamic
  const regionKey = (activeInsight?.daerah || '').toUpperCase()
    .replace(/(PROV\.|PROVINSI|KAB\.|KABUPATEN|KOTA|DKI|DI|JAWA| )/g, '')
    .trim();
  const staticAiData = aiAnalysisData ? (aiAnalysisData[regionKey] || aiAnalysisData[(activeInsight?.daerah || '').toUpperCase().replace(/\./g, '')]) : null;

  const aiData = isCompareMode ? dynamicAiData : (staticAiData || dynamicAiData);

  const handleChartExport = (chartData, title, type = 'xlsx') => {
    if (!chartData || chartData.length === 0) return alert('Tidak ada data untuk di-export');
    
    const exportData = chartData.map((d, i) => ({
      'No': i + 1,
      'Wilayah': d.daerah || d.name || '',
      'Tahun': selectedYear === 'all' ? '2021-2025' : selectedYear,
      'Kategori': title,
      'Realisasi': d.value || 0,
    }));

    if (type === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Chart Data");
      
      // Auto-width columns
      const wscols = [
        { wch: 5 },  // No
        { wch: 25 }, // Wilayah
        { wch: 15 }, // Tahun
        { wch: 40 }, // Kategori
        { wch: 20 }, // Realisasi
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `${title.replace(/[:\/\\?*\[\] ]/g, '_')}_${selectedYear}.xlsx`);
    } else {
      const sep = ';';
      const headers = Object.keys(exportData[0]).join(sep);
      const rows = exportData.map(row => 
        Object.values(row).map(val => (typeof val === 'string' && (val.includes(sep) || val.includes(','))) ? `"${val}"` : val).join(sep)
      );
      const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.replace(/[:\/\\?*\[\] ]/g, '_')}_${selectedYear}.csv`);
      link.click();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        {/* Top 10 Kab/Kota */}
        <div className="bg-white p-5 md:p-10 rounded-[24px] md:rounded-[32px] shadow-sm ring-1 ring-slate-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-emerald-500" /> Analisis Kab/Kota: {metricLabel}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleChartExport(chartDataKabKota, `Top 10 KabKota ${metricLabel}`, 'xlsx')}
                className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                title="Export Excel"
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                onClick={() => handleChartExport(chartDataKabKota, `Top 10 KabKota ${metricLabel}`, 'csv')}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-all"
                title="Export CSV"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Peringkat 10 Wilayah Tertinggi</p>
          <div className="h-[300px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartDataKabKota} 
                layout="vertical"
                margin={{ top: 0, right: 80, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: '900' }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 10 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  formatter={(val, name, props) => {
                    if (isCompareMode) {
                      const payload = props.payload;
                      const growth = payload.growth || 0;
                      return [formatValue(val), `${name} (${growth.toFixed(1)}%)`];
                    }
                    return [formatValue(val), selectedYear === 'all' ? 'Total' : 'Realisasi'];
                  }}
                />
                {!isCompareMode ? (
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]} 
                    barSize={24}
                    onClick={(payload) => {
                      if (payload) setActiveInsight(payload);
                    }}
                  >
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      content={(props) => (
                        <text 
                          x={props.x + props.width + 8} 
                          y={props.y + props.height / 2 + 4} 
                          fill="#10b981" 
                          fontSize="10" 
                          fontWeight="900"
                          className="drop-shadow-sm"
                        >
                          {formatShort(props.value)}
                        </text>
                      )}
                    />
                    {chartDataKabKota.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={activeInsight?.daerah === entry.daerah ? '#ff9800' : (index < 3 ? '#10b981' : '#3949ab')} 
                        className="cursor-pointer hover:opacity-80 transition-opacity duration-300"
                      />
                    ))}
                  </Bar>
                ) : (
                  <>
                    <Bar 
                      name={yearA}
                      dataKey="valueA" 
                      radius={[0, 4, 4, 0]} 
                      barSize={12}
                      fill="#6366f1"
                      onClick={(p) => setActiveInsight(p?.payload)}
                    />
                    <Bar 
                      name={yearB}
                      dataKey="valueB" 
                      radius={[0, 4, 4, 0]} 
                      barSize={12}
                      fill="#10b981"
                      onClick={(p) => setActiveInsight(p?.payload)}
                    >
                       <LabelList 
                        dataKey="growth" 
                        position="right" 
                        content={(props) => (
                          <text 
                            x={props.x + props.width + 5} 
                            y={props.y + props.height / 2 + 4} 
                            fill={props.value >= 0 ? '#10b981' : '#f43f5e'} 
                            fontSize="8" 
                            fontWeight="900"
                          >
                            {props.value >= 0 ? '↑' : '↓'} {Math.abs(props.value).toFixed(0)}%
                          </text>
                        )}
                      />
                    </Bar>
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Provinces */}
        <div className="bg-white p-5 md:p-10 rounded-[24px] md:rounded-[32px] shadow-sm ring-1 ring-slate-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-3">
              <BarChart3 className="text-blue-500" /> Analisis Provinsi: {metricLabel}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleChartExport(chartDataProvinces, `Top 6 Provinsi ${metricLabel}`, 'xlsx')}
                className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                title="Export Excel"
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                onClick={() => handleChartExport(chartDataProvinces, `Top 6 Provinsi ${metricLabel}`, 'csv')}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-all"
                title="Export CSV"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Peringkat 6 Provinsi se-Jawa</p>
          <div className="h-[300px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartDataProvinces} 
                layout="vertical"
                margin={{ top: 0, right: 80, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: '900' }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 10 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  formatter={(val, name, props) => {
                    if (isCompareMode) {
                      const payload = props.payload;
                      const growth = payload.growth || 0;
                      return [formatValue(val), `${name} (${growth.toFixed(1)}%)`];
                    }
                    return [formatValue(val), selectedYear === 'all' ? 'Total' : 'Realisasi'];
                  }}
                />
                {!isCompareMode ? (
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]} 
                    barSize={30}
                    onClick={(payload) => {
                      if (payload) setActiveInsight(payload);
                    }}
                  >
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      content={(props) => (
                        <text 
                          x={props.x + props.width + 8} 
                          y={props.y + props.height / 2 + 5} 
                          fill="#3b82f6" 
                          fontSize="11" 
                          fontWeight="900"
                          className="drop-shadow-sm"
                        >
                          {formatShort(props.value)}
                        </text>
                      )}
                    />
                    {chartDataProvinces.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={activeInsight?.daerah === entry.daerah ? '#ff9800' : (index < 3 ? '#3b82f6' : '#6366f1')} 
                        className="cursor-pointer hover:opacity-80 transition-opacity duration-300"
                      />
                    ))}
                  </Bar>
                ) : (
                  <>
                    <Bar 
                      name={yearA}
                      dataKey="valueA" 
                      radius={[0, 6, 6, 0]} 
                      barSize={15}
                      fill="#6366f1"
                      onClick={(p) => setActiveInsight(p?.payload)}
                    />
                    <Bar 
                      name={yearB}
                      dataKey="valueB" 
                      radius={[0, 6, 6, 0]} 
                      barSize={15}
                      fill="#3b82f6"
                      onClick={(p) => setActiveInsight(p?.payload)}
                    >
                       <LabelList 
                        dataKey="growth" 
                        position="right" 
                        content={(props) => (
                          <text 
                            x={props.x + props.width + 5} 
                            y={props.y + props.height / 2 + 5} 
                            fill={props.value >= 0 ? '#10b981' : '#f43f5e'} 
                            fontSize="9" 
                            fontWeight="900"
                          >
                            {props.value >= 0 ? '↑' : '↓'} {Math.abs(props.value).toFixed(0)}%
                          </text>
                        )}
                      />
                    </Bar>
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        <div className="bg-white p-5 md:p-10 rounded-[24px] md:rounded-[32px] shadow-sm ring-1 ring-slate-100">
            <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <PieIcon className="text-emerald-500" /> Komposisi Wilayah
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
              {activeInsight?.tipe === 'Provinsi' ? `Breakdown: ${getProvinceName(activeInsight.daerah)}` : 'Cakupan: Seluruh Wilayah Jawa'}
            </p>
            <div className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [formatValue(val), 'Kontribusi PAD']} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {pieData.map((d, i) => (
                <span key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} /> 
                  {d.name} <span className="opacity-50 lowercase ml-1">({formatValue(d.value)})</span>
                </span>
              ))}
            </div>
        </div>

        
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm ring-1 ring-slate-100 overflow-y-auto max-h-[500px] md:max-h-[600px] custom-scrollbar">
          {aiData ? (
             <AiAnalysisPanel data={aiData} />
          ) : (
            <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-900 p-6 md:p-10 rounded-[20px] md:rounded-[32px] text-white shadow-2xl shadow-brand-500/20 flex flex-col justify-center overflow-hidden relative min-h-[300px] h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeInsight?.daerah}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute top-0 right-0 p-6 md:p-10 opacity-10 scale-150 rotate-12">
                      <TrendingUp size={100} className="md:w-[140px] md:h-[140px]" />
                  </div>
                  <h4 className="text-brand-400 font-bold uppercase tracking-[0.3em] text-[8px] md:text-[10px] mb-3 md:mb-4 flex items-center gap-2">
                      <Sparkles size={12} className="text-amber-400" /> Executive Insights
                  </h4>
                  <p className="text-lg md:text-2xl font-light leading-relaxed">
                    Wilayah <span className="font-bold underline decoration-brand-400 decoration-2">{activeInsight?.daerah || 'N/A'}</span> menunjukkan performa {activeInsight?.rataRataPAD > 1000000000000 ? 'signifikan' : 'konsisten'} dengan <span className="font-bold text-amber-300">
                      {activeInsight?.rataRataPAD >= 1e12 
                        ? `Rp ${(activeInsight.rataRataPAD / 1e12).toFixed(2)} T` 
                        : `Rp ${(activeInsight.rataRataPAD / 1e9).toFixed(1)} M`}
                    </span> kontribusi.
                  </p>
                  <p className="text-slate-400 text-xs md:text-sm mt-3 md:mt-4 font-medium italic">
                    Didominasi oleh {activeInsight?.rataRataPajak > activeInsight?.rataRataRetribusi ? 'Sektor Pajak Daerah' : 'Sektor Retribusi'} ({Math.round((Math.max(activeInsight?.rataRataPajak, activeInsight?.rataRataRetribusi) / activeInsight?.rataRataPAD) * 100)}%).
                  </p>
                  <div className="mt-6 md:mt-8 flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-white/10 rounded-full text-[8px] md:text-[10px] font-black tracking-widest border border-white/10 uppercase">Analisa Analitik</div>
                    <ArrowUpRight size={18} className="text-emerald-400 animate-pulse" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Visualisasi;
