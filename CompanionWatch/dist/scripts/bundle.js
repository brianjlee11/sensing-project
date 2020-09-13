(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var wrapIdbValue = require('./wrap-idb-value.js');
/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */


function openDB(name, version) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      blocked = _ref.blocked,
      upgrade = _ref.upgrade,
      blocking = _ref.blocking,
      terminated = _ref.terminated;

  var request = indexedDB.open(name, version);
  var openPromise = wrapIdbValue.wrap(request);

  if (upgrade) {
    request.addEventListener('upgradeneeded', function (event) {
      upgrade(wrapIdbValue.wrap(request.result), event.oldVersion, event.newVersion, wrapIdbValue.wrap(request.transaction));
    });
  }

  if (blocked) request.addEventListener('blocked', function () {
    return blocked();
  });
  openPromise.then(function (db) {
    if (terminated) db.addEventListener('close', function () {
      return terminated();
    });
    if (blocking) db.addEventListener('versionchange', function () {
      return blocking();
    });
  })["catch"](function () {});
  return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */


function deleteDB(name) {
  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      blocked = _ref2.blocked;

  var request = indexedDB.deleteDatabase(name);
  if (blocked) request.addEventListener('blocked', function () {
    return blocked();
  });
  return wrapIdbValue.wrap(request).then(function () {
    return undefined;
  });
}

var readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
var writeMethods = ['put', 'add', 'delete', 'clear'];
var cachedMethods = new Map();

function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === 'string')) {
    return;
  }

  if (cachedMethods.get(prop)) return cachedMethods.get(prop);
  var targetFuncName = prop.replace(/FromIndex$/, '');
  var useIndex = prop !== targetFuncName;
  var isWrite = writeMethods.includes(targetFuncName);

  if ( // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
  !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))) {
    return;
  }

  var method = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(storeName) {
      var _target;

      var tx,
          target,
          _len,
          args,
          _key,
          returnVal,
          _args = arguments;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
              tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
              target = tx.store;

              for (_len = _args.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = _args[_key];
              }

              if (useIndex) target = target.index(args.shift());
              _context.next = 6;
              return (_target = target)[targetFuncName].apply(_target, args);

            case 6:
              returnVal = _context.sent;

              if (!isWrite) {
                _context.next = 10;
                break;
              }

              _context.next = 10;
              return tx.done;

            case 10:
              return _context.abrupt("return", returnVal);

            case 11:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function method(_x) {
      return _ref3.apply(this, arguments);
    };
  }();

  cachedMethods.set(prop, method);
  return method;
}

wrapIdbValue.replaceTraps(function (oldTraps) {
  return _objectSpread(_objectSpread({}, oldTraps), {}, {
    get: function get(target, prop, receiver) {
      return getMethod(target, prop) || oldTraps.get(target, prop, receiver);
    },
    has: function has(target, prop) {
      return !!getMethod(target, prop) || oldTraps.has(target, prop);
    }
  });
});
exports.unwrap = wrapIdbValue.unwrap;
exports.wrap = wrapIdbValue.wrap;
exports.deleteDB = deleteDB;
exports.openDB = openDB;

},{"./wrap-idb-value.js":2}],2:[function(require,module,exports){
'use strict';

var instanceOfAny = function instanceOfAny(object, constructors) {
  return constructors.some(function (c) {
    return object instanceof c;
  });
};

var idbProxyableTypes;
var cursorAdvanceMethods; // This is a function to prevent it throwing up in node environments.

function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction]);
} // This is a function to prevent it throwing up in node environments.


function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [IDBCursor.prototype.advance, IDBCursor.prototype["continue"], IDBCursor.prototype.continuePrimaryKey]);
}

var cursorRequestMap = new WeakMap();
var transactionDoneMap = new WeakMap();
var transactionStoreNamesMap = new WeakMap();
var transformCache = new WeakMap();
var reverseTransformCache = new WeakMap();

function promisifyRequest(request) {
  var promise = new Promise(function (resolve, reject) {
    var unlisten = function unlisten() {
      request.removeEventListener('success', success);
      request.removeEventListener('error', error);
    };

    var success = function success() {
      resolve(wrap(request.result));
      unlisten();
    };

    var error = function error() {
      reject(request.error);
      unlisten();
    };

    request.addEventListener('success', success);
    request.addEventListener('error', error);
  });
  promise.then(function (value) {
    // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
    // (see wrapFunction).
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    } // Catching to avoid "Uncaught Promise exceptions"

  })["catch"](function () {}); // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
  // is because we create many promises from a single IDBRequest.

  reverseTransformCache.set(promise, request);
  return promise;
}

function cacheDonePromiseForTransaction(tx) {
  // Early bail if we've already created a done promise for this transaction.
  if (transactionDoneMap.has(tx)) return;
  var done = new Promise(function (resolve, reject) {
    var unlisten = function unlisten() {
      tx.removeEventListener('complete', complete);
      tx.removeEventListener('error', error);
      tx.removeEventListener('abort', error);
    };

    var complete = function complete() {
      resolve();
      unlisten();
    };

    var error = function error() {
      reject(tx.error || new DOMException('AbortError', 'AbortError'));
      unlisten();
    };

    tx.addEventListener('complete', complete);
    tx.addEventListener('error', error);
    tx.addEventListener('abort', error);
  }); // Cache it for later retrieval.

  transactionDoneMap.set(tx, done);
}

