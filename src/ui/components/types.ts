import type { UniformValue } from "../../types/gl/uniforms"

export type UIComponent = {
  element: HTMLElement,
  update: (value: UniformValue) => void
}