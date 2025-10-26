class ControlFactory {
  private container: HTMLElement;

  get visible(): boolean {
    return this.container.dataset.show === "1";
  }

  set visible(value: boolean) {
    this.container.dataset.show = value ? "1" : "0";
  }

  constructor(container: HTMLElement) {
    this.container = container;
    this.visible = false;
  }
}

export default ControlFactory;
