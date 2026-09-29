import sys
import os
import json
from huggingface_hub import hf_hub_download

sys.stdout.reconfigure(encoding='utf-8')

eval_file = 'data/GUIGuard-Bench/data/eval.jsonl'
if not os.path.exists(eval_file):
    print("Downloading data/eval.jsonl...", flush=True)
    hf_hub_download(repo_id='ShaofantuoshuzhengzhiSha/GUIGuard-Bench', filename='data/eval.jsonl', repo_type='dataset', local_dir='data/GUIGuard-Bench')

labels_file = 'data/GUIGuard-Bench/image_privacy_labels_public_en.json'
if not os.path.exists(labels_file):
    print("Downloading image_privacy_labels_public_en.json...", flush=True)
    hf_hub_download(repo_id='ShaofantuoshuzhengzhiSha/GUIGuard-Bench', filename='image_privacy_labels_public_en.json', repo_type='dataset', local_dir='data/GUIGuard-Bench')

records = [json.loads(line) for line in open(eval_file, 'r', encoding='utf-8') if line.strip()]
pc_records = [r for r in records if r.get('platform') == 'pc']

print(f"Total PC evaluation records in eval.jsonl: {len(pc_records)}", flush=True)

# Target 26 PC evaluation screenshots (official PC example trajectory subset)
sample_pc_records = pc_records[:26]

print(f"Downloading images for {len(sample_pc_records)} PC evaluation steps...", flush=True)
success_count = 0
failed_count = 0

for i, r in enumerate(sample_pc_records):
    img_path = r['image']
    try:
        fpath = hf_hub_download(
            repo_id='ShaofantuoshuzhengzhiSha/GUIGuard-Bench',
            filename=img_path,
            repo_type='dataset',
            local_dir='data/GUIGuard-Bench'
        )
        success_count += 1
        print(f"[{i+1}/{len(sample_pc_records)}] Downloaded: {img_path} ({os.path.getsize(fpath)} bytes)", flush=True)
    except Exception as e:
        failed_count += 1
        print(f"[{i+1}/{len(sample_pc_records)}] Failed {img_path}: {e}", flush=True)

print(f"\nDownload complete: {success_count} succeeded, {failed_count} failed.", flush=True)
