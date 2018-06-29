const EventEmitter = require('eventemitter3');
const Renderable2D = require('./Renderable2D');

class TwoDTest extends EventEmitter {

    _objs = [];
    _context = null;

    canvas = null;;

    _frames = 0;
    _runTime = 0;

    constructor(canvas, particleCount) {
        super();
        this.canvas = canvas;
        for (let i = 0; i < particleCount; i++) this._objs.push(new Renderable2D(canvas.width, canvas.height));
        this._context = canvas.getContext("2d");
        this._context.fillStyle = "rgba(0, 0.3, 0.3, 0.5)";
    }

    run(runTime) {
        console.log("RUN TEST");
        this.start = Date.now();
        this._runTime = runTime;
        window.requestAnimationFrame(() => { this._render();});
    }

    _clear() {
        this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _render() {
        this._clear();
        this._objs.forEach((obj) => {
            obj.move(this.canvas.width, this.canvas.height);
            obj.draw(this._context);
        });
        this._frames++;
        if (Date.now() - this.start < this._runTime * 1000) window.requestAnimationFrame(() => { this._render();});
        else this._finished();
    }

    _finished() {
        console.log("TEST COMPLETED")
        this.emit('runCompleted', this._frames);
    }
}

module.exports = TwoDTest;