var idbProxyTraps = {
  get: function get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      // Special handling for transaction.done.
      if (prop === 'done') return transactionDoneMap.get(target); // Polyfill for objectStoreNames because of Edge.

      if (prop === 'objectStoreNames') {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      } // Make tx.store return the only store in the transaction, or undefined if there are many.


      if (prop === 'store') {
        return receiver.objectStoreNames[1] ? undefined : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    } // Else transform whatever we get back.


    return wrap(target[prop]);
  },
  set: function set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has: function has(target, prop) {
    if (target instanceof IDBTransaction && (prop === 'done' || prop === 'store')) {
      return true;
    }

    return prop in target;
  }
};

function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}

function wrapFunction(func) {
  // Due to expected object equality (which is enforced by the caching in `wrap`), we
  // only create one new func per func.
  // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
  if (func === IDBDatabase.prototype.transaction && !('objectStoreNames' in IDBTransaction.prototype)) {
    return function (storeNames) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var tx = func.call.apply(func, [unwrap(this), storeNames].concat(args));
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  } // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
  // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
  // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
  // with real promises, so each advance methods returns a new promise for the cursor object, or
  // undefined if the end of the cursor has been reached.


  if (getCursorAdvanceMethods().includes(func)) {
    return function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
      // the original object.
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }

  return function () {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
    // the original object.
    return wrap(func.apply(unwrap(this), args));
  };
}

function transformCachableValue(value) {
  if (typeof value === 'function') return wrapFunction(value); // This doesn't return, it just creates a 'done' promise for the transaction,
  // which is later returned for transaction.done (see idbObjectHandler).

  if (value instanceof IDBTransaction) cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes())) return new Proxy(value, idbProxyTraps); // Return the same value back if we're not going to transform it.

  return value;
}

function wrap(value) {
  // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
  // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
  if (value instanceof IDBRequest) return promisifyRequest(value); // If we've already transformed this value before, reuse the transformed value.
  // This is faster, but it also provides object equality.

  if (transformCache.has(value)) return transformCache.get(value);
  var newValue = transformCachableValue(value); // Not all types are transformed.
  // These may be primitive types, so they can't be WeakMap keys.

  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }

  return newValue;
}

var unwrap = function unwrap(value) {
  return reverseTransformCache.get(value);
};

exports.instanceOfAny = instanceOfAny;
exports.replaceTraps = replaceTraps;
exports.reverseTransformCache = reverseTransformCache;
exports.unwrap = unwrap;
exports.wrap = wrap;

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteDB = deleteDB;
exports.openDB = openDB;
Object.defineProperty(exports, "unwrap", {
  enumerable: true,
  get: function get() {
    return _wrapIdbValue.u;
  }
});
Object.defineProperty(exports, "wrap", {
  enumerable: true,
  get: function get() {
    return _wrapIdbValue.w;
  }
});

var _wrapIdbValue = require("./wrap-idb-value.js");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      blocked = _ref.blocked,
      upgrade = _ref.upgrade,
      blocking = _ref.blocking,
      terminated = _ref.terminated;

  var request = indexedDB.open(name, version);
  var openPromise = (0, _wrapIdbValue.w)(request);

  if (upgrade) {
    request.addEventListener('upgradeneeded', function (event) {
      upgrade((0, _wrapIdbValue.w)(request.result), event.oldVersion, event.newVersion, (0, _wrapIdbValue.w)(request.transaction));
    });
  }

  if (blocked) request.addEventListener('blocked', function () {
    return blocked();
  });
  openPromise.then(function (db) {
    if (terminated) db.addEventListener('close', function () {
      return terminated();
    });
    if (blocking) db.addEventListener('versionchange', function () {
      return blocking();
    });
  })["catch"](function () {});
  return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */


function deleteDB(name) {
  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      blocked = _ref2.blocked;

  var request = indexedDB.deleteDatabase(name);
  if (blocked) request.addEventListener('blocked', function () {
    return blocked();
  });
  return (0, _wrapIdbValue.w)(request).then(function () {
    return undefined;
  });
}

var readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
var writeMethods = ['put', 'add', 'delete', 'clear'];
var cachedMethods = new Map();

