function mapCartesianToGimbal(v: [number, number, number]): [number, number, number] {
  const [x, y, z] = v;

  const length = Math.sqrt(x * x + y * y + z * z);

  if (length < 1e-6) {
    return [0, 0, 0];
  }

  const rotX = Math.acos(y / length);
  const rotZ = Math.atan2(x, z);

  return [rotX, rotZ, length];
}

function mapGimbalToCartesian(
  rotX: number,
  rotZ: number,
  length: number
): [number, number, number] {
  const rx = rotX - Math.PI * 0.5;
  const rz = rotZ;
  const x = length * Math.cos(rx) * Math.cos(rz);
  const y = length * Math.cos(rx) * Math.sin(rz);
  const z = length * Math.sin(rx);
  console.log(`testGimbal output for rotX=${rx}, rotZ=${rz}:`, [x, y, z]);
  return [x, y, z];
}

export { mapCartesianToGimbal, mapGimbalToCartesian };
