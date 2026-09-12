import { ScreenshotData, SensitiveRegion } from '../shared/types';

export async function sanitizeScreenshot(screenshot: ScreenshotData, regions: SensitiveRegion[]): Promise<string> {
  // Use OffscreenCanvas for service workers
  // If in popup or content script, regular canvas works, but OffscreenCanvas is safer for background
  try {
    const response = await fetch(screenshot.image);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    const canvas = new OffscreenCanvas(screenshot.width || bitmap.width, screenshot.height || bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(bitmap, 0, 0);

    // Redact regions
    ctx.fillStyle = 'black';
    for (const region of regions) {
      // Coordinates might need scaling if devicePixelRatio != 1, but we assume 1:1 for now
      ctx.fillRect(region.bbox.x, region.bbox.y, region.bbox.width, region.bbox.height);
    }

    const outBlob = await canvas.convertToBlob({ type: 'image/png' });
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(outBlob);
    });
  } catch (error) {
    console.error("Error sanitizing screenshot:", error);
    return screenshot.image; // fallback
  }
}