function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === 'string')) {
    return;
  }

  if (cachedMethods.get(prop)) return cachedMethods.get(prop);
  var targetFuncName = prop.replace(/FromIndex$/, '');
  var useIndex = prop !== targetFuncName;
  var isWrite = writeMethods.includes(targetFuncName);

  if ( // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
  !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))) {
    return;
  }

  var method = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(storeName) {
      var _target;

      var tx,
          target,
          _len,
          args,
          _key,
          returnVal,
          _args = arguments;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
              tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
              target = tx.store;

              for (_len = _args.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = _args[_key];
              }

              if (useIndex) target = target.index(args.shift());
              _context.next = 6;
              return (_target = target)[targetFuncName].apply(_target, args);

            case 6:
              returnVal = _context.sent;

              if (!isWrite) {
                _context.next = 10;
                break;
              }

              _context.next = 10;
              return tx.done;

            case 10:
              return _context.abrupt("return", returnVal);

            case 11:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function method(_x) {
      return _ref3.apply(this, arguments);
    };
  }();

  cachedMethods.set(prop, method);
  return method;
}

(0, _wrapIdbValue.r)(function (oldTraps) {
  return _objectSpread(_objectSpread({}, oldTraps), {}, {
    get: function get(target, prop, receiver) {
      return getMethod(target, prop) || oldTraps.get(target, prop, receiver);
    },
    has: function has(target, prop) {
      return !!getMethod(target, prop) || oldTraps.has(target, prop);
    }
  });
});

},{"./wrap-idb-value.js":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.r = replaceTraps;
exports.w = wrap;
exports.u = exports.i = exports.a = void 0;

var instanceOfAny = function instanceOfAny(object, constructors) {
  return constructors.some(function (c) {
    return object instanceof c;
  });
};

exports.i = instanceOfAny;
var idbProxyableTypes;
var cursorAdvanceMethods; // This is a function to prevent it throwing up in node environments.

function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction]);
} // This is a function to prevent it throwing up in node environments.


function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [IDBCursor.prototype.advance, IDBCursor.prototype["continue"], IDBCursor.prototype.continuePrimaryKey]);
}

var cursorRequestMap = new WeakMap();
var transactionDoneMap = new WeakMap();
var transactionStoreNamesMap = new WeakMap();
var transformCache = new WeakMap();
var reverseTransformCache = new WeakMap();
exports.a = reverseTransformCache;

function promisifyRequest(request) {
  var promise = new Promise(function (resolve, reject) {
    var unlisten = function unlisten() {
      request.removeEventListener('success', success);
      request.removeEventListener('error', error);
    };

    var success = function success() {
      resolve(wrap(request.result));
      unlisten();
    };

    var error = function error() {
      reject(request.error);
      unlisten();
    };

    request.addEventListener('success', success);
    request.addEventListener('error', error);
  });
  promise.then(function (value) {
    // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
    // (see wrapFunction).
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    } // Catching to avoid "Uncaught Promise exceptions"

  })["catch"](function () {}); // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
  // is because we create many promises from a single IDBRequest.

  reverseTransformCache.set(promise, request);
  return promise;
}

function cacheDonePromiseForTransaction(tx) {
  // Early bail if we've already created a done promise for this transaction.
  if (transactionDoneMap.has(tx)) return;
  var done = new Promise(function (resolve, reject) {
    var unlisten = function unlisten() {
      tx.removeEventListener('complete', complete);
      tx.removeEventListener('error', error);
      tx.removeEventListener('abort', error);
    };

    var complete = function complete() {
      resolve();
      unlisten();
    };

    var error = function error() {
      reject(tx.error || new DOMException('AbortError', 'AbortError'));
      unlisten();
    };

    tx.addEventListener('complete', complete);
    tx.addEventListener('error', error);
    tx.addEventListener('abort', error);
  }); // Cache it for later retrieval.

  transactionDoneMap.set(tx, done);
}

var idbProxyTraps = {
  get: function get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      // Special handling for transaction.done.
      if (prop === 'done') return transactionDoneMap.get(target); // Polyfill for objectStoreNames because of Edge.

      if (prop === 'objectStoreNames') {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      } // Make tx.store return the only store in the transaction, or undefined if there are many.


      if (prop === 'store') {
        return receiver.objectStoreNames[1] ? undefined : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    } // Else transform whatever we get back.


    return wrap(target[prop]);
  },
  set: function set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has: function has(target, prop) {
    if (target instanceof IDBTransaction && (prop === 'done' || prop === 'store')) {
      return true;
    }

    return prop in target;
  }
};

function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}

function wrapFunction(func) {
  // Due to expected object equality (which is enforced by the caching in `wrap`), we
  // only create one new func per func.
  // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
  if (func === IDBDatabase.prototype.transaction && !('objectStoreNames' in IDBTransaction.prototype)) {
    return function (storeNames) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var tx = func.call.apply(func, [unwrap(this), storeNames].concat(args));
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  } // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
  // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
  // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
  // with real promises, so each advance methods returns a new promise for the cursor object, or
  // undefined if the end of the cursor has been reached.


  if (getCursorAdvanceMethods().includes(func)) {
    return function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
      // the original object.
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }

  return function () {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
    // the original object.
    return wrap(func.apply(unwrap(this), args));
  };
}

function transformCachableValue(value) {
  if (typeof value === 'function') return wrapFunction(value); // This doesn't return, it just creates a 'done' promise for the transaction,
  // which is later returned for transaction.done (see idbObjectHandler).

  if (value instanceof IDBTransaction) cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes())) return new Proxy(value, idbProxyTraps); // Return the same value back if we're not going to transform it.

  return value;
}

