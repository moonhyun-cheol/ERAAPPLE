var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
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

// node_modules/papaparse/papaparse.js
var require_papaparse = __commonJS({
  "node_modules/papaparse/papaparse.js"(exports, module) {
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define([], factory);
      } else if (typeof module === "object" && typeof exports !== "undefined") {
        module.exports = factory();
      } else {
        root.Papa = factory();
      }
    })(exports, function moduleFactory() {
      "use strict";
      var global = (function() {
        if (typeof self !== "undefined") {
          return self;
        }
        if (typeof window !== "undefined") {
          return window;
        }
        if (typeof global !== "undefined") {
          return global;
        }
        return {};
      })();
      function getWorkerBlob() {
        var URL = global.URL || global.webkitURL || null;
        var code = moduleFactory.toString();
        return Papa2.BLOB_URL || (Papa2.BLOB_URL = URL.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", "(", code, ")();"], { type: "text/javascript" })));
      }
      var IS_WORKER = !global.document && !!global.postMessage, IS_PAPA_WORKER = global.IS_PAPA_WORKER || false;
      var workers = {}, workerIdCounter = 0;
      var Papa2 = {};
      Papa2.parse = CsvToJson;
      Papa2.unparse = JsonToCsv;
      Papa2.RECORD_SEP = String.fromCharCode(30);
      Papa2.UNIT_SEP = String.fromCharCode(31);
      Papa2.BYTE_ORDER_MARK = "\uFEFF";
      Papa2.BAD_DELIMITERS = ["\r", "\n", '"', Papa2.BYTE_ORDER_MARK];
      Papa2.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
      Papa2.NODE_STREAM_INPUT = 1;
      Papa2.LocalChunkSize = 1024 * 1024 * 10;
      Papa2.RemoteChunkSize = 1024 * 1024 * 5;
      Papa2.DefaultDelimiter = ",";
      Papa2.Parser = Parser;
      Papa2.ParserHandle = ParserHandle;
      Papa2.NetworkStreamer = NetworkStreamer;
      Papa2.FileStreamer = FileStreamer;
      Papa2.StringStreamer = StringStreamer;
      Papa2.ReadableStreamStreamer = ReadableStreamStreamer;
      if (typeof PAPA_BROWSER_CONTEXT === "undefined") {
        Papa2.DuplexStreamStreamer = DuplexStreamStreamer;
      }
      if (global.jQuery) {
        var $ = global.jQuery;
        $.fn.parse = function(options) {
          var config = options.config || {};
          var queue = [];
          this.each(function(idx) {
            var supported = $(this).prop("tagName").toUpperCase() === "INPUT" && $(this).attr("type").toLowerCase() === "file" && global.FileReader;
            if (!supported || !this.files || this.files.length === 0)
              return true;
            for (var i = 0; i < this.files.length; i++) {
              queue.push({
                file: this.files[i],
                inputElem: this,
                instanceConfig: $.extend({}, config)
              });
            }
          });
          parseNextFile();
          return this;
          function parseNextFile() {
            if (queue.length === 0) {
              if (isFunction(options.complete))
                options.complete();
              return;
            }
            var f = queue[0];
            if (isFunction(options.before)) {
              var returned = options.before(f.file, f.inputElem);
              if (typeof returned === "object") {
                if (returned.action === "abort") {
                  error("AbortError", f.file, f.inputElem, returned.reason);
                  return;
                } else if (returned.action === "skip") {
                  fileComplete();
                  return;
                } else if (typeof returned.config === "object")
                  f.instanceConfig = $.extend(f.instanceConfig, returned.config);
              } else if (returned === "skip") {
                fileComplete();
                return;
              }
            }
            var userCompleteFunc = f.instanceConfig.complete;
            f.instanceConfig.complete = function(results) {
              if (isFunction(userCompleteFunc))
                userCompleteFunc(results, f.file, f.inputElem);
              fileComplete();
            };
            Papa2.parse(f.file, f.instanceConfig);
          }
          function error(name, file, elem, reason) {
            if (isFunction(options.error))
              options.error({ name }, file, elem, reason);
          }
          function fileComplete() {
            queue.splice(0, 1);
            parseNextFile();
          }
        };
      }
      if (IS_PAPA_WORKER) {
        global.onmessage = workerThreadReceivedMessage;
      }
      function CsvToJson(_input, _config) {
        _config = _config || {};
        var dynamicTyping = _config.dynamicTyping || false;
        if (isFunction(dynamicTyping)) {
          _config.dynamicTypingFunction = dynamicTyping;
          dynamicTyping = {};
        }
        _config.dynamicTyping = dynamicTyping;
        _config.transform = isFunction(_config.transform) ? _config.transform : false;
        if (_config.worker && Papa2.WORKERS_SUPPORTED) {
          var w = newWorker();
          w.userStep = _config.step;
          w.userChunk = _config.chunk;
          w.userComplete = _config.complete;
          w.userError = _config.error;
          _config.step = isFunction(_config.step);
          _config.chunk = isFunction(_config.chunk);
          _config.complete = isFunction(_config.complete);
          _config.error = isFunction(_config.error);
          delete _config.worker;
          w.postMessage({
            input: _input,
            config: _config,
            workerId: w.id
          });
          return;
        }
        var streamer = null;
        if (_input === Papa2.NODE_STREAM_INPUT && typeof PAPA_BROWSER_CONTEXT === "undefined") {
          streamer = new DuplexStreamStreamer(_config);
          return streamer.getStream();
        } else if (typeof _input === "string") {
          _input = stripBom(_input);
          if (_config.download)
            streamer = new NetworkStreamer(_config);
          else
            streamer = new StringStreamer(_config);
        } else if (_input.readable === true && isFunction(_input.read) && isFunction(_input.on)) {
          streamer = new ReadableStreamStreamer(_config);
        } else if (global.File && _input instanceof File || _input instanceof Object)
          streamer = new FileStreamer(_config);
        return streamer.stream(_input);
        function stripBom(string2) {
          if (string2.charCodeAt(0) === 65279) {
            return string2.slice(1);
          }
          return string2;
        }
      }
      function JsonToCsv(_input, _config) {
        var _quotes = false;
        var _writeHeader = true;
        var _delimiter = ",";
        var _newline = "\r\n";
        var _quoteChar = '"';
        var _escapedQuote = _quoteChar + _quoteChar;
        var _skipEmptyLines = false;
        var _columns = null;
        var _escapeFormulae = false;
        unpackConfig();
        var quoteCharRegex = new RegExp(escapeRegExp(_quoteChar), "g");
        if (typeof _input === "string")
          _input = JSON.parse(_input);
        if (Array.isArray(_input)) {
          if (!_input.length || Array.isArray(_input[0]))
            return serialize(null, _input, _skipEmptyLines);
          else if (typeof _input[0] === "object")
            return serialize(_columns || Object.keys(_input[0]), _input, _skipEmptyLines);
        } else if (typeof _input === "object") {
          if (typeof _input.data === "string")
            _input.data = JSON.parse(_input.data);
          if (Array.isArray(_input.data)) {
            if (!_input.fields)
              _input.fields = _input.meta && _input.meta.fields || _columns;
            if (!_input.fields)
              _input.fields = Array.isArray(_input.data[0]) ? _input.fields : typeof _input.data[0] === "object" ? Object.keys(_input.data[0]) : [];
            if (!Array.isArray(_input.data[0]) && typeof _input.data[0] !== "object")
              _input.data = [_input.data];
          }
          return serialize(_input.fields || [], _input.data || [], _skipEmptyLines);
        }
        throw new Error("Unable to serialize unrecognized input");
        function unpackConfig() {
          if (typeof _config !== "object")
            return;
          if (typeof _config.delimiter === "string" && !Papa2.BAD_DELIMITERS.filter(function(value) {
            return _config.delimiter.indexOf(value) !== -1;
          }).length) {
            _delimiter = _config.delimiter;
          }
          if (typeof _config.quotes === "boolean" || typeof _config.quotes === "function" || Array.isArray(_config.quotes))
            _quotes = _config.quotes;
          if (typeof _config.skipEmptyLines === "boolean" || typeof _config.skipEmptyLines === "string")
            _skipEmptyLines = _config.skipEmptyLines;
          if (typeof _config.newline === "string")
            _newline = _config.newline;
          if (typeof _config.quoteChar === "string")
            _quoteChar = _config.quoteChar;
          if (typeof _config.header === "boolean")
            _writeHeader = _config.header;
          if (Array.isArray(_config.columns)) {
            if (_config.columns.length === 0) throw new Error("Option columns is empty");
            _columns = _config.columns;
          }
          if (_config.escapeChar !== void 0) {
            _escapedQuote = _config.escapeChar + _quoteChar;
          }
          if (_config.escapeFormulae instanceof RegExp) {
            _escapeFormulae = _config.escapeFormulae;
          } else if (typeof _config.escapeFormulae === "boolean" && _config.escapeFormulae) {
            _escapeFormulae = /^[=+\-@\t\r].*$/;
          }
        }
        function serialize(fields, data, skipEmptyLines) {
          var csv = "";
          if (typeof fields === "string")
            fields = JSON.parse(fields);
          if (typeof data === "string")
            data = JSON.parse(data);
          var hasHeader = Array.isArray(fields) && fields.length > 0;
          var dataKeyedByField = !Array.isArray(data[0]);
          if (hasHeader && _writeHeader) {
            for (var i = 0; i < fields.length; i++) {
              if (i > 0)
                csv += _delimiter;
              csv += safe(fields[i], i);
            }
            if (data.length > 0)
              csv += _newline;
          }
          for (var row = 0; row < data.length; row++) {
            var maxCol = hasHeader ? fields.length : data[row].length;
            var emptyLine = false;
            var nullLine = hasHeader ? Object.keys(data[row]).length === 0 : data[row].length === 0;
            if (skipEmptyLines && !hasHeader) {
              emptyLine = skipEmptyLines === "greedy" ? data[row].join("").trim() === "" : data[row].length === 1 && data[row][0].length === 0;
            }
            if (skipEmptyLines === "greedy" && hasHeader) {
              var line = [];
              for (var c = 0; c < maxCol; c++) {
                var cx = dataKeyedByField ? fields[c] : c;
                line.push(data[row][cx]);
              }
              emptyLine = line.join("").trim() === "";
            }
            if (!emptyLine) {
              for (var col = 0; col < maxCol; col++) {
                if (col > 0 && !nullLine)
                  csv += _delimiter;
                var colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
                csv += safe(data[row][colIdx], col);
              }
              if (row < data.length - 1 && (!skipEmptyLines || maxCol > 0 && !nullLine)) {
                csv += _newline;
              }
            }
          }
          return csv;
        }
        function safe(str, col) {
          if (typeof str === "undefined" || str === null)
            return "";
          if (str.constructor === Date)
            return JSON.stringify(str).slice(1, 25);
          var needsQuotes = false;
          if (_escapeFormulae && typeof str === "string" && _escapeFormulae.test(str)) {
            str = "'" + str;
            needsQuotes = true;
          }
          var escapedQuoteStr = str.toString().replace(quoteCharRegex, _escapedQuote);
          needsQuotes = needsQuotes || _quotes === true || typeof _quotes === "function" && _quotes(str, col) || Array.isArray(_quotes) && _quotes[col] || hasAny(escapedQuoteStr, Papa2.BAD_DELIMITERS) || escapedQuoteStr.indexOf(_delimiter) > -1 || escapedQuoteStr.charAt(0) === " " || escapedQuoteStr.charAt(escapedQuoteStr.length - 1) === " ";
          return needsQuotes ? _quoteChar + escapedQuoteStr + _quoteChar : escapedQuoteStr;
        }
        function hasAny(str, substrings) {
          for (var i = 0; i < substrings.length; i++)
            if (str.indexOf(substrings[i]) > -1)
              return true;
          return false;
        }
      }
      function ChunkStreamer(config) {
        this._handle = null;
        this._finished = false;
        this._completed = false;
        this._halted = false;
        this._input = null;
        this._baseIndex = 0;
        this._partialLine = "";
        this._rowCount = 0;
        this._start = 0;
        this._nextChunk = null;
        this.isFirstChunk = true;
        this._completeResults = {
          data: [],
          errors: [],
          meta: {}
        };
        replaceConfig.call(this, config);
        this.parseChunk = function(chunk, isFakeChunk) {
          const skipFirstNLines = parseInt(this._config.skipFirstNLines) || 0;
          if (this.isFirstChunk && skipFirstNLines > 0) {
            let _newline = this._config.newline;
            if (!_newline) {
              const quoteChar = this._config.quoteChar || '"';
              _newline = this._handle.guessLineEndings(chunk, quoteChar);
            }
            const splitChunk = chunk.split(_newline);
            chunk = [...splitChunk.slice(skipFirstNLines)].join(_newline);
          }
          if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk)) {
            var modifiedChunk = this._config.beforeFirstChunk(chunk);
            if (modifiedChunk !== void 0)
              chunk = modifiedChunk;
          }
          this.isFirstChunk = false;
          this._halted = false;
          var aggregate = this._partialLine + chunk;
          this._partialLine = "";
          var results = this._handle.parse(aggregate, this._baseIndex, !this._finished);
          if (this._handle.paused() || this._handle.aborted()) {
            this._halted = true;
            return;
          }
          var lastIndex = results.meta.cursor;
          if (!this._finished) {
            this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
            this._baseIndex = lastIndex;
          }
          if (results && results.data)
            this._rowCount += results.data.length;
          var finishedIncludingPreview = this._finished || this._config.preview && this._rowCount >= this._config.preview;
          if (IS_PAPA_WORKER) {
            global.postMessage({
              results,
              workerId: Papa2.WORKER_ID,
              finished: finishedIncludingPreview
            });
          } else if (isFunction(this._config.chunk) && !isFakeChunk) {
            this._config.chunk(results, this._handle);
            if (this._handle.paused() || this._handle.aborted()) {
              this._halted = true;
              return;
            }
            results = void 0;
            this._completeResults = void 0;
          }
          if (!this._config.step && !this._config.chunk) {
            this._completeResults.data = this._completeResults.data.concat(results.data);
            this._completeResults.errors = this._completeResults.errors.concat(results.errors);
            this._completeResults.meta = results.meta;
          }
          if (!this._completed && finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted)) {
            this._config.complete(this._completeResults, this._input);
            this._completed = true;
          }
          if (!finishedIncludingPreview && (!results || !results.meta.paused))
            this._nextChunk();
          return results;
        };
        this._sendError = function(error) {
          if (isFunction(this._config.error))
            this._config.error(error);
          else if (IS_PAPA_WORKER && this._config.error) {
            global.postMessage({
              workerId: Papa2.WORKER_ID,
              error,
              finished: false
            });
          }
        };
        function replaceConfig(config2) {
          var configCopy = copy(config2);
          configCopy.chunkSize = parseInt(configCopy.chunkSize);
          if (!config2.step && !config2.chunk)
            configCopy.chunkSize = null;
          this._handle = new ParserHandle(configCopy);
          this._handle.streamer = this;
          this._config = configCopy;
        }
      }
      function NetworkStreamer(config) {
        config = config || {};
        if (!config.chunkSize)
          config.chunkSize = Papa2.RemoteChunkSize;
        ChunkStreamer.call(this, config);
        var xhr;
        if (IS_WORKER) {
          this._nextChunk = function() {
            this._readChunk();
            this._chunkLoaded();
          };
        } else {
          this._nextChunk = function() {
            this._readChunk();
          };
        }
        this.stream = function(url) {
          this._input = url;
          this._nextChunk();
        };
        this._readChunk = function() {
          if (this._finished) {
            this._chunkLoaded();
            return;
          }
          xhr = new XMLHttpRequest();
          if (this._config.withCredentials) {
            xhr.withCredentials = this._config.withCredentials;
          }
          if (!IS_WORKER) {
            xhr.onload = bindFunction(this._chunkLoaded, this);
            xhr.onerror = bindFunction(this._chunkError, this);
          }
          xhr.open(this._config.downloadRequestBody ? "POST" : "GET", this._input, !IS_WORKER);
          if (this._config.downloadRequestHeaders) {
            var headers = this._config.downloadRequestHeaders;
            for (var headerName in headers) {
              xhr.setRequestHeader(headerName, headers[headerName]);
            }
          }
          if (this._config.chunkSize) {
            var end = this._start + this._config.chunkSize - 1;
            xhr.setRequestHeader("Range", "bytes=" + this._start + "-" + end);
          }
          try {
            xhr.send(this._config.downloadRequestBody);
          } catch (err) {
            this._chunkError(err.message);
          }
          if (IS_WORKER && xhr.status === 0)
            this._chunkError();
        };
        this._chunkLoaded = function() {
          if (xhr.readyState !== 4)
            return;
          if (xhr.status < 200 || xhr.status >= 400) {
            this._chunkError();
            return;
          }
          this._start += this._config.chunkSize ? this._config.chunkSize : xhr.responseText.length;
          this._finished = !this._config.chunkSize || this._start >= getFileSize(xhr);
          this.parseChunk(xhr.responseText);
        };
        this._chunkError = function(errorMessage) {
          var errorText = xhr.statusText || errorMessage;
          this._sendError(new Error(errorText));
        };
        function getFileSize(xhr2) {
          var contentRange = xhr2.getResponseHeader("Content-Range");
          if (contentRange === null) {
            return -1;
          }
          return parseInt(contentRange.substring(contentRange.lastIndexOf("/") + 1));
        }
      }
      NetworkStreamer.prototype = Object.create(ChunkStreamer.prototype);
      NetworkStreamer.prototype.constructor = NetworkStreamer;
      function FileStreamer(config) {
        config = config || {};
        if (!config.chunkSize)
          config.chunkSize = Papa2.LocalChunkSize;
        ChunkStreamer.call(this, config);
        var reader, slice;
        var usingAsyncReader = typeof FileReader !== "undefined";
        this.stream = function(file) {
          this._input = file;
          slice = file.slice || file.webkitSlice || file.mozSlice;
          if (usingAsyncReader) {
            reader = new FileReader();
            reader.onload = bindFunction(this._chunkLoaded, this);
            reader.onerror = bindFunction(this._chunkError, this);
          } else
            reader = new FileReaderSync();
          this._nextChunk();
        };
        this._nextChunk = function() {
          if (!this._finished && (!this._config.preview || this._rowCount < this._config.preview))
            this._readChunk();
        };
        this._readChunk = function() {
          var input = this._input;
          if (this._config.chunkSize) {
            var end = Math.min(this._start + this._config.chunkSize, this._input.size);
            input = slice.call(input, this._start, end);
          }
          var txt = reader.readAsText(input, this._config.encoding);
          if (!usingAsyncReader)
            this._chunkLoaded({ target: { result: txt } });
        };
        this._chunkLoaded = function(event) {
          this._start += this._config.chunkSize;
          this._finished = !this._config.chunkSize || this._start >= this._input.size;
          this.parseChunk(event.target.result);
        };
        this._chunkError = function() {
          this._sendError(reader.error);
        };
      }
      FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
      FileStreamer.prototype.constructor = FileStreamer;
      function StringStreamer(config) {
        config = config || {};
        ChunkStreamer.call(this, config);
        var remaining;
        this.stream = function(s) {
          remaining = s;
          return this._nextChunk();
        };
        this._nextChunk = function() {
          if (this._finished) return;
          var size = this._config.chunkSize;
          var chunk;
          if (size) {
            chunk = remaining.substring(0, size);
            remaining = remaining.substring(size);
          } else {
            chunk = remaining;
            remaining = "";
          }
          this._finished = !remaining;
          return this.parseChunk(chunk);
        };
      }
      StringStreamer.prototype = Object.create(StringStreamer.prototype);
      StringStreamer.prototype.constructor = StringStreamer;
      function ReadableStreamStreamer(config) {
        config = config || {};
        ChunkStreamer.call(this, config);
        var queue = [];
        var parseOnData = true;
        var streamHasEnded = false;
        this.pause = function() {
          ChunkStreamer.prototype.pause.apply(this, arguments);
          this._input.pause();
        };
        this.resume = function() {
          ChunkStreamer.prototype.resume.apply(this, arguments);
          this._input.resume();
        };
        this.stream = function(stream) {
          this._input = stream;
          this._input.on("data", this._streamData);
          this._input.on("end", this._streamEnd);
          this._input.on("error", this._streamError);
        };
        this._checkIsFinished = function() {
          if (streamHasEnded && queue.length === 1) {
            this._finished = true;
          }
        };
        this._nextChunk = function() {
          this._checkIsFinished();
          if (queue.length) {
            this.parseChunk(queue.shift());
          } else {
            parseOnData = true;
          }
        };
        this._streamData = bindFunction(function(chunk) {
          try {
            queue.push(typeof chunk === "string" ? chunk : chunk.toString(this._config.encoding));
            if (parseOnData) {
              parseOnData = false;
              this._checkIsFinished();
              this.parseChunk(queue.shift());
            }
          } catch (error) {
            this._streamError(error);
          }
        }, this);
        this._streamError = bindFunction(function(error) {
          this._streamCleanUp();
          this._sendError(error);
        }, this);
        this._streamEnd = bindFunction(function() {
          this._streamCleanUp();
          streamHasEnded = true;
          this._streamData("");
        }, this);
        this._streamCleanUp = bindFunction(function() {
          this._input.removeListener("data", this._streamData);
          this._input.removeListener("end", this._streamEnd);
          this._input.removeListener("error", this._streamError);
        }, this);
      }
      ReadableStreamStreamer.prototype = Object.create(ChunkStreamer.prototype);
      ReadableStreamStreamer.prototype.constructor = ReadableStreamStreamer;
      function DuplexStreamStreamer(_config) {
        var Duplex = __require("stream").Duplex;
        var config = copy(_config);
        var parseOnWrite = true;
        var writeStreamHasFinished = false;
        var parseCallbackQueue = [];
        var stream = null;
        this._onCsvData = function(results) {
          var data = results.data;
          if (!stream.push(data) && !this._handle.paused()) {
            this._handle.pause();
          }
        };
        this._onCsvComplete = function() {
          stream.push(null);
        };
        config.step = bindFunction(this._onCsvData, this);
        config.complete = bindFunction(this._onCsvComplete, this);
        ChunkStreamer.call(this, config);
        this._nextChunk = function() {
          if (writeStreamHasFinished && parseCallbackQueue.length === 1) {
            this._finished = true;
          }
          if (parseCallbackQueue.length) {
            parseCallbackQueue.shift()();
          } else {
            parseOnWrite = true;
          }
        };
        this._addToParseQueue = function(chunk, callback) {
          parseCallbackQueue.push(bindFunction(function() {
            this.parseChunk(typeof chunk === "string" ? chunk : chunk.toString(config.encoding));
            if (isFunction(callback)) {
              return callback();
            }
          }, this));
          if (parseOnWrite) {
            parseOnWrite = false;
            this._nextChunk();
          }
        };
        this._onRead = function() {
          if (this._handle.paused()) {
            this._handle.resume();
          }
        };
        this._onWrite = function(chunk, encoding, callback) {
          this._addToParseQueue(chunk, callback);
        };
        this._onWriteComplete = function() {
          writeStreamHasFinished = true;
          this._addToParseQueue("");
        };
        this.getStream = function() {
          return stream;
        };
        stream = new Duplex({
          readableObjectMode: true,
          decodeStrings: false,
          read: bindFunction(this._onRead, this),
          write: bindFunction(this._onWrite, this)
        });
        stream.once("finish", bindFunction(this._onWriteComplete, this));
      }
      if (typeof PAPA_BROWSER_CONTEXT === "undefined") {
        DuplexStreamStreamer.prototype = Object.create(ChunkStreamer.prototype);
        DuplexStreamStreamer.prototype.constructor = DuplexStreamStreamer;
      }
      function ParserHandle(_config) {
        var MAX_FLOAT = Math.pow(2, 53);
        var MIN_FLOAT = -MAX_FLOAT;
        var FLOAT = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/;
        var ISO_DATE = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;
        var self2 = this;
        var _stepCounter = 0;
        var _rowCounter = 0;
        var _input;
        var _parser;
        var _paused = false;
        var _aborted = false;
        var _delimiterError;
        var _fields = [];
        var _results = {
          // The last results returned from the parser
          data: [],
          errors: [],
          meta: {}
        };
        if (isFunction(_config.step)) {
          var userStep = _config.step;
          _config.step = function(results) {
            _results = results;
            if (needsHeaderRow())
              processResults();
            else {
              processResults();
              if (_results.data.length === 0)
                return;
              _stepCounter += results.data.length;
              if (_config.preview && _stepCounter > _config.preview)
                _parser.abort();
              else {
                _results.data = _results.data[0];
                userStep(_results, self2);
              }
            }
          };
        }
        this.parse = function(input, baseIndex, ignoreLastRow) {
          var quoteChar = _config.quoteChar || '"';
          if (!_config.newline)
            _config.newline = this.guessLineEndings(input, quoteChar);
          _delimiterError = false;
          if (!_config.delimiter) {
            var delimGuess = guessDelimiter(input, _config.newline, _config.skipEmptyLines, _config.comments, _config.delimitersToGuess);
            if (delimGuess.successful)
              _config.delimiter = delimGuess.bestDelimiter;
            else {
              _delimiterError = true;
              _config.delimiter = Papa2.DefaultDelimiter;
            }
            _results.meta.delimiter = _config.delimiter;
          } else if (isFunction(_config.delimiter)) {
            _config.delimiter = _config.delimiter(input);
            _results.meta.delimiter = _config.delimiter;
          }
          var parserConfig = copy(_config);
          if (_config.preview && _config.header)
            parserConfig.preview++;
          _input = input;
          _parser = new Parser(parserConfig);
          _results = _parser.parse(_input, baseIndex, ignoreLastRow);
          processResults();
          return _paused ? { meta: { paused: true } } : _results || { meta: { paused: false } };
        };
        this.paused = function() {
          return _paused;
        };
        this.pause = function() {
          _paused = true;
          _parser.abort();
          _input = isFunction(_config.chunk) ? "" : _input.substring(_parser.getCharIndex());
        };
        this.resume = function() {
          if (self2.streamer._halted) {
            _paused = false;
            self2.streamer.parseChunk(_input, true);
          } else {
            setTimeout(self2.resume, 3);
          }
        };
        this.aborted = function() {
          return _aborted;
        };
        this.abort = function() {
          _aborted = true;
          _parser.abort();
          _results.meta.aborted = true;
          if (isFunction(_config.complete))
            _config.complete(_results);
          _input = "";
        };
        this.guessLineEndings = function(input, quoteChar) {
          input = input.substring(0, 1024 * 1024);
          var re = new RegExp(escapeRegExp(quoteChar) + "([^]*?)" + escapeRegExp(quoteChar), "gm");
          input = input.replace(re, "");
          var r = input.split("\r");
          var n = input.split("\n");
          var nAppearsFirst = n.length > 1 && n[0].length < r[0].length;
          if (r.length === 1 || nAppearsFirst)
            return "\n";
          var numWithN = 0;
          for (var i = 0; i < r.length; i++) {
            if (r[i][0] === "\n")
              numWithN++;
          }
          return numWithN >= r.length / 2 ? "\r\n" : "\r";
        };
        function testEmptyLine(s) {
          return _config.skipEmptyLines === "greedy" ? s.join("").trim() === "" : s.length === 1 && s[0].length === 0;
        }
        function testFloat(s) {
          if (FLOAT.test(s)) {
            var floatValue = parseFloat(s);
            if (floatValue > MIN_FLOAT && floatValue < MAX_FLOAT) {
              return true;
            }
          }
          return false;
        }
        function processResults() {
          if (_results && _delimiterError) {
            addError("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '" + Papa2.DefaultDelimiter + "'");
            _delimiterError = false;
          }
          if (_config.skipEmptyLines) {
            _results.data = _results.data.filter(function(d) {
              return !testEmptyLine(d);
            });
          }
          if (needsHeaderRow())
            fillHeaderFields();
          return applyHeaderAndDynamicTypingAndTransformation();
        }
        function needsHeaderRow() {
          return _config.header && _fields.length === 0;
        }
        function fillHeaderFields() {
          if (!_results)
            return;
          function addHeader(header, i2) {
            if (isFunction(_config.transformHeader))
              header = _config.transformHeader(header, i2);
            _fields.push(header);
          }
          if (Array.isArray(_results.data[0])) {
            for (var i = 0; needsHeaderRow() && i < _results.data.length; i++)
              _results.data[i].forEach(addHeader);
            _results.data.splice(0, 1);
          } else
            _results.data.forEach(addHeader);
        }
        function shouldApplyDynamicTyping(field) {
          if (_config.dynamicTypingFunction && _config.dynamicTyping[field] === void 0) {
            _config.dynamicTyping[field] = _config.dynamicTypingFunction(field);
          }
          return (_config.dynamicTyping[field] || _config.dynamicTyping) === true;
        }
        function parseDynamic(field, value) {
          if (shouldApplyDynamicTyping(field)) {
            if (value === "true" || value === "TRUE")
              return true;
            else if (value === "false" || value === "FALSE")
              return false;
            else if (testFloat(value))
              return parseFloat(value);
            else if (ISO_DATE.test(value))
              return new Date(value);
            else
              return value === "" ? null : value;
          }
          return value;
        }
        function applyHeaderAndDynamicTypingAndTransformation() {
          if (!_results || !_config.header && !_config.dynamicTyping && !_config.transform)
            return _results;
          function processRow(rowSource, i) {
            var row = _config.header ? {} : [];
            var j;
            for (j = 0; j < rowSource.length; j++) {
              var field = j;
              var value = rowSource[j];
              if (_config.header)
                field = j >= _fields.length ? "__parsed_extra" : _fields[j];
              if (_config.transform)
                value = _config.transform(value, field);
              value = parseDynamic(field, value);
              if (field === "__parsed_extra") {
                row[field] = row[field] || [];
                row[field].push(value);
              } else
                row[field] = value;
            }
            if (_config.header) {
              if (j > _fields.length)
                addError("FieldMismatch", "TooManyFields", "Too many fields: expected " + _fields.length + " fields but parsed " + j, _rowCounter + i);
              else if (j < _fields.length)
                addError("FieldMismatch", "TooFewFields", "Too few fields: expected " + _fields.length + " fields but parsed " + j, _rowCounter + i);
            }
            return row;
          }
          var incrementBy = 1;
          if (!_results.data.length || Array.isArray(_results.data[0])) {
            _results.data = _results.data.map(processRow);
            incrementBy = _results.data.length;
          } else
            _results.data = processRow(_results.data, 0);
          if (_config.header && _results.meta)
            _results.meta.fields = _fields;
          _rowCounter += incrementBy;
          return _results;
        }
        function guessDelimiter(input, newline, skipEmptyLines, comments, delimitersToGuess) {
          var bestDelim, bestDelta, fieldCountPrevRow, maxFieldCount;
          delimitersToGuess = delimitersToGuess || [",", "	", "|", ";", Papa2.RECORD_SEP, Papa2.UNIT_SEP];
          for (var i = 0; i < delimitersToGuess.length; i++) {
            var delim = delimitersToGuess[i];
            var delta = 0, avgFieldCount = 0, emptyLinesCount = 0;
            fieldCountPrevRow = void 0;
            var preview = new Parser({
              comments,
              delimiter: delim,
              newline,
              preview: 10
            }).parse(input);
            for (var j = 0; j < preview.data.length; j++) {
              if (skipEmptyLines && testEmptyLine(preview.data[j])) {
                emptyLinesCount++;
                continue;
              }
              var fieldCount = preview.data[j].length;
              avgFieldCount += fieldCount;
              if (typeof fieldCountPrevRow === "undefined") {
                fieldCountPrevRow = fieldCount;
                continue;
              } else if (fieldCount > 0) {
                delta += Math.abs(fieldCount - fieldCountPrevRow);
                fieldCountPrevRow = fieldCount;
              }
            }
            if (preview.data.length > 0)
              avgFieldCount /= preview.data.length - emptyLinesCount;
            if ((typeof bestDelta === "undefined" || delta <= bestDelta) && (typeof maxFieldCount === "undefined" || avgFieldCount > maxFieldCount) && avgFieldCount > 1.99) {
              bestDelta = delta;
              bestDelim = delim;
              maxFieldCount = avgFieldCount;
            }
          }
          _config.delimiter = bestDelim;
          return {
            successful: !!bestDelim,
            bestDelimiter: bestDelim
          };
        }
        function addError(type, code, msg, row) {
          var error = {
            type,
            code,
            message: msg
          };
          if (row !== void 0) {
            error.row = row;
          }
          _results.errors.push(error);
        }
      }
      function escapeRegExp(string2) {
        return string2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function Parser(config) {
        config = config || {};
        var delim = config.delimiter;
        var newline = config.newline;
        var comments = config.comments;
        var step = config.step;
        var preview = config.preview;
        var fastMode = config.fastMode;
        var quoteChar;
        var renamedHeaders = null;
        var headerParsed = false;
        if (config.quoteChar === void 0 || config.quoteChar === null) {
          quoteChar = '"';
        } else {
          quoteChar = config.quoteChar;
        }
        var escapeChar = quoteChar;
        if (config.escapeChar !== void 0) {
          escapeChar = config.escapeChar;
        }
        if (typeof delim !== "string" || Papa2.BAD_DELIMITERS.indexOf(delim) > -1)
          delim = ",";
        if (comments === delim)
          throw new Error("Comment character same as delimiter");
        else if (comments === true)
          comments = "#";
        else if (typeof comments !== "string" || Papa2.BAD_DELIMITERS.indexOf(comments) > -1)
          comments = false;
        if (newline !== "\n" && newline !== "\r" && newline !== "\r\n")
          newline = "\n";
        var cursor = 0;
        var aborted = false;
        this.parse = function(input, baseIndex, ignoreLastRow) {
          if (typeof input !== "string")
            throw new Error("Input must be a string");
          var inputLen = input.length, delimLen = delim.length, newlineLen = newline.length, commentsLen = comments.length;
          var stepIsFunction = isFunction(step);
          cursor = 0;
          var data = [], errors = [], row = [], lastCursor = 0;
          if (!input)
            return returnable();
          if (fastMode || fastMode !== false && input.indexOf(quoteChar) === -1) {
            var rows = input.split(newline);
            for (var i = 0; i < rows.length; i++) {
              row = rows[i];
              cursor += row.length;
              if (i !== rows.length - 1)
                cursor += newline.length;
              else if (ignoreLastRow)
                return returnable();
              if (comments && row.substring(0, commentsLen) === comments)
                continue;
              if (stepIsFunction) {
                data = [];
                pushRow(row.split(delim));
                doStep();
                if (aborted)
                  return returnable();
              } else
                pushRow(row.split(delim));
              if (preview && i >= preview) {
                data = data.slice(0, preview);
                return returnable(true);
              }
            }
            return returnable();
          }
          var nextDelim = input.indexOf(delim, cursor);
          var nextNewline = input.indexOf(newline, cursor);
          var quoteCharRegex = new RegExp(escapeRegExp(escapeChar) + escapeRegExp(quoteChar), "g");
          var quoteSearch = input.indexOf(quoteChar, cursor);
          for (; ; ) {
            if (input[cursor] === quoteChar) {
              quoteSearch = cursor;
              cursor++;
              for (; ; ) {
                quoteSearch = input.indexOf(quoteChar, quoteSearch + 1);
                if (quoteSearch === -1) {
                  if (!ignoreLastRow) {
                    errors.push({
                      type: "Quotes",
                      code: "MissingQuotes",
                      message: "Quoted field unterminated",
                      row: data.length,
                      // row has yet to be inserted
                      index: cursor
                    });
                  }
                  return finish();
                }
                if (quoteSearch === inputLen - 1) {
                  var value = input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar);
                  return finish(value);
                }
                if (quoteChar === escapeChar && input[quoteSearch + 1] === escapeChar) {
                  quoteSearch++;
                  continue;
                }
                if (quoteChar !== escapeChar && quoteSearch !== 0 && input[quoteSearch - 1] === escapeChar) {
                  continue;
                }
                if (nextDelim !== -1 && nextDelim < quoteSearch + 1) {
                  nextDelim = input.indexOf(delim, quoteSearch + 1);
                }
                if (nextNewline !== -1 && nextNewline < quoteSearch + 1) {
                  nextNewline = input.indexOf(newline, quoteSearch + 1);
                }
                var checkUpTo = nextNewline === -1 ? nextDelim : Math.min(nextDelim, nextNewline);
                var spacesBetweenQuoteAndDelimiter = extraSpaces(checkUpTo);
                if (input.substr(quoteSearch + 1 + spacesBetweenQuoteAndDelimiter, delimLen) === delim) {
                  row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
                  cursor = quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen;
                  if (input[quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen] !== quoteChar) {
                    quoteSearch = input.indexOf(quoteChar, cursor);
                  }
                  nextDelim = input.indexOf(delim, cursor);
                  nextNewline = input.indexOf(newline, cursor);
                  break;
                }
                var spacesBetweenQuoteAndNewLine = extraSpaces(nextNewline);
                if (input.substring(quoteSearch + 1 + spacesBetweenQuoteAndNewLine, quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen) === newline) {
                  row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
                  saveRow(quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen);
                  nextDelim = input.indexOf(delim, cursor);
                  quoteSearch = input.indexOf(quoteChar, cursor);
                  if (stepIsFunction) {
                    doStep();
                    if (aborted)
                      return returnable();
                  }
                  if (preview && data.length >= preview)
                    return returnable(true);
                  break;
                }
                errors.push({
                  type: "Quotes",
                  code: "InvalidQuotes",
                  message: "Trailing quote on quoted field is malformed",
                  row: data.length,
                  // row has yet to be inserted
                  index: cursor
                });
                quoteSearch++;
                continue;
              }
              continue;
            }
            if (comments && row.length === 0 && input.substring(cursor, cursor + commentsLen) === comments) {
              if (nextNewline === -1)
                return returnable();
              cursor = nextNewline + newlineLen;
              nextNewline = input.indexOf(newline, cursor);
              nextDelim = input.indexOf(delim, cursor);
              continue;
            }
            if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1)) {
              row.push(input.substring(cursor, nextDelim));
              cursor = nextDelim + delimLen;
              nextDelim = input.indexOf(delim, cursor);
              continue;
            }
            if (nextNewline !== -1) {
              row.push(input.substring(cursor, nextNewline));
              saveRow(nextNewline + newlineLen);
              if (stepIsFunction) {
                doStep();
                if (aborted)
                  return returnable();
              }
              if (preview && data.length >= preview)
                return returnable(true);
              continue;
            }
            break;
          }
          return finish();
          function pushRow(row2) {
            data.push(row2);
            lastCursor = cursor;
          }
          function extraSpaces(index) {
            var spaceLength = 0;
            if (index !== -1) {
              var textBetweenClosingQuoteAndIndex = input.substring(quoteSearch + 1, index);
              if (textBetweenClosingQuoteAndIndex && textBetweenClosingQuoteAndIndex.trim() === "") {
                spaceLength = textBetweenClosingQuoteAndIndex.length;
              }
            }
            return spaceLength;
          }
          function finish(value2) {
            if (ignoreLastRow)
              return returnable();
            if (typeof value2 === "undefined")
              value2 = input.substring(cursor);
            row.push(value2);
            cursor = inputLen;
            pushRow(row);
            if (stepIsFunction)
              doStep();
            return returnable();
          }
          function saveRow(newCursor) {
            cursor = newCursor;
            pushRow(row);
            row = [];
            nextNewline = input.indexOf(newline, cursor);
          }
          function returnable(stopped) {
            if (config.header && !baseIndex && data.length && !headerParsed) {
              const result = data[0];
              const headerCount = /* @__PURE__ */ Object.create(null);
              const usedHeaders = new Set(result);
              let duplicateHeaders = false;
              for (let i2 = 0; i2 < result.length; i2++) {
                let header = result[i2];
                if (isFunction(config.transformHeader))
                  header = config.transformHeader(header, i2);
                if (!headerCount[header]) {
                  headerCount[header] = 1;
                  result[i2] = header;
                } else {
                  let newHeader;
                  let suffixCount = headerCount[header];
                  do {
                    newHeader = `${header}_${suffixCount}`;
                    suffixCount++;
                  } while (usedHeaders.has(newHeader));
                  usedHeaders.add(newHeader);
                  result[i2] = newHeader;
                  headerCount[header]++;
                  duplicateHeaders = true;
                  if (renamedHeaders === null) {
                    renamedHeaders = {};
                  }
                  renamedHeaders[newHeader] = header;
                }
                usedHeaders.add(header);
              }
              if (duplicateHeaders) {
                console.warn("Duplicate headers found and renamed.");
              }
              headerParsed = true;
            }
            return {
              data,
              errors,
              meta: {
                delimiter: delim,
                linebreak: newline,
                aborted,
                truncated: !!stopped,
                cursor: lastCursor + (baseIndex || 0),
                renamedHeaders
              }
            };
          }
          function doStep() {
            step(returnable());
            data = [];
            errors = [];
          }
        };
        this.abort = function() {
          aborted = true;
        };
        this.getCharIndex = function() {
          return cursor;
        };
      }
      function newWorker() {
        if (!Papa2.WORKERS_SUPPORTED)
          return false;
        var workerUrl = getWorkerBlob();
        var w = new global.Worker(workerUrl);
        w.onmessage = mainThreadReceivedMessage;
        w.id = workerIdCounter++;
        workers[w.id] = w;
        return w;
      }
      function mainThreadReceivedMessage(e) {
        var msg = e.data;
        var worker = workers[msg.workerId];
        var aborted = false;
        if (msg.error)
          worker.userError(msg.error, msg.file);
        else if (msg.results && msg.results.data) {
          var abort = function() {
            aborted = true;
            completeWorker(msg.workerId, { data: [], errors: [], meta: { aborted: true } });
          };
          var handle = {
            abort,
            pause: notImplemented,
            resume: notImplemented
          };
          if (isFunction(worker.userStep)) {
            for (var i = 0; i < msg.results.data.length; i++) {
              worker.userStep({
                data: msg.results.data[i],
                errors: msg.results.errors,
                meta: msg.results.meta
              }, handle);
              if (aborted)
                break;
            }
            delete msg.results;
          } else if (isFunction(worker.userChunk)) {
            worker.userChunk(msg.results, handle, msg.file);
            delete msg.results;
          }
        }
        if (msg.finished && !aborted)
          completeWorker(msg.workerId, msg.results);
      }
      function completeWorker(workerId, results) {
        var worker = workers[workerId];
        if (isFunction(worker.userComplete))
          worker.userComplete(results);
        worker.terminate();
        delete workers[workerId];
      }
      function notImplemented() {
        throw new Error("Not implemented.");
      }
      function workerThreadReceivedMessage(e) {
        var msg = e.data;
        if (typeof Papa2.WORKER_ID === "undefined" && msg)
          Papa2.WORKER_ID = msg.workerId;
        if (typeof msg.input === "string") {
          global.postMessage({
            workerId: Papa2.WORKER_ID,
            results: Papa2.parse(msg.input, msg.config),
            finished: true
          });
        } else if (global.File && msg.input instanceof File || msg.input instanceof Object) {
          var results = Papa2.parse(msg.input, msg.config);
          if (results)
            global.postMessage({
              workerId: Papa2.WORKER_ID,
              results,
              finished: true
            });
        }
      }
      function copy(obj) {
        if (typeof obj !== "object" || obj === null)
          return obj;
        var cpy = Array.isArray(obj) ? [] : {};
        for (var key in obj)
          cpy[key] = copy(obj[key]);
        return cpy;
      }
      function bindFunction(f, self2) {
        return function() {
          f.apply(self2, arguments);
        };
      }
      function isFunction(func) {
        return typeof func === "function";
      }
      return Papa2;
    });
  }
});

