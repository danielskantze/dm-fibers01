export function timestamp() {
  const d = new Date();
  const p: string[] = [
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  ].map(v => `0${v}`.slice(-2));
  p.unshift(`${d.getFullYear()}`);
  return `${p[0]}-${p[1]}-${p[2]}_${p[3]}:${p[4]}:${p[5]}`;
}
