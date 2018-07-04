(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

window.CanvasBenchmark = require('./src/CanvasBenchmark');

},{"./src/CanvasBenchmark":3}],2:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var Config = require('./config/Config');
var TwoDTest = require('./tests/TwoDTest');
var ThreeDTest = require('./tests/ThreeDTest');

/**
 * main
 */

var CanvasBenchmark = function (_EventEmitter) {
    _inherits(CanvasBenchmark, _EventEmitter);

    function CanvasBenchmark() {
        _classCallCheck(this, CanvasBenchmark);

        var _this = _possibleConstructorReturn(this, (CanvasBenchmark.__proto__ || Object.getPrototypeOf(CanvasBenchmark)).call(this));

        _this._width = 0;
        _this._height = 0;
        _this._test = null;
        _this._canvas = null;


        _this._width = Math.round(window.innerWidth * 0.99);
        _this._height = Math.round(window.innerHeight * 0.99);

        _this._canvas = document.createElement('canvas');
        _this._canvas.width = _this._width;
        _this._canvas.height = _this._height;

        _this._canvas.style.zIndex = 9999;
        _this._canvas.style.position = 'absolute';
        _this._canvas.style.left = 0;
        _this._canvas.style.top = 0;

        _this._deltaFrameTime = 0;
        _this._startTimestamp = 0;

        _this._totalTimeLapsed = 0;
        _this.isPaused = false;

        if (_this._isWebGLSupported()) {
            console.info("WEB GL TEST");
            _this._test = new ThreeDTest(_this._canvas, Config.particles.threeD);
        } else {
            console.info("2D TEST");
            _this._test = new TwoDTest(_this._canvas, Config.particles.twoD);
        }

        document.body.appendChild(_this._canvas);

        _this._pageVisibilityListener = _this._onPageVisibility.bind(_this);
        document.addEventListener('visibilitychange', _this._pageVisibilityListener);
        if (document.__isHidden === true) _this.pause();

        _this._test.on('runCompleted', _this._finished.bind(_this));

        return _this;
    }

    /**
     * @param {Number | undefined} duration
     */


    _createClass(CanvasBenchmark, [{
        key: 'start',
        value: function start() {
            var duration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Config.duration;

            this._startTimestamp = performance.now();
            this._test.run(duration);
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._test.stop();
        }
    }, {
        key: 'pause',
        value: function pause() {
            if (this.isPaused) return;
            this.isPaused = true;
            this._totalTimeLapsed += performance.now() - this._startTimestamp;
            this._test.isPaused = true;

            console.info('# Benchmark paused');
        }
    }, {
        key: 'resume',
        value: function resume() {
            if (!this.isPaused) return;
            this.isPaused = false;

            this._startTimestamp = performance.now();
            this._test.isPaused = false;

            console.info('# Benchmark resumed');
        }
    }, {
        key: '_onPageVisibility',
        value: function _onPageVisibility() {
            if (document.visibilityState === 'hidden') {
                this.pause();
            } else if (document.visibilityState === 'visible') {
                this.resume();
            }
        }
    }, {
        key: '_isWebGLSupported',
        value: function _isWebGLSupported() {
            var contextOptions = { stencil: true, failIfMajorPerformanceCaveat: true };
            try {
                if (!window.WebGLRenderingContext) return false;

                var canvas = document.createElement('canvas');
                var gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

                var success = !!(gl && gl.getContextAttributes().stencil);
                if (gl) {
                    var loseContext = gl.getExtension('WEBGL_lose_context');
                    if (loseContext) loseContext.loseContext();
                }

                gl = null;
                return success;
            } catch (e) {
                return false;
            }
        }
    }, {
        key: '_finished',
        value: function _finished(frames) {
            console.info("Frames accomplished", frames);
            document.removeEventListener('visibilitychange', this._pageVisibilityListener);
            this._canvas.parentNode.removeChild(this._canvas);
            this._totalTimeLapsed += performance.now() - this._startTimestamp;
            var maxFrames = this._totalTimeLapsed / 1000 * 60;
            this.emit(CanvasBenchmark.EVENTS.FINISH, frames / maxFrames);
        }
    }]);

    return CanvasBenchmark;
}(EventEmitter);

CanvasBenchmark.EVENTS = {
    FINISH: 'finish'
};


