const EventEmitter = require('eventemitter3');
const Renderable3D = require('./../renderable/Renderable3D');

// TODO literals not compatible with IE
const vertex = `
    attribute vec2 aVertexPosition;

    void main() {
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    }
`;

const fragment = `
    #ifdef GL_ES
        precision highp float;
    #endif

    uniform vec4 uColor;

    void main() {
        gl_FragColor = uColor;
    }
`;

class ThreeDTest extends EventEmitter {

    _objs = [];
    _gl = null;
    _frames = 0;
    _runTime = 0;
    _deltaFrameTime = 0;
    _lastFrameTime = 0;
    
    canvas = null;
    shaderProgram = null;
    totalTimeLapsed = 0;
    isPaused = false;

    numItems = 0;
    itemSize;
    vertices;

    constructor(canvas, particleCount) {
        super();

        this.canvas = canvas;

        this._gl = canvas.getContext("experimental-webgl");
        this._gl.viewportWidth = canvas.width;
        this._gl.viewportHeight = canvas.height;
        this._gl.clearColor(0, 0, 0, 0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);

        var vs = this._gl.createShader(this._gl.VERTEX_SHADER);
        this._gl.shaderSource(vs, vertex);
        this._gl.compileShader(vs);

        var fs = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        this._gl.shaderSource(fs, fragment);
        this._gl.compileShader(fs);

        this.shaderProgram = this._gl.createProgram();
        this._gl.attachShader(this.shaderProgram, vs);
        this._gl.attachShader(this.shaderProgram, fs);
        this._gl.linkProgram(this.shaderProgram);

        if (!this._gl.getShaderParameter(vs, this._gl.COMPILE_STATUS)) console.log(this._gl.getShaderInfoLog(vs));
        if (!this._gl.getShaderParameter(fs, this._gl.COMPILE_STATUS)) console.log(this._gl.getShaderInfoLog(fs));
        if (!this._gl.getProgramParameter(this.shaderProgram, this._gl.LINK_STATUS)) console.log(this._gl.getProgramInfoLog(this.shaderProgram));

        for (let i = 0; i < particleCount; i++) {
            this._objs.push(new Renderable3D(canvas.width, canvas.height, this._gl));
        }

        this._gl.useProgram(this.shaderProgram);

        this.shaderProgram.uColor = this._gl.getUniformLocation(this.shaderProgram, "uColor");
        this._gl.uniform4fv(this.shaderProgram.uColor, [0.0, 0.0, 0.0, 0.0]);

        this._renderBound = this._render.bind(this);
    }

    run(runTime) {
        this.totalTimeLapsed = 0;
        this._lastFrameTime = Date.now();
        this._runTime = runTime;
        window.requestAnimationFrame(this._renderBound);
    }

    stop() {
        this._runTime = -1;
    }

    _clear() {
        this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    _render() {
        if(this.isPaused) return;

        this._clear();
        this._objs.forEach((obj) => {
            obj.move(this.canvas.width, this.canvas.height);
            obj.draw(this._gl, this.shaderProgram);
        });
        this._frames++;

        let curTime = Date.now();
        this._deltaFrameTime = curTime - this._lastFrameTime;
        this._lastFrameTime = curTime;
        this.totalTimeLapsed += this._deltaFrameTime;

        if (this._runTime === 0 || this.totalTimeLapsed < this._runTime * 1000) window.requestAnimationFrame(this._renderBound);
        else this._finished();
    }

    _finished() {
        this.emit('runCompleted', this._frames);
    }
}

module.exports = ThreeDTest;