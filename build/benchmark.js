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
            this._test.pause();

            console.info('# Benchmark paused');
        }
    }, {
        key: 'resume',
        value: function resume() {
            if (!this.isPaused) return;
            this.isPaused = false;

            this._startTimestamp = performance.now();
            this._test.run();

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

    // visualise tests
    debug: false,

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

var Config = require('../config/Config');
var EventEmitter = require('eventemitter3');
var Renderable3D = require('../renderable/Renderable3D');

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
        _this._paused = false;
        _this.canvas = null;
        _this.shaderProgram = null;


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
        if (Config.debug) {
            _this._gl.uniform4fv(_this.shaderProgram.uColor, [0.0, 0.3, 0.3, 0.5]);
        } else {
            _this._gl.uniform4fv(_this.shaderProgram.uColor, [0.0, 0.0, 0.0, 0.0]);
        }

        _this._renderBound = _this._render.bind(_this);
        return _this;
    }

    _createClass(ThreeDTest, [{
        key: 'run',
        value: function run() {
            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: 'pause',
        value: function pause() {
            this._paused = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._paused = true;
            this._finish();
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

            if (this._paused) return;

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this2.canvas.width, _this2.canvas.height);
                obj.draw(_this2._gl, _this2.shaderProgram);
            });
            this._frames++;

            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: '_finish',
        value: function _finish() {
            this.emit('runCompleted', this._frames);
        }
    }]);

    return ThreeDTest;
}(EventEmitter);

module.exports = ThreeDTest;

},{"../config/Config":4,"../renderable/Renderable3D":6,"eventemitter3":2}],8:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Config = require('../config/Config');
var EventEmitter = require('eventemitter3');
var Renderable2D = require('../renderable/Renderable2D');

var TwoDTest = function (_EventEmitter) {
    _inherits(TwoDTest, _EventEmitter);

    function TwoDTest(canvas, particleCount) {
        _classCallCheck(this, TwoDTest);

        var _this = _possibleConstructorReturn(this, (TwoDTest.__proto__ || Object.getPrototypeOf(TwoDTest)).call(this));

        _this._objs = [];
        _this._context = null;
        _this.canvas = null;
        _this._frames = 0;
        _this._paused = false;

        _this.canvas = canvas;
        for (var i = 0; i < particleCount; i++) {
            _this._objs.push(new Renderable2D(canvas.width, canvas.height));
        }_this._context = canvas.getContext("2d");
        if (Config.debug) {
            _this._context.fillStyle = "rgba(0, 0.3, 0.3, 0.5)";
        } else {
            _this._context.fillStyle = "rgba(0, 0, 0, 0)";
        }
        _this._renderBound = _this._render.bind(_this);
        return _this;
    }

    _createClass(TwoDTest, [{
        key: 'run',
        value: function run() {
            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: 'pause',
        value: function pause() {
            this._paused = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._paused = true;
            this._finish();
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: '_render',
        value: function _render() {
            var _this2 = this;

            if (this._paused) return;

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this2.canvas.width, _this2.canvas.height);
                obj.draw(_this2._context);
            });
            this._frames++;

            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: '_finish',
        value: function _finish() {
            this.emit('runCompleted', this._frames);
        }
    }]);

    return TwoDTest;
}(EventEmitter);

