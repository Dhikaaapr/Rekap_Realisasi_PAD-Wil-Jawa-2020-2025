"""
Script untuk membersihkan Excel dan mengekstrak data PAD ke format standard
Usage: python clean_excel.py

Requirements:
pip install openpyxl pandas
"""

import openpyxl
import pandas as pd
from pathlib import Path

def extract_pad_data(input_file, output_file):
    """
    Ekstrak data dari multiple sheets (2021-2025) dan combine jadi satu sheet clean
    """
    print(f"📖 Reading Excel file: {input_file}")
    
    # Load workbook
    wb = openpyxl.load_workbook(input_file, data_only=True)
    
    all_data = []
    
    # Process 2025 data from specific sheet
    sheet_mapping = {
        'LRA (sort) (2)': 2025
    }
    
    for sheet_name, year_val in sheet_mapping.items():
        if sheet_name not in wb.sheetnames:
            print(f"⚠️  Sheet {sheet_name} not found, checking alternatives...")
            # Fallback check
            if '2025' in wb.sheetnames:
                sheet_name = '2025'
            else:
                print(f"❌ No valid sheet found for 2025")
                continue
            
        print(f"📊 Processing {sheet_name} as year {year_val}...")
        sheet = wb[sheet_name]
        year = str(year_val) # converting to string to match rest of logic if needed, or int usage below
        
        # Find data start row (biasanya row 7 atau 8)
        # Look for row with "XI" or "XII" or numeric NO
        data_start_row = None
        for row_idx in range(1, 20):
            cell_value = sheet.cell(row_idx, 1).value  # Column A (NO)
            if cell_value and str(cell_value).strip() in ['XI', 'XII', '1']:
                data_start_row = row_idx
                break
        
        if not data_start_row:
            print(f"❌ Could not find data start row for {year}")
            continue
        
        print(f"   Data starts at row {data_start_row}")
        
        # Extract data rows
        for row_idx in range(data_start_row, sheet.max_row + 1):
            # Column mapping (adjust based on excel_structure.txt)
            # [0]: NO (XI, XII, 1, 2, ...) -> Col A (1)
            # [1]: DAERAH -> Col B (2)
            # [2]: PAJAK ANGGARAN -> Col C (3)
            # [3]: PAJAK REALISASI -> Col D (4)
            # [5]: RETRIBUSI ANGGARAN -> Col F (6)
            # [6]: RETRIBUSI REALISASI -> Col G (7)
            # [8]: KEKAYAAN ANGGARAN -> Col I (9)
            # [9]: KEKAYAAN REALISASI -> Col J (10)
            # [11]: LAIN PAD ANGGARAN -> Col L (12)
            # [12]: LAIN PAD REALISASI -> Col M (13)
            
            nomor_urut = sheet.cell(row_idx, 1).value
            daerah = sheet.cell(row_idx, 2).value
            
            # Skip jika daerah kosong atau bukan valid data row
            if not daerah or daerah == '' or 'DAERAH' in str(daerah).upper():
                continue
            
            # Skip total/summary rows
            if 'TOTAL' in str(daerah).upper() or 'JUMLAH' in str(daerah).upper():
                continue
            
            row_data = {
                'TAHUN': int(year),
                'NOMOR_URUT': str(nomor_urut).strip() if nomor_urut else '',
                'DAERAH': str(daerah).strip(),
                'PAJAK_ANGGARAN': safe_number(sheet.cell(row_idx, 3).value),
                'PAJAK_REALISASI': safe_number(sheet.cell(row_idx, 4).value),
                'RETRIBUSI_ANGGARAN': safe_number(sheet.cell(row_idx, 6).value),
                'RETRIBUSI_REALISASI': safe_number(sheet.cell(row_idx, 7).value),
                'KEKAYAAN_ANGGARAN': safe_number(sheet.cell(row_idx, 9).value),
                'KEKAYAAN_REALISASI': safe_number(sheet.cell(row_idx, 10).value),
                'LAIN_ANGGARAN': safe_number(sheet.cell(row_idx, 12).value),
                'LAIN_REALISASI': safe_number(sheet.cell(row_idx, 13).value),
            }
            
            # Validasi: skip jika semua data numeric = 0
            total_anggaran = (row_data['PAJAK_ANGGARAN'] + row_data['RETRIBUSI_ANGGARAN'] + 
                            row_data['KEKAYAAN_ANGGARAN'] + row_data['LAIN_ANGGARAN'])
            
            if total_anggaran > 0:
                all_data.append(row_data)
                print(f"   ✓ {row_data['DAERAH']}")
    
    # Convert to DataFrame
    df = pd.DataFrame(all_data)
    
    print(f"\n📊 Total records extracted: {len(df)}")
    print(f"   Years: {sorted(df['TAHUN'].unique())}")
    print(f"   Regions: {df['DAERAH'].nunique()}")
    
    # Save to Excel
    print(f"\n💾 Saving clean data to: {output_file}")
    df.to_excel(output_file, sheet_name='REKAP_CLEAN', index=False)
    
    # Also save as CSV for easier import
    csv_file = str(output_file).replace('.xlsx', '.csv')
    df.to_csv(csv_file, index=False)
    print(f"💾 Also saved as CSV: {csv_file}")
    
    print("\n✅ Done! Data berhasil dibersihkan.")
    print(f"\n📋 Preview data:")
    print(df.head(10))
    
    return df


