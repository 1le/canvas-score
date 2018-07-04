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
        _this._lastFrameTime = 0;

        _this.totalTimeLapsed = 0;
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

    _createClass(CanvasBenchmark, [{
        key: 'test',
        value: function test() {
            this._test.run(Config.duration);
        }
    }, {
        key: 'pause',
        value: function pause() {
            if (this.isPaused) return;
            this.isPaused = true;

            this._test.isPaused = true;

            console.info('# Benchmark is paused');
        }
    }, {
        key: 'resume',
        value: function resume() {
            if (!this.isPaused) return;
            this.isPaused = false;

            this._test._lastFrameTime = Date.now();
            this._test.isPaused = false;

            console.info('# Benchmark is resumed');
        }
    }, {
        key: '_injectShaders',
        value: function _injectShaders() {}
    }, {
        key: '_onPageVisibility',
        value: function _onPageVisibility(e) {
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
            console.log("Accomplished", frames);
            document.removeEventListener('visibilitychange', this._pageVisibilityListener);
            this._canvas.parentNode.removeChild(this._canvas);
            var maxFrames = Config.duration * 60;
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
        return _this;
    }

    _createClass(ThreeDTest, [{
        key: 'run',
        value: function run(runTime) {
            var _this2 = this;

            console.log("RUN TEST");

            this.totalTimeLapsed = 0;
            this._lastFrameTime = Date.now();
            this._runTime = runTime;
            window.requestAnimationFrame(function () {
                _this2._render();
            });
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
            var _this3 = this;

            if (this.isPaused) return;

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this3.canvas.width, _this3.canvas.height);
                obj.draw(_this3._gl, _this3.shaderProgram);
            });
            this._frames++;

            var curTime = Date.now();
            this._deltaFrameTime = curTime - this._lastFrameTime;
            this._lastFrameTime = curTime;
            this.totalTimeLapsed += this._deltaFrameTime;

            if (this.totalTimeLapsed < this._runTime * 1000) window.requestAnimationFrame(function () {
                _this3._render();
            });else this._finished();
        }
    }, {
        key: '_finished',
        value: function _finished() {
            console.log("TEST COMPLETED");
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

            console.log("RUN TEST");
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
            if (Date.now() - this.start < this._runTime * 1000) window.requestAnimationFrame(function () {
                _this3._render();
            });else this._finished();
        }
    }, {
        key: '_finished',
        value: function _finished() {
            console.log("TEST COMPLETED");
            this.emit('runCompleted', this._frames);
        }
    }]);

    return TwoDTest;
}(EventEmitter);

