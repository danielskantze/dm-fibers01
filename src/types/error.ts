class WebGLShaderError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebGLShaderError';
    }
}

class WebGLTextureError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebGLTextureError';
    }
}

class WebGLFrameBufferError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebGLFrameBufferError';
    }
}

class WebGLInvalidIndexError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebGLInvalidIndexError';
    }
}

export { WebGLShaderError, WebGLTextureError, WebGLFrameBufferError, WebGLInvalidIndexError };