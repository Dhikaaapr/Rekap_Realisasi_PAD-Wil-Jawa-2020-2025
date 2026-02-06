import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:excel/excel.dart';
import '../models/pad_model.dart';

class ExcelService {
  // Mode selector: true = use real Excel data, false = use dummy data
  static const bool useRealData = false; // Set to true after cleaning Excel
  
  /// Load data from Excel or dummy data based on useRealData flag
  Future<List<PADData>> loadAssetExcel() async {
    if (useRealData) {
      return await _loadRealExcelData();
    } else {
      debugPrint('[ExcelService] Using Dummy Data (useRealData = false)');
      await Future.delayed(const Duration(seconds: 1));
      return _getDummyData();
    }
  }

  /// Load REAL data from cleaned Excel file
  Future<List<PADData>> _loadRealExcelData() async {
    try {
      debugPrint('[ExcelService] Loading REAL data from Excel...');
      
      // Load Excel file from assets
      final bytes = await rootBundle.load('assets/datarekap_clean.xlsx');
      final excel = Excel.decodeBytes(bytes.buffer.asUint8List());
      
      // Get the clean sheet
      final sheet = excel.tables['REKAP_CLEAN'];
      if (sheet == null) {
        throw Exception('Sheet REKAP_CLEAN not found. Please run clean_excel.py first.');
      }
      
      List<PADData> allData = [];
      
      // Skip header row (row 0)
      for (int rowIndex = 1; rowIndex < sheet.maxRows; rowIndex++) {
        try {
          final row = sheet.rows[rowIndex];
          
          // Expected columns (from clean_excel.py):
          // 0: TAHUN
          // 1: NOMOR_URUT
          // 2: DAERAH
          // 3: PAJAK_ANGGARAN
          // 4: PAJAK_REALISASI
          // 5: RETRIBUSI_ANGGARAN
          // 6: RETRIBUSI_REALISASI
          // 7: KEKAYAAN_ANGGARAN
          // 8: KEKAYAAN_REALISASI
          // 9: LAIN_ANGGARAN
          // 10: LAIN_REALISASI
          
          final tahun = _parseInt(row[0]?.value);
          final daerah = _parseString(row[2]?.value);
          
          // Skip invalid rows
          if (tahun == 0 || daerah.isEmpty) continue;
          
          final padData = PADData(
            daerah: daerah,
            tahun: tahun,
            nomorUrut: _parseString(row[1]?.value),
            pajakAnggaran: _parseDouble(row[3]?.value),
            pajakRealisasi: _parseDouble(row[4]?.value),
            retribusiAnggaran: _parseDouble(row[5]?.value),
            retribusiRealisasi: _parseDouble(row[6]?.value),
            pengelolaanAnggaran: _parseDouble(row[7]?.value),
            pengelolaanRealisasi: _parseDouble(row[8]?.value),
            lainPadAnggaran: _parseDouble(row[9]?.value),
            lainPadRealisasi: _parseDouble(row[10]?.value),
          );
          
          allData.add(padData);
          
        } catch (e) {
          debugPrint('[ExcelService] Error parsing row $rowIndex: $e');
          continue;
        }
      }
      
      debugPrint('[ExcelService] ✅ Loaded ${allData.length} records from Excel');
      return allData;
      
    } catch (e) {
      debugPrint('[ExcelService] ❌ Error loading Excel: $e');
      debugPrint('[ExcelService] Falling back to dummy data...');
      return _getDummyData();
    }
  }

