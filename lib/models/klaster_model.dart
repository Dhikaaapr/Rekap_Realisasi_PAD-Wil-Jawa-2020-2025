// Model untuk Klasterisasi PAD

import 'pad_model.dart';

/// Enum untuk tipe klaster PAD berdasarkan nilai Realisasi
enum KlasterPAD {
  klaster1, // 0 - 500 Miliar
  klaster2, // 500 Miliar - 1 Triliun
  klaster3, // 1 - 2 Triliun
  klaster4, // 2 - 3 Triliun
  klaster5, // 3 - 5 Triliun
  klaster6, // > 5 Triliun
}

/// Extension untuk KlasterPAD
extension KlasterPADExtension on KlasterPAD {
  /// Nama klaster dalam format Romawi
  String get nama {
    switch (this) {
      case KlasterPAD.klaster1:
        return 'Klaster I';
      case KlasterPAD.klaster2:
        return 'Klaster II';
      case KlasterPAD.klaster3:
        return 'Klaster III';
      case KlasterPAD.klaster4:
        return 'Klaster IV';
      case KlasterPAD.klaster5:
        return 'Klaster V';
      case KlasterPAD.klaster6:
        return 'Klaster VI';
    }
  }

  /// Range nilai PAD dalam format string
  String get rangeLabel {
    switch (this) {
      case KlasterPAD.klaster1:
        return '0 - 500 Miliar';
      case KlasterPAD.klaster2:
        return '500 M - 1 Triliun';
      case KlasterPAD.klaster3:
        return '1 - 2 Triliun';
      case KlasterPAD.klaster4:
        return '2 - 3 Triliun';
      case KlasterPAD.klaster5:
        return '3 - 5 Triliun';
      case KlasterPAD.klaster6:
        return '> 5 Triliun';
    }
  }

  /// Warna untuk masing-masing klaster (untuk chart)
  int get colorValue {
    switch (this) {
      case KlasterPAD.klaster1:
        return 0xFF1976D2; // Blue
      case KlasterPAD.klaster2:
        return 0xFFFFA726; // Orange
      case KlasterPAD.klaster3:
        return 0xFF66BB6A; // Green
      case KlasterPAD.klaster4:
        return 0xFFAB47BC; // Purple
      case KlasterPAD.klaster5:
        return 0xFFEF5350; // Red
      case KlasterPAD.klaster6:
        return 0xFF26A69A; // Teal
    }
  }

  /// Urutan index (untuk sorting)
  int get index {
    switch (this) {
      case KlasterPAD.klaster1:
        return 1;
      case KlasterPAD.klaster2:
        return 2;
      case KlasterPAD.klaster3:
        return 3;
      case KlasterPAD.klaster4:
        return 4;
      case KlasterPAD.klaster5:
        return 5;
      case KlasterPAD.klaster6:
        return 6;
    }
  }
}

/// Helper class untuk menentukan klaster dari nilai PAD
class KlasterHelper {
  /// Threshold dalam Rupiah
  static const double threshold500M = 500000000000; // 500 Miliar
  static const double threshold1T = 1000000000000; // 1 Triliun
  static const double threshold2T = 2000000000000; // 2 Triliun
  static const double threshold3T = 3000000000000; // 3 Triliun
  static const double threshold5T = 5000000000000; // 5 Triliun

  /// Tentukan klaster berdasarkan nilai PAD Realisasi
  static KlasterPAD getKlaster(double nilaiPAD) {
    if (nilaiPAD >= threshold5T) {
      return KlasterPAD.klaster6;
    } else if (nilaiPAD >= threshold3T) {
      return KlasterPAD.klaster5;
    } else if (nilaiPAD >= threshold2T) {
      return KlasterPAD.klaster4;
    } else if (nilaiPAD >= threshold1T) {
      return KlasterPAD.klaster3;
    } else if (nilaiPAD >= threshold500M) {
      return KlasterPAD.klaster2;
    } else {
      return KlasterPAD.klaster1;
    }
  }

  /// Get semua klaster yang tersedia
  static List<KlasterPAD> get allKlaster => KlasterPAD.values;
}

/// Model untuk menyimpan data daerah yang sudah di-klasterisasi
class DaerahKlaster {
  final String daerah;
  final String namaClean;
  final String tipe; // Provinsi, Kabupaten, Kota
  final int tahun;
  final KlasterPAD klaster;
  
  // Data Akumulasi
  final double totalAnggaran;
  final double totalRealisasi;
  final double persentaseRealisasi;
  
  // Breakdown per kategori
  final double pajakAnggaran;
  final double pajakRealisasi;
  final double retribusiAnggaran;
  final double retribusiRealisasi;
  final double pengelolaanAnggaran;
  final double pengelolaanRealisasi;
  final double lainPadAnggaran;
  final double lainPadRealisasi;

