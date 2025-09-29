function mapCartesianToGimbal(v: [number, number, number]): [number, number, number] {
  const [x, y, z] = v;

  const scale = Math.sqrt(x * x + y * y + z * z);

  if (scale < 1e-6) {
    return [0, 0, 0];
  }

  const rotX = Math.acos(y / scale);
  const rotZ = Math.atan2(x, z);

  return [scale, rotX, rotZ];
}

function mapGimbalToCartesian(scale: number, rotX: number, rotZ: number): [number, number, number] {
  const x = scale * Math.sin(rotX) * Math.sin(rotZ);
  const y = scale * Math.cos(rotX);
  const z = scale * Math.sin(rotX) * Math.cos(rotZ);
  return [x, y, z];
}


export { mapCartesianToGimbal, mapGimbalToCartesian };