  // Parser helpers
  int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      final cleaned = value.replaceAll(RegExp(r'[^\d]'), '');
      return int.tryParse(cleaned) ?? 0;
    }
    return 0;
  }

  String _parseString(dynamic value) {
    if (value == null) return '';
    return value.toString().trim();
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      String cleaned = value.replaceAll(RegExp(r'[^\d.-]'), '');
      return double.tryParse(cleaned) ?? 0.0;
    }
    return 0.0;
  }

  // Comprehensive Dummy Data for Wilayah Jawa (2021-2025)
  List<PADData> _getDummyData() {
    List<PADData> dummy = [];
    
    // Helper to add region data
    void addRegion(String name, double baseAnggaran, double trend) {
      for (int year = 2021; year <= 2025; year++) {
        // Create variations per year
        double yearFactor = 1.0 + ((year - 2021) * trend);
        
        // Anggaran (Budget)
        double totalAnggaran = baseAnggaran * yearFactor;
        
        // Realisasi (Actual) - varied between 95% and 105%
        double realisasiRatio = 0.95 + ((year % 3) * 0.03); 
        // double totalRealisasi = totalAnggaran * realisasiRatio; // Removed unused variable
        
        // Components breakdown (approximate percentages)
        double pajak = totalAnggaran * 0.75; // 75% Pajak
        double retribusi = totalAnggaran * 0.05; // 5% Retribusi
        double kekayaan = totalAnggaran * 0.05; // 5% Kekayaan
        double lain = totalAnggaran * 0.15; // 15% Lain-lain

        dummy.add(PADData(
          daerah: name,
          tahun: year,
          nomorUrut: '1',
          
          pajakAnggaran: pajak,
          pajakRealisasi: pajak * realisasiRatio,
          
          retribusiAnggaran: retribusi,
          retribusiRealisasi: retribusi * realisasiRatio,
          
          pengelolaanAnggaran: kekayaan,
          pengelolaanRealisasi: kekayaan * realisasiRatio,
          
          lainPadAnggaran: lain,
          lainPadRealisasi: lain * realisasiRatio,
        ));
      }
    }

    // 1. DKI JAKARTA (High Base: ~40T)
    addRegion('Prov. DKI Jakarta', 45000000000000, 0.05);

    // 2. JAWA BARAT (Base: ~30T)
    addRegion('Prov. Jawa Barat', 32000000000000, 0.03);

    // 3. JAWA TIMUR (Base: ~28T)
    addRegion('Prov. Jawa Timur', 28000000000000, 0.04);

    // 4. JAWA TENGAH (Base: ~16T)
    addRegion('Prov. Jawa Tengah', 16000000000000, 0.03);

    // 5. BANTEN (Base: ~8T)
    addRegion('Prov. Banten', 8500000000000, 0.06);

    // 6. DI YOGYAKARTA (Base: ~5T)
    addRegion('Prov. DI Yogyakarta', 5000000000000, 0.02);

    // 7. SAMPLE KAB/KOTA (Base: ~500M - 2T)
    addRegion('Kota Bandung', 2500000000000, 0.05);
    addRegion('Kota Surabaya', 3000000000000, 0.05);
    addRegion('Kab. Tangerang', 1800000000000, 0.04);
    addRegion('Kab. Bogor', 1500000000000, 0.03);

    return dummy;
  }

  // Group data by daerah for multi-year analysis
  Future<List<DaerahDataGroup>> loadGroupedData() async {
    final allData = await loadAssetExcel();
    
    debugPrint('[ExcelService] Grouping ${allData.length} records...');
    
    // Group by daerah name
    Map<String, List<PADData>> grouped = {};
    for (var data in allData) {
      if (!grouped.containsKey(data.daerah)) {
        grouped[data.daerah] = [];
      }
      grouped[data.daerah]!.add(data);
    }
    
    // Convert to DaerahDataGroup list
    List<DaerahDataGroup> result = [];
    for (var entry in grouped.entries) {
      final first = entry.value.first;
      result.add(DaerahDataGroup(
        daerah: entry.key,
        namaClean: first.namaClean,
        tipe: first.tipe,
        dataPerTahun: entry.value,
      ));
    }
    
    // Sort: provinces first, then by name
    result.sort((a, b) {
      if (a.tipe == 'Provinsi' && b.tipe != 'Provinsi') return -1;
      if (a.tipe != 'Provinsi' && b.tipe == 'Provinsi') return 1;
      return a.namaClean.compareTo(b.namaClean);
    });
    
    debugPrint('[ExcelService] Grouped into ${result.length} regions');
    return result;
  }
  
  // Get all unique daerah names
  Future<List<String>> getDaerahList() async {
    final data = await loadAssetExcel();
    return data.map((d) => d.daerah).toSet().toList()..sort();
  }
  
  // Get data for specific daerah across all years
  Future<List<PADData>> getDataByDaerah(String daerah) async {
    final data = await loadAssetExcel();
    var filtered = data.where((d) => d.daerah == daerah).toList();
    filtered.sort((a, b) => a.tahun.compareTo(b.tahun));
    return filtered;
  }
}