module.exports = CanvasBenchmark;

},{"./config/Config":4,"./tests/ThreeDTest":7,"./tests/TwoDTest":8,"eventemitter3":2}],4:[function(require,module,exports){
"use strict";

module.exports = {

    // visualise test
    debug: true,

    // seconds, 0 for unlimited i.e. test stop has to be called
    duration: 5,

    // number of particles to draw
    particles: {
        twoD: 1500,
        threeD: 1000
    }

};

},{}],5:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderable2D = function () {
    function Renderable2D(cW, cH) {
        _classCallCheck(this, Renderable2D);

        this.x = Math.round(Math.random() * cW);
        this.y = Math.round(Math.random() * cH);
        this.width = Math.round(cW / 50);
        this.height = Math.round(cH / 50);
        this.velocity = this._generateRandomVelocity();
    }

    _createClass(Renderable2D, [{
        key: "_generateRandomVelocity",
        value: function _generateRandomVelocity() {
            return {
                x: 3 - Math.round(Math.random() * 6),
                y: 3 - Math.round(Math.random() * 6)
            };
        }
    }, {
        key: "move",
        value: function move(maxX, maxY) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            if (this.x < 1 || this.x > maxX) this.velocity.x = -this.velocity.x;
            if (this.y < 1 || this.y > maxY) this.velocity.y = -this.velocity.y;
        }
    }, {
        key: "draw",
        value: function draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x + 0, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
    }]);

    return Renderable2D;
}();

module.exports = Renderable2D;

},{}],6:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderable3D = function () {
    function Renderable3D(cW, cH, gl) {
        _classCallCheck(this, Renderable3D);

        this.x = 0.95 - Math.random() * 195 / 100;
        this.y = 0.95 - Math.random() * 195 / 100;
        this.width = 0.05;
        this.height = 0.05;
        this.velocity = this._generateRandomVelocity();

        this.vertices = new Float32Array([this.x + this.width, this.y + this.height, this.x, this.y + this.height, this.x + this.width, this.y, this.x, this.y]);

        this.vbuffer = gl.createBuffer();

        this.itemSize = 2;
        this.numItems = this.vertices.length / this.itemSize;
    }

    _createClass(Renderable3D, [{
        key: "_generateRandomVelocity",
        value: function _generateRandomVelocity() {
            return {
                x: 0.03 - Math.random() * 6 / 100,
                y: 0.03 - Math.random() * 6 / 100
            };
        }
    }, {
        key: "move",
        value: function move() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            if (this.x <= -1 || this.x > 0.95) this.velocity.x = -this.velocity.x;
            if (this.y <= -1 || this.y > 0.95) this.velocity.y = -this.velocity.y;

            this.vertices = new Float32Array([this.x + this.width, this.y + this.height, this.x, this.y + this.height, this.x + this.width, this.y, this.x, this.y]);
        }
    }, {
        key: "draw",
        value: function draw(gl, shaderProgram) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
            shaderProgram.aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
            gl.vertexAttribPointer(shaderProgram.aVertexPosition, this.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numItems);
        }
    }]);

    return Renderable3D;
}();

module.exports = Renderable3D;

},{}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var Renderable3D = require('./../renderable/Renderable3D');

// TODO literals not compatible with IE
var vertex = '\n    attribute vec2 aVertexPosition;\n\n    void main() {\n        gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n    }\n';

var fragment = '\n    #ifdef GL_ES\n        precision highp float;\n    #endif\n\n    uniform vec4 uColor;\n\n    void main() {\n        gl_FragColor = uColor;\n    }\n';

