import json
import os

labels_file = 'data/GUIGuard-Bench/image_privacy_labels_public_en.json'
with open(labels_file, 'r', encoding='utf-8') as f:
    all_labels = json.load(f)

pc136_map = {item['info']: item for item in all_labels if item.get('info', '').startswith('PC/136/')}
local_files = [f for f in os.listdir('data/GUIGuard-Bench/PC/136') if f.endswith('.png')]
local_files.sort()

def run_pipeline(ocr_items):
    detected = []
    reg_id = 1
    for item in ocr_items:
        text = item['text']
        bbox = item['bbox']
        is_sens = False
        cat = 'OTHER'
        risk = 'LOW'
        
        if 'USA-' in text or 'ID:' in text or '320102' in text:
            is_sens = True; cat = 'IDENTIFIER_SSN'; risk = 'HIGH'
        elif any(k in text.lower() for k in ['blood pressure', 'heart rate', 'bmi', 'medical history', 'allergies', 'insurance id']) or ('/' in text and any(c.isdigit() for c in text)):
            is_sens = True; cat = 'PERSONAL_HEALTH_RECORD'; risk = 'HIGH'
        elif any(k in text for k in ['2024-01', '2024-02', '2024-03']) or ('72' in text or '73' in text or '175' in text):
            is_sens = True; cat = 'HEALTH_METRIC_DATA'; risk = 'MEDIUM'
        elif any(k in text.lower() for k in ['surgery', 'appendicitis', 'fatty liver', 'penicillin', 'seafood']):
            is_sens = True; cat = 'MEDICAL_HISTORY'; risk = 'HIGH'
        elif any(k in text.lower() for k in ['recovering', 'good recovery', 'fitness plan', 'visible results', 'weight decreasing', 'target weight']):
            is_sens = True; cat = 'PATIENT_NOTES'; risk = 'MEDIUM'

        if is_sens:
            detected.append({'id': f'det_{reg_id}', 'bbox': bbox, 'category': cat, 'risk': risk})
            reg_id += 1
    return detected

def iou(b1, b2):
    xA = max(b1['x'], b2['x'])
    yA = max(b1['y'], b2['y'])
    xB = min(b1['x'] + b1['width'], b2['x'] + b2['width'])
    yB = min(b1['y'] + b1['height'], b2['y'] + b2['height'])
    iW = max(0, xB - xA)
    iH = max(0, yB - yA)
    iA = iW * iH
    uA = b1['width']*b1['height'] + b2['width']*b2['height'] - iA
    return iA / uA if uA > 0 else 0

fn_list = []
tp_list = []

for f in local_files:
    rel = f'PC/136/{f}'
    item = pc136_map.get(rel)
    if not item: continue
    
    ocr_items = []
    gt_boxes = []
    
    for lbl in item.get('labels', []):
        pts = lbl.get('points', [])
        if len(pts) != 4: continue
        xmin, ymin, xmax, ymax = pts
        bbox = {'x': xmin, 'y': ymin, 'width': xmax - xmin, 'height': ymax - ymin}
        text = lbl.get('attr', {}).get('ocrResult', '')
        is_essential = lbl.get('attr', {}).get('is_task_essential_privacy') == 'yes'
        risk = (lbl.get('label') or '').lower()
        
        ocr_items.append({'bbox': bbox, 'text': text})
        
        if risk in ['high_risk', 'medium_risk', 'low_risk'] and not is_essential:
            gt_boxes.append({
                '_id': lbl.get('_id', lbl.get('id')),
                'bbox': bbox,
                'risk': risk,
                'ocrText': text,
                'cat': lbl.get('attr', {}).get('category', 'OTHER')
            })
            
    detected = run_pipeline(ocr_items)
    
    matched_gt = set()
    for det in detected:
        for idx, gt in enumerate(gt_boxes):
            if iou(det['bbox'], gt['bbox']) >= 0.5:
                matched_gt.add(idx)
                
    for idx, gt in enumerate(gt_boxes):
        if idx in matched_gt:
            tp_list.append({'file': f, 'gt': gt})
        else:
            fn_list.append({'file': f, 'gt': gt})

print(f'Total TP: {len(tp_list)}, Total FN: {len(fn_list)}')
print('\n--- ALL FALSE NEGATIVES BY TEXT & RISK ---')
fn_by_text = {}
for item in fn_list:
    txt = item['gt']['ocrText'].replace('\n', ' ')[:60]
    fn_by_text[txt] = fn_by_text.get(txt, 0) + 1

for txt, count in sorted(fn_by_text.items(), key=lambda x: x[1], reverse=True):
    print(f'Count {count:2d}: "{txt}"')
