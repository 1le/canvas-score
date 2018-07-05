const EventEmitter = require('eventemitter3');
const Renderable2D = require('./../renderable/Renderable2D');

class TwoDTest extends EventEmitter {

    _objs = [];
    _context = null;

    canvas = null;

    _frames = 0;

    _paused = false;

    constructor(canvas, particleCount) {
        super();
        this.canvas = canvas;
        for (let i = 0; i < particleCount; i++) this._objs.push(new Renderable2D(canvas.width, canvas.height));
        this._context = canvas.getContext("2d");
        this._context.fillStyle = "rgba(0, 0.3, 0.3, 0.5)";

        this._renderBound = this._render.bind(this);
    }

    run() {
        window.requestAnimationFrame(this._renderBound);
    }

    pause() {
        this._paused = true;
    }

    stop() {
        this._paused = true;
        this._finish();
    }

    _clear() {
        this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _render() {
        if(this._paused) return;

        this._clear();
        this._objs.forEach((obj) => {
            obj.move(this.canvas.width, this.canvas.height);
            obj.draw(this._context);
        });
        this._frames++;

        window.requestAnimationFrame(this._renderBound);
    }

    _finish() {
        this.emit('runCompleted', this._frames);
    }
}

module.exports = TwoDTest;