import type { UniformValue } from "../../types/gl/uniforms"

export type UIComponentValue = UniformValue | string;

export type UIComponent = {
  element: HTMLElement,
  update: (value: UIComponentValue) => void
}