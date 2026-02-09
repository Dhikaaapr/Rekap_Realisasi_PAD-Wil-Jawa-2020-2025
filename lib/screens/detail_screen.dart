import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../models/pad_model.dart';

/// Enum untuk kategori chart yang tersedia
enum ChartCategory {
  totalPAD,
  pajak,
  retribusi,
  pengelolaan,
  lainPAD,
}

/// Extension untuk ChartCategory
extension ChartCategoryExtension on ChartCategory {
  String get title {
    switch (this) {
      case ChartCategory.totalPAD:
        return 'TOTAL PAD';
      case ChartCategory.pajak:
        return 'PAJAK DAERAH';
      case ChartCategory.retribusi:
        return 'RETRIBUSI';
      case ChartCategory.pengelolaan:
        return 'PENGELOLAAN KEKAYAAN';
      case ChartCategory.lainPAD:
        return 'LAIN PAD';
    }
  }

  String get shortTitle {
    switch (this) {
      case ChartCategory.totalPAD:
        return 'TOTAL PAD';
      case ChartCategory.pajak:
        return 'PAJAK';
      case ChartCategory.retribusi:
        return 'RETRIBUSI';
      case ChartCategory.pengelolaan:
        return 'PENGELOLAAN';
      case ChartCategory.lainPAD:
        return 'LAIN PAD';
    }
  }

  Color get color {
    switch (this) {
      case ChartCategory.totalPAD:
        return const Color(0xFF1A237E);
      case ChartCategory.pajak:
        return Colors.blue;
      case ChartCategory.retribusi:
        return Colors.teal;
      case ChartCategory.pengelolaan:
        return Colors.purple;
      case ChartCategory.lainPAD:
        return Colors.orange;
    }
  }

  IconData get icon {
    switch (this) {
      case ChartCategory.totalPAD:
        return Icons.account_balance;
      case ChartCategory.pajak:
        return Icons.receipt_long;
      case ChartCategory.retribusi:
        return Icons.payments;
      case ChartCategory.pengelolaan:
        return Icons.business;
      case ChartCategory.lainPAD:
        return Icons.more_horiz;
    }
  }
}

class DetailScreen extends StatefulWidget {
  final DaerahDataGroup daerahGroup;
  final int? selectedYear;

