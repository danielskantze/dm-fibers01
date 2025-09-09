const VECTOR_COMPONENTS = ["x", "y", "z", "w"];

function vecCompName(i: number) {
  if (i > VECTOR_COMPONENTS.length) {
    return i + "";
  }
  return VECTOR_COMPONENTS[i];
}

class ControlFactory {
  private idSeq: number;
  private doc: HTMLDocument;
  private container: HTMLElement;
  
  constructor(doc: HTMLDocument, container: HTMLElement) {
    this.doc = doc;
    this.idSeq = 1;
    this.container = container;
  }

  private _createControl(container: HTMLElement, name: string, value: number, onChange: (value: number) => void, min?: number, max?: number, step?: number) {
    const wrapper: HTMLDivElement = this.doc.createElement("div");
    const label: HTMLLabelElement = this.doc.createElement("label");
    const input: HTMLInputElement = this.doc.createElement("input");
    const text: HTMLInputElement = this.doc.createElement("input");
    text.setAttribute("disabled", "disabled");
    text.setAttribute("type", "text");
    this.idSeq++;
    input.type = "range";
    if (min !== undefined) {
      input.min = min.toString();
    } 
    if (max !== undefined) {
      input.max = max.toString();
    }
    if (step !== undefined) {
      input.step = step!.toString();
    } else {
      input.step = "any";
    }
    if (value !== undefined) {
      input.value = value.toString();
      text.value = value.toFixed(2);
    }
    const inputId = `control_${this.idSeq}`;
    input.id = inputId;
    input.oninput = (e) => {
      const newValue = parseFloat((e.target as HTMLInputElement).value);
      onChange(newValue);
      text.value = newValue.toFixed(2);
    };
    label.textContent = name;
    label.setAttribute("for", inputId);
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(text);
    text.classList.add("digits");
    wrapper.classList.add("parameter");
    container.appendChild(wrapper);
  }

  createScalar(name: string, value: number, onChange: (value: number) => void, min?: number, max?: number, step?: number) {
    const container: HTMLDivElement = this.doc.createElement("div");
    container.classList.add("scalar");
    this._createControl(container, name, value, onChange, min, max, step);
    this.container.appendChild(container);
  }

  createVector(name: string, values: number[], onChange: (i: number, value: number) => void, min?: number, max?: number, step?: number) {
    const container: HTMLDivElement = this.doc.createElement("div");
    container.innerText = name;
    container.classList.add("vector");
    container.dataset.collapsed = "1";
    container.onclick = (e:Event) => {
      if (e.currentTarget === e.target) {
        const newValue = container.dataset.collapsed === "1" ? "0" : "1"; 
        container.dataset.collapsed = newValue;
      }
    };
    for (let i = 0; i < values.length; i++) {
      this._createControl(container, vecCompName(i), values[i], (v) => onChange(i, v), min, max, step);
    }
    this.container.appendChild(container);
  }

  createButton(title: string, onClick: () => void) {
    const container: HTMLDivElement = this.doc.createElement("div");
    const button: HTMLButtonElement = this.doc.createElement("button");
    container.classList.add("button");
    button.innerText = title;
    button.onclick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };
    container.appendChild(button);
    this.container.appendChild(container);
  }
}

export default ControlFactory;