(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value2) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value2 }) : obj[key] = value2;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __publicField = (obj, key, value2) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value2);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value2) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value2);
  var __privateSet = (obj, member, value2, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value2) : member.set(obj, value2), value2);

  // node_modules/mediasoup-client/node_modules/ms/index.js
  var require_ms = __commonJS({
    "node_modules/mediasoup-client/node_modules/ms/index.js"(exports, module) {
      var s = 1e3;
      var m = s * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse2(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse2(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/mediasoup-client/node_modules/debug/src/common.js
  var require_common = __commonJS({
    "node_modules/mediasoup-client/node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms();
        createDebug.destroy = destroy;
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          let prevTime;
          let enableOverride = null;
          let namespacesCache;
          let enabledCache;
          function debug(...args) {
            if (!debug.enabled) {
              return;
            }
            const self2 = debug;
            const curr = Number(/* @__PURE__ */ new Date());
            const ms = curr - (prevTime || curr);
            self2.diff = ms;
            self2.prev = prevTime;
            self2.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            let index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
              if (match === "%%") {
                return "%";
              }
              index++;
              const formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                const val = args[index];
                match = formatter.call(self2, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self2, args);
            const logFn = self2.log || createDebug.log;
            logFn.apply(self2, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: () => {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: (v) => {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
          for (const ns of split) {
            if (ns[0] === "-") {
              createDebug.skips.push(ns.slice(1));
            } else {
              createDebug.names.push(ns);
            }
          }
        }
        function matchesTemplate(search, template) {
          let searchIndex = 0;
          let templateIndex = 0;
          let starIndex = -1;
          let matchIndex = 0;
          while (searchIndex < search.length) {
            if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
              if (template[templateIndex] === "*") {
                starIndex = templateIndex;
                matchIndex = searchIndex;
                templateIndex++;
              } else {
                searchIndex++;
                templateIndex++;
              }
            } else if (starIndex !== -1) {
              templateIndex = starIndex + 1;
              matchIndex++;
              searchIndex = matchIndex;
            } else {
              return false;
            }
          }
          while (templateIndex < template.length && template[templateIndex] === "*") {
            templateIndex++;
          }
          return templateIndex === template.length;
        }
        function disable() {
          const namespaces = [
            ...createDebug.names,
            ...createDebug.skips.map((namespace) => "-" + namespace)
          ].join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          for (const skip of createDebug.skips) {
            if (matchesTemplate(name, skip)) {
              return false;
            }
          }
          for (const ns of createDebug.names) {
            if (matchesTemplate(name, ns)) {
              return true;
            }
          }
          return false;
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // node_modules/mediasoup-client/node_modules/debug/src/browser.js
  var require_browser = __commonJS({
    "node_modules/mediasoup-client/node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */ (() => {
        let warned = false;
        return () => {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      })();
      exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33"
      ];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        let m;
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        const c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        let index = 0;
        let lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, (match) => {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || (() => {
      });
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {
        }
      }
      function load() {
        let r;
        try {
          r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
        } catch (error) {
        }
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {
        }
      }
      module.exports = require_common()(exports);
      var { formatters } = module.exports;
      formatters.j = function(v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

  // node_modules/mediasoup-client/lib/types.js
  var require_types = __commonJS({
    "node_modules/mediasoup-client/lib/types.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // node_modules/mediasoup-client/lib/Logger.js
  var require_Logger = __commonJS({
    "node_modules/mediasoup-client/lib/Logger.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Logger = void 0;
      var debug_1 = require_browser();
      var APP_NAME = "mediasoup-client";
      var Logger = class {
        constructor(prefix) {
          __publicField(this, "_debug");
          __publicField(this, "_warn");
          __publicField(this, "_error");
          if (prefix) {
            this._debug = (0, debug_1.default)(`${APP_NAME}:${prefix}`);
            this._warn = (0, debug_1.default)(`${APP_NAME}:WARN:${prefix}`);
            this._error = (0, debug_1.default)(`${APP_NAME}:ERROR:${prefix}`);
          } else {
            this._debug = (0, debug_1.default)(APP_NAME);
            this._warn = (0, debug_1.default)(`${APP_NAME}:WARN`);
            this._error = (0, debug_1.default)(`${APP_NAME}:ERROR`);
          }
          this._debug.log = console.info.bind(console);
          this._warn.log = console.warn.bind(console);
          this._error.log = console.error.bind(console);
        }
        get debug() {
          return this._debug;
        }
        get warn() {
          return this._warn;
        }
        get error() {
          return this._error;
        }
      };
      exports.Logger = Logger;
    }
  });

  // node_modules/events-alias/events.js
  var require_events = __commonJS({
    "node_modules/events-alias/events.js"(exports, module) {
      "use strict";
      var R = typeof Reflect === "object" ? Reflect : null;
      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      var ReflectOwnKeys;
      if (R && typeof R.ownKeys === "function") {
        ReflectOwnKeys = R.ownKeys;
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target);
        };
      }
      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }
      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value2) {
        return value2 !== value2;
      };
      function EventEmitter() {
        EventEmitter.init.call(this);
      }
      module.exports = EventEmitter;
      module.exports.once = once;
      EventEmitter.EventEmitter = EventEmitter;
      EventEmitter.prototype._events = void 0;
      EventEmitter.prototype._eventsCount = 0;
      EventEmitter.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if (typeof listener !== "function") {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }
      Object.defineProperty(EventEmitter, "defaultMaxListeners", {
        enumerable: true,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          }
          defaultMaxListeners = arg;
        }
      });
      EventEmitter.init = function() {
        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        }
        this._maxListeners = this._maxListeners || void 0;
      };
      EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
        if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
        }
        this._maxListeners = n;
        return this;
      };
      function _getMaxListeners(that) {
        if (that._maxListeners === void 0)
          return EventEmitter.defaultMaxListeners;
        return that._maxListeners;
      }
      EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };
      EventEmitter.prototype.emit = function emit(type) {
        var args = [];
        for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
        var doError = type === "error";
        var events = this._events;
        if (events !== void 0)
          doError = doError && events.error === void 0;
        else if (!doError)
          return false;
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            throw er;
          }
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          err.context = er;
          throw err;
        }
        var handler = events[type];
        if (handler === void 0)
          return false;
        if (typeof handler === "function") {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i = 0; i < len; ++i)
            ReflectApply(listeners[i], this, args);
        }
        return true;
      };
      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;
        checkListener(listener);
        events = target._events;
        if (events === void 0) {
          events = target._events = /* @__PURE__ */ Object.create(null);
          target._eventsCount = 0;
        } else {
          if (events.newListener !== void 0) {
            target.emit(
              "newListener",
              type,
              listener.listener ? listener.listener : listener
            );
            events = target._events;
          }
          existing = events[type];
        }
        if (existing === void 0) {
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === "function") {
            existing = events[type] = prepend ? [listener, existing] : [existing, listener];
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            w.name = "MaxListenersExceededWarning";
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
          }
        }
        return target;
      }
      EventEmitter.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };
      EventEmitter.prototype.on = EventEmitter.prototype.addListener;
      EventEmitter.prototype.prependListener = function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }
      function _onceWrap(target, type, listener) {
        var state = { fired: false, wrapFn: void 0, target, type, listener };
        var wrapped = onceWrapper.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped;
      }
      EventEmitter.prototype.once = function once2(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter.prototype.removeListener = function removeListener(type, listener) {
        var list, events, position, i, originalListener;
        checkListener(listener);
        events = this._events;
        if (events === void 0)
          return this;
        list = events[type];
        if (list === void 0)
          return this;
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit("removeListener", type, list.listener || listener);
          }
        } else if (typeof list !== "function") {
          position = -1;
          for (i = list.length - 1; i >= 0; i--) {
            if (list[i] === listener || list[i].listener === listener) {
              originalListener = list[i].listener;
              position = i;
              break;
            }
          }
          if (position < 0)
            return this;
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
          if (list.length === 1)
            events[type] = list[0];
          if (events.removeListener !== void 0)
            this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      };
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
      EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
        var listeners, events, i;
        events = this._events;
        if (events === void 0)
          return this;
        if (events.removeListener === void 0) {
          if (arguments.length === 0) {
            this._events = /* @__PURE__ */ Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== void 0) {
            if (--this._eventsCount === 0)
              this._events = /* @__PURE__ */ Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i = 0; i < keys.length; ++i) {
            key = keys[i];
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
          return this;
        }
        listeners = events[type];
        if (typeof listeners === "function") {
          this.removeListener(type, listeners);
        } else if (listeners !== void 0) {
          for (i = listeners.length - 1; i >= 0; i--) {
            this.removeListener(type, listeners[i]);
          }
        }
        return this;
      };
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (events === void 0)
          return [];
        var evlistener = events[type];
        if (evlistener === void 0)
          return [];
        if (typeof evlistener === "function")
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      EventEmitter.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };
      EventEmitter.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };
      EventEmitter.listenerCount = function(emitter, type) {
        if (typeof emitter.listenerCount === "function") {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };
      EventEmitter.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;
        if (events !== void 0) {
          var evlistener = events[type];
          if (typeof evlistener === "function") {
            return 1;
          } else if (evlistener !== void 0) {
            return evlistener.length;
          }
        }
        return 0;
      }
      EventEmitter.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
      function arrayClone(arr, n) {
        var copy = new Array(n);
        for (var i = 0; i < n; ++i)
          copy[i] = arr[i];
        return copy;
      }
      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }
      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i = 0; i < ret.length; ++i) {
          ret[i] = arr[i].listener || arr[i];
        }
        return ret;
      }
      function once(emitter, name) {
        return new Promise(function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
          }
          function resolver() {
            if (typeof emitter.removeListener === "function") {
              emitter.removeListener("error", errorListener);
            }
            resolve([].slice.call(arguments));
          }
          ;
          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
          if (name !== "error") {
            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
          }
        });
      }
      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
        if (typeof emitter.on === "function") {
          eventTargetAgnosticAddListener(emitter, "error", handler, flags);
        }
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if (typeof emitter.on === "function") {
          if (flags.once) {
            emitter.once(name, listener);
          } else {
            emitter.on(name, listener);
          }
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(name, function wrapListener(arg) {
            if (flags.once) {
              emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
          });
        } else {
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
        }
      }
    }
  });

  // node_modules/mediasoup-client/lib/enhancedEvents.js
  var require_enhancedEvents = __commonJS({
    "node_modules/mediasoup-client/lib/enhancedEvents.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.EnhancedEventEmitter = void 0;
      var events_alias_1 = require_events();
      var Logger_1 = require_Logger();
      var enhancedEventEmitterLogger = new Logger_1.Logger("EnhancedEventEmitter");
      var EnhancedEventEmitter = class extends events_alias_1.EventEmitter {
        constructor() {
          super();
          this.setMaxListeners(Infinity);
        }
        /**
         * Empties all stored event listeners.
         */
        close() {
          super.removeAllListeners();
        }
        emit(eventName, ...args) {
          return super.emit(eventName, ...args);
        }
        /**
         * Special addition to the EventEmitter API.
         */
        safeEmit(eventName, ...args) {
          try {
            return super.emit(eventName, ...args);
          } catch (error) {
            enhancedEventEmitterLogger.error("safeEmit() | event listener threw an error [eventName:%s]:%o", eventName, error);
            try {
              super.emit("listenererror", eventName, error);
            } catch (error2) {
            }
            return Boolean(super.listenerCount(eventName));
          }
        }
        on(eventName, listener) {
          super.on(eventName, listener);
          return this;
        }
        off(eventName, listener) {
          super.off(eventName, listener);
          return this;
        }
        addListener(eventName, listener) {
          super.on(eventName, listener);
          return this;
        }
        prependListener(eventName, listener) {
          super.prependListener(eventName, listener);
          return this;
        }
        once(eventName, listener) {
          super.once(eventName, listener);
          return this;
        }
        prependOnceListener(eventName, listener) {
          super.prependOnceListener(eventName, listener);
          return this;
        }
        removeListener(eventName, listener) {
          super.off(eventName, listener);
          return this;
        }
        removeAllListeners(eventName) {
          super.removeAllListeners(eventName);
          return this;
        }
        listenerCount(eventName) {
          return super.listenerCount(eventName);
        }
        listeners(eventName) {
          return super.listeners(eventName);
        }
        rawListeners(eventName) {
          return super.rawListeners(eventName);
        }
      };
      exports.EnhancedEventEmitter = EnhancedEventEmitter;
    }
  });

  // node_modules/mediasoup-client/lib/errors.js
  var require_errors = __commonJS({
    "node_modules/mediasoup-client/lib/errors.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.InvalidStateError = exports.UnsupportedError = void 0;
      var UnsupportedError = class _UnsupportedError extends Error {
        constructor(message) {
          super(message);
          this.name = "UnsupportedError";
          if (Error.hasOwnProperty("captureStackTrace")) {
            Error.captureStackTrace(this, _UnsupportedError);
          } else {
            this.stack = new Error(message).stack;
          }
        }
      };
      exports.UnsupportedError = UnsupportedError;
      var InvalidStateError = class _InvalidStateError extends Error {
        constructor(message) {
          super(message);
          this.name = "InvalidStateError";
          if (Error.hasOwnProperty("captureStackTrace")) {
            Error.captureStackTrace(this, _InvalidStateError);
          } else {
            this.stack = new Error(message).stack;
          }
        }
      };
      exports.InvalidStateError = InvalidStateError;
    }
  });

  // node_modules/mediasoup-client/lib/utils.js
  var require_utils = __commonJS({
    "node_modules/mediasoup-client/lib/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.clone = clone;
      exports.generateRandomNumber = generateRandomNumber;
      exports.deepFreeze = deepFreeze;
      function clone(value2) {
        if (value2 === void 0) {
          return void 0;
        } else if (Number.isNaN(value2)) {
          return NaN;
        } else if (typeof structuredClone === "function") {
          return structuredClone(value2);
        } else {
          return JSON.parse(JSON.stringify(value2));
        }
      }
      function generateRandomNumber() {
        return Math.round(Math.random() * 1e7);
      }
      function deepFreeze(data) {
        const propNames = Reflect.ownKeys(data);
        for (const name of propNames) {
          const value2 = data[name];
          if (value2 && typeof value2 === "object" || typeof value2 === "function") {
            deepFreeze(value2);
          }
        }
        return Object.freeze(data);
      }
    }
  });

  // node_modules/h264-profile-level-id/node_modules/ms/index.js
  var require_ms2 = __commonJS({
    "node_modules/h264-profile-level-id/node_modules/ms/index.js"(exports, module) {
      var s = 1e3;
      var m = s * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse2(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse2(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/h264-profile-level-id/node_modules/debug/src/common.js
  var require_common2 = __commonJS({
    "node_modules/h264-profile-level-id/node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms2();
        createDebug.destroy = destroy;
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          let prevTime;
          let enableOverride = null;
          let namespacesCache;
          let enabledCache;
          function debug(...args) {
            if (!debug.enabled) {
              return;
            }
            const self2 = debug;
            const curr = Number(/* @__PURE__ */ new Date());
            const ms = curr - (prevTime || curr);
            self2.diff = ms;
            self2.prev = prevTime;
            self2.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            let index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
              if (match === "%%") {
                return "%";
              }
              index++;
              const formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                const val = args[index];
                match = formatter.call(self2, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self2, args);
            const logFn = self2.log || createDebug.log;
            logFn.apply(self2, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: () => {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: (v) => {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
          for (const ns of split) {
            if (ns[0] === "-") {
              createDebug.skips.push(ns.slice(1));
            } else {
              createDebug.names.push(ns);
            }
          }
        }
        function matchesTemplate(search, template) {
          let searchIndex = 0;
          let templateIndex = 0;
          let starIndex = -1;
          let matchIndex = 0;
          while (searchIndex < search.length) {
            if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
              if (template[templateIndex] === "*") {
                starIndex = templateIndex;
                matchIndex = searchIndex;
                templateIndex++;
              } else {
                searchIndex++;
                templateIndex++;
              }
            } else if (starIndex !== -1) {
              templateIndex = starIndex + 1;
              matchIndex++;
              searchIndex = matchIndex;
            } else {
              return false;
            }
          }
          while (templateIndex < template.length && template[templateIndex] === "*") {
            templateIndex++;
          }
          return templateIndex === template.length;
        }
        function disable() {
          const namespaces = [
            ...createDebug.names,
            ...createDebug.skips.map((namespace) => "-" + namespace)
          ].join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          for (const skip of createDebug.skips) {
            if (matchesTemplate(name, skip)) {
              return false;
            }
          }
          for (const ns of createDebug.names) {
            if (matchesTemplate(name, ns)) {
              return true;
            }
          }
          return false;
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // node_modules/h264-profile-level-id/node_modules/debug/src/browser.js
  var require_browser2 = __commonJS({
    "node_modules/h264-profile-level-id/node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */ (() => {
        let warned = false;
        return () => {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      })();
      exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33"
      ];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        let m;
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        const c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        let index = 0;
        let lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, (match) => {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || (() => {
      });
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {
        }
      }
      function load() {
        let r;
        try {
          r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
        } catch (error) {
        }
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {
        }
      }
      module.exports = require_common2()(exports);
      var { formatters } = module.exports;
      formatters.j = function(v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

  // node_modules/h264-profile-level-id/lib/Logger.js
  var require_Logger2 = __commonJS({
    "node_modules/h264-profile-level-id/lib/Logger.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Logger = void 0;
      var debug_1 = require_browser2();
      var APP_NAME = "h264-profile-level-id";
      var Logger = class {
        constructor(prefix) {
          __publicField(this, "_debug");
          __publicField(this, "_warn");
          __publicField(this, "_error");
          if (prefix) {
            this._debug = (0, debug_1.default)(`${APP_NAME}:${prefix}`);
            this._warn = (0, debug_1.default)(`${APP_NAME}:WARN:${prefix}`);
            this._error = (0, debug_1.default)(`${APP_NAME}:ERROR:${prefix}`);
          } else {
            this._debug = (0, debug_1.default)(APP_NAME);
            this._warn = (0, debug_1.default)(`${APP_NAME}:WARN`);
            this._error = (0, debug_1.default)(`${APP_NAME}:ERROR`);
          }
          this._debug.log = console.info.bind(console);
          this._warn.log = console.warn.bind(console);
          this._error.log = console.error.bind(console);
        }
        get debug() {
          return this._debug;
        }
        get warn() {
          return this._warn;
        }
        get error() {
          return this._error;
        }
      };
      exports.Logger = Logger;
    }
  });

  // node_modules/h264-profile-level-id/lib/index.js
  var require_lib = __commonJS({
    "node_modules/h264-profile-level-id/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ProfileLevelId = exports.Level = exports.Profile = void 0;
      exports.parseProfileLevelId = parseProfileLevelId;
      exports.profileLevelIdToString = profileLevelIdToString;
      exports.profileToString = profileToString;
      exports.levelToString = levelToString;
      exports.parseSdpProfileLevelId = parseSdpProfileLevelId;
      exports.isSameProfile = isSameProfile;
      exports.isSameProfileAndLevel = isSameProfileAndLevel;
      exports.generateProfileLevelIdStringForAnswer = generateProfileLevelIdStringForAnswer;
      exports.supportedLevel = supportedLevel;
      var Logger_1 = require_Logger2();
      var logger = new Logger_1.Logger();
      var Profile;
      (function(Profile2) {
        Profile2[Profile2["ConstrainedBaseline"] = 1] = "ConstrainedBaseline";
        Profile2[Profile2["Baseline"] = 2] = "Baseline";
        Profile2[Profile2["Main"] = 3] = "Main";
        Profile2[Profile2["ConstrainedHigh"] = 4] = "ConstrainedHigh";
        Profile2[Profile2["High"] = 5] = "High";
        Profile2[Profile2["PredictiveHigh444"] = 6] = "PredictiveHigh444";
      })(Profile || (exports.Profile = Profile = {}));
      var Level;
      (function(Level2) {
        Level2[Level2["L1_b"] = 0] = "L1_b";
        Level2[Level2["L1"] = 10] = "L1";
        Level2[Level2["L1_1"] = 11] = "L1_1";
        Level2[Level2["L1_2"] = 12] = "L1_2";
        Level2[Level2["L1_3"] = 13] = "L1_3";
        Level2[Level2["L2"] = 20] = "L2";
        Level2[Level2["L2_1"] = 21] = "L2_1";
        Level2[Level2["L2_2"] = 22] = "L2_2";
        Level2[Level2["L3"] = 30] = "L3";
        Level2[Level2["L3_1"] = 31] = "L3_1";
        Level2[Level2["L3_2"] = 32] = "L3_2";
        Level2[Level2["L4"] = 40] = "L4";
        Level2[Level2["L4_1"] = 41] = "L4_1";
        Level2[Level2["L4_2"] = 42] = "L4_2";
        Level2[Level2["L5"] = 50] = "L5";
        Level2[Level2["L5_1"] = 51] = "L5_1";
        Level2[Level2["L5_2"] = 52] = "L5_2";
      })(Level || (exports.Level = Level = {}));
      var ProfileLevelId = class {
        constructor(profile, level) {
          __publicField(this, "profile");
          __publicField(this, "level");
          this.profile = profile;
          this.level = level;
        }
      };
      exports.ProfileLevelId = ProfileLevelId;
      var DefaultProfileLevelId = new ProfileLevelId(Profile.ConstrainedBaseline, Level.L3_1);
      var BitPattern = class {
        constructor(str) {
          __publicField(this, "mask");
          __publicField(this, "masked_value");
          this.mask = ~byteMaskString("x", str);
          this.masked_value = byteMaskString("1", str);
        }
        isMatch(value2) {
          return this.masked_value === (value2 & this.mask);
        }
      };
      var ProfilePattern = class {
        constructor(profile_idc, profile_iop, profile) {
          __publicField(this, "profile_idc");
          __publicField(this, "profile_iop");
          __publicField(this, "profile");
          this.profile_idc = profile_idc;
          this.profile_iop = profile_iop;
          this.profile = profile;
        }
      };
      var ProfilePatterns = [
        new ProfilePattern(66, new BitPattern("x1xx0000"), Profile.ConstrainedBaseline),
        new ProfilePattern(77, new BitPattern("1xxx0000"), Profile.ConstrainedBaseline),
        new ProfilePattern(88, new BitPattern("11xx0000"), Profile.ConstrainedBaseline),
        new ProfilePattern(66, new BitPattern("x0xx0000"), Profile.Baseline),
        new ProfilePattern(88, new BitPattern("10xx0000"), Profile.Baseline),
        new ProfilePattern(77, new BitPattern("0x0x0000"), Profile.Main),
        new ProfilePattern(100, new BitPattern("00000000"), Profile.High),
        new ProfilePattern(100, new BitPattern("00001100"), Profile.ConstrainedHigh),
        new ProfilePattern(244, new BitPattern("00000000"), Profile.PredictiveHigh444)
      ];
      var LevelConstraints = [
        {
          max_macroblocks_per_second: 1485,
          max_macroblock_frame_size: 99,
          level: Level.L1
        },
        {
          max_macroblocks_per_second: 1485,
          max_macroblock_frame_size: 99,
          level: Level.L1_b
        },
        {
          max_macroblocks_per_second: 3e3,
          max_macroblock_frame_size: 396,
          level: Level.L1_1
        },
        {
          max_macroblocks_per_second: 6e3,
          max_macroblock_frame_size: 396,
          level: Level.L1_2
        },
        {
          max_macroblocks_per_second: 11880,
          max_macroblock_frame_size: 396,
          level: Level.L1_3
        },
        {
          max_macroblocks_per_second: 11880,
          max_macroblock_frame_size: 396,
          level: Level.L2
        },
        {
          max_macroblocks_per_second: 19800,
          max_macroblock_frame_size: 792,
          level: Level.L2_1
        },
        {
          max_macroblocks_per_second: 20250,
          max_macroblock_frame_size: 1620,
          level: Level.L2_2
        },
        {
          max_macroblocks_per_second: 40500,
          max_macroblock_frame_size: 1620,
          level: Level.L3
        },
        {
          max_macroblocks_per_second: 108e3,
          max_macroblock_frame_size: 3600,
          level: Level.L3_1
        },
        {
          max_macroblocks_per_second: 216e3,
          max_macroblock_frame_size: 5120,
          level: Level.L3_2
        },
        {
          max_macroblocks_per_second: 245760,
          max_macroblock_frame_size: 8192,
          level: Level.L4
        },
        {
          max_macroblocks_per_second: 245760,
          max_macroblock_frame_size: 8192,
          level: Level.L4_1
        },
        {
          max_macroblocks_per_second: 522240,
          max_macroblock_frame_size: 8704,
          level: Level.L4_2
        },
        {
          max_macroblocks_per_second: 589824,
          max_macroblock_frame_size: 22080,
          level: Level.L5
        },
        {
          max_macroblocks_per_second: 983040,
          max_macroblock_frame_size: 36864,
          level: Level.L5_1
        },
        {
          max_macroblocks_per_second: 2073600,
          max_macroblock_frame_size: 36864,
          level: Level.L5_2
        }
      ];
      function parseProfileLevelId(str) {
        const ConstraintSet3Flag = 16;
        if (typeof str !== "string" || str.length !== 6) {
          return void 0;
        }
        const profile_level_id_numeric = parseInt(str, 16);
        if (profile_level_id_numeric === 0) {
          return void 0;
        }
        const level_idc = profile_level_id_numeric & 255;
        const profile_iop = profile_level_id_numeric >> 8 & 255;
        const profile_idc = profile_level_id_numeric >> 16 & 255;
        let level;
        switch (level_idc) {
          case Level.L1_1: {
            level = (profile_iop & ConstraintSet3Flag) !== 0 ? Level.L1_b : Level.L1_1;
            break;
          }
          case Level.L1:
          case Level.L1_2:
          case Level.L1_3:
          case Level.L2:
          case Level.L2_1:
          case Level.L2_2:
          case Level.L3:
          case Level.L3_1:
          case Level.L3_2:
          case Level.L4:
          case Level.L4_1:
          case Level.L4_2:
          case Level.L5:
          case Level.L5_1:
          case Level.L5_2: {
            level = level_idc;
            break;
          }
          // Unrecognized level_idc.
          default: {
            logger.warn(`parseProfileLevelId() | unrecognized level_idc [str:${str}, level_idc:${level_idc}]`);
            return void 0;
          }
        }
        for (const pattern of ProfilePatterns) {
          if (profile_idc === pattern.profile_idc && pattern.profile_iop.isMatch(profile_iop)) {
            logger.debug(`parseProfileLevelId() | result [str:${str}, profile:${pattern.profile}, level:${level}]`);
            return new ProfileLevelId(pattern.profile, level);
          }
        }
        logger.warn(`parseProfileLevelId() | unrecognized profile_idc/profile_iop combination [str:${str}, profile_idc:${profile_idc}, profile_iop:${profile_iop}]`);
        return void 0;
      }
      function profileLevelIdToString(profile_level_id) {
        if (profile_level_id.level == Level.L1_b) {
          switch (profile_level_id.profile) {
            case Profile.ConstrainedBaseline: {
              return "42f00b";
            }
            case Profile.Baseline: {
              return "42100b";
            }
            case Profile.Main: {
              return "4d100b";
            }
            // Level 1_b is not allowed for other profiles.
            default: {
              logger.warn(`profileLevelIdToString() | Level 1_b not is allowed for profile ${profile_level_id.profile}`);
              return void 0;
            }
          }
        }
        let profile_idc_iop_string;
        switch (profile_level_id.profile) {
          case Profile.ConstrainedBaseline: {
            profile_idc_iop_string = "42e0";
            break;
          }
          case Profile.Baseline: {
            profile_idc_iop_string = "4200";
            break;
          }
          case Profile.Main: {
            profile_idc_iop_string = "4d00";
            break;
          }
          case Profile.ConstrainedHigh: {
            profile_idc_iop_string = "640c";
            break;
          }
          case Profile.High: {
            profile_idc_iop_string = "6400";
            break;
          }
          case Profile.PredictiveHigh444: {
            profile_idc_iop_string = "f400";
            break;
          }
          default: {
            logger.warn(`profileLevelIdToString() | unrecognized profile ${profile_level_id.profile}`);
            return void 0;
          }
        }
        let levelStr = profile_level_id.level.toString(16);
        if (levelStr.length === 1) {
          levelStr = `0${levelStr}`;
        }
        return `${profile_idc_iop_string}${levelStr}`;
      }
      function profileToString(profile) {
        switch (profile) {
          case Profile.ConstrainedBaseline: {
            return "ConstrainedBaseline";
          }
          case Profile.Baseline: {
            return "Baseline";
          }
          case Profile.Main: {
            return "Main";
          }
          case Profile.ConstrainedHigh: {
            return "ConstrainedHigh";
          }
          case Profile.High: {
            return "High";
          }
          case Profile.PredictiveHigh444: {
            return "PredictiveHigh444";
          }
          default: {
            logger.warn(`profileToString() | unrecognized profile ${profile}`);
            return void 0;
          }
        }
      }
      function levelToString(level) {
        switch (level) {
          case Level.L1_b: {
            return "1b";
          }
          case Level.L1: {
            return "1";
          }
          case Level.L1_1: {
            return "1.1";
          }
          case Level.L1_2: {
            return "1.2";
          }
          case Level.L1_3: {
            return "1.3";
          }
          case Level.L2: {
            return "2";
          }
          case Level.L2_1: {
            return "2.1";
          }
          case Level.L2_2: {
            return "2.2";
          }
          case Level.L3: {
            return "3";
          }
          case Level.L3_1: {
            return "3.1";
          }
          case Level.L3_2: {
            return "3.2";
          }
          case Level.L4: {
            return "4";
          }
          case Level.L4_1: {
            return "4.1";
          }
          case Level.L4_2: {
            return "4.2";
          }
          case Level.L5: {
            return "5";
          }
          case Level.L5_1: {
            return "5.1";
          }
          case Level.L5_2: {
            return "5.2";
          }
          default: {
            logger.warn(`levelToString() | unrecognized level ${level}`);
            return void 0;
          }
        }
      }
      function parseSdpProfileLevelId(params = {}) {
        const profile_level_id = params["profile-level-id"];
        return profile_level_id ? parseProfileLevelId(profile_level_id) : DefaultProfileLevelId;
      }
      function isSameProfile(params1 = {}, params2 = {}) {
        const profile_level_id_1 = parseSdpProfileLevelId(params1);
        const profile_level_id_2 = parseSdpProfileLevelId(params2);
        return Boolean(profile_level_id_1 && profile_level_id_2 && profile_level_id_1.profile === profile_level_id_2.profile);
      }
      function isSameProfileAndLevel(params1 = {}, params2 = {}) {
        const profile_level_id_1 = parseSdpProfileLevelId(params1);
        const profile_level_id_2 = parseSdpProfileLevelId(params2);
        return Boolean(profile_level_id_1 && profile_level_id_2 && profile_level_id_1.profile === profile_level_id_2.profile && profile_level_id_1.level == profile_level_id_2.level);
      }
      function generateProfileLevelIdStringForAnswer(local_supported_params = {}, remote_offered_params = {}) {
        if (!local_supported_params["profile-level-id"] && !remote_offered_params["profile-level-id"]) {
          logger.warn("generateProfileLevelIdStringForAnswer() | profile-level-id missing in local and remote params");
          return void 0;
        }
        const local_profile_level_id = parseSdpProfileLevelId(local_supported_params);
        const remote_profile_level_id = parseSdpProfileLevelId(remote_offered_params);
        if (!local_profile_level_id) {
          throw new TypeError("invalid local_profile_level_id");
        }
        if (!remote_profile_level_id) {
          throw new TypeError("invalid remote_profile_level_id");
        }
        if (local_profile_level_id.profile !== remote_profile_level_id.profile) {
          throw new TypeError("H264 Profile mismatch");
        }
        const level_asymmetry_allowed = isLevelAsymmetryAllowed(local_supported_params) && isLevelAsymmetryAllowed(remote_offered_params);
        const local_level = local_profile_level_id.level;
        const remote_level = remote_profile_level_id.level;
        const min_level = minLevel(local_level, remote_level);
        const answer_level = level_asymmetry_allowed ? local_level : min_level;
        logger.debug(`generateProfileLevelIdStringForAnswer() | result [profile:${local_profile_level_id.profile}, level:${answer_level}]`);
        return profileLevelIdToString(new ProfileLevelId(local_profile_level_id.profile, answer_level));
      }
      function supportedLevel(max_frame_pixel_count, max_fps) {
        const PixelsPerMacroblock = 16 * 16;
        for (let i = LevelConstraints.length - 1; i >= 0; --i) {
          const level_constraint = LevelConstraints[i];
          if (level_constraint.max_macroblock_frame_size * PixelsPerMacroblock <= max_frame_pixel_count && level_constraint.max_macroblocks_per_second <= max_fps * level_constraint.max_macroblock_frame_size) {
            logger.debug(`supportedLevel() | result [max_frame_pixel_count:${max_frame_pixel_count}, max_fps:${max_fps}, level:${level_constraint.level}]`);
            return level_constraint.level;
          }
        }
        logger.warn(`supportedLevel() | no level supported [max_frame_pixel_count:${max_frame_pixel_count}, max_fps:${max_fps}]`);
        return void 0;
      }
      function byteMaskString(c, str) {
        return Number(str[0] === c) << 7 | Number(str[1] === c) << 6 | Number(str[2] === c) << 5 | Number(str[3] === c) << 4 | Number(str[4] === c) << 3 | Number(str[5] === c) << 2 | Number(str[6] === c) << 1 | Number(str[7] === c) << 0;
      }
      function isLessLevel(a, b) {
        if (a === Level.L1_b) {
          return b !== Level.L1 && b !== Level.L1_b;
        }
        if (b === Level.L1_b) {
          return a !== Level.L1;
        }
        return a < b;
      }
      function minLevel(a, b) {
        return isLessLevel(a, b) ? a : b;
      }
      function isLevelAsymmetryAllowed(params = {}) {
        const level_asymmetry_allowed = params["level-asymmetry-allowed"];
        return level_asymmetry_allowed === true || level_asymmetry_allowed === 1 || level_asymmetry_allowed === "1";
      }
    }
  });

  // node_modules/mediasoup-client/lib/ortc.js
  var require_ortc = __commonJS({
    "node_modules/mediasoup-client/lib/ortc.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.validateAndNormalizeRtpCapabilities = validateAndNormalizeRtpCapabilities;
      exports.validateAndNormalizeRtpParameters = validateAndNormalizeRtpParameters;
      exports.validateAndNormalizeSctpStreamParameters = validateAndNormalizeSctpStreamParameters;
      exports.validateSctpCapabilities = validateSctpCapabilities;
      exports.getExtendedRtpCapabilities = getExtendedRtpCapabilities;
      exports.getRecvRtpCapabilities = getRecvRtpCapabilities;
      exports.getSendRtpCapabilities = getSendRtpCapabilities;
      exports.getSendingRtpParameters = getSendingRtpParameters;
      exports.getSendingRemoteRtpParameters = getSendingRemoteRtpParameters;
      exports.reduceCodecs = reduceCodecs;
      exports.generateProbatorRtpParameters = generateProbatorRtpParameters;
      exports.canSend = canSend;
      exports.canReceive = canReceive;
      var h264 = require_lib();
      var utils = require_utils();
      var RTP_PROBATOR_MID = "probator";
      var RTP_PROBATOR_SSRC = 1234;
      var RTP_PROBATOR_CODEC_PAYLOAD_TYPE = 127;
      function validateAndNormalizeRtpCapabilities(caps) {
        if (typeof caps !== "object") {
          throw new TypeError("caps is not an object");
        }
        if (caps.codecs && !Array.isArray(caps.codecs)) {
          throw new TypeError("caps.codecs is not an array");
        } else if (!caps.codecs) {
          caps.codecs = [];
        }
        for (const codec of caps.codecs) {
          validateAndNormalizeRtpCodecCapability(codec);
        }
        if (caps.headerExtensions && !Array.isArray(caps.headerExtensions)) {
          throw new TypeError("caps.headerExtensions is not an array");
        } else if (!caps.headerExtensions) {
          caps.headerExtensions = [];
        }
        for (const ext of caps.headerExtensions) {
          validateAndNormalizeRtpHeaderExtension(ext);
        }
      }
      function validateAndNormalizeRtpParameters(params) {
        if (typeof params !== "object") {
          throw new TypeError("params is not an object");
        }
        if (params.mid && typeof params.mid !== "string") {
          throw new TypeError("params.mid is not a string");
        }
        if (!Array.isArray(params.codecs)) {
          throw new TypeError("missing params.codecs");
        }
        for (const codec of params.codecs) {
          validateAndNormalizeRtpCodecParameters(codec);
        }
        if (params.headerExtensions && !Array.isArray(params.headerExtensions)) {
          throw new TypeError("params.headerExtensions is not an array");
        } else if (!params.headerExtensions) {
          params.headerExtensions = [];
        }
        for (const ext of params.headerExtensions) {
          validateRtpHeaderExtensionParameters(ext);
        }
        if (params.encodings && !Array.isArray(params.encodings)) {
          throw new TypeError("params.encodings is not an array");
        } else if (!params.encodings) {
          params.encodings = [];
        }
        for (const encoding of params.encodings) {
          validateAndNormalizeRtpEncodingParameters(encoding);
        }
        if (params.rtcp && typeof params.rtcp !== "object") {
          throw new TypeError("params.rtcp is not an object");
        } else if (!params.rtcp) {
          params.rtcp = {};
        }
        validateAndNormalizeRtcpParameters(params.rtcp);
      }
      function validateAndNormalizeSctpStreamParameters(params) {
        if (typeof params !== "object") {
          throw new TypeError("params is not an object");
        }
        if (typeof params.streamId !== "number") {
          throw new TypeError("missing params.streamId");
        }
        let orderedGiven = false;
        if (typeof params.ordered === "boolean") {
          orderedGiven = true;
        } else {
          params.ordered = true;
        }
        if (params.maxPacketLifeTime && typeof params.maxPacketLifeTime !== "number") {
          throw new TypeError("invalid params.maxPacketLifeTime");
        }
        if (params.maxRetransmits && typeof params.maxRetransmits !== "number") {
          throw new TypeError("invalid params.maxRetransmits");
        }
        if (params.maxPacketLifeTime && params.maxRetransmits) {
          throw new TypeError("cannot provide both maxPacketLifeTime and maxRetransmits");
        }
        if (orderedGiven && params.ordered && (params.maxPacketLifeTime || params.maxRetransmits)) {
          throw new TypeError("cannot be ordered with maxPacketLifeTime or maxRetransmits");
        } else if (!orderedGiven && (params.maxPacketLifeTime || params.maxRetransmits)) {
          params.ordered = false;
        }
        if (params.label && typeof params.label !== "string") {
          throw new TypeError("invalid params.label");
        }
        if (params.protocol && typeof params.protocol !== "string") {
          throw new TypeError("invalid params.protocol");
        }
      }
      function validateSctpCapabilities(caps) {
        if (typeof caps !== "object") {
          throw new TypeError("caps is not an object");
        }
        if (!caps.numStreams || typeof caps.numStreams !== "object") {
          throw new TypeError("missing caps.numStreams");
        }
        validateNumSctpStreams(caps.numStreams);
      }
      function getExtendedRtpCapabilities(localCaps, remoteCaps, preferLocalCodecsOrder) {
        const extendedRtpCapabilities = {
          codecs: [],
          headerExtensions: []
        };
        if (preferLocalCodecsOrder) {
          for (const localCodec of localCaps.codecs ?? []) {
            if (isRtxCodec(localCodec)) {
              continue;
            }
            const matchingRemoteCodec = (remoteCaps.codecs ?? []).find((remoteCodec) => matchCodecs(remoteCodec, localCodec, { strict: true, modify: true }));
            if (!matchingRemoteCodec) {
              continue;
            }
            const extendedCodec = {
              kind: localCodec.kind,
              mimeType: localCodec.mimeType,
              clockRate: localCodec.clockRate,
              channels: localCodec.channels,
              localPayloadType: localCodec.preferredPayloadType,
              localRtxPayloadType: void 0,
              remotePayloadType: matchingRemoteCodec.preferredPayloadType,
              remoteRtxPayloadType: void 0,
              localParameters: localCodec.parameters ?? {},
              remoteParameters: matchingRemoteCodec.parameters ?? {},
              rtcpFeedback: reduceRtcpFeedback(localCodec, matchingRemoteCodec)
            };
            extendedRtpCapabilities.codecs.push(extendedCodec);
          }
        } else {
          for (const remoteCodec of remoteCaps.codecs ?? []) {
            if (isRtxCodec(remoteCodec)) {
              continue;
            }
            const matchingLocalCodec = (localCaps.codecs ?? []).find((localCodec) => matchCodecs(localCodec, remoteCodec, { strict: true, modify: true }));
            if (!matchingLocalCodec) {
              continue;
            }
            const extendedCodec = {
              kind: matchingLocalCodec.kind,
              mimeType: matchingLocalCodec.mimeType,
              clockRate: matchingLocalCodec.clockRate,
              channels: matchingLocalCodec.channels,
              localPayloadType: matchingLocalCodec.preferredPayloadType,
              localRtxPayloadType: void 0,
              remotePayloadType: remoteCodec.preferredPayloadType,
              remoteRtxPayloadType: void 0,
              localParameters: matchingLocalCodec.parameters ?? {},
              remoteParameters: remoteCodec.parameters ?? {},
              rtcpFeedback: reduceRtcpFeedback(matchingLocalCodec, remoteCodec)
            };
            extendedRtpCapabilities.codecs.push(extendedCodec);
          }
        }
        for (const extendedCodec of extendedRtpCapabilities.codecs) {
          const matchingLocalRtxCodec = localCaps.codecs.find((localCodec) => isRtxCodec(localCodec) && localCodec.parameters?.["apt"] === extendedCodec.localPayloadType);
          const matchingRemoteRtxCodec = remoteCaps.codecs.find((remoteCodec) => isRtxCodec(remoteCodec) && remoteCodec.parameters?.["apt"] === extendedCodec.remotePayloadType);
          if (matchingLocalRtxCodec && matchingRemoteRtxCodec) {
            extendedCodec.localRtxPayloadType = matchingLocalRtxCodec.preferredPayloadType;
            extendedCodec.remoteRtxPayloadType = matchingRemoteRtxCodec.preferredPayloadType;
          }
        }
        for (const remoteExt of remoteCaps.headerExtensions) {
          const matchingLocalExt = localCaps.headerExtensions.find((localExt) => matchHeaderExtensions(localExt, remoteExt));
          if (!matchingLocalExt) {
            continue;
          }
          const extendedExt = {
            kind: remoteExt.kind,
            uri: remoteExt.uri,
            sendId: matchingLocalExt.preferredId,
            recvId: remoteExt.preferredId,
            encrypt: matchingLocalExt.preferredEncrypt ?? false,
            direction: "sendrecv"
          };
          switch (remoteExt.direction) {
            case "sendrecv": {
              extendedExt.direction = "sendrecv";
              break;
            }
            case "recvonly": {
              extendedExt.direction = "sendonly";
              break;
            }
            case "sendonly": {
              extendedExt.direction = "recvonly";
              break;
            }
            case "inactive": {
              extendedExt.direction = "inactive";
              break;
            }
          }
          extendedRtpCapabilities.headerExtensions.push(extendedExt);
        }
        return extendedRtpCapabilities;
      }
      function getRecvRtpCapabilities(extendedRtpCapabilities) {
        return getRtpCapabilities({ direction: "recvonly", extendedRtpCapabilities });
      }
      function getSendRtpCapabilities(extendedRtpCapabilities) {
        return getRtpCapabilities({ direction: "sendonly", extendedRtpCapabilities });
      }
      function getSendingRtpParameters(kind, extendedRtpCapabilities) {
        const rtpParameters = {
          mid: void 0,
          codecs: [],
          headerExtensions: [],
          encodings: [],
          rtcp: {}
        };
        for (const extendedCodec of extendedRtpCapabilities.codecs) {
          if (extendedCodec.kind !== kind) {
            continue;
          }
          const codec = {
            mimeType: extendedCodec.mimeType,
            payloadType: extendedCodec.localPayloadType,
            clockRate: extendedCodec.clockRate,
            channels: extendedCodec.channels,
            parameters: extendedCodec.localParameters,
            rtcpFeedback: extendedCodec.rtcpFeedback
          };
          rtpParameters.codecs.push(codec);
          if (extendedCodec.localRtxPayloadType) {
            const rtxCodec = {
              mimeType: `${extendedCodec.kind}/rtx`,
              payloadType: extendedCodec.localRtxPayloadType,
              clockRate: extendedCodec.clockRate,
              parameters: {
                apt: extendedCodec.localPayloadType
              },
              rtcpFeedback: []
            };
            rtpParameters.codecs.push(rtxCodec);
          }
        }
        for (const extendedExtension of extendedRtpCapabilities.headerExtensions) {
          if (extendedExtension.kind && extendedExtension.kind !== kind || extendedExtension.direction !== "sendrecv" && extendedExtension.direction !== "sendonly") {
            continue;
          }
          const ext = {
            uri: extendedExtension.uri,
            id: extendedExtension.sendId,
            encrypt: extendedExtension.encrypt,
            parameters: {}
          };
          rtpParameters.headerExtensions.push(ext);
        }
        return rtpParameters;
      }
      function getSendingRemoteRtpParameters(kind, extendedRtpCapabilities) {
        const rtpParameters = {
          mid: void 0,
          codecs: [],
          headerExtensions: [],
          encodings: [],
          rtcp: {}
        };
        for (const extendedCodec of extendedRtpCapabilities.codecs) {
          if (extendedCodec.kind !== kind) {
            continue;
          }
          const codec = {
            mimeType: extendedCodec.mimeType,
            payloadType: extendedCodec.localPayloadType,
            clockRate: extendedCodec.clockRate,
            channels: extendedCodec.channels,
            parameters: extendedCodec.remoteParameters,
            rtcpFeedback: extendedCodec.rtcpFeedback
          };
          rtpParameters.codecs.push(codec);
          if (extendedCodec.localRtxPayloadType) {
            const rtxCodec = {
              mimeType: `${extendedCodec.kind}/rtx`,
              payloadType: extendedCodec.localRtxPayloadType,
              clockRate: extendedCodec.clockRate,
              parameters: {
                apt: extendedCodec.localPayloadType
              },
              rtcpFeedback: []
            };
            rtpParameters.codecs.push(rtxCodec);
          }
        }
        for (const extendedExtension of extendedRtpCapabilities.headerExtensions) {
          if (extendedExtension.kind && extendedExtension.kind !== kind || extendedExtension.direction !== "sendrecv" && extendedExtension.direction !== "sendonly") {
            continue;
          }
          const ext = {
            uri: extendedExtension.uri,
            id: extendedExtension.sendId,
            encrypt: extendedExtension.encrypt,
            parameters: {}
          };
          rtpParameters.headerExtensions.push(ext);
        }
        if (rtpParameters.headerExtensions.some((ext) => ext.uri === "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01")) {
          for (const codec of rtpParameters.codecs) {
            codec.rtcpFeedback = (codec.rtcpFeedback ?? []).filter((fb) => fb.type !== "goog-remb");
          }
        } else if (rtpParameters.headerExtensions.some((ext) => ext.uri === "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time")) {
          for (const codec of rtpParameters.codecs) {
            codec.rtcpFeedback = (codec.rtcpFeedback ?? []).filter((fb) => fb.type !== "transport-cc");
          }
        } else {
          for (const codec of rtpParameters.codecs) {
            codec.rtcpFeedback = (codec.rtcpFeedback ?? []).filter((fb) => fb.type !== "transport-cc" && fb.type !== "goog-remb");
          }
        }
        return rtpParameters;
      }
      function reduceCodecs(codecs, capCodec) {
        const filteredCodecs = [];
        if (!capCodec) {
          filteredCodecs.push(codecs[0]);
          if (isRtxCodec(codecs[1])) {
            filteredCodecs.push(codecs[1]);
          }
        } else {
          for (let idx = 0; idx < codecs.length; ++idx) {
            if (matchCodecs(codecs[idx], capCodec, { strict: true })) {
              filteredCodecs.push(codecs[idx]);
              if (isRtxCodec(codecs[idx + 1])) {
                filteredCodecs.push(codecs[idx + 1]);
              }
              break;
            }
          }
          if (filteredCodecs.length === 0) {
            throw new TypeError("no matching codec found");
          }
        }
        return filteredCodecs;
      }
      function generateProbatorRtpParameters(videoRtpParameters) {
        videoRtpParameters = utils.clone(videoRtpParameters);
        validateAndNormalizeRtpParameters(videoRtpParameters);
        const rtpParameters = {
          mid: RTP_PROBATOR_MID,
          codecs: [],
          headerExtensions: [],
          encodings: [{ ssrc: RTP_PROBATOR_SSRC }],
          rtcp: { cname: "probator" }
        };
        rtpParameters.codecs.push(videoRtpParameters.codecs[0]);
        rtpParameters.codecs[0].payloadType = RTP_PROBATOR_CODEC_PAYLOAD_TYPE;
        rtpParameters.headerExtensions = videoRtpParameters.headerExtensions;
        return rtpParameters;
      }
      function canSend(kind, rtpCapabilities) {
        return (rtpCapabilities.codecs ?? []).some((codec) => codec.kind === kind);
      }
      function canReceive(rtpParameters, rtpCapabilities) {
        validateAndNormalizeRtpParameters(rtpParameters);
        if (rtpParameters.codecs.length === 0) {
          return false;
        }
        const firstMediaCodec = rtpParameters.codecs[0];
        return (rtpCapabilities.codecs ?? []).some((codec) => codec.preferredPayloadType === firstMediaCodec.payloadType);
      }
      function validateAndNormalizeRtpCodecCapability(codec) {
        const MimeTypeRegex = new RegExp("^(audio|video)/(.+)", "i");
        if (typeof codec !== "object") {
          throw new TypeError("codec is not an object");
        }
        if (!codec.mimeType || typeof codec.mimeType !== "string") {
          throw new TypeError("missing codec.mimeType");
        }
        const mimeTypeMatch = MimeTypeRegex.exec(codec.mimeType);
        if (!mimeTypeMatch) {
          throw new TypeError("invalid codec.mimeType");
        }
        codec.kind = mimeTypeMatch[1].toLowerCase();
        if (typeof codec.preferredPayloadType !== "number") {
          throw new TypeError("missing codec.preferredPayloadType");
        }
        if (typeof codec.clockRate !== "number") {
          throw new TypeError("missing codec.clockRate");
        }
        if (codec.kind === "audio") {
          if (typeof codec.channels !== "number") {
            codec.channels = 1;
          }
        } else {
          delete codec.channels;
        }
        if (!codec.parameters || typeof codec.parameters !== "object") {
          codec.parameters = {};
        }
        for (const key of Object.keys(codec.parameters)) {
          let value2 = codec.parameters[key];
          if (value2 === void 0) {
            codec.parameters[key] = "";
            value2 = "";
          }
          if (typeof value2 !== "string" && typeof value2 !== "number") {
            throw new TypeError(`invalid codec parameter [key:${key}s, value:${value2}]`);
          }
          if (key === "apt") {
            if (typeof value2 !== "number") {
              throw new TypeError("invalid codec apt parameter");
            }
          }
        }
        if (!codec.rtcpFeedback || !Array.isArray(codec.rtcpFeedback)) {
          codec.rtcpFeedback = [];
        }
        for (const fb of codec.rtcpFeedback) {
          validateAndNormalizeRtcpFeedback(fb);
        }
      }
      function validateAndNormalizeRtcpFeedback(fb) {
        if (typeof fb !== "object") {
          throw new TypeError("fb is not an object");
        }
        if (!fb.type || typeof fb.type !== "string") {
          throw new TypeError("missing fb.type");
        }
        if (!fb.parameter || typeof fb.parameter !== "string") {
          fb.parameter = "";
        }
      }
      function validateAndNormalizeRtpHeaderExtension(ext) {
        if (typeof ext !== "object") {
          throw new TypeError("ext is not an object");
        }
        if (ext.kind !== "audio" && ext.kind !== "video") {
          throw new TypeError("invalid ext.kind");
        }
        if (!ext.uri || typeof ext.uri !== "string") {
          throw new TypeError("missing ext.uri");
        }
        if (typeof ext.preferredId !== "number") {
          throw new TypeError("missing ext.preferredId");
        }
        if (ext.preferredEncrypt && typeof ext.preferredEncrypt !== "boolean") {
          throw new TypeError("invalid ext.preferredEncrypt");
        } else if (!ext.preferredEncrypt) {
          ext.preferredEncrypt = false;
        }
        if (ext.direction && typeof ext.direction !== "string") {
          throw new TypeError("invalid ext.direction");
        } else if (!ext.direction) {
          ext.direction = "sendrecv";
        }
      }
      function validateAndNormalizeRtpCodecParameters(codec) {
        const MimeTypeRegex = new RegExp("^(audio|video)/(.+)", "i");
        if (typeof codec !== "object") {
          throw new TypeError("codec is not an object");
        }
        if (!codec.mimeType || typeof codec.mimeType !== "string") {
          throw new TypeError("missing codec.mimeType");
        }
        const mimeTypeMatch = MimeTypeRegex.exec(codec.mimeType);
        if (!mimeTypeMatch) {
          throw new TypeError("invalid codec.mimeType");
        }
        if (typeof codec.payloadType !== "number") {
          throw new TypeError("missing codec.payloadType");
        }
        if (typeof codec.clockRate !== "number") {
          throw new TypeError("missing codec.clockRate");
        }
        const kind = mimeTypeMatch[1].toLowerCase();
        if (kind === "audio") {
          if (typeof codec.channels !== "number") {
            codec.channels = 1;
          }
        } else {
          delete codec.channels;
        }
        if (!codec.parameters || typeof codec.parameters !== "object") {
          codec.parameters = {};
        }
        for (const key of Object.keys(codec.parameters)) {
          let value2 = codec.parameters[key];
          if (value2 === void 0) {
            codec.parameters[key] = "";
            value2 = "";
          }
          if (typeof value2 !== "string" && typeof value2 !== "number") {
            throw new TypeError(`invalid codec parameter [key:${key}s, value:${value2}]`);
          }
          if (key === "apt") {
            if (typeof value2 !== "number") {
              throw new TypeError("invalid codec apt parameter");
            }
          }
        }
        if (!codec.rtcpFeedback || !Array.isArray(codec.rtcpFeedback)) {
          codec.rtcpFeedback = [];
        }
        for (const fb of codec.rtcpFeedback) {
          validateAndNormalizeRtcpFeedback(fb);
        }
      }
      function validateRtpHeaderExtensionParameters(ext) {
        if (typeof ext !== "object") {
          throw new TypeError("ext is not an object");
        }
        if (!ext.uri || typeof ext.uri !== "string") {
          throw new TypeError("missing ext.uri");
        }
        if (typeof ext.id !== "number") {
          throw new TypeError("missing ext.id");
        }
        if (ext.encrypt && typeof ext.encrypt !== "boolean") {
          throw new TypeError("invalid ext.encrypt");
        } else if (!ext.encrypt) {
          ext.encrypt = false;
        }
        if (!ext.parameters || typeof ext.parameters !== "object") {
          ext.parameters = {};
        }
        for (const key of Object.keys(ext.parameters)) {
          let value2 = ext.parameters[key];
          if (value2 === void 0) {
            ext.parameters[key] = "";
            value2 = "";
          }
          if (typeof value2 !== "string" && typeof value2 !== "number") {
            throw new TypeError("invalid header extension parameter");
          }
        }
      }
      function validateAndNormalizeRtpEncodingParameters(encoding) {
        if (typeof encoding !== "object") {
          throw new TypeError("encoding is not an object");
        }
        if (encoding.ssrc && typeof encoding.ssrc !== "number") {
          throw new TypeError("invalid encoding.ssrc");
        }
        if (encoding.rid && typeof encoding.rid !== "string") {
          throw new TypeError("invalid encoding.rid");
        }
        if (encoding.rtx && typeof encoding.rtx !== "object") {
          throw new TypeError("invalid encoding.rtx");
        } else if (encoding.rtx) {
          if (typeof encoding.rtx.ssrc !== "number") {
            throw new TypeError("missing encoding.rtx.ssrc");
          }
        }
        if (!encoding.dtx || typeof encoding.dtx !== "boolean") {
          encoding.dtx = false;
        }
        if (encoding.scalabilityMode && typeof encoding.scalabilityMode !== "string") {
          throw new TypeError("invalid encoding.scalabilityMode");
        }
      }
      function validateAndNormalizeRtcpParameters(rtcp) {
        if (typeof rtcp !== "object") {
          throw new TypeError("rtcp is not an object");
        }
        if (rtcp.cname && typeof rtcp.cname !== "string") {
          throw new TypeError("invalid rtcp.cname");
        }
        if (!rtcp.reducedSize || typeof rtcp.reducedSize !== "boolean") {
          rtcp.reducedSize = true;
        }
      }
      function validateNumSctpStreams(numStreams) {
        if (typeof numStreams !== "object") {
          throw new TypeError("numStreams is not an object");
        }
        if (typeof numStreams.OS !== "number") {
          throw new TypeError("missing numStreams.OS");
        }
        if (typeof numStreams.MIS !== "number") {
          throw new TypeError("missing numStreams.MIS");
        }
      }
      function getRtpCapabilities({ direction, extendedRtpCapabilities }) {
        const rtpCapabilities = {
          codecs: [],
          headerExtensions: []
        };
        for (const extendedCodec of extendedRtpCapabilities.codecs) {
          const codec = {
            kind: extendedCodec.kind,
            mimeType: extendedCodec.mimeType,
            preferredPayloadType: extendedCodec.remotePayloadType,
            clockRate: extendedCodec.clockRate,
            channels: extendedCodec.channels,
            parameters: extendedCodec.localParameters,
            rtcpFeedback: extendedCodec.rtcpFeedback
          };
          rtpCapabilities.codecs.push(codec);
          if (!extendedCodec.remoteRtxPayloadType) {
            continue;
          }
          const rtxCodec = {
            kind: extendedCodec.kind,
            mimeType: `${extendedCodec.kind}/rtx`,
            preferredPayloadType: extendedCodec.remoteRtxPayloadType,
            clockRate: extendedCodec.clockRate,
            parameters: {
              apt: extendedCodec.remotePayloadType
            },
            rtcpFeedback: []
          };
          rtpCapabilities.codecs.push(rtxCodec);
        }
        for (const extendedExtension of extendedRtpCapabilities.headerExtensions) {
          if (extendedExtension.direction !== "sendrecv" && extendedExtension.direction !== direction) {
            continue;
          }
          const ext = {
            kind: extendedExtension.kind,
            uri: extendedExtension.uri,
            preferredId: extendedExtension.recvId,
            preferredEncrypt: extendedExtension.encrypt ?? false,
            direction: extendedExtension.direction
          };
          rtpCapabilities.headerExtensions.push(ext);
        }
        return rtpCapabilities;
      }
      function isRtxCodec(codec) {
        if (!codec) {
          return false;
        }
        return /.+\/rtx$/i.test(codec.mimeType);
      }
      function matchCodecs(aCodec, bCodec, { strict = false, modify = false } = {}) {
        const aMimeType = aCodec.mimeType.toLowerCase();
        const bMimeType = bCodec.mimeType.toLowerCase();
        if (aMimeType !== bMimeType) {
          return false;
        }
        if (aCodec.clockRate !== bCodec.clockRate) {
          return false;
        }
        if (aCodec.channels !== bCodec.channels) {
          return false;
        }
        switch (aMimeType) {
          case "video/h264": {
            if (strict) {
              const aPacketizationMode = aCodec.parameters["packetization-mode"] ?? 0;
              const bPacketizationMode = bCodec.parameters["packetization-mode"] ?? 0;
              if (aPacketizationMode !== bPacketizationMode) {
                return false;
              }
              if (!h264.isSameProfile(aCodec.parameters, bCodec.parameters)) {
                return false;
              }
              let selectedProfileLevelId;
              try {
                selectedProfileLevelId = h264.generateProfileLevelIdStringForAnswer(aCodec.parameters, bCodec.parameters);
              } catch (error) {
                return false;
              }
              if (modify) {
                if (selectedProfileLevelId) {
                  aCodec.parameters["profile-level-id"] = selectedProfileLevelId;
                  bCodec.parameters["profile-level-id"] = selectedProfileLevelId;
                } else {
                  delete aCodec.parameters["profile-level-id"];
                  delete bCodec.parameters["profile-level-id"];
                }
              }
            }
            break;
          }
          case "video/vp9": {
            if (strict) {
              const aProfileId = aCodec.parameters["profile-id"] ?? 0;
              const bProfileId = bCodec.parameters["profile-id"] ?? 0;
              if (aProfileId !== bProfileId) {
                return false;
              }
            }
            break;
          }
        }
        return true;
      }
      function matchHeaderExtensions(aExt, bExt) {
        if (aExt.kind && bExt.kind && aExt.kind !== bExt.kind) {
          return false;
        }
        if (aExt.uri !== bExt.uri) {
          return false;
        }
        return true;
      }
      function reduceRtcpFeedback(codecA, codecB) {
        const reducedRtcpFeedback = [];
        for (const aFb of codecA.rtcpFeedback ?? []) {
          const matchingBFb = (codecB.rtcpFeedback ?? []).find((bFb) => bFb.type === aFb.type && (bFb.parameter === aFb.parameter || !bFb.parameter && !aFb.parameter));
          if (matchingBFb) {
            reducedRtcpFeedback.push(matchingBFb);
          }
        }
        return reducedRtcpFeedback;
      }
    }
  });

  // node_modules/awaitqueue/node_modules/ms/index.js
  var require_ms3 = __commonJS({
    "node_modules/awaitqueue/node_modules/ms/index.js"(exports, module) {
      var s = 1e3;
      var m = s * 60;
      var h = m * 60;
      var d = h * 24;
      var w = d * 7;
      var y = d * 365.25;
      module.exports = function(val, options) {
        options = options || {};
        var type = typeof val;
        if (type === "string" && val.length > 0) {
          return parse2(val);
        } else if (type === "number" && isFinite(val)) {
          return options.long ? fmtLong(val) : fmtShort(val);
        }
        throw new Error(
          "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
        );
      };
      function parse2(str) {
        str = String(str);
        if (str.length > 100) {
          return;
        }
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (!match) {
          return;
        }
        var n = parseFloat(match[1]);
        var type = (match[2] || "ms").toLowerCase();
        switch (type) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * y;
          case "weeks":
          case "week":
          case "w":
            return n * w;
          case "days":
          case "day":
          case "d":
            return n * d;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * m;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * s;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return void 0;
        }
      }
      function fmtShort(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return Math.round(ms / d) + "d";
        }
        if (msAbs >= h) {
          return Math.round(ms / h) + "h";
        }
        if (msAbs >= m) {
          return Math.round(ms / m) + "m";
        }
        if (msAbs >= s) {
          return Math.round(ms / s) + "s";
        }
        return ms + "ms";
      }
      function fmtLong(ms) {
        var msAbs = Math.abs(ms);
        if (msAbs >= d) {
          return plural(ms, msAbs, d, "day");
        }
        if (msAbs >= h) {
          return plural(ms, msAbs, h, "hour");
        }
        if (msAbs >= m) {
          return plural(ms, msAbs, m, "minute");
        }
        if (msAbs >= s) {
          return plural(ms, msAbs, s, "second");
        }
        return ms + " ms";
      }
      function plural(ms, msAbs, n, name) {
        var isPlural = msAbs >= n * 1.5;
        return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
      }
    }
  });

  // node_modules/awaitqueue/node_modules/debug/src/common.js
  var require_common3 = __commonJS({
    "node_modules/awaitqueue/node_modules/debug/src/common.js"(exports, module) {
      function setup(env) {
        createDebug.debug = createDebug;
        createDebug.default = createDebug;
        createDebug.coerce = coerce;
        createDebug.disable = disable;
        createDebug.enable = enable;
        createDebug.enabled = enabled;
        createDebug.humanize = require_ms3();
        createDebug.destroy = destroy;
        Object.keys(env).forEach((key) => {
          createDebug[key] = env[key];
        });
        createDebug.names = [];
        createDebug.skips = [];
        createDebug.formatters = {};
        function selectColor(namespace) {
          let hash = 0;
          for (let i = 0; i < namespace.length; i++) {
            hash = (hash << 5) - hash + namespace.charCodeAt(i);
            hash |= 0;
          }
          return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
        }
        createDebug.selectColor = selectColor;
        function createDebug(namespace) {
          let prevTime;
          let enableOverride = null;
          let namespacesCache;
          let enabledCache;
          function debug(...args) {
            if (!debug.enabled) {
              return;
            }
            const self2 = debug;
            const curr = Number(/* @__PURE__ */ new Date());
            const ms = curr - (prevTime || curr);
            self2.diff = ms;
            self2.prev = prevTime;
            self2.curr = curr;
            prevTime = curr;
            args[0] = createDebug.coerce(args[0]);
            if (typeof args[0] !== "string") {
              args.unshift("%O");
            }
            let index = 0;
            args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
              if (match === "%%") {
                return "%";
              }
              index++;
              const formatter = createDebug.formatters[format];
              if (typeof formatter === "function") {
                const val = args[index];
                match = formatter.call(self2, val);
                args.splice(index, 1);
                index--;
              }
              return match;
            });
            createDebug.formatArgs.call(self2, args);
            const logFn = self2.log || createDebug.log;
            logFn.apply(self2, args);
          }
          debug.namespace = namespace;
          debug.useColors = createDebug.useColors();
          debug.color = createDebug.selectColor(namespace);
          debug.extend = extend;
          debug.destroy = createDebug.destroy;
          Object.defineProperty(debug, "enabled", {
            enumerable: true,
            configurable: false,
            get: () => {
              if (enableOverride !== null) {
                return enableOverride;
              }
              if (namespacesCache !== createDebug.namespaces) {
                namespacesCache = createDebug.namespaces;
                enabledCache = createDebug.enabled(namespace);
              }
              return enabledCache;
            },
            set: (v) => {
              enableOverride = v;
            }
          });
          if (typeof createDebug.init === "function") {
            createDebug.init(debug);
          }
          return debug;
        }
        function extend(namespace, delimiter) {
          const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
          newDebug.log = this.log;
          return newDebug;
        }
        function enable(namespaces) {
          createDebug.save(namespaces);
          createDebug.namespaces = namespaces;
          createDebug.names = [];
          createDebug.skips = [];
          const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
          for (const ns of split) {
            if (ns[0] === "-") {
              createDebug.skips.push(ns.slice(1));
            } else {
              createDebug.names.push(ns);
            }
          }
        }
        function matchesTemplate(search, template) {
          let searchIndex = 0;
          let templateIndex = 0;
          let starIndex = -1;
          let matchIndex = 0;
          while (searchIndex < search.length) {
            if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
              if (template[templateIndex] === "*") {
                starIndex = templateIndex;
                matchIndex = searchIndex;
                templateIndex++;
              } else {
                searchIndex++;
                templateIndex++;
              }
            } else if (starIndex !== -1) {
              templateIndex = starIndex + 1;
              matchIndex++;
              searchIndex = matchIndex;
            } else {
              return false;
            }
          }
          while (templateIndex < template.length && template[templateIndex] === "*") {
            templateIndex++;
          }
          return templateIndex === template.length;
        }
        function disable() {
          const namespaces = [
            ...createDebug.names,
            ...createDebug.skips.map((namespace) => "-" + namespace)
          ].join(",");
          createDebug.enable("");
          return namespaces;
        }
        function enabled(name) {
          for (const skip of createDebug.skips) {
            if (matchesTemplate(name, skip)) {
              return false;
            }
          }
          for (const ns of createDebug.names) {
            if (matchesTemplate(name, ns)) {
              return true;
            }
          }
          return false;
        }
        function coerce(val) {
          if (val instanceof Error) {
            return val.stack || val.message;
          }
          return val;
        }
        function destroy() {
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
        createDebug.enable(createDebug.load());
        return createDebug;
      }
      module.exports = setup;
    }
  });

  // node_modules/awaitqueue/node_modules/debug/src/browser.js
  var require_browser3 = __commonJS({
    "node_modules/awaitqueue/node_modules/debug/src/browser.js"(exports, module) {
      exports.formatArgs = formatArgs;
      exports.save = save;
      exports.load = load;
      exports.useColors = useColors;
      exports.storage = localstorage();
      exports.destroy = /* @__PURE__ */ (() => {
        let warned = false;
        return () => {
          if (!warned) {
            warned = true;
            console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
          }
        };
      })();
      exports.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33"
      ];
      function useColors() {
        if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
          return true;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
          return false;
        }
        let m;
        return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
        typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
        typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
      }
      function formatArgs(args) {
        args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
        if (!this.useColors) {
          return;
        }
        const c = "color: " + this.color;
        args.splice(1, 0, c, "color: inherit");
        let index = 0;
        let lastC = 0;
        args[0].replace(/%[a-zA-Z%]/g, (match) => {
          if (match === "%%") {
            return;
          }
          index++;
          if (match === "%c") {
            lastC = index;
          }
        });
        args.splice(lastC, 0, c);
      }
      exports.log = console.debug || console.log || (() => {
      });
      function save(namespaces) {
        try {
          if (namespaces) {
            exports.storage.setItem("debug", namespaces);
          } else {
            exports.storage.removeItem("debug");
          }
        } catch (error) {
        }
      }
      function load() {
        let r;
        try {
          r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
        } catch (error) {
        }
        if (!r && typeof process !== "undefined" && "env" in process) {
          r = process.env.DEBUG;
        }
        return r;
      }
      function localstorage() {
        try {
          return localStorage;
        } catch (error) {
        }
      }
      module.exports = require_common3()(exports);
      var { formatters } = module.exports;
      formatters.j = function(v) {
        try {
          return JSON.stringify(v);
        } catch (error) {
          return "[UnexpectedJSONParseError]: " + error.message;
        }
      };
    }
  });

  // node_modules/awaitqueue/lib/Logger.js
  var require_Logger3 = __commonJS({
    "node_modules/awaitqueue/lib/Logger.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Logger = void 0;
      var debug = require_browser3();
      var LIB_NAME = "awaitqueue";
      var Logger = class {
        constructor(prefix) {
          __publicField(this, "_debug");
          __publicField(this, "_warn");
          __publicField(this, "_error");
          if (prefix) {
            this._debug = debug(`${LIB_NAME}:${prefix}`);
            this._warn = debug(`${LIB_NAME}:WARN:${prefix}`);
            this._error = debug(`${LIB_NAME}:ERROR:${prefix}`);
          } else {
            this._debug = debug(LIB_NAME);
            this._warn = debug(`${LIB_NAME}:WARN`);
            this._error = debug(`${LIB_NAME}:ERROR`);
          }
          this._debug.log = console.info.bind(console);
          this._warn.log = console.warn.bind(console);
          this._error.log = console.error.bind(console);
        }
        get debug() {
          return this._debug;
        }
        get warn() {
          return this._warn;
        }
        get error() {
          return this._error;
        }
      };
      exports.Logger = Logger;
    }
  });

  // node_modules/awaitqueue/lib/errors.js
  var require_errors2 = __commonJS({
    "node_modules/awaitqueue/lib/errors.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.AwaitQueueRemovedTaskError = exports.AwaitQueueStoppedError = void 0;
      var AwaitQueueStoppedError = class _AwaitQueueStoppedError extends Error {
        constructor(message) {
          super(message ?? "queue stopped");
          this.name = "AwaitQueueStoppedError";
          if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, _AwaitQueueStoppedError);
          }
        }
      };
      exports.AwaitQueueStoppedError = AwaitQueueStoppedError;
      var AwaitQueueRemovedTaskError = class _AwaitQueueRemovedTaskError extends Error {
        constructor(message) {
          super(message ?? "queue task removed");
          this.name = "AwaitQueueRemovedTaskError";
          if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, _AwaitQueueRemovedTaskError);
          }
        }
      };
      exports.AwaitQueueRemovedTaskError = AwaitQueueRemovedTaskError;
    }
  });

  // node_modules/awaitqueue/lib/AwaitQueue.js
  var require_AwaitQueue = __commonJS({
    "node_modules/awaitqueue/lib/AwaitQueue.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.AwaitQueue = void 0;
      var Logger_1 = require_Logger3();
      var errors_1 = require_errors2();
      var logger = new Logger_1.Logger("AwaitQueue");
      var AwaitQueue = class {
        constructor() {
          // Queue of pending tasks (map of PendingTasks indexed by id).
          __publicField(this, "pendingTasks", /* @__PURE__ */ new Map());
          // Incrementing PendingTask id.
          __publicField(this, "nextTaskId", 0);
          logger.debug("constructor()");
        }
        get size() {
          return this.pendingTasks.size;
        }
        async push(task, name, options) {
          name = name ?? task.name;
          logger.debug(`push() [name:${name}, options:%o]`, options);
          if (typeof task !== "function") {
            throw new TypeError("given task is not a function");
          }
          if (name) {
            try {
              Object.defineProperty(task, "name", { value: name });
            } catch (error) {
            }
          }
          return new Promise((resolve, reject) => {
            if (name && options?.removeOngoingTasksWithSameName) {
              for (const pendingTask2 of this.pendingTasks.values()) {
                if (pendingTask2.name === name) {
                  pendingTask2.reject(new errors_1.AwaitQueueRemovedTaskError(), {
                    canExecuteNextTask: false
                  });
                }
              }
            }
            const pendingTask = {
              id: this.nextTaskId++,
              task,
              name,
              enqueuedAt: Date.now(),
              executedAt: void 0,
              completed: false,
              resolve: (result) => {
                if (pendingTask.completed) {
                  return;
                }
                pendingTask.completed = true;
                this.pendingTasks.delete(pendingTask.id);
                logger.debug(`resolving task [name:${pendingTask.name}]`);
                resolve(result);
                const [nextPendingTask] = this.pendingTasks.values();
                if (nextPendingTask && !nextPendingTask.executedAt) {
                  void this.execute(nextPendingTask);
                }
              },
              reject: (error, { canExecuteNextTask }) => {
                if (pendingTask.completed) {
                  return;
                }
                pendingTask.completed = true;
                this.pendingTasks.delete(pendingTask.id);
                logger.debug(`rejecting task [name:${pendingTask.name}]: %s`, String(error));
                reject(error);
                if (canExecuteNextTask) {
                  const [nextPendingTask] = this.pendingTasks.values();
                  if (nextPendingTask && !nextPendingTask.executedAt) {
                    void this.execute(nextPendingTask);
                  }
                }
              }
            };
            this.pendingTasks.set(pendingTask.id, pendingTask);
            if (this.pendingTasks.size === 1) {
              void this.execute(pendingTask);
            }
          });
        }
        stop() {
          logger.debug("stop()");
          for (const pendingTask of this.pendingTasks.values()) {
            logger.debug(`stop() | stopping task [name:${pendingTask.name}]`);
            pendingTask.reject(new errors_1.AwaitQueueStoppedError(), {
              canExecuteNextTask: false
            });
          }
        }
        remove(taskIdx) {
          logger.debug(`remove() [taskIdx:${taskIdx}]`);
          const pendingTask = Array.from(this.pendingTasks.values())[taskIdx];
          if (!pendingTask) {
            logger.debug(`stop() | no task with given idx [taskIdx:${taskIdx}]`);
            return;
          }
          pendingTask.reject(new errors_1.AwaitQueueRemovedTaskError(), {
            canExecuteNextTask: true
          });
        }
        dump() {
          const now = Date.now();
          let idx = 0;
          return Array.from(this.pendingTasks.values()).map((pendingTask) => ({
            idx: idx++,
            task: pendingTask.task,
            name: pendingTask.name,
            enqueuedTime: pendingTask.executedAt ? pendingTask.executedAt - pendingTask.enqueuedAt : now - pendingTask.enqueuedAt,
            executionTime: pendingTask.executedAt ? now - pendingTask.executedAt : 0
          }));
        }
        async execute(pendingTask) {
          logger.debug(`execute() [name:${pendingTask.name}]`);
          if (pendingTask.executedAt) {
            throw new Error("task already being executed");
          }
          pendingTask.executedAt = Date.now();
          try {
            const result = await pendingTask.task();
            pendingTask.resolve(result);
          } catch (error) {
            pendingTask.reject(error, { canExecuteNextTask: true });
          }
        }
      };
      exports.AwaitQueue = AwaitQueue;
    }
  });

  // node_modules/awaitqueue/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/awaitqueue/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.AwaitQueueRemovedTaskError = exports.AwaitQueueStoppedError = exports.AwaitQueue = void 0;
      var AwaitQueue_1 = require_AwaitQueue();
      Object.defineProperty(exports, "AwaitQueue", { enumerable: true, get: function() {
        return AwaitQueue_1.AwaitQueue;
      } });
      var errors_1 = require_errors2();
      Object.defineProperty(exports, "AwaitQueueStoppedError", { enumerable: true, get: function() {
        return errors_1.AwaitQueueStoppedError;
      } });
      Object.defineProperty(exports, "AwaitQueueRemovedTaskError", { enumerable: true, get: function() {
        return errors_1.AwaitQueueRemovedTaskError;
      } });
    }
  });

  // node_modules/mediasoup-client/lib/Producer.js
  var require_Producer = __commonJS({
    "node_modules/mediasoup-client/lib/Producer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Producer = void 0;
      var Logger_1 = require_Logger();
      var enhancedEvents_1 = require_enhancedEvents();
      var errors_1 = require_errors();
      var logger = new Logger_1.Logger("Producer");
      var Producer = class extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ id, localId, rtpSender, track, rtpParameters, stopTracks, disableTrackOnPause, zeroRtpOnPause, appData }) {
          super();
          // Id.
          __publicField(this, "_id");
          // Local id.
          __publicField(this, "_localId");
          // Closed flag.
          __publicField(this, "_closed", false);
          // Associated RTCRtpSender.
          __publicField(this, "_rtpSender");
          // Local track.
          __publicField(this, "_track");
          // Producer kind.
          __publicField(this, "_kind");
          // RTP parameters.
          __publicField(this, "_rtpParameters");
          // Paused flag.
          __publicField(this, "_paused");
          // Video max spatial layer.
          __publicField(this, "_maxSpatialLayer");
          // Whether the Producer should call stop() in given tracks.
          __publicField(this, "_stopTracks");
          // Whether the Producer should set track.enabled = false when paused.
          __publicField(this, "_disableTrackOnPause");
          // Whether we should mark the transceiver as inactive when paused.
          __publicField(this, "_zeroRtpOnPause");
          // App custom data.
          __publicField(this, "_appData");
          // Observer instance.
          __publicField(this, "_observer", new enhancedEvents_1.EnhancedEventEmitter());
          logger.debug("constructor()");
          this._id = id;
          this._localId = localId;
          this._rtpSender = rtpSender;
          this._track = track;
          this._kind = track.kind;
          this._rtpParameters = rtpParameters;
          this._paused = disableTrackOnPause ? !track.enabled : false;
          this._maxSpatialLayer = void 0;
          this._stopTracks = stopTracks;
          this._disableTrackOnPause = disableTrackOnPause;
          this._zeroRtpOnPause = zeroRtpOnPause;
          this._appData = appData ?? {};
          this.onTrackEnded = this.onTrackEnded.bind(this);
          this.handleTrack();
        }
        /**
         * Producer id.
         */
        get id() {
          return this._id;
        }
        /**
         * Local id.
         */
        get localId() {
          return this._localId;
        }
        /**
         * Whether the Producer is closed.
         */
        get closed() {
          return this._closed;
        }
        /**
         * Media kind.
         */
        get kind() {
          return this._kind;
        }
        /**
         * Associated RTCRtpSender.
         */
        get rtpSender() {
          return this._rtpSender;
        }
        /**
         * The associated track.
         */
        get track() {
          return this._track;
        }
        /**
         * RTP parameters.
         */
        get rtpParameters() {
          return this._rtpParameters;
        }
        /**
         * Whether the Producer is paused.
         */
        get paused() {
          return this._paused;
        }
        /**
         * Max spatial layer.
         *
         * @type {Number | undefined}
         */
        get maxSpatialLayer() {
          return this._maxSpatialLayer;
        }
        /**
         * App custom data.
         */
        get appData() {
          return this._appData;
        }
        /**
         * App custom data setter.
         */
        set appData(appData) {
          this._appData = appData;
        }
        get observer() {
          return this._observer;
        }
        /**
         * Closes the Producer.
         */
        close() {
          if (this._closed) {
            return;
          }
          logger.debug("close()");
          this._closed = true;
          this.destroyTrack();
          this.emit("@close");
          this._observer.safeEmit("close");
          super.close();
          this._observer.close();
        }
        /**
         * Transport was closed.
         */
        transportClosed() {
          if (this._closed) {
            return;
          }
          logger.debug("transportClosed()");
          this._closed = true;
          this.destroyTrack();
          this.safeEmit("transportclose");
          this._observer.safeEmit("close");
        }
        /**
         * Get associated RTCRtpSender stats.
         */
        async getStats() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          }
          return new Promise((resolve, reject) => {
            this.safeEmit("@getstats", resolve, reject);
          });
        }
        /**
         * Pauses sending media.
         */
        pause() {
          logger.debug("pause()");
          if (this._closed) {
            logger.error("pause() | Producer closed");
            return;
          }
          this._paused = true;
          if (this._track && this._disableTrackOnPause) {
            this._track.enabled = false;
          }
          if (this._zeroRtpOnPause) {
            new Promise((resolve, reject) => {
              this.safeEmit("@pause", resolve, reject);
            }).catch(() => {
            });
          }
          this._observer.safeEmit("pause");
        }
        /**
         * Resumes sending media.
         */
        resume() {
          logger.debug("resume()");
          if (this._closed) {
            logger.error("resume() | Producer closed");
            return;
          }
          this._paused = false;
          if (this._track && this._disableTrackOnPause) {
            this._track.enabled = true;
          }
          if (this._zeroRtpOnPause) {
            new Promise((resolve, reject) => {
              this.safeEmit("@resume", resolve, reject);
            }).catch(() => {
            });
          }
          this._observer.safeEmit("resume");
        }
        /**
         * Replaces the current track with a new one or null.
         */
        async replaceTrack({ track }) {
          logger.debug("replaceTrack() [track:%o]", track);
          if (this._closed) {
            if (track && this._stopTracks) {
              try {
                track.stop();
              } catch (error) {
              }
            }
            throw new errors_1.InvalidStateError("closed");
          } else if (track?.readyState === "ended") {
            throw new errors_1.InvalidStateError("track ended");
          }
          if (track === this._track) {
            logger.debug("replaceTrack() | same track, ignored");
            return;
          }
          await new Promise((resolve, reject) => {
            this.safeEmit("@replacetrack", track, resolve, reject);
          });
          this.destroyTrack();
          this._track = track;
          if (this._track && this._disableTrackOnPause) {
            if (!this._paused) {
              this._track.enabled = true;
            } else if (this._paused) {
              this._track.enabled = false;
            }
          }
          this.handleTrack();
        }
        /**
         * Sets the video max spatial layer to be sent.
         */
        async setMaxSpatialLayer(spatialLayer) {
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (this._kind !== "video") {
            throw new errors_1.UnsupportedError("not a video Producer");
          } else if (typeof spatialLayer !== "number") {
            throw new TypeError("invalid spatialLayer");
          }
          if (spatialLayer === this._maxSpatialLayer) {
            return;
          }
          await new Promise((resolve, reject) => {
            this.safeEmit("@setmaxspatiallayer", spatialLayer, resolve, reject);
          }).catch(() => {
          });
          this._maxSpatialLayer = spatialLayer;
        }
        async setRtpEncodingParameters(params) {
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (typeof params !== "object") {
            throw new TypeError("invalid params");
          }
          await new Promise((resolve, reject) => {
            this.safeEmit("@setrtpencodingparameters", params, resolve, reject);
          });
        }
        onTrackEnded() {
          logger.debug('track "ended" event');
          this.safeEmit("trackended");
          this._observer.safeEmit("trackended");
        }
        handleTrack() {
          if (!this._track) {
            return;
          }
          this._track.addEventListener("ended", this.onTrackEnded);
        }
        destroyTrack() {
          if (!this._track) {
            return;
          }
          try {
            this._track.removeEventListener("ended", this.onTrackEnded);
            if (this._stopTracks) {
              this._track.stop();
            }
          } catch (error) {
          }
        }
      };
      exports.Producer = Producer;
    }
  });

  // node_modules/mediasoup-client/lib/Consumer.js
  var require_Consumer = __commonJS({
    "node_modules/mediasoup-client/lib/Consumer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Consumer = void 0;
      var Logger_1 = require_Logger();
      var enhancedEvents_1 = require_enhancedEvents();
      var errors_1 = require_errors();
      var logger = new Logger_1.Logger("Consumer");
      var Consumer = class extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ id, localId, producerId, rtpReceiver, track, rtpParameters, appData }) {
          super();
          // Id.
          __publicField(this, "_id");
          // Local id.
          __publicField(this, "_localId");
          // Associated Producer id.
          __publicField(this, "_producerId");
          // Closed flag.
          __publicField(this, "_closed", false);
          // Associated RTCRtpReceiver.
          __publicField(this, "_rtpReceiver");
          // Remote track.
          __publicField(this, "_track");
          // RTP parameters.
          __publicField(this, "_rtpParameters");
          // Paused flag.
          __publicField(this, "_paused");
          // App custom data.
          __publicField(this, "_appData");
          // Observer instance.
          __publicField(this, "_observer", new enhancedEvents_1.EnhancedEventEmitter());
          logger.debug("constructor()");
          this._id = id;
          this._localId = localId;
          this._producerId = producerId;
          this._rtpReceiver = rtpReceiver;
          this._track = track;
          this._rtpParameters = rtpParameters;
          this._paused = !track.enabled;
          this._appData = appData ?? {};
          this.onTrackEnded = this.onTrackEnded.bind(this);
          this.handleTrack();
        }
        /**
         * Consumer id.
         */
        get id() {
          return this._id;
        }
        /**
         * Local id.
         */
        get localId() {
          return this._localId;
        }
        /**
         * Associated Producer id.
         */
        get producerId() {
          return this._producerId;
        }
        /**
         * Whether the Consumer is closed.
         */
        get closed() {
          return this._closed;
        }
        /**
         * Media kind.
         */
        get kind() {
          return this._track.kind;
        }
        /**
         * Associated RTCRtpReceiver.
         */
        get rtpReceiver() {
          return this._rtpReceiver;
        }
        /**
         * The associated track.
         */
        get track() {
          return this._track;
        }
        /**
         * RTP parameters.
         */
        get rtpParameters() {
          return this._rtpParameters;
        }
        /**
         * Whether the Consumer is paused.
         */
        get paused() {
          return this._paused;
        }
        /**
         * App custom data.
         */
        get appData() {
          return this._appData;
        }
        /**
         * App custom data setter.
         */
        set appData(appData) {
          this._appData = appData;
        }
        get observer() {
          return this._observer;
        }
        /**
         * Closes the Consumer.
         */
        close() {
          if (this._closed) {
            return;
          }
          logger.debug("close()");
          this._closed = true;
          this.destroyTrack();
          this.emit("@close");
          this._observer.safeEmit("close");
          super.close();
          this._observer.close();
        }
        /**
         * Transport was closed.
         */
        transportClosed() {
          if (this._closed) {
            return;
          }
          logger.debug("transportClosed()");
          this._closed = true;
          this.destroyTrack();
          this.safeEmit("transportclose");
          this._observer.safeEmit("close");
        }
        /**
         * Get associated RTCRtpReceiver stats.
         */
        async getStats() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          }
          return new Promise((resolve, reject) => {
            this.safeEmit("@getstats", resolve, reject);
          });
        }
        /**
         * Pauses receiving media.
         */
        pause() {
          logger.debug("pause()");
          if (this._closed) {
            logger.error("pause() | Consumer closed");
            return;
          }
          if (this._paused) {
            logger.debug("pause() | Consumer is already paused");
            return;
          }
          this._paused = true;
          this._track.enabled = false;
          this.emit("@pause");
          this._observer.safeEmit("pause");
        }
        /**
         * Resumes receiving media.
         */
        resume() {
          logger.debug("resume()");
          if (this._closed) {
            logger.error("resume() | Consumer closed");
            return;
          }
          if (!this._paused) {
            logger.debug("resume() | Consumer is already resumed");
            return;
          }
          this._paused = false;
          this._track.enabled = true;
          this.emit("@resume");
          this._observer.safeEmit("resume");
        }
        onTrackEnded() {
          logger.debug('track "ended" event');
          this.safeEmit("trackended");
          this._observer.safeEmit("trackended");
        }
        handleTrack() {
          this._track.addEventListener("ended", this.onTrackEnded);
        }
        destroyTrack() {
          try {
            this._track.removeEventListener("ended", this.onTrackEnded);
            this._track.stop();
          } catch (error) {
          }
        }
      };
      exports.Consumer = Consumer;
    }
  });

  // node_modules/mediasoup-client/lib/DataProducer.js
  var require_DataProducer = __commonJS({
    "node_modules/mediasoup-client/lib/DataProducer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DataProducer = void 0;
      var Logger_1 = require_Logger();
      var enhancedEvents_1 = require_enhancedEvents();
      var errors_1 = require_errors();
      var logger = new Logger_1.Logger("DataProducer");
      var DataProducer = class extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ id, dataChannel, sctpStreamParameters, appData }) {
          super();
          // Id.
          __publicField(this, "_id");
          // The underlying RTCDataChannel instance.
          __publicField(this, "_dataChannel");
          // Closed flag.
          __publicField(this, "_closed", false);
          // SCTP stream parameters.
          __publicField(this, "_sctpStreamParameters");
          // App custom data.
          __publicField(this, "_appData");
          // Observer instance.
          __publicField(this, "_observer", new enhancedEvents_1.EnhancedEventEmitter());
          logger.debug("constructor()");
          this._id = id;
          this._dataChannel = dataChannel;
          this._sctpStreamParameters = sctpStreamParameters;
          this._appData = appData ?? {};
          this.handleDataChannel();
        }
        /**
         * DataProducer id.
         */
        get id() {
          return this._id;
        }
        /**
         * Whether the DataProducer is closed.
         */
        get closed() {
          return this._closed;
        }
        /**
         * SCTP stream parameters.
         */
        get sctpStreamParameters() {
          return this._sctpStreamParameters;
        }
        /**
         * DataChannel readyState.
         */
        get readyState() {
          return this._dataChannel.readyState;
        }
        /**
         * DataChannel label.
         */
        get label() {
          return this._dataChannel.label;
        }
        /**
         * DataChannel protocol.
         */
        get protocol() {
          return this._dataChannel.protocol;
        }
        /**
         * DataChannel bufferedAmount.
         */
        get bufferedAmount() {
          return this._dataChannel.bufferedAmount;
        }
        /**
         * DataChannel bufferedAmountLowThreshold.
         */
        get bufferedAmountLowThreshold() {
          return this._dataChannel.bufferedAmountLowThreshold;
        }
        /**
         * Set DataChannel bufferedAmountLowThreshold.
         */
        set bufferedAmountLowThreshold(bufferedAmountLowThreshold) {
          this._dataChannel.bufferedAmountLowThreshold = bufferedAmountLowThreshold;
        }
        /**
         * App custom data.
         */
        get appData() {
          return this._appData;
        }
        /**
         * App custom data setter.
         */
        set appData(appData) {
          this._appData = appData;
        }
        get observer() {
          return this._observer;
        }
        /**
         * Closes the DataProducer.
         */
        close() {
          if (this._closed) {
            return;
          }
          logger.debug("close()");
          this._closed = true;
          this._dataChannel.close();
          this.emit("@close");
          this._observer.safeEmit("close");
          super.close();
          this._observer.close();
        }
        /**
         * Transport was closed.
         */
        transportClosed() {
          if (this._closed) {
            return;
          }
          logger.debug("transportClosed()");
          this._closed = true;
          this._dataChannel.close();
          this.safeEmit("transportclose");
          this._observer.safeEmit("close");
        }
        /**
         * Send a message.
         *
         * @param {String|Blob|ArrayBuffer|ArrayBufferView} data.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        send(data) {
          logger.debug("send()");
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          }
          this._dataChannel.send(data);
        }
        handleDataChannel() {
          this._dataChannel.addEventListener("open", () => {
            if (this._closed) {
              return;
            }
            logger.debug('DataChannel "open" event');
            this.safeEmit("open");
          });
          this._dataChannel.addEventListener("error", (event) => {
            if (this._closed) {
              return;
            }
            const error = event.error ?? new Error("unknown DataChannel error");
            if (event.error?.errorDetail === "sctp-failure") {
              logger.error("DataChannel SCTP error [sctpCauseCode:%s]: %s", event.error?.sctpCauseCode, event.error.message);
            } else {
              logger.error('DataChannel "error" event: %o', error);
            }
            this.safeEmit("error", error);
          });
          this._dataChannel.addEventListener("close", () => {
            if (this._closed) {
              return;
            }
            logger.warn('DataChannel "close" event');
            this._closed = true;
            this.emit("@close");
            this.safeEmit("close");
            this._observer.safeEmit("close");
          });
          this._dataChannel.addEventListener("message", () => {
            if (this._closed) {
              return;
            }
            logger.warn('DataChannel "message" event in a DataProducer, message discarded');
          });
          this._dataChannel.addEventListener("bufferedamountlow", () => {
            if (this._closed) {
              return;
            }
            this.safeEmit("bufferedamountlow");
          });
        }
      };
      exports.DataProducer = DataProducer;
    }
  });

  // node_modules/mediasoup-client/lib/DataConsumer.js
  var require_DataConsumer = __commonJS({
    "node_modules/mediasoup-client/lib/DataConsumer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.DataConsumer = void 0;
      var Logger_1 = require_Logger();
      var enhancedEvents_1 = require_enhancedEvents();
      var logger = new Logger_1.Logger("DataConsumer");
      var DataConsumer = class extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ id, dataProducerId, dataChannel, sctpStreamParameters, appData }) {
          super();
          // Id.
          __publicField(this, "_id");
          // Associated DataProducer Id.
          __publicField(this, "_dataProducerId");
          // The underlying RTCDataChannel instance.
          __publicField(this, "_dataChannel");
          // Closed flag.
          __publicField(this, "_closed", false);
          // SCTP stream parameters.
          __publicField(this, "_sctpStreamParameters");
          // App custom data.
          __publicField(this, "_appData");
          // Observer instance.
          __publicField(this, "_observer", new enhancedEvents_1.EnhancedEventEmitter());
          logger.debug("constructor()");
          this._id = id;
          this._dataProducerId = dataProducerId;
          this._dataChannel = dataChannel;
          this._sctpStreamParameters = sctpStreamParameters;
          this._appData = appData ?? {};
          this.handleDataChannel();
        }
        /**
         * DataConsumer id.
         */
        get id() {
          return this._id;
        }
        /**
         * Associated DataProducer id.
         */
        get dataProducerId() {
          return this._dataProducerId;
        }
        /**
         * Whether the DataConsumer is closed.
         */
        get closed() {
          return this._closed;
        }
        /**
         * SCTP stream parameters.
         */
        get sctpStreamParameters() {
          return this._sctpStreamParameters;
        }
        /**
         * DataChannel readyState.
         */
        get readyState() {
          return this._dataChannel.readyState;
        }
        /**
         * DataChannel label.
         */
        get label() {
          return this._dataChannel.label;
        }
        /**
         * DataChannel protocol.
         */
        get protocol() {
          return this._dataChannel.protocol;
        }
        /**
         * DataChannel binaryType.
         */
        get binaryType() {
          return this._dataChannel.binaryType;
        }
        /**
         * Set DataChannel binaryType.
         */
        set binaryType(binaryType) {
          this._dataChannel.binaryType = binaryType;
        }
        /**
         * App custom data.
         */
        get appData() {
          return this._appData;
        }
        /**
         * App custom data setter.
         */
        set appData(appData) {
          this._appData = appData;
        }
        get observer() {
          return this._observer;
        }
        /**
         * Closes the DataConsumer.
         */
        close() {
          if (this._closed) {
            return;
          }
          logger.debug("close()");
          this._closed = true;
          this._dataChannel.close();
          this.emit("@close");
          this._observer.safeEmit("close");
          super.close();
          this._observer.close();
        }
        /**
         * Transport was closed.
         */
        transportClosed() {
          if (this._closed) {
            return;
          }
          logger.debug("transportClosed()");
          this._closed = true;
          this._dataChannel.close();
          this.safeEmit("transportclose");
          this._observer.safeEmit("close");
        }
        handleDataChannel() {
          this._dataChannel.addEventListener("open", () => {
            if (this._closed) {
              return;
            }
            logger.debug('DataChannel "open" event');
            this.safeEmit("open");
          });
          this._dataChannel.addEventListener("error", (event) => {
            if (this._closed) {
              return;
            }
            const error = event.error ?? new Error("unknown DataChannel error");
            if (event.error?.errorDetail === "sctp-failure") {
              logger.error("DataChannel SCTP error [sctpCauseCode:%s]: %s", event.error?.sctpCauseCode, event.error.message);
            } else {
              logger.error('DataChannel "error" event: %o', error);
            }
            this.safeEmit("error", error);
          });
          this._dataChannel.addEventListener("close", () => {
            if (this._closed) {
              return;
            }
            logger.warn('DataChannel "close" event');
            this._closed = true;
            this.emit("@close");
            this.safeEmit("close");
            this._observer.safeEmit("close");
          });
          this._dataChannel.addEventListener("message", (event) => {
            if (this._closed) {
              return;
            }
            this.safeEmit("message", event.data);
          });
        }
      };
      exports.DataConsumer = DataConsumer;
    }
  });

  // node_modules/mediasoup-client/lib/Transport.js
  var require_Transport = __commonJS({
    "node_modules/mediasoup-client/lib/Transport.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Transport = void 0;
      var awaitqueue_1 = require_lib2();
      var Logger_1 = require_Logger();
      var enhancedEvents_1 = require_enhancedEvents();
      var errors_1 = require_errors();
      var utils = require_utils();
      var ortc = require_ortc();
      var Producer_1 = require_Producer();
      var Consumer_1 = require_Consumer();
      var DataProducer_1 = require_DataProducer();
      var DataConsumer_1 = require_DataConsumer();
      var logger = new Logger_1.Logger("Transport");
      var ConsumerCreationTask = class {
        constructor(consumerOptions) {
          __publicField(this, "consumerOptions");
          __publicField(this, "promise");
          __publicField(this, "resolve");
          __publicField(this, "reject");
          this.consumerOptions = consumerOptions;
          this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
          });
        }
      };
      var Transport2 = class extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ direction, id, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, appData, handlerFactory, getSendExtendedRtpCapabilities, recvRtpCapabilities, canProduceByKind }) {
          super();
          // Id.
          __publicField(this, "_id");
          // Closed flag.
          __publicField(this, "_closed", false);
          // Direction.
          __publicField(this, "_direction");
          // Callback for sending Transports to request sending extended RTP capabilities
          // on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // Recv RTP capabilities.
          __publicField(this, "_recvRtpCapabilities");
          // Whether we can produce audio/video based on computed extended RTP
          // capabilities.
          __publicField(this, "_canProduceByKind");
          // SCTP max message size if enabled, null otherwise.
          __publicField(this, "_maxSctpMessageSize");
          // RTC handler isntance.
          __publicField(this, "_handler");
          // Transport ICE gathering state.
          __publicField(this, "_iceGatheringState", "new");
          // Transport connection state.
          __publicField(this, "_connectionState", "new");
          // App custom data.
          __publicField(this, "_appData");
          // Map of Producers indexed by id.
          __publicField(this, "_producers", /* @__PURE__ */ new Map());
          // Map of Consumers indexed by id.
          __publicField(this, "_consumers", /* @__PURE__ */ new Map());
          // Map of DataProducers indexed by id.
          __publicField(this, "_dataProducers", /* @__PURE__ */ new Map());
          // Map of DataConsumers indexed by id.
          __publicField(this, "_dataConsumers", /* @__PURE__ */ new Map());
          // Whether the Consumer for RTP probation has been created.
          __publicField(this, "_probatorConsumerCreated", false);
          // AwaitQueue instance to make async tasks happen sequentially.
          __publicField(this, "_awaitQueue", new awaitqueue_1.AwaitQueue());
          // Consumer creation tasks awaiting to be processed.
          __publicField(this, "_pendingConsumerTasks", []);
          // Consumer creation in progress flag.
          __publicField(this, "_consumerCreationInProgress", false);
          // Consumers pending to be paused.
          __publicField(this, "_pendingPauseConsumers", /* @__PURE__ */ new Map());
          // Consumer pause in progress flag.
          __publicField(this, "_consumerPauseInProgress", false);
          // Consumers pending to be resumed.
          __publicField(this, "_pendingResumeConsumers", /* @__PURE__ */ new Map());
          // Consumer resume in progress flag.
          __publicField(this, "_consumerResumeInProgress", false);
          // Consumers pending to be closed.
          __publicField(this, "_pendingCloseConsumers", /* @__PURE__ */ new Map());
          // Consumer close in progress flag.
          __publicField(this, "_consumerCloseInProgress", false);
          // Observer instance.
          __publicField(this, "_observer", new enhancedEvents_1.EnhancedEventEmitter());
          logger.debug("constructor() [id:%s, direction:%s]", id, direction);
          this._id = id;
          this._direction = direction;
          this._getSendExtendedRtpCapabilities = getSendExtendedRtpCapabilities;
          this._recvRtpCapabilities = recvRtpCapabilities;
          this._canProduceByKind = canProduceByKind;
          this._maxSctpMessageSize = sctpParameters ? sctpParameters.maxMessageSize : null;
          const clonedAdditionalSettings = utils.clone(additionalSettings) ?? {};
          delete clonedAdditionalSettings.iceServers;
          delete clonedAdditionalSettings.iceTransportPolicy;
          delete clonedAdditionalSettings.bundlePolicy;
          delete clonedAdditionalSettings.rtcpMuxPolicy;
          this._handler = handlerFactory.factory({
            direction,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
            iceServers,
            iceTransportPolicy,
            additionalSettings: clonedAdditionalSettings,
            getSendExtendedRtpCapabilities: this._getSendExtendedRtpCapabilities
          });
          this._appData = appData ?? {};
          this.handleHandler();
        }
        /**
         * Transport id.
         */
        get id() {
          return this._id;
        }
        /**
         * Whether the Transport is closed.
         */
        get closed() {
          return this._closed;
        }
        /**
         * Transport direction.
         */
        get direction() {
          return this._direction;
        }
        /**
         * RTC handler instance.
         */
        get handler() {
          return this._handler;
        }
        /**
         * ICE gathering state.
         */
        get iceGatheringState() {
          return this._iceGatheringState;
        }
        /**
         * Connection state.
         */
        get connectionState() {
          return this._connectionState;
        }
        /**
         * App custom data.
         */
        get appData() {
          return this._appData;
        }
        /**
         * App custom data setter.
         */
        set appData(appData) {
          this._appData = appData;
        }
        get observer() {
          return this._observer;
        }
        /**
         * Close the Transport.
         */
        close() {
          if (this._closed) {
            return;
          }
          logger.debug("close()");
          this._closed = true;
          this._awaitQueue.stop();
          this._handler.close();
          this._connectionState = "closed";
          for (const producer of this._producers.values()) {
            producer.transportClosed();
          }
          this._producers.clear();
          for (const consumer of this._consumers.values()) {
            consumer.transportClosed();
          }
          this._consumers.clear();
          for (const dataProducer of this._dataProducers.values()) {
            dataProducer.transportClosed();
          }
          this._dataProducers.clear();
          for (const dataConsumer of this._dataConsumers.values()) {
            dataConsumer.transportClosed();
          }
          this._dataConsumers.clear();
          this._observer.safeEmit("close");
          super.close();
          this._observer.close();
        }
        /**
         * Get associated Transport (RTCPeerConnection) stats.
         *
         * @returns {RTCStatsReport}
         */
        async getStats() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          }
          return this._handler.getTransportStats();
        }
        /**
         * Restart ICE connection.
         */
        async restartIce({ iceParameters }) {
          logger.debug("restartIce()");
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (!iceParameters) {
            throw new TypeError("missing iceParameters");
          }
          return this._awaitQueue.push(async () => await this._handler.restartIce(iceParameters), "transport.restartIce()");
        }
        /**
         * Update ICE servers.
         */
        async updateIceServers({ iceServers } = {}) {
          logger.debug("updateIceServers()");
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (!Array.isArray(iceServers)) {
            throw new TypeError("missing iceServers");
          }
          return this._awaitQueue.push(async () => this._handler.updateIceServers(iceServers), "transport.updateIceServers()");
        }
        /**
         * Create a Producer.
         */
        async produce({ track, streamId, encodings, codecOptions, headerExtensionOptions, codec, stopTracks = true, disableTrackOnPause = true, zeroRtpOnPause = false, onRtpSender, appData = {} } = {}) {
          logger.debug("produce() [track:%o]", track);
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (!track) {
            throw new TypeError("missing track");
          } else if (this._direction !== "send") {
            throw new errors_1.UnsupportedError("not a sending Transport");
          } else if (!this._canProduceByKind[track.kind]) {
            throw new errors_1.UnsupportedError(`cannot produce ${track.kind}`);
          } else if (track.readyState === "ended") {
            throw new errors_1.InvalidStateError("track ended");
          } else if (this.listenerCount("connect") === 0 && this._connectionState === "new") {
            throw new TypeError('no "connect" listener set into this transport');
          } else if (this.listenerCount("produce") === 0) {
            throw new TypeError('no "produce" listener set into this transport');
          } else if (appData && typeof appData !== "object") {
            throw new TypeError("if given, appData must be an object");
          }
          return this._awaitQueue.push(async () => {
            let normalizedEncodings;
            if (encodings && !Array.isArray(encodings)) {
              throw TypeError("encodings must be an array");
            } else if (encodings?.length === 0) {
              normalizedEncodings = void 0;
            } else if (encodings) {
              normalizedEncodings = encodings.map((encoding) => {
                const normalizedEncoding = {
                  active: true
                };
                if (encoding.active === false) {
                  normalizedEncoding.active = false;
                }
                if (typeof encoding.dtx === "boolean") {
                  normalizedEncoding.dtx = encoding.dtx;
                }
                if (typeof encoding.scalabilityMode === "string") {
                  normalizedEncoding.scalabilityMode = encoding.scalabilityMode;
                }
                if (typeof encoding.scaleResolutionDownBy === "number") {
                  normalizedEncoding.scaleResolutionDownBy = encoding.scaleResolutionDownBy;
                }
                if (typeof encoding.maxBitrate === "number") {
                  normalizedEncoding.maxBitrate = encoding.maxBitrate;
                }
                if (typeof encoding.maxFramerate === "number") {
                  normalizedEncoding.maxFramerate = encoding.maxFramerate;
                }
                if (typeof encoding.adaptivePtime === "boolean") {
                  normalizedEncoding.adaptivePtime = encoding.adaptivePtime;
                }
                if (typeof encoding.priority === "string") {
                  normalizedEncoding.priority = encoding.priority;
                }
                if (typeof encoding.networkPriority === "string") {
                  normalizedEncoding.networkPriority = encoding.networkPriority;
                }
                return normalizedEncoding;
              });
            }
            const { localId, rtpParameters, rtpSender } = await this._handler.send({
              track,
              streamId,
              encodings: normalizedEncodings,
              codecOptions,
              headerExtensionOptions,
              codec,
              onRtpSender
            });
            try {
              ortc.validateAndNormalizeRtpParameters(rtpParameters);
              const { id } = await new Promise((resolve, reject) => {
                this.safeEmit("produce", {
                  kind: track.kind,
                  rtpParameters,
                  appData
                }, resolve, reject);
              });
              const producer = new Producer_1.Producer({
                id,
                localId,
                rtpSender,
                track,
                rtpParameters,
                stopTracks,
                disableTrackOnPause,
                zeroRtpOnPause,
                appData
              });
              this._producers.set(producer.id, producer);
              this.handleProducer(producer);
              this._observer.safeEmit("newproducer", producer);
              return producer;
            } catch (error) {
              this._handler.stopSending(localId).catch(() => {
              });
              throw error;
            }
          }, "transport.produce()").catch((error) => {
            if (stopTracks) {
              try {
                track.stop();
              } catch (error2) {
              }
            }
            throw error;
          });
        }
        /**
         * Create a Consumer to consume a remote Producer.
         */
        async consume({ id, producerId, kind, rtpParameters, streamId, onRtpReceiver, appData = {} }) {
          logger.debug("consume()");
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (this._direction !== "recv") {
            throw new errors_1.UnsupportedError("not a receiving Transport");
          } else if (typeof id !== "string") {
            throw new TypeError("missing id");
          } else if (typeof producerId !== "string") {
            throw new TypeError("missing producerId");
          } else if (kind !== "audio" && kind !== "video") {
            throw new TypeError(`invalid kind '${kind}'`);
          } else if (this.listenerCount("connect") === 0 && this._connectionState === "new") {
            throw new TypeError('no "connect" listener set into this transport');
          } else if (appData && typeof appData !== "object") {
            throw new TypeError("if given, appData must be an object");
          }
          const clonedRtpParameters = utils.clone(rtpParameters);
          const canConsume = ortc.canReceive(clonedRtpParameters, this._recvRtpCapabilities);
          if (!canConsume) {
            throw new errors_1.UnsupportedError("cannot consume this Producer");
          }
          const consumerCreationTask = new ConsumerCreationTask({
            id,
            producerId,
            kind,
            rtpParameters: clonedRtpParameters,
            streamId,
            onRtpReceiver,
            appData
          });
          this._pendingConsumerTasks.push(consumerCreationTask);
          queueMicrotask(() => {
            if (this._closed) {
              return;
            }
            if (this._consumerCreationInProgress === false) {
              this.createPendingConsumers();
            }
          });
          return consumerCreationTask.promise;
        }
        /**
         * Create a DataProducer
         */
        async produceData({ ordered = true, maxPacketLifeTime, maxRetransmits, label = "", protocol: protocol4 = "", appData = {} } = {}) {
          logger.debug("produceData()");
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (this._direction !== "send") {
            throw new errors_1.UnsupportedError("not a sending Transport");
          } else if (!this._maxSctpMessageSize) {
            throw new errors_1.UnsupportedError("SCTP not enabled by remote Transport");
          } else if (this.listenerCount("connect") === 0 && this._connectionState === "new") {
            throw new TypeError('no "connect" listener set into this transport');
          } else if (this.listenerCount("producedata") === 0) {
            throw new TypeError('no "producedata" listener set into this transport');
          } else if (appData && typeof appData !== "object") {
            throw new TypeError("if given, appData must be an object");
          }
          if (maxPacketLifeTime || maxRetransmits) {
            ordered = false;
          }
          return this._awaitQueue.push(async () => {
            const { dataChannel, sctpStreamParameters } = await this._handler.sendDataChannel({
              ordered,
              maxPacketLifeTime,
              maxRetransmits,
              label,
              protocol: protocol4
            });
            ortc.validateAndNormalizeSctpStreamParameters(sctpStreamParameters);
            const { id } = await new Promise((resolve, reject) => {
              this.safeEmit("producedata", {
                sctpStreamParameters,
                label,
                protocol: protocol4,
                appData
              }, resolve, reject);
            });
            const dataProducer = new DataProducer_1.DataProducer({
              id,
              dataChannel,
              sctpStreamParameters,
              appData
            });
            this._dataProducers.set(dataProducer.id, dataProducer);
            this.handleDataProducer(dataProducer);
            this._observer.safeEmit("newdataproducer", dataProducer);
            return dataProducer;
          }, "transport.produceData()");
        }
        /**
         * Create a DataConsumer
         */
        async consumeData({ id, dataProducerId, sctpStreamParameters, label = "", protocol: protocol4 = "", appData = {} }) {
          logger.debug("consumeData()");
          if (this._closed) {
            throw new errors_1.InvalidStateError("closed");
          } else if (this._direction !== "recv") {
            throw new errors_1.UnsupportedError("not a receiving Transport");
          } else if (!this._maxSctpMessageSize) {
            throw new errors_1.UnsupportedError("SCTP not enabled by remote Transport");
          } else if (typeof id !== "string") {
            throw new TypeError("missing id");
          } else if (typeof dataProducerId !== "string") {
            throw new TypeError("missing dataProducerId");
          } else if (this.listenerCount("connect") === 0 && this._connectionState === "new") {
            throw new TypeError('no "connect" listener set into this transport');
          } else if (appData && typeof appData !== "object") {
            throw new TypeError("if given, appData must be an object");
          }
          const clonedSctpStreamParameters = utils.clone(sctpStreamParameters);
          ortc.validateAndNormalizeSctpStreamParameters(clonedSctpStreamParameters);
          return this._awaitQueue.push(async () => {
            const { dataChannel } = await this._handler.receiveDataChannel({
              sctpStreamParameters: clonedSctpStreamParameters,
              label,
              protocol: protocol4
            });
            const dataConsumer = new DataConsumer_1.DataConsumer({
              id,
              dataProducerId,
              dataChannel,
              sctpStreamParameters: clonedSctpStreamParameters,
              appData
            });
            this._dataConsumers.set(dataConsumer.id, dataConsumer);
            this.handleDataConsumer(dataConsumer);
            this._observer.safeEmit("newdataconsumer", dataConsumer);
            return dataConsumer;
          }, "transport.consumeData()");
        }
        // This method is guaranteed to never throw.
        createPendingConsumers() {
          this._consumerCreationInProgress = true;
          this._awaitQueue.push(async () => {
            if (this._pendingConsumerTasks.length === 0) {
              logger.debug("createPendingConsumers() | there is no Consumer to be created");
              return;
            }
            const pendingConsumerTasks = [...this._pendingConsumerTasks];
            this._pendingConsumerTasks = [];
            let videoConsumerForProbator = void 0;
            const optionsList = [];
            for (const task of pendingConsumerTasks) {
              const { id, kind, rtpParameters, streamId, onRtpReceiver } = task.consumerOptions;
              optionsList.push({
                trackId: id,
                kind,
                rtpParameters,
                streamId,
                onRtpReceiver
              });
            }
            try {
              const results = await this._handler.receive(optionsList);
              for (let idx = 0; idx < results.length; ++idx) {
                const task = pendingConsumerTasks[idx];
                const result = results[idx];
                const { id, producerId, kind, rtpParameters, appData } = task.consumerOptions;
                const { localId, rtpReceiver, track } = result;
                const consumer = new Consumer_1.Consumer({
                  id,
                  localId,
                  producerId,
                  rtpReceiver,
                  track,
                  rtpParameters,
                  appData
                });
                this._consumers.set(consumer.id, consumer);
                this.handleConsumer(consumer);
                if (!this._probatorConsumerCreated && !videoConsumerForProbator && kind === "video") {
                  videoConsumerForProbator = consumer;
                }
                this._observer.safeEmit("newconsumer", consumer);
                task.resolve(consumer);
              }
            } catch (error) {
              for (const task of pendingConsumerTasks) {
                task.reject(error);
              }
            }
            if (videoConsumerForProbator) {
              try {
                const probatorRtpParameters = ortc.generateProbatorRtpParameters(videoConsumerForProbator.rtpParameters);
                await this._handler.receive([
                  {
                    trackId: "probator",
                    kind: "video",
                    rtpParameters: probatorRtpParameters
                  }
                ]);
                logger.debug("createPendingConsumers() | Consumer for RTP probation created");
                this._probatorConsumerCreated = true;
              } catch (error) {
                logger.error("createPendingConsumers() | failed to create Consumer for RTP probation:%o", error);
              }
            }
          }, "transport.createPendingConsumers()").then(() => {
            this._consumerCreationInProgress = false;
            if (this._pendingConsumerTasks.length > 0) {
              this.createPendingConsumers();
            }
          }).catch(() => {
          });
        }
        pausePendingConsumers() {
          this._consumerPauseInProgress = true;
          this._awaitQueue.push(async () => {
            if (this._pendingPauseConsumers.size === 0) {
              logger.debug("pausePendingConsumers() | there is no Consumer to be paused");
              return;
            }
            const pendingPauseConsumers = Array.from(this._pendingPauseConsumers.values());
            this._pendingPauseConsumers.clear();
            try {
              const localIds = pendingPauseConsumers.map((consumer) => consumer.localId);
              await this._handler.pauseReceiving(localIds);
            } catch (error) {
              logger.error("pausePendingConsumers() | failed to pause Consumers:", error);
            }
          }, "transport.pausePendingConsumers()").then(() => {
            this._consumerPauseInProgress = false;
            if (this._pendingPauseConsumers.size > 0) {
              this.pausePendingConsumers();
            }
          }).catch(() => {
          });
        }
        resumePendingConsumers() {
          this._consumerResumeInProgress = true;
          this._awaitQueue.push(async () => {
            if (this._pendingResumeConsumers.size === 0) {
              logger.debug("resumePendingConsumers() | there is no Consumer to be resumed");
              return;
            }
            const pendingResumeConsumers = Array.from(this._pendingResumeConsumers.values());
            this._pendingResumeConsumers.clear();
            try {
              const localIds = pendingResumeConsumers.map((consumer) => consumer.localId);
              await this._handler.resumeReceiving(localIds);
            } catch (error) {
              logger.error("resumePendingConsumers() | failed to resume Consumers:", error);
            }
          }, "transport.resumePendingConsumers()").then(() => {
            this._consumerResumeInProgress = false;
            if (this._pendingResumeConsumers.size > 0) {
              this.resumePendingConsumers();
            }
          }).catch(() => {
          });
        }
        closePendingConsumers() {
          this._consumerCloseInProgress = true;
          this._awaitQueue.push(async () => {
            if (this._pendingCloseConsumers.size === 0) {
              logger.debug("closePendingConsumers() | there is no Consumer to be closed");
              return;
            }
            const pendingCloseConsumers = Array.from(this._pendingCloseConsumers.values());
            this._pendingCloseConsumers.clear();
            try {
              await this._handler.stopReceiving(pendingCloseConsumers.map((consumer) => consumer.localId));
            } catch (error) {
              logger.error("closePendingConsumers() | failed to close Consumers:", error);
            }
          }, "transport.closePendingConsumers()").then(() => {
            this._consumerCloseInProgress = false;
            if (this._pendingCloseConsumers.size > 0) {
              this.closePendingConsumers();
            }
          }).catch(() => {
          });
        }
        handleHandler() {
          const handler = this._handler;
          handler.on("@connect", ({ dtlsParameters }, callback, errback) => {
            if (this._closed) {
              errback(new errors_1.InvalidStateError("closed"));
              return;
            }
            this.safeEmit("connect", { dtlsParameters }, callback, errback);
          });
          handler.on("@icegatheringstatechange", (iceGatheringState) => {
            if (iceGatheringState === this._iceGatheringState) {
              return;
            }
            logger.debug("ICE gathering state changed to %s", iceGatheringState);
            this._iceGatheringState = iceGatheringState;
            if (!this._closed) {
              this.safeEmit("icegatheringstatechange", iceGatheringState);
            }
          });
          handler.on("@icecandidateerror", (event) => {
            logger.warn(`ICE candidate error [url:${event.url}, localAddress:${event.address}, localPort:${event.port}]: ${event.errorCode} "${event.errorText}"`);
            this.safeEmit("icecandidateerror", event);
          });
          handler.on("@connectionstatechange", (connectionState) => {
            if (connectionState === this._connectionState) {
              return;
            }
            logger.debug("connection state changed to %s", connectionState);
            this._connectionState = connectionState;
            if (!this._closed) {
              this.safeEmit("connectionstatechange", connectionState);
            }
          });
        }
        handleProducer(producer) {
          producer.on("@close", () => {
            this._producers.delete(producer.id);
            if (this._closed) {
              return;
            }
            this._awaitQueue.push(async () => await this._handler.stopSending(producer.localId), "producer @close event").catch((error) => logger.warn("producer.close() failed:%o", error));
          });
          producer.on("@pause", (callback, errback) => {
            this._awaitQueue.push(async () => await this._handler.pauseSending(producer.localId), "producer @pause event").then(callback).catch(errback);
          });
          producer.on("@resume", (callback, errback) => {
            this._awaitQueue.push(async () => await this._handler.resumeSending(producer.localId), "producer @resume event").then(callback).catch(errback);
          });
          producer.on("@replacetrack", (track, callback, errback) => {
            this._awaitQueue.push(async () => await this._handler.replaceTrack(producer.localId, track), "producer @replacetrack event").then(callback).catch(errback);
          });
          producer.on("@setmaxspatiallayer", (spatialLayer, callback, errback) => {
            this._awaitQueue.push(async () => await this._handler.setMaxSpatialLayer(producer.localId, spatialLayer), "producer @setmaxspatiallayer event").then(callback).catch(errback);
          });
          producer.on("@setrtpencodingparameters", (params, callback, errback) => {
            this._awaitQueue.push(async () => await this._handler.setRtpEncodingParameters(producer.localId, params), "producer @setrtpencodingparameters event").then(callback).catch(errback);
          });
          producer.on("@getstats", (callback, errback) => {
            if (this._closed) {
              return errback(new errors_1.InvalidStateError("closed"));
            }
            this._handler.getSenderStats(producer.localId).then(callback).catch(errback);
          });
        }
        handleConsumer(consumer) {
          consumer.on("@close", () => {
            this._consumers.delete(consumer.id);
            this._pendingPauseConsumers.delete(consumer.id);
            this._pendingResumeConsumers.delete(consumer.id);
            if (this._closed) {
              return;
            }
            this._pendingCloseConsumers.set(consumer.id, consumer);
            if (this._consumerCloseInProgress === false) {
              this.closePendingConsumers();
            }
          });
          consumer.on("@pause", () => {
            if (this._pendingResumeConsumers.has(consumer.id)) {
              this._pendingResumeConsumers.delete(consumer.id);
            }
            this._pendingPauseConsumers.set(consumer.id, consumer);
            queueMicrotask(() => {
              if (this._closed) {
                return;
              }
              if (this._consumerPauseInProgress === false) {
                this.pausePendingConsumers();
              }
            });
          });
          consumer.on("@resume", () => {
            if (this._pendingPauseConsumers.has(consumer.id)) {
              this._pendingPauseConsumers.delete(consumer.id);
            }
            this._pendingResumeConsumers.set(consumer.id, consumer);
            queueMicrotask(() => {
              if (this._closed) {
                return;
              }
              if (this._consumerResumeInProgress === false) {
                this.resumePendingConsumers();
              }
            });
          });
          consumer.on("@getstats", (callback, errback) => {
            if (this._closed) {
              return errback(new errors_1.InvalidStateError("closed"));
            }
            this._handler.getReceiverStats(consumer.localId).then(callback).catch(errback);
          });
        }
        handleDataProducer(dataProducer) {
          dataProducer.on("@close", () => {
            this._dataProducers.delete(dataProducer.id);
          });
        }
        handleDataConsumer(dataConsumer) {
          dataConsumer.on("@close", () => {
            this._dataConsumers.delete(dataConsumer.id);
          });
        }
      };
      exports.Transport = Transport2;
    }
  });

  // node_modules/sdp-transform/lib/grammar.js
  var require_grammar = __commonJS({
    "node_modules/sdp-transform/lib/grammar.js"(exports, module) {
      var grammar = module.exports = {
        v: [{
          name: "version",
          reg: /^(\d*)$/
        }],
        o: [{
          // o=- 20518 0 IN IP4 203.0.113.1
          // NB: sessionId will be a String in most cases because it is huge
          name: "origin",
          reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
          names: ["username", "sessionId", "sessionVersion", "netType", "ipVer", "address"],
          format: "%s %s %d %s IP%d %s"
        }],
        // default parsing of these only (though some of these feel outdated)
        s: [{ name: "name" }],
        i: [{ name: "description" }],
        u: [{ name: "uri" }],
        e: [{ name: "email" }],
        p: [{ name: "phone" }],
        z: [{ name: "timezones" }],
        // TODO: this one can actually be parsed properly...
        r: [{ name: "repeats" }],
        // TODO: this one can also be parsed properly
        // k: [{}], // outdated thing ignored
        t: [{
          // t=0 0
          name: "timing",
          reg: /^(\d*) (\d*)/,
          names: ["start", "stop"],
          format: "%d %d"
        }],
        c: [{
          // c=IN IP4 10.47.197.26
          name: "connection",
          reg: /^IN IP(\d) (\S*)/,
          names: ["version", "ip"],
          format: "IN IP%d %s"
        }],
        b: [{
          // b=AS:4000
          push: "bandwidth",
          reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
          names: ["type", "limit"],
          format: "%s:%s"
        }],
        m: [{
          // m=video 51744 RTP/AVP 126 97 98 34 31
          // NB: special - pushes to session
          // TODO: rtp/fmtp should be filtered by the payloads found here?
          reg: /^(\w*) (\d*) ([\w/]*)(?: (.*))?/,
          names: ["type", "port", "protocol", "payloads"],
          format: "%s %d %s %s"
        }],
        a: [
          {
            // a=rtpmap:110 opus/48000/2
            push: "rtp",
            reg: /^rtpmap:(\d*) ([\w\-.]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
            names: ["payload", "codec", "rate", "encoding"],
            format: function(o) {
              return o.encoding ? "rtpmap:%d %s/%s/%s" : o.rate ? "rtpmap:%d %s/%s" : "rtpmap:%d %s";
            }
          },
          {
            // a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
            // a=fmtp:111 minptime=10; useinbandfec=1
            push: "fmtp",
            reg: /^fmtp:(\d*) ([\S| ]*)/,
            names: ["payload", "config"],
            format: "fmtp:%d %s"
          },
          {
            // a=control:streamid=0
            name: "control",
            reg: /^control:(.*)/,
            format: "control:%s"
          },
          {
            // a=rtcp:65179 IN IP4 193.84.77.194
            name: "rtcp",
            reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
            names: ["port", "netType", "ipVer", "address"],
            format: function(o) {
              return o.address != null ? "rtcp:%d %s IP%d %s" : "rtcp:%d";
            }
          },
          {
            // a=rtcp-fb:98 trr-int 100
            push: "rtcpFbTrrInt",
            reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
            names: ["payload", "value"],
            format: "rtcp-fb:%s trr-int %d"
          },
          {
            // a=rtcp-fb:98 nack rpsi
            push: "rtcpFb",
            reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
            names: ["payload", "type", "subtype"],
            format: function(o) {
              return o.subtype != null ? "rtcp-fb:%s %s %s" : "rtcp-fb:%s %s";
            }
          },
          {
            // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
            // a=extmap:1/recvonly URI-gps-string
            // a=extmap:3 urn:ietf:params:rtp-hdrext:encrypt urn:ietf:params:rtp-hdrext:smpte-tc 25@600/24
            push: "ext",
            reg: /^extmap:(\d+)(?:\/(\w+))?(?: (urn:ietf:params:rtp-hdrext:encrypt))? (\S*)(?: (\S*))?/,
            names: ["value", "direction", "encrypt-uri", "uri", "config"],
            format: function(o) {
              return "extmap:%d" + (o.direction ? "/%s" : "%v") + (o["encrypt-uri"] ? " %s" : "%v") + " %s" + (o.config ? " %s" : "");
            }
          },
          {
            // a=extmap-allow-mixed
            name: "extmapAllowMixed",
            reg: /^(extmap-allow-mixed)/
          },
          {
            // a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
            push: "crypto",
            reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
            names: ["id", "suite", "config", "sessionConfig"],
            format: function(o) {
              return o.sessionConfig != null ? "crypto:%d %s %s %s" : "crypto:%d %s %s";
            }
          },
          {
            // a=setup:actpass
            name: "setup",
            reg: /^setup:(\w*)/,
            format: "setup:%s"
          },
          {
            // a=connection:new
            name: "connectionType",
            reg: /^connection:(new|existing)/,
            format: "connection:%s"
          },
          {
            // a=mid:1
            name: "mid",
            reg: /^mid:([^\s]*)/,
            format: "mid:%s"
          },
          {
            // a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
            push: "msid",
            reg: /^msid:([\w-]+)(?: ([\w-]+))?/,
            names: ["id", "appdata"],
            format: "msid:%s %s"
          },
          {
            // a=ptime:20
            name: "ptime",
            reg: /^ptime:(\d*(?:\.\d*)*)/,
            format: "ptime:%d"
          },
          {
            // a=maxptime:60
            name: "maxptime",
            reg: /^maxptime:(\d*(?:\.\d*)*)/,
            format: "maxptime:%d"
          },
          {
            // a=sendrecv
            name: "direction",
            reg: /^(sendrecv|recvonly|sendonly|inactive)/
          },
          {
            // a=ice-lite
            name: "icelite",
            reg: /^(ice-lite)/
          },
          {
            // a=ice-ufrag:F7gI
            name: "iceUfrag",
            reg: /^ice-ufrag:(\S*)/,
            format: "ice-ufrag:%s"
          },
          {
            // a=ice-pwd:x9cml/YzichV2+XlhiMu8g
            name: "icePwd",
            reg: /^ice-pwd:(\S*)/,
            format: "ice-pwd:%s"
          },
          {
            // a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
            name: "fingerprint",
            reg: /^fingerprint:(\S*) (\S*)/,
            names: ["type", "hash"],
            format: "fingerprint:%s %s"
          },
          {
            // a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
            // a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0 network-id 3 network-cost 10
            // a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0 network-id 3 network-cost 10
            // a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0 network-id 3 network-cost 10
            // a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0 network-id 3 network-cost 10
            push: "candidates",
            reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?(?: network-id (\d*))?(?: network-cost (\d*))?/,
            names: ["foundation", "component", "transport", "priority", "ip", "port", "type", "raddr", "rport", "tcptype", "generation", "network-id", "network-cost"],
            format: function(o) {
              var str = "candidate:%s %d %s %d %s %d typ %s";
              str += o.raddr != null ? " raddr %s rport %d" : "%v%v";
              str += o.tcptype != null ? " tcptype %s" : "%v";
              if (o.generation != null) {
                str += " generation %d";
              }
              str += o["network-id"] != null ? " network-id %d" : "%v";
              str += o["network-cost"] != null ? " network-cost %d" : "%v";
              return str;
            }
          },
          {
            // a=end-of-candidates (keep after the candidates line for readability)
            name: "endOfCandidates",
            reg: /^(end-of-candidates)/
          },
          {
            // a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
            name: "remoteCandidates",
            reg: /^remote-candidates:(.*)/,
            format: "remote-candidates:%s"
          },
          {
            // a=ice-options:google-ice
            name: "iceOptions",
            reg: /^ice-options:(\S*)/,
            format: "ice-options:%s"
          },
          {
            // a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
            push: "ssrcs",
            reg: /^ssrc:(\d*) ([\w_-]*)(?::(.*))?/,
            names: ["id", "attribute", "value"],
            format: function(o) {
              var str = "ssrc:%d";
              if (o.attribute != null) {
                str += " %s";
                if (o.value != null) {
                  str += ":%s";
                }
              }
              return str;
            }
          },
          {
            // a=ssrc-group:FEC 1 2
            // a=ssrc-group:FEC-FR 3004364195 1080772241
            push: "ssrcGroups",
            // token-char = %x21 / %x23-27 / %x2A-2B / %x2D-2E / %x30-39 / %x41-5A / %x5E-7E
            reg: /^ssrc-group:([\x21\x23\x24\x25\x26\x27\x2A\x2B\x2D\x2E\w]*) (.*)/,
            names: ["semantics", "ssrcs"],
            format: "ssrc-group:%s %s"
          },
          {
            // a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
            name: "msidSemantic",
            reg: /^msid-semantic:\s?(\w*) (\S*)/,
            names: ["semantic", "token"],
            format: "msid-semantic: %s %s"
            // space after ':' is not accidental
          },
          {
            // a=group:BUNDLE audio video
            push: "groups",
            reg: /^group:(\w*) (.*)/,
            names: ["type", "mids"],
            format: "group:%s %s"
          },
          {
            // a=rtcp-mux
            name: "rtcpMux",
            reg: /^(rtcp-mux)/
          },
          {
            // a=rtcp-rsize
            name: "rtcpRsize",
            reg: /^(rtcp-rsize)/
          },
          {
            // a=sctpmap:5000 webrtc-datachannel 1024
            name: "sctpmap",
            reg: /^sctpmap:([\w_/]*) (\S*)(?: (\S*))?/,
            names: ["sctpmapNumber", "app", "maxMessageSize"],
            format: function(o) {
              return o.maxMessageSize != null ? "sctpmap:%s %s %s" : "sctpmap:%s %s";
            }
          },
          {
            // a=x-google-flag:conference
            name: "xGoogleFlag",
            reg: /^x-google-flag:([^\s]*)/,
            format: "x-google-flag:%s"
          },
          {
            // a=rid:1 send max-width=1280;max-height=720;max-fps=30;depend=0
            push: "rids",
            reg: /^rid:([\d\w]+) (\w+)(?: ([\S| ]*))?/,
            names: ["id", "direction", "params"],
            format: function(o) {
              return o.params ? "rid:%s %s %s" : "rid:%s %s";
            }
          },
          {
            // a=imageattr:97 send [x=800,y=640,sar=1.1,q=0.6] [x=480,y=320] recv [x=330,y=250]
            // a=imageattr:* send [x=800,y=640] recv *
            // a=imageattr:100 recv [x=320,y=240]
            push: "imageattrs",
            reg: new RegExp(
              // a=imageattr:97
              "^imageattr:(\\d+|\\*)[\\s\\t]+(send|recv)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*)(?:[\\s\\t]+(recv|send)[\\s\\t]+(\\*|\\[\\S+\\](?:[\\s\\t]+\\[\\S+\\])*))?"
            ),
            names: ["pt", "dir1", "attrs1", "dir2", "attrs2"],
            format: function(o) {
              return "imageattr:%s %s %s" + (o.dir2 ? " %s %s" : "");
            }
          },
          {
            // a=simulcast:send 1,2,3;~4,~5 recv 6;~7,~8
            // a=simulcast:recv 1;4,5 send 6;7
            name: "simulcast",
            reg: new RegExp(
              // a=simulcast:
              "^simulcast:(send|recv) ([a-zA-Z0-9\\-_~;,]+)(?:\\s?(send|recv) ([a-zA-Z0-9\\-_~;,]+))?$"
            ),
            names: ["dir1", "list1", "dir2", "list2"],
            format: function(o) {
              return "simulcast:%s %s" + (o.dir2 ? " %s %s" : "");
            }
          },
          {
            // old simulcast draft 03 (implemented by Firefox)
            //   https://tools.ietf.org/html/draft-ietf-mmusic-sdp-simulcast-03
            // a=simulcast: recv pt=97;98 send pt=97
            // a=simulcast: send rid=5;6;7 paused=6,7
            name: "simulcast_03",
            reg: /^simulcast:[\s\t]+([\S+\s\t]+)$/,
            names: ["value"],
            format: "simulcast: %s"
          },
          {
            // a=framerate:25
            // a=framerate:29.97
            name: "framerate",
            reg: /^framerate:(\d+(?:$|\.\d+))/,
            format: "framerate:%s"
          },
          {
            // RFC4570
            // a=source-filter: incl IN IP4 239.5.2.31 10.1.15.5
            name: "sourceFilter",
            reg: /^source-filter: *(excl|incl) (\S*) (IP4|IP6|\*) (\S*) (.*)/,
            names: ["filterMode", "netType", "addressTypes", "destAddress", "srcList"],
            format: "source-filter: %s %s %s %s %s"
          },
          {
            // a=bundle-only
            name: "bundleOnly",
            reg: /^(bundle-only)/
          },
          {
            // a=label:1
            name: "label",
            reg: /^label:(.+)/,
            format: "label:%s"
          },
          {
            // RFC version 26 for SCTP over DTLS
            // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-5
            name: "sctpPort",
            reg: /^sctp-port:(\d+)$/,
            format: "sctp-port:%s"
          },
          {
            // RFC version 26 for SCTP over DTLS
            // https://tools.ietf.org/html/draft-ietf-mmusic-sctp-sdp-26#section-6
            name: "maxMessageSize",
            reg: /^max-message-size:(\d+)$/,
            format: "max-message-size:%s"
          },
          {
            // RFC7273
            // a=ts-refclk:ptp=IEEE1588-2008:39-A7-94-FF-FE-07-CB-D0:37
            push: "tsRefClocks",
            reg: /^ts-refclk:([^\s=]*)(?:=(\S*))?/,
            names: ["clksrc", "clksrcExt"],
            format: function(o) {
              return "ts-refclk:%s" + (o.clksrcExt != null ? "=%s" : "");
            }
          },
          {
            // RFC7273
            // a=mediaclk:direct=963214424
            name: "mediaClk",
            reg: /^mediaclk:(?:id=(\S*))? *([^\s=]*)(?:=(\S*))?(?: *rate=(\d+)\/(\d+))?/,
            names: ["id", "mediaClockName", "mediaClockValue", "rateNumerator", "rateDenominator"],
            format: function(o) {
              var str = "mediaclk:";
              str += o.id != null ? "id=%s %s" : "%v%s";
              str += o.mediaClockValue != null ? "=%s" : "";
              str += o.rateNumerator != null ? " rate=%s" : "";
              str += o.rateDenominator != null ? "/%s" : "";
              return str;
            }
          },
          {
            // a=keywds:keywords
            name: "keywords",
            reg: /^keywds:(.+)$/,
            format: "keywds:%s"
          },
          {
            // a=content:main
            name: "content",
            reg: /^content:(.+)/,
            format: "content:%s"
          },
          // BFCP https://tools.ietf.org/html/rfc4583
          {
            // a=floorctrl:c-s
            name: "bfcpFloorCtrl",
            reg: /^floorctrl:(c-only|s-only|c-s)/,
            format: "floorctrl:%s"
          },
          {
            // a=confid:1
            name: "bfcpConfId",
            reg: /^confid:(\d+)/,
            format: "confid:%s"
          },
          {
            // a=userid:1
            name: "bfcpUserId",
            reg: /^userid:(\d+)/,
            format: "userid:%s"
          },
          {
            // a=floorid:1
            name: "bfcpFloorId",
            reg: /^floorid:(.+) (?:m-stream|mstrm):(.+)/,
            names: ["id", "mStream"],
            format: "floorid:%s mstrm:%s"
          },
          {
            // any a= that we don't understand is kept verbatim on media.invalid
            push: "invalid",
            names: ["value"]
          }
        ]
      };
      Object.keys(grammar).forEach(function(key) {
        var objs = grammar[key];
        objs.forEach(function(obj) {
          if (!obj.reg) {
            obj.reg = /(.*)/;
          }
          if (!obj.format) {
            obj.format = "%s";
          }
        });
      });
    }
  });

  // node_modules/sdp-transform/lib/parser.js
  var require_parser = __commonJS({
    "node_modules/sdp-transform/lib/parser.js"(exports) {
      var toIntIfInt = function(v) {
        return String(Number(v)) === v ? Number(v) : v;
      };
      var attachProperties = function(match, location2, names, rawName) {
        if (rawName && !names) {
          location2[rawName] = toIntIfInt(match[1]);
        } else {
          for (var i = 0; i < names.length; i += 1) {
            if (match[i + 1] != null) {
              location2[names[i]] = toIntIfInt(match[i + 1]);
            }
          }
        }
      };
      var parseReg = function(obj, location2, content) {
        var needsBlank = obj.name && obj.names;
        if (obj.push && !location2[obj.push]) {
          location2[obj.push] = [];
        } else if (needsBlank && !location2[obj.name]) {
          location2[obj.name] = {};
        }
        var keyLocation = obj.push ? {} : (
          // blank object that will be pushed
          needsBlank ? location2[obj.name] : location2
        );
        attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);
        if (obj.push) {
          location2[obj.push].push(keyLocation);
        }
      };
      var grammar = require_grammar();
      var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);
      exports.parse = function(sdp) {
        var session = {}, media = [], location2 = session;
        sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function(l) {
          var type = l[0];
          var content = l.slice(2);
          if (type === "m") {
            media.push({ rtp: [], fmtp: [] });
            location2 = media[media.length - 1];
          }
          for (var j = 0; j < (grammar[type] || []).length; j += 1) {
            var obj = grammar[type][j];
            if (obj.reg.test(content)) {
              return parseReg(obj, location2, content);
            }
          }
        });
        session.media = media;
        return session;
      };
      var paramReducer = function(acc, expr) {
        var s = expr.split(/=(.+)/, 2);
        if (s.length === 2) {
          acc[s[0]] = toIntIfInt(s[1]);
        } else if (s.length === 1 && expr.length > 1) {
          acc[s[0]] = void 0;
        }
        return acc;
      };
      exports.parseParams = function(str) {
        return str.split(/;\s?/).reduce(paramReducer, {});
      };
      exports.parseFmtpConfig = exports.parseParams;
      exports.parsePayloads = function(str) {
        return str.toString().split(" ").map(Number);
      };
      exports.parseRemoteCandidates = function(str) {
        var candidates = [];
        var parts2 = str.split(" ").map(toIntIfInt);
        for (var i = 0; i < parts2.length; i += 3) {
          candidates.push({
            component: parts2[i],
            ip: parts2[i + 1],
            port: parts2[i + 2]
          });
        }
        return candidates;
      };
      exports.parseImageAttributes = function(str) {
        return str.split(" ").map(function(item) {
          return item.substring(1, item.length - 1).split(",").reduce(paramReducer, {});
        });
      };
      exports.parseSimulcastStreamList = function(str) {
        return str.split(";").map(function(stream) {
          return stream.split(",").map(function(format) {
            var scid, paused = false;
            if (format[0] !== "~") {
              scid = toIntIfInt(format);
            } else {
              scid = toIntIfInt(format.substring(1, format.length));
              paused = true;
            }
            return {
              scid,
              paused
            };
          });
        });
      };
    }
  });

  // node_modules/sdp-transform/lib/writer.js
  var require_writer = __commonJS({
    "node_modules/sdp-transform/lib/writer.js"(exports, module) {
      var grammar = require_grammar();
      var formatRegExp = /%[sdv%]/g;
      var format = function(formatStr) {
        var i = 1;
        var args = arguments;
        var len = args.length;
        return formatStr.replace(formatRegExp, function(x) {
          if (i >= len) {
            return x;
          }
          var arg = args[i];
          i += 1;
          switch (x) {
            case "%%":
              return "%";
            case "%s":
              return String(arg);
            case "%d":
              return Number(arg);
            case "%v":
              return "";
          }
        });
      };
      var makeLine = function(type, obj, location2) {
        var str = obj.format instanceof Function ? obj.format(obj.push ? location2 : location2[obj.name]) : obj.format;
        var args = [type + "=" + str];
        if (obj.names) {
          for (var i = 0; i < obj.names.length; i += 1) {
            var n = obj.names[i];
            if (obj.name) {
              args.push(location2[obj.name][n]);
            } else {
              args.push(location2[obj.names[i]]);
            }
          }
        } else {
          args.push(location2[obj.name]);
        }
        return format.apply(null, args);
      };
      var defaultOuterOrder = [
        "v",
        "o",
        "s",
        "i",
        "u",
        "e",
        "p",
        "c",
        "b",
        "t",
        "r",
        "z",
        "a"
      ];
      var defaultInnerOrder = ["i", "c", "b", "a"];
      module.exports = function(session, opts) {
        opts = opts || {};
        if (session.version == null) {
          session.version = 0;
        }
        if (session.name == null) {
          session.name = " ";
        }
        session.media.forEach(function(mLine) {
          if (mLine.payloads == null) {
            mLine.payloads = "";
          }
        });
        var outerOrder = opts.outerOrder || defaultOuterOrder;
        var innerOrder = opts.innerOrder || defaultInnerOrder;
        var sdp = [];
        outerOrder.forEach(function(type) {
          grammar[type].forEach(function(obj) {
            if (obj.name in session && session[obj.name] != null) {
              sdp.push(makeLine(type, obj, session));
            } else if (obj.push in session && session[obj.push] != null) {
              session[obj.push].forEach(function(el) {
                sdp.push(makeLine(type, obj, el));
              });
            }
          });
        });
        session.media.forEach(function(mLine) {
          sdp.push(makeLine("m", grammar.m[0], mLine));
          innerOrder.forEach(function(type) {
            grammar[type].forEach(function(obj) {
              if (obj.name in mLine && mLine[obj.name] != null) {
                sdp.push(makeLine(type, obj, mLine));
              } else if (obj.push in mLine && mLine[obj.push] != null) {
                mLine[obj.push].forEach(function(el) {
                  sdp.push(makeLine(type, obj, el));
                });
              }
            });
          });
        });
        return sdp.join("\r\n") + "\r\n";
      };
    }
  });

  // node_modules/sdp-transform/lib/index.js
  var require_lib3 = __commonJS({
    "node_modules/sdp-transform/lib/index.js"(exports) {
      var parser = require_parser();
      var writer = require_writer();
      var grammar = require_grammar();
      exports.grammar = grammar;
      exports.write = writer;
      exports.parse = parser.parse;
      exports.parseParams = parser.parseParams;
      exports.parseFmtpConfig = parser.parseFmtpConfig;
      exports.parsePayloads = parser.parsePayloads;
      exports.parseRemoteCandidates = parser.parseRemoteCandidates;
      exports.parseImageAttributes = parser.parseImageAttributes;
      exports.parseSimulcastStreamList = parser.parseSimulcastStreamList;
    }
  });

  // node_modules/mediasoup-client/lib/scalabilityModes.js
  var require_scalabilityModes = __commonJS({
    "node_modules/mediasoup-client/lib/scalabilityModes.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.parse = parse2;
      var ScalabilityModeRegex = new RegExp("^[LS]([1-9]\\d{0,1})T([1-9]\\d{0,1})");
      function parse2(scalabilityMode) {
        const match = ScalabilityModeRegex.exec(scalabilityMode ?? "");
        if (match) {
          return {
            spatialLayers: Number(match[1]),
            temporalLayers: Number(match[2])
          };
        } else {
          return {
            spatialLayers: 1,
            temporalLayers: 1
          };
        }
      }
    }
  });

  // node_modules/mediasoup-client/lib/handlers/sdp/MediaSection.js
  var require_MediaSection = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/sdp/MediaSection.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.OfferMediaSection = exports.AnswerMediaSection = exports.MediaSection = void 0;
      var sdpTransform = require_lib3();
      var utils = require_utils();
      var MediaSection = class {
        constructor({ iceParameters, iceCandidates, dtlsParameters }) {
          // SDP media object.
          __publicField(this, "_mediaObject");
          this._mediaObject = {
            type: "",
            port: 0,
            protocol: "",
            payloads: "",
            rtp: [],
            fmtp: []
          };
          if (iceParameters) {
            this.setIceParameters(iceParameters);
          }
          if (iceCandidates) {
            this._mediaObject.candidates = [];
            for (const candidate of iceCandidates) {
              const candidateObject = {
                foundation: candidate.foundation,
                // mediasoup does mandates rtcp-mux so candidates component is always
                // RTP (1).
                component: 1,
                // Be ready for new candidate.address field in mediasoup server side
                // field and keep backward compatibility with deprecated candidate.ip.
                ip: candidate.address ?? candidate.ip,
                port: candidate.port,
                priority: candidate.priority,
                transport: candidate.protocol,
                type: candidate.type
              };
              if (candidate.tcpType) {
                candidateObject.tcptype = candidate.tcpType;
              }
              this._mediaObject.candidates.push(candidateObject);
            }
            this._mediaObject.endOfCandidates = "end-of-candidates";
            this._mediaObject.iceOptions = "renomination";
          }
          if (dtlsParameters) {
            this.setDtlsRole(dtlsParameters.role);
          }
        }
        get mid() {
          return String(this._mediaObject.mid);
        }
        get closed() {
          return this._mediaObject.port === 0;
        }
        getObject() {
          return this._mediaObject;
        }
        setIceParameters(iceParameters) {
          this._mediaObject.iceUfrag = iceParameters.usernameFragment;
          this._mediaObject.icePwd = iceParameters.password;
        }
        pause() {
          this._mediaObject.direction = "inactive";
        }
        disable() {
          this.pause();
        }
        close() {
          this.disable();
          this._mediaObject.port = 0;
          delete this._mediaObject.candidates;
          delete this._mediaObject.endOfCandidates;
          delete this._mediaObject.iceUfrag;
          delete this._mediaObject.icePwd;
          delete this._mediaObject.iceOptions;
          this._mediaObject.rtp = [];
          this._mediaObject.fmtp = [];
          delete this._mediaObject.rtcp;
          delete this._mediaObject.rtcpFb;
          delete this._mediaObject.ssrcs;
          delete this._mediaObject.ssrcGroups;
          delete this._mediaObject.simulcast;
          delete this._mediaObject.simulcast_03;
          delete this._mediaObject.rids;
          delete this._mediaObject.extmapAllowMixed;
        }
      };
      exports.MediaSection = MediaSection;
      var AnswerMediaSection = class extends MediaSection {
        constructor({ iceParameters, iceCandidates, dtlsParameters, sctpParameters, plainRtpParameters, offerMediaObject, offerRtpParameters, answerRtpParameters, codecOptions }) {
          super({ iceParameters, iceCandidates, dtlsParameters });
          this._mediaObject.mid = String(offerMediaObject.mid);
          this._mediaObject.type = offerMediaObject.type;
          this._mediaObject.protocol = offerMediaObject.protocol;
          if (!plainRtpParameters) {
            this._mediaObject.connection = { ip: "127.0.0.1", version: 4 };
            this._mediaObject.port = 7;
          } else {
            this._mediaObject.connection = {
              ip: plainRtpParameters.ip,
              version: plainRtpParameters.ipVersion
            };
            this._mediaObject.port = plainRtpParameters.port;
          }
          switch (offerMediaObject.type) {
            case "audio":
            case "video": {
              this._mediaObject.direction = "recvonly";
              this._mediaObject.rtp = [];
              this._mediaObject.rtcpFb = [];
              this._mediaObject.fmtp = [];
              for (const codec of answerRtpParameters.codecs) {
                const rtp = {
                  payload: codec.payloadType,
                  codec: getCodecName(codec),
                  rate: codec.clockRate
                };
                if (codec.channels > 1) {
                  rtp.encoding = codec.channels;
                }
                this._mediaObject.rtp.push(rtp);
                const codecParameters = utils.clone(codec.parameters) ?? {};
                let codecRtcpFeedback = utils.clone(codec.rtcpFeedback) ?? [];
                if (codecOptions) {
                  const { opusStereo, opusFec, opusDtx, opusMaxPlaybackRate, opusMaxAverageBitrate, opusPtime, opusNack, videoGoogleStartBitrate, videoGoogleMaxBitrate, videoGoogleMinBitrate } = codecOptions;
                  const offerCodec = offerRtpParameters.codecs.find((c) => c.payloadType === codec.payloadType);
                  switch (codec.mimeType.toLowerCase()) {
                    case "audio/opus":
                    case "audio/multiopus": {
                      if (opusStereo !== void 0) {
                        offerCodec.parameters["sprop-stereo"] = opusStereo ? 1 : 0;
                        codecParameters["stereo"] = opusStereo ? 1 : 0;
                      }
                      if (opusFec !== void 0) {
                        offerCodec.parameters["useinbandfec"] = opusFec ? 1 : 0;
                        codecParameters["useinbandfec"] = opusFec ? 1 : 0;
                      }
                      if (opusDtx !== void 0) {
                        offerCodec.parameters["usedtx"] = opusDtx ? 1 : 0;
                        codecParameters["usedtx"] = opusDtx ? 1 : 0;
                      }
                      if (opusMaxPlaybackRate !== void 0) {
                        codecParameters["maxplaybackrate"] = opusMaxPlaybackRate;
                      }
                      if (opusMaxAverageBitrate !== void 0) {
                        codecParameters["maxaveragebitrate"] = opusMaxAverageBitrate;
                      }
                      if (opusPtime !== void 0) {
                        offerCodec.parameters["ptime"] = opusPtime;
                        codecParameters["ptime"] = opusPtime;
                      }
                      if (!opusNack) {
                        offerCodec.rtcpFeedback = offerCodec.rtcpFeedback.filter((fb) => fb.type !== "nack" || fb.parameter);
                        codecRtcpFeedback = codecRtcpFeedback.filter((fb) => fb.type !== "nack" || fb.parameter);
                      }
                      break;
                    }
                    case "video/vp8":
                    case "video/vp9":
                    case "video/h264":
                    case "video/h265":
                    case "video/av1": {
                      if (videoGoogleStartBitrate !== void 0) {
                        codecParameters["x-google-start-bitrate"] = videoGoogleStartBitrate;
                      }
                      if (videoGoogleMaxBitrate !== void 0) {
                        codecParameters["x-google-max-bitrate"] = videoGoogleMaxBitrate;
                      }
                      if (videoGoogleMinBitrate !== void 0) {
                        codecParameters["x-google-min-bitrate"] = videoGoogleMinBitrate;
                      }
                      break;
                    }
                  }
                }
                const fmtp = {
                  payload: codec.payloadType,
                  config: ""
                };
                for (const key of Object.keys(codecParameters)) {
                  if (fmtp.config) {
                    fmtp.config += ";";
                  }
                  fmtp.config += `${key}=${codecParameters[key]}`;
                }
                if (fmtp.config) {
                  this._mediaObject.fmtp.push(fmtp);
                }
                for (const fb of codecRtcpFeedback) {
                  this._mediaObject.rtcpFb.push({
                    payload: codec.payloadType,
                    type: fb.type,
                    subtype: fb.parameter
                  });
                }
              }
              this._mediaObject.payloads = answerRtpParameters.codecs.map((codec) => codec.payloadType).join(" ");
              this._mediaObject.ext = [];
              for (const ext of answerRtpParameters.headerExtensions) {
                const found = (offerMediaObject.ext ?? []).some((localExt) => localExt.uri === ext.uri);
                if (!found) {
                  continue;
                }
                this._mediaObject.ext.push({
                  uri: ext.uri,
                  value: ext.id
                });
              }
              if (offerMediaObject.extmapAllowMixed === "extmap-allow-mixed") {
                this._mediaObject.extmapAllowMixed = "extmap-allow-mixed";
              }
              if (offerMediaObject.simulcast) {
                this._mediaObject.simulcast = {
                  dir1: "recv",
                  list1: offerMediaObject.simulcast.list1
                };
                this._mediaObject.rids = [];
                for (const rid of offerMediaObject.rids ?? []) {
                  if (rid.direction !== "send") {
                    continue;
                  }
                  this._mediaObject.rids.push({
                    id: rid.id,
                    direction: "recv"
                  });
                }
              } else if (offerMediaObject.simulcast_03) {
                this._mediaObject.simulcast_03 = {
                  value: offerMediaObject.simulcast_03.value.replace(/send/g, "recv")
                };
                this._mediaObject.rids = [];
                for (const rid of offerMediaObject.rids ?? []) {
                  if (rid.direction !== "send") {
                    continue;
                  }
                  this._mediaObject.rids.push({
                    id: rid.id,
                    direction: "recv"
                  });
                }
              }
              this._mediaObject.rtcpMux = "rtcp-mux";
              this._mediaObject.rtcpRsize = "rtcp-rsize";
              break;
            }
            case "application": {
              if (typeof offerMediaObject.sctpPort === "number") {
                this._mediaObject.payloads = "webrtc-datachannel";
                this._mediaObject.sctpPort = sctpParameters.port;
                this._mediaObject.maxMessageSize = sctpParameters.maxMessageSize;
              } else if (offerMediaObject.sctpmap) {
                this._mediaObject.payloads = String(sctpParameters.port);
                this._mediaObject.sctpmap = {
                  app: "webrtc-datachannel",
                  sctpmapNumber: sctpParameters.port,
                  maxMessageSize: sctpParameters.maxMessageSize
                };
              }
              break;
            }
          }
        }
        setDtlsRole(role2) {
          switch (role2) {
            case "client": {
              this._mediaObject.setup = "active";
              break;
            }
            case "server": {
              this._mediaObject.setup = "passive";
              break;
            }
            case "auto": {
              this._mediaObject.setup = "actpass";
              break;
            }
          }
        }
        resume() {
          this._mediaObject.direction = "recvonly";
        }
        muxSimulcastStreams(encodings) {
          if (!this._mediaObject.simulcast?.list1) {
            return;
          }
          const layers = {};
          for (const encoding of encodings) {
            if (encoding.rid) {
              layers[encoding.rid] = encoding;
            }
          }
          const raw = this._mediaObject.simulcast.list1;
          const simulcastStreams = sdpTransform.parseSimulcastStreamList(raw);
          for (const simulcastStream of simulcastStreams) {
            for (const simulcastFormat of simulcastStream) {
              simulcastFormat.paused = !layers[simulcastFormat.scid]?.active;
            }
          }
          this._mediaObject.simulcast.list1 = simulcastStreams.map((simulcastFormats) => simulcastFormats.map((f) => `${f.paused ? "~" : ""}${f.scid}`).join(",")).join(";");
        }
      };
      exports.AnswerMediaSection = AnswerMediaSection;
      var OfferMediaSection = class extends MediaSection {
        constructor({ iceParameters, iceCandidates, dtlsParameters, sctpParameters, plainRtpParameters, mid, kind, offerRtpParameters, streamId, trackId }) {
          super({ iceParameters, iceCandidates, dtlsParameters });
          this._mediaObject.mid = String(mid);
          this._mediaObject.type = kind;
          if (!plainRtpParameters) {
            this._mediaObject.connection = { ip: "127.0.0.1", version: 4 };
            if (!sctpParameters) {
              this._mediaObject.protocol = "UDP/TLS/RTP/SAVPF";
            } else {
              this._mediaObject.protocol = "UDP/DTLS/SCTP";
            }
            this._mediaObject.port = 7;
          } else {
            this._mediaObject.connection = {
              ip: plainRtpParameters.ip,
              version: plainRtpParameters.ipVersion
            };
            this._mediaObject.protocol = "RTP/AVP";
            this._mediaObject.port = plainRtpParameters.port;
          }
          this._mediaObject.extmapAllowMixed = "extmap-allow-mixed";
          switch (kind) {
            case "audio":
            case "video": {
              this._mediaObject.direction = "sendonly";
              this._mediaObject.rtp = [];
              this._mediaObject.rtcpFb = [];
              this._mediaObject.fmtp = [];
              this._mediaObject.msid = [{ id: streamId, appdata: trackId }];
              for (const codec of offerRtpParameters.codecs) {
                const rtp = {
                  payload: codec.payloadType,
                  codec: getCodecName(codec),
                  rate: codec.clockRate
                };
                if (codec.channels > 1) {
                  rtp.encoding = codec.channels;
                }
                this._mediaObject.rtp.push(rtp);
                const fmtp = {
                  payload: codec.payloadType,
                  config: ""
                };
                for (const key of Object.keys(codec.parameters ?? {})) {
                  if (fmtp.config) {
                    fmtp.config += ";";
                  }
                  fmtp.config += `${key}=${codec.parameters[key]}`;
                }
                if (fmtp.config) {
                  this._mediaObject.fmtp.push(fmtp);
                }
                for (const fb of codec.rtcpFeedback) {
                  this._mediaObject.rtcpFb.push({
                    payload: codec.payloadType,
                    type: fb.type,
                    subtype: fb.parameter
                  });
                }
              }
              this._mediaObject.payloads = offerRtpParameters.codecs.map((codec) => codec.payloadType).join(" ");
              this._mediaObject.ext = [];
              for (const ext of offerRtpParameters.headerExtensions) {
                this._mediaObject.ext.push({
                  uri: ext.uri,
                  value: ext.id
                });
              }
              this._mediaObject.rtcpMux = "rtcp-mux";
              this._mediaObject.rtcpRsize = "rtcp-rsize";
              const encoding = offerRtpParameters.encodings[0];
              const ssrc = encoding.ssrc;
              const rtxSsrc = encoding.rtx?.ssrc;
              this._mediaObject.ssrcs = [];
              this._mediaObject.ssrcGroups = [];
              if (ssrc && offerRtpParameters.rtcp.cname) {
                this._mediaObject.ssrcs.push({
                  id: ssrc,
                  attribute: "cname",
                  value: offerRtpParameters.rtcp.cname
                });
              }
              if (rtxSsrc) {
                if (offerRtpParameters.rtcp.cname) {
                  this._mediaObject.ssrcs.push({
                    id: rtxSsrc,
                    attribute: "cname",
                    value: offerRtpParameters.rtcp.cname
                  });
                }
                if (ssrc) {
                  this._mediaObject.ssrcGroups.push({
                    semantics: "FID",
                    ssrcs: `${ssrc} ${rtxSsrc}`
                  });
                }
              }
              break;
            }
            case "application": {
              this._mediaObject.payloads = "webrtc-datachannel";
              this._mediaObject.sctpPort = sctpParameters.port;
              this._mediaObject.maxMessageSize = sctpParameters.maxMessageSize;
              break;
            }
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setDtlsRole(role2) {
          this._mediaObject.setup = "actpass";
        }
        resume() {
          this._mediaObject.direction = "sendonly";
        }
      };
      exports.OfferMediaSection = OfferMediaSection;
      function getCodecName(codec) {
        const MimeTypeRegex = new RegExp("^(audio|video)/(.+)", "i");
        const mimeTypeMatch = MimeTypeRegex.exec(codec.mimeType);
        if (!mimeTypeMatch) {
          throw new TypeError("invalid codec.mimeType");
        }
        return mimeTypeMatch[2];
      }
    }
  });

  // node_modules/mediasoup-client/lib/handlers/sdp/RemoteSdp.js
  var require_RemoteSdp = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/sdp/RemoteSdp.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.RemoteSdp = void 0;
      var sdpTransform = require_lib3();
      var Logger_1 = require_Logger();
      var MediaSection_1 = require_MediaSection();
      var __1 = require_lib5();
      var DependencyDescriptorCodecs = ["av1", "h264"];
      var logger = new Logger_1.Logger("RemoteSdp");
      var RemoteSdp = class {
        constructor({ iceParameters, iceCandidates, dtlsParameters, sctpParameters, plainRtpParameters }) {
          // Remote ICE parameters.
          __publicField(this, "_iceParameters");
          // Remote ICE candidates.
          __publicField(this, "_iceCandidates");
          // Remote DTLS parameters.
          __publicField(this, "_dtlsParameters");
          // Remote SCTP parameters.
          __publicField(this, "_sctpParameters");
          // Parameters for plain RTP (no SRTP nor DTLS no BUNDLE).
          __publicField(this, "_plainRtpParameters");
          // MediaSection instances with same order as in the SDP.
          __publicField(this, "_mediaSections", []);
          // MediaSection indices indexed by MID.
          __publicField(this, "_midToIndex", /* @__PURE__ */ new Map());
          // First MID.
          __publicField(this, "_firstMid");
          // SDP object.
          __publicField(this, "_sdpObject");
          this._iceParameters = iceParameters;
          this._iceCandidates = iceCandidates;
          this._dtlsParameters = dtlsParameters;
          this._sctpParameters = sctpParameters;
          this._plainRtpParameters = plainRtpParameters;
          this._sdpObject = {
            version: 0,
            origin: {
              address: "0.0.0.0",
              ipVer: 4,
              netType: "IN",
              sessionId: "10000",
              sessionVersion: 0,
              username: `mediasoup-client-v${__1.version}`
            },
            name: "-",
            timing: { start: 0, stop: 0 },
            media: []
          };
          this._sdpObject.iceOptions = "ice2";
          if (iceParameters?.iceLite) {
            this._sdpObject.icelite = "ice-lite";
          }
          if (dtlsParameters) {
            this._sdpObject.msidSemantic = { semantic: "WMS", token: "*" };
            const numFingerprints = this._dtlsParameters.fingerprints.length;
            this._sdpObject.fingerprint = {
              type: dtlsParameters.fingerprints[numFingerprints - 1].algorithm,
              hash: dtlsParameters.fingerprints[numFingerprints - 1].value
            };
            this._sdpObject.groups = [{ type: "BUNDLE", mids: "" }];
          }
          if (plainRtpParameters) {
            this._sdpObject.origin.address = plainRtpParameters.ip;
            this._sdpObject.origin.ipVer = plainRtpParameters.ipVersion;
          }
        }
        updateIceParameters(iceParameters) {
          logger.debug("updateIceParameters() [iceParameters:%o]", iceParameters);
          this._iceParameters = iceParameters;
          this._sdpObject.icelite = iceParameters.iceLite ? "ice-lite" : void 0;
          for (const mediaSection of this._mediaSections) {
            mediaSection.setIceParameters(iceParameters);
          }
        }
        updateDtlsRole(role2) {
          logger.debug("updateDtlsRole() [role:%s]", role2);
          this._dtlsParameters.role = role2;
          for (const mediaSection of this._mediaSections) {
            mediaSection.setDtlsRole(role2);
          }
        }
        /**
         * Set session level a=extmap-allow-mixed attibute.
         */
        setSessionExtmapAllowMixed() {
          logger.debug("setSessionExtmapAllowMixed()");
          this._sdpObject.extmapAllowMixed = "extmap-allow-mixed";
        }
        getNextMediaSectionIdx() {
          for (let idx = 0; idx < this._mediaSections.length; ++idx) {
            const mediaSection = this._mediaSections[idx];
            if (mediaSection.closed) {
              return { idx, reuseMid: mediaSection.mid };
            }
          }
          return { idx: this._mediaSections.length };
        }
        send({ offerMediaObject, reuseMid, offerRtpParameters, answerRtpParameters, codecOptions }) {
          const mediaSection = new MediaSection_1.AnswerMediaSection({
            iceParameters: this._iceParameters,
            iceCandidates: this._iceCandidates,
            dtlsParameters: this._dtlsParameters,
            plainRtpParameters: this._plainRtpParameters,
            offerMediaObject,
            offerRtpParameters,
            answerRtpParameters,
            codecOptions
          });
          const mediaObject = mediaSection.getObject();
          const ddCodec = mediaObject.rtp.find((rtp) => DependencyDescriptorCodecs.includes(rtp.codec.toLowerCase()));
          if (!ddCodec) {
            mediaObject.ext = mediaObject.ext?.filter((extmap) => extmap.uri !== "https://aomediacodec.github.io/av1-rtp-spec/#dependency-descriptor-rtp-header-extension");
          }
          if (reuseMid) {
            this.replaceMediaSection(mediaSection, reuseMid);
          } else if (!this._midToIndex.has(mediaSection.mid)) {
            this.addMediaSection(mediaSection);
          } else {
            this.replaceMediaSection(mediaSection);
          }
        }
        receive({ mid, kind, offerRtpParameters, streamId, trackId }) {
          this.setSessionExtmapAllowMixed();
          const mediaSection = new MediaSection_1.OfferMediaSection({
            iceParameters: this._iceParameters,
            iceCandidates: this._iceCandidates,
            dtlsParameters: this._dtlsParameters,
            plainRtpParameters: this._plainRtpParameters,
            mid,
            kind,
            offerRtpParameters,
            streamId,
            trackId
          });
          const oldMediaSection = this._mediaSections.find((m) => m.closed);
          if (oldMediaSection) {
            this.replaceMediaSection(mediaSection, oldMediaSection.mid);
          } else {
            this.addMediaSection(mediaSection);
          }
        }
        pauseMediaSection(mid) {
          const mediaSection = this.findMediaSection(mid);
          mediaSection.pause();
        }
        resumeSendingMediaSection(mid) {
          const mediaSection = this.findMediaSection(mid);
          mediaSection.resume();
        }
        resumeReceivingMediaSection(mid) {
          const mediaSection = this.findMediaSection(mid);
          mediaSection.resume();
        }
        disableMediaSection(mid) {
          const mediaSection = this.findMediaSection(mid);
          mediaSection.disable();
        }
        /**
         * Closes media section. Returns true if the given MID corresponds to a m
         * section that has been indeed closed. False otherwise.
         *
         * NOTE: Closing the first m section is a pain since it invalidates the bundled
         * transport, so instead closing it we just disable it.
         */
        closeMediaSection(mid) {
          const mediaSection = this.findMediaSection(mid);
          if (mid === this._firstMid) {
            logger.debug("closeMediaSection() | cannot close first media section, disabling it instead [mid:%s]", mid);
            this.disableMediaSection(mid);
            return false;
          }
          mediaSection.close();
          this.regenerateBundleMids();
          return true;
        }
        muxMediaSectionSimulcast(mid, encodings) {
          const mediaSection = this.findMediaSection(mid);
          mediaSection.muxSimulcastStreams(encodings);
          this.replaceMediaSection(mediaSection);
        }
        sendSctpAssociation({ offerMediaObject }) {
          const mediaSection = new MediaSection_1.AnswerMediaSection({
            iceParameters: this._iceParameters,
            iceCandidates: this._iceCandidates,
            dtlsParameters: this._dtlsParameters,
            sctpParameters: this._sctpParameters,
            plainRtpParameters: this._plainRtpParameters,
            offerMediaObject
          });
          this.addMediaSection(mediaSection);
        }
        receiveSctpAssociation() {
          const mediaSection = new MediaSection_1.OfferMediaSection({
            iceParameters: this._iceParameters,
            iceCandidates: this._iceCandidates,
            dtlsParameters: this._dtlsParameters,
            sctpParameters: this._sctpParameters,
            plainRtpParameters: this._plainRtpParameters,
            mid: "datachannel",
            kind: "application"
          });
          this.addMediaSection(mediaSection);
        }
        getSdp() {
          this._sdpObject.origin.sessionVersion++;
          return sdpTransform.write(this._sdpObject);
        }
        addMediaSection(newMediaSection) {
          if (!this._firstMid) {
            this._firstMid = newMediaSection.mid;
          }
          this._mediaSections.push(newMediaSection);
          this._midToIndex.set(newMediaSection.mid, this._mediaSections.length - 1);
          this._sdpObject.media.push(newMediaSection.getObject());
          this.regenerateBundleMids();
        }
        replaceMediaSection(newMediaSection, reuseMid) {
          if (typeof reuseMid === "string") {
            const idx = this._midToIndex.get(reuseMid);
            if (idx === void 0) {
              throw new Error(`no media section found for reuseMid '${reuseMid}'`);
            }
            const oldMediaSection = this._mediaSections[idx];
            this._mediaSections[idx] = newMediaSection;
            this._midToIndex.delete(oldMediaSection.mid);
            this._midToIndex.set(newMediaSection.mid, idx);
            this._sdpObject.media[idx] = newMediaSection.getObject();
            this.regenerateBundleMids();
          } else {
            const idx = this._midToIndex.get(newMediaSection.mid);
            if (idx === void 0) {
              throw new Error(`no media section found with mid '${newMediaSection.mid}'`);
            }
            this._mediaSections[idx] = newMediaSection;
            this._sdpObject.media[idx] = newMediaSection.getObject();
          }
        }
        findMediaSection(mid) {
          const idx = this._midToIndex.get(mid);
          if (idx === void 0) {
            throw new Error(`no media section found with mid '${mid}'`);
          }
          return this._mediaSections[idx];
        }
        regenerateBundleMids() {
          if (!this._dtlsParameters) {
            return;
          }
          this._sdpObject.groups[0].mids = this._mediaSections.filter((mediaSection) => !mediaSection.closed).map((mediaSection) => mediaSection.mid).join(" ");
        }
      };
      exports.RemoteSdp = RemoteSdp;
    }
  });

  // node_modules/mediasoup-client/lib/handlers/sdp/commonUtils.js
  var require_commonUtils = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/sdp/commonUtils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.extractRtpCapabilities = extractRtpCapabilities;
      exports.extractDtlsParameters = extractDtlsParameters;
      exports.getCname = getCname;
      exports.applyCodecParameters = applyCodecParameters;
      exports.addHeaderExtension = addHeaderExtension;
      var sdpTransform = require_lib3();
      function extractRtpCapabilities({ sdpObject }) {
        const codecsMap = /* @__PURE__ */ new Map();
        const headerExtensionMap = /* @__PURE__ */ new Map();
        for (const m of sdpObject.media) {
          const kind = m.type;
          switch (kind) {
            case "audio":
            case "video": {
              break;
            }
            default: {
              continue;
            }
          }
          for (const rtp of m.rtp) {
            const codec = {
              kind,
              mimeType: `${kind}/${rtp.codec}`,
              preferredPayloadType: rtp.payload,
              clockRate: rtp.rate,
              channels: rtp.encoding,
              parameters: {},
              rtcpFeedback: []
            };
            codecsMap.set(codec.preferredPayloadType, codec);
          }
          for (const fmtp of m.fmtp ?? []) {
            const parameters = sdpTransform.parseParams(fmtp.config);
            const codec = codecsMap.get(fmtp.payload);
            if (!codec) {
              continue;
            }
            if (parameters?.hasOwnProperty("profile-level-id")) {
              parameters["profile-level-id"] = String(parameters["profile-level-id"]);
            }
            codec.parameters = parameters;
          }
          for (const fb of m.rtcpFb ?? []) {
            const feedback = {
              type: fb.type,
              parameter: fb.subtype
            };
            if (!feedback.parameter) {
              delete feedback.parameter;
            }
            if (fb.payload !== "*") {
              const codec = codecsMap.get(Number(fb.payload));
              if (!codec) {
                continue;
              }
              codec.rtcpFeedback.push(feedback);
            } else {
              for (const codec of codecsMap.values()) {
                if (codec.kind === kind && !/.+\/rtx$/i.test(codec.mimeType)) {
                  codec.rtcpFeedback.push(feedback);
                }
              }
            }
          }
          for (const ext of m.ext ?? []) {
            if (ext["encrypt-uri"]) {
              continue;
            }
            const headerExtension = {
              kind,
              uri: ext.uri,
              preferredId: ext.value
            };
            headerExtensionMap.set(headerExtension.preferredId, headerExtension);
          }
        }
        const rtpCapabilities = {
          codecs: Array.from(codecsMap.values()),
          headerExtensions: Array.from(headerExtensionMap.values())
        };
        return rtpCapabilities;
      }
      function extractDtlsParameters({ sdpObject }) {
        let setup = sdpObject.setup;
        let fingerprint = sdpObject.fingerprint;
        if (!setup || !fingerprint) {
          const mediaObject = (sdpObject.media ?? []).find((m) => m.port !== 0);
          if (mediaObject) {
            setup = setup ?? mediaObject.setup;
            fingerprint = fingerprint ?? mediaObject.fingerprint;
          }
        }
        if (!setup) {
          throw new Error("no a=setup found at SDP session or media level");
        } else if (!fingerprint) {
          throw new Error("no a=fingerprint found at SDP session or media level");
        }
        let role2;
        switch (setup) {
          case "active": {
            role2 = "client";
            break;
          }
          case "passive": {
            role2 = "server";
            break;
          }
          case "actpass": {
            role2 = "auto";
            break;
          }
        }
        const dtlsParameters = {
          role: role2,
          fingerprints: [
            {
              algorithm: fingerprint.type,
              value: fingerprint.hash
            }
          ]
        };
        return dtlsParameters;
      }
      function getCname({ offerMediaObject }) {
        const ssrcCnameLine = (offerMediaObject.ssrcs ?? []).find((line) => line.attribute === "cname");
        if (!ssrcCnameLine) {
          return "";
        }
        return ssrcCnameLine.value;
      }
      function applyCodecParameters({ offerRtpParameters, answerMediaObject }) {
        for (const codec of offerRtpParameters.codecs) {
          const mimeType = codec.mimeType.toLowerCase();
          if (mimeType !== "audio/opus") {
            continue;
          }
          const rtp = (answerMediaObject.rtp ?? []).find((r) => r.payload === codec.payloadType);
          if (!rtp) {
            continue;
          }
          answerMediaObject.fmtp = answerMediaObject.fmtp ?? [];
          let fmtp = answerMediaObject.fmtp.find((f) => f.payload === codec.payloadType);
          if (!fmtp) {
            fmtp = { payload: codec.payloadType, config: "" };
            answerMediaObject.fmtp.push(fmtp);
          }
          const parameters = sdpTransform.parseParams(fmtp.config);
          switch (mimeType) {
            case "audio/opus": {
              const spropStereo = codec.parameters?.["sprop-stereo"];
              if (spropStereo !== void 0) {
                parameters["stereo"] = Number(spropStereo) ? 1 : 0;
              }
              break;
            }
          }
          fmtp.config = "";
          for (const key of Object.keys(parameters)) {
            if (fmtp.config) {
              fmtp.config += ";";
            }
            fmtp.config += `${key}=${parameters[key]}`;
          }
        }
      }
      function addHeaderExtension({ offerMediaObject, headerExtensionUri, headerExtensionId }) {
        if (!offerMediaObject.ext) {
          offerMediaObject.ext = [];
        }
        offerMediaObject.ext.push({
          uri: headerExtensionUri,
          value: headerExtensionId
        });
      }
    }
  });

  // node_modules/mediasoup-client/lib/handlers/sdp/unifiedPlanUtils.js
  var require_unifiedPlanUtils = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/sdp/unifiedPlanUtils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getRtpEncodings = getRtpEncodings;
      exports.addLegacySimulcast = addLegacySimulcast;
      function getRtpEncodings({ offerMediaObject, codecs }) {
        const ssrcs = /* @__PURE__ */ new Set();
        for (const line of offerMediaObject.ssrcs ?? []) {
          const ssrc = line.id;
          if (ssrc) {
            ssrcs.add(ssrc);
          }
        }
        if (ssrcs.size === 0) {
          throw new Error("no a=ssrc lines found");
        }
        const ssrcToRtxSsrc = /* @__PURE__ */ new Map();
        for (const line of offerMediaObject.ssrcGroups ?? []) {
          if (line.semantics !== "FID") {
            continue;
          }
          const ssrcsStr = line.ssrcs.split(/\s+/);
          const ssrc = Number(ssrcsStr[0]);
          const rtxSsrc = Number(ssrcsStr[1]);
          if (ssrcs.has(ssrc)) {
            ssrcs.delete(ssrc);
            ssrcs.delete(rtxSsrc);
            ssrcToRtxSsrc.set(ssrc, rtxSsrc);
          }
        }
        for (const ssrc of ssrcs) {
          ssrcToRtxSsrc.set(ssrc, void 0);
        }
        const encodings = [];
        for (const [ssrc, rtxSsrc] of ssrcToRtxSsrc) {
          const encoding = { ssrc };
          if (rtxSsrc && codecs.length > 1) {
            encoding.rtx = { ssrc: rtxSsrc };
          }
          encodings.push(encoding);
        }
        return encodings;
      }
      function addLegacySimulcast({ offerMediaObject, numStreams }) {
        if (numStreams <= 1) {
          throw new TypeError("numStreams must be greater than 1");
        }
        const ssrcMsidLine = (offerMediaObject.ssrcs ?? []).find((line) => line.attribute === "msid");
        if (!ssrcMsidLine) {
          throw new Error("a=ssrc line with msid information not found");
        }
        const [streamId, trackId] = ssrcMsidLine.value.split(" ");
        const firstSsrc = Number(ssrcMsidLine.id);
        let firstRtxSsrc;
        (offerMediaObject.ssrcGroups ?? []).some((line) => {
          if (line.semantics !== "FID") {
            return false;
          }
          const ssrcs2 = line.ssrcs.split(/\s+/);
          if (Number(ssrcs2[0]) === firstSsrc) {
            firstRtxSsrc = Number(ssrcs2[1]);
            return true;
          } else {
            return false;
          }
        });
        const ssrcCnameLine = (offerMediaObject.ssrcs ?? []).find((line) => line.attribute === "cname");
        if (!ssrcCnameLine) {
          throw new Error("a=ssrc line with cname information not found");
        }
        const cname = ssrcCnameLine.value;
        const ssrcs = [];
        const rtxSsrcs = [];
        for (let i = 0; i < numStreams; ++i) {
          ssrcs.push(firstSsrc + i);
          if (firstRtxSsrc) {
            rtxSsrcs.push(firstRtxSsrc + i);
          }
        }
        offerMediaObject.ssrcGroups = [];
        offerMediaObject.ssrcs = [];
        offerMediaObject.ssrcGroups.push({
          semantics: "SIM",
          ssrcs: ssrcs.join(" ")
        });
        for (const ssrc of ssrcs) {
          offerMediaObject.ssrcs.push({
            id: ssrc,
            attribute: "cname",
            value: cname
          });
          offerMediaObject.ssrcs.push({
            id: ssrc,
            attribute: "msid",
            value: `${streamId} ${trackId}`
          });
        }
        for (let i = 0; i < rtxSsrcs.length; ++i) {
          const ssrc = ssrcs[i];
          const rtxSsrc = rtxSsrcs[i];
          offerMediaObject.ssrcs.push({
            id: rtxSsrc,
            attribute: "cname",
            value: cname
          });
          offerMediaObject.ssrcs.push({
            id: rtxSsrc,
            attribute: "msid",
            value: `${streamId} ${trackId}`
          });
          offerMediaObject.ssrcGroups.push({
            semantics: "FID",
            ssrcs: `${ssrc} ${rtxSsrc}`
          });
        }
      }
    }
  });

  // node_modules/mediasoup-client/lib/handlers/ortc/utils.js
  var require_utils2 = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/ortc/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.addNackSupportForOpus = addNackSupportForOpus;
      exports.addHeaderExtensionSupport = addHeaderExtensionSupport;
      exports.getMsidStreamIdAndTrackId = getMsidStreamIdAndTrackId;
      function addNackSupportForOpus(rtpCapabilities) {
        for (const codec of rtpCapabilities.codecs ?? []) {
          if ((codec.mimeType.toLowerCase() === "audio/opus" || codec.mimeType.toLowerCase() === "audio/multiopus") && !codec.rtcpFeedback?.some((fb) => fb.type === "nack" && !fb.parameter)) {
            if (!codec.rtcpFeedback) {
              codec.rtcpFeedback = [];
            }
            codec.rtcpFeedback.push({ type: "nack" });
          }
        }
      }
      function addHeaderExtensionSupport(rtpCapabilities, headerExtension) {
        let preferredId;
        const existingHeaderExtension = rtpCapabilities.headerExtensions?.find((exten) => exten.uri === headerExtension.uri);
        if (existingHeaderExtension) {
          if (existingHeaderExtension.kind === headerExtension.kind) {
            return;
          } else {
            preferredId = existingHeaderExtension.preferredId;
          }
        }
        if (!rtpCapabilities.headerExtensions) {
          rtpCapabilities.headerExtensions = [];
        }
        if (preferredId === void 0) {
          preferredId = 1;
          const setPreferredIds = new Set(rtpCapabilities.headerExtensions.map((exten) => exten.preferredId));
          while (setPreferredIds.has(preferredId)) {
            ++preferredId;
          }
        }
        const newHeaderExtension = {
          kind: headerExtension.kind,
          uri: headerExtension.uri,
          preferredId,
          preferredEncrypt: false,
          direction: headerExtension.direction
        };
        rtpCapabilities.headerExtensions.push(newHeaderExtension);
      }
      function getMsidStreamIdAndTrackId(msid) {
        if (!msid || typeof msid !== "string") {
          return { msidStreamId: void 0, msidTrackId: void 0 };
        }
        const [msidStreamId, msidTrackId] = msid.trim().split(/\s+/);
        if (!msidStreamId) {
          return { msidStreamId: void 0, msidTrackId: void 0 };
        }
        return { msidStreamId, msidTrackId };
      }
    }
  });

  // node_modules/mediasoup-client/lib/handlers/Chrome111.js
  var require_Chrome111 = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/Chrome111.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Chrome111 = void 0;
      var sdpTransform = require_lib3();
      var enhancedEvents_1 = require_enhancedEvents();
      var Logger_1 = require_Logger();
      var ortc = require_ortc();
      var errors_1 = require_errors();
      var scalabilityModes_1 = require_scalabilityModes();
      var RemoteSdp_1 = require_RemoteSdp();
      var sdpCommonUtils = require_commonUtils();
      var sdpUnifiedPlanUtils = require_unifiedPlanUtils();
      var ortcUtils = require_utils2();
      var logger = new Logger_1.Logger("Chrome111");
      var NAME = "Chrome111";
      var SCTP_NUM_STREAMS = { OS: 1024, MIS: 1024 };
      var Chrome111 = class _Chrome111 extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ direction, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, getSendExtendedRtpCapabilities }) {
          super();
          // Closed flag.
          __publicField(this, "_closed", false);
          // Handler direction.
          __publicField(this, "_direction");
          // Remote SDP handler.
          __publicField(this, "_remoteSdp");
          // Callback to request sending extended RTP capabilities on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // Initial server side DTLS role. If not 'auto', it will force the opposite
          // value in client side.
          __publicField(this, "_forcedLocalDtlsRole");
          // RTCPeerConnection instance.
          __publicField(this, "_pc");
          // Map of RTCTransceivers indexed by MID.
          __publicField(this, "_mapMidTransceiver", /* @__PURE__ */ new Map());
          // Default local stream for sending if no `streamId` is given in send().
          __publicField(this, "_sendStream", new MediaStream());
          // Whether a DataChannel m=application section has been created.
          __publicField(this, "_hasDataChannelMediaSection", false);
          // Sending DataChannel id value counter. Incremented for each new DataChannel.
          __publicField(this, "_nextSendSctpStreamId", 0);
          // Got transport local and remote parameters.
          __publicField(this, "_transportReady", false);
          __publicField(this, "onIceGatheringStateChange", () => {
            this.emit("@icegatheringstatechange", this._pc.iceGatheringState);
          });
          __publicField(this, "onIceCandidateError", (event) => {
            this.emit("@icecandidateerror", event);
          });
          __publicField(this, "onConnectionStateChange", () => {
            this.emit("@connectionstatechange", this._pc.connectionState);
          });
          __publicField(this, "onIceConnectionStateChange", () => {
            switch (this._pc.iceConnectionState) {
              case "checking": {
                this.emit("@connectionstatechange", "connecting");
                break;
              }
              case "connected":
              case "completed": {
                this.emit("@connectionstatechange", "connected");
                break;
              }
              case "failed": {
                this.emit("@connectionstatechange", "failed");
                break;
              }
              case "disconnected": {
                this.emit("@connectionstatechange", "disconnected");
                break;
              }
              case "closed": {
                this.emit("@connectionstatechange", "closed");
                break;
              }
            }
          });
          logger.debug("constructor()");
          this._direction = direction;
          this._remoteSdp = new RemoteSdp_1.RemoteSdp({
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters
          });
          this._getSendExtendedRtpCapabilities = getSendExtendedRtpCapabilities;
          if (dtlsParameters.role && dtlsParameters.role !== "auto") {
            this._forcedLocalDtlsRole = dtlsParameters.role === "server" ? "client" : "server";
          }
          this._pc = new RTCPeerConnection({
            iceServers: iceServers ?? [],
            iceTransportPolicy: iceTransportPolicy ?? "all",
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            ...additionalSettings
          });
          this._pc.addEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.addEventListener("icecandidateerror", this.onIceCandidateError);
          if (this._pc.connectionState) {
            this._pc.addEventListener("connectionstatechange", this.onConnectionStateChange);
          } else {
            logger.warn("run() | pc.connectionState not supported, using pc.iceConnectionState");
            this._pc.addEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          }
        }
        /**
         * Creates a factory function.
         */
        static createFactory() {
          return {
            name: NAME,
            factory: (options) => new _Chrome111(options),
            getNativeRtpCapabilities: async ({ direction }) => {
              logger.debug("getNativeRtpCapabilities() [direction:%o]", direction);
              let pc = new RTCPeerConnection({
                iceServers: [],
                iceTransportPolicy: "all",
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
              });
              try {
                pc.addTransceiver("audio", { direction });
                pc.addTransceiver("video", {
                  direction,
                  sendEncodings: [{ scalabilityMode: "L3T3" }]
                });
                const offer = await pc.createOffer();
                try {
                  pc.close();
                } catch (error) {
                }
                pc = void 0;
                const sdpObject = sdpTransform.parse(offer.sdp);
                const nativeRtpCapabilities = _Chrome111.getLocalRtpCapabilities(sdpObject);
                return nativeRtpCapabilities;
              } catch (error) {
                try {
                  pc?.close();
                } catch (error2) {
                }
                pc = void 0;
                throw error;
              }
            },
            getNativeSctpCapabilities: async () => {
              logger.debug("getNativeSctpCapabilities()");
              return {
                numStreams: SCTP_NUM_STREAMS
              };
            }
          };
        }
        static getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions = []) {
          const nativeRtpCapabilities = sdpCommonUtils.extractRtpCapabilities({
            sdpObject: localSdpObject
          });
          ortc.validateAndNormalizeRtpCapabilities(nativeRtpCapabilities);
          ortcUtils.addNackSupportForOpus(nativeRtpCapabilities);
          for (const headerExtension of extraHeaderExtensions) {
            ortcUtils.addHeaderExtensionSupport(nativeRtpCapabilities, headerExtension);
          }
          return nativeRtpCapabilities;
        }
        get name() {
          return NAME;
        }
        close() {
          logger.debug("close()");
          if (this._closed) {
            return;
          }
          this._closed = true;
          try {
            this._pc.close();
          } catch (error) {
          }
          this._pc.removeEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.removeEventListener("icecandidateerror", this.onIceCandidateError);
          this._pc.removeEventListener("connectionstatechange", this.onConnectionStateChange);
          this._pc.removeEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          this.emit("@close");
          super.close();
        }
        async updateIceServers(iceServers) {
          this.assertNotClosed();
          logger.debug("updateIceServers()");
          const configuration = this._pc.getConfiguration();
          configuration.iceServers = iceServers;
          this._pc.setConfiguration(configuration);
        }
        async restartIce(iceParameters) {
          this.assertNotClosed();
          logger.debug("restartIce()");
          this._remoteSdp.updateIceParameters(iceParameters);
          if (!this._transportReady) {
            return;
          }
          if (this._direction === "send") {
            const offer = await this._pc.createOffer({ iceRestart: true });
            logger.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
          } else {
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            logger.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
          }
        }
        async getTransportStats() {
          this.assertNotClosed();
          return this._pc.getStats();
        }
        async send({ track, streamId, encodings, codecOptions, headerExtensionOptions, codec, onRtpSender }) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("send() [kind:%s, track.id:%s, streamId:%s]", track.kind, track.id, streamId);
          if (encodings && encodings.length > 1) {
            let maxTemporalLayers = 1;
            for (const encoding of encodings) {
              const temporalLayers = encoding.scalabilityMode ? (0, scalabilityModes_1.parse)(encoding.scalabilityMode).temporalLayers : 3;
              if (temporalLayers > maxTemporalLayers) {
                maxTemporalLayers = temporalLayers;
              }
            }
            encodings.forEach((encoding, idx) => {
              encoding.rid = `r${idx}`;
              encoding.scalabilityMode = `L1T${maxTemporalLayers}`;
            });
          }
          const mediaSectionIdx = this._remoteSdp.getNextMediaSectionIdx();
          const transceiver = this._pc.addTransceiver(track, {
            direction: "sendonly",
            streams: [this._sendStream],
            sendEncodings: encodings
          });
          if (onRtpSender) {
            onRtpSender(transceiver.sender);
          }
          let offer = await this._pc.createOffer();
          let localSdpObject = sdpTransform.parse(offer.sdp);
          if (localSdpObject.extmapAllowMixed) {
            this._remoteSdp.setSessionExtmapAllowMixed();
          }
          const extraHeaderExtensions = [];
          extraHeaderExtensions.push({
            uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
            kind: track.kind,
            direction: "sendonly"
          });
          const nativeRtpCapabilities = _Chrome111.getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions);
          const sendExtendedRtpCapabilities = this._getSendExtendedRtpCapabilities(nativeRtpCapabilities);
          const sendingRtpParameters = ortc.getSendingRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRtpParameters.codecs = ortc.reduceCodecs(sendingRtpParameters.codecs, codec);
          const sendingRemoteRtpParameters = ortc.getSendingRemoteRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRemoteRtpParameters.codecs = ortc.reduceCodecs(sendingRemoteRtpParameters.codecs, codec);
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          if (headerExtensionOptions?.absCaptureTime) {
            const offerMediaObject2 = localSdpObject.media[mediaSectionIdx.idx];
            sdpCommonUtils.addHeaderExtension({
              offerMediaObject: offerMediaObject2,
              headerExtensionUri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
              headerExtensionId: sendingRemoteRtpParameters.headerExtensions.find((headerExtension) => headerExtension.uri === "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time").id
            });
            offer = {
              type: "offer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          logger.debug("send() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const localId = transceiver.mid;
          sendingRtpParameters.mid = localId;
          localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          const offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
          sendingRtpParameters.rtcp.cname = sdpCommonUtils.getCname({
            offerMediaObject
          });
          sendingRtpParameters.msid = `${streamId ?? this._sendStream.id} ${track.id}`;
          if (!encodings) {
            sendingRtpParameters.encodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
          } else if (encodings.length === 1) {
            const newEncodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
            Object.assign(newEncodings[0], encodings[0]);
            sendingRtpParameters.encodings = newEncodings;
          } else {
            sendingRtpParameters.encodings = encodings;
          }
          this._remoteSdp.send({
            offerMediaObject,
            reuseMid: mediaSectionIdx.reuseMid,
            offerRtpParameters: sendingRtpParameters,
            answerRtpParameters: sendingRemoteRtpParameters,
            codecOptions
          });
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("send() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.set(localId, transceiver);
          return {
            localId,
            rtpParameters: sendingRtpParameters,
            rtpSender: transceiver.sender
          };
        }
        async stopSending(localId) {
          this.assertSendDirection();
          logger.debug("stopSending() [localId:%s]", localId);
          if (this._closed) {
            return;
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          void transceiver.sender.replaceTrack(null);
          this._pc.removeTrack(transceiver.sender);
          const mediaSectionClosed = this._remoteSdp.closeMediaSection(transceiver.mid);
          if (mediaSectionClosed) {
            try {
              transceiver.stop();
            } catch (error) {
            }
          }
          const offer = await this._pc.createOffer();
          logger.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.delete(localId);
        }
        async pauseSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("pauseSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "inactive";
          this._remoteSdp.pauseMediaSection(localId);
          const offer = await this._pc.createOffer();
          logger.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async resumeSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("resumeSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          this._remoteSdp.resumeSendingMediaSection(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "sendonly";
          const offer = await this._pc.createOffer();
          logger.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async replaceTrack(localId, track) {
          this.assertNotClosed();
          this.assertSendDirection();
          if (track) {
            logger.debug("replaceTrack() [localId:%s, track.id:%s]", localId, track.id);
          } else {
            logger.debug("replaceTrack() [localId:%s, no track]", localId);
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          await transceiver.sender.replaceTrack(track);
        }
        async setMaxSpatialLayer(localId, spatialLayer) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", localId, spatialLayer);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            if (idx <= spatialLayer) {
              encoding.active = true;
            } else {
              encoding.active = false;
            }
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async setRtpEncodingParameters(localId, params) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setRtpEncodingParameters() [localId:%s, params:%o]", localId, params);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            parameters.encodings[idx] = { ...encoding, ...params };
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async getSenderStats(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.sender.getStats();
        }
        async sendDataChannel({ ordered, maxPacketLifeTime, maxRetransmits, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertSendDirection();
          const options = {
            negotiated: true,
            id: this._nextSendSctpStreamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("sendDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % SCTP_NUM_STREAMS.MIS;
          if (!this._hasDataChannelMediaSection) {
            const offer = await this._pc.createOffer();
            const localSdpObject = sdpTransform.parse(offer.sdp);
            const offerMediaObject = localSdpObject.media.find((m) => m.type === "application");
            if (!this._transportReady) {
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            this._remoteSdp.sendSctpAssociation({ offerMediaObject });
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          const sctpStreamParameters = {
            streamId: options.id,
            ordered: options.ordered,
            maxPacketLifeTime: options.maxPacketLifeTime,
            maxRetransmits: options.maxRetransmits
          };
          return { dataChannel, sctpStreamParameters };
        }
        async receive(optionsList) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const results = [];
          const mapLocalId = /* @__PURE__ */ new Map();
          for (const options of optionsList) {
            const { trackId, kind, rtpParameters, streamId } = options;
            logger.debug("receive() [trackId:%s, kind:%s]", trackId, kind);
            const localId = rtpParameters.mid ?? String(this._mapMidTransceiver.size);
            mapLocalId.set(trackId, localId);
            const { msidStreamId } = ortcUtils.getMsidStreamIdAndTrackId(rtpParameters.msid);
            this._remoteSdp.receive({
              mid: localId,
              kind,
              offerRtpParameters: rtpParameters,
              streamId: streamId ?? msidStreamId ?? rtpParameters.rtcp?.cname ?? "-",
              trackId
            });
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          for (const options of optionsList) {
            const { trackId, onRtpReceiver } = options;
            if (onRtpReceiver) {
              const localId = mapLocalId.get(trackId);
              const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
              if (!transceiver) {
                throw new Error("transceiver not found");
              }
              onRtpReceiver(transceiver.receiver);
            }
          }
          let answer = await this._pc.createAnswer();
          const localSdpObject = sdpTransform.parse(answer.sdp);
          for (const options of optionsList) {
            const { trackId, rtpParameters } = options;
            const localId = mapLocalId.get(trackId);
            const answerMediaObject = localSdpObject.media.find((m) => String(m.mid) === localId);
            sdpCommonUtils.applyCodecParameters({
              offerRtpParameters: rtpParameters,
              answerMediaObject
            });
          }
          answer = {
            type: "answer",
            sdp: sdpTransform.write(localSdpObject)
          };
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          logger.debug("receive() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const options of optionsList) {
            const { trackId } = options;
            const localId = mapLocalId.get(trackId);
            const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
            if (!transceiver) {
              throw new Error("new RTCRtpTransceiver not found");
            } else {
              this._mapMidTransceiver.set(localId, transceiver);
              results.push({
                localId,
                track: transceiver.receiver.track,
                rtpReceiver: transceiver.receiver
              });
            }
          }
          return results;
        }
        async stopReceiving(localIds) {
          this.assertRecvDirection();
          if (this._closed) {
            return;
          }
          for (const localId of localIds) {
            logger.debug("stopReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            this._remoteSdp.closeMediaSection(transceiver.mid);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const localId of localIds) {
            this._mapMidTransceiver.delete(localId);
          }
        }
        async pauseReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("pauseReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "inactive";
            this._remoteSdp.pauseMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async resumeReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("resumeReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "recvonly";
            this._remoteSdp.resumeReceivingMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async getReceiverStats(localId) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.receiver.getStats();
        }
        async receiveDataChannel({ sctpStreamParameters, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const { streamId, ordered, maxPacketLifeTime, maxRetransmits } = sctpStreamParameters;
          const options = {
            negotiated: true,
            id: streamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("receiveDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          if (!this._hasDataChannelMediaSection) {
            this._remoteSdp.receiveSctpAssociation();
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            if (!this._transportReady) {
              const localSdpObject = sdpTransform.parse(answer.sdp);
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          return { dataChannel };
        }
        async setupTransport({ localDtlsRole, localSdpObject }) {
          if (!localSdpObject) {
            localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          }
          const dtlsParameters = sdpCommonUtils.extractDtlsParameters({
            sdpObject: localSdpObject
          });
          dtlsParameters.role = localDtlsRole;
          this._remoteSdp.updateDtlsRole(localDtlsRole === "client" ? "server" : "client");
          await new Promise((resolve, reject) => {
            this.safeEmit("@connect", { dtlsParameters }, resolve, reject);
          });
          this._transportReady = true;
        }
        assertNotClosed() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("method called in a closed handler");
          }
        }
        assertSendDirection() {
          if (this._direction !== "send") {
            throw new Error('method can just be called for handlers with "send" direction');
          }
        }
        assertRecvDirection() {
          if (this._direction !== "recv") {
            throw new Error('method can just be called for handlers with "recv" direction');
          }
        }
      };
      exports.Chrome111 = Chrome111;
    }
  });

  // node_modules/mediasoup-client/lib/handlers/Chrome74.js
  var require_Chrome74 = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/Chrome74.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Chrome74 = void 0;
      var sdpTransform = require_lib3();
      var Logger_1 = require_Logger();
      var enhancedEvents_1 = require_enhancedEvents();
      var ortc = require_ortc();
      var errors_1 = require_errors();
      var scalabilityModes_1 = require_scalabilityModes();
      var RemoteSdp_1 = require_RemoteSdp();
      var sdpCommonUtils = require_commonUtils();
      var sdpUnifiedPlanUtils = require_unifiedPlanUtils();
      var ortcUtils = require_utils2();
      var logger = new Logger_1.Logger("Chrome74");
      var NAME = "Chrome74";
      var SCTP_NUM_STREAMS = { OS: 1024, MIS: 1024 };
      var Chrome74 = class _Chrome74 extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ direction, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, getSendExtendedRtpCapabilities }) {
          super();
          // Closed flag.
          __publicField(this, "_closed", false);
          // Handler direction.
          __publicField(this, "_direction");
          // Remote SDP handler.
          __publicField(this, "_remoteSdp");
          // Callback to request sending extended RTP capabilities on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // Initial server side DTLS role. If not 'auto', it will force the opposite
          // value in client side.
          __publicField(this, "_forcedLocalDtlsRole");
          // RTCPeerConnection instance.
          __publicField(this, "_pc");
          // Map of RTCTransceivers indexed by MID.
          __publicField(this, "_mapMidTransceiver", /* @__PURE__ */ new Map());
          // Default local stream for sending if no `streamId` is given in send().
          __publicField(this, "_sendStream", new MediaStream());
          // Whether a DataChannel m=application section has been created.
          __publicField(this, "_hasDataChannelMediaSection", false);
          // Sending DataChannel id value counter. Incremented for each new DataChannel.
          __publicField(this, "_nextSendSctpStreamId", 0);
          // Got transport local and remote parameters.
          __publicField(this, "_transportReady", false);
          __publicField(this, "onIceGatheringStateChange", () => {
            this.emit("@icegatheringstatechange", this._pc.iceGatheringState);
          });
          __publicField(this, "onIceCandidateError", (event) => {
            this.emit("@icecandidateerror", event);
          });
          __publicField(this, "onConnectionStateChange", () => {
            this.emit("@connectionstatechange", this._pc.connectionState);
          });
          __publicField(this, "onIceConnectionStateChange", () => {
            switch (this._pc.iceConnectionState) {
              case "checking": {
                this.emit("@connectionstatechange", "connecting");
                break;
              }
              case "connected":
              case "completed": {
                this.emit("@connectionstatechange", "connected");
                break;
              }
              case "failed": {
                this.emit("@connectionstatechange", "failed");
                break;
              }
              case "disconnected": {
                this.emit("@connectionstatechange", "disconnected");
                break;
              }
              case "closed": {
                this.emit("@connectionstatechange", "closed");
                break;
              }
            }
          });
          logger.debug("constructor()");
          this._direction = direction;
          this._remoteSdp = new RemoteSdp_1.RemoteSdp({
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters
          });
          this._getSendExtendedRtpCapabilities = getSendExtendedRtpCapabilities;
          if (dtlsParameters.role && dtlsParameters.role !== "auto") {
            this._forcedLocalDtlsRole = dtlsParameters.role === "server" ? "client" : "server";
          }
          this._pc = new RTCPeerConnection({
            iceServers: iceServers ?? [],
            iceTransportPolicy: iceTransportPolicy ?? "all",
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            ...additionalSettings
          });
          this._pc.addEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.addEventListener("icecandidateerror", this.onIceCandidateError);
          if (this._pc.connectionState) {
            this._pc.addEventListener("connectionstatechange", this.onConnectionStateChange);
          } else {
            logger.warn("run() | pc.connectionState not supported, using pc.iceConnectionState");
            this._pc.addEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          }
        }
        /**
         * Creates a factory function.
         */
        static createFactory() {
          return {
            name: NAME,
            factory: (options) => new _Chrome74(options),
            getNativeRtpCapabilities: async ({ direction }) => {
              logger.debug("getNativeRtpCapabilities() [direction:%o]", direction);
              let pc = new RTCPeerConnection({
                iceServers: [],
                iceTransportPolicy: "all",
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
              });
              try {
                pc.addTransceiver("audio", { direction });
                pc.addTransceiver("video", { direction });
                const offer = await pc.createOffer();
                try {
                  pc.close();
                } catch (error) {
                }
                pc = void 0;
                const sdpObject = sdpTransform.parse(offer.sdp);
                const nativeRtpCapabilities = _Chrome74.getLocalRtpCapabilities(sdpObject);
                return nativeRtpCapabilities;
              } catch (error) {
                try {
                  pc?.close();
                } catch (error2) {
                }
                pc = void 0;
                throw error;
              }
            },
            getNativeSctpCapabilities: async () => {
              logger.debug("getNativeSctpCapabilities()");
              return {
                numStreams: SCTP_NUM_STREAMS
              };
            }
          };
        }
        static getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions = []) {
          const nativeRtpCapabilities = sdpCommonUtils.extractRtpCapabilities({
            sdpObject: localSdpObject
          });
          ortc.validateAndNormalizeRtpCapabilities(nativeRtpCapabilities);
          ortcUtils.addNackSupportForOpus(nativeRtpCapabilities);
          for (const headerExtension of extraHeaderExtensions) {
            ortcUtils.addHeaderExtensionSupport(nativeRtpCapabilities, headerExtension);
          }
          return nativeRtpCapabilities;
        }
        get name() {
          return NAME;
        }
        close() {
          logger.debug("close()");
          if (this._closed) {
            return;
          }
          this._closed = true;
          try {
            this._pc.close();
          } catch (error) {
          }
          this._pc.removeEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.removeEventListener("icecandidateerror", this.onIceCandidateError);
          this._pc.removeEventListener("connectionstatechange", this.onConnectionStateChange);
          this._pc.removeEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          this.emit("@close");
          super.close();
        }
        async updateIceServers(iceServers) {
          this.assertNotClosed();
          logger.debug("updateIceServers()");
          const configuration = this._pc.getConfiguration();
          configuration.iceServers = iceServers;
          this._pc.setConfiguration(configuration);
        }
        async restartIce(iceParameters) {
          this.assertNotClosed();
          logger.debug("restartIce()");
          this._remoteSdp.updateIceParameters(iceParameters);
          if (!this._transportReady) {
            return;
          }
          if (this._direction === "send") {
            const offer = await this._pc.createOffer({ iceRestart: true });
            logger.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
          } else {
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            logger.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
          }
        }
        async getTransportStats() {
          this.assertNotClosed();
          return this._pc.getStats();
        }
        async send({ track, streamId, encodings, codecOptions, headerExtensionOptions, codec }) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("send() [kind:%s, track.id:%s, streamId:%s]", track.kind, track.id, streamId);
          if (encodings && encodings.length > 1) {
            encodings.forEach((encoding, idx) => {
              encoding.rid = `r${idx}`;
            });
          }
          const mediaSectionIdx = this._remoteSdp.getNextMediaSectionIdx();
          const transceiver = this._pc.addTransceiver(track, {
            direction: "sendonly",
            streams: [this._sendStream],
            sendEncodings: encodings
          });
          let offer = await this._pc.createOffer();
          let localSdpObject = sdpTransform.parse(offer.sdp);
          if (localSdpObject.extmapAllowMixed) {
            this._remoteSdp.setSessionExtmapAllowMixed();
          }
          const extraHeaderExtensions = [];
          extraHeaderExtensions.push({
            uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
            kind: track.kind,
            direction: "sendonly"
          });
          const nativeRtpCapabilities = _Chrome74.getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions);
          const sendExtendedRtpCapabilities = this._getSendExtendedRtpCapabilities(nativeRtpCapabilities);
          const sendingRtpParameters = ortc.getSendingRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRtpParameters.codecs = ortc.reduceCodecs(sendingRtpParameters.codecs, codec);
          const sendingRemoteRtpParameters = ortc.getSendingRemoteRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRemoteRtpParameters.codecs = ortc.reduceCodecs(sendingRemoteRtpParameters.codecs, codec);
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          let hackVp9Svc = false;
          const layers = (0, scalabilityModes_1.parse)((encodings ?? [{}])[0].scalabilityMode);
          let offerMediaObject;
          if (encodings?.length === 1 && layers.spatialLayers > 1 && sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/vp9") {
            logger.debug("send() | enabling legacy simulcast for VP9 SVC");
            hackVp9Svc = true;
            localSdpObject = sdpTransform.parse(offer.sdp);
            offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
            sdpUnifiedPlanUtils.addLegacySimulcast({
              offerMediaObject,
              numStreams: layers.spatialLayers
            });
            offer = {
              type: "offer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          logger.debug("send() | calling pc.setLocalDescription() [offer:%o]", offer);
          if (headerExtensionOptions?.absCaptureTime) {
            offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
            sdpCommonUtils.addHeaderExtension({
              offerMediaObject,
              headerExtensionUri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
              headerExtensionId: sendingRemoteRtpParameters.headerExtensions.find((headerExtension) => headerExtension.uri === "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time").id
            });
            offer = {
              type: "offer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          await this._pc.setLocalDescription(offer);
          const localId = transceiver.mid;
          sendingRtpParameters.mid = localId;
          localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
          sendingRtpParameters.rtcp.cname = sdpCommonUtils.getCname({
            offerMediaObject
          });
          sendingRtpParameters.msid = `${streamId ?? this._sendStream.id} ${track.id}`;
          if (!encodings) {
            sendingRtpParameters.encodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
          } else if (encodings.length === 1) {
            let newEncodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
            Object.assign(newEncodings[0], encodings[0]);
            if (hackVp9Svc) {
              newEncodings = [newEncodings[0]];
            }
            sendingRtpParameters.encodings = newEncodings;
          } else {
            sendingRtpParameters.encodings = encodings;
          }
          if (sendingRtpParameters.encodings.length > 1 && (sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/vp8" || sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/h264")) {
            for (const encoding of sendingRtpParameters.encodings) {
              if (encoding.scalabilityMode) {
                encoding.scalabilityMode = `L1T${layers.temporalLayers}`;
              } else {
                encoding.scalabilityMode = "L1T3";
              }
            }
          }
          this._remoteSdp.send({
            offerMediaObject,
            reuseMid: mediaSectionIdx.reuseMid,
            offerRtpParameters: sendingRtpParameters,
            answerRtpParameters: sendingRemoteRtpParameters,
            codecOptions
          });
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("send() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.set(localId, transceiver);
          return {
            localId,
            rtpParameters: sendingRtpParameters,
            rtpSender: transceiver.sender
          };
        }
        async stopSending(localId) {
          this.assertSendDirection();
          logger.debug("stopSending() [localId:%s]", localId);
          if (this._closed) {
            return;
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          void transceiver.sender.replaceTrack(null);
          this._pc.removeTrack(transceiver.sender);
          const mediaSectionClosed = this._remoteSdp.closeMediaSection(transceiver.mid);
          if (mediaSectionClosed) {
            try {
              transceiver.stop();
            } catch (error) {
            }
          }
          const offer = await this._pc.createOffer();
          logger.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.delete(localId);
        }
        async pauseSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("pauseSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "inactive";
          this._remoteSdp.pauseMediaSection(localId);
          const offer = await this._pc.createOffer();
          logger.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async resumeSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("resumeSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          this._remoteSdp.resumeSendingMediaSection(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "sendonly";
          const offer = await this._pc.createOffer();
          logger.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async replaceTrack(localId, track) {
          this.assertNotClosed();
          this.assertSendDirection();
          if (track) {
            logger.debug("replaceTrack() [localId:%s, track.id:%s]", localId, track.id);
          } else {
            logger.debug("replaceTrack() [localId:%s, no track]", localId);
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          await transceiver.sender.replaceTrack(track);
        }
        async setMaxSpatialLayer(localId, spatialLayer) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", localId, spatialLayer);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            if (idx <= spatialLayer) {
              encoding.active = true;
            } else {
              encoding.active = false;
            }
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async setRtpEncodingParameters(localId, params) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setRtpEncodingParameters() [localId:%s, params:%o]", localId, params);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            parameters.encodings[idx] = { ...encoding, ...params };
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async getSenderStats(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.sender.getStats();
        }
        async sendDataChannel({ ordered, maxPacketLifeTime, maxRetransmits, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertSendDirection();
          const options = {
            negotiated: true,
            id: this._nextSendSctpStreamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("sendDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % SCTP_NUM_STREAMS.MIS;
          if (!this._hasDataChannelMediaSection) {
            const offer = await this._pc.createOffer();
            const localSdpObject = sdpTransform.parse(offer.sdp);
            const offerMediaObject = localSdpObject.media.find((m) => m.type === "application");
            if (!this._transportReady) {
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            this._remoteSdp.sendSctpAssociation({ offerMediaObject });
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          const sctpStreamParameters = {
            streamId: options.id,
            ordered: options.ordered,
            maxPacketLifeTime: options.maxPacketLifeTime,
            maxRetransmits: options.maxRetransmits
          };
          return { dataChannel, sctpStreamParameters };
        }
        async receive(optionsList) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const results = [];
          const mapLocalId = /* @__PURE__ */ new Map();
          for (const options of optionsList) {
            const { trackId, kind, rtpParameters, streamId } = options;
            logger.debug("receive() [trackId:%s, kind:%s]", trackId, kind);
            const localId = rtpParameters.mid ?? String(this._mapMidTransceiver.size);
            mapLocalId.set(trackId, localId);
            const { msidStreamId } = ortcUtils.getMsidStreamIdAndTrackId(rtpParameters.msid);
            this._remoteSdp.receive({
              mid: localId,
              kind,
              offerRtpParameters: rtpParameters,
              streamId: streamId ?? msidStreamId ?? rtpParameters.rtcp?.cname ?? "-",
              trackId
            });
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          let answer = await this._pc.createAnswer();
          const localSdpObject = sdpTransform.parse(answer.sdp);
          for (const options of optionsList) {
            const { trackId, rtpParameters } = options;
            const localId = mapLocalId.get(trackId);
            const answerMediaObject = localSdpObject.media.find((m) => String(m.mid) === localId);
            sdpCommonUtils.applyCodecParameters({
              offerRtpParameters: rtpParameters,
              answerMediaObject
            });
          }
          answer = {
            type: "answer",
            sdp: sdpTransform.write(localSdpObject)
          };
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          logger.debug("receive() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const options of optionsList) {
            const { trackId } = options;
            const localId = mapLocalId.get(trackId);
            const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
            if (!transceiver) {
              throw new Error("new RTCRtpTransceiver not found");
            } else {
              this._mapMidTransceiver.set(localId, transceiver);
              results.push({
                localId,
                track: transceiver.receiver.track,
                rtpReceiver: transceiver.receiver
              });
            }
          }
          return results;
        }
        async stopReceiving(localIds) {
          this.assertRecvDirection();
          if (this._closed) {
            return;
          }
          for (const localId of localIds) {
            logger.debug("stopReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            this._remoteSdp.closeMediaSection(transceiver.mid);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const localId of localIds) {
            this._mapMidTransceiver.delete(localId);
          }
        }
        async pauseReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("pauseReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "inactive";
            this._remoteSdp.pauseMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async resumeReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("resumeReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "recvonly";
            this._remoteSdp.resumeReceivingMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async getReceiverStats(localId) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.receiver.getStats();
        }
        async receiveDataChannel({ sctpStreamParameters, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const { streamId, ordered, maxPacketLifeTime, maxRetransmits } = sctpStreamParameters;
          const options = {
            negotiated: true,
            id: streamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("receiveDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          if (!this._hasDataChannelMediaSection) {
            this._remoteSdp.receiveSctpAssociation();
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            if (!this._transportReady) {
              const localSdpObject = sdpTransform.parse(answer.sdp);
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          return { dataChannel };
        }
        async setupTransport({ localDtlsRole, localSdpObject }) {
          if (!localSdpObject) {
            localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          }
          const dtlsParameters = sdpCommonUtils.extractDtlsParameters({
            sdpObject: localSdpObject
          });
          dtlsParameters.role = localDtlsRole;
          this._remoteSdp.updateDtlsRole(localDtlsRole === "client" ? "server" : "client");
          await new Promise((resolve, reject) => {
            this.safeEmit("@connect", { dtlsParameters }, resolve, reject);
          });
          this._transportReady = true;
        }
        assertNotClosed() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("method called in a closed handler");
          }
        }
        assertSendDirection() {
          if (this._direction !== "send") {
            throw new Error('method can just be called for handlers with "send" direction');
          }
        }
        assertRecvDirection() {
          if (this._direction !== "recv") {
            throw new Error('method can just be called for handlers with "recv" direction');
          }
        }
      };
      exports.Chrome74 = Chrome74;
    }
  });

  // node_modules/mediasoup-client/lib/handlers/Firefox120.js
  var require_Firefox120 = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/Firefox120.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Firefox120 = void 0;
      var sdpTransform = require_lib3();
      var enhancedEvents_1 = require_enhancedEvents();
      var Logger_1 = require_Logger();
      var errors_1 = require_errors();
      var ortc = require_ortc();
      var scalabilityModes_1 = require_scalabilityModes();
      var RemoteSdp_1 = require_RemoteSdp();
      var sdpCommonUtils = require_commonUtils();
      var sdpUnifiedPlanUtils = require_unifiedPlanUtils();
      var ortcUtils = require_utils2();
      var logger = new Logger_1.Logger("Firefox120");
      var NAME = "Firefox120";
      var SCTP_NUM_STREAMS = { OS: 16, MIS: 2048 };
      var Firefox120 = class _Firefox120 extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ direction, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, getSendExtendedRtpCapabilities }) {
          super();
          // Closed flag.
          __publicField(this, "_closed", false);
          // Handler direction.
          __publicField(this, "_direction");
          // Remote SDP handler.
          __publicField(this, "_remoteSdp");
          // Callback to request sending extended RTP capabilities on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // RTCPeerConnection instance.
          __publicField(this, "_pc");
          // Map of RTCTransceivers indexed by MID.
          __publicField(this, "_mapMidTransceiver", /* @__PURE__ */ new Map());
          // Default local stream for sending if no `streamId` is given in send().
          __publicField(this, "_sendStream", new MediaStream());
          // Whether a DataChannel m=application section has been created.
          __publicField(this, "_hasDataChannelMediaSection", false);
          // Sending DataChannel id value counter. Incremented for each new DataChannel.
          __publicField(this, "_nextSendSctpStreamId", 0);
          // Got transport local and remote parameters.
          __publicField(this, "_transportReady", false);
          __publicField(this, "onIceGatheringStateChange", () => {
            this.emit("@icegatheringstatechange", this._pc.iceGatheringState);
          });
          __publicField(this, "onIceCandidateError", (event) => {
            this.emit("@icecandidateerror", event);
          });
          __publicField(this, "onConnectionStateChange", () => {
            this.emit("@connectionstatechange", this._pc.connectionState);
          });
          __publicField(this, "onIceConnectionStateChange", () => {
            switch (this._pc.iceConnectionState) {
              case "checking": {
                this.emit("@connectionstatechange", "connecting");
                break;
              }
              case "connected":
              case "completed": {
                this.emit("@connectionstatechange", "connected");
                break;
              }
              case "failed": {
                this.emit("@connectionstatechange", "failed");
                break;
              }
              case "disconnected": {
                this.emit("@connectionstatechange", "disconnected");
                break;
              }
              case "closed": {
                this.emit("@connectionstatechange", "closed");
                break;
              }
            }
          });
          logger.debug("constructor()");
          this._direction = direction;
          this._remoteSdp = new RemoteSdp_1.RemoteSdp({
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters
          });
          this._getSendExtendedRtpCapabilities = getSendExtendedRtpCapabilities;
          this._pc = new RTCPeerConnection({
            iceServers: iceServers ?? [],
            iceTransportPolicy: iceTransportPolicy ?? "all",
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            ...additionalSettings
          });
          this._pc.addEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.addEventListener("icecandidateerror", this.onIceCandidateError);
          if (this._pc.connectionState) {
            this._pc.addEventListener("connectionstatechange", this.onConnectionStateChange);
          } else {
            logger.warn("run() | pc.connectionState not supported, using pc.iceConnectionState");
            this._pc.addEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          }
        }
        /**
         * Creates a factory function.
         */
        static createFactory() {
          return {
            name: NAME,
            factory: (options) => new _Firefox120(options),
            getNativeRtpCapabilities: async ({ direction }) => {
              logger.debug("getNativeRtpCapabilities() [direction:%o]", direction);
              let pc = new RTCPeerConnection({
                iceServers: [],
                iceTransportPolicy: "all",
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
              });
              const canvas = document.createElement("canvas");
              canvas.getContext("2d");
              const fakeStream = canvas.captureStream();
              const fakeVideoTrack = fakeStream.getVideoTracks()[0];
              try {
                pc.addTransceiver("audio", { direction });
                pc.addTransceiver(fakeVideoTrack, {
                  direction,
                  sendEncodings: [
                    { rid: "r0", maxBitrate: 1e5 },
                    { rid: "r1", maxBitrate: 5e5 }
                  ]
                });
                const offer = await pc.createOffer();
                try {
                  canvas.remove();
                } catch (error) {
                }
                try {
                  fakeVideoTrack.stop();
                } catch (error) {
                }
                try {
                  pc.close();
                } catch (error) {
                }
                pc = void 0;
                const sdpObject = sdpTransform.parse(offer.sdp);
                const nativeRtpCapabilities = _Firefox120.getLocalRtpCapabilities(sdpObject);
                return nativeRtpCapabilities;
              } catch (error) {
                try {
                  canvas.remove();
                } catch (error2) {
                }
                try {
                  fakeVideoTrack.stop();
                } catch (error2) {
                }
                try {
                  pc?.close();
                } catch (error2) {
                }
                pc = void 0;
                throw error;
              }
            },
            getNativeSctpCapabilities: async () => {
              logger.debug("getNativeSctpCapabilities()");
              return {
                numStreams: SCTP_NUM_STREAMS
              };
            }
          };
        }
        static getLocalRtpCapabilities(localSdpObject) {
          const nativeRtpCapabilities = sdpCommonUtils.extractRtpCapabilities({
            sdpObject: localSdpObject
          });
          ortc.validateAndNormalizeRtpCapabilities(nativeRtpCapabilities);
          return nativeRtpCapabilities;
        }
        get name() {
          return NAME;
        }
        close() {
          logger.debug("close()");
          if (this._closed) {
            return;
          }
          this._closed = true;
          try {
            this._pc.close();
          } catch (error) {
          }
          this._pc.removeEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.removeEventListener("icecandidateerror", this.onIceCandidateError);
          this._pc.removeEventListener("connectionstatechange", this.onConnectionStateChange);
          this._pc.removeEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          this.emit("@close");
          super.close();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async updateIceServers(iceServers) {
          this.assertNotClosed();
          throw new errors_1.UnsupportedError("not supported");
        }
        async restartIce(iceParameters) {
          this.assertNotClosed();
          logger.debug("restartIce()");
          this._remoteSdp.updateIceParameters(iceParameters);
          if (!this._transportReady) {
            return;
          }
          if (this._direction === "send") {
            const offer = await this._pc.createOffer({ iceRestart: true });
            logger.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
          } else {
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            logger.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
          }
        }
        async getTransportStats() {
          this.assertNotClosed();
          return this._pc.getStats();
        }
        async send({ track, streamId, encodings, codecOptions, codec, onRtpSender }) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("send() [kind:%s, track.id:%s, streamId:%s]", track.kind, track.id, streamId);
          if (encodings && encodings.length > 1) {
            encodings.forEach((encoding, idx) => {
              encoding.rid = `r${idx}`;
            });
          }
          const transceiver = this._pc.addTransceiver(track, {
            direction: "sendonly",
            streams: [this._sendStream],
            sendEncodings: encodings
          });
          if (onRtpSender) {
            onRtpSender(transceiver.sender);
          }
          const offer = await this._pc.createOffer();
          let localSdpObject = sdpTransform.parse(offer.sdp);
          if (localSdpObject.extmapAllowMixed) {
            this._remoteSdp.setSessionExtmapAllowMixed();
          }
          const nativeRtpCapabilities = _Firefox120.getLocalRtpCapabilities(localSdpObject);
          const sendExtendedRtpCapabilities = this._getSendExtendedRtpCapabilities(nativeRtpCapabilities);
          const sendingRtpParameters = ortc.getSendingRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRtpParameters.codecs = ortc.reduceCodecs(sendingRtpParameters.codecs, codec);
          const sendingRemoteRtpParameters = ortc.getSendingRemoteRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRemoteRtpParameters.codecs = ortc.reduceCodecs(sendingRemoteRtpParameters.codecs, codec);
          if (!this._transportReady) {
            await this.setupTransport({ localDtlsRole: "client", localSdpObject });
          }
          const layers = (0, scalabilityModes_1.parse)((encodings ?? [{}])[0].scalabilityMode);
          logger.debug("send() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const localId = transceiver.mid;
          sendingRtpParameters.mid = localId;
          localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          const offerMediaObject = localSdpObject.media[localSdpObject.media.length - 1];
          sendingRtpParameters.rtcp.cname = sdpCommonUtils.getCname({
            offerMediaObject
          });
          sendingRtpParameters.msid = `${streamId ?? this._sendStream.id} ${track.id}`;
          if (!encodings) {
            sendingRtpParameters.encodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
          } else if (encodings.length === 1) {
            const newEncodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
            Object.assign(newEncodings[0], encodings[0]);
            sendingRtpParameters.encodings = newEncodings;
          } else {
            sendingRtpParameters.encodings = encodings;
          }
          if (sendingRtpParameters.encodings.length > 1 && (sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/vp8" || sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/h264")) {
            for (const encoding of sendingRtpParameters.encodings) {
              if (encoding.scalabilityMode) {
                encoding.scalabilityMode = `L1T${layers.temporalLayers}`;
              } else {
                encoding.scalabilityMode = "L1T3";
              }
            }
          }
          this._remoteSdp.send({
            offerMediaObject,
            offerRtpParameters: sendingRtpParameters,
            answerRtpParameters: sendingRemoteRtpParameters,
            codecOptions
          });
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("send() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.set(localId, transceiver);
          return {
            localId,
            rtpParameters: sendingRtpParameters,
            rtpSender: transceiver.sender
          };
        }
        async stopSending(localId) {
          this.assertSendDirection();
          logger.debug("stopSending() [localId:%s]", localId);
          if (this._closed) {
            return;
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated transceiver not found");
          }
          void transceiver.sender.replaceTrack(null);
          this._pc.removeTrack(transceiver.sender);
          this._remoteSdp.disableMediaSection(transceiver.mid);
          const offer = await this._pc.createOffer();
          logger.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.delete(localId);
        }
        async pauseSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("pauseSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "inactive";
          this._remoteSdp.pauseMediaSection(localId);
          const offer = await this._pc.createOffer();
          logger.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async resumeSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("resumeSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "sendonly";
          this._remoteSdp.resumeSendingMediaSection(localId);
          const offer = await this._pc.createOffer();
          logger.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async replaceTrack(localId, track) {
          this.assertNotClosed();
          this.assertSendDirection();
          if (track) {
            logger.debug("replaceTrack() [localId:%s, track.id:%s]", localId, track.id);
          } else {
            logger.debug("replaceTrack() [localId:%s, no track]", localId);
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          await transceiver.sender.replaceTrack(track);
        }
        async setMaxSpatialLayer(localId, spatialLayer) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", localId, spatialLayer);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated transceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            if (idx <= spatialLayer) {
              encoding.active = true;
            } else {
              encoding.active = false;
            }
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async setRtpEncodingParameters(localId, params) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setRtpEncodingParameters() [localId:%s, params:%o]", localId, params);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            parameters.encodings[idx] = { ...encoding, ...params };
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async getSenderStats(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.sender.getStats();
        }
        async sendDataChannel({ ordered, maxPacketLifeTime, maxRetransmits, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertSendDirection();
          const options = {
            negotiated: true,
            id: this._nextSendSctpStreamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("sendDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % SCTP_NUM_STREAMS.MIS;
          if (!this._hasDataChannelMediaSection) {
            const offer = await this._pc.createOffer();
            const localSdpObject = sdpTransform.parse(offer.sdp);
            const offerMediaObject = localSdpObject.media.find((m) => m.type === "application");
            if (!this._transportReady) {
              await this.setupTransport({ localDtlsRole: "client", localSdpObject });
            }
            logger.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            this._remoteSdp.sendSctpAssociation({ offerMediaObject });
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          const sctpStreamParameters = {
            streamId: options.id,
            ordered: options.ordered,
            maxPacketLifeTime: options.maxPacketLifeTime,
            maxRetransmits: options.maxRetransmits
          };
          return { dataChannel, sctpStreamParameters };
        }
        async receive(optionsList) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const results = [];
          const mapLocalId = /* @__PURE__ */ new Map();
          for (const options of optionsList) {
            const { trackId, kind, rtpParameters, streamId } = options;
            logger.debug("receive() [trackId:%s, kind:%s]", trackId, kind);
            const localId = rtpParameters.mid ?? String(this._mapMidTransceiver.size);
            mapLocalId.set(trackId, localId);
            const { msidStreamId } = ortcUtils.getMsidStreamIdAndTrackId(rtpParameters.msid);
            this._remoteSdp.receive({
              mid: localId,
              kind,
              offerRtpParameters: rtpParameters,
              streamId: streamId ?? msidStreamId ?? rtpParameters.rtcp?.cname ?? "-",
              trackId
            });
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          for (const options of optionsList) {
            const { trackId, onRtpReceiver } = options;
            if (onRtpReceiver) {
              const localId = mapLocalId.get(trackId);
              const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
              if (!transceiver) {
                throw new Error("transceiver not found");
              }
              onRtpReceiver(transceiver.receiver);
            }
          }
          let answer = await this._pc.createAnswer();
          const localSdpObject = sdpTransform.parse(answer.sdp);
          for (const options of optionsList) {
            const { trackId, rtpParameters } = options;
            const localId = mapLocalId.get(trackId);
            const answerMediaObject = localSdpObject.media.find((m) => String(m.mid) === localId);
            sdpCommonUtils.applyCodecParameters({
              offerRtpParameters: rtpParameters,
              answerMediaObject
            });
            answer = {
              type: "answer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          if (!this._transportReady) {
            await this.setupTransport({ localDtlsRole: "client", localSdpObject });
          }
          logger.debug("receive() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const options of optionsList) {
            const { trackId } = options;
            const localId = mapLocalId.get(trackId);
            const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
            if (!transceiver) {
              throw new Error("new RTCRtpTransceiver not found");
            }
            this._mapMidTransceiver.set(localId, transceiver);
            results.push({
              localId,
              track: transceiver.receiver.track,
              rtpReceiver: transceiver.receiver
            });
          }
          return results;
        }
        async stopReceiving(localIds) {
          this.assertRecvDirection();
          if (this._closed) {
            return;
          }
          for (const localId of localIds) {
            logger.debug("stopReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            this._remoteSdp.closeMediaSection(transceiver.mid);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const localId of localIds) {
            this._mapMidTransceiver.delete(localId);
          }
        }
        async pauseReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("pauseReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "inactive";
            this._remoteSdp.pauseMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async resumeReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("resumeReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "recvonly";
            this._remoteSdp.resumeReceivingMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async getReceiverStats(localId) {
          this.assertRecvDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.receiver.getStats();
        }
        async receiveDataChannel({ sctpStreamParameters, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const { streamId, ordered, maxPacketLifeTime, maxRetransmits } = sctpStreamParameters;
          const options = {
            negotiated: true,
            id: streamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("receiveDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          if (!this._hasDataChannelMediaSection) {
            this._remoteSdp.receiveSctpAssociation();
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            if (!this._transportReady) {
              const localSdpObject = sdpTransform.parse(answer.sdp);
              await this.setupTransport({ localDtlsRole: "client", localSdpObject });
            }
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          return { dataChannel };
        }
        async setupTransport({ localDtlsRole, localSdpObject }) {
          if (!localSdpObject) {
            localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          }
          const dtlsParameters = sdpCommonUtils.extractDtlsParameters({
            sdpObject: localSdpObject
          });
          dtlsParameters.role = localDtlsRole;
          this._remoteSdp.updateDtlsRole(localDtlsRole === "client" ? "server" : "client");
          await new Promise((resolve, reject) => {
            this.safeEmit("@connect", { dtlsParameters }, resolve, reject);
          });
          this._transportReady = true;
        }
        assertNotClosed() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("method called in a closed handler");
          }
        }
        assertSendDirection() {
          if (this._direction !== "send") {
            throw new Error('method can just be called for handlers with "send" direction');
          }
        }
        assertRecvDirection() {
          if (this._direction !== "recv") {
            throw new Error('method can just be called for handlers with "recv" direction');
          }
        }
      };
      exports.Firefox120 = Firefox120;
    }
  });

  // node_modules/mediasoup-client/lib/handlers/Safari12.js
  var require_Safari12 = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/Safari12.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Safari12 = void 0;
      var sdpTransform = require_lib3();
      var enhancedEvents_1 = require_enhancedEvents();
      var Logger_1 = require_Logger();
      var ortc = require_ortc();
      var errors_1 = require_errors();
      var scalabilityModes_1 = require_scalabilityModes();
      var RemoteSdp_1 = require_RemoteSdp();
      var sdpCommonUtils = require_commonUtils();
      var sdpUnifiedPlanUtils = require_unifiedPlanUtils();
      var ortcUtils = require_utils2();
      var logger = new Logger_1.Logger("Safari12");
      var NAME = "Safari12";
      var SCTP_NUM_STREAMS = { OS: 1024, MIS: 1024 };
      var Safari12 = class _Safari12 extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ direction, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, getSendExtendedRtpCapabilities }) {
          super();
          // Closed flag.
          __publicField(this, "_closed", false);
          // Handler direction.
          __publicField(this, "_direction");
          // Remote SDP handler.
          __publicField(this, "_remoteSdp");
          // Callback to request sending extended RTP capabilities on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // Initial server side DTLS role. If not 'auto', it will force the opposite
          // value in client side.
          __publicField(this, "_forcedLocalDtlsRole");
          // RTCPeerConnection instance.
          __publicField(this, "_pc");
          // Map of RTCTransceivers indexed by MID.
          __publicField(this, "_mapMidTransceiver", /* @__PURE__ */ new Map());
          // Default local stream for sending if no `streamId` is given in send().
          __publicField(this, "_sendStream", new MediaStream());
          // Whether a DataChannel m=application section has been created.
          __publicField(this, "_hasDataChannelMediaSection", false);
          // Sending DataChannel id value counter. Incremented for each new DataChannel.
          __publicField(this, "_nextSendSctpStreamId", 0);
          // Got transport local and remote parameters.
          __publicField(this, "_transportReady", false);
          __publicField(this, "onIceGatheringStateChange", () => {
            this.emit("@icegatheringstatechange", this._pc.iceGatheringState);
          });
          __publicField(this, "onIceCandidateError", (event) => {
            this.emit("@icecandidateerror", event);
          });
          __publicField(this, "onConnectionStateChange", () => {
            this.emit("@connectionstatechange", this._pc.connectionState);
          });
          __publicField(this, "onIceConnectionStateChange", () => {
            switch (this._pc.iceConnectionState) {
              case "checking": {
                this.emit("@connectionstatechange", "connecting");
                break;
              }
              case "connected":
              case "completed": {
                this.emit("@connectionstatechange", "connected");
                break;
              }
              case "failed": {
                this.emit("@connectionstatechange", "failed");
                break;
              }
              case "disconnected": {
                this.emit("@connectionstatechange", "disconnected");
                break;
              }
              case "closed": {
                this.emit("@connectionstatechange", "closed");
                break;
              }
            }
          });
          logger.debug("constructor()");
          this._direction = direction;
          this._remoteSdp = new RemoteSdp_1.RemoteSdp({
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters
          });
          this._getSendExtendedRtpCapabilities = getSendExtendedRtpCapabilities;
          if (dtlsParameters.role && dtlsParameters.role !== "auto") {
            this._forcedLocalDtlsRole = dtlsParameters.role === "server" ? "client" : "server";
          }
          this._pc = new RTCPeerConnection({
            iceServers: iceServers ?? [],
            iceTransportPolicy: iceTransportPolicy ?? "all",
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            ...additionalSettings
          });
          this._pc.addEventListener("icegatheringstatechange", () => {
            this.emit("@icegatheringstatechange", this._pc.iceGatheringState);
          });
          this._pc.addEventListener("icecandidateerror", (event) => {
            this.emit("@icecandidateerror", event);
          });
          this._pc.addEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.addEventListener("icecandidateerror", this.onIceCandidateError);
          if (this._pc.connectionState) {
            this._pc.addEventListener("connectionstatechange", this.onConnectionStateChange);
          } else {
            logger.warn("run() | pc.connectionState not supported, using pc.iceConnectionState");
            this._pc.addEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          }
        }
        /**
         * Creates a factory function.
         */
        static createFactory() {
          return {
            name: NAME,
            factory: (options) => new _Safari12(options),
            getNativeRtpCapabilities: async ({ direction }) => {
              logger.debug("getNativeRtpCapabilities() [direction:%o]", direction);
              let pc = new RTCPeerConnection({
                iceServers: [],
                iceTransportPolicy: "all",
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
              });
              try {
                pc.addTransceiver("audio", { direction });
                pc.addTransceiver("video", { direction });
                const offer = await pc.createOffer();
                try {
                  pc.close();
                } catch (error) {
                }
                pc = void 0;
                const sdpObject = sdpTransform.parse(offer.sdp);
                const nativeRtpCapabilities = _Safari12.getLocalRtpCapabilities(sdpObject);
                return nativeRtpCapabilities;
              } catch (error) {
                try {
                  pc?.close();
                } catch (error2) {
                }
                pc = void 0;
                throw error;
              }
            },
            getNativeSctpCapabilities: async () => {
              logger.debug("getNativeSctpCapabilities()");
              return {
                numStreams: SCTP_NUM_STREAMS
              };
            }
          };
        }
        static getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions = []) {
          const nativeRtpCapabilities = sdpCommonUtils.extractRtpCapabilities({
            sdpObject: localSdpObject
          });
          ortc.validateAndNormalizeRtpCapabilities(nativeRtpCapabilities);
          ortcUtils.addNackSupportForOpus(nativeRtpCapabilities);
          for (const headerExtension of extraHeaderExtensions) {
            ortcUtils.addHeaderExtensionSupport(nativeRtpCapabilities, headerExtension);
          }
          return nativeRtpCapabilities;
        }
        get name() {
          return NAME;
        }
        close() {
          logger.debug("close()");
          if (this._closed) {
            return;
          }
          this._closed = true;
          try {
            this._pc.close();
          } catch (error) {
          }
          this._pc.removeEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.removeEventListener("icecandidateerror", this.onIceCandidateError);
          this._pc.removeEventListener("connectionstatechange", this.onConnectionStateChange);
          this._pc.removeEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          this.emit("@close");
          super.close();
        }
        async updateIceServers(iceServers) {
          this.assertNotClosed();
          logger.debug("updateIceServers()");
          const configuration = this._pc.getConfiguration();
          configuration.iceServers = iceServers;
          this._pc.setConfiguration(configuration);
        }
        async restartIce(iceParameters) {
          this.assertNotClosed();
          logger.debug("restartIce()");
          this._remoteSdp.updateIceParameters(iceParameters);
          if (!this._transportReady) {
            return;
          }
          if (this._direction === "send") {
            const offer = await this._pc.createOffer({ iceRestart: true });
            logger.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
          } else {
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            logger.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
          }
        }
        async getTransportStats() {
          this.assertNotClosed();
          return this._pc.getStats();
        }
        async send({ track, streamId, encodings, codecOptions, headerExtensionOptions, codec, onRtpSender }) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("send() [kind:%s, track.id:%s, streamId:%s]", track.kind, track.id, streamId);
          const mediaSectionIdx = this._remoteSdp.getNextMediaSectionIdx();
          const transceiver = this._pc.addTransceiver(track, {
            direction: "sendonly",
            streams: [this._sendStream]
          });
          if (onRtpSender) {
            onRtpSender(transceiver.sender);
          }
          let offer = await this._pc.createOffer();
          let localSdpObject = sdpTransform.parse(offer.sdp);
          if (localSdpObject.extmapAllowMixed) {
            this._remoteSdp.setSessionExtmapAllowMixed();
          }
          const extraHeaderExtensions = [];
          extraHeaderExtensions.push({
            uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
            kind: track.kind,
            direction: "sendonly"
          });
          const nativeRtpCapabilities = _Safari12.getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions);
          const sendExtendedRtpCapabilities = this._getSendExtendedRtpCapabilities(nativeRtpCapabilities);
          const sendingRtpParameters = ortc.getSendingRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRtpParameters.codecs = ortc.reduceCodecs(sendingRtpParameters.codecs, codec);
          const sendingRemoteRtpParameters = ortc.getSendingRemoteRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRemoteRtpParameters.codecs = ortc.reduceCodecs(sendingRemoteRtpParameters.codecs, codec);
          let offerMediaObject;
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          const layers = (0, scalabilityModes_1.parse)((encodings ?? [{}])[0].scalabilityMode);
          if (encodings && encodings.length > 1) {
            logger.debug("send() | enabling legacy simulcast");
            localSdpObject = sdpTransform.parse(offer.sdp);
            offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
            sdpUnifiedPlanUtils.addLegacySimulcast({
              offerMediaObject,
              numStreams: encodings.length
            });
            offer = {
              type: "offer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          if (headerExtensionOptions?.absCaptureTime) {
            offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
            sdpCommonUtils.addHeaderExtension({
              offerMediaObject,
              headerExtensionUri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
              headerExtensionId: sendingRemoteRtpParameters.headerExtensions.find((headerExtension) => headerExtension.uri === "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time").id
            });
            offer = {
              type: "offer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          logger.debug("send() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const localId = transceiver.mid;
          sendingRtpParameters.mid = localId;
          localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
          sendingRtpParameters.rtcp.cname = sdpCommonUtils.getCname({
            offerMediaObject
          });
          sendingRtpParameters.msid = `${streamId ?? this._sendStream.id} ${track.id}`;
          sendingRtpParameters.encodings = sdpUnifiedPlanUtils.getRtpEncodings({
            offerMediaObject,
            codecs: sendingRtpParameters.codecs
          });
          if (encodings) {
            for (let idx = 0; idx < sendingRtpParameters.encodings.length; ++idx) {
              if (encodings[idx]) {
                Object.assign(sendingRtpParameters.encodings[idx], encodings[idx]);
              }
            }
          }
          if (sendingRtpParameters.encodings.length > 1 && (sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/vp8" || sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/h264")) {
            for (const encoding of sendingRtpParameters.encodings) {
              if (encoding.scalabilityMode) {
                encoding.scalabilityMode = `L1T${layers.temporalLayers}`;
              } else {
                encoding.scalabilityMode = "L1T3";
              }
            }
          }
          this._remoteSdp.send({
            offerMediaObject,
            reuseMid: mediaSectionIdx.reuseMid,
            offerRtpParameters: sendingRtpParameters,
            answerRtpParameters: sendingRemoteRtpParameters,
            codecOptions
          });
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("send() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.set(localId, transceiver);
          return {
            localId,
            rtpParameters: sendingRtpParameters,
            rtpSender: transceiver.sender
          };
        }
        async stopSending(localId) {
          this.assertSendDirection();
          if (this._closed) {
            return;
          }
          logger.debug("stopSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          void transceiver.sender.replaceTrack(null);
          this._pc.removeTrack(transceiver.sender);
          const mediaSectionClosed = this._remoteSdp.closeMediaSection(transceiver.mid);
          if (mediaSectionClosed) {
            try {
              transceiver.stop();
            } catch (error) {
            }
          }
          const offer = await this._pc.createOffer();
          logger.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.delete(localId);
        }
        async pauseSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("pauseSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "inactive";
          this._remoteSdp.pauseMediaSection(localId);
          const offer = await this._pc.createOffer();
          logger.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async resumeSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("resumeSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "sendonly";
          this._remoteSdp.resumeSendingMediaSection(localId);
          const offer = await this._pc.createOffer();
          logger.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async replaceTrack(localId, track) {
          this.assertNotClosed();
          this.assertSendDirection();
          if (track) {
            logger.debug("replaceTrack() [localId:%s, track.id:%s]", localId, track.id);
          } else {
            logger.debug("replaceTrack() [localId:%s, no track]", localId);
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          await transceiver.sender.replaceTrack(track);
        }
        async setMaxSpatialLayer(localId, spatialLayer) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", localId, spatialLayer);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            if (idx <= spatialLayer) {
              encoding.active = true;
            } else {
              encoding.active = false;
            }
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async setRtpEncodingParameters(localId, params) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setRtpEncodingParameters() [localId:%s, params:%o]", localId, params);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            parameters.encodings[idx] = { ...encoding, ...params };
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async getSenderStats(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.sender.getStats();
        }
        async sendDataChannel({ ordered, maxPacketLifeTime, maxRetransmits, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertSendDirection();
          const options = {
            negotiated: true,
            id: this._nextSendSctpStreamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("sendDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % SCTP_NUM_STREAMS.MIS;
          if (!this._hasDataChannelMediaSection) {
            const offer = await this._pc.createOffer();
            const localSdpObject = sdpTransform.parse(offer.sdp);
            const offerMediaObject = localSdpObject.media.find((m) => m.type === "application");
            if (!this._transportReady) {
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            this._remoteSdp.sendSctpAssociation({ offerMediaObject });
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          const sctpStreamParameters = {
            streamId: options.id,
            ordered: options.ordered,
            maxPacketLifeTime: options.maxPacketLifeTime,
            maxRetransmits: options.maxRetransmits
          };
          return { dataChannel, sctpStreamParameters };
        }
        async receive(optionsList) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const results = [];
          const mapLocalId = /* @__PURE__ */ new Map();
          for (const options of optionsList) {
            const { trackId, kind, rtpParameters, streamId } = options;
            logger.debug("receive() [trackId:%s, kind:%s]", trackId, kind);
            const localId = rtpParameters.mid ?? String(this._mapMidTransceiver.size);
            mapLocalId.set(trackId, localId);
            const { msidStreamId } = ortcUtils.getMsidStreamIdAndTrackId(rtpParameters.msid);
            this._remoteSdp.receive({
              mid: localId,
              kind,
              offerRtpParameters: rtpParameters,
              streamId: streamId ?? msidStreamId ?? rtpParameters.rtcp?.cname ?? "-",
              trackId
            });
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          for (const options of optionsList) {
            const { trackId, onRtpReceiver } = options;
            if (onRtpReceiver) {
              const localId = mapLocalId.get(trackId);
              const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
              if (!transceiver) {
                throw new Error("transceiver not found");
              }
              onRtpReceiver(transceiver.receiver);
            }
          }
          let answer = await this._pc.createAnswer();
          const localSdpObject = sdpTransform.parse(answer.sdp);
          for (const options of optionsList) {
            const { trackId, rtpParameters } = options;
            const localId = mapLocalId.get(trackId);
            const answerMediaObject = localSdpObject.media.find((m) => String(m.mid) === localId);
            sdpCommonUtils.applyCodecParameters({
              offerRtpParameters: rtpParameters,
              answerMediaObject
            });
          }
          answer = {
            type: "answer",
            sdp: sdpTransform.write(localSdpObject)
          };
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          logger.debug("receive() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const options of optionsList) {
            const { trackId } = options;
            const localId = mapLocalId.get(trackId);
            const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
            if (!transceiver) {
              throw new Error("new RTCRtpTransceiver not found");
            }
            this._mapMidTransceiver.set(localId, transceiver);
            results.push({
              localId,
              track: transceiver.receiver.track,
              rtpReceiver: transceiver.receiver
            });
          }
          return results;
        }
        async stopReceiving(localIds) {
          this.assertRecvDirection();
          if (this._closed) {
            return;
          }
          for (const localId of localIds) {
            logger.debug("stopReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            this._remoteSdp.closeMediaSection(transceiver.mid);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const localId of localIds) {
            this._mapMidTransceiver.delete(localId);
          }
        }
        async pauseReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("pauseReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "inactive";
            this._remoteSdp.pauseMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async resumeReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("resumeReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "recvonly";
            this._remoteSdp.resumeReceivingMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async getReceiverStats(localId) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.receiver.getStats();
        }
        async receiveDataChannel({ sctpStreamParameters, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const { streamId, ordered, maxPacketLifeTime, maxRetransmits } = sctpStreamParameters;
          const options = {
            negotiated: true,
            id: streamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("receiveDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          if (!this._hasDataChannelMediaSection) {
            this._remoteSdp.receiveSctpAssociation();
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            if (!this._transportReady) {
              const localSdpObject = sdpTransform.parse(answer.sdp);
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          return { dataChannel };
        }
        async setupTransport({ localDtlsRole, localSdpObject }) {
          if (!localSdpObject) {
            localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          }
          const dtlsParameters = sdpCommonUtils.extractDtlsParameters({
            sdpObject: localSdpObject
          });
          dtlsParameters.role = localDtlsRole;
          this._remoteSdp.updateDtlsRole(localDtlsRole === "client" ? "server" : "client");
          await new Promise((resolve, reject) => {
            this.safeEmit("@connect", { dtlsParameters }, resolve, reject);
          });
          this._transportReady = true;
        }
        assertNotClosed() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("method called in a closed handler");
          }
        }
        assertSendDirection() {
          if (this._direction !== "send") {
            throw new Error('method can just be called for handlers with "send" direction');
          }
        }
        assertRecvDirection() {
          if (this._direction !== "recv") {
            throw new Error('method can just be called for handlers with "recv" direction');
          }
        }
      };
      exports.Safari12 = Safari12;
    }
  });

  // node_modules/mediasoup-client/lib/handlers/ReactNative106.js
  var require_ReactNative106 = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/ReactNative106.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ReactNative106 = void 0;
      var sdpTransform = require_lib3();
      var enhancedEvents_1 = require_enhancedEvents();
      var Logger_1 = require_Logger();
      var ortc = require_ortc();
      var errors_1 = require_errors();
      var scalabilityModes_1 = require_scalabilityModes();
      var RemoteSdp_1 = require_RemoteSdp();
      var sdpCommonUtils = require_commonUtils();
      var sdpUnifiedPlanUtils = require_unifiedPlanUtils();
      var ortcUtils = require_utils2();
      var logger = new Logger_1.Logger("ReactNative106");
      var NAME = "ReactNative106";
      var SCTP_NUM_STREAMS = { OS: 1024, MIS: 1024 };
      var ReactNative106 = class _ReactNative106 extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({ direction, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, getSendExtendedRtpCapabilities }) {
          super();
          // Closed flag.
          __publicField(this, "_closed", false);
          // Handler direction.
          __publicField(this, "_direction");
          // Remote SDP handler.
          __publicField(this, "_remoteSdp");
          // Callback to request sending extended RTP capabilities on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // Initial server side DTLS role. If not 'auto', it will force the opposite
          // value in client side.
          __publicField(this, "_forcedLocalDtlsRole");
          // RTCPeerConnection instance.
          __publicField(this, "_pc");
          // Map of RTCTransceivers indexed by MID.
          __publicField(this, "_mapMidTransceiver", /* @__PURE__ */ new Map());
          // Default local stream for sending if no `streamId` is given in send().
          __publicField(this, "_sendStream", new MediaStream());
          // Whether a DataChannel m=application section has been created.
          __publicField(this, "_hasDataChannelMediaSection", false);
          // Sending DataChannel id value counter. Incremented for each new DataChannel.
          __publicField(this, "_nextSendSctpStreamId", 0);
          // Got transport local and remote parameters.
          __publicField(this, "_transportReady", false);
          __publicField(this, "onIceGatheringStateChange", () => {
            this.emit("@icegatheringstatechange", this._pc.iceGatheringState);
          });
          __publicField(this, "onIceCandidateError", (event) => {
            this.emit("@icecandidateerror", event);
          });
          __publicField(this, "onConnectionStateChange", () => {
            this.emit("@connectionstatechange", this._pc.connectionState);
          });
          __publicField(this, "onIceConnectionStateChange", () => {
            switch (this._pc.iceConnectionState) {
              case "checking": {
                this.emit("@connectionstatechange", "connecting");
                break;
              }
              case "connected":
              case "completed": {
                this.emit("@connectionstatechange", "connected");
                break;
              }
              case "failed": {
                this.emit("@connectionstatechange", "failed");
                break;
              }
              case "disconnected": {
                this.emit("@connectionstatechange", "disconnected");
                break;
              }
              case "closed": {
                this.emit("@connectionstatechange", "closed");
                break;
              }
            }
          });
          logger.debug("constructor()");
          this._direction = direction;
          this._remoteSdp = new RemoteSdp_1.RemoteSdp({
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters
          });
          this._getSendExtendedRtpCapabilities = getSendExtendedRtpCapabilities;
          if (dtlsParameters.role && dtlsParameters.role !== "auto") {
            this._forcedLocalDtlsRole = dtlsParameters.role === "server" ? "client" : "server";
          }
          this._pc = new RTCPeerConnection({
            iceServers: iceServers ?? [],
            iceTransportPolicy: iceTransportPolicy ?? "all",
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            ...additionalSettings
          });
          this._pc.addEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.addEventListener("icecandidateerror", this.onIceCandidateError);
          if (this._pc.connectionState) {
            this._pc.addEventListener("connectionstatechange", this.onConnectionStateChange);
          } else {
            logger.warn("run() | pc.connectionState not supported, using pc.iceConnectionState");
            this._pc.addEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          }
        }
        /**
         * Creates a factory function.
         */
        static createFactory() {
          return {
            name: NAME,
            factory: (options) => new _ReactNative106(options),
            getNativeRtpCapabilities: async ({ direction }) => {
              logger.debug("getNativeRtpCapabilities() [direction:%o]", direction);
              let pc = new RTCPeerConnection({
                iceServers: [],
                iceTransportPolicy: "all",
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require"
              });
              try {
                pc.addTransceiver("audio", { direction });
                pc.addTransceiver("video", { direction });
                const offer = await pc.createOffer();
                try {
                  pc.close();
                } catch (error) {
                }
                pc = void 0;
                const sdpObject = sdpTransform.parse(offer.sdp);
                const nativeRtpCapabilities = _ReactNative106.getLocalRtpCapabilities(sdpObject);
                return nativeRtpCapabilities;
              } catch (error) {
                try {
                  pc?.close();
                } catch (error2) {
                }
                pc = void 0;
                throw error;
              }
            },
            getNativeSctpCapabilities: async () => {
              logger.debug("getNativeSctpCapabilities()");
              return {
                numStreams: SCTP_NUM_STREAMS
              };
            }
          };
        }
        static getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions = []) {
          const nativeRtpCapabilities = sdpCommonUtils.extractRtpCapabilities({
            sdpObject: localSdpObject
          });
          ortc.validateAndNormalizeRtpCapabilities(nativeRtpCapabilities);
          ortcUtils.addNackSupportForOpus(nativeRtpCapabilities);
          for (const headerExtension of extraHeaderExtensions) {
            ortcUtils.addHeaderExtensionSupport(nativeRtpCapabilities, headerExtension);
          }
          return nativeRtpCapabilities;
        }
        get name() {
          return NAME;
        }
        close() {
          logger.debug("close()");
          if (this._closed) {
            return;
          }
          this._closed = true;
          this._sendStream.release(
            /* releaseTracks */
            false
          );
          try {
            this._pc.close();
          } catch (error) {
          }
          this._pc.removeEventListener("icegatheringstatechange", this.onIceGatheringStateChange);
          this._pc.removeEventListener("icecandidateerror", this.onIceCandidateError);
          this._pc.removeEventListener("connectionstatechange", this.onConnectionStateChange);
          this._pc.removeEventListener("iceconnectionstatechange", this.onIceConnectionStateChange);
          this.emit("@close");
          super.close();
        }
        async updateIceServers(iceServers) {
          this.assertNotClosed();
          logger.debug("updateIceServers()");
          const configuration = this._pc.getConfiguration();
          configuration.iceServers = iceServers;
          this._pc.setConfiguration(configuration);
        }
        async restartIce(iceParameters) {
          this.assertNotClosed();
          logger.debug("restartIce()");
          this._remoteSdp.updateIceParameters(iceParameters);
          if (!this._transportReady) {
            return;
          }
          if (this._direction === "send") {
            const offer = await this._pc.createOffer({ iceRestart: true });
            logger.debug("restartIce() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
          } else {
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("restartIce() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            logger.debug("restartIce() | calling pc.setLocalDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
          }
        }
        async getTransportStats() {
          this.assertNotClosed();
          return this._pc.getStats();
        }
        async send({ track, streamId, encodings, codecOptions, headerExtensionOptions, codec, onRtpSender }) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("send() [kind:%s, track.id:%s, streamId:%s]", track.kind, track.id, streamId);
          if (encodings && encodings.length > 1) {
            encodings.forEach((encoding, idx) => {
              encoding.rid = `r${idx}`;
            });
          }
          const mediaSectionIdx = this._remoteSdp.getNextMediaSectionIdx();
          const transceiver = this._pc.addTransceiver(track, {
            direction: "sendonly",
            streams: [this._sendStream],
            sendEncodings: encodings
          });
          if (onRtpSender) {
            onRtpSender(transceiver.sender);
          }
          let offer = await this._pc.createOffer();
          let localSdpObject = sdpTransform.parse(offer.sdp);
          if (localSdpObject.extmapAllowMixed) {
            this._remoteSdp.setSessionExtmapAllowMixed();
          }
          const extraHeaderExtensions = [];
          extraHeaderExtensions.push({
            uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
            kind: track.kind,
            direction: "sendonly"
          });
          const nativeRtpCapabilities = _ReactNative106.getLocalRtpCapabilities(localSdpObject, extraHeaderExtensions);
          const sendExtendedRtpCapabilities = this._getSendExtendedRtpCapabilities(nativeRtpCapabilities);
          const sendingRtpParameters = ortc.getSendingRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRtpParameters.codecs = ortc.reduceCodecs(sendingRtpParameters.codecs, codec);
          const sendingRemoteRtpParameters = ortc.getSendingRemoteRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRemoteRtpParameters.codecs = ortc.reduceCodecs(sendingRemoteRtpParameters.codecs, codec);
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          let hackVp9Svc = false;
          const layers = (0, scalabilityModes_1.parse)((encodings ?? [{}])[0].scalabilityMode);
          let offerMediaObject;
          if (encodings?.length === 1 && layers.spatialLayers > 1 && sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/vp9") {
            logger.debug("send() | enabling legacy simulcast for VP9 SVC");
            hackVp9Svc = true;
            localSdpObject = sdpTransform.parse(offer.sdp);
            offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
            sdpUnifiedPlanUtils.addLegacySimulcast({
              offerMediaObject,
              numStreams: layers.spatialLayers
            });
            offer = {
              type: "offer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          if (headerExtensionOptions?.absCaptureTime) {
            offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
            sdpCommonUtils.addHeaderExtension({
              offerMediaObject,
              headerExtensionUri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time",
              headerExtensionId: sendingRemoteRtpParameters.headerExtensions.find((headerExtension) => headerExtension.uri === "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time").id
            });
            offer = {
              type: "offer",
              sdp: sdpTransform.write(localSdpObject)
            };
          }
          logger.debug("send() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          let localId = transceiver.mid ?? void 0;
          if (!localId) {
            logger.warn("send() | missing transceiver.mid (bug in react-native-webrtc, using a workaround");
          }
          sendingRtpParameters.mid = localId;
          localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          offerMediaObject = localSdpObject.media[mediaSectionIdx.idx];
          sendingRtpParameters.rtcp.cname = sdpCommonUtils.getCname({
            offerMediaObject
          });
          sendingRtpParameters.msid = `${streamId ?? this._sendStream.id} ${track.id}`;
          if (!encodings) {
            sendingRtpParameters.encodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
          } else if (encodings.length === 1) {
            let newEncodings = sdpUnifiedPlanUtils.getRtpEncodings({
              offerMediaObject,
              codecs: sendingRtpParameters.codecs
            });
            Object.assign(newEncodings[0], encodings[0]);
            if (hackVp9Svc) {
              newEncodings = [newEncodings[0]];
            }
            sendingRtpParameters.encodings = newEncodings;
          } else {
            sendingRtpParameters.encodings = encodings;
          }
          if (sendingRtpParameters.encodings.length > 1 && (sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/vp8" || sendingRtpParameters.codecs[0].mimeType.toLowerCase() === "video/h264")) {
            for (const encoding of sendingRtpParameters.encodings) {
              if (encoding.scalabilityMode) {
                encoding.scalabilityMode = `L1T${layers.temporalLayers}`;
              } else {
                encoding.scalabilityMode = "L1T3";
              }
            }
          }
          this._remoteSdp.send({
            offerMediaObject,
            reuseMid: mediaSectionIdx.reuseMid,
            offerRtpParameters: sendingRtpParameters,
            answerRtpParameters: sendingRemoteRtpParameters,
            codecOptions
          });
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("send() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          if (!localId) {
            localId = transceiver.mid;
            sendingRtpParameters.mid = localId;
          }
          this._mapMidTransceiver.set(localId, transceiver);
          return {
            localId,
            rtpParameters: sendingRtpParameters,
            rtpSender: transceiver.sender
          };
        }
        async stopSending(localId) {
          this.assertSendDirection();
          if (this._closed) {
            return;
          }
          logger.debug("stopSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          void transceiver.sender.replaceTrack(null);
          this._pc.removeTrack(transceiver.sender);
          const mediaSectionClosed = this._remoteSdp.closeMediaSection(transceiver.mid);
          if (mediaSectionClosed) {
            try {
              transceiver.stop();
            } catch (error) {
            }
          }
          const offer = await this._pc.createOffer();
          logger.debug("stopSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
          this._mapMidTransceiver.delete(localId);
        }
        async pauseSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("pauseSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "inactive";
          this._remoteSdp.pauseMediaSection(localId);
          const offer = await this._pc.createOffer();
          logger.debug("pauseSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async resumeSending(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("resumeSending() [localId:%s]", localId);
          const transceiver = this._mapMidTransceiver.get(localId);
          this._remoteSdp.resumeSendingMediaSection(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          transceiver.direction = "sendonly";
          const offer = await this._pc.createOffer();
          logger.debug("resumeSending() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeSending() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async replaceTrack(localId, track) {
          this.assertNotClosed();
          this.assertSendDirection();
          if (track) {
            logger.debug("replaceTrack() [localId:%s, track.id:%s]", localId, track.id);
          } else {
            logger.debug("replaceTrack() [localId:%s, no track]", localId);
          }
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          await transceiver.sender.replaceTrack(track);
        }
        async setMaxSpatialLayer(localId, spatialLayer) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", localId, spatialLayer);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            if (idx <= spatialLayer) {
              encoding.active = true;
            } else {
              encoding.active = false;
            }
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setMaxSpatialLayer() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setMaxSpatialLayer() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async setRtpEncodingParameters(localId, params) {
          this.assertNotClosed();
          this.assertSendDirection();
          logger.debug("setRtpEncodingParameters() [localId:%s, params:%o]", localId, params);
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          const parameters = transceiver.sender.getParameters();
          parameters.encodings.forEach((encoding, idx) => {
            parameters.encodings[idx] = { ...encoding, ...params };
          });
          await transceiver.sender.setParameters(parameters);
          this._remoteSdp.muxMediaSectionSimulcast(localId, parameters.encodings);
          const offer = await this._pc.createOffer();
          logger.debug("setRtpEncodingParameters() | calling pc.setLocalDescription() [offer:%o]", offer);
          await this._pc.setLocalDescription(offer);
          const answer = {
            type: "answer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("setRtpEncodingParameters() | calling pc.setRemoteDescription() [answer:%o]", answer);
          await this._pc.setRemoteDescription(answer);
        }
        async getSenderStats(localId) {
          this.assertNotClosed();
          this.assertSendDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.sender.getStats();
        }
        async sendDataChannel({ ordered, maxPacketLifeTime, maxRetransmits, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertSendDirection();
          const options = {
            negotiated: true,
            id: this._nextSendSctpStreamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("sendDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          this._nextSendSctpStreamId = ++this._nextSendSctpStreamId % SCTP_NUM_STREAMS.MIS;
          if (!this._hasDataChannelMediaSection) {
            const offer = await this._pc.createOffer();
            const localSdpObject = sdpTransform.parse(offer.sdp);
            const offerMediaObject = localSdpObject.media.find((m) => m.type === "application");
            if (!this._transportReady) {
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("sendDataChannel() | calling pc.setLocalDescription() [offer:%o]", offer);
            await this._pc.setLocalDescription(offer);
            this._remoteSdp.sendSctpAssociation({ offerMediaObject });
            const answer = {
              type: "answer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("sendDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setRemoteDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          const sctpStreamParameters = {
            streamId: options.id,
            ordered: options.ordered,
            maxPacketLifeTime: options.maxPacketLifeTime,
            maxRetransmits: options.maxRetransmits
          };
          return { dataChannel, sctpStreamParameters };
        }
        async receive(optionsList) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const results = [];
          const mapLocalId = /* @__PURE__ */ new Map();
          for (const options of optionsList) {
            const { trackId, kind, rtpParameters, streamId } = options;
            logger.debug("receive() [trackId:%s, kind:%s]", trackId, kind);
            const localId = rtpParameters.mid ?? String(this._mapMidTransceiver.size);
            mapLocalId.set(trackId, localId);
            const { msidStreamId } = ortcUtils.getMsidStreamIdAndTrackId(rtpParameters.msid);
            this._remoteSdp.receive({
              mid: localId,
              kind,
              offerRtpParameters: rtpParameters,
              streamId: streamId ?? msidStreamId ?? rtpParameters.rtcp?.cname ?? "-",
              trackId
            });
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("receive() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          for (const options of optionsList) {
            const { trackId, onRtpReceiver } = options;
            if (onRtpReceiver) {
              const localId = mapLocalId.get(trackId);
              const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
              if (!transceiver) {
                throw new Error("transceiver not found");
              }
              onRtpReceiver(transceiver.receiver);
            }
          }
          let answer = await this._pc.createAnswer();
          const localSdpObject = sdpTransform.parse(answer.sdp);
          for (const options of optionsList) {
            const { trackId, rtpParameters } = options;
            const localId = mapLocalId.get(trackId);
            const answerMediaObject = localSdpObject.media.find((m) => String(m.mid) === localId);
            sdpCommonUtils.applyCodecParameters({
              offerRtpParameters: rtpParameters,
              answerMediaObject
            });
          }
          answer = {
            type: "answer",
            sdp: sdpTransform.write(localSdpObject)
          };
          if (!this._transportReady) {
            await this.setupTransport({
              localDtlsRole: this._forcedLocalDtlsRole ?? "client",
              localSdpObject
            });
          }
          logger.debug("receive() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const options of optionsList) {
            const { trackId } = options;
            const localId = mapLocalId.get(trackId);
            const transceiver = this._pc.getTransceivers().find((t) => t.mid === localId);
            if (!transceiver) {
              throw new Error("new RTCRtpTransceiver not found");
            } else {
              this._mapMidTransceiver.set(localId, transceiver);
              results.push({
                localId,
                track: transceiver.receiver.track,
                rtpReceiver: transceiver.receiver
              });
            }
          }
          return results;
        }
        async stopReceiving(localIds) {
          this.assertRecvDirection();
          if (this._closed) {
            return;
          }
          for (const localId of localIds) {
            logger.debug("stopReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            this._remoteSdp.closeMediaSection(transceiver.mid);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("stopReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("stopReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
          for (const localId of localIds) {
            this._mapMidTransceiver.delete(localId);
          }
        }
        async pauseReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("pauseReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "inactive";
            this._remoteSdp.pauseMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("pauseReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("pauseReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async resumeReceiving(localIds) {
          this.assertNotClosed();
          this.assertRecvDirection();
          for (const localId of localIds) {
            logger.debug("resumeReceiving() [localId:%s]", localId);
            const transceiver = this._mapMidTransceiver.get(localId);
            if (!transceiver) {
              throw new Error("associated RTCRtpTransceiver not found");
            }
            transceiver.direction = "recvonly";
            this._remoteSdp.resumeReceivingMediaSection(localId);
          }
          const offer = {
            type: "offer",
            sdp: this._remoteSdp.getSdp()
          };
          logger.debug("resumeReceiving() | calling pc.setRemoteDescription() [offer:%o]", offer);
          await this._pc.setRemoteDescription(offer);
          const answer = await this._pc.createAnswer();
          logger.debug("resumeReceiving() | calling pc.setLocalDescription() [answer:%o]", answer);
          await this._pc.setLocalDescription(answer);
        }
        async getReceiverStats(localId) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const transceiver = this._mapMidTransceiver.get(localId);
          if (!transceiver) {
            throw new Error("associated RTCRtpTransceiver not found");
          }
          return transceiver.receiver.getStats();
        }
        async receiveDataChannel({ sctpStreamParameters, label, protocol: protocol4 }) {
          this.assertNotClosed();
          this.assertRecvDirection();
          const { streamId, ordered, maxPacketLifeTime, maxRetransmits } = sctpStreamParameters;
          const options = {
            negotiated: true,
            id: streamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            protocol: protocol4
          };
          logger.debug("receiveDataChannel() [options:%o]", options);
          const dataChannel = this._pc.createDataChannel(label, options);
          if (!this._hasDataChannelMediaSection) {
            this._remoteSdp.receiveSctpAssociation();
            const offer = {
              type: "offer",
              sdp: this._remoteSdp.getSdp()
            };
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [offer:%o]", offer);
            await this._pc.setRemoteDescription(offer);
            const answer = await this._pc.createAnswer();
            if (!this._transportReady) {
              const localSdpObject = sdpTransform.parse(answer.sdp);
              await this.setupTransport({
                localDtlsRole: this._forcedLocalDtlsRole ?? "client",
                localSdpObject
              });
            }
            logger.debug("receiveDataChannel() | calling pc.setRemoteDescription() [answer:%o]", answer);
            await this._pc.setLocalDescription(answer);
            this._hasDataChannelMediaSection = true;
          }
          return { dataChannel };
        }
        async setupTransport({ localDtlsRole, localSdpObject }) {
          if (!localSdpObject) {
            localSdpObject = sdpTransform.parse(this._pc.localDescription.sdp);
          }
          const dtlsParameters = sdpCommonUtils.extractDtlsParameters({
            sdpObject: localSdpObject
          });
          dtlsParameters.role = localDtlsRole;
          this._remoteSdp.updateDtlsRole(localDtlsRole === "client" ? "server" : "client");
          await new Promise((resolve, reject) => {
            this.safeEmit("@connect", { dtlsParameters }, resolve, reject);
          });
          this._transportReady = true;
        }
        assertNotClosed() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("method called in a closed handler");
          }
        }
        assertSendDirection() {
          if (this._direction !== "send") {
            throw new Error('method can just be called for handlers with "send" direction');
          }
        }
        assertRecvDirection() {
          if (this._direction !== "recv") {
            throw new Error('method can just be called for handlers with "recv" direction');
          }
        }
      };
      exports.ReactNative106 = ReactNative106;
    }
  });

  // node_modules/mediasoup-client/lib/Device.js
  var require_Device = __commonJS({
    "node_modules/mediasoup-client/lib/Device.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Device = void 0;
      exports.detectDevice = detectDevice;
      exports.detectDeviceAsync = detectDeviceAsync;
      var Logger_1 = require_Logger();
      var enhancedEvents_1 = require_enhancedEvents();
      var errors_1 = require_errors();
      var utils = require_utils();
      var ortc = require_ortc();
      var Transport_1 = require_Transport();
      var Chrome111_1 = require_Chrome111();
      var Chrome74_1 = require_Chrome74();
      var Firefox120_1 = require_Firefox120();
      var Safari12_1 = require_Safari12();
      var ReactNative106_1 = require_ReactNative106();
      var logger = new Logger_1.Logger("Device");
      function detectDevice(userAgent, userAgentData) {
        logger.debug("detectDevice()");
        if (!userAgent && typeof navigator === "object") {
          userAgent = navigator.userAgent;
        }
        if (!userAgentData && typeof navigator === "object") {
          userAgentData = navigator.userAgentData;
        }
        return detectDeviceImpl(userAgent, userAgentData);
      }
      async function detectDeviceAsync(userAgent, userAgentData) {
        logger.debug("detectDeviceAsync()");
        if (!userAgent && typeof navigator === "object") {
          userAgent = navigator.userAgent;
        }
        if (!userAgentData && typeof navigator === "object") {
          userAgentData = navigator.userAgentData;
        }
        return detectDeviceImpl(userAgent, userAgentData);
      }
      var Device2 = class _Device {
        /**
         * Create a new Device to connect to mediasoup server.
         *
         * @throws {UnsupportedError} if device is not supported.
         */
        constructor({ handlerName, handlerFactory } = {}) {
          // RTC handler factory.
          __publicField(this, "_handlerFactory");
          // Handler name.
          __publicField(this, "_handlerName");
          // Loaded flag.
          __publicField(this, "_loaded", false);
          // Callback for sending Transports to request sending extended RTP capabilities
          // on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // Local RTP capabilities for receiving media.
          __publicField(this, "_recvRtpCapabilities");
          // Local RTP capabilities for sending media.
          __publicField(this, "_sendRtpCapabilities");
          // Whether we can produce audio/video based on remote RTP capabilities.
          __publicField(this, "_canProduceByKind", {
            audio: false,
            video: false
          });
          // Local SCTP capabilities.
          __publicField(this, "_sctpCapabilities");
          // Observer instance.
          __publicField(this, "_observer", new enhancedEvents_1.EnhancedEventEmitter());
          logger.debug("constructor()");
          if (handlerName && handlerFactory) {
            throw new TypeError("just one of handlerName or handlerInterface can be given");
          }
          if (handlerFactory) {
            this._handlerFactory = handlerFactory;
          } else {
            if (handlerName) {
              logger.debug("constructor() | handler given: %s", handlerName);
            } else {
              handlerName = detectDevice();
              if (handlerName) {
                logger.debug("constructor() | detected handler: %s", handlerName);
              } else {
                throw new errors_1.UnsupportedError("device not supported");
              }
            }
            switch (handlerName) {
              case "Chrome111": {
                this._handlerFactory = Chrome111_1.Chrome111.createFactory();
                break;
              }
              case "Chrome74": {
                this._handlerFactory = Chrome74_1.Chrome74.createFactory();
                break;
              }
              case "Firefox120": {
                this._handlerFactory = Firefox120_1.Firefox120.createFactory();
                break;
              }
              case "Safari12": {
                this._handlerFactory = Safari12_1.Safari12.createFactory();
                break;
              }
              case "ReactNative106": {
                this._handlerFactory = ReactNative106_1.ReactNative106.createFactory();
                break;
              }
              default: {
                throw new TypeError(`unknown handlerName "${handlerName}"`);
              }
            }
          }
          this._handlerName = this._handlerFactory.name;
        }
        /**
         * Create a new Device to connect to mediasoup server. It uses a more advanced
         * device detection.
         *
         * @throws {UnsupportedError} if device is not supported.
         */
        static async factory({ handlerName, handlerFactory } = {}) {
          logger.debug("factory()");
          if (handlerName && handlerFactory) {
            throw new TypeError("just one of handlerName or handlerInterface can be given");
          }
          if (!handlerName && !handlerFactory) {
            handlerName = await detectDeviceAsync();
            if (!handlerName) {
              throw new errors_1.UnsupportedError("device not supported");
            }
          }
          return new _Device({ handlerName, handlerFactory });
        }
        /**
         * The RTC handler name.
         */
        get handlerName() {
          return this._handlerName;
        }
        /**
         * Whether the Device is loaded.
         */
        get loaded() {
          return this._loaded;
        }
        /**
         * RTP capabilities of the Device for receiving media.
         *
         * @deprecated Use {@link recvRtpCapabilities} instead.
         *
         * @throws {InvalidStateError} if not loaded.
         */
        get rtpCapabilities() {
          return this.recvRtpCapabilities;
        }
        /**
         * RTP capabilities of the Device for receiving media.
         *
         * @throws {InvalidStateError} if not loaded.
         */
        get recvRtpCapabilities() {
          if (!this._loaded) {
            throw new errors_1.InvalidStateError("not loaded");
          }
          return this._recvRtpCapabilities;
        }
        /**
         * RTP capabilities of the Device for sending media.
         *
         * @throws {InvalidStateError} if not loaded.
         */
        get sendRtpCapabilities() {
          if (!this._loaded) {
            throw new errors_1.InvalidStateError("not loaded");
          }
          return this._sendRtpCapabilities;
        }
        /**
         * SCTP capabilities of the Device.
         *
         * @throws {InvalidStateError} if not loaded.
         */
        get sctpCapabilities() {
          if (!this._loaded) {
            throw new errors_1.InvalidStateError("not loaded");
          }
          return this._sctpCapabilities;
        }
        get observer() {
          return this._observer;
        }
        /**
         * Initialize the Device.
         */
        async load({ routerRtpCapabilities, preferLocalCodecsOrder = false }) {
          logger.debug("load() [routerRtpCapabilities:%o]", routerRtpCapabilities);
          if (this._loaded) {
            throw new errors_1.InvalidStateError("already loaded");
          }
          const clonedRouterRtpCapabilities = utils.clone(routerRtpCapabilities);
          ortc.validateAndNormalizeRtpCapabilities(clonedRouterRtpCapabilities);
          const { getNativeRtpCapabilities, getNativeSctpCapabilities } = this._handlerFactory;
          const clonedNativeRecvRtpCapabilities = utils.clone(await getNativeRtpCapabilities({ direction: "recvonly" }));
          logger.debug("load() | got native receiving RTP capabilities:%o", clonedNativeRecvRtpCapabilities);
          ortc.validateAndNormalizeRtpCapabilities(clonedNativeRecvRtpCapabilities);
          const clonedNativeSendRtpCapabilities = utils.clone(await getNativeRtpCapabilities({ direction: "sendonly" }));
          logger.debug("load() | got native sending RTP capabilities:%o", clonedNativeSendRtpCapabilities);
          ortc.validateAndNormalizeRtpCapabilities(clonedNativeSendRtpCapabilities);
          this._getSendExtendedRtpCapabilities = (nativeSendRtpCapabilities) => {
            return utils.clone(ortc.getExtendedRtpCapabilities(nativeSendRtpCapabilities, clonedRouterRtpCapabilities, preferLocalCodecsOrder));
          };
          const recvExtendedRtpCapabilities = ortc.getExtendedRtpCapabilities(
            clonedNativeRecvRtpCapabilities,
            clonedRouterRtpCapabilities,
            /* preferLocalCodecsOrder */
            false
          );
          this._recvRtpCapabilities = ortc.getRecvRtpCapabilities(recvExtendedRtpCapabilities);
          logger.debug("load() | got receiving RTP capabilities:%o", this._recvRtpCapabilities);
          ortc.validateAndNormalizeRtpCapabilities(this._recvRtpCapabilities);
          const sendExtendedRtpCapabilities = ortc.getExtendedRtpCapabilities(clonedNativeSendRtpCapabilities, clonedRouterRtpCapabilities, preferLocalCodecsOrder);
          this._sendRtpCapabilities = ortc.getSendRtpCapabilities(sendExtendedRtpCapabilities);
          logger.debug("load() | got sending RTP capabilities:%o", this._sendRtpCapabilities);
          ortc.validateAndNormalizeRtpCapabilities(this._sendRtpCapabilities);
          this._canProduceByKind.audio = ortc.canSend("audio", this._sendRtpCapabilities);
          this._canProduceByKind.video = ortc.canSend("video", this._sendRtpCapabilities);
          this._sctpCapabilities = await getNativeSctpCapabilities();
          ortc.validateSctpCapabilities(this._sctpCapabilities);
          logger.debug("load() | got native SCTP capabilities:%o", this._sctpCapabilities);
          logger.debug("load() succeeded");
          this._loaded = true;
        }
        /**
         * Whether we can produce audio/video.
         *
         * @throws {InvalidStateError} if not loaded.
         * @throws {TypeError} if wrong arguments.
         */
        canProduce(kind) {
          if (!this._loaded) {
            throw new errors_1.InvalidStateError("not loaded");
          } else if (kind !== "audio" && kind !== "video") {
            throw new TypeError(`invalid kind "${kind}"`);
          }
          return this._canProduceByKind[kind];
        }
        /**
         * Creates a Transport for sending media.
         *
         * @throws {InvalidStateError} if not loaded.
         * @throws {TypeError} if wrong arguments.
         */
        createSendTransport({ id, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, appData }) {
          logger.debug("createSendTransport()");
          return this.createTransport({
            direction: "send",
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
            iceServers,
            iceTransportPolicy,
            additionalSettings,
            appData
          });
        }
        /**
         * Creates a Transport for receiving media.
         *
         * @throws {InvalidStateError} if not loaded.
         * @throws {TypeError} if wrong arguments.
         */
        createRecvTransport({ id, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, appData }) {
          logger.debug("createRecvTransport()");
          return this.createTransport({
            direction: "recv",
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
            iceServers,
            iceTransportPolicy,
            additionalSettings,
            appData
          });
        }
        createTransport({ direction, id, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers, iceTransportPolicy, additionalSettings, appData }) {
          if (!this._loaded) {
            throw new errors_1.InvalidStateError("not loaded");
          } else if (typeof id !== "string") {
            throw new TypeError("missing id");
          } else if (typeof iceParameters !== "object") {
            throw new TypeError("missing iceParameters");
          } else if (!Array.isArray(iceCandidates)) {
            throw new TypeError("missing iceCandidates");
          } else if (typeof dtlsParameters !== "object") {
            throw new TypeError("missing dtlsParameters");
          } else if (sctpParameters && typeof sctpParameters !== "object") {
            throw new TypeError("wrong sctpParameters");
          } else if (appData && typeof appData !== "object") {
            throw new TypeError("if given, appData must be an object");
          }
          const transport = new Transport_1.Transport({
            direction,
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            sctpParameters,
            iceServers,
            iceTransportPolicy,
            additionalSettings,
            appData,
            handlerFactory: this._handlerFactory,
            getSendExtendedRtpCapabilities: this._getSendExtendedRtpCapabilities,
            recvRtpCapabilities: this._recvRtpCapabilities,
            canProduceByKind: this._canProduceByKind
          });
          this._observer.safeEmit("newtransport", transport);
          return transport;
        }
      };
      exports.Device = Device2;
      function detectDeviceImpl(userAgent, userAgentData) {
        logger.debug('detectDeviceImpl() [userAgent:"%s", userAgentData:%o]', userAgent, userAgentData);
        const chromiumMajorVersion = getChromiumMajorVersion(userAgent, userAgentData);
        if (chromiumMajorVersion) {
          if (chromiumMajorVersion >= 111) {
            logger.debug("detectDeviceImpl() | using Chrome111 handler");
            return "Chrome111";
          } else if (chromiumMajorVersion >= 74) {
            logger.debug("detectDeviceImpl() | using Chrome74 handler");
            return "Chrome74";
          } else {
            logger.warn("detectDeviceImpl() | unsupported Chromium based browser/version");
            return void 0;
          }
        }
        const firefoxMajorVersion = getFirefoxMajorVersion(userAgent);
        if (firefoxMajorVersion) {
          if (firefoxMajorVersion >= 120) {
            logger.debug("detectDeviceImpl() | using Firefox120 handler");
            return "Firefox120";
          } else {
            logger.warn("detectDeviceImpl() | unsupported Firefox browser/version");
            return void 0;
          }
        }
        const macOSWebKitMajorVersion = getMacOSWebKitMajorVersion(userAgent);
        if (macOSWebKitMajorVersion) {
          if (macOSWebKitMajorVersion >= 605) {
            logger.debug("detectDeviceImpl() | using Safari12 handler");
            return "Safari12";
          } else {
            logger.warn("detectDeviceImpl() | unsupported desktop Safari browser/version");
            return void 0;
          }
        }
        const iOSWebKitMajorVersion = getIOSWebKitMajorVersion(userAgent);
        if (iOSWebKitMajorVersion) {
          if (iOSWebKitMajorVersion >= 605) {
            logger.debug("detectDeviceImpl() | using Safari12 handler");
            return "Safari12";
          } else {
            logger.warn("detectDeviceImpl() | unsupported iOS Safari based browser/version");
            return void 0;
          }
        }
        if (isReactNative2()) {
          if (typeof RTCPeerConnection !== "undefined" && typeof RTCRtpTransceiver !== "undefined") {
            logger.debug("detectDeviceImpl() | using ReactNative106 handler");
            return "ReactNative106";
          } else {
            logger.warn("detectDeviceImpl() | unsupported react-native-webrtc version without RTCPeerConnection or RTCRtpTransceiver, forgot to call registerGlobals() on it?");
            return void 0;
          }
        }
        logger.warn('detectDeviceImpl() | device not supported [userAgent:"%s", userAgentData:%o]', userAgent, userAgentData);
        return void 0;
      }
      function getChromiumMajorVersion(userAgent, userAgentData) {
        logger.debug("getChromiumMajorVersion()");
        if (isIOS(userAgent, userAgentData)) {
          logger.debug("getChromiumMajorVersion() | this is iOS => undefined");
          return void 0;
        }
        if (isReactNative2()) {
          logger.debug("getChromiumMajorVersion() | this is React-Native => undefined");
          return void 0;
        }
        if (userAgentData) {
          const chromiumBrand = (userAgentData.brands ?? []).find((b) => b.brand === "Chromium");
          if (chromiumBrand) {
            const majorVersion = Number(chromiumBrand.version);
            logger.debug(`getChromiumMajorVersion() | Chromium major version based on NavigatorUAData => ${majorVersion}`);
            return majorVersion;
          }
        }
        const match = userAgent?.match(/\b(?:Chrome|Chromium)\/(\w+)/i);
        if (match?.[1]) {
          const majorVersion = Number(match[1]);
          logger.debug(`getChromiumMajorVersion() | Chromium major version based on User-Agent => ${majorVersion}`);
          return majorVersion;
        }
        logger.debug("getChromiumMajorVersion() | this is not Chromium => undefined");
        return void 0;
      }
      function getFirefoxMajorVersion(userAgent) {
        logger.debug("getFirefoxMajorVersion()");
        if (isIOS(userAgent)) {
          logger.debug("getFirefoxMajorVersion() | this is iOS => undefined");
          return void 0;
        }
        if (isReactNative2()) {
          logger.debug("getFirefoxMajorVersion() | this is React-Native => undefined");
          return void 0;
        }
        const match = userAgent?.match(/\bFirefox\/(\w+)/i);
        if (match?.[1]) {
          const majorVersion = Number(match[1]);
          logger.debug(`getFirefoxMajorVersion() | Firefox major version based on User-Agent => ${majorVersion}`);
          return majorVersion;
        }
        logger.debug("getFirefoxMajorVersion() | this is not Firefox => undefined");
        return void 0;
      }
      function getMacOSWebKitMajorVersion(userAgent) {
        logger.debug("getMacOSWebKitMajorVersion()");
        if (isIOS(userAgent)) {
          logger.debug("getMacOSWebKitMajorVersion() | this is iOS => undefined");
          return void 0;
        }
        if (isReactNative2()) {
          logger.debug("getMacOSWebKitMajorVersion() | this is React-Native => undefined");
          return void 0;
        }
        const isSafari = userAgent && /\bSafari\b/i.test(userAgent) && !/\bChrome\b/i.test(userAgent) && !/\bChromium\b/i.test(userAgent) && !/\bFirefox\b/i.test(userAgent);
        if (!isSafari) {
          logger.debug("getMacOSWebKitMajorVersion() | this is not Safari => undefined");
          return void 0;
        }
        const match = userAgent.match(/AppleWebKit\/(\w+)/i);
        if (match?.[1]) {
          const majorVersion = Number(match[1]);
          logger.debug(`getMacOSWebKitMajorVersion() | WebKit major version based on User-Agent => ${majorVersion}`);
          return majorVersion;
        }
        logger.debug("getMacOSWebKitMajorVersion() | this is not WebKit => undefined");
        return void 0;
      }
      function getIOSWebKitMajorVersion(userAgent) {
        logger.debug("getIOSWebKitMajorVersion()");
        if (!isIOS(userAgent)) {
          logger.debug("getIOSWebKitMajorVersion() | this is not iOS => undefined");
          return void 0;
        }
        if (isReactNative2()) {
          logger.debug("getIOSWebKitMajorVersion() | this is React-Native => undefined");
          return void 0;
        }
        const match = userAgent?.match(/AppleWebKit\/(\w+)/i);
        if (match?.[1]) {
          const majorVersion = Number(match[1]);
          logger.debug(`getIOSWebKitMajorVersion() | WebKit major version based on User-Agent => ${majorVersion}`);
          return majorVersion;
        }
        logger.debug("getIOSWebKitMajorVersion() | this is not WebKit => undefined");
        return void 0;
      }
      function isIOS(userAgent, userAgentData) {
        logger.debug("isIOS()");
        if (userAgentData?.platform === "iOS") {
          logger.debug("isIOS() | this is iOS based on NavigatorUAData.platform => true");
          return true;
        }
        if (userAgentData?.platform) {
          logger.debug("isIOS() | this is not iOS based on NavigatorUAData.platform => false");
          return false;
        }
        if (userAgent && /iPad|iPhone|iPod/.test(userAgent)) {
          logger.debug("isIOS() | this is iOS based on User-Agent => true");
          return true;
        }
        if (typeof navigator === "object" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
          logger.debug("isIOS() | this is iPadOS 13+ based on User-Agent => true");
          return true;
        }
        logger.debug("isIOS() | this is not iOS => false");
        return false;
      }
      function isReactNative2() {
        logger.debug("isReactNative()");
        if (typeof navigator === "object" && navigator.product === "ReactNative") {
          logger.debug("isReactNative() | this is React-Native based on navigator.product");
          return true;
        }
        logger.debug("isReactNative() | this is not React-Native => false");
        return false;
      }
    }
  });

  // node_modules/@lukeed/uuid/dist/index.js
  var require_dist = __commonJS({
    "node_modules/@lukeed/uuid/dist/index.js"(exports) {
      var IDX = 256;
      var HEX = [];
      var BUFFER;
      while (IDX--) HEX[IDX] = (IDX + 256).toString(16).substring(1);
      function v4() {
        var i = 0, num, out = "";
        if (!BUFFER || IDX + 16 > 256) {
          BUFFER = Array(i = 256);
          while (i--) BUFFER[i] = 256 * Math.random() | 0;
          i = IDX = 0;
        }
        for (; i < 16; i++) {
          num = BUFFER[IDX + i];
          if (i == 6) out += HEX[num & 15 | 64];
          else if (i == 8) out += HEX[num & 63 | 128];
          else out += HEX[num];
          if (i & 1 && i > 1 && i < 11) out += "-";
        }
        IDX++;
        return out;
      }
      exports.v4 = v4;
    }
  });

  // node_modules/fake-mediastreamtrack/lib/fakeEvents/FakeEventTarget.js
  var require_FakeEventTarget = __commonJS({
    "node_modules/fake-mediastreamtrack/lib/fakeEvents/FakeEventTarget.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FakeEventTarget = void 0;
      var FakeEventTarget = class {
        constructor() {
          __publicField(this, "listeners", {});
        }
        addEventListener(type, callback, options) {
          if (!callback) {
            return;
          }
          this.listeners[type] = this.listeners[type] ?? [];
          this.listeners[type].push({
            callback: (
              // eslint-disable-next-line @typescript-eslint/unbound-method
              typeof callback === "function" ? callback : callback.handleEvent
            ),
            once: typeof options === "object" && options.once === true
          });
        }
        removeEventListener(type, callback, options) {
          if (!this.listeners[type]) {
            return;
          }
          if (!callback) {
            return;
          }
          this.listeners[type] = this.listeners[type].filter((listener) => listener.callback !== // eslint-disable-next-line @typescript-eslint/unbound-method
          (typeof callback === "function" ? callback : callback.handleEvent));
        }
        dispatchEvent(event) {
          if (!event || typeof event.type !== "string") {
            throw new Error("invalid event object");
          }
          const entries = this.listeners[event.type];
          if (!entries) {
            return true;
          }
          for (const listener of [...entries]) {
            try {
              listener.callback.call(this, event);
            } catch (error) {
              setTimeout(() => {
                throw error;
              }, 0);
            }
            if (listener.once) {
              this.removeEventListener(event.type, listener.callback);
            }
          }
          return !event.defaultPrevented;
        }
      };
      exports.FakeEventTarget = FakeEventTarget;
    }
  });

  // node_modules/fake-mediastreamtrack/lib/fakeEvents/FakeEvent.js
  var require_FakeEvent = __commonJS({
    "node_modules/fake-mediastreamtrack/lib/fakeEvents/FakeEvent.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FakeEvent = void 0;
      var FakeEvent = class {
        constructor(type, options = {}) {
          /**
           * Constants.
           */
          __publicField(this, "NONE", 0);
          __publicField(this, "CAPTURING_PHASE", 1);
          __publicField(this, "AT_TARGET", 2);
          __publicField(this, "BUBBLING_PHASE", 3);
          /**
           * Members.
           */
          __publicField(this, "type");
          __publicField(this, "bubbles");
          __publicField(this, "cancelable");
          __publicField(this, "defaultPrevented", false);
          __publicField(this, "composed", false);
          __publicField(this, "currentTarget", null);
          // Not implemented.
          __publicField(this, "eventPhase", this.NONE);
          __publicField(this, "isTrusted", true);
          __publicField(this, "target", null);
          __publicField(this, "timeStamp", 0);
          // Deprecated.
          __publicField(this, "cancelBubble", false);
          __publicField(this, "returnValue", true);
          __publicField(this, "srcElement", null);
          this.type = type;
          this.bubbles = options.bubbles ?? false;
          this.cancelable = options.cancelable ?? false;
        }
        preventDefault() {
          if (this.cancelable) {
            this.defaultPrevented = true;
          }
        }
        /**
         * Not implemented.
         */
        stopPropagation() {
        }
        /**
         * Not implemented.
         */
        stopImmediatePropagation() {
        }
        /**
         * Not implemented.
         */
        composedPath() {
          return [];
        }
        /**
         * Not implemented.
         * @deprecated
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        initEvent(type, bubbles, cancelable) {
        }
      };
      exports.FakeEvent = FakeEvent;
    }
  });

  // node_modules/fake-mediastreamtrack/lib/utils.js
  var require_utils3 = __commonJS({
    "node_modules/fake-mediastreamtrack/lib/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.clone = clone;
      function clone(value2) {
        if (value2 === void 0) {
          return void 0;
        } else if (Number.isNaN(value2)) {
          return NaN;
        } else if (typeof structuredClone === "function") {
          return structuredClone(value2);
        } else {
          return JSON.parse(JSON.stringify(value2));
        }
      }
    }
  });

  // node_modules/fake-mediastreamtrack/lib/index.js
  var require_lib4 = __commonJS({
    "node_modules/fake-mediastreamtrack/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FakeMediaStreamTrack = void 0;
      var uuid_1 = require_dist();
      var FakeEventTarget_1 = require_FakeEventTarget();
      var FakeEvent_1 = require_FakeEvent();
      var utils_1 = require_utils3();
      var _id, _kind, _label, _readyState, _enabled, _muted, _contentHint, _capabilities, _constraints, _settings, _data, _onmute, _onunmute, _onended, _onenabledchange, _onstopped;
      var _FakeMediaStreamTrack = class _FakeMediaStreamTrack extends FakeEventTarget_1.FakeEventTarget {
        constructor({ kind, id, label, contentHint, enabled, muted, readyState, capabilities, constraints, settings, data }) {
          super();
          __privateAdd(this, _id);
          __privateAdd(this, _kind);
          __privateAdd(this, _label);
          __privateAdd(this, _readyState);
          __privateAdd(this, _enabled);
          __privateAdd(this, _muted);
          __privateAdd(this, _contentHint);
          __privateAdd(this, _capabilities);
          __privateAdd(this, _constraints);
          __privateAdd(this, _settings);
          __privateAdd(this, _data);
          // Events.
          __privateAdd(this, _onmute, null);
          __privateAdd(this, _onunmute, null);
          __privateAdd(this, _onended, null);
          // Custom events.
          __privateAdd(this, _onenabledchange, null);
          __privateAdd(this, _onstopped, null);
          __privateSet(this, _id, id ?? (0, uuid_1.v4)());
          __privateSet(this, _kind, kind);
          __privateSet(this, _label, label ?? "");
          __privateSet(this, _contentHint, contentHint ?? "");
          __privateSet(this, _enabled, enabled ?? true);
          __privateSet(this, _muted, muted ?? false);
          __privateSet(this, _readyState, readyState ?? "live");
          __privateSet(this, _capabilities, capabilities ?? {});
          __privateSet(this, _constraints, constraints ?? {});
          __privateSet(this, _settings, settings ?? {});
          __privateSet(this, _data, data ?? {});
        }
        get id() {
          return __privateGet(this, _id);
        }
        get kind() {
          return __privateGet(this, _kind);
        }
        get label() {
          return __privateGet(this, _label);
        }
        get contentHint() {
          return __privateGet(this, _contentHint);
        }
        set contentHint(contentHint) {
          __privateSet(this, _contentHint, contentHint);
        }
        get enabled() {
          return __privateGet(this, _enabled);
        }
        /**
         * Changes `enabled` member value and fires a custom "enabledchange" event.
         */
        set enabled(enabled) {
          const changed = __privateGet(this, _enabled) !== enabled;
          __privateSet(this, _enabled, enabled);
          if (changed) {
            this.dispatchEvent(new FakeEvent_1.FakeEvent("enabledchange"));
          }
        }
        get muted() {
          return __privateGet(this, _muted);
        }
        get readyState() {
          return __privateGet(this, _readyState);
        }
        /**
         * Application custom data getter.
         */
        get data() {
          return __privateGet(this, _data);
        }
        /**
         * Application custom data setter.
         */
        set data(data) {
          __privateSet(this, _data, data);
        }
        get onmute() {
          return __privateGet(this, _onmute);
        }
        set onmute(handler) {
          if (__privateGet(this, _onmute)) {
            this.removeEventListener("mute", __privateGet(this, _onmute));
          }
          __privateSet(this, _onmute, handler);
          if (handler) {
            this.addEventListener("mute", handler);
          }
        }
        get onunmute() {
          return __privateGet(this, _onunmute);
        }
        set onunmute(handler) {
          if (__privateGet(this, _onunmute)) {
            this.removeEventListener("unmute", __privateGet(this, _onunmute));
          }
          __privateSet(this, _onunmute, handler);
          if (handler) {
            this.addEventListener("unmute", handler);
          }
        }
        get onended() {
          return __privateGet(this, _onended);
        }
        set onended(handler) {
          if (__privateGet(this, _onended)) {
            this.removeEventListener("ended", __privateGet(this, _onended));
          }
          __privateSet(this, _onended, handler);
          if (handler) {
            this.addEventListener("ended", handler);
          }
        }
        get onenabledchange() {
          return __privateGet(this, _onenabledchange);
        }
        set onenabledchange(handler) {
          if (__privateGet(this, _onenabledchange)) {
            this.removeEventListener("enabledchange", __privateGet(this, _onenabledchange));
          }
          __privateSet(this, _onenabledchange, handler);
          if (handler) {
            this.addEventListener("enabledchange", handler);
          }
        }
        get onstopped() {
          return __privateGet(this, _onstopped);
        }
        set onstopped(handler) {
          if (__privateGet(this, _onstopped)) {
            this.removeEventListener("stopped", __privateGet(this, _onstopped));
          }
          __privateSet(this, _onstopped, handler);
          if (handler) {
            this.addEventListener("stopped", handler);
          }
        }
        addEventListener(type, listener, options) {
          super.addEventListener(type, listener, options);
        }
        removeEventListener(type, listener, options) {
          super.removeEventListener(type, listener, options);
        }
        /**
         * Changes `readyState` member to "ended" and fires a custom "stopped" event
         * (if not already stopped).
         */
        stop() {
          if (__privateGet(this, _readyState) === "ended") {
            return;
          }
          __privateSet(this, _readyState, "ended");
          this.dispatchEvent(new FakeEvent_1.FakeEvent("stopped"));
        }
        /**
         * Clones current track into another FakeMediaStreamTrack. `id` and `data`
         * can be optionally given.
         */
        clone({ id, data } = {}) {
          return new _FakeMediaStreamTrack({
            id: id ?? (0, uuid_1.v4)(),
            kind: __privateGet(this, _kind),
            label: __privateGet(this, _label),
            contentHint: __privateGet(this, _contentHint),
            enabled: __privateGet(this, _enabled),
            muted: __privateGet(this, _muted),
            readyState: __privateGet(this, _readyState),
            capabilities: (0, utils_1.clone)(__privateGet(this, _capabilities)),
            constraints: (0, utils_1.clone)(__privateGet(this, _constraints)),
            settings: (0, utils_1.clone)(__privateGet(this, _settings)),
            data: data ?? (0, utils_1.clone)(__privateGet(this, _data))
          });
        }
        getCapabilities() {
          return __privateGet(this, _capabilities);
        }
        getConstraints() {
          return __privateGet(this, _constraints);
        }
        async applyConstraints(constraints = {}) {
          __privateSet(this, _constraints, constraints);
          return Promise.resolve();
        }
        getSettings() {
          return __privateGet(this, _settings);
        }
        /**
         * Simulates a remotely triggered stop. It fires a custom "stopped" event and
         * the standard "ended" event (if the track was not already stopped).
         */
        remoteStop() {
          if (__privateGet(this, _readyState) === "ended") {
            return;
          }
          __privateSet(this, _readyState, "ended");
          this.dispatchEvent(new FakeEvent_1.FakeEvent("stopped"));
          this.dispatchEvent(new FakeEvent_1.FakeEvent("ended"));
        }
        /**
         * Simulates a remotely triggered mute. It fires a "mute" event (if the track
         * was not already muted).
         */
        remoteMute() {
          if (__privateGet(this, _muted)) {
            return;
          }
          __privateSet(this, _muted, true);
          this.dispatchEvent(new FakeEvent_1.FakeEvent("mute"));
        }
        /**
         * Simulates a remotely triggered unmute. It fires an "unmute" event (if the
         * track was muted).
         */
        remoteUnmute() {
          if (!__privateGet(this, _muted)) {
            return;
          }
          __privateSet(this, _muted, false);
          this.dispatchEvent(new FakeEvent_1.FakeEvent("unmute"));
        }
      };
      _id = new WeakMap();
      _kind = new WeakMap();
      _label = new WeakMap();
      _readyState = new WeakMap();
      _enabled = new WeakMap();
      _muted = new WeakMap();
      _contentHint = new WeakMap();
      _capabilities = new WeakMap();
      _constraints = new WeakMap();
      _settings = new WeakMap();
      _data = new WeakMap();
      _onmute = new WeakMap();
      _onunmute = new WeakMap();
      _onended = new WeakMap();
      _onenabledchange = new WeakMap();
      _onstopped = new WeakMap();
      var FakeMediaStreamTrack = _FakeMediaStreamTrack;
      exports.FakeMediaStreamTrack = FakeMediaStreamTrack;
    }
  });

  // node_modules/mediasoup-client/lib/handlers/fakeEvents/FakeEventTarget.js
  var require_FakeEventTarget2 = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/fakeEvents/FakeEventTarget.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FakeEventTarget = void 0;
      var FakeEventTarget = class {
        constructor() {
          __publicField(this, "listeners", {});
        }
        addEventListener(type, callback, options) {
          if (!callback) {
            return;
          }
          this.listeners[type] = this.listeners[type] ?? [];
          this.listeners[type].push({
            callback: typeof callback === "function" ? callback : callback.handleEvent,
            once: typeof options === "object" && options.once === true
          });
        }
        removeEventListener(type, callback, options) {
          if (!this.listeners[type]) {
            return;
          }
          if (!callback) {
            return;
          }
          this.listeners[type] = this.listeners[type].filter((listener) => listener.callback !== (typeof callback === "function" ? callback : callback.handleEvent));
        }
        dispatchEvent(event) {
          if (!event || typeof event.type !== "string") {
            throw new Error("invalid event object");
          }
          const entries = this.listeners[event.type];
          if (!entries) {
            return true;
          }
          for (const listener of [...entries]) {
            try {
              listener.callback.call(this, event);
            } catch (error) {
              setTimeout(() => {
                throw error;
              }, 0);
            }
            if (listener.once) {
              this.removeEventListener(event.type, listener.callback);
            }
          }
          return !event.defaultPrevented;
        }
      };
      exports.FakeEventTarget = FakeEventTarget;
    }
  });

  // node_modules/mediasoup-client/lib/handlers/FakeHandler.js
  var require_FakeHandler = __commonJS({
    "node_modules/mediasoup-client/lib/handlers/FakeHandler.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FakeHandler = void 0;
      var fake_mediastreamtrack_1 = require_lib4();
      var enhancedEvents_1 = require_enhancedEvents();
      var Logger_1 = require_Logger();
      var utils = require_utils();
      var ortc = require_ortc();
      var errors_1 = require_errors();
      var FakeEventTarget_1 = require_FakeEventTarget2();
      var logger = new Logger_1.Logger("FakeHandler");
      var NAME = "FakeHandler";
      var FakeHandler = class _FakeHandler extends enhancedEvents_1.EnhancedEventEmitter {
        constructor({
          // direction,
          // iceParameters,
          // iceCandidates,
          // dtlsParameters,
          // sctpParameters,
          // iceServers,
          // iceTransportPolicy,
          // additionalSettings,
          getSendExtendedRtpCapabilities
        }, fakeParameters) {
          super();
          // Closed flag.
          __publicField(this, "_closed", false);
          // Fake parameters source of RTP and SCTP parameters and capabilities.
          __publicField(this, "_fakeParameters");
          // Callback to request sending extended RTP capabilities on demand.
          __publicField(this, "_getSendExtendedRtpCapabilities");
          // Local RTCP CNAME.
          __publicField(this, "_cname", `CNAME-${utils.generateRandomNumber()}`);
          // Default sending MediaStream id.
          __publicField(this, "_defaultSendStreamId", `${utils.generateRandomNumber()}`);
          // Got transport local and remote parameters.
          __publicField(this, "_transportReady", false);
          // Next localId.
          __publicField(this, "_nextLocalId", 1);
          // Sending and receiving tracks indexed by localId.
          __publicField(this, "_tracks", /* @__PURE__ */ new Map());
          // DataChannel id value counter. It must be incremented for each new DataChannel.
          __publicField(this, "_nextSctpStreamId", 0);
          logger.debug("constructor()");
          this._getSendExtendedRtpCapabilities = getSendExtendedRtpCapabilities;
          this._fakeParameters = fakeParameters;
        }
        /**
         * Creates a factory function.
         */
        static createFactory(fakeParameters) {
          return {
            name: NAME,
            factory: (options) => new _FakeHandler(options, fakeParameters),
            getNativeRtpCapabilities: async ({ direction }) => {
              logger.debug("getNativeRtpCapabilities() [direction:%o]", direction);
              return _FakeHandler.getLocalRtpCapabilities(fakeParameters);
            },
            getNativeSctpCapabilities: async () => {
              logger.debug("getNativeSctpCapabilities()");
              return fakeParameters.generateNativeSctpCapabilities();
            }
          };
        }
        static getLocalRtpCapabilities(fakeParameters) {
          const nativeRtpCapabilities = fakeParameters.generateNativeRtpCapabilities();
          ortc.validateAndNormalizeRtpCapabilities(nativeRtpCapabilities);
          return nativeRtpCapabilities;
        }
        get name() {
          return NAME;
        }
        close() {
          logger.debug("close()");
          if (this._closed) {
            return;
          }
          this._closed = true;
          super.close();
        }
        // NOTE: Custom method for simulation purposes.
        setIceGatheringState(iceGatheringState) {
          this.emit("@icegatheringstatechange", iceGatheringState);
        }
        // NOTE: Custom method for simulation purposes.
        setConnectionState(connectionState) {
          this.emit("@connectionstatechange", connectionState);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async updateIceServers(iceServers) {
          this.assertNotClosed();
          logger.debug("updateIceServers()");
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async restartIce(iceParameters) {
          this.assertNotClosed();
          logger.debug("restartIce()");
        }
        async getTransportStats() {
          this.assertNotClosed();
          return /* @__PURE__ */ new Map();
        }
        async send({ track, streamId, encodings, codecOptions, codec }) {
          this.assertNotClosed();
          logger.debug("send() [kind:%s, track.id:%s]", track.kind, track.id);
          if (!this._transportReady) {
            await this.setupTransport({ localDtlsRole: "server" });
          }
          const nativeRtpCapabilities = _FakeHandler.getLocalRtpCapabilities(this._fakeParameters);
          const sendExtendedRtpCapabilities = this._getSendExtendedRtpCapabilities(nativeRtpCapabilities);
          const sendingRtpParameters = ortc.getSendingRtpParameters(track.kind, sendExtendedRtpCapabilities);
          sendingRtpParameters.codecs = ortc.reduceCodecs(sendingRtpParameters.codecs, codec);
          const useRtx = sendingRtpParameters.codecs.some((_codec) => /.+\/rtx$/i.test(_codec.mimeType));
          sendingRtpParameters.mid = `mid-${utils.generateRandomNumber()}`;
          sendingRtpParameters.msid = `${streamId ?? "-"} ${track.id}`;
          if (!encodings) {
            encodings = [{}];
          }
          for (const encoding of encodings) {
            encoding.ssrc = utils.generateRandomNumber();
            if (useRtx) {
              encoding.rtx = { ssrc: utils.generateRandomNumber() };
            }
          }
          sendingRtpParameters.encodings = encodings;
          sendingRtpParameters.rtcp = {
            cname: this._cname,
            reducedSize: true,
            mux: true
          };
          sendingRtpParameters.msid = `${streamId ?? this._defaultSendStreamId} ${track.id}`;
          const localId = this._nextLocalId++;
          this._tracks.set(localId, track);
          return { localId: String(localId), rtpParameters: sendingRtpParameters };
        }
        async stopSending(localId) {
          logger.debug("stopSending() [localId:%s]", localId);
          if (this._closed) {
            return;
          }
          if (!this._tracks.has(Number(localId))) {
            throw new Error("local track not found");
          }
          this._tracks.delete(Number(localId));
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async pauseSending(localId) {
          this.assertNotClosed();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async resumeSending(localId) {
          this.assertNotClosed();
        }
        async replaceTrack(localId, track) {
          this.assertNotClosed();
          if (track) {
            logger.debug("replaceTrack() [localId:%s, track.id:%s]", localId, track.id);
          } else {
            logger.debug("replaceTrack() [localId:%s, no track]", localId);
          }
          this._tracks.delete(Number(localId));
          this._tracks.set(Number(localId), track);
        }
        async setMaxSpatialLayer(localId, spatialLayer) {
          this.assertNotClosed();
          logger.debug("setMaxSpatialLayer() [localId:%s, spatialLayer:%s]", localId, spatialLayer);
        }
        async setRtpEncodingParameters(localId, params) {
          this.assertNotClosed();
          logger.debug("setRtpEncodingParameters() [localId:%s, params:%o]", localId, params);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async getSenderStats(localId) {
          this.assertNotClosed();
          return /* @__PURE__ */ new Map();
        }
        async sendDataChannel({ ordered, maxPacketLifeTime, maxRetransmits, label, protocol: protocol4 }) {
          this.assertNotClosed();
          if (!this._transportReady) {
            await this.setupTransport({ localDtlsRole: "server" });
          }
          logger.debug("sendDataChannel()");
          const dataChannel = new FakeRTCDataChannel({
            id: this._nextSctpStreamId++,
            ordered,
            maxPacketLifeTime,
            maxRetransmits,
            label,
            protocol: protocol4
          });
          const sctpStreamParameters = {
            streamId: this._nextSctpStreamId,
            ordered,
            maxPacketLifeTime,
            maxRetransmits
          };
          return { dataChannel, sctpStreamParameters };
        }
        async receive(optionsList) {
          this.assertNotClosed();
          const results = [];
          for (const options of optionsList) {
            const { trackId, kind } = options;
            if (!this._transportReady) {
              await this.setupTransport({ localDtlsRole: "client" });
            }
            logger.debug("receive() [trackId:%s, kind:%s]", trackId, kind);
            const localId = this._nextLocalId++;
            const track = new fake_mediastreamtrack_1.FakeMediaStreamTrack({ kind });
            this._tracks.set(localId, track);
            results.push({ localId: String(localId), track });
          }
          return results;
        }
        async stopReceiving(localIds) {
          if (this._closed) {
            return;
          }
          for (const localId of localIds) {
            logger.debug("stopReceiving() [localId:%s]", localId);
            this._tracks.delete(Number(localId));
          }
        }
        async pauseReceiving(localIds) {
          this.assertNotClosed();
        }
        async resumeReceiving(localIds) {
          this.assertNotClosed();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async getReceiverStats(localId) {
          this.assertNotClosed();
          return /* @__PURE__ */ new Map();
        }
        async receiveDataChannel({ sctpStreamParameters, label, protocol: protocol4 }) {
          this.assertNotClosed();
          if (!this._transportReady) {
            await this.setupTransport({ localDtlsRole: "client" });
          }
          logger.debug("receiveDataChannel()");
          const dataChannel = new FakeRTCDataChannel({
            id: sctpStreamParameters.streamId,
            ordered: sctpStreamParameters.ordered,
            maxPacketLifeTime: sctpStreamParameters.maxPacketLifeTime,
            maxRetransmits: sctpStreamParameters.maxRetransmits,
            label,
            protocol: protocol4
          });
          return { dataChannel };
        }
        async setupTransport({
          localDtlsRole,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          localSdpObject
        }) {
          const dtlsParameters = utils.clone(this._fakeParameters.generateLocalDtlsParameters());
          if (localDtlsRole) {
            dtlsParameters.role = localDtlsRole;
          }
          this.emit("@connectionstatechange", "connecting");
          await new Promise((resolve, reject) => this.emit("@connect", { dtlsParameters }, resolve, reject));
          this._transportReady = true;
        }
        assertNotClosed() {
          if (this._closed) {
            throw new errors_1.InvalidStateError("method called in a closed handler");
          }
        }
      };
      exports.FakeHandler = FakeHandler;
      var FakeRTCDataChannel = class extends FakeEventTarget_1.FakeEventTarget {
        constructor({ id, ordered = true, maxPacketLifeTime = null, maxRetransmits = null, label = "", protocol: protocol4 = "" }) {
          super();
          // Members for RTCDataChannel standard public getters/setters.
          __publicField(this, "_id");
          __publicField(this, "_negotiated", true);
          // mediasoup just uses negotiated DataChannels.
          __publicField(this, "_ordered");
          __publicField(this, "_maxPacketLifeTime");
          __publicField(this, "_maxRetransmits");
          __publicField(this, "_label");
          __publicField(this, "_protocol");
          __publicField(this, "_readyState", "connecting");
          __publicField(this, "_bufferedAmount", 0);
          __publicField(this, "_bufferedAmountLowThreshold", 0);
          __publicField(this, "_binaryType", "arraybuffer");
          // Events.
          __publicField(this, "_onopen", null);
          __publicField(this, "_onclosing", null);
          __publicField(this, "_onclose", null);
          __publicField(this, "_onmessage", null);
          __publicField(this, "_onbufferedamountlow", null);
          __publicField(this, "_onerror", null);
          logger.debug(`constructor() [id:${id}, ordered:${ordered}, maxPacketLifeTime:${maxPacketLifeTime}, maxRetransmits:${maxRetransmits}, label:${label}, protocol:${protocol4}`);
          this._id = id;
          this._ordered = ordered;
          this._maxPacketLifeTime = maxPacketLifeTime;
          this._maxRetransmits = maxRetransmits;
          this._label = label;
          this._protocol = protocol4;
        }
        get id() {
          return this._id;
        }
        get negotiated() {
          return this._negotiated;
        }
        get ordered() {
          return this._ordered;
        }
        get maxPacketLifeTime() {
          return this._maxPacketLifeTime;
        }
        get maxRetransmits() {
          return this._maxRetransmits;
        }
        get label() {
          return this._label;
        }
        get protocol() {
          return this._protocol;
        }
        get readyState() {
          return this._readyState;
        }
        get bufferedAmount() {
          return this._bufferedAmount;
        }
        get bufferedAmountLowThreshold() {
          return this._bufferedAmountLowThreshold;
        }
        set bufferedAmountLowThreshold(value2) {
          this._bufferedAmountLowThreshold = value2;
        }
        get binaryType() {
          return this._binaryType;
        }
        set binaryType(binaryType) {
          this._binaryType = binaryType;
        }
        get onopen() {
          return this._onopen;
        }
        set onopen(handler) {
          if (this._onopen) {
            this.removeEventListener("open", this._onopen);
          }
          this._onopen = handler;
          if (handler) {
            this.addEventListener("open", handler);
          }
        }
        get onclosing() {
          return this._onclosing;
        }
        set onclosing(handler) {
          if (this._onclosing) {
            this.removeEventListener("closing", this._onclosing);
          }
          this._onclosing = handler;
          if (handler) {
            this.addEventListener("closing", handler);
          }
        }
        get onclose() {
          return this._onclose;
        }
        set onclose(handler) {
          if (this._onclose) {
            this.removeEventListener("close", this._onclose);
          }
          this._onclose = handler;
          if (handler) {
            this.addEventListener("close", handler);
          }
        }
        get onmessage() {
          return this._onmessage;
        }
        set onmessage(handler) {
          if (this._onmessage) {
            this.removeEventListener("message", this._onmessage);
          }
          this._onmessage = handler;
          if (handler) {
            this.addEventListener("message", handler);
          }
        }
        get onbufferedamountlow() {
          return this._onbufferedamountlow;
        }
        set onbufferedamountlow(handler) {
          if (this._onbufferedamountlow) {
            this.removeEventListener("bufferedamountlow", this._onbufferedamountlow);
          }
          this._onbufferedamountlow = handler;
          if (handler) {
            this.addEventListener("bufferedamountlow", handler);
          }
        }
        get onerror() {
          return this._onerror;
        }
        set onerror(handler) {
          if (this._onerror) {
            this.removeEventListener("error", this._onerror);
          }
          this._onerror = handler;
          if (handler) {
            this.addEventListener("error", handler);
          }
        }
        addEventListener(type, listener, options) {
          super.addEventListener(type, listener, options);
        }
        removeEventListener(type, listener, options) {
          super.removeEventListener(type, listener, options);
        }
        close() {
          if (["closing", "closed"].includes(this._readyState)) {
            return;
          }
          this._readyState = "closed";
        }
        /**
         * We extend the definition of send() to allow Node Buffer. However
         * ArrayBufferView and Blob do not exist in Node.
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        send(data) {
          if (this._readyState !== "open") {
            throw new errors_1.InvalidStateError("not open");
          }
        }
      };
    }
  });

  // node_modules/mediasoup-client/lib/test/fakeParameters.js
  var require_fakeParameters = __commonJS({
    "node_modules/mediasoup-client/lib/test/fakeParameters.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.generateRouterRtpCapabilities = generateRouterRtpCapabilities;
      exports.generateNativeRtpCapabilities = generateNativeRtpCapabilities;
      exports.generateNativeSctpCapabilities = generateNativeSctpCapabilities;
      exports.generateLocalDtlsParameters = generateLocalDtlsParameters;
      exports.generateTransportRemoteParameters = generateTransportRemoteParameters;
      exports.generateProducerRemoteParameters = generateProducerRemoteParameters;
      exports.generateConsumerRemoteParameters = generateConsumerRemoteParameters;
      exports.generateDataProducerRemoteParameters = generateDataProducerRemoteParameters;
      exports.generateDataConsumerRemoteParameters = generateDataConsumerRemoteParameters;
      var utils = require_utils();
      function generateFakeUuid() {
        return String(utils.generateRandomNumber());
      }
      function generateRouterRtpCapabilities() {
        return utils.deepFreeze({
          codecs: [
            {
              mimeType: "audio/opus",
              kind: "audio",
              preferredPayloadType: 100,
              clockRate: 48e3,
              channels: 2,
              rtcpFeedback: [{ type: "transport-cc" }],
              parameters: {
                useinbandfec: 1,
                foo: "bar"
              }
            },
            {
              mimeType: "video/VP8",
              kind: "video",
              preferredPayloadType: 101,
              clockRate: 9e4,
              rtcpFeedback: [
                { type: "nack" },
                { type: "nack", parameter: "pli" },
                { type: "ccm", parameter: "fir" },
                { type: "goog-remb" },
                { type: "transport-cc" }
              ],
              parameters: {
                "x-google-start-bitrate": 1500
              }
            },
            {
              mimeType: "video/rtx",
              kind: "video",
              preferredPayloadType: 102,
              clockRate: 9e4,
              rtcpFeedback: [],
              parameters: {
                apt: 101
              }
            },
            {
              mimeType: "video/H264",
              kind: "video",
              preferredPayloadType: 103,
              clockRate: 9e4,
              rtcpFeedback: [
                { type: "nack" },
                { type: "nack", parameter: "pli" },
                { type: "ccm", parameter: "fir" },
                { type: "goog-remb" },
                { type: "transport-cc" }
              ],
              parameters: {
                "level-asymmetry-allowed": 1,
                "packetization-mode": 1,
                "profile-level-id": "42e01f"
              }
            },
            {
              mimeType: "video/rtx",
              kind: "video",
              preferredPayloadType: 104,
              clockRate: 9e4,
              rtcpFeedback: [],
              parameters: {
                apt: 103
              }
            },
            {
              mimeType: "video/VP9",
              kind: "video",
              preferredPayloadType: 105,
              clockRate: 9e4,
              rtcpFeedback: [
                { type: "nack" },
                { type: "nack", parameter: "pli" },
                { type: "ccm", parameter: "fir" },
                { type: "goog-remb" },
                { type: "transport-cc" }
              ],
              parameters: {
                "profile-id": 0,
                "x-google-start-bitrate": 1500
              }
            },
            {
              mimeType: "video/rtx",
              kind: "video",
              preferredPayloadType: 106,
              clockRate: 9e4,
              rtcpFeedback: [],
              parameters: {
                apt: 105
              }
            }
          ],
          headerExtensions: [
            {
              kind: "audio",
              uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
              preferredId: 1,
              preferredEncrypt: false,
              direction: "sendrecv"
            },
            {
              kind: "video",
              uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
              preferredId: 1,
              preferredEncrypt: false,
              direction: "sendrecv"
            },
            {
              kind: "video",
              uri: "urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id",
              preferredId: 2,
              preferredEncrypt: false,
              direction: "recvonly"
            },
            {
              kind: "video",
              uri: "urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id",
              preferredId: 3,
              preferredEncrypt: false,
              direction: "recvonly"
            },
            {
              kind: "audio",
              uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
              preferredId: 4,
              preferredEncrypt: false,
              direction: "sendrecv"
            },
            {
              kind: "video",
              uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
              preferredId: 4,
              preferredEncrypt: false,
              direction: "sendrecv"
            },
            {
              kind: "audio",
              uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
              preferredId: 5,
              preferredEncrypt: false,
              direction: "recvonly"
            },
            {
              kind: "video",
              uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
              preferredId: 5,
              preferredEncrypt: false,
              direction: "sendrecv"
            },
            {
              kind: "audio",
              uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
              preferredId: 10,
              preferredEncrypt: false,
              direction: "sendrecv"
            },
            {
              kind: "video",
              uri: "urn:3gpp:video-orientation",
              preferredId: 11,
              preferredEncrypt: false,
              direction: "sendrecv"
            },
            {
              kind: "video",
              uri: "urn:ietf:params:rtp-hdrext:toffset",
              preferredId: 12,
              preferredEncrypt: false,
              direction: "sendrecv"
            }
          ]
        });
      }
      function generateNativeRtpCapabilities() {
        return {
          codecs: [
            {
              mimeType: "audio/opus",
              kind: "audio",
              preferredPayloadType: 111,
              clockRate: 48e3,
              channels: 2,
              rtcpFeedback: [{ type: "transport-cc" }],
              parameters: {
                minptime: 10,
                useinbandfec: 1
              }
            },
            {
              mimeType: "audio/ISAC",
              kind: "audio",
              preferredPayloadType: 103,
              clockRate: 16e3,
              channels: 1,
              rtcpFeedback: [{ type: "transport-cc" }],
              parameters: {}
            },
            {
              mimeType: "audio/CN",
              kind: "audio",
              preferredPayloadType: 106,
              clockRate: 32e3,
              channels: 1,
              rtcpFeedback: [{ type: "transport-cc" }],
              parameters: {}
            },
            {
              mimeType: "audio/foo",
              kind: "audio",
              preferredPayloadType: 107,
              clockRate: 9e4,
              channels: 4,
              rtcpFeedback: [{ type: "foo-qwe-qwe" }],
              parameters: {
                foo: "lalala"
              }
            },
            {
              mimeType: "video/BAZCODEC",
              kind: "video",
              preferredPayloadType: 100,
              clockRate: 9e4,
              rtcpFeedback: [
                { type: "foo" },
                { type: "transport-cc" },
                { type: "ccm", parameter: "fir" },
                { type: "nack" },
                { type: "nack", parameter: "pli" }
              ],
              parameters: {
                baz: "1234abcd"
              }
            },
            {
              mimeType: "video/rtx",
              kind: "video",
              preferredPayloadType: 101,
              clockRate: 9e4,
              rtcpFeedback: [],
              parameters: {
                apt: 100
              }
            },
            {
              mimeType: "video/VP8",
              kind: "video",
              preferredPayloadType: 96,
              clockRate: 9e4,
              rtcpFeedback: [
                { type: "goog-remb" },
                { type: "transport-cc" },
                { type: "ccm", parameter: "fir" },
                { type: "nack" },
                { type: "nack", parameter: "pli" }
              ],
              parameters: {
                baz: "1234abcd"
              }
            },
            {
              mimeType: "video/rtx",
              kind: "video",
              preferredPayloadType: 97,
              clockRate: 9e4,
              rtcpFeedback: [],
              parameters: {
                apt: 96
              }
            },
            {
              mimeType: "video/VP9",
              kind: "video",
              preferredPayloadType: 98,
              clockRate: 9e4,
              rtcpFeedback: [
                { type: "goog-remb" },
                { type: "transport-cc" },
                { type: "ccm", parameter: "fir" },
                { type: "nack" },
                { type: "nack", parameter: "pli" }
              ],
              parameters: {
                "profile-id": 0
              }
            },
            {
              mimeType: "video/rtx",
              kind: "video",
              preferredPayloadType: 99,
              clockRate: 9e4,
              rtcpFeedback: [],
              parameters: {
                apt: 98
              }
            }
          ],
          headerExtensions: [
            {
              kind: "audio",
              uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
              preferredId: 1
            },
            {
              kind: "video",
              uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
              preferredId: 1
            },
            {
              kind: "video",
              uri: "urn:ietf:params:rtp-hdrext:toffset",
              preferredId: 2
            },
            {
              kind: "video",
              uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
              preferredId: 3
            },
            {
              kind: "video",
              uri: "urn:3gpp:video-orientation",
              preferredId: 4
            },
            {
              kind: "video",
              uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
              preferredId: 5
            },
            {
              kind: "video",
              uri: "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
              preferredId: 6
            },
            {
              kind: "video",
              // @ts-expect-error --- ON purpose.
              uri: "http://www.webrtc.org/experiments/rtp-hdrext/video-content-type",
              preferredId: 7
            },
            {
              kind: "video",
              // @ts-expect-error --- ON purpose.
              uri: "http://www.webrtc.org/experiments/rtp-hdrext/video-timing",
              preferredId: 8
            },
            {
              kind: "audio",
              uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
              preferredId: 10
            }
          ]
        };
      }
      function generateNativeSctpCapabilities() {
        return utils.deepFreeze({
          numStreams: { OS: 2048, MIS: 2048 }
        });
      }
      function generateLocalDtlsParameters() {
        return utils.deepFreeze({
          fingerprints: [
            {
              algorithm: "sha-256",
              value: "82:5A:68:3D:36:C3:0A:DE:AF:E7:32:43:D2:88:83:57:AC:2D:65:E5:80:C4:B6:FB:AF:1A:A0:21:9F:6D:0C:AD"
            }
          ],
          role: "auto"
        });
      }
      function generateTransportRemoteParameters() {
        return {
          id: generateFakeUuid(),
          iceParameters: utils.deepFreeze({
            iceLite: true,
            password: "yku5ej8nvfaor28lvtrabcx0wkrpkztz",
            usernameFragment: "h3hk1iz6qqlnqlne"
          }),
          iceCandidates: utils.deepFreeze([
            {
              foundation: "udpcandidate",
              address: "9.9.9.9",
              ip: "9.9.9.9",
              port: 40533,
              priority: 1078862079,
              protocol: "udp",
              type: "host",
              tcpType: "passive"
            },
            {
              foundation: "udpcandidate",
              address: "9.9.9.9",
              ip: "9:9:9:9:9:9",
              port: 41333,
              priority: 1078862089,
              protocol: "udp",
              type: "host",
              tcpType: "passive"
            }
          ]),
          dtlsParameters: utils.deepFreeze({
            fingerprints: [
              {
                algorithm: "sha-256",
                value: "A9:F4:E0:D2:74:D3:0F:D9:CA:A5:2F:9F:7F:47:FA:F0:C4:72:DD:73:49:D0:3B:14:90:20:51:30:1B:90:8E:71"
              },
              {
                algorithm: "sha-384",
                value: "03:D9:0B:87:13:98:F6:6D:BC:FC:92:2E:39:D4:E1:97:32:61:30:56:84:70:81:6E:D1:82:97:EA:D9:C1:21:0F:6B:C5:E7:7F:E1:97:0C:17:97:6E:CF:B3:EF:2E:74:B0"
              },
              {
                algorithm: "sha-512",
                value: "84:27:A4:28:A4:73:AF:43:02:2A:44:68:FF:2F:29:5C:3B:11:9A:60:F4:A8:F0:F5:AC:A0:E3:49:3E:B1:34:53:A9:85:CE:51:9B:ED:87:5E:B8:F4:8E:3D:FA:20:51:B8:96:EE:DA:56:DC:2F:5C:62:79:15:23:E0:21:82:2B:2C"
              }
            ],
            role: "auto"
          }),
          sctpParameters: utils.deepFreeze({
            port: 5e3,
            OS: 2048,
            MIS: 2048,
            maxMessageSize: 2e6
          })
        };
      }
      function generateProducerRemoteParameters() {
        return utils.deepFreeze({
          id: generateFakeUuid()
        });
      }
      function generateConsumerRemoteParameters({ id, codecMimeType } = {}) {
        switch (codecMimeType) {
          case "audio/opus": {
            return {
              id: id ?? generateFakeUuid(),
              producerId: generateFakeUuid(),
              kind: "audio",
              rtpParameters: utils.deepFreeze({
                codecs: [
                  {
                    mimeType: "audio/opus",
                    payloadType: 100,
                    clockRate: 48e3,
                    channels: 2,
                    rtcpFeedback: [{ type: "transport-cc" }],
                    parameters: {
                      useinbandfec: 1,
                      foo: "bar"
                    }
                  }
                ],
                encodings: [
                  {
                    ssrc: 46687003
                  }
                ],
                headerExtensions: [
                  {
                    uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                    id: 1
                  },
                  {
                    uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
                    id: 5
                  },
                  {
                    uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
                    id: 10
                  }
                ],
                rtcp: {
                  cname: "wB4Ql4lrsxYLjzuN",
                  reducedSize: true,
                  mux: true
                }
              })
            };
          }
          case "audio/ISAC": {
            return {
              id: id ?? generateFakeUuid(),
              producerId: generateFakeUuid(),
              kind: "audio",
              rtpParameters: utils.deepFreeze({
                codecs: [
                  {
                    mimeType: "audio/ISAC",
                    payloadType: 111,
                    clockRate: 16e3,
                    channels: 1,
                    rtcpFeedback: [{ type: "transport-cc" }],
                    parameters: {}
                  }
                ],
                encodings: [
                  {
                    ssrc: 46687004
                  }
                ],
                headerExtensions: [
                  {
                    uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                    id: 1
                  },
                  {
                    uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
                    id: 5
                  }
                ],
                rtcp: {
                  cname: "wB4Ql4lrsxYLjzuN",
                  reducedSize: true,
                  mux: true
                }
              })
            };
          }
          case "video/VP8": {
            return {
              id: id ?? generateFakeUuid(),
              producerId: generateFakeUuid(),
              kind: "video",
              rtpParameters: utils.deepFreeze({
                codecs: [
                  {
                    mimeType: "video/VP8",
                    payloadType: 101,
                    clockRate: 9e4,
                    rtcpFeedback: [
                      { type: "nack" },
                      { type: "nack", parameter: "pli" },
                      { type: "ccm", parameter: "fir" },
                      { type: "goog-remb" },
                      { type: "transport-cc" }
                    ],
                    parameters: {
                      "x-google-start-bitrate": 1500
                    }
                  },
                  {
                    mimeType: "video/rtx",
                    payloadType: 102,
                    clockRate: 9e4,
                    rtcpFeedback: [],
                    parameters: {
                      apt: 101
                    }
                  }
                ],
                encodings: [
                  {
                    ssrc: 99991111,
                    rtx: {
                      ssrc: 99991112
                    }
                  }
                ],
                headerExtensions: [
                  {
                    uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                    id: 1
                  },
                  {
                    uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
                    id: 4
                  },
                  {
                    uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
                    id: 5
                  },
                  {
                    uri: "urn:3gpp:video-orientation",
                    id: 11
                  },
                  {
                    uri: "urn:ietf:params:rtp-hdrext:toffset",
                    id: 12
                  }
                ],
                rtcp: {
                  cname: "wB4Ql4lrsxYLjzuN",
                  reducedSize: true,
                  mux: true
                }
              })
            };
          }
          case "video/H264": {
            return {
              id: id ?? generateFakeUuid(),
              producerId: generateFakeUuid(),
              kind: "video",
              rtpParameters: utils.deepFreeze({
                codecs: [
                  {
                    mimeType: "video/H264",
                    payloadType: 103,
                    clockRate: 9e4,
                    rtcpFeedback: [
                      { type: "nack" },
                      { type: "nack", parameter: "pli" },
                      { type: "ccm", parameter: "fir" },
                      { type: "goog-remb" },
                      { type: "transport-cc" }
                    ],
                    parameters: {
                      "level-asymmetry-allowed": 1,
                      "packetization-mode": 1,
                      "profile-level-id": "42e01f"
                    }
                  },
                  {
                    mimeType: "video/rtx",
                    payloadType: 104,
                    clockRate: 9e4,
                    rtcpFeedback: [],
                    parameters: {
                      apt: 103
                    }
                  }
                ],
                encodings: [
                  {
                    ssrc: 99991113,
                    rtx: {
                      ssrc: 99991114
                    }
                  }
                ],
                headerExtensions: [
                  {
                    uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
                    id: 1
                  },
                  {
                    uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
                    id: 4
                  },
                  {
                    uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
                    id: 5
                  },
                  {
                    uri: "urn:3gpp:video-orientation",
                    id: 11
                  },
                  {
                    uri: "urn:ietf:params:rtp-hdrext:toffset",
                    id: 12
                  }
                ],
                rtcp: {
                  cname: "wB4Ql4lrsxYLjzuN",
                  reducedSize: true,
                  mux: true
                }
              })
            };
          }
          default: {
            throw new TypeError(`unknown codecMimeType '${codecMimeType}'`);
          }
        }
      }
      function generateDataProducerRemoteParameters() {
        return utils.deepFreeze({
          id: generateFakeUuid()
        });
      }
      function generateDataConsumerRemoteParameters({ id } = {}) {
        return {
          id: id ?? generateFakeUuid(),
          dataProducerId: generateFakeUuid(),
          sctpStreamParameters: utils.deepFreeze({
            streamId: 666,
            maxPacketLifeTime: 5e3,
            maxRetransmits: void 0
          })
        };
      }
    }
  });

  // node_modules/mediasoup-client/lib/index.js
  var require_lib5 = __commonJS({
    "node_modules/mediasoup-client/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.debug = exports.testFakeParameters = exports.FakeHandler = exports.enhancedEvents = exports.ortc = exports.parseScalabilityMode = exports.detectDeviceAsync = exports.detectDevice = exports.Device = exports.version = exports.types = void 0;
      var debug_1 = require_browser();
      exports.debug = debug_1.default;
      exports.types = require_types();
      exports.version = "3.18.7";
      var Device_1 = require_Device();
      Object.defineProperty(exports, "Device", { enumerable: true, get: function() {
        return Device_1.Device;
      } });
      Object.defineProperty(exports, "detectDevice", { enumerable: true, get: function() {
        return Device_1.detectDevice;
      } });
      Object.defineProperty(exports, "detectDeviceAsync", { enumerable: true, get: function() {
        return Device_1.detectDeviceAsync;
      } });
      var scalabilityModes_1 = require_scalabilityModes();
      Object.defineProperty(exports, "parseScalabilityMode", { enumerable: true, get: function() {
        return scalabilityModes_1.parse;
      } });
      exports.ortc = require_ortc();
      exports.enhancedEvents = require_enhancedEvents();
      var FakeHandler_1 = require_FakeHandler();
      Object.defineProperty(exports, "FakeHandler", { enumerable: true, get: function() {
        return FakeHandler_1.FakeHandler;
      } });
      exports.testFakeParameters = require_fakeParameters();
    }
  });

  // node_modules/engine.io-parser/build/esm/commons.js
  var PACKET_TYPES = /* @__PURE__ */ Object.create(null);
  PACKET_TYPES["open"] = "0";
  PACKET_TYPES["close"] = "1";
  PACKET_TYPES["ping"] = "2";
  PACKET_TYPES["pong"] = "3";
  PACKET_TYPES["message"] = "4";
  PACKET_TYPES["upgrade"] = "5";
  PACKET_TYPES["noop"] = "6";
  var PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
  Object.keys(PACKET_TYPES).forEach((key) => {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
  });
  var ERROR_PACKET = { type: "error", data: "parser error" };

  // node_modules/engine.io-parser/build/esm/encodePacket.browser.js
  var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
  var withNativeArrayBuffer = typeof ArrayBuffer === "function";
  var isView = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
  };
  var encodePacket = ({ type, data }, supportsBinary, callback) => {
    if (withNativeBlob && data instanceof Blob) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(data, callback);
      }
    } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(new Blob([data]), callback);
      }
    }
    return callback(PACKET_TYPES[type] + (data || ""));
  };
  var encodeBlobAsBase64 = (data, callback) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const content = fileReader.result.split(",")[1];
      callback("b" + (content || ""));
    };
    return fileReader.readAsDataURL(data);
  };
  function toArray(data) {
    if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    } else {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
  }
  var TEXT_ENCODER;
  function encodePacketToBinary(packet, callback) {
    if (withNativeBlob && packet.data instanceof Blob) {
      return packet.data.arrayBuffer().then(toArray).then(callback);
    } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
      return callback(toArray(packet.data));
    }
    encodePacket(packet, false, (encoded) => {
      if (!TEXT_ENCODER) {
        TEXT_ENCODER = new TextEncoder();
      }
      callback(TEXT_ENCODER.encode(encoded));
    });
  }

  // node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var decode = (base64) => {
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }
    const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return arraybuffer;
  };

  // node_modules/engine.io-parser/build/esm/decodePacket.browser.js
  var withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
  var decodePacket = (encodedPacket, binaryType) => {
    if (typeof encodedPacket !== "string") {
      return {
        type: "message",
        data: mapBinary(encodedPacket, binaryType)
      };
    }
    const type = encodedPacket.charAt(0);
    if (type === "b") {
      return {
        type: "message",
        data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
      };
    }
    const packetType = PACKET_TYPES_REVERSE[type];
    if (!packetType) {
      return ERROR_PACKET;
    }
    return encodedPacket.length > 1 ? {
      type: PACKET_TYPES_REVERSE[type],
      data: encodedPacket.substring(1)
    } : {
      type: PACKET_TYPES_REVERSE[type]
    };
  };
  var decodeBase64Packet = (data, binaryType) => {
    if (withNativeArrayBuffer2) {
      const decoded = decode(data);
      return mapBinary(decoded, binaryType);
    } else {
      return { base64: true, data };
    }
  };
  var mapBinary = (data, binaryType) => {
    switch (binaryType) {
      case "blob":
        if (data instanceof Blob) {
          return data;
        } else {
          return new Blob([data]);
        }
      case "arraybuffer":
      default:
        if (data instanceof ArrayBuffer) {
          return data;
        } else {
          return data.buffer;
        }
    }
  };

  // node_modules/engine.io-parser/build/esm/index.js
  var SEPARATOR = String.fromCharCode(30);
  var encodePayload = (packets, callback) => {
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;
    packets.forEach((packet, i) => {
      encodePacket(packet, false, (encodedPacket) => {
        encodedPackets[i] = encodedPacket;
        if (++count === length) {
          callback(encodedPackets.join(SEPARATOR));
        }
      });
    });
  };
  var decodePayload = (encodedPayload, binaryType) => {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
      const decodedPacket = decodePacket(encodedPackets[i], binaryType);
      packets.push(decodedPacket);
      if (decodedPacket.type === "error") {
        break;
      }
    }
    return packets;
  };
  function createPacketEncoderStream() {
    return new TransformStream({
      transform(packet, controller) {
        encodePacketToBinary(packet, (encodedPacket) => {
          const payloadLength = encodedPacket.length;
          let header;
          if (payloadLength < 126) {
            header = new Uint8Array(1);
            new DataView(header.buffer).setUint8(0, payloadLength);
          } else if (payloadLength < 65536) {
            header = new Uint8Array(3);
            const view = new DataView(header.buffer);
            view.setUint8(0, 126);
            view.setUint16(1, payloadLength);
          } else {
            header = new Uint8Array(9);
            const view = new DataView(header.buffer);
            view.setUint8(0, 127);
            view.setBigUint64(1, BigInt(payloadLength));
          }
          if (packet.data && typeof packet.data !== "string") {
            header[0] |= 128;
          }
          controller.enqueue(header);
          controller.enqueue(encodedPacket);
        });
      }
    });
  }
  var TEXT_DECODER;
  function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
      return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i = 0; i < size; i++) {
      buffer[i] = chunks[0][j++];
      if (j === chunks[0].length) {
        chunks.shift();
        j = 0;
      }
    }
    if (chunks.length && j < chunks[0].length) {
      chunks[0] = chunks[0].slice(j);
    }
    return buffer;
  }
  function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
      TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0;
    let expectedLength = -1;
    let isBinary2 = false;
    return new TransformStream({
      transform(chunk, controller) {
        chunks.push(chunk);
        while (true) {
          if (state === 0) {
            if (totalLength(chunks) < 1) {
              break;
            }
            const header = concatChunks(chunks, 1);
            isBinary2 = (header[0] & 128) === 128;
            expectedLength = header[0] & 127;
            if (expectedLength < 126) {
              state = 3;
            } else if (expectedLength === 126) {
              state = 1;
            } else {
              state = 2;
            }
          } else if (state === 1) {
            if (totalLength(chunks) < 2) {
              break;
            }
            const headerArray = concatChunks(chunks, 2);
            expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
            state = 3;
          } else if (state === 2) {
            if (totalLength(chunks) < 8) {
              break;
            }
            const headerArray = concatChunks(chunks, 8);
            const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
            const n = view.getUint32(0);
            if (n > Math.pow(2, 53 - 32) - 1) {
              controller.enqueue(ERROR_PACKET);
              break;
            }
            expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
            state = 3;
          } else {
            if (totalLength(chunks) < expectedLength) {
              break;
            }
            const data = concatChunks(chunks, expectedLength);
            controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
            state = 0;
          }
          if (expectedLength === 0 || expectedLength > maxPayload) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
        }
      }
    });
  }
  var protocol = 4;

  // node_modules/@socket.io/component-emitter/lib/esm/index.js
  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }
  Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
    return this;
  };
  Emitter.prototype.once = function(event, fn) {
    function on2() {
      this.off(event, on2);
      fn.apply(this, arguments);
    }
    on2.fn = fn;
    this.on(event, on2);
    return this;
  };
  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }
    var callbacks = this._callbacks["$" + event];
    if (!callbacks) return this;
    if (1 == arguments.length) {
      delete this._callbacks["$" + event];
      return this;
    }
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    if (callbacks.length === 0) {
      delete this._callbacks["$" + event];
    }
    return this;
  };
  Emitter.prototype.emit = function(event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }
    return this;
  };
  Emitter.prototype.emitReserved = Emitter.prototype.emit;
  Emitter.prototype.listeners = function(event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks["$" + event] || [];
  };
  Emitter.prototype.hasListeners = function(event) {
    return !!this.listeners(event).length;
  };

  // node_modules/engine.io-client/build/esm/globals.js
  var nextTick = (() => {
    const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
    if (isPromiseAvailable) {
      return (cb) => Promise.resolve().then(cb);
    } else {
      return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
    }
  })();
  var globalThisShim = (() => {
    if (typeof self !== "undefined") {
      return self;
    } else if (typeof window !== "undefined") {
      return window;
    } else {
      return Function("return this")();
    }
  })();
  var defaultBinaryType = "arraybuffer";
  function createCookieJar() {
  }

  // node_modules/engine.io-client/build/esm/util.js
  function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
      if (obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }
      return acc;
    }, {});
  }
  var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
  var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
  function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
      obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
      obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
    } else {
      obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
      obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
    }
  }
  var BASE64_OVERHEAD = 1.33;
  function byteLength(obj) {
    if (typeof obj === "string") {
      return utf8Length(obj);
    }
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }
  function utf8Length(str) {
    let c = 0, length = 0;
    for (let i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);
      if (c < 128) {
        length += 1;
      } else if (c < 2048) {
        length += 2;
      } else if (c < 55296 || c >= 57344) {
        length += 3;
      } else {
        i++;
        length += 4;
      }
    }
    return length;
  }
  function randomString() {
    return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
  }

  // node_modules/engine.io-client/build/esm/contrib/parseqs.js
  function encode(obj) {
    let str = "";
    for (let i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length)
          str += "&";
        str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
      }
    }
    return str;
  }
  function decode2(qs) {
    let qry = {};
    let pairs = qs.split("&");
    for (let i = 0, l = pairs.length; i < l; i++) {
      let pair = pairs[i].split("=");
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
  }

  // node_modules/engine.io-client/build/esm/transport.js
  var TransportError = class extends Error {
    constructor(reason, description, context) {
      super(reason);
      this.description = description;
      this.context = context;
      this.type = "TransportError";
    }
  };
  var Transport = class extends Emitter {
    /**
     * Transport abstract constructor.
     *
     * @param {Object} opts - options
     * @protected
     */
    constructor(opts) {
      super();
      this.writable = false;
      installTimerFunctions(this, opts);
      this.opts = opts;
      this.query = opts.query;
      this.socket = opts.socket;
      this.supportsBinary = !opts.forceBase64;
    }
    /**
     * Emits an error.
     *
     * @param {String} reason
     * @param description
     * @param context - the error context
     * @return {Transport} for chaining
     * @protected
     */
    onError(reason, description, context) {
      super.emitReserved("error", new TransportError(reason, description, context));
      return this;
    }
    /**
     * Opens the transport.
     */
    open() {
      this.readyState = "opening";
      this.doOpen();
      return this;
    }
    /**
     * Closes the transport.
     */
    close() {
      if (this.readyState === "opening" || this.readyState === "open") {
        this.doClose();
        this.onClose();
      }
      return this;
    }
    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     */
    send(packets) {
      if (this.readyState === "open") {
        this.write(packets);
      } else {
      }
    }
    /**
     * Called upon open
     *
     * @protected
     */
    onOpen() {
      this.readyState = "open";
      this.writable = true;
      super.emitReserved("open");
    }
    /**
     * Called with data.
     *
     * @param {String} data
     * @protected
     */
    onData(data) {
      const packet = decodePacket(data, this.socket.binaryType);
      this.onPacket(packet);
    }
    /**
     * Called with a decoded packet.
     *
     * @protected
     */
    onPacket(packet) {
      super.emitReserved("packet", packet);
    }
    /**
     * Called upon close.
     *
     * @protected
     */
    onClose(details) {
      this.readyState = "closed";
      super.emitReserved("close", details);
    }
    /**
     * Pauses the transport, in order not to lose packets during an upgrade.
     *
     * @param onPause
     */
    pause(onPause) {
    }
    createUri(schema, query = {}) {
      return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
    }
    _hostname() {
      const hostname = this.opts.hostname;
      return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
    }
    _port() {
      if (this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80)) {
        return ":" + this.opts.port;
      } else {
        return "";
      }
    }
    _query(query) {
      const encodedQuery = encode(query);
      return encodedQuery.length ? "?" + encodedQuery : "";
    }
  };

  // node_modules/engine.io-client/build/esm/transports/polling.js
  var Polling = class extends Transport {
    constructor() {
      super(...arguments);
      this._polling = false;
    }
    get name() {
      return "polling";
    }
    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @protected
     */
    doOpen() {
      this._poll();
    }
    /**
     * Pauses polling.
     *
     * @param {Function} onPause - callback upon buffers are flushed and transport is paused
     * @package
     */
    pause(onPause) {
      this.readyState = "pausing";
      const pause = () => {
        this.readyState = "paused";
        onPause();
      };
      if (this._polling || !this.writable) {
        let total = 0;
        if (this._polling) {
          total++;
          this.once("pollComplete", function() {
            --total || pause();
          });
        }
        if (!this.writable) {
          total++;
          this.once("drain", function() {
            --total || pause();
          });
        }
      } else {
        pause();
      }
    }
    /**
     * Starts polling cycle.
     *
     * @private
     */
    _poll() {
      this._polling = true;
      this.doPoll();
      this.emitReserved("poll");
    }
    /**
     * Overloads onData to detect payloads.
     *
     * @protected
     */
    onData(data) {
      const callback = (packet) => {
        if ("opening" === this.readyState && packet.type === "open") {
          this.onOpen();
        }
        if ("close" === packet.type) {
          this.onClose({ description: "transport closed by the server" });
          return false;
        }
        this.onPacket(packet);
      };
      decodePayload(data, this.socket.binaryType).forEach(callback);
      if ("closed" !== this.readyState) {
        this._polling = false;
        this.emitReserved("pollComplete");
        if ("open" === this.readyState) {
          this._poll();
        } else {
        }
      }
    }
    /**
     * For polling, send a close packet.
     *
     * @protected
     */
    doClose() {
      const close = () => {
        this.write([{ type: "close" }]);
      };
      if ("open" === this.readyState) {
        close();
      } else {
        this.once("open", close);
      }
    }
    /**
     * Writes a packets payload.
     *
     * @param {Array} packets - data packets
     * @protected
     */
    write(packets) {
      this.writable = false;
      encodePayload(packets, (data) => {
        this.doWrite(data, () => {
          this.writable = true;
          this.emitReserved("drain");
        });
      });
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "https" : "http";
      const query = this.query || {};
      if (false !== this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary && !query.sid) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };

  // node_modules/engine.io-client/build/esm/contrib/has-cors.js
  var value = false;
  try {
    value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
  } catch (err) {
  }
  var hasCORS = value;

  // node_modules/engine.io-client/build/esm/transports/polling-xhr.js
  function empty() {
  }
  var BaseXHR = class extends Polling {
    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @package
     */
    constructor(opts) {
      super(opts);
      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;
        if (!port) {
          port = isSSL ? "443" : "80";
        }
        this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
      }
    }
    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @private
     */
    doWrite(data, fn) {
      const req = this.request({
        method: "POST",
        data
      });
      req.on("success", fn);
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr post error", xhrStatus, context);
      });
    }
    /**
     * Starts a poll cycle.
     *
     * @private
     */
    doPoll() {
      const req = this.request();
      req.on("data", this.onData.bind(this));
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr poll error", xhrStatus, context);
      });
      this.pollXhr = req;
    }
  };
  var Request = class _Request extends Emitter {
    /**
     * Request constructor
     *
     * @param {Object} options
     * @package
     */
    constructor(createRequest, uri, opts) {
      super();
      this.createRequest = createRequest;
      installTimerFunctions(this, opts);
      this._opts = opts;
      this._method = opts.method || "GET";
      this._uri = uri;
      this._data = void 0 !== opts.data ? opts.data : null;
      this._create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    _create() {
      var _a;
      const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
      opts.xdomain = !!this._opts.xd;
      const xhr = this._xhr = this.createRequest(opts);
      try {
        xhr.open(this._method, this._uri, true);
        try {
          if (this._opts.extraHeaders) {
            xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
            for (let i in this._opts.extraHeaders) {
              if (this._opts.extraHeaders.hasOwnProperty(i)) {
                xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
              }
            }
          }
        } catch (e) {
        }
        if ("POST" === this._method) {
          try {
            xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
          } catch (e) {
          }
        }
        try {
          xhr.setRequestHeader("Accept", "*/*");
        } catch (e) {
        }
        (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
        if ("withCredentials" in xhr) {
          xhr.withCredentials = this._opts.withCredentials;
        }
        if (this._opts.requestTimeout) {
          xhr.timeout = this._opts.requestTimeout;
        }
        xhr.onreadystatechange = () => {
          var _a2;
          if (xhr.readyState === 3) {
            (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(
              // @ts-ignore
              xhr.getResponseHeader("set-cookie")
            );
          }
          if (4 !== xhr.readyState)
            return;
          if (200 === xhr.status || 1223 === xhr.status) {
            this._onLoad();
          } else {
            this.setTimeoutFn(() => {
              this._onError(typeof xhr.status === "number" ? xhr.status : 0);
            }, 0);
          }
        };
        xhr.send(this._data);
      } catch (e) {
        this.setTimeoutFn(() => {
          this._onError(e);
        }, 0);
        return;
      }
      if (typeof document !== "undefined") {
        this._index = _Request.requestsCount++;
        _Request.requests[this._index] = this;
      }
    }
    /**
     * Called upon error.
     *
     * @private
     */
    _onError(err) {
      this.emitReserved("error", err, this._xhr);
      this._cleanup(true);
    }
    /**
     * Cleans up house.
     *
     * @private
     */
    _cleanup(fromError) {
      if ("undefined" === typeof this._xhr || null === this._xhr) {
        return;
      }
      this._xhr.onreadystatechange = empty;
      if (fromError) {
        try {
          this._xhr.abort();
        } catch (e) {
        }
      }
      if (typeof document !== "undefined") {
        delete _Request.requests[this._index];
      }
      this._xhr = null;
    }
    /**
     * Called upon load.
     *
     * @private
     */
    _onLoad() {
      const data = this._xhr.responseText;
      if (data !== null) {
        this.emitReserved("data", data);
        this.emitReserved("success");
        this._cleanup();
      }
    }
    /**
     * Aborts the request.
     *
     * @package
     */
    abort() {
      this._cleanup();
    }
  };
  Request.requestsCount = 0;
  Request.requests = {};
  if (typeof document !== "undefined") {
    if (typeof attachEvent === "function") {
      attachEvent("onunload", unloadHandler);
    } else if (typeof addEventListener === "function") {
      const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
      addEventListener(terminationEvent, unloadHandler, false);
    }
  }
  function unloadHandler() {
    for (let i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  }
  var hasXHR2 = function() {
    const xhr = newRequest({
      xdomain: false
    });
    return xhr && xhr.responseType !== null;
  }();
  var XHR = class extends BaseXHR {
    constructor(opts) {
      super(opts);
      const forceBase64 = opts && opts.forceBase64;
      this.supportsBinary = hasXHR2 && !forceBase64;
    }
    request(opts = {}) {
      Object.assign(opts, { xd: this.xd }, this.opts);
      return new Request(newRequest, this.uri(), opts);
    }
  };
  function newRequest(opts) {
    const xdomain = opts.xdomain;
    try {
      if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {
    }
    if (!xdomain) {
      try {
        return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
      } catch (e) {
      }
    }
  }

  // node_modules/engine.io-client/build/esm/transports/websocket.js
  var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
  var BaseWS = class extends Transport {
    get name() {
      return "websocket";
    }
    doOpen() {
      const uri = this.uri();
      const protocols = this.opts.protocols;
      const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
      if (this.opts.extraHeaders) {
        opts.headers = this.opts.extraHeaders;
      }
      try {
        this.ws = this.createSocket(uri, protocols, opts);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this.ws.binaryType = this.socket.binaryType;
      this.addEventListeners();
    }
    /**
     * Adds event listeners to the socket
     *
     * @private
     */
    addEventListeners() {
      this.ws.onopen = () => {
        if (this.opts.autoUnref) {
          this.ws._socket.unref();
        }
        this.onOpen();
      };
      this.ws.onclose = (closeEvent) => this.onClose({
        description: "websocket connection closed",
        context: closeEvent
      });
      this.ws.onmessage = (ev) => this.onData(ev.data);
      this.ws.onerror = (e) => this.onError("websocket error", e);
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        encodePacket(packet, this.supportsBinary, (data) => {
          try {
            this.doWrite(packet, data);
          } catch (e) {
          }
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      if (typeof this.ws !== "undefined") {
        this.ws.onerror = () => {
        };
        this.ws.close();
        this.ws = null;
      }
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "wss" : "ws";
      const query = this.query || {};
      if (this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };
  var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
  var WS = class extends BaseWS {
    createSocket(uri, protocols, opts) {
      return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
    }
    doWrite(_packet, data) {
      this.ws.send(data);
    }
  };

  // node_modules/engine.io-client/build/esm/transports/webtransport.js
  var WT = class extends Transport {
    get name() {
      return "webtransport";
    }
    doOpen() {
      try {
        this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this._transport.closed.then(() => {
        this.onClose();
      }).catch((err) => {
        this.onError("webtransport error", err);
      });
      this._transport.ready.then(() => {
        this._transport.createBidirectionalStream().then((stream) => {
          const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
          const reader = stream.readable.pipeThrough(decoderStream).getReader();
          const encoderStream = createPacketEncoderStream();
          encoderStream.readable.pipeTo(stream.writable);
          this._writer = encoderStream.writable.getWriter();
          const read = () => {
            reader.read().then(({ done, value: value2 }) => {
              if (done) {
                return;
              }
              this.onPacket(value2);
              read();
            }).catch((err) => {
            });
          };
          read();
          const packet = { type: "open" };
          if (this.query.sid) {
            packet.data = `{"sid":"${this.query.sid}"}`;
          }
          this._writer.write(packet).then(() => this.onOpen());
        });
      });
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        this._writer.write(packet).then(() => {
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      var _a;
      (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
    }
  };

  // node_modules/engine.io-client/build/esm/transports/index.js
  var transports = {
    websocket: WS,
    webtransport: WT,
    polling: XHR
  };

  // node_modules/engine.io-client/build/esm/contrib/parseuri.js
  var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  var parts = [
    "source",
    "protocol",
    "authority",
    "userInfo",
    "user",
    "password",
    "host",
    "port",
    "relative",
    "path",
    "directory",
    "file",
    "query",
    "anchor"
  ];
  function parse(str) {
    if (str.length > 8e3) {
      throw "URI too long";
    }
    const src = str, b = str.indexOf("["), e = str.indexOf("]");
    if (b != -1 && e != -1) {
      str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
    }
    let m = re.exec(str || ""), uri = {}, i = 14;
    while (i--) {
      uri[parts[i]] = m[i] || "";
    }
    if (b != -1 && e != -1) {
      uri.source = src;
      uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
      uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
      uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri["path"]);
    uri.queryKey = queryKey(uri, uri["query"]);
    return uri;
  }
  function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == "/" || path.length === 0) {
      names.splice(0, 1);
    }
    if (path.slice(-1) == "/") {
      names.splice(names.length - 1, 1);
    }
    return names;
  }
  function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }

  // node_modules/engine.io-client/build/esm/socket.js
  var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
  var OFFLINE_EVENT_LISTENERS = [];
  if (withEventListeners) {
    addEventListener("offline", () => {
      OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
    }, false);
  }
  var SocketWithoutUpgrade = class _SocketWithoutUpgrade extends Emitter {
    /**
     * Socket constructor.
     *
     * @param {String|Object} uri - uri or options
     * @param {Object} opts - options
     */
    constructor(uri, opts) {
      super();
      this.binaryType = defaultBinaryType;
      this.writeBuffer = [];
      this._prevBufferLen = 0;
      this._pingInterval = -1;
      this._pingTimeout = -1;
      this._maxPayload = -1;
      this._pingTimeoutTime = Infinity;
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = null;
      }
      if (uri) {
        const parsedUri = parse(uri);
        opts.hostname = parsedUri.host;
        opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
        opts.port = parsedUri.port;
        if (parsedUri.query)
          opts.query = parsedUri.query;
      } else if (opts.host) {
        opts.hostname = parse(opts.host).host;
      }
      installTimerFunctions(this, opts);
      this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
      if (opts.hostname && !opts.port) {
        opts.port = this.secure ? "443" : "80";
      }
      this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
      this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
      this.transports = [];
      this._transportsByName = {};
      opts.transports.forEach((t) => {
        const transportName = t.prototype.name;
        this.transports.push(transportName);
        this._transportsByName[transportName] = t;
      });
      this.opts = Object.assign({
        path: "/engine.io",
        agent: false,
        withCredentials: false,
        upgrade: true,
        timestampParam: "t",
        rememberUpgrade: false,
        addTrailingSlash: true,
        rejectUnauthorized: true,
        perMessageDeflate: {
          threshold: 1024
        },
        transportOptions: {},
        closeOnBeforeunload: false
      }, opts);
      this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
      if (typeof this.opts.query === "string") {
        this.opts.query = decode2(this.opts.query);
      }
      if (withEventListeners) {
        if (this.opts.closeOnBeforeunload) {
          this._beforeunloadEventListener = () => {
            if (this.transport) {
              this.transport.removeAllListeners();
              this.transport.close();
            }
          };
          addEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this.hostname !== "localhost") {
          this._offlineEventListener = () => {
            this._onClose("transport close", {
              description: "network connection lost"
            });
          };
          OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
        }
      }
      if (this.opts.withCredentials) {
        this._cookieJar = createCookieJar();
      }
      this._open();
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} name - transport name
     * @return {Transport}
     * @private
     */
    createTransport(name) {
      const query = Object.assign({}, this.opts.query);
      query.EIO = protocol;
      query.transport = name;
      if (this.id)
        query.sid = this.id;
      const opts = Object.assign({}, this.opts, {
        query,
        socket: this,
        hostname: this.hostname,
        secure: this.secure,
        port: this.port
      }, this.opts.transportOptions[name]);
      return new this._transportsByName[name](opts);
    }
    /**
     * Initializes transport to use and starts probe.
     *
     * @private
     */
    _open() {
      if (this.transports.length === 0) {
        this.setTimeoutFn(() => {
          this.emitReserved("error", "No transports available");
        }, 0);
        return;
      }
      const transportName = this.opts.rememberUpgrade && _SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
      this.readyState = "opening";
      const transport = this.createTransport(transportName);
      transport.open();
      this.setTransport(transport);
    }
    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @private
     */
    setTransport(transport) {
      if (this.transport) {
        this.transport.removeAllListeners();
      }
      this.transport = transport;
      transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
    }
    /**
     * Called when connection is deemed open.
     *
     * @private
     */
    onOpen() {
      this.readyState = "open";
      _SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
      this.emitReserved("open");
      this.flush();
    }
    /**
     * Handles a packet.
     *
     * @private
     */
    _onPacket(packet) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.emitReserved("packet", packet);
        this.emitReserved("heartbeat");
        switch (packet.type) {
          case "open":
            this.onHandshake(JSON.parse(packet.data));
            break;
          case "ping":
            this._sendPacket("pong");
            this.emitReserved("ping");
            this.emitReserved("pong");
            this._resetPingTimeout();
            break;
          case "error":
            const err = new Error("server error");
            err.code = packet.data;
            this._onError(err);
            break;
          case "message":
            this.emitReserved("data", packet.data);
            this.emitReserved("message", packet.data);
            break;
        }
      } else {
      }
    }
    /**
     * Called upon handshake completion.
     *
     * @param {Object} data - handshake obj
     * @private
     */
    onHandshake(data) {
      this.emitReserved("handshake", data);
      this.id = data.sid;
      this.transport.query.sid = data.sid;
      this._pingInterval = data.pingInterval;
      this._pingTimeout = data.pingTimeout;
      this._maxPayload = data.maxPayload;
      this.onOpen();
      if ("closed" === this.readyState)
        return;
      this._resetPingTimeout();
    }
    /**
     * Sets and resets ping timeout timer based on server pings.
     *
     * @private
     */
    _resetPingTimeout() {
      this.clearTimeoutFn(this._pingTimeoutTimer);
      const delay = this._pingInterval + this._pingTimeout;
      this._pingTimeoutTime = Date.now() + delay;
      this._pingTimeoutTimer = this.setTimeoutFn(() => {
        this._onClose("ping timeout");
      }, delay);
      if (this.opts.autoUnref) {
        this._pingTimeoutTimer.unref();
      }
    }
    /**
     * Called on `drain` event
     *
     * @private
     */
    _onDrain() {
      this.writeBuffer.splice(0, this._prevBufferLen);
      this._prevBufferLen = 0;
      if (0 === this.writeBuffer.length) {
        this.emitReserved("drain");
      } else {
        this.flush();
      }
    }
    /**
     * Flush write buffers.
     *
     * @private
     */
    flush() {
      if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
        const packets = this._getWritablePackets();
        this.transport.send(packets);
        this._prevBufferLen = packets.length;
        this.emitReserved("flush");
      }
    }
    /**
     * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
     * long-polling)
     *
     * @private
     */
    _getWritablePackets() {
      const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
      if (!shouldCheckPayloadSize) {
        return this.writeBuffer;
      }
      let payloadSize = 1;
      for (let i = 0; i < this.writeBuffer.length; i++) {
        const data = this.writeBuffer[i].data;
        if (data) {
          payloadSize += byteLength(data);
        }
        if (i > 0 && payloadSize > this._maxPayload) {
          return this.writeBuffer.slice(0, i);
        }
        payloadSize += 2;
      }
      return this.writeBuffer;
    }
    /**
     * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
     *
     * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
     * `write()` method then the message would not be buffered by the Socket.IO client.
     *
     * @return {boolean}
     * @private
     */
    /* private */
    _hasPingExpired() {
      if (!this._pingTimeoutTime)
        return true;
      const hasExpired = Date.now() > this._pingTimeoutTime;
      if (hasExpired) {
        this._pingTimeoutTime = 0;
        nextTick(() => {
          this._onClose("ping timeout");
        }, this.setTimeoutFn);
      }
      return hasExpired;
    }
    /**
     * Sends a message.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    write(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a message. Alias of {@link Socket#write}.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    send(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a packet.
     *
     * @param {String} type: packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @private
     */
    _sendPacket(type, data, options, fn) {
      if ("function" === typeof data) {
        fn = data;
        data = void 0;
      }
      if ("function" === typeof options) {
        fn = options;
        options = null;
      }
      if ("closing" === this.readyState || "closed" === this.readyState) {
        return;
      }
      options = options || {};
      options.compress = false !== options.compress;
      const packet = {
        type,
        data,
        options
      };
      this.emitReserved("packetCreate", packet);
      this.writeBuffer.push(packet);
      if (fn)
        this.once("flush", fn);
      this.flush();
    }
    /**
     * Closes the connection.
     */
    close() {
      const close = () => {
        this._onClose("forced close");
        this.transport.close();
      };
      const cleanupAndClose = () => {
        this.off("upgrade", cleanupAndClose);
        this.off("upgradeError", cleanupAndClose);
        close();
      };
      const waitForUpgrade = () => {
        this.once("upgrade", cleanupAndClose);
        this.once("upgradeError", cleanupAndClose);
      };
      if ("opening" === this.readyState || "open" === this.readyState) {
        this.readyState = "closing";
        if (this.writeBuffer.length) {
          this.once("drain", () => {
            if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          });
        } else if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      }
      return this;
    }
    /**
     * Called upon transport error
     *
     * @private
     */
    _onError(err) {
      _SocketWithoutUpgrade.priorWebsocketSuccess = false;
      if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
        this.transports.shift();
        return this._open();
      }
      this.emitReserved("error", err);
      this._onClose("transport error", err);
    }
    /**
     * Called upon transport close.
     *
     * @private
     */
    _onClose(reason, description) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.clearTimeoutFn(this._pingTimeoutTimer);
        this.transport.removeAllListeners("close");
        this.transport.close();
        this.transport.removeAllListeners();
        if (withEventListeners) {
          if (this._beforeunloadEventListener) {
            removeEventListener("beforeunload", this._beforeunloadEventListener, false);
          }
          if (this._offlineEventListener) {
            const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
            if (i !== -1) {
              OFFLINE_EVENT_LISTENERS.splice(i, 1);
            }
          }
        }
        this.readyState = "closed";
        this.id = null;
        this.emitReserved("close", reason, description);
        this.writeBuffer = [];
        this._prevBufferLen = 0;
      }
    }
  };
  SocketWithoutUpgrade.protocol = protocol;
  var SocketWithUpgrade = class extends SocketWithoutUpgrade {
    constructor() {
      super(...arguments);
      this._upgrades = [];
    }
    onOpen() {
      super.onOpen();
      if ("open" === this.readyState && this.opts.upgrade) {
        for (let i = 0; i < this._upgrades.length; i++) {
          this._probe(this._upgrades[i]);
        }
      }
    }
    /**
     * Probes a transport.
     *
     * @param {String} name - transport name
     * @private
     */
    _probe(name) {
      let transport = this.createTransport(name);
      let failed = false;
      SocketWithoutUpgrade.priorWebsocketSuccess = false;
      const onTransportOpen = () => {
        if (failed)
          return;
        transport.send([{ type: "ping", data: "probe" }]);
        transport.once("packet", (msg) => {
          if (failed)
            return;
          if ("pong" === msg.type && "probe" === msg.data) {
            this.upgrading = true;
            this.emitReserved("upgrading", transport);
            if (!transport)
              return;
            SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
            this.transport.pause(() => {
              if (failed)
                return;
              if ("closed" === this.readyState)
                return;
              cleanup2();
              this.setTransport(transport);
              transport.send([{ type: "upgrade" }]);
              this.emitReserved("upgrade", transport);
              transport = null;
              this.upgrading = false;
              this.flush();
            });
          } else {
            const err = new Error("probe error");
            err.transport = transport.name;
            this.emitReserved("upgradeError", err);
          }
        });
      };
      function freezeTransport() {
        if (failed)
          return;
        failed = true;
        cleanup2();
        transport.close();
        transport = null;
      }
      const onerror = (err) => {
        const error = new Error("probe error: " + err);
        error.transport = transport.name;
        freezeTransport();
        this.emitReserved("upgradeError", error);
      };
      function onTransportClose() {
        onerror("transport closed");
      }
      function onclose() {
        onerror("socket closed");
      }
      function onupgrade(to) {
        if (transport && to.name !== transport.name) {
          freezeTransport();
        }
      }
      const cleanup2 = () => {
        transport.removeListener("open", onTransportOpen);
        transport.removeListener("error", onerror);
        transport.removeListener("close", onTransportClose);
        this.off("close", onclose);
        this.off("upgrading", onupgrade);
      };
      transport.once("open", onTransportOpen);
      transport.once("error", onerror);
      transport.once("close", onTransportClose);
      this.once("close", onclose);
      this.once("upgrading", onupgrade);
      if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
        this.setTimeoutFn(() => {
          if (!failed) {
            transport.open();
          }
        }, 200);
      } else {
        transport.open();
      }
    }
    onHandshake(data) {
      this._upgrades = this._filterUpgrades(data.upgrades);
      super.onHandshake(data);
    }
    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} upgrades - server upgrades
     * @private
     */
    _filterUpgrades(upgrades) {
      const filteredUpgrades = [];
      for (let i = 0; i < upgrades.length; i++) {
        if (~this.transports.indexOf(upgrades[i]))
          filteredUpgrades.push(upgrades[i]);
      }
      return filteredUpgrades;
    }
  };
  var Socket = class extends SocketWithUpgrade {
    constructor(uri, opts = {}) {
      const o = typeof uri === "object" ? uri : opts;
      if (!o.transports || o.transports && typeof o.transports[0] === "string") {
        o.transports = (o.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t) => !!t);
      }
      super(uri, o);
    }
  };

  // node_modules/engine.io-client/build/esm/index.js
  var protocol2 = Socket.protocol;

  // node_modules/socket.io-client/build/esm/url.js
  function url(uri, path = "", loc) {
    let obj = uri;
    loc = loc || typeof location !== "undefined" && location;
    if (null == uri)
      uri = loc.protocol + "//" + loc.host;
    if (typeof uri === "string") {
      if ("/" === uri.charAt(0)) {
        if ("/" === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }
      if (!/^(https?|wss?):\/\//.test(uri)) {
        if ("undefined" !== typeof loc) {
          uri = loc.protocol + "//" + uri;
        } else {
          uri = "https://" + uri;
        }
      }
      obj = parse(uri);
    }
    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = "80";
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = "443";
      }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    Decoder: () => Decoder,
    Encoder: () => Encoder,
    PacketType: () => PacketType,
    isPacketValid: () => isPacketValid,
    protocol: () => protocol3
  });

  // node_modules/socket.io-parser/build/esm/is-binary.js
  var withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
  var isView2 = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  var toString = Object.prototype.toString;
  var withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
  var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
  function isBinary(obj) {
    return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
  }
  function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
      return false;
    }
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        if (hasBinary(obj[i])) {
          return true;
        }
      }
      return false;
    }
    if (isBinary(obj)) {
      return true;
    }
    if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }
    return false;
  }

  // node_modules/socket.io-parser/build/esm/binary.js
  function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length;
    return { packet: pack, buffers };
  }
  function _deconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (isBinary(data)) {
      const placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (Array.isArray(data)) {
      const newData = new Array(data.length);
      for (let i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i], buffers);
      }
      return newData;
    } else if (typeof data === "object" && !(data instanceof Date)) {
      const newData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
      }
      return newData;
    }
    return data;
  }
  function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments;
    return packet;
  }
  function _reconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (data && data._placeholder === true) {
      const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
      if (isIndexValid) {
        return buffers[data.num];
      } else {
        throw new Error("illegal attachments");
      }
    } else if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i], buffers);
      }
    } else if (typeof data === "object") {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }
    }
    return data;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var RESERVED_EVENTS = [
    "connect",
    // used on the client side
    "connect_error",
    // used on the client side
    "disconnect",
    // used on both sides
    "disconnecting",
    // used on the server side
    "newListener",
    // used by the Node.js EventEmitter
    "removeListener"
    // used by the Node.js EventEmitter
  ];
  var protocol3 = 5;
  var PacketType;
  (function(PacketType2) {
    PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
    PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
    PacketType2[PacketType2["ACK"] = 3] = "ACK";
    PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
  })(PacketType || (PacketType = {}));
  var Encoder = class {
    /**
     * Encoder constructor
     *
     * @param {function} replacer - custom replacer to pass down to JSON.parse
     */
    constructor(replacer) {
      this.replacer = replacer;
    }
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
      if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
        if (hasBinary(obj)) {
          return this.encodeAsBinary({
            type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
            nsp: obj.nsp,
            data: obj.data,
            id: obj.id
          });
        }
      }
      return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
      let str = "" + obj.type;
      if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
        str += obj.attachments + "-";
      }
      if (obj.nsp && "/" !== obj.nsp) {
        str += obj.nsp + ",";
      }
      if (null != obj.id) {
        str += obj.id;
      }
      if (null != obj.data) {
        str += JSON.stringify(obj.data, this.replacer);
      }
      return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
      const deconstruction = deconstructPacket(obj);
      const pack = this.encodeAsString(deconstruction.packet);
      const buffers = deconstruction.buffers;
      buffers.unshift(pack);
      return buffers;
    }
  };
  var Decoder = class _Decoder extends Emitter {
    /**
     * Decoder constructor
     */
    constructor(opts) {
      super();
      this.opts = Object.assign({
        reviver: void 0,
        maxAttachments: 10
      }, typeof opts === "function" ? { reviver: opts } : opts);
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
      let packet;
      if (typeof obj === "string") {
        if (this.reconstructor) {
          throw new Error("got plaintext data when reconstructing a packet");
        }
        packet = this.decodeString(obj);
        const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
        if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
          packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
          this.reconstructor = new BinaryReconstructor(packet);
          if (packet.attachments === 0) {
            super.emitReserved("decoded", packet);
          }
        } else {
          super.emitReserved("decoded", packet);
        }
      } else if (isBinary(obj) || obj.base64) {
        if (!this.reconstructor) {
          throw new Error("got binary data when not reconstructing a packet");
        } else {
          packet = this.reconstructor.takeBinaryData(obj);
          if (packet) {
            this.reconstructor = null;
            super.emitReserved("decoded", packet);
          }
        }
      } else {
        throw new Error("Unknown type: " + obj);
      }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
      let i = 0;
      const p = {
        type: Number(str.charAt(0))
      };
      if (PacketType[p.type] === void 0) {
        throw new Error("unknown packet type " + p.type);
      }
      if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
        const start = i + 1;
        while (str.charAt(++i) !== "-" && i != str.length) {
        }
        const buf = str.substring(start, i);
        if (buf != Number(buf) || str.charAt(i) !== "-") {
          throw new Error("Illegal attachments");
        }
        const n = Number(buf);
        if (!isInteger(n) || n < 0) {
          throw new Error("Illegal attachments");
        } else if (n > this.opts.maxAttachments) {
          throw new Error("too many attachments");
        }
        p.attachments = n;
      }
      if ("/" === str.charAt(i + 1)) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if ("," === c)
            break;
          if (i === str.length)
            break;
        }
        p.nsp = str.substring(start, i);
      } else {
        p.nsp = "/";
      }
      const next = str.charAt(i + 1);
      if ("" !== next && Number(next) == next) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if (null == c || Number(c) != c) {
            --i;
            break;
          }
          if (i === str.length)
            break;
        }
        p.id = Number(str.substring(start, i + 1));
      }
      if (str.charAt(++i)) {
        const payload = this.tryParse(str.substr(i));
        if (_Decoder.isPayloadValid(p.type, payload)) {
          p.data = payload;
        } else {
          throw new Error("invalid payload");
        }
      }
      return p;
    }
    tryParse(str) {
      try {
        return JSON.parse(str, this.opts.reviver);
      } catch (e) {
        return false;
      }
    }
    static isPayloadValid(type, payload) {
      switch (type) {
        case PacketType.CONNECT:
          return isObject(payload);
        case PacketType.DISCONNECT:
          return payload === void 0;
        case PacketType.CONNECT_ERROR:
          return typeof payload === "string" || isObject(payload);
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          return Array.isArray(payload);
      }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
      if (this.reconstructor) {
        this.reconstructor.finishedReconstruction();
        this.reconstructor = null;
      }
    }
  };
  var BinaryReconstructor = class {
    constructor(packet) {
      this.packet = packet;
      this.buffers = [];
      this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
      this.buffers.push(binData);
      if (this.buffers.length === this.reconPack.attachments) {
        const packet = reconstructPacket(this.reconPack, this.buffers);
        this.finishedReconstruction();
        return packet;
      }
      return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
      this.reconPack = null;
      this.buffers = [];
    }
  };
  function isNamespaceValid(nsp) {
    return typeof nsp === "string";
  }
  var isInteger = Number.isInteger || function(value2) {
    return typeof value2 === "number" && isFinite(value2) && Math.floor(value2) === value2;
  };
  function isAckIdValid(id) {
    return id === void 0 || isInteger(id);
  }
  function isObject(value2) {
    return Object.prototype.toString.call(value2) === "[object Object]";
  }
  function isDataValid(type, payload) {
    switch (type) {
      case PacketType.CONNECT:
        return payload === void 0 || isObject(payload);
      case PacketType.DISCONNECT:
        return payload === void 0;
      case PacketType.EVENT:
        return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
      case PacketType.ACK:
        return Array.isArray(payload);
      case PacketType.CONNECT_ERROR:
        return typeof payload === "string" || isObject(payload);
      default:
        return false;
    }
  }
  function isPacketValid(packet) {
    return isNamespaceValid(packet.nsp) && isAckIdValid(packet.id) && isDataValid(packet.type, packet.data);
  }

  // node_modules/socket.io-client/build/esm/on.js
  function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
      obj.off(ev, fn);
    };
  }

  // node_modules/socket.io-client/build/esm/socket.js
  var RESERVED_EVENTS2 = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1
  });
  var Socket2 = class extends Emitter {
    /**
     * `Socket` constructor.
     */
    constructor(io, nsp, opts) {
      super();
      this.connected = false;
      this.recovered = false;
      this.receiveBuffer = [];
      this.sendBuffer = [];
      this._queue = [];
      this._queueSeq = 0;
      this.ids = 0;
      this.acks = {};
      this.flags = {};
      this.io = io;
      this.nsp = nsp;
      if (opts && opts.auth) {
        this.auth = opts.auth;
      }
      this._opts = Object.assign({}, opts);
      if (this.io._autoConnect)
        this.open();
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */
    get disconnected() {
      return !this.connected;
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
      if (this.subs)
        return;
      const io = this.io;
      this.subs = [
        on(io, "open", this.onopen.bind(this)),
        on(io, "packet", this.onpacket.bind(this)),
        on(io, "error", this.onerror.bind(this)),
        on(io, "close", this.onclose.bind(this))
      ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects.
     *
     * @example
     * const socket = io();
     *
     * console.log(socket.active); // true
     *
     * socket.on("disconnect", (reason) => {
     *   if (reason === "io server disconnect") {
     *     // the disconnection was initiated by the server, you need to manually reconnect
     *     console.log(socket.active); // false
     *   }
     *   // else the socket will automatically try to reconnect
     *   console.log(socket.active); // true
     * });
     */
    get active() {
      return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @example
     * const socket = io({
     *   autoConnect: false
     * });
     *
     * socket.connect();
     */
    connect() {
      if (this.connected)
        return this;
      this.subEvents();
      if (!this.io["_reconnecting"])
        this.io.open();
      if ("open" === this.io._readyState)
        this.onopen();
      return this;
    }
    /**
     * Alias for {@link connect()}.
     */
    open() {
      return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * This method mimics the WebSocket.send() method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
     *
     * @example
     * socket.send("hello");
     *
     * // this is equivalent to
     * socket.emit("message", "hello");
     *
     * @return self
     */
    send(...args) {
      args.unshift("message");
      this.emit.apply(this, args);
      return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @example
     * socket.emit("hello", "world");
     *
     * // all serializable datastructures are supported (no need to call JSON.stringify)
     * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
     *
     * // with an acknowledgement from the server
     * socket.emit("hello", "world", (val) => {
     *   // ...
     * });
     *
     * @return self
     */
    emit(ev, ...args) {
      var _a, _b, _c;
      if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
        throw new Error('"' + ev.toString() + '" is a reserved event name');
      }
      args.unshift(ev);
      if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
        this._addToQueue(args);
        return this;
      }
      const packet = {
        type: PacketType.EVENT,
        data: args
      };
      packet.options = {};
      packet.options.compress = this.flags.compress !== false;
      if ("function" === typeof args[args.length - 1]) {
        const id = this.ids++;
        const ack = args.pop();
        this._registerAckCallback(id, ack);
        packet.id = id;
      }
      const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
      const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
      const discardPacket = this.flags.volatile && !isTransportWritable;
      if (discardPacket) {
      } else if (isConnected) {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      } else {
        this.sendBuffer.push(packet);
      }
      this.flags = {};
      return this;
    }
    /**
     * @private
     */
    _registerAckCallback(id, ack) {
      var _a;
      const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
      if (timeout === void 0) {
        this.acks[id] = ack;
        return;
      }
      const timer = this.io.setTimeoutFn(() => {
        delete this.acks[id];
        for (let i = 0; i < this.sendBuffer.length; i++) {
          if (this.sendBuffer[i].id === id) {
            this.sendBuffer.splice(i, 1);
          }
        }
        ack.call(this, new Error("operation has timed out"));
      }, timeout);
      const fn = (...args) => {
        this.io.clearTimeoutFn(timer);
        ack.apply(this, args);
      };
      fn.withError = true;
      this.acks[id] = fn;
    }
    /**
     * Emits an event and waits for an acknowledgement
     *
     * @example
     * // without timeout
     * const response = await socket.emitWithAck("hello", "world");
     *
     * // with a specific timeout
     * try {
     *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
     * } catch (err) {
     *   // the server did not acknowledge the event in the given delay
     * }
     *
     * @return a Promise that will be fulfilled when the server acknowledges the event
     */
    emitWithAck(ev, ...args) {
      return new Promise((resolve, reject) => {
        const fn = (arg1, arg2) => {
          return arg1 ? reject(arg1) : resolve(arg2);
        };
        fn.withError = true;
        args.push(fn);
        this.emit(ev, ...args);
      });
    }
    /**
     * Add the packet to the queue.
     * @param args
     * @private
     */
    _addToQueue(args) {
      let ack;
      if (typeof args[args.length - 1] === "function") {
        ack = args.pop();
      }
      const packet = {
        id: this._queueSeq++,
        tryCount: 0,
        pending: false,
        args,
        flags: Object.assign({ fromQueue: true }, this.flags)
      };
      args.push((err, ...responseArgs) => {
        if (packet !== this._queue[0]) {
        }
        const hasError = err !== null;
        if (hasError) {
          if (packet.tryCount > this._opts.retries) {
            this._queue.shift();
            if (ack) {
              ack(err);
            }
          }
        } else {
          this._queue.shift();
          if (ack) {
            ack(null, ...responseArgs);
          }
        }
        packet.pending = false;
        return this._drainQueue();
      });
      this._queue.push(packet);
      this._drainQueue();
    }
    /**
     * Send the first packet of the queue, and wait for an acknowledgement from the server.
     * @param force - whether to resend a packet that has not been acknowledged yet
     *
     * @private
     */
    _drainQueue(force = false) {
      if (!this.connected || this._queue.length === 0) {
        return;
      }
      const packet = this._queue[0];
      if (packet.pending && !force) {
        return;
      }
      packet.pending = true;
      packet.tryCount++;
      this.flags = packet.flags;
      this.emit.apply(this, packet.args);
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
      packet.nsp = this.nsp;
      this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
      if (typeof this.auth == "function") {
        this.auth((data) => {
          this._sendConnectPacket(data);
        });
      } else {
        this._sendConnectPacket(this.auth);
      }
    }
    /**
     * Sends a CONNECT packet to initiate the Socket.IO session.
     *
     * @param data
     * @private
     */
    _sendConnectPacket(data) {
      this.packet({
        type: PacketType.CONNECT,
        data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
      });
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
      if (!this.connected) {
        this.emitReserved("connect_error", err);
      }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @param description
     * @private
     */
    onclose(reason, description) {
      this.connected = false;
      delete this.id;
      this.emitReserved("disconnect", reason, description);
      this._clearAcks();
    }
    /**
     * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
     * the server.
     *
     * @private
     */
    _clearAcks() {
      Object.keys(this.acks).forEach((id) => {
        const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
        if (!isBuffered) {
          const ack = this.acks[id];
          delete this.acks[id];
          if (ack.withError) {
            ack.call(this, new Error("socket has been disconnected"));
          }
        }
      });
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
      const sameNamespace = packet.nsp === this.nsp;
      if (!sameNamespace)
        return;
      switch (packet.type) {
        case PacketType.CONNECT:
          if (packet.data && packet.data.sid) {
            this.onconnect(packet.data.sid, packet.data.pid);
          } else {
            this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          }
          break;
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          this.onevent(packet);
          break;
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          this.onack(packet);
          break;
        case PacketType.DISCONNECT:
          this.ondisconnect();
          break;
        case PacketType.CONNECT_ERROR:
          this.destroy();
          const err = new Error(packet.data.message);
          err.data = packet.data.data;
          this.emitReserved("connect_error", err);
          break;
      }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
      const args = packet.data || [];
      if (null != packet.id) {
        args.push(this.ack(packet.id));
      }
      if (this.connected) {
        this.emitEvent(args);
      } else {
        this.receiveBuffer.push(Object.freeze(args));
      }
    }
    emitEvent(args) {
      if (this._anyListeners && this._anyListeners.length) {
        const listeners = this._anyListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, args);
        }
      }
      super.emit.apply(this, args);
      if (this._pid && args.length && typeof args[args.length - 1] === "string") {
        this._lastOffset = args[args.length - 1];
      }
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
      const self2 = this;
      let sent = false;
      return function(...args) {
        if (sent)
          return;
        sent = true;
        self2.packet({
          type: PacketType.ACK,
          id,
          data: args
        });
      };
    }
    /**
     * Called upon a server acknowledgement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
      const ack = this.acks[packet.id];
      if (typeof ack !== "function") {
        return;
      }
      delete this.acks[packet.id];
      if (ack.withError) {
        packet.data.unshift(null);
      }
      ack.apply(this, packet.data);
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id, pid) {
      this.id = id;
      this.recovered = pid && this._pid === pid;
      this._pid = pid;
      this.connected = true;
      this.emitBuffered();
      this._drainQueue(true);
      this.emitReserved("connect");
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
      this.receiveBuffer.forEach((args) => this.emitEvent(args));
      this.receiveBuffer = [];
      this.sendBuffer.forEach((packet) => {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      });
      this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
      this.destroy();
      this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
      if (this.subs) {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs = void 0;
      }
      this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually. In that case, the socket will not try to reconnect.
     *
     * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
     *
     * @example
     * const socket = io();
     *
     * socket.on("disconnect", (reason) => {
     *   // console.log(reason); prints "io client disconnect"
     * });
     *
     * socket.disconnect();
     *
     * @return self
     */
    disconnect() {
      if (this.connected) {
        this.packet({ type: PacketType.DISCONNECT });
      }
      this.destroy();
      if (this.connected) {
        this.onclose("io client disconnect");
      }
      return this;
    }
    /**
     * Alias for {@link disconnect()}.
     *
     * @return self
     */
    close() {
      return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @example
     * socket.compress(false).emit("hello");
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     */
    compress(compress) {
      this.flags.compress = compress;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @example
     * socket.volatile.emit("hello"); // the server may or may not receive it
     *
     * @returns self
     */
    get volatile() {
      this.flags.volatile = true;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
     * given number of milliseconds have elapsed without an acknowledgement from the server:
     *
     * @example
     * socket.timeout(5000).emit("my-event", (err) => {
     *   if (err) {
     *     // the server did not acknowledge the event in the given delay
     *   }
     * });
     *
     * @returns self
     */
    timeout(timeout) {
      this.flags.timeout = timeout;
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @example
     * socket.onAny((event, ...args) => {
     *   console.log(`got ${event}`);
     * });
     *
     * @param listener
     */
    onAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @example
     * socket.prependAny((event, ...args) => {
     *   console.log(`got event ${event}`);
     * });
     *
     * @param listener
     */
    prependAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`got event ${event}`);
     * }
     *
     * socket.onAny(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAny(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAny();
     *
     * @param listener
     */
    offAny(listener) {
      if (!this._anyListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAny() {
      return this._anyListeners || [];
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.onAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    onAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.prependAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    prependAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`sent event ${event}`);
     * }
     *
     * socket.onAnyOutgoing(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAnyOutgoing(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAnyOutgoing();
     *
     * @param [listener] - the catch-all listener (optional)
     */
    offAnyOutgoing(listener) {
      if (!this._anyOutgoingListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyOutgoingListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyOutgoingListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAnyOutgoing() {
      return this._anyOutgoingListeners || [];
    }
    /**
     * Notify the listeners for each packet sent
     *
     * @param packet
     *
     * @private
     */
    notifyOutgoingListeners(packet) {
      if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
        const listeners = this._anyOutgoingListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, packet.data);
        }
      }
    }
  };

  // node_modules/socket.io-client/build/esm/contrib/backo2.js
  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 1e4;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  Backoff.prototype.duration = function() {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
      var rand = Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
  };
  Backoff.prototype.reset = function() {
    this.attempts = 0;
  };
  Backoff.prototype.setMin = function(min) {
    this.ms = min;
  };
  Backoff.prototype.setMax = function(max) {
    this.max = max;
  };
  Backoff.prototype.setJitter = function(jitter) {
    this.jitter = jitter;
  };

  // node_modules/socket.io-client/build/esm/manager.js
  var Manager = class extends Emitter {
    constructor(uri, opts) {
      var _a;
      super();
      this.nsps = {};
      this.subs = [];
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = void 0;
      }
      opts = opts || {};
      opts.path = opts.path || "/socket.io";
      this.opts = opts;
      installTimerFunctions(this, opts);
      this.reconnection(opts.reconnection !== false);
      this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
      this.reconnectionDelay(opts.reconnectionDelay || 1e3);
      this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
      this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
      this.backoff = new Backoff({
        min: this.reconnectionDelay(),
        max: this.reconnectionDelayMax(),
        jitter: this.randomizationFactor()
      });
      this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
      this._readyState = "closed";
      this.uri = uri;
      const _parser = opts.parser || esm_exports;
      this.encoder = new _parser.Encoder();
      this.decoder = new _parser.Decoder();
      this._autoConnect = opts.autoConnect !== false;
      if (this._autoConnect)
        this.open();
    }
    reconnection(v) {
      if (!arguments.length)
        return this._reconnection;
      this._reconnection = !!v;
      if (!v) {
        this.skipReconnect = true;
      }
      return this;
    }
    reconnectionAttempts(v) {
      if (v === void 0)
        return this._reconnectionAttempts;
      this._reconnectionAttempts = v;
      return this;
    }
    reconnectionDelay(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelay;
      this._reconnectionDelay = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
      return this;
    }
    randomizationFactor(v) {
      var _a;
      if (v === void 0)
        return this._randomizationFactor;
      this._randomizationFactor = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
      return this;
    }
    reconnectionDelayMax(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelayMax;
      this._reconnectionDelayMax = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
      return this;
    }
    timeout(v) {
      if (!arguments.length)
        return this._timeout;
      this._timeout = v;
      return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
      if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
        this.reconnect();
      }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
      if (~this._readyState.indexOf("open"))
        return this;
      this.engine = new Socket(this.uri, this.opts);
      const socket = this.engine;
      const self2 = this;
      this._readyState = "opening";
      this.skipReconnect = false;
      const openSubDestroy = on(socket, "open", function() {
        self2.onopen();
        fn && fn();
      });
      const onError = (err) => {
        this.cleanup();
        this._readyState = "closed";
        this.emitReserved("error", err);
        if (fn) {
          fn(err);
        } else {
          this.maybeReconnectOnOpen();
        }
      };
      const errorSub = on(socket, "error", onError);
      if (false !== this._timeout) {
        const timeout = this._timeout;
        const timer = this.setTimeoutFn(() => {
          openSubDestroy();
          onError(new Error("timeout"));
          socket.close();
        }, timeout);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
      this.subs.push(openSubDestroy);
      this.subs.push(errorSub);
      return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
      return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
      this.cleanup();
      this._readyState = "open";
      this.emitReserved("open");
      const socket = this.engine;
      this.subs.push(
        on(socket, "ping", this.onping.bind(this)),
        on(socket, "data", this.ondata.bind(this)),
        on(socket, "error", this.onerror.bind(this)),
        on(socket, "close", this.onclose.bind(this)),
        // @ts-ignore
        on(this.decoder, "decoded", this.ondecoded.bind(this))
      );
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
      this.emitReserved("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
      try {
        this.decoder.add(data);
      } catch (e) {
        this.onclose("parse error", e);
      }
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
      nextTick(() => {
        this.emitReserved("packet", packet);
      }, this.setTimeoutFn);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
      this.emitReserved("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
      let socket = this.nsps[nsp];
      if (!socket) {
        socket = new Socket2(this, nsp, opts);
        this.nsps[nsp] = socket;
      } else if (this._autoConnect && !socket.active) {
        socket.connect();
      }
      return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
      const nsps = Object.keys(this.nsps);
      for (const nsp of nsps) {
        const socket2 = this.nsps[nsp];
        if (socket2.active) {
          return;
        }
      }
      this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
      const encodedPackets = this.encoder.encode(packet);
      for (let i = 0; i < encodedPackets.length; i++) {
        this.engine.write(encodedPackets[i], packet.options);
      }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
      this.subs.forEach((subDestroy) => subDestroy());
      this.subs.length = 0;
      this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
      this.skipReconnect = true;
      this._reconnecting = false;
      this.onclose("forced close");
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
      return this._close();
    }
    /**
     * Called when:
     *
     * - the low-level engine is closed
     * - the parser encountered a badly formatted packet
     * - all sockets are disconnected
     *
     * @private
     */
    onclose(reason, description) {
      var _a;
      this.cleanup();
      (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
      this.backoff.reset();
      this._readyState = "closed";
      this.emitReserved("close", reason, description);
      if (this._reconnection && !this.skipReconnect) {
        this.reconnect();
      }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
      if (this._reconnecting || this.skipReconnect)
        return this;
      const self2 = this;
      if (this.backoff.attempts >= this._reconnectionAttempts) {
        this.backoff.reset();
        this.emitReserved("reconnect_failed");
        this._reconnecting = false;
      } else {
        const delay = this.backoff.duration();
        this._reconnecting = true;
        const timer = this.setTimeoutFn(() => {
          if (self2.skipReconnect)
            return;
          this.emitReserved("reconnect_attempt", self2.backoff.attempts);
          if (self2.skipReconnect)
            return;
          self2.open((err) => {
            if (err) {
              self2._reconnecting = false;
              self2.reconnect();
              this.emitReserved("reconnect_error", err);
            } else {
              self2.onreconnect();
            }
          });
        }, delay);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
      const attempt = this.backoff.attempts;
      this._reconnecting = false;
      this.backoff.reset();
      this.emitReserved("reconnect", attempt);
    }
  };

  // node_modules/socket.io-client/build/esm/index.js
  var cache = {};
  function lookup2(uri, opts) {
    if (typeof uri === "object") {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    const parsed = url(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
    let io;
    if (newConnection) {
      io = new Manager(source, opts);
    } else {
      if (!cache[id]) {
        cache[id] = new Manager(source, opts);
      }
      io = cache[id];
    }
    if (parsed.query && !opts.query) {
      opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
  }
  Object.assign(lookup2, {
    Manager,
    Socket: Socket2,
    io: lookup2,
    connect: lookup2
  });

  // public/js/signaling.js
  function request(socket, event, data) {
    return new Promise((resolve, reject) => {
      const args = data !== void 0 ? [event, data] : [event];
      args.push((res) => {
        if (res && res.error) reject(new Error(res.error));
        else resolve(res);
      });
      socket.emit(...args);
    });
  }
  var Signaling = class {
    constructor() {
      this.socket = lookup2();
    }
    /* ── Room management ── */
    async createRoom() {
      const res = await request(this.socket, "create-room");
      return res.roomId;
    }
    async joinRoom(roomId2) {
      return request(this.socket, "join-room", roomId2);
    }
    leaveRoom() {
      this.socket.emit("leave-room");
    }
    /* ── mediasoup signaling ── */
    async getRtpCapabilities() {
      const res = await request(this.socket, "get-rtp-capabilities");
      return res.rtpCapabilities;
    }
    createSendTransport() {
      return request(this.socket, "create-send-transport");
    }
    createRecvTransport() {
      return request(this.socket, "create-recv-transport");
    }
    connectTransport(transportId, dtlsParameters) {
      return request(this.socket, "connect-transport", { transportId, dtlsParameters });
    }
    async produce(kind, rtpParameters, appData) {
      const res = await request(this.socket, "produce", { kind, rtpParameters, appData });
      return res.producerId;
    }
    consume(producerId, rtpCapabilities) {
      return request(this.socket, "consume", { producerId, rtpCapabilities });
    }
    resumeConsumer(consumerId) {
      return request(this.socket, "resume-consumer", { consumerId });
    }
    closeProducer(producerId) {
      return request(this.socket, "close-producer", { producerId });
    }
    /* ── Event listeners ── */
    onPeerJoined(cb) {
      this.socket.on("peer-joined", cb);
    }
    onPeerLeft(cb) {
      this.socket.on("peer-left", cb);
    }
    onNewProducer(cb) {
      this.socket.on("new-producer", cb);
    }
    onProducerClosed(cb) {
      this.socket.on("producer-closed", cb);
    }
    get id() {
      return this.socket.id;
    }
    disconnect() {
      this.socket.disconnect();
    }
  };

  // public/js/sfu-client.js
  var import_mediasoup_client = __toESM(require_lib5(), 1);
  var SfuClient = class {
    /**
     * @param {import('./signaling.js').Signaling} signaling
     */
    constructor(signaling2) {
      this.signaling = signaling2;
      this.device = new import_mediasoup_client.Device();
      this.sendTransport = null;
      this.recvTransport = null;
      this.producers = /* @__PURE__ */ new Map();
      this.consumers = /* @__PURE__ */ new Map();
      this.onRemoteTrack = null;
      this.onRemoteTrackEnded = null;
    }
    /** Load the device with the router's RTP capabilities. */
    async init() {
      const rtpCapabilities = await this.signaling.getRtpCapabilities();
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
    }
    /** Create send and receive transports. */
    async createTransports() {
      const sendParams = await this.signaling.createSendTransport();
      this.sendTransport = this.device.createSendTransport(sendParams);
      this.sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.signaling.connectTransport(this.sendTransport.id, dtlsParameters);
          callback();
        } catch (err) {
          errback(err);
        }
      });
      this.sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const producerId = await this.signaling.produce(kind, rtpParameters, appData);
          callback({ id: producerId });
        } catch (err) {
          errback(err);
        }
      });
      const recvParams = await this.signaling.createRecvTransport();
      this.recvTransport = this.device.createRecvTransport(recvParams);
      this.recvTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.signaling.connectTransport(this.recvTransport.id, dtlsParameters);
          callback();
        } catch (err) {
          errback(err);
        }
      });
    }
    /** Produce a local track (audio or video). */
    async produceTrack(track) {
      const producer = await this.sendTransport.produce({ track });
      this.producers.set(producer.id, producer);
      return producer;
    }
    /** Consume a remote producer's track via the SFU. */
    async consumeProducer(producerId, peerId) {
      const params = await this.signaling.consume(producerId, this.device.rtpCapabilities);
      const consumer = await this.recvTransport.consume({
        id: params.consumerId,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      });
      this.consumers.set(consumer.id, { consumer, peerId, producerId });
      await this.signaling.resumeConsumer(consumer.id);
      if (this.onRemoteTrack) {
        this.onRemoteTrack(peerId, consumer.track, consumer.kind, producerId);
      }
      return consumer;
    }
    /** Replace the video track on the existing video producer (e.g. screen share). */
    async replaceVideoTrack(newTrack) {
      for (const producer of this.producers.values()) {
        if (producer.kind === "video") {
          await producer.replaceTrack({ track: newTrack });
          return;
        }
      }
    }
    /** Close a specific producer by its ID. */
    async closeProducer(producerId) {
      const producer = this.producers.get(producerId);
      if (producer) {
        producer.close();
        this.producers.delete(producerId);
        await this.signaling.closeProducer(producerId);
      }
    }
    /** Remove all consumers associated with a peer. */
    removeConsumersByPeer(peerId) {
      for (const [consumerId, entry] of this.consumers) {
        if (entry.peerId === peerId) {
          entry.consumer.close();
          this.consumers.delete(consumerId);
        }
      }
    }
    /** Remove a single consumer. */
    removeConsumer(consumerId) {
      const entry = this.consumers.get(consumerId);
      if (entry) {
        entry.consumer.close();
        this.consumers.delete(consumerId);
      }
    }
    /** Close everything. */
    closeAll() {
      for (const producer of this.producers.values()) producer.close();
      this.producers.clear();
      for (const { consumer } of this.consumers.values()) consumer.close();
      this.consumers.clear();
      this.sendTransport?.close();
      this.recvTransport?.close();
    }
    /** Number of unique remote peers we are receiving from. */
    get peerCount() {
      const ids = /* @__PURE__ */ new Set();
      for (const { peerId } of this.consumers.values()) ids.add(peerId);
      return ids.size;
    }
  };

  // public/js/main.js
  var $landing = document.getElementById("landing");
  var $call = document.getElementById("call");
  var $btnCreate = document.getElementById("btn-create");
  var $btnJoin = document.getElementById("btn-join");
  var $inputRoom = document.getElementById("input-room");
  var $landingError = document.getElementById("landing-error");
  var $roomIdDisplay = document.getElementById("room-id-display");
  var $participantCount = document.getElementById("participant-count");
  var $videoGrid = document.getElementById("video-grid");
  var $localOverlay = document.getElementById("local-overlay");
  var $btnCopy = document.getElementById("btn-copy");
  var $btnMic = document.getElementById("btn-mic");
  var $btnCam = document.getElementById("btn-cam");
  var $btnScreen = document.getElementById("btn-screen");
  var $btnLeave = document.getElementById("btn-leave");
  var JOINER_STREAM_COUNT = 9;
  var signaling = null;
  var sfuClient = null;
  var localStream = null;
  var screenStream = null;
  var isSharingScreen = false;
  var roomId = null;
  var role = null;
  var remoteVideoIndex = 0;
  var clonedTracks = [];
  var producerTileMap = /* @__PURE__ */ new Map();
  function showError(msg) {
    $landingError.textContent = msg;
    $landingError.classList.remove("hidden");
  }
  function clearError() {
    $landingError.textContent = "";
    $landingError.classList.add("hidden");
  }
  function showCallView(id) {
    roomId = id;
    $roomIdDisplay.textContent = roomId;
    $landing.classList.add("hidden");
    $call.classList.remove("hidden");
    updateLayout();
  }
  function showLandingView() {
    $call.classList.add("hidden");
    $landing.classList.remove("hidden");
    clearError();
  }
  function updateLayout() {
    const gridCount = $videoGrid.children.length;
    const overlayCount = $localOverlay.children.length;
    const total = gridCount + overlayCount;
    $participantCount.textContent = `${total} stream${total !== 1 ? "s" : ""}`;
    $videoGrid.setAttribute("data-count", gridCount);
    $localOverlay.setAttribute("data-count", overlayCount);
  }
  function createVideoTile(id, stream, label, isLocal = false, container = $videoGrid) {
    if (document.getElementById(`tile-${id}`)) return;
    const tile = document.createElement("div");
    tile.classList.add("video-tile");
    if (isLocal) tile.classList.add("local");
    tile.id = `tile-${id}`;
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = isLocal;
    video.srcObject = stream;
    const lbl = document.createElement("div");
    lbl.classList.add("tile-label");
    lbl.textContent = label;
    tile.appendChild(video);
    tile.appendChild(lbl);
    container.appendChild(tile);
    updateLayout();
  }
  function removeVideoTile(id) {
    const tile = document.getElementById(`tile-${id}`);
    if (tile) {
      const video = tile.querySelector("video");
      if (video) video.srcObject = null;
      tile.remove();
    }
    updateLayout();
  }
  function removeAllTiles() {
    $videoGrid.innerHTML = "";
    $localOverlay.innerHTML = "";
  }
  async function getLocalMedia(width, height) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: width }, height: { ideal: height } },
        audio: true
      });
    } catch {
      showError("Camera/mic access denied. Please allow permissions and try again.");
      throw new Error("Camera/mic access denied");
    }
  }
  async function setupSfu() {
    signaling = new Signaling();
    sfuClient = new SfuClient(signaling);
    sfuClient.onRemoteTrack = (peerId, track, kind, producerId) => {
      if (kind === "audio") {
        for (const [pId, tileId2] of producerTileMap) {
          const tile = document.getElementById(`tile-${tileId2}`);
          if (tile) {
            const video = tile.querySelector("video");
            if (video && video.srcObject) {
              video.srcObject.addTrack(track);
              return;
            }
          }
        }
        return;
      }
      remoteVideoIndex++;
      const tileId = `remote-${remoteVideoIndex}`;
      producerTileMap.set(producerId, tileId);
      const stream = new MediaStream([track]);
      const res = role === "creator" ? "360p" : "720p";
      createVideoTile(tileId, stream, `Remote #${remoteVideoIndex} (${res})`);
    };
    signaling.onPeerJoined(() => {
    });
    signaling.onPeerLeft((peerId) => {
      sfuClient.removeConsumersByPeer(peerId);
      for (const [pId, tileId] of producerTileMap) {
        removeVideoTile(tileId);
      }
      producerTileMap.clear();
      remoteVideoIndex = 0;
      updateLayout();
    });
    signaling.onNewProducer(async ({ producerId, peerId, kind }) => {
      try {
        await sfuClient.consumeProducer(producerId, peerId);
      } catch (err) {
        console.error("Failed to consume producer:", err);
      }
    });
    signaling.onProducerClosed(({ consumerId, producerId }) => {
      const tileId = producerTileMap.get(producerId);
      if (tileId) {
        removeVideoTile(tileId);
        producerTileMap.delete(producerId);
      }
      sfuClient.removeConsumer(consumerId);
    });
  }
  async function handleCreate() {
    clearError();
    try {
      role = "creator";
      localStream = await getLocalMedia(1280, 720);
      await setupSfu();
      const id = await signaling.createRoom();
      showCallView(id);
      createVideoTile("local", localStream, "You (720p)", true, $localOverlay);
      await sfuClient.init();
      await sfuClient.createTransports();
      for (const track of localStream.getTracks()) {
        await sfuClient.produceTrack(track);
      }
    } catch (err) {
      showError(err.message);
    }
  }
  async function handleJoin() {
    clearError();
    const id = $inputRoom.value.trim().toLowerCase();
    if (!id) {
      showError("Please enter a room ID");
      return;
    }
    try {
      role = "joiner";
      localStream = await getLocalMedia(640, 360);
      await setupSfu();
      const { existingProducers } = await signaling.joinRoom(id);
      showCallView(id);
      await sfuClient.init();
      await sfuClient.createTransports();
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        await sfuClient.produceTrack(audioTrack);
      }
      const videoTrack = localStream.getVideoTracks()[0];
      for (let i = 0; i < JOINER_STREAM_COUNT; i++) {
        const clone = videoTrack.clone();
        clonedTracks.push(clone);
        await sfuClient.produceTrack(clone);
        const stream = new MediaStream([clone]);
        createVideoTile(`local-${i}`, stream, `Local #${i + 1} (360p)`, true, $localOverlay);
      }
      for (const { producerId, peerId } of existingProducers) {
        await sfuClient.consumeProducer(producerId, peerId);
      }
    } catch (err) {
      showError(err.message);
      cleanup(false);
    }
  }
  function toggleMic() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    $btnMic.classList.toggle("muted", !audioTrack.enabled);
  }
  function toggleCam() {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;
    const enabled = !videoTrack.enabled;
    videoTrack.enabled = enabled;
    for (const clone of clonedTracks) {
      clone.enabled = enabled;
    }
    $btnCam.classList.toggle("muted", !enabled);
  }
  async function toggleScreen() {
    if (isSharingScreen) {
      await stopScreenShare();
      return;
    }
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      await sfuClient.replaceVideoTrack(screenTrack);
      const localVideo = document.querySelector("#tile-local video");
      if (localVideo) localVideo.srcObject = screenStream;
      isSharingScreen = true;
      $btnScreen.classList.add("active");
      screenTrack.onended = () => stopScreenShare();
    } catch {
      console.log("Screen share cancelled");
    }
  }
  async function stopScreenShare() {
    if (!isSharingScreen) return;
    isSharingScreen = false;
    $btnScreen.classList.remove("active");
    const cameraTrack = localStream.getVideoTracks()[0];
    await sfuClient.replaceVideoTrack(cameraTrack);
    const localVideo = document.querySelector("#tile-local video");
    if (localVideo) localVideo.srcObject = localStream;
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      screenStream = null;
    }
  }
  function handleLeave() {
    cleanup(true);
    showLandingView();
  }
  function cleanup(notify) {
    if (isSharingScreen) stopScreenShare();
    if (sfuClient) {
      sfuClient.closeAll();
      sfuClient = null;
    }
    if (notify && signaling) signaling.leaveRoom();
    if (signaling) {
      signaling.disconnect();
      signaling = null;
    }
    for (const t of clonedTracks) t.stop();
    clonedTracks.length = 0;
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null;
    }
    removeAllTiles();
    roomId = null;
    role = null;
    remoteVideoIndex = 0;
    producerTileMap.clear();
    $btnMic.classList.remove("muted");
    $btnCam.classList.remove("muted");
    $btnScreen.classList.remove("active");
  }
  function copyRoomId() {
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(() => {
        $btnCopy.textContent = "\u2713";
        setTimeout(() => {
          $btnCopy.textContent = "\u{1F4CB}";
        }, 1500);
      });
    }
  }
  $btnCreate.addEventListener("click", handleCreate);
  $btnJoin.addEventListener("click", handleJoin);
  $inputRoom.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleJoin();
  });
  $btnMic.addEventListener("click", toggleMic);
  $btnCam.addEventListener("click", toggleCam);
  $btnScreen.addEventListener("click", toggleScreen);
  $btnLeave.addEventListener("click", handleLeave);
  $btnCopy.addEventListener("click", copyRoomId);
})();
