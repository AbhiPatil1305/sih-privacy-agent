import { PrivacyRegion } from '../shared/types';

export async function redactScreenshot(screenshotBase64: string, regions: PrivacyRegion[], dpr: number = 1): Promise<string> {
  try {
    const response = await fetch(screenshotBase64);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    // We assume the screenshot matches the bitmap width/height.
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(bitmap, 0, 0);

    // IMPORTANT COORDINATE ALIGNMENT:
    // The screenshot is in Device Pixels. The regions are in CSS Pixels (DOM).
    // We MUST scale the regions by DevicePixelRatio to draw exactly over the right visual area.
    
    for (const region of regions) {
      const rx = region.bbox.x * dpr;
      const ry = region.bbox.y * dpr;
      const rw = region.bbox.width * dpr;
      const rh = region.bbox.height * dpr;

      if (region.protection === 'BLUR') {
        // OffscreenCanvas doesn't support ctx.filter = 'blur()' in all browsers easily, 
        // so we can simulate a blur by drawing a semi-transparent box or filling with average color.
        // For standard demonstration, we will use a distinct color for BLUR.
        ctx.fillStyle = 'rgba(150, 150, 150, 0.9)';
        ctx.fillRect(rx, ry, rw, rh);
      } else if (region.protection === 'REPLACE') {
        ctx.fillStyle = '#facc15'; // Yellow marker to indicate replacement
        ctx.fillRect(rx, ry, rw, rh);
      } else {
        // BLACK by default
        ctx.fillStyle = 'black';
        ctx.fillRect(rx, ry, rw, rh);
      }
    }

    const outBlob = await canvas.convertToBlob({ type: 'image/png' });
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(outBlob);
    });
  } catch (error) {
    console.error("Error sanitizing screenshot:", error);
    return screenshotBase64;
  }
}
