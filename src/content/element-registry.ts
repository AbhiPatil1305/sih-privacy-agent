export class ElementRegistry {
  private elementToId = new WeakMap<HTMLElement, string>();
  private idToElement = new Map<string, HTMLElement>();
  private counter = 1;

  public register(element: HTMLElement): string {
    if (this.elementToId.has(element)) {
      return this.elementToId.get(element)!;
    }
    const id = `el_${String(this.counter++).padStart(3, '0')}`;
    this.elementToId.set(element, id);
    this.idToElement.set(id, element);
    return id;
  }

  public getElement(id: string): HTMLElement | undefined {
    return this.idToElement.get(id);
  }

  public clear() {
    this.elementToId = new WeakMap();
    this.idToElement.clear();
    this.counter = 1;
  }
}

export const globalRegistry = new ElementRegistry();