module.exports = TwoDTest;

},{"./../renderable/Renderable2D":5,"eventemitter3":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvQ2FudmFzQmVuY2htYXJrLmpzIiwic3JjL2NvbmZpZy9Db25maWcuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlMkQuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlM0QuanMiLCJzcmMvdGVzdHMvVGhyZWVEVGVzdC5qcyIsInNyYy90ZXN0cy9Ud29EVGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxlQUFQLEdBQXlCLFFBQVEsdUJBQVIsQ0FBekI7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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UUFBTCxDQUFjLFNBQWQsQ0FBd0IsQ0FBeEIsRUFBMkIsQ0FBM0IsRUFBOEIsS0FBSyxNQUFMLENBQVksS0FBMUMsRUFBaUQsS0FBSyxNQUFMLENBQVksTUFBN0Q7QUFDSDs7O2tDQUVTO0FBQUE7O0FBQ04saUJBQUssTUFBTDtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLFVBQUMsR0FBRCxFQUFTO0FBQ3hCLG9CQUFJLElBQUosQ0FBUyxPQUFLLE1BQUwsQ0FBWSxLQUFyQixFQUE0QixPQUFLLE1BQUwsQ0FBWSxNQUF4QztBQUNBLG9CQUFJLElBQUosQ0FBUyxPQUFLLFFBQWQ7QUFDSCxhQUhEO0FBSUEsaUJBQUssT0FBTDtBQUNBLGdCQUFJLEtBQUssR0FBTCxLQUFhLEtBQUssS0FBbEIsR0FBMEIsS0FBSyxRQUFMLEdBQWdCLElBQTlDLEVBQW9ELE9BQU8scUJBQVAsQ0FBNkIsWUFBTTtBQUFFLHVCQUFLLE9BQUw7QUFBZ0IsYUFBckQsRUFBcEQsS0FDSyxLQUFLLFNBQUw7QUFDUjs7O29DQUVXO0FBQ1Isb0JBQVEsR0FBUixDQUFZLGdCQUFaO0FBQ0EsaUJBQUssSUFBTCxDQUFVLGNBQVYsRUFBMEIsS0FBSyxPQUEvQjtBQUNIOzs7O0VBM0NrQixZOztBQThDdkIsT0FBTyxPQUFQLEdBQWlCLFFBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwid2luZG93LkNhbnZhc0JlbmNobWFyayA9IHJlcXVpcmUoJy4vc3JjL0NhbnZhc0JlbmNobWFyaycpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBwcmVmaXggPSAnfic7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgdG8gY3JlYXRlIGEgc3RvcmFnZSBmb3Igb3VyIGBFRWAgb2JqZWN0cy5cbiAqIEFuIGBFdmVudHNgIGluc3RhbmNlIGlzIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgT25seSBjaGVjayBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBjYXNlIDQ6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIsIGEzKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgbGlzdGVuZXJzIG9mIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcbiAgaWYgKCFmbikge1xuICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm5cbiAgICAgICYmICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSlcbiAgICAgICYmICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IFtldmVudF0gVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEFsbG93IGBFdmVudEVtaXR0ZXJgIHRvIGJlIGltcG9ydGVkIGFzIG1vZHVsZSBuYW1lc3BhY2UuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvQ29uZmlnJyk7XHJcbmNvbnN0IFR3b0RUZXN0ID0gcmVxdWlyZSgnLi90ZXN0cy9Ud29EVGVzdCcpO1xyXG5jb25zdCBUaHJlZURUZXN0ID0gcmVxdWlyZSgnLi90ZXN0cy9UaHJlZURUZXN0Jyk7XHJcblxyXG4vKipcclxuICogbWFpblxyXG4gKi9cclxuY2xhc3MgQ2FudmFzQmVuY2htYXJrIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBzdGF0aWMgRVZFTlRTID0ge1xyXG4gICAgICAgIEZJTklTSDogJ2ZpbmlzaCdcclxuICAgIH07XHJcblxyXG4gICAgX3dpZHRoID0gMDtcclxuICAgIF9oZWlnaHQgPSAwO1xyXG5cclxuICAgIF90ZXN0ID0gbnVsbDtcclxuXHJcbiAgICBfY2FudmFzID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLl93aWR0aCA9IE1hdGgucm91bmQod2luZG93LmlubmVyV2lkdGggKiAwLjk5KTtcclxuICAgICAgICB0aGlzLl9oZWlnaHQgPSBNYXRoLnJvdW5kKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuOTkpO1xyXG5cclxuICAgICAgICB0aGlzLl9jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICB0aGlzLl9jYW52YXMud2lkdGggPSB0aGlzLl93aWR0aDtcclxuICAgICAgICB0aGlzLl9jYW52YXMuaGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xyXG5cclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUuekluZGV4ID0gOTk5OTtcclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5sZWZ0ID0gMDtcclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUudG9wID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5fZGVsdGFGcmFtZVRpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuX2xhc3RGcmFtZVRpbWUgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLnRvdGFsVGltZUxhcHNlZCA9IDA7XHJcbiAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5faXNXZWJHTFN1cHBvcnRlZCgpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIldFQiBHTCBURVNUXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0ID0gbmV3IFRocmVlRFRlc3QodGhpcy5fY2FudmFzLCBDb25maWcucGFydGljbGVzLnRocmVlRCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiMkQgVEVTVFwiKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdCA9IG5ldyBUd29EVGVzdCh0aGlzLl9jYW52YXMsIENvbmZpZy5wYXJ0aWNsZXMudHdvRCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuX2NhbnZhcyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3BhZ2VWaXNpYmlsaXR5TGlzdGVuZXIgPSB0aGlzLl9vblBhZ2VWaXNpYmlsaXR5LmJpbmQodGhpcyk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHRoaXMuX3BhZ2VWaXNpYmlsaXR5TGlzdGVuZXIpO1xyXG4gICAgICAgIGlmKGRvY3VtZW50Ll9faXNIaWRkZW4gPT09IHRydWUpIHRoaXMucGF1c2UoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fdGVzdC5vbigncnVuQ29tcGxldGVkJywgdGhpcy5fZmluaXNoZWQuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRlc3QoKSB7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5ydW4oQ29uZmlnLmR1cmF0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICBpZih0aGlzLmlzUGF1c2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rlc3QuaXNQYXVzZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oJyMgQmVuY2htYXJrIGlzIHBhdXNlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VtZSgpIHtcclxuICAgICAgICBpZighdGhpcy5pc1BhdXNlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5fdGVzdC5fbGFzdEZyYW1lVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5pc1BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oJyMgQmVuY2htYXJrIGlzIHJlc3VtZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICBfaW5qZWN0U2hhZGVycygpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgX29uUGFnZVZpc2liaWxpdHkoZSkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICdoaWRkZW4nKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICB9IGVsc2UgaWYoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScpe1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfaXNXZWJHTFN1cHBvcnRlZCgpIHtcclxuICAgICAgICBsZXQgY29udGV4dE9wdGlvbnMgPSB7IHN0ZW5jaWw6IHRydWUsIGZhaWxJZk1ham9yUGVyZm9ybWFuY2VDYXZlYXQ6IHRydWUgfTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICAgICAgbGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgY29udGV4dE9wdGlvbnMpIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBjb250ZXh0T3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9ICEhKGdsICYmIGdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCkuc3RlbmNpbCk7XHJcbiAgICAgICAgICAgIGlmIChnbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxvc2VDb250ZXh0ID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9sb3NlX2NvbnRleHQnKTtcclxuICAgICAgICAgICAgICAgIGlmKGxvc2VDb250ZXh0KSBsb3NlQ29udGV4dC5sb3NlQ29udGV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnbCA9IG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZmluaXNoZWQoZnJhbWVzKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJBY2NvbXBsaXNoZWRcIiwgZnJhbWVzKTtcclxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5fcGFnZVZpc2liaWxpdHlMaXN0ZW5lcik7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fY2FudmFzKTtcclxuICAgICAgICBsZXQgbWF4RnJhbWVzID0gQ29uZmlnLmR1cmF0aW9uICogNjA7XHJcbiAgICAgICAgdGhpcy5lbWl0KENhbnZhc0JlbmNobWFyay5FVkVOVFMuRklOSVNILCBmcmFtZXMgLyBtYXhGcmFtZXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENhbnZhc0JlbmNobWFyazsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICAvLyB2aXN1YWxpc2UgdGVzdFxyXG4gICAgZGVidWc6IHRydWUsXHJcblxyXG4gICAgLy8gc2Vjb25kcywgMCBmb3IgdW5saW1pdGVkIGkuZS4gdGVzdCBzdG9wIGhhcyB0byBiZSBjYWxsZWRcclxuICAgIGR1cmF0aW9uOiA1LFxyXG5cclxuICAgIC8vIG51bWJlciBvZiBwYXJ0aWNsZXMgdG8gZHJhd1xyXG4gICAgcGFydGljbGVzOiB7XHJcbiAgICAgICAgdHdvRDogMTUwMCxcclxuICAgICAgICB0aHJlZUQ6IDEwMDAsXHJcbiAgICB9LFxyXG5cclxufTsiLCJjbGFzcyBSZW5kZXJhYmxlMkQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNXLCBjSCkge1xyXG4gICAgICAgIHRoaXMueCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIGNXKTtcclxuICAgICAgICB0aGlzLnkgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBjSCk7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IE1hdGgucm91bmQoY1cgLyA1MCk7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBNYXRoLnJvdW5kKGNILyA1MCk7XHJcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHRoaXMuX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2VuZXJhdGVSYW5kb21WZWxvY2l0eSgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiAzIC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogNiksXHJcbiAgICAgICAgICAgIHk6IDMgLSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiA2KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlKG1heFgsIG1heFkpIHtcclxuICAgICAgICB0aGlzLnggKz0gdGhpcy52ZWxvY2l0eS54O1xyXG4gICAgICAgIHRoaXMueSArPSB0aGlzLnZlbG9jaXR5Lnk7XHJcbiAgICAgICAgaWYgKHRoaXMueCA8IDEgfHwgdGhpcy54ID4gbWF4WCkgdGhpcy52ZWxvY2l0eS54ID0gLXRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICBpZiAodGhpcy55IDwgMSB8fCB0aGlzLnkgPiBtYXhZKSB0aGlzLnZlbG9jaXR5LnkgPSAtdGhpcy52ZWxvY2l0eS55O1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4KSB7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odGhpcy54LCB0aGlzLnkpO1xyXG4gICAgICAgIGN0eC5saW5lVG8odGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55KTtcclxuICAgICAgICBjdHgubGluZVRvKHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSArIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICBjdHgubGluZVRvKHRoaXMueCArIDAsIHRoaXMueSArIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJhYmxlMkQ7IiwiXHJcblxyXG5jbGFzcyBSZW5kZXJhYmxlM0Qge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNXLCBjSCwgZ2wpIHtcclxuICAgICAgICB0aGlzLnggPSAwLjk1IC0gTWF0aC5yYW5kb20oKSAqIDE5NSAvIDEwMDtcclxuICAgICAgICB0aGlzLnkgPSAwLjk1IC0gTWF0aC5yYW5kb20oKSAqIDE5NSAvIDEwMDtcclxuICAgICAgICB0aGlzLndpZHRoID0gMC4wNTtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IDAuMDU7XHJcbiAgICAgICAgdGhpcy52ZWxvY2l0eSA9IHRoaXMuX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKTtcclxuXHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gICAgICAgICAgICB0aGlzLnggKyB0aGlzLndpZHRoLCAgdGhpcy55ICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLnggKyB0aGlzLndpZHRoLCB0aGlzLnksXHJcbiAgICAgICAgICAgIHRoaXMueCwgdGhpcy55XHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIHRoaXMudmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgICAgICB0aGlzLml0ZW1TaXplID0gMjtcclxuICAgICAgICB0aGlzLm51bUl0ZW1zID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGggLyB0aGlzLml0ZW1TaXplO1xyXG4gICAgfVxyXG5cclxuICAgIF9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IDAuMDMgLSBNYXRoLnJhbmRvbSgpICogNiAvIDEwMCxcclxuICAgICAgICAgICAgeTogMC4wMyAtIE1hdGgucmFuZG9tKCkgKiA2IC8gMTAwXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmUoKSB7XHJcbiAgICAgICAgdGhpcy54ICs9IHRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICB0aGlzLnkgKz0gdGhpcy52ZWxvY2l0eS55O1xyXG4gICAgICAgIGlmICh0aGlzLnggPD0gLTEgfHwgdGhpcy54ID4gMC45NSkgdGhpcy52ZWxvY2l0eS54ID0gLXRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICBpZiAodGhpcy55IDw9IC0xIHx8IHRoaXMueSA+IDAuOTUpIHRoaXMudmVsb2NpdHkueSA9IC10aGlzLnZlbG9jaXR5Lnk7XHJcblxyXG4gICAgICAgIHRoaXMudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLngsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55LFxyXG4gICAgICAgICAgICB0aGlzLngsIHRoaXMueVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGdsLCBzaGFkZXJQcm9ncmFtKSB7XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmJ1ZmZlcik7XHJcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcclxuICAgICAgICBzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYVZlcnRleFBvc2l0aW9uXCIpO1xyXG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW0uYVZlcnRleFBvc2l0aW9uKTtcclxuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlclByb2dyYW0uYVZlcnRleFBvc2l0aW9uLCB0aGlzLml0ZW1TaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIHRoaXMubnVtSXRlbXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmFibGUzRDsiLCJjb25zdCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XHJcbmNvbnN0IFJlbmRlcmFibGUzRCA9IHJlcXVpcmUoJy4vLi4vcmVuZGVyYWJsZS9SZW5kZXJhYmxlM0QnKTtcclxuXHJcbmNvbnN0IHZlcnRleCA9IGBcclxuICAgIGF0dHJpYnV0ZSB2ZWMyIGFWZXJ0ZXhQb3NpdGlvbjtcclxuXHJcbiAgICB2b2lkIG1haW4oKSB7XHJcbiAgICAgICAgZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMC4wLCAxLjApO1xyXG4gICAgfVxyXG5gO1xyXG5cclxuY29uc3QgZnJhZ21lbnQgPSBgXHJcbiAgICAjaWZkZWYgR0xfRVNcclxuICAgICAgICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XHJcbiAgICAjZW5kaWZcclxuXHJcbiAgICB1bmlmb3JtIHZlYzQgdUNvbG9yO1xyXG5cclxuICAgIHZvaWQgbWFpbigpIHtcclxuICAgICAgICBnbF9GcmFnQ29sb3IgPSB1Q29sb3I7XHJcbiAgICB9XHJcbmA7XHJcblxyXG5jbGFzcyBUaHJlZURUZXN0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2dsID0gbnVsbDtcclxuICAgIF9mcmFtZXMgPSAwO1xyXG4gICAgX3J1blRpbWUgPSAwO1xyXG4gICAgX2RlbHRhRnJhbWVUaW1lID0gMDtcclxuICAgIF9sYXN0RnJhbWVUaW1lID0gMDtcclxuICAgIFxyXG4gICAgY2FudmFzID0gbnVsbDtcclxuICAgIHNoYWRlclByb2dyYW0gPSBudWxsO1xyXG4gICAgdG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgIGlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgbnVtSXRlbXMgPSAwO1xyXG4gICAgaXRlbVNpemU7XHJcbiAgICB2ZXJ0aWNlcztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIHBhcnRpY2xlQ291bnQpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuXHJcbiAgICAgICAgdGhpcy5fZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICB2YXIgdnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgdGhpcy5fZ2wuc2hhZGVyU291cmNlKHZzLCB2ZXJ0ZXgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNvbXBpbGVTaGFkZXIodnMpO1xyXG5cclxuICAgICAgICB2YXIgZnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSKTtcclxuICAgICAgICB0aGlzLl9nbC5zaGFkZXJTb3VyY2UoZnMsIGZyYWdtZW50KTtcclxuICAgICAgICB0aGlzLl9nbC5jb21waWxlU2hhZGVyKGZzKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFkZXJQcm9ncmFtID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmF0dGFjaFNoYWRlcih0aGlzLnNoYWRlclByb2dyYW0sIHZzKTtcclxuICAgICAgICB0aGlzLl9nbC5hdHRhY2hTaGFkZXIodGhpcy5zaGFkZXJQcm9ncmFtLCBmcyk7XHJcbiAgICAgICAgdGhpcy5fZ2wubGlua1Byb2dyYW0odGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIodnMsIHRoaXMuX2dsLkNPTVBJTEVfU1RBVFVTKSkgY29uc29sZS5sb2codGhpcy5fZ2wuZ2V0U2hhZGVySW5mb0xvZyh2cykpO1xyXG4gICAgICAgIGlmICghdGhpcy5fZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKGZzLCB0aGlzLl9nbC5DT01QSUxFX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFNoYWRlckluZm9Mb2coZnMpKTtcclxuICAgICAgICBpZiAoIXRoaXMuX2dsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5zaGFkZXJQcm9ncmFtLCB0aGlzLl9nbC5MSU5LX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMuc2hhZGVyUHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRpY2xlQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLl9vYmpzLnB1c2gobmV3IFJlbmRlcmFibGUzRChjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQsIHRoaXMuX2dsKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9nbC51c2VQcm9ncmFtKHRoaXMuc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IgPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcInVDb2xvclwiKTtcclxuICAgICAgICB0aGlzLl9nbC51bmlmb3JtNGZ2KHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IsIFswLjAsIDAuMCwgMC4wLCAwLjBdKTtcclxuICAgIH1cclxuXHJcbiAgICBydW4ocnVuVGltZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiUlVOIFRFU1RcIik7XHJcblxyXG4gICAgICAgIHRoaXMudG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgICAgICB0aGlzLl9sYXN0RnJhbWVUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB0aGlzLl9ydW5UaW1lID0gcnVuVGltZTtcclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHsgdGhpcy5fcmVuZGVyKCk7fSk7XHJcbiAgICB9XHJcblxyXG4gICAgX2NsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIHRoaXMuX2dsLnZpZXdwb3J0V2lkdGgsIHRoaXMuX2dsLnZpZXdwb3J0SGVpZ2h0KTtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhcih0aGlzLl9nbC5DT0xPUl9CVUZGRVJfQklUIHwgdGhpcy5fZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlbmRlcigpIHtcclxuICAgICAgICBpZih0aGlzLmlzUGF1c2VkKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuX2NsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5fb2Jqcy5mb3JFYWNoKChvYmopID0+IHtcclxuICAgICAgICAgICAgb2JqLm1vdmUodGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgIG9iai5kcmF3KHRoaXMuX2dsLCB0aGlzLnNoYWRlclByb2dyYW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lcysrO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IGN1clRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHRoaXMuX2RlbHRhRnJhbWVUaW1lID0gY3VyVGltZSAtIHRoaXMuX2xhc3RGcmFtZVRpbWU7XHJcbiAgICAgICAgdGhpcy5fbGFzdEZyYW1lVGltZSA9IGN1clRpbWU7XHJcbiAgICAgICAgdGhpcy50b3RhbFRpbWVMYXBzZWQgKz0gdGhpcy5fZGVsdGFGcmFtZVRpbWU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnRvdGFsVGltZUxhcHNlZCA8IHRoaXMuX3J1blRpbWUgKiAxMDAwKSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHsgdGhpcy5fcmVuZGVyKCk7fSk7XHJcbiAgICAgICAgZWxzZSB0aGlzLl9maW5pc2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIF9maW5pc2hlZCgpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRFU1QgQ09NUExFVEVEXCIpO1xyXG4gICAgICAgIHRoaXMuZW1pdCgncnVuQ29tcGxldGVkJywgdGhpcy5fZnJhbWVzKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaHJlZURUZXN0OyIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgUmVuZGVyYWJsZTJEID0gcmVxdWlyZSgnLi8uLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUyRCcpO1xyXG5cclxuY2xhc3MgVHdvRFRlc3QgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIF9vYmpzID0gW107XHJcbiAgICBfY29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgY2FudmFzID0gbnVsbDs7XHJcblxyXG4gICAgX2ZyYW1lcyA9IDA7XHJcbiAgICBfcnVuVGltZSA9IDA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBwYXJ0aWNsZUNvdW50KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRpY2xlQ291bnQ7IGkrKykgdGhpcy5fb2Jqcy5wdXNoKG5ldyBSZW5kZXJhYmxlMkQoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMC4zLCAwLjMsIDAuNSlcIjtcclxuICAgIH1cclxuXHJcbiAgICBydW4ocnVuVGltZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiUlVOIFRFU1RcIik7XHJcbiAgICAgICAgdGhpcy5zdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdGhpcy5fcnVuVGltZSA9IHJ1blRpbWU7XHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7IHRoaXMuX3JlbmRlcigpO30pO1xyXG4gICAgfVxyXG5cclxuICAgIF9jbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVuZGVyKCkge1xyXG4gICAgICAgIHRoaXMuX2NsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5fb2Jqcy5mb3JFYWNoKChvYmopID0+IHtcclxuICAgICAgICAgICAgb2JqLm1vdmUodGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgIG9iai5kcmF3KHRoaXMuX2NvbnRleHQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lcysrO1xyXG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gdGhpcy5zdGFydCA8IHRoaXMuX3J1blRpbWUgKiAxMDAwKSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHsgdGhpcy5fcmVuZGVyKCk7fSk7XHJcbiAgICAgICAgZWxzZSB0aGlzLl9maW5pc2hlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIF9maW5pc2hlZCgpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlRFU1QgQ09NUExFVEVEXCIpXHJcbiAgICAgICAgdGhpcy5lbWl0KCdydW5Db21wbGV0ZWQnLCB0aGlzLl9mcmFtZXMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFR3b0RUZXN0OyJdfQ==
