import pandas as pd

# Read the CSV file
df = pd.read_csv('Cincinnati311.csv')

# Get unique SR_TYPE_DESC values
unique_sr_types = df['SR_TYPE_DESC'].unique()

# Write to text file
with open('unique_sr_types.txt', 'w') as f:
    for sr_type in unique_sr_types:
        f.write(str(sr_type) + '\n')

print(f"Found {len(unique_sr_types)} unique SR_TYPE_DESC values")
print("Output written to unique_sr_types.txt")