function wrap(value) {
  // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
  // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
  if (value instanceof IDBRequest) return promisifyRequest(value); // If we've already transformed this value before, reuse the transformed value.
  // This is faster, but it also provides object equality.

  if (transformCache.has(value)) return transformCache.get(value);
  var newValue = transformCachableValue(value); // Not all types are transformed.
  // These may be primitive types, so they can't be WeakMap keys.

  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }

  return newValue;
}

var unwrap = function unwrap(value) {
  return reverseTransformCache.get(value);
};

exports.u = unwrap;

},{}],5:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var runtime = function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.

  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }

  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function define(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.

    generator._invoke = makeInvokeMethod(innerFn, self, context);
    return generator;
  }

  exports.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.

  function tryCatch(fn, obj, arg) {
    try {
      return {
        type: "normal",
        arg: fn.call(obj, arg)
      };
    } catch (err) {
      return {
        type: "throw",
        arg: err
      };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed"; // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.

  var ContinueSentinel = {}; // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.

  function Generator() {}

  function GeneratorFunction() {}

  function GeneratorFunctionPrototype() {} // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.


  var IteratorPrototype = {};

  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));

  if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"); // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.

  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      define(prototype, method, function (arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function (genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor ? ctor === GeneratorFunction || // For the native GeneratorFunction constructor, the best we can
    // do is to check its .name property.
    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
  };

  exports.mark = function (genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }

    genFun.prototype = Object.create(Gp);
    return genFun;
  }; // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.


  exports.awrap = function (arg) {
    return {
      __await: arg
    };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);

      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;

        if (value && _typeof(value) === "object" && hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function (value) {
            invoke("next", value, resolve, reject);
          }, function (err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function (unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function (error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function (resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise = // If enqueue has been called before, then we want to wait until
      // all previous Promises have been resolved before calling invoke,
      // so that results are always delivered in the correct order. If
      // enqueue has not been called before, then it is important to
      // call invoke immediately, without waiting on a callback to fire,
      // so that the async generator function has the opportunity to do
      // any necessary setup in a predictable way. This predictability
      // is why the Promise constructor synchronously invokes its
      // executor callback, and why async functions synchronously
      // execute code before the first await. Since we implement simple
      // async functions in terms of async generators, it is especially
      // important to get this right, even though it requires care.
      previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
      // invocations of the iterator.
      callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    } // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).


    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };

  exports.AsyncIterator = AsyncIterator; // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.

  exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
    return exports.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
    : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;
    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        } // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume


        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;

        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);

          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;
        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);
        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;
        var record = tryCatch(innerFn, self, context);

        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };
        } else if (record.type === "throw") {
          state = GenStateCompleted; // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.

          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  } // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.


  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];

    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError("The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (!info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value; // Resume execution at the desired location (see delegateYield).

      context.next = delegate.nextLoc; // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.

      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }
    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    } // The delegate iterator is finished, so forget it and continue with
    // the outer generator.


    context.delegate = null;
    return ContinueSentinel;
  } // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.


  defineIteratorMethods(Gp);
  define(Gp, toStringTagSymbol, "Generator"); // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.

  Gp[iteratorSymbol] = function () {
    return this;
  };

  Gp.toString = function () {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = {
      tryLoc: locs[0]
    };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{
      tryLoc: "root"
    }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function (object) {
    var keys = [];

    for (var key in object) {
      keys.push(key);
    }

    keys.reverse(); // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.

    return function next() {
      while (keys.length) {
        var key = keys.pop();

        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      } // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.


      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];

      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1,
            next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;
          return next;
        };

        return next.next = next;
      }
    } // Return an iterator with no values.


    return {
      next: doneResult
    };
  }

  exports.values = values;

  function doneResult() {
    return {
      value: undefined,
      done: true
    };
  }

  Context.prototype = {
    constructor: Context,
    reset: function reset(skipTempReset) {
      this.prev = 0;
      this.next = 0; // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.

      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;
      this.method = "next";
      this.arg = undefined;
      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },
    stop: function stop() {
      this.done = true;
      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;

      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },
    dispatchException: function dispatchException(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;

      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }
          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }
          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },
    abrupt: function abrupt(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];

        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },
    complete: function complete(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" || record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },
    finish: function finish(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];

        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },
    "catch": function _catch(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];

        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;

          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }

          return thrown;
        }
      } // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.


      throw new Error("illegal catch attempt");
    },
    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  }; // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.

  return exports;
}( // If this script is executing as a CommonJS module, use module.exports
// as the regeneratorRuntime namespace. Otherwise create a new empty
// object. Either way, the resulting object will be used to initialize
// the regeneratorRuntime variable at the top of this file.
(typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" ? module.exports : {});

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeAndRead = void 0;

var _read_files = require("../src/read_files");

var _sensors = require("../src/sensors");

var _database = require("../src/database");

require("regenerator-runtime/runtime");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var appPath = "/opt/usr/apps/XIQbjfoxch/data/";

var writeAndRead = function writeAndRead() {
  tizen.filesystem.resolve(appPath, function (dir) {
    var sensorData;

    try {
      console.log("got directory");
      sensorData = dir.resolve("sensor-data");
    } catch (e) {
      console.log("created new directory");
      sensorData = dir.createDirectory("sensor-data");
    }

    var lightfile;

    if (_sensors.sensorList.light) {
      try {
        console.log("got file");
        lightfile = sensorData.resolve("data-light.json");
      } catch (e) {
        console.log("create new file");
        lightfile = sensorData.createFile("data-light.json");
      }

      lightfile.openStream("w", writeToLightFile, function (e) {
        console.log("Error " + e.message);
      }, "UTF-8");
    }

    var pressfile;

    if (_sensors.sensorList.pressure) {
      try {
        console.log("got file");
        pressfile = sensorData.resolve("data-press.json");
      } catch (e) {
        console.log("create new file");
        pressfile = sensorData.createFile("data-press.json");
      }

      pressfile.openStream("w", writeToPressureFile, function (e) {
        console.log("Error " + e.message);
      }, "UTF-8");
    }

    var accelfile;

    if (_sensors.sensorList.accelerometer) {
      try {
        console.log("got file");
        accelfile = sensorData.resolve("data-accel.json");
      } catch (e) {
        console.log("create new file");
        accelfile = sensorData.createFile("data-accel.json");
      }

      accelfile.openStream("w", writeToAccelerationFile, function (e) {
        console.log("Error " + e.message);
      }, "UTF-8");
    }
  }, function (e) {
    console.log(e);
  }, "rw");
};

exports.writeAndRead = writeAndRead;

var writeToLightFile = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(fs) {
    var cursor;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _database.db.transaction("light").store.openCursor();

          case 2:
            cursor = _context.sent;
            fs.write("[\n");

          case 4:
            if (!cursor) {
              _context.next = 12;
              break;
            }

            fs.write("\t{\"".concat(cursor.key, "\" : ").concat(cursor.value, "}"));
            _context.next = 8;
            return cursor["continue"]();

          case 8:
            cursor = _context.sent;

            if (cursor) {
              fs.write(",\n");
            } else {
              fs.write("\n");
            }

            _context.next = 4;
            break;

          case 12:
            fs.write("]");
            fs.close();
            (0, _read_files.readFile)("light");

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function writeToLightFile(_x) {
    return _ref.apply(this, arguments);
  };
}();

var writeToPressureFile = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(fs) {
    var cursor;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return _database.db.transaction("pressure").store.openCursor();

          case 2:
            cursor = _context2.sent;
            fs.write("[\n");

          case 4:
            if (!cursor) {
              _context2.next = 12;
              break;
            }

            fs.write("\t{\"".concat(cursor.key, "\" : ").concat(cursor.value, "}"));
            _context2.next = 8;
            return cursor["continue"]();

          case 8:
            cursor = _context2.sent;

            if (cursor) {
              fs.write(",\n");
            } else {
              fs.write("\n");
            }

            _context2.next = 4;
            break;

          case 12:
            fs.write("]");
            fs.close();
            (0, _read_files.readFile)("press");

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function writeToPressureFile(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var writeToAccelerationFile = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(fs) {
    var cursor;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _database.db.transaction("acceleration").store.openCursor();

          case 2:
            cursor = _context3.sent;
            fs.write("[\n");

          case 4:
            if (!cursor) {
              _context3.next = 17;
              break;
            }

            fs.write("\t{\"".concat(cursor.key, "\" : {\n"));
            fs.write("\t\t\t\"x\":".concat(cursor.value.x, ",\n"));
            fs.write("\t\t\t\"y\":".concat(cursor.value.y, ",\n"));
            fs.write("\t\t\t\"z\":".concat(cursor.value.z, "\n"));
            fs.write("\t\t}\n");
            fs.write("\t}");
            _context3.next = 13;
            return cursor["continue"]();

          case 13:
            cursor = _context3.sent;

            if (cursor) {
              fs.write(",\n");
            } else {
              fs.write("\n");
            }

            _context3.next = 4;
            break;

          case 17:
            fs.write("]");
            fs.close();
            (0, _read_files.readFile)("accel");

          case 20:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function writeToAccelerationFile(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

},{"../src/database":7,"../src/read_files":10,"../src/sensors":12,"regenerator-runtime/runtime":5}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initDB = initDB;
exports.writeAccelSensorData = exports.writeLightSensorData = exports.db = void 0;

var _idb = require("idb");

require("regenerator-runtime/runtime");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var db; // Initialize the db

exports.db = db;

function initDB() {
  return _initDB.apply(this, arguments);
}

function _initDB() {
  _initDB = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _idb.openDB)("sensorData", 1, {
              upgrade: function upgrade(db) {
                if (!db.objectStoreNames.contains("light")) {
                  db.createObjectStore("light");
                  console.log("Create light store");
                }

                if (!db.objectStoreNames.contains("acceleration")) {
                  db.createObjectStore("acceleration");
                  console.log("Create acceleration store");
                }

                if (!db.objectStoreNames.contains("pressure")) {
                  db.createObjectStore("pressure");
                  console.log("Create pressure store");
                }
              },
              blocked: function blocked() {
                console.log("currently blocked by older version of the db");
              },
              blocking: function blocking() {
                console.log("blocking future version from going out");
              }
            });

          case 2:
            exports.db = db = _context.sent;

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _initDB.apply(this, arguments);
}

var writeLightSensorData = function writeLightSensorData(sensorData) {
  var timestamp = Date.now();
  db.add("light", sensorData.lightLevel, timestamp);
};

exports.writeLightSensorData = writeLightSensorData;

var writeAccelSensorData = function writeAccelSensorData(sensorData) {
  var timestamp = Date.now();
  var accelData = {
    x: sensorData.x,
    y: sensorData.y,
    z: sensorData.z
  };
  db.add("acceleration", accelData, timestamp);
};

exports.writeAccelSensorData = writeAccelSensorData;

},{"idb":1,"regenerator-runtime/runtime":5}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setEventListners = exports.sensorAccel = exports.sensorPress = exports.sensorLight = void 0;

var _sensors = require("../src/sensors");

var _sap_utils = require("../src/sap_utils");

var _create_files = require("../src/create_files");

var sensorLight;
exports.sensorLight = sensorLight;
var sensorPress;
exports.sensorPress = sensorPress;
var sensorAccel;
exports.sensorAccel = sensorAccel;

var setEventListners = function setEventListners() {
  var connectButton = document.getElementById("connect");
  var startSensorButton = document.getElementById("startSensor");
  var stopSensorButton = document.getElementById("stopSensor");
  var writeDataButton = document.getElementById("writeData");
  var cancelButton = document.getElementById("cancelButton");
  var nextButton = document.getElementById("toMainPage");
  var lightCheck = document.getElementById("light-check");
  var pressCheck = document.getElementById("press-check");
  var accelCheck = document.getElementById("accel-check");
  connectButton.addEventListener("click", function () {
    (0, _sap_utils.initialize)();
  });
  startSensorButton.addEventListener("click", function () {
    if (!lightCheck.checked && !pressCheck.checked && !accelCheck.checked) {
      (0, _sap_utils.toastAlert)("Need to select at least one sensor");
    } else {
      tau.changePage("#manage");
      (0, _sensors.startSensor)();
    }
  });
  stopSensorButton.addEventListener("click", function () {
    (0, _sensors.killSensor)();
  });
  writeDataButton.addEventListener("click", function () {
    (0, _create_files.writeAndRead)();
  });
  cancelButton.addEventListener("click", function () {
    (0, _sap_utils.cancelFile)();
  });
  lightCheck.addEventListener("click", function () {
    _sensors.sensorList.light = !_sensors.sensorList.light;
  });
  pressCheck.addEventListener("click", function () {
    _sensors.sensorList.pressure = !_sensors.sensorList.pressure;
  });
  accelCheck.addEventListener("click", function () {
    _sensors.sensorList.accelerometer = !_sensors.sensorList.accelerometer;
  });
  nextButton.addEventListener("click", function () {
    if (!lightCheck.checked && !pressCheck.checked && !accelCheck.checked) {
      console.log("its checked");
      (0, _sap_utils.toastAlert)("Need to select at least one sensor");
    } else {
      console.log("page change");
      tau.changePage("#main");

      if (_sensors.sensorList.light) {
        console.log("Light sensor set");
        exports.sensorLight = sensorLight = tizen.sensorservice.getDefaultSensor("LIGHT");
      }

      if (_sensors.sensorList.pressure) {
        console.log("Pressure sensor set");
        exports.sensorPress = sensorPress = tizen.sensorservice.getDefaultSensor("PRESSURE");
      }

      if (_sensors.sensorList.accelerometer) {
        console.log("Accelerometer sensor set");
        exports.sensorAccel = sensorAccel = tizen.sensorservice.getDefaultSensor("ACCELERATION");
      }
    }
  });
};

exports.setEventListners = setEventListners;

},{"../src/create_files":6,"../src/sap_utils":11,"../src/sensors":12}],9:[function(require,module,exports){
"use strict";

var _idb = require("idb");

var _sap_utils = require("../src/sap_utils");

var _listeners = require("../src/listeners");

var _database = require("../src/database");

(function () {
  (0, _idb.deleteDB)("sensorData");
  (0, _database.initDB)(); // Initialize DB

  var sendPage = document.getElementById("sendPage");
  sendPage.addEventListener("pagehide", function () {});
  window.addEventListener("tizenhwkey", function (e) {
    /* For the flick down gesture */
    if (e.keyName == "back") {
      var page = document.getElementsByClassName("ui-page-active")[0],
          pageid = page ? page.id : " ";

      if (pageid === "main") {
        /* When a user flicks down, the application exits */
        tizen.application.getCurrentApplication().exit();
      } else {
        (0, _sap_utils.cancelFile)();
        window.history.back();
      }
    }
  });
  window.addEventListener("load", function (ev) {
    console.log("loaded");
    (0, _listeners.setEventListners)();
  });
})();

(function (tau) {
  var toastPopup = document.getElementById("popupToast");
  toastPopup.addEventListener("popupshow", function (ev) {
    setTimeout(function () {
      tau.closePopup();
    }, 1500);
  }, false);
})(window.tau);

},{"../src/database":7,"../src/listeners":8,"../src/sap_utils":11,"idb":1}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readFile = void 0;
var appPath = "/opt/usr/apps/XIQbjfoxch/data/";

var readFile = function readFile(sensorType) {
  tizen.filesystem.resolve(appPath, function (dir) {
    var file = dir.resolve("sensor-data/data-".concat(sensorType, ".json"));
    file.openStream("r", function (fs) {
      var text = fs.read(file.fileSize);
      fs.close();
      console.log(text);
    }, function (e) {
      console.log("Error " + e.message);
    }, "UTF-8");
  });
};

exports.readFile = readFile;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendFile = exports.cancelFile = exports.initialize = exports.updateContents = exports.reconnect = exports.clearList = exports.ftSuccessCb = exports.showMain = exports.toastAlert = void 0;
var gTransferId = 0;
var progressBar = document.getElementById("file-progress");
var ratio = document.getElementById("file-ratio");

var toastAlert = function toastAlert(msg) {
  var toastMsg = document.getElementById("popupToastMsg");
  toastMsg.innerHTML = msg;
  tau.openPopup("#popupToast");
  console.log(msg);
};

exports.toastAlert = toastAlert;

var showMain = function showMain(message) {
  tau.changePage("#main");

  if (message != undefined) {
    toastAlert(message);
  }

  gTransferId = 0;
};

exports.showMain = showMain;
var ftSuccessCb = {
  onsuccess: function onsuccess() {
    toastAlert("Succeed to connect"); // updateContents();

    sendFile("/opt/usr/apps/XIQbjfoxch/data/sensor-data/data.json");
  },
  onsendprogress: function onsendprogress(id, progress) {
    console.log("onprogress id : " + id + " progress : " + progress);
    progressBar.value = progress;
    ratio.innerHTML = progress + "%";
  },
  onsendcomplete: function onsendcomplete(id, localPath) {
    progressBar.value = 100;
    ratio.innerHTML = "100%";
    showMain("send Completed!! id : " + id + " localPath :" + localPath);
  },
  onsenderror: function onsenderror(errCode, id) {
    showMain("Failed to send File. id : " + id + " errorCode :" + errCode);
  }
};
exports.ftSuccessCb = ftSuccessCb;

var clearList = function clearList(reconnect) {
  console.log("clear List");
  $(".ui-listview").empty();

  if (reconnect) {
    $(".ui-listview").append('<li><a href="#" onclick="reconnect();">Connect</a></li>');
  } else {
    $(".ui-listview").append("<li>BT Disconnected. Connection waiting...</li>");
  }

  var snaplistEl = document.getElementsByClassName("ui-snap-listview")[0];

  if (snaplistEl) {
    var snaplistWidget = tau.widget.SnapListview(snaplistEl);
    snaplistWidget.refresh();
  }
};

exports.clearList = clearList;

var reconnect = function reconnect() {
  $(".ui-listview").empty();
  sapFindPeer(function () {
    console.log("Succeed to find peer");
    ftInit(ftSuccessCb, function (err) {
      toastAlert("Failed to get File Transfer"); // clearList(true);
    });
  }, function (err) {
    toastAlert("Failed to reconnect to service"); // clearList(true);
  });
};

exports.reconnect = reconnect;

var updateContents = function updateContents() {
  try {
    tizen.content.find(function (contents) {
      $(".ui-listview").empty();

      if (contents.length > 0) {
        for (var i = 0; i < contents.length; i++) {
          console.log("name : " + contents[i].title + " URI : " + contents[i].contentURI);
          var nameStr = contents[i].title.length > 15 ? contents[i].title.substring(0, 11) + "..." : contents[i].title;
          $(".ui-listview").append("<li><a onclick=\"sendFile('" + contents[i].contentURI + "');\">" + nameStr + "</a></li>");
        }

        $(".ui-listview").append('<li><a onclick="updateContents();">Update contents...</a></li>');
      } else {
        $(".ui-listview").append('<li><a onclick="updateContents();">No items. Update contents</a></li>');
      }

      var snaplistEl = document.getElementsByClassName("ui-snap-listview")[0];

      if (snaplistEl) {
        var snaplistWidget = tau.widget.SnapListview(snaplistEl);
        snaplistWidget.refresh();
      }
    }, function (err) {
      console.log("Failed to find contents");
    });
  } catch (err) {
    console.log("content.find exception <" + err.name + "> : " + err.message);
  }
};

exports.updateContents = updateContents;

var initialize = function initialize() {
  var sapinitsuccesscb = {
    onsuccess: function onsuccess() {
      console.log("Succeed to connect");
      ftInit(ftSuccessCb, function (err) {
        toastAlert("Failed to get File Transfer");
      });
    },
    ondevicestatus: function ondevicestatus(status) {
      if (status == "DETACHED") {
        console.log("Detached remote peer device"); // clearList();
      } else if (status == "ATTACHED") {
        console.log("Attached remote peer device");
        reconnect();
      }
    }
  };
  sapInit(sapinitsuccesscb, function (err) {
    toastAlert("Failed to connect to service");
  });
};

exports.initialize = initialize;

var cancelFile = function cancelFile() {
  ftCancel(gTransferId, function () {
    console.log("Succeed to cancel file");
    showMain();
  }, function (err) {
    console.log("Failed to cancel File");
    showMain();
  });
};

exports.cancelFile = cancelFile;

var sendFile = function sendFile(path) {
  ftSend(path, function (id) {
    console.log("Succeed to send file");
    gTransferId = id;
    tau.changePage("#sendPage");
    progressBar.value = 0;
    ratio.innerHTML = "0%";
  }, function (err) {
    showMain("Failed to send File");
  });
};

exports.sendFile = sendFile;

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.killSensor = exports.startSensor = exports.sensorList = void 0;

require("regenerator-runtime/runtime");

var _listeners = require("../src/listeners");

var _database = require("../src/database");

var _sap_utils = require("../src/sap_utils");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var sensorList = {
  light: false,
  pressure: false,
  accelerometer: false
};
exports.sensorList = sensorList;

var startSensor = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (sensorList.light) {
              console.log("Light sensor started");

              _listeners.sensorLight.setChangeListener(onLightSensorChange, 1000);

              _listeners.sensorLight.start(onSensorSuccess);
            }

            if (sensorList.pressure) {
              console.log("Pressure sensor started");

              _listeners.sensorPress.setChangeListener(onPressSensorChange, 1000);
            }

            if (sensorList.accelerometer) {
              console.log("Accelerometer sensor started");

              _listeners.sensorAccel.setChangeListener(onAccelSensorChange, 1000, 300000);

              _listeners.sensorAccel.start(onSensorSuccess);
            }

          case 3:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function startSensor() {
    return _ref.apply(this, arguments);
  };
}();

exports.startSensor = startSensor;

var killSensor = function killSensor() {
  if (sensorList.light) {
    console.log("Stopped light sensor");

    _listeners.sensorLight.stop();
  }

  if (sensorList.pressure) {
    console.log("Stopped pressure sensor");

    _listeners.sensorPress.stop();
  }

  if (sensorList.accelerometer) {
    console.log("Stopped accel sensor");

    _listeners.sensorAccel.stop();
  } // sensorAccel.stop();


  (0, _sap_utils.toastAlert)("Stopped Sensors");
};

exports.killSensor = killSensor;

var onLightSensorChange = function onLightSensorChange(sensorData) {
  var timestamp = Date.now();

  _database.db.add("light", sensorData.lightLevel, timestamp);
};

var onAccelSensorChange = function onAccelSensorChange(sensorData) {
  var timestamp = Date.now();
  var accelData = {
    x: sensorData.x,
    y: sensorData.y,
    z: sensorData.z
  };

  _database.db.add("acceleration", accelData, timestamp);
};

var onPressSensorChange = function onPressSensorChange(sensorData) {
  var timestamp = Date.now();

  _database.db.add("pressure", sensorData.pressure, timestamp);
};

var onSensorSuccess = function onSensorSuccess() {
  console.log("Sensor started successfully");
}; // Functions to test battery
// sensorLight.start(
// 	function onSensorStart() {
// 		console.log("Light sensor started");
// 		lightInterval = window.setInterval(() => {
// 			sensorLight.getLightSensorData(
// 				writeLightSensorData,
// 				writeError);
// 		}, 30000);
// 	},
// 	function onError(err) {
// 			console.error('Could not start light sensor.',
// 					err.message);
// 	}
// );
// sensorAccel.start(
// 	function onSensorStart() {
// 						console.log("Acceleration sensor started");
// 			accelInterval = window.setInterval(() => {
// 				sensorAccel.getAccelerationSensorData(
// 					writeAccelSensorData,
// 					writeError);
// 			}, 30000);
// 		},
// 		function onError(err) {
// 				console.error('Could not start light sensor.',
// 						err.message);
// 	}
// );
// getBatteryLevel().then((batteryLevel) => {
// 	console.log(batteryLevel);
// });
// window.setTimeout(() => {
// 	getBatteryLevel().then((batteryLevel) => {
// 		console.log(batteryLevel);
// 	});
// 	sensorLight.stop();
// 	sensorAccel.stop();
// 	tizen.power.release("CPU");
// 	window.clearInterval(lightInterval);
// 	window.clearInterval(accelInterval);
// 	// writeAndRead();
// }, MINUTE * 60);

},{"../src/database":7,"../src/listeners":8,"../src/sap_utils":11,"regenerator-runtime/runtime":5}]},{},[9,3]);
