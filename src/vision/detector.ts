import { runInference } from './inference-engine';
import { VisionObject } from '../shared/types';

export async function detectObjects(image: string): Promise<VisionObject[]> {
  try {
    const objects = await runInference(image);
    return objects;
  } catch (error) {
    console.error("Vision detection failed:", error);
    return [];
  }
}
