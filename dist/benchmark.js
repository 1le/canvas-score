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

        var v = document.getElementById("vertex").firstChild.nodeValue;
        var f = document.getElementById("fragment").firstChild.nodeValue;

        var vs = _this._gl.createShader(_this._gl.VERTEX_SHADER);
        _this._gl.shaderSource(vs, v);
        _this._gl.compileShader(vs);

        var fs = _this._gl.createShader(_this._gl.FRAGMENT_SHADER);
        _this._gl.shaderSource(fs, f);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvQ2FudmFzQmVuY2htYXJrLmpzIiwic3JjL2NvbmZpZy9Db25maWcuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlMkQuanMiLCJzcmMvcmVuZGVyYWJsZS9SZW5kZXJhYmxlM0QuanMiLCJzcmMvdGVzdHMvVGhyZWVEVGVzdC5qcyIsInNyYy90ZXN0cy9Ud29EVGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxlQUFQLEdBQXlCLFFBQVEsdUJBQVIsQ0FBekI7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDdlRBLElBQU0sZUFBZSxRQUFRLGVBQVIsQ0FBckI7QUFDQSxJQUFNLFNBQVMsUUFBUSxpQkFBUixDQUFmO0FBQ0EsSUFBTSxXQUFXLFFBQVEsa0JBQVIsQ0FBakI7QUFDQSxJQUFNLGFBQWEsUUFBUSxvQkFBUixDQUFuQjs7QUFFQTs7OztJQUdNLGU7OztBQWFGLCtCQUFjO0FBQUE7O0FBQUE7O0FBQUEsY0FQZCxNQU9jLEdBUEwsQ0FPSztBQUFBLGNBTmQsT0FNYyxHQU5KLENBTUk7QUFBQSxjQUpkLEtBSWMsR0FKTixJQUlNO0FBQUEsY0FGZCxPQUVjLEdBRkosSUFFSTs7O0FBR1YsY0FBSyxNQUFMLEdBQWMsS0FBSyxLQUFMLENBQVcsT0FBTyxVQUFQLEdBQW9CLElBQS9CLENBQWQ7QUFDQSxjQUFLLE9BQUwsR0FBZSxLQUFLLEtBQUwsQ0FBVyxPQUFPLFdBQVAsR0FBcUIsSUFBaEMsQ0FBZjs7QUFFQSxjQUFLLE9BQUwsR0FBZSxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLGNBQUssT0FBTCxDQUFhLEtBQWIsR0FBcUIsTUFBSyxNQUExQjtBQUNBLGNBQUssT0FBTCxDQUFhLE1BQWIsR0FBc0IsTUFBSyxPQUEzQjs7QUFFQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLE1BQW5CLEdBQTRCLElBQTVCO0FBQ0EsY0FBSyxPQUFMLENBQWEsS0FBYixDQUFtQixRQUFuQixHQUE4QixVQUE5QjtBQUNBLGNBQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsSUFBbkIsR0FBMEIsQ0FBMUI7QUFDQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLEdBQW5CLEdBQXlCLENBQXpCOztBQUVBLGNBQUssZUFBTCxHQUF1QixDQUF2QjtBQUNBLGNBQUssY0FBTCxHQUFzQixDQUF0Qjs7QUFFQSxjQUFLLGVBQUwsR0FBdUIsQ0FBdkI7QUFDQSxjQUFLLFFBQUwsR0FBZ0IsS0FBaEI7O0FBRUEsWUFBSSxNQUFLLGlCQUFMLEVBQUosRUFBOEI7QUFDMUIsb0JBQVEsSUFBUixDQUFhLGFBQWI7QUFDQSxrQkFBSyxLQUFMLEdBQWEsSUFBSSxVQUFKLENBQWUsTUFBSyxPQUFwQixFQUE2QixPQUFPLFNBQVAsQ0FBaUIsTUFBOUMsQ0FBYjtBQUNILFNBSEQsTUFHTztBQUNILG9CQUFRLElBQVIsQ0FBYSxTQUFiO0FBQ0Esa0JBQUssS0FBTCxHQUFhLElBQUksUUFBSixDQUFhLE1BQUssT0FBbEIsRUFBMkIsT0FBTyxTQUFQLENBQWlCLElBQTVDLENBQWI7QUFDSDs7QUFFRCxpQkFBUyxJQUFULENBQWMsV0FBZCxDQUEwQixNQUFLLE9BQS9COztBQUVBLGNBQUssdUJBQUwsR0FBK0IsTUFBSyxpQkFBTCxDQUF1QixJQUF2QixPQUEvQjtBQUNBLGlCQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxNQUFLLHVCQUFuRDtBQUNBLFlBQUcsU0FBUyxVQUFULEtBQXdCLElBQTNCLEVBQWlDLE1BQUssS0FBTDs7QUFFakMsY0FBSyxLQUFMLENBQVcsRUFBWCxDQUFjLGNBQWQsRUFBOEIsTUFBSyxTQUFMLENBQWUsSUFBZixPQUE5Qjs7QUFuQ1U7QUFxQ2I7Ozs7K0JBRU07QUFDSCxpQkFBSyxLQUFMLENBQVcsR0FBWCxDQUFlLE9BQU8sUUFBdEI7QUFDSDs7O2dDQUVPO0FBQ0osZ0JBQUcsS0FBSyxRQUFSLEVBQWtCO0FBQ2xCLGlCQUFLLFFBQUwsR0FBZ0IsSUFBaEI7O0FBRUEsaUJBQUssS0FBTCxDQUFXLFFBQVgsR0FBc0IsSUFBdEI7O0FBRUEsb0JBQVEsSUFBUixDQUFhLHVCQUFiO0FBQ0g7OztpQ0FFUTtBQUNMLGdCQUFHLENBQUMsS0FBSyxRQUFULEVBQW1CO0FBQ25CLGlCQUFLLFFBQUwsR0FBZ0IsS0FBaEI7O0FBRUEsaUJBQUssS0FBTCxDQUFXLGNBQVgsR0FBNEIsS0FBSyxHQUFMLEVBQTVCO0FBQ0EsaUJBQUssS0FBTCxDQUFXLFFBQVgsR0FBc0IsS0FBdEI7O0FBRUEsb0JBQVEsSUFBUixDQUFhLHdCQUFiO0FBQ0g7OzswQ0FFaUIsQyxFQUFHO0FBQ2pCLGdCQUFJLFNBQVMsZUFBVCxLQUE2QixRQUFqQyxFQUEyQztBQUN2QyxxQkFBSyxLQUFMO0FBQ0gsYUFGRCxNQUVPLElBQUcsU0FBUyxlQUFULEtBQTZCLFNBQWhDLEVBQTBDO0FBQzdDLHFCQUFLLE1BQUw7QUFDSDtBQUNKOzs7NENBRW1CO0FBQ2hCLGdCQUFJLGlCQUFpQixFQUFFLFNBQVMsSUFBWCxFQUFpQiw4QkFBOEIsSUFBL0MsRUFBckI7QUFDQSxnQkFBSTtBQUNBLG9CQUFJLENBQUMsT0FBTyxxQkFBWixFQUFtQyxPQUFPLEtBQVA7O0FBRW5DLG9CQUFJLFNBQVMsU0FBUyxhQUFULENBQXVCLFFBQXZCLENBQWI7QUFDQSxvQkFBSSxLQUFLLE9BQU8sVUFBUCxDQUFrQixPQUFsQixFQUEyQixjQUEzQixLQUE4QyxPQUFPLFVBQVAsQ0FBa0Isb0JBQWxCLEVBQXdDLGNBQXhDLENBQXZEOztBQUVBLG9CQUFJLFVBQVUsQ0FBQyxFQUFFLE1BQU0sR0FBRyxvQkFBSCxHQUEwQixPQUFsQyxDQUFmO0FBQ0Esb0JBQUksRUFBSixFQUFRO0FBQ0osd0JBQUksY0FBYyxHQUFHLFlBQUgsQ0FBZ0Isb0JBQWhCLENBQWxCO0FBQ0Esd0JBQUcsV0FBSCxFQUFnQixZQUFZLFdBQVo7QUFDbkI7O0FBRUQscUJBQUssSUFBTDtBQUNBLHVCQUFPLE9BQVA7QUFDSCxhQWRELENBY0UsT0FBTyxDQUFQLEVBQVU7QUFDUix1QkFBTyxLQUFQO0FBQ0g7QUFDSjs7O2tDQUVTLE0sRUFBUTtBQUNkLG9CQUFRLEdBQVIsQ0FBWSxjQUFaLEVBQTRCLE1BQTVCO0FBQ0EscUJBQVMsbUJBQVQsQ0FBNkIsa0JBQTdCLEVBQWlELEtBQUssdUJBQXREO0FBQ0EsaUJBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsV0FBeEIsQ0FBb0MsS0FBSyxPQUF6QztBQUNBLGdCQUFJLFlBQVksT0FBTyxRQUFQLEdBQWtCLEVBQWxDO0FBQ0EsaUJBQUssSUFBTCxDQUFVLGdCQUFnQixNQUFoQixDQUF1QixNQUFqQyxFQUF5QyxTQUFTLFNBQWxEO0FBQ0g7Ozs7RUE5R3lCLFk7O0FBQXhCLGUsQ0FFSyxNLEdBQVM7QUFDWixZQUFRO0FBREksQzs7O0FBK0dwQixPQUFPLE9BQVAsR0FBaUIsZUFBakI7Ozs7O0FDekhBLE9BQU8sT0FBUCxHQUFpQjs7QUFFYjtBQUNBLFdBQU8sSUFITTs7QUFLYjtBQUNBLGNBQVUsQ0FORzs7QUFRYjtBQUNBLGVBQVc7QUFDUCxjQUFNLElBREM7QUFFUCxnQkFBUTtBQUZEOztBQVRFLENBQWpCOzs7Ozs7Ozs7SUNBTSxZO0FBRUYsMEJBQVksRUFBWixFQUFnQixFQUFoQixFQUFvQjtBQUFBOztBQUNoQixhQUFLLENBQUwsR0FBUyxLQUFLLEtBQUwsQ0FBVyxLQUFLLE1BQUwsS0FBZ0IsRUFBM0IsQ0FBVDtBQUNBLGFBQUssQ0FBTCxHQUFTLEtBQUssS0FBTCxDQUFXLEtBQUssTUFBTCxLQUFnQixFQUEzQixDQUFUO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLENBQVcsS0FBSyxFQUFoQixDQUFiO0FBQ0EsYUFBSyxNQUFMLEdBQWMsS0FBSyxLQUFMLENBQVcsS0FBSSxFQUFmLENBQWQ7QUFDQSxhQUFLLFFBQUwsR0FBZ0IsS0FBSyx1QkFBTCxFQUFoQjtBQUNIOzs7O2tEQUV5QjtBQUN0QixtQkFBTztBQUNILG1CQUFHLElBQUksS0FBSyxLQUFMLENBQVcsS0FBSyxNQUFMLEtBQWdCLENBQTNCLENBREo7QUFFSCxtQkFBRyxJQUFJLEtBQUssS0FBTCxDQUFXLEtBQUssTUFBTCxLQUFnQixDQUEzQjtBQUZKLGFBQVA7QUFJSDs7OzZCQUVJLEksRUFBTSxJLEVBQU07QUFDYixpQkFBSyxDQUFMLElBQVUsS0FBSyxRQUFMLENBQWMsQ0FBeEI7QUFDQSxpQkFBSyxDQUFMLElBQVUsS0FBSyxRQUFMLENBQWMsQ0FBeEI7QUFDQSxnQkFBSSxLQUFLLENBQUwsR0FBUyxDQUFULElBQWMsS0FBSyxDQUFMLEdBQVMsSUFBM0IsRUFBaUMsS0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixDQUFDLEtBQUssUUFBTCxDQUFjLENBQWpDO0FBQ2pDLGdCQUFJLEtBQUssQ0FBTCxHQUFTLENBQVQsSUFBYyxLQUFLLENBQUwsR0FBUyxJQUEzQixFQUFpQyxLQUFLLFFBQUwsQ0FBYyxDQUFkLEdBQWtCLENBQUMsS0FBSyxRQUFMLENBQWMsQ0FBakM7QUFDcEM7Ozs2QkFFSSxHLEVBQUs7QUFDTixnQkFBSSxTQUFKO0FBQ0EsZ0JBQUksTUFBSixDQUFXLEtBQUssQ0FBaEIsRUFBbUIsS0FBSyxDQUF4QjtBQUNBLGdCQUFJLE1BQUosQ0FBVyxLQUFLLENBQUwsR0FBUyxLQUFLLEtBQXpCLEVBQWdDLEtBQUssQ0FBckM7QUFDQSxnQkFBSSxNQUFKLENBQVcsS0FBSyxDQUFMLEdBQVMsS0FBSyxLQUF6QixFQUFnQyxLQUFLLENBQUwsR0FBUyxLQUFLLE1BQTlDO0FBQ0EsZ0JBQUksTUFBSixDQUFXLEtBQUssQ0FBTCxHQUFTLENBQXBCLEVBQXVCLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFBckM7QUFDQSxnQkFBSSxTQUFKO0FBQ0EsZ0JBQUksSUFBSjtBQUNIOzs7Ozs7QUFHTCxPQUFPLE9BQVAsR0FBaUIsWUFBakI7Ozs7Ozs7OztJQ2pDTSxZO0FBRUYsMEJBQVksRUFBWixFQUFnQixFQUFoQixFQUFvQixFQUFwQixFQUF3QjtBQUFBOztBQUNwQixhQUFLLENBQUwsR0FBUyxPQUFPLEtBQUssTUFBTCxLQUFnQixHQUFoQixHQUFzQixHQUF0QztBQUNBLGFBQUssQ0FBTCxHQUFTLE9BQU8sS0FBSyxNQUFMLEtBQWdCLEdBQWhCLEdBQXNCLEdBQXRDO0FBQ0EsYUFBSyxLQUFMLEdBQWEsSUFBYjtBQUNBLGFBQUssTUFBTCxHQUFjLElBQWQ7QUFDQSxhQUFLLFFBQUwsR0FBZ0IsS0FBSyx1QkFBTCxFQUFoQjs7QUFFQSxhQUFLLFFBQUwsR0FBZ0IsSUFBSSxZQUFKLENBQWlCLENBQzdCLEtBQUssQ0FBTCxHQUFTLEtBQUssS0FEZSxFQUNQLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFEUCxFQUU3QixLQUFLLENBRndCLEVBRXBCLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFGTSxFQUc3QixLQUFLLENBQUwsR0FBUyxLQUFLLEtBSGUsRUFHUixLQUFLLENBSEcsRUFJN0IsS0FBSyxDQUp3QixFQUlyQixLQUFLLENBSmdCLENBQWpCLENBQWhCOztBQU9BLGFBQUssT0FBTCxHQUFlLEdBQUcsWUFBSCxFQUFmOztBQUVBLGFBQUssUUFBTCxHQUFnQixDQUFoQjtBQUNBLGFBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FBYyxNQUFkLEdBQXVCLEtBQUssUUFBNUM7QUFDSDs7OztrREFFeUI7QUFDdEIsbUJBQU87QUFDSCxtQkFBRyxPQUFPLEtBQUssTUFBTCxLQUFnQixDQUFoQixHQUFvQixHQUQzQjtBQUVILG1CQUFHLE9BQU8sS0FBSyxNQUFMLEtBQWdCLENBQWhCLEdBQW9CO0FBRjNCLGFBQVA7QUFJSDs7OytCQUVNO0FBQ0gsaUJBQUssQ0FBTCxJQUFVLEtBQUssUUFBTCxDQUFjLENBQXhCO0FBQ0EsaUJBQUssQ0FBTCxJQUFVLEtBQUssUUFBTCxDQUFjLENBQXhCO0FBQ0EsZ0JBQUksS0FBSyxDQUFMLElBQVUsQ0FBQyxDQUFYLElBQWdCLEtBQUssQ0FBTCxHQUFTLElBQTdCLEVBQW1DLEtBQUssUUFBTCxDQUFjLENBQWQsR0FBa0IsQ0FBQyxLQUFLLFFBQUwsQ0FBYyxDQUFqQztBQUNuQyxnQkFBSSxLQUFLLENBQUwsSUFBVSxDQUFDLENBQVgsSUFBZ0IsS0FBSyxDQUFMLEdBQVMsSUFBN0IsRUFBbUMsS0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixDQUFDLEtBQUssUUFBTCxDQUFjLENBQWpDOztBQUVuQyxpQkFBSyxRQUFMLEdBQWdCLElBQUksWUFBSixDQUFpQixDQUM3QixLQUFLLENBQUwsR0FBUyxLQUFLLEtBRGUsRUFDUCxLQUFLLENBQUwsR0FBUyxLQUFLLE1BRFAsRUFFN0IsS0FBSyxDQUZ3QixFQUVwQixLQUFLLENBQUwsR0FBUyxLQUFLLE1BRk0sRUFHN0IsS0FBSyxDQUFMLEdBQVMsS0FBSyxLQUhlLEVBR1IsS0FBSyxDQUhHLEVBSTdCLEtBQUssQ0FKd0IsRUFJckIsS0FBSyxDQUpnQixDQUFqQixDQUFoQjtBQU9IOzs7NkJBRUksRSxFQUFJLGEsRUFBZTtBQUNwQixlQUFHLFVBQUgsQ0FBYyxHQUFHLFlBQWpCLEVBQStCLEtBQUssT0FBcEM7QUFDQSxlQUFHLFVBQUgsQ0FBYyxHQUFHLFlBQWpCLEVBQStCLEtBQUssUUFBcEMsRUFBOEMsR0FBRyxXQUFqRDtBQUNBLDBCQUFjLGVBQWQsR0FBZ0MsR0FBRyxpQkFBSCxDQUFxQixhQUFyQixFQUFvQyxpQkFBcEMsQ0FBaEM7QUFDQSxlQUFHLHVCQUFILENBQTJCLGNBQWMsZUFBekM7QUFDQSxlQUFHLG1CQUFILENBQXVCLGNBQWMsZUFBckMsRUFBc0QsS0FBSyxRQUEzRCxFQUFxRSxHQUFHLEtBQXhFLEVBQStFLEtBQS9FLEVBQXNGLENBQXRGLEVBQXlGLENBQXpGO0FBQ0EsZUFBRyxVQUFILENBQWMsR0FBRyxjQUFqQixFQUFpQyxDQUFqQyxFQUFvQyxLQUFLLFFBQXpDO0FBQ0g7Ozs7OztBQUdMLE9BQU8sT0FBUCxHQUFpQixZQUFqQjs7Ozs7Ozs7Ozs7OztBQ3hEQSxJQUFNLGVBQWUsUUFBUSxlQUFSLENBQXJCO0FBQ0EsSUFBTSxlQUFlLFFBQVEsOEJBQVIsQ0FBckI7O0lBRU0sVTs7O0FBa0JGLHdCQUFZLE1BQVosRUFBb0IsYUFBcEIsRUFBbUM7QUFBQTs7QUFBQTs7QUFBQSxjQWhCbkMsS0FnQm1DLEdBaEIzQixFQWdCMkI7QUFBQSxjQWZuQyxHQWVtQyxHQWY3QixJQWU2QjtBQUFBLGNBZG5DLE9BY21DLEdBZHpCLENBY3lCO0FBQUEsY0FibkMsUUFhbUMsR0FieEIsQ0Fhd0I7QUFBQSxjQVpuQyxlQVltQyxHQVpqQixDQVlpQjtBQUFBLGNBWG5DLGNBV21DLEdBWGxCLENBV2tCO0FBQUEsY0FUbkMsTUFTbUMsR0FUMUIsSUFTMEI7QUFBQSxjQVJuQyxhQVFtQyxHQVJuQixJQVFtQjtBQUFBLGNBUG5DLGVBT21DLEdBUGpCLENBT2lCO0FBQUEsY0FObkMsUUFNbUMsR0FOeEIsS0FNd0I7QUFBQSxjQUpuQyxRQUltQyxHQUp4QixDQUl3Qjs7O0FBRy9CLGNBQUssTUFBTCxHQUFjLE1BQWQ7O0FBRUEsY0FBSyxHQUFMLEdBQVcsT0FBTyxVQUFQLENBQWtCLG9CQUFsQixDQUFYO0FBQ0EsY0FBSyxHQUFMLENBQVMsYUFBVCxHQUF5QixPQUFPLEtBQWhDO0FBQ0EsY0FBSyxHQUFMLENBQVMsY0FBVCxHQUEwQixPQUFPLE1BQWpDO0FBQ0EsY0FBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixDQUFwQixFQUF1QixDQUF2QixFQUEwQixDQUExQixFQUE2QixDQUE3QjtBQUNBLGNBQUssR0FBTCxDQUFTLEtBQVQsQ0FBZSxNQUFLLEdBQUwsQ0FBUyxnQkFBeEI7O0FBRUEsWUFBSSxJQUFJLFNBQVMsY0FBVCxDQUF3QixRQUF4QixFQUFrQyxVQUFsQyxDQUE2QyxTQUFyRDtBQUNBLFlBQUksSUFBSSxTQUFTLGNBQVQsQ0FBd0IsVUFBeEIsRUFBb0MsVUFBcEMsQ0FBK0MsU0FBdkQ7O0FBRUEsWUFBSSxLQUFLLE1BQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsTUFBSyxHQUFMLENBQVMsYUFBL0IsQ0FBVDtBQUNBLGNBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsRUFBdEIsRUFBMEIsQ0FBMUI7QUFDQSxjQUFLLEdBQUwsQ0FBUyxhQUFULENBQXVCLEVBQXZCOztBQUVBLFlBQUksS0FBSyxNQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLE1BQUssR0FBTCxDQUFTLGVBQS9CLENBQVQ7QUFDQSxjQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLEVBQXRCLEVBQTBCLENBQTFCO0FBQ0EsY0FBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixFQUF2Qjs7QUFFQSxjQUFLLGFBQUwsR0FBcUIsTUFBSyxHQUFMLENBQVMsYUFBVCxFQUFyQjtBQUNBLGNBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsTUFBSyxhQUEzQixFQUEwQyxFQUExQztBQUNBLGNBQUssR0FBTCxDQUFTLFlBQVQsQ0FBc0IsTUFBSyxhQUEzQixFQUEwQyxFQUExQztBQUNBLGNBQUssR0FBTCxDQUFTLFdBQVQsQ0FBcUIsTUFBSyxhQUExQjs7QUFFQSxZQUFJLENBQUMsTUFBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsRUFBNUIsRUFBZ0MsTUFBSyxHQUFMLENBQVMsY0FBekMsQ0FBTCxFQUErRCxRQUFRLEdBQVIsQ0FBWSxNQUFLLEdBQUwsQ0FBUyxnQkFBVCxDQUEwQixFQUExQixDQUFaO0FBQy9ELFlBQUksQ0FBQyxNQUFLLEdBQUwsQ0FBUyxrQkFBVCxDQUE0QixFQUE1QixFQUFnQyxNQUFLLEdBQUwsQ0FBUyxjQUF6QyxDQUFMLEVBQStELFFBQVEsR0FBUixDQUFZLE1BQUssR0FBTCxDQUFTLGdCQUFULENBQTBCLEVBQTFCLENBQVo7QUFDL0QsWUFBSSxDQUFDLE1BQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLE1BQUssYUFBbEMsRUFBaUQsTUFBSyxHQUFMLENBQVMsV0FBMUQsQ0FBTCxFQUE2RSxRQUFRLEdBQVIsQ0FBWSxNQUFLLEdBQUwsQ0FBUyxpQkFBVCxDQUEyQixNQUFLLGFBQWhDLENBQVo7O0FBRTdFLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxhQUFwQixFQUFtQyxHQUFuQyxFQUF3QztBQUNwQyxrQkFBSyxLQUFMLENBQVcsSUFBWCxDQUFnQixJQUFJLFlBQUosQ0FBaUIsT0FBTyxLQUF4QixFQUErQixPQUFPLE1BQXRDLEVBQThDLE1BQUssR0FBbkQsQ0FBaEI7QUFDSDs7QUFFRCxjQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLE1BQUssYUFBekI7O0FBRUEsY0FBSyxhQUFMLENBQW1CLE1BQW5CLEdBQTRCLE1BQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLE1BQUssYUFBakMsRUFBZ0QsUUFBaEQsQ0FBNUI7QUFDQSxjQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLE1BQUssYUFBTCxDQUFtQixNQUF2QyxFQUErQyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixDQUEvQztBQXRDK0I7QUF1Q2xDOzs7OzRCQUVHLE8sRUFBUztBQUFBOztBQUNULG9CQUFRLEdBQVIsQ0FBWSxVQUFaOztBQUVBLGlCQUFLLGVBQUwsR0FBdUIsQ0FBdkI7QUFDQSxpQkFBSyxjQUFMLEdBQXNCLEtBQUssR0FBTCxFQUF0QjtBQUNBLGlCQUFLLFFBQUwsR0FBZ0IsT0FBaEI7QUFDQSxtQkFBTyxxQkFBUCxDQUE2QixZQUFNO0FBQUUsdUJBQUssT0FBTDtBQUFnQixhQUFyRDtBQUNIOzs7aUNBRVE7QUFDTCxpQkFBSyxHQUFMLENBQVMsUUFBVCxDQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUF3QixLQUFLLEdBQUwsQ0FBUyxhQUFqQyxFQUFnRCxLQUFLLEdBQUwsQ0FBUyxjQUF6RDtBQUNBLGlCQUFLLEdBQUwsQ0FBUyxLQUFULENBQWUsS0FBSyxHQUFMLENBQVMsZ0JBQVQsR0FBNEIsS0FBSyxHQUFMLENBQVMsZ0JBQXBEO0FBQ0g7OztrQ0FFUztBQUFBOztBQUNOLGdCQUFHLEtBQUssUUFBUixFQUFrQjs7QUFFbEIsaUJBQUssTUFBTDtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLFVBQUMsR0FBRCxFQUFTO0FBQ3hCLG9CQUFJLElBQUosQ0FBUyxPQUFLLE1BQUwsQ0FBWSxLQUFyQixFQUE0QixPQUFLLE1BQUwsQ0FBWSxNQUF4QztBQUNBLG9CQUFJLElBQUosQ0FBUyxPQUFLLEdBQWQsRUFBbUIsT0FBSyxhQUF4QjtBQUNILGFBSEQ7QUFJQSxpQkFBSyxPQUFMOztBQUdBLGdCQUFJLFVBQVUsS0FBSyxHQUFMLEVBQWQ7QUFDQSxpQkFBSyxlQUFMLEdBQXVCLFVBQVUsS0FBSyxjQUF0QztBQUNBLGlCQUFLLGNBQUwsR0FBc0IsT0FBdEI7QUFDQSxpQkFBSyxlQUFMLElBQXdCLEtBQUssZUFBN0I7O0FBRUEsZ0JBQUksS0FBSyxlQUFMLEdBQXVCLEtBQUssUUFBTCxHQUFnQixJQUEzQyxFQUFpRCxPQUFPLHFCQUFQLENBQTZCLFlBQU07QUFBRSx1QkFBSyxPQUFMO0FBQWdCLGFBQXJELEVBQWpELEtBQ0ssS0FBSyxTQUFMO0FBQ1I7OztvQ0FFVztBQUNSLG9CQUFRLEdBQVIsQ0FBWSxnQkFBWjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxjQUFWLEVBQTBCLEtBQUssT0FBL0I7QUFDSDs7OztFQWhHb0IsWTs7QUFtR3pCLE9BQU8sT0FBUCxHQUFpQixVQUFqQjs7Ozs7Ozs7Ozs7OztBQ3RHQSxJQUFNLGVBQWUsUUFBUSxlQUFSLENBQXJCO0FBQ0EsSUFBTSxlQUFlLFFBQVEsOEJBQVIsQ0FBckI7O0lBRU0sUTs7O0FBVUYsc0JBQVksTUFBWixFQUFvQixhQUFwQixFQUFtQztBQUFBOztBQUFBOztBQUFBLGNBUm5DLEtBUW1DLEdBUjNCLEVBUTJCO0FBQUEsY0FQbkMsUUFPbUMsR0FQeEIsSUFPd0I7QUFBQSxjQUxuQyxNQUttQyxHQUwxQixJQUswQjtBQUFBLGNBSG5DLE9BR21DLEdBSHpCLENBR3lCO0FBQUEsY0FGbkMsUUFFbUMsR0FGeEIsQ0FFd0I7O0FBRS9CLGNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksYUFBcEIsRUFBbUMsR0FBbkM7QUFBd0Msa0JBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBSSxZQUFKLENBQWlCLE9BQU8sS0FBeEIsRUFBK0IsT0FBTyxNQUF0QyxDQUFoQjtBQUF4QyxTQUNBLE1BQUssUUFBTCxHQUFnQixPQUFPLFVBQVAsQ0FBa0IsSUFBbEIsQ0FBaEI7QUFDQSxjQUFLLFFBQUwsQ0FBYyxTQUFkLEdBQTBCLHdCQUExQjtBQUwrQjtBQU1sQzs7Ozs0QkFFRyxPLEVBQVM7QUFBQTs7QUFDVCxvQkFBUSxHQUFSLENBQVksVUFBWjtBQUNBLGlCQUFLLEtBQUwsR0FBYSxLQUFLLEdBQUwsRUFBYjtBQUNBLGlCQUFLLFFBQUwsR0FBZ0IsT0FBaEI7QUFDQSxtQkFBTyxxQkFBUCxDQUE2QixZQUFNO0FBQUUsdUJBQUssT0FBTDtBQUFnQixhQUFyRDtBQUNIOzs7aUNBRVE7QUFDTCxpQkFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixDQUF4QixFQUEyQixDQUEzQixFQUE4QixLQUFLLE1BQUwsQ0FBWSxLQUExQyxFQUFpRCxLQUFLLE1BQUwsQ0FBWSxNQUE3RDtBQUNIOzs7a0NBRVM7QUFBQTs7QUFDTixpQkFBSyxNQUFMO0FBQ0EsaUJBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsVUFBQyxHQUFELEVBQVM7QUFDeEIsb0JBQUksSUFBSixDQUFTLE9BQUssTUFBTCxDQUFZLEtBQXJCLEVBQTRCLE9BQUssTUFBTCxDQUFZLE1BQXhDO0FBQ0Esb0JBQUksSUFBSixDQUFTLE9BQUssUUFBZDtBQUNILGFBSEQ7QUFJQSxpQkFBSyxPQUFMO0FBQ0EsZ0JBQUksS0FBSyxHQUFMLEtBQWEsS0FBSyxLQUFsQixHQUEwQixLQUFLLFFBQUwsR0FBZ0IsSUFBOUMsRUFBb0QsT0FBTyxxQkFBUCxDQUE2QixZQUFNO0FBQUUsdUJBQUssT0FBTDtBQUFnQixhQUFyRCxFQUFwRCxLQUNLLEtBQUssU0FBTDtBQUNSOzs7b0NBRVc7QUFDUixvQkFBUSxHQUFSLENBQVksZ0JBQVo7QUFDQSxpQkFBSyxJQUFMLENBQVUsY0FBVixFQUEwQixLQUFLLE9BQS9CO0FBQ0g7Ozs7RUEzQ2tCLFk7O0FBOEN2QixPQUFPLE9BQVAsR0FBaUIsUUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ3aW5kb3cuQ2FudmFzQmVuY2htYXJrID0gcmVxdWlyZSgnLi9zcmMvQ2FudmFzQmVuY2htYXJrJyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHByZWZpeCA9ICd+JztcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzdG9yYWdlIGZvciBvdXIgYEVFYCBvYmplY3RzLlxuICogQW4gYEV2ZW50c2AgaW5zdGFuY2UgaXMgYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRXZlbnRzKCkge31cblxuLy9cbi8vIFdlIHRyeSB0byBub3QgaW5oZXJpdCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC4gSW4gc29tZSBlbmdpbmVzIGNyZWF0aW5nIGFuXG4vLyBpbnN0YW5jZSBpbiB0aGlzIHdheSBpcyBmYXN0ZXIgdGhhbiBjYWxsaW5nIGBPYmplY3QuY3JlYXRlKG51bGwpYCBkaXJlY3RseS5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBjaGFyYWN0ZXIgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Rcbi8vIG92ZXJyaWRkZW4gb3IgdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy9cbmlmIChPYmplY3QuY3JlYXRlKSB7XG4gIEV2ZW50cy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIC8vXG4gIC8vIFRoaXMgaGFjayBpcyBuZWVkZWQgYmVjYXVzZSB0aGUgYF9fcHJvdG9fX2AgcHJvcGVydHkgaXMgc3RpbGwgaW5oZXJpdGVkIGluXG4gIC8vIHNvbWUgb2xkIGJyb3dzZXJzIGxpa2UgQW5kcm9pZCA0LCBpUGhvbmUgNS4xLCBPcGVyYSAxMSBhbmQgU2FmYXJpIDUuXG4gIC8vXG4gIGlmICghbmV3IEV2ZW50cygpLl9fcHJvdG9fXykgcHJlZml4ID0gZmFsc2U7XG59XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgZXZlbnQgbGlzdGVuZXIuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgbmFtZXMgPSBbXVxuICAgICwgZXZlbnRzXG4gICAgLCBuYW1lO1xuXG4gIGlmICh0aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzKSkge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBPbmx5IGNoZWNrIGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgNDogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMiwgYTMpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBvbmUtdGltZSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgb2YgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IG1hdGNoIHRoaXMgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuICBpZiAoIWZuKSB7XG4gICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKFxuICAgICAgICAgbGlzdGVuZXJzLmZuID09PSBmblxuICAgICAgJiYgKCFvbmNlIHx8IGxpc3RlbmVycy5vbmNlKVxuICAgICAgJiYgKCFjb250ZXh0IHx8IGxpc3RlbmVycy5jb250ZXh0ID09PSBjb250ZXh0KVxuICAgICkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnRzID0gW10sIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgICAvL1xuICAgIGlmIChldmVudHMubGVuZ3RoKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gICAgZWxzZSBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gW2V2ZW50XSBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIHZhciBldnQ7XG5cbiAgaWYgKGV2ZW50KSB7XG4gICAgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcbiAgICBpZiAodGhpcy5fZXZlbnRzW2V2dF0pIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gQWxsb3cgYEV2ZW50RW1pdHRlcmAgdG8gYmUgaW1wb3J0ZWQgYXMgbW9kdWxlIG5hbWVzcGFjZS5cbi8vXG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy9Db25maWcnKTtcclxuY29uc3QgVHdvRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL1R3b0RUZXN0Jyk7XHJcbmNvbnN0IFRocmVlRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL1RocmVlRFRlc3QnKTtcclxuXHJcbi8qKlxyXG4gKiBtYWluXHJcbiAqL1xyXG5jbGFzcyBDYW52YXNCZW5jaG1hcmsgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIHN0YXRpYyBFVkVOVFMgPSB7XHJcbiAgICAgICAgRklOSVNIOiAnZmluaXNoJ1xyXG4gICAgfTtcclxuXHJcbiAgICBfd2lkdGggPSAwO1xyXG4gICAgX2hlaWdodCA9IDA7XHJcblxyXG4gICAgX3Rlc3QgPSBudWxsO1xyXG5cclxuICAgIF9jYW52YXMgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3dpZHRoID0gTWF0aC5yb3VuZCh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuOTkpO1xyXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IE1hdGgucm91bmQod2luZG93LmlubmVySGVpZ2h0ICogMC45OSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IHRoaXMuX3dpZHRoO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5oZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS56SW5kZXggPSA5OTk5O1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzLnN0eWxlLmxlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS50b3AgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9kZWx0YUZyYW1lVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fbGFzdEZyYW1lVGltZSA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMudG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9pc1dlYkdMU3VwcG9ydGVkKCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiV0VCIEdMIFRFU1RcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3QgPSBuZXcgVGhyZWVEVGVzdCh0aGlzLl9jYW52YXMsIENvbmZpZy5wYXJ0aWNsZXMudGhyZWVEKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCIyRCBURVNUXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0ID0gbmV3IFR3b0RUZXN0KHRoaXMuX2NhbnZhcywgQ29uZmlnLnBhcnRpY2xlcy50d29EKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5fY2FudmFzKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcGFnZVZpc2liaWxpdHlMaXN0ZW5lciA9IHRoaXMuX29uUGFnZVZpc2liaWxpdHkuYmluZCh0aGlzKTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5fcGFnZVZpc2liaWxpdHlMaXN0ZW5lcik7XHJcbiAgICAgICAgaWYoZG9jdW1lbnQuX19pc0hpZGRlbiA9PT0gdHJ1ZSkgdGhpcy5wYXVzZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl90ZXN0Lm9uKCdydW5Db21wbGV0ZWQnLCB0aGlzLl9maW5pc2hlZC5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgdGVzdCgpIHtcclxuICAgICAgICB0aGlzLl90ZXN0LnJ1bihDb25maWcuZHVyYXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHBhdXNlKCkge1xyXG4gICAgICAgIGlmKHRoaXMuaXNQYXVzZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5fdGVzdC5pc1BhdXNlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbygnIyBCZW5jaG1hcmsgaXMgcGF1c2VkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdW1lKCkge1xyXG4gICAgICAgIGlmKCF0aGlzLmlzUGF1c2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLl90ZXN0Ll9sYXN0RnJhbWVUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB0aGlzLl90ZXN0LmlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbygnIyBCZW5jaG1hcmsgaXMgcmVzdW1lZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIF9vblBhZ2VWaXNpYmlsaXR5KGUpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJykge1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKXtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2lzV2ViR0xTdXBwb3J0ZWQoKSB7XHJcbiAgICAgICAgbGV0IGNvbnRleHRPcHRpb25zID0geyBzdGVuY2lsOiB0cnVlLCBmYWlsSWZNYWpvclBlcmZvcm1hbmNlQ2F2ZWF0OiB0cnVlIH07XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0KSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgICAgIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcsIGNvbnRleHRPcHRpb25zKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgY29udGV4dE9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSAhIShnbCAmJiBnbC5nZXRDb250ZXh0QXR0cmlidXRlcygpLnN0ZW5jaWwpO1xyXG4gICAgICAgICAgICBpZiAoZ2wpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsb3NlQ29udGV4dCA9IGdsLmdldEV4dGVuc2lvbignV0VCR0xfbG9zZV9jb250ZXh0Jyk7XHJcbiAgICAgICAgICAgICAgICBpZihsb3NlQ29udGV4dCkgbG9zZUNvbnRleHQubG9zZUNvbnRleHQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2wgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcztcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2ZpbmlzaGVkKGZyYW1lcykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQWNjb21wbGlzaGVkXCIsIGZyYW1lcyk7XHJcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHRoaXMuX3BhZ2VWaXNpYmlsaXR5TGlzdGVuZXIpO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2NhbnZhcyk7XHJcbiAgICAgICAgbGV0IG1heEZyYW1lcyA9IENvbmZpZy5kdXJhdGlvbiAqIDYwO1xyXG4gICAgICAgIHRoaXMuZW1pdChDYW52YXNCZW5jaG1hcmsuRVZFTlRTLkZJTklTSCwgZnJhbWVzIC8gbWF4RnJhbWVzKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNCZW5jaG1hcms7IiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgLy8gdmlzdWFsaXNlIHRlc3RcclxuICAgIGRlYnVnOiB0cnVlLFxyXG5cclxuICAgIC8vIHNlY29uZHMsIDAgZm9yIHVubGltaXRlZCBpLmUuIHRlc3Qgc3RvcCBoYXMgdG8gYmUgY2FsbGVkXHJcbiAgICBkdXJhdGlvbjogNSxcclxuXHJcbiAgICAvLyBudW1iZXIgb2YgcGFydGljbGVzIHRvIGRyYXdcclxuICAgIHBhcnRpY2xlczoge1xyXG4gICAgICAgIHR3b0Q6IDE1MDAsXHJcbiAgICAgICAgdGhyZWVEOiAxMDAwLFxyXG4gICAgfSxcclxuXHJcbn07IiwiY2xhc3MgUmVuZGVyYWJsZTJEIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjVywgY0gpIHtcclxuICAgICAgICB0aGlzLnggPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBjVyk7XHJcbiAgICAgICAgdGhpcy55ID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY0gpO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLnJvdW5kKGNXIC8gNTApO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gTWF0aC5yb3VuZChjSC8gNTApO1xyXG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB0aGlzLl9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogMyAtIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDYpLFxyXG4gICAgICAgICAgICB5OiAzIC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogNilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZShtYXhYLCBtYXhZKSB7XHJcbiAgICAgICAgdGhpcy54ICs9IHRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICB0aGlzLnkgKz0gdGhpcy52ZWxvY2l0eS55O1xyXG4gICAgICAgIGlmICh0aGlzLnggPCAxIHx8IHRoaXMueCA+IG1heFgpIHRoaXMudmVsb2NpdHkueCA9IC10aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgaWYgKHRoaXMueSA8IDEgfHwgdGhpcy55ID4gbWF4WSkgdGhpcy52ZWxvY2l0eS55ID0gLXRoaXMudmVsb2NpdHkueTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGN0eCkge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHgubW92ZVRvKHRoaXMueCwgdGhpcy55KTtcclxuICAgICAgICBjdHgubGluZVRvKHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnggKyB0aGlzLndpZHRoLCB0aGlzLnkgKyB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnggKyAwLCB0aGlzLnkgKyB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyYWJsZTJEOyIsIlxyXG5cclxuY2xhc3MgUmVuZGVyYWJsZTNEIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjVywgY0gsIGdsKSB7XHJcbiAgICAgICAgdGhpcy54ID0gMC45NSAtIE1hdGgucmFuZG9tKCkgKiAxOTUgLyAxMDA7XHJcbiAgICAgICAgdGhpcy55ID0gMC45NSAtIE1hdGgucmFuZG9tKCkgKiAxOTUgLyAxMDA7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IDAuMDU7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSAwLjA1O1xyXG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB0aGlzLl9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCk7XHJcblxyXG4gICAgICAgIHRoaXMudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLngsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55LFxyXG4gICAgICAgICAgICB0aGlzLngsIHRoaXMueVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgICB0aGlzLnZidWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5pdGVtU2l6ZSA9IDI7XHJcbiAgICAgICAgdGhpcy5udW1JdGVtcyA9IHRoaXMudmVydGljZXMubGVuZ3RoIC8gdGhpcy5pdGVtU2l6ZTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2VuZXJhdGVSYW5kb21WZWxvY2l0eSgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiAwLjAzIC0gTWF0aC5yYW5kb20oKSAqIDYgLyAxMDAsXHJcbiAgICAgICAgICAgIHk6IDAuMDMgLSBNYXRoLnJhbmRvbSgpICogNiAvIDEwMFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMueCArPSB0aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgdGhpcy55ICs9IHRoaXMudmVsb2NpdHkueTtcclxuICAgICAgICBpZiAodGhpcy54IDw9IC0xIHx8IHRoaXMueCA+IDAuOTUpIHRoaXMudmVsb2NpdHkueCA9IC10aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgaWYgKHRoaXMueSA8PSAtMSB8fCB0aGlzLnkgPiAwLjk1KSB0aGlzLnZlbG9jaXR5LnkgPSAtdGhpcy52ZWxvY2l0eS55O1xyXG5cclxuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54LCAgdGhpcy55ICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSxcclxuICAgICAgICAgICAgdGhpcy54LCB0aGlzLnlcclxuICAgICAgICBdKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhnbCwgc2hhZGVyUHJvZ3JhbSkge1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZidWZmZXIpO1xyXG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgc2hhZGVyUHJvZ3JhbS5hVmVydGV4UG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcclxuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbik7XHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbiwgdGhpcy5pdGVtU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuICAgICAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCAwLCB0aGlzLm51bUl0ZW1zKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJhYmxlM0Q7IiwiY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBSZW5kZXJhYmxlM0QgPSByZXF1aXJlKCcuLy4uL3JlbmRlcmFibGUvUmVuZGVyYWJsZTNEJyk7XHJcblxyXG5jbGFzcyBUaHJlZURUZXN0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2dsID0gbnVsbDtcclxuICAgIF9mcmFtZXMgPSAwO1xyXG4gICAgX3J1blRpbWUgPSAwO1xyXG4gICAgX2RlbHRhRnJhbWVUaW1lID0gMDtcclxuICAgIF9sYXN0RnJhbWVUaW1lID0gMDtcclxuICAgIFxyXG4gICAgY2FudmFzID0gbnVsbDtcclxuICAgIHNoYWRlclByb2dyYW0gPSBudWxsO1xyXG4gICAgdG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgIGlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgbnVtSXRlbXMgPSAwO1xyXG4gICAgaXRlbVNpemU7XHJcbiAgICB2ZXJ0aWNlcztcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIHBhcnRpY2xlQ291bnQpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuXHJcbiAgICAgICAgdGhpcy5fZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICB2YXIgdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidmVydGV4XCIpLmZpcnN0Q2hpbGQubm9kZVZhbHVlO1xyXG4gICAgICAgIHZhciBmID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcmFnbWVudFwiKS5maXJzdENoaWxkLm5vZGVWYWx1ZTtcclxuXHJcbiAgICAgICAgdmFyIHZzID0gdGhpcy5fZ2wuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLlZFUlRFWF9TSEFERVIpO1xyXG4gICAgICAgIHRoaXMuX2dsLnNoYWRlclNvdXJjZSh2cywgdik7XHJcbiAgICAgICAgdGhpcy5fZ2wuY29tcGlsZVNoYWRlcih2cyk7XHJcblxyXG4gICAgICAgIHZhciBmcyA9IHRoaXMuX2dsLmNyZWF0ZVNoYWRlcih0aGlzLl9nbC5GUkFHTUVOVF9TSEFERVIpO1xyXG4gICAgICAgIHRoaXMuX2dsLnNoYWRlclNvdXJjZShmcywgZik7XHJcbiAgICAgICAgdGhpcy5fZ2wuY29tcGlsZVNoYWRlcihmcyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hhZGVyUHJvZ3JhbSA9IHRoaXMuX2dsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgICAgICB0aGlzLl9nbC5hdHRhY2hTaGFkZXIodGhpcy5zaGFkZXJQcm9ncmFtLCB2cyk7XHJcbiAgICAgICAgdGhpcy5fZ2wuYXR0YWNoU2hhZGVyKHRoaXMuc2hhZGVyUHJvZ3JhbSwgZnMpO1xyXG4gICAgICAgIHRoaXMuX2dsLmxpbmtQcm9ncmFtKHRoaXMuc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHZzLCB0aGlzLl9nbC5DT01QSUxFX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFNoYWRlckluZm9Mb2codnMpKTtcclxuICAgICAgICBpZiAoIXRoaXMuX2dsLmdldFNoYWRlclBhcmFtZXRlcihmcywgdGhpcy5fZ2wuQ09NUElMRV9TVEFUVVMpKSBjb25zb2xlLmxvZyh0aGlzLl9nbC5nZXRTaGFkZXJJbmZvTG9nKGZzKSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuc2hhZGVyUHJvZ3JhbSwgdGhpcy5fZ2wuTElOS19TVEFUVVMpKSBjb25zb2xlLmxvZyh0aGlzLl9nbC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnNoYWRlclByb2dyYW0pKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0aWNsZUNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5fb2Jqcy5wdXNoKG5ldyBSZW5kZXJhYmxlM0QoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0LCB0aGlzLl9nbCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlclByb2dyYW0pO1xyXG5cclxuICAgICAgICB0aGlzLnNoYWRlclByb2dyYW0udUNvbG9yID0gdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyUHJvZ3JhbSwgXCJ1Q29sb3JcIik7XHJcbiAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTRmdih0aGlzLnNoYWRlclByb2dyYW0udUNvbG9yLCBbMC4wLCAwLjAsIDAuMCwgMC4wXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKHJ1blRpbWUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlJVTiBURVNUXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnRvdGFsVGltZUxhcHNlZCA9IDA7XHJcbiAgICAgICAgdGhpcy5fbGFzdEZyYW1lVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdGhpcy5fcnVuVGltZSA9IHJ1blRpbWU7XHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7IHRoaXMuX3JlbmRlcigpO30pO1xyXG4gICAgfVxyXG5cclxuICAgIF9jbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydCgwLCAwLCB0aGlzLl9nbC52aWV3cG9ydFdpZHRoLCB0aGlzLl9nbC52aWV3cG9ydEhlaWdodCk7XHJcbiAgICAgICAgdGhpcy5fZ2wuY2xlYXIodGhpcy5fZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IHRoaXMuX2dsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG4gICAgfVxyXG5cclxuICAgIF9yZW5kZXIoKSB7XHJcbiAgICAgICAgaWYodGhpcy5pc1BhdXNlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX29ianMuZm9yRWFjaCgob2JqKSA9PiB7XHJcbiAgICAgICAgICAgIG9iai5tb3ZlKHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBvYmouZHJhdyh0aGlzLl9nbCwgdGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuXHJcblxyXG4gICAgICAgIGxldCBjdXJUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB0aGlzLl9kZWx0YUZyYW1lVGltZSA9IGN1clRpbWUgLSB0aGlzLl9sYXN0RnJhbWVUaW1lO1xyXG4gICAgICAgIHRoaXMuX2xhc3RGcmFtZVRpbWUgPSBjdXJUaW1lO1xyXG4gICAgICAgIHRoaXMudG90YWxUaW1lTGFwc2VkICs9IHRoaXMuX2RlbHRhRnJhbWVUaW1lO1xyXG5cclxuICAgICAgICBpZiAodGhpcy50b3RhbFRpbWVMYXBzZWQgPCB0aGlzLl9ydW5UaW1lICogMTAwMCkgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7IHRoaXMuX3JlbmRlcigpO30pO1xyXG4gICAgICAgIGVsc2UgdGhpcy5fZmluaXNoZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBfZmluaXNoZWQoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJURVNUIENPTVBMRVRFRFwiKTtcclxuICAgICAgICB0aGlzLmVtaXQoJ3J1bkNvbXBsZXRlZCcsIHRoaXMuX2ZyYW1lcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGhyZWVEVGVzdDsiLCJjb25zdCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XHJcbmNvbnN0IFJlbmRlcmFibGUyRCA9IHJlcXVpcmUoJy4vLi4vcmVuZGVyYWJsZS9SZW5kZXJhYmxlMkQnKTtcclxuXHJcbmNsYXNzIFR3b0RUZXN0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2NvbnRleHQgPSBudWxsO1xyXG5cclxuICAgIGNhbnZhcyA9IG51bGw7O1xyXG5cclxuICAgIF9mcmFtZXMgPSAwO1xyXG4gICAgX3J1blRpbWUgPSAwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNhbnZhcywgcGFydGljbGVDb3VudCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0aWNsZUNvdW50OyBpKyspIHRoaXMuX29ianMucHVzaChuZXcgUmVuZGVyYWJsZTJEKGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCkpO1xyXG4gICAgICAgIHRoaXMuX2NvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gICAgICAgIHRoaXMuX2NvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAuMywgMC4zLCAwLjUpXCI7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKHJ1blRpbWUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlJVTiBURVNUXCIpO1xyXG4gICAgICAgIHRoaXMuc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHRoaXMuX3J1blRpbWUgPSBydW5UaW1lO1xyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4geyB0aGlzLl9yZW5kZXIoKTt9KTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlbmRlcigpIHtcclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX29ianMuZm9yRWFjaCgob2JqKSA9PiB7XHJcbiAgICAgICAgICAgIG9iai5tb3ZlKHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBvYmouZHJhdyh0aGlzLl9jb250ZXh0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnQgPCB0aGlzLl9ydW5UaW1lICogMTAwMCkgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7IHRoaXMuX3JlbmRlcigpO30pO1xyXG4gICAgICAgIGVsc2UgdGhpcy5fZmluaXNoZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBfZmluaXNoZWQoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJURVNUIENPTVBMRVRFRFwiKVxyXG4gICAgICAgIHRoaXMuZW1pdCgncnVuQ29tcGxldGVkJywgdGhpcy5fZnJhbWVzKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUd29EVGVzdDsiXX0=
