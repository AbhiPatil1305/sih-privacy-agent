import { BoundingBox } from '../shared/types';

export class CoordinateMapper {
  private dpr: number;

  constructor(devicePixelRatio: number = window.devicePixelRatio || 1) {
    this.dpr = devicePixelRatio;
  }

  public domToScreenshot(bbox: BoundingBox): BoundingBox {
    return {
      x: bbox.x * this.dpr,
      y: bbox.y * this.dpr,
      width: bbox.width * this.dpr,
      height: bbox.height * this.dpr
    };
  }

  public screenshotToDom(bbox: BoundingBox): BoundingBox {
    return {
      x: bbox.x / this.dpr,
      y: bbox.y / this.dpr,
      width: bbox.width / this.dpr,
      height: bbox.height / this.dpr
    };
  }
}
