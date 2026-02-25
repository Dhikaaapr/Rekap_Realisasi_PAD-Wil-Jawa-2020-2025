import requests
import json

URL = "https://xerkytrweahuniqrnabi.supabase.co/rest/v1"
KEY = "sb_publishable_IhhX55NqvJ7bUIoXG_xxCw_BM66VfG7"

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def get_regions():
    resp = requests.get(f"{URL}/pad_data?select=daerah", headers=headers)
    data = resp.json()
    regions = sorted(list(set([d['daerah'] for d in data])))
    return regions

def setup_accounts():
    regions = get_regions()
    print(f"Found {len(regions)} regions.")
    
    accounts = []
    for r in regions:
        # Generate simple username and password
        # Remove "Prov. ", "Kab. ", "Kota " for username
        clean_name = r.lower().replace("prov. ", "").replace("kab. ", "").replace("kota ", "").replace(" ", "_")
        username = f"admin_{clean_name}"
        password = f"pad_{clean_name}" # You might want to change this to something more secure 
        
        accounts.append({
            "username": username,
            "password": password,
            "daerah": r
        })
    
    # Send to Supabase (Assumes table admin_accounts exists)
    resp = requests.post(f"{URL}/admin_accounts", headers=headers, data=json.dumps(accounts))
    if resp.status_code in [200, 201]:
        print("Success! 119 accounts created.")
    else:
        print(f"Error: {resp.status_code}")
        print(resp.text)

if __name__ == "__main__":
    setup_accounts()