  const DetailScreen({super.key, required this.daerahGroup, this.selectedYear});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> with TickerProviderStateMixin {
  // Currently featured chart (displayed large at top)
  ChartCategory _featuredChart = ChartCategory.totalPAD;
  
  // Animation controller for smooth transitions
  late AnimationController _swapAnimationController;
  late Animation<double> _swapAnimation;

  @override
  void initState() {
    super.initState();
    _swapAnimationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _swapAnimation = CurvedAnimation(
      parent: _swapAnimationController,
      curve: Curves.easeInOutCubic,
    );
    _swapAnimationController.forward();
  }

  @override
  void dispose() {
    _swapAnimationController.dispose();
    super.dispose();
  }

  /// Swap the featured chart with a small chart
  void _swapChart(ChartCategory newFeatured) {
    if (newFeatured == _featuredChart) return;
    
    _swapAnimationController.reverse().then((_) {
      setState(() {
        _featuredChart = newFeatured;
      });
      _swapAnimationController.forward();
    });
  }

  /// Get chart data points for a given category
  List<ChartDataPoint> _getChartData(ChartCategory category) {
    return widget.daerahGroup.dataPerTahun.map((d) {
      switch (category) {
        case ChartCategory.totalPAD:
          return ChartDataPoint(
            tahun: d.tahun,
            anggaran: d.totalAnggaran,
            realisasi: d.totalRealisasi,
          );
        case ChartCategory.pajak:
          return ChartDataPoint(
            tahun: d.tahun,
            anggaran: d.pajakAnggaran,
            realisasi: d.pajakRealisasi,
          );
        case ChartCategory.retribusi:
          return ChartDataPoint(
            tahun: d.tahun,
            anggaran: d.retribusiAnggaran,
            realisasi: d.retribusiRealisasi,
          );
        case ChartCategory.pengelolaan:
          return ChartDataPoint(
            tahun: d.tahun,
            anggaran: d.pengelolaanAnggaran,
            realisasi: d.pengelolaanRealisasi,
          );
        case ChartCategory.lainPAD:
          return ChartDataPoint(
            tahun: d.tahun,
            anggaran: d.lainPadAnggaran,
            realisasi: d.lainPadRealisasi,
          );
      }
    }).toList();
  }

  /// Get all categories except the featured one (for small charts)
  List<ChartCategory> get _smallChartCategories {
    return ChartCategory.values.where((c) => c != _featuredChart).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: CustomScrollView(
        slivers: [
          // App Bar with Province Name
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: const Color(0xFF1A237E),
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                '${widget.daerahGroup.tipe.toUpperCase()} ${widget.daerahGroup.namaClean.toUpperCase()}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1A237E), Color(0xFF303F9F)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Info Cards
                  _buildInfoCards(),
                  const SizedBox(height: 24),

                  // Featured Chart (Large - Can be swapped)
                  FadeTransition(
                    opacity: _swapAnimation,
                    child: ScaleTransition(
                      scale: _swapAnimation,
                      child: _buildFeaturedChart(),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Category Selector Chips
                  _buildCategorySelector(),
                  const SizedBox(height: 16),

                  // Small Charts (4 remaining categories)
                  _buildSmallCharts(),
                  const SizedBox(height: 24),

                  // Data Table
                  _buildDataTable(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCards() {
    // Calculate averages
    double avgPAD = widget.daerahGroup.rataRataPAD;
    double avgPajak = widget.daerahGroup.rataRataPajak;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildInfoRow('Instansi Pemungut', 'BAPENDA'),
          const Divider(),
          _buildInfoRow(
            'Rata-rata PAD',
            '${_formatCurrency(avgPAD)} ($tahunRange)',
          ),
          const Divider(),
          _buildInfoRow('Rata-rata Pajak Daerah', _formatCurrency(avgPajak)),
          const Divider(),
          _buildInfoRow(
            'Data Tersedia',
            '${widget.daerahGroup.tahunList.length} Tahun',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              ': $value',
              style: const TextStyle(fontWeight: FontWeight.bold),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  String get tahunRange {
    final years = widget.daerahGroup.tahunList;
    if (years.isEmpty) return '-';
    return '${years.first}-${years.last}';
  }

  /// Build the featured (large) chart at the top
  Widget _buildFeaturedChart() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _featuredChart.color.withValues(alpha: 0.3),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: _featuredChart.color.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _featuredChart.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _featuredChart.icon,
                  color: _featuredChart.color,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_featuredChart.title} ${widget.daerahGroup.tipe.toUpperCase()}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: _featuredChart.color,
                      ),
                    ),
                    Text(
                      widget.daerahGroup.namaClean.toUpperCase(),
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              // Featured badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _featuredChart.color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star, color: Colors.white, size: 14),
                    SizedBox(width: 4),
                    Text(
                      'Featured',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Legend
          Row(
            children: [
              _buildLegendItem('Anggaran', const Color(0xFFFFC107)),
              const SizedBox(width: 16),
              _buildLegendItem('Realisasi', const Color(0xFF4CAF50)),
              const SizedBox(width: 16),
              _buildLegendItem('Trendline', Colors.orange, isDashed: true),
            ],
          ),
          const SizedBox(height: 20),
          
          // Chart
          SizedBox(
            height: 280,
            child: _buildBarLineChart(
              dataPoints: _getChartData(_featuredChart),
              isSmall: false,
              accentColor: _featuredChart.color,
            ),
          ),
        ],
      ),
    );
  }

  /// Build category selector chips
  Widget _buildCategorySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.touch_app, color: Colors.grey[600], size: 18),
            const SizedBox(width: 8),
            Text(
              'Klik grafik di bawah untuk tukar posisi',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 13,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Build small charts section
  Widget _buildSmallCharts() {
    final categories = _smallChartCategories;
    
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildClickableSmallChart(categories[0])),
            const SizedBox(width: 12),
            Expanded(child: _buildClickableSmallChart(categories[1])),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildClickableSmallChart(categories[2])),
            const SizedBox(width: 12),
            Expanded(child: _buildClickableSmallChart(categories[3])),
          ],
        ),
      ],
    );
  }

  /// Build a clickable small chart that swaps with featured when tapped
  Widget _buildClickableSmallChart(ChartCategory category) {
    return GestureDetector(
      onTap: () => _swapChart(category),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: category.color.withValues(alpha: 0.2),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with tap indicator
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: category.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(
                    category.icon,
                    color: category.color,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${category.shortTitle} ${widget.daerahGroup.tipe.toUpperCase()}.',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                      color: category.color,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                // Tap to swap indicator
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.swap_vert,
                    size: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              widget.daerahGroup.namaClean.toUpperCase(),
              style: TextStyle(
                fontSize: 9,
                color: Colors.grey[500],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 100,
              child: _buildBarLineChart(
                dataPoints: _getChartData(category),
                isSmall: true,
                accentColor: category.color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color, {bool isDashed = false}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 24,
          height: isDashed ? 2 : 12,
          decoration: BoxDecoration(
            color: isDashed ? null : color,
            borderRadius: isDashed ? null : BorderRadius.circular(2),
          ),
          child: isDashed
              ? CustomPaint(painter: DashedLinePainter(color: color))
              : null,
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }

  Widget _buildBarLineChart({
    required List<ChartDataPoint> dataPoints,
    bool isSmall = false,
    Color accentColor = Colors.blue,
  }) {
    if (dataPoints.isEmpty) {
      return const Center(child: Text('Data tidak tersedia'));
    }

    // Sort by year
    dataPoints.sort((a, b) => a.tahun.compareTo(b.tahun));

    // Find max value for scaling
    double maxVal = 0;
    for (var point in dataPoints) {
      if (point.anggaran > maxVal) maxVal = point.anggaran;
      if (point.realisasi > maxVal) maxVal = point.realisasi;
    }
    maxVal = maxVal * 1.2;
    if (maxVal == 0) maxVal = 100;

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceEvenly,
        maxY: maxVal,
        barTouchData: BarTouchData(
          enabled: !isSmall,
          touchTooltipData: BarTouchTooltipData(
            getTooltipColor: (_) => Colors.blueGrey.shade700,
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              String label = rodIndex == 0 ? 'Anggaran' : 'Realisasi';
              return BarTooltipItem(
                '$label\n${_formatCurrency(rod.toY)}',
                const TextStyle(color: Colors.white, fontSize: 11),
              );
            },
          ),
        ),
        titlesData: FlTitlesData(
          show: true,
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (double value, TitleMeta meta) {
                if (value.toInt() < dataPoints.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 4.0),
                    child: Text(
                      isSmall
                          ? dataPoints[value.toInt()].tahun
                                .toString()
                                .substring(2)
                          : dataPoints[value.toInt()].tahun.toString(),
                      style: TextStyle(fontSize: isSmall ? 8 : 10),
                    ),
                  );
                }
                return const Text('');
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: !isSmall,
              reservedSize: 45,
              getTitlesWidget: (value, meta) {
                return Text(
                  _formatShort(value),
                  style: const TextStyle(fontSize: 9),
                );
              },
            ),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
        ),
        gridData: FlGridData(
          show: !isSmall,
          horizontalInterval: maxVal / 4,
          getDrawingHorizontalLine: (value) =>
              FlLine(color: Colors.grey.shade200, strokeWidth: 1),
        ),
        borderData: FlBorderData(show: false),
        barGroups: dataPoints.asMap().entries.map((entry) {
          return BarChartGroupData(
            x: entry.key,
            barsSpace: isSmall ? 2 : 4,
            barRods: [
              BarChartRodData(
                toY: entry.value.anggaran,
                color: const Color(0xFFFFC107),
                width: isSmall ? 8 : 14,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(3),
                ),
              ),
              BarChartRodData(
                toY: entry.value.realisasi,
                color: const Color(0xFF4CAF50),
                width: isSmall ? 8 : 14,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(3),
                ),
              ),
            ],
          );
        }).toList(),
        extraLinesData: ExtraLinesData(extraLinesOnTop: true),
      ),
    );
  }

  Widget _buildDataTable() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Detail Data per Tahun',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF1A237E),
              ),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(const Color(0xFFF5F7FA)),
              columnSpacing: 20,
              columns: const [
                DataColumn(
                  label: Text(
                    'Tahun',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Total Anggaran',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                DataColumn(
                  label: Text(
                    'Total Realisasi',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                DataColumn(
                  label: Text(
                    '%',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
              rows: widget.daerahGroup.dataPerTahun.map((data) {
                return DataRow(
                  cells: [
                    DataCell(Text(data.tahun.toString())),
                    DataCell(Text(_formatCurrency(data.totalAnggaran))),
                    DataCell(Text(_formatCurrency(data.totalRealisasi))),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: data.totalPersentase >= 100
                              ? Colors.green.withValues(alpha: 0.1)
                              : Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${data.totalPersentase.toStringAsFixed(1)}%',
                          style: TextStyle(
                            color: data.totalPersentase >= 100
                                ? Colors.green
                                : Colors.orange,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  String _formatCurrency(double value) {
    if (value >= 1000000000000) {
      return 'Rp ${(value / 1000000000000).toStringAsFixed(2)} T';
    } else if (value >= 1000000000) {
      return 'Rp ${(value / 1000000000).toStringAsFixed(2)} M';
    } else if (value >= 1000000) {
      return 'Rp ${(value / 1000000).toStringAsFixed(2)} jt';
    }
    return 'Rp ${value.toStringAsFixed(0)}';
  }

  String _formatShort(double value) {
    if (value >= 1000000000000) {
      return '${(value / 1000000000000).toStringAsFixed(0)}T';
    } else if (value >= 1000000000) {
      return '${(value / 1000000000).toStringAsFixed(0)}M';
    } else if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(0)}jt';
    }
    return value.toStringAsFixed(0);
  }
}

// Data class for chart
class ChartDataPoint {
  final int tahun;
  final double anggaran;
  final double realisasi;

  ChartDataPoint({
    required this.tahun,
    required this.anggaran,
    required this.realisasi,
  });
}

// Custom painter for dashed line legend
class DashedLinePainter extends CustomPainter {
  final Color color;

  DashedLinePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2;

    double startX = 0;
    const dashWidth = 4;
    const dashSpace = 2;

    while (startX < size.width) {
      canvas.drawLine(
        Offset(startX, size.height / 2),
        Offset(startX + dashWidth, size.height / 2),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
