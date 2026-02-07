import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../models/pad_model.dart';

class DetailScreen extends StatefulWidget {
  final DaerahDataGroup daerahGroup;
  final int? selectedYear;

  const DetailScreen({super.key, required this.daerahGroup, this.selectedYear});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
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

                  // Main PAD Chart
                  _buildMainChart(),
                  const SizedBox(height: 24),

                  // Category Charts
                  _buildCategoryCharts(),
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

  Widget _buildMainChart() {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'TOTAL PAD ${widget.daerahGroup.tipe.toUpperCase()} ${widget.daerahGroup.namaClean.toUpperCase()}',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Color(0xFF1A237E),
            ),
          ),
          const SizedBox(height: 8),
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
          SizedBox(
            height: 250,
            child: _buildBarLineChart(
              dataPoints: widget.daerahGroup.dataPerTahun
                  .map(
                    (d) => ChartDataPoint(
                      tahun: d.tahun,
                      anggaran: d.totalAnggaran,
                      realisasi: d.totalRealisasi,
                    ),
                  )
                  .toList(),
            ),
          ),
        ],
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

  Widget _buildCategoryCharts() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildSmallChart(
                'PAJAK',
                Colors.blue,
                (d) => ChartDataPoint(
                  tahun: d.tahun,
                  anggaran: d.pajakAnggaran,
                  realisasi: d.pajakRealisasi,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSmallChart(
                'RETRIBUSI',
                Colors.teal,
                (d) => ChartDataPoint(
                  tahun: d.tahun,
                  anggaran: d.retribusiAnggaran,
                  realisasi: d.retribusiRealisasi,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildSmallChart(
                'PENGELOLAAN KEKAYAAN',
                Colors.purple,
                (d) => ChartDataPoint(
                  tahun: d.tahun,
                  anggaran: d.pengelolaanAnggaran,
                  realisasi: d.pengelolaanRealisasi,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSmallChart(
                'LAIN PAD',
                Colors.orange,
                (d) => ChartDataPoint(
                  tahun: d.tahun,
                  anggaran: d.lainPadAnggaran,
                  realisasi: d.lainPadRealisasi,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSmallChart(
    String title,
    Color accentColor,
    ChartDataPoint Function(PADData) mapper,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
          Text(
            '$title ${widget.daerahGroup.tipe.toUpperCase()}. ${widget.daerahGroup.namaClean.toUpperCase()}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 10,
              color: accentColor,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 120,
            child: _buildBarLineChart(
              dataPoints: widget.daerahGroup.dataPerTahun.map(mapper).toList(),
              isSmall: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBarLineChart({
    required List<ChartDataPoint> dataPoints,
    bool isSmall = false,
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