def safe_number(value):
    """Convert Excel cell value to number safely"""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        # Remove non-numeric except decimal point
        cleaned = ''.join(c for c in value if c.isdigit() or c == '.')
        return float(cleaned) if cleaned else 0.0
    return 0.0


def generate_sql_insert(df, output_sql_file):
    """Generate SQL INSERT statements untuk import ke database"""
    print(f"\n🗄️  Generating SQL inserts to: {output_sql_file}")
    
    with open(output_sql_file, 'w', encoding='utf-8') as f:
        f.write("-- SQL Insert statements for PAD Data\n")
        f.write("-- Generated from clean_excel.py\n\n")
        f.write("CREATE TABLE IF NOT EXISTS pad_data (\n")
        f.write("    id BIGINT PRIMARY KEY AUTO_INCREMENT,\n")
        f.write("    tahun INT NOT NULL,\n")
        f.write("    nomor_urut VARCHAR(10),\n")
        f.write("    daerah VARCHAR(255) NOT NULL,\n")
        f.write("    pajak_anggaran DECIMAL(20,2),\n")
        f.write("    pajak_realisasi DECIMAL(20,2),\n")
        f.write("    retribusi_anggaran DECIMAL(20,2),\n")
        f.write("    retribusi_realisasi DECIMAL(20,2),\n")
        f.write("    kekayaan_anggaran DECIMAL(20,2),\n")
        f.write("    kekayaan_realisasi DECIMAL(20,2),\n")
        f.write("    lain_anggaran DECIMAL(20,2),\n")
        f.write("    lain_realisasi DECIMAL(20,2),\n")
        f.write("    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n")
        f.write("    INDEX idx_tahun_daerah (tahun, daerah)\n")
        f.write(");\n\n")
        
        f.write("INSERT INTO pad_data (tahun, nomor_urut, daerah, pajak_anggaran, pajak_realisasi, " +
                "retribusi_anggaran, retribusi_realisasi, kekayaan_anggaran, kekayaan_realisasi, " +
                "lain_anggaran, lain_realisasi) VALUES\n")
        
        for idx, row in df.iterrows():
            daerah_escaped = row['DAERAH'].replace("'", "''")
            values = f"({row['TAHUN']}, '{row['NOMOR_URUT']}', '{daerah_escaped}', " \
                    f"{row['PAJAK_ANGGARAN']}, {row['PAJAK_REALISASI']}, " \
                    f"{row['RETRIBUSI_ANGGARAN']}, {row['RETRIBUSI_REALISASI']}, " \
                    f"{row['KEKAYAAN_ANGGARAN']}, {row['KEKAYAAN_REALISASI']}, " \
                    f"{row['LAIN_ANGGARAN']}, {row['LAIN_REALISASI']})"
            
            if idx < len(df) - 1:
                f.write(f"    {values},\n")
            else:
                f.write(f"    {values};\n")
    
    print(f"✅ SQL file generated: {output_sql_file}")


if __name__ == "__main__":
    # Paths
    base_dir = Path(__file__).parent.parent
    input_excel = base_dir / "assets" / "datarekaprealisasi.xlsx"
    output_excel = base_dir / "assets" / "datarekap_clean.xlsx"
    output_sql = base_dir / "scripts" / "insert_pad_data.sql"
    
    if not input_excel.exists():
        print(f"❌ File not found: {input_excel}")
        print("   Please make sure datarekap.xlsx exists in assets folder")
        exit(1)
    
    # Extract and clean
    df = extract_pad_data(str(input_excel), str(output_excel))
    
    # Generate SQL (optional, untuk backend)
    generate_sql_insert(df, str(output_sql))
    
    print("\n" + "="*60)
    print("🎉 SELESAI!")
    print("="*60)
    print(f"✅ Clean Excel: {output_excel}")
    print(f"✅ CSV Export: {str(output_excel).replace('.xlsx', '.csv')}")
    print(f"✅ SQL Inserts: {output_sql}")
    print("\nNext steps:")
    print("1. Review datarekap_clean.xlsx untuk validasi")
    print("2. Jika pakai OPSI 1: Replace assets/datarekap.xlsx dengan yang clean")
    print("3. Jika pakai OPSI 2: Import insert_pad_data.sql ke MySQL")
