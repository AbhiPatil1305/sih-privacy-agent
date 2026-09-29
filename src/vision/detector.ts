import { runInference } from './inference-engine';
import { VisionObject } from '../shared/types';

export async function detectObjects(image: string): Promise<VisionObject[]> {
  try {
    const res = await runInference(image);
    return res.objects;
  } catch (error) {
    console.error("Vision detection failed:", error);
    return [];
  }
}

