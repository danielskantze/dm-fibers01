function createBuffer(gl: WebGL2RenderingContext, data: Float32Array | Int32Array): WebGLBuffer {
    const buffer: WebGLBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buffer;
}

const quadData = new Float32Array([
    -1, -1,
    1, -1,
   -1,  1,
   -1,  1,
    1, -1,
    1,  1,
]);

function createQuad(gl: WebGL2RenderingContext): WebGLBuffer {
    return createBuffer(gl, quadData);
}

function createParticleBuffer(gl: WebGL2RenderingContext, numParticles: number): WebGLBuffer {
    const indices = new Int32Array(numParticles);
    for (let i = 0; i < numParticles; i++) {
        indices[i] = i;
    }
    return createBuffer(gl, indices);
}

export { createBuffer, createQuad, createParticleBuffer };