var ThreeDTest = function (_EventEmitter) {
    _inherits(ThreeDTest, _EventEmitter);

    function ThreeDTest(canvas, particleCount) {
        _classCallCheck(this, ThreeDTest);

        var _this = _possibleConstructorReturn(this, (ThreeDTest.__proto__ || Object.getPrototypeOf(ThreeDTest)).call(this));

        _this._objs = [];
        _this._gl = null;
        _this._frames = 0;
        _this._runTime = 0;
        _this._deltaFrameTime = 0;
        _this._lastFrameTime = 0;
        _this.canvas = null;
        _this.shaderProgram = null;
        _this.totalTimeLapsed = 0;
        _this.isPaused = false;
        _this.numItems = 0;


        _this.canvas = canvas;

        _this._gl = canvas.getContext("experimental-webgl");
        _this._gl.viewportWidth = canvas.width;
        _this._gl.viewportHeight = canvas.height;
        _this._gl.clearColor(0, 0, 0, 0);
        _this._gl.clear(_this._gl.COLOR_BUFFER_BIT);

        var vs = _this._gl.createShader(_this._gl.VERTEX_SHADER);
        _this._gl.shaderSource(vs, vertex);
        _this._gl.compileShader(vs);

        var fs = _this._gl.createShader(_this._gl.FRAGMENT_SHADER);
        _this._gl.shaderSource(fs, fragment);
        _this._gl.compileShader(fs);

        _this.shaderProgram = _this._gl.createProgram();
        _this._gl.attachShader(_this.shaderProgram, vs);
        _this._gl.attachShader(_this.shaderProgram, fs);
        _this._gl.linkProgram(_this.shaderProgram);

        if (!_this._gl.getShaderParameter(vs, _this._gl.COMPILE_STATUS)) console.log(_this._gl.getShaderInfoLog(vs));
        if (!_this._gl.getShaderParameter(fs, _this._gl.COMPILE_STATUS)) console.log(_this._gl.getShaderInfoLog(fs));
        if (!_this._gl.getProgramParameter(_this.shaderProgram, _this._gl.LINK_STATUS)) console.log(_this._gl.getProgramInfoLog(_this.shaderProgram));

        for (var i = 0; i < particleCount; i++) {
            _this._objs.push(new Renderable3D(canvas.width, canvas.height, _this._gl));
        }

        _this._gl.useProgram(_this.shaderProgram);

        _this.shaderProgram.uColor = _this._gl.getUniformLocation(_this.shaderProgram, "uColor");
        _this._gl.uniform4fv(_this.shaderProgram.uColor, [0.0, 0.0, 0.0, 0.0]);

        _this._renderBound = _this._render.bind(_this);
        return _this;
    }

    _createClass(ThreeDTest, [{
        key: 'run',
        value: function run(runTime) {
            this.totalTimeLapsed = 0;
            this._lastFrameTime = Date.now();
            this._runTime = runTime;
            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._runTime = -1;
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
            this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        }
    }, {
        key: '_render',
        value: function _render() {
            var _this2 = this;

            if (this.isPaused) return;

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this2.canvas.width, _this2.canvas.height);
                obj.draw(_this2._gl, _this2.shaderProgram);
            });
            this._frames++;

            var curTime = Date.now();
            this._deltaFrameTime = curTime - this._lastFrameTime;
            this._lastFrameTime = curTime;
            this.totalTimeLapsed += this._deltaFrameTime;

            if (this._runTime === 0 || this.totalTimeLapsed < this._runTime * 1000) window.requestAnimationFrame(this._renderBound);else this._finished();
        }
    }, {
        key: '_finished',
        value: function _finished() {
            this.emit('runCompleted', this._frames);
        }
    }]);

    return ThreeDTest;
}(EventEmitter);

module.exports = ThreeDTest;

},{"./../renderable/Renderable3D":6,"eventemitter3":2}],8:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var Renderable2D = require('./../renderable/Renderable2D');

var TwoDTest = function (_EventEmitter) {
    _inherits(TwoDTest, _EventEmitter);

    function TwoDTest(canvas, particleCount) {
        _classCallCheck(this, TwoDTest);

        var _this = _possibleConstructorReturn(this, (TwoDTest.__proto__ || Object.getPrototypeOf(TwoDTest)).call(this));

        _this._objs = [];
        _this._context = null;
        _this.canvas = null;
        _this._frames = 0;
        _this._runTime = 0;

        _this.canvas = canvas;
        for (var i = 0; i < particleCount; i++) {
            _this._objs.push(new Renderable2D(canvas.width, canvas.height));
        }_this._context = canvas.getContext("2d");
        _this._context.fillStyle = "rgba(0, 0.3, 0.3, 0.5)";
        return _this;
    }

    _createClass(TwoDTest, [{
        key: 'run',
        value: function run(runTime) {
            var _this2 = this;

            this.start = Date.now();
            this._runTime = runTime;
            window.requestAnimationFrame(function () {
                _this2._render();
            });
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: '_render',
        value: function _render() {
            var _this3 = this;

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this3.canvas.width, _this3.canvas.height);
                obj.draw(_this3._context);
            });
            this._frames++;
            if (this._runTime === 0 || Date.now() - this.start < this._runTime * 1000) window.requestAnimationFrame(this._render);else this._finished();
        }
    }, {
        key: '_finished',
        value: function _finished() {
            this.emit('runCompleted', this._frames);
        }
    }]);

    return TwoDTest;
}(EventEmitter);

