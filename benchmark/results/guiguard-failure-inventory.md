# GUIGuard-Bench PC Trajectory False-Negative & Failure Inventory

## 1. Summary of GT Privacy Region Outcomes

- **Total Official Privacy Regions Evaluated**: 104
- **True Positives (Detected & Matched $\text{IoU} \ge 0.5$)**: 58 (55.77%)
- **False Negatives (Unmatched Privacy Regions)**: 46 (44.23%)

---

## 2. Inventory of Evaluated Privacy Regions

| Screenshot | Official ID | Risk | Category | Official Text Snippet | Status | Failure Class | Reason for Miss |
| :--- | :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| `step_10_20251106@080732.png` | `6964746f02180e703215fdd8` | LOW_RISK | 3 | `Nov 6 08:07` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_11_20251106@080808.png` | `6964746f02180e703215fdd5` | LOW_RISK | 3 | `Nov 6 08:08` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_12_20251106@080849.png` | `6964746f02180e703215fdd6` | LOW_RISK | 3 | `Nov 6 08:08` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_13_20251106@080921.png` | `6964746f02180e703215fdd3` | LOW_RISK | 3 | `Nov 6 08:09` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_14_20251106@080952.png` | `6964746f02180e703215fdd4` | LOW_RISK | 3 | `Nov 6 08:09` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_15_20251106@081028.png` | `6964746f02180e703215fdd2` | LOW_RISK | 3 | `Nov 6 08:10` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_16_20251106@081105.png` | `6964746f02180e703215fdd0` | LOW_RISK | 3 | `Nov 6 08:11` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_17_20251106@081136.png` | `6964746f02180e703215fdd1` | LOW_RISK | 3 | `Nov 6 08:11` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_18_20251106@081213.png` | `6964746f02180e703215fdce` | LOW_RISK | 3 | `Nov 6 08:12` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_19_20251106@081242.png` | `6964746f02180e703215fdcf` | LOW_RISK | 3 | `Nov 6 08:12` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_1_20251106@080018.png` | `6964746f02180e703215fdc0` | LOW_RISK | 3 | `Nov 6 08:00` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee806a` | MEDIUM_RISK | 3 | `2024-01-08  2024-01-15  2024-01-22 ` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee8073` | MEDIUM_RISK | 5 | `175 175 175 175 175 175 175 175 175` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee807b` | MEDIUM_RISK | 5 | `72.5  73  72.8  73.5  73.2  72.6  7` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee8083` | MEDIUM_RISK | 5 | `23.7  23. 8  23. 8  24 23.9 23.7 23` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee808b` | MEDIUM_RISK | 5 | `118/75  120/78  115/73  122/80  119` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee8093` | MEDIUM_RISK | 5 | `68 72 65 70 68 66 64 65 63 64` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee809c` | MEDIUM_RISK | 5 | `94 97 92 95 94 92 90 92 88 90` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee80a5` | MEDIUM_RISK | 5 | `97.9 97.7 98.1 97.9  97.7 97.9 98.1` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee80ae` | MEDIUM_RISK | 5 | `Normal checkup  Recovering from col` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee8106` | MEDIUM_RISK | 5 | `Appendicitis surgery 2019; Mild fat` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_1_20251106@080018.png` | `6964975721679ceb9eee810e` | HIGH_RISK | 2 | `USA-320102-1988XXXXXXXX` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_20_20251106@081315.png` | `6964746f02180e703215fdcd` | LOW_RISK | 3 | `Nov 6 08:13` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_21_20251106@081416.png` | `6964746f02180e703215fdcb` | LOW_RISK | 3 | `Nov 6 08:14` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_22_20251106@081440.png` | `6964746f02180e703215fdcc` | LOW_RISK | 3 | `Nov 6 08:14` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_23_20251106@081510.png` | `6964746f02180e703215fdc9` | LOW_RISK | 3 | `Nov 6 08:15` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee8070` | MEDIUM_RISK | 3 | `2024-01-08  2024-01-15  2024-01-22 ` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee8078` | MEDIUM_RISK | 5 | `175 175 175 175 175 175 175 175 175` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee8080` | MEDIUM_RISK | 5 | `72.5  73  72.8  73.5  73.2  72.6  7` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee8088` | MEDIUM_RISK | 5 | `23.7  23. 8  23. 8  24 23.9 23.7 23` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee8090` | MEDIUM_RISK | 5 | `118/75  120/78  115/73  122/80  119` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee8099` | MEDIUM_RISK | 5 | `68 72 65 70 68 66 64 65 63 64` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee80a2` | MEDIUM_RISK | 5 | `94 97 92 95 94 92 90 92 88 90` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee80ab` | MEDIUM_RISK | 5 | `97.9 97.7 98.1 97.9  97.7 97.9 98.1` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee80b4` | MEDIUM_RISK | 5 | `Normal checkup  Recovering from col` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee810b` | MEDIUM_RISK | 5 | `Appendicitis surgery 2019; Mild fat` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_23_20251106@081510.png` | `6964975721679ceb9eee8113` | HIGH_RISK | 2 | `USA-320102-1988XXXXXXXX` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_24_20251106@081550.png` | `6964746f02180e703215fdca` | LOW_RISK | 3 | `Nov 6 08:15` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_25_20251106@081623.png` | `6964746f02180e703215fdc7` | LOW_RISK | 3 | `Nov 6 08:16` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_2_20251106@080211.png` | `6964746f02180e703215fdc1` | LOW_RISK | 3 | `Nov 6 08:02` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee806b` | MEDIUM_RISK | 3 | `2024-01-08  2024-01-15  2024-01-22 ` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee8074` | MEDIUM_RISK | 5 | `175 175 175 175 175 175 175 175 175` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee807c` | MEDIUM_RISK | 5 | `72.5  73  72.8  73.5  73.2  72.6  7` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee8084` | MEDIUM_RISK | 5 | `23.7  23. 8  23. 8  24 23.9 23.7 23` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee808c` | MEDIUM_RISK | 5 | `118/75  120/78  115/73  122/80  119` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee8094` | MEDIUM_RISK | 5 | `68 72 65 70 68 66 64 65 63 64` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee809d` | MEDIUM_RISK | 5 | `94 97 92 95 94 92 90 92 88 90` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee80a6` | MEDIUM_RISK | 5 | `97.9 97.7 98.1 97.9  97.7 97.9 98.1` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee80af` | MEDIUM_RISK | 5 | `Normal checkup  Recovering from col` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee8107` | MEDIUM_RISK | 5 | `Appendicitis surgery 2019; Mild fat` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `6964975721679ceb9eee810f` | HIGH_RISK | 2 | `USA-320102-1988XXXXXXXX` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_2_20251106@080211.png` | `69788b9cfb6fdbc1908c07f3` | LOW_RISK | 6 | `Date Height(cm) Weight(kg) BMI  Blo` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964746f02180e703215fdc2` | LOW_RISK | 3 | `Nov 6 08:03` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee806c` | MEDIUM_RISK | 3 | `2024-01-08  2024-01-15  2024-01-22 ` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee8075` | MEDIUM_RISK | 5 | `175 175 175 175 175 175 175 175 175` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee807d` | MEDIUM_RISK | 5 | `72.5  73  72.8  73.5  73.2  72.6  7` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee8085` | MEDIUM_RISK | 5 | `23.7  23. 8  23. 8  24 23.9 23.7 23` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee808d` | MEDIUM_RISK | 5 | `118/75  120/78  115/73  122/80  119` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee8095` | MEDIUM_RISK | 5 | `68 72 65 70 68 66 64 65 63 64` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee809e` | MEDIUM_RISK | 5 | `94 97 92 95 94 92 90 92 88 90` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee80a7` | MEDIUM_RISK | 5 | `97.9 97.7 98.1 97.9  97.7 97.9 98.1` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee80b0` | MEDIUM_RISK | 5 | `Normal checkup  Recovering from col` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee8108` | MEDIUM_RISK | 5 | `Appendicitis surgery 2019; Mild fat` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `6964975721679ceb9eee8110` | HIGH_RISK | 2 | `USA-320102-1988XXXXXXXX` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_3_20251106@080322.png` | `69788b9cfb6fdbc1908c07f4` | LOW_RISK | 6 | `Date Height(cm) Weight(kg) BMI  Blo` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_4_20251106@080357.png` | `6964746f02180e703215fddc` | LOW_RISK | 3 | `Nov 6 08:04` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_4_20251106@080357.png` | `6964975721679ceb9eee806d` | MEDIUM_RISK | 3 | `2024-01-08  2024-01-15  2024-01-22 ` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_4_20251106@080357.png` | `6964975721679ceb9eee8096` | MEDIUM_RISK | 5 | `68 72 65 70 68 66 64 65 63 64` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_4_20251106@080357.png` | `6964975721679ceb9eee809f` | MEDIUM_RISK | 5 | `94 97 92 95 94 92 90 92 88 90` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_4_20251106@080357.png` | `6964975721679ceb9eee80a8` | MEDIUM_RISK | 5 | `97.9 97.7 98.1 97.9  97.7 97.9 98.1` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_4_20251106@080357.png` | `6964975721679ceb9eee80b1` | MEDIUM_RISK | 5 | `Normal checkup  Recovering from col` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_4_20251106@080357.png` | `6964aa35d3c18ca74f5e209c` | HIGH_RISK | 2 | `USA-320102-19` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_4_20251106@080357.png` | `6964aa35d3c18ca74f5e209d` | MEDIUM_RISK | 5 | `Appendicitis sur  Penicillin; Seafo` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_4_20251106@080357.png` | `69788b9cfb6fdbc1908c07f7` | LOW_RISK | 6 | `Date Height(cm)` | **FALSE_NEGATIVE** | J. Annotation-granularity mismatch | Table header labeled as privacy region in GUIGuard. |
| `step_4_20251106@080357.png` | `69788b9cfb6fdbc1908c07f8` | LOW_RISK | 6 | `Pressure Heart Rate Blood Sugar Tem` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964746f02180e703215fddd` | LOW_RISK | 3 | `Nov 6 08:04` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee806e` | MEDIUM_RISK | 3 | `2024-01-08  2024-01-15  2024-01-22 ` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee8076` | MEDIUM_RISK | 5 | `175 175 175 175 175 175 175 175 175` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee807e` | MEDIUM_RISK | 5 | `72.5  73  72.8  73.5  73.2  72.6  7` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee8086` | MEDIUM_RISK | 5 | `23.7  23. 8  23. 8  24 23.9 23.7 23` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee808e` | MEDIUM_RISK | 5 | `118/75  120/78  115/73  122/80  119` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee8097` | MEDIUM_RISK | 5 | `68 72 65 70 68 66 64 65 63 64` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee80a0` | MEDIUM_RISK | 5 | `94 97 92 95 94 92 90 92 88 90` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee80a9` | MEDIUM_RISK | 5 | `97.9 97.7 98.1 97.9  97.7 97.9 98.1` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee80b2` | MEDIUM_RISK | 5 | `Normal checkup  Recovering from col` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee8109` | MEDIUM_RISK | 5 | `Appendicitis surgery 2019; Mild fat` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `6964975721679ceb9eee8111` | HIGH_RISK | 2 | `USA-320102-1988XXXXXXXX` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_5_20251106@080437.png` | `69788b9cfb6fdbc1908c07f5` | LOW_RISK | 6 | `Date Height(cm) Weight(kg) BMI  Blo` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964746f02180e703215fdda` | LOW_RISK | 3 | `Nov 6 08:05` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee806f` | MEDIUM_RISK | 3 | `2024-01-08  2024-01-15  2024-01-22 ` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee8077` | MEDIUM_RISK | 5 | `175 175 175 175 175 175 175 175 175` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee807f` | MEDIUM_RISK | 5 | `72.5  73  72.8  73.5  73.2  72.6  7` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee8087` | MEDIUM_RISK | 5 | `23.7  23. 8  23. 8  24 23.9 23.7 23` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee808f` | MEDIUM_RISK | 5 | `118/75  120/78  115/73  122/80  119` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee8098` | MEDIUM_RISK | 5 | `68 72 65 70 68 66 64 65 63 64` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee80a1` | MEDIUM_RISK | 5 | `94 97 92 95 94 92 90 92 88 90` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee80aa` | MEDIUM_RISK | 5 | `97.9 97.7 98.1 97.9  97.7 97.9 98.1` | **FALSE_NEGATIVE** | H. Spreadsheet/table micro-region | Unlabeled raw numeric data column inside desktop spreadsheet cell without DOM node context. |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee80b3` | MEDIUM_RISK | 5 | `Normal checkup  Recovering from col` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee810a` | MEDIUM_RISK | 5 | `Appendicitis surgery 2019; Mild fat` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `6964975721679ceb9eee8112` | HIGH_RISK | 2 | `USA-320102-1988XXXXXXXX` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_6_20251106@080508.png` | `69788b9cfb6fdbc1908c07f6` | LOW_RISK | 6 | `Date Height(cm) Weight(kg) BMI  Blo` | **TRUE_POSITIVE** | NONE | Successfully detected and matched |
| `step_7_20251106@080532.png` | `6964746f02180e703215fddb` | LOW_RISK | 3 | `Nov 6 08:05` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_8_20251106@080612.png` | `6964746f02180e703215fdd9` | LOW_RISK | 3 | `Nov 6 08:06 ` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |
| `step_9_20251106@080656.png` | `6964746f02180e703215fdd7` | LOW_RISK | 3 | `Nov 6 08:07` | **FALSE_NEGATIVE** | I. Unsupported privacy category | GNOME Desktop OS panel clock widget timestamp (outside browser DOM viewport). |