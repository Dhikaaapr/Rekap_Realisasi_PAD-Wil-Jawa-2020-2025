import 'package:flutter/material.dart';
import '../models/pad_model.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';
import 'detail_screen.dart';
import 'input_data_screen.dart';
import 'import_data_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  final AuthService _authService = AuthService();

  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Cari Daerah...',
                  hintStyle: TextStyle(color: Colors.white70),
                  border: InputBorder.none,
                ),
              )
            : const Text(
                'Rekap dan Pendapatan Asli Daerah Wilayah Jawa 2021-2025',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
        backgroundColor: const Color(0xFF1A237E),
        foregroundColor: Colors.white,
        actions: [
          // Search Toggle
          IconButton(
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                  _searchQuery = '';
                }
              });
            },
            icon: Icon(_isSearching ? Icons.close : Icons.search),
          ),

          // User Profile Menu
          PopupMenuButton<String>(
            icon: CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white24,
              backgroundImage: _authService.photoURL != null
                  ? NetworkImage(_authService.photoURL!)
                  : null,
              child: _authService.photoURL == null
                  ? Icon(
                      _authService.isLoggedIn
                          ? Icons.person
                          : Icons.person_outline,
                      color: Colors.white,
                      size: 20,
                    )
                  : null,
            ),
            onSelected: (value) async {
              if (value == 'logout') {
                await _authService.signOut();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                    (route) => false,
                  );
                }
              } else if (value == 'import_data') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ImportDataScreen()),
                );
              }
            },
            itemBuilder: (context) => [
              if (_authService.isLoggedIn) ...[
                PopupMenuItem<String>(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _authService.displayName ?? 'User',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        _authService.email ?? '',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<String>(
                  value: 'import_data',
                  child: Row(
                    children: [
                      Icon(Icons.cloud_upload, color: Color(0xFF1A237E)),
                      SizedBox(width: 8),
                      Text('Import Data CSV'),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Logout', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ] else ...[
                PopupMenuItem<String>(
                  enabled: false,
                  child: Text(
                    'Mode Tamu',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
      body: StreamBuilder<List<DaerahDataGroup>>(
        stream: _firestoreService.streamGroupedData(),
        builder: (context, snapshot) {
          // Loading state
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Memuat data dari cloud...'),
                ],
              ),
            );
          }

          // Error state
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {}); // Retry
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          // No data
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.inbox_outlined,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  const Text('Belum ada data'),
                  const SizedBox(height: 8),
                  Text(
                    'Import data awal atau tambahkan manual',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          // Filter by Search Query
          List<DaerahDataGroup> filteredData = snapshot.data!;

          if (_searchQuery.isNotEmpty) {
            filteredData = filteredData.where((item) {
              return item.daerah.toLowerCase().contains(_searchQuery) ||
                  item.namaClean.toLowerCase().contains(_searchQuery);
            }).toList();
          }

          // Data loaded successfully

          List<DaerahDataGroup> sortedData = List.from(filteredData);
          // Sort by rataRataPAD descending (Highest first)
          sortedData.sort((a, b) => b.rataRataPAD.compareTo(a.rataRataPAD));

          List<DaerahDataGroup> topList = [];
          List<DaerahDataGroup> middleList = [];
          List<DaerahDataGroup> bottomList = [];

          if (_searchQuery.isNotEmpty) {
            // If searching, just show the results without clustering headers
            middleList = sortedData;
          } else {
            // Clustering logic
            if (sortedData.length <= 20) {
              if (sortedData.length > 10) {
                topList = sortedData.sublist(0, 10);
                bottomList = sortedData.sublist(10);
              } else {
                topList = sortedData;
              }
            } else {
              topList = sortedData.sublist(0, 10);
              bottomList = sortedData.sublist(sortedData.length - 10);
              middleList = sortedData.sublist(10, sortedData.length - 10);
            }
          }

          return Column(
            children: [
              // Stats summary card
              _buildStatsCard(filteredData),

              // Data list (Clustered)
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.only(
                    left: 16,
                    right: 16,
                    top: 8,
                    bottom: 100,
                  ),
                  children: [
                    // Top 10 Section
                    if (topList.isNotEmpty && _searchQuery.isEmpty) ...[
                      _buildSectionHeader(
                        '10 Pendapatan Tertinggi',
                        Colors.green[700]!,
                        Icons.trending_up,
                      ),
                      ...topList.asMap().entries.map(
                        (entry) => _buildRegionCard(
                          entry.value,
                          rank: entry.key + 1,
                          isTop: true,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Middle / Others Section
                    if (middleList.isNotEmpty) ...[
                      if (_searchQuery.isEmpty)
                        _buildSectionHeader(
                          'Daerah Lainnya',
                          Colors.blueGrey[700]!,
                          Icons.domain,
                        ),
                      ...middleList.asMap().entries.map((entry) {
                        // Calculate rank if needed, but for middle list maybe just list them
                        // Rank for middle items starts after topList
                        int rank = _searchQuery.isEmpty
                            ? topList.length + entry.key + 1
                            : entry.key + 1;
                        return _buildRegionCard(entry.value, rank: rank);
                      }),
                      const SizedBox(height: 16),
                    ],

                    // Bottom 10 Section
                    if (bottomList.isNotEmpty && _searchQuery.isEmpty) ...[
                      _buildSectionHeader(
                        '10 Pendapatan Terendah',
                        Colors.red[700]!,
                        Icons.trending_down,
                      ),
                      ...bottomList.asMap().entries.map((entry) {
                        int rank =
                            topList.length + middleList.length + entry.key + 1;
                        return _buildRegionCard(
                          entry.value,
                          rank: rank,
                          isBottom: true,
                        );
                      }),
                    ],
                  ],
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 80),
        child: FloatingActionButton.extended(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const InputDataScreen()),
            );
          },
          backgroundColor: const Color(0xFF1A237E),
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add),
          label: const Text('Tambah Data'),
        ),
      ),
    );
  }

  Widget _buildStatsCard(List<DaerahDataGroup> data) {
    // Calculate totals from all years across all regions
    double totalAnggaran = 0;
    double totalRealisasi = 0;
    int totalDaerah = data.length;
    Set<int> allYears = {};

    for (var group in data) {
      for (var padData in group.dataPerTahun) {
        totalAnggaran += padData.totalAnggaran;
        totalRealisasi += padData.totalRealisasi;
        allYears.add(padData.tahun);
      }
    }

    double persentase = totalAnggaran > 0
        ? (totalRealisasi / totalAnggaran) * 100
        : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Title
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Rekap dan Pendapatan Asli Daerah Wilayah Jawa 2021-2025 ${_getYearRangeFromSet(allYears)}',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem('Total Daerah', '$totalDaerah', Icons.location_on),
              _buildStatItem(
                'Periode',
                '${allYears.length} Tahun',
                Icons.calendar_month,
              ),
            ],
          ),
          const Divider(color: Colors.white30, height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatItem(
                'Total Anggaran',
                _formatMoney(totalAnggaran),
                Icons.account_balance_wallet,
              ),
              _buildStatItem(
                'Total Realisasi',
                _formatMoney(totalRealisasi),
                Icons.trending_up,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.percent, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Rata-rata Capaian: ${persentase.toStringAsFixed(2)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white70, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Color _getTipeColor(String tipe) {
    switch (tipe) {
      case 'Provinsi':
        return const Color(0xFF1A237E);
      case 'Kota':
        return const Color(0xFF0D47A1);
      case 'Kabupaten':
        return const Color(0xFF1565C0);
      default:
        return Colors.grey;
    }
  }

  String _formatMoney(double val) {
    if (val >= 1000000000000) {
      return 'Rp ${(val / 1000000000000).toStringAsFixed(1)} T';
    }
    if (val >= 1000000000) {
      return 'Rp ${(val / 1000000000).toStringAsFixed(1)} M';
    }
    return 'Rp ${(val / 1000000).toStringAsFixed(1)} Jt';
  }

  String _getYearRange(List<int> years) {
    if (years.isEmpty) return '-';
    if (years.length == 1) return years.first.toString();
    final sorted = years.toList()..sort();
    return '${sorted.first}-${sorted.last}';
  }

  String _getYearRangeFromSet(Set<int> years) {
    if (years.isEmpty) return '';
    final sorted = years.toList()..sort();
    return '${sorted.first}-${sorted.last}';
  }

  Widget _buildSectionHeader(String title, Color color, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 4.0),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const Spacer(),
          Container(height: 1, width: 40, color: color.withValues(alpha: 0.3)),
        ],
      ),
    );
  }

  Widget _buildRegionCard(
    DaerahDataGroup group, {
    int? rank,
    bool isTop = false,
    bool isBottom = false,
  }) {
    // Determine colors based on rank/position
    Color borderColor = Colors.transparent;
    Color rankBgColor = Colors.grey.shade100;
    Color rankTextColor = Colors.grey.shade700;
    Color rankBorderColor = Colors.grey.shade300;

    if (isTop) {
      if (rank == 1) {
        borderColor = Colors.amber;
        rankBgColor = Colors.amber.shade100;
        rankTextColor = Colors.amber.shade900;
        rankBorderColor = Colors.amber;
      } else if (rank == 2) {
        borderColor = Colors.grey.shade400; // Silver-ish
        rankBgColor = Colors.grey.shade200;
        rankTextColor = Colors.grey.shade800;
        rankBorderColor = Colors.grey.shade400;
      } else if (rank == 3) {
        borderColor = Colors.brown.shade300; // Bronze-ish
        rankBgColor = Colors.orange.shade50;
        rankTextColor = Colors.brown.shade800;
        rankBorderColor = Colors.brown.shade300;
      } else {
        borderColor = Colors.green.withValues(alpha: 0.3);
        rankBgColor = Colors.green.shade50;
        rankTextColor = Colors.green.shade800;
        rankBorderColor = Colors.green.shade200;
      }
    } else if (isBottom) {
      borderColor = Colors.red.withValues(alpha: 0.3);
      rankBgColor = Colors.red.shade50;
      rankTextColor = Colors.red.shade900;
      rankBorderColor = Colors.red.shade200;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isTop ? 3 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: borderColor,
          width: isTop || isBottom ? 1.5 : 0.5,
        ),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => DetailScreen(daerahGroup: group)),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Rank Badge
              if (rank != null) ...[
                Container(
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: rankBgColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: rankBorderColor, width: 1.5),
                  ),
                  child: Text(
                    '#$rank',
                    style: TextStyle(
                      color: rankTextColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
              ],

              // Icon/Avatar
              CircleAvatar(
                backgroundColor: _getTipeColor(group.tipe),
                radius: 20,
                child: Text(
                  group.namaClean.isNotEmpty
                      ? group.namaClean.substring(0, 1)
                      : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      group.daerah,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatMoney(group.rataRataPAD),
                      style: TextStyle(
                        color: isBottom
                            ? Colors.red[700]
                            : (isTop ? Colors.green[800] : Colors.green[600]),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${group.tipe} • ${_getYearRange(group.tahunList)}',
                      style: TextStyle(color: Colors.grey[600], fontSize: 11),
                    ),
                  ],
                ),
              ),

              // Arrow
              const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