module.exports = TwoDTest;

},{"./../renderable/Renderable2D":5,"eventemitter3":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvQ2FudmFzQmVuY2htYXJrLmpzIiwic3JjL2NvbmZpZy9Db25maWcuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlMkQuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlM0QuanMiLCJzcmMvdGVzdHMvVGhyZWVEVGVzdC5qcyIsInNyYy90ZXN0cy9Ud29EVGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxlQUFQLEdBQXlCLFFBQVEsdUJBQVIsQ0FBekI7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LFNBQWQsR0FBMEIsd0JBQTFCO0FBTCtCO0FBTWxDOzs7OzRCQUVHLE8sRUFBUztBQUFBOztBQUNULGlCQUFLLEtBQUwsR0FBYSxLQUFLLEdBQUwsRUFBYjtBQUNBLGlCQUFLLFFBQUwsR0FBZ0IsT0FBaEI7QUFDQSxtQkFBTyxxQkFBUCxDQUE2QixZQUFNO0FBQUUsdUJBQUssT0FBTDtBQUFnQixhQUFyRDtBQUNIOzs7aUNBRVE7QUFDTCxpQkFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixDQUF4QixFQUEyQixDQUEzQixFQUE4QixLQUFLLE1BQUwsQ0FBWSxLQUExQyxFQUFpRCxLQUFLLE1BQUwsQ0FBWSxNQUE3RDtBQUNIOzs7a0NBRVM7QUFBQTs7QUFDTixpQkFBSyxNQUFMO0FBQ0EsaUJBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsVUFBQyxHQUFELEVBQVM7QUFDeEIsb0JBQUksSUFBSixDQUFTLE9BQUssTUFBTCxDQUFZLEtBQXJCLEVBQTRCLE9BQUssTUFBTCxDQUFZLE1BQXhDO0FBQ0Esb0JBQUksSUFBSixDQUFTLE9BQUssUUFBZDtBQUNILGFBSEQ7QUFJQSxpQkFBSyxPQUFMO0FBQ0EsZ0JBQUksS0FBSyxRQUFMLEtBQWtCLENBQWxCLElBQXVCLEtBQUssR0FBTCxLQUFhLEtBQUssS0FBbEIsR0FBMEIsS0FBSyxRQUFMLEdBQWdCLElBQXJFLEVBQTJFLE9BQU8scUJBQVAsQ0FBNkIsS0FBSyxPQUFsQyxFQUEzRSxLQUNLLEtBQUssU0FBTDtBQUNSOzs7b0NBRVc7QUFDUixpQkFBSyxJQUFMLENBQVUsY0FBVixFQUEwQixLQUFLLE9BQS9CO0FBQ0g7Ozs7RUF6Q2tCLFk7O0FBNEN2QixPQUFPLE9BQVAsR0FBaUIsUUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ3aW5kb3cuQ2FudmFzQmVuY2htYXJrID0gcmVxdWlyZSgnLi9zcmMvQ2FudmFzQmVuY2htYXJrJyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHByZWZpeCA9ICd+JztcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzdG9yYWdlIGZvciBvdXIgYEVFYCBvYmplY3RzLlxuICogQW4gYEV2ZW50c2AgaW5zdGFuY2UgaXMgYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRXZlbnRzKCkge31cblxuLy9cbi8vIFdlIHRyeSB0byBub3QgaW5oZXJpdCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC4gSW4gc29tZSBlbmdpbmVzIGNyZWF0aW5nIGFuXG4vLyBpbnN0YW5jZSBpbiB0aGlzIHdheSBpcyBmYXN0ZXIgdGhhbiBjYWxsaW5nIGBPYmplY3QuY3JlYXRlKG51bGwpYCBkaXJlY3RseS5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBjaGFyYWN0ZXIgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Rcbi8vIG92ZXJyaWRkZW4gb3IgdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy9cbmlmIChPYmplY3QuY3JlYXRlKSB7XG4gIEV2ZW50cy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIC8vXG4gIC8vIFRoaXMgaGFjayBpcyBuZWVkZWQgYmVjYXVzZSB0aGUgYF9fcHJvdG9fX2AgcHJvcGVydHkgaXMgc3RpbGwgaW5oZXJpdGVkIGluXG4gIC8vIHNvbWUgb2xkIGJyb3dzZXJzIGxpa2UgQW5kcm9pZCA0LCBpUGhvbmUgNS4xLCBPcGVyYSAxMSBhbmQgU2FmYXJpIDUuXG4gIC8vXG4gIGlmICghbmV3IEV2ZW50cygpLl9fcHJvdG9fXykgcHJlZml4ID0gZmFsc2U7XG59XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgZXZlbnQgbGlzdGVuZXIuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgbmFtZXMgPSBbXVxuICAgICwgZXZlbnRzXG4gICAgLCBuYW1lO1xuXG4gIGlmICh0aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzKSkge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBPbmx5IGNoZWNrIGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgNDogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMiwgYTMpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBvbmUtdGltZSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgb2YgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IG1hdGNoIHRoaXMgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuICBpZiAoIWZuKSB7XG4gICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKFxuICAgICAgICAgbGlzdGVuZXJzLmZuID09PSBmblxuICAgICAgJiYgKCFvbmNlIHx8IGxpc3RlbmVycy5vbmNlKVxuICAgICAgJiYgKCFjb250ZXh0IHx8IGxpc3RlbmVycy5jb250ZXh0ID09PSBjb250ZXh0KVxuICAgICkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnRzID0gW10sIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgICAvL1xuICAgIGlmIChldmVudHMubGVuZ3RoKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gICAgZWxzZSBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gW2V2ZW50XSBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIHZhciBldnQ7XG5cbiAgaWYgKGV2ZW50KSB7XG4gICAgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcbiAgICBpZiAodGhpcy5fZXZlbnRzW2V2dF0pIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gQWxsb3cgYEV2ZW50RW1pdHRlcmAgdG8gYmUgaW1wb3J0ZWQgYXMgbW9kdWxlIG5hbWVzcGFjZS5cbi8vXG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy9Db25maWcnKTtcclxuY29uc3QgVHdvRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL1R3b0RUZXN0Jyk7XHJcbmNvbnN0IFRocmVlRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL1RocmVlRFRlc3QnKTtcclxuXHJcbi8qKlxyXG4gKiBtYWluXHJcbiAqL1xyXG5jbGFzcyBDYW52YXNCZW5jaG1hcmsgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIHN0YXRpYyBFVkVOVFMgPSB7XHJcbiAgICAgICAgRklOSVNIOiAnZmluaXNoJ1xyXG4gICAgfTtcclxuXHJcbiAgICBfd2lkdGggPSAwO1xyXG4gICAgX2hlaWdodCA9IDA7XHJcblxyXG4gICAgX3Rlc3QgPSBudWxsO1xyXG5cclxuICAgIF9jYW52YXMgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3dpZHRoID0gTWF0aC5yb3VuZCh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuOTkpO1xyXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IE1hdGgucm91bmQod2luZG93LmlubmVySGVpZ2h0ICogMC45OSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IHRoaXMuX3dpZHRoO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5oZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS56SW5kZXggPSA5OTk5O1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzLnN0eWxlLmxlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS50b3AgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9kZWx0YUZyYW1lVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lc3RhbXAgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl90b3RhbFRpbWVMYXBzZWQgPSAwO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2lzV2ViR0xTdXBwb3J0ZWQoKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJXRUIgR0wgVEVTVFwiKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdCA9IG5ldyBUaHJlZURUZXN0KHRoaXMuX2NhbnZhcywgQ29uZmlnLnBhcnRpY2xlcy50aHJlZUQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIjJEIFRFU1RcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3QgPSBuZXcgVHdvRFRlc3QodGhpcy5fY2FudmFzLCBDb25maWcucGFydGljbGVzLnR3b0QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLl9jYW52YXMpO1xyXG5cclxuICAgICAgICB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyID0gdGhpcy5fb25QYWdlVmlzaWJpbGl0eS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyKTtcclxuICAgICAgICBpZihkb2N1bWVudC5fX2lzSGlkZGVuID09PSB0cnVlKSB0aGlzLnBhdXNlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rlc3Qub24oJ3J1bkNvbXBsZXRlZCcsIHRoaXMuX2ZpbmlzaGVkLmJpbmQodGhpcykpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7TnVtYmVyIHwgdW5kZWZpbmVkfSBkdXJhdGlvblxyXG4gICAgICovXHJcbiAgICBzdGFydChkdXJhdGlvbiA9IENvbmZpZy5kdXJhdGlvbikge1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZXN0YW1wID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5ydW4oZHVyYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5zdG9wKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcGF1c2UoKSB7XHJcbiAgICAgICAgaWYodGhpcy5pc1BhdXNlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3RvdGFsVGltZUxhcHNlZCArPSBwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZXN0YW1wO1xyXG4gICAgICAgIHRoaXMuX3Rlc3QuaXNQYXVzZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oJyMgQmVuY2htYXJrIHBhdXNlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VtZSgpIHtcclxuICAgICAgICBpZighdGhpcy5pc1BhdXNlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lc3RhbXAgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgICB0aGlzLl90ZXN0LmlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbygnIyBCZW5jaG1hcmsgcmVzdW1lZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIF9vblBhZ2VWaXNpYmlsaXR5KCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICdoaWRkZW4nKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICB9IGVsc2UgaWYoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScpe1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfaXNXZWJHTFN1cHBvcnRlZCgpIHtcclxuICAgICAgICBsZXQgY29udGV4dE9wdGlvbnMgPSB7IHN0ZW5jaWw6IHRydWUsIGZhaWxJZk1ham9yUGVyZm9ybWFuY2VDYXZlYXQ6IHRydWUgfTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICAgICAgbGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgY29udGV4dE9wdGlvbnMpIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBjb250ZXh0T3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9ICEhKGdsICYmIGdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCkuc3RlbmNpbCk7XHJcbiAgICAgICAgICAgIGlmIChnbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxvc2VDb250ZXh0ID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9sb3NlX2NvbnRleHQnKTtcclxuICAgICAgICAgICAgICAgIGlmKGxvc2VDb250ZXh0KSBsb3NlQ29udGV4dC5sb3NlQ29udGV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnbCA9IG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZmluaXNoZWQoZnJhbWVzKSB7XHJcbiAgICAgICAgY29uc29sZS5pbmZvKFwiRnJhbWVzIGFjY29tcGxpc2hlZFwiLCBmcmFtZXMpO1xyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyKTtcclxuICAgICAgICB0aGlzLl9jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jYW52YXMpO1xyXG4gICAgICAgIHRoaXMuX3RvdGFsVGltZUxhcHNlZCArPSBwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZXN0YW1wO1xyXG4gICAgICAgIGxldCBtYXhGcmFtZXMgPSAodGhpcy5fdG90YWxUaW1lTGFwc2VkIC8gMTAwMCkgKiA2MDtcclxuICAgICAgICB0aGlzLmVtaXQoQ2FudmFzQmVuY2htYXJrLkVWRU5UUy5GSU5JU0gsIGZyYW1lcyAvIG1heEZyYW1lcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzQmVuY2htYXJrOyIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgIC8vIHZpc3VhbGlzZSB0ZXN0XHJcbiAgICBkZWJ1ZzogdHJ1ZSxcclxuXHJcbiAgICAvLyBzZWNvbmRzLCAwIGZvciB1bmxpbWl0ZWQgaS5lLiB0ZXN0IHN0b3AgaGFzIHRvIGJlIGNhbGxlZFxyXG4gICAgZHVyYXRpb246IDUsXHJcblxyXG4gICAgLy8gbnVtYmVyIG9mIHBhcnRpY2xlcyB0byBkcmF3XHJcbiAgICBwYXJ0aWNsZXM6IHtcclxuICAgICAgICB0d29EOiAxNTAwLFxyXG4gICAgICAgIHRocmVlRDogMTAwMCxcclxuICAgIH0sXHJcblxyXG59OyIsImNsYXNzIFJlbmRlcmFibGUyRCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY1csIGNIKSB7XHJcbiAgICAgICAgdGhpcy54ID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY1cpO1xyXG4gICAgICAgIHRoaXMueSA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIGNIKTtcclxuICAgICAgICB0aGlzLndpZHRoID0gTWF0aC5yb3VuZChjVyAvIDUwKTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IE1hdGgucm91bmQoY0gvIDUwKTtcclxuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdGhpcy5fZ2VuZXJhdGVSYW5kb21WZWxvY2l0eSgpO1xyXG4gICAgfVxyXG5cclxuICAgIF9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IDMgLSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiA2KSxcclxuICAgICAgICAgICAgeTogMyAtIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDYpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmUobWF4WCwgbWF4WSkge1xyXG4gICAgICAgIHRoaXMueCArPSB0aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgdGhpcy55ICs9IHRoaXMudmVsb2NpdHkueTtcclxuICAgICAgICBpZiAodGhpcy54IDwgMSB8fCB0aGlzLnggPiBtYXhYKSB0aGlzLnZlbG9jaXR5LnggPSAtdGhpcy52ZWxvY2l0eS54O1xyXG4gICAgICAgIGlmICh0aGlzLnkgPCAxIHx8IHRoaXMueSA+IG1heFkpIHRoaXMudmVsb2NpdHkueSA9IC10aGlzLnZlbG9jaXR5Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjdHgpIHtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyh0aGlzLngsIHRoaXMueSk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnggKyB0aGlzLndpZHRoLCB0aGlzLnkpO1xyXG4gICAgICAgIGN0eC5saW5lVG8odGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55ICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIGN0eC5saW5lVG8odGhpcy54ICsgMCwgdGhpcy55ICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmFibGUyRDsiLCJcclxuXHJcbmNsYXNzIFJlbmRlcmFibGUzRCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY1csIGNILCBnbCkge1xyXG4gICAgICAgIHRoaXMueCA9IDAuOTUgLSBNYXRoLnJhbmRvbSgpICogMTk1IC8gMTAwO1xyXG4gICAgICAgIHRoaXMueSA9IDAuOTUgLSBNYXRoLnJhbmRvbSgpICogMTk1IC8gMTAwO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSAwLjA1O1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gMC4wNTtcclxuICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdGhpcy5fZ2VuZXJhdGVSYW5kb21WZWxvY2l0eSgpO1xyXG5cclxuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54LCAgdGhpcy55ICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSxcclxuICAgICAgICAgICAgdGhpcy54LCB0aGlzLnlcclxuICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgdGhpcy52YnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuaXRlbVNpemUgPSAyO1xyXG4gICAgICAgIHRoaXMubnVtSXRlbXMgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aCAvIHRoaXMuaXRlbVNpemU7XHJcbiAgICB9XHJcblxyXG4gICAgX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogMC4wMyAtIE1hdGgucmFuZG9tKCkgKiA2IC8gMTAwLFxyXG4gICAgICAgICAgICB5OiAwLjAzIC0gTWF0aC5yYW5kb20oKSAqIDYgLyAxMDBcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZSgpIHtcclxuICAgICAgICB0aGlzLnggKz0gdGhpcy52ZWxvY2l0eS54O1xyXG4gICAgICAgIHRoaXMueSArPSB0aGlzLnZlbG9jaXR5Lnk7XHJcbiAgICAgICAgaWYgKHRoaXMueCA8PSAtMSB8fCB0aGlzLnggPiAwLjk1KSB0aGlzLnZlbG9jaXR5LnggPSAtdGhpcy52ZWxvY2l0eS54O1xyXG4gICAgICAgIGlmICh0aGlzLnkgPD0gLTEgfHwgdGhpcy55ID4gMC45NSkgdGhpcy52ZWxvY2l0eS55ID0gLXRoaXMudmVsb2NpdHkueTtcclxuXHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gICAgICAgICAgICB0aGlzLnggKyB0aGlzLndpZHRoLCAgdGhpcy55ICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLnggKyB0aGlzLndpZHRoLCB0aGlzLnksXHJcbiAgICAgICAgICAgIHRoaXMueCwgdGhpcy55XHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoZ2wsIHNoYWRlclByb2dyYW0pIHtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52YnVmZmVyKTtcclxuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0aWNlcywgZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgICAgIHNoYWRlclByb2dyYW0uYVZlcnRleFBvc2l0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc2hhZGVyUHJvZ3JhbSwgXCJhVmVydGV4UG9zaXRpb25cIik7XHJcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyUHJvZ3JhbS5hVmVydGV4UG9zaXRpb24pO1xyXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbS5hVmVydGV4UG9zaXRpb24sIHRoaXMuaXRlbVNpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcbiAgICAgICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgMCwgdGhpcy5udW1JdGVtcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyYWJsZTNEOyIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgUmVuZGVyYWJsZTNEID0gcmVxdWlyZSgnLi8uLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUzRCcpO1xyXG5cclxuLy8gVE9ETyBsaXRlcmFscyBub3QgY29tcGF0aWJsZSB3aXRoIElFXHJcbmNvbnN0IHZlcnRleCA9IGBcclxuICAgIGF0dHJpYnV0ZSB2ZWMyIGFWZXJ0ZXhQb3NpdGlvbjtcclxuXHJcbiAgICB2b2lkIG1haW4oKSB7XHJcbiAgICAgICAgZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMC4wLCAxLjApO1xyXG4gICAgfVxyXG5gO1xyXG5cclxuY29uc3QgZnJhZ21lbnQgPSBgXHJcbiAgICAjaWZkZWYgR0xfRVNcclxuICAgICAgICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XHJcbiAgICAjZW5kaWZcclxuXHJcbiAgICB1bmlmb3JtIHZlYzQgdUNvbG9yO1xyXG5cclxuICAgIHZvaWQgbWFpbigpIHtcclxuICAgICAgICBnbF9GcmFnQ29sb3IgPSB1Q29sb3I7XHJcbiAgICB9XHJcbmA7XHJcblxyXG5jbGFzcyBUaHJlZURUZXN0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2dsID0gbnVsbDtcclxuICAgIF9mcmFtZXMgPSAwO1xyXG4gICAgX3J1blRpbWUgPSAwO1xyXG4gICAgX2RlbHRhRnJhbWVUaW1lID0gMDtcclxuICAgIF9sYXN0RnJhbWVUaW1lID0gMDtcclxuICAgIFxyXG4gICAgY2FudmFzID0gbnVsbDtcclxuICAgIHNoYWRlclByb2dyYW0gPSBudWxsO1xyXG4gICAgdG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgIGlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgbnVtSXRlbXMgPSAwO1xyXG4gICAgaXRlbVNpemU7XHJcbiAgICB2ZXJ0aWNlcztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIHBhcnRpY2xlQ291bnQpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuXHJcbiAgICAgICAgdGhpcy5fZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICB2YXIgdnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgdGhpcy5fZ2wuc2hhZGVyU291cmNlKHZzLCB2ZXJ0ZXgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNvbXBpbGVTaGFkZXIodnMpO1xyXG5cclxuICAgICAgICB2YXIgZnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSKTtcclxuICAgICAgICB0aGlzLl9nbC5zaGFkZXJTb3VyY2UoZnMsIGZyYWdtZW50KTtcclxuICAgICAgICB0aGlzLl9nbC5jb21waWxlU2hhZGVyKGZzKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFkZXJQcm9ncmFtID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmF0dGFjaFNoYWRlcih0aGlzLnNoYWRlclByb2dyYW0sIHZzKTtcclxuICAgICAgICB0aGlzLl9nbC5hdHRhY2hTaGFkZXIodGhpcy5zaGFkZXJQcm9ncmFtLCBmcyk7XHJcbiAgICAgICAgdGhpcy5fZ2wubGlua1Byb2dyYW0odGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIodnMsIHRoaXMuX2dsLkNPTVBJTEVfU1RBVFVTKSkgY29uc29sZS5sb2codGhpcy5fZ2wuZ2V0U2hhZGVySW5mb0xvZyh2cykpO1xyXG4gICAgICAgIGlmICghdGhpcy5fZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKGZzLCB0aGlzLl9nbC5DT01QSUxFX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFNoYWRlckluZm9Mb2coZnMpKTtcclxuICAgICAgICBpZiAoIXRoaXMuX2dsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5zaGFkZXJQcm9ncmFtLCB0aGlzLl9nbC5MSU5LX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMuc2hhZGVyUHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRpY2xlQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLl9vYmpzLnB1c2gobmV3IFJlbmRlcmFibGUzRChjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQsIHRoaXMuX2dsKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9nbC51c2VQcm9ncmFtKHRoaXMuc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IgPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcInVDb2xvclwiKTtcclxuICAgICAgICB0aGlzLl9nbC51bmlmb3JtNGZ2KHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IsIFswLjAsIDAuMCwgMC4wLCAwLjBdKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcmVuZGVyQm91bmQgPSB0aGlzLl9yZW5kZXIuYmluZCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBydW4ocnVuVGltZSkge1xyXG4gICAgICAgIHRoaXMudG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgICAgICB0aGlzLl9sYXN0RnJhbWVUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB0aGlzLl9ydW5UaW1lID0gcnVuVGltZTtcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JlbmRlckJvdW5kKTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIHRoaXMuX3J1blRpbWUgPSAtMTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fZ2wudmlld3BvcnQoMCwgMCwgdGhpcy5fZ2wudmlld3BvcnRXaWR0aCwgdGhpcy5fZ2wudmlld3BvcnRIZWlnaHQpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCB0aGlzLl9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVuZGVyKCkge1xyXG4gICAgICAgIGlmKHRoaXMuaXNQYXVzZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5fY2xlYXIoKTtcclxuICAgICAgICB0aGlzLl9vYmpzLmZvckVhY2goKG9iaikgPT4ge1xyXG4gICAgICAgICAgICBvYmoubW92ZSh0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgb2JqLmRyYXcodGhpcy5fZ2wsIHRoaXMuc2hhZGVyUHJvZ3JhbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fZnJhbWVzKys7XHJcblxyXG4gICAgICAgIGxldCBjdXJUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB0aGlzLl9kZWx0YUZyYW1lVGltZSA9IGN1clRpbWUgLSB0aGlzLl9sYXN0RnJhbWVUaW1lO1xyXG4gICAgICAgIHRoaXMuX2xhc3RGcmFtZVRpbWUgPSBjdXJUaW1lO1xyXG4gICAgICAgIHRoaXMudG90YWxUaW1lTGFwc2VkICs9IHRoaXMuX2RlbHRhRnJhbWVUaW1lO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fcnVuVGltZSA9PT0gMCB8fCB0aGlzLnRvdGFsVGltZUxhcHNlZCA8IHRoaXMuX3J1blRpbWUgKiAxMDAwKSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JlbmRlckJvdW5kKTtcclxuICAgICAgICBlbHNlIHRoaXMuX2ZpbmlzaGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgX2ZpbmlzaGVkKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgncnVuQ29tcGxldGVkJywgdGhpcy5fZnJhbWVzKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaHJlZURUZXN0OyIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgUmVuZGVyYWJsZTJEID0gcmVxdWlyZSgnLi8uLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUyRCcpO1xyXG5cclxuY2xhc3MgVHdvRFRlc3QgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIF9vYmpzID0gW107XHJcbiAgICBfY29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgY2FudmFzID0gbnVsbDs7XHJcblxyXG4gICAgX2ZyYW1lcyA9IDA7XHJcbiAgICBfcnVuVGltZSA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBwYXJ0aWNsZUNvdW50KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRpY2xlQ291bnQ7IGkrKykgdGhpcy5fb2Jqcy5wdXNoKG5ldyBSZW5kZXJhYmxlMkQoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMC4zLCAwLjMsIDAuNSlcIjtcclxuICAgIH1cclxuXHJcbiAgICBydW4ocnVuVGltZSkge1xyXG4gICAgICAgIHRoaXMuc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHRoaXMuX3J1blRpbWUgPSBydW5UaW1lO1xyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4geyB0aGlzLl9yZW5kZXIoKTt9KTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlbmRlcigpIHtcclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX29ianMuZm9yRWFjaCgob2JqKSA9PiB7XHJcbiAgICAgICAgICAgIG9iai5tb3ZlKHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBvYmouZHJhdyh0aGlzLl9jb250ZXh0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuICAgICAgICBpZiAodGhpcy5fcnVuVGltZSA9PT0gMCB8fCBEYXRlLm5vdygpIC0gdGhpcy5zdGFydCA8IHRoaXMuX3J1blRpbWUgKiAxMDAwKSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JlbmRlcik7XHJcbiAgICAgICAgZWxzZSB0aGlzLl9maW5pc2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIF9maW5pc2hlZCgpIHtcclxuICAgICAgICB0aGlzLmVtaXQoJ3J1bkNvbXBsZXRlZCcsIHRoaXMuX2ZyYW1lcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHdvRFRlc3Q7Il19
