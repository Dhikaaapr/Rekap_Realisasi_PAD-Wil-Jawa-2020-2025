import pandas as pd
import os

files_to_check = [
    ('KABKOTA.xlsx', 0),
    ('Database TA 2021 Pendapatan Belanja.xlsx', 0),
    ('Database TA 2022 Pendapatan Belanja.xlsx', 0),
    ('Database TA 2023 Pendapatan Belanja Final.xlsx', 0),
    ('Database TA 2024 Pendapatan Belanja Final.xlsx', 0),
    ('Database Rekap 21 Des 2025 - TA 2025 1.xlsx', 0),
]

def get_sukoharjo_pad(file_name):
    path = os.path.join(r'c:\laragon\www\Rekap Realisasi PAD WIL JAWA 2021-2025\assets', file_name)
    try:
        if 'KABKOTA' in file_name:
            df = pd.read_excel(path)
            row = df[df['Daerah'] == 'Kab. Sukoharjo']
            if not row.empty:
                return row['4.1 - PENDAPATAN ASLI DAERAH (PAD) (Realisasi)'].values[0]
        else:
            df = pd.read_excel(path, header=None)
            for i in range(len(df)):
                if 'Sukoharjo' in str(df.iloc[i, 1]):
                    # Usually Col 6 is PAD? Let's finding PAJAK column
                    # For aggregate files, Col 3/4/5 might be PAD
                    return df.iloc[i, 3] # Adjusted based on earlier inspection
    except Exception as e:
        return f"Error: {e}"
    return "Not found"

for f, _ in files_to_check:
    print(f"{f}: {get_sukoharjo_pad(f)}")
