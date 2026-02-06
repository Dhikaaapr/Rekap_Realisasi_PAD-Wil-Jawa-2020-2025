// Model untuk data PAD per daerah per tahun
class PADData {
  final String daerah;
  final int tahun;
  final String nomorUrut; // XI, XII, 1, 2, dst
  
  // Pajak Daerah
  final double pajakAnggaran;
  final double pajakRealisasi;
  double get pajakPersentase => pajakAnggaran == 0 ? 0 : (pajakRealisasi / pajakAnggaran) * 100;
  
  // Retribusi
  final double retribusiAnggaran;
  final double retribusiRealisasi;
  double get retribusiPersentase => retribusiAnggaran == 0 ? 0 : (retribusiRealisasi / retribusiAnggaran) * 100;
  
  // Pengelolaan Kekayaan
  final double pengelolaanAnggaran;
  final double pengelolaanRealisasi;
  double get pengelolaanPersentase => pengelolaanAnggaran == 0 ? 0 : (pengelolaanRealisasi / pengelolaanAnggaran) * 100;
  
  // Lain-lain PAD
  final double lainPadAnggaran;
  final double lainPadRealisasi;
  double get lainPadPersentase => lainPadAnggaran == 0 ? 0 : (lainPadRealisasi / lainPadAnggaran) * 100;
  
  // Total PAD
  double get totalAnggaran => pajakAnggaran + retribusiAnggaran + pengelolaanAnggaran + lainPadAnggaran;
  double get totalRealisasi => pajakRealisasi + retribusiRealisasi + pengelolaanRealisasi + lainPadRealisasi;
  double get totalPersentase => totalAnggaran == 0 ? 0 : (totalRealisasi / totalAnggaran) * 100;

  final String? docId;

  PADData({
    this.docId,
    required this.daerah,
    required this.tahun,
    required this.nomorUrut,
    required this.pajakAnggaran,
    required this.pajakRealisasi,
    required this.retribusiAnggaran,
    required this.retribusiRealisasi,
    required this.pengelolaanAnggaran,
    required this.pengelolaanRealisasi,
    required this.lainPadAnggaran,
    required this.lainPadRealisasi,
  });

  // Factory to create from a list of dynamic values (row)
  factory PADData.fromRow(List<dynamic> row, int tahun) {
    // Helper to parse double safely
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is double) return value;
      if (value is int) return value.toDouble();
      if (value is String) {
        // Remove non-numeric characters except decimal point
        String cleaned = value.replaceAll(RegExp(r'[^\d.-]'), '');
        return double.tryParse(cleaned) ?? 0.0;
      }
      return 0.0;
    }

    String parseString(dynamic value) {
      if (value == null) return '';
      return value.toString().trim();
    }

    return PADData(
      daerah: parseString(row.length > 2 ? row[2] : ''),
      tahun: tahun,
      nomorUrut: parseString(row.length > 1 ? row[1] : ''),
      pajakAnggaran: parseDouble(row.length > 3 ? row[3] : 0),
      pajakRealisasi: parseDouble(row.length > 4 ? row[4] : 0),
      retribusiAnggaran: parseDouble(row.length > 6 ? row[6] : 0),
      retribusiRealisasi: parseDouble(row.length > 7 ? row[7] : 0),
      pengelolaanAnggaran: parseDouble(row.length > 9 ? row[9] : 0),
      pengelolaanRealisasi: parseDouble(row.length > 10 ? row[10] : 0),
      lainPadAnggaran: parseDouble(row.length > 12 ? row[12] : 0),
      lainPadRealisasi: parseDouble(row.length > 13 ? row[13] : 0),
    );
  }

  // Check if this is a Province row (XI, XII, XIII, etc)
  bool get isProvinsi => nomorUrut.startsWith('X') || nomorUrut.startsWith('I') && nomorUrut.length <= 4;
  
  // Get a cleaner province/area type
  String get tipe {
    if (daerah.startsWith('Prov.')) return 'Provinsi';
    if (daerah.startsWith('Kab.')) return 'Kabupaten';
    if (daerah.startsWith('Kota')) return 'Kota';
    return 'Lainnya';
  }

  // Get name without prefix
  String get namaClean {
    return daerah
        .replaceFirst('Prov. ', '')
        .replaceFirst('Kab. ', '')
        .replaceFirst('Kota ', '');
  }

  // Firestore serialization
  factory PADData.fromFirestore(Map<String, dynamic> data, String docId) {
    return PADData(
      docId: docId,
      daerah: data['daerah'] as String? ?? '',
      tahun: (data['tahun'] as num?)?.toInt() ?? 0,
      nomorUrut: data['nomorUrut'] as String? ?? '',
      pajakAnggaran: _parseDouble(data['pajakAnggaran']),
      pajakRealisasi: _parseDouble(data['pajakRealisasi']),
      retribusiAnggaran: _parseDouble(data['retribusiAnggaran']),
      retribusiRealisasi: _parseDouble(data['retribusiRealisasi']),
      pengelolaanAnggaran: _parseDouble(data['pengelolaanAnggaran']),
      pengelolaanRealisasi: _parseDouble(data['pengelolaanRealisasi']),
      lainPadAnggaran: _parseDouble(data['lainPadAnggaran']),
      lainPadRealisasi: _parseDouble(data['lainPadRealisasi']),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'daerah': daerah,
      'tahun': tahun,
      'nomorUrut': nomorUrut,
      'pajakAnggaran': pajakAnggaran,
      'pajakRealisasi': pajakRealisasi,
      'retribusiAnggaran': retribusiAnggaran,
      'retribusiRealisasi': retribusiRealisasi,
      'pengelolaanAnggaran': pengelolaanAnggaran,
      'pengelolaanRealisasi': pengelolaanRealisasi,
      'lainPadAnggaran': lainPadAnggaran,
      'lainPadRealisasi': lainPadRealisasi,
    };
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}

// Model untuk menyimpan data per daerah dengan data multi-tahun
class DaerahDataGroup {
  final String daerah;
  final String namaClean;
  final String tipe;
  final List<PADData> dataPerTahun;

  DaerahDataGroup({
    required this.daerah,
    required this.namaClean,
    required this.tipe,
    required this.dataPerTahun,
  });

  // Get data for specific year
  PADData? getDataTahun(int tahun) {
    try {
      return dataPerTahun.firstWhere((d) => d.tahun == tahun);
    } catch (e) {
      return null;
    }
  }

  // Get all years available
  List<int> get tahunList => dataPerTahun.map((d) => d.tahun).toList()..sort();

  // Get average PAD across all years
  double get rataRataPAD {
    if (dataPerTahun.isEmpty) return 0;
    return dataPerTahun.map((d) => d.totalRealisasi).reduce((a, b) => a + b) / dataPerTahun.length;
  }

  // Get average Pajak across all years
  double get rataRataPajak {
    if (dataPerTahun.isEmpty) return 0;
    return dataPerTahun.map((d) => d.pajakRealisasi).reduce((a, b) => a + b) / dataPerTahun.length;
  }
}
