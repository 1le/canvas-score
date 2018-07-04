const EventEmitter = require('eventemitter3');
const Config = require('./config/Config');
const TwoDTest = require('./tests/TwoDTest');
const ThreeDTest = require('./tests/ThreeDTest');

/**
 * main
 */
class CanvasBenchmark extends EventEmitter {

    static EVENTS = {
        FINISH: 'finish'
    };

    _width = 0;
    _height = 0;

    _test = null;

    _canvas = null;

    constructor() {
        super();

        this._width = Math.round(window.innerWidth * 0.99);
        this._height = Math.round(window.innerHeight * 0.99);

        this._canvas = document.createElement('canvas');
        this._canvas.width = this._width;
        this._canvas.height = this._height;

        this._canvas.style.zIndex = 9999;
        this._canvas.style.position = 'absolute';
        this._canvas.style.left = 0;
        this._canvas.style.top = 0;

        this._deltaFrameTime = 0;
        this._lastFrameTime = 0;

        this.totalTimeLapsed = 0;
        this.isPaused = false;

        if (this._isWebGLSupported()) {
            console.info("WEB GL TEST");
            this._test = new ThreeDTest(this._canvas, Config.particles.threeD);
        } else {
            console.info("2D TEST");
            this._test = new TwoDTest(this._canvas, Config.particles.twoD);
        }

        document.body.appendChild(this._canvas);

        this._pageVisibilityListener = this._onPageVisibility.bind(this);
        document.addEventListener('visibilitychange', this._pageVisibilityListener);
        if(document.__isHidden === true) this.pause();

        this._test.on('runCompleted', this._finished.bind(this));

    }

    test() {
        this._test.run(Config.duration);
    }

    pause() {
        if(this.isPaused) return;
        this.isPaused = true;

        this._test.isPaused = true;

        console.info('# Benchmark is paused');
    }

    resume() {
        if(!this.isPaused) return;
        this.isPaused = false;

        this._test._lastFrameTime = Date.now();
        this._test.isPaused = false;

        console.info('# Benchmark is resumed');
    }

    _injectShaders() {

    }

    _onPageVisibility(e) {
        if (document.visibilityState === 'hidden') {
            this.pause();
        } else if(document.visibilityState === 'visible'){
            this.resume();
        }
    }

    _isWebGLSupported() {
        let contextOptions = { stencil: true, failIfMajorPerformanceCaveat: true };
        try {
            if (!window.WebGLRenderingContext) return false;

            let canvas = document.createElement('canvas');
            let gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

            var success = !!(gl && gl.getContextAttributes().stencil);
            if (gl) {
                var loseContext = gl.getExtension('WEBGL_lose_context');
                if(loseContext) loseContext.loseContext();
            }

            gl = null;
            return success;
        } catch (e) {
            return false;
        }
    }

    _finished(frames) {
        console.log("Accomplished", frames);
        document.removeEventListener('visibilitychange', this._pageVisibilityListener);
        this._canvas.parentNode.removeChild(this._canvas);
        let maxFrames = Config.duration * 60;
        this.emit(CanvasBenchmark.EVENTS.FINISH, frames / maxFrames);
    }
}

module.exports = CanvasBenchmark;