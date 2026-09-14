import type { RecognitionResult } from './types';

export class CTCDecoder {
  private characters: string[] = [];
  private isLoaded = false;

  async loadDictionary(dictPath = '/models/ppocrv6_tiny_dict.txt'): Promise<void> {
    if (this.isLoaded) return;

    try {
      const response = await fetch(dictPath);
      if (!response.ok) {
        throw new Error(`Failed to load dictionary from ${dictPath}: ${response.statusText}`);
      }
      const text = await response.text();
      const lines = text.split(/\r?\n/).filter((line, index, arr) => {
        // preserve blank lines only if necessary, but dict lines are single characters
        return index < arr.length - 1 || line.length > 0;
      });

      // PaddleOCR CTC convention:
      // index 0: 'blank'
      // index 1..N: dictionary characters
      // index N+1: ' ' (space)
      this.characters = ['blank', ...lines, ' '];
      this.isLoaded = true;
      console.log(`[CTCDecoder] Loaded dictionary with ${this.characters.length} classes (including blank & space)`);
    } catch (err) {
      console.error('[CTCDecoder] Dictionary loading error:', err);
      throw err;
    }
  }

  setDictionary(characters: string[]) {
    this.characters = characters;
    this.isLoaded = true;
  }

  get dictionarySize(): number {
    return this.characters.length;
  }

  /**
   * Decodes CTC output from PP-OCR recognition model.
   * @param preds Float32Array of shape [seqLen, numClasses] or [1, seqLen, numClasses]
   * @param seqLen length of sequence time steps (e.g. 80 or 40)
   * @param numClasses number of classes (e.g. 6906)
   */
  decode(preds: Float32Array, seqLen: number, numClasses: number): RecognitionResult {
    if (!this.isLoaded) {
      throw new Error('CTCDecoder: Dictionary is not loaded. Call loadDictionary() first.');
    }

    // Check if predictions are already softmax probabilities (summing to ~1.0) or raw logits.
    // Standard PP-OCR recognition models include a Softmax layer as the final node in the ONNX model.
    let isProbabilities = true;
    let sampleSum = 0;
    for (let c = 0; c < numClasses; c++) {
      sampleSum += preds[c];
    }
    isProbabilities = Math.abs(sampleSum - 1.0) < 0.1;

    const decodedChars: string[] = [];
    const confidences: number[] = [];
    let lastIdx = -1;

    for (let t = 0; t < seqLen; t++) {
      const offset = t * numClasses;

      // Find argmax and max value
      let maxVal = -Infinity;
      let maxIdx = 0;

      for (let c = 0; c < numClasses; c++) {
        const val = preds[offset + c];
        if (val > maxVal) {
          maxVal = val;
          maxIdx = c;
        }
      }

      // Calculate confidence probability:
      // If already softmax probabilities, maxVal is the direct probability.
      // If raw logits, apply numerically stable softmax for maxIdx.
      let prob = maxVal;
      if (!isProbabilities) {
        let sumExp = 0;
        for (let c = 0; c < numClasses; c++) {
          sumExp += Math.exp(preds[offset + c] - maxVal);
        }
        prob = sumExp > 0 ? 1.0 / sumExp : 1.0;
      }

      // Clamp probability between 0 and 1
      prob = Math.max(0, Math.min(1, prob));

      // CTC rule:
      // 1. Skip if same as last non-blank character unless separated by blank
      // 2. Skip if blank (index 0)
      if (maxIdx !== 0 && maxIdx !== lastIdx) {
        if (maxIdx < this.characters.length) {
          const char = this.characters[maxIdx];
          if (char !== 'blank') {
            decodedChars.push(char);
            confidences.push(prob);
          }
        }
      }
      lastIdx = maxIdx;
    }

    const text = decodedChars.join('');
    const confidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    return {
      text,
      confidence: Math.round(confidence * 10000) / 10000
    };
  }
}

export const defaultDecoder = new CTCDecoder();
