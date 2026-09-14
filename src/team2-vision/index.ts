import { defaultYOLO11 } from './yolo11/detector';
import { defaultRetinaFace } from './retinaface/detector';
import type { DetectionOptions, VisionResponse } from './types';

export * from './types';
export * from './yolo11/detector';
export * from './yolo11/postprocess';
export * from './retinaface/detector';

/**
 * Executes the YOLO11n object detector on an image.
 */
export async function runYOLO(
  image: HTMLImageElement | HTMLCanvasElement,
  options: DetectionOptions = {}
): Promise<VisionResponse> {
  return await defaultYOLO11.detect(image, options);
}

/**
 * Executes the RetinaFace face detector on an image.
 */
export async function runRetinaFace(
  image: HTMLImageElement | HTMLCanvasElement,
  options: DetectionOptions = {}
): Promise<VisionResponse> {
  return await defaultRetinaFace.detect(image, options);
}