  DaerahKlaster({
    required this.daerah,
    required this.namaClean,
    required this.tipe,
    required this.tahun,
    required this.klaster,
    required this.totalAnggaran,
    required this.totalRealisasi,
    required this.persentaseRealisasi,
    required this.pajakAnggaran,
    required this.pajakRealisasi,
    required this.retribusiAnggaran,
    required this.retribusiRealisasi,
    required this.pengelolaanAnggaran,
    required this.pengelolaanRealisasi,
    required this.lainPadAnggaran,
    required this.lainPadRealisasi,
  });

  /// Factory dari PADData
  factory DaerahKlaster.fromPADData(PADData data) {
    final klaster = KlasterHelper.getKlaster(data.totalRealisasi);
    
    return DaerahKlaster(
      daerah: data.daerah,
      namaClean: data.namaClean,
      tipe: data.tipe,
      tahun: data.tahun,
      klaster: klaster,
      totalAnggaran: data.totalAnggaran,
      totalRealisasi: data.totalRealisasi,
      persentaseRealisasi: data.totalPersentase,
      pajakAnggaran: data.pajakAnggaran,
      pajakRealisasi: data.pajakRealisasi,
      retribusiAnggaran: data.retribusiAnggaran,
      retribusiRealisasi: data.retribusiRealisasi,
      pengelolaanAnggaran: data.pengelolaanAnggaran,
      pengelolaanRealisasi: data.pengelolaanRealisasi,
      lainPadAnggaran: data.lainPadAnggaran,
      lainPadRealisasi: data.lainPadRealisasi,
    );
  }
}

/// Model untuk ringkasan klaster (untuk pie chart)
class KlasterSummary {
  final KlasterPAD klaster;
  final int jumlahDaerah;
  final double persentaseDariTotal;
  final List<DaerahKlaster> daftarDaerah;

  KlasterSummary({
    required this.klaster,
    required this.jumlahDaerah,
    required this.persentaseDariTotal,
    required this.daftarDaerah,
  });
}

/// Service untuk mengelola klasterisasi
class KlasterService {
  /// Konversi list PADData ke list DaerahKlaster untuk tahun tertentu
  static List<DaerahKlaster> klasterisasiData(List<PADData> allData, {int? tahun}) {
    // Filter by tahun jika ada
    List<PADData> filteredData = tahun != null
        ? allData.where((d) => d.tahun == tahun).toList()
        : allData;

    // Konversi ke DaerahKlaster
    return filteredData.map((d) => DaerahKlaster.fromPADData(d)).toList();
  }

  /// Generate ringkasan per klaster (untuk pie chart)
  static List<KlasterSummary> generateSummary(List<DaerahKlaster> data) {
    // Group by klaster
    Map<KlasterPAD, List<DaerahKlaster>> grouped = {};
    
    for (var klaster in KlasterPAD.values) {
      grouped[klaster] = [];
    }
    
    for (var item in data) {
      grouped[item.klaster]!.add(item);
    }

    int totalDaerah = data.length;

    // Generate summary
    List<KlasterSummary> summaries = [];
    
    for (var klaster in KlasterPAD.values) {
      final daerahList = grouped[klaster]!;
      
      // Sort by persentase realisasi tertinggi
      daerahList.sort((a, b) => b.persentaseRealisasi.compareTo(a.persentaseRealisasi));
      
      summaries.add(KlasterSummary(
        klaster: klaster,
        jumlahDaerah: daerahList.length,
        persentaseDariTotal: totalDaerah > 0 
            ? (daerahList.length / totalDaerah) * 100 
            : 0,
        daftarDaerah: daerahList,
      ));
    }

    return summaries;
  }

  /// Filter klasterisasi per provinsi/wilayah
  static List<DaerahKlaster> filterByProvinsi(List<DaerahKlaster> data, String provinsi) {
    // Implementasi sederhana: filter berdasarkan nama daerah yang mengandung provinsi
    // Bisa di-enhance jika ada field provinsi terpisah
    return data.where((d) => 
      d.daerah.toLowerCase().contains(provinsi.toLowerCase()) ||
      d.namaClean.toLowerCase().contains(provinsi.toLowerCase())
    ).toList();
  }

  /// Get list provinsi unik dari data
  static List<String> getProvinsiList(List<DaerahKlaster> data) {
    // Extract provinsi dari data dengan tipe "Provinsi"
    return data
        .where((d) => d.tipe == 'Provinsi')
        .map((d) => d.namaClean)
        .toSet()
        .toList()
      ..sort();
  }
}
