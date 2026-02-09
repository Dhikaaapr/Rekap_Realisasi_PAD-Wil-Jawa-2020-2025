import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../models/pad_model.dart';
import '../models/klaster_model.dart';
import '../services/firestore_service.dart';
import 'detail_screen.dart';


class KlasterScreen extends StatefulWidget {
  const KlasterScreen({super.key});

  @override
  State<KlasterScreen> createState() => _KlasterScreenState();
}

class _KlasterScreenState extends State<KlasterScreen> with SingleTickerProviderStateMixin {
  final FirestoreService _firestoreService = FirestoreService();
  
  bool _isLoading = true;
  
  List<DaerahDataGroup> _groupedData = [];
  List<KlasterSummary> _klasterSummaries = [];
  Set<int> _allYears = {};
  
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    );
    _loadData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      // Stream grouped data
      _firestoreService.streamGroupedData().listen((data) {
        if (mounted) {
          setState(() {
            _groupedData = data;
            _processKlasterData();
            _isLoading = false;
          });
          _animationController.forward(from: 0);
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _processKlasterData() {
    // Collect all years
    _allYears = {};
    for (var group in _groupedData) {
      for (var data in group.dataPerTahun) {
        _allYears.add(data.tahun);
      }
    }

    // Create DaerahKlaster from grouped data using average PAD
    List<DaerahKlaster> klasterData = [];
    
    for (var group in _groupedData) {
      // Calculate totals for this region across all years
      double totalAnggaran = 0;
      double totalRealisasi = 0;
      double pajakAnggaran = 0;
      double pajakRealisasi = 0;
      double retribusiAnggaran = 0;
      double retribusiRealisasi = 0;
      double pengelolaanAnggaran = 0;
      double pengelolaanRealisasi = 0;
      double lainPadAnggaran = 0;
      double lainPadRealisasi = 0;

      for (var data in group.dataPerTahun) {
        totalAnggaran += data.totalAnggaran;
        totalRealisasi += data.totalRealisasi;
        pajakAnggaran += data.pajakAnggaran;
        pajakRealisasi += data.pajakRealisasi;
        retribusiAnggaran += data.retribusiAnggaran;
        retribusiRealisasi += data.retribusiRealisasi;
        pengelolaanAnggaran += data.pengelolaanAnggaran;
        pengelolaanRealisasi += data.pengelolaanRealisasi;
        lainPadAnggaran += data.lainPadAnggaran;
        lainPadRealisasi += data.lainPadRealisasi;
      }

      // Use average PAD for clustering
      double avgRealisasi = group.dataPerTahun.isNotEmpty 
          ? totalRealisasi / group.dataPerTahun.length 
          : 0;
      
      double persentase = totalAnggaran > 0 
          ? (totalRealisasi / totalAnggaran) * 100 
          : 0;

      klasterData.add(DaerahKlaster(
        daerah: group.daerah,
        namaClean: group.namaClean,
        tipe: group.tipe,
        tahun: 0, // All years
        klaster: KlasterHelper.getKlaster(avgRealisasi),
        totalAnggaran: totalAnggaran,
        totalRealisasi: totalRealisasi,
        persentaseRealisasi: persentase,
        pajakAnggaran: pajakAnggaran,
        pajakRealisasi: pajakRealisasi,
        retribusiAnggaran: retribusiAnggaran,
        retribusiRealisasi: retribusiRealisasi,
        pengelolaanAnggaran: pengelolaanAnggaran,
        pengelolaanRealisasi: pengelolaanRealisasi,
        lainPadAnggaran: lainPadAnggaran,
        lainPadRealisasi: lainPadRealisasi,
      ));
    }

    // Generate summary
    _klasterSummaries = KlasterService.generateSummary(klasterData);
  }

  String get _yearRangeText {
    if (_allYears.isEmpty) return '';
    final sorted = _allYears.toList()..sort();
    return '${sorted.first}-${sorted.last}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      appBar: AppBar(
        title: const Text(
          'Klasterisasi PAD',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1A237E),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          // Refresh Button
          IconButton(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Data',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Menganalisis data klaster...'),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Info Banner
                  _buildInfoBanner(),
                  
                  const SizedBox(height: 16),
                  
                  // Pie Chart
                  _buildPieChartCard(),
                  
                  const SizedBox(height: 24),
                  
                  // Klaster Legend & Stats
                  _buildKlasterLegend(),
                  
                  const SizedBox(height: 24),
                  
                  // Detail per Klaster
                  _buildKlasterDetails(),
                  
                  const SizedBox(height: 100), // Space for bottom nav
                ],
              ),
            ),
    );
  }

  Widget _buildInfoBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.pie_chart,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Klasterisasi PAD Wilayah Jawa',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Berdasarkan rata-rata PAD $_yearRangeText',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPieChartCard() {
    // Calculate total for non-empty klasters
    int totalDaerah = _klasterSummaries.fold(0, (sum, s) => sum + s.jumlahDaerah);
    
    if (totalDaerah == 0) {
      return Card(
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Padding(
          padding: EdgeInsets.all(32),
          child: Center(
            child: Column(
              children: [
                Icon(Icons.pie_chart_outline, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text(
                  'Tidak ada data',
                  style: TextStyle(color: Colors.grey, fontSize: 16),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              'Distribusi Klaster PAD $_yearRangeText',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A237E),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Total: $totalDaerah Daerah',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 24),
            
            // Animated Pie Chart
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return SizedBox(
                  height: 250,
                  child: CustomPaint(
                    size: const Size(250, 250),
                    painter: PieChartPainter(
                      summaries: _klasterSummaries,
                      animationValue: _animation.value,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKlasterLegend() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Keterangan Klaster',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A237E),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Berdasarkan rata-rata PAD Realisasi per tahun',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 16),
            
            // Legend grid
            Wrap(
              spacing: 16,
              runSpacing: 12,
              children: _klasterSummaries.where((s) => s.jumlahDaerah > 0).map((summary) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Color(summary.klaster.colorValue).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Color(summary.klaster.colorValue).withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          color: Color(summary.klaster.colorValue),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${summary.klaster.nama}: ${summary.jumlahDaerah}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            summary.klaster.rangeLabel,
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKlasterDetails() {
    // Only show klasters with data
    final nonEmptyKlasters = _klasterSummaries.where((s) => s.jumlahDaerah > 0).toList();
    
    if (nonEmptyKlasters.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Detail per Klaster',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1A237E),
          ),
        ),
        const SizedBox(height: 12),
        
        ...nonEmptyKlasters.map((summary) => _buildKlasterCard(summary)),
      ],
    );
  }

  Widget _buildKlasterCard(KlasterSummary summary) {
    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Color(summary.klaster.colorValue),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                '${summary.jumlahDaerah}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
          ),
          title: Text(
            summary.klaster.nama,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(
                summary.klaster.rangeLabel,
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(height: 2),
              Text(
                '${summary.persentaseDariTotal.toStringAsFixed(1)}% dari total daerah',
                style: TextStyle(
                  color: Color(summary.klaster.colorValue),
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          children: [
            const Divider(height: 1),
            
            // Header row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.grey[100],
              child: const Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Text(
                      'Daerah',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      'Rata-rata PAD',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      textAlign: TextAlign.right,
                    ),
                  ),
                  Expanded(
                    flex: 1,
                    child: Text(
                      '%',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ],
              ),
            ),
            
            // Daftar daerah (sorted by persentase tertinggi)
            ...summary.daftarDaerah.take(15).map((daerah) {
              // Find the corresponding group to pass to DetailScreen
              final group = _groupedData.firstWhere(
                (g) => g.daerah == daerah.daerah,
                orElse: () => DaerahDataGroup(
                  daerah: daerah.daerah,
                  namaClean: daerah.namaClean,
                  tipe: daerah.tipe,
                  dataPerTahun: [],
                ),
              );

              return Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: group.dataPerTahun.isEmpty ? null : () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DetailScreen(daerahGroup: group),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Colors.grey[200]!),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                daerah.namaClean,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                daerah.tipe,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[500],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(
                            _formatMoney(daerah.totalRealisasi / (_allYears.isNotEmpty ? _allYears.length : 1)),
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 12,
                              color: Colors.green,
                            ),
                            textAlign: TextAlign.right,
                          ),
                        ),
                        Expanded(
                          flex: 1,
                          child: Text(
                            '${daerah.persentaseRealisasi.toStringAsFixed(1)}%',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: _getPersentaseColor(daerah.persentaseRealisasi),
                            ),
                            textAlign: TextAlign.right,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            
            // Show more indicator if more than 15
            if (summary.daftarDaerah.length > 15)
              Container(
                padding: const EdgeInsets.all(12),
                child: Text(
                  '+${summary.daftarDaerah.length - 15} daerah lainnya',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatMoney(double val) {
    if (val >= 1000000000000) {
      return 'Rp ${(val / 1000000000000).toStringAsFixed(2)} T';
    }
    if (val >= 1000000000) {
      return 'Rp ${(val / 1000000000).toStringAsFixed(1)} M';
    }
    return 'Rp ${(val / 1000000).toStringAsFixed(1)} Jt';
  }

  Color _getPersentaseColor(double persen) {
    if (persen >= 100) return Colors.green;
    if (persen >= 80) return Colors.orange;
    return Colors.red;
  }
}

/// Custom Pie Chart Painter with animation
class PieChartPainter extends CustomPainter {
  final List<KlasterSummary> summaries;
  final double animationValue;

  PieChartPainter({
    required this.summaries,
    required this.animationValue,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 20;
    
    // Filter non-empty klasters
    final nonEmpty = summaries.where((s) => s.jumlahDaerah > 0).toList();
    
    if (nonEmpty.isEmpty) return;

    // Calculate total
    int total = nonEmpty.fold(0, (sum, s) => sum + s.jumlahDaerah);
    
    double startAngle = -math.pi / 2; // Start from top
    
    for (var summary in nonEmpty) {
      final sweepAngle = (summary.jumlahDaerah / total) * 2 * math.pi * animationValue;
      
      final paint = Paint()
        ..color = Color(summary.klaster.colorValue)
        ..style = PaintingStyle.fill;
      
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        true,
        paint,
      );
      
      // Draw separator line
      final separatorPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        true,
        separatorPaint,
      );
      
      // Draw percentage label if segment is big enough
      if (sweepAngle > 0.3) {
        final midAngle = startAngle + sweepAngle / 2;
        final labelRadius = radius * 0.65;
        final labelX = center.dx + labelRadius * math.cos(midAngle);
        final labelY = center.dy + labelRadius * math.sin(midAngle);
        
        final textPainter = TextPainter(
          text: TextSpan(
            text: '${summary.persentaseDariTotal.toStringAsFixed(0)}%',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          textDirection: TextDirection.ltr,
        );
        textPainter.layout();
        textPainter.paint(
          canvas,
          Offset(labelX - textPainter.width / 2, labelY - textPainter.height / 2),
        );
      }
      
      startAngle += sweepAngle;
    }
    
    // Draw center circle (donut effect)
    final centerPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(center, radius * 0.4, centerPaint);
    
    // Draw center text
    final centerTextPainter = TextPainter(
      text: TextSpan(
        text: '$total\nDaerah',
        style: const TextStyle(
          color: Color(0xFF1A237E),
          fontWeight: FontWeight.bold,
          fontSize: 16,
          height: 1.2,
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );
    centerTextPainter.layout();
    centerTextPainter.paint(
      canvas,
      Offset(center.dx - centerTextPainter.width / 2, center.dy - centerTextPainter.height / 2),
    );
  }

  @override
  bool shouldRepaint(covariant PieChartPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue ||
           oldDelegate.summaries != summaries;
  }
}