module.exports = TwoDTest;

},{"../config/Config":4,"../renderable/Renderable2D":5,"eventemitter3":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvQ2FudmFzQmVuY2htYXJrLmpzIiwic3JjL2NvbmZpZy9Db25maWcuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlMkQuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlM0QuanMiLCJzcmMvdGVzdHMvVGhyZWVEVGVzdC5qcyIsInNyYy90ZXN0cy9Ud29EVGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxlQUFQLEdBQXlCLFFBQVEsdUJBQVIsQ0FBekI7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdlRBLElBQU0sZUFBZSxRQUFRLGVBQVIsQ0FBckI7QUFDQSxJQUFNLFNBQVMsUUFBUSxpQkFBUixDQUFmO0FBQ0EsSUFBTSxXQUFXLFFBQVEsa0JBQVIsQ0FBakI7QUFDQSxJQUFNLGFBQWEsUUFBUSxvQkFBUixDQUFuQjs7QUFFQTs7OztJQUdNLGU7OztBQWFGLCtCQUFjO0FBQUE7O0FBQUE7O0FBQUEsY0FQZCxNQU9jLEdBUEwsQ0FPSztBQUFBLGNBTmQsT0FNYyxHQU5KLENBTUk7QUFBQSxjQUpkLEtBSWMsR0FKTixJQUlNO0FBQUEsY0FGZCxPQUVjLEdBRkosSUFFSTs7O0FBR1YsY0FBSyxNQUFMLEdBQWMsS0FBSyxLQUFMLENBQVcsT0FBTyxVQUFQLEdBQW9CLElBQS9CLENBQWQ7QUFDQSxjQUFLLE9BQUwsR0FBZSxLQUFLLEtBQUwsQ0FBVyxPQUFPLFdBQVAsR0FBcUIsSUFBaEMsQ0FBZjs7QUFFQSxjQUFLLE9BQUwsR0FBZSxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLGNBQUssT0FBTCxDQUFhLEtBQWIsR0FBcUIsTUFBSyxNQUExQjtBQUNBLGNBQUssT0FBTCxDQUFhLE1BQWIsR0FBc0IsTUFBSyxPQUEzQjs7QUFFQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLE1BQW5CLEdBQTRCLElBQTVCO0FBQ0EsY0FBSyxPQUFMLENBQWEsS0FBYixDQUFtQixRQUFuQixHQUE4QixVQUE5QjtBQUNBLGNBQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsSUFBbkIsR0FBMEIsQ0FBMUI7QUFDQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLEdBQW5CLEdBQXlCLENBQXpCOztBQUVBLGNBQUssZUFBTCxHQUF1QixDQUF2QjtBQUNBLGNBQUssZUFBTCxHQUF1QixDQUF2Qjs7QUFFQSxjQUFLLGdCQUFMLEdBQXdCLENBQXhCO0FBQ0EsY0FBSyxRQUFMLEdBQWdCLEtBQWhCOztBQUVBLFlBQUksTUFBSyxpQkFBTCxFQUFKLEVBQThCO0FBQzFCLG9CQUFRLElBQVIsQ0FBYSxhQUFiO0FBQ0Esa0JBQUssS0FBTCxHQUFhLElBQUksVUFBSixDQUFlLE1BQUssT0FBcEIsRUFBNkIsT0FBTyxTQUFQLENBQWlCLE1BQTlDLENBQWI7QUFDSCxTQUhELE1BR087QUFDSCxvQkFBUSxJQUFSLENBQWEsU0FBYjtBQUNBLGtCQUFLLEtBQUwsR0FBYSxJQUFJLFFBQUosQ0FBYSxNQUFLLE9BQWxCLEVBQTJCLE9BQU8sU0FBUCxDQUFpQixJQUE1QyxDQUFiO0FBQ0g7O0FBRUQsaUJBQVMsSUFBVCxDQUFjLFdBQWQsQ0FBMEIsTUFBSyxPQUEvQjs7QUFFQSxjQUFLLHVCQUFMLEdBQStCLE1BQUssaUJBQUwsQ0FBdUIsSUFBdkIsT0FBL0I7QUFDQSxpQkFBUyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsTUFBSyx1QkFBbkQ7QUFDQSxZQUFHLFNBQVMsVUFBVCxLQUF3QixJQUEzQixFQUFpQyxNQUFLLEtBQUw7O0FBRWpDLGNBQUssS0FBTCxDQUFXLEVBQVgsQ0FBYyxjQUFkLEVBQThCLE1BQUssU0FBTCxDQUFlLElBQWYsT0FBOUI7O0FBbkNVO0FBcUNiOztBQUVEOzs7Ozs7O2dDQUdrQztBQUFBLGdCQUE1QixRQUE0Qix1RUFBakIsT0FBTyxRQUFVOztBQUM5QixpQkFBSyxlQUFMLEdBQXVCLFlBQVksR0FBWixFQUF2QjtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsUUFBZjtBQUNIOzs7K0JBRU07QUFDSCxpQkFBSyxLQUFMLENBQVcsSUFBWDtBQUNIOzs7Z0NBRU87QUFDSixnQkFBRyxLQUFLLFFBQVIsRUFBa0I7QUFDbEIsaUJBQUssUUFBTCxHQUFnQixJQUFoQjtBQUNBLGlCQUFLLGdCQUFMLElBQXlCLFlBQVksR0FBWixLQUFvQixLQUFLLGVBQWxEO0FBQ0EsaUJBQUssS0FBTCxDQUFXLEtBQVg7O0FBRUEsb0JBQVEsSUFBUixDQUFhLG9CQUFiO0FBQ0g7OztpQ0FFUTtBQUNMLGdCQUFHLENBQUMsS0FBSyxRQUFULEVBQW1CO0FBQ25CLGlCQUFLLFFBQUwsR0FBZ0IsS0FBaEI7O0FBRUEsaUJBQUssZUFBTCxHQUF1QixZQUFZLEdBQVosRUFBdkI7QUFDQSxpQkFBSyxLQUFMLENBQVcsR0FBWDs7QUFFQSxvQkFBUSxJQUFSLENBQWEscUJBQWI7QUFDSDs7OzRDQUVtQjtBQUNoQixnQkFBSSxTQUFTLGVBQVQsS0FBNkIsUUFBakMsRUFBMkM7QUFDdkMscUJBQUssS0FBTDtBQUNILGFBRkQsTUFFTyxJQUFHLFNBQVMsZUFBVCxLQUE2QixTQUFoQyxFQUEwQztBQUM3QyxxQkFBSyxNQUFMO0FBQ0g7QUFDSjs7OzRDQUVtQjtBQUNoQixnQkFBSSxpQkFBaUIsRUFBRSxTQUFTLElBQVgsRUFBaUIsOEJBQThCLElBQS9DLEVBQXJCO0FBQ0EsZ0JBQUk7QUFDQSxvQkFBSSxDQUFDLE9BQU8scUJBQVosRUFBbUMsT0FBTyxLQUFQOztBQUVuQyxvQkFBSSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFiO0FBQ0Esb0JBQUksS0FBSyxPQUFPLFVBQVAsQ0FBa0IsT0FBbEIsRUFBMkIsY0FBM0IsS0FBOEMsT0FBTyxVQUFQLENBQWtCLG9CQUFsQixFQUF3QyxjQUF4QyxDQUF2RDs7QUFFQSxvQkFBSSxVQUFVLENBQUMsRUFBRSxNQUFNLEdBQUcsb0JBQUgsR0FBMEIsT0FBbEMsQ0FBZjtBQUNBLG9CQUFJLEVBQUosRUFBUTtBQUNKLHdCQUFJLGNBQWMsR0FBRyxZQUFILENBQWdCLG9CQUFoQixDQUFsQjtBQUNBLHdCQUFHLFdBQUgsRUFBZ0IsWUFBWSxXQUFaO0FBQ25COztBQUVELHFCQUFLLElBQUw7QUFDQSx1QkFBTyxPQUFQO0FBQ0gsYUFkRCxDQWNFLE9BQU8sQ0FBUCxFQUFVO0FBQ1IsdUJBQU8sS0FBUDtBQUNIO0FBQ0o7OztrQ0FFUyxNLEVBQVE7QUFDZCxvQkFBUSxJQUFSLENBQWEscUJBQWIsRUFBb0MsTUFBcEM7QUFDQSxxQkFBUyxtQkFBVCxDQUE2QixrQkFBN0IsRUFBaUQsS0FBSyx1QkFBdEQ7QUFDQSxpQkFBSyxPQUFMLENBQWEsVUFBYixDQUF3QixXQUF4QixDQUFvQyxLQUFLLE9BQXpDO0FBQ0EsaUJBQUssZ0JBQUwsSUFBeUIsWUFBWSxHQUFaLEtBQW9CLEtBQUssZUFBbEQ7QUFDQSxnQkFBSSxZQUFhLEtBQUssZ0JBQUwsR0FBd0IsSUFBekIsR0FBaUMsRUFBakQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsZ0JBQWdCLE1BQWhCLENBQXVCLE1BQWpDLEVBQXlDLFNBQVMsU0FBbEQ7QUFDSDs7OztFQXZIeUIsWTs7QUFBeEIsZSxDQUVLLE0sR0FBUztBQUNaLFlBQVE7QUFESSxDOzs7QUF3SHBCLE9BQU8sT0FBUCxHQUFpQixlQUFqQjs7Ozs7QUNsSUEsT0FBTyxPQUFQLEdBQWlCOztBQUViO0FBQ0EsV0FBTyxLQUhNOztBQUtiO0FBQ0EsY0FBVSxDQU5HOztBQVFiO0FBQ0EsZUFBVztBQUNQLGNBQU0sSUFEQztBQUVQLGdCQUFRO0FBRkQ7O0FBVEUsQ0FBakI7Ozs7Ozs7OztJQ0FNLFk7QUFFRiwwQkFBWSxFQUFaLEVBQWdCLEVBQWhCLEVBQW9CO0FBQUE7O0FBQ2hCLGFBQUssQ0FBTCxHQUFTLEtBQUssS0FBTCxDQUFXLEtBQUssTUFBTCxLQUFnQixFQUEzQixDQUFUO0FBQ0EsYUFBSyxDQUFMLEdBQVMsS0FBSyxLQUFMLENBQVcsS0FBSyxNQUFMLEtBQWdCLEVBQTNCLENBQVQ7QUFDQSxhQUFLLEtBQUwsR0FBYSxLQUFLLEtBQUwsQ0FBVyxLQUFLLEVBQWhCLENBQWI7QUFDQSxhQUFLLE1BQUwsR0FBYyxLQUFLLEtBQUwsQ0FBVyxLQUFJLEVBQWYsQ0FBZDtBQUNBLGFBQUssUUFBTCxHQUFnQixLQUFLLHVCQUFMLEVBQWhCO0FBQ0g7Ozs7a0RBRXlCO0FBQ3RCLG1CQUFPO0FBQ0gsbUJBQUcsSUFBSSxLQUFLLEtBQUwsQ0FBVyxLQUFLLE1BQUwsS0FBZ0IsQ0FBM0IsQ0FESjtBQUVILG1CQUFHLElBQUksS0FBSyxLQUFMLENBQVcsS0FBSyxNQUFMLEtBQWdCLENBQTNCO0FBRkosYUFBUDtBQUlIOzs7NkJBRUksSSxFQUFNLEksRUFBTTtBQUNiLGlCQUFLLENBQUwsSUFBVSxLQUFLLFFBQUwsQ0FBYyxDQUF4QjtBQUNBLGlCQUFLLENBQUwsSUFBVSxLQUFLLFFBQUwsQ0FBYyxDQUF4QjtBQUNBLGdCQUFJLEtBQUssQ0FBTCxHQUFTLENBQVQsSUFBYyxLQUFLLENBQUwsR0FBUyxJQUEzQixFQUFpQyxLQUFLLFFBQUwsQ0FBYyxDQUFkLEdBQWtCLENBQUMsS0FBSyxRQUFMLENBQWMsQ0FBakM7QUFDakMsZ0JBQUksS0FBSyxDQUFMLEdBQVMsQ0FBVCxJQUFjLEtBQUssQ0FBTCxHQUFTLElBQTNCLEVBQWlDLEtBQUssUUFBTCxDQUFjLENBQWQsR0FBa0IsQ0FBQyxLQUFLLFFBQUwsQ0FBYyxDQUFqQztBQUNwQzs7OzZCQUVJLEcsRUFBSztBQUNOLGdCQUFJLFNBQUo7QUFDQSxnQkFBSSxNQUFKLENBQVcsS0FBSyxDQUFoQixFQUFtQixLQUFLLENBQXhCO0FBQ0EsZ0JBQUksTUFBSixDQUFXLEtBQUssQ0FBTCxHQUFTLEtBQUssS0FBekIsRUFBZ0MsS0FBSyxDQUFyQztBQUNBLGdCQUFJLE1BQUosQ0FBVyxLQUFLLENBQUwsR0FBUyxLQUFLLEtBQXpCLEVBQWdDLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFBOUM7QUFDQSxnQkFBSSxNQUFKLENBQVcsS0FBSyxDQUFMLEdBQVMsQ0FBcEIsRUFBdUIsS0FBSyxDQUFMLEdBQVMsS0FBSyxNQUFyQztBQUNBLGdCQUFJLFNBQUo7QUFDQSxnQkFBSSxJQUFKO0FBQ0g7Ozs7OztBQUdMLE9BQU8sT0FBUCxHQUFpQixZQUFqQjs7Ozs7Ozs7O0lDakNNLFk7QUFFRiwwQkFBWSxFQUFaLEVBQWdCLEVBQWhCLEVBQW9CLEVBQXBCLEVBQXdCO0FBQUE7O0FBQ3BCLGFBQUssQ0FBTCxHQUFTLE9BQU8sS0FBSyxNQUFMLEtBQWdCLEdBQWhCLEdBQXNCLEdBQXRDO0FBQ0EsYUFBSyxDQUFMLEdBQVMsT0FBTyxLQUFLLE1BQUwsS0FBZ0IsR0FBaEIsR0FBc0IsR0FBdEM7QUFDQSxhQUFLLEtBQUwsR0FBYSxJQUFiO0FBQ0EsYUFBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLGFBQUssUUFBTCxHQUFnQixLQUFLLHVCQUFMLEVBQWhCOztBQUVBLGFBQUssUUFBTCxHQUFnQixJQUFJLFlBQUosQ0FBaUIsQ0FDN0IsS0FBSyxDQUFMLEdBQVMsS0FBSyxLQURlLEVBQ1AsS0FBSyxDQUFMLEdBQVMsS0FBSyxNQURQLEVBRTdCLEtBQUssQ0FGd0IsRUFFcEIsS0FBSyxDQUFMLEdBQVMsS0FBSyxNQUZNLEVBRzdCLEtBQUssQ0FBTCxHQUFTLEtBQUssS0FIZSxFQUdSLEtBQUssQ0FIRyxFQUk3QixLQUFLLENBSndCLEVBSXJCLEtBQUssQ0FKZ0IsQ0FBakIsQ0FBaEI7O0FBT0EsYUFBSyxPQUFMLEdBQWUsR0FBRyxZQUFILEVBQWY7O0FBRUEsYUFBSyxRQUFMLEdBQWdCLENBQWhCO0FBQ0EsYUFBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxDQUFjLE1BQWQsR0FBdUIsS0FBSyxRQUE1QztBQUNIOzs7O2tEQUV5QjtBQUN0QixtQkFBTztBQUNILG1CQUFHLE9BQU8sS0FBSyxNQUFMLEtBQWdCLENBQWhCLEdBQW9CLEdBRDNCO0FBRUgsbUJBQUcsT0FBTyxLQUFLLE1BQUwsS0FBZ0IsQ0FBaEIsR0FBb0I7QUFGM0IsYUFBUDtBQUlIOzs7K0JBRU07QUFDSCxpQkFBSyxDQUFMLElBQVUsS0FBSyxRQUFMLENBQWMsQ0FBeEI7QUFDQSxpQkFBSyxDQUFMLElBQVUsS0FBSyxRQUFMLENBQWMsQ0FBeEI7QUFDQSxnQkFBSSxLQUFLLENBQUwsSUFBVSxDQUFDLENBQVgsSUFBZ0IsS0FBSyxDQUFMLEdBQVMsSUFBN0IsRUFBbUMsS0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixDQUFDLEtBQUssUUFBTCxDQUFjLENBQWpDO0FBQ25DLGdCQUFJLEtBQUssQ0FBTCxJQUFVLENBQUMsQ0FBWCxJQUFnQixLQUFLLENBQUwsR0FBUyxJQUE3QixFQUFtQyxLQUFLLFFBQUwsQ0FBYyxDQUFkLEdBQWtCLENBQUMsS0FBSyxRQUFMLENBQWMsQ0FBakM7O0FBRW5DLGlCQUFLLFFBQUwsR0FBZ0IsSUFBSSxZQUFKLENBQWlCLENBQzdCLEtBQUssQ0FBTCxHQUFTLEtBQUssS0FEZSxFQUNQLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFEUCxFQUU3QixLQUFLLENBRndCLEVBRXBCLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFGTSxFQUc3QixLQUFLLENBQUwsR0FBUyxLQUFLLEtBSGUsRUFHUixLQUFLLENBSEcsRUFJN0IsS0FBSyxDQUp3QixFQUlyQixLQUFLLENBSmdCLENBQWpCLENBQWhCO0FBT0g7Ozs2QkFFSSxFLEVBQUksYSxFQUFlO0FBQ3BCLGVBQUcsVUFBSCxDQUFjLEdBQUcsWUFBakIsRUFBK0IsS0FBSyxPQUFwQztBQUNBLGVBQUcsVUFBSCxDQUFjLEdBQUcsWUFBakIsRUFBK0IsS0FBSyxRQUFwQyxFQUE4QyxHQUFHLFdBQWpEO0FBQ0EsMEJBQWMsZUFBZCxHQUFnQyxHQUFHLGlCQUFILENBQXFCLGFBQXJCLEVBQW9DLGlCQUFwQyxDQUFoQztBQUNBLGVBQUcsdUJBQUgsQ0FBMkIsY0FBYyxlQUF6QztBQUNBLGVBQUcsbUJBQUgsQ0FBdUIsY0FBYyxlQUFyQyxFQUFzRCxLQUFLLFFBQTNELEVBQXFFLEdBQUcsS0FBeEUsRUFBK0UsS0FBL0UsRUFBc0YsQ0FBdEYsRUFBeUYsQ0FBekY7QUFDQSxlQUFHLFVBQUgsQ0FBYyxHQUFHLGNBQWpCLEVBQWlDLENBQWpDLEVBQW9DLEtBQUssUUFBekM7QUFDSDs7Ozs7O0FBR0wsT0FBTyxPQUFQLEdBQWlCLFlBQWpCOzs7Ozs7Ozs7Ozs7O0FDeERBLElBQU0sU0FBUyxRQUFRLGtCQUFSLENBQWY7QUFDQSxJQUFNLGVBQWUsUUFBUSxlQUFSLENBQXJCO0FBQ0EsSUFBTSxlQUFlLFFBQVEsNEJBQVIsQ0FBckI7O0FBRUE7QUFDQSxJQUFNLHNJQUFOOztBQVFBLElBQU0scUtBQU47O0lBWU0sVTs7O0FBV0Ysd0JBQVksTUFBWixFQUFvQixhQUFwQixFQUFtQztBQUFBOztBQUFBOztBQUFBLGNBVG5DLEtBU21DLEdBVDNCLEVBUzJCO0FBQUEsY0FSbkMsR0FRbUMsR0FSN0IsSUFRNkI7QUFBQSxjQVBuQyxPQU9tQyxHQVB6QixDQU95QjtBQUFBLGNBTG5DLE9BS21DLEdBTHpCLEtBS3lCO0FBQUEsY0FIbkMsTUFHbUMsR0FIMUIsSUFHMEI7QUFBQSxjQUZuQyxhQUVtQyxHQUZuQixJQUVtQjs7O0FBRy9CLGNBQUssTUFBTCxHQUFjLE1BQWQ7O0FBRUEsY0FBSyxHQUFMLEdBQVcsT0FBTyxVQUFQLENBQWtCLG9CQUFsQixDQUFYO0FBQ0EsY0FBSyxHQUFMLENBQVMsYUFBVCxHQUF5QixPQUFPLEtBQWhDO0FBQ0EsY0FBSyxHQUFMLENBQVMsY0FBVCxHQUEwQixPQUFPLE1BQWpDO0FBQ0EsY0FBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixDQUFwQixFQUF1QixDQUF2QixFQUEwQixDQUExQixFQUE2QixDQUE3QjtBQUNBLGNBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZSxNQUFLLEdBQUwsQ0FBUyxnQkFBeEI7O0FBRUEsWUFBSSxLQUFLLE1BQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsTUFBSyxHQUFMLENBQVMsYUFBL0IsQ0FBVDtBQUNBLGNBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsRUFBdEIsRUFBMEIsTUFBMUI7QUFDQSxjQUFLLEdBQUwsQ0FBUyxhQUFULENBQXVCLEVBQXZCOztBQUVBLFlBQUksS0FBSyxNQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLE1BQUssR0FBTCxDQUFTLGVBQS9CLENBQVQ7QUFDQSxjQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLEVBQXRCLEVBQTBCLFFBQTFCO0FBQ0EsY0FBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixFQUF2Qjs7QUFFQSxjQUFLLGFBQUwsR0FBcUIsTUFBSyxHQUFMLENBQVMsYUFBVCxFQUFyQjtBQUNBLGNBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsTUFBSyxhQUEzQixFQUEwQyxFQUExQztBQUNBLGNBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsTUFBSyxhQUEzQixFQUEwQyxFQUExQztBQUNBLGNBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsTUFBSyxhQUExQjs7QUFFQSxZQUFJLENBQUMsTUFBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsRUFBNUIsRUFBZ0MsTUFBSyxHQUFMLENBQVMsY0FBekMsQ0FBTCxFQUErRCxRQUFRLEdBQVIsQ0FBWSxNQUFLLEdBQUwsQ0FBUyxnQkFBVCxDQUEwQixFQUExQixDQUFaO0FBQy9ELFlBQUksQ0FBQyxNQUFLLEdBQUwsQ0FBUyxrQkFBVCxDQUE0QixFQUE1QixFQUFnQyxNQUFLLEdBQUwsQ0FBUyxjQUF6QyxDQUFMLEVBQStELFFBQVEsR0FBUixDQUFZLE1BQUssR0FBTCxDQUFTLGdCQUFULENBQTBCLEVBQTFCLENBQVo7QUFDL0QsWUFBSSxDQUFDLE1BQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLE1BQUssYUFBbEMsRUFBaUQsTUFBSyxHQUFMLENBQVMsV0FBMUQsQ0FBTCxFQUE2RSxRQUFRLEdBQVIsQ0FBWSxNQUFLLEdBQUwsQ0FBUyxpQkFBVCxDQUEyQixNQUFLLGFBQWhDLENBQVo7O0FBRTdFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxhQUFwQixFQUFtQyxHQUFuQyxFQUF3QztBQUNwQyxrQkFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFJLFlBQUosQ0FBaUIsT0FBTyxLQUF4QixFQUErQixPQUFPLE1BQXRDLEVBQThDLE1BQUssR0FBbkQsQ0FBaEI7QUFDSDs7QUFFRCxjQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLE1BQUssYUFBekI7O0FBRUEsY0FBSyxhQUFMLENBQW1CLE1BQW5CLEdBQTRCLE1BQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLE1BQUssYUFBakMsRUFBZ0QsUUFBaEQsQ0FBNUI7QUFDQSxZQUFJLE9BQU8sS0FBWCxFQUFrQjtBQUNkLGtCQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLE1BQUssYUFBTCxDQUFtQixNQUF2QyxFQUErQyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixDQUEvQztBQUNILFNBRkQsTUFFTztBQUNILGtCQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLE1BQUssYUFBTCxDQUFtQixNQUF2QyxFQUErQyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixDQUEvQztBQUNIOztBQUVELGNBQUssWUFBTCxHQUFvQixNQUFLLE9BQUwsQ0FBYSxJQUFiLE9BQXBCO0FBekMrQjtBQTBDbEM7Ozs7OEJBRUs7QUFDRixtQkFBTyxxQkFBUCxDQUE2QixLQUFLLFlBQWxDO0FBQ0g7OztnQ0FFTztBQUNKLGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OzsrQkFFTTtBQUNILGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0EsaUJBQUssT0FBTDtBQUNIOzs7aUNBRVE7QUFDTCxpQkFBSyxHQUFMLENBQVMsUUFBVCxDQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixLQUFLLEdBQUwsQ0FBUyxhQUFqQyxFQUFnRCxLQUFLLEdBQUwsQ0FBUyxjQUF6RDtBQUNBLGlCQUFLLEdBQUwsQ0FBUyxLQUFULENBQWUsS0FBSyxHQUFMLENBQVMsZ0JBQVQsR0FBNEIsS0FBSyxHQUFMLENBQVMsZ0JBQXBEO0FBQ0g7OztrQ0FFUztBQUFBOztBQUNOLGdCQUFHLEtBQUssT0FBUixFQUFpQjs7QUFFakIsaUJBQUssTUFBTDtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLFVBQUMsR0FBRCxFQUFTO0FBQ3hCLG9CQUFJLElBQUosQ0FBUyxPQUFLLE1BQUwsQ0FBWSxLQUFyQixFQUE0QixPQUFLLE1BQUwsQ0FBWSxNQUF4QztBQUNBLG9CQUFJLElBQUosQ0FBUyxPQUFLLEdBQWQsRUFBbUIsT0FBSyxhQUF4QjtBQUNILGFBSEQ7QUFJQSxpQkFBSyxPQUFMOztBQUVBLG1CQUFPLHFCQUFQLENBQTZCLEtBQUssWUFBbEM7QUFDSDs7O2tDQUVTO0FBQ04saUJBQUssSUFBTCxDQUFVLGNBQVYsRUFBMEIsS0FBSyxPQUEvQjtBQUNIOzs7O0VBeEZvQixZOztBQTJGekIsT0FBTyxPQUFQLEdBQWlCLFVBQWpCOzs7Ozs7Ozs7Ozs7O0FDcEhBLElBQU0sU0FBUyxRQUFRLGtCQUFSLENBQWY7QUFDQSxJQUFNLGVBQWUsUUFBUSxlQUFSLENBQXJCO0FBQ0EsSUFBTSxlQUFlLFFBQVEsNEJBQVIsQ0FBckI7O0lBRU0sUTs7O0FBV0Ysc0JBQVksTUFBWixFQUFvQixhQUFwQixFQUFtQztBQUFBOztBQUFBOztBQUFBLGNBVG5DLEtBU21DLEdBVDNCLEVBUzJCO0FBQUEsY0FSbkMsUUFRbUMsR0FSeEIsSUFRd0I7QUFBQSxjQU5uQyxNQU1tQyxHQU4xQixJQU0wQjtBQUFBLGNBSm5DLE9BSW1DLEdBSnpCLENBSXlCO0FBQUEsY0FGbkMsT0FFbUMsR0FGekIsS0FFeUI7O0FBRS9CLGNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksYUFBcEIsRUFBbUMsR0FBbkM7QUFBd0Msa0JBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBSSxZQUFKLENBQWlCLE9BQU8sS0FBeEIsRUFBK0IsT0FBTyxNQUF0QyxDQUFoQjtBQUF4QyxTQUNBLE1BQUssUUFBTCxHQUFnQixPQUFPLFVBQVAsQ0FBa0IsSUFBbEIsQ0FBaEI7QUFDQSxZQUFJLE9BQU8sS0FBWCxFQUFrQjtBQUNkLGtCQUFLLFFBQUwsQ0FBYyxTQUFkLEdBQTBCLHdCQUExQjtBQUNILFNBRkQsTUFFTztBQUNILGtCQUFLLFFBQUwsQ0FBYyxTQUFkLEdBQTBCLGtCQUExQjtBQUNIO0FBQ0QsY0FBSyxZQUFMLEdBQW9CLE1BQUssT0FBTCxDQUFhLElBQWIsT0FBcEI7QUFWK0I7QUFXbEM7Ozs7OEJBRUs7QUFDRixtQkFBTyxxQkFBUCxDQUE2QixLQUFLLFlBQWxDO0FBQ0g7OztnQ0FFTztBQUNKLGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OzsrQkFFTTtBQUNILGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0EsaUJBQUssT0FBTDtBQUNIOzs7aUNBRVE7QUFDTCxpQkFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixDQUF4QixFQUEyQixDQUEzQixFQUE4QixLQUFLLE1BQUwsQ0FBWSxLQUExQyxFQUFpRCxLQUFLLE1BQUwsQ0FBWSxNQUE3RDtBQUNIOzs7a0NBRVM7QUFBQTs7QUFDTixnQkFBRyxLQUFLLE9BQVIsRUFBaUI7O0FBRWpCLGlCQUFLLE1BQUw7QUFDQSxpQkFBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixVQUFDLEdBQUQsRUFBUztBQUN4QixvQkFBSSxJQUFKLENBQVMsT0FBSyxNQUFMLENBQVksS0FBckIsRUFBNEIsT0FBSyxNQUFMLENBQVksTUFBeEM7QUFDQSxvQkFBSSxJQUFKLENBQVMsT0FBSyxRQUFkO0FBQ0gsYUFIRDtBQUlBLGlCQUFLLE9BQUw7O0FBRUEsbUJBQU8scUJBQVAsQ0FBNkIsS0FBSyxZQUFsQztBQUNIOzs7a0NBRVM7QUFDTixpQkFBSyxJQUFMLENBQVUsY0FBVixFQUEwQixLQUFLLE9BQS9CO0FBQ0g7Ozs7RUF4RGtCLFk7O0FBMkR2QixPQUFPLE9BQVAsR0FBaUIsUUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ3aW5kb3cuQ2FudmFzQmVuY2htYXJrID0gcmVxdWlyZSgnLi9zcmMvQ2FudmFzQmVuY2htYXJrJyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHByZWZpeCA9ICd+JztcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzdG9yYWdlIGZvciBvdXIgYEVFYCBvYmplY3RzLlxuICogQW4gYEV2ZW50c2AgaW5zdGFuY2UgaXMgYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRXZlbnRzKCkge31cblxuLy9cbi8vIFdlIHRyeSB0byBub3QgaW5oZXJpdCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC4gSW4gc29tZSBlbmdpbmVzIGNyZWF0aW5nIGFuXG4vLyBpbnN0YW5jZSBpbiB0aGlzIHdheSBpcyBmYXN0ZXIgdGhhbiBjYWxsaW5nIGBPYmplY3QuY3JlYXRlKG51bGwpYCBkaXJlY3RseS5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBjaGFyYWN0ZXIgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Rcbi8vIG92ZXJyaWRkZW4gb3IgdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy9cbmlmIChPYmplY3QuY3JlYXRlKSB7XG4gIEV2ZW50cy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIC8vXG4gIC8vIFRoaXMgaGFjayBpcyBuZWVkZWQgYmVjYXVzZSB0aGUgYF9fcHJvdG9fX2AgcHJvcGVydHkgaXMgc3RpbGwgaW5oZXJpdGVkIGluXG4gIC8vIHNvbWUgb2xkIGJyb3dzZXJzIGxpa2UgQW5kcm9pZCA0LCBpUGhvbmUgNS4xLCBPcGVyYSAxMSBhbmQgU2FmYXJpIDUuXG4gIC8vXG4gIGlmICghbmV3IEV2ZW50cygpLl9fcHJvdG9fXykgcHJlZml4ID0gZmFsc2U7XG59XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgZXZlbnQgbGlzdGVuZXIuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgbmFtZXMgPSBbXVxuICAgICwgZXZlbnRzXG4gICAgLCBuYW1lO1xuXG4gIGlmICh0aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzKSkge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBPbmx5IGNoZWNrIGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgNDogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMiwgYTMpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBvbmUtdGltZSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgb2YgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IG1hdGNoIHRoaXMgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuICBpZiAoIWZuKSB7XG4gICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKFxuICAgICAgICAgbGlzdGVuZXJzLmZuID09PSBmblxuICAgICAgJiYgKCFvbmNlIHx8IGxpc3RlbmVycy5vbmNlKVxuICAgICAgJiYgKCFjb250ZXh0IHx8IGxpc3RlbmVycy5jb250ZXh0ID09PSBjb250ZXh0KVxuICAgICkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnRzID0gW10sIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgICAvL1xuICAgIGlmIChldmVudHMubGVuZ3RoKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gICAgZWxzZSBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gW2V2ZW50XSBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIHZhciBldnQ7XG5cbiAgaWYgKGV2ZW50KSB7XG4gICAgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcbiAgICBpZiAodGhpcy5fZXZlbnRzW2V2dF0pIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gQWxsb3cgYEV2ZW50RW1pdHRlcmAgdG8gYmUgaW1wb3J0ZWQgYXMgbW9kdWxlIG5hbWVzcGFjZS5cbi8vXG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy9Db25maWcnKTtcclxuY29uc3QgVHdvRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL1R3b0RUZXN0Jyk7XHJcbmNvbnN0IFRocmVlRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL1RocmVlRFRlc3QnKTtcclxuXHJcbi8qKlxyXG4gKiBtYWluXHJcbiAqL1xyXG5jbGFzcyBDYW52YXNCZW5jaG1hcmsgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIHN0YXRpYyBFVkVOVFMgPSB7XHJcbiAgICAgICAgRklOSVNIOiAnZmluaXNoJ1xyXG4gICAgfTtcclxuXHJcbiAgICBfd2lkdGggPSAwO1xyXG4gICAgX2hlaWdodCA9IDA7XHJcblxyXG4gICAgX3Rlc3QgPSBudWxsO1xyXG5cclxuICAgIF9jYW52YXMgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3dpZHRoID0gTWF0aC5yb3VuZCh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuOTkpO1xyXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IE1hdGgucm91bmQod2luZG93LmlubmVySGVpZ2h0ICogMC45OSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IHRoaXMuX3dpZHRoO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5oZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS56SW5kZXggPSA5OTk5O1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzLnN0eWxlLmxlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS50b3AgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9kZWx0YUZyYW1lVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lc3RhbXAgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl90b3RhbFRpbWVMYXBzZWQgPSAwO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2lzV2ViR0xTdXBwb3J0ZWQoKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJXRUIgR0wgVEVTVFwiKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdCA9IG5ldyBUaHJlZURUZXN0KHRoaXMuX2NhbnZhcywgQ29uZmlnLnBhcnRpY2xlcy50aHJlZUQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIjJEIFRFU1RcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3QgPSBuZXcgVHdvRFRlc3QodGhpcy5fY2FudmFzLCBDb25maWcucGFydGljbGVzLnR3b0QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLl9jYW52YXMpO1xyXG5cclxuICAgICAgICB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyID0gdGhpcy5fb25QYWdlVmlzaWJpbGl0eS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyKTtcclxuICAgICAgICBpZihkb2N1bWVudC5fX2lzSGlkZGVuID09PSB0cnVlKSB0aGlzLnBhdXNlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rlc3Qub24oJ3J1bkNvbXBsZXRlZCcsIHRoaXMuX2ZpbmlzaGVkLmJpbmQodGhpcykpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7TnVtYmVyIHwgdW5kZWZpbmVkfSBkdXJhdGlvblxyXG4gICAgICovXHJcbiAgICBzdGFydChkdXJhdGlvbiA9IENvbmZpZy5kdXJhdGlvbikge1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZXN0YW1wID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5ydW4oZHVyYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5zdG9wKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcGF1c2UoKSB7XHJcbiAgICAgICAgaWYodGhpcy5pc1BhdXNlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3RvdGFsVGltZUxhcHNlZCArPSBwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZXN0YW1wO1xyXG4gICAgICAgIHRoaXMuX3Rlc3QucGF1c2UoKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5pbmZvKCcjIEJlbmNobWFyayBwYXVzZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bWUoKSB7XHJcbiAgICAgICAgaWYoIXRoaXMuaXNQYXVzZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZXN0YW1wID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5ydW4oKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5pbmZvKCcjIEJlbmNobWFyayByZXN1bWVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgX29uUGFnZVZpc2liaWxpdHkoKSB7XHJcbiAgICAgICAgaWYgKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ2hpZGRlbicpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgIH0gZWxzZSBpZihkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICd2aXNpYmxlJyl7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1dlYkdMU3VwcG9ydGVkKCkge1xyXG4gICAgICAgIGxldCBjb250ZXh0T3B0aW9ucyA9IHsgc3RlbmNpbDogdHJ1ZSwgZmFpbElmTWFqb3JQZXJmb3JtYW5jZUNhdmVhdDogdHJ1ZSB9O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgICAgICBsZXQgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBjb250ZXh0T3B0aW9ucykgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIGNvbnRleHRPcHRpb25zKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdWNjZXNzID0gISEoZ2wgJiYgZ2wuZ2V0Q29udGV4dEF0dHJpYnV0ZXMoKS5zdGVuY2lsKTtcclxuICAgICAgICAgICAgaWYgKGdsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbG9zZUNvbnRleHQgPSBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2xvc2VfY29udGV4dCcpO1xyXG4gICAgICAgICAgICAgICAgaWYobG9zZUNvbnRleHQpIGxvc2VDb250ZXh0Lmxvc2VDb250ZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdsID0gbnVsbDtcclxuICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3M7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9maW5pc2hlZChmcmFtZXMpIHtcclxuICAgICAgICBjb25zb2xlLmluZm8oXCJGcmFtZXMgYWNjb21wbGlzaGVkXCIsIGZyYW1lcyk7XHJcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHRoaXMuX3BhZ2VWaXNpYmlsaXR5TGlzdGVuZXIpO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2NhbnZhcyk7XHJcbiAgICAgICAgdGhpcy5fdG90YWxUaW1lTGFwc2VkICs9IHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lc3RhbXA7XHJcbiAgICAgICAgbGV0IG1heEZyYW1lcyA9ICh0aGlzLl90b3RhbFRpbWVMYXBzZWQgLyAxMDAwKSAqIDYwO1xyXG4gICAgICAgIHRoaXMuZW1pdChDYW52YXNCZW5jaG1hcmsuRVZFTlRTLkZJTklTSCwgZnJhbWVzIC8gbWF4RnJhbWVzKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNCZW5jaG1hcms7IiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgLy8gdmlzdWFsaXNlIHRlc3RzXHJcbiAgICBkZWJ1ZzogZmFsc2UsXHJcblxyXG4gICAgLy8gc2Vjb25kcywgMCBmb3IgdW5saW1pdGVkIGkuZS4gdGVzdCBzdG9wIGhhcyB0byBiZSBjYWxsZWRcclxuICAgIGR1cmF0aW9uOiA1LFxyXG5cclxuICAgIC8vIG51bWJlciBvZiBwYXJ0aWNsZXMgdG8gZHJhd1xyXG4gICAgcGFydGljbGVzOiB7XHJcbiAgICAgICAgdHdvRDogMTUwMCxcclxuICAgICAgICB0aHJlZUQ6IDEwMDAsXHJcbiAgICB9LFxyXG5cclxufTsiLCJjbGFzcyBSZW5kZXJhYmxlMkQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNXLCBjSCkge1xyXG4gICAgICAgIHRoaXMueCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIGNXKTtcclxuICAgICAgICB0aGlzLnkgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBjSCk7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgucm91bmQoY1cgLyA1MCk7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBNYXRoLnJvdW5kKGNILyA1MCk7XHJcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHRoaXMuX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2VuZXJhdGVSYW5kb21WZWxvY2l0eSgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiAzIC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogNiksXHJcbiAgICAgICAgICAgIHk6IDMgLSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiA2KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlKG1heFgsIG1heFkpIHtcclxuICAgICAgICB0aGlzLnggKz0gdGhpcy52ZWxvY2l0eS54O1xyXG4gICAgICAgIHRoaXMueSArPSB0aGlzLnZlbG9jaXR5Lnk7XHJcbiAgICAgICAgaWYgKHRoaXMueCA8IDEgfHwgdGhpcy54ID4gbWF4WCkgdGhpcy52ZWxvY2l0eS54ID0gLXRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICBpZiAodGhpcy55IDwgMSB8fCB0aGlzLnkgPiBtYXhZKSB0aGlzLnZlbG9jaXR5LnkgPSAtdGhpcy52ZWxvY2l0eS55O1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4KSB7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odGhpcy54LCB0aGlzLnkpO1xyXG4gICAgICAgIGN0eC5saW5lVG8odGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55KTtcclxuICAgICAgICBjdHgubGluZVRvKHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSArIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICBjdHgubGluZVRvKHRoaXMueCArIDAsIHRoaXMueSArIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJhYmxlMkQ7IiwiXHJcblxyXG5jbGFzcyBSZW5kZXJhYmxlM0Qge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNXLCBjSCwgZ2wpIHtcclxuICAgICAgICB0aGlzLnggPSAwLjk1IC0gTWF0aC5yYW5kb20oKSAqIDE5NSAvIDEwMDtcclxuICAgICAgICB0aGlzLnkgPSAwLjk1IC0gTWF0aC5yYW5kb20oKSAqIDE5NSAvIDEwMDtcclxuICAgICAgICB0aGlzLndpZHRoID0gMC4wNTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IDAuMDU7XHJcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHRoaXMuX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKTtcclxuXHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gICAgICAgICAgICB0aGlzLnggKyB0aGlzLndpZHRoLCAgdGhpcy55ICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLnggKyB0aGlzLndpZHRoLCB0aGlzLnksXHJcbiAgICAgICAgICAgIHRoaXMueCwgdGhpcy55XHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIHRoaXMudmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgICAgICB0aGlzLml0ZW1TaXplID0gMjtcclxuICAgICAgICB0aGlzLm51bUl0ZW1zID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGggLyB0aGlzLml0ZW1TaXplO1xyXG4gICAgfVxyXG5cclxuICAgIF9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IDAuMDMgLSBNYXRoLnJhbmRvbSgpICogNiAvIDEwMCxcclxuICAgICAgICAgICAgeTogMC4wMyAtIE1hdGgucmFuZG9tKCkgKiA2IC8gMTAwXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmUoKSB7XHJcbiAgICAgICAgdGhpcy54ICs9IHRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICB0aGlzLnkgKz0gdGhpcy52ZWxvY2l0eS55O1xyXG4gICAgICAgIGlmICh0aGlzLnggPD0gLTEgfHwgdGhpcy54ID4gMC45NSkgdGhpcy52ZWxvY2l0eS54ID0gLXRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICBpZiAodGhpcy55IDw9IC0xIHx8IHRoaXMueSA+IDAuOTUpIHRoaXMudmVsb2NpdHkueSA9IC10aGlzLnZlbG9jaXR5Lnk7XHJcblxyXG4gICAgICAgIHRoaXMudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLngsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55LFxyXG4gICAgICAgICAgICB0aGlzLngsIHRoaXMueVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGdsLCBzaGFkZXJQcm9ncmFtKSB7XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmJ1ZmZlcik7XHJcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgICAgICBzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYVZlcnRleFBvc2l0aW9uXCIpO1xyXG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW0uYVZlcnRleFBvc2l0aW9uKTtcclxuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW0uYVZlcnRleFBvc2l0aW9uLCB0aGlzLml0ZW1TaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMubnVtSXRlbXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmFibGUzRDsiLCJjb25zdCBDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcvQ29uZmlnJyk7XHJcbmNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgUmVuZGVyYWJsZTNEID0gcmVxdWlyZSgnLi4vcmVuZGVyYWJsZS9SZW5kZXJhYmxlM0QnKTtcclxuXHJcbi8vIFRPRE8gbGl0ZXJhbHMgbm90IGNvbXBhdGlibGUgd2l0aCBJRVxyXG5jb25zdCB2ZXJ0ZXggPSBgXHJcbiAgICBhdHRyaWJ1dGUgdmVjMiBhVmVydGV4UG9zaXRpb247XHJcblxyXG4gICAgdm9pZCBtYWluKCkge1xyXG4gICAgICAgIGdsX1Bvc2l0aW9uID0gdmVjNChhVmVydGV4UG9zaXRpb24sIDAuMCwgMS4wKTtcclxuICAgIH1cclxuYDtcclxuXHJcbmNvbnN0IGZyYWdtZW50ID0gYFxyXG4gICAgI2lmZGVmIEdMX0VTXHJcbiAgICAgICAgcHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xyXG4gICAgI2VuZGlmXHJcblxyXG4gICAgdW5pZm9ybSB2ZWM0IHVDb2xvcjtcclxuXHJcbiAgICB2b2lkIG1haW4oKSB7XHJcbiAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdUNvbG9yO1xyXG4gICAgfVxyXG5gO1xyXG5cclxuY2xhc3MgVGhyZWVEVGVzdCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XHJcblxyXG4gICAgX29ianMgPSBbXTtcclxuICAgIF9nbCA9IG51bGw7XHJcbiAgICBfZnJhbWVzID0gMDtcclxuXHJcbiAgICBfcGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgY2FudmFzID0gbnVsbDtcclxuICAgIHNoYWRlclByb2dyYW0gPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNhbnZhcywgcGFydGljbGVDb3VudCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG5cclxuICAgICAgICB0aGlzLl9nbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0V2lkdGggPSBjYW52YXMud2lkdGg7XHJcbiAgICAgICAgdGhpcy5fZ2wudmlld3BvcnRIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyQ29sb3IoMCwgMCwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5fZ2wuY2xlYXIodGhpcy5fZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XHJcblxyXG4gICAgICAgIHZhciB2cyA9IHRoaXMuX2dsLmNyZWF0ZVNoYWRlcih0aGlzLl9nbC5WRVJURVhfU0hBREVSKTtcclxuICAgICAgICB0aGlzLl9nbC5zaGFkZXJTb3VyY2UodnMsIHZlcnRleCk7XHJcbiAgICAgICAgdGhpcy5fZ2wuY29tcGlsZVNoYWRlcih2cyk7XHJcblxyXG4gICAgICAgIHZhciBmcyA9IHRoaXMuX2dsLmNyZWF0ZVNoYWRlcih0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgIHRoaXMuX2dsLnNoYWRlclNvdXJjZShmcywgZnJhZ21lbnQpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNvbXBpbGVTaGFkZXIoZnMpO1xyXG5cclxuICAgICAgICB0aGlzLnNoYWRlclByb2dyYW0gPSB0aGlzLl9nbC5jcmVhdGVQcm9ncmFtKCk7XHJcbiAgICAgICAgdGhpcy5fZ2wuYXR0YWNoU2hhZGVyKHRoaXMuc2hhZGVyUHJvZ3JhbSwgdnMpO1xyXG4gICAgICAgIHRoaXMuX2dsLmF0dGFjaFNoYWRlcih0aGlzLnNoYWRlclByb2dyYW0sIGZzKTtcclxuICAgICAgICB0aGlzLl9nbC5saW5rUHJvZ3JhbSh0aGlzLnNoYWRlclByb2dyYW0pO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX2dsLmdldFNoYWRlclBhcmFtZXRlcih2cywgdGhpcy5fZ2wuQ09NUElMRV9TVEFUVVMpKSBjb25zb2xlLmxvZyh0aGlzLl9nbC5nZXRTaGFkZXJJbmZvTG9nKHZzKSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIoZnMsIHRoaXMuX2dsLkNPTVBJTEVfU1RBVFVTKSkgY29uc29sZS5sb2codGhpcy5fZ2wuZ2V0U2hhZGVySW5mb0xvZyhmcykpO1xyXG4gICAgICAgIGlmICghdGhpcy5fZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnNoYWRlclByb2dyYW0sIHRoaXMuX2dsLkxJTktfU1RBVFVTKSkgY29uc29sZS5sb2codGhpcy5fZ2wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5zaGFkZXJQcm9ncmFtKSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydGljbGVDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX29ianMucHVzaChuZXcgUmVuZGVyYWJsZTNEKGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCwgdGhpcy5fZ2wpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0odGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFkZXJQcm9ncmFtLnVDb2xvciA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlclByb2dyYW0sIFwidUNvbG9yXCIpO1xyXG4gICAgICAgIGlmIChDb25maWcuZGVidWcpIHtcclxuICAgICAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTRmdih0aGlzLnNoYWRlclByb2dyYW0udUNvbG9yLCBbMC4wLCAwLjMsIDAuMywgMC41XSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTRmdih0aGlzLnNoYWRlclByb2dyYW0udUNvbG9yLCBbMC4wLCAwLjAsIDAuMCwgMC4wXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZCA9IHRoaXMuX3JlbmRlci5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJ1bigpIHtcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JlbmRlckJvdW5kKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICB0aGlzLl9wYXVzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9maW5pc2goKTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fZ2wudmlld3BvcnQoMCwgMCwgdGhpcy5fZ2wudmlld3BvcnRXaWR0aCwgdGhpcy5fZ2wudmlld3BvcnRIZWlnaHQpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCB0aGlzLl9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVuZGVyKCkge1xyXG4gICAgICAgIGlmKHRoaXMuX3BhdXNlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX29ianMuZm9yRWFjaCgob2JqKSA9PiB7XHJcbiAgICAgICAgICAgIG9iai5tb3ZlKHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBvYmouZHJhdyh0aGlzLl9nbCwgdGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuXHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl9yZW5kZXJCb3VuZCk7XHJcbiAgICB9XHJcblxyXG4gICAgX2ZpbmlzaCgpIHtcclxuICAgICAgICB0aGlzLmVtaXQoJ3J1bkNvbXBsZXRlZCcsIHRoaXMuX2ZyYW1lcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGhyZWVEVGVzdDsiLCJjb25zdCBDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcvQ29uZmlnJyk7XHJcbmNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgUmVuZGVyYWJsZTJEID0gcmVxdWlyZSgnLi4vcmVuZGVyYWJsZS9SZW5kZXJhYmxlMkQnKTtcclxuXHJcbmNsYXNzIFR3b0RUZXN0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2NvbnRleHQgPSBudWxsO1xyXG5cclxuICAgIGNhbnZhcyA9IG51bGw7XHJcblxyXG4gICAgX2ZyYW1lcyA9IDA7XHJcblxyXG4gICAgX3BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNhbnZhcywgcGFydGljbGVDb3VudCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0aWNsZUNvdW50OyBpKyspIHRoaXMuX29ianMucHVzaChuZXcgUmVuZGVyYWJsZTJEKGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCkpO1xyXG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gICAgICAgIGlmIChDb25maWcuZGVidWcpIHtcclxuICAgICAgICAgICAgdGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMC4zLCAwLjMsIDAuNSlcIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAwKVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZCA9IHRoaXMuX3JlbmRlci5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJ1bigpIHtcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JlbmRlckJvdW5kKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICB0aGlzLl9wYXVzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9maW5pc2goKTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlbmRlcigpIHtcclxuICAgICAgICBpZih0aGlzLl9wYXVzZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5fY2xlYXIoKTtcclxuICAgICAgICB0aGlzLl9vYmpzLmZvckVhY2goKG9iaikgPT4ge1xyXG4gICAgICAgICAgICBvYmoubW92ZSh0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgb2JqLmRyYXcodGhpcy5fY29udGV4dCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fZnJhbWVzKys7XHJcblxyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fcmVuZGVyQm91bmQpO1xyXG4gICAgfVxyXG5cclxuICAgIF9maW5pc2goKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdydW5Db21wbGV0ZWQnLCB0aGlzLl9mcmFtZXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFR3b0RUZXN0OyJdfQ==