// node_modules/parsimmon/src/parsimmon.js
var require_parsimmon = __commonJS({
  "node_modules/parsimmon/src/parsimmon.js"(exports, module) {
    "use strict";
    function Parsimmon(action) {
      if (!(this instanceof Parsimmon)) {
        return new Parsimmon(action);
      }
      this._ = action;
    }
    var _ = Parsimmon.prototype;
    function times(n, f) {
      var i = 0;
      for (i; i < n; i++) {
        f(i);
      }
    }
    function forEach(f, arr) {
      times(arr.length, function(i) {
        f(arr[i], i, arr);
      });
    }
    function reduce(f, seed, arr) {
      forEach(function(elem, i, arr2) {
        seed = f(seed, elem, i, arr2);
      }, arr);
      return seed;
    }
    function map(f, arr) {
      return reduce(
        function(acc, elem, i, a) {
          return acc.concat([f(elem, i, a)]);
        },
        [],
        arr
      );
    }
    function lshiftBuffer(input) {
      var asTwoBytes = reduce(
        function(a, v, i, b) {
          return a.concat(
            i === b.length - 1 ? Buffer.from([v, 0]).readUInt16BE(0) : b.readUInt16BE(i)
          );
        },
        [],
        input
      );
      return Buffer.from(
        map(function(x) {
          return (x << 1 & 65535) >> 8;
        }, asTwoBytes)
      );
    }
    function consumeBitsFromBuffer(n, input) {
      var state = { v: 0, buf: input };
      times(n, function() {
        state = {
          v: state.v << 1 | bitPeekBuffer(state.buf),
          buf: lshiftBuffer(state.buf)
        };
      });
      return state;
    }
    function bitPeekBuffer(input) {
      return input[0] >> 7;
    }
    function sum(numArr) {
      return reduce(
        function(x, y) {
          return x + y;
        },
        0,
        numArr
      );
    }
    function find(pred, arr) {
      return reduce(
        function(found, elem) {
          return found || (pred(elem) ? elem : found);
        },
        null,
        arr
      );
    }
    function bufferExists() {
      return typeof Buffer !== "undefined";
    }
    function setExists() {
      if (Parsimmon._supportsSet !== void 0) {
        return Parsimmon._supportsSet;
      }
      var exists = typeof Set !== "undefined";
      Parsimmon._supportsSet = exists;
      return exists;
    }
    function ensureBuffer() {
      if (!bufferExists()) {
        throw new Error(
          "Buffer global does not exist; please use webpack if you need to parse Buffers in the browser."
        );
      }
    }
    function bitSeq(alignments) {
      ensureBuffer();
      var totalBits = sum(alignments);
      if (totalBits % 8 !== 0) {
        throw new Error(
          "The bits [" + alignments.join(", ") + "] add up to " + totalBits + " which is not an even number of bytes; the total should be divisible by 8"
        );
      }
      var bytes = totalBits / 8;
      var tooBigRange = find(function(x) {
        return x > 48;
      }, alignments);
      if (tooBigRange) {
        throw new Error(
          tooBigRange + " bit range requested exceeds 48 bit (6 byte) Number max."
        );
      }
      return new Parsimmon(function(input, i) {
        var newPos = bytes + i;
        if (newPos > input.length) {
          return makeFailure(i, bytes.toString() + " bytes");
        }
        return makeSuccess(
          newPos,
          reduce(
            function(acc, bits) {
              var state = consumeBitsFromBuffer(bits, acc.buf);
              return {
                coll: acc.coll.concat(state.v),
                buf: state.buf
              };
            },
            { coll: [], buf: input.slice(i, newPos) },
            alignments
          ).coll
        );
      });
    }
    function bitSeqObj(namedAlignments) {
      ensureBuffer();
      var seenKeys = {};
      var totalKeys = 0;
      var fullAlignments = map(function(item) {
        if (isArray(item)) {
          var pair = item;
          if (pair.length !== 2) {
            throw new Error(
              "[" + pair.join(", ") + "] should be length 2, got length " + pair.length
            );
          }
          assertString(pair[0]);
          assertNumber(pair[1]);
          if (Object.prototype.hasOwnProperty.call(seenKeys, pair[0])) {
            throw new Error("duplicate key in bitSeqObj: " + pair[0]);
          }
          seenKeys[pair[0]] = true;
          totalKeys++;
          return pair;
        } else {
          assertNumber(item);
          return [null, item];
        }
      }, namedAlignments);
      if (totalKeys < 1) {
        throw new Error(
          "bitSeqObj expects at least one named pair, got [" + namedAlignments.join(", ") + "]"
        );
      }
      var namesOnly = map(function(pair) {
        return pair[0];
      }, fullAlignments);
      var alignmentsOnly = map(function(pair) {
        return pair[1];
      }, fullAlignments);
      return bitSeq(alignmentsOnly).map(function(parsed) {
        var namedParsed = map(function(name, i) {
          return [name, parsed[i]];
        }, namesOnly);
        return reduce(
          function(obj, kv) {
            if (kv[0] !== null) {
              obj[kv[0]] = kv[1];
            }
            return obj;
          },
          {},
          namedParsed
        );
      });
    }
    function parseBufferFor(other, length) {
      return new Parsimmon(function(input, i) {
        ensureBuffer();
        if (i + length > input.length) {
          return makeFailure(i, length + " bytes for " + other);
        }
        return makeSuccess(i + length, input.slice(i, i + length));
      });
    }
    function parseBuffer(length) {
      return parseBufferFor("buffer", length).map(function(unsafe) {
        return Buffer.from(unsafe);
      });
    }
    function encodedString(encoding, length) {
      return parseBufferFor("string", length).map(function(buff) {
        return buff.toString(encoding);
      });
    }
    function isInteger(value) {
      return typeof value === "number" && Math.floor(value) === value;
    }
    function assertValidIntegerByteLengthFor(who, length) {
      if (!isInteger(length) || length < 0 || length > 6) {
        throw new Error(who + " requires integer length in range [0, 6].");
      }
    }
    function uintBE(length) {
      assertValidIntegerByteLengthFor("uintBE", length);
      return parseBufferFor("uintBE(" + length + ")", length).map(function(buff) {
        return buff.readUIntBE(0, length);
      });
    }
    function uintLE(length) {
      assertValidIntegerByteLengthFor("uintLE", length);
      return parseBufferFor("uintLE(" + length + ")", length).map(function(buff) {
        return buff.readUIntLE(0, length);
      });
    }
    function intBE(length) {
      assertValidIntegerByteLengthFor("intBE", length);
      return parseBufferFor("intBE(" + length + ")", length).map(function(buff) {
        return buff.readIntBE(0, length);
      });
    }
    function intLE(length) {
      assertValidIntegerByteLengthFor("intLE", length);
      return parseBufferFor("intLE(" + length + ")", length).map(function(buff) {
        return buff.readIntLE(0, length);
      });
    }
    function floatBE() {
      return parseBufferFor("floatBE", 4).map(function(buff) {
        return buff.readFloatBE(0);
      });
    }
    function floatLE() {
      return parseBufferFor("floatLE", 4).map(function(buff) {
        return buff.readFloatLE(0);
      });
    }
    function doubleBE() {
      return parseBufferFor("doubleBE", 8).map(function(buff) {
        return buff.readDoubleBE(0);
      });
    }
    function doubleLE() {
      return parseBufferFor("doubleLE", 8).map(function(buff) {
        return buff.readDoubleLE(0);
      });
    }
    function toArray(arrLike) {
      return Array.prototype.slice.call(arrLike);
    }
    function isParser(obj) {
      return obj instanceof Parsimmon;
    }
    function isArray(x) {
      return {}.toString.call(x) === "[object Array]";
    }
    function isBuffer(x) {
      return bufferExists() && Buffer.isBuffer(x);
    }
    function makeSuccess(index2, value) {
      return {
        status: true,
        index: index2,
        value,
        furthest: -1,
        expected: []
      };
    }
    function makeFailure(index2, expected) {
      if (!isArray(expected)) {
        expected = [expected];
      }
      return {
        status: false,
        index: -1,
        value: null,
        furthest: index2,
        expected
      };
    }
    function mergeReplies(result, last) {
      if (!last) {
        return result;
      }
      if (result.furthest > last.furthest) {
        return result;
      }
      var expected = result.furthest === last.furthest ? union(result.expected, last.expected) : last.expected;
      return {
        status: result.status,
        index: result.index,
        value: result.value,
        furthest: last.furthest,
        expected
      };
    }
    var lineColumnIndex = {};
    function makeLineColumnIndex(input, i) {
      if (isBuffer(input)) {
        return {
          offset: i,
          line: -1,
          column: -1
        };
      }
      if (!(input in lineColumnIndex)) {
        lineColumnIndex[input] = {};
      }
      var inputIndex = lineColumnIndex[input];
      var prevLine = 0;
      var newLines = 0;
      var lineStart = 0;
      var j = i;
      while (j >= 0) {
        if (j in inputIndex) {
          prevLine = inputIndex[j].line;
          if (lineStart === 0) {
            lineStart = inputIndex[j].lineStart;
          }
          break;
        }
        if (
          // Unix LF (\n) or Windows CRLF (\r\n) line ending
          input.charAt(j) === "\n" || // Old Mac CR (\r) line ending
          input.charAt(j) === "\r" && input.charAt(j + 1) !== "\n"
        ) {
          newLines++;
          if (lineStart === 0) {
            lineStart = j + 1;
          }
        }
        j--;
      }
      var lineWeAreUpTo = prevLine + newLines;
      var columnWeAreUpTo = i - lineStart;
      inputIndex[i] = { line: lineWeAreUpTo, lineStart };
      return {
        offset: i,
        line: lineWeAreUpTo + 1,
        column: columnWeAreUpTo + 1
      };
    }
    function union(xs, ys) {
      if (setExists() && Array.from) {
        var set = new Set(xs);
        for (var y = 0; y < ys.length; y++) {
          set.add(ys[y]);
        }
        var arr = Array.from(set);
        arr.sort();
        return arr;
      }
      var obj = {};
      for (var i = 0; i < xs.length; i++) {
        obj[xs[i]] = true;
      }
      for (var j = 0; j < ys.length; j++) {
        obj[ys[j]] = true;
      }
      var keys = [];
      for (var k in obj) {
        if ({}.hasOwnProperty.call(obj, k)) {
          keys.push(k);
        }
      }
      keys.sort();
      return keys;
    }
    function assertParser(p) {
      if (!isParser(p)) {
        throw new Error("not a parser: " + p);
      }
    }
    function get(input, i) {
      if (typeof input === "string") {
        return input.charAt(i);
      }
      return input[i];
    }
    function assertArray(x) {
      if (!isArray(x)) {
        throw new Error("not an array: " + x);
      }
    }
    function assertNumber(x) {
      if (typeof x !== "number") {
        throw new Error("not a number: " + x);
      }
    }
    function assertRegexp(x) {
      if (!(x instanceof RegExp)) {
        throw new Error("not a regexp: " + x);
      }
      var f = flags(x);
      for (var i = 0; i < f.length; i++) {
        var c = f.charAt(i);
        if (c !== "i" && c !== "m" && c !== "u" && c !== "s") {
          throw new Error('unsupported regexp flag "' + c + '": ' + x);
        }
      }
    }
    function assertFunction(x) {
      if (typeof x !== "function") {
        throw new Error("not a function: " + x);
      }
    }
    function assertString(x) {
      if (typeof x !== "string") {
        throw new Error("not a string: " + x);
      }
    }
    var linesBeforeStringError = 2;
    var linesAfterStringError = 3;
    var bytesPerLine = 8;
    var bytesBefore = bytesPerLine * 5;
    var bytesAfter = bytesPerLine * 4;
    var defaultLinePrefix = "  ";
    function repeat(string3, amount) {
      return new Array(amount + 1).join(string3);
    }
    function formatExpected(expected) {
      if (expected.length === 1) {
        return "Expected:\n\n" + expected[0];
      }
      return "Expected one of the following: \n\n" + expected.join(", ");
    }
    function leftPad(str, pad, char2) {
      var add = pad - str.length;
      if (add <= 0) {
        return str;
      }
      return repeat(char2, add) + str;
    }
    function toChunks(arr, chunkSize) {
      var length = arr.length;
      var chunks = [];
      var chunkIndex = 0;
      if (length <= chunkSize) {
        return [arr.slice()];
      }
      for (var i = 0; i < length; i++) {
        if (!chunks[chunkIndex]) {
          chunks.push([]);
        }
        chunks[chunkIndex].push(arr[i]);
        if ((i + 1) % chunkSize === 0) {
          chunkIndex++;
        }
      }
      return chunks;
    }
    function rangeFromIndexAndOffsets(i, before, after, length) {
      return {
        // Guard against the negative upper bound for lines included in the output.
        from: i - before > 0 ? i - before : 0,
        to: i + after > length ? length : i + after
      };
    }
    function byteRangeToRange(byteRange) {
      if (byteRange.from === 0 && byteRange.to === 1) {
        return {
          from: byteRange.from,
          to: byteRange.to
        };
      }
      return {
        from: byteRange.from / bytesPerLine,
        // Round `to`, so we don't get float if the amount of bytes is not divisible by `bytesPerLine`
        to: Math.floor(byteRange.to / bytesPerLine)
      };
    }
    function formatGot(input, error) {
      var index2 = error.index;
      var i = index2.offset;
      var verticalMarkerLength = 1;
      var column;
      var lineWithErrorIndex;
      var lines;
      var lineRange;
      var lastLineNumberLabelLength;
      if (i === input.length) {
        return "Got the end of the input";
      }
      if (isBuffer(input)) {
        var byteLineWithErrorIndex = i - i % bytesPerLine;
        var columnByteIndex = i - byteLineWithErrorIndex;
        var byteRange = rangeFromIndexAndOffsets(
          byteLineWithErrorIndex,
          bytesBefore,
          bytesAfter + bytesPerLine,
          input.length
        );
        var bytes = input.slice(byteRange.from, byteRange.to);
        var bytesInChunks = toChunks(bytes.toJSON().data, bytesPerLine);
        var byteLines = map(function(byteRow) {
          return map(function(byteValue) {
            return leftPad(byteValue.toString(16), 2, "0");
          }, byteRow);
        }, bytesInChunks);
        lineRange = byteRangeToRange(byteRange);
        lineWithErrorIndex = byteLineWithErrorIndex / bytesPerLine;
        column = columnByteIndex * 3;
        if (columnByteIndex >= 4) {
          column += 1;
        }
        verticalMarkerLength = 2;
        lines = map(function(byteLine) {
          return byteLine.length <= 4 ? byteLine.join(" ") : byteLine.slice(0, 4).join(" ") + "  " + byteLine.slice(4).join(" ");
        }, byteLines);
        lastLineNumberLabelLength = ((lineRange.to > 0 ? lineRange.to - 1 : lineRange.to) * 8).toString(16).length;
        if (lastLineNumberLabelLength < 2) {
          lastLineNumberLabelLength = 2;
        }
      } else {
        var inputLines = input.split(/\r\n|[\n\r\u2028\u2029]/);
        column = index2.column - 1;
        lineWithErrorIndex = index2.line - 1;
        lineRange = rangeFromIndexAndOffsets(
          lineWithErrorIndex,
          linesBeforeStringError,
          linesAfterStringError,
          inputLines.length
        );
        lines = inputLines.slice(lineRange.from, lineRange.to);
        lastLineNumberLabelLength = lineRange.to.toString().length;
      }
      var lineWithErrorCurrentIndex = lineWithErrorIndex - lineRange.from;
      if (isBuffer(input)) {
        lastLineNumberLabelLength = ((lineRange.to > 0 ? lineRange.to - 1 : lineRange.to) * 8).toString(16).length;
        if (lastLineNumberLabelLength < 2) {
          lastLineNumberLabelLength = 2;
        }
      }
      var linesWithLineNumbers = reduce(
        function(acc, lineSource, index3) {
          var isLineWithError = index3 === lineWithErrorCurrentIndex;
          var prefix = isLineWithError ? "> " : defaultLinePrefix;
          var lineNumberLabel;
          if (isBuffer(input)) {
            lineNumberLabel = leftPad(
              ((lineRange.from + index3) * 8).toString(16),
              lastLineNumberLabelLength,
              "0"
            );
          } else {
            lineNumberLabel = leftPad(
              (lineRange.from + index3 + 1).toString(),
              lastLineNumberLabelLength,
              " "
            );
          }
          return [].concat(
            acc,
            [prefix + lineNumberLabel + " | " + lineSource],
            isLineWithError ? [
              defaultLinePrefix + repeat(" ", lastLineNumberLabelLength) + " | " + leftPad("", column, " ") + repeat("^", verticalMarkerLength)
            ] : []
          );
        },
        [],
        lines
      );
      return linesWithLineNumbers.join("\n");
    }
    function formatError(input, error) {
      return [
        "\n",
        "-- PARSING FAILED " + repeat("-", 50),
        "\n\n",
        formatGot(input, error),
        "\n\n",
        formatExpected(error.expected),
        "\n"
      ].join("");
    }
    function flags(re) {
      if (re.flags !== void 0) {
        return re.flags;
      }
      return [
        re.global ? "g" : "",
        re.ignoreCase ? "i" : "",
        re.multiline ? "m" : "",
        re.unicode ? "u" : "",
        re.sticky ? "y" : ""
      ].join("");
    }
    function anchoredRegexp(re) {
      return RegExp("^(?:" + re.source + ")", flags(re));
    }
    function seq() {
      var parsers = [].slice.call(arguments);
      var numParsers = parsers.length;
      for (var j = 0; j < numParsers; j += 1) {
        assertParser(parsers[j]);
      }
      return Parsimmon(function(input, i) {
        var result;
        var accum = new Array(numParsers);
        for (var j2 = 0; j2 < numParsers; j2 += 1) {
          result = mergeReplies(parsers[j2]._(input, i), result);
          if (!result.status) {
            return result;
          }
          accum[j2] = result.value;
          i = result.index;
        }
        return mergeReplies(makeSuccess(i, accum), result);
      });
    }
    function seqObj() {
      var seenKeys = {};
      var totalKeys = 0;
      var parsers = toArray(arguments);
      var numParsers = parsers.length;
      for (var j = 0; j < numParsers; j += 1) {
        var p = parsers[j];
        if (isParser(p)) {
          continue;
        }
        if (isArray(p)) {
          var isWellFormed = p.length === 2 && typeof p[0] === "string" && isParser(p[1]);
          if (isWellFormed) {
            var key = p[0];
            if (Object.prototype.hasOwnProperty.call(seenKeys, key)) {
              throw new Error("seqObj: duplicate key " + key);
            }
            seenKeys[key] = true;
            totalKeys++;
            continue;
          }
        }
        throw new Error(
          "seqObj arguments must be parsers or [string, parser] array pairs."
        );
      }
      if (totalKeys === 0) {
        throw new Error("seqObj expects at least one named parser, found zero");
      }
      return Parsimmon(function(input, i) {
        var result;
        var accum = {};
        for (var j2 = 0; j2 < numParsers; j2 += 1) {
          var name;
          var parser3;
          if (isArray(parsers[j2])) {
            name = parsers[j2][0];
            parser3 = parsers[j2][1];
          } else {
            name = null;
            parser3 = parsers[j2];
          }
          result = mergeReplies(parser3._(input, i), result);
          if (!result.status) {
            return result;
          }
          if (name) {
            accum[name] = result.value;
          }
          i = result.index;
        }
        return mergeReplies(makeSuccess(i, accum), result);
      });
    }
    function seqMap() {
      var args = [].slice.call(arguments);
      if (args.length === 0) {
        throw new Error("seqMap needs at least one argument");
      }
      var mapper = args.pop();
      assertFunction(mapper);
      return seq.apply(null, args).map(function(results) {
        return mapper.apply(null, results);
      });
    }
    function createLanguage(parsers) {
      var language2 = {};
      for (var key in parsers) {
        if ({}.hasOwnProperty.call(parsers, key)) {
          (function(key2) {
            var func = function() {
              return parsers[key2](language2);
            };
            language2[key2] = lazy(func);
          })(key);
        }
      }
      return language2;
    }
    function alt2() {
      var parsers = [].slice.call(arguments);
      var numParsers = parsers.length;
      if (numParsers === 0) {
        return fail("zero alternates");
      }
      for (var j = 0; j < numParsers; j += 1) {
        assertParser(parsers[j]);
      }
      return Parsimmon(function(input, i) {
        var result;
        for (var j2 = 0; j2 < parsers.length; j2 += 1) {
          result = mergeReplies(parsers[j2]._(input, i), result);
          if (result.status) {
            return result;
          }
        }
        return result;
      });
    }
    function sepBy(parser3, separator) {
      return sepBy12(parser3, separator).or(succeed([]));
    }
    function sepBy12(parser3, separator) {
      assertParser(parser3);
      assertParser(separator);
      var pairs = separator.then(parser3).many();
      return seqMap(parser3, pairs, function(r, rs) {
        return [r].concat(rs);
      });
    }
    _.parse = function(input) {
      if (typeof input !== "string" && !isBuffer(input)) {
        throw new Error(
          ".parse must be called with a string or Buffer as its argument"
        );
      }
      var parseResult = this.skip(eof)._(input, 0);
      var result;
      if (parseResult.status) {
        result = {
          status: true,
          value: parseResult.value
        };
      } else {
        result = {
          status: false,
          index: makeLineColumnIndex(input, parseResult.furthest),
          expected: parseResult.expected
        };
      }
      delete lineColumnIndex[input];
      return result;
    };
    _.tryParse = function(str) {
      var result = this.parse(str);
      if (result.status) {
        return result.value;
      } else {
        var msg = formatError(str, result);
        var err = new Error(msg);
        err.type = "ParsimmonError";
        err.result = result;
        throw err;
      }
    };
    _.assert = function(condition, errorMessage) {
      return this.chain(function(value) {
        return condition(value) ? succeed(value) : fail(errorMessage);
      });
    };
    _.or = function(alternative) {
      return alt2(this, alternative);
    };
    _.trim = function(parser3) {
      return this.wrap(parser3, parser3);
    };
    _.wrap = function(leftParser, rightParser) {
      return seqMap(leftParser, this, rightParser, function(left, middle) {
        return middle;
      });
    };
    _.thru = function(wrapper) {
      return wrapper(this);
    };
    _.then = function(next) {
      assertParser(next);
      return seq(this, next).map(function(results) {
        return results[1];
      });
    };
    _.many = function() {
      var self2 = this;
      return Parsimmon(function(input, i) {
        var accum = [];
        var result = void 0;
        for (; ; ) {
          result = mergeReplies(self2._(input, i), result);
          if (result.status) {
            if (i === result.index) {
              throw new Error(
                "infinite loop detected in .many() parser --- calling .many() on a parser which can accept zero characters is usually the cause"
              );
            }
            i = result.index;
            accum.push(result.value);
          } else {
            return mergeReplies(makeSuccess(i, accum), result);
          }
        }
      });
    };
    _.tieWith = function(separator) {
      assertString(separator);
      return this.map(function(args) {
        assertArray(args);
        if (args.length) {
          assertString(args[0]);
          var s = args[0];
          for (var i = 1; i < args.length; i++) {
            assertString(args[i]);
            s += separator + args[i];
          }
          return s;
        } else {
          return "";
        }
      });
    };
    _.tie = function() {
      return this.tieWith("");
    };
    _.times = function(min2, max2) {
      var self2 = this;
      if (arguments.length < 2) {
        max2 = min2;
      }
      assertNumber(min2);
      assertNumber(max2);
      return Parsimmon(function(input, i) {
        var accum = [];
        var result = void 0;
        var prevResult = void 0;
        for (var times2 = 0; times2 < min2; times2 += 1) {
          result = self2._(input, i);
          prevResult = mergeReplies(result, prevResult);
          if (result.status) {
            i = result.index;
            accum.push(result.value);
          } else {
            return prevResult;
          }
        }
        for (; times2 < max2; times2 += 1) {
          result = self2._(input, i);
          prevResult = mergeReplies(result, prevResult);
          if (result.status) {
            i = result.index;
            accum.push(result.value);
          } else {
            break;
          }
        }
        return mergeReplies(makeSuccess(i, accum), prevResult);
      });
    };
    _.result = function(res) {
      return this.map(function() {
        return res;
      });
    };
    _.atMost = function(n) {
      return this.times(0, n);
    };
    _.atLeast = function(n) {
      return seqMap(this.times(n), this.many(), function(init, rest) {
        return init.concat(rest);
      });
    };
    _.map = function(fn) {
      assertFunction(fn);
      var self2 = this;
      return Parsimmon(function(input, i) {
        var result = self2._(input, i);
        if (!result.status) {
          return result;
        }
        return mergeReplies(makeSuccess(result.index, fn(result.value)), result);
      });
    };
    _.contramap = function(fn) {
      assertFunction(fn);
      var self2 = this;
      return Parsimmon(function(input, i) {
        var result = self2.parse(fn(input.slice(i)));
        if (!result.status) {
          return result;
        }
        return makeSuccess(i + input.length, result.value);
      });
    };
    _.promap = function(f, g) {
      assertFunction(f);
      assertFunction(g);
      return this.contramap(f).map(g);
    };
    _.skip = function(next) {
      return seq(this, next).map(function(results) {
        return results[0];
      });
    };
    _.mark = function() {
      return seqMap(index, this, index, function(start, value, end2) {
        return {
          start,
          value,
          end: end2
        };
      });
    };
    _.node = function(name) {
      return seqMap(index, this, index, function(start, value, end2) {
        return {
          name,
          value,
          start,
          end: end2
        };
      });
    };
    _.sepBy = function(separator) {
      return sepBy(this, separator);
    };
    _.sepBy1 = function(separator) {
      return sepBy12(this, separator);
    };
    _.lookahead = function(x) {
      return this.skip(lookahead(x));
    };
    _.notFollowedBy = function(x) {
      return this.skip(notFollowedBy(x));
    };
    _.desc = function(expected) {
      if (!isArray(expected)) {
        expected = [expected];
      }
      var self2 = this;
      return Parsimmon(function(input, i) {
        var reply = self2._(input, i);
        if (!reply.status) {
          reply.expected = expected;
        }
        return reply;
      });
    };
    _.fallback = function(result) {
      return this.or(succeed(result));
    };
    _.ap = function(other) {
      return seqMap(other, this, function(f, x) {
        return f(x);
      });
    };
    _.chain = function(f) {
      var self2 = this;
      return Parsimmon(function(input, i) {
        var result = self2._(input, i);
        if (!result.status) {
          return result;
        }
        var nextParser = f(result.value);
        return mergeReplies(nextParser._(input, result.index), result);
      });
    };
    function string2(str) {
      assertString(str);
      var expected = "'" + str + "'";
      return Parsimmon(function(input, i) {
        var j = i + str.length;
        var head = input.slice(i, j);
        if (head === str) {
          return makeSuccess(j, head);
        } else {
          return makeFailure(i, expected);
        }
      });
    }
    function byte(b) {
      ensureBuffer();
      assertNumber(b);
      if (b > 255) {
        throw new Error(
          "Value specified to byte constructor (" + b + "=0x" + b.toString(16) + ") is larger in value than a single byte."
        );
      }
      var expected = (b > 15 ? "0x" : "0x0") + b.toString(16);
      return Parsimmon(function(input, i) {
        var head = get(input, i);
        if (head === b) {
          return makeSuccess(i + 1, head);
        } else {
          return makeFailure(i, expected);
        }
      });
    }
    function regexp(re, group) {
      assertRegexp(re);
      if (arguments.length >= 2) {
        assertNumber(group);
      } else {
        group = 0;
      }
      var anchored = anchoredRegexp(re);
      var expected = "" + re;
      return Parsimmon(function(input, i) {
        var match2 = anchored.exec(input.slice(i));
        if (match2) {
          if (0 <= group && group <= match2.length) {
            var fullMatch = match2[0];
            var groupMatch2 = match2[group];
            return makeSuccess(i + fullMatch.length, groupMatch2);
          }
          var message = "valid match group (0 to " + match2.length + ") in " + expected;
          return makeFailure(i, message);
        }
        return makeFailure(i, expected);
      });
    }
    function succeed(value) {
      return Parsimmon(function(input, i) {
        return makeSuccess(i, value);
      });
    }
    function fail(expected) {
      return Parsimmon(function(input, i) {
        return makeFailure(i, expected);
      });
    }
    function lookahead(x) {
      if (isParser(x)) {
        return Parsimmon(function(input, i) {
          var result = x._(input, i);
          result.index = i;
          result.value = "";
          return result;
        });
      } else if (typeof x === "string") {
        return lookahead(string2(x));
      } else if (x instanceof RegExp) {
        return lookahead(regexp(x));
      }
      throw new Error("not a string, regexp, or parser: " + x);
    }
    function notFollowedBy(parser3) {
      assertParser(parser3);
      return Parsimmon(function(input, i) {
        var result = parser3._(input, i);
        var text = input.slice(i, result.index);
        return result.status ? makeFailure(i, 'not "' + text + '"') : makeSuccess(i, null);
      });
    }
    function test(predicate) {
      assertFunction(predicate);
      return Parsimmon(function(input, i) {
        var char2 = get(input, i);
        if (i < input.length && predicate(char2)) {
          return makeSuccess(i + 1, char2);
        } else {
          return makeFailure(i, "a character/byte matching " + predicate);
        }
      });
    }
    function oneOf(str) {
      var expected = str.split("");
      for (var idx = 0; idx < expected.length; idx++) {
        expected[idx] = "'" + expected[idx] + "'";
      }
      return test(function(ch) {
        return str.indexOf(ch) >= 0;
      }).desc(expected);
    }
    function noneOf(str) {
      return test(function(ch) {
        return str.indexOf(ch) < 0;
      }).desc("none of '" + str + "'");
    }
    function custom(parsingFunction) {
      return Parsimmon(parsingFunction(makeSuccess, makeFailure));
    }
    function range(begin, end2) {
      return test(function(ch) {
        return begin <= ch && ch <= end2;
      }).desc(begin + "-" + end2);
    }
    function takeWhile(predicate) {
      assertFunction(predicate);
      return Parsimmon(function(input, i) {
        var j = i;
        while (j < input.length && predicate(get(input, j))) {
          j++;
        }
        return makeSuccess(j, input.slice(i, j));
      });
    }
    function lazy(desc, f) {
      if (arguments.length < 2) {
        f = desc;
        desc = void 0;
      }
      var parser3 = Parsimmon(function(input, i) {
        parser3._ = f()._;
        return parser3._(input, i);
      });
      if (desc) {
        return parser3.desc(desc);
      } else {
        return parser3;
      }
    }
    function empty() {
      return fail("fantasy-land/empty");
    }
    _.concat = _.or;
    _.empty = empty;
    _.of = succeed;
    _["fantasy-land/ap"] = _.ap;
    _["fantasy-land/chain"] = _.chain;
    _["fantasy-land/concat"] = _.concat;
    _["fantasy-land/empty"] = _.empty;
    _["fantasy-land/of"] = _.of;
    _["fantasy-land/map"] = _.map;
    var index = Parsimmon(function(input, i) {
      return makeSuccess(i, makeLineColumnIndex(input, i));
    });
    var any = Parsimmon(function(input, i) {
      if (i >= input.length) {
        return makeFailure(i, "any character/byte");
      }
      return makeSuccess(i + 1, get(input, i));
    });
    var all = Parsimmon(function(input, i) {
      return makeSuccess(input.length, input.slice(i));
    });
    var eof = Parsimmon(function(input, i) {
      if (i < input.length) {
        return makeFailure(i, "EOF");
      }
      return makeSuccess(i, null);
    });
    var digit = regexp(/[0-9]/).desc("a digit");
    var digits = regexp(/[0-9]*/).desc("optional digits");
    var letter = regexp(/[a-z]/i).desc("a letter");
    var letters = regexp(/[a-z]*/i).desc("optional letters");
    var optWhitespace = regexp(/\s*/).desc("optional whitespace");
    var whitespace = regexp(/\s+/).desc("whitespace");
    var cr = string2("\r");
    var lf = string2("\n");
    var crlf = string2("\r\n");
    var newline = alt2(crlf, lf, cr).desc("newline");
    var end = alt2(newline, eof);
    Parsimmon.all = all;
    Parsimmon.alt = alt2;
    Parsimmon.any = any;
    Parsimmon.cr = cr;
    Parsimmon.createLanguage = createLanguage;
    Parsimmon.crlf = crlf;
    Parsimmon.custom = custom;
    Parsimmon.digit = digit;
    Parsimmon.digits = digits;
    Parsimmon.empty = empty;
    Parsimmon.end = end;
    Parsimmon.eof = eof;
    Parsimmon.fail = fail;
    Parsimmon.formatError = formatError;
    Parsimmon.index = index;
    Parsimmon.isParser = isParser;
    Parsimmon.lazy = lazy;
    Parsimmon.letter = letter;
    Parsimmon.letters = letters;
    Parsimmon.lf = lf;
    Parsimmon.lookahead = lookahead;
    Parsimmon.makeFailure = makeFailure;
    Parsimmon.makeSuccess = makeSuccess;
    Parsimmon.newline = newline;
    Parsimmon.noneOf = noneOf;
    Parsimmon.notFollowedBy = notFollowedBy;
    Parsimmon.of = succeed;
    Parsimmon.oneOf = oneOf;
    Parsimmon.optWhitespace = optWhitespace;
    Parsimmon.Parser = Parsimmon;
    Parsimmon.range = range;
    Parsimmon.regex = regexp;
    Parsimmon.regexp = regexp;
    Parsimmon.sepBy = sepBy;
    Parsimmon.sepBy1 = sepBy12;
    Parsimmon.seq = seq;
    Parsimmon.seqMap = seqMap;
    Parsimmon.seqObj = seqObj;
    Parsimmon.string = string2;
    Parsimmon.succeed = succeed;
    Parsimmon.takeWhile = takeWhile;
    Parsimmon.test = test;
    Parsimmon.whitespace = whitespace;
    Parsimmon["fantasy-land/empty"] = empty;
    Parsimmon["fantasy-land/of"] = succeed;
    Parsimmon.Binary = {
      bitSeq,
      bitSeqObj,
      byte,
      buffer: parseBuffer,
      encodedString,
      uintBE,
      uint8BE: uintBE(1),
      uint16BE: uintBE(2),
      uint32BE: uintBE(4),
      uintLE,
      uint8LE: uintLE(1),
      uint16LE: uintLE(2),
      uint32LE: uintLE(4),
      intBE,
      int8BE: intBE(1),
      int16BE: intBE(2),
      int32BE: intBE(4),
      intLE,
      int8LE: intLE(1),
      int16LE: intLE(2),
      int32LE: intLE(4),
      floatBE: floatBE(),
      floatLE: floatLE(),
      doubleBE: doubleBE(),
      doubleLE: doubleLE()
    };
    module.exports = Parsimmon;
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
var Papa = __toESM(require_papaparse());

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
var import_parsimmon14 = __toESM(require_parsimmon());

// ../../.my_agent_remote/undercrow__eraJS/build/property/order.js
var Order = class {
  order;
  constructor(order) {
    this.order = order;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/expr/variable.js
function resolveNameIndex(vm, name, key) {
  if (key === "")
    return key;
  const nameVar = vm.globalMap.get(name + "NAME");
  if (nameVar != null && Array.isArray(nameVar.value)) {
    const index = nameVar.value.indexOf(key);
    if (index >= 0)
      return BigInt(index);
  }
  const konst = vm.globalMap.get(key);
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
  getCell(vm) {
    return vm.getValue(this.name, this.scope);
  }
  async reduce(vm) {
    if (vm.macroMap.has(this.name)) {
      if (this.index.length !== 0) {
        throw new Error("Macro cannot be indexed");
      }
      const expr2 = vm.macroMap.get(this.name)?.expr;
      if (expr2 == null) {
        throw new Error("Empty macro cannot be referenced");
      }
      return expr2.reduce(vm);
    } else {
      return this.getCell(vm).get(vm, await this.reduceIndex(vm));
    }
  }
  async reduceIndex(vm) {
    if (this.index.length !== 0) {
      const result = [];
      for (const i of this.index) {
        let value = await i.reduce(vm);
        if (typeof value === "string") {
          value = resolveNameIndex(vm, this.name, value);
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
  async *run(vm, arg) {
    await vm.pushContext(this);
    for (let i = 0; i < this.arg.length; ++i) {
      const [argDest, argDef] = this.arg[i];
      const dest = argDest.getCell(vm);
      const index = await argDest.reduceIndex(vm);
      if (dest.type === "number") {
        let value;
        if (arg[i] != null) {
          value = arg[i];
        } else if (argDef != null) {
          if (argDef instanceof Variable) {
            value = await argDef.reduce(vm);
          } else {
            value = argDef;
          }
        } else {
          value = 0n;
        }
        bigint(value, "Value for number argument must be a number");
        dest.set(vm, value, index);
      } else {
        let value;
        if (arg[i] != null) {
          value = arg[i];
        } else if (argDef != null) {
          if (argDef instanceof Variable) {
            value = await argDef.reduce(vm);
          } else {
            value = argDef;
          }
        } else {
          value = "";
        }
        string(value, "Value for string argument must be a string");
        dest.set(vm, value, index);
      }
    }
    const result = yield* this.thunk.run(vm);
    vm.popContext();
    return result;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/index.js
var import_parsimmon6 = __toESM(require_parsimmon());

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
var import_parsimmon = __toESM(require_parsimmon());
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
var import_parsimmon3 = __toESM(require_parsimmon());

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
  async reduce(vm) {
    const left = await this.left.reduce(vm);
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
    const right = await this.right.reduce(vm);
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
  async reduce(vm) {
    let result = "";
    for (const expr2 of this.expr) {
      let value;
      if (typeof expr2.value === "string") {
        value = expr2.value;
      } else {
        const reduced = await expr2.value.reduce(vm);
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
        const display = await expr2.display.reduce(vm);
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
async function abs(vm, arg) {
  const value = await arg[0].reduce(vm);
  bigint(value, "1st argument of ABS must a be number");
  return value >= 0 ? value : -value;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/barstr.js
async function barStr(vm, arg) {
  const value = await arg[0].reduce(vm);
  bigint(value, "1st argument of BAR must be a number");
  const max2 = await arg[1].reduce(vm);
  bigint(max2, "2nd argument of BAR must be a number");
  const length = await arg[2].reduce(vm);
  bigint(length, "3rd argument of BAR must be a number");
  const safeLength = length < 0n ? 0n : length;
  let filled = max2 <= 0n ? 0n : safeLength * value / max2;
  if (filled < 0n) filled = 0n;
  if (filled > safeLength) filled = safeLength;
  return "[" + "*".repeat(Number(filled)) + ".".repeat(Number(safeLength - filled)) + "]";
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvabl.js
async function csvAbl(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVABL must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVABL must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.abl.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvbase.js
async function csvBase(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVBASE must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVBASE must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.base.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvcallname.js
async function csvCallname(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVCALLNAME must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.callname;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvcflag.js
async function csvCflag(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVCFLAG must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVCFLAG must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.cflag.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvcstr.js
async function csvCstr(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVCSTR must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVCSTR must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.cstr.get(Number(index)) ?? "";
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvequip.js
async function csvEquip(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVEQUIP must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVEQUIP must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.equip.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvexp.js
async function csvExp(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVEXP must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVEXP must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.exp.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvjuel.js
async function csvJuel(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVJUEL must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVJUEL must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.juel.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvmark.js
async function csvMark(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVMARK must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVMARK must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.mark.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvmastername.js
async function csvMastername(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVMASTERNAME must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.mastername;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvname.js
async function csvName(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVNAME must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.name;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvnickname.js
async function csvNickname(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVNICKNAME must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.nickname;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvrelation.js
async function csvRelation(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVRELATION must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVRELATION must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.relation.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/csvtalent.js
async function csvTalent(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of CSVTALENT must be an integer");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of CSVTALENT must be an integer");
  const character = vm.code.csv.character.get(Number(num));
  cond(character != null, `Character #${num} does not exist`);
  return character.talent.get(Number(index)) ?? 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/existcsv.js
async function existCsv(vm, arg) {
  const num = await arg[0].reduce(vm);
  bigint(num, "1st argument of EXISTCSV should be a number");
  return vm.templateMap.has(Number(num)) ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/findchara.js
async function findChara(vm, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of FINDCHARA should be a variable");
  const value = await arg[1].reduce(vm);
  const start = arg.length >= 3 ? await arg[2].reduce(vm) : 0n;
  bigint(start, "3rd argument of FINDCHARA should be a nmber");
  const end = arg.length >= 4 ? await arg[3].reduce(vm) : BigInt(vm.characterList.length);
  bigint(end, "4th argument of FINDCHARA should be a number");
  const index = await target.reduceIndex(vm);
  for (let i = start; i < end; ++i) {
    if (target.getCell(vm).get(vm, [Number(i), ...index]) === value) {
      return i;
    }
  }
  return -1n;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/findlastchara.js
async function findLastChara(vm, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of FINDLASTCHARA should be a variable");
  const value = await arg[1].reduce(vm);
  const start = arg.length >= 3 ? await arg[2].reduce(vm) : 0n;
  bigint(start, "3rd argument of FINDLASTCHARA should be a number");
  const end = arg.length >= 4 ? await arg[3].reduce(vm) : BigInt(vm.characterList.length);
  bigint(end, "4th argument of FINDLASTCHARA should be a number");
  const index = await target.reduceIndex(vm);
  for (let i = end - 1n; i >= start; --i) {
    if (target.getCell(vm).get(vm, [Number(i), ...index]) === value) {
      return i;
    }
  }
  return -1n;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getbgcolor.js
function getBgColor(vm, _arg) {
  return parseInt(vm.printer.background, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getbit.js
async function getBit(vm, arg) {
  const value = await arg[0].reduce(vm);
  bigint(value, "1st argument of GETBIT should be a number");
  const index = await arg[1].reduce(vm);
  bigint(index, "2nd argument of GETBIT should be a number");
  cond(index < 64, "2nd argument of GETBIT should be less than 64");
  return (value & 1n << index) !== 0n ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getchara.js
async function getChara(vm, arg) {
  const id = await arg[0].reduce(vm);
  bigint(id, "1st argument of GETCHARA should be an integer");
  for (let i = 0; i < vm.characterList.length; ++i) {
    if (vm.getValue("NO").get(vm, [i]) === id) {
      return i;
    }
  }
  return -1;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getcolor.js
function getColor(vm, _arg) {
  return parseInt(vm.printer.color, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getdefbgcolor.js
function getDefBgColor(vm, _arg) {
  return parseInt(vm.printer.defaultBackground, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getdefcolor.js
function getDefColor(vm, _arg) {
  return parseInt(vm.printer.defaultColor, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/getfocuscolor.js
function getFocusColor(vm, _arg) {
  return parseInt(vm.printer.focus, 16);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/groupmatch.js
async function groupMatch(vm, arg) {
  cond(arg.length > 0, "1st argument of GROUPMATCH must exist");
  const key = await arg[0].reduce(vm);
  const values = [];
  for (const a of arg.slice(1)) {
    values.push(await a.reduce(vm));
  }
  return values.reduce((acc, val) => acc + (val === key ? 1 : 0), 0);
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/inrange.js
async function inRange(vm, arg) {
  const value = await arg[0].reduce(vm);
  bigint(value, "1st argument of INRANGE should be a number");
  const min2 = await arg[1].reduce(vm);
  bigint(min2, "2nd argument of INRANGE should be a number");
  const max2 = await arg[2].reduce(vm);
  bigint(max2, "3rd argument of INRANGE should be a number");
  return min2 <= value && value <= max2 ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/limit.js
async function limit(vm, arg) {
  const value = await arg[0].reduce(vm);
  bigint(value, "1st argument of LIMIT must a be number");
  const min2 = await arg[1].reduce(vm);
  bigint(min2, "2nd argument of LIMIT must a be number");
  const max2 = await arg[2].reduce(vm);
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
function lineIsEmpty(vm, _arg) {
  return vm.printer.chunks.length === 0 ? 1 : 0;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/match.js
var LARGE_INT = 2n ** 60n;
async function match(vm, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of MATCH should be a variable");
  const value = await arg[1].reduce(vm);
  const start = arg.length >= 3 ? await arg[2].reduce(vm) : 0n;
  bigint(start, "3rd argument of MATCH should be a number");
  const end = arg.length >= 4 ? await arg[3].reduce(vm) : LARGE_INT;
  bigint(end, "4th argument of MATCH should be a number");
  const varSize2 = target.getCell(vm).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = 0;
  for (let i = start; i < realEnd; ++i) {
    if (target.getCell(vm).get(vm, [Number(i)]) === value) {
      result += 1;
    }
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/max.js
async function max(vm, arg) {
  cond(arg.length > 0, "MAX must have at least 1 argument");
  let result = 0n;
  for (let i = 0; i < arg.length; ++i) {
    const value = await arg[i].reduce(vm);
    bigint(value, `${i + 1}th argument of MAX should be a number`);
    result = result > value ? result : value;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/maxarray.js
var LARGE_INT2 = 2n ** 60n;
async function maxArray(vm, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of MAXARRAY should be a variable");
  cond(target.getCell(vm).type === "number", "1st argument of MAXARRAY should be a number variable");
  const start = arg.length >= 2 ? await arg[1].reduce(vm) : 0n;
  bigint(start, "2nd argument of MAXARRAY should be a number");
  const end = arg.length >= 3 ? await arg[2].reduce(vm) : LARGE_INT2;
  bigint(end, "3rd argument of MAXARRAY should be a number");
  const varSize2 = target.getCell(vm).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = 0n;
  for (let i = start; i < realEnd; ++i) {
    const value = target.getCell(vm).get(vm, [Number(i)]);
    result = result > value ? result : value;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/min.js
var LARGE_INT3 = 2n ** 60n;
async function min(vm, arg) {
  cond(arg.length > 0, "MIN must have at least 1 argument");
  let result = LARGE_INT3;
  for (let i = 0; i < arg.length; ++i) {
    const value = await arg[i].reduce(vm);
    bigint(value, `${i + 1}th argument of MIN must be a number`);
    result = result > value ? value : result;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/minarray.js
var LARGE_INT4 = 2n ** 60n;
async function minArray(vm, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of MINARRAY should be a variable");
  cond(target.getCell(vm).type === "number", "1st argument of MINARRAY should be a number variable");
  const start = arg.length >= 2 ? await arg[1].reduce(vm) : 0n;
  bigint(start, "2nd argument of MINARRAY should be a number");
  const end = arg.length >= 3 ? await arg[2].reduce(vm) : LARGE_INT4;
  bigint(end, "3rd argument of MINARRAY should be a number");
  const varSize2 = target.getCell(vm).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = LARGE_INT4;
  for (let i = start; i < realEnd; ++i) {
    const value = target.getCell(vm).get(vm, [Number(i)]);
    result = result > value ? value : result;
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/power.js
async function power(vm, arg) {
  const base = await arg[0].reduce(vm);
  bigint(base, "1st argument of POWER must be a number");
  const exponent = await arg[1].reduce(vm);
  bigint(exponent, "2nd argument of POWER must be a number");
  return base ** exponent;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/rand.js
async function rand(vm, arg) {
  if (arg.length === 0) {
    cond(false, "RAND should have at least 1 argument");
  } else if (arg.length === 1) {
    const max2 = await arg[0].reduce(vm);
    bigint(max2, "1st argument of RAND should be an integer");
    return BigInt(vm.random.next()) % max2;
  } else {
    const min2 = await arg[0].reduce(vm);
    bigint(min2, "1st argument of RAND should be an integer");
    const max2 = await arg[1].reduce(vm);
    bigint(max2, "2nd argument of RAND should be an integer");
    return BigInt(vm.random.next()) % (max2 - min2) + min2;
  }
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/sign.js
async function sign(vm, arg) {
  const value = await arg[0].reduce(vm);
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
async function sqrt(vm, arg) {
  const value = await arg[0].reduce(vm);
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
async function strLenS(vm, arg) {
  const value = await arg[0].reduce(vm);
  string(value, "1st Argument of STRLENS should be a string");
  return value.length;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/strlensu.js
async function strLenSU(vm, arg) {
  const value = await arg[0].reduce(vm);
  string(value, "1st Argument of STRLENS should be a string");
  return value.length;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/sumarray.js
var LARGE_INT5 = 2n ** 60n;
async function sumArray(vm, arg) {
  const target = arg[0];
  cond(target instanceof Variable, "1st argument of SUMARRAY should be a variable");
  cond(target.getCell(vm).type === "number", "1st argument of SUMARRAY should be a number variable");
  const start = arg.length >= 2 ? await arg[1].reduce(vm) : 0n;
  bigint(start, "2nd argument of SUMARRAY should be a number");
  const end = arg.length >= 3 ? await arg[2].reduce(vm) : LARGE_INT5;
  bigint(end, "3rd argument of SUMARRAY should be a number");
  const varSize2 = target.getCell(vm).length(0);
  const realEnd = end > varSize2 ? BigInt(varSize2) : end;
  let result = 0n;
  for (let i = start; i < realEnd; ++i) {
    result += target.getCell(vm).get(vm, [Number(i)]);
  }
  return result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/toint.js
async function toInt(vm, arg) {
  const value = await arg[0].reduce(vm);
  string(value, "1st Argument of TOINT should be a string");
  const result = Number(value);
  return isNaN(result) ? 0 : result;
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/tostr.js
async function toStr(vm, arg) {
  const value = await arg[0].reduce(vm);
  bigint(value, "1st Argument of TOSTR should be a number");
  return value.toString();
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/varsize.js
async function varSize(vm, arg) {
  const name = await arg[0].reduce(vm);
  string(name, "1st Argument of VARSIZE should be a string");
  const depth = arg.length >= 2 ? await arg[1].reduce(vm) : 0n;
  bigint(depth, "2nd argument of VARSIZE must be a number");
  return vm.getValue(name).length(Number(depth));
}

// ../../.my_agent_remote/undercrow__eraJS/build/statement/method/unicode.js
async function unicode(vm, arg) {
  const value = await arg[0].reduce(vm);
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
  async reduce(vm) {
    switch (this.name.toUpperCase()) {
      case "ABS":
        return abs(vm, this.arg);
      case "BARSTR":
        return barStr(vm, this.arg);
      case "CSVABL":
        return BigInt(await csvAbl(vm, this.arg));
      case "CSVBASE":
        return BigInt(await csvBase(vm, this.arg));
      case "CSVCALLNAME":
        return csvCallname(vm, this.arg);
      case "CSVCFLAG":
        return BigInt(await csvCflag(vm, this.arg));
      case "CSVCSTR":
        return csvCstr(vm, this.arg);
      case "CSVEQUIP":
        return BigInt(await csvEquip(vm, this.arg));
      case "CSVEXP":
        return BigInt(await csvExp(vm, this.arg));
      case "CSVJUEL":
        return BigInt(await csvJuel(vm, this.arg));
      case "CSVMARK":
        return BigInt(await csvMark(vm, this.arg));
      case "CSVMASTERNAME":
        return csvMastername(vm, this.arg);
      case "CSVNAME":
        return csvName(vm, this.arg);
      case "CSVNICKNAME":
        return csvNickname(vm, this.arg);
      case "CSVRELATION":
        return BigInt(await csvRelation(vm, this.arg));
      case "CSVTALENT":
        return BigInt(await csvTalent(vm, this.arg));
      case "EXISTCSV":
        return BigInt(await existCsv(vm, this.arg));
      case "FINDCHARA":
        return findChara(vm, this.arg);
      case "FINDLASTCHARA":
        return findLastChara(vm, this.arg);
      case "GETBGCOLOR":
        return BigInt(getBgColor(vm, this.arg));
      case "GETBIT":
        return BigInt(await getBit(vm, this.arg));
      case "GETCHARA":
        return BigInt(await getChara(vm, this.arg));
      case "GETCOLOR":
        return BigInt(getColor(vm, this.arg));
      case "GETDEFBGCOLOR":
        return BigInt(getDefBgColor(vm, this.arg));
      case "GETDEFCOLOR":
        return BigInt(getDefColor(vm, this.arg));
      case "GETFOCUSCOLOR":
        return BigInt(getFocusColor(vm, this.arg));
      case "GROUPMATCH":
        return BigInt(await groupMatch(vm, this.arg));
      case "INRANGE":
        return BigInt(await inRange(vm, this.arg));
      case "LIMIT":
        return limit(vm, this.arg);
      case "LINEISEMPTY":
        return BigInt(lineIsEmpty(vm, this.arg));
      case "MATCH":
        return BigInt(await match(vm, this.arg));
      case "MAX":
        return max(vm, this.arg);
      case "MAXARRAY":
        return maxArray(vm, this.arg);
      case "MIN":
        return min(vm, this.arg);
      case "MINARRAY":
        return minArray(vm, this.arg);
      case "POWER":
        return power(vm, this.arg);
      case "RAND":
        return rand(vm, this.arg);
      case "SIGN":
        return BigInt(await sign(vm, this.arg));
      case "SQRT":
        return sqrt(vm, this.arg);
      case "STRLENS":
        return BigInt(await strLenS(vm, this.arg));
      case "STRLENSU":
        return BigInt(await strLenSU(vm, this.arg));
      case "SUMARRAY":
        return sumArray(vm, this.arg);
      case "TOINT":
        return BigInt(await toInt(vm, this.arg));
      case "TOSTR":
        return toStr(vm, this.arg);
      case "VARSIZE":
        return BigInt(await varSize(vm, this.arg));
      case "UNICODE":
        return unicode(vm, this.arg);
      default: {
        cond(vm.fnMap.has(this.name), `Method ${this.name} does not exist`);
        const values = [];
        for (const arg of this.arg) {
          values.push(await arg.reduce(vm));
        }
        const result = await runGenerator(vm.fnMap.get(this.name).run(vm, values));
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
  async reduce(vm) {
    const condition = await this.condition.reduce(vm);
    bigint(condition, "Condition of ternary operator should be an integer");
    return condition !== 0n ? this.left.reduce(vm) : this.right.reduce(vm);
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
  async reduce(vm) {
    const value = await this.expr.reduce(vm);
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
  async reduce(vm) {
    const cell = this.target.getCell(vm);
    const index = await this.target.reduceIndex(vm);
    const value = cell.get(vm, index);
    bigint(value, `Operand of ${this.op} should be an integer`);
    switch (this.op) {
      case "++":
        cell.set(vm, value + 1n, index);
        break;
      case "--":
        cell.set(vm, value - 1n, index);
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
var import_parsimmon2 = __toESM(require_parsimmon());
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

// ../../.my_agent_remote/undercrow__eraJS/build/lazy.js
var Lazy = class {
  raw;
  parser;
  isCompiled;
  cache;
  constructor(raw, parser3) {
    this.parser = parser3;
    this.raw = raw;
    this.isCompiled = false;
  }
  get() {
    if (this.isCompiled) {
      return this.cache;
    }
    const result = tryParse(this.parser, this.raw);
    this.isCompiled = true;
    this.cache = result;
    return result;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-form.js
var PARSER = sepBy0(",", form[","]);
var AssignForm = class extends Statement {
  dest;
  arg;
  constructor(dest, raw) {
    super(raw);
    this.dest = dest;
    this.arg = new Lazy(raw, PARSER);
  }
  async *run(vm) {
    const dest = this.dest.getCell(vm);
    const index = await this.dest.reduceIndex(vm);
    const arg = this.arg.get();
    const partialIndex = index.slice(0, -1);
    const lastIndex = index[index.length - 1] ?? 0;
    if (arg.length !== 0) {
      for (let i = 0; i < arg.length; ++i) {
        const value = await arg[i].reduce(vm);
        dest.set(vm, value, [...partialIndex, lastIndex + i]);
      }
    } else {
      dest.set(vm, "", index);
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
    this.arg = new Lazy(raw, PARSER2);
  }
  async *run(vm) {
    const dest = this.dest.getCell(vm);
    const index = await this.dest.reduceIndex(vm);
    const arg = this.arg.get();
    const partialIndex = index.slice(0, -1);
    const lastIndex = index[index.length - 1] ?? 0;
    for (let i = 0; i < arg.length; ++i) {
      const value = await arg[i].reduce(vm);
      dest.set(vm, value, [...partialIndex, lastIndex + i]);
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
    this.arg = new Lazy(raw, PARSER3);
  }
  async *run(vm) {
    const dest = this.dest.getCell(vm);
    const index = await this.dest.reduceIndex(vm);
    const original = dest.get(vm, index);
    const value = await this.arg.get().reduce(vm);
    bigint(value, `Right operand of ${this.operator} should be a number`);
    switch (this.operator) {
      case "*=":
        dest.set(vm, original * value, index);
        break;
      case "/=":
        dest.set(vm, original / value, index);
        break;
      case "%=":
        dest.set(vm, original % value, index);
        break;
      case "+=":
        dest.set(vm, original + value, index);
        break;
      case "-=":
        dest.set(vm, original - value, index);
        break;
      // eslint-disable-next-line no-bitwise
      case "&=":
        dest.set(vm, original & value, index);
        break;
      // eslint-disable-next-line no-bitwise
      case "|=":
        dest.set(vm, original | value, index);
        break;
      // eslint-disable-next-line no-bitwise
      case "^=":
        dest.set(vm, original ^ value, index);
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
    this.arg = new Lazy(raw, PARSER4);
  }
  async *run(vm) {
    const dest = this.dest.getCell(vm);
    const index = await this.dest.reduceIndex(vm);
    const original = dest.get(vm, index);
    const arg = await this.arg.get().reduce(vm);
    string(arg, `Right operand of ${this.operator} should be a string`);
    switch (this.operator) {
      case "+=":
        dest.set(vm, original + arg, index);
        break;
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-prefix.js
var import_parsimmon4 = __toESM(require_parsimmon());
var PARSER5 = import_parsimmon4.default.eof;
var AssignPrefix = class extends Statement {
  dest;
  operator;
  arg;
  constructor(dest, operator, raw) {
    super(raw);
    this.dest = dest;
    this.operator = operator;
    this.arg = new Lazy(raw, PARSER5);
  }
  async *run(vm) {
    this.raw.get();
    const dest = this.dest.getCell(vm);
    cond(dest.type === "number", "++/-- should be used with a numeric variable");
    const index = await this.dest.reduceIndex(vm);
    const original = dest.get(vm, index);
    switch (this.operator) {
      case "++":
        dest.set(vm, original + 1n, index);
        break;
      case "--":
        dest.set(vm, original - 1n, index);
        break;
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/assign-postfix.js
var import_parsimmon5 = __toESM(require_parsimmon());
var PARSER6 = import_parsimmon5.default.eof;
var AssignPostfix = class extends Statement {
  dest;
  operator;
  arg;
  constructor(dest, operator, raw) {
    super(raw);
    this.dest = dest;
    this.operator = operator;
    this.arg = new Lazy(raw, PARSER6);
  }
  async *run(vm) {
    this.raw.get();
    const dest = this.dest.getCell(vm);
    cond(dest.type === "number", "++/-- should be used with a numeric variable");
    const index = await this.dest.reduceIndex(vm);
    const original = dest.get(vm, index);
    switch (this.operator) {
      case "++":
        dest.set(vm, original + 1n, index);
        break;
      case "--":
        dest.set(vm, original - 1n, index);
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
    this.arg = new Lazy(raw, PARSER7);
  }
  async *run(vm) {
    const dest = this.dest.getCell(vm);
    const index = await this.dest.reduceIndex(vm);
    const arg = this.arg.get();
    const partialIndex = index.slice(0, -1);
    const lastIndex = index[index.length - 1] ?? 0;
    for (let i = 0; i < arg.length; ++i) {
      const value = await arg[i].reduce(vm);
      dest.set(vm, value, [...partialIndex, lastIndex + i]);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/assign/index.js
var PARSER_PREFIX = import_parsimmon6.default.seq(alt("++", "--").trim(WS0), variable, import_parsimmon6.default.all);
var PARSER_POSTFIX = import_parsimmon6.default.seq(variable, alt("++", "--").trim(WS0), import_parsimmon6.default.all);
var PARSER_VAR = import_parsimmon6.default.seq(variable, import_parsimmon6.default.alt(alt("="), alt("'="), alt("*=", "/=", "%=", "+=", "-=", "&=", "|=", "^=")).trim(WS0), import_parsimmon6.default.all);
var Assign = class extends Statement {
  inner;
  constructor(raw) {
    super(raw);
  }
  compile(vm) {
    try {
      const [op, dest, rest] = tryParse(PARSER_PREFIX, this.raw);
      const restSlice = this.raw.slice(this.raw.length() - rest.length);
      const destType = dest.getCell(vm).type;
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
      const destType = dest.getCell(vm).type;
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
      const destType = dest.getCell(vm).type;
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
  async *run(vm) {
    if (this.inner == null) {
      this.compile(vm);
    }
    return yield* vm.run(this.inner);
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
    this.value = new Array(realSize[0]).fill(0n);
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
  static normalizeIndex(vm, name, index) {
    if (index.length === 0) {
      return [Number(vm.getValue("TARGET").get(vm, []))];
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
  get(vm, index) {
    const realIndex = _IntChar0DValue.normalizeIndex(vm, this.name, index);
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm, realIndex.slice(1));
  }
  set(vm, value, index) {
    const realIndex = _IntChar0DValue.normalizeIndex(vm, this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm, value, realIndex.slice(1));
  }
  rangeSet(vm, value, index, _range) {
    this.set(vm, value, index);
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
  static normalizeIndex(vm, name, index) {
    if (index.length === 0) {
      return [Number(vm.getValue("TARGET").get(vm, [])), 0];
    } else if (index.length === 1) {
      return [Number(vm.getValue("TARGET").get(vm, [])), index[0]];
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
  get(vm, index) {
    const realIndex = _IntChar1DValue.normalizeIndex(vm, this.name, index);
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm, realIndex.slice(1));
  }
  set(vm, value, index) {
    const realIndex = _IntChar1DValue.normalizeIndex(vm, this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm, value, realIndex.slice(1));
  }
  rangeSet(vm, value, index, range) {
    const realIndex = _IntChar1DValue.normalizeIndex(vm, this.name, [...index, 0]);
    bigint(value, "Cannot assign a string to a numeric variable");
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    cell.rangeSet(vm, value, realIndex.slice(1), range);
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
    this.value = new Array(realSize[0]).fill("");
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
  static normalizeIndex(vm, name, index) {
    if (index.length === 0) {
      return [Number(vm.getValue("TARGET").get(vm, []))];
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
  get(vm, index) {
    const realIndex = _StrChar0DValue.normalizeIndex(vm, this.name, index);
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm, realIndex.slice(1));
  }
  set(vm, value, index) {
    const realIndex = _StrChar0DValue.normalizeIndex(vm, this.name, index);
    string(value, "Cannot assign a number to a string variable");
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm, value, realIndex.slice(1));
  }
  rangeSet(vm, value, index, _range) {
    this.set(vm, value, index);
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
  static normalizeIndex(vm, name, index) {
    if (index.length === 0) {
      return [Number(vm.getValue("TARGET").get(vm, [])), 0];
    } else if (index.length === 1) {
      return [Number(vm.getValue("TARGET").get(vm, [])), index[0]];
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
  get(vm, index) {
    const realIndex = _StrChar1DValue.normalizeIndex(vm, this.name, index);
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    return cell.get(vm, realIndex.slice(1));
  }
  set(vm, value, index) {
    const realIndex = _StrChar1DValue.normalizeIndex(vm, this.name, index);
    string(value, "Cannot assign a number to a string variable");
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    cell.set(vm, value, realIndex.slice(1));
  }
  rangeSet(vm, value, index, range) {
    const realIndex = _StrChar1DValue.normalizeIndex(vm, this.name, [...index, 0]);
    string(value, "Cannot assign a number to a string variable");
    if (vm.characterList.length <= realIndex[0]) {
      throw notFound("Character", `#${realIndex[0]}`);
    }
    const cell = vm.characterList[realIndex[0]].getValue(this.name);
    cell.rangeSet(vm, value, realIndex.slice(1), range);
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
  constructor(vm, template) {
    this.values = /* @__PURE__ */ new Map();
    for (const [name, value] of vm.globalMap) {
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
    if (template == null) {
      return;
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
    this.arg = new Lazy(raw, PARSER8);
  }
  async *run(vm) {
    for (const expr2 of this.arg.get()) {
      const id = await expr2.reduce(vm);
      bigint(id, "Character id should be an integer");
      const template = vm.templateMap.get(Number(id));
      cond(template != null, `Character template with id ${id} does not exist`);
      vm.characterList.push(new Character(vm, template));
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
    this.arg = new Lazy(raw, PARSER9);
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
  async *run(vm) {
    const template = vm.templateMap.get(0);
    cond(template != null, "Character template with id 0 does not exist");
    vm.characterList.push(new Character(vm, template));
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
  async *run(vm) {
    vm.characterList.push(new Character(vm, null));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/alignment.js
var PARSER12 = arg1R1(alt("LEFT", "CENTER", "RIGHT"));
var Alignment = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER12);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm) {
    vm.printer.align = this.arg.get();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/arrayshift.js
var PARSER13 = arg5R3(variable, expr, expr, expr, expr);
var ArrayShift = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER13);
  }
  async *run(vm) {
    const [targetExpr, countExpr, fillExpr] = this.arg.get();
    const target = targetExpr.getCell(vm);
    const index = await targetExpr.reduceIndex(vm);
    const length = target.length(index.length);
    const count = await countExpr.reduce(vm);
    bigint(count, "2nd argument of ARRAYSHIFT must be a number");
    const fill = await fillExpr.reduce(vm);
    if (count > 0) {
      for (let i = length - 1; i >= count; --i) {
        const value = target.get(vm, [...index, i - Number(count)]);
        target.set(vm, value, [...index, i]);
      }
      for (let i = count - 1n; i >= 0; --i) {
        target.set(vm, fill, [...index, Number(i)]);
      }
    } else if (count < 0) {
      for (let i = 0; i < length + Number(count); ++i) {
        const value = target.get(vm, [...index, i - Number(count)]);
        target.set(vm, value, [...index, i]);
      }
      for (let i = length + Number(count); i < length; ++i) {
        target.set(vm, fill, [...index, i]);
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
    this.arg = new Lazy(raw, PARSER14);
    this.newline = newline;
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const [valueExpr, maxExpr, lengthExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm);
    bigint(value, "1st argument of BAR must be a number");
    const max2 = await maxExpr.reduce(vm);
    bigint(max2, "2nd argument of BAR must be a number");
    const length = await lengthExpr.reduce(vm);
    bigint(length, "3rd argument of BAR must be a number");
    const safeLength = length < 0n ? 0n : length;
    let filled = max2 <= 0n ? 0n : safeLength * value / max2;
    if (filled < 0n) filled = 0n;
    if (filled > safeLength) filled = safeLength;
    const text = "[" + "*".repeat(Number(filled)) + ".".repeat(Number(safeLength - filled)) + "]";
    yield* vm.printer.print(text, /* @__PURE__ */ new Set());
    if (this.newline) {
      yield* vm.printer.newline();
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
    this.arg = new Lazy(raw, PARSER15);
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
var import_parsimmon7 = __toESM(require_parsimmon());
var Call = class _Call extends Statement {
  static PARSER = import_parsimmon7.default.alt(arg1R1(import_parsimmon7.default.seq(Identifier.skip(WS0), wrap("(", ")", sepBy0(",", optional(expr))))), argNR1(Identifier, optional(expr)).map(([f, ...r]) => [f, r]));
  static async *exec(vm, target, argExpr) {
    const realTarget = target.toUpperCase();
    cond(vm.fnMap.has(realTarget), `Function ${realTarget} does not exist`);
    const arg = [];
    for (const a of argExpr) {
      arg.push(await a?.reduce(vm));
    }
    const result = yield* vm.fnMap.get(realTarget).run(vm, arg);
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
          vm.getValue("RESULT").set(vm, result.value[i], [i]);
        }
        return null;
      }
      case "quit":
        return result;
      case void 0: {
        vm.getValue("RESULT").set(vm, 0n, [0]);
        return null;
      }
    }
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, _Call.PARSER);
  }
  async *run(vm) {
    const [target, argExpr] = this.arg.get();
    return yield* _Call.exec(vm, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/callf.js
var CallF = class _CallF extends Statement {
  static async *exec(vm, target, argExpr) {
    const realTarget = target.toUpperCase();
    cond(vm.fnMap.has(realTarget), `Function ${realTarget} does not exist`);
    const arg = [];
    for (const a of argExpr) {
      arg.push(await a?.reduce(vm));
    }
    const result = yield* vm.fnMap.get(realTarget).run(vm, arg);
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
    this.arg = new Lazy(raw, Call.PARSER);
  }
  async *run(vm) {
    const [target, argExpr] = this.arg.get();
    return yield* _CallF.exec(vm, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/callform.js
var import_parsimmon8 = __toESM(require_parsimmon());
var CallForm = class _CallForm extends Statement {
  static PARSER(exclude) {
    return import_parsimmon8.default.alt(arg1R1(import_parsimmon8.default.seq(form[exclude], wrap("(", ")", sepBy0(",", optional(expr))))), argNR1(form[exclude], optional(expr)).map(([f, ...r]) => [f, r]));
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, _CallForm.PARSER("(,"));
  }
  async *run(vm) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = await targetExpr.reduce(vm);
    string(target, "1st argument of CALLFORM must be a string");
    return yield* Call.exec(vm, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/callformf.js
var CallFormF = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, CallForm.PARSER("(,"));
  }
  async *run(vm) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = await targetExpr.reduce(vm);
    string(target, "1st argument of CALLFORMF must be a string");
    return yield* CallF.exec(vm, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/calltrain.js
var PARSER17 = arg1R1(expr);
var CallTrain = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER17);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    bigint(value, "Argument of CALLTRAIN must be a number");
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/case.js
var import_parsimmon9 = __toESM(require_parsimmon());

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
    this.arg = new Lazy(raw, PARSER_COND);
    this.thunk = thunk;
  }
  async *run(vm, label) {
    let firstLoop = true;
    while (true) {
      const result = yield* this.thunk.run(vm, firstLoop ? label : void 0);
      const condition = await this.arg.get().reduce(vm);
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
    this.arg = new Lazy(raw, PARSER18);
    this.thunk = thunk;
  }
  async *run(vm, label) {
    if (label != null) {
      if (this.thunk.labelMap.has(label)) {
        return yield* this.thunk.run(vm, label);
      }
    }
    const [counter, startExpr, endExpr, stepExpr] = this.arg.get();
    const start = await startExpr.reduce(vm);
    bigint(start, "Starting value for FOR should be an integer");
    const end = await endExpr.reduce(vm);
    bigint(end, "Ending value for FOR should be an integer");
    const step = await stepExpr?.reduce(vm) ?? 1n;
    bigint(step, "Step of FOR should be an integer");
    const index = await counter.reduceIndex(vm);
    loop: for (let i = start; i < end; i += step) {
      counter.getCell(vm).set(vm, i, index);
      const result = yield* this.thunk.run(vm);
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
      new Lazy(raw, PARSER19),
      thunk
    ]);
    this.elseThunk = elseThunk;
  }
  async *run(vm, label) {
    if (label != null) {
      for (const [, , thunk] of this.ifThunk) {
        if (thunk.labelMap.has(label)) {
          return yield* thunk.run(vm, label);
        }
      }
      if (this.elseThunk.labelMap.has(label)) {
        return yield* this.elseThunk.run(vm, label);
      }
    }
    for (const [, cond2, thunk] of this.ifThunk) {
      const condValue = await cond2.get().reduce(vm);
      bigint(condValue, "Condition should be an integer");
      if (condValue !== 0n) {
        return yield* thunk.run(vm);
      }
    }
    return yield* this.elseThunk.run(vm);
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
    this.arg = new Lazy(raw, PARSER20);
    this.thunk = thunk;
  }
  async *run(vm, label) {
    if (label != null) {
      if (this.thunk.labelMap.has(label)) {
        return yield* this.thunk.run(vm, label);
      }
    }
    const condition = await this.arg.get().reduce(vm);
    bigint(condition, "Condition for REPEAT should be an integer");
    loop: for (let i = 0n; i < condition; ++i) {
      vm.getValue("COUNT").set(vm, i, []);
      const result = yield* this.thunk.run(vm);
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
    this.arg = new Lazy(raw, PARSER21);
    this.thunk = thunk;
  }
  async *run(vm, label) {
    let firstLoop = true;
    while (true) {
      let result;
      if (firstLoop && label != null && this.thunk.labelMap.has(label)) {
        result = yield* this.thunk.run(vm, label);
      } else {
        const condition = await this.arg.get().reduce(vm);
        bigint(condition, "Condition of WHILE should be an integer");
        if (condition === 0n) {
          break;
        }
        result = yield* this.thunk.run(vm);
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
    this.labelMap = /* @__PURE__ */ new Map();
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
  }
  async *run(vm, label) {
    let start = 0;
    if (label != null) {
      start = this.labelMap.get(label) ?? 0;
    }
    for (let i = start; i < this.statement.length; ++i) {
      const statement = this.statement[i];
      const result = yield* vm.run(statement, label);
      switch (result?.type) {
        case "begin":
          return result;
        case "goto": {
          if (this.labelMap.has(result.label)) {
            return yield* this.run(vm, result.label);
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
    this.arg = new Lazy(raw, PARSER_EXPR);
    this.branch = branch.map(([cond2, thunk]) => [new Lazy(cond2, PARSER_BRANCH), thunk]);
    this.def = def;
  }
  async *run(vm, label) {
    if (label != null) {
      for (const [, thunk] of this.branch) {
        if (thunk.labelMap.has(label)) {
          return yield* thunk.run(vm, label);
        }
      }
      if (this.def.labelMap.has(label)) {
        return yield* this.def.run(vm, label);
      }
    }
    const value = await this.arg.get().reduce(vm);
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
        return yield* expr2.run(vm);
      }
    }
    return yield* this.def.run(vm);
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
    this.arg = new Lazy(raw, PARSER25);
  }
  async *run(vm) {
    const index = await this.arg.get().reduce(vm);
    bigint(index, "1st argument of CHKDATA must be a number");
    let result;
    let message = "";
    const file = savefile.game(Number(index));
    const raw = await vm.external.getSavedata(file);
    if (raw == null) {
      result = 1n;
      message = "----";
    } else {
      try {
        const parsed = JSON.parse(raw);
        number(parsed.code, `Save file ${file} is not in a valid format`);
        number(parsed.version, `Save file ${file} is not in a valid format`);
        string(parsed.data.comment, `Save file ${file} is not in a valid format`);
        const code = vm.code.csv.gamebase.code ?? 0;
        const version = vm.code.csv.gamebase.version ?? 0;
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
    vm.getValue("RESULT").set(vm, result, [0]);
    vm.getValue("RESULTS").set(vm, message, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/chkfont.js
var PARSER26 = arg1R1(expr);
var ChkFont = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER26);
  }
  async *run(vm) {
    const arg = await this.arg.get().reduce(vm);
    string(arg, "1st argument of CHKFONT should be a string");
    const result = vm.external.getFont(arg) ? 1n : 0n;
    vm.getValue("RESULT").set(vm, result, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/clearbit.js
var PARSER27 = argNR1(variable, expr);
var ClearBit = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER27);
  }
  async *run(vm) {
    const [destExpr, ...bitExpr] = this.arg.get();
    const value = await destExpr.reduce(vm);
    bigint(value, "1st argument of CLEARBIT must be a number");
    const bitList = [];
    for (let i = 0; i < bitExpr.length; ++i) {
      const bit = await bitExpr[i].reduce(vm);
      bigint(bit, `${i + 1}th Argument of CLEARBIT must be a number`);
      bitList.push(bit);
    }
    let result = value;
    for (const bit of bitList) {
      result &= ~(1n << bit);
    }
    destExpr.getCell(vm).set(vm, result, await destExpr.reduceIndex(vm));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/clearline.js
var PARSER28 = arg1R1(expr);
var ClearLine = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER28);
  }
  async *run(vm) {
    const count = await this.arg.get().reduce(vm);
    bigint(count, "Argument of CLEARLINE must be an integer!");
    yield* vm.printer.clear(Number(count));
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
    this.arg = new Lazy(raw, PARSER31);
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
  async *run(vm) {
    const length = Math.min(vm.getValue("PALAM").length(1), vm.getValue("CUP").length(1), vm.getValue("CDOWN").length(1));
    for (let i = 0; i < length; ++i) {
      const up = vm.getValue("CUP").get(vm, [i]);
      const down = vm.getValue("CDOWN").get(vm, [i]);
      const palam = vm.getValue("PALAM").get(vm, [i]);
      if (up <= 0 && down <= 0) {
        continue;
      }
      const result = palam + up - down;
      vm.getValue("PALAM").set(vm, result, [i]);
      vm.getValue("CUP").set(vm, 0n, [i]);
      vm.getValue("CDOWN").set(vm, 0n, [i]);
      if (!vm.printer.skipDisp) {
        const name = vm.code.csv.palam.get(i);
        let text = `${name} ${palam}`;
        if (up > 0) {
          text += `+${up}`;
        }
        if (down > 0) {
          text += `-${down}`;
        }
        text += `=${result}`;
        yield* vm.printer.print(text, /* @__PURE__ */ new Set(["L"]));
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
  async *run(vm) {
    vm.getValue("RESULT").set(vm, vm.printer.draw ? 1n : 0n, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/customdrawline.js
var PARSER35 = arg1R1(charSeq());
var CustomDrawLine = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER35);
  }
  async *run(vm) {
    const value = this.arg.get();
    yield* vm.printer.line(value);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/cvarset.js
var PARSER36 = arg5R1(variable, expr, expr, expr, expr);
var VarSet = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER36);
  }
  async *run(vm) {
    const [destExpr, indexExpr, valueExpr, startExpr, endExpr] = this.arg.get();
    const index = await indexExpr?.reduce(vm) ?? 0n;
    bigint(index, "2nd argument of CVARSET must be a number");
    const value = await valueExpr?.reduce(vm);
    const start = await startExpr?.reduce(vm) ?? 0n;
    bigint(start, "4th argument of CVARSET must be a number");
    const end = await endExpr?.reduce(vm) ?? BigInt(vm.characterList.length);
    bigint(end, "5th argument of CVARSET must be a number");
    for (let i = start; i < end; ++i) {
      const character = vm.characterList[Number(i)];
      const cell = character.getValue(destExpr.name);
      if (value != null) {
        cell.set(vm, value, [Number(index)]);
      } else {
        if (cell.type === "number") {
          cell.set(vm, 0n, [Number(index)]);
        } else {
          cell.set(vm, "", [Number(index)]);
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
    this.arg = new Lazy(raw, PARSER39);
  }
  async *run(vm) {
    const arg = this.arg.get();
    const indexList = [];
    for (let i = 0; i < arg.length; ++i) {
      const index = await arg[i].reduce(vm);
      bigint(index, `${i + 1}th argument of DELCHARA should be a number`);
      indexList.push(index);
    }
    indexList.sort();
    indexList.reverse();
    for (const index of indexList) {
      vm.characterList.splice(Number(index), 1);
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
    this.arg = new Lazy(raw, PARSER40);
  }
  async *run(vm) {
    const index = await this.arg.get().reduce(vm);
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
  async *run(vm) {
    yield* vm.printer.line();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/drawlineform.js
var PARSER42 = arg1R1(form[""]);
var DrawLineForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER42);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    yield* vm.printer.line(value);
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
  async *run(vm) {
    vm.getValue("RANDDATA").set(vm, BigInt(vm.random.state), []);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/encodetouni.js
var PARSER44 = arg1R1(form[""]);
var EncodeToUni = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER44);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    string(value, "1st argument of ENCODETOUNI must be a string");
    const buffer = Buffer.from(value, "utf8");
    vm.getValue("RESULT").set(vm, BigInt(buffer.byteLength), [0]);
    for (let i = 0; i < buffer.byteLength; ++i) {
      vm.getValue("RESULT").set(vm, BigInt(buffer[i]), [i + 1]);
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
    this.arg = new Lazy(raw, PARSER45);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
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
    vm.getValue("RESULTS").set(vm, result, [0]);
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
  async *run(vm) {
    vm.printer.font.bold = !vm.printer.font.bold;
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
  async *run(vm) {
    vm.printer.font.italic = !vm.printer.font.italic;
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
  async *run(vm) {
    vm.printer.font.bold = false;
    vm.printer.font.italic = false;
    vm.printer.font.strike = false;
    vm.printer.font.underline = false;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/fontstyle.js
var PARSER49 = arg1R1(expr);
var FontStyle = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER49);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    bigint(value, "Argument of FONTSTYLE must be an integer!");
    vm.printer.font.bold = (value & 1n << 0n) !== 0n;
    vm.printer.font.italic = (value & 1n << 1n) !== 0n;
    vm.printer.font.strike = (value & 1n << 2n) !== 0n;
    vm.printer.font.underline = (value & 1n << 3n) !== 0n;
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
  async *run(vm) {
    yield* vm.printer.wait(true);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getexplv.js
var PARSER51 = arg2R2(expr, expr);
var GetExpLv = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER51);
  }
  async *run(vm) {
    const [valExpr, maxExpr] = this.arg.get();
    const value = await valExpr.reduce(vm);
    bigint(value, "1st argument of GETEXPLV must be a number");
    const max2 = await maxExpr.reduce(vm);
    bigint(max2, "2nd argument of GETEXPLV must be a number");
    let result = max2;
    for (let i = 0n; i <= max2; ++i) {
      if (value < vm.getValue("EXPLV").get(vm, [Number(i)])) {
        result = i - 1n;
        break;
      }
    }
    vm.getValue("RESULT").set(vm, result, [0]);
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
  async *run(vm) {
    const result = vm.printer.font.name;
    vm.getValue("RESULTS").set(vm, result, [0]);
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
  async *run(vm) {
    const time = (0, import_dayjs.default)(vm.external.getTime());
    vm.getValue("RESULT").set(vm, BigInt(time.valueOf() - UNIX_EPOCH * 1e3), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/getpalamlv.js
var PARSER54 = arg2R2(expr, expr);
var GetPalamLv = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER54);
  }
  async *run(vm) {
    const [valExpr, maxExpr] = this.arg.get();
    const value = await valExpr.reduce(vm);
    bigint(value, "1st argument of GETPALAMLV must be a number");
    const max2 = await maxExpr.reduce(vm);
    bigint(max2, "2nd argument of GETPALAMLV must be a number");
    let result = max2;
    for (let i = 0n; i <= max2; ++i) {
      if (value < vm.getValue("PALAMLV").get(vm, [Number(i)])) {
        result = i - 1n;
        break;
      }
    }
    vm.getValue("RESULT").set(vm, result, [0]);
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
  async *run(vm) {
    const time = (0, import_dayjs2.default)(vm.external.getTime());
    vm.getValue("RESULT").set(vm, BigInt(time.unix() - UNIX_EPOCH2), [0]);
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
  async *run(vm) {
    const time = (0, import_dayjs3.default)(vm.external.getTime());
    vm.getValue("RESULT").set(vm, BigInt(parseInt(time.format("YYYYMMDDHHmmssSSS"))), [0]);
    vm.getValue("RESULTS").set(vm, time.format("YYYY\u5E74MM\u6708DD\u65E5 HH:mm:ss"), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/goto.js
var PARSER58 = arg1R1(Identifier);
var Goto = class _Goto extends Statement {
  static *exec(vm, target) {
    const realTarget = target.toUpperCase();
    const context = vm.context();
    cond(context.fn.thunk.labelMap.has(realTarget), `Label ${realTarget} does not exist`);
    return {
      type: "goto",
      label: target
    };
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER58);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm) {
    const target = this.arg.get();
    return yield* _Goto.exec(vm, target);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/gotoform.js
var PARSER59 = arg1R1(form[""]);
var GotoForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER59);
  }
  async *run(vm) {
    const arg = await this.arg.get().reduce(vm);
    const target = arg.toUpperCase();
    const context = vm.context();
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
    this.arg = new Lazy(raw, PARSER60);
  }
  async *run(vm) {
    const arg = this.arg.get();
    const input = yield* vm.printer.input(true, arg != null);
    cond(input != null, "Input value for INPUT should be a valid number");
    let value = Number(input);
    if (arg != null && input === "") {
      value = arg;
    }
    number(value, "Input value for INPUT should be a valid number");
    yield* vm.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULT").set(vm, BigInt(value), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/inputs.js
var PARSER61 = arg1R0(charSeq());
var InputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER61);
  }
  async *run(vm) {
    const arg = this.arg.get();
    let input = yield* vm.printer.input(false, arg != null);
    string(input, "Input value for INPUTS should be a valid string");
    if (arg != null && input === "") {
      input = arg;
    }
    yield* vm.printer.print(input, /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULTS").set(vm, input, [0]);
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
  async *run(vm) {
    vm.random.state = Number(vm.getValue("RANDDATA").get(vm, []));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/invertbit.js
var PARSER63 = argNR1(variable, expr);
var InvertBit = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER63);
  }
  async *run(vm) {
    const [destExpr, ...bitExpr] = this.arg.get();
    const value = await destExpr.reduce(vm);
    bigint(value, "1st argument of INVERTBIT must be a number");
    const bitList = [];
    for (let i = 0; i < bitExpr.length; ++i) {
      const bit = await bitExpr[i].reduce(vm);
      bigint(bit, `${i + 2}th argument of INVERTBIT must be a number`);
      bitList.push(bit);
    }
    let result = value;
    for (const bit of bitList) {
      result ^= 1n << bit;
    }
    destExpr.getCell(vm).set(vm, result, await destExpr.reduceIndex(vm));
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
  static async *exec(vm, target, argExpr) {
    const realTarget = target.toUpperCase();
    cond(vm.fnMap.has(realTarget), `Function ${realTarget} does not exist`);
    const arg = [];
    for (const a of argExpr) {
      arg.push(await a?.reduce(vm));
    }
    const result = yield* vm.fnMap.get(realTarget).run(vm, arg);
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
      case "quit":
        return result;
      case "return": {
        for (let i = 0; i < result.value.length; ++i) {
          vm.getValue("RESULT").set(vm, result.value[i], [i]);
        }
        return result;
      }
      case void 0: {
        vm.getValue("RESULT").set(vm, 0n, [0]);
        return { type: "return", value: [0n] };
      }
    }
  }
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, Call.PARSER);
  }
  async *run(vm) {
    const [target, argExpr] = this.arg.get();
    return yield* _Jump.exec(vm, target, argExpr);
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/jumpform.js
var JumpForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, CallForm.PARSER("("));
  }
  async *run(vm) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = await targetExpr.reduce(vm);
    return yield* Jump.exec(vm, target, argExpr);
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
    this.value = new Array(realSize[0]).fill(0).map(() => new Array(realSize[1]).fill(0n));
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
    return this.value[realIndex[0]][realIndex[1]];
  }
  set(_vm, value, index) {
    const realIndex = _Int2DValue.normalizeIndex(this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    this.value[realIndex[0]][realIndex[1]] = value;
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
    this.value = new Array(realSize[0]).fill(0).map(() => new Array(realSize[1]).fill(0).map(() => new Array(realSize[2]).fill(0n)));
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
    return this.value[realIndex[0]][realIndex[1]][realIndex[2]];
  }
  set(_vm, value, index) {
    const realIndex = _Int3DValue.normalizeIndex(this.name, index);
    bigint(value, "Cannot assign a string to a numeric variable");
    this.value[realIndex[0]][realIndex[1]][realIndex[2]] = BigInt(value);
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
    this.arg = new Lazy(raw, PARSER66);
  }
  async *run(vm) {
    const index = await this.arg.get().reduce(vm);
    bigint(index, "Argument of LOADDATA must be a number");
    const file = savefile.game(Number(index));
    const raw = await vm.external.getSavedata(file);
    nonNull(raw, `Save file ${file} does not exist`);
    try {
      const parsed = JSON.parse(raw);
      string(parsed.data.comment, "");
      array(parsed.data.characters, "");
      const newCharacters = [];
      for (const character of parsed.data.characters) {
        const newCharacter = new Character(vm, {
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
            cell.reset(value.map((v) => BigInt(v)));
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
      vm.characterList = newCharacters;
      for (const [name, value] of Object.entries(parsed.data.variables)) {
        const cell = vm.getValue(name);
        if (cell instanceof Int0DValue) {
          string(value, "");
          cell.reset(BigInt(value));
        } else if (cell instanceof Int1DValue) {
          strArray(value, "");
          cell.reset(value.map((v) => BigInt(v)));
        } else if (cell instanceof Int2DValue) {
          strArray2D(value, "");
          cell.reset(value.map((v0) => v0.map((v1) => BigInt(v1))));
        } else if (cell instanceof Int3DValue) {
          strArray3D(value, "");
          cell.reset(value.map((v0) => v0.map((v1) => v1.map((v2) => BigInt(v2)))));
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
      vm.getValue("LASTLOAD_VERSION").set(vm, BigInt(parsed.version), []);
      vm.getValue("LASTLOAD_TEXT").set(vm, parsed.data.comment, []);
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
  async *run(vm) {
    const file = savefile.global;
    const raw = await vm.external.getSavedata(file);
    try {
      nonNull(raw, "");
      const parsed = JSON.parse(raw);
      const code = vm.code.csv.gamebase.code ?? 0;
      const version = vm.code.csv.gamebase.version ?? 0;
      cond(parsed.code === code, "");
      cond(parsed.version === version, "");
      for (const [name, value] of Object.entries(parsed.data)) {
        const cell = vm.getValue(name);
        if (cell instanceof Int0DValue) {
          string(value, "");
          cell.reset(BigInt(value));
        } else if (cell instanceof Int1DValue) {
          strArray(value, "");
          cell.reset(value.map((v) => BigInt(v)));
        } else if (cell instanceof Int2DValue) {
          strArray2D(value, "");
          cell.reset(value.map((v0) => v0.map((v1) => BigInt(v1))));
        } else if (cell instanceof Int3DValue) {
          strArray3D(value, "");
          cell.reset(value.map((v0) => v0.map((v1) => v1.map((v2) => BigInt(v2)))));
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
      vm.getValue("RESULT").set(vm, 1n, [0]);
    } catch {
      vm.getValue("RESULT").set(vm, 0n, [0]);
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
    this.arg = new Lazy(raw, PARSER69);
  }
  async *run(vm) {
    const arg = this.arg.get();
    let result;
    switch (this.name) {
      case "ABS":
        result = await abs(vm, arg);
        break;
      case "BARSTR":
        result = await barStr(vm, arg);
        break;
      case "CSVABL":
        result = BigInt(await csvAbl(vm, arg));
        break;
      case "CSVBASE":
        result = BigInt(await csvBase(vm, arg));
        break;
      case "CSVCALLNAME":
        result = await csvCallname(vm, arg);
        break;
      case "CSVCFLAG":
        result = BigInt(await csvCflag(vm, arg));
        break;
      case "CSVCSTR":
        result = await csvCstr(vm, arg);
        break;
      case "CSVEQUIP":
        result = BigInt(await csvEquip(vm, arg));
        break;
      case "CSVEXP":
        result = BigInt(await csvExp(vm, arg));
        break;
      case "CSVJUEL":
        result = BigInt(await csvJuel(vm, arg));
        break;
      case "CSVMARK":
        result = BigInt(await csvMark(vm, arg));
        break;
      case "CSVMASTERNAME":
        result = await csvMastername(vm, arg);
        break;
      case "CSVNAME":
        result = await csvName(vm, arg);
        break;
      case "CSVNICKNAME":
        result = await csvNickname(vm, arg);
        break;
      case "CSVRELATION":
        result = BigInt(await csvRelation(vm, arg));
        break;
      case "CSVTALENT":
        result = BigInt(await csvTalent(vm, arg));
        break;
      case "EXISTCSV":
        result = BigInt(await existCsv(vm, arg));
        break;
      case "FINDCHARA":
        result = await findChara(vm, arg);
        break;
      case "FINDLASTCHARA":
        result = await findLastChara(vm, arg);
        break;
      case "GETBGCOLOR":
        result = BigInt(getBgColor(vm, arg));
        break;
      case "GETBIT":
        result = BigInt(await getBit(vm, arg));
        break;
      case "GETCHARA":
        result = BigInt(await getChara(vm, arg));
        break;
      case "GETCOLOR":
        result = BigInt(getColor(vm, arg));
        break;
      case "GETDEFBGCOLOR":
        result = BigInt(getDefBgColor(vm, arg));
        break;
      case "GETDEFCOLOR":
        result = BigInt(getDefColor(vm, arg));
        break;
      case "GETFOCUSCOLOR":
        result = BigInt(getFocusColor(vm, arg));
        break;
      case "GROUPMATCH":
        result = BigInt(await groupMatch(vm, arg));
        break;
      case "INRANGE":
        result = BigInt(await inRange(vm, arg));
        break;
      case "LIMIT":
        result = await limit(vm, arg);
        break;
      case "LINEISEMPTY":
        result = BigInt(lineIsEmpty(vm, arg));
        break;
      case "MATCH":
        result = BigInt(await match(vm, arg));
        break;
      case "MAX":
        result = await max(vm, arg);
        break;
      case "MAXARRAY":
        result = await maxArray(vm, arg);
        break;
      case "MIN":
        result = await min(vm, arg);
        break;
      case "MINARRAY":
        result = await minArray(vm, arg);
        break;
      case "POWER":
        result = await power(vm, arg);
        break;
      case "RAND":
        result = await rand(vm, arg);
        break;
      case "SIGN":
        result = BigInt(await sign(vm, arg));
        break;
      case "SQRT":
        result = await sqrt(vm, arg);
        break;
      case "STRLENS":
        result = BigInt(await strLenS(vm, arg));
        break;
      case "STRLENSU":
        result = BigInt(await strLenSU(vm, arg));
        break;
      case "SUMARRAY":
        result = await sumArray(vm, arg);
        break;
      case "TOINT":
        result = BigInt(await toInt(vm, arg));
        break;
      case "TOSTR":
        result = await toStr(vm, arg);
        break;
      case "VARSIZE":
        result = BigInt(await varSize(vm, arg));
        break;
      case "UNICODE":
        result = await unicode(vm, arg);
        break;
      default:
        throw internal(`${this.name} is not a valid method command`);
    }
    if (typeof result === "bigint") {
      vm.getValue("RESULT").set(vm, result, [0]);
    } else {
      vm.getValue("RESULTS").set(vm, result, [0]);
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
    this.arg = new Lazy(raw, PARSER73);
  }
  // TODO: use only the first character of argument
  async *run(vm) {
    const arg = this.arg.get();
    const input = yield* vm.printer.input(true, arg != null);
    cond(input != null, "First value of input for ONEINPUT should be a valid number");
    let value = Number(input[0]);
    if (arg != null && input === "") {
      value = arg;
    }
    number(value, "First value of input for ONEINPUT should be a valid number");
    yield* vm.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULT").set(vm, BigInt(value), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/oneinputs.js
var PARSER74 = arg1R0(charSeq());
var OneInputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER74);
  }
  async *run(vm) {
    const arg = this.arg.get();
    let input = yield* vm.printer.input(false, arg != null);
    string(input, "Input value for ONEINPUTS should be a valid string");
    if (arg != null && input === "") {
      input = arg;
    }
    yield* vm.printer.print(input, /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULTS").set(vm, input[0], [0]);
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
    this.arg = new Lazy(raw, PARSER76);
  }
  async *run(vm) {
    const argExpr = this.arg.get();
    const arg = [];
    for (let i = 0; i < argExpr.length; ++i) {
      const value = await argExpr[i].reduce(vm);
      bigint(value, `${i + 1}th argument of PICKUPCHARA should be a number`);
      cond(value >= 0 && value < vm.characterList.length, `${i + 1}th argument of PICKUPCHARA is out of range`);
      arg.push(value);
    }
    let target = -1n;
    let assi = -1n;
    let master = -1n;
    const characterList = [];
    for (let i = 0n; i < arg.length; ++i) {
      const index = arg[Number(i)];
      if (index === vm.getValue("TARGET").get(vm, [])) {
        target = i;
      }
      if (index === vm.getValue("ASSI").get(vm, [])) {
        assi = i;
      }
      if (index === vm.getValue("MASTER").get(vm, [])) {
        master = i;
      }
      characterList.push(vm.characterList[Number(i)]);
    }
    vm.getValue("TARGET").set(vm, target, []);
    vm.getValue("ASSI").set(vm, assi, []);
    vm.getValue("MASTER").set(vm, master, []);
    vm.characterList = characterList;
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
    this.flags = new Set(flags);
    this.value = new Lazy(raw, PARSER77);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    yield* vm.printer.print(this.value.get(), this.flags);
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
    this.arg = new Lazy(raw, PARSER78);
  }
  async *run(vm) {
    const [textExpr, valueExpr] = this.arg.get();
    const text = await textExpr.reduce(vm);
    string(text, "1st argument of PRINTBUTTON must be a string");
    const value = await valueExpr.reduce(vm);
    yield* vm.printer.button(text, typeof value === "string" ? value : value.toString(), this.align);
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
    this.flags = new Set(flags);
    this.value = new Lazy(raw, PARSER79);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const value = this.value.get();
    yield* vm.printer.print(value, this.flags, this.align);
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
  async *run(vm) {
    vm.getValue("RESULT").set(vm, BigInt(vm.printCPerLine), [0]);
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
        data.push(new Lazy(current.slice("DATA".length), PARSER_CONST));
      } else if (DATAFORM.test(current.content)) {
        data.push(new Lazy(current.slice("DATAFORM".length), PARSER_FORM));
      } else if (DATAFORM_EMPTY.test(current.content)) {
        data.push(new Lazy(current.slice("DATAFORM".length), PARSER_CONST));
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
    this.flags = new Set(flags);
    this.data = data;
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const index = vm.random.next() % this.data.length;
    const value = await this.data[index].get().reduce(vm);
    string(value, "Item of PRINTDATA must be a string");
    yield* vm.printer.print(value, this.flags);
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
    this.flags = new Set(flags);
    this.arg = new Lazy(raw, PARSER81);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const value = await this.arg.get().reduce(vm);
    yield* vm.printer.print(value, this.flags);
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
    this.flags = new Set(flags);
    this.arg = new Lazy(raw, PARSER82);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const value = await this.arg.get().reduce(vm);
    yield* vm.printer.print(value, this.flags, this.align);
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
    this.flags = new Set(flags);
    this.arg = new Lazy(raw, PARSER83);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const form2 = await this.arg.get().reduce(vm);
    string(form2, "1st argument of PRINTFORMS must be a string");
    const text = await form[""].tryParse(form2).reduce(vm);
    string(text, "1st argument of PRINTFORMS must be reduced to a string");
    yield* vm.printer.print(text, this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/print_palam.js
var PARSER84 = arg1R1(expr);
var PrintPalam = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER84);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const index = await this.arg.get().reduce(vm);
    bigint(index, "1st argument of PRINT_PALAM must be a number");
    const palamName = vm.getValue("PALAMNAME");
    const validName = [];
    for (let i = 0; i < palamName.length(0); ++i) {
      const name = palamName.get(vm, [i]);
      if (name !== "") {
        validName.push(name);
      }
    }
    const clampCells = (filled) => Math.max(0, Math.min(10, filled));
    for (let i = 0; i < validName.length; ++i) {
      const name = validName[i];
      const value = vm.getValue("PALAM").get(vm, [Number(index), i]);
      const palamLv = [
        vm.getValue("PALAMLV").get(vm, [0]),
        vm.getValue("PALAMLV").get(vm, [1]),
        vm.getValue("PALAMLV").get(vm, [2]),
        vm.getValue("PALAMLV").get(vm, [3]),
        vm.getValue("PALAMLV").get(vm, [4])
      ];
      let text = name;
      if (value >= palamLv[4]) {
        text += "[" + "*".repeat(10) + "]";
      } else if (value >= palamLv[3]) {
        const filled = clampCells(Number(10n * value / palamLv[4]));
        text += "[" + "*".repeat(filled) + ".".repeat(10 - filled) + "]";
      } else if (value >= palamLv[2]) {
        const filled = clampCells(Number(10n * value / palamLv[3]));
        text += "[" + ">".repeat(filled) + ".".repeat(10 - filled) + "]";
      } else if (value >= palamLv[1]) {
        const filled = clampCells(Number(10n * value / palamLv[2]));
        text += "[" + "=".repeat(filled) + ".".repeat(10 - filled) + "]";
      } else {
        const filled = clampCells(Number(10n * value / palamLv[1]));
        text += "[" + "-".repeat(filled) + ".".repeat(10 - filled) + "]";
      }
      text += value.toString();
      yield* vm.printer.print(text, /* @__PURE__ */ new Set(), "LEFT");
      if ((i + 1) % vm.printCPerLine === 0) {
        yield* vm.printer.newline();
      }
    }
    yield* vm.printer.newline();
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
        this.arg = new Lazy(raw, PARSER_CONST2);
        break;
      }
      case "FORM": {
        this.arg = new Lazy(raw, PARSER_FORM2);
      }
    }
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const text = await this.arg.get().reduce(vm);
    string(text, "1st argument of PRINTPLAIN must be a string");
    yield* vm.printer.print(text, /* @__PURE__ */ new Set());
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
    this.flags = new Set(flags);
    this.arg = new Lazy(raw, PARSER85);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const value = await this.arg.get().reduce(vm);
    string(value, "1st argument of PRINTS must be a string");
    yield* vm.printer.print(value, this.flags);
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
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    const itemName = vm.getValue("ITEMNAME");
    const validItem = [];
    const itemSales = vm.getValue("ITEMSALES");
    for (let i = 0; i < itemName.length(0); ++i) {
      const name = itemName.get(vm, [i]);
      if (name !== "" && itemSales.get(vm, [i]) !== 0n) {
        validItem.push(i);
      }
    }
    for (let i = 0; i < validItem.length; ++i) {
      const index = validItem[i];
      const name = itemName.get(vm, [index]);
      const price = vm.getValue("ITEMPRICE").get(vm, [index]);
      const text = `[${index}] ${name}(${price}$)`;
      yield* vm.printer.print(text, /* @__PURE__ */ new Set(), "LEFT");
      if ((i + 1) % vm.printCPerLine === 0) {
        yield* vm.printer.newline();
      }
    }
    yield* vm.printer.newline();
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/printv.js
var import_parsimmon10 = __toESM(require_parsimmon());
var PARSER87 = argNR0(import_parsimmon10.default.alt(import_parsimmon10.default.string("'").then(charSeq(",").map((str) => new Const(str))), expr));
var PrintV = class extends Statement {
  flags;
  value;
  constructor(flags, raw) {
    super(raw);
    this.flags = new Set(flags);
    this.value = new Lazy(raw, PARSER87);
  }
  async *run(vm) {
    if (vm.printer.skipDisp) {
      return null;
    }
    let text = "";
    for (const value of this.value.get()) {
      text += (await value.reduce(vm)).toString();
    }
    yield* vm.printer.print(text, this.flags);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/putform.js
var PARSER88 = arg1R1(form[""]);
var PutForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER88);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    string(value, "1st argument of PUTFORM should be a number");
    const cell = vm.getValue("SAVEDATA_TEXT");
    cell.set(vm, cell.get(vm, []) + value, []);
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
    this.arg = new Lazy(raw, PARSER90);
  }
  async *run(vm) {
    const seed = await this.arg.get().reduce(vm);
    bigint(seed, "1st argument of RANDOMIZE must be a number");
    vm.random.state = Number(seed);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/redraw.js
var PARSER91 = arg1R1(expr);
var Redraw = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER91);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    bigint(value, "Argument of REDRAW must be a number");
    cond(value >= 0 && value <= 3, "Argument of REDRAW must be between 0 and 3");
    switch (value) {
      case 0n:
        vm.printer.draw = false;
        break;
      case 1n:
        vm.printer.draw = true;
        break;
      case 2n:
        vm.printer.draw = false;
        yield* vm.printer.flush();
        break;
      case 3n:
        vm.printer.draw = true;
        yield* vm.printer.flush();
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
  async *run(vm) {
    vm.printer.background = vm.printer.defaultBackground;
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
  async *run(vm) {
    vm.printer.color = vm.printer.defaultColor;
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
  async *run(vm) {
    await vm.reset();
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
    this.arg = new Lazy(raw, PARSER96);
  }
  async *run(vm) {
    const num = await this.arg.get().reduce(vm);
    bigint(num, "1st Argument of RESET_STAIN should be an integer");
    cond(vm.characterList.length > num, `Character #${num} does not exist`);
    const character = vm.characterList[Number(num)];
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
    this.arg = new Lazy(raw, PARSER98);
  }
  async *run(vm) {
    const result = [];
    for (const expr2 of this.arg.get()) {
      result.push(await expr2.reduce(vm));
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
    this.arg = new Lazy(raw, PARSER99);
  }
  async *run(vm) {
    return {
      type: "return",
      value: [await this.arg.get().reduce(vm)]
    };
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/reuselastline.js
var PARSER100 = arg1R0(form[""]);
var ReuseLastLine = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER100);
  }
  async *run(vm) {
    const value = await this.arg.get()?.reduce(vm) ?? "";
    string(value, "Argument of REUSELASTLINE must be a string");
    yield* vm.printer.print(value, /* @__PURE__ */ new Set(["S"]));
    vm.printer.isLineTemp = true;
    return null;
  }
};

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
  async build(vm) {
    if (this.value != null && this.value.length === 0 && this.type === "number") {
      const value = await this.value[0].reduce(vm);
      bigint(value, "Default value for 0D #DIM must be a number");
      return new Int0DValue(this.name).reset(value);
    } else if (this.value != null && this.value.length === 0 && this.type === "string") {
      const value = await this.value[0].reduce(vm);
      string(value, "Default value for 0D #DIMS must be a string");
      return new Str0DValue(this.name).reset(value);
    } else if (this.value != null && this.value.length === 1 && this.type === "number") {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
      bigintArray(value, "Default value for 1D #DIM must be a number array");
      return new Int1DValue(this.name, [value.length]).reset(value);
    } else if (this.value != null && this.value.length === 1 && this.type === "string") {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
      strArray(value, "Default value for 1D #DIMS must be a string array");
      return new Str1DValue(this.name, [value.length]).reset(value);
    } else if (this.value != null && this.value.length > 1 && this.type === "number" && this.size.length <= 1 && !this.isChar()) {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
      bigintArray(value, "Default value for 1D #DIM must be a number array");
      let length = value.length;
      if (this.size.length === 1) {
        const size = await this.size[0].reduce(vm);
        bigint(size, "Size of an array must be an integer");
        length = Math.max(Number(size), value.length);
      }
      return new Int1DValue(this.name, [length]).reset(value);
    } else if (this.value != null && this.value.length > 1 && this.type === "string" && this.size.length <= 1 && !this.isChar()) {
      const value = await Promise.all(this.value.map((v) => v.reduce(vm)));
      strArray(value, "Default value for 1D #DIMS must be a string array");
      let length = value.length;
      if (this.size.length === 1) {
        const size = await this.size[0].reduce(vm);
        bigint(size, "Size of an array must be an integer");
        length = Math.max(Number(size), value.length);
      }
      return new Str1DValue(this.name, [length]).reset(value);
    } else if (this.size.length === 0 && this.type === "number" && !this.isChar()) {
      return new Int0DValue(this.name);
    } else if (this.size.length === 0 && this.type === "string" && !this.isChar()) {
      return new Str0DValue(this.name);
    } else if (this.size.length === 1 && this.type === "number" && !this.isChar()) {
      const size = await this.size[0].reduce(vm);
      bigint(size, "Size of an array must be an integer");
      return new Int1DValue(this.name, [Number(size)]);
    } else if (this.size.length === 1 && this.type === "string" && !this.isChar()) {
      const size = await this.size[0].reduce(vm);
      bigint(size, "Size of an array must be an integer");
      return new Str1DValue(this.name, [Number(size)]);
    } else if (this.size.length === 2 && this.type === "number" && !this.isChar()) {
      const size0 = await this.size[0].reduce(vm);
      bigint(size0, "Size of an array must be an integer");
      const size1 = await this.size[1].reduce(vm);
      bigint(size1, "Size of an array must be an integer");
      return new Int2DValue(this.name, [Number(size0), Number(size1)]);
    } else if (this.size.length === 3 && this.type === "number" && !this.isChar()) {
      const size0 = await this.size[0].reduce(vm);
      bigint(size0, "Size of an array must be an integer");
      const size1 = await this.size[1].reduce(vm);
      bigint(size1, "Size of an array must be an integer");
      const size2 = await this.size[2].reduce(vm);
      bigint(size2, "Size of an array must be an integer");
      return new Int3DValue(this.name, [Number(size0), Number(size1), Number(size2)]);
    } else if (this.size.length === 0 && this.type === "number" && this.isChar()) {
      return new IntChar0DValue(this.name);
    } else if (this.size.length === 1 && this.type === "number" && this.isChar()) {
      const size0 = await this.size[0].reduce(vm);
      bigint(size0, "Size of an array must be an integer");
      return new IntChar1DValue(this.name, [Number(size0)]);
    } else if (this.size.length === 0 && this.type === "string" && this.isChar()) {
      return new StrChar0DValue(this.name);
    } else if (this.size.length === 1 && this.type === "string" && this.isChar()) {
      const size0 = await this.size[0].reduce(vm);
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
    this.arg = new Lazy(raw, PARSER101);
  }
  async *run(vm) {
    const [indexExpr, commentExpr] = this.arg.get();
    const index = await indexExpr.reduce(vm);
    bigint(index, "1st argument of SAVEDATA must be a number");
    const comment = await commentExpr.reduce(vm);
    string(comment, "2nd argument of SAVEDATA must be a string");
    const saveData = {
      code: vm.code.csv.gamebase.code ?? 0,
      version: vm.code.csv.gamebase.version ?? 0,
      data: {
        comment,
        characters: [],
        variables: {}
      }
    };
    for (let i = 0; i < vm.characterList.length; ++i) {
      saveData.data.characters.push({});
    }
    const nameList = [...whitelist];
    for (const property of vm.code.header) {
      if (property instanceof Dim && property.isSave() && !property.isGlobal()) {
        nameList.push(property.name);
      }
    }
    for (const name of nameList) {
      const cell = vm.getValue(name);
      if (cell instanceof Int0DValue) {
        saveData.data.variables[name] = cell.value.toString();
      } else if (cell instanceof Int1DValue) {
        saveData.data.variables[name] = cell.value.map((value) => value.toString());
      } else if (cell instanceof Int2DValue) {
        saveData.data.variables[name] = cell.value.map((value0) => value0.map((value1) => value1.toString()));
      } else if (cell instanceof Int3DValue) {
        saveData.data.variables[name] = cell.value.map((value0) => value0.map((value1) => value1.map((value2) => value2.toString())));
      } else if (cell instanceof Str0DValue || cell instanceof Str1DValue) {
        saveData.data.variables[name] = cell.value;
      } else if (cell instanceof IntChar0DValue) {
        for (let i = 0; i < vm.characterList.length; ++i) {
          const characterCell = vm.characterList[i].getValue(name);
          saveData.data.characters[i][name] = characterCell.value.toString();
        }
      } else if (cell instanceof IntChar1DValue) {
        for (let i = 0; i < vm.characterList.length; ++i) {
          const characterCell = vm.characterList[i].getValue(name);
          saveData.data.characters[i][name] = characterCell.value.map((value) => value.toString());
        }
      } else if (cell instanceof StrChar0DValue || cell instanceof StrChar1DValue) {
        for (let i = 0; i < vm.characterList.length; ++i) {
          const characterCell = vm.characterList[i].getValue(name);
          saveData.data.characters[i][name] = characterCell.value;
        }
      }
    }
    await vm.external.setSavedata(savefile.game(Number(index)), JSON.stringify(saveData));
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
  async *run(vm) {
    const saveData = {
      code: vm.code.csv.gamebase.code ?? 0,
      version: vm.code.csv.gamebase.version ?? 0,
      data: {}
    };
    saveData.data.GLOBAL = vm.getValue("GLOBAL").value.map((value) => value.toString());
    saveData.data.GLOBALS = vm.getValue("GLOBALS").value;
    for (const property of vm.code.header) {
      if (property instanceof Dim && property.isSave() && property.isGlobal()) {
        const cell = vm.getValue(property.name);
        if (cell instanceof Int0DValue) {
          saveData.data[property.name] = cell.value.toString();
        } else if (cell instanceof Int1DValue) {
          saveData.data[property.name] = cell.value.map((value) => value.toString());
        } else if (cell instanceof Int2DValue) {
          saveData.data[property.name] = cell.value.map((value0) => value0.map((value1) => value1.toString()));
        } else if (cell instanceof Int3DValue) {
          saveData.data[property.name] = cell.value.map((value0) => value0.map((value1) => value1.map((value2) => value2.toString())));
        } else if (cell instanceof Str0DValue) {
          saveData.data[property.name] = cell.value;
        } else if (cell instanceof Str1DValue) {
          saveData.data[property.name] = cell.value;
        }
      }
    }
    await vm.external.setSavedata(savefile.global, JSON.stringify(saveData));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setbgcolor.js
var import_parsimmon11 = __toESM(require_parsimmon());
var PARSER104 = import_parsimmon11.default.alt(arg3R3(expr, expr, expr), arg1R1(expr));
var SetBgColor = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER104);
  }
  async *run(vm) {
    const parsed = this.arg.get();
    let color;
    if (Array.isArray(parsed)) {
      const r = await parsed[0].reduce(vm);
      const g = await parsed[1].reduce(vm);
      const b = await parsed[2].reduce(vm);
      bigint(r, "1st argument of SETBGCOLOR must be an integer");
      bigint(g, "2nd argument of SETBGCOLOR must be an integer");
      bigint(b, "3rd argument of SETBGCOLOR must be an integer");
      color = r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
    } else {
      const rgb = await parsed.reduce(vm);
      bigint(rgb, "Argument of SETBGCOLOR must be an integer");
      color = rgb.toString(16).padStart(6, "0");
    }
    vm.printer.background = color;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setbgcolorbyname.js
var PARSER105 = arg1R1(charSeq());
var SetBgColorByName = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER105);
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
    this.arg = new Lazy(raw, PARSER106);
  }
  async *run(vm) {
    const [destExpr, ...bitExpr] = this.arg.get();
    const dest = destExpr.getCell(vm);
    const value = await destExpr.reduce(vm);
    bigint(value, "1st argument of SETBIT must be a number");
    const bitList = [];
    for (let i = 0; i < bitExpr.length; ++i) {
      const bit = await bitExpr[i].reduce(vm);
      bigint(bit, `${i + 2}th argument of INVERTBIT must be a number`);
      bitList.push(bit);
    }
    let result = value;
    for (const bit of bitList) {
      result |= 1n << bit;
    }
    dest.set(vm, result, await destExpr.reduceIndex(vm));
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setcolor.js
var import_parsimmon12 = __toESM(require_parsimmon());
var PARSER107 = import_parsimmon12.default.alt(arg3R3(expr, expr, expr), arg1R1(expr));
var SetColor = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER107);
  }
  async *run(vm) {
    const parsed = this.arg.get();
    let color;
    if (Array.isArray(parsed)) {
      const r = await parsed[0].reduce(vm);
      const g = await parsed[1].reduce(vm);
      const b = await parsed[2].reduce(vm);
      bigint(r, "1st argument of SETCOLOR must be an integer");
      bigint(g, "2nd argument of SETCOLOR must be an integer");
      bigint(b, "3rd argument of SETCOLOR must be an integer");
      color = r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
    } else {
      const rgb = await parsed.reduce(vm);
      bigint(rgb, "Argument of SETCOLOR must be an integer");
      color = rgb.toString(16).padStart(6, "0");
    }
    vm.printer.color = color;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/setcolorbyname.js
var PARSER108 = arg1R1(charSeq());
var SetColorByName = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER108);
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
    this.arg = new Lazy(raw, PARSER109);
  }
  async *run(vm) {
    const font = await this.arg.get()?.reduce(vm) ?? "";
    string(font, "Argument of SETFONT must be a string");
    vm.printer.font.name = font;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/skipdisp.js
var PARSER110 = arg1R1(expr);
var SkipDisp = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER110);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    bigint(value, "Argument of SKIPDISP must be a number");
    vm.printer.skipDisp = value !== 0n;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/sortchara.js
var PARSER111 = arg2R0(variable, alt("FORWARD", "BACK"));
var SortChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER111);
  }
  async *run(vm) {
    let [varExpr, order] = this.arg.get();
    varExpr = varExpr ?? new Variable("NO", []);
    order = order ?? "FORWARD";
    const cell = varExpr.getCell(vm);
    const target = vm.getValue("TARGET").get(vm, []);
    const assi = vm.getValue("ASSI").get(vm, []);
    const master = vm.getValue("MASTER").get(vm, []);
    const characterList = vm.characterList.map((character, index) => ({ character, index }));
    if (master >= 0) {
      characterList.splice(Number(master), 1);
    }
    if (cell instanceof IntChar0DValue) {
      characterList.sort((a, b) => {
        const left = cell.get(vm, [a.index]);
        const right = cell.get(vm, [b.index]);
        const compare = Number(left - right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else if (cell instanceof IntChar1DValue) {
      const index = await varExpr.reduceIndex(vm);
      characterList.sort((a, b) => {
        const left = cell.get(vm, [a.index, ...index]);
        const right = cell.get(vm, [b.index, ...index]);
        const compare = Number(left - right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else if (cell instanceof StrChar0DValue) {
      characterList.sort((a, b) => {
        const left = cell.get(vm, [a.index]);
        const right = cell.get(vm, [b.index]);
        const compare = left.localeCompare(right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else if (cell instanceof StrChar1DValue) {
      const index = await varExpr.reduceIndex(vm);
      characterList.sort((a, b) => {
        const left = cell.get(vm, [a.index, ...index]);
        const right = cell.get(vm, [b.index, ...index]);
        const compare = left.localeCompare(right);
        return order === "FORWARD" ? compare : -compare;
      });
    } else {
      throw misc("Sort key of SORTCHARA is not a character variable");
    }
    for (let i = 0; i < characterList.length; ++i) {
      if (characterList[i].index === Number(target)) {
        vm.getValue("TARGET").set(vm, BigInt(i), []);
      }
      if (characterList[i].index === Number(assi)) {
        vm.getValue("ASSI").set(vm, BigInt(i), []);
      }
    }
    if (master >= 0) {
      characterList.splice(Number(master), 0, {
        character: vm.characterList[Number(master)],
        index: -1
      });
    }
    vm.characterList = characterList.map(({ character }) => character);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/split.js
var PARSER112 = arg3R3(expr, expr, variable);
var Split = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER112);
  }
  async *run(vm) {
    const [valueExpr, sepExpr, destExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm);
    string(value, "1st argument of SPLIT must be a string!");
    const sep = await sepExpr.reduce(vm);
    string(sep, "2nd argument of SPLIT must be a number!");
    const dest = destExpr.getCell(vm);
    const index = await destExpr.reduceIndex(vm);
    const chunkList = value.split(sep);
    for (let i = 0; i < chunkList.length; ++i) {
      dest.set(vm, chunkList[i], [...index, i]);
    }
    vm.getValue("RESULT").set(vm, BigInt(chunkList.length), [0]);
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
    this.arg = new Lazy(raw, PARSER115);
  }
  async *run(vm) {
    const [valueExpr, searchExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm);
    string(value, "1st argument of STRFIND must be a string!");
    const search = await searchExpr.reduce(vm);
    string(search, "2nd argument of STRFIND must be a string!");
    vm.getValue("RESULT").set(vm, BigInt(value.indexOf(search)), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strfindu.js
var PARSER116 = arg2R2(expr, expr);
var StrFindU = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER116);
  }
  async *run(vm) {
    const [valueExpr, searchExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm);
    string(value, "1st argument of STRFINDU must be a string!");
    const search = await searchExpr.reduce(vm);
    string(search, "2nd argument of STRFINDU must be a string!");
    vm.getValue("RESULT").set(vm, BigInt(value.indexOf(search)), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlen.js
var PARSER117 = arg1R1(charSeq());
var StrLen = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER117);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm) {
    const value = this.arg.get();
    string(value, "Argument of STRLEN must be a string!");
    vm.getValue("RESULT").set(vm, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlenform.js
var PARSER118 = arg1R1(form[""]);
var StrLenForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER118);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    string(value, "Argument of STRLENFORM must be a string!");
    vm.getValue("RESULT").set(vm, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlenformu.js
var PARSER119 = arg1R1(form[""]);
var StrLenFormU = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER119);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
    string(value, "Argument of STRLENFORMU must be a string!");
    vm.getValue("RESULT").set(vm, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/strlenu.js
var PARSER120 = arg1R1(charSeq());
var StrLen2 = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER120);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm) {
    const value = this.arg.get();
    string(value, "Argument of STRLENU must be a string!");
    vm.getValue("RESULT").set(vm, BigInt(value.length), [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/substring.js
var PARSER121 = arg3R3(expr, expr, expr);
var Substring = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER121);
  }
  async *run(vm) {
    const [valueExpr, startExpr, endExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm);
    string(value, "1st argument of SUBSTRING must be a string!");
    const start = await startExpr.reduce(vm);
    bigint(start, "2nd argument of SUBSTRING must be a number!");
    const end = await endExpr.reduce(vm);
    bigint(end, "3rd argument of SUBSTRING must be a number!");
    if (end < 0) {
      vm.getValue("RESULTS").set(vm, value.slice(Number(start)), [0]);
    } else {
      vm.getValue("RESULTS").set(vm, value.slice(Number(start), Number(end)), [0]);
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
    this.arg = new Lazy(raw, PARSER122);
  }
  async *run(vm) {
    const [valueExpr, startExpr, endExpr] = this.arg.get();
    const value = await valueExpr.reduce(vm);
    string(value, "1st argument of SUBSTRINGU must be a string!");
    const start = await startExpr.reduce(vm);
    bigint(start, "2nd argument of SUBSTRINGU must be a number!");
    const end = await endExpr.reduce(vm);
    bigint(end, "3rd argument of SUBSTRINGU must be a number!");
    if (end < 0) {
      vm.getValue("RESULTS").set(vm, value.slice(Number(start)), [0]);
    } else {
      vm.getValue("RESULTS").set(vm, value.slice(Number(start), Number(end)), [0]);
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
    this.arg = new Lazy(raw, PARSER123);
  }
  async *run(vm) {
    const [leftExpr, rightExpr] = this.arg.get();
    const left = leftExpr.getCell(vm);
    const leftIndex = await leftExpr.reduceIndex(vm);
    const right = rightExpr.getCell(vm);
    const rightIndex = await rightExpr.reduceIndex(vm);
    const leftValue = left.get(vm, leftIndex);
    const rightValue = right.get(vm, rightIndex);
    left.set(vm, rightValue, leftIndex);
    right.set(vm, leftValue, rightIndex);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/swapchara.js
var PARSER124 = arg2R2(expr, expr);
var SwapChara = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER124);
  }
  async *run(vm) {
    const [leftExpr, rightExpr] = this.arg.get();
    const left = await leftExpr.reduce(vm);
    bigint(left, "1st argument of SWAPCHARA must be a number");
    const right = await rightExpr.reduce(vm);
    bigint(right, "2nd argument of SWAPCHARA must be a number");
    const temp = vm.characterList[Number(left)];
    vm.characterList[Number(left)] = vm.characterList[Number(right)];
    vm.characterList[Number(right)] = temp;
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/throw.js
var PARSER125 = arg1R1(form[""]);
var Throw = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER125);
  }
  async *run(vm) {
    const value = await this.arg.get().reduce(vm);
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
    this.arg = new Lazy(raw, PARSER126);
  }
  async *run(vm) {
    const [dest, value] = this.arg.get();
    const original = await dest.reduce(vm);
    bigint(original, "1st argument of TIMES must be a number");
    const index = await dest.reduceIndex(vm);
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
    dest.getCell(vm).set(vm, result, index);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tinput.js
var PARSER127 = arg4R2(expr, expr, expr, charSeq());
var TInput = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER127);
  }
  async *run(vm) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm);
    bigint(timeout, "1st argument of TINPUT should be a number");
    const def = await defExpr.reduce(vm);
    bigint(def, "2nd argument of TINPUT should be a number");
    const show = await showExpr?.reduce(vm) ?? 0n;
    bigint(show, "3rd argument of TINPUT should be a number");
    const input = yield* vm.printer.tinput(true, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = BigInt(input);
    }
    yield* vm.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULT").set(vm, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tinputs.js
var PARSER128 = arg4R2(expr, expr, expr, charSeq());
var TInputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER128);
  }
  async *run(vm) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm);
    bigint(timeout, "1st argument of TINPUTS should be a number");
    const def = await defExpr.reduce(vm);
    string(def, "2nd argument of TINPUTS should be a string");
    const show = await showExpr?.reduce(vm) ?? 0n;
    bigint(show, "3rd argument of TINPUTS should be a number");
    const input = yield* vm.printer.tinput(false, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = input;
    }
    yield* vm.printer.print(value, /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULTS").set(vm, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/toneinput.js
var PARSER129 = arg4R2(expr, expr, expr, charSeq());
var TOneInput = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER129);
  }
  async *run(vm) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm);
    bigint(timeout, "1st argument of TONEINPUT should be a number");
    const def = await defExpr.reduce(vm);
    bigint(def, "2nd argument of TONEINPUT should be a number");
    const show = await showExpr?.reduce(vm) ?? 0n;
    bigint(show, "3rd argument of TONEINPUT should be a number");
    const input = yield* vm.printer.tinput(true, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = BigInt(input[0]);
    }
    yield* vm.printer.print(value.toString(), /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULT").set(vm, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/toneinputs.js
var PARSER130 = arg4R2(expr, expr, expr, charSeq());
var TOneInputS = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER130);
  }
  async *run(vm) {
    const [timeoutExpr, defExpr, showExpr, message] = this.arg.get();
    const timeout = await timeoutExpr.reduce(vm);
    bigint(timeout, "1st argument of TONEINPUTS should be a number");
    const def = await defExpr.reduce(vm);
    string(def, "2nd argument of TONEINPUTS should be a string");
    const show = await showExpr?.reduce(vm) ?? 0n;
    bigint(show, "3rd argument of TONEINPUTS should be a number");
    const input = yield* vm.printer.tinput(false, Number(timeout), show === 1n);
    let value;
    if (input == null) {
      if (message != null) {
        yield* vm.printer.print(message, /* @__PURE__ */ new Set(["S"]));
      }
      value = def;
    } else {
      value = input;
    }
    yield* vm.printer.print(value, /* @__PURE__ */ new Set(["S"]));
    vm.getValue("RESULTS").set(vm, value, [0]);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycall.js
var TryCall = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, Call.PARSER);
  }
  async *run(vm) {
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm.fnMap.has(realTarget)) {
      return yield* Call.exec(vm, realTarget, argExpr);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trycallform.js
var TryCallForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, CallForm.PARSER("(,"));
  }
  async *run(vm) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm)).toUpperCase();
    if (vm.fnMap.has(target)) {
      return yield* Call.exec(vm, target, argExpr);
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
    this.arg = new Lazy(raw, Call.PARSER);
    this.thenThunk = thenThunk;
    this.catchThunk = catchThunk;
  }
  async *run(vm, label) {
    if (label != null && this.thenThunk.labelMap.has(label)) {
      return yield* this.thenThunk.run(vm, label);
    }
    if (label != null && this.catchThunk.labelMap.has(label)) {
      return yield* this.catchThunk.run(vm, label);
    }
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm.fnMap.has(realTarget)) {
      yield* Call.exec(vm, realTarget, argExpr);
      return yield* this.thenThunk.run(vm, label);
    } else {
      return yield* this.catchThunk.run(vm, label);
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
    this.arg = new Lazy(raw, CallForm.PARSER(""));
    this.thenThunk = thenThunk;
    this.catchThunk = catchThunk;
  }
  async *run(vm, label) {
    if (label != null && this.thenThunk.labelMap.has(label)) {
      return yield* this.thenThunk.run(vm, label);
    }
    if (label != null && this.catchThunk.labelMap.has(label)) {
      return yield* this.catchThunk.run(vm, label);
    }
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm)).toUpperCase();
    if (vm.fnMap.has(target)) {
      yield* Call.exec(vm, target, argExpr);
      return yield* this.thenThunk.run(vm, label);
    } else {
      return yield* this.catchThunk.run(vm, label);
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
    this.arg = new Lazy(raw, PARSER131);
    this.catchThunk = catchThunk;
  }
  async *run(vm, label) {
    const target = this.arg.get().toUpperCase();
    const context = vm.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm, target);
    } else {
      return yield* this.catchThunk.run(vm, label);
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
    this.arg = new Lazy(raw, PARSER132);
    this.catchThunk = catchThunk;
  }
  async *run(vm, label) {
    const target = (await this.arg.get().reduce(vm)).toUpperCase();
    const context = vm.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm, target);
    } else {
      return yield* this.catchThunk.run(vm, label);
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
    this.arg = new Lazy(raw, Call.PARSER);
    this.catchExpr = catchExpr;
  }
  async *run(vm, label) {
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm.fnMap.has(realTarget)) {
      return yield* Jump.exec(vm, realTarget, argExpr);
    } else {
      return yield* this.catchExpr.run(vm, label);
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
    this.arg = new Lazy(raw, CallForm.PARSER(""));
    this.catchThunk = catchThunk;
  }
  async *run(vm, label) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm)).toUpperCase();
    if (vm.fnMap.has(target)) {
      return yield* Jump.exec(vm, target, argExpr);
    } else {
      return yield* this.catchThunk.run(vm, label);
    }
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/trygoto.js
var PARSER133 = arg1R1(Identifier);
var TryGoto = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, PARSER133);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async *run(vm) {
    const target = this.arg.get().toUpperCase();
    const context = vm.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm, target);
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
    this.arg = new Lazy(raw, PARSER134);
  }
  async *run(vm) {
    const target = (await this.arg.get().reduce(vm)).toUpperCase();
    const context = vm.context();
    if (context.fn.thunk.labelMap.has(target)) {
      return yield* Goto.exec(vm, target);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tryjump.js
var TryJump = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, Call.PARSER);
  }
  async *run(vm) {
    const [target, argExpr] = this.arg.get();
    const realTarget = target.toUpperCase();
    if (vm.fnMap.has(realTarget)) {
      return yield* Jump.exec(vm, realTarget, argExpr);
    }
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/statement/command/tryjumpform.js
var TryJumpForm = class extends Statement {
  arg;
  constructor(raw) {
    super(raw);
    this.arg = new Lazy(raw, CallForm.PARSER("("));
  }
  async *run(vm) {
    const [targetExpr, argExpr] = this.arg.get();
    const target = (await targetExpr.reduce(vm)).toUpperCase();
    if (vm.fnMap.has(target)) {
      return yield* Jump.exec(vm, target, argExpr);
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
  async *run(vm) {
    const length = Math.min(vm.getValue("PALAM").length(1), vm.getValue("UP").length(0), vm.getValue("DOWN").length(0));
    for (let i = 0; i < length; ++i) {
      const up = vm.getValue("UP").get(vm, [i]);
      const down = vm.getValue("DOWN").get(vm, [i]);
      const palam = vm.getValue("PALAM").get(vm, [i]);
      if (up <= 0 && down <= 0) {
        continue;
      }
      const result = palam + up - down;
      vm.getValue("PALAM").set(vm, result, [i]);
      vm.getValue("UP").set(vm, 0n, [i]);
      vm.getValue("DOWN").set(vm, 0n, [i]);
      if (!vm.printer.skipDisp) {
        const name = vm.code.csv.palam.get(i);
        let text = `${name} ${palam}`;
        if (up > 0) {
          text += `+${up}`;
        }
        if (down > 0) {
          text += `-${down}`;
        }
        text += `=${result}`;
        yield* vm.printer.print(text, /* @__PURE__ */ new Set(["L"]));
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
    this.arg = new Lazy(raw, PARSER136);
  }
  async *run(vm) {
    const [destExpr, valueExpr, startExpr, endExpr] = this.arg.get();
    const dest = destExpr.getCell(vm);
    const index = await destExpr.reduceIndex(vm);
    const start = await startExpr?.reduce(vm) ?? 0n;
    bigint(start, "3rd argument of VARSET must be a number");
    const end = await endExpr?.reduce(vm) ?? BigInt(dest.length(index.length));
    bigint(end, "4th argument of VARSET must be a number");
    if (valueExpr != null) {
      const value = await valueExpr.reduce(vm);
      dest.rangeSet(vm, value, index, [Number(start), Number(end)]);
    } else {
      if (dest.type === "number") {
        dest.rangeSet(vm, 0n, index, [Number(start), Number(end)]);
      } else {
        dest.rangeSet(vm, "", index, [Number(start), Number(end)]);
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
  async *run(vm) {
    yield* vm.printer.wait(false);
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
  async *run(vm) {
    yield* vm.printer.wait(true);
    return null;
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/slice.js
var Slice = class _Slice {
  file;
  // NOTE: `line` is 0-indexed
  line;
  from;
  to;
  content;
  constructor(file, line, content, from, to) {
    this.file = file;
    this.line = line;
    this.content = content;
    this.from = from ?? 0;
    this.to = to ?? content.length;
  }
  slice(from, to) {
    const newFrom = this.from + (from ?? 0);
    let newTo;
    if (to == null) {
      newTo = this.to;
    } else {
      newTo = Math.min(this.to, this.from + to);
    }
    return new _Slice(this.file, this.line, this.content, newFrom, newTo);
  }
  get() {
    return this.content.slice(this.from, this.to);
  }
  length() {
    return this.to - this.from;
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
  return converted.map((content, index) => new Slice("", index, content));
}
function preprocess(lines, macros) {
  const fn = [
    // Strip comments
    (prev) => prev.map((line) => new Slice("", line.line, line.content.replace(/;.*$/, ""))),
    // Trim whitespaces
    (prev) => prev.map((line) => new Slice("", line.line, line.content.trim())),
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
          result.push(new Slice(subLines[0].file, subLines[0].line, subLines.map((l) => l.content).join("")));
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
var import_parsimmon13 = __toESM(require_parsimmon());

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
  apply(vm, fn) {
    vm.staticMap.get(fn).set("LOCAL", new Int1DValue("LOCAL", [this.size]));
  }
};

// ../../.my_agent_remote/undercrow__eraJS/build/property/localssize.js
var LocalSSize = class {
  size;
  constructor(size) {
    this.size = size;
  }
  apply(vm, fn) {
    vm.staticMap.get(fn).set("LOCALS", new Str1DValue("LOCALS", [this.size]));
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
function parseERB(files, macros) {
  const result = [];
  const globals = [];
  for (const [name, content] of files) {
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
function parseERH(files, macros) {
  const result = [];
  for (const [name, content] of files) {
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
var import_parsimmon15 = __toESM(require_parsimmon());
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
    if (flags.has("S") && this.chunks.length > 0) {
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
    if (flags.has("S") || flags.has("L") || flags.has("W")) {
      yield* this.newline();
    }
    if (flags.has("W")) {
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
async function* runScene(vm, scene) {
  const generator = scene();
  while (true) {
    const next = generator.next();
    if (next.done === true) {
      return null;
    }
    const result = yield* vm.run(next.value);
    if (result != null && result.type !== "return") {
      return result;
    }
  }
}
function* eventStatement(vm, target) {
  for (const fn of vm.eventMap.get(target) ?? []) {
    yield {
      raw: new Slice(FILE, 0, "CALL " + target, "CALL".length),
      run: async function* () {
        return yield* fn.run(vm, []);
      }
    };
  }
}
function shopInputDispatch() {
  return {
    raw: new Slice(FILE, 0, "SHOP_INPUT", 0),
    run: async function* (vm) {
      const result = Number(vm.getValue("RESULT").get(vm, [0]));
      const shopItemCount = 100;
      if (Number.isInteger(result) && result >= 0 && result < shopItemCount) {
        const sales = vm.getValue("ITEMSALES").get(vm, [result]);
        const price = vm.getValue("ITEMPRICE").get(vm, [result]);
        const money = vm.getValue("MONEY").get(vm, []);
        if (sales !== 0n && money >= price) {
          vm.getValue("BOUGHT").set(vm, BigInt(result), []);
          const item = vm.getValue("ITEM");
          item.set(vm, item.get(vm, [result]) + 1n, [result]);
          vm.getValue("MONEY").set(vm, money - price, []);
          if (vm.eventMap.has("EVENTBUY")) {
            for (const fn of vm.eventMap.get("EVENTBUY") ?? []) {
              const ev = yield* fn.run(vm, []);
              if (ev != null && ev.type !== "return") return ev;
            }
          } else if (vm.fnMap.has("EVENTBUY")) {
            const ev = yield* vm.run(new Call(new Slice(FILE, 0, "CALL EVENTBUY", "CALL".length)));
            if (ev != null) return ev;
          }
        }
        return null;
      }
      return yield* vm.run(new Call(new Slice(FILE, 0, "CALL USERSHOP", "CALL".length)));
    }
  };
}
function* MAIN() {
  while (true) {
    yield new Call(new Slice(FILE, 0, "CALL SHOW_SHOP", "CALL".length));
    yield new Input(new Slice(FILE, 0, "INPUT", "INPUT".length));
    yield shopInputDispatch();
  }
}
async function* SHOP(vm) {
  return yield* runScene(vm, function* () {
    yield* eventStatement(vm, "EVENTSHOP");
    if (vm.fnMap.has("SYSTEM_AUTOSAVE")) {
      yield new Call(new Slice(FILE, 0, "CALL SYSTEM_AUTOSAVE", "CALL".length));
    } else {
      const now = (0, import_dayjs4.default)(vm.external.getTime());
      vm.getValue("SAVEDATA_TEXT").set(vm, now.format("YYYY/MM/DD HH:mm:ss"), []);
      yield new Call(new Slice(FILE, 0, "CALL SAVEINFO", "CALL".length));
      yield new SaveData(new Slice(FILE, 0, "SAVEDATA 99, SAVEDATA_TEXT", "SAVEDATA".length));
    }
    yield* MAIN();
  });
}
async function* TRAIN(vm) {
  return yield* runScene(vm, function* () {
    vm.getValue("ASSIPLAY").set(vm, 0n, []);
    vm.getValue("PREVCOM").set(vm, -1n, []);
    vm.getValue("NEXTCOM").set(vm, -1n, []);
    vm.getValue("TFLAG").reset([]);
    vm.getValue("TSTR").reset([]);
    for (const character of vm.characterList) {
      character.getValue("GOTJUEL").reset([]);
      character.getValue("TEQUIP").reset([]);
      character.getValue("EX").reset([]);
      character.getValue("STAIN").reset([0, 0, 2, 1, 8]);
      character.getValue("PALAM").reset([]);
      character.getValue("SOURCE").reset([]);
      character.getValue("TCVAR").reset([]);
    }
    yield* eventStatement(vm, "EVENTTRAIN");
    while (true) {
      const nextCom = vm.getValue("NEXTCOM").get(vm, []);
      if (nextCom >= 0) {
        vm.getValue("SELECTCOM").set(vm, nextCom, []);
        vm.getValue("NEXTCOM").set(vm, 0n, []);
      } else {
        const comAble = /* @__PURE__ */ new Set();
        yield new Call(new Slice(FILE, 0, "CALL SHOW_STATUS", "CALL".length));
        const trainIds = [...vm.code.csv.train.keys()];
        trainIds.sort((a, b) => a - b);
        for (let i = 0; i < trainIds.length; ++i) {
          const id = trainIds[i];
          vm.getValue("RESULT").set(vm, 1n, []);
          if (vm.fnMap.has(`COM_ABLE${id}`)) {
            yield new Call(new Slice(FILE, 0, `CALL COM_ABLE${id}`, "CALL".length));
          }
          if (vm.getValue("RESULT").get(vm, []) !== 0n) {
            comAble.add(id);
            const name = vm.code.csv.train.get(id);
            const idString = id.toString().padStart(3, " ");
            yield new PrintC("RIGHT", [], new Slice(FILE, 0, `PRINTC ${name}[${idString}]`, "PRINTC".length));
            if (i % vm.printCPerLine === 0) {
              yield new Print(["L"], new Slice(FILE, 0, "PRINTL", "PRINTL".length));
            }
          }
        }
        yield new Call(new Slice(FILE, 0, "CALL SHOW_USERCOM", "CALL".length));
        yield new Input(new Slice(FILE, 0, "INPUT", "INPUT".length));
        const input = vm.getValue("RESULT").get(vm, [0]);
        if (comAble.has(Number(input))) {
          vm.getValue("SELECTCOM").set(vm, input, []);
        } else {
          vm.getValue("SELECTCOM").set(vm, -1n, []);
        }
      }
      while (true) {
        let wait = false;
        const selectCom = vm.getValue("SELECTCOM").get(vm, []);
        if (selectCom >= 0) {
          vm.getValue("UP").reset([]);
          vm.getValue("DOWN").reset([]);
          vm.getValue("LOSEBASE").reset([]);
          for (const character of vm.characterList) {
            character.getValue("DOWNBASE").reset([]);
            character.getValue("SOURCE").reset([]);
            character.getValue("NOWEX").reset([]);
          }
          yield* eventStatement(vm, "EVENTCOM");
          yield new Call(new Slice(FILE, 0, `CALL COM${selectCom}`, "CALL".length));
          if (vm.getValue("RESULT").get(vm, [0]) !== 0n) {
            wait = true;
            yield new Call(new Slice(FILE, 0, "CALL SOURCE_CHECK", "CALL".length));
            for (const character of vm.characterList) {
              character.getValue("SOURCE").reset([]);
            }
            yield* eventStatement(vm, "EVENTCOMEND");
          }
        } else {
          yield new Call(new Slice(FILE, 0, "CALL USERCOM", "CALL".length));
        }
        if (wait) {
          yield new Wait(new Slice(FILE, 0, "WAIT", "WAIT".length));
        }
        break;
      }
    }
  });
}
async function* AFTERTRAIN(vm) {
  return yield* runScene(vm, function* () {
    vm.printer.skipDisp = false;
    yield* eventStatement(vm, "EVENTEND");
  });
}
async function* ABLUP(vm) {
  return yield* runScene(vm, function* () {
    while (true) {
      vm.printer.skipDisp = false;
      yield new Call(new Slice(FILE, 0, "CALL SHOW_JUEL", "CALL".length));
      yield new Call(new Slice(FILE, 0, "CALL SHOW_ABLUP_SELECT", "CALL".length));
      yield new Input(new Slice(FILE, 0, "INPUT", "INPUT".length));
      const input = vm.getValue("RESULT").get(vm, []);
      if (input >= 0 && input < 100) {
        yield new TryCall(new Slice(FILE, 0, `TRYCALL ABLUP${input}`, "TRYCALL".length));
      } else {
        yield new Call(new Slice(FILE, 0, "CALL USERABLUP", "CALL".length));
      }
    }
  });
}
async function* TURNEND(vm) {
  return yield* runScene(vm, function* () {
    vm.printer.skipDisp = false;
    yield* eventStatement(vm, "EVENTTURNEND");
  });
}
async function* FIRST(vm) {
  return yield* runScene(vm, function* () {
    yield* eventStatement(vm, "EVENTFIRST");
  });
}
async function* TITLE(vm) {
  return yield* runScene(vm, function* () {
    yield new Call(new Slice(FILE, 0, "CALL SYSTEM_TITLE", "CALL".length));
  });
}
async function* DATALOADED(vm) {
  return yield* runScene(vm, function* () {
    yield new TryCall(new Slice(FILE, 0, "TRYCALL SYSTEM_LOADEND", "TRYCALL".length));
    yield* eventStatement(vm, "EVENTLOAD");
    yield* MAIN();
  });
}
var SAVE_SLOT_COUNT = 20;
var SAVE_CANCEL = 100;
function beginScene(keyword) {
  return {
    raw: new Slice(FILE, 0, "BEGIN " + keyword, "BEGIN".length),
    run: async function* () {
      return { type: "begin", keyword };
    }
  };
}
function slotMenu(vm, title) {
  return {
    raw: new Slice(FILE, 0, "PRINTL " + title, "PRINTL".length),
    run: async function* () {
      yield* vm.printer.print("------------------------", /* @__PURE__ */ new Set(["L"]));
      yield* vm.printer.print(title, /* @__PURE__ */ new Set(["L"]));
      for (let i = 0; i < SAVE_SLOT_COUNT; ++i) {
        const raw = await vm.external.getSavedata(savefile.game(i));
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
        yield* vm.printer.print("[" + i + "] " + label, /* @__PURE__ */ new Set(["L"]));
      }
      yield* vm.printer.print("[" + SAVE_CANCEL + "] \uCDE8\uC18C", /* @__PURE__ */ new Set(["L"]));
      return null;
    }
  };
}
function saveSlot(vm, slot) {
  return {
    raw: new Slice(FILE, 0, "SAVEDATA " + slot, "SAVEDATA".length),
    run: async function* () {
      const now = (0, import_dayjs4.default)(vm.external.getTime());
      vm.getValue("SAVEDATA_TEXT").set(vm, now.format("YYYY/MM/DD HH:mm:ss"), []);
      if (vm.fnMap.has("SAVEINFO")) {
        yield* vm.run(new Call(new Slice(FILE, 0, "CALL SAVEINFO", "CALL".length)));
      }
      yield* vm.run(new SaveData(new Slice(FILE, 0, "SAVEDATA " + slot + ", SAVEDATA_TEXT", "SAVEDATA".length)));
      yield* vm.printer.print("\uC2AC\uB86F " + slot + "\uC5D0 \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ new Set(["L"]));
      return null;
    }
  };
}
function loadSlot(vm, slot) {
  return {
    raw: new Slice(FILE, 0, "LOADDATA " + slot, "LOADDATA".length),
    run: async function* () {
      const raw = await vm.external.getSavedata(savefile.game(slot));
      if (raw == null) {
        yield* vm.printer.print("\uC2AC\uB86F " + slot + "\uC740(\uB294) \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.", /* @__PURE__ */ new Set(["L"]));
        return null;
      }
      return yield* vm.run(new LoadData(new Slice(FILE, 0, "LOADDATA " + slot, "LOADDATA".length)));
    }
  };
}
async function* SAVEGAME(vm) {
  return yield* runScene(vm, function* () {
    yield slotMenu(vm, "SAVE GAME");
    yield new Input(new Slice(FILE, 0, "INPUT", "INPUT".length));
    const input = Number(vm.getValue("RESULT").get(vm, [0]));
    if (Number.isInteger(input) && input >= 0 && input < SAVE_SLOT_COUNT) {
      yield saveSlot(vm, input);
    }
    yield beginScene("SHOP");
  });
}
async function* LOADGAME(vm) {
  return yield* runScene(vm, function* () {
    while (true) {
      yield slotMenu(vm, "LOAD GAME");
      yield new Input(new Slice(FILE, 0, "INPUT", "INPUT".length));
      const input = Number(vm.getValue("RESULT").get(vm, [0]));
      if (Number.isInteger(input) && input >= 0 && input < SAVE_SLOT_COUNT) {
        yield loadSlot(vm, input);
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
  get(vm, index) {
    cond(index.length === 0, "CHARANUM cannot be indexed");
    return BigInt(vm.characterList.length);
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
  get(vm, index) {
    cond(index.length === 0, "LINECOUNT cannot be indexed");
    return BigInt(vm.printer.lineCount);
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
  get(vm, index) {
    cond(index.length === 1, "RAND must be indexed by 1 value");
    return BigInt(Math.floor(vm.random.next() % index[0]));
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
function compile(files) {
  const csvFiles = /* @__PURE__ */ new Map();
  const erhFiles = /* @__PURE__ */ new Map();
  const erbFiles = /* @__PURE__ */ new Map();
  for (const [file, content] of files) {
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
export {
  EraJSError,
  compile
};
/*! Bundled license information:

papaparse/papaparse.js:
  (* @license
  Papa Parse
  v5.5.3
  https://github.com/mholt/PapaParse
  License: MIT
  *)
*/
