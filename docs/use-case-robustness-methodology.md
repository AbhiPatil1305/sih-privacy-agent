# SIH 2026 Use-Case Robustness Evaluation Methodology

This document defines the formal evaluation methodology for Task 17 of the **SIH 2026 Privacy-Preserving Browser Agent**. The objective of this evaluation is to empirically test the robustness, privacy boundary, visual context preservation, and task execution capabilities of the existing browser agent across varied, realistic browser page layouts and PII placement conditions.

> **Claim Discipline Statement**:
> Locally constructed robustness scenarios are used to evaluate agent behavior across varied browser layouts before official evaluation use cases are provided by SIH 2026 organizers. These scenarios test generalization beyond single fixed benchmark fixtures.

---

## 1. Robustness Evaluation Scenarios

The evaluation harness constructs six primary synthetic web application scenarios alongside negative control test cases:

| Scenario ID | Name / Category | Layout Variations & Visual Composition | Primary Task Objective |
| :--- | :--- | :--- | :--- |
| **Scenario A** | **Form Page** | Top-aligned & side-by-side input fields, synthetic credentials, instructional text, submit button. | *"Submit the form using the provided synthetic credentials."* |
| **Scenario B** | **Search Page** | Header search bar, filter sidebar, synthetic product grid results, navigation links. | *"Search for the specified synthetic product and open the requested result."* |
| **Scenario C** | **Dashboard Page** | Metrics cards, data table, navigation buttons, inline sensitive account IDs/numbers. | *"Open the requested dashboard section."* |
| **Scenario D** | **Profile Page** | User avatar, synthetic contact details (email, phone), account preferences, settings button. | *"Open the account settings section."* |
| **Scenario E** | **Visual/Canvas Page** | Non-DOM visual text rendered via canvas/images, visual email/phone text, interactive visual controls. | *"Click the requested visual control."* |
| **Scenario F** | **Mixed Page** | Combined DOM PII + Visual PII, dense multi-region layout, interactive action targets close to PII. | *"Navigate to the requested section."* |

---

## 2. Layout Variation Matrix

To prevent fixture memorization, page layouts are procedurally varied across:
- **PII Position & Scale**: Top, sidebar, inline table, and footer PII placements.
- **Inter-Element Spacing**: Dense layout ($< 15\text{px}$ spacing between PII and action buttons) vs spacious layout ($> 100\text{px}$).
- **Text Density & Structure**: Clean form vs dense tabular data.
- **PII Source Type**: DOM-accessible input nodes vs visual-only canvas text.

---

## 3. Ground-Truth Annotation Specification

Each scenario defines strict JSON ground-truth annotations:
1. **Sensitive PII Regions**:
   - `bbox`: `{ x, y, width, height }` (CSS pixel coordinates)
   - `category`: `EMAIL`, `PHONE`, `PASSWORD`, `CREDIT_CARD`, `SSN`, `FACE`, `PERSON`
   - `expectedProtection`: `BLACK` (High-Risk PII) or `BLUR` (Visual Context)
2. **Task-Relevant UI Elements**:
   - `id`: Target element ID
   - `type`: `input`, `button`, `link`, `card`
   - `bbox`: Bounding box of the interactive target
   - `mustPreserve`: `true` (Target must remain visible and usable post-redaction)
3. **IoU Matching Convention**: A detected region matches ground truth if:
   $$\text{IoU}(B_{\text{detected}}, B_{\text{gt}}) = \frac{\text{Area}(B_{\text{detected}} \cap B_{\text{gt}})}{\text{Area}(B_{\text{detected}} \cup B_{\text{gt}})} \ge 0.5$$

---

## 4. Empirical Evaluation Pillars

### Pillar 1: Local Privacy Intelligence
Evaluates multi-modal detection across DOM regex, ONNX DETR Vision, and Tesseract WASM OCR.
- **Precision**: $\frac{\text{TP}}{\text{TP} + \text{FP}}$
- **Recall**: $\frac{\text{TP}}{\text{TP} + \text{FN}}$

### Pillar 2: Task-Relevant UI Preservation
Evaluates whether redaction overlays accidentally obfuscate critical interactive controls.
- **Task-Relevant Preservation Rate**:
  $$\text{TRPR} = \frac{\text{Preserved Task-Relevant Targets}}{\text{Total Task-Relevant Targets}} \times 100\%$$

### Pillar 3: Closed-Loop Agent Execution
Tests complete state machine: `capture` $\rightarrow$ `privacy filter` $\rightarrow$ `sanitized payload` $\rightarrow$ `VLM plan` $\rightarrow$ `action validation` $\rightarrow$ `execution` $\rightarrow$ `settlement`.
- Evaluated under **Mock VLM** (deterministic benchmark server) to isolate client agent execution logic from external network volatility.

### Pillar 4: Adversarial Network Privacy Boundary
Intercepts all outgoing HTTP/WS payloads to verify 0% leakage of raw synthetic PII, raw screenshots, or unredacted DOM attributes.
