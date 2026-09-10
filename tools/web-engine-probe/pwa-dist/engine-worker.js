var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// node_modules/papaparse/papaparse.min.js
var require_papaparse_min = __commonJS({
  "node_modules/papaparse/papaparse.min.js"(exports, module) {
    ((e, t) => {
      "function" == typeof define && define.amd ? define([], t) : "object" == typeof module && "undefined" != typeof exports ? module.exports = t() : e.Papa = t();
    })(exports, function r() {
      var n = "undefined" != typeof self ? self : "undefined" != typeof window ? window : void 0 !== n ? n : {};
      var d, s = !n.document && !!n.postMessage, a = n.IS_PAPA_WORKER || false, o = {}, h = 0, v = {};
      function u(e) {
        this._handle = null, this._finished = false, this._completed = false, this._halted = false, this._input = null, this._baseIndex = 0, this._partialLine = "", this._rowCount = 0, this._start = 0, this._nextChunk = null, this.isFirstChunk = true, this._completeResults = { data: [], errors: [], meta: {} }, function(e2) {
          var t = b(e2);
          t.chunkSize = parseInt(t.chunkSize), e2.step || e2.chunk || (t.chunkSize = null);
          this._handle = new i(t), (this._handle.streamer = this)._config = t;
        }.call(this, e), this.parseChunk = function(t, e2) {
          var i2 = parseInt(this._config.skipFirstNLines) || 0;
          if (this.isFirstChunk && 0 < i2) {
            let e3 = this._config.newline;
            e3 || (r2 = this._config.quoteChar || '"', e3 = this._handle.guessLineEndings(t, r2)), t = [...t.split(e3).slice(i2)].join(e3);
          }
          this.isFirstChunk && U(this._config.beforeFirstChunk) && void 0 !== (r2 = this._config.beforeFirstChunk(t)) && (t = r2), this.isFirstChunk = false, this._halted = false;
          var i2 = this._partialLine + t, r2 = (this._partialLine = "", this._handle.parse(i2, this._baseIndex, !this._finished));
          if (!this._handle.paused() && !this._handle.aborted()) {
            t = r2.meta.cursor, i2 = (this._finished || (this._partialLine = i2.substring(t - this._baseIndex), this._baseIndex = t), r2 && r2.data && (this._rowCount += r2.data.length), this._finished || this._config.preview && this._rowCount >= this._config.preview);
            if (a) n.postMessage({ results: r2, workerId: v.WORKER_ID, finished: i2 });
            else if (U(this._config.chunk) && !e2) {
              if (this._config.chunk(r2, this._handle), this._handle.paused() || this._handle.aborted()) return void (this._halted = true);
              this._completeResults = r2 = void 0;
            }
            return this._config.step || this._config.chunk || (this._completeResults.data = this._completeResults.data.concat(r2.data), this._completeResults.errors = this._completeResults.errors.concat(r2.errors), this._completeResults.meta = r2.meta), this._completed || !i2 || !U(this._config.complete) || r2 && r2.meta.aborted || (this._config.complete(this._completeResults, this._input), this._completed = true), i2 || r2 && r2.meta.paused || this._nextChunk(), r2;
          }
          this._halted = true;
        }, this._sendError = function(e2) {
          U(this._config.error) ? this._config.error(e2) : a && this._config.error && n.postMessage({ workerId: v.WORKER_ID, error: e2, finished: false });
        };
      }
      function f(e) {
        var r2;
        (e = e || {}).chunkSize || (e.chunkSize = v.RemoteChunkSize), u.call(this, e), this._nextChunk = s ? function() {
          this._readChunk(), this._chunkLoaded();
        } : function() {
          this._readChunk();
        }, this.stream = function(e2) {
          this._input = e2, this._nextChunk();
        }, this._readChunk = function() {
          if (this._finished) this._chunkLoaded();
          else {
            if (r2 = new XMLHttpRequest(), this._config.withCredentials && (r2.withCredentials = this._config.withCredentials), s || (r2.onload = y(this._chunkLoaded, this), r2.onerror = y(this._chunkError, this)), r2.open(this._config.downloadRequestBody ? "POST" : "GET", this._input, !s), this._config.downloadRequestHeaders) {
              var e2, t = this._config.downloadRequestHeaders;
              for (e2 in t) r2.setRequestHeader(e2, t[e2]);
            }
            var i2;
            this._config.chunkSize && (i2 = this._start + this._config.chunkSize - 1, r2.setRequestHeader("Range", "bytes=" + this._start + "-" + i2));
            try {
              r2.send(this._config.downloadRequestBody);
            } catch (e3) {
              this._chunkError(e3.message);
            }
            s && 0 === r2.status && this._chunkError();
          }
        }, this._chunkLoaded = function() {
          4 === r2.readyState && (r2.status < 200 || 400 <= r2.status ? this._chunkError() : (this._start += this._config.chunkSize || r2.responseText.length, this._finished = !this._config.chunkSize || this._start >= ((e2) => null !== (e2 = e2.getResponseHeader("Content-Range")) ? parseInt(e2.substring(e2.lastIndexOf("/") + 1)) : -1)(r2), this.parseChunk(r2.responseText)));
        }, this._chunkError = function(e2) {
          e2 = r2.statusText || e2;
          this._sendError(new Error(e2));
        };
      }
      function l(e) {
        (e = e || {}).chunkSize || (e.chunkSize = v.LocalChunkSize), u.call(this, e);
        var i2, r2, n2 = "undefined" != typeof FileReader;
        this.stream = function(e2) {
          this._input = e2, r2 = e2.slice || e2.webkitSlice || e2.mozSlice, n2 ? ((i2 = new FileReader()).onload = y(this._chunkLoaded, this), i2.onerror = y(this._chunkError, this)) : i2 = new FileReaderSync(), this._nextChunk();
        }, this._nextChunk = function() {
          this._finished || this._config.preview && !(this._rowCount < this._config.preview) || this._readChunk();
        }, this._readChunk = function() {
          var e2 = this._input, t = (this._config.chunkSize && (t = Math.min(this._start + this._config.chunkSize, this._input.size), e2 = r2.call(e2, this._start, t)), i2.readAsText(e2, this._config.encoding));
          n2 || this._chunkLoaded({ target: { result: t } });
        }, this._chunkLoaded = function(e2) {
          this._start += this._config.chunkSize, this._finished = !this._config.chunkSize || this._start >= this._input.size, this.parseChunk(e2.target.result);
        }, this._chunkError = function() {
          this._sendError(i2.error);
        };
      }
      function c(e) {
        var i2;
        u.call(this, e = e || {}), this.stream = function(e2) {
          return i2 = e2, this._nextChunk();
        }, this._nextChunk = function() {
          var e2, t;
          if (!this._finished) return e2 = this._config.chunkSize, i2 = e2 ? (t = i2.substring(0, e2), i2.substring(e2)) : (t = i2, ""), this._finished = !i2, this.parseChunk(t);
        };
      }
      function p(e) {
        u.call(this, e = e || {});
        var t = [], i2 = true, r2 = false;
        this.pause = function() {
          u.prototype.pause.apply(this, arguments), this._input.pause();
        }, this.resume = function() {
          u.prototype.resume.apply(this, arguments), this._input.resume();
        }, this.stream = function(e2) {
          this._input = e2, this._input.on("data", this._streamData), this._input.on("end", this._streamEnd), this._input.on("error", this._streamError);
        }, this._checkIsFinished = function() {
          r2 && 1 === t.length && (this._finished = true);
        }, this._nextChunk = function() {
          this._checkIsFinished(), t.length ? this.parseChunk(t.shift()) : i2 = true;
        }, this._streamData = y(function(e2) {
          try {
            t.push("string" == typeof e2 ? e2 : e2.toString(this._config.encoding)), i2 && (i2 = false, this._checkIsFinished(), this.parseChunk(t.shift()));
          } catch (e3) {
            this._streamError(e3);
          }
        }, this), this._streamError = y(function(e2) {
          this._streamCleanUp(), this._sendError(e2);
        }, this), this._streamEnd = y(function() {
          this._streamCleanUp(), r2 = true, this._streamData("");
        }, this), this._streamCleanUp = y(function() {
          this._input.removeListener("data", this._streamData), this._input.removeListener("end", this._streamEnd), this._input.removeListener("error", this._streamError);
        }, this);
      }
      function i(m2) {
        var n2, s2, a2, t, o2 = Math.pow(2, 53), h2 = -o2, u2 = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/, d2 = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/, i2 = this, r2 = 0, f2 = 0, l2 = false, e = false, c2 = [], p2 = { data: [], errors: [], meta: {} };
        function y2(e2) {
          return "greedy" === m2.skipEmptyLines ? "" === e2.join("").trim() : 1 === e2.length && 0 === e2[0].length;
        }
        function g2() {
          if (p2 && a2 && (k("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + v.DefaultDelimiter + "'"), a2 = false), m2.skipEmptyLines && (p2.data = p2.data.filter(function(e3) {
            return !y2(e3);
          })), _2()) {
            let t3 = function(e3, t4) {
              U(m2.transformHeader) && (e3 = m2.transformHeader(e3, t4)), c2.push(e3);
            };
            var t2 = t3;
            if (p2) if (Array.isArray(p2.data[0])) {
              for (var e2 = 0; _2() && e2 < p2.data.length; e2++) p2.data[e2].forEach(t3);
              p2.data.splice(0, 1);
            } else p2.data.forEach(t3);
          }
          function i3(e3, t3) {
            for (var i4 = m2.header ? {} : [], r4 = 0; r4 < e3.length; r4++) {
              var n3 = r4, s3 = e3[r4], s3 = ((e4, t4) => ((e5) => (m2.dynamicTypingFunction && void 0 === m2.dynamicTyping[e5] && (m2.dynamicTyping[e5] = m2.dynamicTypingFunction(e5)), true === (m2.dynamicTyping[e5] || m2.dynamicTyping)))(e4) ? "true" === t4 || "TRUE" === t4 || "false" !== t4 && "FALSE" !== t4 && (((e5) => {
                if (u2.test(e5)) {
                  e5 = parseFloat(e5);
                  if (h2 < e5 && e5 < o2) return 1;
                }
              })(t4) ? parseFloat(t4) : d2.test(t4) ? new Date(t4) : "" === t4 ? null : t4) : t4)(n3 = m2.header ? r4 >= c2.length ? "__parsed_extra" : c2[r4] : n3, s3 = m2.transform ? m2.transform(s3, n3) : s3);
              "__parsed_extra" === n3 ? (i4[n3] = i4[n3] || [], i4[n3].push(s3)) : i4[n3] = s3;
            }
            return m2.header && (r4 > c2.length ? k("FieldMismatch", "TooManyFields", "Too many fields: expected " + c2.length + " fields but parsed " + r4, f2 + t3) : r4 < c2.length && k("FieldMismatch", "TooFewFields", "Too few fields: expected " + c2.length + " fields but parsed " + r4, f2 + t3)), i4;
          }
          var r3;
          p2 && (m2.header || m2.dynamicTyping || m2.transform) && (r3 = 1, !p2.data.length || Array.isArray(p2.data[0]) ? (p2.data = p2.data.map(i3), r3 = p2.data.length) : p2.data = i3(p2.data, 0), m2.header && p2.meta && (p2.meta.fields = c2), f2 += r3);
        }
        function _2() {
          return m2.header && 0 === c2.length;
        }
        function k(e2, t2, i3, r3) {
          e2 = { type: e2, code: t2, message: i3 };
          void 0 !== r3 && (e2.row = r3), p2.errors.push(e2);
        }
        U(m2.step) && (t = m2.step, m2.step = function(e2) {
          p2 = e2, _2() ? g2() : (g2(), 0 !== p2.data.length && (r2 += e2.data.length, m2.preview && r2 > m2.preview ? s2.abort() : (p2.data = p2.data[0], t(p2, i2))));
        }), this.parse = function(e2, t2, i3) {
          var r3 = m2.quoteChar || '"', r3 = (m2.newline || (m2.newline = this.guessLineEndings(e2, r3)), a2 = false, m2.delimiter ? U(m2.delimiter) && (m2.delimiter = m2.delimiter(e2), p2.meta.delimiter = m2.delimiter) : ((r3 = ((e3, t3, i4, r4, n3) => {
            var s3, a3, o3, h3;
            n3 = n3 || [",", "	", "|", ";", v.RECORD_SEP, v.UNIT_SEP];
            for (var u3 = 0; u3 < n3.length; u3++) {
              for (var d3, f3 = n3[u3], l3 = 0, c3 = 0, p3 = 0, g3 = (o3 = void 0, new E({ comments: r4, delimiter: f3, newline: t3, preview: 10 }).parse(e3)), _3 = 0; _3 < g3.data.length; _3++) i4 && y2(g3.data[_3]) ? p3++ : (d3 = g3.data[_3].length, c3 += d3, void 0 === o3 ? o3 = d3 : 0 < d3 && (l3 += Math.abs(d3 - o3), o3 = d3));
              0 < g3.data.length && (c3 /= g3.data.length - p3), (void 0 === a3 || l3 <= a3) && (void 0 === h3 || h3 < c3) && 1.99 < c3 && (a3 = l3, s3 = f3, h3 = c3);
            }
            return { successful: !!(m2.delimiter = s3), bestDelimiter: s3 };
          })(e2, m2.newline, m2.skipEmptyLines, m2.comments, m2.delimitersToGuess)).successful ? m2.delimiter = r3.bestDelimiter : (a2 = true, m2.delimiter = v.DefaultDelimiter), p2.meta.delimiter = m2.delimiter), b(m2));
          return m2.preview && m2.header && r3.preview++, n2 = e2, s2 = new E(r3), p2 = s2.parse(n2, t2, i3), g2(), l2 ? { meta: { paused: true } } : p2 || { meta: { paused: false } };
        }, this.paused = function() {
          return l2;
        }, this.pause = function() {
          l2 = true, s2.abort(), n2 = U(m2.chunk) ? "" : n2.substring(s2.getCharIndex());
        }, this.resume = function() {
          i2.streamer._halted ? (l2 = false, i2.streamer.parseChunk(n2, true)) : setTimeout(i2.resume, 3);
        }, this.aborted = function() {
          return e;
        }, this.abort = function() {
          e = true, s2.abort(), p2.meta.aborted = true, U(m2.complete) && m2.complete(p2), n2 = "";
        }, this.guessLineEndings = function(e2, t2) {
          e2 = e2.substring(0, 1048576);
          var t2 = new RegExp(P16(t2) + "([^]*?)" + P16(t2), "gm"), i3 = (e2 = e2.replace(t2, "")).split("\r"), t2 = e2.split("\n"), e2 = 1 < t2.length && t2[0].length < i3[0].length;
          if (1 === i3.length || e2) return "\n";
          for (var r3 = 0, n3 = 0; n3 < i3.length; n3++) "\n" === i3[n3][0] && r3++;
          return r3 >= i3.length / 2 ? "\r\n" : "\r";
        };
      }
      function P16(e) {
        return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function E(C) {
        var S = (C = C || {}).delimiter, O = C.newline, x = C.comments, I = C.step, A = C.preview, T = C.fastMode, D = null, L = false, F = null == C.quoteChar ? '"' : C.quoteChar, j = F;
        if (void 0 !== C.escapeChar && (j = C.escapeChar), ("string" != typeof S || -1 < v.BAD_DELIMITERS.indexOf(S)) && (S = ","), x === S) throw new Error("Comment character same as delimiter");
        true === x ? x = "#" : ("string" != typeof x || -1 < v.BAD_DELIMITERS.indexOf(x)) && (x = false), "\n" !== O && "\r" !== O && "\r\n" !== O && (O = "\n");
        var z = 0, M = false;
        this.parse = function(i2, t, r2) {
          if ("string" != typeof i2) throw new Error("Input must be a string");
          var n2 = i2.length, e = S.length, s2 = O.length, a2 = x.length, o2 = U(I), h2 = [], u2 = [], d2 = [], f2 = z = 0;
          if (!i2) return w();
          if (T || false !== T && -1 === i2.indexOf(F)) {
            for (var l2 = i2.split(O), c2 = 0; c2 < l2.length; c2++) {
              if (d2 = l2[c2], z += d2.length, c2 !== l2.length - 1) z += O.length;
              else if (r2) return w();
              if (!x || d2.substring(0, a2) !== x) {
                if (o2) {
                  if (h2 = [], k(d2.split(S)), R(), M) return w();
                } else k(d2.split(S));
                if (A && A <= c2) return h2 = h2.slice(0, A), w(true);
              }
            }
            return w();
          }
          for (var p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z), _2 = new RegExp(P16(j) + P16(F), "g"), m2 = i2.indexOf(F, z); ; ) if (i2[z] === F) for (m2 = z, z++; ; ) {
            if (-1 === (m2 = i2.indexOf(F, m2 + 1))) return r2 || u2.push({ type: "Quotes", code: "MissingQuotes", message: "Quoted field unterminated", row: h2.length, index: z }), E2();
            if (m2 === n2 - 1) return E2(i2.substring(z, m2).replace(_2, F));
            if (F === j && i2[m2 + 1] === j) m2++;
            else if (F === j || 0 === m2 || i2[m2 - 1] !== j) {
              -1 !== p2 && p2 < m2 + 1 && (p2 = i2.indexOf(S, m2 + 1));
              var y2 = v2(-1 === (g2 = -1 !== g2 && g2 < m2 + 1 ? i2.indexOf(O, m2 + 1) : g2) ? p2 : Math.min(p2, g2));
              if (i2.substr(m2 + 1 + y2, e) === S) {
                d2.push(i2.substring(z, m2).replace(_2, F)), i2[z = m2 + 1 + y2 + e] !== F && (m2 = i2.indexOf(F, z)), p2 = i2.indexOf(S, z), g2 = i2.indexOf(O, z);
                break;
              }
              y2 = v2(g2);
              if (i2.substring(m2 + 1 + y2, m2 + 1 + y2 + s2) === O) {
                if (d2.push(i2.substring(z, m2).replace(_2, F)), b2(m2 + 1 + y2 + s2), p2 = i2.indexOf(S, z), m2 = i2.indexOf(F, z), o2 && (R(), M)) return w();
                if (A && h2.length >= A) return w(true);
                break;
              }
              u2.push({ type: "Quotes", code: "InvalidQuotes", message: "Trailing quote on quoted field is malformed", row: h2.length, index: z }), m2++;
            }
          }
          else if (x && 0 === d2.length && i2.substring(z, z + a2) === x) {
            if (-1 === g2) return w();
            z = g2 + s2, g2 = i2.indexOf(O, z), p2 = i2.indexOf(S, z);
          } else if (-1 !== p2 && (p2 < g2 || -1 === g2)) d2.push(i2.substring(z, p2)), z = p2 + e, p2 = i2.indexOf(S, z);
          else {
            if (-1 === g2) break;
            if (d2.push(i2.substring(z, g2)), b2(g2 + s2), o2 && (R(), M)) return w();
            if (A && h2.length >= A) return w(true);
          }
          return E2();
          function k(e2) {
            h2.push(e2), f2 = z;
          }
          function v2(e2) {
            var t2 = 0;
            return t2 = -1 !== e2 && (e2 = i2.substring(m2 + 1, e2)) && "" === e2.trim() ? e2.length : t2;
          }
          function E2(e2) {
            return r2 || (void 0 === e2 && (e2 = i2.substring(z)), d2.push(e2), z = n2, k(d2), o2 && R()), w();
          }
          function b2(e2) {
            z = e2, k(d2), d2 = [], g2 = i2.indexOf(O, z);
          }
          function w(e2) {
            if (C.header && !t && h2.length && !L) {
              var s3 = h2[0], a3 = /* @__PURE__ */ Object.create(null), o3 = new Set(s3);
              let n3 = false;
              for (let r3 = 0; r3 < s3.length; r3++) {
                let i3 = s3[r3];
                if (a3[i3 = U(C.transformHeader) ? C.transformHeader(i3, r3) : i3]) {
                  let e3, t2 = a3[i3];
                  for (; e3 = i3 + "_" + t2, t2++, o3.has(e3); ) ;
                  o3.add(e3), s3[r3] = e3, a3[i3]++, n3 = true, (D = null === D ? {} : D)[e3] = i3;
                } else a3[i3] = 1, s3[r3] = i3;
                o3.add(i3);
              }
              n3 && console.warn("Duplicate headers found and renamed."), L = true;
            }
            return { data: h2, errors: u2, meta: { delimiter: S, linebreak: O, aborted: M, truncated: !!e2, cursor: f2 + (t || 0), renamedHeaders: D } };
          }
          function R() {
            I(w()), h2 = [], u2 = [];
          }
        }, this.abort = function() {
          M = true;
        }, this.getCharIndex = function() {
          return z;
        };
      }
      function g(e) {
        var t = e.data, i2 = o[t.workerId], r2 = false;
        if (t.error) i2.userError(t.error, t.file);
        else if (t.results && t.results.data) {
          var n2 = { abort: function() {
            r2 = true, _(t.workerId, { data: [], errors: [], meta: { aborted: true } });
          }, pause: m, resume: m };
          if (U(i2.userStep)) {
            for (var s2 = 0; s2 < t.results.data.length && (i2.userStep({ data: t.results.data[s2], errors: t.results.errors, meta: t.results.meta }, n2), !r2); s2++) ;
            delete t.results;
          } else U(i2.userChunk) && (i2.userChunk(t.results, n2, t.file), delete t.results);
        }
        t.finished && !r2 && _(t.workerId, t.results);
      }
      function _(e, t) {
        var i2 = o[e];
        U(i2.userComplete) && i2.userComplete(t), i2.terminate(), delete o[e];
      }
      function m() {
        throw new Error("Not implemented.");
      }
      function b(e) {
        if ("object" != typeof e || null === e) return e;
        var t, i2 = Array.isArray(e) ? [] : {};
        for (t in e) i2[t] = b(e[t]);
        return i2;
      }
      function y(e, t) {
        return function() {
          e.apply(t, arguments);
        };
      }
      function U(e) {
        return "function" == typeof e;
      }
      return v.parse = function(e, t) {
        var i2 = (t = t || {}).dynamicTyping || false;
        U(i2) && (t.dynamicTypingFunction = i2, i2 = {});
        if (t.dynamicTyping = i2, t.transform = !!U(t.transform) && t.transform, !t.worker || !v.WORKERS_SUPPORTED) return i2 = null, v.NODE_STREAM_INPUT, "string" == typeof e ? (e = ((e2) => 65279 !== e2.charCodeAt(0) ? e2 : e2.slice(1))(e), i2 = new (t.download ? f : c)(t)) : true === e.readable && U(e.read) && U(e.on) ? i2 = new p(t) : (n.File && e instanceof File || e instanceof Object) && (i2 = new l(t)), i2.stream(e);
        (i2 = (() => {
          var e2;
          return !!v.WORKERS_SUPPORTED && (e2 = (() => {
            var e3 = n.URL || n.webkitURL || null, t2 = r.toString();
            return v.BLOB_URL || (v.BLOB_URL = e3.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", t2, ")();"], { type: "text/javascript" })));
          })(), (e2 = new n.Worker(e2)).onmessage = g, e2.id = h++, o[e2.id] = e2);
        })()).userStep = t.step, i2.userChunk = t.chunk, i2.userComplete = t.complete, i2.userError = t.error, t.step = U(t.step), t.chunk = U(t.chunk), t.complete = U(t.complete), t.error = U(t.error), delete t.worker, i2.postMessage({ input: e, config: t, workerId: i2.id });
      }, v.unparse = function(e, t) {
        var n2 = false, _2 = true, m2 = ",", y2 = "\r\n", s2 = '"', a2 = s2 + s2, i2 = false, r2 = null, o2 = false, h2 = ((() => {
          if ("object" == typeof t) {
            if ("string" != typeof t.delimiter || v.BAD_DELIMITERS.filter(function(e2) {
              return -1 !== t.delimiter.indexOf(e2);
            }).length || (m2 = t.delimiter), "boolean" != typeof t.quotes && "function" != typeof t.quotes && !Array.isArray(t.quotes) || (n2 = t.quotes), "boolean" != typeof t.skipEmptyLines && "string" != typeof t.skipEmptyLines || (i2 = t.skipEmptyLines), "string" == typeof t.newline && (y2 = t.newline), "string" == typeof t.quoteChar && (s2 = t.quoteChar), "boolean" == typeof t.header && (_2 = t.header), Array.isArray(t.columns)) {
              if (0 === t.columns.length) throw new Error("Option columns is empty");
              r2 = t.columns;
            }
            void 0 !== t.escapeChar && (a2 = t.escapeChar + s2), t.escapeFormulae instanceof RegExp ? o2 = t.escapeFormulae : "boolean" == typeof t.escapeFormulae && t.escapeFormulae && (o2 = /^[=+\-@\t\r].*$/);
          }
        })(), new RegExp(P16(s2), "g"));
        "string" == typeof e && (e = JSON.parse(e));
        if (Array.isArray(e)) {
          if (!e.length || Array.isArray(e[0])) return u2(null, e, i2);
          if ("object" == typeof e[0]) return u2(r2 || Object.keys(e[0]), e, i2);
        } else if ("object" == typeof e) return "string" == typeof e.data && (e.data = JSON.parse(e.data)), Array.isArray(e.data) && (e.fields || (e.fields = e.meta && e.meta.fields || r2), e.fields || (e.fields = Array.isArray(e.data[0]) ? e.fields : "object" == typeof e.data[0] ? Object.keys(e.data[0]) : []), Array.isArray(e.data[0]) || "object" == typeof e.data[0] || (e.data = [e.data])), u2(e.fields || [], e.data || [], i2);
        throw new Error("Unable to serialize unrecognized input");
        function u2(e2, t2, i3) {
          var r3 = "", n3 = ("string" == typeof e2 && (e2 = JSON.parse(e2)), "string" == typeof t2 && (t2 = JSON.parse(t2)), Array.isArray(e2) && 0 < e2.length), s3 = !Array.isArray(t2[0]);
          if (n3 && _2) {
            for (var a3 = 0; a3 < e2.length; a3++) 0 < a3 && (r3 += m2), r3 += k(e2[a3], a3);
            0 < t2.length && (r3 += y2);
          }
          for (var o3 = 0; o3 < t2.length; o3++) {
            var h3 = (n3 ? e2 : t2[o3]).length, u3 = false, d2 = n3 ? 0 === Object.keys(t2[o3]).length : 0 === t2[o3].length;
            if (i3 && !n3 && (u3 = "greedy" === i3 ? "" === t2[o3].join("").trim() : 1 === t2[o3].length && 0 === t2[o3][0].length), "greedy" === i3 && n3) {
              for (var f2 = [], l2 = 0; l2 < h3; l2++) {
                var c2 = s3 ? e2[l2] : l2;
                f2.push(t2[o3][c2]);
              }
              u3 = "" === f2.join("").trim();
            }
            if (!u3) {
              for (var p2 = 0; p2 < h3; p2++) {
                0 < p2 && !d2 && (r3 += m2);
                var g2 = n3 && s3 ? e2[p2] : p2;
                r3 += k(t2[o3][g2], p2);
              }
              o3 < t2.length - 1 && (!i3 || 0 < h3 && !d2) && (r3 += y2);
            }
          }
          return r3;
        }
        function k(e2, t2) {
          var i3, r3;
          return null == e2 ? "" : e2.constructor === Date ? JSON.stringify(e2).slice(1, 25) : (r3 = false, o2 && "string" == typeof e2 && o2.test(e2) && (e2 = "'" + e2, r3 = true), i3 = e2.toString().replace(h2, a2), (r3 = r3 || true === n2 || "function" == typeof n2 && n2(e2, t2) || Array.isArray(n2) && n2[t2] || ((e3, t3) => {
            for (var i4 = 0; i4 < t3.length; i4++) if (-1 < e3.indexOf(t3[i4])) return true;
            return false;
          })(i3, v.BAD_DELIMITERS) || -1 < i3.indexOf(m2) || " " === i3.charAt(0) || " " === i3.charAt(i3.length - 1)) ? s2 + i3 + s2 : i3);
        }
      }, v.RECORD_SEP = String.fromCharCode(30), v.UNIT_SEP = String.fromCharCode(31), v.BYTE_ORDER_MARK = "\uFEFF", v.BAD_DELIMITERS = ["\r", "\n", '"', v.BYTE_ORDER_MARK], v.WORKERS_SUPPORTED = !s && !!n.Worker, v.NODE_STREAM_INPUT = 1, v.LocalChunkSize = 10485760, v.RemoteChunkSize = 5242880, v.DefaultDelimiter = ",", v.Parser = E, v.ParserHandle = i, v.NetworkStreamer = f, v.FileStreamer = l, v.StringStreamer = c, v.ReadableStreamStreamer = p, n.jQuery && ((d = n.jQuery).fn.parse = function(o2) {
        var i2 = o2.config || {}, h2 = [];
        return this.each(function(e2) {
          if (!("INPUT" === d(this).prop("tagName").toUpperCase() && "file" === d(this).attr("type").toLowerCase() && n.FileReader) || !this.files || 0 === this.files.length) return true;
          for (var t = 0; t < this.files.length; t++) h2.push({ file: this.files[t], inputElem: this, instanceConfig: d.extend({}, i2) });
        }), e(), this;
        function e() {
          if (0 === h2.length) U(o2.complete) && o2.complete();
          else {
            var e2, t, i3, r2, n2 = h2[0];
            if (U(o2.before)) {
              var s2 = o2.before(n2.file, n2.inputElem);
              if ("object" == typeof s2) {
                if ("abort" === s2.action) return e2 = "AbortError", t = n2.file, i3 = n2.inputElem, r2 = s2.reason, void (U(o2.error) && o2.error({ name: e2 }, t, i3, r2));
                if ("skip" === s2.action) return void u2();
                "object" == typeof s2.config && (n2.instanceConfig = d.extend(n2.instanceConfig, s2.config));
              } else if ("skip" === s2) return void u2();
            }
            var a2 = n2.instanceConfig.complete;
            n2.instanceConfig.complete = function(e3) {
              U(a2) && a2(e3, n2.file, n2.inputElem), u2();
            }, v.parse(n2.file, n2.instanceConfig);
          }
        }
        function u2() {
          h2.splice(0, 1), e();
        }
      }), a && (n.onmessage = function(e) {
        e = e.data;
        void 0 === v.WORKER_ID && e && (v.WORKER_ID = e.workerId);
        "string" == typeof e.input ? n.postMessage({ workerId: v.WORKER_ID, results: v.parse(e.input, e.config), finished: true }) : (n.File && e.input instanceof File || e.input instanceof Object) && (e = v.parse(e.input, e.config)) && n.postMessage({ workerId: v.WORKER_ID, results: e, finished: true });
      }), (f.prototype = Object.create(u.prototype)).constructor = f, (l.prototype = Object.create(u.prototype)).constructor = l, (c.prototype = Object.create(c.prototype)).constructor = c, (p.prototype = Object.create(u.prototype)).constructor = p, v;
    });
  }
});

// node_modules/parsimmon/build/parsimmon.umd.min.js
var require_parsimmon_umd_min = __commonJS({
  "node_modules/parsimmon/build/parsimmon.umd.min.js"(exports, module) {
    !(function(n, t) {
      "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.Parsimmon = t() : n.Parsimmon = t();
    })("undefined" != typeof self ? self : exports, function() {
      return (function(n) {
        var t = {};
        function r(e) {
          if (t[e]) return t[e].exports;
          var u = t[e] = { i: e, l: false, exports: {} };
          return n[e].call(u.exports, u, u.exports, r), u.l = true, u.exports;
        }
        return r.m = n, r.c = t, r.d = function(n2, t2, e) {
          r.o(n2, t2) || Object.defineProperty(n2, t2, { configurable: false, enumerable: true, get: e });
        }, r.r = function(n2) {
          Object.defineProperty(n2, "__esModule", { value: true });
        }, r.n = function(n2) {
          var t2 = n2 && n2.__esModule ? function() {
            return n2.default;
          } : function() {
            return n2;
          };
          return r.d(t2, "a", t2), t2;
        }, r.o = function(n2, t2) {
          return Object.prototype.hasOwnProperty.call(n2, t2);
        }, r.p = "", r(r.s = 0);
      })([function(n, t, r) {
        "use strict";
        function e(n2) {
          if (!(this instanceof e)) return new e(n2);
          this._ = n2;
        }
        var u = e.prototype;
        function o(n2, t2) {
          for (var r2 = 0; r2 < n2; r2++) t2(r2);
        }
        function i(n2, t2, r2) {
          return (function(n3, t3) {
            o(t3.length, function(r3) {
              n3(t3[r3], r3, t3);
            });
          })(function(r3, e2, u2) {
            t2 = n2(t2, r3, e2, u2);
          }, r2), t2;
        }
        function a(n2, t2) {
          return i(function(t3, r2, e2, u2) {
            return t3.concat([n2(r2, e2, u2)]);
          }, [], t2);
        }
        function f(n2, t2) {
          var r2 = { v: 0, buf: t2 };
          return o(n2, function() {
            var n3;
            r2 = { v: r2.v << 1 | (n3 = r2.buf, n3[0] >> 7), buf: (function(n4) {
              var t3 = i(function(n5, t4, r3, e2) {
                return n5.concat(r3 === e2.length - 1 ? Buffer.from([t4, 0]).readUInt16BE(0) : e2.readUInt16BE(r3));
              }, [], n4);
              return Buffer.from(a(function(n5) {
                return (n5 << 1 & 65535) >> 8;
              }, t3));
            })(r2.buf) };
          }), r2;
        }
        function c() {
          return "undefined" != typeof Buffer;
        }
        function s() {
          if (!c()) throw new Error("Buffer global does not exist; please use webpack if you need to parse Buffers in the browser.");
        }
        function l(n2) {
          s();
          var t2 = i(function(n3, t3) {
            return n3 + t3;
          }, 0, n2);
          if (t2 % 8 != 0) throw new Error("The bits [" + n2.join(", ") + "] add up to " + t2 + " which is not an even number of bytes; the total should be divisible by 8");
          var r2, u2 = t2 / 8, o2 = (r2 = function(n3) {
            return n3 > 48;
          }, i(function(n3, t3) {
            return n3 || (r2(t3) ? t3 : n3);
          }, null, n2));
          if (o2) throw new Error(o2 + " bit range requested exceeds 48 bit (6 byte) Number max.");
          return new e(function(t3, r3) {
            var e2 = u2 + r3;
            return e2 > t3.length ? x(r3, u2.toString() + " bytes") : b(e2, i(function(n3, t4) {
              var r4 = f(t4, n3.buf);
              return { coll: n3.coll.concat(r4.v), buf: r4.buf };
            }, { coll: [], buf: t3.slice(r3, e2) }, n2).coll);
          });
        }
        function h(n2, t2) {
          return new e(function(r2, e2) {
            return s(), e2 + t2 > r2.length ? x(e2, t2 + " bytes for " + n2) : b(e2 + t2, r2.slice(e2, e2 + t2));
          });
        }
        function p(n2, t2) {
          if ("number" != typeof (r2 = t2) || Math.floor(r2) !== r2 || t2 < 0 || t2 > 6) throw new Error(n2 + " requires integer length in range [0, 6].");
          var r2;
        }
        function d(n2) {
          return p("uintBE", n2), h("uintBE(" + n2 + ")", n2).map(function(t2) {
            return t2.readUIntBE(0, n2);
          });
        }
        function v(n2) {
          return p("uintLE", n2), h("uintLE(" + n2 + ")", n2).map(function(t2) {
            return t2.readUIntLE(0, n2);
          });
        }
        function g(n2) {
          return p("intBE", n2), h("intBE(" + n2 + ")", n2).map(function(t2) {
            return t2.readIntBE(0, n2);
          });
        }
        function m(n2) {
          return p("intLE", n2), h("intLE(" + n2 + ")", n2).map(function(t2) {
            return t2.readIntLE(0, n2);
          });
        }
        function y(n2) {
          return n2 instanceof e;
        }
        function E(n2) {
          return "[object Array]" === {}.toString.call(n2);
        }
        function w(n2) {
          return c() && Buffer.isBuffer(n2);
        }
        function b(n2, t2) {
          return { status: true, index: n2, value: t2, furthest: -1, expected: [] };
        }
        function x(n2, t2) {
          return E(t2) || (t2 = [t2]), { status: false, index: -1, value: null, furthest: n2, expected: t2 };
        }
        function B(n2, t2) {
          if (!t2) return n2;
          if (n2.furthest > t2.furthest) return n2;
          var r2 = n2.furthest === t2.furthest ? (function(n3, t3) {
            if ((function() {
              if (void 0 !== e._supportsSet) return e._supportsSet;
              var n4 = "undefined" != typeof Set;
              return e._supportsSet = n4, n4;
            })() && Array.from) {
              for (var r3 = new Set(n3), u2 = 0; u2 < t3.length; u2++) r3.add(t3[u2]);
              var o2 = Array.from(r3);
              return o2.sort(), o2;
            }
            for (var i2 = {}, a2 = 0; a2 < n3.length; a2++) i2[n3[a2]] = true;
            for (var f2 = 0; f2 < t3.length; f2++) i2[t3[f2]] = true;
            var c2 = [];
            for (var s2 in i2) ({}).hasOwnProperty.call(i2, s2) && c2.push(s2);
            return c2.sort(), c2;
          })(n2.expected, t2.expected) : t2.expected;
          return { status: n2.status, index: n2.index, value: n2.value, furthest: t2.furthest, expected: r2 };
        }
        var j = {};
        function S(n2, t2) {
          if (w(n2)) return { offset: t2, line: -1, column: -1 };
          n2 in j || (j[n2] = {});
          for (var r2 = j[n2], e2 = 0, u2 = 0, o2 = 0, i2 = t2; i2 >= 0; ) {
            if (i2 in r2) {
              e2 = r2[i2].line, 0 === o2 && (o2 = r2[i2].lineStart);
              break;
            }
            ("\n" === n2.charAt(i2) || "\r" === n2.charAt(i2) && "\n" !== n2.charAt(i2 + 1)) && (u2++, 0 === o2 && (o2 = i2 + 1)), i2--;
          }
          var a2 = e2 + u2, f2 = t2 - o2;
          return r2[t2] = { line: a2, lineStart: o2 }, { offset: t2, line: a2 + 1, column: f2 + 1 };
        }
        function _(n2) {
          if (!y(n2)) throw new Error("not a parser: " + n2);
        }
        function L(n2, t2) {
          return "string" == typeof n2 ? n2.charAt(t2) : n2[t2];
        }
        function O(n2) {
          if ("number" != typeof n2) throw new Error("not a number: " + n2);
        }
        function k(n2) {
          if ("function" != typeof n2) throw new Error("not a function: " + n2);
        }
        function P16(n2) {
          if ("string" != typeof n2) throw new Error("not a string: " + n2);
        }
        var q = 2, A = 3, I = 8, F = 5 * I, M = 4 * I, z = "  ";
        function R(n2, t2) {
          return new Array(t2 + 1).join(n2);
        }
        function U(n2, t2, r2) {
          var e2 = t2 - n2.length;
          return e2 <= 0 ? n2 : R(r2, e2) + n2;
        }
        function W(n2, t2, r2, e2) {
          return { from: n2 - t2 > 0 ? n2 - t2 : 0, to: n2 + r2 > e2 ? e2 : n2 + r2 };
        }
        function D(n2, t2) {
          var r2, e2, u2, o2, f2, c2 = t2.index, s2 = c2.offset, l2 = 1;
          if (s2 === n2.length) return "Got the end of the input";
          if (w(n2)) {
            var h2 = s2 - s2 % I, p2 = s2 - h2, d2 = W(h2, F, M + I, n2.length), v2 = a(function(n3) {
              return a(function(n4) {
                return U(n4.toString(16), 2, "0");
              }, n3);
            }, (function(n3, t3) {
              var r3 = n3.length, e3 = [], u3 = 0;
              if (r3 <= t3) return [n3.slice()];
              for (var o3 = 0; o3 < r3; o3++) e3[u3] || e3.push([]), e3[u3].push(n3[o3]), (o3 + 1) % t3 == 0 && u3++;
              return e3;
            })(n2.slice(d2.from, d2.to).toJSON().data, I));
            o2 = (function(n3) {
              return 0 === n3.from && 1 === n3.to ? { from: n3.from, to: n3.to } : { from: n3.from / I, to: Math.floor(n3.to / I) };
            })(d2), e2 = h2 / I, r2 = 3 * p2, p2 >= 4 && (r2 += 1), l2 = 2, u2 = a(function(n3) {
              return n3.length <= 4 ? n3.join(" ") : n3.slice(0, 4).join(" ") + "  " + n3.slice(4).join(" ");
            }, v2), (f2 = (8 * (o2.to > 0 ? o2.to - 1 : o2.to)).toString(16).length) < 2 && (f2 = 2);
          } else {
            var g2 = n2.split(/\r\n|[\n\r\u2028\u2029]/);
            r2 = c2.column - 1, e2 = c2.line - 1, o2 = W(e2, q, A, g2.length), u2 = g2.slice(o2.from, o2.to), f2 = o2.to.toString().length;
          }
          var m2 = e2 - o2.from;
          return w(n2) && (f2 = (8 * (o2.to > 0 ? o2.to - 1 : o2.to)).toString(16).length) < 2 && (f2 = 2), i(function(t3, e3, u3) {
            var i2, a2 = u3 === m2, c3 = a2 ? "> " : z;
            return i2 = w(n2) ? U((8 * (o2.from + u3)).toString(16), f2, "0") : U((o2.from + u3 + 1).toString(), f2, " "), [].concat(t3, [c3 + i2 + " | " + e3], a2 ? [z + R(" ", f2) + " | " + U("", r2, " ") + R("^", l2)] : []);
          }, [], u2).join("\n");
        }
        function N(n2, t2) {
          return ["\n", "-- PARSING FAILED " + R("-", 50), "\n\n", D(n2, t2), "\n\n", (r2 = t2.expected, 1 === r2.length ? "Expected:\n\n" + r2[0] : "Expected one of the following: \n\n" + r2.join(", ")), "\n"].join("");
          var r2;
        }
        function G(n2) {
          return void 0 !== n2.flags ? n2.flags : [n2.global ? "g" : "", n2.ignoreCase ? "i" : "", n2.multiline ? "m" : "", n2.unicode ? "u" : "", n2.sticky ? "y" : ""].join("");
        }
        function C() {
          for (var n2 = [].slice.call(arguments), t2 = n2.length, r2 = 0; r2 < t2; r2 += 1) _(n2[r2]);
          return e(function(r3, e2) {
            for (var u2, o2 = new Array(t2), i2 = 0; i2 < t2; i2 += 1) {
              if (!(u2 = B(n2[i2]._(r3, e2), u2)).status) return u2;
              o2[i2] = u2.value, e2 = u2.index;
            }
            return B(b(e2, o2), u2);
          });
        }
        function J() {
          var n2 = [].slice.call(arguments);
          if (0 === n2.length) throw new Error("seqMap needs at least one argument");
          var t2 = n2.pop();
          return k(t2), C.apply(null, n2).map(function(n3) {
            return t2.apply(null, n3);
          });
        }
        function T() {
          var n2 = [].slice.call(arguments), t2 = n2.length;
          if (0 === t2) return Y("zero alternates");
          for (var r2 = 0; r2 < t2; r2 += 1) _(n2[r2]);
          return e(function(t3, r3) {
            for (var e2, u2 = 0; u2 < n2.length; u2 += 1) if ((e2 = B(n2[u2]._(t3, r3), e2)).status) return e2;
            return e2;
          });
        }
        function V(n2, t2) {
          return H(n2, t2).or(X([]));
        }
        function H(n2, t2) {
          return _(n2), _(t2), J(n2, t2.then(n2).many(), function(n3, t3) {
            return [n3].concat(t3);
          });
        }
        function K(n2) {
          P16(n2);
          var t2 = "'" + n2 + "'";
          return e(function(r2, e2) {
            var u2 = e2 + n2.length, o2 = r2.slice(e2, u2);
            return o2 === n2 ? b(u2, o2) : x(e2, t2);
          });
        }
        function Q(n2, t2) {
          !(function(n3) {
            if (!(n3 instanceof RegExp)) throw new Error("not a regexp: " + n3);
            for (var t3 = G(n3), r3 = 0; r3 < t3.length; r3++) {
              var e2 = t3.charAt(r3);
              if ("i" !== e2 && "m" !== e2 && "u" !== e2 && "s" !== e2) throw new Error('unsupported regexp flag "' + e2 + '": ' + n3);
            }
          })(n2), arguments.length >= 2 ? O(t2) : t2 = 0;
          var r2 = (function(n3) {
            return RegExp("^(?:" + n3.source + ")", G(n3));
          })(n2), u2 = "" + n2;
          return e(function(n3, e2) {
            var o2 = r2.exec(n3.slice(e2));
            if (o2) {
              if (0 <= t2 && t2 <= o2.length) {
                var i2 = o2[0], a2 = o2[t2];
                return b(e2 + i2.length, a2);
              }
              return x(e2, "valid match group (0 to " + o2.length + ") in " + u2);
            }
            return x(e2, u2);
          });
        }
        function X(n2) {
          return e(function(t2, r2) {
            return b(r2, n2);
          });
        }
        function Y(n2) {
          return e(function(t2, r2) {
            return x(r2, n2);
          });
        }
        function Z(n2) {
          if (y(n2)) return e(function(t2, r2) {
            var e2 = n2._(t2, r2);
            return e2.index = r2, e2.value = "", e2;
          });
          if ("string" == typeof n2) return Z(K(n2));
          if (n2 instanceof RegExp) return Z(Q(n2));
          throw new Error("not a string, regexp, or parser: " + n2);
        }
        function $(n2) {
          return _(n2), e(function(t2, r2) {
            var e2 = n2._(t2, r2), u2 = t2.slice(r2, e2.index);
            return e2.status ? x(r2, 'not "' + u2 + '"') : b(r2, null);
          });
        }
        function nn(n2) {
          return k(n2), e(function(t2, r2) {
            var e2 = L(t2, r2);
            return r2 < t2.length && n2(e2) ? b(r2 + 1, e2) : x(r2, "a character/byte matching " + n2);
          });
        }
        function tn(n2, t2) {
          arguments.length < 2 && (t2 = n2, n2 = void 0);
          var r2 = e(function(n3, e2) {
            return r2._ = t2()._, r2._(n3, e2);
          });
          return n2 ? r2.desc(n2) : r2;
        }
        function rn() {
          return Y("fantasy-land/empty");
        }
        u.parse = function(n2) {
          if ("string" != typeof n2 && !w(n2)) throw new Error(".parse must be called with a string or Buffer as its argument");
          var t2, r2 = this.skip(an)._(n2, 0);
          return t2 = r2.status ? { status: true, value: r2.value } : { status: false, index: S(n2, r2.furthest), expected: r2.expected }, delete j[n2], t2;
        }, u.tryParse = function(n2) {
          var t2 = this.parse(n2);
          if (t2.status) return t2.value;
          var r2 = N(n2, t2), e2 = new Error(r2);
          throw e2.type = "ParsimmonError", e2.result = t2, e2;
        }, u.assert = function(n2, t2) {
          return this.chain(function(r2) {
            return n2(r2) ? X(r2) : Y(t2);
          });
        }, u.or = function(n2) {
          return T(this, n2);
        }, u.trim = function(n2) {
          return this.wrap(n2, n2);
        }, u.wrap = function(n2, t2) {
          return J(n2, this, t2, function(n3, t3) {
            return t3;
          });
        }, u.thru = function(n2) {
          return n2(this);
        }, u.then = function(n2) {
          return _(n2), C(this, n2).map(function(n3) {
            return n3[1];
          });
        }, u.many = function() {
          var n2 = this;
          return e(function(t2, r2) {
            for (var e2 = [], u2 = void 0; ; ) {
              if (!(u2 = B(n2._(t2, r2), u2)).status) return B(b(r2, e2), u2);
              if (r2 === u2.index) throw new Error("infinite loop detected in .many() parser --- calling .many() on a parser which can accept zero characters is usually the cause");
              r2 = u2.index, e2.push(u2.value);
            }
          });
        }, u.tieWith = function(n2) {
          return P16(n2), this.map(function(t2) {
            if ((function(n3) {
              if (!E(n3)) throw new Error("not an array: " + n3);
            })(t2), t2.length) {
              P16(t2[0]);
              for (var r2 = t2[0], e2 = 1; e2 < t2.length; e2++) P16(t2[e2]), r2 += n2 + t2[e2];
              return r2;
            }
            return "";
          });
        }, u.tie = function() {
          return this.tieWith("");
        }, u.times = function(n2, t2) {
          var r2 = this;
          return arguments.length < 2 && (t2 = n2), O(n2), O(t2), e(function(e2, u2) {
            for (var o2 = [], i2 = void 0, a2 = void 0, f2 = 0; f2 < n2; f2 += 1) {
              if (a2 = B(i2 = r2._(e2, u2), a2), !i2.status) return a2;
              u2 = i2.index, o2.push(i2.value);
            }
            for (; f2 < t2 && (a2 = B(i2 = r2._(e2, u2), a2), i2.status); f2 += 1) u2 = i2.index, o2.push(i2.value);
            return B(b(u2, o2), a2);
          });
        }, u.result = function(n2) {
          return this.map(function() {
            return n2;
          });
        }, u.atMost = function(n2) {
          return this.times(0, n2);
        }, u.atLeast = function(n2) {
          return J(this.times(n2), this.many(), function(n3, t2) {
            return n3.concat(t2);
          });
        }, u.map = function(n2) {
          k(n2);
          var t2 = this;
          return e(function(r2, e2) {
            var u2 = t2._(r2, e2);
            return u2.status ? B(b(u2.index, n2(u2.value)), u2) : u2;
          });
        }, u.contramap = function(n2) {
          k(n2);
          var t2 = this;
          return e(function(r2, e2) {
            var u2 = t2.parse(n2(r2.slice(e2)));
            return u2.status ? b(e2 + r2.length, u2.value) : u2;
          });
        }, u.promap = function(n2, t2) {
          return k(n2), k(t2), this.contramap(n2).map(t2);
        }, u.skip = function(n2) {
          return C(this, n2).map(function(n3) {
            return n3[0];
          });
        }, u.mark = function() {
          return J(en, this, en, function(n2, t2, r2) {
            return { start: n2, value: t2, end: r2 };
          });
        }, u.node = function(n2) {
          return J(en, this, en, function(t2, r2, e2) {
            return { name: n2, value: r2, start: t2, end: e2 };
          });
        }, u.sepBy = function(n2) {
          return V(this, n2);
        }, u.sepBy1 = function(n2) {
          return H(this, n2);
        }, u.lookahead = function(n2) {
          return this.skip(Z(n2));
        }, u.notFollowedBy = function(n2) {
          return this.skip($(n2));
        }, u.desc = function(n2) {
          E(n2) || (n2 = [n2]);
          var t2 = this;
          return e(function(r2, e2) {
            var u2 = t2._(r2, e2);
            return u2.status || (u2.expected = n2), u2;
          });
        }, u.fallback = function(n2) {
          return this.or(X(n2));
        }, u.ap = function(n2) {
          return J(n2, this, function(n3, t2) {
            return n3(t2);
          });
        }, u.chain = function(n2) {
          var t2 = this;
          return e(function(r2, e2) {
            var u2 = t2._(r2, e2);
            return u2.status ? B(n2(u2.value)._(r2, u2.index), u2) : u2;
          });
        }, u.concat = u.or, u.empty = rn, u.of = X, u["fantasy-land/ap"] = u.ap, u["fantasy-land/chain"] = u.chain, u["fantasy-land/concat"] = u.concat, u["fantasy-land/empty"] = u.empty, u["fantasy-land/of"] = u.of, u["fantasy-land/map"] = u.map;
        var en = e(function(n2, t2) {
          return b(t2, S(n2, t2));
        }), un = e(function(n2, t2) {
          return t2 >= n2.length ? x(t2, "any character/byte") : b(t2 + 1, L(n2, t2));
        }), on = e(function(n2, t2) {
          return b(n2.length, n2.slice(t2));
        }), an = e(function(n2, t2) {
          return t2 < n2.length ? x(t2, "EOF") : b(t2, null);
        }), fn = Q(/[0-9]/).desc("a digit"), cn = Q(/[0-9]*/).desc("optional digits"), sn = Q(/[a-z]/i).desc("a letter"), ln = Q(/[a-z]*/i).desc("optional letters"), hn = Q(/\s*/).desc("optional whitespace"), pn = Q(/\s+/).desc("whitespace"), dn = K("\r"), vn = K("\n"), gn = K("\r\n"), mn = T(gn, vn, dn).desc("newline"), yn = T(mn, an);
        e.all = on, e.alt = T, e.any = un, e.cr = dn, e.createLanguage = function(n2) {
          var t2 = {};
          for (var r2 in n2) ({}).hasOwnProperty.call(n2, r2) && (function(r3) {
            t2[r3] = tn(function() {
              return n2[r3](t2);
            });
          })(r2);
          return t2;
        }, e.crlf = gn, e.custom = function(n2) {
          return e(n2(b, x));
        }, e.digit = fn, e.digits = cn, e.empty = rn, e.end = yn, e.eof = an, e.fail = Y, e.formatError = N, e.index = en, e.isParser = y, e.lazy = tn, e.letter = sn, e.letters = ln, e.lf = vn, e.lookahead = Z, e.makeFailure = x, e.makeSuccess = b, e.newline = mn, e.noneOf = function(n2) {
          return nn(function(t2) {
            return n2.indexOf(t2) < 0;
          }).desc("none of '" + n2 + "'");
        }, e.notFollowedBy = $, e.of = X, e.oneOf = function(n2) {
          for (var t2 = n2.split(""), r2 = 0; r2 < t2.length; r2++) t2[r2] = "'" + t2[r2] + "'";
          return nn(function(t3) {
            return n2.indexOf(t3) >= 0;
          }).desc(t2);
        }, e.optWhitespace = hn, e.Parser = e, e.range = function(n2, t2) {
          return nn(function(r2) {
            return n2 <= r2 && r2 <= t2;
          }).desc(n2 + "-" + t2);
        }, e.regex = Q, e.regexp = Q, e.sepBy = V, e.sepBy1 = H, e.seq = C, e.seqMap = J, e.seqObj = function() {
          for (var n2, t2 = {}, r2 = 0, u2 = (n2 = arguments, Array.prototype.slice.call(n2)), o2 = u2.length, i2 = 0; i2 < o2; i2 += 1) {
            var a2 = u2[i2];
            if (!y(a2)) {
              if (E(a2) && 2 === a2.length && "string" == typeof a2[0] && y(a2[1])) {
                var f2 = a2[0];
                if (Object.prototype.hasOwnProperty.call(t2, f2)) throw new Error("seqObj: duplicate key " + f2);
                t2[f2] = true, r2++;
                continue;
              }
              throw new Error("seqObj arguments must be parsers or [string, parser] array pairs.");
            }
          }
          if (0 === r2) throw new Error("seqObj expects at least one named parser, found zero");
          return e(function(n3, t3) {
            for (var r3, e2 = {}, i3 = 0; i3 < o2; i3 += 1) {
              var a3, f3;
              if (E(u2[i3]) ? (a3 = u2[i3][0], f3 = u2[i3][1]) : (a3 = null, f3 = u2[i3]), !(r3 = B(f3._(n3, t3), r3)).status) return r3;
              a3 && (e2[a3] = r3.value), t3 = r3.index;
            }
            return B(b(t3, e2), r3);
          });
        }, e.string = K, e.succeed = X, e.takeWhile = function(n2) {
          return k(n2), e(function(t2, r2) {
            for (var e2 = r2; e2 < t2.length && n2(L(t2, e2)); ) e2++;
            return b(e2, t2.slice(r2, e2));
          });
        }, e.test = nn, e.whitespace = pn, e["fantasy-land/empty"] = rn, e["fantasy-land/of"] = X, e.Binary = { bitSeq: l, bitSeqObj: function(n2) {
          s();
          var t2 = {}, r2 = 0, e2 = a(function(n3) {
            if (E(n3)) {
              var e3 = n3;
              if (2 !== e3.length) throw new Error("[" + e3.join(", ") + "] should be length 2, got length " + e3.length);
              if (P16(e3[0]), O(e3[1]), Object.prototype.hasOwnProperty.call(t2, e3[0])) throw new Error("duplicate key in bitSeqObj: " + e3[0]);
              return t2[e3[0]] = true, r2++, e3;
            }
            return O(n3), [null, n3];
          }, n2);
          if (r2 < 1) throw new Error("bitSeqObj expects at least one named pair, got [" + n2.join(", ") + "]");
          var u2 = a(function(n3) {
            return n3[0];
          }, e2);
          return l(a(function(n3) {
            return n3[1];
          }, e2)).map(function(n3) {
            return i(function(n4, t3) {
              return null !== t3[0] && (n4[t3[0]] = t3[1]), n4;
            }, {}, a(function(t3, r3) {
              return [t3, n3[r3]];
            }, u2));
          });
        }, byte: function(n2) {
          if (s(), O(n2), n2 > 255) throw new Error("Value specified to byte constructor (" + n2 + "=0x" + n2.toString(16) + ") is larger in value than a single byte.");
          var t2 = (n2 > 15 ? "0x" : "0x0") + n2.toString(16);
          return e(function(r2, e2) {
            var u2 = L(r2, e2);
            return u2 === n2 ? b(e2 + 1, u2) : x(e2, t2);
          });
        }, buffer: function(n2) {
          return h("buffer", n2).map(function(n3) {
            return Buffer.from(n3);
          });
        }, encodedString: function(n2, t2) {
          return h("string", t2).map(function(t3) {
            return t3.toString(n2);
          });
        }, uintBE: d, uint8BE: d(1), uint16BE: d(2), uint32BE: d(4), uintLE: v, uint8LE: v(1), uint16LE: v(2), uint32LE: v(4), intBE: g, int8BE: g(1), int16BE: g(2), int32BE: g(4), intLE: m, int8LE: m(1), int16LE: m(2), int32LE: m(4), floatBE: h("floatBE", 4).map(function(n2) {
          return n2.readFloatBE(0);
        }), floatLE: h("floatLE", 4).map(function(n2) {
          return n2.readFloatLE(0);
        }), doubleBE: h("doubleBE", 8).map(function(n2) {
          return n2.readDoubleBE(0);
        }), doubleLE: h("doubleLE", 8).map(function(n2) {
          return n2.readDoubleLE(0);
        }) }, n.exports = e;
      }]);
    });
  }
});

// node_modules/dayjs/dayjs.min.js
var require_dayjs_min = __commonJS({
  "node_modules/dayjs/dayjs.min.js"(exports, module) {
    !(function(t, e) {
      "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).dayjs = e();
    })(exports, (function() {
      "use strict";
      var t = 1e3, e = 6e4, n = 36e5, r = "millisecond", i = "second", s = "minute", u = "hour", a = "day", o = "week", c = "month", f = "quarter", h = "year", d = "date", l = "Invalid Date", $ = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/, y = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g, M = { name: "en", weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"), ordinal: function(t2) {
        var e2 = ["th", "st", "nd", "rd"], n2 = t2 % 100;
        return "[" + t2 + (e2[(n2 - 20) % 10] || e2[n2] || e2[0]) + "]";
      } }, m = function(t2, e2, n2) {
        var r2 = String(t2);
        return !r2 || r2.length >= e2 ? t2 : "" + Array(e2 + 1 - r2.length).join(n2) + t2;
      }, v = { s: m, z: function(t2) {
        var e2 = -t2.utcOffset(), n2 = Math.abs(e2), r2 = Math.floor(n2 / 60), i2 = n2 % 60;
        return (e2 <= 0 ? "+" : "-") + m(r2, 2, "0") + ":" + m(i2, 2, "0");
      }, m: function t2(e2, n2) {
        if (e2.date() < n2.date()) return -t2(n2, e2);
        var r2 = 12 * (n2.year() - e2.year()) + (n2.month() - e2.month()), i2 = e2.clone().add(r2, c), s2 = n2 - i2 < 0, u2 = e2.clone().add(r2 + (s2 ? -1 : 1), c);
        return +(-(r2 + (n2 - i2) / (s2 ? i2 - u2 : u2 - i2)) || 0);
      }, a: function(t2) {
        return t2 < 0 ? Math.ceil(t2) || 0 : Math.floor(t2);
      }, p: function(t2) {
        return { M: c, y: h, w: o, d: a, D: d, h: u, m: s, s: i, ms: r, Q: f }[t2] || String(t2 || "").toLowerCase().replace(/s$/, "");
      }, u: function(t2) {
        return void 0 === t2;
      } }, g = "en", D = {};
      D[g] = M;
      var p = "$isDayjsObject", S = function(t2) {
        return t2 instanceof _ || !(!t2 || !t2[p]);
      }, w = function t2(e2, n2, r2) {
        var i2;
        if (!e2) return g;
        if ("string" == typeof e2) {
          var s2 = e2.toLowerCase();
          D[s2] && (i2 = s2), n2 && (D[s2] = n2, i2 = s2);
          var u2 = e2.split("-");
          if (!i2 && u2.length > 1) return t2(u2[0]);
        } else {
          var a2 = e2.name;
          D[a2] = e2, i2 = a2;
        }
        return !r2 && i2 && (g = i2), i2 || !r2 && g;
      }, O = function(t2, e2) {
        if (S(t2)) return t2.clone();
        var n2 = "object" == typeof e2 ? e2 : {};
        return n2.date = t2, n2.args = arguments, new _(n2);
      }, b = v;
      b.l = w, b.i = S, b.w = function(t2, e2) {
        return O(t2, { locale: e2.$L, utc: e2.$u, x: e2.$x, $offset: e2.$offset });
      };
      var _ = (function() {
        function M2(t2) {
          this.$L = w(t2.locale, null, true), this.parse(t2), this.$x = this.$x || t2.x || {}, this[p] = true;
        }
        var m2 = M2.prototype;
        return m2.parse = function(t2) {
          this.$d = (function(t3) {
            var e2 = t3.date, n2 = t3.utc;
            if (null === e2) return /* @__PURE__ */ new Date(NaN);
            if (b.u(e2)) return /* @__PURE__ */ new Date();
            if (e2 instanceof Date) return new Date(e2);
            if ("string" == typeof e2 && !/Z$/i.test(e2)) {
              var r2 = e2.match($);
              if (r2) {
                var i2 = r2[2] - 1 || 0, s2 = (r2[7] || "0").substring(0, 3);
                return n2 ? new Date(Date.UTC(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2)) : new Date(r2[1], i2, r2[3] || 1, r2[4] || 0, r2[5] || 0, r2[6] || 0, s2);
              }
            }
            return new Date(e2);
          })(t2), this.init();
        }, m2.init = function() {
          var t2 = this.$d;
          this.$y = t2.getFullYear(), this.$M = t2.getMonth(), this.$D = t2.getDate(), this.$W = t2.getDay(), this.$H = t2.getHours(), this.$m = t2.getMinutes(), this.$s = t2.getSeconds(), this.$ms = t2.getMilliseconds();
        }, m2.$utils = function() {
          return b;
        }, m2.isValid = function() {
          return !(this.$d.toString() === l);
        }, m2.isSame = function(t2, e2) {
          var n2 = O(t2);
          return this.startOf(e2) <= n2 && n2 <= this.endOf(e2);
        }, m2.isAfter = function(t2, e2) {
          return O(t2) < this.startOf(e2);
        }, m2.isBefore = function(t2, e2) {
          return this.endOf(e2) < O(t2);
        }, m2.$g = function(t2, e2, n2) {
          return b.u(t2) ? this[e2] : this.set(n2, t2);
        }, m2.unix = function() {
          return Math.floor(this.valueOf() / 1e3);
        }, m2.valueOf = function() {
          return this.$d.getTime();
        }, m2.startOf = function(t2, e2) {
          var n2 = this, r2 = !!b.u(e2) || e2, f2 = b.p(t2), l2 = function(t3, e3) {
            var i2 = b.w(n2.$u ? Date.UTC(n2.$y, e3, t3) : new Date(n2.$y, e3, t3), n2);
            return r2 ? i2 : i2.endOf(a);
          }, $2 = function(t3, e3) {
            return b.w(n2.toDate()[t3].apply(n2.toDate("s"), (r2 ? [0, 0, 0, 0] : [23, 59, 59, 999]).slice(e3)), n2);
          }, y2 = this.$W, M3 = this.$M, m3 = this.$D, v2 = "set" + (this.$u ? "UTC" : "");
          switch (f2) {
            case h:
              return r2 ? l2(1, 0) : l2(31, 11);
            case c:
              return r2 ? l2(1, M3) : l2(0, M3 + 1);
            case o:
              var g2 = this.$locale().weekStart || 0, D2 = (y2 < g2 ? y2 + 7 : y2) - g2;
              return l2(r2 ? m3 - D2 : m3 + (6 - D2), M3);
            case a:
            case d:
              return $2(v2 + "Hours", 0);
            case u:
              return $2(v2 + "Minutes", 1);
            case s:
              return $2(v2 + "Seconds", 2);
            case i:
              return $2(v2 + "Milliseconds", 3);
            default:
              return this.clone();
          }
        }, m2.endOf = function(t2) {
          return this.startOf(t2, false);
        }, m2.$set = function(t2, e2) {
          var n2, o2 = b.p(t2), f2 = "set" + (this.$u ? "UTC" : ""), l2 = (n2 = {}, n2[a] = f2 + "Date", n2[d] = f2 + "Date", n2[c] = f2 + "Month", n2[h] = f2 + "FullYear", n2[u] = f2 + "Hours", n2[s] = f2 + "Minutes", n2[i] = f2 + "Seconds", n2[r] = f2 + "Milliseconds", n2)[o2], $2 = o2 === a ? this.$D + (e2 - this.$W) : e2;
          if (o2 === c || o2 === h) {
            var y2 = this.clone().set(d, 1);
            y2.$d[l2]($2), y2.init(), this.$d = y2.set(d, Math.min(this.$D, y2.daysInMonth())).$d;
          } else l2 && this.$d[l2]($2);
          return this.init(), this;
        }, m2.set = function(t2, e2) {
          return this.clone().$set(t2, e2);
        }, m2.get = function(t2) {
          return this[b.p(t2)]();
        }, m2.add = function(r2, f2) {
          var d2, l2 = this;
          r2 = Number(r2);
          var $2 = b.p(f2), y2 = function(t2) {
            var e2 = O(l2);
            return b.w(e2.date(e2.date() + Math.round(t2 * r2)), l2);
          };
          if ($2 === c) return this.set(c, this.$M + r2);
          if ($2 === h) return this.set(h, this.$y + r2);
          if ($2 === a) return y2(1);
          if ($2 === o) return y2(7);
          var M3 = (d2 = {}, d2[s] = e, d2[u] = n, d2[i] = t, d2)[$2] || 1, m3 = this.$d.getTime() + r2 * M3;
          return b.w(m3, this);
        }, m2.subtract = function(t2, e2) {
          return this.add(-1 * t2, e2);
        }, m2.format = function(t2) {
          var e2 = this, n2 = this.$locale();
          if (!this.isValid()) return n2.invalidDate || l;
          var r2 = t2 || "YYYY-MM-DDTHH:mm:ssZ", i2 = b.z(this), s2 = this.$H, u2 = this.$m, a2 = this.$M, o2 = n2.weekdays, c2 = n2.months, f2 = n2.meridiem, h2 = function(t3, n3, i3, s3) {
            return t3 && (t3[n3] || t3(e2, r2)) || i3[n3].slice(0, s3);
          }, d2 = function(t3) {
            return b.s(s2 % 12 || 12, t3, "0");
          }, $2 = f2 || function(t3, e3, n3) {
            var r3 = t3 < 12 ? "AM" : "PM";
            return n3 ? r3.toLowerCase() : r3;
          };
          return r2.replace(y, (function(t3, r3) {
            return r3 || (function(t4) {
              switch (t4) {
                case "YY":
                  return String(e2.$y).slice(-2);
                case "YYYY":
                  return b.s(e2.$y, 4, "0");
                case "M":
                  return a2 + 1;
                case "MM":
                  return b.s(a2 + 1, 2, "0");
                case "MMM":
                  return h2(n2.monthsShort, a2, c2, 3);
                case "MMMM":
                  return h2(c2, a2);
                case "D":
                  return e2.$D;
                case "DD":
                  return b.s(e2.$D, 2, "0");
                case "d":
                  return String(e2.$W);
                case "dd":
                  return h2(n2.weekdaysMin, e2.$W, o2, 2);
                case "ddd":
                  return h2(n2.weekdaysShort, e2.$W, o2, 3);
                case "dddd":
                  return o2[e2.$W];
                case "H":
                  return String(s2);
                case "HH":
                  return b.s(s2, 2, "0");
                case "h":
                  return d2(1);
                case "hh":
                  return d2(2);
                case "a":
                  return $2(s2, u2, true);
                case "A":
                  return $2(s2, u2, false);
                case "m":
                  return String(u2);
                case "mm":
                  return b.s(u2, 2, "0");
                case "s":
                  return String(e2.$s);
                case "ss":
                  return b.s(e2.$s, 2, "0");
                case "SSS":
                  return b.s(e2.$ms, 3, "0");
                case "Z":
                  return i2;
              }
              return null;
            })(t3) || i2.replace(":", "");
          }));
        }, m2.utcOffset = function() {
          return 15 * -Math.round(this.$d.getTimezoneOffset() / 15);
        }, m2.diff = function(r2, d2, l2) {
          var $2, y2 = this, M3 = b.p(d2), m3 = O(r2), v2 = (m3.utcOffset() - this.utcOffset()) * e, g2 = this - m3, D2 = function() {
            return b.m(y2, m3);
          };
          switch (M3) {
            case h:
              $2 = D2() / 12;
              break;
            case c:
              $2 = D2();
              break;
            case f:
              $2 = D2() / 3;
              break;
            case o:
              $2 = (g2 - v2) / 6048e5;
              break;
            case a:
              $2 = (g2 - v2) / 864e5;
              break;
            case u:
              $2 = g2 / n;
              break;
            case s:
              $2 = g2 / e;
              break;
            case i:
              $2 = g2 / t;
              break;
            default:
              $2 = g2;
          }
          return l2 ? $2 : b.a($2);
        }, m2.daysInMonth = function() {
          return this.endOf(c).$D;
        }, m2.$locale = function() {
          return D[this.$L];
        }, m2.locale = function(t2, e2) {
          if (!t2) return this.$L;
          var n2 = this.clone(), r2 = w(t2, e2, true);
          return r2 && (n2.$L = r2), n2;
        }, m2.clone = function() {
          return b.w(this.$d, this);
        }, m2.toDate = function() {
          return new Date(this.valueOf());
        }, m2.toJSON = function() {
          return this.isValid() ? this.toISOString() : null;
        }, m2.toISOString = function() {
          return this.$d.toISOString();
        }, m2.toString = function() {
          return this.$d.toUTCString();
        }, M2;
      })(), k = _.prototype;
      return O.prototype = k, [["$ms", r], ["$s", i], ["$m", s], ["$H", u], ["$W", a], ["$M", c], ["$y", h], ["$D", d]].forEach((function(t2) {
        k[t2[1]] = function(e2) {
          return this.$g(e2, t2[0], t2[1]);
        };
      })), O.extend = function(t2, e2) {
        return t2.$i || (t2(e2, _, O), t2.$i = true), O;
      }, O.locale = w, O.isDayjs = S, O.unix = function(t2) {
        return O(1e3 * t2);
      }, O.en = D[g], O.Ls = D, O.p = {}, O;
    }));
  }
});

// ../../.my_agent_remote/undercrow__eraJS/build/csv/index.js
var Papa = __toESM(require_papaparse_min());

// ../../.my_agent_remote/undercrow__eraJS/build/assert.js
function cond(value, message) {
  if (!value) {
    throw new Error(message);
  }
}
function nonNull(value, message) {
  cond(value != null, message);
}
function bigint(value, message) {
  cond(typeof value === "bigint", message);
}
function number(value, message) {
  cond(typeof value === "number" && !isNaN(value), message);
}
function string(value, message) {
  cond(typeof value === "string", message);
}
function array(value, message) {
  cond(Array.isArray(value), message);
}
function bigintArray(value, message) {
  array(value, message);
  for (let i = 0; i < value.length; ++i) {
    bigint(value[i], message);
  }
}
function numArray(value, message) {
  array(value, message);
  for (let i = 0; i < value.length; ++i) {
    number(value[i], message);
  }
}
function strArray(value, message) {
  cond(Array.isArray(value), message);
  for (let i = 0; i < value.length; ++i) {
    string(value[i], message);
  }
}
function strArray2D(value, message) {
  array(value, message);
  for (let i = 0; i < value.length; ++i) {
    strArray(value[i], message);
  }
}
function strArray3D(value, message) {
  array(value, message);
  for (let i = 0; i < value.length; ++i) {
    strArray2D(value[i], message);
  }
}

// ../../.my_agent_remote/undercrow__eraJS/build/csv/character.js
function parse(fileName, rows) {
  const template = {
    base: /* @__PURE__ */ new Map(),
    maxBase: /* @__PURE__ */ new Map(),
    mark: /* @__PURE__ */ new Map(),
    exp: /* @__PURE__ */ new Map(),
    abl: /* @__PURE__ */ new Map(),
    talent: /* @__PURE__ */ new Map(),
    relation: /* @__PURE__ */ new Map(),
    cflag: /* @__PURE__ */ new Map(),
    equip: /* @__PURE__ */ new Map(),
    juel: /* @__PURE__ */ new Map(),
    cstr: /* @__PURE__ */ new Map()
  };
  for (const row of rows) {
    switch (row[0]) {
      case "\u756A\u53F7": {
        const no = parseInt(row[1]);
        number(no, `NO in ${fileName} should be an integer`);
        template.no = no;
        break;
      }
      case "\u540D\u524D": {
        template.name = row[1];
        break;
      }
      case "\u547C\u3073\u540D": {
        template.callname = row[1];
        break;
      }
      case "\u3042\u3060\u540D": {
        template.nickname = row[1];
        break;
      }
      case "\u4E3B\u4EBA\u306E\u547C\u3073\u65B9": {
        template.mastername = row[1];
        break;
      }
      case "\u57FA\u790E": {
        const index = parseInt(row[1]);
        number(index, `Base index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        number(value, `Base value in ${fileName} should be an integer`);
        template.base.set(index, value);
        template.maxBase.set(index, value);
        break;
      }
      case "\u523B\u5370": {
        const index = parseInt(row[1]);
        number(index, `Mark index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        template.mark.set(index, value);
        break;
      }
      case "\u7D4C\u9A13": {
        const index = parseInt(row[1]);
        number(index, `Exp index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        number(value, `Exp value in ${fileName} should be an integer`);
        template.exp.set(index, value);
        break;
      }
      case "\u80FD\u529B": {
        const index = parseInt(row[1]);
        number(index, `Abl index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        number(value, `Abl value in ${fileName} should be an integer`);
        template.abl.set(index, value);
        break;
      }
      case "\u7D20\u8CEA": {
        const index = parseInt(row[1]);
        number(index, `Talent index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        number(value, `Talent value in ${fileName} should be an integer`);
        template.talent.set(index, value);
        break;
      }
      case "\u76F8\u6027": {
        const index = parseInt(row[1]);
        number(index, `Relation index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        number(value, `Relation value in ${fileName} should be an integer`);
        template.relation.set(index, value);
        break;
      }
      case "\u30D5\u30E9\u30B0": {
        const index = parseInt(row[1]);
        number(index, `Flag index in ${fileName} should be an integer`);
        const value = parseInt(row[2]);
        number(value, `Flag value in ${fileName} should be an integer`);
        template.cflag.set(index, value);
        break;
      }
      case "\u88C5\u7740\u7269": {
        const index = parseInt(row[1]);
        number(index, `Equip index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        number(value, `Equip value in ${fileName} should be an integer`);
        template.equip.set(index, value);
        break;
      }
      case "\u73E0": {
        const index = parseInt(row[1]);
        number(index, `Juel index in ${fileName} should be an integer`);
        let value;
        if (row[2] != null && row[2] !== "") {
          value = parseInt(row[2]);
        } else {
          value = 1;
        }
        number(value, `Juel value in ${fileName} should be an integer`);
        template.juel.set(index, value);
        break;
      }
      case "CSTR": {
        const index = parseInt(row[1]);
        number(index, `Flag index in ${fileName} should be an integer`);
        const value = row[2];
        template.cstr.set(index, value);
        break;
      }
    }
  }
  cond(template.no != null, `ID should be defined in ${fileName}`);
  if (template.name == null) {
    template.name = "";
  }
  if (template.callname == null) {
    template.callname = "";
  }
  if (template.nickname == null) {
    template.nickname = "";
  }
  if (template.mastername == null) {
    template.mastername = "";
  }
  return template;
}

// ../../.my_agent_remote/undercrow__eraJS/build/csv/gamebase.js
function parse2(fileName, rows) {
  const result = {};
  for (const row of rows) {
    switch (row[0]) {
      case "\u4F5C\u8005":
        result.author = row[1];
        break;
      case "\u8FFD\u52A0\u60C5\u5831":
        result.info = row[1];
        break;
      case "\u88FD\u4F5C\u5E74":
        result.year = row[1];
        break;
      case "\u30BF\u30A4\u30C8\u30EB":
        result.title = row[1];
        break;
      case "\u30B3\u30FC\u30C9": {
        const rawCode = row[1];
        const code = rawCode == null || rawCode.trim() === "" ? 0 : parseInt(rawCode);
        number(code, `Code in ${fileName} should be an integer`);
        result.code = code;
        break;
      }
      case "\u30D0\u30FC\u30B8\u30E7\u30F3": {
        const rawVersion = row[1];
        const version = rawVersion == null || rawVersion.trim() === "" ? 0 : parseInt(rawVersion);
        number(version, `Version in ${fileName} should be an integer`);
        result.version = version;
        break;
      }
      default:
        break;
    }
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/csv/item.js
function parse3(fileName, rows) {
  const result = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const index = parseInt(row[0]);
    number(index, `Index value in ${fileName} should be an integer`);
    result.set(index, {
      name: row[1] ?? "",
      price: Number(row[2] ?? "0")
    });
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/csv/varsize.js
function parse4(fileName, rows) {
  const result = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const name = row[0];
    const size = row.slice(1).map((cell) => Number(cell));
    numArray(size, `Size of variable in ${fileName} should be an integer`);
    if (size.every((s) => s >= 0)) {
      result.set(name, size);
    }
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/csv/index.js
function parseStringMap(fileName, rows) {
  const result = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const index = parseInt(row[0]);
    number(index, `Index value in ${fileName} should be an integer`);
    result.set(index, row[1] ?? "");
  }
  return result;
}
function parseCSV(content) {
  function getTable(name) {
    if (!content.has(name)) {
      return [];
    }
    const raw = content.get(name);
    const normalized = raw.replace(/\r/g, "").split("\n");
    const stripped = normalized.map((line) => /^[^;]*/.exec(line)[0]);
    const filtered = stripped.map((line) => line.trim()).filter((line) => line.length > 0);
    const parsed = Papa.parse(filtered.join("\n"), {
      delimiter: ",",
      skipEmptyLines: true
    });
    return parsed.data;
  }
  const gamebase = parse2("GAMEBASE.CSV", getTable("GAMEBASE.CSV"));
  const abl = parseStringMap("ABL.CSV", getTable("ABL.CSV"));
  const exp = parseStringMap("EXP.CSV", getTable("EXP.CSV"));
  const talent = parseStringMap("TALENT.CSV", getTable("TALENT.CSV"));
  const palam = parseStringMap("PALAM.CSV", getTable("PALAM.CSV"));
  const train = parseStringMap("TRAIN.CSV", getTable("TRAIN.CSV"));
  const mark = parseStringMap("MARK.CSV", getTable("MARK.CSV"));
  const item = parse3("ITEM.CSV", getTable("ITEM.CSV"));
  const base = parseStringMap("BASE.CSV", getTable("BASE.CSV"));
  const source = parseStringMap("SOURCE.CSV", getTable("SOURCE.CSV"));
  const ex = parseStringMap("EX.CSV", getTable("EX.CSV"));
  const str = parseStringMap("STR.CSV", getTable("STR.CSV"));
  const equip = parseStringMap("EQUIP.CSV", getTable("EQUIP.CSV"));
  const tequip = parseStringMap("TEQUIP.CSV", getTable("TEQUIP.CSV"));
  const flag = parseStringMap("FLAG.CSV", getTable("FLAG.CSV"));
  const tflag = parseStringMap("TFLAG.CSV", getTable("TFLAG.CSV"));
  const cflag = parseStringMap("CFLAG.CSV", getTable("CFLAG.CSV"));
  const tcvar = parseStringMap("TCVAR.CSV", getTable("TCVAR.CSV"));
  const cstr = parseStringMap("CSTR.CSV", getTable("CSTR.CSV"));
  const stain = parseStringMap("STAIN.CSV", getTable("STAIN.CSV"));
  const cdflag1 = parseStringMap("CDFLAG1.CSV", getTable("CDFLAG1.CSV"));
  const cdflag2 = parseStringMap("CDFLAG2.CSV", getTable("CDFLAG2.CSV"));
  const strName = parseStringMap("STRNAME.CSV", getTable("STRNAME.CSV"));
  const tstr = parseStringMap("TSTR.CSV", getTable("TSTR.CSV"));
  const saveStr = parseStringMap("SAVESTR.CSV", getTable("SAVESTR.CSV"));
  const global = parseStringMap("GLOBAL.CSV", getTable("GLOBAL.CSV"));
  const globalS = parseStringMap("GLOBALS.CSV", getTable("GLOBALS.CSV"));
  const varSize2 = parse4("VARIABLESIZE.CSV", getTable("VARIABLESIZE.CSV"));
  const character = /* @__PURE__ */ new Map();
  for (const name of content.keys()) {
    if (name.startsWith("CHARA") && name.endsWith(".CSV")) {
      const template = parse(name, getTable(name));
      character.set(template.no, template);
    }
  }
  return {
    gamebase,
    character,
    abl,
    exp,
    talent,
    palam,
    train,
    mark,
    item,
    base,
    source,
    ex,
    str,
    equip,
    tequip,
    flag,
    tflag,
    cflag,
    tcvar,
    cstr,
    stain,
    cdflag1,
    cdflag2,
    strName,
    tstr,
    saveStr,
    global,
    globalS,
    varSize: varSize2
  };
}

// ../../.my_agent_remote/undercrow__eraJS/build/parser/erb.js
var import_parsimmon14 = __toESM(require_parsimmon_umd_min());

// ../../.my_agent_remote/undercrow__eraJS/build/property/order.js
var Order = class {
  order;
  constructor(order) {
    this.order = order;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/variable.js
function resolveNameIndex(vm2, name, key) {
  if (key === "")
    return key;
  const nameVar = vm2.globalMap.get(name + "NAME");
  if (nameVar != null && Array.isArray(nameVar.value)) {
    const index = nameVar.value.indexOf(key);
    if (index >= 0)
      return BigInt(index);
  }
  const konst = vm2.globalMap.get(key);
  if (konst != null && typeof konst.value === "bigint")
    return konst.value;
  return key;
}
var Variable = class {
  name;
  index;
  scope;
  constructor(name, index, scope) {
    this.name = name.toUpperCase();
    this.index = index;
    this.scope = scope;
  }
  getCell(vm2) {
    return vm2.getValue(this.name, this.scope);
  }
  async reduce(vm2) {
    if (vm2.macroMap.has(this.name)) {
      if (this.index.length !== 0) {
        throw new Error("Macro cannot be indexed");
      }
      const expr2 = vm2.macroMap.get(this.name)?.expr;
      if (expr2 == null) {
        throw new Error("Empty macro cannot be referenced");
      }
      return expr2.reduce(vm2);
    } else {
      return this.getCell(vm2).get(vm2, await this.reduceIndex(vm2));
    }
  }
  async reduceIndex(vm2) {
    if (this.index.length !== 0) {
      const result = [];
      for (const i of this.index) {
        let value = await i.reduce(vm2);
        if (typeof value === "string") {
          value = resolveNameIndex(vm2, this.name, value);
        }
        bigint(value, "Index of variable should be an integer");
        result.push(Number(value));
      }
      return result;
    } else {
      return [];
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/fn.js
var Fn = class _Fn {
  static START_OF_FN = "@@START";
  name;
  arg;
  property;
  thunk;
  constructor(name, arg, property, thunk) {
    this.name = name;
    this.arg = arg;
    this.thunk = thunk;
    this.property = property;
    this.thunk.labelMap.set(_Fn.START_OF_FN, 0);
  }
  isFirst() {
    return this.property.some((p) => p instanceof Order && p.order === "PRI");
  }
  isLast() {
    return this.property.some((p) => p instanceof Order && p.order === "LATER");
  }
  async *run(vm2, arg) {
    await vm2.pushContext(this);
    for (let i = 0; i < this.arg.length; ++i) {
      const [argDest, argDef] = this.arg[i];
      const dest = argDest.getCell(vm2);
      const index = await argDest.reduceIndex(vm2);
      if (dest.type === "number") {
        let value;
        if (arg[i] != null) {
          value = arg[i];
        } else if (argDef != null) {
          if (argDef instanceof Variable) {
            value = await argDef.reduce(vm2);
          } else {
            value = argDef;
          }
        } else {
          value = 0n;
        }
        bigint(value, "Value for number argument must be a number");
        dest.set(vm2, value, index);
      } else {
        let value;
        if (arg[i] != null) {
          value = arg[i];
        } else if (argDef != null) {
          if (argDef instanceof Variable) {
            value = await argDef.reduce(vm2);
          } else {
            value = argDef;
          }
        } else {
          value = "";
        }
        string(value, "Value for string argument must be a string");
        dest.set(vm2, value, index);
      }
    }
    const result = yield* this.thunk.run(vm2);
    vm2.popContext();
    return result;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/index.js
var import_parsimmon6 = __toESM(require_parsimmon_umd_min());

// ../../.my_agent_remote/undercrow__eraJS/build/error.js
var EraJSError = class extends Error {
  line;
  trace;
  constructor(message, line, trace) {
    super(message);
    this.line = line;
    this.trace = trace;
  }
};
function parser(message) {
  return new Error(`Parser error found: ${message}`);
}
function notFound(type, name) {
  return new Error(`${type} ${name} does not exist`);
}
function invalidIndex(type, name, index) {
  return new Error(`${type} variable ${name} cannot be indexed by [${index.join(",")}]`);
}
function notImpl(target) {
  return new Error(`${target} is not implemented yet`);
}
function misc(message) {
  return new Error(`Runtime error found: ${message}`);
}
function internal(message) {
  return new Error(`Unexpected internal error found: ${message}`);
}

// ../../.my_agent_remote/undercrow__eraJS/build/parser/const.js
var import_parsimmon = __toESM(require_parsimmon_umd_min());
var SPECIAL_CHAR = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "=",
  "!",
  "<",
  ">",
  "|",
  "&",
  "^",
  "~",
  "?",
  "#",
  "(",
  ")",
  "{",
  "}",
  "[",
  "]",
  ".",
  ",",
  ":",
  "$",
  "\\",
  "'",
  '"',
  "@",
  ";",
  // eslint-disable-next-line no-irregular-whitespace
  " ",
  "	",
  "\u3000",
  "\r",
  "\n"
];
var WS = import_parsimmon.default.oneOf([" ", "	", "\u3000"].join(""));
var WS0 = WS.many().map(() => null);
var WS1 = WS.atLeast(1).map(() => null);
var Identifier = import_parsimmon.default.noneOf(SPECIAL_CHAR.join("")).atLeast(1).tie();
var UInt = import_parsimmon.default.alt(import_parsimmon.default.seqMap(import_parsimmon.default.regex(/[0-9]+p/i), import_parsimmon.default.regex(/[0-9]+/), (base, exponent) => parseInt(base) ** parseInt(exponent)), import_parsimmon.default.regex(/0b/i).then(import_parsimmon.default.regex(/[0-1]+/)).map((val) => parseInt(val, 2)), import_parsimmon.default.regex(/0x/i).then(import_parsimmon.default.regex(/[0-9a-fA-F]+/)).map((val) => parseInt(val, 16)), import_parsimmon.default.regex(/[0-9]+/).map((val) => parseInt(val, 10)));
var Int = import_parsimmon.default.alt(import_parsimmon.default.string("+").then(UInt), import_parsimmon.default.string("-").then(UInt).map((val) => -val), UInt);
var UFloat = import_parsimmon.default.regex(/[0-9]+\.[0-9]+/).map((val) => parseFloat(val));
var Float = import_parsimmon.default.alt(import_parsimmon.default.string("+").then(UFloat), import_parsimmon.default.string("-").then(UFloat).map((val) => -val), UFloat, Int);
var Str = char('"').many().tie().trim(import_parsimmon.default.string('"'));
function char(...exclude) {
  return import_parsimmon.default.notFollowedBy(import_parsimmon.default.alt(...exclude.map((c) => import_parsimmon.default.string(c)))).then(import_parsimmon.default.alt(import_parsimmon.default.string("\\").then(import_parsimmon.default.alt(
    import_parsimmon.default.string("s").map(() => " "),
    // eslint-disable-next-line no-irregular-whitespace
    import_parsimmon.default.string("S").map(() => "\u3000"),
    import_parsimmon.default.string("t").map(() => "	"),
    import_parsimmon.default.string("n").map(() => "\n"),
    import_parsimmon.default.any
  )), import_parsimmon.default.any));
}
function charSeq(...exclude) {
  return char(...exclude).atLeast(1).tie();
}

// ../../.my_agent_remote/undercrow__eraJS/build/parser/expr.js
var import_parsimmon3 = __toESM(require_parsimmon_umd_min());

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/binary.js
var Binary = class {
  left;
  right;
  op;
  constructor(op, left, right) {
    this.op = op;
    this.left = left;
    this.right = right;
  }
  async reduce(vm2) {
    const left = await this.left.reduce(vm2);
    switch (this.op) {
      case "&&":
        if (typeof left === "bigint" && left === 0n) {
          return 0n;
        }
        break;
      case "!&":
        if (typeof left === "bigint" && left === 0n) {
          return 1n;
        }
        break;
      case "||":
        if (typeof left === "bigint" && left === 1n) {
          return 1n;
        }
        break;
      case "!|":
        if (typeof left === "bigint" && left === 1n) {
          return 0n;
        }
        break;
      default: {
      }
    }
    const right = await this.right.reduce(vm2);
    if (typeof left === "bigint" && typeof right === "bigint") {
      switch (this.op) {
        case "*":
          return left * right;
        case "/":
          return left / right;
        case "%":
          return left % right;
        case "+":
          return left + right;
        case "-":
          return left - right;
        // eslint-disable-next-line no-bitwise
        case "<<":
          return left << right;
        // eslint-disable-next-line no-bitwise
        case ">>":
          return left >> right;
        case "<":
          return left < right ? 1n : 0n;
        case "<=":
          return left <= right ? 1n : 0n;
        case ">":
          return left > right ? 1n : 0n;
        case ">=":
          return left >= right ? 1n : 0n;
        case "==":
          return left === right ? 1n : 0n;
        case "!=":
          return left !== right ? 1n : 0n;
        // eslint-disable-next-line no-bitwise
        case "&":
          return left & right;
        // eslint-disable-next-line no-bitwise
        case "|":
          return left | right;
        // eslint-disable-next-line no-bitwise
        case "^":
          return left ^ right;
        case "&&":
          return left !== 0n && right !== 0n ? 1n : 0n;
        case "!&":
          return !(left !== 0n && right !== 0n) ? 1n : 0n;
        case "||":
          return left !== 0n || right !== 0n ? 1n : 0n;
        case "!|":
          return !(left !== 0n || right !== 0n) ? 1n : 0n;
        case "^^":
          return left !== 0n !== (right !== 0n) ? 1n : 0n;
      }
    } else if (typeof left === "string" && typeof right === "string") {
      switch (this.op) {
        case "+":
          return left + right;
        case "<":
          return left < right ? 1n : 0n;
        case "<=":
          return left <= right ? 1n : 0n;
        case ">":
          return left > right ? 1n : 0n;
        case ">=":
          return left >= right ? 1n : 0n;
        case "==":
          return left === right ? 1n : 0n;
        case "!=":
          return left !== right ? 1n : 0n;
        default: {
        }
      }
    } else if (typeof left === "string" && typeof right === "bigint") {
      switch (this.op) {
        case "*":
          return left.repeat(Number(right));
        default: {
        }
      }
    }
    throw new Error(`Type of operands for ${this.op} is invalid`);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/const.js
var Const = class {
  value;
  constructor(value) {
    this.value = value;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async reduce(_vm) {
    return this.value;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/form.js
var Form = class {
  expr;
  constructor(expr2) {
    const merged = [];
    for (const e of expr2) {
      const last = merged[merged.length - 1];
      if (last != null && typeof last.value === "string" && typeof e.value === "string") {
        last.value += e.value;
      } else {
        merged.push(e);
      }
    }
    this.expr = merged;
  }
  async reduce(vm2) {
    let result = "";
    for (const expr2 of this.expr) {
      let value;
      if (typeof expr2.value === "string") {
        value = expr2.value;
      } else {
        const reduced = await expr2.value.reduce(vm2);
        switch (typeof reduced) {
          case "string":
            value = reduced;
            break;
          case "bigint":
            value = reduced.toString();
            break;
        }
      }
      if (expr2.display != null) {
        const display = await expr2.display.reduce(vm2);
        bigint(display, "Display size of form string should be an integer");
        if (expr2.align == null || expr2.align === "LEFT") {
          value = value.padStart(Number(display), " ");
        } else {
          value = value.padEnd(Number(display), " ");
        }
      }
      result += value;
    }
    return result;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/abs.js
async function abs(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st argument of ABS must a be number");
  return value >= 0 ? value : -value;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/barstr.js
async function barStr(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st argument of BAR must be a number");
  const max2 = await arg[1].reduce(vm2);
  bigint(max2, "2nd argument of BAR must be a number");
  const length = await arg[2].reduce(vm2);
  bigint(length, "3rd argument of BAR must be a number");
  const filled = length * value / max2;
  return "[" + "*".repeat(Number(filled)) + ".".repeat(Number(length - filled)) + "]";
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvabl.js
async function csvAbl(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVABL must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVABL must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.abl.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvbase.js
async function csvBase(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVBASE must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVBASE must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.base.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvcallname.js
async function csvCallname(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVCALLNAME must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.callname;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvcflag.js
async function csvCflag(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVCFLAG must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVCFLAG must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.cflag.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvcstr.js
async function csvCstr(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVCSTR must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVCSTR must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.cstr.get(Number(index)) ?? "";
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvequip.js
async function csvEquip(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVEQUIP must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVEQUIP must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.equip.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvexp.js
async function csvExp(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVEXP must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVEXP must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.exp.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvjuel.js
async function csvJuel(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVJUEL must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVJUEL must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.juel.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvmark.js
async function csvMark(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVMARK must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVMARK must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.mark.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvmastername.js
async function csvMastername(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVMASTERNAME must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.mastername;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvname.js
async function csvName(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVNAME must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.name;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvnickname.js
async function csvNickname(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVNICKNAME must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.nickname;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvrelation.js
async function csvRelation(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVRELATION must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVRELATION must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.relation.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvtalent.js
async function csvTalent(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of CSVTALENT must be an integer");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of CSVTALENT must be an integer");
  const character = vm2.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.talent.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/existcsv.js
async function existCsv(vm2, arg) {
  const num = await arg[0].reduce(vm2);
  bigint(num, "1st argument of EXISTCSV should be a number");
  return vm2.templateMap.has(Number(num)) ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/findchara.js
async function findChara(vm2, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of FINDCHARA should be a variable");
  const value = await arg[1].reduce(vm2);
  const start = arg.length >= 3 ? await arg[2].reduce(vm2) : 0n;
  bigint(start, "3rd argument of FINDCHARA should be a nmber");
  const end = arg.length >= 4 ? await arg[3].reduce(vm2) : BigInt(vm2.characterList.length);
  bigint(end, "4th argument of FINDCHARA should be a number");
  const index = await target.reduceIndex(vm2);
  for (let i = start; i < end; ++i) {
    if (target.getCell(vm2).get(vm2, [Number(i), ...index]) === value) {
      return i;
    }
  }
  return -1n;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/findlastchara.js
async function findLastChara(vm2, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of FINDLASTCHARA should be a variable");
  const value = await arg[1].reduce(vm2);
  const start = arg.length >= 3 ? await arg[2].reduce(vm2) : 0n;
  bigint(start, "3rd argument of FINDLASTCHARA should be a number");
  const end = arg.length >= 4 ? await arg[3].reduce(vm2) : BigInt(vm2.characterList.length);
  bigint(end, "4th argument of FINDLASTCHARA should be a number");
  const index = await target.reduceIndex(vm2);
  for (let i = end - 1n; i >= start; --i) {
    if (target.getCell(vm2).get(vm2, [Number(i), ...index]) === value) {
      return i;
    }
  }
  return -1n;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getbgcolor.js
function getBgColor(vm2, _arg) {
  return parseInt(vm2.printer.background, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getbit.js
async function getBit(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st argument of GETBIT should be a number");
  const index = await arg[1].reduce(vm2);
  bigint(index, "2nd argument of GETBIT should be a number");
  cond(index < 64, "2nd argument of GETBIT should be less than 64");
  return (value & 1n << index) !== 0n ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getchara.js
async function getChara(vm2, arg) {
  const id = await arg[0].reduce(vm2);
  bigint(id, "1st argument of GETCHARA should be an integer");
  for (let i = 0; i < vm2.characterList.length; ++i) {
    if (vm2.getValue("NO").get(vm2, [i]) === id) {
      return i;
    }
  }
  return -1;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getcolor.js
function getColor(vm2, _arg) {
  return parseInt(vm2.printer.color, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getdefbgcolor.js
function getDefBgColor(vm2, _arg) {
  return parseInt(vm2.printer.defaultBackground, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getdefcolor.js
function getDefColor(vm2, _arg) {
  return parseInt(vm2.printer.defaultColor, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getfocuscolor.js
function getFocusColor(vm2, _arg) {
  return parseInt(vm2.printer.focus, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/groupmatch.js
async function groupMatch(vm2, arg) {
  cond(arg.length > 0, "1st argument of GROUPMATCH must exist");
  const key = await arg[0].reduce(vm2);
  const values = [];
  for (const a of arg.slice(1)) {
    values.push(await a.reduce(vm2));
  }
  return values.reduce((acc, val) => acc + (val === key ? 1 : 0), 0);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/inrange.js
async function inRange(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st argument of INRANGE should be a number");
  const min2 = await arg[1].reduce(vm2);
  bigint(min2, "2nd argument of INRANGE should be a number");
  const max2 = await arg[2].reduce(vm2);
  bigint(max2, "3rd argument of INRANGE should be a number");
  return min2 <= value && value <= max2 ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/limit.js
async function limit(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st argument of LIMIT must a be number");
  const min2 = await arg[1].reduce(vm2);
  bigint(min2, "2nd argument of LIMIT must a be number");
  const max2 = await arg[2].reduce(vm2);
  bigint(max2, "3rd argument of LIMIT must a be number");
  if (value < min2) {
    return min2;
  } else if (value > max2) {
    return max2;
  } else {
    return value;
  }
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/lineisempty.js
function lineIsEmpty(vm2, _arg) {
  return vm2.printer.chunks.length === 0 ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/match.js
var LARGE_INT = 2n ** 60n;
async function match(vm2, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of MATCH should be a variable");
  const value = await arg[1].reduce(vm2);
  const start = arg.length >= 3 ? await arg[2].reduce(vm2) : 0n;
  bigint(start, "3rd argument of MATCH should be a number");
  const end = arg.length >= 4 ? await arg[3].reduce(vm2) : LARGE_INT;
  bigint(end, "4th argument of MATCH should be a number");
  const varSize2 = target.getCell(vm2).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = 0;
  for (let i = start; i < realEnd; ++i) {
    if (target.getCell(vm2).get(vm2, [Number(i)]) === value) {
      result += 1;
    }
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/max.js
async function max(vm2, arg) {
  cond(arg.length > 0, "MAX must have at least 1 argument");
  let result = 0n;
  for (let i = 0; i < arg.length; ++i) {
    const value = await arg[i].reduce(vm2);
    bigint(value, `${i + 1}th argument of MAX should be a number`);
    result = result > value ? result : value;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/maxarray.js
var LARGE_INT2 = 2n ** 60n;
async function maxArray(vm2, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of MAXARRAY should be a variable");
  cond(target.getCell(vm2).type === "number", "1st argument of MAXARRAY should be a number variable");
  const start = arg.length >= 2 ? await arg[1].reduce(vm2) : 0n;
  bigint(start, "2nd argument of MAXARRAY should be a number");
  const end = arg.length >= 3 ? await arg[2].reduce(vm2) : LARGE_INT2;
  bigint(end, "3rd argument of MAXARRAY should be a number");
  const varSize2 = target.getCell(vm2).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = 0n;
  for (let i = start; i < realEnd; ++i) {
    const value = target.getCell(vm2).get(vm2, [Number(i)]);
    result = result > value ? result : value;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/min.js
var LARGE_INT3 = 2n ** 60n;
async function min(vm2, arg) {
  cond(arg.length > 0, "MIN must have at least 1 argument");
  let result = LARGE_INT3;
  for (let i = 0; i < arg.length; ++i) {
    const value = await arg[i].reduce(vm2);
    bigint(value, `${i + 1}th argument of MIN must be a number`);
    result = result > value ? value : result;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/minarray.js
var LARGE_INT4 = 2n ** 60n;
async function minArray(vm2, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of MINARRAY should be a variable");
  cond(target.getCell(vm2).type === "number", "1st argument of MINARRAY should be a number variable");
  const start = arg.length >= 2 ? await arg[1].reduce(vm2) : 0n;
  bigint(start, "2nd argument of MINARRAY should be a number");
  const end = arg.length >= 3 ? await arg[2].reduce(vm2) : LARGE_INT4;
  bigint(end, "3rd argument of MINARRAY should be a number");
  const varSize2 = target.getCell(vm2).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = LARGE_INT4;
  for (let i = start; i < realEnd; ++i) {
    const value = target.getCell(vm2).get(vm2, [Number(i)]);
    result = result > value ? value : result;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/power.js
async function power(vm2, arg) {
  const base = await arg[0].reduce(vm2);
  bigint(base, "1st argument of POWER must be a number");
  const exponent = await arg[1].reduce(vm2);
  bigint(exponent, "2nd argument of POWER must be a number");
  return base ** exponent;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/rand.js
async function rand(vm2, arg) {
  if (arg.length === 0) {
    cond(false, "RAND should have at least 1 argument");
  } else if (arg.length === 1) {
    const max2 = await arg[0].reduce(vm2);
    bigint(max2, "1st argument of RAND should be an integer");
    return BigInt(vm2.random.next()) % max2;
  } else {
    const min2 = await arg[0].reduce(vm2);
    bigint(min2, "1st argument of RAND should be an integer");
    const max2 = await arg[1].reduce(vm2);
    bigint(max2, "2nd argument of RAND should be an integer");
    return BigInt(vm2.random.next()) % (max2 - min2) + min2;
  }
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/sign.js
async function sign(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st argument of SIGN must a be number");
  if (value > 0) {
    return 1;
  } else if (value < 0) {
    return -1;
  } else {
    return 0;
  }
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/sqrt.js
async function sqrt(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st argument of sqrt must be a number");
  if (value < 0n) {
    throw misc("Argument of sqrt must be larger than 0");
  }
  let prev = 0n;
  let result = value;
  for (let i = 0; i < 100; ++i) {
    if (prev === result) {
      break;
    }
    prev = result;
    result = (result + value / result) / 2n;
  }
  if (result * result - 1n === value) {
    return result - 1n;
  } else {
    return result;
  }
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/strlens.js
async function strLenS(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  string(value, "1st Argument of STRLENS should be a string");
  return value.length;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/strlensu.js
async function strLenSU(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  string(value, "1st Argument of STRLENS should be a string");
  return value.length;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/sumarray.js
var LARGE_INT5 = 2n ** 60n;
async function sumArray(vm2, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of SUMARRAY should be a variable");
  cond(target.getCell(vm2).type === "number", "1st argument of SUMARRAY should be a number variable");
  const start = arg.length >= 2 ? await arg[1].reduce(vm2) : 0n;
  bigint(start, "2nd argument of SUMARRAY should be a number");
  const end = arg.length >= 3 ? await arg[2].reduce(vm2) : LARGE_INT5;
  bigint(end, "3rd argument of SUMARRAY should be a number");
  const varSize2 = target.getCell(vm2).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = 0n;
  for (let i = start; i < realEnd; ++i) {
    result += target.getCell(vm2).get(vm2, [Number(i)]);
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/toint.js
async function toInt(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  string(value, "1st Argument of TOINT should be a string");
  const result = Number(value);
  return isNaN(result) ? 0 : result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/tostr.js
async function toStr(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st Argument of TOSTR should be a number");
  return value.toString();
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/varsize.js
async function varSize(vm2, arg) {
  const name = await arg[0].reduce(vm2);
  string(name, "1st Argument of VARSIZE should be a string");
  const depth = arg.length >= 2 ? await arg[1].reduce(vm2) : 0n;
  bigint(depth, "2nd argument of VARSIZE must be a number");
  return vm2.getValue(name).length(Number(depth));
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/unicode.js
async function unicode(vm2, arg) {
  const value = await arg[0].reduce(vm2);
  bigint(value, "1st Argument of UNICODE should be a number");
  return String.fromCharCode(Number(value));
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/inline-call.js
async function runGenerator(gen) {
  while (true) {
    const value = await gen.next();
    if (value.done === true) {
      return value.value;
    }
  }
}
var InlineCall = class {
  name;
  arg;
  constructor(name, arg) {
    this.name = name.toUpperCase();
    this.arg = arg;
  }
  async reduce(vm2) {
    switch (this.name.toUpperCase()) {
      case "ABS":
        return abs(vm2, this.arg);
      case "BARSTR":
        return barStr(vm2, this.arg);
      case "CSVABL":
        return BigInt(await csvAbl(vm2, this.arg));
      case "CSVBASE":
        return BigInt(await csvBase(vm2, this.arg));
      case "CSVCALLNAME":
        return csvCallname(vm2, this.arg);
      case "CSVCFLAG":
        return BigInt(await csvCflag(vm2, this.arg));
      case "CSVCSTR":
        return csvCstr(vm2, this.arg);
      case "CSVEQUIP":
        return BigInt(await csvEquip(vm2, this.arg));
      case "CSVEXP":
        return BigInt(await csvExp(vm2, this.arg));
      case "CSVJUEL":
        return BigInt(await csvJuel(vm2, this.arg));
      case "CSVMARK":
        return BigInt(await csvMark(vm2, this.arg));
      case "CSVMASTERNAME":
        return csvMastername(vm2, this.arg);
      case "CSVNAME":
        return csvName(vm2, this.arg);
      case "CSVNICKNAME":
        return csvNickname(vm2, this.arg);
      case "CSVRELATION":
        return BigInt(await csvRelation(vm2, this.arg));
      case "CSVTALENT":
        return BigInt(await csvTalent(vm2, this.arg));
      case "EXISTCSV":
        return BigInt(await existCsv(vm2, this.arg));
      case "FINDCHARA":
        return findChara(vm2, this.arg);
      case "FINDLASTCHARA":
        return findLastChara(vm2, this.arg);
      case "GETBGCOLOR":
        return BigInt(getBgColor(vm2, this.arg));
      case "GETBIT":
        return BigInt(await getBit(vm2, this.arg));
      case "GETCHARA":
        return BigInt(await getChara(vm2, this.arg));
      case "GETCOLOR":
        return BigInt(getColor(vm2, this.arg));
      case "GETDEFBGCOLOR":
        return BigInt(getDefBgColor(vm2, this.arg));
      case "GETDEFCOLOR":
        return BigInt(getDefColor(vm2, this.arg));
      case "GETFOCUSCOLOR":
        return BigInt(getFocusColor(vm2, this.arg));
      case "GROUPMATCH":
        return BigInt(await groupMatch(vm2, this.arg));
      case "INRANGE":
        return BigInt(await inRange(vm2, this.arg));
      case "LIMIT":
        return limit(vm2, this.arg);
      case "LINEISEMPTY":
        return BigInt(lineIsEmpty(vm2, this.arg));
      case "MATCH":
        return BigInt(await match(vm2, this.arg));
      case "MAX":
        return max(vm2, this.arg);
      case "MAXARRAY":
        return maxArray(vm2, this.arg);
      case "MIN":
        return min(vm2, this.arg);
      case "MINARRAY":
        return minArray(vm2, this.arg);
      case "POWER":
        return power(vm2, this.arg);
      case "RAND":
        return rand(vm2, this.arg);
      case "SIGN":
        return BigInt(await sign(vm2, this.arg));
      case "SQRT":
        return sqrt(vm2, this.arg);
      case "STRLENS":
        return BigInt(await strLenS(vm2, this.arg));
      case "STRLENSU":
        return BigInt(await strLenSU(vm2, this.arg));
      case "SUMARRAY":
        return sumArray(vm2, this.arg);
      case "TOINT":
        return BigInt(await toInt(vm2, this.arg));
      case "TOSTR":
        return toStr(vm2, this.arg);
      case "VARSIZE":
        return BigInt(await varSize(vm2, this.arg));
      case "UNICODE":
        return unicode(vm2, this.arg);
      default: {
        cond(vm2.fnMap.has(this.name), `Method ${this.name} does not exist`);
        const values = [];
        for (const arg of this.arg) {
          values.push(await arg.reduce(vm2));
        }
        const result = await runGenerator(vm2.fnMap.get(this.name).run(vm2, values));
        cond(result?.type === "return", "Inline call should return a value");
        return result.value[0];
      }
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/ternary.js
var Ternary = class {
  condition;
  left;
  right;
  constructor(condition, left, right) {
    this.condition = condition;
    this.left = left;
    this.right = right;
  }
  async reduce(vm2) {
    const condition = await this.condition.reduce(vm2);
    bigint(condition, "Condition of ternary operator should be an integer");
    return condition !== 0n ? this.left.reduce(vm2) : this.right.reduce(vm2);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/unary.js
var Unary = class {
  expr;
  op;
  constructor(op, expr2) {
    this.op = op;
    this.expr = expr2;
  }
  async reduce(vm2) {
    const value = await this.expr.reduce(vm2);
    bigint(value, `Operand of ${this.op} should be an integer`);
    switch (this.op) {
      case "+":
        return value;
      case "-":
        return -value;
      case "!":
        return value === 0n ? 1n : 0n;
      // eslint-disable-next-line no-bitwise
      case "~":
        return ~value;
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/unary-op.js
var UnaryOp = class {
  target;
  op;
  postfix;
  constructor(target, op, postfix) {
    this.target = target;
    this.op = op;
    this.postfix = postfix;
  }
  async reduce(vm2) {
    const cell = this.target.getCell(vm2);
    const index = await this.target.reduceIndex(vm2);
    const value = cell.get(vm2, index);
    bigint(value, `Operand of ${this.op} should be an integer`);
    switch (this.op) {
      case "++":
        cell.set(vm2, value + 1n, index);
        break;
      case "--":
        cell.set(vm2, value - 1n, index);
        break;
    }
    if (this.postfix) {
      return value;
    } else {
      switch (this.op) {
        case "++":
          return value + 1n;
        case "--":
          return value - 1n;
      }
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/parser/util.js
var import_parsimmon2 = __toESM(require_parsimmon_umd_min());
function alt(...values) {
  return import_parsimmon2.default.alt(...values.map(import_parsimmon2.default.string));
}
function optional(parser3) {
  return parser3.fallback(void 0);
}
function sepBy0(sep, parser3) {
  return import_parsimmon2.default.sepBy(parser3, import_parsimmon2.default.string(sep).trim(WS0));
}
function sepBy1(sep, first, rest) {
  return import_parsimmon2.default.seq(first, import_parsimmon2.default.string(sep).trim(WS0).then(rest).many()).map(([f, r]) => [f, ...r]);
}
function wrap(left, right, parser3) {
  return parser3.wrap(import_parsimmon2.default.string(left).skip(WS0), WS0.then(import_parsimmon2.default.string(right)));
}
function arg0R0() {
  return import_parsimmon2.default.succeed(null);
}
function arg1R0(a0) {
  return import_parsimmon2.default.alt(WS1.then(a0), WS0.map(() => void 0));
}
function arg1R1(a0) {
  return WS1.then(a0);
}
function arg2R0(a0, a1) {
  return import_parsimmon2.default.alt(WS1.then(import_parsimmon2.default.seq(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1).fallback(void 0))), WS0.map(() => [void 0, void 0]));
}
function arg2R2(a0, a1) {
  return WS1.then(import_parsimmon2.default.seq(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1)));
}
function arg3R3(a0, a1, a2) {
  return WS1.then(import_parsimmon2.default.seqMap(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1), import_parsimmon2.default.string(",").trim(WS0).then(a2), (...arg) => arg));
}
function arg4R1(a0, a1, a2, a3) {
  return WS1.then(import_parsimmon2.default.seqMap(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1).fallback(void 0), import_parsimmon2.default.string(",").trim(WS0).then(a2).fallback(void 0), import_parsimmon2.default.string(",").trim(WS0).then(a3).fallback(void 0), (...arg) => arg));
}
function arg4R2(a0, a1, a2, a3) {
  return WS1.then(import_parsimmon2.default.seqMap(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1), import_parsimmon2.default.string(",").trim(WS0).then(a2).fallback(void 0), import_parsimmon2.default.string(",").trim(WS0).then(a3).fallback(void 0), (...arg) => arg));
}
function arg4R3(a0, a1, a2, a3) {
  return WS1.then(import_parsimmon2.default.seqMap(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1), import_parsimmon2.default.string(",").trim(WS0).then(a2), import_parsimmon2.default.string(",").trim(WS0).then(a3).fallback(void 0), (...arg) => arg));
}
function arg5R1(a0, a1, a2, a3, a4) {
  return WS1.then(import_parsimmon2.default.seqMap(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1).fallback(void 0), import_parsimmon2.default.string(",").trim(WS0).then(a2).fallback(void 0), import_parsimmon2.default.string(",").trim(WS0).then(a3).fallback(void 0), import_parsimmon2.default.string(",").trim(WS0).then(a4).fallback(void 0), (...arg) => arg));
}
function arg5R3(a0, a1, a2, a3, a4) {
  return WS1.then(import_parsimmon2.default.seqMap(a0, import_parsimmon2.default.string(",").trim(WS0).then(a1), import_parsimmon2.default.string(",").trim(WS0).then(a2), import_parsimmon2.default.string(",").trim(WS0).then(a3).fallback(void 0), import_parsimmon2.default.string(",").trim(WS0).then(a4).fallback(void 0), (...arg) => arg));
}
function argNR0(an) {
  return import_parsimmon2.default.alt(WS1.then(sepBy0(",", an)), WS0.map(() => [])).skip(import_parsimmon2.default.string(",").fallback(""));
}
function argNR1(a0, an) {
  return WS1.then(sepBy1(",", a0, an)).skip(import_parsimmon2.default.string(",").fallback(""));
}
function tryParse(parser3, raw) {
  const result = parser3.parse(raw.get());
  if (result.status) {
    return result.value;
  } else {
    throw parser(`Expected one of (${result.expected.join(", ")})`);
  }
}

// ../../.my_agent_remote/undercrow__eraJS/build/parser/expr.js
var language = import_parsimmon3.default.createLanguage({
  Variable: () => import_parsimmon3.default.seqMap(Identifier, optional(import_parsimmon3.default.string("@").then(Identifier)), (name, scope) => new Variable(name, [], scope)),
  Index: (r) => import_parsimmon3.default.alt(UInt.map((value) => new Const(BigInt(value))), r.InlineCall, wrap("(", ")", r.Expr), r.Variable),
  FullVariable: (r) => import_parsimmon3.default.seqMap(r.Variable, optional(import_parsimmon3.default.string(":").trim(WS0).then(r.Index)), optional(import_parsimmon3.default.string(":").trim(WS0).then(r.Index)), optional(import_parsimmon3.default.string(":").trim(WS0).then(r.Index)), (variable2, index0, index1, index2) => {
    if (index0 == null) {
      variable2.index = [];
    } else if (index1 == null) {
      variable2.index = [index0];
    } else if (index2 == null) {
      variable2.index = [index0, index1];
    } else {
      variable2.index = [index0, index1, index2];
    }
    return variable2;
  }),
  UnaryOp: (r) => import_parsimmon3.default.alt(import_parsimmon3.default.seqMap(r.FullVariable, alt("++", "--"), (variable2, op) => new UnaryOp(variable2, op, true)), import_parsimmon3.default.seqMap(alt("++", "--"), r.FullVariable, (op, variable2) => new UnaryOp(variable2, op, false))),
  Leaf: (r) => import_parsimmon3.default.alt(UInt.map((val) => new Const(BigInt(val))), Str.map((value) => new Const(value)), r.InlineCall, wrap('@"', '"', form['"']), wrap("(", ")", r.Expr), r.UnaryOp, r.FullVariable),
  Unary: (r) => import_parsimmon3.default.alt(import_parsimmon3.default.seqMap(alt("+", "-", "!", "~").skip(WS0), r.Leaf, (op, expr2) => new Unary(op, expr2)), r.Leaf),
  Binary: (r) => {
    let result = r.Unary;
    const operators = [
      ["*", "/", "%"],
      ["+", "-"],
      ["<<", ">>"],
      ["<=", "<", ">=", ">"],
      ["==", "!="],
      ["&", "|", "^"],
      ["&&", "!&", "||", "!|", "^^"]
    ];
    for (const op of operators) {
      result = import_parsimmon3.default.seqMap(result, import_parsimmon3.default.seq(alt(...op).trim(WS0), result).many(), (first, rest) => rest.reduce((acc, val) => new Binary(val[0], acc, val[1]), first));
    }
    return result;
  },
  PercentlessBinary: (r) => {
    let result = r.Unary;
    const operators = [
      ["*", "/"],
      ["+", "-"],
      ["<<", ">>"],
      ["<=", "<", ">=", ">"],
      ["==", "!="],
      ["&", "|", "^"],
      ["&&", "!&", "||", "!|", "^^"]
    ];
    for (const op of operators) {
      result = import_parsimmon3.default.seqMap(result, import_parsimmon3.default.seq(alt(...op).trim(WS0), result).many(), (first, rest) => rest.reduce((acc, val) => new Binary(val[0], acc, val[1]), first));
    }
    return result;
  },
  Ternary: (r) => import_parsimmon3.default.alt(wrap("\\@", "\\@", import_parsimmon3.default.seqMap(r.Binary, import_parsimmon3.default.string("?").trim(WS0).then(optional(import_parsimmon3.default.lazy(() => form["#"]))), optional(import_parsimmon3.default.string("#").trim(WS0).then(optional(import_parsimmon3.default.lazy(() => formEnd)))), (expr2, left, right) => new Ternary(expr2, left ?? new Const(""), right ?? new Const("")))), import_parsimmon3.default.seqMap(r.Binary, import_parsimmon3.default.string("?").trim(WS0).then(r.Binary), import_parsimmon3.default.string("#").trim(WS0).then(r.Binary), (expr2, left, right) => new Ternary(expr2, left, right)), r.Binary),
  PercentlessTernary: (r) => import_parsimmon3.default.alt(wrap("\\@", "\\@", import_parsimmon3.default.seqMap(r.PercentlessBinary, import_parsimmon3.default.string("?").trim(WS0).then(optional(import_parsimmon3.default.lazy(() => form["#"]))), optional(import_parsimmon3.default.string("#").trim(WS0).then(optional(import_parsimmon3.default.lazy(() => formEnd)))), (expr2, left, right) => new Ternary(expr2, left ?? new Const(""), right ?? new Const("")))), import_parsimmon3.default.seqMap(r.PercentlessBinary, import_parsimmon3.default.string("?").trim(WS0).then(r.PercentlessBinary), import_parsimmon3.default.string("#").trim(WS0).then(r.PercentlessBinary), (expr2, left, right) => new Ternary(expr2, left, right)), r.PercentlessBinary),
  Expr: (r) => r.Ternary,
  PercentlessExpr: (r) => r.PercentlessTernary,
  InlineCall: (r) => import_parsimmon3.default.seqMap(Identifier, WS0.then(wrap("(", ")", sepBy0(",", r.Expr))), (name, arg) => new InlineCall(name, arg))
});
function formParser(exclude, withTernary) {
  const chunkParser = [];
  chunkParser.push(wrap("{", "}", import_parsimmon3.default.seqMap(language.Expr.trim(WS0), import_parsimmon3.default.string(",").trim(WS0).then(optional(language.Expr)).fallback(void 0), import_parsimmon3.default.string(",").trim(WS0).then(optional(alt("LEFT", "RIGHT"))).fallback(void 0), (value, display, align) => ({ value, display, align }))));
  chunkParser.push(wrap("%", "%", import_parsimmon3.default.seqMap(language.PercentlessExpr.trim(WS0), import_parsimmon3.default.string(",").trim(WS0).then(optional(language.PercentlessExpr)).fallback(void 0), import_parsimmon3.default.string(",").trim(WS0).then(optional(alt("LEFT", "RIGHT"))).fallback(void 0), (value, display, align) => ({ value, display, align }))));
  if (withTernary) {
    chunkParser.push(wrap("\\@", "\\@", import_parsimmon3.default.seqMap(language.Binary, import_parsimmon3.default.string("?").trim(WS0).then(optional(import_parsimmon3.default.lazy(() => form["#"]))), optional(import_parsimmon3.default.string("#").trim(WS0).then(optional(import_parsimmon3.default.lazy(() => formEnd)))), (expr2, left, right) => ({
      value: new Ternary(expr2, left ?? new Const(""), right ?? new Const(""))
    }))));
  }
  chunkParser.push(charSeq("{", "%", "\\@", ...exclude).map((value) => ({ value })));
  return import_parsimmon3.default.alt(...chunkParser).atLeast(1).map((expr2) => new Form(expr2));
}
var variable = language.FullVariable;
var expr = language.Expr;
var formEnd = formParser("", false);
var form = {
  "": formParser("", true),
  "#": formParser("#", true),
  ",": formParser(",", true),
  '"': formParser('"', true),
  "(": formParser("(", true),
  "(,": formParser("(,", true)
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/index.js
var Statement = class {
  raw;
  constructor(raw) {
    this.raw = raw;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(_vm, _label) {
    return null;
  }
};

// compact-lazy-slice.mjs
var RANGE_BASE = 67108864;
function encodeRange(from, to) {
  return Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= 0 && from < RANGE_BASE && to < RANGE_BASE ? from * RANGE_BASE + to : [from, to];
}
function rangeFrom(range) {
  return typeof range === "number" ? Math.floor(range / RANGE_BASE) : range[0];
}
function rangeTo(range) {
  return typeof range === "number" ? range % RANGE_BASE : range[1];
}
function createCompactLazy(tryParse2) {
  return class Lazy {
    raw;
    value;
    constructor(raw, parser3) {
      this.raw = raw;
      this.value = parser3;
    }
    get() {
      if (this.raw === null) return this.value;
      const result = tryParse2(this.value, this.raw);
      this.raw = null;
      this.value = result;
      return result;
    }
  };
}
var CompactSlice = class _CompactSlice {
  file;
  line;
  content;
  range;
  constructor(file, line, content, from, to) {
    this.file = file;
    this.line = line;
    this.content = content;
    this.range = encodeRange(from ?? 0, to ?? content.length);
  }
  get from() {
    return rangeFrom(this.range);
  }
  set from(value) {
    this.range = encodeRange(value, this.to);
  }
  get to() {
    return rangeTo(this.range);
  }
  set to(value) {
    this.range = encodeRange(this.from, value);
  }
  slice(from, to) {
    const newFrom = this.from + (from ?? 0);
    const newTo = to == null ? this.to : Math.min(this.to, this.from + to);
    return new _CompactSlice(this.file, this.line, this.content, newFrom, newTo);
  }
  get() {
    return this.content.slice(this.from, this.to);
  }
  length() {
    return this.to - this.from;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/lazy.js
var lazy_default = createCompactLazy(tryParse);

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-form.js
var PARSER = sepBy0(",", form[","]);
var AssignForm = class extends Statement {
  dest;
  arg;
  constructor(dest, raw) {
    super(raw);
    this.dest = dest;
    this.arg = new lazy_default(raw, PARSER);
  }
  async *run(vm2) {
    const dest = this.dest.getCell(vm2);
    const index = await this.dest.reduceIndex(vm2);
    const arg = this.arg.get();
    const partialIndex = index.slice(0, -1);
    const lastIndex = index[index.length - 1] ?? 0;
    if (arg.length !== 0) {
      for (let i = 0; i < arg.length; ++i) {
        const value = await arg[i].reduce(vm2);
        dest.set(vm2, value, [...partialIndex, lastIndex + i]);
      }
    } else {
      dest.set(vm2, "", index);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-int.js
var PARSER2 = sepBy0(",", expr);
var AssignInt = class extends Statement {
  dest;
  arg;
  constructor(dest, raw) {
    super(raw);
    this.dest = dest;
    this.arg = new lazy_default(raw, PARSER2);
  }
  async *run(vm2) {
    const dest = this.dest.getCell(vm2);
    const index = await this.dest.reduceIndex(vm2);
    const arg = this.arg.get();
    const partialIndex = index.slice(0, -1);
    const lastIndex = index[index.length - 1] ?? 0;
    for (let i = 0; i < arg.length; ++i) {
      const value = await arg[i].reduce(vm2);
      dest.set(vm2, value, [...partialIndex, lastIndex + i]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-op-int.js
var PARSER3 = expr;
var AssignOpInt = class extends Statement {
  dest;
  operator;
  arg;
  constructor(dest, operator, raw) {
    super(raw);
    this.dest = dest;
    this.operator = operator;
    this.arg = new lazy_default(raw, PARSER3);
  }
  async *run(vm2) {
    const dest = this.dest.getCell(vm2);
    const index = await this.dest.reduceIndex(vm2);
    const original = dest.get(vm2, index);
    const value = await this.arg.get().reduce(vm2);
    bigint(value, `Right operand of ${this.operator} should be a number`);
    switch (this.operator) {
      case "*=":
        dest.set(vm2, original * value, index);
        break;
      case "/=":
        dest.set(vm2, original / value, index);
        break;
      case "%=":
        dest.set(vm2, original % value, index);
        break;
      case "+=":
        dest.set(vm2, original + value, index);
        break;
      case "-=":
        dest.set(vm2, original - value, index);
        break;
      // eslint-disable-next-line no-bitwise
      case "&=":
        dest.set(vm2, original & value, index);
        break;
      // eslint-disable-next-line no-bitwise
      case "|=":
        dest.set(vm2, original | value, index);
        break;
      // eslint-disable-next-line no-bitwise
      case "^=":
        dest.set(vm2, original ^ value, index);
        break;
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-op-str.js
var PARSER4 = expr;
var AssignOpStr = class extends Statement {
  dest;
  operator;
  arg;
  constructor(dest, operator, raw) {
    super(raw);
    this.dest = dest;
    this.operator = operator;
    this.arg = new lazy_default(raw, PARSER4);
  }
  async *run(vm2) {
    const dest = this.dest.getCell(vm2);
    const index = await this.dest.reduceIndex(vm2);
    const original = dest.get(vm2, index);
    const arg = await this.arg.get().reduce(vm2);
    string(arg, `Right operand of ${this.operator} should be a string`);
    switch (this.operator) {
      case "+=":
        dest.set(vm2, original + arg, index);
        break;
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-prefix.js
var import_parsimmon4 = __toESM(require_parsimmon_umd_min());
var PARSER5 = import_parsimmon4.default.eof;
var AssignPrefix = class extends Statement {
  dest;
  operator;
  arg;
  constructor(dest, operator, raw) {
    super(raw);
    this.dest = dest;
    this.operator = operator;
    this.arg = new lazy_default(raw, PARSER5);
  }
  async *run(vm2) {
    this.raw.get();
    const dest = this.dest.getCell(vm2);
    cond(dest.type === "number", "++/-- should be used with a numeric variable");
    const index = await this.dest.reduceIndex(vm2);
    const original = dest.get(vm2, index);
    switch (this.operator) {
      case "++":
        dest.set(vm2, original + 1n, index);
        break;
      case "--":
        dest.set(vm2, original - 1n, index);
        break;
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-postfix.js
var import_parsimmon5 = __toESM(require_parsimmon_umd_min());
var PARSER6 = import_parsimmon5.default.eof;
var AssignPostfix = class extends Statement {
  dest;
  operator;
  arg;
  constructor(dest, operator, raw) {
    super(raw);
    this.dest = dest;
    this.operator = operator;
    this.arg = new lazy_default(raw, PARSER6);
  }
  async *run(vm2) {
    this.raw.get();
    const dest = this.dest.getCell(vm2);
    cond(dest.type === "number", "++/-- should be used with a numeric variable");
    const index = await this.dest.reduceIndex(vm2);
    const original = dest.get(vm2, index);
    switch (this.operator) {
      case "++":
        dest.set(vm2, original + 1n, index);
        break;
      case "--":
        dest.set(vm2, original - 1n, index);
        break;
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-str.js
var PARSER7 = sepBy0(",", expr);
var AssignStr = class extends Statement {
  dest;
  arg;
  constructor(dest, raw) {
    super(raw);
    this.dest = dest;
    this.arg = new lazy_default(raw, PARSER7);
  }
  async *run(vm2) {
    const dest = this.dest.getCell(vm2);
    const index = await this.dest.reduceIndex(vm2);
    const arg = this.arg.get();
    const partialIndex = index.slice(0, -1);
    const lastIndex = index[index.length - 1] ?? 0;
    for (let i = 0; i < arg.length; ++i) {
      const value = await arg[i].reduce(vm2);
      dest.set(vm2, value, [...partialIndex, lastIndex + i]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/index.js
var PARSER_PREFIX = import_parsimmon6.default.seq(alt("++", "--").trim(WS0), variable, import_parsimmon6.default.all);
var PARSER_POSTFIX = import_parsimmon6.default.seq(variable, alt("++", "--").trim(WS0), import_parsimmon6.default.all);
var PARSER_VAR = import_parsimmon6.default.seq(variable, import_parsimmon6.default.alt(alt("="), alt("'="), alt("*=", "/=", "%=", "+=", "-=", "&=", "|=", "^=")).trim(WS0), import_parsimmon6.default.all);
var Assign = class extends Statement {
  constructor(raw) {
    super(raw);
  }
  compile(vm2) {
    try {
      const [op, dest, rest] = tryParse(PARSER_PREFIX, this.raw);
      const restSlice = this.raw.slice(this.raw.length() - rest.length);
      const destType = dest.getCell(vm2).type;
      if (op === "++" && destType === "number") {
        this.inner = new AssignPrefix(dest, "++", restSlice);
      } else if (op === "--" && destType === "number") {
        this.inner = new AssignPrefix(dest, "--", restSlice);
      }
      return;
    } catch {
    }
    try {
      const [dest, op, rest] = tryParse(PARSER_POSTFIX, this.raw);
      const restSlice = this.raw.slice(this.raw.length() - rest.length);
      const destType = dest.getCell(vm2).type;
      if (op === "++" && destType === "number") {
        this.inner = new AssignPostfix(dest, "++", restSlice);
      } else if (op === "--" && destType === "number") {
        this.inner = new AssignPostfix(dest, "--", restSlice);
      }
      return;
    } catch {
    }
    try {
      const [dest, op, rest] = tryParse(PARSER_VAR, this.raw);
      const restSlice = this.raw.slice(this.raw.length() - rest.length);
      const destType = dest.getCell(vm2).type;
      if (op === "=" && destType === "number") {
        this.inner = new AssignInt(dest, restSlice);
      } else if (op === "=" && destType === "string") {
        this.inner = new AssignForm(dest, restSlice);
      } else if (op === "'=") {
        this.inner = new AssignStr(dest, restSlice);
      } else if (op === "+=" && destType === "string") {
        this.inner = new AssignOpStr(dest, "+=", restSlice);
      } else if (["*=", "/=", "%=", "+=", "-=", "&=", "|=", "^="].includes(op) && destType === "number") {
        this.inner = new AssignOpInt(dest, op, restSlice);
      }
      return;
    } catch {
    }
    throw parser("Invalid assignment expression");
  }
  async *run(vm2) {
    if (this.inner == null) {
      this.compile(vm2);
    }
    return yield* vm2.run(this.inner);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/int-0d.js
var Int0DValue = class _Int0DValue {
  type = "number";
  name;
  value;
  static normalizeIndex(name, index) {
    if (index.length === 0) {
      return [];
    } else if (index.length === 1 && index[0] === 0) {
      return [];
    } else {
      throw invalidIndex("0D", name, index);
    }
  }
  constructor(name) {
    this.name = name;
    this.value = 0n;
  }
  reset(value) {
    this.value = BigInt(value);
    return this;
  }
  get(_vm, index) {
    _Int0DValue.normalizeIndex(this.name, index);
    return this.value;
  }
  set(_vm, value, index) {
    _Int0DValue.normalizeIndex(this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    this.value = value;
  }
  // NOTE: index is ignored (Emuera emulation)
  rangeSet(_vm, value, _index, _range) {
    bigint(value, "Cannot assign a string to a numeric variable");
    this.value = value;
  }
  length(depth) {
    switch (depth) {
      case 0:
        return 1;
      default:
        throw new Error(`0D variable doesn't have a value at depth ${depth}`);
    }
  }
};

// paged-default-array.mjs
var DEFAULT_PAGE_SIZE = 256;
var DEFAULT_DENSE_THRESHOLD = 0.75;
var states = /* @__PURE__ */ new WeakMap();
var arrayIndex = (property) => {
  if (typeof property !== "string" || property === "") return null;
  const index = Number(property);
  return Number.isInteger(index) && index >= 0 && index < 4294967295 && String(index) === property ? index : null;
};
var keyOf = (path) => path.join("/");
var samePrefix = (candidate, prefix) => prefix.every((value, index) => candidate[index] === value);
var pathOf = (key) => key === "" ? [] : key.split("/").map(Number);
function createPagedArray(shape, zero, {
  pageSize = DEFAULT_PAGE_SIZE,
  denseThreshold = DEFAULT_DENSE_THRESHOLD,
  sparse1d = false
} = {}) {
  if (!Array.isArray(shape) || shape.length < 1 || shape.length > 3) throw new RangeError("Paged arrays require 1-3 dimensions");
  const dimensions = shape.map((size) => {
    const probe = new Array(size);
    return probe.length;
  });
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new RangeError("Invalid page size");
  if (!(denseThreshold > 0 && denseThreshold <= 1)) throw new RangeError("Invalid dense threshold");
  const leafSize = dimensions.at(-1);
  const effectivePageSize = Math.max(1, Math.min(pageSize, leafSize || 1));
  const state = {
    dimensions,
    zero,
    requestedPageSize: pageSize,
    pageSize: effectivePageSize,
    denseThreshold,
    pages: /* @__PURE__ */ new Map(),
    denseLeaves: /* @__PURE__ */ new Map(),
    leafProxies: /* @__PURE__ */ new Map(),
    lengths: /* @__PURE__ */ new Map(),
    assigned: /* @__PURE__ */ new Map(),
    version: 0,
    root: null
  };
  const lengthAt = (depth, path) => state.lengths.get(keyOf(path)) ?? dimensions[depth];
  const pageMap = (path, create = false) => {
    const key = keyOf(path);
    let result = state.pages.get(key);
    if (!result && create) state.pages.set(key, result = /* @__PURE__ */ new Map());
    return result;
  };
  const promote = (path, length, target = null) => {
    const key = keyOf(path);
    let dense = state.denseLeaves.get(key);
    if (dense) return dense;
    dense = target ?? new Array(length);
    dense.length = length;
    dense.fill(zero);
    const pages = state.pages.get(key);
    if (pages) {
      for (const [pageIndex, page] of pages) {
        const start = pageIndex * effectivePageSize;
        for (let offset = 0; offset < page.values.length && start + offset < length; offset++) {
          if (page.values[offset] !== zero) dense[start + offset] = page.values[offset];
        }
      }
      state.pages.delete(key);
    }
    state.denseLeaves.set(key, dense);
    return dense;
  };
  const readLeaf = (path, index) => {
    const dense = state.denseLeaves.get(keyOf(path));
    if (dense) return dense[index] === void 0 ? zero : dense[index];
    const page = pageMap(path)?.get(Math.floor(index / effectivePageSize));
    return page ? page.values[index % effectivePageSize] : zero;
  };
  const writeLeaf = (path, index, value, length, proxy, target) => {
    const key = keyOf(path);
    const dense = state.denseLeaves.get(key);
    if (dense) {
      if (dense.length < length) dense.push(...new Array(length - dense.length).fill(zero));
      dense[index] = value;
      return;
    }
    const pageIndex = Math.floor(index / effectivePageSize), offset = index % effectivePageSize;
    let pages = pageMap(path);
    let page = pages?.get(pageIndex);
    if (value === zero) {
      if (!page || page.values[offset] === zero) return;
      page.values[offset] = zero;
      if (--page.nonDefault === 0) {
        pages.delete(pageIndex);
        if (pages.size === 0) state.pages.delete(key);
      }
      return;
    }
    if (!page) {
      pages = pageMap(path, true);
      pages.set(pageIndex, page = { values: new Array(effectivePageSize).fill(zero), nonDefault: 0 });
    }
    if (page.values[offset] === zero) page.nonDefault++;
    page.values[offset] = value;
    if (pages.size * effectivePageSize >= Math.max(1, Math.ceil(length * denseThreshold))) {
      promote(path, length, target);
      if (proxy) state.leafProxies.set(key, proxy);
    }
  };
  const truncate = (depth, path, length) => {
    if (depth === dimensions.length - 1) {
      const key = keyOf(path);
      const dense = state.denseLeaves.get(key);
      if (dense) {
        dense.length = length;
        return;
      }
      const pages = pageMap(path);
      if (pages) for (const [pageIndex, page] of pages) {
        const start = pageIndex * effectivePageSize;
        if (start >= length) pages.delete(pageIndex);
        else if (start + effectivePageSize > length) {
          for (let offset = Math.max(0, length - start); offset < effectivePageSize; offset++) {
            if (page.values[offset] !== zero) {
              page.values[offset] = zero;
              page.nonDefault--;
            }
          }
          if (page.nonDefault === 0) pages.delete(pageIndex);
        }
      }
      if (pages?.size === 0) state.pages.delete(key);
      return;
    }
    for (const collection of [state.pages, state.denseLeaves, state.leafProxies, state.lengths, state.assigned]) {
      for (const key of [...collection.keys()]) {
        const candidate = pathOf(key);
        if (samePrefix(candidate, path) && candidate.length > depth && candidate[depth] >= length) collection.delete(key);
      }
    }
  };
  const valueAt = (depth, path, index) => {
    if (depth === dimensions.length - 1) return readLeaf(path, index);
    const childPath = [...path, index], childKey = keyOf(childPath);
    const assigned = state.assigned.get(childKey);
    if (assigned !== void 0) return assigned;
    return state.leafProxies.get(childKey) ?? make(depth + 1, childPath);
  };
  const make = (depth, path) => {
    const isLeaf = depth === dimensions.length - 1;
    const initialLength = lengthAt(depth, path);
    const dense1d = isLeaf && dimensions.length === 1 && !sparse1d;
    const target = dense1d ? new Array(initialLength).fill(zero) : new Array(initialLength);
    if (dense1d) state.denseLeaves.set("", target);
    let proxy;
    proxy = new Proxy(target, {
      get(array2, property, receiver) {
        if (property === Symbol.iterator) return function* pagedValues() {
          if (!isLeaf) {
            for (let index2 = 0; index2 < array2.length; index2++) yield valueAt(depth, path, index2);
            return;
          }
          const key = keyOf(path);
          let observedVersion = -1, dense = null, pageIndex = -1, page = null;
          for (let index2 = 0; index2 < array2.length; index2++) {
            const nextPageIndex = Math.floor(index2 / effectivePageSize);
            if (observedVersion !== state.version || nextPageIndex !== pageIndex) {
              observedVersion = state.version;
              dense = state.denseLeaves.get(key) ?? null;
              pageIndex = nextPageIndex;
              page = dense ? null : state.pages.get(key)?.get(pageIndex) ?? null;
            }
            yield dense ? dense[index2] === void 0 ? zero : dense[index2] : page ? page.values[index2 % effectivePageSize] : zero;
          }
        };
        const index = arrayIndex(property);
        if (index == null) return Reflect.get(array2, property, receiver);
        if (index >= array2.length) return void 0;
        return valueAt(depth, path, index);
      },
      set(array2, property, value, receiver) {
        state.version++;
        const index = arrayIndex(property);
        if (index == null) {
          if (property === "length") {
            const previous = array2.length;
            if (!Reflect.set(array2, property, value, receiver)) return false;
            state.lengths.set(keyOf(path), array2.length);
            if (array2.length < previous) truncate(depth, path, array2.length);
            else if (isLeaf) {
              const dense = state.denseLeaves.get(keyOf(path));
              if (dense && dense !== array2) dense.push(...new Array(array2.length - dense.length).fill(zero));
              else if (dense === array2) for (let i = previous; i < array2.length; i++) array2[i] = zero;
            }
            return true;
          }
          return Reflect.set(array2, property, value, receiver);
        }
        if (index >= array2.length) {
          const previous = array2.length;
          array2.length = index + 1;
          state.lengths.set(keyOf(path), array2.length);
          if (isLeaf) {
            const dense = state.denseLeaves.get(keyOf(path));
            if (dense === array2) for (let i = previous; i < index; i++) array2[i] = zero;
          }
        }
        if (isLeaf) writeLeaf(path, index, value, array2.length, proxy, array2);
        else state.assigned.set(keyOf([...path, index]), value);
        return true;
      },
      has(array2, property) {
        const index = arrayIndex(property);
        return index == null ? Reflect.has(array2, property) : index < array2.length;
      }
    });
    states.set(proxy, state);
    return proxy;
  };
  state.root = make(0, []);
  return state.root;
}
var nestedGet = (root, indices, start = 0) => {
  let value = root;
  for (let depth = start; depth < indices.length; depth++) value = value[indices[depth]];
  return value;
};
var nestedSet = (root, indices, value) => {
  let target = root;
  for (let depth = 0; depth < indices.length - 1; depth++) target = target[indices[depth]];
  target[indices.at(-1)] = value;
};
var directIndices = (indices) => indices.map((index) => arrayIndex(String(index)));
var directLengthAt = (state, depth, path) => state.lengths.get(keyOf(path)) ?? state.dimensions[depth];
var directReadLeaf = (state, path, index) => {
  const key = keyOf(path), dense = state.denseLeaves.get(key);
  if (dense) return dense[index] === void 0 ? state.zero : dense[index];
  const page = state.pages.get(key)?.get(Math.floor(index / state.pageSize));
  return page ? page.values[index % state.pageSize] : state.zero;
};
var directPromote = (state, path, length) => {
  const key = keyOf(path), dense = new Array(length).fill(state.zero), pages = state.pages.get(key);
  if (pages) {
    for (const [pageIndex, page] of pages) {
      const start = pageIndex * state.pageSize;
      for (let offset = 0; offset < page.values.length && start + offset < length; offset++) {
        if (page.values[offset] !== state.zero) dense[start + offset] = page.values[offset];
      }
    }
    state.pages.delete(key);
  }
  state.denseLeaves.set(key, dense);
};
var directWriteLeaf = (state, path, index, value, length) => {
  const key = keyOf(path), dense = state.denseLeaves.get(key);
  if (dense) {
    if (dense.length < length) dense.push(...new Array(length - dense.length).fill(state.zero));
    dense[index] = value;
    return;
  }
  const pageIndex = Math.floor(index / state.pageSize), offset = index % state.pageSize;
  let pages = state.pages.get(key), page = pages?.get(pageIndex);
  if (value === state.zero) {
    if (!page || page.values[offset] === state.zero) return;
    page.values[offset] = state.zero;
    if (--page.nonDefault === 0) {
      pages.delete(pageIndex);
      if (pages.size === 0) state.pages.delete(key);
    }
    return;
  }
  if (!page) {
    if (!pages) state.pages.set(key, pages = /* @__PURE__ */ new Map());
    pages.set(pageIndex, page = { values: new Array(state.pageSize).fill(state.zero), nonDefault: 0 });
  }
  if (page.values[offset] === state.zero) page.nonDefault++;
  page.values[offset] = value;
  if (pages.size * state.pageSize >= Math.max(1, Math.ceil(length * state.denseThreshold))) directPromote(state, path, length);
};
function pagedArrayGet(value, indices) {
  const state = states.get(value);
  if (!state) return nestedGet(value, indices);
  if (!Array.isArray(indices) || indices.length !== state.dimensions.length) throw new RangeError("Index dimensionality mismatch");
  const normalized = directIndices(indices);
  if (normalized.includes(null)) return nestedGet(state.root, indices);
  const path = [];
  for (let depth = 0; depth < state.dimensions.length - 1; depth++) {
    const index2 = normalized[depth];
    if (index2 >= directLengthAt(state, depth, path)) return nestedGet(state.root, indices);
    path.push(index2);
    const assigned = state.assigned.get(keyOf(path));
    if (assigned !== void 0) return nestedGet(assigned, indices, depth + 1);
  }
  const index = normalized.at(-1);
  return index < directLengthAt(state, state.dimensions.length - 1, path) ? directReadLeaf(state, path, index) : void 0;
}
function pagedArraySet(value, indices, next) {
  const state = states.get(value);
  if (!state) {
    nestedSet(value, indices, next);
    return;
  }
  if (!Array.isArray(indices) || indices.length !== state.dimensions.length) throw new RangeError("Index dimensionality mismatch");
  const normalized = directIndices(indices);
  if (normalized.includes(null)) {
    nestedSet(state.root, indices, next);
    return;
  }
  const path = [];
  for (let depth = 0; depth < state.dimensions.length - 1; depth++) {
    const index2 = normalized[depth];
    if (index2 >= directLengthAt(state, depth, path)) {
      nestedSet(state.root, indices, next);
      return;
    }
    path.push(index2);
    if (state.assigned.get(keyOf(path)) !== void 0) {
      nestedSet(state.root, indices, next);
      return;
    }
  }
  state.version++;
  const index = normalized.at(-1), key = keyOf(path);
  let length = directLengthAt(state, state.dimensions.length - 1, path);
  if (index >= length) {
    length = index + 1;
    state.lengths.set(key, length);
  }
  directWriteLeaf(state, path, index, next, length);
}
function pagedDenseBacking(value) {
  const state = states.get(value);
  if (!state || value !== state.root || state.dimensions.length !== 1) return null;
  return state.denseLeaves.get("") ?? null;
}

// deferred-local.mjs
function deferLocalArray(cell, size, zero) {
  if (!Number.isInteger(size) || size < 0 || size > 4294967295) {
    cell.value = new Array(size).fill(zero);
    return;
  }
  const assign = (value) => Object.defineProperty(cell, "value", {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(cell, "value", {
    enumerable: true,
    configurable: true,
    get() {
      const value = new Array(size).fill(zero);
      assign(value);
      return value;
    },
    set(value) {
      assign(value);
    }
  });
}

// ../../.my_agent_remote/undercrow__eraJS/build/value/int-1d.js
var Int1DValue = class _Int1DValue {
  type = "number";
  name;
  value;
  static normalizeIndex(name, index) {
    if (index.length === 0) {
      return [0];
    } else if (index.length === 1) {
      return index;
    } else if (index.length === 2 && index[1] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("1D", name, index);
    }
  }
  constructor(name, size) {
    const realSize = size ?? [1e3];
    cond(realSize.length === 1, `${name} is not a ${realSize.length}D variable`);
    this.name = name;
    this.saveShape = [...realSize];
    if (name === "LOCAL") deferLocalArray(this, realSize[0], 0n);
    else this.value = createPagedArray(realSize, 0n);
  }
  reset(value) {
    for (let i = 0; i < this.value.length; ++i) {
      this.value[i] = 0n;
    }
    if (value instanceof Map) {
      for (const [i, val] of value) {
        this.value[i] = BigInt(val);
      }
    } else {
      for (let i = 0; i < value.length; ++i) {
        this.value[i] = BigInt(value[i]);
      }
    }
    return this;
  }
  get(_vm, index) {
    const realIndex = _Int1DValue.normalizeIndex(this.name, index);
    return this.value[realIndex[0]];
  }
  set(_vm, value, index) {
    const realIndex = _Int1DValue.normalizeIndex(this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    this.value[realIndex[0]] = value;
  }
  // NOTE: index is ignored (Emuera emulation)
  rangeSet(_vm, value, _index, range) {
    bigint(value, "Cannot assign a string to a numeric variable");
    for (let i = range[0]; i < range[1]; ++i) {
      this.value[i] = value;
    }
  }
  length(depth) {
    switch (depth) {
      case 0:
        return this.value.length;
      case 1:
        return 1;
      default:
        throw new Error(`1D variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/int-char-0d.js
var IntChar0DValue = class _IntChar0DValue {
  type = "number";
  name;
  value;
  static normalizeIndex(vm2, name, index) {
    if (index.length === 0) {
      return [Number(vm2.getValue("TARGET").get(vm2, []))];
    } else if (index.length === 1) {
      return index;
    } else if (index.length === 2 && index[1] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("0D character", name, index);
    }
  }
  constructor(name) {
    this.name = name;
  }
  reset() {
    throw internal(`0D character variable ${this.name} cannot be reset`);
  }
  get(vm2, index) {
    const realIndex = _IntChar0DValue.normalizeIndex(vm2, this.name, index);
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm2, realIndex.slice(1));
  }
  set(vm2, value, index) {
    const realIndex = _IntChar0DValue.normalizeIndex(vm2, this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm2, value, realIndex.slice(1));
  }
  rangeSet(vm2, value, index, _range) {
    this.set(vm2, value, index);
  }
  length(depth) {
    switch (depth) {
      case 0:
        return 1;
      case 1:
        return 1;
      default:
        throw new Error(`1D character variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/int-char-1d.js
var IntChar1DValue = class _IntChar1DValue {
  type = "number";
  name;
  value;
  size;
  static normalizeIndex(vm2, name, index) {
    if (index.length === 0) {
      return [Number(vm2.getValue("TARGET").get(vm2, [])), 0];
    } else if (index.length === 1) {
      return [Number(vm2.getValue("TARGET").get(vm2, [])), index[0]];
    } else if (index.length === 2) {
      return index;
    } else if (index.length === 3 && index[2] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("1D character", name, index);
    }
  }
  constructor(name, size) {
    const realSize = size ?? [100];
    cond(realSize.length === 1, `${name} is not a ${realSize.length}D variable`);
    this.name = name;
    this.size = realSize[0];
  }
  reset() {
    throw internal(`1D character variable ${this.name} cannot be reset`);
  }
  get(vm2, index) {
    const realIndex = _IntChar1DValue.normalizeIndex(vm2, this.name, index);
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm2, realIndex.slice(1));
  }
  set(vm2, value, index) {
    const realIndex = _IntChar1DValue.normalizeIndex(vm2, this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm2, value, realIndex.slice(1));
  }
  rangeSet(vm2, value, index, range) {
    const realIndex = _IntChar1DValue.normalizeIndex(vm2, this.name, [...index, 0]);
    bigint(value, "Cannot assign a string to a numeric variable");
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    cell.rangeSet(vm2, value, realIndex.slice(1), range);
  }
  length(depth) {
    switch (depth) {
      case 0:
        return this.size;
      case 1:
        return this.size;
      case 2:
        return 1;
      default:
        throw new Error(`1D character variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/str-0d.js
var Str0DValue = class _Str0DValue {
  type = "string";
  name;
  value;
  static normalizeIndex(name, index) {
    if (index.length === 0) {
      return [];
    } else if (index.length === 1 && index[0] === 0) {
      return [];
    } else {
      throw invalidIndex("0D", name, index);
    }
  }
  constructor(name) {
    this.name = name;
    this.value = "";
  }
  reset(value) {
    this.value = value;
    return this;
  }
  get(_vm, index) {
    _Str0DValue.normalizeIndex(this.name, index);
    return this.value;
  }
  set(_vm, value, index) {
    _Str0DValue.normalizeIndex(this.name, index);
    string(value, "Cannot assign a number to a string variable");
    this.value = value;
  }
  // NOTE: index is ignored (Emuera emulation)
  rangeSet(_vm, value, _index, _range) {
    string(value, "Cannot assign a number to a string variable");
    this.value = value;
  }
  length(depth) {
    switch (depth) {
      case 0:
        return 1;
      default:
        throw new Error(`0D variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/str-1d.js
var Str1DValue = class _Str1DValue {
  type = "string";
  name;
  value;
  static normalizeIndex(name, index) {
    if (index.length === 0) {
      return [0];
    } else if (index.length === 1) {
      return index;
    } else if (index.length === 2 && index[1] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("1D", name, index);
    }
  }
  constructor(name, size) {
    const realSize = size ?? [100];
    cond(realSize.length === 1, `${name} is not a ${realSize.length}D variable`);
    this.name = name;
    if (name === "LOCALS") deferLocalArray(this, realSize[0], "");
    else this.value = createPagedArray(realSize, "");
  }
  reset(value) {
    for (let i = 0; i < this.value.length; ++i) {
      this.value[i] = "";
    }
    if (value instanceof Map) {
      for (const [i, val] of value) {
        this.value[i] = val;
      }
    } else {
      for (let i = 0; i < value.length; ++i) {
        this.value[i] = value[i];
      }
    }
    return this;
  }
  get(_vm, index) {
    const realIndex = _Str1DValue.normalizeIndex(this.name, index);
    return this.value[realIndex[0]];
  }
  set(_vm, value, index) {
    const realIndex = _Str1DValue.normalizeIndex(this.name, index);
    string(value, "Cannot assign a number to a string variable");
    this.value[realIndex[0]] = value;
  }
  // NOTE: index is ignored (Emuera emulation)
  rangeSet(_vm, value, _index, range) {
    string(value, "Cannot assign a number to a string variable");
    for (let i = range[0]; i < range[1]; ++i) {
      this.value[i] = value;
    }
  }
  length(depth) {
    switch (depth) {
      case 0:
        return this.value.length;
      case 1:
        return 1;
      default:
        throw new Error(`1D variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/str-char-0d.js
var StrChar0DValue = class _StrChar0DValue {
  type = "string";
  name;
  value;
  static normalizeIndex(vm2, name, index) {
    if (index.length === 0) {
      return [Number(vm2.getValue("TARGET").get(vm2, []))];
    } else if (index.length === 1) {
      return index;
    } else if (index.length === 2 && index[0] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("0D character", name, index);
    }
  }
  constructor(name) {
    this.name = name;
  }
  reset() {
    throw internal(`0D character variable ${this.name} cannot be reset`);
  }
  get(vm2, index) {
    const realIndex = _StrChar0DValue.normalizeIndex(vm2, this.name, index);
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm2, realIndex.slice(1));
  }
  set(vm2, value, index) {
    const realIndex = _StrChar0DValue.normalizeIndex(vm2, this.name, index);
    string(value, "Cannot assign a number to a string variable");
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm2, value, realIndex.slice(1));
  }
  rangeSet(vm2, value, index, _range) {
    this.set(vm2, value, index);
  }
  length(depth) {
    switch (depth) {
      case 0:
        return 1;
      case 1:
        return 1;
      default:
        throw new Error(`1D character variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/str-char-1d.js
var StrChar1DValue = class _StrChar1DValue {
  type = "string";
  name;
  value;
  size;
  static normalizeIndex(vm2, name, index) {
    if (index.length === 0) {
      return [Number(vm2.getValue("TARGET").get(vm2, [])), 0];
    } else if (index.length === 1) {
      return [Number(vm2.getValue("TARGET").get(vm2, [])), index[0]];
    } else if (index.length === 2) {
      return index;
    } else if (index.length === 3 && index[2] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("1D character", name, index);
    }
  }
  constructor(name, size) {
    const realSize = size ?? [100];
    cond(realSize.length === 1, `${name} is not a ${realSize.length}D variable`);
    this.name = name;
    this.size = realSize[0];
  }
  reset() {
    throw internal(`1D character variable ${this.name} cannot be reset`);
  }
  get(vm2, index) {
    const realIndex = _StrChar1DValue.normalizeIndex(vm2, this.name, index);
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm2, realIndex.slice(1));
  }
  set(vm2, value, index) {
    const realIndex = _StrChar1DValue.normalizeIndex(vm2, this.name, index);
    string(value, "Cannot assign a number to a string variable");
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm2, value, realIndex.slice(1));
  }
  rangeSet(vm2, value, index, range) {
    const realIndex = _StrChar1DValue.normalizeIndex(vm2, this.name, [...index, 0]);
    string(value, "Cannot assign a number to a string variable");
    if (vm2.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm2.characterList[realIndex[0]].getValue(this.name);
    cell.rangeSet(vm2, value, realIndex.slice(1), range);
  }
  length(depth) {
    switch (depth) {
      case 0:
        return this.size;
      case 1:
        return this.size;
      case 2:
        return 1;
      // TODO: Use EraJSError
      default:
        throw new Error(`1D character variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/character.js
var Character = class {
  values;
  constructor(vm2, template) {
    this.values = /* @__PURE__ */ new Map();
    for (const [name, value] of vm2.globalMap) {
      if (value instanceof IntChar0DValue) {
        this.values.set(name, new Int0DValue(name));
      } else if (value instanceof IntChar1DValue) {
        this.values.set(name, new Int1DValue(name, [value.size]));
      } else if (value instanceof StrChar0DValue) {
        this.values.set(name, new Str0DValue(name));
      } else if (value instanceof StrChar1DValue) {
        this.values.set(name, new Str1DValue(name, [value.size]));
      }
    }
    this.getValue("NO").reset(template.no);
    this.getValue("NAME").reset(template.name);
    this.getValue("CALLNAME").reset(template.callname);
    this.getValue("NICKNAME").reset(template.nickname);
    this.getValue("MASTERNAME").reset(template.mastername);
    this.getValue("BASE").reset(template.maxBase);
    this.getValue("MAXBASE").reset(template.maxBase);
    this.getValue("MARK").reset(template.mark);
    this.getValue("EXP").reset(template.exp);
    this.getValue("ABL").reset(template.abl);
    this.getValue("TALENT").reset(template.talent);
    this.getValue("RELATION").reset(template.relation);
    this.getValue("CFLAG").reset(template.cflag);
    this.getValue("EQUIP").reset(template.equip);
    this.getValue("JUEL").reset(template.juel);
    this.getValue("CSTR").reset(template.cstr);
  }
  getValue(name) {
    if (this.values.has(name)) {
      return this.values.get(name);
    } else {
      throw notFound("Character", name);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/addchara.js
var PARSER8 = argNR0(expr);
var AddChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER8);
  }
  async *run(vm2) {
    for (const expr2 of this.arg.get()) {
      const id = await expr2.reduce(vm2);
      bigint(id, "Character id should be an integer");
      const template = vm2.templateMap.get(Number(id));
      cond(template != null, `Character template with id ${id} does not exist`);
      vm2.characterList.push(new Character(vm2, template));
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/addcopychara.js
var PARSER9 = arg1R1(expr);
var AddCopyChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER9);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("ADDCOPYCHARA");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/adddefchara.js
var PARSER10 = arg0R0();
var AddDefChara = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER10, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const template = vm2.templateMap.get(0);
    cond(template != null, "Character template with id 0 does not exist");
    vm2.characterList.push(new Character(vm2, template));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/addvoidchara.js
var PARSER11 = arg0R0();
var AddVoidChara = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER11, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("ADDVOIDCHARA");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/alignment.js
var PARSER12 = arg1R1(alt("LEFT", "CENTER", "RIGHT"));
var Alignment = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER12);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.printer.align = this.arg.get();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/arrayshift.js
var PARSER13 = arg5R3(variable, expr, expr, expr, expr);
var ArrayShift = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER13);
  }
  async *run(vm2) {
    const [targetExpr, countExpr, fillExpr] = this.arg.get();
    const target = targetExpr.getCell(vm2);
    const index = await targetExpr.reduceIndex(vm2);
    const length = target.length(index.length);
    const count = await countExpr.reduce(vm2);
    bigint(count, "2nd argument of ARRAYSHIFT must be a number");
    const fill = await fillExpr.reduce(vm2);
    if (count > 0) {
      for (let i = length - 1; i >= count; --i) {
        const value = target.get(vm2, [...index, i - Number(count)]);
        target.set(vm2, value, [...index, i]);
      }
      for (let i = count - 1n; i >= 0; --i) {
        target.set(vm2, fill, [...index, Number(i)]);
      }
    } else if (count < 0) {
      for (let i = 0; i < length + Number(count); ++i) {
        const value = target.get(vm2, [...index, i - Number(count)]);
        target.set(vm2, value, [...index, i]);
      }
      for (let i = length + Number(count); i < length; ++i) {
        target.set(vm2, fill, [...index, i]);
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/bar.js
var PARSER14 = arg3R3(expr, expr, expr);
var Bar = class extends Statement {
  arg;
  newline;
  constructor(raw, newline = false) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER14);
    this.newline = newline;
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const [valueExpr, maxExpr, lengthExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm2);
    bigint(value, "1st argument of BAR must be a number");
    const max2 = await maxExpr.reduce(vm2);
    bigint(max2, "2nd argument of BAR must be a number");
    const length = await lengthExpr.reduce(vm2);
    bigint(length, "3rd argument of BAR must be a number");
    const filled = length * value / max2;
    const text = "[" + "*".repeat(Number(filled)) + ".".repeat(Number(length - filled)) + "]";
    yield* vm2.printer.print(text, /* @__PURE__ */ new Set());
    if (this.newline) {
      yield* vm2.printer.newline();
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/begin.js
var PARSER15 = arg1R1(Identifier);
var Begin = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER15);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    return {
      type: "begin",
      keyword: this.arg.get()
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/break.js
var PARSER16 = arg0R0();
var Break = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER16, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    return {
      type: "break"
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/call.js
var import_parsimmon7 = __toESM(require_parsimmon_umd_min());
var Call = class _Call extends Statement {
  static PARSER = import_parsimmon7.default.alt(arg1R1(import_parsimmon7.default.seq(Identifier.skip(WS0), wrap("(", ")", sepBy0(",", optional(expr))))), argNR1(Identifier, optional(expr)).map(([f, ...r]) => [f, r]));
  static async *exec(vm2, target, argExpr) {
    const realTarget = target.toUpperCase();
    cond(vm2.fnMap.has(realTarget), `Function ${realTarget} does not exist`);
    const arg = [];
    for (const a of argExpr) {
      arg.push(await a?.reduce(vm2));
    }
    const result = yield* vm2.fnMap.get(realTarget).run(vm2, arg);
    switch (result?.type) {
      case "begin":
        return result;
      case "goto":
        return result;
      case "break":
        return result;
      case "continue":
        return result;
      case "throw":
        return result;
      case "return": {
        for (let i = 0; i < result.value.length; ++i) {
          vm2.getValue("RESULT").set(vm2, result.value[i], [i]);
        }
        return null;
      }
      case "quit":
        return result;
      case void 0: {
        vm2.getValue("RESULT").set(vm2, 0n, [0]);
        return null;
      }
    }
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, _Call.PARSER);
  }
  async *run(vm2) {
    const [target, argExpr] = this.arg.get();
    return yield* _Call.exec(vm2, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/callf.js
var CallF = class _CallF extends Statement {
  static async *exec(vm2, target, argExpr) {
    const realTarget = target.toUpperCase();
    cond(vm2.fnMap.has(realTarget), `Function ${realTarget} does not exist`);
    const arg = [];
    for (const a of argExpr) {
      arg.push(await a?.reduce(vm2));
    }
    const result = yield* vm2.fnMap.get(realTarget).run(vm2, arg);
    switch (result?.type) {
      case "begin":
        return result;
      case "goto":
        return result;
      case "break":
        return result;
      case "continue":
        return result;
      case "throw":
        return result;
      case "return":
        return null;
      case "quit":
        return result;
      case void 0:
        return null;
    }
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, Call.PARSER);
  }
  async *run(vm2) {
    const [target, argExpr] = this.arg.get();
    return yield* _CallF.exec(vm2, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/callform.js
var import_parsimmon8 = __toESM(require_parsimmon_umd_min());
var CallForm = class _CallForm extends Statement {
  static PARSER(exclude) {
    return import_parsimmon8.default.alt(arg1R1(import_parsimmon8.default.seq(form[exclude], wrap("(", ")", sepBy0(",", optional(expr))))), argNR1(form[exclude], optional(expr)).map(([f, ...r]) => [f, r]));
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, _CallForm.PARSER("(,"));
  }
  async *run(vm2) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = await targetExpr.reduce(vm2);
    string(target, "1st argument of CALLFORM must be a string");
    return yield* Call.exec(vm2, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/callformf.js
var CallFormF = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, CallForm.PARSER("(,"));
  }
  async *run(vm2) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = await targetExpr.reduce(vm2);
    string(target, "1st argument of CALLFORMF must be a string");
    return yield* CallF.exec(vm2, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/calltrain.js
var PARSER17 = arg1R1(expr);
var CallTrain = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER17);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    bigint(value, "Argument of CALLTRAIN must be a number");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/case.js
var import_parsimmon9 = __toESM(require_parsimmon_umd_min());

// compact-function-ir.mjs
function encodePrintFlags(flags) {
  let mask = 0;
  for (const flag of flags) {
    const code = flag.charCodeAt(0) - 65;
    if (code < 0 || code >= 26) throw new RangeError(`Unsupported PRINT flag: ${flag}`);
    mask |= 1 << code;
  }
  return mask;
}
function hasPrintFlag(flags, flag) {
  if (typeof flags !== "number") return flags.has(flag);
  const code = flag.charCodeAt(0) - 65;
  return code >= 0 && code < 26 && (flags & 1 << code) !== 0;
}
function compactStatementVector(statements) {
  return statements.length === 0 ? null : statements.length === 1 ? statements[0] : statements;
}
function statementVectorLength(statements) {
  return statements == null ? 0 : Array.isArray(statements) ? statements.length : 1;
}
function statementVectorAt(statements, index) {
  return Array.isArray(statements) ? statements[index] : index === 0 ? statements : void 0;
}

// compact-label-map.mjs
var CompactLabelMap = class {
  key;
  value;
  overflow;
  set(key, value) {
    if (this.overflow) {
      this.overflow.set(key, value);
    } else if (this.key === void 0 || this.key === key) {
      this.key = key;
      this.value = value;
    } else {
      this.overflow = /* @__PURE__ */ new Map([[this.key, this.value], [key, value]]);
      this.key = void 0;
      this.value = void 0;
    }
    return this;
  }
  get(key) {
    if (this.overflow) return this.overflow.get(key);
    return this.key === key ? this.value : void 0;
  }
  has(key) {
    if (this.overflow) return this.overflow.has(key);
    return this.key !== void 0 && this.key === key;
  }
  forEach(callback, thisArg) {
    if (this.overflow) {
      this.overflow.forEach((value, key) => callback.call(thisArg, value, key, this));
    } else if (this.key !== void 0) {
      callback.call(thisArg, this.value, this.key, this);
    }
  }
  get size() {
    return this.overflow?.size ?? (this.key === void 0 ? 0 : 1);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/dowhile.js
var LOOP = /^LOOP\s+/i;
var PARSER_ARG = arg0R0();
var PARSER_COND = arg1R1(expr);
var DoWhile = class _DoWhile extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    tryParse(PARSER_ARG, arg);
    const [thunk, consumed] = parseThunk(lines, index, (l) => LOOP.test(l));
    index += consumed;
    const condition = lines[index].slice("LOOP".length);
    index += 1;
    return [new _DoWhile(condition, thunk), index - from];
  }
  arg;
  thunk;
  constructor(raw, thunk) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER_COND);
    this.thunk = thunk;
  }
  async *run(vm2, label) {
    let firstLoop = true;
    while (true) {
      const result = yield* this.thunk.run(vm2, firstLoop ? label : void 0);
      const condition = await this.arg.get().reduce(vm2);
      bigint(condition, "Condition of DO should be an integer");
      if (condition === 0n) {
        break;
      }
      firstLoop = false;
      switch (result?.type) {
        case "begin":
          return result;
        case "goto":
          return result;
        case "break":
          return null;
        case "continue":
          continue;
        case "throw":
          return result;
        case "return":
          return result;
        case "quit":
          return result;
        case void 0:
          continue;
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/for.js
var NEXT = /^NEXT$/i;
var PARSER18 = arg4R3(variable, expr, expr, expr);
var For = class _For extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    const [thunk, consumed] = parseThunk(lines, index, (l) => NEXT.test(l));
    index += consumed + 1;
    return [new _For(arg, thunk), index - from];
  }
  arg;
  thunk;
  constructor(raw, thunk) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER18);
    this.thunk = thunk;
  }
  async *run(vm2, label) {
    if (label != null) {
      if (this.thunk.labelMap.has(label)) {
        return yield* this.thunk.run(vm2, label);
      }
    }
    const [counter, startExpr, endExpr, stepExpr] = this.arg.get();
    const start = await startExpr.reduce(vm2);
    bigint(start, "Starting value for FOR should be an integer");
    const end = await endExpr.reduce(vm2);
    bigint(end, "Ending value for FOR should be an integer");
    const step = await stepExpr?.reduce(vm2) ?? 1n;
    bigint(step, "Step of FOR should be an integer");
    const index = await counter.reduceIndex(vm2);
    loop: for (let i = start; i < end; i += step) {
      counter.getCell(vm2).set(vm2, i, index);
      const result = yield* this.thunk.run(vm2);
      switch (result?.type) {
        case "begin":
          return result;
        case "goto":
          return result;
        case "break":
          break loop;
        case "continue":
          continue loop;
        case "throw":
          return result;
        case "return":
          return result;
        case "quit":
          return result;
        case void 0:
          continue loop;
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/if.js
var IF = /^IF\s+/i;
var ELSEIF = /^ELSEIF\s+/i;
var ELSE = /^ELSE$/i;
var ENDIF = /^ENDIF$/i;
var PARSER19 = arg1R1(expr);
var If = class _If extends Statement {
  static parse(lines, from) {
    let index = from;
    const ifThunk = [];
    let elseThunk = new Thunk([]);
    while (true) {
      if (lines.length <= index) {
        throw parser("Unexpected end of thunk in IF expression");
      }
      const current = lines[index];
      index += 1;
      if (IF.test(current.content)) {
        const [thunk, consumed] = parseThunk(lines, index, (l) => ELSEIF.test(l) || ELSE.test(l) || ENDIF.test(l));
        ifThunk.push([current.slice("IF".length), thunk]);
        index += consumed;
      } else if (ELSEIF.test(current.content)) {
        const [thunk, consumed] = parseThunk(lines, index, (l) => ELSEIF.test(l) || ELSE.test(l) || ENDIF.test(l));
        ifThunk.push([current.slice("ELSEIF".length), thunk]);
        index += consumed;
      } else if (ELSE.test(current.content)) {
        const [thunk, consumed] = parseThunk(lines, index, (l) => ENDIF.test(l));
        elseThunk = thunk;
        index += consumed;
      } else if (ENDIF.test(current.content)) {
        return [new _If(ifThunk, elseThunk), index - from];
      } else {
        throw parser("Unexpected statement in IF expression");
      }
    }
  }
  ifThunk;
  elseThunk;
  constructor(ifThunk, elseThunk) {
    super(ifThunk[0][0]);
    this.ifThunk = ifThunk.map(([raw, thunk]) => [
      raw,
      new lazy_default(raw, PARSER19),
      thunk
    ]);
    this.elseThunk = elseThunk;
  }
  async *run(vm2, label) {
    if (label != null) {
      for (const [, , thunk] of this.ifThunk) {
        if (thunk.labelMap.has(label)) {
          return yield* thunk.run(vm2, label);
        }
      }
      if (this.elseThunk.labelMap.has(label)) {
        return yield* this.elseThunk.run(vm2, label);
      }
    }
    for (const [, cond2, thunk] of this.ifThunk) {
      const condValue = await cond2.get().reduce(vm2);
      bigint(condValue, "Condition should be an integer");
      if (condValue !== 0n) {
        return yield* thunk.run(vm2);
      }
    }
    return yield* this.elseThunk.run(vm2);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/repeat.js
var REND = /^REND$/i;
var PARSER20 = arg1R1(expr);
var Repeat = class _Repeat extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    const [thunk, consumed] = parseThunk(lines, index, (l) => REND.test(l));
    index += consumed + 1;
    return [new _Repeat(arg, thunk), index - from];
  }
  arg;
  thunk;
  constructor(raw, thunk) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER20);
    this.thunk = thunk;
  }
  async *run(vm2, label) {
    if (label != null) {
      if (this.thunk.labelMap.has(label)) {
        return yield* this.thunk.run(vm2, label);
      }
    }
    const condition = await this.arg.get().reduce(vm2);
    bigint(condition, "Condition for REPEAT should be an integer");
    loop: for (let i = 0n; i < condition; ++i) {
      vm2.getValue("COUNT").set(vm2, i, []);
      const result = yield* this.thunk.run(vm2);
      switch (result?.type) {
        case "begin":
          return result;
        case "goto":
          return result;
        case "break":
          break loop;
        case "continue":
          continue loop;
        case "throw":
          return result;
        case "return":
          return result;
        case "quit":
          return result;
        case void 0:
          continue loop;
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/while.js
var WEND = /^WEND$/i;
var PARSER21 = arg1R1(expr);
var While = class _While extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    const [thunk, consumed] = parseThunk(lines, index, (l) => WEND.test(l));
    index += consumed + 1;
    return [new _While(arg, thunk), index - from];
  }
  arg;
  thunk;
  constructor(raw, thunk) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER21);
    this.thunk = thunk;
  }
  async *run(vm2, label) {
    let firstLoop = true;
    while (true) {
      let result;
      if (firstLoop && label != null && this.thunk.labelMap.has(label)) {
        result = yield* this.thunk.run(vm2, label);
      } else {
        const condition = await this.arg.get().reduce(vm2);
        bigint(condition, "Condition of WHILE should be an integer");
        if (condition === 0n) {
          break;
        }
        result = yield* this.thunk.run(vm2);
      }
      firstLoop = false;
      switch (result?.type) {
        case "begin":
          return result;
        case "goto":
          return result;
        case "break":
          return null;
        case "continue":
          continue;
        case "throw":
          return result;
        case "return":
          return result;
        case "quit":
          return result;
        case void 0:
          continue;
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/thunk.js
var Thunk = class {
  statement;
  labelMap;
  // NOTE: `statement` argument is mixed array of statments and labels
  constructor(statement) {
    this.statement = [];
    this.labelMap = new CompactLabelMap();
    for (let i = 0; i < statement.length; ++i) {
      const s = statement[i];
      if (typeof s === "string") {
        this.labelMap.set(s, this.statement.length);
      } else {
        this.statement.push(s);
      }
    }
    for (let i = 0; i < this.statement.length; ++i) {
      const s = this.statement[i];
      if (s instanceof Case) {
        for (const branch of s.branch) {
          branch[1].labelMap.forEach((_, l) => this.labelMap.set(l, i));
        }
        s.def.labelMap.forEach((_, l) => this.labelMap.set(l, i));
      } else if (s instanceof For) {
        s.thunk.labelMap.forEach((_, l) => this.labelMap.set(l, i));
      } else if (s instanceof If) {
        for (const [, , thunk] of s.ifThunk) {
          thunk.labelMap.forEach((_, l) => this.labelMap.set(l, i));
        }
        s.elseThunk.labelMap.forEach((_, l) => this.labelMap.set(l, i));
      } else if (s instanceof Repeat) {
        s.thunk.labelMap.forEach((_, l) => this.labelMap.set(l, i));
      } else if (s instanceof While) {
        s.thunk.labelMap.forEach((_, l) => this.labelMap.set(l, i));
      } else if (s instanceof DoWhile) {
        s.thunk.labelMap.forEach((_, l) => this.labelMap.set(l, i));
      }
    }
    this.statement = compactStatementVector(this.statement);
  }
  async *run(vm2, label) {
    let start = 0;
    if (label != null) {
      start = this.labelMap.get(label) ?? 0;
    }
    for (let i = start; i < statementVectorLength(this.statement); ++i) {
      const statement = statementVectorAt(this.statement, i);
      const result = yield* vm2.run(statement, label);
      switch (result?.type) {
        case "begin":
          return result;
        case "goto": {
          if (this.labelMap.has(result.label)) {
            return yield* this.run(vm2, result.label);
          } else {
            return result;
          }
        }
        case "break":
          return result;
        case "continue":
          return result;
        case "throw":
          return result;
        case "return":
          return result;
        case "quit":
          return result;
        case void 0:
          continue;
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/case.js
var CASE = /^CASE\s+/i;
var CASEELSE = /^CASEELSE$/i;
var ENDSELECT = /^ENDSELECT$/i;
var PARSER_EXPR = arg1R1(expr);
var PARSER_BRANCH = argNR0(import_parsimmon9.default.alt(import_parsimmon9.default.seqMap(Int, import_parsimmon9.default.regex(/TO/i).trim(WS1).then(Int), (from, to) => ({
  type: "range",
  from: BigInt(from),
  to: BigInt(to)
})), import_parsimmon9.default.seqMap(import_parsimmon9.default.regex(/IS/i).then(alt("<=", "<", ">=", ">").trim(WS0)), expr, (op, value) => ({ type: "compare", op, value })), Int.map((value) => ({ type: "equal", value: BigInt(value) })), Str.map((value) => ({ type: "equal", value }))));
var Case = class _Case extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    const branch = [];
    let def = new Thunk([]);
    while (true) {
      if (lines.length <= index) {
        throw parser("Unexpected end of thunk in CASE expression");
      }
      const current = lines[index];
      index += 1;
      if (CASE.test(current.get())) {
        const [thunk, consumed] = parseThunk(lines, index, (l) => CASE.test(l) || CASEELSE.test(l) || ENDSELECT.test(l));
        branch.push([current.slice("CASE".length), thunk]);
        index += consumed;
      } else if (CASEELSE.test(current.get())) {
        const [thunk, consumed] = parseThunk(lines, index, (l) => ENDSELECT.test(l));
        def = thunk;
        index += consumed;
      } else if (ENDSELECT.test(current.get())) {
        return [new _Case(arg, branch, def), index - from];
      } else {
        throw parser("Unexpected statement in CASE expression");
      }
    }
  }
  arg;
  branch;
  def;
  constructor(raw, branch, def) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER_EXPR);
    this.branch = branch.map(([cond2, thunk]) => [new lazy_default(cond2, PARSER_BRANCH), thunk]);
    this.def = def;
  }
  async *run(vm2, label) {
    if (label != null) {
      for (const [, thunk] of this.branch) {
        if (thunk.labelMap.has(label)) {
          return yield* thunk.run(vm2, label);
        }
      }
      if (this.def.labelMap.has(label)) {
        return yield* this.def.run(vm2, label);
      }
    }
    const value = await this.arg.get().reduce(vm2);
    for (const [cond2, expr2] of this.branch) {
      const satisfied = cond2.get().some((c) => {
        switch (c.type) {
          case "equal":
            return c.value === value;
          case "range":
            return c.from <= value && value <= c.to;
          case "compare": {
            bigint(value, "CASE IS ... should be used for an integer value");
            switch (c.op) {
              case "<":
                return value < c.value;
              case "<=":
                return value <= c.value;
              case ">":
                return value > c.value;
              case ">=":
                return value >= c.value;
            }
          }
        }
      });
      if (satisfied) {
        return yield* expr2.run(vm2);
      }
    }
    return yield* this.def.run(vm2);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/cbgclear.js
var PARSER22 = arg0R0();
var CbgClear = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER22, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("CBGCLEAR");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/cbgclearbutton.js
var PARSER23 = arg0R0();
var CbgClearButton = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER23, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("CBGCLEARBUTTON");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/cbgremovebmap.js
var PARSER24 = arg0R0();
var CbgRemoveBmap = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER24, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("CBGREMOVEBMAP");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/savedata.js
var savefile = {
  global: "global.sav",
  game: (i) => "save" + i.toString().padStart(2, "0") + ".sav"
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/chkdata.js
var PARSER25 = arg1R1(expr);
var ChkData = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER25);
  }
  async *run(vm2) {
    const index = await this.arg.get().reduce(vm2);
    bigint(index, "1st argument of CHKDATA must be a number");
    let result;
    let message = "";
    const file = savefile.game(Number(index));
    const raw = await vm2.external.getSavedata(file);
    if (raw == null) {
      result = 1n;
      message = "----";
    } else {
      try {
        const parsed = JSON.parse(raw);
        number(parsed.code, `Save file ${file} is not in a valid format`);
        number(parsed.version, `Save file ${file} is not in a valid format`);
        string(parsed.data.comment, `Save file ${file} is not in a valid format`);
        const code = vm2.code.csv.gamebase.code ?? 0;
        const version = vm2.code.csv.gamebase.version ?? 0;
        if (parsed.code !== code) {
          result = 2n;
          message = "\u7570\u306A\u308B\u30B2\u30FC\u30E0\u306E\u30BB\u30FC\u30D6\u30C7\u30FC\u30BF\u3067\u3059";
        } else if (parsed.version !== version) {
          result = 3n;
          message = "\u30BB\u30FC\u30D6\u30C7\u30FC\u30BF\u306E\u30D0\u30FC\u30B7\u30E7\u30F3\u304C\u7570\u306A\u308A\u307E\u3059";
        } else {
          result = 0n;
          message = parsed.data.comment;
        }
      } catch {
        result = 4n;
        message = "\u8AAD\u307F\u8FBC\u307F\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F";
      }
    }
    vm2.getValue("RESULT").set(vm2, result, [0]);
    vm2.getValue("RESULTS").set(vm2, message, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/chkfont.js
var PARSER26 = arg1R1(expr);
var ChkFont = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER26);
  }
  async *run(vm2) {
    const arg = await this.arg.get().reduce(vm2);
    string(arg, "1st argument of CHKFONT should be a string");
    const result = vm2.external.getFont(arg) ? 1n : 0n;
    vm2.getValue("RESULT").set(vm2, result, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/clearbit.js
var PARSER27 = argNR1(variable, expr);
var ClearBit = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER27);
  }
  async *run(vm2) {
    const [destExpr, ...bitExpr] = this.arg.get();
    const value = await destExpr.reduce(vm2);
    bigint(value, "1st argument of CLEARBIT must be a number");
    const bitList = [];
    for (let i = 0; i < bitExpr.length; ++i) {
      const bit = await bitExpr[i].reduce(vm2);
      bigint(bit, `${i + 1}th Argument of CLEARBIT must be a number`);
      bitList.push(bit);
    }
    let result = value;
    for (const bit of bitList) {
      result &= ~(1n << bit);
    }
    destExpr.getCell(vm2).set(vm2, result, await destExpr.reduceIndex(vm2));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/clearline.js
var PARSER28 = arg1R1(expr);
var ClearLine = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER28);
  }
  async *run(vm2) {
    const count = await this.arg.get().reduce(vm2);
    bigint(count, "Argument of CLEARLINE must be an integer!");
    yield* vm2.printer.clear(Number(count));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/cleartextbox.js
var PARSER29 = arg0R0();
var ClearTextBox = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER29, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("CLEARTEXTBOX");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/continue.js
var PARSER30 = arg0R0();
var Continue = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER30, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    return {
      type: "continue"
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/copychara.js
var PARSER31 = arg2R2(expr, expr);
var CopyChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER31);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("COPYCHARA");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/cupcheck.js
var PARSER32 = arg0R0();
var CUpCheck = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER32, raw);
  }
  async *run(vm2) {
    const length = Math.min(vm2.getValue("PALAM").length(1), vm2.getValue("CUP").length(1), vm2.getValue("CDOWN").length(1));
    for (let i = 0; i < length; ++i) {
      const up = vm2.getValue("CUP").get(vm2, [i]);
      const down = vm2.getValue("CDOWN").get(vm2, [i]);
      const palam = vm2.getValue("PALAM").get(vm2, [i]);
      if (up <= 0 && down <= 0) {
        continue;
      }
      const result = palam + up - down;
      vm2.getValue("PALAM").set(vm2, result, [i]);
      vm2.getValue("CUP").set(vm2, 0n, [i]);
      vm2.getValue("CDOWN").set(vm2, 0n, [i]);
      if (!vm2.printer.skipDisp) {
        const name = vm2.code.csv.palam.get(i);
        let text = `${name} ${palam}`;
        if (up > 0) {
          text += `+${up}`;
        }
        if (down > 0) {
          text += `-${down}`;
        }
        text += `=${result}`;
        yield* vm2.printer.print(text, /* @__PURE__ */ new Set(["L"]));
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/currentalign.js
var PARSER33 = arg0R0();
var CurrentAlign = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER33, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("CURRENTALIGN");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/currentredraw.js
var PARSER34 = arg0R0();
var CurrentRedraw = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER34, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.getValue("RESULT").set(vm2, vm2.printer.draw ? 1n : 0n, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/customdrawline.js
var PARSER35 = arg1R1(charSeq());
var CustomDrawLine = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER35);
  }
  async *run(vm2) {
    const value = this.arg.get();
    yield* vm2.printer.line(value);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/cvarset.js
var PARSER36 = arg5R1(variable, expr, expr, expr, expr);
var VarSet = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER36);
  }
  async *run(vm2) {
    const [destExpr, indexExpr, valueExpr, startExpr, endExpr] = this.arg.get();
    const index = await indexExpr?.reduce(vm2) ?? 0n;
    bigint(index, "2nd argument of CVARSET must be a number");
    const value = await valueExpr?.reduce(vm2);
    const start = await startExpr?.reduce(vm2) ?? 0n;
    bigint(start, "4th argument of CVARSET must be a number");
    const end = await endExpr?.reduce(vm2) ?? BigInt(vm2.characterList.length);
    bigint(end, "5th argument of CVARSET must be a number");
    for (let i = start; i < end; ++i) {
      const character = vm2.characterList[Number(i)];
      const cell = character.getValue(destExpr.name);
      if (value != null) {
        cell.set(vm2, value, [Number(index)]);
      } else {
        if (cell.type === "number") {
          cell.set(vm2, 0n, [Number(index)]);
        } else {
          cell.set(vm2, "", [Number(index)]);
        }
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/debugclear.js
var PARSER37 = arg0R0();
var DebugClear = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER37, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("DEBUGCLEAR");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/delallchara.js
var PARSER38 = arg0R0();
var DelAllChara = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER38, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("DELALLCHARA");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/delchara.js
var PARSER39 = argNR0(expr);
var DelChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER39);
  }
  async *run(vm2) {
    const arg = this.arg.get();
    const indexList = [];
    for (let i = 0; i < arg.length; ++i) {
      const index = await arg[i].reduce(vm2);
      bigint(index, `${i + 1}th argument of DELCHARA should be a number`);
      indexList.push(index);
    }
    indexList.sort();
    indexList.reverse();
    for (const index of indexList) {
      vm2.characterList.splice(Number(index), 1);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/deldata.js
var PARSER40 = arg1R1(expr);
var DelData = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER40);
  }
  async *run(vm2) {
    const index = await this.arg.get().reduce(vm2);
    bigint(index, "Argument of DELDATA must be a number");
    throw notImpl("DELDATA");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/drawline.js
var PARSER41 = arg0R0();
var DrawLine = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER41, raw);
  }
  async *run(vm2) {
    yield* vm2.printer.line();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/drawlineform.js
var PARSER42 = arg1R1(form[""]);
var DrawLineForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER42);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    yield* vm2.printer.line(value);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/dumprand.js
var PARSER43 = arg0R0();
var DumpRand = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER43, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.getValue("RANDDATA").set(vm2, BigInt(vm2.random.state), []);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/encodetouni.js
var PARSER44 = arg1R1(form[""]);
var EncodeToUni = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER44);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    string(value, "1st argument of ENCODETOUNI must be a string");
    const buffer = Buffer.from(value, "utf8");
    vm2.getValue("RESULT").set(vm2, BigInt(buffer.byteLength), [0]);
    for (let i = 0; i < buffer.byteLength; ++i) {
      vm2.getValue("RESULT").set(vm2, BigInt(buffer[i]), [i + 1]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/escape.js
var PARSER45 = arg1R1(expr);
var Escape = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER45);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    string(value, "1st argument of ESCAPE must be a string");
    let result = value;
    result = result.replace("\\", "\\\\");
    result = result.replace("*", "\\*");
    result = result.replace("+", "\\+");
    result = result.replace("?", "\\?");
    result = result.replace("|", "\\|");
    result = result.replace("{", "\\}");
    result = result.replace("[", "\\[");
    result = result.replace("(", "\\(");
    result = result.replace(")", "\\)");
    result = result.replace("^", "\\^");
    result = result.replace("$", "\\$");
    result = result.replace(".", "\\.");
    result = result.replace("#", "\\#");
    vm2.getValue("RESULTS").set(vm2, result, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/fontbold.js
var PARSER46 = arg0R0();
var FontBold = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER46, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.printer.font.bold = !vm2.printer.font.bold;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/fontitalic.js
var PARSER47 = arg0R0();
var FontItalic = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER47, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.printer.font.italic = !vm2.printer.font.italic;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/fontregular.js
var PARSER48 = arg0R0();
var FontRegular = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER48, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.printer.font.bold = false;
    vm2.printer.font.italic = false;
    vm2.printer.font.strike = false;
    vm2.printer.font.underline = false;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/fontstyle.js
var PARSER49 = arg1R1(expr);
var FontStyle = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER49);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    bigint(value, "Argument of FONTSTYLE must be an integer!");
    vm2.printer.font.bold = (value & 1n << 0n) !== 0n;
    vm2.printer.font.italic = (value & 1n << 1n) !== 0n;
    vm2.printer.font.strike = (value & 1n << 2n) !== 0n;
    vm2.printer.font.underline = (value & 1n << 3n) !== 0n;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/forcewait.js
var PARSER50 = arg0R0();
var ForceWait = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER50, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("FORCEWAIT");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getexplv.js
var PARSER51 = arg2R2(expr, expr);
var GetExpLv = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER51);
  }
  async *run(vm2) {
    const [valExpr, maxExpr] = this.arg.get();
    const value = await valExpr.reduce(vm2);
    bigint(value, "1st argument of GETEXPLV must be a number");
    const max2 = await maxExpr.reduce(vm2);
    bigint(max2, "2nd argument of GETEXPLV must be a number");
    let result = max2;
    for (let i = 0n; i <= max2; ++i) {
      if (value < vm2.getValue("EXPLV").get(vm2, [Number(i)])) {
        result = i - 1n;
        break;
      }
    }
    vm2.getValue("RESULT").set(vm2, result, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getfont.js
var PARSER52 = arg0R0();
var GetFont = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER52, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const result = vm2.printer.font.name;
    vm2.getValue("RESULTS").set(vm2, result, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getmillisecond.js
var import_dayjs = __toESM(require_dayjs_min());
var UNIX_EPOCH = 719162 * 24 * 60 * 60;
var PARSER53 = arg0R0();
var GetMillisecond = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER53, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const time = (0, import_dayjs.default)(vm2.external.getTime());
    vm2.getValue("RESULT").set(vm2, BigInt(time.valueOf() - UNIX_EPOCH * 1e3), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getpalamlv.js
var PARSER54 = arg2R2(expr, expr);
var GetPalamLv = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER54);
  }
  async *run(vm2) {
    const [valExpr, maxExpr] = this.arg.get();
    const value = await valExpr.reduce(vm2);
    bigint(value, "1st argument of GETPALAMLV must be a number");
    const max2 = await maxExpr.reduce(vm2);
    bigint(max2, "2nd argument of GETPALAMLV must be a number");
    let result = max2;
    for (let i = 0n; i <= max2; ++i) {
      if (value < vm2.getValue("PALAMLV").get(vm2, [Number(i)])) {
        result = i - 1n;
        break;
      }
    }
    vm2.getValue("RESULT").set(vm2, result, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getsecond.js
var import_dayjs2 = __toESM(require_dayjs_min());
var UNIX_EPOCH2 = 719162 * 24 * 60 * 60;
var PARSER55 = arg0R0();
var GetSecond = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER55, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const time = (0, import_dayjs2.default)(vm2.external.getTime());
    vm2.getValue("RESULT").set(vm2, BigInt(time.unix() - UNIX_EPOCH2), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getstyle.js
var PARSER56 = arg0R0();
var GetStyle = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER56, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("GETSTYLE");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/gettime.js
var import_dayjs3 = __toESM(require_dayjs_min());
var PARSER57 = arg0R0();
var GetTime = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER57, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const time = (0, import_dayjs3.default)(vm2.external.getTime());
    vm2.getValue("RESULT").set(vm2, BigInt(parseInt(time.format("YYYYMMDDHHmmssSSS"))), [0]);
    vm2.getValue("RESULTS").set(vm2, time.format("YYYY\u5E74MM\u6708DD\u65E5 HH:mm:ss"), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/goto.js
var PARSER58 = arg1R1(Identifier);
var Goto = class _Goto extends Statement {
  static *exec(vm2, target) {
    const realTarget = target.toUpperCase();
    const context = vm2.context();
    cond(context.fn.thunk.labelMap.has(realTarget), `Label ${realTarget} does not exist`);
    return {
      type: "goto",
      label: target
    };
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER58);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const target = this.arg.get();
    return yield* _Goto.exec(vm2, target);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/gotoform.js
var PARSER59 = arg1R1(form[""]);
var GotoForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER59);
  }
  async *run(vm2) {
    const arg = await this.arg.get().reduce(vm2);
    const target = arg.toUpperCase();
    const context = vm2.context();
    if (!context.fn.thunk.labelMap.has(target)) {
      throw notFound("Label", target);
    }
    return {
      type: "goto",
      label: target
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/input.js
var PARSER60 = arg1R0(Int);
var Input = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER60);
  }
  async *run(vm2) {
    const arg = this.arg.get();
    const input = yield* vm2.printer.input(true, arg != null);
    cond(input != null, "Input value for INPUT should be a valid number");
    let value = Number(input);
    if (arg != null && input === "") {
      value = arg;
    }
    number(value, "Input value for INPUT should be a valid number");
    yield* vm2.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULT").set(vm2, BigInt(value), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/inputs.js
var PARSER61 = arg1R0(charSeq());
var InputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER61);
  }
  async *run(vm2) {
    const arg = this.arg.get();
    let input = yield* vm2.printer.input(false, arg != null);
    string(input, "Input value for INPUTS should be a valid string");
    if (arg != null && input === "") {
      input = arg;
    }
    yield* vm2.printer.print(input, /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULTS").set(vm2, input, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/initrand.js
var PARSER62 = arg0R0();
var InitRand = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER62, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.random.state = Number(vm2.getValue("RANDDATA").get(vm2, []));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/invertbit.js
var PARSER63 = argNR1(variable, expr);
var InvertBit = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER63);
  }
  async *run(vm2) {
    const [destExpr, ...bitExpr] = this.arg.get();
    const value = await destExpr.reduce(vm2);
    bigint(value, "1st argument of INVERTBIT must be a number");
    const bitList = [];
    for (let i = 0; i < bitExpr.length; ++i) {
      const bit = await bitExpr[i].reduce(vm2);
      bigint(bit, `${i + 2}th argument of INVERTBIT must be a number`);
      bitList.push(bit);
    }
    let result = value;
    for (const bit of bitList) {
      result ^= 1n << bit;
    }
    destExpr.getCell(vm2).set(vm2, result, await destExpr.reduceIndex(vm2));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/isactive.js
var PARSER64 = arg0R0();
var IsActive = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER64, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("ISACTIVE");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/isskip.js
var PARSER65 = arg0R0();
var IsSkip = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER65, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("ISSKIP");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/jump.js
var Jump = class _Jump extends Statement {
  static async *exec(vm2, target, argExpr) {
    const realTarget = target.toUpperCase();
    cond(vm2.fnMap.has(realTarget), `Function ${realTarget} does not exist`);
    const arg = [];
    for (const a of argExpr) {
      arg.push(await a?.reduce(vm2));
    }
    return yield* vm2.fnMap.get(realTarget).run(vm2, arg);
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, Call.PARSER);
  }
  async *run(vm2) {
    const [target, argExpr] = this.arg.get();
    return yield* _Jump.exec(vm2, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/jumpform.js
var JumpForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, CallForm.PARSER("("));
  }
  async *run(vm2) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = await targetExpr.reduce(vm2);
    return yield* Jump.exec(vm2, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/int-2d.js
var Int2DValue = class _Int2DValue {
  type = "number";
  name;
  value;
  static normalizeIndex(name, index) {
    if (index.length === 0) {
      return [0, 0];
    } else if (index.length === 1) {
      return [index[0], 0];
    } else if (index.length === 2) {
      return index;
    } else if (index.length === 3 && index[2] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("2D", name, index);
    }
  }
  constructor(name, size) {
    const realSize = size ?? [100, 100];
    cond(realSize.length === 2, `${name} is not a ${realSize.length}D variable`);
    this.name = name;
    this.saveShape = [...realSize];
    this.value = createPagedArray(realSize, 0n);
  }
  reset(value) {
    for (let i = 0; i < this.value.length; ++i) {
      for (let j = 0; j < this.value[i].length; ++j) {
        this.value[i][j] = 0n;
      }
    }
    for (let i = 0; i < value.length; ++i) {
      for (let j = 0; j < value[i].length; ++j) {
        this.value[i][j] = BigInt(value[i][j]);
      }
    }
    return this;
  }
  get(_vm, index) {
    const realIndex = _Int2DValue.normalizeIndex(this.name, index);
    return pagedArrayGet(this.value, realIndex);
  }
  set(_vm, value, index) {
    const realIndex = _Int2DValue.normalizeIndex(this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    pagedArraySet(this.value, realIndex, value);
  }
  // NOTE: index, range are ignored (Emuera emulation)
  rangeSet(_vm, value, _index, _range) {
    bigint(value, "Cannot assign a string to a numeric variable");
    for (let i = 0; i < this.value.length; ++i) {
      for (let j = 0; j < this.value[i].length; ++j) {
        this.value[i][j] = value;
      }
    }
  }
  length(depth) {
    switch (depth) {
      case 0:
        return this.value.length;
      case 1:
        return this.value[0].length;
      case 2:
        return 1;
      default:
        throw new Error(`2D variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/int-3d.js
var Int3DValue = class _Int3DValue {
  type = "number";
  name;
  value;
  static normalizeIndex(name, index) {
    if (index.length === 0) {
      return [0, 0, 0];
    } else if (index.length === 1) {
      return [index[0], 0, 0];
    } else if (index.length === 2) {
      return [index[0], index[1], 0];
    } else if (index.length === 3) {
      return index;
    } else if (index.length === 4 && index[3] === 0) {
      return index.slice(0, -1);
    } else {
      throw invalidIndex("3D", name, index);
    }
  }
  constructor(name, size) {
    const realSize = size ?? [100, 100, 100];
    cond(realSize.length === 3, `${name} is not a ${realSize.length}D variable`);
    this.name = name;
    this.saveShape = [...realSize];
    this.value = createPagedArray(realSize, 0n);
  }
  reset(value) {
    for (let i = 0; i < this.value.length; ++i) {
      for (let j = 0; j < this.value[i].length; ++j) {
        for (let k = 0; k < this.value[i][j].length; ++k) {
          this.value[i][j][k] = 0n;
        }
      }
    }
    for (let i = 0; i < value.length; ++i) {
      for (let j = 0; j < value[i].length; ++j) {
        for (let k = 0; k < value[i][j].length; ++k) {
          this.value[i][j][k] = BigInt(value[i][j][k]);
        }
      }
    }
    return this;
  }
  get(_vm, index) {
    const realIndex = _Int3DValue.normalizeIndex(this.name, index);
    return pagedArrayGet(this.value, realIndex);
  }
  set(_vm, value, index) {
    const realIndex = _Int3DValue.normalizeIndex(this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    pagedArraySet(this.value, realIndex, BigInt(value));
  }
  // NOTE: index, range are ignored (Emuera emulation)
  rangeSet(_vm, value, _index, _range) {
    bigint(value, "Cannot assign a string to a numeric variable");
    for (let i = 0; i < this.value.length; ++i) {
      for (let j = 0; j < this.value[i].length; ++j) {
        for (let k = 0; k < this.value[i][j].length; ++k) {
          this.value[i][j][k] = value;
        }
      }
    }
  }
  length(depth) {
    switch (depth) {
      case 0:
        return this.value.length;
      case 1:
        return this.value[0].length;
      case 2:
        return this.value[0][0].length;
      case 3:
        return 1;
      default:
        throw new Error(`3D variable doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/loaddata.js
var PARSER66 = arg1R1(expr);
var LoadData = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER66);
  }
  async *run(vm2) {
    const index = await this.arg.get().reduce(vm2);
    bigint(index, "Argument of LOADDATA must be a number");
    const file = savefile.game(Number(index));
    const raw = await vm2.external.getSavedata(file);
    nonNull(raw, `Save file ${file} does not exist`);
    try {
      const parsed = JSON.parse(raw);
      string(parsed.data.comment, "");
      array(parsed.data.characters, "");
      const newCharacters = [];
      for (const character of parsed.data.characters) {
        const newCharacter = new Character(vm2, {
          no: 0,
          name: "",
          callname: "",
          nickname: "",
          mastername: "",
          base: /* @__PURE__ */ new Map(),
          maxBase: /* @__PURE__ */ new Map(),
          mark: /* @__PURE__ */ new Map(),
          exp: /* @__PURE__ */ new Map(),
          abl: /* @__PURE__ */ new Map(),
          talent: /* @__PURE__ */ new Map(),
          relation: /* @__PURE__ */ new Map(),
          cflag: /* @__PURE__ */ new Map(),
          equip: /* @__PURE__ */ new Map(),
          juel: /* @__PURE__ */ new Map(),
          cstr: /* @__PURE__ */ new Map()
        });
        for (const [name, value] of Object.entries(character)) {
          const cell = newCharacter.getValue(name);
          if (cell instanceof Int0DValue) {
            string(value, "");
            cell.reset(BigInt(value));
          } else if (cell instanceof Int1DValue) {
            strArray(value, "");
            cell.reset(value);
          } else if (cell instanceof Str0DValue) {
            string(value, "");
            cell.reset(value);
          } else if (cell instanceof Str1DValue) {
            strArray(value, "");
            cell.reset(value);
          }
        }
        newCharacters.push(newCharacter);
      }
      vm2.characterList = newCharacters;
      for (const [name, value] of Object.entries(parsed.data.variables)) {
        const cell = vm2.getValue(name);
        if (cell instanceof Int0DValue) {
          string(value, "");
          cell.reset(BigInt(value));
        } else if (cell instanceof Int1DValue) {
          strArray(value, "");
          cell.reset(value);
        } else if (cell instanceof Int2DValue) {
          strArray2D(value, "");
          cell.reset(value);
        } else if (cell instanceof Int3DValue) {
          strArray3D(value, "");
          cell.reset(value);
        } else if (cell instanceof Str0DValue) {
          string(value, "");
          cell.reset(value);
        } else if (cell instanceof Str1DValue) {
          strArray(value, "");
          cell.reset(value);
        } else {
          throw new Error("");
        }
      }
      vm2.getValue("LASTLOAD_VERSION").set(vm2, BigInt(parsed.version), []);
      vm2.getValue("LASTLOAD_TEXT").set(vm2, parsed.data.comment, []);
    } catch {
      throw new Error(`Save file ${file} is not in a valid format`);
    }
    return {
      type: "begin",
      keyword: "DATALOADED"
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/loadgame.js
var PARSER67 = arg0R0();
var LoadGame = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER67, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    return {
      type: "begin",
      keyword: "LOADGAME"
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/loadglobal.js
var PARSER68 = arg0R0();
var LoadGlobal = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER68, raw);
  }
  async *run(vm2) {
    const file = savefile.global;
    const raw = await vm2.external.getSavedata(file);
    try {
      nonNull(raw, "");
      const parsed = JSON.parse(raw);
      const code = vm2.code.csv.gamebase.code ?? 0;
      const version = vm2.code.csv.gamebase.version ?? 0;
      cond(parsed.code === code, "");
      cond(parsed.version === version, "");
      for (const [name, value] of Object.entries(parsed.data)) {
        const cell = vm2.getValue(name);
        if (cell instanceof Int0DValue) {
          string(value, "");
          cell.reset(BigInt(value));
        } else if (cell instanceof Int1DValue) {
          strArray(value, "");
          cell.reset(value);
        } else if (cell instanceof Int2DValue) {
          strArray2D(value, "");
          cell.reset(value);
        } else if (cell instanceof Int3DValue) {
          strArray3D(value, "");
          cell.reset(value);
        } else if (cell instanceof Str0DValue) {
          string(value, "");
          cell.reset(value);
        } else if (cell instanceof Str1DValue) {
          strArray(value, "");
          cell.reset(value);
        } else {
          throw new Error("");
        }
      }
      vm2.getValue("RESULT").set(vm2, 1n, [0]);
    } catch {
      vm2.getValue("RESULT").set(vm2, 0n, [0]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/method.js
var PARSER69 = argNR0(expr);
var Method = class extends Statement {
  name;
  arg;
  constructor(name, raw) {
    super(raw);
    this.name = name;
    this.arg = new lazy_default(raw, PARSER69);
  }
  async *run(vm2) {
    const arg = this.arg.get();
    let result;
    switch (this.name) {
      case "ABS":
        result = await abs(vm2, arg);
        break;
      case "BARSTR":
        result = await barStr(vm2, arg);
        break;
      case "CSVABL":
        result = BigInt(await csvAbl(vm2, arg));
        break;
      case "CSVBASE":
        result = BigInt(await csvBase(vm2, arg));
        break;
      case "CSVCALLNAME":
        result = await csvCallname(vm2, arg);
        break;
      case "CSVCFLAG":
        result = BigInt(await csvCflag(vm2, arg));
        break;
      case "CSVCSTR":
        result = await csvCstr(vm2, arg);
        break;
      case "CSVEQUIP":
        result = BigInt(await csvEquip(vm2, arg));
        break;
      case "CSVEXP":
        result = BigInt(await csvExp(vm2, arg));
        break;
      case "CSVJUEL":
        result = BigInt(await csvJuel(vm2, arg));
        break;
      case "CSVMARK":
        result = BigInt(await csvMark(vm2, arg));
        break;
      case "CSVMASTERNAME":
        result = await csvMastername(vm2, arg);
        break;
      case "CSVNAME":
        result = await csvName(vm2, arg);
        break;
      case "CSVNICKNAME":
        result = await csvNickname(vm2, arg);
        break;
      case "CSVRELATION":
        result = BigInt(await csvRelation(vm2, arg));
        break;
      case "CSVTALENT":
        result = BigInt(await csvTalent(vm2, arg));
        break;
      case "EXISTCSV":
        result = BigInt(await existCsv(vm2, arg));
        break;
      case "FINDCHARA":
        result = await findChara(vm2, arg);
        break;
      case "FINDLASTCHARA":
        result = await findLastChara(vm2, arg);
        break;
      case "GETBGCOLOR":
        result = BigInt(getBgColor(vm2, arg));
        break;
      case "GETBIT":
        result = BigInt(await getBit(vm2, arg));
        break;
      case "GETCHARA":
        result = BigInt(await getChara(vm2, arg));
        break;
      case "GETCOLOR":
        result = BigInt(getColor(vm2, arg));
        break;
      case "GETDEFBGCOLOR":
        result = BigInt(getDefBgColor(vm2, arg));
        break;
      case "GETDEFCOLOR":
        result = BigInt(getDefColor(vm2, arg));
        break;
      case "GETFOCUSCOLOR":
        result = BigInt(getFocusColor(vm2, arg));
        break;
      case "GROUPMATCH":
        result = BigInt(await groupMatch(vm2, arg));
        break;
      case "INRANGE":
        result = BigInt(await inRange(vm2, arg));
        break;
      case "LIMIT":
        result = await limit(vm2, arg);
        break;
      case "LINEISEMPTY":
        result = BigInt(lineIsEmpty(vm2, arg));
        break;
      case "MATCH":
        result = BigInt(await match(vm2, arg));
        break;
      case "MAX":
        result = await max(vm2, arg);
        break;
      case "MAXARRAY":
        result = await maxArray(vm2, arg);
        break;
      case "MIN":
        result = await min(vm2, arg);
        break;
      case "MINARRAY":
        result = await minArray(vm2, arg);
        break;
      case "POWER":
        result = await power(vm2, arg);
        break;
      case "RAND":
        result = await rand(vm2, arg);
        break;
      case "SIGN":
        result = BigInt(await sign(vm2, arg));
        break;
      case "SQRT":
        result = await sqrt(vm2, arg);
        break;
      case "STRLENS":
        result = BigInt(await strLenS(vm2, arg));
        break;
      case "STRLENSU":
        result = BigInt(await strLenSU(vm2, arg));
        break;
      case "SUMARRAY":
        result = await sumArray(vm2, arg);
        break;
      case "TOINT":
        result = BigInt(await toInt(vm2, arg));
        break;
      case "TOSTR":
        result = await toStr(vm2, arg);
        break;
      case "VARSIZE":
        result = BigInt(await varSize(vm2, arg));
        break;
      case "UNICODE":
        result = await unicode(vm2, arg);
        break;
      default:
        throw internal(`${this.name} is not a valid method command`);
    }
    if (typeof result === "bigint") {
      vm2.getValue("RESULT").set(vm2, result, [0]);
    } else {
      vm2.getValue("RESULTS").set(vm2, result, [0]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/mouseskip.js
var PARSER70 = arg0R0();
var MouseSkip = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER70, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("MOUSESKIP");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/mousex.js
var PARSER71 = arg0R0();
var MouseX = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER71, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("MOUSEX");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/mousey.js
var PARSER72 = arg0R0();
var MouseY = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER72, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("mousey");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/oneinput.js
var PARSER73 = arg1R0(Int);
var OneInput = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER73);
  }
  // TODO: use only the first character of argument
  async *run(vm2) {
    const arg = this.arg.get();
    const input = yield* vm2.printer.input(true, arg != null);
    cond(input != null, "First value of input for ONEINPUT should be a valid number");
    let value = Number(input[0]);
    if (arg != null && input === "") {
      value = arg;
    }
    number(value, "First value of input for ONEINPUT should be a valid number");
    yield* vm2.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULT").set(vm2, BigInt(value), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/oneinputs.js
var PARSER74 = arg1R0(charSeq());
var OneInputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER74);
  }
  async *run(vm2) {
    const arg = this.arg.get();
    let input = yield* vm2.printer.input(false, arg != null);
    string(input, "Input value for ONEINPUTS should be a valid string");
    if (arg != null && input === "") {
      input = arg;
    }
    yield* vm2.printer.print(input, /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULTS").set(vm2, input[0], [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/outputlog.js
var PARSER75 = arg0R0();
var OutputLog = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER75, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("OUTPUTLOG");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/pickupchara.js
var PARSER76 = argNR1(expr, expr);
var PickupChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER76);
  }
  async *run(vm2) {
    const argExpr = this.arg.get();
    const arg = [];
    for (let i = 0; i < argExpr.length; ++i) {
      const value = await argExpr[i].reduce(vm2);
      bigint(value, `${i + 1}th argument of PICKUPCHARA should be a number`);
      cond(value >= 0 && value < vm2.characterList.length, `${i + 1}th argument of PICKUPCHARA is out of range`);
      arg.push(value);
    }
    let target = -1n;
    let assi = -1n;
    let master = -1n;
    const characterList = [];
    for (let i = 0n; i < arg.length; ++i) {
      const index = arg[Number(i)];
      if (index === vm2.getValue("TARGET").get(vm2, [])) {
        target = i;
      }
      if (index === vm2.getValue("ASSI").get(vm2, [])) {
        assi = i;
      }
      if (index === vm2.getValue("MASTER").get(vm2, [])) {
        master = i;
      }
      characterList.push(vm2.characterList[Number(i)]);
    }
    vm2.getValue("TARGET").set(vm2, target, []);
    vm2.getValue("ASSI").set(vm2, assi, []);
    vm2.getValue("MASTER").set(vm2, master, []);
    vm2.characterList = characterList;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/print.js
var PARSER77 = arg1R0(charSeq()).map((str) => str ?? "");
var Print = class extends Statement {
  flags;
  value;
  constructor(flags, raw) {
    super(raw);
    this.flags = encodePrintFlags(flags);
    this.value = new lazy_default(raw, PARSER77);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    yield* vm2.printer.print(this.value.get(), this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printbutton.js
var PARSER78 = arg2R2(expr, expr);
var PrintButton = class extends Statement {
  align;
  arg;
  constructor(raw, align) {
    super(raw);
    this.align = align;
    this.arg = new lazy_default(raw, PARSER78);
  }
  async *run(vm2) {
    const [textExpr, valueExpr] = this.arg.get();
    const text = await textExpr.reduce(vm2);
    string(text, "1st argument of PRINTBUTTON must be a string");
    const value = await valueExpr.reduce(vm2);
    yield* vm2.printer.button(text, typeof value === "string" ? value : value.toString(), this.align);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printc.js
var PARSER79 = arg1R0(charSeq()).map((str) => str ?? "");
var PrintC = class extends Statement {
  align;
  flags;
  value;
  constructor(align, flags, raw) {
    super(raw);
    this.align = align;
    this.flags = encodePrintFlags(flags);
    this.value = new lazy_default(raw, PARSER79);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const value = this.value.get();
    yield* vm2.printer.print(value, this.flags, this.align);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printcperline.js
var PARSER80 = arg0R0();
var PrintCPerLine = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER80, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.getValue("RESULT").set(vm2, BigInt(vm2.printCPerLine), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printdata.js
var DATA = /^DATA(\s+|$)/i;
var DATAFORM = /^DATAFORM\s+/i;
var DATAFORM_EMPTY = /^DATAFORM$/i;
var DATALIST = /^DATALIST$/i;
var ENDLIST = /^ENDLIST$/i;
var ENDDATA = /^ENDDATA$/i;
var PARSER_CONST = arg1R0(charSeq()).map((value) => new Const(value ?? ""));
var PARSER_FORM = arg1R1(form[""]);
var PrintData = class _PrintData extends Statement {
  static parse(flags, lines, from) {
    let index = from + 1;
    const data = [];
    while (true) {
      if (lines.length <= index) {
        throw parser("Unexpected end of thunk in PRINTDATA expression");
      }
      const current = lines[index];
      index += 1;
      if (DATA.test(current.content)) {
        data.push(new lazy_default(current.slice("DATA".length), PARSER_CONST));
      } else if (DATAFORM.test(current.content)) {
        data.push(new lazy_default(current.slice("DATAFORM".length), PARSER_FORM));
      } else if (DATAFORM_EMPTY.test(current.content)) {
        data.push(new lazy_default(current.slice("DATAFORM".length), PARSER_CONST));
      } else if (DATALIST.test(current.content) || ENDLIST.test(current.content)) {
      } else if (ENDDATA.test(current.content)) {
        return [new _PrintData(lines[from], flags, data), index - from];
      } else {
        throw parser("Unexpected statement in PRINTDATA expression");
      }
    }
  }
  flags;
  data;
  constructor(raw, flags, data) {
    super(raw);
    this.flags = encodePrintFlags(flags);
    this.data = data;
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const index = vm2.random.next() % this.data.length;
    const value = await this.data[index].get().reduce(vm2);
    string(value, "Item of PRINTDATA must be a string");
    yield* vm2.printer.print(value, this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printform.js
var PARSER81 = arg1R0(form[""]).map((form2) => form2 ?? new Form([{ value: "" }]));
var PrintForm = class extends Statement {
  flags;
  arg;
  constructor(flags, raw) {
    super(raw);
    this.flags = encodePrintFlags(flags);
    this.arg = null;
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const arg = this.arg ?? tryParse(PARSER81, this.raw);
    this.arg = arg;
    const value = await arg.reduce(vm2);
    yield* vm2.printer.print(value, this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printformc.js
var PARSER82 = arg1R0(form[""]).map((form2) => form2 ?? new Form([{ value: "" }]));
var PrintFormC = class extends Statement {
  align;
  flags;
  arg;
  constructor(align, flags, raw) {
    super(raw);
    this.align = align;
    this.flags = encodePrintFlags(flags);
    this.arg = new lazy_default(raw, PARSER82);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const value = await this.arg.get().reduce(vm2);
    yield* vm2.printer.print(value, this.flags, this.align);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printforms.js
var PARSER83 = arg1R1(expr);
var PrintFormS = class extends Statement {
  flags;
  arg;
  constructor(flags, raw) {
    super(raw);
    this.flags = encodePrintFlags(flags);
    this.arg = new lazy_default(raw, PARSER83);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const form2 = await this.arg.get().reduce(vm2);
    string(form2, "1st argument of PRINTFORMS must be a string");
    const text = await form[""].tryParse(form2).reduce(vm2);
    string(text, "1st argument of PRINTFORMS must be reduced to a string");
    yield* vm2.printer.print(text, this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/print_palam.js
var PARSER84 = arg1R1(expr);
var PrintPalam = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER84);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const index = await this.arg.get().reduce(vm2);
    bigint(index, "1st argument of PRINT_PALAM must be a number");
    const palamName = vm2.getValue("PALAMNAME");
    const validName = [];
    for (let i = 0; i < palamName.length(0); ++i) {
      const name = palamName.get(vm2, [i]);
      if (name !== "") {
        validName.push(name);
      }
    }
    for (let i = 0; i < validName.length; ++i) {
      const name = validName[i];
      const value = vm2.getValue("PALAM").get(vm2, [Number(index), i]);
      const palamLv = [
        vm2.getValue("PALAMLV").get(vm2, [0]),
        vm2.getValue("PALAMLV").get(vm2, [1]),
        vm2.getValue("PALAMLV").get(vm2, [2]),
        vm2.getValue("PALAMLV").get(vm2, [3]),
        vm2.getValue("PALAMLV").get(vm2, [4])
      ];
      let text = name;
      if (value >= palamLv[4]) {
        text += "[" + "*".repeat(10) + "]";
      } else if (value >= palamLv[3]) {
        const filled = Number(10n * value / palamLv[4]);
        text += "[" + "*".repeat(filled) + ".".repeat(10 - filled) + "]";
      } else if (value >= palamLv[2]) {
        const filled = Number(10n * value / palamLv[3]);
        text += "[" + ">".repeat(filled) + ".".repeat(10 - filled) + "]";
      } else if (value >= palamLv[1]) {
        const filled = Number(10n * value / palamLv[2]);
        text += "[" + "=".repeat(filled) + ".".repeat(10 - filled) + "]";
      } else {
        const filled = Number(10n * value / palamLv[1]);
        text += "[" + "-".repeat(filled) + ".".repeat(10 - filled) + "]";
      }
      text += value.toString();
      yield* vm2.printer.print(text, /* @__PURE__ */ new Set(), "LEFT");
      if ((i + 1) % vm2.printCPerLine === 0) {
        yield* vm2.printer.newline();
      }
    }
    yield* vm2.printer.newline();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printplain.js
var PARSER_CONST2 = arg1R0(charSeq()).map((str) => new Const(str ?? ""));
var PARSER_FORM2 = arg1R0(form[""]).map((form2) => form2 ?? new Const(""));
var PrintPlain = class extends Statement {
  arg;
  constructor(postfix, raw) {
    super(raw);
    switch (postfix) {
      case null: {
        this.arg = new lazy_default(raw, PARSER_CONST2);
        break;
      }
      case "FORM": {
        this.arg = new lazy_default(raw, PARSER_FORM2);
      }
    }
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const text = await this.arg.get().reduce(vm2);
    string(text, "1st argument of PRINTPLAIN must be a string");
    yield* vm2.printer.print(text, /* @__PURE__ */ new Set());
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/prints.js
var PARSER85 = arg1R1(expr);
var PrintS = class extends Statement {
  flags;
  arg;
  constructor(flags, raw) {
    super(raw);
    this.flags = encodePrintFlags(flags);
    this.arg = new lazy_default(raw, PARSER85);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const value = await this.arg.get().reduce(vm2);
    string(value, "1st argument of PRINTS must be a string");
    yield* vm2.printer.print(value, this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/print_shopitem.js
var PARSER86 = arg0R0();
var PrintShopItem = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER86, raw);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    const itemName = vm2.getValue("ITEMNAME");
    const validItem = [];
    for (let i = 0; i < itemName.length(0); ++i) {
      const name = itemName.get(vm2, [i]);
      if (name !== "") {
        validItem.push(i);
      }
    }
    for (let i = 0; i < validItem.length; ++i) {
      const index = validItem[i];
      const name = itemName.get(vm2, [index]);
      const price = vm2.getValue("ITEMPRICE").get(vm2, [index]);
      const text = `[${index}] ${name}(${price}$)`;
      yield* vm2.printer.print(text, /* @__PURE__ */ new Set(), "LEFT");
      if ((i + 1) % vm2.printCPerLine === 0) {
        yield* vm2.printer.newline();
      }
    }
    yield* vm2.printer.newline();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printv.js
var import_parsimmon10 = __toESM(require_parsimmon_umd_min());
var PARSER87 = argNR0(import_parsimmon10.default.alt(import_parsimmon10.default.string("'").then(charSeq(",").map((str) => new Const(str))), expr));
var PrintV = class extends Statement {
  flags;
  value;
  constructor(flags, raw) {
    super(raw);
    this.flags = encodePrintFlags(flags);
    this.value = new lazy_default(raw, PARSER87);
  }
  async *run(vm2) {
    if (vm2.printer.skipDisp) {
      return null;
    }
    let text = "";
    for (const value of this.value.get()) {
      text += (await value.reduce(vm2)).toString();
    }
    yield* vm2.printer.print(text, this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/putform.js
var PARSER88 = arg1R1(form[""]);
var PutForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER88);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    string(value, "1st argument of PUTFORM should be a number");
    const cell = vm2.getValue("SAVEDATA_TEXT");
    cell.set(vm2, cell.get(vm2, []) + value, []);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/quit.js
var PARSER89 = arg0R0();
var Quit = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER89, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    return {
      type: "quit"
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/randomize.js
var PARSER90 = arg1R1(expr);
var Randomize = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER90);
  }
  async *run(vm2) {
    const seed = await this.arg.get().reduce(vm2);
    bigint(seed, "1st argument of RANDOMIZE must be a number");
    vm2.random.state = Number(seed);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/redraw.js
var PARSER91 = arg1R1(expr);
var Redraw = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER91);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    bigint(value, "Argument of REDRAW must be a number");
    cond(value > 0 && value <= 3, "Argument of REDRAW must be between 0 and 3");
    switch (value) {
      case 0n:
        vm2.printer.draw = false;
        break;
      case 1n:
        vm2.printer.draw = true;
        break;
      case 2n:
        vm2.printer.draw = false;
        yield* vm2.printer.flush();
        break;
      case 3n:
        vm2.printer.draw = true;
        yield* vm2.printer.flush();
        break;
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/resetbgcolor.js
var PARSER92 = arg0R0();
var ResetBgColor = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER92, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.printer.background = vm2.printer.defaultBackground;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/resetcolor.js
var PARSER93 = arg0R0();
var ResetColor = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER93, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    vm2.printer.color = vm2.printer.defaultColor;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/resetdata.js
var PARSER94 = arg0R0();
var ResetData = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER94, raw);
  }
  async *run(vm2) {
    await vm2.reset();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/resetglobal.js
var PARSER95 = arg0R0();
var ResetGlobal = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER95, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("RESETGLOBAL");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/reset_stain.js
var PARSER96 = arg1R1(expr);
var ResetStain = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER96);
  }
  async *run(vm2) {
    const num = await this.arg.get().reduce(vm2);
    bigint(num, "1st Argument of RESET_STAIN should be an integer");
    cond(vm2.characterList.length > num, `Character #${num} does not exist`);
    const character = vm2.characterList[Number(num)];
    character.getValue("STAIN").reset([0, 0, 2, 1, 8]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/restart.js
var PARSER97 = arg0R0();
var Restart = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER97, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    return {
      type: "goto",
      label: Fn.START_OF_FN
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/return.js
var PARSER98 = argNR0(expr);
var Return = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER98);
  }
  async *run(vm2) {
    const result = [];
    for (const expr2 of this.arg.get()) {
      result.push(await expr2.reduce(vm2));
    }
    return {
      type: "return",
      value: result
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/returnf.js
var PARSER99 = arg1R1(expr);
var ReturnF = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER99);
  }
  async *run(vm2) {
    return {
      type: "return",
      value: [await this.arg.get().reduce(vm2)]
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/reuselastline.js
var PARSER100 = arg1R0(form[""]);
var ReuseLastLine = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER100);
  }
  async *run(vm2) {
    const value = await this.arg.get()?.reduce(vm2) ?? "";
    string(value, "Argument of REUSELASTLINE must be a string");
    yield* vm2.printer.print(value, /* @__PURE__ */ new Set(["S"]));
    vm2.printer.isLineTemp = true;
    return null;
  }
};

// compact-save.mjs
function compactIntegers(value, shape, depth = 0) {
  if (!Array.isArray(shape) || depth >= shape.length) throw new Error("Missing integer save shape");
  const source = (depth === 0 && shape.length === 1 ? pagedDenseBacking(value) : null) ?? value;
  let end = source.length;
  const leaf = depth === shape.length - 1;
  if (leaf && end <= shape[depth]) {
    while (end && source[end - 1] === 0n) end--;
  }
  const result = new Array(end);
  for (let i = 0; i < end; i++) {
    result[i] = leaf ? source[i].toString() : compactIntegers(source[i], shape, depth + 1);
  }
  if (!leaf && end <= shape[depth]) {
    while (end && result[end - 1].length === 0) end--;
    result.length = end;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/property/dim.js
var Dim = class {
  name;
  type;
  prefix;
  size;
  value;
  constructor(name, type, prefix, size, value) {
    this.name = name;
    this.type = type;
    this.size = size;
    this.prefix = /* @__PURE__ */ new Set();
    this.value = value;
    for (const p of prefix) {
      this.prefix.add(p.toUpperCase());
    }
  }
  isDynamic() {
    return this.prefix.has("DYNAMIC");
  }
  isGlobal() {
    return this.prefix.has("GLOBAL");
  }
  isSave() {
    return this.prefix.has("SAVEDATA");
  }
  isChar() {
    return this.prefix.has("CHARADATA");
  }
  async build(vm2) {
    if (this.value != null && this.value.length === 0 && this.type === "number") {
      const value = await this.value[0].reduce(vm2);
      bigint(value, "Default value for 0D #DIM must be a number");
      return new Int0DValue(this.name).reset(value);
    } else if (this.value != null && this.value.length === 0 && this.type === "string") {
      const value = await this.value[0].reduce(vm2);
      string(value, "Default value for 0D #DIMS must be a string");
      return new Str0DValue(this.name).reset(value);
    } else if (this.value != null && this.value.length === 1 && this.type === "number") {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm2)));
      bigintArray(value, "Default value for 1D #DIM must be a number array");
      return new Int1DValue(this.name, [value.length]).reset(value);
    } else if (this.value != null && this.value.length === 1 && this.type === "string") {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm2)));
      strArray(value, "Default value for 1D #DIMS must be a string array");
      return new Str1DValue(this.name, [value.length]).reset(value);
    } else if (this.value != null && this.value.length > 1 && this.type === "number" && this.size.length <= 1 && !this.isChar()) {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm2)));
      bigintArray(value, "Default value for 1D #DIM must be a number array");
      let length = value.length;
      if (this.size.length === 1) {
        const size = await this.size[0].reduce(vm2);
        bigint(size, "Size of an array must be an integer");
        length = Math.max(Number(size), value.length);
      }
      return new Int1DValue(this.name, [length]).reset(value);
    } else if (this.value != null && this.value.length > 1 && this.type === "string" && this.size.length <= 1 && !this.isChar()) {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm2)));
      strArray(value, "Default value for 1D #DIMS must be a string array");
      let length = value.length;
      if (this.size.length === 1) {
        const size = await this.size[0].reduce(vm2);
        bigint(size, "Size of an array must be an integer");
        length = Math.max(Number(size), value.length);
      }
      return new Str1DValue(this.name, [length]).reset(value);
    } else if (this.size.length === 0 && this.type === "number" && !this.isChar()) {
      return new Int0DValue(this.name);
    } else if (this.size.length === 0 && this.type === "string" && !this.isChar()) {
      return new Str0DValue(this.name);
    } else if (this.size.length === 1 && this.type === "number" && !this.isChar()) {
      const size = await this.size[0].reduce(vm2);
      bigint(size, "Size of an array must be an integer");
      return new Int1DValue(this.name, [Number(size)]);
    } else if (this.size.length === 1 && this.type === "string" && !this.isChar()) {
      const size = await this.size[0].reduce(vm2);
      bigint(size, "Size of an array must be an integer");
      return new Str1DValue(this.name, [Number(size)]);
    } else if (this.size.length === 2 && this.type === "number" && !this.isChar()) {
      const size0 = await this.size[0].reduce(vm2);
      bigint(size0, "Size of an array must be an integer");
      const size1 = await this.size[1].reduce(vm2);
      bigint(size1, "Size of an array must be an integer");
      return new Int2DValue(this.name, [Number(size0), Number(size1)]);
    } else if (this.size.length === 3 && this.type === "number" && !this.isChar()) {
      const size0 = await this.size[0].reduce(vm2);
      bigint(size0, "Size of an array must be an integer");
      const size1 = await this.size[1].reduce(vm2);
      bigint(size1, "Size of an array must be an integer");
      const size2 = await this.size[2].reduce(vm2);
      bigint(size2, "Size of an array must be an integer");
      return new Int3DValue(this.name, [Number(size0), Number(size1), Number(size2)]);
    } else if (this.size.length === 0 && this.type === "number" && this.isChar()) {
      return new IntChar0DValue(this.name);
    } else if (this.size.length === 1 && this.type === "number" && this.isChar()) {
      const size0 = await this.size[0].reduce(vm2);
      bigint(size0, "Size of an array must be an integer");
      return new IntChar1DValue(this.name, [Number(size0)]);
    } else if (this.size.length === 0 && this.type === "string" && this.isChar()) {
      return new StrChar0DValue(this.name);
    } else if (this.size.length === 1 && this.type === "string" && this.isChar()) {
      const size0 = await this.size[0].reduce(vm2);
      bigint(size0, "Size of an array must be an integer");
      return new StrChar1DValue(this.name, [Number(size0)]);
    } else {
      throw parser("Invalid #DIM(S) definition found");
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/savedata.js
var whitelist = [
  "DAY",
  "MONEY",
  "ITEM",
  "FLAG",
  "TFLAG",
  "UP",
  "PALAMLV",
  "EXPLV",
  "EJAC",
  "DOWN",
  "RESULT",
  "COUNT",
  "TARGET",
  "ASSI",
  "MASTER",
  "NOITEM",
  "LOSEBASE",
  "SELECTCOM",
  "PREVCOM",
  "TIME",
  "ITEMSALES",
  "PLAYER",
  "NEXTCOM",
  "PBAND",
  "BOUGHT",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "RANDDATA",
  "SAVESTR",
  "TSTR",
  "ISASSI",
  "NO",
  "BASE",
  "MAXBASE",
  "ABL",
  "TALENT",
  "EXP",
  "MARK",
  "PALAM",
  "SOURCE",
  "EX",
  "CFLAG",
  "JUEL",
  "RELATION",
  "EQUIP",
  "TEQUIP",
  "STAIN",
  "GOTJUEL",
  "NOWEX",
  "DOWNBASE",
  "CUP",
  "CDOWN",
  "TCVAR",
  "NAME",
  "CALLNAME",
  "NICKNAME",
  "MASTERNAME",
  "CSTR",
  // "CDFLAG",
  "DITEMTYPE",
  "DA",
  "DB",
  "DC",
  "DD",
  "DE",
  "TA",
  "TB"
];
var PARSER101 = arg2R2(expr, expr);
var SaveData = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER101);
  }
  async *run(vm2) {
    const [indexExpr, commentExpr] = this.arg.get();
    const index = await indexExpr.reduce(vm2);
    bigint(index, "1st argument of SAVEDATA must be a number");
    const comment = await commentExpr.reduce(vm2);
    string(comment, "2nd argument of SAVEDATA must be a string");
    await vm2.external.saveProgress?.({ phase: "serialize", key: savefile.game(Number(index)) });
    const saveData = {
      code: vm2.code.csv.gamebase.code ?? 0,
      version: vm2.code.csv.gamebase.version ?? 0,
      data: {
        comment,
        characters: [],
        variables: {}
      }
    };
    for (let i = 0; i < vm2.characterList.length; ++i) {
      saveData.data.characters.push({});
    }
    const nameList = [...whitelist];
    for (const property of vm2.code.header) {
      if (property instanceof Dim && property.isSave() && !property.isGlobal()) {
        nameList.push(property.name);
      }
    }
    for (const name of nameList) {
      const cell = vm2.getValue(name);
      if (cell instanceof Int0DValue) {
        saveData.data.variables[name] = cell.value.toString();
      } else if (cell instanceof Int1DValue) {
        saveData.data.variables[name] = compactIntegers(cell.value, cell.saveShape);
      } else if (cell instanceof Int2DValue) {
        saveData.data.variables[name] = compactIntegers(cell.value, cell.saveShape);
      } else if (cell instanceof Int3DValue) {
        saveData.data.variables[name] = compactIntegers(cell.value, cell.saveShape);
      } else if (cell instanceof Str0DValue || cell instanceof Str1DValue) {
        saveData.data.variables[name] = cell.value;
      } else if (cell instanceof IntChar0DValue) {
        for (let i = 0; i < vm2.characterList.length; ++i) {
          const characterCell = vm2.characterList[i].getValue(name);
          saveData.data.characters[i][name] = characterCell.value.toString();
        }
      } else if (cell instanceof IntChar1DValue) {
        for (let i = 0; i < vm2.characterList.length; ++i) {
          const characterCell = vm2.characterList[i].getValue(name);
          saveData.data.characters[i][name] = compactIntegers(characterCell.value, characterCell.saveShape);
        }
      } else if (cell instanceof StrChar0DValue || cell instanceof StrChar1DValue) {
        for (let i = 0; i < vm2.characterList.length; ++i) {
          const characterCell = vm2.characterList[i].getValue(name);
          saveData.data.characters[i][name] = characterCell.value;
        }
      }
    }
    await vm2.external.setSavedata(savefile.game(Number(index)), JSON.stringify(saveData));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/savegame.js
var PARSER102 = arg0R0();
var SaveGame = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER102, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    return {
      type: "begin",
      keyword: "SAVEGAME"
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/saveglobal.js
var PARSER103 = arg0R0();
var SaveGlobal = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER103, raw);
  }
  async *run(vm2) {
    await vm2.external.saveProgress?.({ phase: "serialize", key: savefile.global });
    const saveData = {
      code: vm2.code.csv.gamebase.code ?? 0,
      version: vm2.code.csv.gamebase.version ?? 0,
      data: {}
    };
    saveData.data.GLOBAL = compactIntegers(vm2.getValue("GLOBAL").value, vm2.getValue("GLOBAL").saveShape);
    saveData.data.GLOBALS = vm2.getValue("GLOBALS").value;
    for (const property of vm2.code.header) {
      if (property instanceof Dim && property.isSave() && property.isGlobal()) {
        const cell = vm2.getValue(property.name);
        if (cell instanceof Int0DValue) {
          saveData.data[property.name] = cell.value.toString();
        } else if (cell instanceof Int1DValue) {
          saveData.data[property.name] = compactIntegers(cell.value, cell.saveShape);
        } else if (cell instanceof Int2DValue) {
          saveData.data[property.name] = compactIntegers(cell.value, cell.saveShape);
        } else if (cell instanceof Int3DValue) {
          saveData.data[property.name] = compactIntegers(cell.value, cell.saveShape);
        } else if (cell instanceof Str0DValue) {
          saveData.data[property.name] = cell.value;
        } else if (cell instanceof Str1DValue) {
          saveData.data[property.name] = cell.value;
        }
      }
    }
    await vm2.external.setSavedata(savefile.global, JSON.stringify(saveData));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setbgcolor.js
var import_parsimmon11 = __toESM(require_parsimmon_umd_min());
var PARSER104 = import_parsimmon11.default.alt(arg3R3(expr, expr, expr), arg1R1(expr));
var SetBgColor = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER104);
  }
  async *run(vm2) {
    const parsed = this.arg.get();
    let color;
    if (Array.isArray(parsed)) {
      const r = await parsed[0].reduce(vm2);
      const g = await parsed[1].reduce(vm2);
      const b = await parsed[2].reduce(vm2);
      bigint(r, "1st argument of SETBGCOLOR must be an integer");
      bigint(g, "2nd argument of SETBGCOLOR must be an integer");
      bigint(b, "3rd argument of SETBGCOLOR must be an integer");
      color = r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
    } else {
      const rgb = await parsed.reduce(vm2);
      bigint(rgb, "Argument of SETBGCOLOR must be an integer");
      color = rgb.toString(16).padStart(6, "0");
    }
    vm2.printer.background = color;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setbgcolorbyname.js
var PARSER105 = arg1R1(charSeq());
var SetBgColorByName = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER105);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(_vm) {
    throw notImpl("SETBGCOLORBYNAME");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setbit.js
var PARSER106 = argNR1(variable, expr);
var SetBit = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER106);
  }
  async *run(vm2) {
    const [destExpr, ...bitExpr] = this.arg.get();
    const dest = destExpr.getCell(vm2);
    const value = await destExpr.reduce(vm2);
    bigint(value, "1st argument of SETBIT must be a number");
    const bitList = [];
    for (let i = 0; i < bitExpr.length; ++i) {
      const bit = await bitExpr[i].reduce(vm2);
      bigint(bit, `${i + 2}th argument of INVERTBIT must be a number`);
      bitList.push(bit);
    }
    let result = value;
    for (const bit of bitList) {
      result |= 1n << bit;
    }
    dest.set(vm2, result, await destExpr.reduceIndex(vm2));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setcolor.js
var import_parsimmon12 = __toESM(require_parsimmon_umd_min());
var PARSER107 = import_parsimmon12.default.alt(arg3R3(expr, expr, expr), arg1R1(expr));
var SetColor = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER107);
  }
  async *run(vm2) {
    const parsed = this.arg.get();
    let color;
    if (Array.isArray(parsed)) {
      const r = await parsed[0].reduce(vm2);
      const g = await parsed[1].reduce(vm2);
      const b = await parsed[2].reduce(vm2);
      bigint(r, "1st argument of SETCOLOR must be an integer");
      bigint(g, "2nd argument of SETCOLOR must be an integer");
      bigint(b, "3rd argument of SETCOLOR must be an integer");
      color = r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
    } else {
      const rgb = await parsed.reduce(vm2);
      bigint(rgb, "Argument of SETCOLOR must be an integer");
      color = rgb.toString(16).padStart(6, "0");
    }
    vm2.printer.color = color;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setcolorbyname.js
var PARSER108 = arg1R1(charSeq());
var SetColorByName = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER108);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(_vm) {
    throw notImpl("SETCOLORBYNAME");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setfont.js
var PARSER109 = arg1R0(expr);
var SetFont = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER109);
  }
  async *run(vm2) {
    const font = await this.arg.get()?.reduce(vm2) ?? "";
    string(font, "Argument of SETFONT must be a string");
    vm2.printer.font.name = font;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/skipdisp.js
var PARSER110 = arg1R1(expr);
var SkipDisp = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER110);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    bigint(value, "Argument of SKIPDISP must be a number");
    vm2.printer.skipDisp = value !== 0n;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/sortchara.js
var PARSER111 = arg2R0(variable, alt("FORWARD", "BACK"));
var SortChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER111);
  }
  async *run(vm2) {
    let [varExpr, order] = this.arg.get();
    varExpr = varExpr ?? new Variable("NO", []);
    order = order ?? "FORWARD";
    const cell = varExpr.getCell(vm2);
    const target = vm2.getValue("TARGET").get(vm2, []);
    const assi = vm2.getValue("ASSI").get(vm2, []);
    const master = vm2.getValue("MASTER").get(vm2, []);
    const characterList = vm2.characterList.map((character, index) => ({ character, index }));
    if (master >= 0) {
      characterList.splice(Number(master), 1);
    }
    if (cell instanceof IntChar0DValue) {
      characterList.sort((a, b) => {
        const left = cell.get(vm2, [a.index]);
        const right = cell.get(vm2, [b.index]);
        const compare = Number(left - right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else if (cell instanceof IntChar1DValue) {
      const index = await varExpr.reduceIndex(vm2);
      characterList.sort((a, b) => {
        const left = cell.get(vm2, [a.index, ...index]);
        const right = cell.get(vm2, [b.index, ...index]);
        const compare = Number(left - right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else if (cell instanceof StrChar0DValue) {
      characterList.sort((a, b) => {
        const left = cell.get(vm2, [a.index]);
        const right = cell.get(vm2, [b.index]);
        const compare = left.localeCompare(right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else if (cell instanceof StrChar1DValue) {
      const index = await varExpr.reduceIndex(vm2);
      characterList.sort((a, b) => {
        const left = cell.get(vm2, [a.index, ...index]);
        const right = cell.get(vm2, [b.index, ...index]);
        const compare = left.localeCompare(right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else {
      throw misc("Sort key of SORTCHARA is not a character variable");
    }
    for (let i = 0; i < characterList.length; ++i) {
      if (characterList[i].index === Number(target)) {
        vm2.getValue("TARGET").set(vm2, BigInt(i), []);
      }
      if (characterList[i].index === Number(assi)) {
        vm2.getValue("ASSI").set(vm2, BigInt(i), []);
      }
    }
    if (master >= 0) {
      characterList.splice(Number(master), 0, {
        character: vm2.characterList[Number(master)],
        index: -1
      });
    }
    vm2.characterList = characterList.map(({ character }) => character);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/split.js
var PARSER112 = arg3R3(expr, expr, variable);
var Split = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER112);
  }
  async *run(vm2) {
    const [valueExpr, sepExpr, destExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm2);
    string(value, "1st argument of SPLIT must be a string!");
    const sep = await sepExpr.reduce(vm2);
    string(sep, "2nd argument of SPLIT must be a number!");
    const dest = destExpr.getCell(vm2);
    const index = await destExpr.reduceIndex(vm2);
    const chunkList = value.split(sep);
    for (let i = 0; i < chunkList.length; ++i) {
      dest.set(vm2, chunkList[i], [...index, i]);
    }
    vm2.getValue("RESULT").set(vm2, BigInt(chunkList.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/stopcalltrain.js
var PARSER113 = arg0R0();
var StopCallTrain = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER113, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("STOPCALLTRAIN");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strdata.js
var PARSER114 = arg0R0();
var StrData = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER114, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("STRDATA");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strfind.js
var PARSER115 = arg2R2(expr, expr);
var StrFind = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER115);
  }
  async *run(vm2) {
    const [valueExpr, searchExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm2);
    string(value, "1st argument of STRFIND must be a string!");
    const search = await searchExpr.reduce(vm2);
    string(search, "2nd argument of STRFIND must be a string!");
    vm2.getValue("RESULT").set(vm2, BigInt(value.indexOf(search)), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strfindu.js
var PARSER116 = arg2R2(expr, expr);
var StrFindU = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER116);
  }
  async *run(vm2) {
    const [valueExpr, searchExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm2);
    string(value, "1st argument of STRFINDU must be a string!");
    const search = await searchExpr.reduce(vm2);
    string(search, "2nd argument of STRFINDU must be a string!");
    vm2.getValue("RESULT").set(vm2, BigInt(value.indexOf(search)), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlen.js
var PARSER117 = arg1R1(charSeq());
var StrLen = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER117);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const value = this.arg.get();
    string(value, "Argument of STRLEN must be a string!");
    vm2.getValue("RESULT").set(vm2, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlenform.js
var PARSER118 = arg1R1(form[""]);
var StrLenForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER118);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    string(value, "Argument of STRLENFORM must be a string!");
    vm2.getValue("RESULT").set(vm2, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlenformu.js
var PARSER119 = arg1R1(form[""]);
var StrLenFormU = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER119);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    string(value, "Argument of STRLENFORMU must be a string!");
    vm2.getValue("RESULT").set(vm2, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlenu.js
var PARSER120 = arg1R1(charSeq());
var StrLen2 = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER120);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const value = this.arg.get();
    string(value, "Argument of STRLENU must be a string!");
    vm2.getValue("RESULT").set(vm2, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/substring.js
var PARSER121 = arg3R3(expr, expr, expr);
var Substring = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER121);
  }
  async *run(vm2) {
    const [valueExpr, startExpr, endExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm2);
    string(value, "1st argument of SUBSTRING must be a string!");
    const start = await startExpr.reduce(vm2);
    bigint(start, "2nd argument of SUBSTRING must be a number!");
    const end = await endExpr.reduce(vm2);
    bigint(end, "3rd argument of SUBSTRING must be a number!");
    if (end < 0) {
      vm2.getValue("RESULTS").set(vm2, value.slice(Number(start)), [0]);
    } else {
      vm2.getValue("RESULTS").set(vm2, value.slice(Number(start), Number(end)), [0]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/substringu.js
var PARSER122 = arg3R3(expr, expr, expr);
var SubstringU = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER122);
  }
  async *run(vm2) {
    const [valueExpr, startExpr, endExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm2);
    string(value, "1st argument of SUBSTRINGU must be a string!");
    const start = await startExpr.reduce(vm2);
    bigint(start, "2nd argument of SUBSTRINGU must be a number!");
    const end = await endExpr.reduce(vm2);
    bigint(end, "3rd argument of SUBSTRINGU must be a number!");
    if (end < 0) {
      vm2.getValue("RESULTS").set(vm2, value.slice(Number(start)), [0]);
    } else {
      vm2.getValue("RESULTS").set(vm2, value.slice(Number(start), Number(end)), [0]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/swap.js
var PARSER123 = arg2R2(variable, variable);
var Swap = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER123);
  }
  async *run(vm2) {
    const [leftExpr, rightExpr] = this.arg.get();
    const left = leftExpr.getCell(vm2);
    const leftIndex = await leftExpr.reduceIndex(vm2);
    const right = rightExpr.getCell(vm2);
    const rightIndex = await rightExpr.reduceIndex(vm2);
    const leftValue = left.get(vm2, leftIndex);
    const rightValue = right.get(vm2, rightIndex);
    left.set(vm2, rightValue, leftIndex);
    right.set(vm2, leftValue, rightIndex);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/swapchara.js
var PARSER124 = arg2R2(expr, expr);
var SwapChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER124);
  }
  async *run(vm2) {
    const [leftExpr, rightExpr] = this.arg.get();
    const left = await leftExpr.reduce(vm2);
    bigint(left, "1st argument of SWAPCHARA must be a number");
    const right = await rightExpr.reduce(vm2);
    bigint(right, "2nd argument of SWAPCHARA must be a number");
    const temp = vm2.characterList[Number(left)];
    vm2.characterList[Number(left)] = vm2.characterList[Number(right)];
    vm2.characterList[Number(right)] = temp;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/throw.js
var PARSER125 = arg1R1(form[""]);
var Throw = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER125);
  }
  async *run(vm2) {
    const value = await this.arg.get().reduce(vm2);
    string(value, "Argument of THROW must be a string");
    return {
      type: "throw",
      value
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/times.js
var PARSER126 = arg2R2(variable, Float);
var Times = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER126);
  }
  async *run(vm2) {
    const [dest, value] = this.arg.get();
    const original = await dest.reduce(vm2);
    bigint(original, "1st argument of TIMES must be a number");
    const index = await dest.reduceIndex(vm2);
    let result = 0n;
    let remaining = value;
    for (let i = 0; i < 100; ++i) {
      if (remaining === 0) {
        break;
      }
      const high = Math.floor(remaining);
      result += original * BigInt(high) / 100n ** BigInt(i);
      remaining = (remaining - high) * 100;
    }
    dest.getCell(vm2).set(vm2, result, index);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tinput.js
var PARSER127 = arg4R2(expr, expr, expr, charSeq());
var TInput = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER127);
  }
  async *run(vm2) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm2);
    bigint(timeout, "1st argument of TINPUT should be a number");
    const def = await defExpr.reduce(vm2);
    bigint(def, "2nd argument of TINPUT should be a number");
    const show = await showExpr?.reduce(vm2) ?? 0n;
    bigint(show, "3rd argument of TINPUT should be a number");
    const input = yield* vm2.printer.tinput(true, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm2.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = BigInt(input);
    }
    yield* vm2.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULT").set(vm2, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tinputs.js
var PARSER128 = arg4R2(expr, expr, expr, charSeq());
var TInputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER128);
  }
  async *run(vm2) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm2);
    bigint(timeout, "1st argument of TINPUTS should be a number");
    const def = await defExpr.reduce(vm2);
    string(def, "2nd argument of TINPUTS should be a string");
    const show = await showExpr?.reduce(vm2) ?? 0n;
    bigint(show, "3rd argument of TINPUTS should be a number");
    const input = yield* vm2.printer.tinput(false, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm2.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = input;
    }
    yield* vm2.printer.print(value, /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULTS").set(vm2, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/toneinput.js
var PARSER129 = arg4R2(expr, expr, expr, charSeq());
var TOneInput = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER129);
  }
  async *run(vm2) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm2);
    bigint(timeout, "1st argument of TONEINPUT should be a number");
    const def = await defExpr.reduce(vm2);
    bigint(def, "2nd argument of TONEINPUT should be a number");
    const show = await showExpr?.reduce(vm2) ?? 0n;
    bigint(show, "3rd argument of TONEINPUT should be a number");
    const input = yield* vm2.printer.tinput(true, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm2.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = BigInt(input[0]);
    }
    yield* vm2.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULT").set(vm2, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/toneinputs.js
var PARSER130 = arg4R2(expr, expr, expr, charSeq());
var TOneInputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER130);
  }
  async *run(vm2) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm2);
    bigint(timeout, "1st argument of TONEINPUTS should be a number");
    const def = await defExpr.reduce(vm2);
    string(def, "2nd argument of TONEINPUTS should be a string");
    const show = await showExpr?.reduce(vm2) ?? 0n;
    bigint(show, "3rd argument of TONEINPUTS should be a number");
    const input = yield* vm2.printer.tinput(false, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm2.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = input;
    }
    yield* vm2.printer.print(value, /* @__PURE__ */ new Set(["S"]));
    vm2.getValue("RESULTS").set(vm2, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycall.js
var TryCall = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, Call.PARSER);
  }
  async *run(vm2) {
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm2.fnMap.has(realTarget)) {
      return yield* Call.exec(vm2, realTarget, argExpr);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycallform.js
var TryCallForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, CallForm.PARSER("(,"));
  }
  async *run(vm2) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm2)).toUpperCase();
    if (vm2.fnMap.has(target)) {
      return yield* Call.exec(vm2, target, argExpr);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tryccall.js
var CATCH = /^CATCH$/i;
var ENDCATCH = /^ENDCATCH$/i;
var TryCCall = class _TryCCall extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    const [thenThunk, consumedT] = parseThunk(lines, index, (l) => CATCH.test(l));
    index += consumedT + 1;
    const [catchThunk, consumedC] = parseThunk(lines, index, (l) => ENDCATCH.test(l));
    index += consumedC + 1;
    return [new _TryCCall(arg, thenThunk, catchThunk), index - from];
  }
  arg;
  thenThunk;
  catchThunk;
  constructor(raw, thenThunk, catchThunk) {
    super(raw);
    this.arg = new lazy_default(raw, Call.PARSER);
    this.thenThunk = thenThunk;
    this.catchThunk = catchThunk;
  }
  async *run(vm2, label) {
    if (label != null && this.thenThunk.labelMap.has(label)) {
      return yield* this.thenThunk.run(vm2, label);
    }
    if (label != null && this.catchThunk.labelMap.has(label)) {
      return yield* this.catchThunk.run(vm2, label);
    }
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm2.fnMap.has(realTarget)) {
      yield* Call.exec(vm2, realTarget, argExpr);
      return yield* this.thenThunk.run(vm2, label);
    } else {
      return yield* this.catchThunk.run(vm2, label);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tryccallform.js
var CATCH2 = /^CATCH$/i;
var ENDCATCH2 = /^ENDCATCH$/i;
var TryCCallForm = class _TryCCallForm extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    const [thenThunk, consumedT] = parseThunk(lines, index, (l) => CATCH2.test(l));
    index += consumedT + 1;
    const [catchThunk, consumedC] = parseThunk(lines, index, (l) => ENDCATCH2.test(l));
    index += consumedC + 1;
    return [new _TryCCallForm(arg, thenThunk, catchThunk), index - from];
  }
  arg;
  thenThunk;
  catchThunk;
  constructor(raw, thenThunk, catchThunk) {
    super(raw);
    this.arg = new lazy_default(raw, CallForm.PARSER(""));
    this.thenThunk = thenThunk;
    this.catchThunk = catchThunk;
  }
  async *run(vm2, label) {
    if (label != null && this.thenThunk.labelMap.has(label)) {
      return yield* this.thenThunk.run(vm2, label);
    }
    if (label != null && this.catchThunk.labelMap.has(label)) {
      return yield* this.catchThunk.run(vm2, label);
    }
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm2)).toUpperCase();
    if (vm2.fnMap.has(target)) {
      yield* Call.exec(vm2, target, argExpr);
      return yield* this.thenThunk.run(vm2, label);
    } else {
      return yield* this.catchThunk.run(vm2, label);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycgoto.js
var CATCH3 = /^CATCH$/i;
var ENDCATCH3 = /^ENDCATCH$/i;
var PARSER131 = arg1R1(Identifier);
var TryCGoto = class _TryCGoto extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    if (lines.length <= index) {
      throw parser("Unexpected end of thunk in TRYCGOTO expression");
    } else if (!CATCH3.test(lines[index].content)) {
      throw parser("Could not find CATCH for TRYCGOTO expression");
    }
    index += 1;
    const [catchThunk, consumed] = parseThunk(lines, index, (l) => ENDCATCH3.test(l));
    index += consumed + 1;
    return [new _TryCGoto(arg, catchThunk), index - from];
  }
  arg;
  catchThunk;
  constructor(raw, catchThunk) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER131);
    this.catchThunk = catchThunk;
  }
  async *run(vm2, label) {
    const target = this.arg.get().toUpperCase();
    const context = vm2.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm2, target);
    } else {
      return yield* this.catchThunk.run(vm2, label);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycgotoform.js
var CATCH4 = /^CATCH$/i;
var ENDCATCH4 = /^ENDCATCH$/i;
var PARSER132 = arg1R1(form[""]);
var TryCGotoForm = class _TryCGotoForm extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    if (lines.length <= index) {
      throw parser("Unexpected end of thunk in TRYCGOTOFORM expression");
    } else if (!CATCH4.test(lines[index].content)) {
      throw parser("Could not find CATCH for TRYCGOTOFORM expression");
    }
    index += 1;
    const [catchThunk, consumed] = parseThunk(lines, index, (l) => ENDCATCH4.test(l));
    index += consumed + 1;
    return [new _TryCGotoForm(arg, catchThunk), index - from];
  }
  arg;
  catchThunk;
  constructor(raw, catchThunk) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER132);
    this.catchThunk = catchThunk;
  }
  async *run(vm2, label) {
    const target = (await this.arg.get().reduce(vm2)).toUpperCase();
    const context = vm2.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm2, target);
    } else {
      return yield* this.catchThunk.run(vm2, label);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycjump.js
var CATCH5 = /^CATCH$/i;
var ENDCATCH5 = /^ENDCATCH$/i;
var TryCJump = class _TryCJump extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    if (lines.length <= index) {
      throw parser("Unexpected end of thunk in TRYCJUMP expression");
    } else if (!CATCH5.test(lines[index].content)) {
      throw parser("Could not find CATCH for TRYCJUMP expression");
    }
    index += 1;
    const [catchThunk, consumed] = parseThunk(lines, index, (l) => ENDCATCH5.test(l));
    index += consumed + 1;
    return [new _TryCJump(arg, catchThunk), index - from];
  }
  arg;
  catchExpr;
  constructor(raw, catchExpr) {
    super(raw);
    this.arg = new lazy_default(raw, Call.PARSER);
    this.catchExpr = catchExpr;
  }
  async *run(vm2, label) {
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm2.fnMap.has(realTarget)) {
      return yield* Jump.exec(vm2, realTarget, argExpr);
    } else {
      return yield* this.catchExpr.run(vm2, label);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycjumpform.js
var CATCH6 = /^CATCH$/i;
var ENDCATCH6 = /^ENDCATCH$/i;
var TryCJumpForm = class _TryCJumpForm extends Statement {
  static parse(arg, lines, from) {
    let index = from + 1;
    if (lines.length <= index) {
      throw parser("Unexpected end of thunk in TRYCJUMPFORM expression");
    } else if (!CATCH6.test(lines[index].content)) {
      throw parser("Could not find CATCH for TRYCJUMPFORM expression");
    }
    index += 1;
    const [catchThunk, consumed] = parseThunk(lines, index, (l) => ENDCATCH6.test(l));
    index += consumed + 1;
    return [new _TryCJumpForm(arg, catchThunk), index - from];
  }
  arg;
  catchThunk;
  constructor(raw, catchThunk) {
    super(raw);
    this.arg = new lazy_default(raw, CallForm.PARSER(""));
    this.catchThunk = catchThunk;
  }
  async *run(vm2, label) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm2)).toUpperCase();
    if (vm2.fnMap.has(target)) {
      return yield* Jump.exec(vm2, target, argExpr);
    } else {
      return yield* this.catchThunk.run(vm2, label);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trygoto.js
var PARSER133 = arg1R1(Identifier);
var TryGoto = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER133);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm2) {
    const target = this.arg.get().toUpperCase();
    const context = vm2.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm2, target);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trygotoform.js
var PARSER134 = arg1R1(form[""]);
var TryGotoForm = class _TryGotoForm extends Statement {
  static parse(arg) {
    return new _TryGotoForm(arg);
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER134);
  }
  async *run(vm2) {
    const target = (await this.arg.get().reduce(vm2)).toUpperCase();
    const context = vm2.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm2, target);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tryjump.js
var TryJump = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, Call.PARSER);
  }
  async *run(vm2) {
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm2.fnMap.has(realTarget)) {
      return yield* Jump.exec(vm2, realTarget, argExpr);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tryjumpform.js
var TryJumpForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, CallForm.PARSER("("));
  }
  async *run(vm2) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm2)).toUpperCase();
    if (vm2.fnMap.has(target)) {
      return yield* Jump.exec(vm2, target, argExpr);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/upcheck.js
var PARSER135 = arg0R0();
var UpCheck = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER135, raw);
  }
  async *run(vm2) {
    const length = Math.min(vm2.getValue("PALAM").length(1), vm2.getValue("UP").length(0), vm2.getValue("DOWN").length(0));
    for (let i = 0; i < length; ++i) {
      const up = vm2.getValue("UP").get(vm2, [i]);
      const down = vm2.getValue("DOWN").get(vm2, [i]);
      const palam = vm2.getValue("PALAM").get(vm2, [i]);
      if (up <= 0 && down <= 0) {
        continue;
      }
      const result = palam + up - down;
      vm2.getValue("PALAM").set(vm2, result, [i]);
      vm2.getValue("UP").set(vm2, 0n, [i]);
      vm2.getValue("DOWN").set(vm2, 0n, [i]);
      if (!vm2.printer.skipDisp) {
        const name = vm2.code.csv.palam.get(i);
        let text = `${name} ${palam}`;
        if (up > 0) {
          text += `+${up}`;
        }
        if (down > 0) {
          text += `-${down}`;
        }
        text += `=${result}`;
        yield* vm2.printer.print(text, /* @__PURE__ */ new Set(["L"]));
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/varset.js
var PARSER136 = arg4R1(variable, expr, expr, expr);
var VarSet2 = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new lazy_default(raw, PARSER136);
  }
  async *run(vm2) {
    const [destExpr, valueExpr, startExpr, endExpr] = this.arg.get();
    const dest = destExpr.getCell(vm2);
    const index = await destExpr.reduceIndex(vm2);
    const start = await startExpr?.reduce(vm2) ?? 0n;
    bigint(start, "3rd argument of VARSET must be a number");
    const end = await endExpr?.reduce(vm2) ?? BigInt(dest.length(index.length));
    bigint(end, "4th argument of VARSET must be a number");
    if (valueExpr != null) {
      const value = await valueExpr.reduce(vm2);
      dest.rangeSet(vm2, value, index, [Number(start), Number(end)]);
    } else {
      if (dest.type === "number") {
        dest.rangeSet(vm2, 0n, index, [Number(start), Number(end)]);
      } else {
        dest.rangeSet(vm2, "", index, [Number(start), Number(end)]);
      }
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/wait.js
var PARSER137 = arg0R0();
var Wait = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER137, raw);
  }
  async *run(vm2) {
    yield* vm2.printer.wait(false);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/waitanykey.js
var PARSER138 = arg0R0();
var WaitAnyKey = class extends Statement {
  constructor(raw) {
    super(raw);
    tryParse(PARSER138, raw);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run() {
    throw notImpl("WAITANYKEY");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/parser/preprocess.js
function normalize(raw) {
  if (raw.startsWith("\uFEFF") || raw.startsWith("\uFFEF")) {
    return raw.slice(1);
  }
  return raw;
}
function toLines(raw) {
  const converted = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return converted.map((content, index) => new CompactSlice("", index, content));
}
function preprocess(lines, macros) {
  const fn = [
    // Strip comments
    (prev) => prev.map((line) => new CompactSlice("", line.line, line.content.replace(/;.*$/, ""))),
    // Trim whitespaces
    (prev) => prev.map((line) => new CompactSlice("", line.line, line.content.trim())),
    // Remove empty lines
    (prev) => prev.filter((line) => line.content.length > 0),
    // Remove [SKIPSTART]~[SKIPEND] and [IF_DEBUG]~[ENDIF] lines
    (prev) => {
      const result = [];
      let index = 0;
      while (index < prev.length) {
        const line = prev[index];
        if (line.content === "[SKIPSTART]") {
          index += prev.slice(index).findIndex((l) => l.content === "[SKIPEND]") + 1;
        } else if (line.content === "[IF_DEBUG]") {
          index += prev.slice(index).findIndex((l) => l.content === "[ENDIF]") + 1;
        } else {
          result.push(line);
          index += 1;
        }
      }
      return result;
    },
    // Check [IF]/[ENDIF] blocks
    // TODO: Handle [ELSEIF], [ELSE]
    (prev) => {
      let result = [];
      let index = 0;
      while (index < prev.length) {
        const line = prev[index];
        if (/^\[IF .*\]$/.test(line.content)) {
          const name = line.content.slice("[IF ".length, -1 * "]".length);
          index += 1;
          const endIndex = index + prev.slice(index).findIndex((l) => l.content === "[ENDIF]");
          if (macros.has(name)) {
            result = result.concat(prev.slice(index, endIndex));
          }
          index = endIndex + 1;
        } else {
          result.push(line);
          index += 1;
        }
      }
      return result;
    },
    // Concatenate lines inside braces
    (prev) => {
      const result = [];
      let index = 0;
      while (index < prev.length) {
        const line = prev[index];
        if (line.content === "{") {
          const endIndex = index + prev.slice(index).findIndex((l) => l.content === "}");
          const subLines = prev.slice(index + 1, endIndex);
          result.push(new CompactSlice(subLines[0].file, subLines[0].line, subLines.map((l) => l.content).join("")));
          index = endIndex + 1;
        } else {
          result.push(line);
          index += 1;
        }
      }
      return result;
    }
  ];
  return fn.reduce((acc, val) => val(acc), lines);
}

// ../../.my_agent_remote/undercrow__eraJS/build/parser/property.js
var import_parsimmon13 = __toESM(require_parsimmon_umd_min());

// ../../.my_agent_remote/undercrow__eraJS/build/property/define.js
var Define = class {
  name;
  expr;
  constructor(name, expr2) {
    this.name = name;
    this.expr = expr2;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/property/localsize.js
var LocalSize = class {
  size;
  constructor(size) {
    this.size = size;
  }
  apply(vm2, fn) {
    vm2.staticMap.get(fn).set("LOCAL", new Int1DValue("LOCAL", [this.size]));
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/property/localssize.js
var LocalSSize = class {
  size;
  constructor(size) {
    this.size = size;
  }
  apply(vm2, fn) {
    vm2.staticMap.get(fn).set("LOCALS", new Str1DValue("LOCALS", [this.size]));
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/property/method.js
var Method2 = class {
};

// ../../.my_agent_remote/undercrow__eraJS/build/property/single.js
var Single = class {
};

// ../../.my_agent_remote/undercrow__eraJS/build/parser/property.js
var parser2 = import_parsimmon13.default.string("#").then(Identifier).chain((property) => {
  switch (property.toUpperCase()) {
    case "DEFINE":
      return import_parsimmon13.default.seqMap(WS1, Identifier, WS1, expr, (_1, name, _2, expr2) => new Define(name, expr2));
    case "PRI":
      return arg0R0().map(() => new Order("PRI"));
    case "LATER":
      return arg0R0().map(() => new Order("LATER"));
    case "SINGLE":
      return arg0R0().map(() => new Single());
    case "DIM":
      return import_parsimmon13.default.seqMap(WS1.then(import_parsimmon13.default.alt(import_parsimmon13.default.regex(/CONST/i), import_parsimmon13.default.regex(/DYNAMIC/i), import_parsimmon13.default.regex(/GLOBAL/i), import_parsimmon13.default.regex(/REF/i), import_parsimmon13.default.regex(/SAVEDATA/i), import_parsimmon13.default.regex(/CHARADATA/i))).many(), WS1.then(sepBy1(",", Identifier, expr)), import_parsimmon13.default.alt(import_parsimmon13.default.string("=").trim(WS0).then(sepBy0(",", expr)), import_parsimmon13.default.succeed(void 0)), import_parsimmon13.default.string(",").fallback(null), (prefix, [name, ...size], value) => new Dim(name, "number", prefix, size, value));
    case "DIMS":
      return import_parsimmon13.default.seqMap(WS1.then(import_parsimmon13.default.alt(import_parsimmon13.default.regex(/CONST/i), import_parsimmon13.default.regex(/DYNAMIC/i), import_parsimmon13.default.regex(/GLOBAL/i), import_parsimmon13.default.regex(/REF/i), import_parsimmon13.default.regex(/SAVEDATA/i), import_parsimmon13.default.regex(/CHARADATA/i))).many(), WS1.then(sepBy1(",", Identifier, expr)), import_parsimmon13.default.alt(import_parsimmon13.default.string("=").trim(WS0).then(sepBy0(",", expr)), import_parsimmon13.default.succeed(void 0)), import_parsimmon13.default.string(",").fallback(null), (prefix, [name, ...size], value) => new Dim(name, "string", prefix, size, value));
    case "FUNCTION":
      return arg0R0().map(() => new Method2());
    case "FUNCTIONS":
      return arg0R0().map(() => new Method2());
    case "LOCALSIZE":
      return arg1R1(UInt).map((size) => new LocalSize(size));
    case "LOCALSSIZE":
      return arg1R1(UInt).map((size) => new LocalSSize(size));
    default:
      return import_parsimmon13.default.fail(`${property} is not a valid property`);
  }
});
var property_default = parser2;

// ../../.my_agent_remote/undercrow__eraJS/build/parser/erb.js
function parseERB(files2, macros) {
  const result = [];
  const globals = [];
  for (const [name, content] of files2) {
    const normalized = normalize(content);
    const lines = preprocess(toLines(normalized), macros);
    for (const line of lines) {
      line.file = name;
    }
    let index = 0;
    while (lines.length > index && lines[index].content.startsWith("#")) {
      globals.push(tryParse(property_default, lines[index]));
      index += 1;
    }
    while (lines.length > index) {
      const [fn, consumed] = parseFn(lines, index);
      result.push(fn);
      index += consumed;
    }
  }
  result.globals = globals;
  return result;
}
function parseFn(lines, from) {
  let index = from;
  const defIndex = index;
  index += 1;
  const propIndex = index;
  while (lines.length > index) {
    if (!lines[index].content.startsWith("#")) {
      break;
    }
    index += 1;
  }
  const bodyIndex = index;
  while (lines.length > index) {
    if (lines[index].content.startsWith("@")) {
      break;
    }
    index += 1;
  }
  const argParser = sepBy0(",", import_parsimmon14.default.seq(variable, import_parsimmon14.default.alt(import_parsimmon14.default.string("=").trim(WS0).then(Int).map((val) => BigInt(val)), import_parsimmon14.default.string("=").trim(WS0).then(Str), import_parsimmon14.default.string("=").trim(WS0).then(variable), import_parsimmon14.default.succeed(null))));
  const defParser = import_parsimmon14.default.string("@").then(import_parsimmon14.default.seq(Identifier.skip(WS0), import_parsimmon14.default.alt(wrap("(", ")", argParser), import_parsimmon14.default.string(",").trim(WS0).then(argParser), import_parsimmon14.default.succeed([]))));
  const definition = tryParse(defParser, lines[defIndex]);
  const property = [];
  for (let i = propIndex; i < bodyIndex; ++i) {
    property.push(tryParse(property_default, lines[i]));
  }
  const [body] = parseThunk(lines.slice(bodyIndex, index), 0);
  return [
    new Fn(definition[0], definition[1], property, body),
    index - from
  ];
}
function parseThunk(lines, from, until) {
  const body = [];
  let index = from;
  while (index < lines.length) {
    const current = lines[index];
    if (until != null && until(current.content)) {
      break;
    }
    if (current.content.startsWith("$")) {
      body.push(current.content.slice(1));
      index += 1;
    } else {
      const [statement, consumed] = parseStatement(lines, index);
      body.push(statement);
      index += consumed;
    }
  }
  return [new Thunk(body), index - from];
}
var ID_REGEX = /^[^\+\-\*\/\%\=\!\<\>\|\&\^\~\?\#\(\)\{\}\[\]\.\,\:\$\\\'\"\@\;\s]+/;
function parseStatement(lines, index) {
  const current = lines[index];
  const match2 = ID_REGEX.exec(current.content);
  if (match2 != null) {
    const IDENTIFIER = match2[0].toUpperCase();
    if (commandParser[IDENTIFIER] != null) {
      const arg = current.slice(match2[0].length);
      return commandParser[IDENTIFIER](arg, lines, index);
    }
  }
  return [new Assign(current), 1];
}
var commandParser = {
  PRINT: (arg) => [new Print([], arg), 1],
  PRINTL: (arg) => [new Print(["L"], arg), 1],
  PRINTW: (arg) => [new Print(["W"], arg), 1],
  PRINTK: (arg) => [new Print(["K"], arg), 1],
  PRINTKL: (arg) => [new Print(["K", "L"], arg), 1],
  PRINTKW: (arg) => [new Print(["K", "W"], arg), 1],
  PRINTD: (arg) => [new Print(["D"], arg), 1],
  PRINTDL: (arg) => [new Print(["D", "L"], arg), 1],
  PRINTDW: (arg) => [new Print(["D", "W"], arg), 1],
  PRINTV: (arg) => [new PrintV([], arg), 1],
  PRINTVL: (arg) => [new PrintV(["L"], arg), 1],
  PRINTVW: (arg) => [new PrintV(["W"], arg), 1],
  PRINTVK: (arg) => [new PrintV(["K"], arg), 1],
  PRINTVKL: (arg) => [new PrintV(["K", "L"], arg), 1],
  PRINTVKW: (arg) => [new PrintV(["K", "W"], arg), 1],
  PRINTVD: (arg) => [new PrintV(["D"], arg), 1],
  PRINTVDL: (arg) => [new PrintV(["D", "L"], arg), 1],
  PRINTVDW: (arg) => [new PrintV(["D", "W"], arg), 1],
  PRINTS: (arg) => [new PrintS([], arg), 1],
  PRINTSL: (arg) => [new PrintS(["L"], arg), 1],
  PRINTSW: (arg) => [new PrintS(["W"], arg), 1],
  PRINTSK: (arg) => [new PrintS(["K"], arg), 1],
  PRINTSKL: (arg) => [new PrintS(["K", "L"], arg), 1],
  PRINTSKW: (arg) => [new PrintS(["K", "W"], arg), 1],
  PRINTSD: (arg) => [new PrintS(["D"], arg), 1],
  PRINTSDL: (arg) => [new PrintS(["D", "L"], arg), 1],
  PRINTSDW: (arg) => [new PrintS(["D", "W"], arg), 1],
  PRINTFORM: (arg) => [new PrintForm([], arg), 1],
  PRINTFORML: (arg) => [new PrintForm(["L"], arg), 1],
  PRINTFORMW: (arg) => [new PrintForm(["W"], arg), 1],
  PRINTFORMK: (arg) => [new PrintForm(["K"], arg), 1],
  PRINTFORMKL: (arg) => [new PrintForm(["K", "L"], arg), 1],
  PRINTFORMKW: (arg) => [new PrintForm(["K", "W"], arg), 1],
  PRINTFORMD: (arg) => [new PrintForm(["D"], arg), 1],
  PRINTFORMDL: (arg) => [new PrintForm(["D", "L"], arg), 1],
  PRINTFORMDW: (arg) => [new PrintForm(["D", "W"], arg), 1],
  PRINTFORMS: (arg) => [new PrintFormS([], arg), 1],
  PRINTFORMSL: (arg) => [new PrintFormS(["L"], arg), 1],
  PRINTFORMSW: (arg) => [new PrintFormS(["W"], arg), 1],
  PRINTFORMSK: (arg) => [new PrintFormS(["K"], arg), 1],
  PRINTFORMSKL: (arg) => [new PrintFormS(["K", "L"], arg), 1],
  PRINTFORMSKW: (arg) => [new PrintFormS(["K", "W"], arg), 1],
  PRINTFORMSD: (arg) => [new PrintFormS(["D"], arg), 1],
  PRINTFORMSDL: (arg) => [new PrintFormS(["D", "L"], arg), 1],
  PRINTFORMSDW: (arg) => [new PrintFormS(["D", "W"], arg), 1],
  PRINTSINGLE: (arg) => [new Print(["S"], arg), 1],
  PRINTSINGLEK: (arg) => [new Print(["S", "K"], arg), 1],
  PRINTSINGLED: (arg) => [new Print(["S", "D"], arg), 1],
  PRINTSINGLEV: (arg) => [new PrintV(["S"], arg), 1],
  PRINTSINGLEVK: (arg) => [new PrintV(["S", "K"], arg), 1],
  PRINTSINGLEVD: (arg) => [new PrintV(["S", "D"], arg), 1],
  PRINTSINGLES: (arg) => [new PrintS(["S"], arg), 1],
  PRINTSINGLESK: (arg) => [new PrintS(["S", "K"], arg), 1],
  PRINTSINGLESD: (arg) => [new PrintS(["S", "D"], arg), 1],
  PRINTSINGLEFORM: (arg) => [new PrintForm(["S"], arg), 1],
  PRINTSINGLEFORMK: (arg) => [new PrintForm(["S", "K"], arg), 1],
  PRINTSINGLEFORMD: (arg) => [new PrintForm(["S", "D"], arg), 1],
  PRINTSINGLEFORMS: (arg) => [new PrintFormS(["S"], arg), 1],
  PRINTSINGLEFORMSK: (arg) => [new PrintFormS(["S", "K"], arg), 1],
  PRINTSINGLEFORMSD: (arg) => [new PrintFormS(["S", "D"], arg), 1],
  PRINTC: (arg) => [new PrintC("RIGHT", [], arg), 1],
  PRINTCK: (arg) => [new PrintC("RIGHT", ["K"], arg), 1],
  PRINTCD: (arg) => [new PrintC("RIGHT", ["D"], arg), 1],
  PRINTLC: (arg) => [new PrintC("LEFT", [], arg), 1],
  PRINTLCK: (arg) => [new PrintC("LEFT", ["K"], arg), 1],
  PRINTLCD: (arg) => [new PrintC("LEFT", ["D"], arg), 1],
  PRINTFORMC: (arg) => [new PrintFormC("RIGHT", [], arg), 1],
  PRINTFORMCK: (arg) => [new PrintFormC("RIGHT", ["K"], arg), 1],
  PRINTFORMCD: (arg) => [new PrintFormC("RIGHT", ["D"], arg), 1],
  PRINTFORMLC: (arg) => [new PrintFormC("LEFT", [], arg), 1],
  PRINTFORMLCK: (arg) => [new PrintFormC("LEFT", ["K"], arg), 1],
  PRINTFORMLCD: (arg) => [new PrintFormC("LEFT", ["D"], arg), 1],
  PRINTBUTTON: (arg) => [new PrintButton(arg), 1],
  PRINTBUTTONC: (arg) => [new PrintButton(arg, "RIGHT"), 1],
  PRINTBUTTONLC: (arg) => [new PrintButton(arg, "LEFT"), 1],
  PRINTPLAIN: (arg) => [new PrintPlain(null, arg), 1],
  PRINTPLAINFORM: (arg) => [new PrintPlain("FORM", arg), 1],
  PRINT_PALAM: (arg) => [new PrintPalam(arg), 1],
  PRINT_SHOPITEM: (arg) => [new PrintShopItem(arg), 1],
  TIMES: (arg) => [new Times(arg), 1],
  DRAWLINE: (arg) => [new DrawLine(arg), 1],
  CUSTOMDRAWLINE: (arg) => [new CustomDrawLine(arg), 1],
  DRAWLINEFORM: (arg) => [new DrawLineForm(arg), 1],
  REUSELASTLINE: (arg) => [new ReuseLastLine(arg), 1],
  CLEARLINE: (arg) => [new ClearLine(arg), 1],
  RESETCOLOR: (arg) => [new ResetColor(arg), 1],
  RESETBGCOLOR: (arg) => [new ResetBgColor(arg), 1],
  SETCOLOR: (arg) => [new SetColor(arg), 1],
  SETBGCOLOR: (arg) => [new SetBgColor(arg), 1],
  SETCOLORBYNAME: (arg) => [new SetColorByName(arg), 1],
  SETBGCOLORBYNAME: (arg) => [new SetBgColorByName(arg), 1],
  GETCOLOR: (arg) => [new Method("GETCOLOR", arg), 1],
  GETDEFCOLOR: (arg) => [new Method("GETDEFCOLOR", arg), 1],
  GETBGCOLOR: (arg) => [new Method("GETBGCOLOR", arg), 1],
  GETDEFBGCOLOR: (arg) => [new Method("GETDEFBGCOLOR", arg), 1],
  GETFOCUSCOLOR: (arg) => [new Method("GETFOCUSCOLOR", arg), 1],
  FONTBOLD: (arg) => [new FontBold(arg), 1],
  FONTITALIC: (arg) => [new FontItalic(arg), 1],
  FONTREGULAR: (arg) => [new FontRegular(arg), 1],
  FONTSTYLE: (arg) => [new FontStyle(arg), 1],
  GETSTYLE: (arg) => [new GetStyle(arg), 1],
  CHKFONT: (arg) => [new ChkFont(arg), 1],
  SETFONT: (arg) => [new SetFont(arg), 1],
  GETFONT: (arg) => [new GetFont(arg), 1],
  ALIGNMENT: (arg) => [new Alignment(arg), 1],
  CURRENTALIGN: (arg) => [new CurrentAlign(arg), 1],
  REDRAW: (arg) => [new Redraw(arg), 1],
  CURRENTREDRAW: (arg) => [new CurrentRedraw(arg), 1],
  PRINTCPERLINE: (arg) => [new PrintCPerLine(arg), 1],
  LINEISEMPTY: (arg) => [new Method("LINEISEMPTY", arg), 1],
  SKIPDISP: (arg) => [new SkipDisp(arg), 1],
  BAR: (arg) => [new Bar(arg), 1],
  BARL: (arg) => [new Bar(arg, true), 1],
  BARSTR: (arg) => [new Method("BARSTR", arg), 1],
  ISSKIP: (arg) => [new IsSkip(arg), 1],
  MOUSESKIP: (arg) => [new MouseSkip(arg), 1],
  STRLEN: (arg) => [new StrLen(arg), 1],
  STRLENS: (arg) => [new Method("STRLENS", arg), 1],
  STRLENFORM: (arg) => [new StrLenForm(arg), 1],
  STRLENU: (arg) => [new StrLen2(arg), 1],
  STRLENSU: (arg) => [new Method("STRLENSU", arg), 1],
  STRLENFORMU: (arg) => [new StrLenFormU(arg), 1],
  SUBSTRING: (arg) => [new Substring(arg), 1],
  SUBSTRINGU: (arg) => [new SubstringU(arg), 1],
  STRFIND: (arg) => [new StrFind(arg), 1],
  STRFINDU: (arg) => [new StrFindU(arg), 1],
  SPLIT: (arg) => [new Split(arg), 1],
  ESCAPE: (arg) => [new Escape(arg), 1],
  UNICODE: (arg) => [new Method("UNICODE", arg), 1],
  ENCODETOUNI: (arg) => [new EncodeToUni(arg), 1],
  POWER: (arg) => [new Method("POWER", arg), 1],
  ABS: (arg) => [new Method("ABS", arg), 1],
  SIGN: (arg) => [new Method("SIGN", arg), 1],
  SQRT: (arg) => [new Method("SQRT", arg), 1],
  MAX: (arg) => [new Method("MAX", arg), 1],
  MIN: (arg) => [new Method("MIN", arg), 1],
  LIMIT: (arg) => [new Method("LIMIT", arg), 1],
  INRANGE: (arg) => [new Method("INRANGE", arg), 1],
  GETBIT: (arg) => [new Method("GETBIT", arg), 1],
  SETBIT: (arg) => [new SetBit(arg), 1],
  CLEARBIT: (arg) => [new ClearBit(arg), 1],
  INVERTBIT: (arg) => [new InvertBit(arg), 1],
  ADDCHARA: (arg) => [new AddChara(arg), 1],
  ADDDEFCHARA: (arg) => [new AddDefChara(arg), 1],
  ADDVOIDCHARA: (arg) => [new AddVoidChara(arg), 1],
  DELCHARA: (arg) => [new DelChara(arg), 1],
  DELALLCHARA: (arg) => [new DelAllChara(arg), 1],
  GETCHARA: (arg) => [new Method("GETCHARA", arg), 1],
  SWAPCHARA: (arg) => [new SwapChara(arg), 1],
  SORTCHARA: (arg) => [new SortChara(arg), 1],
  PICKUPCHARA: (arg) => [new PickupChara(arg), 1],
  FINDCHARA: (arg) => [new Method("FINDCHARA", arg), 1],
  FINDLASTCHARA: (arg) => [new Method("FINDLASTCHARA", arg), 1],
  COPYCHARA: (arg) => [new CopyChara(arg), 1],
  ADDCOPYCHARA: (arg) => [new AddCopyChara(arg), 1],
  EXISTCSV: (arg) => [new Method("EXISTCSV", arg), 1],
  SWAP: (arg) => [new Swap(arg), 1],
  RESETDATA: (arg) => [new ResetData(arg), 1],
  RESETGLOBAL: (arg) => [new ResetGlobal(arg), 1],
  RESET_STAIN: (arg) => [new ResetStain(arg), 1],
  CSVABL: (arg) => [new Method("CSVABL", arg), 1],
  CSVBASE: (arg) => [new Method("CSVBASE", arg), 1],
  CSVCALLNAME: (arg) => [new Method("CSVCALLNAME", arg), 1],
  CSVCFLAG: (arg) => [new Method("CSVCFLAG", arg), 1],
  CSVCSTR: (arg) => [new Method("CSVCSTR", arg), 1],
  CSVEQUIP: (arg) => [new Method("CSVEQUIP", arg), 1],
  CSVEXP: (arg) => [new Method("CSVEXP", arg), 1],
  CSVJUEL: (arg) => [new Method("CSVJUEL", arg), 1],
  CSVMARK: (arg) => [new Method("CSVMARK", arg), 1],
  CSVMASTERNAME: (arg) => [new Method("CSVMASTERNAME", arg), 1],
  CSVNAME: (arg) => [new Method("CSVNAM", arg), 1],
  CSVNICKNAME: (arg) => [new Method("CSVNICKNAME", arg), 1],
  CSVRELATION: (arg) => [new Method("CSVRELATION", arg), 1],
  CSVTALENT: (arg) => [new Method("CSVTALENT", arg), 1],
  GETPALAMLV: (arg) => [new GetPalamLv(arg), 1],
  GETEXPLV: (arg) => [new GetExpLv(arg), 1],
  VARSET: (arg) => [new VarSet2(arg), 1],
  CVARSET: (arg) => [new VarSet(arg), 1],
  ARRAYSHIFT: (arg) => [new ArrayShift(arg), 1],
  UPCHECK: (arg) => [new UpCheck(arg), 1],
  CUPCHECK: (arg) => [new CUpCheck(arg), 1],
  PUTFORM: (arg) => [new PutForm(arg), 1],
  SAVEGAME: (arg) => [new SaveGame(arg), 1],
  LOADGAME: (arg) => [new LoadGame(arg), 1],
  SAVEDATA: (arg) => [new SaveData(arg), 1],
  LOADDATA: (arg) => [new LoadData(arg), 1],
  DELDATA: (arg) => [new DelData(arg), 1],
  CHKDATA: (arg) => [new ChkData(arg), 1],
  SAVEGLOBAL: (arg) => [new SaveGlobal(arg), 1],
  LOADGLOBAL: (arg) => [new LoadGlobal(arg), 1],
  OUTPUTLOG: (arg) => [new OutputLog(arg), 1],
  GETTIME: (arg) => [new GetTime(arg), 1],
  GETMILLISECOND: (arg) => [new GetMillisecond(arg), 1],
  GETSECOND: (arg) => [new GetSecond(arg), 1],
  FORCEWAIT: (arg) => [new ForceWait(arg), 1],
  INPUT: (arg) => [new Input(arg), 1],
  INPUTS: (arg) => [new InputS(arg), 1],
  TINPUT: (arg) => [new TInput(arg), 1],
  TINPUTS: (arg) => [new TInputS(arg), 1],
  ONEINPUT: (arg) => [new OneInput(arg), 1],
  ONEINPUTS: (arg) => [new OneInputS(arg), 1],
  TONEINPUT: (arg) => [new TOneInput(arg), 1],
  TONEINPUTS: (arg) => [new TOneInputS(arg), 1],
  WAIT: (arg) => [new Wait(arg), 1],
  WAITANYKEY: (arg) => [new WaitAnyKey(arg), 1],
  BREAK: (arg) => [new Break(arg), 1],
  CONTINUE: (arg) => [new Continue(arg), 1],
  RANDOMIZE: (arg) => [new Randomize(arg), 1],
  DUMPRAND: (arg) => [new DumpRand(arg), 1],
  INITRAND: (arg) => [new InitRand(arg), 1],
  BEGIN: (arg) => [new Begin(arg), 1],
  CALLTRAIN: (arg) => [new CallTrain(arg), 1],
  THROW: (arg) => [new Throw(arg), 1],
  QUIT: (arg) => [new Quit(arg), 1],
  CALL: (arg) => [new Call(arg), 1],
  CALLFORM: (arg) => [new CallForm(arg), 1],
  CALLF: (arg) => [new CallF(arg), 1],
  CALLFORMF: (arg) => [new CallFormF(arg), 1],
  TRYCALL: (arg) => [new TryCall(arg), 1],
  TRYCALLFORM: (arg) => [new TryCallForm(arg), 1],
  TRYCCALL: (arg, lines, from) => TryCCall.parse(arg, lines, from),
  TRYCCALLFORM: (arg, lines, from) => TryCCallForm.parse(arg, lines, from),
  JUMP: (arg) => [new Jump(arg), 1],
  JUMPFORM: (arg) => [new JumpForm(arg), 1],
  TRYJUMP: (arg) => [new TryJump(arg), 1],
  TRYJUMPFORM: (arg) => [new TryJumpForm(arg), 1],
  TRYCJUMP: (arg, lines, from) => TryCJump.parse(arg, lines, from),
  TRYCJUMPFORM: (arg, lines, from) => TryCJumpForm.parse(arg, lines, from),
  GOTO: (arg) => [new Goto(arg), 1],
  GOTOFORM: (arg) => [new GotoForm(arg), 1],
  TRYGOTO: (arg) => [new TryGoto(arg), 1],
  TRYGOTOFORM: (arg) => [new TryGotoForm(arg), 1],
  TRYCGOTO: (arg, lines, from) => TryCGoto.parse(arg, lines, from),
  TRYCGOTOFORM: (arg, lines, from) => TryCGotoForm.parse(arg, lines, from),
  RESTART: (arg) => [new Restart(arg), 1],
  RETURN: (arg) => [new Return(arg), 1],
  RETURNF: (arg) => [new ReturnF(arg), 1],
  DEBUGCLEAR: (arg) => [new DebugClear(arg), 1],
  MOUSEX: (arg) => [new MouseX(arg), 1],
  MOUSEY: (arg) => [new MouseY(arg), 1],
  ISACTIVE: (arg) => [new IsActive(arg), 1],
  CBGCLEAR: (arg) => [new CbgClear(arg), 1],
  CBGCLEARBUTTON: (arg) => [new CbgClearButton(arg), 1],
  CBGREMOVEBMAP: (arg) => [new CbgRemoveBmap(arg), 1],
  CLEARTEXTBOX: (arg) => [new ClearTextBox(arg), 1],
  STRDATA: (arg) => [new StrData(arg), 1],
  STOPCALLTRAIN: (arg) => [new StopCallTrain(arg), 1],
  PRINTDATA: (_arg, lines, from) => PrintData.parse([], lines, from),
  PRINTDATAL: (_arg, lines, from) => PrintData.parse(["L"], lines, from),
  PRINTDATAW: (_arg, lines, from) => PrintData.parse(["W"], lines, from),
  PRINTDATAK: (_arg, lines, from) => PrintData.parse(["K"], lines, from),
  PRINTDATAKL: (_arg, lines, from) => PrintData.parse(["K", "L"], lines, from),
  PRINTDATAKW: (_arg, lines, from) => PrintData.parse(["K", "W"], lines, from),
  PRINTDATAD: (_arg, lines, from) => PrintData.parse(["D"], lines, from),
  PRINTDATADL: (_arg, lines, from) => PrintData.parse(["D", "L"], lines, from),
  PRINTDATADW: (_arg, lines, from) => PrintData.parse(["D", "W"], lines, from),
  SIF: (arg, lines, from) => {
    const [statement, consumed] = parseStatement(lines, from + 1);
    return [new If([[arg, new Thunk([statement])]], new Thunk([])), consumed + 1];
  },
  IF: (_arg, lines, from) => If.parse(lines, from),
  SELECTCASE: (arg, lines, from) => Case.parse(arg, lines, from),
  REPEAT: (arg, lines, from) => Repeat.parse(arg, lines, from),
  FOR: (arg, lines, from) => For.parse(arg, lines, from),
  WHILE: (arg, lines, from) => While.parse(arg, lines, from),
  DO: (arg, lines, from) => DoWhile.parse(arg, lines, from)
};

// ../../.my_agent_remote/undercrow__eraJS/build/parser/erh.js
function parseERH(files2, macros) {
  const result = [];
  for (const [name, content] of files2) {
    const normalized = normalize(content);
    const lines = preprocess(toLines(normalized), macros);
    for (const line of lines) {
      line.file = name;
    }
    for (const line of lines) {
      result.push(tryParse(property_default, line));
    }
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/printer.js
var import_parsimmon15 = __toESM(require_parsimmon_umd_min());
var nonButton = import_parsimmon15.default.noneOf("[").many().tie();
var coreButton = import_parsimmon15.default.regex(/\[\s*[0-9]+\s*\]/);
var buttonParser = import_parsimmon15.default.alt(import_parsimmon15.default.seqMap(coreButton, optional(nonButton), (core, text) => [core, core + (text ?? "")]).many().skip(import_parsimmon15.default.eof), import_parsimmon15.default.seqMap(optional(nonButton), coreButton, (text, core) => [core, (text ?? "") + core]).many().skip(import_parsimmon15.default.eof), import_parsimmon15.default.seqMap(import_parsimmon15.default.seqMap(nonButton, coreButton, optional(nonButton), (left, core, right) => [core, left + core + (right ?? "")]), import_parsimmon15.default.seqMap(coreButton, optional(nonButton), (core, text) => [core, core + (text ?? "")]).many(), (first, rest) => [first, ...rest]).skip(import_parsimmon15.default.eof));
var Printer = class {
  buffer;
  chunks;
  align;
  font;
  defaultBackground;
  defaultColor;
  background;
  color;
  focus;
  lineCount;
  draw;
  skipDisp;
  isLineTemp;
  constructor() {
    this.buffer = [];
    this.chunks = [];
    this.align = "LEFT";
    this.font = {
      name: "",
      bold: false,
      italic: false,
      strike: false,
      underline: false
    };
    this.defaultBackground = "000000";
    this.defaultColor = "FFFFFF";
    this.background = this.defaultBackground;
    this.color = this.defaultColor;
    this.focus = "FFFF00";
    this.lineCount = 0;
    this.draw = true;
    this.skipDisp = false;
    this.isLineTemp = false;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *clearTemp() {
    if (this.isLineTemp) {
      this.buffer.push({ type: "clear", count: 1 });
      this.isLineTemp = false;
    }
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *flush() {
    for (const output of this.buffer) {
      yield output;
    }
    this.buffer = [];
  }
  async *newline() {
    if (this.isLineTemp) {
      this.buffer.push({ type: "clear", count: 1 });
      this.lineCount -= 1;
    }
    const merged = [];
    if (this.chunks.length > 0) {
      merged.push(this.chunks[0]);
      for (let i = 1; i < this.chunks.length; ++i) {
        const chunk = this.chunks[i];
        const lastChunk = merged[merged.length - 1];
        if (chunk.type === "string" && lastChunk.type === "string" && chunk.cell == null && lastChunk.cell == null && chunk.style.font === lastChunk.style.font && chunk.style.color === lastChunk.style.color && chunk.style.bold === lastChunk.style.bold && chunk.style.italic === lastChunk.style.italic && chunk.style.underline === lastChunk.style.underline && chunk.style.strike === lastChunk.style.strike) {
          lastChunk.text += chunk.text;
        } else {
          merged.push(chunk);
        }
      }
    }
    const normalized = [];
    for (const chunk of merged) {
      if (chunk.type === "string") {
        const parsed = buttonParser.parse(chunk.text);
        if (parsed.status && parsed.value.length > 0) {
          for (const [core, text] of parsed.value) {
            const valueMatch = /\[\s*(?<value>[0-9]+)\s*\]/.exec(core);
            normalized.push({
              type: "button",
              text,
              value: valueMatch.groups.value,
              cell: chunk.cell,
              style: { ...chunk.style }
            });
          }
        } else {
          normalized.push(chunk);
        }
      } else {
        normalized.push(chunk);
      }
    }
    this.buffer.push({
      type: "content",
      align: this.align,
      children: normalized
    });
    this.chunks = [];
    this.lineCount += 1;
    this.isLineTemp = false;
    if (this.draw) {
      yield* this.flush();
    }
  }
  async *print(text, flags, cell) {
    yield* this.clearTemp();
    if (hasPrintFlag(flags, "S") && this.chunks.length > 0) {
      yield* this.newline();
    }
    if (text.length > 0) {
      this.chunks.push({
        type: "string",
        text,
        cell,
        style: {
          color: this.color,
          focus: this.focus,
          font: this.font.name,
          bold: this.font.bold,
          italic: this.font.italic,
          strike: this.font.strike,
          underline: this.font.underline
        }
      });
    }
    if (hasPrintFlag(flags, "S") || hasPrintFlag(flags, "L") || hasPrintFlag(flags, "W")) {
      yield* this.newline();
    }
    if (hasPrintFlag(flags, "W")) {
      yield* this.wait(false);
    }
    if (this.draw) {
      yield* this.flush();
    }
  }
  async *button(text, value, cell) {
    yield* this.clearTemp();
    this.chunks.push({
      type: "button",
      text,
      value,
      cell,
      style: {
        color: this.color,
        focus: this.focus,
        font: this.font.name,
        bold: this.font.bold,
        italic: this.font.italic,
        strike: this.font.strike,
        underline: this.font.underline
      }
    });
    if (this.draw) {
      yield* this.flush();
    }
  }
  async *line(value) {
    yield* this.clearTemp();
    this.buffer.push({ type: "line", value });
    if (this.draw) {
      yield* this.flush();
    }
    this.lineCount += 1;
  }
  async *clear(count) {
    if (count > 0) {
      this.buffer.push({ type: "clear", count });
      this.lineCount = Math.max(0, this.lineCount - count);
      this.isLineTemp = false;
    }
    if (this.draw) {
      yield* this.flush();
    }
  }
  async *wait(force) {
    yield* this.flush();
    if (this.chunks.length > 0) {
      yield* this.newline();
    }
    yield { type: "wait", force };
  }
  async *input(numeric, nullable) {
    yield* this.flush();
    if (this.chunks.length > 0) {
      yield* this.newline();
    }
    return yield { type: "input", numeric, nullable };
  }
  async *tinput(numeric, timeout, countdown) {
    yield* this.flush();
    if (this.chunks.length > 0) {
      yield* this.newline();
    }
    return yield { type: "tinput", numeric, timeout, countdown };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/random.js
var PRNG = class {
  state;
  constructor() {
    this.state = Math.floor(Math.random() * 2 ** 32);
  }
  /* eslint-disable no-bitwise */
  next() {
    this.state += 1831565813;
    let z = this.state;
    z = Math.imul(z ^ z >>> 15, z | 1);
    z ^= z + Math.imul(z ^ z >>> 7, z | 61);
    return (z ^ z >>> 14) >>> 0;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/scene.js
var import_dayjs4 = __toESM(require_dayjs_min());
var FILE = "BUILTIN.ERB";
async function* runScene(vm2, scene) {
  const generator2 = scene();
  while (true) {
    const next = generator2.next();
    if (next.done === true) {
      return null;
    }
    const result = yield* vm2.run(next.value);
    if (result != null && result.type !== "return") {
      return result;
    }
  }
}
function* eventStatement(vm2, target) {
  for (const fn of vm2.eventMap.get(target) ?? []) {
    yield {
      raw: new CompactSlice(FILE, 0, "CALL " + target, "CALL".length),
      run: async function* () {
        return yield* fn.run(vm2, []);
      }
    };
  }
}
function* MAIN() {
  while (true) {
    yield new Call(new CompactSlice(FILE, 0, "CALL SHOW_SHOP", "CALL".length));
    yield new Input(new CompactSlice(FILE, 0, "INPUT", "INPUT".length));
    yield new Call(new CompactSlice(FILE, 0, "CALL USERSHOP", "CALL".length));
  }
}
async function* SHOP(vm2) {
  return yield* runScene(vm2, function* () {
    yield* eventStatement(vm2, "EVENTSHOP");
    if (vm2.fnMap.has("SYSTEM_AUTOSAVE")) {
      yield new Call(new CompactSlice(FILE, 0, "CALL SYSTEM_AUTOSAVE", "CALL".length));
    } else {
      const now = (0, import_dayjs4.default)(vm2.external.getTime());
      vm2.getValue("SAVEDATA_TEXT").set(vm2, now.format("YYYY/MM/DD HH:mm:ss"), []);
      yield new Call(new CompactSlice(FILE, 0, "CALL SAVEINFO", "CALL".length));
      yield new SaveData(new CompactSlice(FILE, 0, "SAVEDATA 99, SAVEDATA_TEXT", "SAVEDATA".length));
    }
    yield* MAIN();
  });
}
async function* TRAIN(vm2) {
  return yield* runScene(vm2, function* () {
    vm2.getValue("ASSIPLAY").set(vm2, 0n, []);
    vm2.getValue("PREVCOM").set(vm2, -1n, []);
    vm2.getValue("NEXTCOM").set(vm2, -1n, []);
    vm2.getValue("TFLAG").reset([]);
    vm2.getValue("TSTR").reset([]);
    for (const character of vm2.characterList) {
      character.getValue("GOTJUEL").reset([]);
      character.getValue("TEQUIP").reset([]);
      character.getValue("EX").reset([]);
      character.getValue("STAIN").reset([0, 0, 2, 1, 8]);
      character.getValue("PALAM").reset([]);
      character.getValue("SOURCE").reset([]);
      character.getValue("TCVAR").reset([]);
    }
    yield* eventStatement(vm2, "EVENTTRAIN");
    while (true) {
      const nextCom = vm2.getValue("NEXTCOM").get(vm2, []);
      if (nextCom >= 0) {
        vm2.getValue("SELECTCOM").set(vm2, nextCom, []);
        vm2.getValue("NEXTCOM").set(vm2, 0n, []);
      } else {
        const comAble = /* @__PURE__ */ new Set();
        yield new Call(new CompactSlice(FILE, 0, "CALL SHOW_STATUS", "CALL".length));
        const trainIds = [...vm2.code.csv.train.keys()];
        trainIds.sort((a, b) => a - b);
        for (let i = 0; i < trainIds.length; ++i) {
          const id = trainIds[i];
          vm2.getValue("RESULT").set(vm2, 1n, []);
          if (vm2.fnMap.has(`COM_ABLE${id}`)) {
            yield new Call(new CompactSlice(FILE, 0, `CALL COM_ABLE${id}`, "CALL".length));
          }
          if (vm2.getValue("RESULT").get(vm2, []) !== 0n) {
            comAble.add(id);
            const name = vm2.code.csv.train.get(id);
            const idString = id.toString().padStart(3, " ");
            yield new PrintC("RIGHT", [], new CompactSlice(FILE, 0, `PRINTC ${name}[${idString}]`, "PRINTC".length));
            if (i % vm2.printCPerLine === 0) {
              yield new Print(["L"], new CompactSlice(FILE, 0, "PRINTL", "PRINTL".length));
            }
          }
        }
        yield new Call(new CompactSlice(FILE, 0, "CALL SHOW_USERCOM", "CALL".length));
        yield new Input(new CompactSlice(FILE, 0, "INPUT", "INPUT".length));
        const input = vm2.getValue("RESULT").get(vm2, [0]);
        if (comAble.has(Number(input))) {
          vm2.getValue("SELECTCOM").set(vm2, input, []);
        } else {
          vm2.getValue("SELECTCOM").set(vm2, -1n, []);
        }
      }
      while (true) {
        let wait = false;
        const selectCom = vm2.getValue("SELECTCOM").get(vm2, []);
        if (selectCom >= 0) {
          for (const character of vm2.characterList) {
            character.getValue("NOWEX").reset([]);
          }
          yield* eventStatement(vm2, "EVENTCOM");
          yield new Call(new CompactSlice(FILE, 0, `CALL COM${selectCom}`, "CALL".length));
          if (vm2.getValue("RESULT").get(vm2, [0]) !== 0n) {
            wait = true;
            yield new Call(new CompactSlice(FILE, 0, "CALL SOURCE_CHECK", "CALL".length));
            for (const character of vm2.characterList) {
              character.getValue("SOURCE").reset([]);
            }
            yield* eventStatement(vm2, "EVENTCOMEND");
          }
        } else {
          yield new Call(new CompactSlice(FILE, 0, "CALL USERCOM", "CALL".length));
        }
        if (wait) {
          yield new Wait(new CompactSlice(FILE, 0, "WAIT", "WAIT".length));
        }
        break;
      }
    }
  });
}
async function* AFTERTRAIN(vm2) {
  return yield* runScene(vm2, function* () {
    vm2.printer.skipDisp = false;
    yield* eventStatement(vm2, "EVENTEND");
  });
}
async function* ABLUP(vm2) {
  return yield* runScene(vm2, function* () {
    while (true) {
      vm2.printer.skipDisp = false;
      yield new Call(new CompactSlice(FILE, 0, "CALL SHOW_JUEL", "CALL".length));
      yield new Call(new CompactSlice(FILE, 0, "CALL SHOW_ABLUP_SELECT", "CALL".length));
      yield new Input(new CompactSlice(FILE, 0, "INPUT", "INPUT".length));
      const input = vm2.getValue("RESULT").get(vm2, []);
      if (input >= 0 && input < 100) {
        yield new TryCall(new CompactSlice(FILE, 0, `TRYCALL ABLUP${input}`, "TRYCALL".length));
      } else {
        yield new Call(new CompactSlice(FILE, 0, "CALL USERABLUP", "CALL".length));
      }
    }
  });
}
async function* TURNEND(vm2) {
  return yield* runScene(vm2, function* () {
    vm2.printer.skipDisp = false;
    yield* eventStatement(vm2, "EVENTTURNEND");
  });
}
async function* FIRST(vm2) {
  return yield* runScene(vm2, function* () {
    yield* eventStatement(vm2, "EVENTFIRST");
  });
}
async function* TITLE(vm2) {
  return yield* runScene(vm2, function* () {
    yield new Call(new CompactSlice(FILE, 0, "CALL SYSTEM_TITLE", "CALL".length));
  });
}
async function* DATALOADED(vm2) {
  return yield* runScene(vm2, function* () {
    yield new TryCall(new CompactSlice(FILE, 0, "TRYCALL SYSTEM_LOADEND", "TRYCALL".length));
    yield* eventStatement(vm2, "EVENTLOAD");
    yield* MAIN();
  });
}
var SAVE_SLOT_COUNT = 20;
var SAVE_CANCEL = 100;
function beginScene(keyword) {
  return {
    raw: new CompactSlice(FILE, 0, "BEGIN " + keyword, "BEGIN".length),
    run: async function* () {
      return { type: "begin", keyword };
    }
  };
}
function slotMenu(vm2, title) {
  return {
    raw: new CompactSlice(FILE, 0, "PRINTL " + title, "PRINTL".length),
    run: async function* () {
      yield* vm2.printer.print("------------------------", /* @__PURE__ */ new Set(["L"]));
      yield* vm2.printer.print(title, /* @__PURE__ */ new Set(["L"]));
      for (let i = 0; i < SAVE_SLOT_COUNT; ++i) {
        const raw = await vm2.external.getSavedata(savefile.game(i));
        let label = "----";
        if (raw != null) {
          try {
            const parsed = JSON.parse(raw);
            const comment = parsed && parsed.data ? parsed.data.comment : null;
            label = typeof comment === "string" && comment.length > 0 ? comment : "----";
          } catch (e) {
            label = "(\uC190\uC0C1\uB41C \uB370\uC774\uD130)";
          }
        }
        yield* vm2.printer.print("[" + i + "] " + label, /* @__PURE__ */ new Set(["L"]));
      }
      yield* vm2.printer.print("[" + SAVE_CANCEL + "] \uCDE8\uC18C", /* @__PURE__ */ new Set(["L"]));
      return null;
    }
  };
}
function saveSlot(vm2, slot) {
  return {
    raw: new CompactSlice(FILE, 0, "SAVEDATA " + slot, "SAVEDATA".length),
    run: async function* () {
      const now = (0, import_dayjs4.default)(vm2.external.getTime());
      vm2.getValue("SAVEDATA_TEXT").set(vm2, now.format("YYYY/MM/DD HH:mm:ss"), []);
      if (vm2.fnMap.has("SAVEINFO")) {
        yield* vm2.run(new Call(new CompactSlice(FILE, 0, "CALL SAVEINFO", "CALL".length)));
      }
      yield* vm2.run(new SaveData(new CompactSlice(FILE, 0, "SAVEDATA " + slot + ", SAVEDATA_TEXT", "SAVEDATA".length)));
      yield* vm2.printer.print("\uC2AC\uB86F " + slot + "\uC5D0 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ new Set(["L"]));
      return null;
    }
  };
}
function loadSlot(vm2, slot) {
  return {
    raw: new CompactSlice(FILE, 0, "LOADDATA " + slot, "LOADDATA".length),
    run: async function* () {
      const raw = await vm2.external.getSavedata(savefile.game(slot));
      if (raw == null) {
        yield* vm2.printer.print("\uC2AC\uB86F " + slot + "\uC740(\uB294) \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ new Set(["L"]));
        return null;
      }
      return yield* vm2.run(new LoadData(new CompactSlice(FILE, 0, "LOADDATA " + slot, "LOADDATA".length)));
    }
  };
}
async function* SAVEGAME(vm2) {
  return yield* runScene(vm2, function* () {
    yield slotMenu(vm2, "SAVE GAME");
    yield new Input(new CompactSlice(FILE, 0, "INPUT", "INPUT".length));
    const input = Number(vm2.getValue("RESULT").get(vm2, [0]));
    if (Number.isInteger(input) && input >= 0 && input < SAVE_SLOT_COUNT) {
      yield saveSlot(vm2, input);
    }
    yield beginScene("SHOP");
  });
}
async function* LOADGAME(vm2) {
  return yield* runScene(vm2, function* () {
    while (true) {
      yield slotMenu(vm2, "LOAD GAME");
      yield new Input(new CompactSlice(FILE, 0, "INPUT", "INPUT".length));
      const input = Number(vm2.getValue("RESULT").get(vm2, [0]));
      if (Number.isInteger(input) && input >= 0 && input < SAVE_SLOT_COUNT) {
        yield loadSlot(vm2, input);
      } else {
        yield beginScene("TITLE");
        return;
      }
    }
  });
}

// ../../.my_agent_remote/undercrow__eraJS/build/value/special/charanum.js
var CharaNumValue = class {
  type = "number";
  name = "CHARANUM";
  value;
  constructor() {
  }
  reset() {
    throw internal(`${this.name} cannot be reset`);
  }
  get(vm2, index) {
    cond(index.length === 0, "CHARANUM cannot be indexed");
    return BigInt(vm2.characterList.length);
  }
  set(_vm, _value, _index) {
    throw new Error(`Cannot assign a value to ${this.name}`);
  }
  rangeSet(_vm, _value, _index, _range) {
    throw new Error(`Cannot assign a value to ${this.name}`);
  }
  length(depth) {
    switch (depth) {
      case 0:
        return 1;
      default:
        throw new Error(`${this.name} doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/special/linecount.js
var LineCountValue = class {
  type = "number";
  name = "LINECOUNT";
  value;
  constructor() {
  }
  reset() {
    throw internal(`${this.name} cannot be reset`);
  }
  get(vm2, index) {
    cond(index.length === 0, "LINECOUNT cannot be indexed");
    return BigInt(vm2.printer.lineCount);
  }
  set(_vm, _value, _index) {
    throw new Error(`Cannot assign a value to ${this.name}`);
  }
  rangeSet(_vm, _value, _index, _range) {
    throw new Error(`Cannot assign a value to ${this.name}`);
  }
  length(depth) {
    switch (depth) {
      case 0:
        return 1;
      default:
        throw new Error(`${this.name} doesn't have a value at depth ${depth}`);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value/special/rand.js
var RandValue = class {
  type = "number";
  name = "RAND";
  value;
  constructor() {
  }
  reset() {
    throw internal(`${this.name} cannot be reset`);
  }
  get(vm2, index) {
    cond(index.length === 1, "RAND must be indexed by 1 value");
    return BigInt(Math.floor(vm2.random.next() % index[0]));
  }
  set(_vm, _value, _index) {
    throw new Error("Cannot assign a value to RAND");
  }
  rangeSet(_vm, _value, _index, _range) {
    throw new Error("Cannot assign a value to RAND");
  }
  length(_depth) {
    throw new Error("Cannot get the length of RAND");
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/value-list.js
var valueList = [
  ["DAY", Int1DValue],
  ["MONEY", Int1DValue],
  ["ITEM", Int1DValue],
  ["FLAG", Int1DValue, [1e4], ["FLAG", "FLAGNAME"]],
  ["TFLAG", Int1DValue, [1e3], ["TFLAG", "TFLAGNAME"]],
  ["UP", Int1DValue],
  ["PALAMLV", Int1DValue],
  ["EXPLV", Int1DValue],
  ["EJAC", Int1DValue],
  ["DOWN", Int1DValue],
  ["RESULT", Int1DValue],
  ["COUNT", Int1DValue],
  ["TARGET", Int1DValue],
  ["ASSI", Int1DValue],
  ["MASTER", Int1DValue],
  ["NOITEM", Int1DValue],
  ["LOSEBASE", Int1DValue],
  ["SELECTCOM", Int1DValue],
  ["ASSIPLAY", Int1DValue],
  ["PREVCOM", Int1DValue],
  ["TIME", Int1DValue],
  ["ITEMSALES", Int1DValue],
  ["PLAYER", Int1DValue],
  ["NEXTCOM", Int1DValue],
  ["PBAND", Int1DValue],
  ["BOUGHT", Int1DValue],
  ["A", Int1DValue],
  ["B", Int1DValue],
  ["C", Int1DValue],
  ["D", Int1DValue],
  ["E", Int1DValue],
  ["F", Int1DValue],
  ["G", Int1DValue],
  ["H", Int1DValue],
  ["I", Int1DValue],
  ["J", Int1DValue],
  ["K", Int1DValue],
  ["L", Int1DValue],
  ["M", Int1DValue],
  ["N", Int1DValue],
  ["O", Int1DValue],
  ["P", Int1DValue],
  ["Q", Int1DValue],
  ["R", Int1DValue],
  ["S", Int1DValue],
  ["T", Int1DValue],
  ["U", Int1DValue],
  ["V", Int1DValue],
  ["W", Int1DValue],
  ["X", Int1DValue],
  ["Y", Int1DValue],
  ["Z", Int1DValue],
  ["ITEMPRICE", Int1DValue, [1e3], ["ITEMNAME", "ITEMPRICE"]],
  ["RANDDATA", Int1DValue, [625]],
  ["SAVESTR", Str1DValue, [100], ["SAVESTR", "SAVESTRNAME"]],
  ["STR", Str1DValue, [2e4], ["STR", "STRNAME"]],
  ["RESULTS", Str1DValue],
  ["TSTR", Str1DValue, [100], ["TSTR", "TSTRNAME"]],
  ["SAVEDATA_TEXT", Str0DValue],
  ["ISASSI", IntChar0DValue],
  ["NO", IntChar0DValue],
  ["BASE", IntChar1DValue, [100], ["BASE", "BASENAME", "MAXBASE"]],
  ["MAXBASE", IntChar1DValue, [100], ["BASE", "BASENAME", "MAXBASE"]],
  ["ABL", IntChar1DValue, [100], ["ABL", "ABLNAME"]],
  ["TALENT", IntChar1DValue, [1e3], ["TALENT", "TALENTNAME"]],
  ["EXP", IntChar1DValue, [100], ["EXP", "EXPNAME"]],
  ["MARK", IntChar1DValue, [100], ["MARK", "MARKNAME"]],
  ["PALAM", IntChar1DValue, [200], ["PALAM", "PALAMNAME", "JUEL"]],
  ["SOURCE", IntChar1DValue, [1e3], ["SOURCE", "SOURCENAME"]],
  ["EX", IntChar1DValue, [100], ["EX", "EXNAME"]],
  ["CFLAG", IntChar1DValue, [1e3], ["CFLAG", "CFLAGNAME"]],
  ["JUEL", IntChar1DValue, [200], ["PALAM", "PALAMNAME", "JUEL"]],
  ["RELATION", IntChar1DValue, [1e3]],
  ["EQUIP", IntChar1DValue, [100], ["EQUIP", "EQUIPNAME"]],
  ["TEQUIP", IntChar1DValue, [100], ["TEQUIP", "TEQUIPNAME"]],
  ["STAIN", IntChar1DValue, [1e3], ["STAIN", "STAINNAME"]],
  ["GOTJUEL", IntChar1DValue, [200]],
  ["NOWEX", IntChar1DValue, [1e3]],
  ["DOWNBASE", IntChar1DValue, [1e3]],
  ["CUP", IntChar1DValue, [1e3]],
  ["CDOWN", IntChar1DValue, [1e3]],
  ["TCVAR", IntChar1DValue, [100], ["TCVAR", "TCVARNAME"]],
  ["NAME", StrChar0DValue],
  ["CALLNAME", StrChar0DValue],
  ["NICKNAME", StrChar0DValue],
  ["MASTERNAME", StrChar0DValue],
  ["CSTR", StrChar1DValue, [100], ["CSTR", "CSTRNAME"]],
  // TODO: CDFLAG
  ["DITEMTYPE", Int2DValue],
  ["DA", Int2DValue],
  ["DB", Int2DValue],
  ["DC", Int2DValue],
  ["DD", Int2DValue],
  ["DE", Int2DValue],
  ["TA", Int3DValue],
  ["TB", Int3DValue],
  ["ABLNAME", Str1DValue, [100], ["ABL", "ABLNAME"]],
  ["EXPNAME", Str1DValue, [100], ["EXP", "EXPNAME"]],
  ["TALENTNAME", Str1DValue, [1e3], ["TALENT", "TALENTNAME"]],
  ["PALAMNAME", Str1DValue, [200], ["PALAM", "PALAMNAME", "JUEL"]],
  ["TRAINNAME", Str1DValue, [1e3]],
  ["MARKNAME", Str1DValue, [100], ["MARK", "MARKNAME"]],
  ["ITEMNAME", Str1DValue, [1e3], ["ITEMNAME", "ITEMPRICE"]],
  ["BASENAME", Str1DValue, [100], ["BASE", "BASENAME"]],
  ["SOURCENAME", Str1DValue, [1e3], ["SOURCE", "SOURCENAME"]],
  ["EXNAME", Str1DValue, [100], ["EX", "EXNAME"]],
  ["EQUIPNAME", Str1DValue, [100], ["EQUIP", "EQUIPNAME"]],
  ["TEQUIPNAME", Str1DValue, [100], ["TEQUIP", "TEQUIPNAME"]],
  ["FLAGNAME", Str1DValue, [1e4], ["FLAG", "FLAGNAME"]],
  ["TFLAGNAME", Str1DValue, [1e3], ["TFLAG", "TFLAGNAME"]],
  ["CFLAGNAME", Str1DValue, [1e3], ["CFLAG", "CFLAGNAME"]],
  ["TCVARNAME", Str1DValue, [100], ["TCVAR", "TCVARNAME"]],
  ["CSTRNAME", Str1DValue, [100], ["CSTR", "CSTRNAME"]],
  ["STAINNAME", Str1DValue, [1e3], ["STAIN", "STAINNAME"]],
  // TODO
  ["CDFLAGNAME1", Str1DValue, [1]],
  // TODO
  ["CDFLAGNAME2", Str1DValue, [1]],
  ["STRNAME", Str1DValue, [2e4], ["STR", "STRNAME"]],
  ["TSTRNAME", Str1DValue, [100], ["TSTR", "TSTRNAME"]],
  ["SAVESTRNAME", Str1DValue, [100], ["SAVESTR", "SAVESTRNAME"]],
  ["GLOBALNAME", Str1DValue, [1e3], ["GLOBAL", "GLOBALNAME"]],
  ["GLOBALSNAME", Str1DValue, [100], ["GLOBALS", "GLOBALSNAME"]],
  ["GAMEBASE_AUTHOR", Str0DValue],
  ["GAMEBASE_INFO", Str0DValue],
  ["GAMEBASE_YEAR", Str0DValue],
  ["GAMEBASE_TITLE", Str0DValue],
  ["WINDOW_TITLE", Str0DValue],
  ["MONEYLABEL", Str0DValue],
  // TODO: DRAWLINESTR
  ["LASTLOAD_TEXT", Str0DValue],
  ["GAMEBASE_GAMECODE", Int0DValue],
  ["GAMEBASE_VERSION", Int0DValue],
  ["GAMEBASE_ALLOWVERSION", Int0DValue],
  ["GAMEBASE_DEFAULTCHARA", Int0DValue],
  ["GAMEBASE_NOITEM", Int0DValue],
  ["LASTLOAD_VERSION", Int0DValue],
  ["LASTLOAD_NO", Int0DValue],
  ["ISTIMEOUT", Int0DValue],
  ["__INT_MAX__", Int0DValue],
  ["__INT_MIN__", Int0DValue]
];
var value_list_default = valueList;

// ../../.my_agent_remote/undercrow__eraJS/build/vm.js
var EVENT = [
  "EVENTFIRST",
  "EVENTTRAIN",
  "EVENTSHOP",
  "EVENTBUY",
  "EVENTCOM",
  "EVENTTURNEND",
  "EVENTCOMEND",
  "EVENTEND",
  "EVENTLOAD"
];
var VM = class {
  random;
  code;
  external;
  eventMap;
  fnMap;
  macroMap;
  templateMap;
  globalMap;
  staticMap;
  characterList;
  contextStack;
  printer;
  printCPerLine;
  constructor(code) {
    this.random = new PRNG();
    this.code = code;
    this.eventMap = /* @__PURE__ */ new Map();
    this.fnMap = /* @__PURE__ */ new Map();
    this.macroMap = /* @__PURE__ */ new Map();
    this.templateMap = /* @__PURE__ */ new Map();
    this.globalMap = /* @__PURE__ */ new Map();
    this.staticMap = /* @__PURE__ */ new Map();
    this.characterList = [];
    this.contextStack = [];
    for (const fn of code.fnList) {
      if (EVENT.includes(fn.name)) {
        if (!this.eventMap.has(fn.name)) {
          this.eventMap.set(fn.name, []);
        }
        this.eventMap.get(fn.name).push(fn);
      } else {
        this.fnMap.set(fn.name, fn);
      }
    }
    for (const events of this.eventMap.values()) {
      events.sort((a, b) => {
        if (a.isFirst()) {
          return -1;
        }
        if (b.isFirst()) {
          return 1;
        }
        if (a.isLast()) {
          return 1;
        }
        if (b.isLast()) {
          return -1;
        }
        return 0;
      });
    }
    for (const property of code.header) {
      if (property instanceof Define) {
        this.macroMap.set(property.name, property);
      }
    }
    for (const [id, character] of code.csv.character) {
      this.templateMap.set(id, character);
    }
    this.globalMap.set("GLOBAL", new Int1DValue("GLOBAL", code.csv.varSize.get("GLOBAL")));
    this.globalMap.set("GLOBALS", new Str1DValue("GLOBALS", code.csv.varSize.get("GLOBALS")));
  }
  async reset() {
    this.printer = new Printer();
    this.printCPerLine = 3;
    const globalMap = this.globalMap;
    const { header, csv } = this.code;
    const varSize2 = new Map(csv.varSize);
    for (const [name, Cls, size, mergeList] of value_list_default) {
      let mergeSize;
      for (const mergeName of mergeList ?? []) {
        if (varSize2.has(mergeName)) {
          const prev0 = (mergeSize ?? [0])[0];
          const size0 = varSize2.get(mergeName)[0];
          mergeSize = [Math.max(prev0, size0)];
        }
      }
      const value = new Cls(name, mergeSize ?? varSize2.get(name) ?? size);
      globalMap.set(name, value);
    }
    globalMap.set("RAND", new RandValue());
    globalMap.set("CHARANUM", new CharaNumValue());
    globalMap.set("LINECOUNT", new LineCountValue());
    globalMap.get("ITEMPRICE").reset(new Map([...csv.item.entries()].map(([key, val]) => [key, val.price])));
    globalMap.get("STR").reset(csv.str);
    globalMap.get("PALAMLV").reset([0, 100, 500, 3e3, 1e4, 3e4, 6e4, 1e5, 15e4, 25e4]);
    globalMap.get("EXPLV").reset([0, 1, 4, 20, 50, 200]);
    globalMap.get("ASSI").reset([-1]);
    globalMap.get("TARGET").reset([1]);
    globalMap.get("PBAND").reset([4]);
    globalMap.get("EJAC").reset([1e4]);
    globalMap.get("RANDDATA").reset([this.random.state]);
    globalMap.get("ABLNAME").reset(csv.abl);
    globalMap.get("EXPNAME").reset(csv.exp);
    globalMap.get("TALENTNAME").reset(csv.talent);
    globalMap.get("PALAMNAME").reset(csv.palam);
    globalMap.get("TRAINNAME").reset(csv.train);
    globalMap.get("MARKNAME").reset(csv.mark);
    globalMap.get("ITEMNAME").reset(new Map([...csv.item.entries()].map(([key, val]) => [key, val.name])));
    globalMap.get("BASENAME").reset(csv.base);
    globalMap.get("SOURCENAME").reset(csv.source);
    globalMap.get("EXNAME").reset(csv.ex);
    globalMap.get("EQUIPNAME").reset(csv.equip);
    globalMap.get("TEQUIPNAME").reset(csv.tequip);
    globalMap.get("FLAGNAME").reset(csv.flag);
    globalMap.get("TFLAGNAME").reset(csv.tflag);
    globalMap.get("CFLAGNAME").reset(csv.cflag);
    globalMap.get("TCVARNAME").reset(csv.tcvar);
    globalMap.get("CSTRNAME").reset(csv.cstr);
    globalMap.get("STAINNAME").reset(csv.stain);
    globalMap.get("CDFLAGNAME1").reset(csv.cdflag1);
    globalMap.get("CDFLAGNAME2").reset(csv.cdflag2);
    globalMap.get("STRNAME").reset(csv.str);
    globalMap.get("TSTRNAME").reset(csv.tstr);
    globalMap.get("SAVESTRNAME").reset(csv.saveStr);
    globalMap.get("GLOBALNAME").reset(csv.global);
    globalMap.get("GLOBALSNAME").reset(csv.globalS);
    globalMap.get("GAMEBASE_AUTHOR").reset(csv.gamebase.author ?? "");
    globalMap.get("GAMEBASE_INFO").reset(csv.gamebase.info ?? "");
    globalMap.get("GAMEBASE_YEAR").reset(csv.gamebase.year ?? "");
    globalMap.get("GAMEBASE_TITLE").reset(csv.gamebase.title ?? "");
    globalMap.get("GAMEBASE_GAMECODE").reset(csv.gamebase.code ?? 0);
    globalMap.get("GAMEBASE_VERSION").reset(csv.gamebase.version ?? 0);
    globalMap.get("LASTLOAD_VERSION").reset(-1);
    globalMap.get("LASTLOAD_NO").reset(-1);
    globalMap.get("__INT_MAX__").reset(2n ** 63n - 1n);
    globalMap.get("__INT_MIN__").reset(-(2n ** 63n - 1n));
    for (const [i, name] of csv.abl.entries()) {
      globalMap.set(name, new Int0DValue(name).reset(i));
    }
    for (const [i, name] of csv.exp.entries()) {
      globalMap.set(name, new Int0DValue(name).reset(i));
    }
    for (const [i, { name }] of csv.item.entries()) {
      globalMap.set(name, new Int0DValue(name).reset(i));
    }
    for (const [i, name] of csv.talent.entries()) {
      globalMap.set(name, new Int0DValue(name).reset(i));
    }
    for (const [i, name] of csv.mark.entries()) {
      globalMap.set(name, new Int0DValue(name).reset(i));
    }
    for (const [i, name] of csv.palam.entries()) {
      globalMap.set(name, new Int0DValue(name).reset(i));
    }
    for (const property of header) {
      if (property instanceof Dim) {
        globalMap.set(property.name, await property.build(this));
      }
    }
    this.staticMap = /* @__PURE__ */ new Map();
    this.staticMap.set("@DUMMY", /* @__PURE__ */ new Map());
    let fnList = [...this.fnMap.values()];
    for (const events of this.eventMap.values()) {
      fnList = fnList.concat(events);
    }
    for (const fn of fnList) {
      this.staticMap.set(fn.name, /* @__PURE__ */ new Map());
      this.staticMap.get(fn.name).set("LOCAL", new Int1DValue("LOCAL", varSize2.get("LOCAL")));
      this.staticMap.get(fn.name).set("LOCALS", new Str1DValue("LOCALS", varSize2.get("LOCALS")));
      for (const property of fn.property) {
        if (property instanceof Dim && !property.isDynamic()) {
          this.staticMap.get(fn.name).set(property.name, await property.build(this));
        } else if (property instanceof LocalSize || property instanceof LocalSSize) {
          property.apply(this, fn.name);
        }
      }
    }
    this.characterList = [];
  }
  configure(config) {
    this.printer.defaultColor = config.front;
    this.printer.defaultBackground = config.back;
    this.printer.color = config.front;
    this.printer.background = config.back;
    this.printer.focus = config.focus;
  }
  context() {
    return this.contextStack[this.contextStack.length - 1];
  }
  async pushContext(fn) {
    const context = {
      fn,
      dynamicMap: /* @__PURE__ */ new Map(),
      refMap: /* @__PURE__ */ new Map()
    };
    context.dynamicMap.set("ARG", new Int1DValue("ARG", this.code.csv.varSize.get("ARG")));
    context.dynamicMap.set("ARGS", new Str1DValue("ARGS", this.code.csv.varSize.get("ARGS")));
    for (const property of fn.property) {
      if (property instanceof Dim && property.isDynamic()) {
        context.dynamicMap.set(property.name, await property.build(this));
      }
    }
    this.contextStack.push(context);
    return context;
  }
  popContext() {
    this.contextStack.pop();
  }
  getValue(name, scope) {
    if (scope != null) {
      if (!this.staticMap.has(scope)) {
        throw notFound("Scope", scope);
      }
      if (this.staticMap.get(scope).has(name)) {
        return this.staticMap.get(scope).get(name);
      } else {
        throw notFound("Variable", name + ":" + scope);
      }
    } else {
      const context = this.context();
      if (context.refMap.has(name)) {
        return this.getValue(context.refMap.get(name));
      } else if (context.dynamicMap.has(name)) {
        return context.dynamicMap.get(name);
      } else if (this.staticMap.get(context.fn.name).has(name)) {
        return this.staticMap.get(context.fn.name).get(name);
      } else if (this.globalMap.has(name)) {
        return this.globalMap.get(name);
      } else {
        throw new Error(`Variable ${name} does not exist`);
      }
    }
  }
  async *start(external) {
    this.external = external;
    await this.reset();
    this.contextStack = [];
    await this.pushContext(new Fn("@DUMMY", [], [], new Thunk([])));
    let begin = "TITLE";
    while (true) {
      let result = null;
      switch (begin.toUpperCase()) {
        case "TITLE":
          result = yield* TITLE(this);
          break;
        case "FIRST":
          result = yield* FIRST(this);
          break;
        case "SHOP":
          result = yield* SHOP(this);
          break;
        case "TRAIN":
          result = yield* TRAIN(this);
          break;
        case "AFTERTRAIN":
          result = yield* AFTERTRAIN(this);
          break;
        case "ABLUP":
          result = yield* ABLUP(this);
          break;
        case "TURNEND":
          result = yield* TURNEND(this);
          break;
        case "DATALOADED":
          result = yield* DATALOADED(this);
          break;
        case "SAVEGAME":
          result = yield* SAVEGAME(this);
          break;
        case "LOADGAME":
          result = yield* LOADGAME(this);
          break;
        default:
          throw notFound("Scene", begin);
      }
      switch (result?.type) {
        case "begin":
          begin = result.keyword;
          continue;
        case "goto":
          throw notFound("Label", result.label);
        case "break":
          return null;
        case "continue":
          return null;
        case "throw":
          throw new Error(`Uncaught error ${result.value}`);
        case "return":
          continue;
        case "quit":
          return null;
        case void 0:
          continue;
      }
    }
  }
  async *run(statement, label) {
    try {
      return yield* statement.run(this, label);
    } catch (e) {
      if (e instanceof EraJSError) {
        throw e;
      }
      const trace = [];
      for (const context of this.contextStack.slice(1)) {
        trace.push(context.fn.name);
      }
      throw new EraJSError(e.message, statement.raw, trace);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/index.js
function compile(files2) {
  const csvFiles = /* @__PURE__ */ new Map();
  const erhFiles = /* @__PURE__ */ new Map();
  const erbFiles = /* @__PURE__ */ new Map();
  for (const [file, content] of files2) {
    const FILE2 = file.toUpperCase();
    if (FILE2.endsWith(".CSV")) {
      csvFiles.set(file.toUpperCase(), content);
    } else if (FILE2.endsWith(".ERH")) {
      erhFiles.set(file.toUpperCase(), content);
    } else if (FILE2.endsWith(".ERB")) {
      erbFiles.set(file.toUpperCase(), content);
    }
  }
  const csv = parseCSV(csvFiles);
  const macros = /* @__PURE__ */ new Set();
  const header = parseERH(erhFiles, macros);
  for (const property of header) {
    if (property instanceof Define) {
      macros.add(property.name);
    }
  }
  const fnList = parseERB(erbFiles, macros);
  const mergedHeader = fnList.globals != null ? header.concat(fnList.globals) : header;
  return new VM({ header: mergedHeader, fnList, csv });
}

// fixture.mjs
var files = /* @__PURE__ */ new Map([["PROBE.ERB", `@SYSTEM_TITLE
PRINTL \uC5D4\uC9C4 \uC2DC\uD5D8
PRINTL [0] \uC0C8 \uC2DC\uD5D8 [1] \uC800\uC7A5 \uBD88\uB7EC\uC624\uAE30
INPUT
IF RESULT == 1
    LOADGLOBAL
    LOADDATA 0
ELSE
    PRINTL \uC815\uC218\uB97C \uC785\uB825\uD558\uC138\uC694
    INPUT
    FLAG:0 = RESULT
    PRINTL \uBB38\uC790\uB97C \uC785\uB825\uD558\uC138\uC694
    INPUTS
    SAVESTR:0 = %RESULTS%
    GLOBAL:0 = 77
    SAVEGLOBAL
    SAVEDATA 0, "probe"
    PRINTL SAVED
    QUIT
ENDIF

@SYSTEM_LOADEND
PRINTFORML RESTORED:{FLAG:0}:%SAVESTR:0%:{GLOBAL:0}
QUIT
`]]);

// browser-store.mjs
function createStore(name = "era-engine-probe-v1") {
  const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("saves");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Probe database upgrade blocked"));
  });
  async function transact(mode, operation) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction("saves", mode);
      const request = operation(tx.objectStore("saves"));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? request.error ?? new Error("Probe transaction aborted"));
      tx.onerror = () => {
      };
    });
  }
  return {
    get: (key) => transact("readonly", (objectStore) => objectStore.get(key)),
    set: (key, value) => transact("readwrite", (objectStore) => objectStore.put(value, key)),
    async entries() {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction("saves", "readonly"), store = tx.objectStore("saves");
        const keys = store.getAllKeys(), values = store.getAll();
        tx.oncomplete = () => resolve(keys.result.map((key, i) => [key, values.result[i]]));
        tx.onabort = () => reject(tx.error ?? new Error("Snapshot aborted"));
        tx.onerror = () => {
        };
      });
    },
    async replaceAll(entries) {
      const db = await dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction("saves", "readwrite"), store = tx.objectStore("saves");
        let failure;
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(failure ?? tx.error ?? new Error("Restore aborted"));
        tx.onerror = () => {
        };
        try {
          store.clear();
          for (const [key, value] of entries) store.put(value, key);
        } catch (error) {
          failure = error;
          tx.abort();
        }
      });
    },
    async close() {
      (await dbPromise).close();
    }
  };
}

// input-gate.mjs
function createInputGate(resume, { now = Date.now, schedule = setTimeout, unschedule = clearTimeout } = {}) {
  let sequence = 0, pending = null, timer;
  function cancel() {
    unschedule(timer);
    timer = void 0;
    pending = null;
  }
  function finish(value) {
    const request = pending;
    if (!request) return false;
    cancel();
    resume(value, request.id);
    return true;
  }
  function check() {
    if (pending?.deadline == null) return;
    const remaining = pending.deadline - now();
    if (remaining <= 0) finish(null);
    else {
      unschedule(timer);
      timer = schedule(check, Math.min(remaining, 2147483647));
    }
  }
  return {
    open(event) {
      cancel();
      const timeout = event.type === "tinput" ? Number(event.timeout) : null;
      if (timeout != null && (!Number.isFinite(timeout) || timeout < 0)) throw new Error("Invalid timed-input duration");
      pending = { id: ++sequence, event, deadline: timeout == null ? null : now() + timeout };
      if (timeout != null) timer = schedule(check, Math.min(timeout, 2147483647));
      return pending;
    },
    accept(id, value) {
      if (!pending || pending.id !== id || typeof value !== "string") return false;
      if (pending.deadline != null && now() >= pending.deadline) return finish(null);
      const { event } = pending;
      if (event.type !== "wait" && event.numeric && (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) return false;
      return finish(event.type === "wait" ? "" : value);
    },
    check,
    cancel
  };
}

// runtime-trace.mjs
function createProgressBridge(send, timeoutMs = 1500) {
  let sequence = 0;
  const pending = /* @__PURE__ */ new Map();
  return {
    acknowledge(id) {
      pending.get(id)?.();
    },
    report(progress2) {
      return new Promise((resolve) => {
        const id = ++sequence;
        const finish = () => {
          clearTimeout(timer);
          pending.delete(id);
          resolve();
        };
        const timer = setTimeout(finish, timeoutMs);
        pending.set(id, finish);
        try {
          send({ type: "save-progress", id, ...progress2 });
        } catch {
          finish();
        }
      });
    }
  };
}

// engine-worker.mjs
var progress = createProgressBridge((message) => postMessage(message));
var vm;
var generator;
var busy = false;
var batchId = 0;
var rendered;
var gate = createInputGate((value, id) => {
  busy = true;
  postMessage({ type: "running", id });
  advance(value).finally(() => {
    busy = false;
  });
});
function fail(error) {
  gate.cancel();
  postMessage({ type: "error", error: {
    message: error.message,
    name: error.name,
    file: error.line?.file ?? null,
    line: error.line?.line == null ? null : error.line.line + 1,
    trace: error.trace ?? vm?.contextStack.map((c) => c.fn.name) ?? []
  } });
}
async function advance(value) {
  let events = [];
  const flush = async () => {
    if (!events.length) return;
    const id = ++batchId;
    const ack = new Promise((resolve) => {
      rendered = { id, resolve };
    });
    postMessage({ type: "events", id, events });
    events = [];
    await ack;
  };
  try {
    for (let n = 0; n < 1e5; n++) {
      const next = await generator.next(value);
      value = null;
      if (next.done) {
        await flush();
        postMessage({ type: "ended" });
        return;
      }
      const event = next.value;
      if (["input", "wait", "tinput"].includes(event.type)) {
        await flush();
        const { id, deadline } = gate.open(event);
        postMessage({ type: "waiting", id, deadline, event, stack: vm.contextStack.map((c) => c.fn.name) });
        return;
      }
      events.push(event);
      if (events.length >= 128) await flush();
    }
    throw new Error("Event budget exceeded; stop and restart the session");
  } catch (error) {
    await flush();
    fail(error);
  }
}
self.onmessage = async ({ data }) => {
  if (data.type === "progress-recorded") {
    progress.acknowledge(data.id);
    return;
  }
  if (data.type === "rendered") {
    if (rendered?.id === data.id) {
      const { resolve } = rendered;
      rendered = null;
      resolve();
    }
    return;
  }
  if (busy) return;
  if (data.type === "input") {
    gate.accept(data.id, data.value);
    return;
  }
  if (data.type === "resume") {
    gate.check();
    return;
  }
  busy = true;
  try {
    if (data.type === "start" && !generator) {
      const game = data.mode === "game";
      let source = files;
      if (game) {
        const response = await fetch(data.bin ?? "./local-game.bin");
        if (!response.ok) throw new Error("Local game endpoint: HTTP " + response.status);
        const reader = response.body.pipeThrough(new DecompressionStream("gzip")).pipeThrough(new TextDecoderStream()).getReader();
        source = /* @__PURE__ */ new Map();
        let buffer = "", header = null;
        for (; ; ) {
          const { value, done } = await reader.read();
          if (value) buffer += value;
          let nl;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            if (!header) {
              header = JSON.parse(line);
              continue;
            }
            const entry = JSON.parse(line);
            source.set(entry[0], entry[1]);
          }
          if (done) break;
        }
        const tail = buffer.trim();
        if (tail) {
          const entry = JSON.parse(tail);
          source.set(entry[0], entry[1]);
        }
        if (!header || source.size !== header.count)
          throw new Error("Local game bundle incomplete: " + source.size + "/" + (header?.count ?? "?"));
      }
      const store = createStore(game ? data.db ?? "era-game-eraTHYMKR-erajs-v1" : "era-engine-probe-v1");
      vm = compile(source);
      source = null;
      generator = vm.start({
        getSavedata: async (key) => store.get(key),
        saveProgress: (detail) => progress.report(detail),
        setSavedata: async (key, value) => {
          await progress.report({ phase: "writing", key });
          await store.set(key, value);
          await progress.report({ phase: "committed", key });
          postMessage({ type: "saved", key });
        },
        getTime: () => Date.now(),
        getFont: () => false
      });
      await advance(null);
    }
  } catch (error) {
    fail(error);
  } finally {
    busy = false;
  }
};
/*! Bundled license information:

papaparse/papaparse.min.js:
  (* @license
  Papa Parse
  v5.5.3
  https://github.com/mholt/PapaParse
  License: MIT
  *)
*/
