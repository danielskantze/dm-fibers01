export interface Component {
  element: HTMLElement;
  update?: (props: any) => void;
  destroy?: () => void;
}
