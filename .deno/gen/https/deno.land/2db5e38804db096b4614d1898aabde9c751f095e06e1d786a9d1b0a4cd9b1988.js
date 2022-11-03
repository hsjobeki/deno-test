import { inspect } from "../internal/util/inspect.mjs";
import { codes } from "./error_codes.ts";
import { codeMap, errorMap, mapSysErrnoToUvErrno, } from "../internal_binding/uv.ts";
import { assert } from "../../_util/assert.ts";
import { isWindows } from "../../_util/os.ts";
import { os as osConstants } from "../internal_binding/constants.ts";
const { errno: { ENOTDIR, ENOENT }, } = osConstants;
import { hideStackFrames } from "./hide_stack_frames.ts";
import { getSystemErrorName } from "../_utils.ts";
export { errorMap };
const kIsNodeError = Symbol("kIsNodeError");
const classRegExp = /^([A-Z][a-z0-9]*)+$/;
const kTypes = [
    "string",
    "function",
    "number",
    "object",
    "Function",
    "Object",
    "boolean",
    "bigint",
    "symbol",
];
export class AbortError extends Error {
    code;
    constructor(message = "The operation was aborted", options) {
        if (options !== undefined && typeof options !== "object") {
            throw new codes.ERR_INVALID_ARG_TYPE("options", "Object", options);
        }
        super(message, options);
        this.code = "ABORT_ERR";
        this.name = "AbortError";
    }
}
let maxStack_ErrorName;
let maxStack_ErrorMessage;
export function isStackOverflowError(err) {
    if (maxStack_ErrorMessage === undefined) {
        try {
            function overflowStack() {
                overflowStack();
            }
            overflowStack();
        }
        catch (err) {
            maxStack_ErrorMessage = err.message;
            maxStack_ErrorName = err.name;
        }
    }
    return err && err.name === maxStack_ErrorName &&
        err.message === maxStack_ErrorMessage;
}
function addNumericalSeparator(val) {
    let res = "";
    let i = val.length;
    const start = val[0] === "-" ? 1 : 0;
    for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
    }
    return `${val.slice(0, i)}${res}`;
}
const captureLargerStackTrace = hideStackFrames(function captureLargerStackTrace(err) {
    Error.captureStackTrace(err);
    return err;
});
export const uvExceptionWithHostPort = hideStackFrames(function uvExceptionWithHostPort(err, syscall, address, port) {
    const { 0: code, 1: uvmsg } = uvErrmapGet(err) || uvUnmappedError;
    const message = `${syscall} ${code}: ${uvmsg}`;
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    }
    else if (address) {
        details = ` ${address}`;
    }
    const ex = new Error(`${message}${details}`);
    ex.code = code;
    ex.errno = err;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
export const errnoException = hideStackFrames(function errnoException(err, syscall, original) {
    const code = getSystemErrorName(err);
    const message = original
        ? `${syscall} ${code} ${original}`
        : `${syscall} ${code}`;
    const ex = new Error(message);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    return captureLargerStackTrace(ex);
});
function uvErrmapGet(name) {
    return errorMap.get(name);
}
const uvUnmappedError = ["UNKNOWN", "unknown error"];
export const uvException = hideStackFrames(function uvException(ctx) {
    const { 0: code, 1: uvmsg } = uvErrmapGet(ctx.errno) || uvUnmappedError;
    let message = `${code}: ${ctx.message || uvmsg}, ${ctx.syscall}`;
    let path;
    let dest;
    if (ctx.path) {
        path = ctx.path.toString();
        message += ` '${path}'`;
    }
    if (ctx.dest) {
        dest = ctx.dest.toString();
        message += ` -> '${dest}'`;
    }
    const err = new Error(message);
    for (const prop of Object.keys(ctx)) {
        if (prop === "message" || prop === "path" || prop === "dest") {
            continue;
        }
        err[prop] = ctx[prop];
    }
    err.code = code;
    if (path) {
        err.path = path;
    }
    if (dest) {
        err.dest = dest;
    }
    return captureLargerStackTrace(err);
});
export const exceptionWithHostPort = hideStackFrames(function exceptionWithHostPort(err, syscall, address, port, additional) {
    const code = getSystemErrorName(err);
    let details = "";
    if (port && port > 0) {
        details = ` ${address}:${port}`;
    }
    else if (address) {
        details = ` ${address}`;
    }
    if (additional) {
        details += ` - Local (${additional})`;
    }
    const ex = new Error(`${syscall} ${code}${details}`);
    ex.errno = err;
    ex.code = code;
    ex.syscall = syscall;
    ex.address = address;
    if (port) {
        ex.port = port;
    }
    return captureLargerStackTrace(ex);
});
export const dnsException = hideStackFrames(function (code, syscall, hostname) {
    let errno;
    if (typeof code === "number") {
        errno = code;
        if (code === codeMap.get("EAI_NODATA") ||
            code === codeMap.get("EAI_NONAME")) {
            code = "ENOTFOUND";
        }
        else {
            code = getSystemErrorName(code);
        }
    }
    const message = `${syscall} ${code}${hostname ? ` ${hostname}` : ""}`;
    const ex = new Error(message);
    ex.errno = errno;
    ex.code = code;
    ex.syscall = syscall;
    if (hostname) {
        ex.hostname = hostname;
    }
    return captureLargerStackTrace(ex);
});
export class NodeErrorAbstraction extends Error {
    code;
    constructor(name, code, message) {
        super(message);
        this.code = code;
        this.name = name;
        this.stack = this.stack && `${name} [${this.code}]${this.stack.slice(20)}`;
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
export class NodeError extends NodeErrorAbstraction {
    constructor(code, message) {
        super(Error.prototype.name, code, message);
    }
}
export class NodeSyntaxError extends NodeErrorAbstraction {
    constructor(code, message) {
        super(SyntaxError.prototype.name, code, message);
        Object.setPrototypeOf(this, SyntaxError.prototype);
        this.toString = function () {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
export class NodeRangeError extends NodeErrorAbstraction {
    constructor(code, message) {
        super(RangeError.prototype.name, code, message);
        Object.setPrototypeOf(this, RangeError.prototype);
        this.toString = function () {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
export class NodeTypeError extends NodeErrorAbstraction {
    constructor(code, message) {
        super(TypeError.prototype.name, code, message);
        Object.setPrototypeOf(this, TypeError.prototype);
        this.toString = function () {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
export class NodeURIError extends NodeErrorAbstraction {
    constructor(code, message) {
        super(URIError.prototype.name, code, message);
        Object.setPrototypeOf(this, URIError.prototype);
        this.toString = function () {
            return `${this.name} [${this.code}]: ${this.message}`;
        };
    }
}
class NodeSystemError extends NodeErrorAbstraction {
    constructor(key, context, msgPrefix) {
        let message = `${msgPrefix}: ${context.syscall} returned ` +
            `${context.code} (${context.message})`;
        if (context.path !== undefined) {
            message += ` ${context.path}`;
        }
        if (context.dest !== undefined) {
            message += ` => ${context.dest}`;
        }
        super("SystemError", key, message);
        captureLargerStackTrace(this);
        Object.defineProperties(this, {
            [kIsNodeError]: {
                value: true,
                enumerable: false,
                writable: false,
                configurable: true,
            },
            info: {
                value: context,
                enumerable: true,
                configurable: true,
                writable: false,
            },
            errno: {
                get() {
                    return context.errno;
                },
                set: (value) => {
                    context.errno = value;
                },
                enumerable: true,
                configurable: true,
            },
            syscall: {
                get() {
                    return context.syscall;
                },
                set: (value) => {
                    context.syscall = value;
                },
                enumerable: true,
                configurable: true,
            },
        });
        if (context.path !== undefined) {
            Object.defineProperty(this, "path", {
                get() {
                    return context.path;
                },
                set: (value) => {
                    context.path = value;
                },
                enumerable: true,
                configurable: true,
            });
        }
        if (context.dest !== undefined) {
            Object.defineProperty(this, "dest", {
                get() {
                    return context.dest;
                },
                set: (value) => {
                    context.dest = value;
                },
                enumerable: true,
                configurable: true,
            });
        }
    }
    toString() {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}
function makeSystemErrorWithCode(key, msgPrfix) {
    return class NodeError extends NodeSystemError {
        constructor(ctx) {
            super(key, ctx, msgPrfix);
        }
    };
}
export const ERR_FS_EISDIR = makeSystemErrorWithCode("ERR_FS_EISDIR", "Path is a directory");
function createInvalidArgType(name, expected) {
    expected = Array.isArray(expected) ? expected : [expected];
    let msg = "The ";
    if (name.endsWith(" argument")) {
        msg += `${name} `;
    }
    else {
        const type = name.includes(".") ? "property" : "argument";
        msg += `"${name}" ${type} `;
    }
    msg += "must be ";
    const types = [];
    const instances = [];
    const other = [];
    for (const value of expected) {
        if (kTypes.includes(value)) {
            types.push(value.toLocaleLowerCase());
        }
        else if (classRegExp.test(value)) {
            instances.push(value);
        }
        else {
            other.push(value);
        }
    }
    if (instances.length > 0) {
        const pos = types.indexOf("object");
        if (pos !== -1) {
            types.splice(pos, 1);
            instances.push("Object");
        }
    }
    if (types.length > 0) {
        if (types.length > 2) {
            const last = types.pop();
            msg += `one of type ${types.join(", ")}, or ${last}`;
        }
        else if (types.length === 2) {
            msg += `one of type ${types[0]} or ${types[1]}`;
        }
        else {
            msg += `of type ${types[0]}`;
        }
        if (instances.length > 0 || other.length > 0) {
            msg += " or ";
        }
    }
    if (instances.length > 0) {
        if (instances.length > 2) {
            const last = instances.pop();
            msg += `an instance of ${instances.join(", ")}, or ${last}`;
        }
        else {
            msg += `an instance of ${instances[0]}`;
            if (instances.length === 2) {
                msg += ` or ${instances[1]}`;
            }
        }
        if (other.length > 0) {
            msg += " or ";
        }
    }
    if (other.length > 0) {
        if (other.length > 2) {
            const last = other.pop();
            msg += `one of ${other.join(", ")}, or ${last}`;
        }
        else if (other.length === 2) {
            msg += `one of ${other[0]} or ${other[1]}`;
        }
        else {
            if (other[0].toLowerCase() !== other[0]) {
                msg += "an ";
            }
            msg += `${other[0]}`;
        }
    }
    return msg;
}
export class ERR_INVALID_ARG_TYPE_RANGE extends NodeRangeError {
    constructor(name, expected, actual) {
        const msg = createInvalidArgType(name, expected);
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
}
export class ERR_INVALID_ARG_TYPE extends NodeTypeError {
    constructor(name, expected, actual) {
        const msg = createInvalidArgType(name, expected);
        super("ERR_INVALID_ARG_TYPE", `${msg}.${invalidArgTypeHelper(actual)}`);
    }
    static RangeError = ERR_INVALID_ARG_TYPE_RANGE;
}
export class ERR_INVALID_ARG_VALUE_RANGE extends NodeRangeError {
    constructor(name, value, reason = "is invalid") {
        const type = name.includes(".") ? "property" : "argument";
        const inspected = inspect(value);
        super("ERR_INVALID_ARG_VALUE", `The ${type} '${name}' ${reason}. Received ${inspected}`);
    }
}
export class ERR_INVALID_ARG_VALUE extends NodeTypeError {
    constructor(name, value, reason = "is invalid") {
        const type = name.includes(".") ? "property" : "argument";
        const inspected = inspect(value);
        super("ERR_INVALID_ARG_VALUE", `The ${type} '${name}' ${reason}. Received ${inspected}`);
    }
    static RangeError = ERR_INVALID_ARG_VALUE_RANGE;
}
function invalidArgTypeHelper(input) {
    if (input == null) {
        return ` Received ${input}`;
    }
    if (typeof input === "function" && input.name) {
        return ` Received function ${input.name}`;
    }
    if (typeof input === "object") {
        if (input.constructor && input.constructor.name) {
            return ` Received an instance of ${input.constructor.name}`;
        }
        return ` Received ${inspect(input, { depth: -1 })}`;
    }
    let inspected = inspect(input, { colors: false });
    if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`;
    }
    return ` Received type ${typeof input} (${inspected})`;
}
export class ERR_OUT_OF_RANGE extends RangeError {
    code = "ERR_OUT_OF_RANGE";
    constructor(str, range, input, replaceDefaultBoolean = false) {
        assert(range, 'Missing "range" argument');
        let msg = replaceDefaultBoolean
            ? str
            : `The value of "${str}" is out of range.`;
        let received;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
        }
        else if (typeof input === "bigint") {
            received = String(input);
            if (input > 2n ** 32n || input < -(2n ** 32n)) {
                received = addNumericalSeparator(received);
            }
            received += "n";
        }
        else {
            received = inspect(input);
        }
        msg += ` It must be ${range}. Received ${received}`;
        super(msg);
        const { name } = this;
        this.name = `${name} [${this.code}]`;
        this.stack;
        this.name = name;
    }
}
export class ERR_AMBIGUOUS_ARGUMENT extends NodeTypeError {
    constructor(x, y) {
        super("ERR_AMBIGUOUS_ARGUMENT", `The "${x}" argument is ambiguous. ${y}`);
    }
}
export class ERR_ARG_NOT_ITERABLE extends NodeTypeError {
    constructor(x) {
        super("ERR_ARG_NOT_ITERABLE", `${x} must be iterable`);
    }
}
export class ERR_ASSERTION extends NodeError {
    constructor(x) {
        super("ERR_ASSERTION", `${x}`);
    }
}
export class ERR_ASYNC_CALLBACK extends NodeTypeError {
    constructor(x) {
        super("ERR_ASYNC_CALLBACK", `${x} must be a function`);
    }
}
export class ERR_ASYNC_TYPE extends NodeTypeError {
    constructor(x) {
        super("ERR_ASYNC_TYPE", `Invalid name for async "type": ${x}`);
    }
}
export class ERR_BROTLI_INVALID_PARAM extends NodeRangeError {
    constructor(x) {
        super("ERR_BROTLI_INVALID_PARAM", `${x} is not a valid Brotli parameter`);
    }
}
export class ERR_BUFFER_OUT_OF_BOUNDS extends NodeRangeError {
    constructor(name) {
        super("ERR_BUFFER_OUT_OF_BOUNDS", name
            ? `"${name}" is outside of buffer bounds`
            : "Attempt to access memory outside buffer bounds");
    }
}
export class ERR_BUFFER_TOO_LARGE extends NodeRangeError {
    constructor(x) {
        super("ERR_BUFFER_TOO_LARGE", `Cannot create a Buffer larger than ${x} bytes`);
    }
}
export class ERR_CANNOT_WATCH_SIGINT extends NodeError {
    constructor() {
        super("ERR_CANNOT_WATCH_SIGINT", "Cannot watch for SIGINT signals");
    }
}
export class ERR_CHILD_CLOSED_BEFORE_REPLY extends NodeError {
    constructor() {
        super("ERR_CHILD_CLOSED_BEFORE_REPLY", "Child closed before reply received");
    }
}
export class ERR_CHILD_PROCESS_IPC_REQUIRED extends NodeError {
    constructor(x) {
        super("ERR_CHILD_PROCESS_IPC_REQUIRED", `Forked processes must have an IPC channel, missing value 'ipc' in ${x}`);
    }
}
export class ERR_CHILD_PROCESS_STDIO_MAXBUFFER extends NodeRangeError {
    constructor(x) {
        super("ERR_CHILD_PROCESS_STDIO_MAXBUFFER", `${x} maxBuffer length exceeded`);
    }
}
export class ERR_CONSOLE_WRITABLE_STREAM extends NodeTypeError {
    constructor(x) {
        super("ERR_CONSOLE_WRITABLE_STREAM", `Console expects a writable stream instance for ${x}`);
    }
}
export class ERR_CONTEXT_NOT_INITIALIZED extends NodeError {
    constructor() {
        super("ERR_CONTEXT_NOT_INITIALIZED", "context used is not initialized");
    }
}
export class ERR_CPU_USAGE extends NodeError {
    constructor(x) {
        super("ERR_CPU_USAGE", `Unable to obtain cpu usage ${x}`);
    }
}
export class ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED extends NodeError {
    constructor() {
        super("ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED", "Custom engines not supported by this OpenSSL");
    }
}
export class ERR_CRYPTO_ECDH_INVALID_FORMAT extends NodeTypeError {
    constructor(x) {
        super("ERR_CRYPTO_ECDH_INVALID_FORMAT", `Invalid ECDH format: ${x}`);
    }
}
export class ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY extends NodeError {
    constructor() {
        super("ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY", "Public key is not valid for specified curve");
    }
}
export class ERR_CRYPTO_ENGINE_UNKNOWN extends NodeError {
    constructor(x) {
        super("ERR_CRYPTO_ENGINE_UNKNOWN", `Engine "${x}" was not found`);
    }
}
export class ERR_CRYPTO_FIPS_FORCED extends NodeError {
    constructor() {
        super("ERR_CRYPTO_FIPS_FORCED", "Cannot set FIPS mode, it was forced with --force-fips at startup.");
    }
}
export class ERR_CRYPTO_FIPS_UNAVAILABLE extends NodeError {
    constructor() {
        super("ERR_CRYPTO_FIPS_UNAVAILABLE", "Cannot set FIPS mode in a non-FIPS build.");
    }
}
export class ERR_CRYPTO_HASH_FINALIZED extends NodeError {
    constructor() {
        super("ERR_CRYPTO_HASH_FINALIZED", "Digest already called");
    }
}
export class ERR_CRYPTO_HASH_UPDATE_FAILED extends NodeError {
    constructor() {
        super("ERR_CRYPTO_HASH_UPDATE_FAILED", "Hash update failed");
    }
}
export class ERR_CRYPTO_INCOMPATIBLE_KEY extends NodeError {
    constructor(x, y) {
        super("ERR_CRYPTO_INCOMPATIBLE_KEY", `Incompatible ${x}: ${y}`);
    }
}
export class ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS extends NodeError {
    constructor(x, y) {
        super("ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS", `The selected key encoding ${x} ${y}.`);
    }
}
export class ERR_CRYPTO_INVALID_DIGEST extends NodeTypeError {
    constructor(x) {
        super("ERR_CRYPTO_INVALID_DIGEST", `Invalid digest: ${x}`);
    }
}
export class ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE extends NodeTypeError {
    constructor(x, y) {
        super("ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE", `Invalid key object type ${x}, expected ${y}.`);
    }
}
export class ERR_CRYPTO_INVALID_STATE extends NodeError {
    constructor(x) {
        super("ERR_CRYPTO_INVALID_STATE", `Invalid state for operation ${x}`);
    }
}
export class ERR_CRYPTO_PBKDF2_ERROR extends NodeError {
    constructor() {
        super("ERR_CRYPTO_PBKDF2_ERROR", "PBKDF2 error");
    }
}
export class ERR_CRYPTO_SCRYPT_INVALID_PARAMETER extends NodeError {
    constructor() {
        super("ERR_CRYPTO_SCRYPT_INVALID_PARAMETER", "Invalid scrypt parameter");
    }
}
export class ERR_CRYPTO_SCRYPT_NOT_SUPPORTED extends NodeError {
    constructor() {
        super("ERR_CRYPTO_SCRYPT_NOT_SUPPORTED", "Scrypt algorithm not supported");
    }
}
export class ERR_CRYPTO_SIGN_KEY_REQUIRED extends NodeError {
    constructor() {
        super("ERR_CRYPTO_SIGN_KEY_REQUIRED", "No key provided to sign");
    }
}
export class ERR_DIR_CLOSED extends NodeError {
    constructor() {
        super("ERR_DIR_CLOSED", "Directory handle was closed");
    }
}
export class ERR_DIR_CONCURRENT_OPERATION extends NodeError {
    constructor() {
        super("ERR_DIR_CONCURRENT_OPERATION", "Cannot do synchronous work on directory handle with concurrent asynchronous operations");
    }
}
export class ERR_DNS_SET_SERVERS_FAILED extends NodeError {
    constructor(x, y) {
        super("ERR_DNS_SET_SERVERS_FAILED", `c-ares failed to set servers: "${x}" [${y}]`);
    }
}
export class ERR_DOMAIN_CALLBACK_NOT_AVAILABLE extends NodeError {
    constructor() {
        super("ERR_DOMAIN_CALLBACK_NOT_AVAILABLE", "A callback was registered through " +
            "process.setUncaughtExceptionCaptureCallback(), which is mutually " +
            "exclusive with using the `domain` module");
    }
}
export class ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE extends NodeError {
    constructor() {
        super("ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE", "The `domain` module is in use, which is mutually exclusive with calling " +
            "process.setUncaughtExceptionCaptureCallback()");
    }
}
export class ERR_ENCODING_INVALID_ENCODED_DATA extends NodeErrorAbstraction {
    errno;
    constructor(encoding, ret) {
        super(TypeError.prototype.name, "ERR_ENCODING_INVALID_ENCODED_DATA", `The encoded data was not valid for encoding ${encoding}`);
        Object.setPrototypeOf(this, TypeError.prototype);
        this.errno = ret;
    }
}
export class ERR_ENCODING_NOT_SUPPORTED extends NodeRangeError {
    constructor(x) {
        super("ERR_ENCODING_NOT_SUPPORTED", `The "${x}" encoding is not supported`);
    }
}
export class ERR_EVAL_ESM_CANNOT_PRINT extends NodeError {
    constructor() {
        super("ERR_EVAL_ESM_CANNOT_PRINT", `--print cannot be used with ESM input`);
    }
}
export class ERR_EVENT_RECURSION extends NodeError {
    constructor(x) {
        super("ERR_EVENT_RECURSION", `The event "${x}" is already being dispatched`);
    }
}
export class ERR_FEATURE_UNAVAILABLE_ON_PLATFORM extends NodeTypeError {
    constructor(x) {
        super("ERR_FEATURE_UNAVAILABLE_ON_PLATFORM", `The feature ${x} is unavailable on the current platform, which is being used to run Node.js`);
    }
}
export class ERR_FS_FILE_TOO_LARGE extends NodeRangeError {
    constructor(x) {
        super("ERR_FS_FILE_TOO_LARGE", `File size (${x}) is greater than 2 GB`);
    }
}
export class ERR_FS_INVALID_SYMLINK_TYPE extends NodeError {
    constructor(x) {
        super("ERR_FS_INVALID_SYMLINK_TYPE", `Symlink type must be one of "dir", "file", or "junction". Received "${x}"`);
    }
}
export class ERR_HTTP2_ALTSVC_INVALID_ORIGIN extends NodeTypeError {
    constructor() {
        super("ERR_HTTP2_ALTSVC_INVALID_ORIGIN", `HTTP/2 ALTSVC frames require a valid origin`);
    }
}
export class ERR_HTTP2_ALTSVC_LENGTH extends NodeTypeError {
    constructor() {
        super("ERR_HTTP2_ALTSVC_LENGTH", `HTTP/2 ALTSVC frames are limited to 16382 bytes`);
    }
}
export class ERR_HTTP2_CONNECT_AUTHORITY extends NodeError {
    constructor() {
        super("ERR_HTTP2_CONNECT_AUTHORITY", `:authority header is required for CONNECT requests`);
    }
}
export class ERR_HTTP2_CONNECT_PATH extends NodeError {
    constructor() {
        super("ERR_HTTP2_CONNECT_PATH", `The :path header is forbidden for CONNECT requests`);
    }
}
export class ERR_HTTP2_CONNECT_SCHEME extends NodeError {
    constructor() {
        super("ERR_HTTP2_CONNECT_SCHEME", `The :scheme header is forbidden for CONNECT requests`);
    }
}
export class ERR_HTTP2_GOAWAY_SESSION extends NodeError {
    constructor() {
        super("ERR_HTTP2_GOAWAY_SESSION", `New streams cannot be created after receiving a GOAWAY`);
    }
}
export class ERR_HTTP2_HEADERS_AFTER_RESPOND extends NodeError {
    constructor() {
        super("ERR_HTTP2_HEADERS_AFTER_RESPOND", `Cannot specify additional headers after response initiated`);
    }
}
export class ERR_HTTP2_HEADERS_SENT extends NodeError {
    constructor() {
        super("ERR_HTTP2_HEADERS_SENT", `Response has already been initiated.`);
    }
}
export class ERR_HTTP2_HEADER_SINGLE_VALUE extends NodeTypeError {
    constructor(x) {
        super("ERR_HTTP2_HEADER_SINGLE_VALUE", `Header field "${x}" must only have a single value`);
    }
}
export class ERR_HTTP2_INFO_STATUS_NOT_ALLOWED extends NodeRangeError {
    constructor() {
        super("ERR_HTTP2_INFO_STATUS_NOT_ALLOWED", `Informational status codes cannot be used`);
    }
}
export class ERR_HTTP2_INVALID_CONNECTION_HEADERS extends NodeTypeError {
    constructor(x) {
        super("ERR_HTTP2_INVALID_CONNECTION_HEADERS", `HTTP/1 Connection specific headers are forbidden: "${x}"`);
    }
}
export class ERR_HTTP2_INVALID_HEADER_VALUE extends NodeTypeError {
    constructor(x, y) {
        super("ERR_HTTP2_INVALID_HEADER_VALUE", `Invalid value "${x}" for header "${y}"`);
    }
}
export class ERR_HTTP2_INVALID_INFO_STATUS extends NodeRangeError {
    constructor(x) {
        super("ERR_HTTP2_INVALID_INFO_STATUS", `Invalid informational status code: ${x}`);
    }
}
export class ERR_HTTP2_INVALID_ORIGIN extends NodeTypeError {
    constructor() {
        super("ERR_HTTP2_INVALID_ORIGIN", `HTTP/2 ORIGIN frames require a valid origin`);
    }
}
export class ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH extends NodeRangeError {
    constructor() {
        super("ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH", `Packed settings length must be a multiple of six`);
    }
}
export class ERR_HTTP2_INVALID_PSEUDOHEADER extends NodeTypeError {
    constructor(x) {
        super("ERR_HTTP2_INVALID_PSEUDOHEADER", `"${x}" is an invalid pseudoheader or is used incorrectly`);
    }
}
export class ERR_HTTP2_INVALID_SESSION extends NodeError {
    constructor() {
        super("ERR_HTTP2_INVALID_SESSION", `The session has been destroyed`);
    }
}
export class ERR_HTTP2_INVALID_STREAM extends NodeError {
    constructor() {
        super("ERR_HTTP2_INVALID_STREAM", `The stream has been destroyed`);
    }
}
export class ERR_HTTP2_MAX_PENDING_SETTINGS_ACK extends NodeError {
    constructor() {
        super("ERR_HTTP2_MAX_PENDING_SETTINGS_ACK", `Maximum number of pending settings acknowledgements`);
    }
}
export class ERR_HTTP2_NESTED_PUSH extends NodeError {
    constructor() {
        super("ERR_HTTP2_NESTED_PUSH", `A push stream cannot initiate another push stream.`);
    }
}
export class ERR_HTTP2_NO_SOCKET_MANIPULATION extends NodeError {
    constructor() {
        super("ERR_HTTP2_NO_SOCKET_MANIPULATION", `HTTP/2 sockets should not be directly manipulated (e.g. read and written)`);
    }
}
export class ERR_HTTP2_ORIGIN_LENGTH extends NodeTypeError {
    constructor() {
        super("ERR_HTTP2_ORIGIN_LENGTH", `HTTP/2 ORIGIN frames are limited to 16382 bytes`);
    }
}
export class ERR_HTTP2_OUT_OF_STREAMS extends NodeError {
    constructor() {
        super("ERR_HTTP2_OUT_OF_STREAMS", `No stream ID is available because maximum stream ID has been reached`);
    }
}
export class ERR_HTTP2_PAYLOAD_FORBIDDEN extends NodeError {
    constructor(x) {
        super("ERR_HTTP2_PAYLOAD_FORBIDDEN", `Responses with ${x} status must not have a payload`);
    }
}
export class ERR_HTTP2_PING_CANCEL extends NodeError {
    constructor() {
        super("ERR_HTTP2_PING_CANCEL", `HTTP2 ping cancelled`);
    }
}
export class ERR_HTTP2_PING_LENGTH extends NodeRangeError {
    constructor() {
        super("ERR_HTTP2_PING_LENGTH", `HTTP2 ping payload must be 8 bytes`);
    }
}
export class ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED extends NodeTypeError {
    constructor() {
        super("ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED", `Cannot set HTTP/2 pseudo-headers`);
    }
}
export class ERR_HTTP2_PUSH_DISABLED extends NodeError {
    constructor() {
        super("ERR_HTTP2_PUSH_DISABLED", `HTTP/2 client has disabled push streams`);
    }
}
export class ERR_HTTP2_SEND_FILE extends NodeError {
    constructor() {
        super("ERR_HTTP2_SEND_FILE", `Directories cannot be sent`);
    }
}
export class ERR_HTTP2_SEND_FILE_NOSEEK extends NodeError {
    constructor() {
        super("ERR_HTTP2_SEND_FILE_NOSEEK", `Offset or length can only be specified for regular files`);
    }
}
export class ERR_HTTP2_SESSION_ERROR extends NodeError {
    constructor(x) {
        super("ERR_HTTP2_SESSION_ERROR", `Session closed with error code ${x}`);
    }
}
export class ERR_HTTP2_SETTINGS_CANCEL extends NodeError {
    constructor() {
        super("ERR_HTTP2_SETTINGS_CANCEL", `HTTP2 session settings canceled`);
    }
}
export class ERR_HTTP2_SOCKET_BOUND extends NodeError {
    constructor() {
        super("ERR_HTTP2_SOCKET_BOUND", `The socket is already bound to an Http2Session`);
    }
}
export class ERR_HTTP2_SOCKET_UNBOUND extends NodeError {
    constructor() {
        super("ERR_HTTP2_SOCKET_UNBOUND", `The socket has been disconnected from the Http2Session`);
    }
}
export class ERR_HTTP2_STATUS_101 extends NodeError {
    constructor() {
        super("ERR_HTTP2_STATUS_101", `HTTP status code 101 (Switching Protocols) is forbidden in HTTP/2`);
    }
}
export class ERR_HTTP2_STATUS_INVALID extends NodeRangeError {
    constructor(x) {
        super("ERR_HTTP2_STATUS_INVALID", `Invalid status code: ${x}`);
    }
}
export class ERR_HTTP2_STREAM_ERROR extends NodeError {
    constructor(x) {
        super("ERR_HTTP2_STREAM_ERROR", `Stream closed with error code ${x}`);
    }
}
export class ERR_HTTP2_STREAM_SELF_DEPENDENCY extends NodeError {
    constructor() {
        super("ERR_HTTP2_STREAM_SELF_DEPENDENCY", `A stream cannot depend on itself`);
    }
}
export class ERR_HTTP2_TRAILERS_ALREADY_SENT extends NodeError {
    constructor() {
        super("ERR_HTTP2_TRAILERS_ALREADY_SENT", `Trailing headers have already been sent`);
    }
}
export class ERR_HTTP2_TRAILERS_NOT_READY extends NodeError {
    constructor() {
        super("ERR_HTTP2_TRAILERS_NOT_READY", `Trailing headers cannot be sent until after the wantTrailers event is emitted`);
    }
}
export class ERR_HTTP2_UNSUPPORTED_PROTOCOL extends NodeError {
    constructor(x) {
        super("ERR_HTTP2_UNSUPPORTED_PROTOCOL", `protocol "${x}" is unsupported.`);
    }
}
export class ERR_HTTP_HEADERS_SENT extends NodeError {
    constructor(x) {
        super("ERR_HTTP_HEADERS_SENT", `Cannot ${x} headers after they are sent to the client`);
    }
}
export class ERR_HTTP_INVALID_HEADER_VALUE extends NodeTypeError {
    constructor(x, y) {
        super("ERR_HTTP_INVALID_HEADER_VALUE", `Invalid value "${x}" for header "${y}"`);
    }
}
export class ERR_HTTP_INVALID_STATUS_CODE extends NodeRangeError {
    constructor(x) {
        super("ERR_HTTP_INVALID_STATUS_CODE", `Invalid status code: ${x}`);
    }
}
export class ERR_HTTP_SOCKET_ENCODING extends NodeError {
    constructor() {
        super("ERR_HTTP_SOCKET_ENCODING", `Changing the socket encoding is not allowed per RFC7230 Section 3.`);
    }
}
export class ERR_HTTP_TRAILER_INVALID extends NodeError {
    constructor() {
        super("ERR_HTTP_TRAILER_INVALID", `Trailers are invalid with this transfer encoding`);
    }
}
export class ERR_INCOMPATIBLE_OPTION_PAIR extends NodeTypeError {
    constructor(x, y) {
        super("ERR_INCOMPATIBLE_OPTION_PAIR", `Option "${x}" cannot be used in combination with option "${y}"`);
    }
}
export class ERR_INPUT_TYPE_NOT_ALLOWED extends NodeError {
    constructor() {
        super("ERR_INPUT_TYPE_NOT_ALLOWED", `--input-type can only be used with string input via --eval, --print, or STDIN`);
    }
}
export class ERR_INSPECTOR_ALREADY_ACTIVATED extends NodeError {
    constructor() {
        super("ERR_INSPECTOR_ALREADY_ACTIVATED", `Inspector is already activated. Close it with inspector.close() before activating it again.`);
    }
}
export class ERR_INSPECTOR_ALREADY_CONNECTED extends NodeError {
    constructor(x) {
        super("ERR_INSPECTOR_ALREADY_CONNECTED", `${x} is already connected`);
    }
}
export class ERR_INSPECTOR_CLOSED extends NodeError {
    constructor() {
        super("ERR_INSPECTOR_CLOSED", `Session was closed`);
    }
}
export class ERR_INSPECTOR_COMMAND extends NodeError {
    constructor(x, y) {
        super("ERR_INSPECTOR_COMMAND", `Inspector error ${x}: ${y}`);
    }
}
export class ERR_INSPECTOR_NOT_ACTIVE extends NodeError {
    constructor() {
        super("ERR_INSPECTOR_NOT_ACTIVE", `Inspector is not active`);
    }
}
export class ERR_INSPECTOR_NOT_AVAILABLE extends NodeError {
    constructor() {
        super("ERR_INSPECTOR_NOT_AVAILABLE", `Inspector is not available`);
    }
}
export class ERR_INSPECTOR_NOT_CONNECTED extends NodeError {
    constructor() {
        super("ERR_INSPECTOR_NOT_CONNECTED", `Session is not connected`);
    }
}
export class ERR_INSPECTOR_NOT_WORKER extends NodeError {
    constructor() {
        super("ERR_INSPECTOR_NOT_WORKER", `Current thread is not a worker`);
    }
}
export class ERR_INVALID_ASYNC_ID extends NodeRangeError {
    constructor(x, y) {
        super("ERR_INVALID_ASYNC_ID", `Invalid ${x} value: ${y}`);
    }
}
export class ERR_INVALID_BUFFER_SIZE extends NodeRangeError {
    constructor(x) {
        super("ERR_INVALID_BUFFER_SIZE", `Buffer size must be a multiple of ${x}`);
    }
}
export class ERR_INVALID_CURSOR_POS extends NodeTypeError {
    constructor() {
        super("ERR_INVALID_CURSOR_POS", `Cannot set cursor row without setting its column`);
    }
}
export class ERR_INVALID_FD extends NodeRangeError {
    constructor(x) {
        super("ERR_INVALID_FD", `"fd" must be a positive integer: ${x}`);
    }
}
export class ERR_INVALID_FD_TYPE extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_FD_TYPE", `Unsupported fd type: ${x}`);
    }
}
export class ERR_INVALID_FILE_URL_HOST extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_FILE_URL_HOST", `File URL host must be "localhost" or empty on ${x}`);
    }
}
export class ERR_INVALID_FILE_URL_PATH extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_FILE_URL_PATH", `File URL path ${x}`);
    }
}
export class ERR_INVALID_HANDLE_TYPE extends NodeTypeError {
    constructor() {
        super("ERR_INVALID_HANDLE_TYPE", `This handle type cannot be sent`);
    }
}
export class ERR_INVALID_HTTP_TOKEN extends NodeTypeError {
    constructor(x, y) {
        super("ERR_INVALID_HTTP_TOKEN", `${x} must be a valid HTTP token ["${y}"]`);
    }
}
export class ERR_INVALID_IP_ADDRESS extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_IP_ADDRESS", `Invalid IP address: ${x}`);
    }
}
export class ERR_INVALID_OPT_VALUE_ENCODING extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_OPT_VALUE_ENCODING", `The value "${x}" is invalid for option "encoding"`);
    }
}
export class ERR_INVALID_PERFORMANCE_MARK extends NodeError {
    constructor(x) {
        super("ERR_INVALID_PERFORMANCE_MARK", `The "${x}" performance mark has not been set`);
    }
}
export class ERR_INVALID_PROTOCOL extends NodeTypeError {
    constructor(x, y) {
        super("ERR_INVALID_PROTOCOL", `Protocol "${x}" not supported. Expected "${y}"`);
    }
}
export class ERR_INVALID_REPL_EVAL_CONFIG extends NodeTypeError {
    constructor() {
        super("ERR_INVALID_REPL_EVAL_CONFIG", `Cannot specify both "breakEvalOnSigint" and "eval" for REPL`);
    }
}
export class ERR_INVALID_REPL_INPUT extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_REPL_INPUT", `${x}`);
    }
}
export class ERR_INVALID_SYNC_FORK_INPUT extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_SYNC_FORK_INPUT", `Asynchronous forks do not support Buffer, TypedArray, DataView or string input: ${x}`);
    }
}
export class ERR_INVALID_THIS extends NodeTypeError {
    constructor(x) {
        super("ERR_INVALID_THIS", `Value of "this" must be of type ${x}`);
    }
}
export class ERR_INVALID_TUPLE extends NodeTypeError {
    constructor(x, y) {
        super("ERR_INVALID_TUPLE", `${x} must be an iterable ${y} tuple`);
    }
}
export class ERR_INVALID_URI extends NodeURIError {
    constructor() {
        super("ERR_INVALID_URI", `URI malformed`);
    }
}
export class ERR_IPC_CHANNEL_CLOSED extends NodeError {
    constructor() {
        super("ERR_IPC_CHANNEL_CLOSED", `Channel closed`);
    }
}
export class ERR_IPC_DISCONNECTED extends NodeError {
    constructor() {
        super("ERR_IPC_DISCONNECTED", `IPC channel is already disconnected`);
    }
}
export class ERR_IPC_ONE_PIPE extends NodeError {
    constructor() {
        super("ERR_IPC_ONE_PIPE", `Child process can have only one IPC pipe`);
    }
}
export class ERR_IPC_SYNC_FORK extends NodeError {
    constructor() {
        super("ERR_IPC_SYNC_FORK", `IPC cannot be used with synchronous forks`);
    }
}
export class ERR_MANIFEST_DEPENDENCY_MISSING extends NodeError {
    constructor(x, y) {
        super("ERR_MANIFEST_DEPENDENCY_MISSING", `Manifest resource ${x} does not list ${y} as a dependency specifier`);
    }
}
export class ERR_MANIFEST_INTEGRITY_MISMATCH extends NodeSyntaxError {
    constructor(x) {
        super("ERR_MANIFEST_INTEGRITY_MISMATCH", `Manifest resource ${x} has multiple entries but integrity lists do not match`);
    }
}
export class ERR_MANIFEST_INVALID_RESOURCE_FIELD extends NodeTypeError {
    constructor(x, y) {
        super("ERR_MANIFEST_INVALID_RESOURCE_FIELD", `Manifest resource ${x} has invalid property value for ${y}`);
    }
}
export class ERR_MANIFEST_TDZ extends NodeError {
    constructor() {
        super("ERR_MANIFEST_TDZ", `Manifest initialization has not yet run`);
    }
}
export class ERR_MANIFEST_UNKNOWN_ONERROR extends NodeSyntaxError {
    constructor(x) {
        super("ERR_MANIFEST_UNKNOWN_ONERROR", `Manifest specified unknown error behavior "${x}".`);
    }
}
export class ERR_METHOD_NOT_IMPLEMENTED extends NodeError {
    constructor(x) {
        super("ERR_METHOD_NOT_IMPLEMENTED", `The ${x} method is not implemented`);
    }
}
export class ERR_MISSING_ARGS extends NodeTypeError {
    constructor(...args) {
        let msg = "The ";
        const len = args.length;
        const wrap = (a) => `"${a}"`;
        args = args.map((a) => Array.isArray(a) ? a.map(wrap).join(" or ") : wrap(a));
        switch (len) {
            case 1:
                msg += `${args[0]} argument`;
                break;
            case 2:
                msg += `${args[0]} and ${args[1]} arguments`;
                break;
            default:
                msg += args.slice(0, len - 1).join(", ");
                msg += `, and ${args[len - 1]} arguments`;
                break;
        }
        super("ERR_MISSING_ARGS", `${msg} must be specified`);
    }
}
export class ERR_MISSING_OPTION extends NodeTypeError {
    constructor(x) {
        super("ERR_MISSING_OPTION", `${x} is required`);
    }
}
export class ERR_MULTIPLE_CALLBACK extends NodeError {
    constructor() {
        super("ERR_MULTIPLE_CALLBACK", `Callback called multiple times`);
    }
}
export class ERR_NAPI_CONS_FUNCTION extends NodeTypeError {
    constructor() {
        super("ERR_NAPI_CONS_FUNCTION", `Constructor must be a function`);
    }
}
export class ERR_NAPI_INVALID_DATAVIEW_ARGS extends NodeRangeError {
    constructor() {
        super("ERR_NAPI_INVALID_DATAVIEW_ARGS", `byte_offset + byte_length should be less than or equal to the size in bytes of the array passed in`);
    }
}
export class ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT extends NodeRangeError {
    constructor(x, y) {
        super("ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT", `start offset of ${x} should be a multiple of ${y}`);
    }
}
export class ERR_NAPI_INVALID_TYPEDARRAY_LENGTH extends NodeRangeError {
    constructor() {
        super("ERR_NAPI_INVALID_TYPEDARRAY_LENGTH", `Invalid typed array length`);
    }
}
export class ERR_NO_CRYPTO extends NodeError {
    constructor() {
        super("ERR_NO_CRYPTO", `Node.js is not compiled with OpenSSL crypto support`);
    }
}
export class ERR_NO_ICU extends NodeTypeError {
    constructor(x) {
        super("ERR_NO_ICU", `${x} is not supported on Node.js compiled without ICU`);
    }
}
export class ERR_QUICCLIENTSESSION_FAILED extends NodeError {
    constructor(x) {
        super("ERR_QUICCLIENTSESSION_FAILED", `Failed to create a new QuicClientSession: ${x}`);
    }
}
export class ERR_QUICCLIENTSESSION_FAILED_SETSOCKET extends NodeError {
    constructor() {
        super("ERR_QUICCLIENTSESSION_FAILED_SETSOCKET", `Failed to set the QuicSocket`);
    }
}
export class ERR_QUICSESSION_DESTROYED extends NodeError {
    constructor(x) {
        super("ERR_QUICSESSION_DESTROYED", `Cannot call ${x} after a QuicSession has been destroyed`);
    }
}
export class ERR_QUICSESSION_INVALID_DCID extends NodeError {
    constructor(x) {
        super("ERR_QUICSESSION_INVALID_DCID", `Invalid DCID value: ${x}`);
    }
}
export class ERR_QUICSESSION_UPDATEKEY extends NodeError {
    constructor() {
        super("ERR_QUICSESSION_UPDATEKEY", `Unable to update QuicSession keys`);
    }
}
export class ERR_QUICSOCKET_DESTROYED extends NodeError {
    constructor(x) {
        super("ERR_QUICSOCKET_DESTROYED", `Cannot call ${x} after a QuicSocket has been destroyed`);
    }
}
export class ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH extends NodeError {
    constructor() {
        super("ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH", `The stateResetToken must be exactly 16-bytes in length`);
    }
}
export class ERR_QUICSOCKET_LISTENING extends NodeError {
    constructor() {
        super("ERR_QUICSOCKET_LISTENING", `This QuicSocket is already listening`);
    }
}
export class ERR_QUICSOCKET_UNBOUND extends NodeError {
    constructor(x) {
        super("ERR_QUICSOCKET_UNBOUND", `Cannot call ${x} before a QuicSocket has been bound`);
    }
}
export class ERR_QUICSTREAM_DESTROYED extends NodeError {
    constructor(x) {
        super("ERR_QUICSTREAM_DESTROYED", `Cannot call ${x} after a QuicStream has been destroyed`);
    }
}
export class ERR_QUICSTREAM_INVALID_PUSH extends NodeError {
    constructor() {
        super("ERR_QUICSTREAM_INVALID_PUSH", `Push streams are only supported on client-initiated, bidirectional streams`);
    }
}
export class ERR_QUICSTREAM_OPEN_FAILED extends NodeError {
    constructor() {
        super("ERR_QUICSTREAM_OPEN_FAILED", `Opening a new QuicStream failed`);
    }
}
export class ERR_QUICSTREAM_UNSUPPORTED_PUSH extends NodeError {
    constructor() {
        super("ERR_QUICSTREAM_UNSUPPORTED_PUSH", `Push streams are not supported on this QuicSession`);
    }
}
export class ERR_QUIC_TLS13_REQUIRED extends NodeError {
    constructor() {
        super("ERR_QUIC_TLS13_REQUIRED", `QUIC requires TLS version 1.3`);
    }
}
export class ERR_SCRIPT_EXECUTION_INTERRUPTED extends NodeError {
    constructor() {
        super("ERR_SCRIPT_EXECUTION_INTERRUPTED", "Script execution was interrupted by `SIGINT`");
    }
}
export class ERR_SERVER_ALREADY_LISTEN extends NodeError {
    constructor() {
        super("ERR_SERVER_ALREADY_LISTEN", `Listen method has been called more than once without closing.`);
    }
}
export class ERR_SERVER_NOT_RUNNING extends NodeError {
    constructor() {
        super("ERR_SERVER_NOT_RUNNING", `Server is not running.`);
    }
}
export class ERR_SOCKET_ALREADY_BOUND extends NodeError {
    constructor() {
        super("ERR_SOCKET_ALREADY_BOUND", `Socket is already bound`);
    }
}
export class ERR_SOCKET_BAD_BUFFER_SIZE extends NodeTypeError {
    constructor() {
        super("ERR_SOCKET_BAD_BUFFER_SIZE", `Buffer size must be a positive integer`);
    }
}
export class ERR_SOCKET_BAD_PORT extends NodeRangeError {
    constructor(name, port, allowZero = true) {
        assert(typeof allowZero === "boolean", "The 'allowZero' argument must be of type boolean.");
        const operator = allowZero ? ">=" : ">";
        super("ERR_SOCKET_BAD_PORT", `${name} should be ${operator} 0 and < 65536. Received ${port}.`);
    }
}
export class ERR_SOCKET_BAD_TYPE extends NodeTypeError {
    constructor() {
        super("ERR_SOCKET_BAD_TYPE", `Bad socket type specified. Valid types are: udp4, udp6`);
    }
}
export class ERR_SOCKET_BUFFER_SIZE extends NodeSystemError {
    constructor(ctx) {
        super("ERR_SOCKET_BUFFER_SIZE", ctx, "Could not get or set buffer size");
    }
}
export class ERR_SOCKET_CLOSED extends NodeError {
    constructor() {
        super("ERR_SOCKET_CLOSED", `Socket is closed`);
    }
}
export class ERR_SOCKET_DGRAM_IS_CONNECTED extends NodeError {
    constructor() {
        super("ERR_SOCKET_DGRAM_IS_CONNECTED", `Already connected`);
    }
}
export class ERR_SOCKET_DGRAM_NOT_CONNECTED extends NodeError {
    constructor() {
        super("ERR_SOCKET_DGRAM_NOT_CONNECTED", `Not connected`);
    }
}
export class ERR_SOCKET_DGRAM_NOT_RUNNING extends NodeError {
    constructor() {
        super("ERR_SOCKET_DGRAM_NOT_RUNNING", `Not running`);
    }
}
export class ERR_SRI_PARSE extends NodeSyntaxError {
    constructor(name, char, position) {
        super("ERR_SRI_PARSE", `Subresource Integrity string ${name} had an unexpected ${char} at position ${position}`);
    }
}
export class ERR_STREAM_ALREADY_FINISHED extends NodeError {
    constructor(x) {
        super("ERR_STREAM_ALREADY_FINISHED", `Cannot call ${x} after a stream was finished`);
    }
}
export class ERR_STREAM_CANNOT_PIPE extends NodeError {
    constructor() {
        super("ERR_STREAM_CANNOT_PIPE", `Cannot pipe, not readable`);
    }
}
export class ERR_STREAM_DESTROYED extends NodeError {
    constructor(x) {
        super("ERR_STREAM_DESTROYED", `Cannot call ${x} after a stream was destroyed`);
    }
}
export class ERR_STREAM_NULL_VALUES extends NodeTypeError {
    constructor() {
        super("ERR_STREAM_NULL_VALUES", `May not write null values to stream`);
    }
}
export class ERR_STREAM_PREMATURE_CLOSE extends NodeError {
    constructor() {
        super("ERR_STREAM_PREMATURE_CLOSE", `Premature close`);
    }
}
export class ERR_STREAM_PUSH_AFTER_EOF extends NodeError {
    constructor() {
        super("ERR_STREAM_PUSH_AFTER_EOF", `stream.push() after EOF`);
    }
}
export class ERR_STREAM_UNSHIFT_AFTER_END_EVENT extends NodeError {
    constructor() {
        super("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", `stream.unshift() after end event`);
    }
}
export class ERR_STREAM_WRAP extends NodeError {
    constructor() {
        super("ERR_STREAM_WRAP", `Stream has StringDecoder set or is in objectMode`);
    }
}
export class ERR_STREAM_WRITE_AFTER_END extends NodeError {
    constructor() {
        super("ERR_STREAM_WRITE_AFTER_END", `write after end`);
    }
}
export class ERR_SYNTHETIC extends NodeError {
    constructor() {
        super("ERR_SYNTHETIC", `JavaScript Callstack`);
    }
}
export class ERR_TLS_CERT_ALTNAME_INVALID extends NodeError {
    reason;
    host;
    cert;
    constructor(reason, host, cert) {
        super("ERR_TLS_CERT_ALTNAME_INVALID", `Hostname/IP does not match certificate's altnames: ${reason}`);
        this.reason = reason;
        this.host = host;
        this.cert = cert;
    }
}
export class ERR_TLS_DH_PARAM_SIZE extends NodeError {
    constructor(x) {
        super("ERR_TLS_DH_PARAM_SIZE", `DH parameter size ${x} is less than 2048`);
    }
}
export class ERR_TLS_HANDSHAKE_TIMEOUT extends NodeError {
    constructor() {
        super("ERR_TLS_HANDSHAKE_TIMEOUT", `TLS handshake timeout`);
    }
}
export class ERR_TLS_INVALID_CONTEXT extends NodeTypeError {
    constructor(x) {
        super("ERR_TLS_INVALID_CONTEXT", `${x} must be a SecureContext`);
    }
}
export class ERR_TLS_INVALID_STATE extends NodeError {
    constructor() {
        super("ERR_TLS_INVALID_STATE", `TLS socket connection must be securely established`);
    }
}
export class ERR_TLS_INVALID_PROTOCOL_VERSION extends NodeTypeError {
    constructor(protocol, x) {
        super("ERR_TLS_INVALID_PROTOCOL_VERSION", `${protocol} is not a valid ${x} TLS protocol version`);
    }
}
export class ERR_TLS_PROTOCOL_VERSION_CONFLICT extends NodeTypeError {
    constructor(prevProtocol, protocol) {
        super("ERR_TLS_PROTOCOL_VERSION_CONFLICT", `TLS protocol version ${prevProtocol} conflicts with secureProtocol ${protocol}`);
    }
}
export class ERR_TLS_RENEGOTIATION_DISABLED extends NodeError {
    constructor() {
        super("ERR_TLS_RENEGOTIATION_DISABLED", `TLS session renegotiation disabled for this socket`);
    }
}
export class ERR_TLS_REQUIRED_SERVER_NAME extends NodeError {
    constructor() {
        super("ERR_TLS_REQUIRED_SERVER_NAME", `"servername" is required parameter for Server.addContext`);
    }
}
export class ERR_TLS_SESSION_ATTACK extends NodeError {
    constructor() {
        super("ERR_TLS_SESSION_ATTACK", `TLS session renegotiation attack detected`);
    }
}
export class ERR_TLS_SNI_FROM_SERVER extends NodeError {
    constructor() {
        super("ERR_TLS_SNI_FROM_SERVER", `Cannot issue SNI from a TLS server-side socket`);
    }
}
export class ERR_TRACE_EVENTS_CATEGORY_REQUIRED extends NodeTypeError {
    constructor() {
        super("ERR_TRACE_EVENTS_CATEGORY_REQUIRED", `At least one category is required`);
    }
}
export class ERR_TRACE_EVENTS_UNAVAILABLE extends NodeError {
    constructor() {
        super("ERR_TRACE_EVENTS_UNAVAILABLE", `Trace events are unavailable`);
    }
}
export class ERR_UNAVAILABLE_DURING_EXIT extends NodeError {
    constructor() {
        super("ERR_UNAVAILABLE_DURING_EXIT", `Cannot call function in process exit handler`);
    }
}
export class ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET extends NodeError {
    constructor() {
        super("ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET", "`process.setupUncaughtExceptionCapture()` was called while a capture callback was already active");
    }
}
export class ERR_UNESCAPED_CHARACTERS extends NodeTypeError {
    constructor(x) {
        super("ERR_UNESCAPED_CHARACTERS", `${x} contains unescaped characters`);
    }
}
export class ERR_UNHANDLED_ERROR extends NodeError {
    constructor(x) {
        super("ERR_UNHANDLED_ERROR", `Unhandled error. (${x})`);
    }
}
export class ERR_UNKNOWN_BUILTIN_MODULE extends NodeError {
    constructor(x) {
        super("ERR_UNKNOWN_BUILTIN_MODULE", `No such built-in module: ${x}`);
    }
}
export class ERR_UNKNOWN_CREDENTIAL extends NodeError {
    constructor(x, y) {
        super("ERR_UNKNOWN_CREDENTIAL", `${x} identifier does not exist: ${y}`);
    }
}
export class ERR_UNKNOWN_ENCODING extends NodeTypeError {
    constructor(x) {
        super("ERR_UNKNOWN_ENCODING", `Unknown encoding: ${x}`);
    }
}
export class ERR_UNKNOWN_FILE_EXTENSION extends NodeTypeError {
    constructor(x, y) {
        super("ERR_UNKNOWN_FILE_EXTENSION", `Unknown file extension "${x}" for ${y}`);
    }
}
export class ERR_UNKNOWN_MODULE_FORMAT extends NodeRangeError {
    constructor(x) {
        super("ERR_UNKNOWN_MODULE_FORMAT", `Unknown module format: ${x}`);
    }
}
export class ERR_UNKNOWN_SIGNAL extends NodeTypeError {
    constructor(x) {
        super("ERR_UNKNOWN_SIGNAL", `Unknown signal: ${x}`);
    }
}
export class ERR_UNSUPPORTED_DIR_IMPORT extends NodeError {
    constructor(x, y) {
        super("ERR_UNSUPPORTED_DIR_IMPORT", `Directory import '${x}' is not supported resolving ES modules, imported from ${y}`);
    }
}
export class ERR_UNSUPPORTED_ESM_URL_SCHEME extends NodeError {
    constructor() {
        super("ERR_UNSUPPORTED_ESM_URL_SCHEME", `Only file and data URLs are supported by the default ESM loader`);
    }
}
export class ERR_USE_AFTER_CLOSE extends NodeError {
    constructor(x) {
        super("ERR_USE_AFTER_CLOSE", `${x} was closed`);
    }
}
export class ERR_V8BREAKITERATOR extends NodeError {
    constructor() {
        super("ERR_V8BREAKITERATOR", `Full ICU data not installed. See https://github.com/nodejs/node/wiki/Intl`);
    }
}
export class ERR_VALID_PERFORMANCE_ENTRY_TYPE extends NodeError {
    constructor() {
        super("ERR_VALID_PERFORMANCE_ENTRY_TYPE", `At least one valid performance entry type is required`);
    }
}
export class ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING extends NodeTypeError {
    constructor() {
        super("ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING", `A dynamic import callback was not specified.`);
    }
}
export class ERR_VM_MODULE_ALREADY_LINKED extends NodeError {
    constructor() {
        super("ERR_VM_MODULE_ALREADY_LINKED", `Module has already been linked`);
    }
}
export class ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA extends NodeError {
    constructor() {
        super("ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA", `Cached data cannot be created for a module which has been evaluated`);
    }
}
export class ERR_VM_MODULE_DIFFERENT_CONTEXT extends NodeError {
    constructor() {
        super("ERR_VM_MODULE_DIFFERENT_CONTEXT", `Linked modules must use the same context`);
    }
}
export class ERR_VM_MODULE_LINKING_ERRORED extends NodeError {
    constructor() {
        super("ERR_VM_MODULE_LINKING_ERRORED", `Linking has already failed for the provided module`);
    }
}
export class ERR_VM_MODULE_NOT_MODULE extends NodeError {
    constructor() {
        super("ERR_VM_MODULE_NOT_MODULE", `Provided module is not an instance of Module`);
    }
}
export class ERR_VM_MODULE_STATUS extends NodeError {
    constructor(x) {
        super("ERR_VM_MODULE_STATUS", `Module status ${x}`);
    }
}
export class ERR_WASI_ALREADY_STARTED extends NodeError {
    constructor() {
        super("ERR_WASI_ALREADY_STARTED", `WASI instance has already started`);
    }
}
export class ERR_WORKER_INIT_FAILED extends NodeError {
    constructor(x) {
        super("ERR_WORKER_INIT_FAILED", `Worker initialization failure: ${x}`);
    }
}
export class ERR_WORKER_NOT_RUNNING extends NodeError {
    constructor() {
        super("ERR_WORKER_NOT_RUNNING", `Worker instance not running`);
    }
}
export class ERR_WORKER_OUT_OF_MEMORY extends NodeError {
    constructor(x) {
        super("ERR_WORKER_OUT_OF_MEMORY", `Worker terminated due to reaching memory limit: ${x}`);
    }
}
export class ERR_WORKER_UNSERIALIZABLE_ERROR extends NodeError {
    constructor() {
        super("ERR_WORKER_UNSERIALIZABLE_ERROR", `Serializing an uncaught exception failed`);
    }
}
export class ERR_WORKER_UNSUPPORTED_EXTENSION extends NodeTypeError {
    constructor(x) {
        super("ERR_WORKER_UNSUPPORTED_EXTENSION", `The worker script extension must be ".js", ".mjs", or ".cjs". Received "${x}"`);
    }
}
export class ERR_WORKER_UNSUPPORTED_OPERATION extends NodeTypeError {
    constructor(x) {
        super("ERR_WORKER_UNSUPPORTED_OPERATION", `${x} is not supported in workers`);
    }
}
export class ERR_ZLIB_INITIALIZATION_FAILED extends NodeError {
    constructor() {
        super("ERR_ZLIB_INITIALIZATION_FAILED", `Initialization failed`);
    }
}
export class ERR_FALSY_VALUE_REJECTION extends NodeError {
    reason;
    constructor(reason) {
        super("ERR_FALSY_VALUE_REJECTION", "Promise was rejected with falsy value");
        this.reason = reason;
    }
}
export class ERR_HTTP2_INVALID_SETTING_VALUE extends NodeRangeError {
    actual;
    min;
    max;
    constructor(name, actual, min, max) {
        super("ERR_HTTP2_INVALID_SETTING_VALUE", `Invalid value for setting "${name}": ${actual}`);
        this.actual = actual;
        if (min !== undefined) {
            this.min = min;
            this.max = max;
        }
    }
}
export class ERR_HTTP2_STREAM_CANCEL extends NodeError {
    cause;
    constructor(error) {
        super("ERR_HTTP2_STREAM_CANCEL", typeof error.message === "string"
            ? `The pending stream has been canceled (caused by: ${error.message})`
            : "The pending stream has been canceled");
        if (error) {
            this.cause = error;
        }
    }
}
export class ERR_INVALID_ADDRESS_FAMILY extends NodeRangeError {
    host;
    port;
    constructor(addressType, host, port) {
        super("ERR_INVALID_ADDRESS_FAMILY", `Invalid address family: ${addressType} ${host}:${port}`);
        this.host = host;
        this.port = port;
    }
}
export class ERR_INVALID_CHAR extends NodeTypeError {
    constructor(name, field) {
        super("ERR_INVALID_CHAR", field
            ? `Invalid character in ${name}`
            : `Invalid character in ${name} ["${field}"]`);
    }
}
export class ERR_INVALID_OPT_VALUE extends NodeTypeError {
    constructor(name, value) {
        super("ERR_INVALID_OPT_VALUE", `The value "${value}" is invalid for option "${name}"`);
    }
}
export class ERR_INVALID_RETURN_PROPERTY extends NodeTypeError {
    constructor(input, name, prop, value) {
        super("ERR_INVALID_RETURN_PROPERTY", `Expected a valid ${input} to be returned for the "${prop}" from the "${name}" function but got ${value}.`);
    }
}
function buildReturnPropertyType(value) {
    if (value && value.constructor && value.constructor.name) {
        return `instance of ${value.constructor.name}`;
    }
    else {
        return `type ${typeof value}`;
    }
}
export class ERR_INVALID_RETURN_PROPERTY_VALUE extends NodeTypeError {
    constructor(input, name, prop, value) {
        super("ERR_INVALID_RETURN_PROPERTY_VALUE", `Expected ${input} to be returned for the "${prop}" from the "${name}" function but got ${buildReturnPropertyType(value)}.`);
    }
}
export class ERR_INVALID_RETURN_VALUE extends NodeTypeError {
    constructor(input, name, value) {
        super("ERR_INVALID_RETURN_VALUE", `Expected ${input} to be returned from the "${name}" function but got ${determineSpecificType(value)}.`);
    }
}
export class ERR_INVALID_URL extends NodeTypeError {
    input;
    constructor(input) {
        super("ERR_INVALID_URL", `Invalid URL: ${input}`);
        this.input = input;
    }
}
export class ERR_INVALID_URL_SCHEME extends NodeTypeError {
    constructor(expected) {
        expected = Array.isArray(expected) ? expected : [expected];
        const res = expected.length === 2
            ? `one of scheme ${expected[0]} or ${expected[1]}`
            : `of scheme ${expected[0]}`;
        super("ERR_INVALID_URL_SCHEME", `The URL must be ${res}`);
    }
}
export class ERR_MODULE_NOT_FOUND extends NodeError {
    constructor(path, base, type = "package") {
        super("ERR_MODULE_NOT_FOUND", `Cannot find ${type} '${path}' imported from ${base}`);
    }
}
export class ERR_INVALID_PACKAGE_CONFIG extends NodeError {
    constructor(path, base, message) {
        const msg = `Invalid package config ${path}${base ? ` while importing ${base}` : ""}${message ? `. ${message}` : ""}`;
        super("ERR_INVALID_PACKAGE_CONFIG", msg);
    }
}
export class ERR_INVALID_MODULE_SPECIFIER extends NodeTypeError {
    constructor(request, reason, base) {
        super("ERR_INVALID_MODULE_SPECIFIER", `Invalid module "${request}" ${reason}${base ? ` imported from ${base}` : ""}`);
    }
}
export class ERR_INVALID_PACKAGE_TARGET extends NodeError {
    constructor(pkgPath, key, target, isImport, base) {
        let msg;
        const relError = typeof target === "string" &&
            !isImport &&
            target.length &&
            !target.startsWith("./");
        if (key === ".") {
            assert(isImport === false);
            msg = `Invalid "exports" main target ${JSON.stringify(target)} defined ` +
                `in the package config ${pkgPath}package.json${base ? ` imported from ${base}` : ""}${relError ? '; targets must start with "./"' : ""}`;
        }
        else {
            msg = `Invalid "${isImport ? "imports" : "exports"}" target ${JSON.stringify(target)} defined for '${key}' in the package config ${pkgPath}package.json${base ? ` imported from ${base}` : ""}${relError ? '; targets must start with "./"' : ""}`;
        }
        super("ERR_INVALID_PACKAGE_TARGET", msg);
    }
}
export class ERR_PACKAGE_IMPORT_NOT_DEFINED extends NodeTypeError {
    constructor(specifier, packagePath, base) {
        const msg = `Package import specifier "${specifier}" is not defined${packagePath ? ` in package ${packagePath}package.json` : ""} imported from ${base}`;
        super("ERR_PACKAGE_IMPORT_NOT_DEFINED", msg);
    }
}
export class ERR_PACKAGE_PATH_NOT_EXPORTED extends NodeError {
    constructor(subpath, pkgPath, basePath) {
        let msg;
        if (subpath === ".") {
            msg = `No "exports" main defined in ${pkgPath}package.json${basePath ? ` imported from ${basePath}` : ""}`;
        }
        else {
            msg =
                `Package subpath '${subpath}' is not defined by "exports" in ${pkgPath}package.json${basePath ? ` imported from ${basePath}` : ""}`;
        }
        super("ERR_PACKAGE_PATH_NOT_EXPORTED", msg);
    }
}
export class ERR_INTERNAL_ASSERTION extends NodeError {
    constructor(message) {
        const suffix = "This is caused by either a bug in Node.js " +
            "or incorrect usage of Node.js internals.\n" +
            "Please open an issue with this stack trace at " +
            "https://github.com/nodejs/node/issues\n";
        super("ERR_INTERNAL_ASSERTION", message === undefined ? suffix : `${message}\n${suffix}`);
    }
}
export class ERR_FS_RMDIR_ENOTDIR extends NodeSystemError {
    constructor(path) {
        const code = isWindows ? "ENOENT" : "ENOTDIR";
        const ctx = {
            message: "not a directory",
            path,
            syscall: "rmdir",
            code,
            errno: isWindows ? ENOENT : ENOTDIR,
        };
        super(code, ctx, "Path is not a directory");
    }
}
export function denoErrorToNodeError(e, ctx) {
    const errno = extractOsErrorNumberFromErrorMessage(e);
    if (typeof errno === "undefined") {
        return e;
    }
    const ex = uvException({
        errno: mapSysErrnoToUvErrno(errno),
        ...ctx,
    });
    return ex;
}
function extractOsErrorNumberFromErrorMessage(e) {
    const match = e instanceof Error
        ? e.message.match(/\(os error (\d+)\)/)
        : false;
    if (match) {
        return +match[1];
    }
    return undefined;
}
export function connResetException(msg) {
    const ex = new Error(msg);
    ex.code = "ECONNRESET";
    return ex;
}
export function aggregateTwoErrors(innerError, outerError) {
    if (innerError && outerError && innerError !== outerError) {
        if (Array.isArray(outerError.errors)) {
            outerError.errors.push(innerError);
            return outerError;
        }
        const err = new AggregateError([
            outerError,
            innerError,
        ], outerError.message);
        err.code = outerError.code;
        return err;
    }
    return innerError || outerError;
}
codes.ERR_IPC_CHANNEL_CLOSED = ERR_IPC_CHANNEL_CLOSED;
codes.ERR_INVALID_ARG_TYPE = ERR_INVALID_ARG_TYPE;
codes.ERR_INVALID_ARG_VALUE = ERR_INVALID_ARG_VALUE;
codes.ERR_OUT_OF_RANGE = ERR_OUT_OF_RANGE;
codes.ERR_SOCKET_BAD_PORT = ERR_SOCKET_BAD_PORT;
codes.ERR_BUFFER_OUT_OF_BOUNDS = ERR_BUFFER_OUT_OF_BOUNDS;
codes.ERR_UNKNOWN_ENCODING = ERR_UNKNOWN_ENCODING;
const genericNodeError = hideStackFrames(function genericNodeError(message, errorProperties) {
    const err = new Error(message);
    Object.assign(err, errorProperties);
    return err;
});
function determineSpecificType(value) {
    if (value == null) {
        return "" + value;
    }
    if (typeof value === "function" && value.name) {
        return `function ${value.name}`;
    }
    if (typeof value === "object") {
        if (value.constructor?.name) {
            return `an instance of ${value.constructor.name}`;
        }
        return `${inspect(value, { depth: -1 })}`;
    }
    let inspected = inspect(value, { colors: false });
    if (inspected.length > 28)
        inspected = `${inspected.slice(0, 25)}...`;
    return `type ${typeof value} (${inspected})`;
}
export { codes, genericNodeError, hideStackFrames };
export default {
    AbortError,
    ERR_AMBIGUOUS_ARGUMENT,
    ERR_ARG_NOT_ITERABLE,
    ERR_ASSERTION,
    ERR_ASYNC_CALLBACK,
    ERR_ASYNC_TYPE,
    ERR_BROTLI_INVALID_PARAM,
    ERR_BUFFER_OUT_OF_BOUNDS,
    ERR_BUFFER_TOO_LARGE,
    ERR_CANNOT_WATCH_SIGINT,
    ERR_CHILD_CLOSED_BEFORE_REPLY,
    ERR_CHILD_PROCESS_IPC_REQUIRED,
    ERR_CHILD_PROCESS_STDIO_MAXBUFFER,
    ERR_CONSOLE_WRITABLE_STREAM,
    ERR_CONTEXT_NOT_INITIALIZED,
    ERR_CPU_USAGE,
    ERR_CRYPTO_CUSTOM_ENGINE_NOT_SUPPORTED,
    ERR_CRYPTO_ECDH_INVALID_FORMAT,
    ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY,
    ERR_CRYPTO_ENGINE_UNKNOWN,
    ERR_CRYPTO_FIPS_FORCED,
    ERR_CRYPTO_FIPS_UNAVAILABLE,
    ERR_CRYPTO_HASH_FINALIZED,
    ERR_CRYPTO_HASH_UPDATE_FAILED,
    ERR_CRYPTO_INCOMPATIBLE_KEY,
    ERR_CRYPTO_INCOMPATIBLE_KEY_OPTIONS,
    ERR_CRYPTO_INVALID_DIGEST,
    ERR_CRYPTO_INVALID_KEY_OBJECT_TYPE,
    ERR_CRYPTO_INVALID_STATE,
    ERR_CRYPTO_PBKDF2_ERROR,
    ERR_CRYPTO_SCRYPT_INVALID_PARAMETER,
    ERR_CRYPTO_SCRYPT_NOT_SUPPORTED,
    ERR_CRYPTO_SIGN_KEY_REQUIRED,
    ERR_DIR_CLOSED,
    ERR_DIR_CONCURRENT_OPERATION,
    ERR_DNS_SET_SERVERS_FAILED,
    ERR_DOMAIN_CALLBACK_NOT_AVAILABLE,
    ERR_DOMAIN_CANNOT_SET_UNCAUGHT_EXCEPTION_CAPTURE,
    ERR_ENCODING_INVALID_ENCODED_DATA,
    ERR_ENCODING_NOT_SUPPORTED,
    ERR_EVAL_ESM_CANNOT_PRINT,
    ERR_EVENT_RECURSION,
    ERR_FALSY_VALUE_REJECTION,
    ERR_FEATURE_UNAVAILABLE_ON_PLATFORM,
    ERR_FS_EISDIR,
    ERR_FS_FILE_TOO_LARGE,
    ERR_FS_INVALID_SYMLINK_TYPE,
    ERR_FS_RMDIR_ENOTDIR,
    ERR_HTTP2_ALTSVC_INVALID_ORIGIN,
    ERR_HTTP2_ALTSVC_LENGTH,
    ERR_HTTP2_CONNECT_AUTHORITY,
    ERR_HTTP2_CONNECT_PATH,
    ERR_HTTP2_CONNECT_SCHEME,
    ERR_HTTP2_GOAWAY_SESSION,
    ERR_HTTP2_HEADERS_AFTER_RESPOND,
    ERR_HTTP2_HEADERS_SENT,
    ERR_HTTP2_HEADER_SINGLE_VALUE,
    ERR_HTTP2_INFO_STATUS_NOT_ALLOWED,
    ERR_HTTP2_INVALID_CONNECTION_HEADERS,
    ERR_HTTP2_INVALID_HEADER_VALUE,
    ERR_HTTP2_INVALID_INFO_STATUS,
    ERR_HTTP2_INVALID_ORIGIN,
    ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH,
    ERR_HTTP2_INVALID_PSEUDOHEADER,
    ERR_HTTP2_INVALID_SESSION,
    ERR_HTTP2_INVALID_SETTING_VALUE,
    ERR_HTTP2_INVALID_STREAM,
    ERR_HTTP2_MAX_PENDING_SETTINGS_ACK,
    ERR_HTTP2_NESTED_PUSH,
    ERR_HTTP2_NO_SOCKET_MANIPULATION,
    ERR_HTTP2_ORIGIN_LENGTH,
    ERR_HTTP2_OUT_OF_STREAMS,
    ERR_HTTP2_PAYLOAD_FORBIDDEN,
    ERR_HTTP2_PING_CANCEL,
    ERR_HTTP2_PING_LENGTH,
    ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED,
    ERR_HTTP2_PUSH_DISABLED,
    ERR_HTTP2_SEND_FILE,
    ERR_HTTP2_SEND_FILE_NOSEEK,
    ERR_HTTP2_SESSION_ERROR,
    ERR_HTTP2_SETTINGS_CANCEL,
    ERR_HTTP2_SOCKET_BOUND,
    ERR_HTTP2_SOCKET_UNBOUND,
    ERR_HTTP2_STATUS_101,
    ERR_HTTP2_STATUS_INVALID,
    ERR_HTTP2_STREAM_CANCEL,
    ERR_HTTP2_STREAM_ERROR,
    ERR_HTTP2_STREAM_SELF_DEPENDENCY,
    ERR_HTTP2_TRAILERS_ALREADY_SENT,
    ERR_HTTP2_TRAILERS_NOT_READY,
    ERR_HTTP2_UNSUPPORTED_PROTOCOL,
    ERR_HTTP_HEADERS_SENT,
    ERR_HTTP_INVALID_HEADER_VALUE,
    ERR_HTTP_INVALID_STATUS_CODE,
    ERR_HTTP_SOCKET_ENCODING,
    ERR_HTTP_TRAILER_INVALID,
    ERR_INCOMPATIBLE_OPTION_PAIR,
    ERR_INPUT_TYPE_NOT_ALLOWED,
    ERR_INSPECTOR_ALREADY_ACTIVATED,
    ERR_INSPECTOR_ALREADY_CONNECTED,
    ERR_INSPECTOR_CLOSED,
    ERR_INSPECTOR_COMMAND,
    ERR_INSPECTOR_NOT_ACTIVE,
    ERR_INSPECTOR_NOT_AVAILABLE,
    ERR_INSPECTOR_NOT_CONNECTED,
    ERR_INSPECTOR_NOT_WORKER,
    ERR_INTERNAL_ASSERTION,
    ERR_INVALID_ADDRESS_FAMILY,
    ERR_INVALID_ARG_TYPE,
    ERR_INVALID_ARG_TYPE_RANGE,
    ERR_INVALID_ARG_VALUE,
    ERR_INVALID_ARG_VALUE_RANGE,
    ERR_INVALID_ASYNC_ID,
    ERR_INVALID_BUFFER_SIZE,
    ERR_INVALID_CHAR,
    ERR_INVALID_CURSOR_POS,
    ERR_INVALID_FD,
    ERR_INVALID_FD_TYPE,
    ERR_INVALID_FILE_URL_HOST,
    ERR_INVALID_FILE_URL_PATH,
    ERR_INVALID_HANDLE_TYPE,
    ERR_INVALID_HTTP_TOKEN,
    ERR_INVALID_IP_ADDRESS,
    ERR_INVALID_MODULE_SPECIFIER,
    ERR_INVALID_OPT_VALUE,
    ERR_INVALID_OPT_VALUE_ENCODING,
    ERR_INVALID_PACKAGE_CONFIG,
    ERR_INVALID_PACKAGE_TARGET,
    ERR_INVALID_PERFORMANCE_MARK,
    ERR_INVALID_PROTOCOL,
    ERR_INVALID_REPL_EVAL_CONFIG,
    ERR_INVALID_REPL_INPUT,
    ERR_INVALID_RETURN_PROPERTY,
    ERR_INVALID_RETURN_PROPERTY_VALUE,
    ERR_INVALID_RETURN_VALUE,
    ERR_INVALID_SYNC_FORK_INPUT,
    ERR_INVALID_THIS,
    ERR_INVALID_TUPLE,
    ERR_INVALID_URI,
    ERR_INVALID_URL,
    ERR_INVALID_URL_SCHEME,
    ERR_IPC_CHANNEL_CLOSED,
    ERR_IPC_DISCONNECTED,
    ERR_IPC_ONE_PIPE,
    ERR_IPC_SYNC_FORK,
    ERR_MANIFEST_DEPENDENCY_MISSING,
    ERR_MANIFEST_INTEGRITY_MISMATCH,
    ERR_MANIFEST_INVALID_RESOURCE_FIELD,
    ERR_MANIFEST_TDZ,
    ERR_MANIFEST_UNKNOWN_ONERROR,
    ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MISSING_ARGS,
    ERR_MISSING_OPTION,
    ERR_MODULE_NOT_FOUND,
    ERR_MULTIPLE_CALLBACK,
    ERR_NAPI_CONS_FUNCTION,
    ERR_NAPI_INVALID_DATAVIEW_ARGS,
    ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT,
    ERR_NAPI_INVALID_TYPEDARRAY_LENGTH,
    ERR_NO_CRYPTO,
    ERR_NO_ICU,
    ERR_OUT_OF_RANGE,
    ERR_PACKAGE_IMPORT_NOT_DEFINED,
    ERR_PACKAGE_PATH_NOT_EXPORTED,
    ERR_QUICCLIENTSESSION_FAILED,
    ERR_QUICCLIENTSESSION_FAILED_SETSOCKET,
    ERR_QUICSESSION_DESTROYED,
    ERR_QUICSESSION_INVALID_DCID,
    ERR_QUICSESSION_UPDATEKEY,
    ERR_QUICSOCKET_DESTROYED,
    ERR_QUICSOCKET_INVALID_STATELESS_RESET_SECRET_LENGTH,
    ERR_QUICSOCKET_LISTENING,
    ERR_QUICSOCKET_UNBOUND,
    ERR_QUICSTREAM_DESTROYED,
    ERR_QUICSTREAM_INVALID_PUSH,
    ERR_QUICSTREAM_OPEN_FAILED,
    ERR_QUICSTREAM_UNSUPPORTED_PUSH,
    ERR_QUIC_TLS13_REQUIRED,
    ERR_SCRIPT_EXECUTION_INTERRUPTED,
    ERR_SERVER_ALREADY_LISTEN,
    ERR_SERVER_NOT_RUNNING,
    ERR_SOCKET_ALREADY_BOUND,
    ERR_SOCKET_BAD_BUFFER_SIZE,
    ERR_SOCKET_BAD_PORT,
    ERR_SOCKET_BAD_TYPE,
    ERR_SOCKET_BUFFER_SIZE,
    ERR_SOCKET_CLOSED,
    ERR_SOCKET_DGRAM_IS_CONNECTED,
    ERR_SOCKET_DGRAM_NOT_CONNECTED,
    ERR_SOCKET_DGRAM_NOT_RUNNING,
    ERR_SRI_PARSE,
    ERR_STREAM_ALREADY_FINISHED,
    ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES,
    ERR_STREAM_PREMATURE_CLOSE,
    ERR_STREAM_PUSH_AFTER_EOF,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT,
    ERR_STREAM_WRAP,
    ERR_STREAM_WRITE_AFTER_END,
    ERR_SYNTHETIC,
    ERR_TLS_CERT_ALTNAME_INVALID,
    ERR_TLS_DH_PARAM_SIZE,
    ERR_TLS_HANDSHAKE_TIMEOUT,
    ERR_TLS_INVALID_CONTEXT,
    ERR_TLS_INVALID_PROTOCOL_VERSION,
    ERR_TLS_INVALID_STATE,
    ERR_TLS_PROTOCOL_VERSION_CONFLICT,
    ERR_TLS_RENEGOTIATION_DISABLED,
    ERR_TLS_REQUIRED_SERVER_NAME,
    ERR_TLS_SESSION_ATTACK,
    ERR_TLS_SNI_FROM_SERVER,
    ERR_TRACE_EVENTS_CATEGORY_REQUIRED,
    ERR_TRACE_EVENTS_UNAVAILABLE,
    ERR_UNAVAILABLE_DURING_EXIT,
    ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET,
    ERR_UNESCAPED_CHARACTERS,
    ERR_UNHANDLED_ERROR,
    ERR_UNKNOWN_BUILTIN_MODULE,
    ERR_UNKNOWN_CREDENTIAL,
    ERR_UNKNOWN_ENCODING,
    ERR_UNKNOWN_FILE_EXTENSION,
    ERR_UNKNOWN_MODULE_FORMAT,
    ERR_UNKNOWN_SIGNAL,
    ERR_UNSUPPORTED_DIR_IMPORT,
    ERR_UNSUPPORTED_ESM_URL_SCHEME,
    ERR_USE_AFTER_CLOSE,
    ERR_V8BREAKITERATOR,
    ERR_VALID_PERFORMANCE_ENTRY_TYPE,
    ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING,
    ERR_VM_MODULE_ALREADY_LINKED,
    ERR_VM_MODULE_CANNOT_CREATE_CACHED_DATA,
    ERR_VM_MODULE_DIFFERENT_CONTEXT,
    ERR_VM_MODULE_LINKING_ERRORED,
    ERR_VM_MODULE_NOT_MODULE,
    ERR_VM_MODULE_STATUS,
    ERR_WASI_ALREADY_STARTED,
    ERR_WORKER_INIT_FAILED,
    ERR_WORKER_NOT_RUNNING,
    ERR_WORKER_OUT_OF_MEMORY,
    ERR_WORKER_UNSERIALIZABLE_ERROR,
    ERR_WORKER_UNSUPPORTED_EXTENSION,
    ERR_WORKER_UNSUPPORTED_OPERATION,
    ERR_ZLIB_INITIALIZATION_FAILED,
    NodeError,
    NodeErrorAbstraction,
    NodeRangeError,
    NodeSyntaxError,
    NodeTypeError,
    NodeURIError,
    aggregateTwoErrors,
    codes,
    connResetException,
    denoErrorToNodeError,
    dnsException,
    errnoException,
    errorMap,
    exceptionWithHostPort,
    genericNodeError,
    hideStackFrames,
    isStackOverflowError,
    uvException,
    uvExceptionWithHostPort,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWVBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN2RCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDekMsT0FBTyxFQUNMLE9BQU8sRUFDUCxRQUFRLEVBQ1Isb0JBQW9CLEdBQ3JCLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQy9DLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM5QyxPQUFPLEVBQUUsRUFBRSxJQUFJLFdBQVcsRUFBRSxNQUFNLGtDQUFrQyxDQUFDO0FBQ3JFLE1BQU0sRUFDSixLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQzNCLEdBQUcsV0FBVyxDQUFDO0FBQ2hCLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUN6RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFbEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO0FBRXBCLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUs1QyxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQztBQU0xQyxNQUFNLE1BQU0sR0FBRztJQUNiLFFBQVE7SUFDUixVQUFVO0lBQ1YsUUFBUTtJQUNSLFFBQVE7SUFFUixVQUFVO0lBQ1YsUUFBUTtJQUNSLFNBQVM7SUFDVCxRQUFRO0lBQ1IsUUFBUTtDQUNULENBQUM7QUFLRixNQUFNLE9BQU8sVUFBVyxTQUFRLEtBQUs7SUFDbkMsSUFBSSxDQUFTO0lBRWIsWUFBWSxPQUFPLEdBQUcsMkJBQTJCLEVBQUUsT0FBc0I7UUFDdkUsSUFBSSxPQUFPLEtBQUssU0FBUyxJQUFJLE9BQU8sT0FBTyxL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dUM7SUFDdkMsK0JBQStCO0lBQy9CLDZCQUE2QjtJQUM3Qix3QkFBd0I7SUFDeEIsb0JBQW9CO0lBQ3BCLHdCQUF3QjtJQUN4QixzQkFBc0I7SUFDdEIsc0JBQXNCO0lBQ3RCLHdCQUF3QjtJQUN4QiwrQkFBK0I7SUFDL0IsZ0NBQWdDO0lBQ2hDLGdDQUFnQztJQUNoQyw4QkFBOEI7SUFDOUIsU0FBUztJQUNULG9CQUFvQjtJQUNwQixjQUFjO0lBQ2QsZUFBZTtJQUNmLGFBQWE7SUFDYixZQUFZO0lBQ1osa0JBQWtCO0lBQ2xCLEtBQUs7SUFDTCxrQkFBa0I7SUFDbEIsb0JBQW9CO0lBQ3BCLFlBQVk7SUFDWixjQUFjO0lBQ2QsUUFBUTtJQUNSLHFCQUFxQjtJQUNyQixnQkFBZ0I7SUFDaEIsZUFBZTtJQUNmLG9CQUFvQjtJQUNwQixXQUFXO0lBQ1gsdUJBQXVCO0NBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IE5vZGUuanMgY29udHJpYnV0b3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgTGljZW5zZS5cbi8qKiBOT1QgSU1QTEVNRU5URURcbiAqIEVSUl9NQU5JRkVTVF9BU1NFUlRfSU5URUdSSVRZXG4gKiBFUlJfUVVJQ1NFU1NJT05fVkVSU0lPTl9ORUdPVElBVElPTlxuICogRVJSX1JFUVVJUkVfRVNNXG4gKiBFUlJfVExTX0NFUlRfQUxUTkFNRV9JTlZBTElEXG4gKiBFUlJfV09SS0VSX0lOVkFMSURfRVhFQ19BUkdWXG4gKiBFUlJfV09SS0VSX1BBVEhcbiAqIEVSUl9RVUlDX0VSUk9SXG4gKiBFUlJfU1lTVEVNX0VSUk9SIC8vU3lzdGVtIGVycm9yLCBzaG91bGRuJ3QgZXZlciBoYXBwZW4gaW5zaWRlIERlbm9cbiAqIEVSUl9UVFlfSU5JVF9GQUlMRUQgLy9TeXN0ZW0gZXJyb3IsIHNob3VsZG4ndCBldmVyIGhhcHBlbiBpbnNpZGUgRGVub1xuICogRVJSX0lOVkFMSURfUEFDS0FHRV9DT05GSUcgLy8gcGFja2FnZS5qc29uIHN0dWZmLCBwcm9iYWJseSB1c2VsZXNzXG4gKi9cblxuaW1wb3J0IHsgaW5zcGVjdCB9IGZyb20gXCIuLi9pbnRlcm5hbC91dGlsL2luc3BlY3QubWpzXCI7XG5pbXBvcnQgeyBjb2RlcyB9IGZyb20gXCIuL2Vycm9yX2NvZGVzLnRzXCI7XG5pbXBvcnQge1xuICBjb2RlTWFwLFxuICBlcnJvck1hcCxcbiAgbWFwU3lzRXJybm9Ub1V2RXJybm8sXG59IGZyb20gXCIuLi9pbnRlcm5hbF9iaW5kaW5nL3V2LnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tIFwiLi4vLi4vX3V0aWwvb3MudHNcIjtcbmltcG9ydCB7IG9zIGFzIG9zQ29uc3RhbnRzIH0gZnJvbSBcIi4uL2ludGVybmFsX2JpbmRpbmcvY29uc3RhbnRzLnRzXCI7XG5jb25zdCB7XG4gIGVycm5vOiB7IEVOT1RESVIsIEVOT0VOVCB9LFxufSA9IG9zQ29uc3RhbnRzO1xuaW1wb3J0IHsgaGlkZVN0YWNrRnJhbWVzIH0gZnJvbSBcIi4vaGlkZV9zdGFja19mcmFtZXMudHNcIjtcbmltcG9ydCB7IGdldFN5c3RlbUVycm9yTmFtZSB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcblxuZXhwb3J0IHsgZXJyb3JNYXAgfTtcblxuY29uc3Qga0lzTm9kZUVycm9yID0gU3ltYm9sKFwia0lzTm9kZUVycm9yXCIpO1xuXG4vKipcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvZjNlYjIyNC9saWIvaW50ZXJuYWwvZXJyb3JzLmpzXG4gKi9cbmNvbnN0IGNsYXNzUmVnRXhwID0gL14oW0EtWl1bYS16MC05XSopKyQvO1xuXG4vKipcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvZjNlYjIyNC9saWIvaW50ZXJuYWwvZXJyb3JzLmpzXG4gKiBAZGVzY3JpcHRpb24gU29ydGVkIGJ5IGEgcm91Z2ggZXN0aW1hdGUgb24gbW9zdCBmcmVxdWVudGx5IHVzZWQgZW50cmllcy5cbiAqL1xuY29uc3Qga1R5cGVzID0gW1xuICBcInN0cmluZ1wiLFxuICBcImZ1bmN0aW9uXCIsXG4gIFwibnVtYmVyXCIsXG4gIFwib2JqZWN0XCIsXG4gIC8vIEFjY2VwdCAnRnVuY3Rpb24nIGFuZCAnT2JqZWN0JyBhcyBhbHRlcm5hdGl2ZSB0byB0aGUgbG93ZXIgY2FzZWQgdmVyc2lvbi5cbiAgXCJGdW5jdGlvblwiLFxuICBcIk9iamVjdFwiLFxuICBcImJvb2xlYW5cIixcbiAgXCJiaWdpbnRcIixcbiAgXCJzeW1ib2xcIixcbl07XG5cbi8vIE5vZGUgdXNlcyBhbiBBYm9ydEVycm9yIHRoYXQgaXNuJ3QgZXhhY3RseSB0aGUgc2FtZSBhcyB0aGUgRE9NRXhjZXB0aW9uXG4vLyB0byBtYWtlIHVzYWdlIG9mIHRoZSBlcnJvciBpbiB1c2VybGFuZCBhbmQgcmVhZGFibGUtc3RyZWFtIGVhc2llci5cbi8vIEl0IGlzIGEgcmVndWxhciBlcnJvciB3aXRoIGAuY29kZWAgYW5kIGAubmFtZWAuXG5leHBvcnQgY2xhc3MgQWJvcnRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29kZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UgPSBcIlRoZSBvcGVyYXRpb24gd2FzIGFib3J0ZWRcIiwgb3B0aW9ucz86IEVycm9yT3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHRocm93IG5ldyBjb2Rlcy5FUlJfSU5WQUxJRF9BUkdfVFlQRShcIm9wdGlvbnNcIiwgXCJPYmplY3RcIiwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHN1cGVyKG1lc3NhZ2UsIG9wdGlvbnMpO1xuICAgIHRoaXMuY29kZSA9IFwiQUJPUlRfRVJSXCI7XG4gICAgdGhpcy5uYW1lID0gXCJBYm9ydEVycm9yXCI7XG4gIH1cbn1cblxubGV0IG1heFN0YWNrX0Vycm9yTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xubGV0IG1heFN0YWNrX0Vycm9yTWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgYGVyci5uYW1lYCBhbmQgYGVyci5tZXNzYWdlYCBhcmUgZXF1YWwgdG8gZW5naW5lLXNwZWNpZmljXG4gKiB2YWx1ZXMgaW5kaWNhdGluZyBtYXggY2FsbCBzdGFjayBzaXplIGhhcyBiZWVuIGV4Y2VlZGVkLlxuICogXCJNYXhpbXVtIGNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiIGluIFY4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdGFja092ZXJmbG93RXJyb3IoZXJyOiBFcnJvcik6IGJvb2xlYW4ge1xuICBpZiAobWF4U3RhY2tfRXJyb3JNZXNzYWdlID09PSB1bmRlZmluZWQpIHtcbiAgICB0cnkge1xuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1pbm5lci1kZWNsYXJhdGlvbnNcbiAgICAgIGZ1bmN0aW9uIG92ZXJmbG93U3RhY2soKSB7XG4gICAgICAgIG92ZXJmbG93U3RhY2soKTtcbiAgICAgIH1cbiAgICAgIG92ZXJmbG93U3RhY2soKTtcbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIG1heFN0YWNrX0Vycm9yTWVzc2FnZSA9IGVyci5tZXNzYWdlO1xuICAgICAgbWF4U3RhY2tfRXJyb3JOYW1lID0gZXJyLm5hbWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGVyciAmJiBlcnIubmFtZSA9PT0gbWF4U3RhY2tfRXJyb3JOYW1lICYmXG4gICAgZXJyLm1lc3NhZ2UgPT09IG1heFN0YWNrX0Vycm9yTWVzc2FnZTtcbn1cblxuZnVuY3Rpb24gYWRkTnVtZXJpY2FsU2VwYXJhdG9yKHZhbDogc3RyaW5nKSB7XG4gIGxldCByZXMgPSBcIlwiO1xuICBsZXQgaSA9IHZhbC5sZW5ndGg7XG4gIGNvbnN0IHN0YXJ0ID0gdmFsWzBdID09PSBcIi1cIiA/IDEgOiAwO1xuICBmb3IgKDsgaSA+PSBzdGFydCArIDQ7IGkgLT0gMykge1xuICAgIHJlcyA9IGBfJHt2YWwuc2xpY2UoaSAtIDMsIGkpfSR7cmVzfWA7XG4gIH1cbiAgcmV0dXJuIGAke3ZhbC5zbGljZSgwLCBpKX0ke3Jlc31gO1xufVxuXG5jb25zdCBjYXB0dXJlTGFyZ2VyU3RhY2tUcmFjZSA9IGhpZGVTdGFja0ZyYW1lcyhcbiAgZnVuY3Rpb24gY2FwdHVyZUxhcmdlclN0YWNrVHJhY2UoZXJyKSB7XG4gICAgLy8gQHRzLWlnbm9yZSB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBhdmFpbGFibGUgaW4gbGliLmRvbS5kLnRzXG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyKTtcblxuICAgIHJldHVybiBlcnI7XG4gIH0sXG4pO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVycm5vRXhjZXB0aW9uIGV4dGVuZHMgRXJyb3Ige1xuICBlcnJubz86IG51bWJlcjtcbiAgY29kZT86IHN0cmluZztcbiAgcGF0aD86IHN0cmluZztcbiAgc3lzY2FsbD86IHN0cmluZztcbiAgc3Bhd25hcmdzPzogc3RyaW5nW107XG59XG5cbi8qKlxuICogVGhpcyBjcmVhdGVzIGFuIGVycm9yIGNvbXBhdGlibGUgd2l0aCBlcnJvcnMgcHJvZHVjZWQgaW4gdGhlIEMrK1xuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgcmVwbGFjZSB0aGUgZGVwcmVjYXRlZFxuICogYGV4Y2VwdGlvbldpdGhIb3N0UG9ydCgpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gZXJyIEEgbGlidXYgZXJyb3IgbnVtYmVyXG4gKiBAcGFyYW0gc3lzY2FsbFxuICogQHBhcmFtIGFkZHJlc3NcbiAqIEBwYXJhbSBwb3J0XG4gKiBAcmV0dXJuIFRoZSBlcnJvci5cbiAqL1xuZXhwb3J0IGNvbnN0IHV2RXhjZXB0aW9uV2l0aEhvc3RQb3J0ID0gaGlkZVN0YWNrRnJhbWVzKFxuICBmdW5jdGlvbiB1dkV4Y2VwdGlvbldpdGhIb3N0UG9ydChcbiAgICBlcnI6IG51bWJlcixcbiAgICBzeXNjYWxsOiBzdHJpbmcsXG4gICAgYWRkcmVzcz86IHN0cmluZyB8IG51bGwsXG4gICAgcG9ydD86IG51bWJlciB8IG51bGwsXG4gICkge1xuICAgIGNvbnN0IHsgMDogY29kZSwgMTogdXZtc2cgfSA9IHV2RXJybWFwR2V0KGVycikgfHwgdXZVbm1hcHBlZEVycm9yO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBgJHtzeXNjYWxsfSAke2NvZGV9OiAke3V2bXNnfWA7XG4gICAgbGV0IGRldGFpbHMgPSBcIlwiO1xuXG4gICAgaWYgKHBvcnQgJiYgcG9ydCA+IDApIHtcbiAgICAgIGRldGFpbHMgPSBgICR7YWRkcmVzc306JHtwb3J0fWA7XG4gICAgfSBlbHNlIGlmIChhZGRyZXNzKSB7XG4gICAgICBkZXRhaWxzID0gYCAke2FkZHJlc3N9YDtcbiAgICB9XG5cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IGV4OiBhbnkgPSBuZXcgRXJyb3IoYCR7bWVzc2FnZX0ke2RldGFpbHN9YCk7XG4gICAgZXguY29kZSA9IGNvZGU7XG4gICAgZXguZXJybm8gPSBlcnI7XG4gICAgZXguc3lzY2FsbCA9IHN5c2NhbGw7XG4gICAgZXguYWRkcmVzcyA9IGFkZHJlc3M7XG5cbiAgICBpZiAocG9ydCkge1xuICAgICAgZXgucG9ydCA9IHBvcnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGV4KTtcbiAgfSxcbik7XG5cbi8qKlxuICogVGhpcyB1c2VkIHRvIGJlIGB1dGlsLl9lcnJub0V4Y2VwdGlvbigpYC5cbiAqXG4gKiBAcGFyYW0gZXJyIEEgbGlidXYgZXJyb3IgbnVtYmVyXG4gKiBAcGFyYW0gc3lzY2FsbFxuICogQHBhcmFtIG9yaWdpbmFsXG4gKiBAcmV0dXJuIEEgYEVycm5vRXhjZXB0aW9uYFxuICovXG5leHBvcnQgY29uc3QgZXJybm9FeGNlcHRpb24gPSBoaWRlU3RhY2tGcmFtZXMoZnVuY3Rpb24gZXJybm9FeGNlcHRpb24oXG4gIGVycixcbiAgc3lzY2FsbCxcbiAgb3JpZ2luYWw/LFxuKTogRXJybm9FeGNlcHRpb24ge1xuICBjb25zdCBjb2RlID0gZ2V0U3lzdGVtRXJyb3JOYW1lKGVycik7XG4gIGNvbnN0IG1lc3NhZ2UgPSBvcmlnaW5hbFxuICAgID8gYCR7c3lzY2FsbH0gJHtjb2RlfSAke29yaWdpbmFsfWBcbiAgICA6IGAke3N5c2NhbGx9ICR7Y29kZX1gO1xuXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IGV4OiBhbnkgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIGV4LmVycm5vID0gZXJyO1xuICBleC5jb2RlID0gY29kZTtcbiAgZXguc3lzY2FsbCA9IHN5c2NhbGw7XG5cbiAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGV4KTtcbn0pO1xuXG5mdW5jdGlvbiB1dkVycm1hcEdldChuYW1lOiBudW1iZXIpIHtcbiAgcmV0dXJuIGVycm9yTWFwLmdldChuYW1lKTtcbn1cblxuY29uc3QgdXZVbm1hcHBlZEVycm9yID0gW1wiVU5LTk9XTlwiLCBcInVua25vd24gZXJyb3JcIl07XG5cbi8qKlxuICogVGhpcyBjcmVhdGVzIGFuIGVycm9yIGNvbXBhdGlibGUgd2l0aCBlcnJvcnMgcHJvZHVjZWQgaW4gdGhlIEMrK1xuICogZnVuY3Rpb24gVVZFeGNlcHRpb24gdXNpbmcgYSBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYXNzZW1ibGVkIGluIEMrKy5cbiAqIFRoZSBnb2FsIGlzIHRvIG1pZ3JhdGUgdGhlbSB0byBFUlJfKiBlcnJvcnMgbGF0ZXIgd2hlbiBjb21wYXRpYmlsaXR5IGlzXG4gKiBub3QgYSBjb25jZXJuLlxuICpcbiAqIEBwYXJhbSBjdHhcbiAqIEByZXR1cm4gVGhlIGVycm9yLlxuICovXG5leHBvcnQgY29uc3QgdXZFeGNlcHRpb24gPSBoaWRlU3RhY2tGcmFtZXMoZnVuY3Rpb24gdXZFeGNlcHRpb24oY3R4KSB7XG4gIGNvbnN0IHsgMDogY29kZSwgMTogdXZtc2cgfSA9IHV2RXJybWFwR2V0KGN0eC5lcnJubykgfHwgdXZVbm1hcHBlZEVycm9yO1xuXG4gIGxldCBtZXNzYWdlID0gYCR7Y29kZX06ICR7Y3R4Lm1lc3NhZ2UgfHwgdXZtc2d9LCAke2N0eC5zeXNjYWxsfWA7XG5cbiAgbGV0IHBhdGg7XG4gIGxldCBkZXN0O1xuXG4gIGlmIChjdHgucGF0aCkge1xuICAgIHBhdGggPSBjdHgucGF0aC50b1N0cmluZygpO1xuICAgIG1lc3NhZ2UgKz0gYCAnJHtwYXRofSdgO1xuICB9XG4gIGlmIChjdHguZGVzdCkge1xuICAgIGRlc3QgPSBjdHguZGVzdC50b1N0cmluZygpO1xuICAgIG1lc3NhZ2UgKz0gYCAtPiAnJHtkZXN0fSdgO1xuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgZXJyOiBhbnkgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG5cbiAgZm9yIChjb25zdCBwcm9wIG9mIE9iamVjdC5rZXlzKGN0eCkpIHtcbiAgICBpZiAocHJvcCA9PT0gXCJtZXNzYWdlXCIgfHwgcHJvcCA9PT0gXCJwYXRoXCIgfHwgcHJvcCA9PT0gXCJkZXN0XCIpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGVycltwcm9wXSA9IGN0eFtwcm9wXTtcbiAgfVxuXG4gIGVyci5jb2RlID0gY29kZTtcblxuICBpZiAocGF0aCkge1xuICAgIGVyci5wYXRoID0gcGF0aDtcbiAgfVxuXG4gIGlmIChkZXN0KSB7XG4gICAgZXJyLmRlc3QgPSBkZXN0O1xuICB9XG5cbiAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGVycik7XG59KTtcblxuLyoqXG4gKiBEZXByZWNhdGVkLCBuZXcgZnVuY3Rpb24gaXMgYHV2RXhjZXB0aW9uV2l0aEhvc3RQb3J0KClgXG4gKiBOZXcgZnVuY3Rpb24gYWRkZWQgdGhlIGVycm9yIGRlc2NyaXB0aW9uIGRpcmVjdGx5XG4gKiBmcm9tIEMrKy4gdGhpcyBtZXRob2QgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gKiBAcGFyYW0gZXJyIEEgbGlidXYgZXJyb3IgbnVtYmVyXG4gKiBAcGFyYW0gc3lzY2FsbFxuICogQHBhcmFtIGFkZHJlc3NcbiAqIEBwYXJhbSBwb3J0XG4gKiBAcGFyYW0gYWRkaXRpb25hbFxuICovXG5leHBvcnQgY29uc3QgZXhjZXB0aW9uV2l0aEhvc3RQb3J0ID0gaGlkZVN0YWNrRnJhbWVzKFxuICBmdW5jdGlvbiBleGNlcHRpb25XaXRoSG9zdFBvcnQoXG4gICAgZXJyOiBudW1iZXIsXG4gICAgc3lzY2FsbDogc3RyaW5nLFxuICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICBwb3J0OiBudW1iZXIsXG4gICAgYWRkaXRpb25hbD86IHN0cmluZyxcbiAgKSB7XG4gICAgY29uc3QgY29kZSA9IGdldFN5c3RlbUVycm9yTmFtZShlcnIpO1xuICAgIGxldCBkZXRhaWxzID0gXCJcIjtcblxuICAgIGlmIChwb3J0ICYmIHBvcnQgPiAwKSB7XG4gICAgICBkZXRhaWxzID0gYCAke2FkZHJlc3N9OiR7cG9ydH1gO1xuICAgIH0gZWxzZSBpZiAoYWRkcmVzcykge1xuICAgICAgZGV0YWlscyA9IGAgJHthZGRyZXNzfWA7XG4gICAgfVxuXG4gICAgaWYgKGFkZGl0aW9uYWwpIHtcbiAgICAgIGRldGFpbHMgKz0gYCAtIExvY2FsICgke2FkZGl0aW9uYWx9KWA7XG4gICAgfVxuXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBleDogYW55ID0gbmV3IEVycm9yKGAke3N5c2NhbGx9ICR7Y29kZX0ke2RldGFpbHN9YCk7XG4gICAgZXguZXJybm8gPSBlcnI7XG4gICAgZXguY29kZSA9IGNvZGU7XG4gICAgZXguc3lzY2FsbCA9IHN5c2NhbGw7XG4gICAgZXguYWRkcmVzcyA9IGFkZHJlc3M7XG5cbiAgICBpZiAocG9ydCkge1xuICAgICAgZXgucG9ydCA9IHBvcnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKGV4KTtcbiAgfSxcbik7XG5cbi8qKlxuICogQHBhcmFtIGNvZGUgQSBsaWJ1diBlcnJvciBudW1iZXIgb3IgYSBjLWFyZXMgZXJyb3IgY29kZVxuICogQHBhcmFtIHN5c2NhbGxcbiAqIEBwYXJhbSBob3N0bmFtZVxuICovXG5leHBvcnQgY29uc3QgZG5zRXhjZXB0aW9uID0gaGlkZVN0YWNrRnJhbWVzKGZ1bmN0aW9uIChjb2RlLCBzeXNjYWxsLCBob3N0bmFtZSkge1xuICBsZXQgZXJybm87XG5cbiAgLy8gSWYgYGNvZGVgIGlzIG9mIHR5cGUgbnVtYmVyLCBpdCBpcyBhIGxpYnV2IGVycm9yIG51bWJlciwgZWxzZSBpdCBpcyBhXG4gIC8vIGMtYXJlcyBlcnJvciBjb2RlLlxuICBpZiAodHlwZW9mIGNvZGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICBlcnJubyA9IGNvZGU7XG4gICAgLy8gRU5PVEZPVU5EIGlzIG5vdCBhIHByb3BlciBQT1NJWCBlcnJvciwgYnV0IHRoaXMgZXJyb3IgaGFzIGJlZW4gaW4gcGxhY2VcbiAgICAvLyBsb25nIGVub3VnaCB0aGF0IGl0J3Mgbm90IHByYWN0aWNhbCB0byByZW1vdmUgaXQuXG4gICAgaWYgKFxuICAgICAgY29kZSA9PT0gY29kZU1hcC5nZXQoXCJFQUlfTk9EQVRBXCIpIHx8XG4gICAgICBjb2RlID09PSBjb2RlTWFwLmdldChcIkVBSV9OT05BTUVcIilcbiAgICApIHtcbiAgICAgIGNvZGUgPSBcIkVOT1RGT1VORFwiOyAvLyBGYWJyaWNhdGVkIGVycm9yIG5hbWUuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvZGUgPSBnZXRTeXN0ZW1FcnJvck5hbWUoY29kZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbWVzc2FnZSA9IGAke3N5c2NhbGx9ICR7Y29kZX0ke2hvc3RuYW1lID8gYCAke2hvc3RuYW1lfWAgOiBcIlwifWA7XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgY29uc3QgZXg6IGFueSA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgZXguZXJybm8gPSBlcnJubztcbiAgZXguY29kZSA9IGNvZGU7XG4gIGV4LnN5c2NhbGwgPSBzeXNjYWxsO1xuXG4gIGlmIChob3N0bmFtZSkge1xuICAgIGV4Lmhvc3RuYW1lID0gaG9zdG5hbWU7XG4gIH1cblxuICByZXR1cm4gY2FwdHVyZUxhcmdlclN0YWNrVHJhY2UoZXgpO1xufSk7XG5cbi8qKlxuICogQWxsIGVycm9yIGluc3RhbmNlcyBpbiBOb2RlIGhhdmUgYWRkaXRpb25hbCBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzXG4gKiBUaGlzIGV4cG9ydCBjbGFzcyBpcyBtZWFudCB0byBiZSBleHRlbmRlZCBieSB0aGVzZSBpbnN0YW5jZXMgYWJzdHJhY3RpbmcgbmF0aXZlIEpTIGVycm9yIGluc3RhbmNlc1xuICovXG5leHBvcnQgY2xhc3MgTm9kZUVycm9yQWJzdHJhY3Rpb24gZXh0ZW5kcyBFcnJvciB7XG4gIGNvZGU6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIC8vVGhpcyBudW1iZXIgY2hhbmdlcyBkZXBlbmRpbmcgb24gdGhlIG5hbWUgb2YgdGhpcyBjbGFzc1xuICAgIC8vMjAgY2hhcmFjdGVycyBhcyBvZiBub3dcbiAgICB0aGlzLnN0YWNrID0gdGhpcy5zdGFjayAmJiBgJHtuYW1lfSBbJHt0aGlzLmNvZGV9XSR7dGhpcy5zdGFjay5zbGljZSgyMCl9YDtcbiAgfVxuXG4gIG92ZXJyaWRlIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlRXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvbiB7XG4gIGNvbnN0cnVjdG9yKGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoRXJyb3IucHJvdG90eXBlLm5hbWUsIGNvZGUsIG1lc3NhZ2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlU3ludGF4RXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvblxuICBpbXBsZW1lbnRzIFN5bnRheEVycm9yIHtcbiAgY29uc3RydWN0b3IoY29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihTeW50YXhFcnJvci5wcm90b3R5cGUubmFtZSwgY29kZSwgbWVzc2FnZSk7XG4gICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIFN5bnRheEVycm9yLnByb3RvdHlwZSk7XG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVSYW5nZUVycm9yIGV4dGVuZHMgTm9kZUVycm9yQWJzdHJhY3Rpb24ge1xuICBjb25zdHJ1Y3Rvcihjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKFJhbmdlRXJyb3IucHJvdG90eXBlLm5hbWUsIGNvZGUsIG1lc3NhZ2UpO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBSYW5nZUVycm9yLnByb3RvdHlwZSk7XG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVUeXBlRXJyb3IgZXh0ZW5kcyBOb2RlRXJyb3JBYnN0cmFjdGlvbiBpbXBsZW1lbnRzIFR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoVHlwZUVycm9yLnByb3RvdHlwZS5uYW1lLCBjb2RlLCBtZXNzYWdlKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgVHlwZUVycm9yLnByb3RvdHlwZSk7XG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9IFske3RoaXMuY29kZX1dOiAke3RoaXMubWVzc2FnZX1gO1xuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVVUklFcnJvciBleHRlbmRzIE5vZGVFcnJvckFic3RyYWN0aW9uIGltcGxlbWVudHMgVVJJRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcihjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKFVSSUVycm9yLnByb3RvdHlwZS5uYW1lLCBjb2RlLCBtZXNzYWdlKTtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YodGhpcywgVVJJRXJyb3IucHJvdG90eXBlKTtcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX0gWyR7dGhpcy5jb2RlfV06ICR7dGhpcy5tZXNzYWdlfWA7XG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5vZGVTeXN0ZW1FcnJvckN0eCB7XG4gIGNvZGU6IHN0cmluZztcbiAgc3lzY2FsbDogc3RyaW5nO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIGVycm5vOiBudW1iZXI7XG4gIHBhdGg/OiBzdHJpbmc7XG4gIGRlc3Q/OiBzdHJpbmc7XG59XG4vLyBBIHNwZWNpYWxpemVkIEVycm9yIHRoYXQgaW5jbHVkZXMgYW4gYWRkaXRpb25hbCBpbmZvIHByb3BlcnR5IHdpdGhcbi8vIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGVycm9yIGNvbmRpdGlvbi5cbi8vIEl0IGhhcyB0aGUgcHJvcGVydGllcyBwcmVzZW50IGluIGEgVVZFeGNlcHRpb24gYnV0IHdpdGggYSBjdXN0b20gZXJyb3Jcbi8vIG1lc3NhZ2UgZm9sbG93ZWQgYnkgdGhlIHV2IGVycm9yIGNvZGUgYW5kIHV2IGVycm9yIG1lc3NhZ2UuXG4vLyBJdCBhbHNvIGhhcyBpdHMgb3duIGVycm9yIGNvZGUgd2l0aCB0aGUgb3JpZ2luYWwgdXYgZXJyb3IgY29udGV4dCBwdXQgaW50b1xuLy8gYGVyci5pbmZvYC5cbi8vIFRoZSBjb250ZXh0IHBhc3NlZCBpbnRvIHRoaXMgZXJyb3IgbXVzdCBoYXZlIC5jb2RlLCAuc3lzY2FsbCBhbmQgLm1lc3NhZ2UsXG4vLyBhbmQgbWF5IGhhdmUgLnBhdGggYW5kIC5kZXN0LlxuY2xhc3MgTm9kZVN5c3RlbUVycm9yIGV4dGVuZHMgTm9kZUVycm9yQWJzdHJhY3Rpb24ge1xuICBjb25zdHJ1Y3RvcihrZXk6IHN0cmluZywgY29udGV4dDogTm9kZVN5c3RlbUVycm9yQ3R4LCBtc2dQcmVmaXg6IHN0cmluZykge1xuICAgIGxldCBtZXNzYWdlID0gYCR7bXNnUHJlZml4fTogJHtjb250ZXh0LnN5c2NhbGx9IHJldHVybmVkIGAgK1xuICAgICAgYCR7Y29udGV4dC5jb2RlfSAoJHtjb250ZXh0Lm1lc3NhZ2V9KWA7XG5cbiAgICBpZiAoY29udGV4dC5wYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1lc3NhZ2UgKz0gYCAke2NvbnRleHQucGF0aH1gO1xuICAgIH1cbiAgICBpZiAoY29udGV4dC5kZXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG1lc3NhZ2UgKz0gYCA9PiAke2NvbnRleHQuZGVzdH1gO1xuICAgIH1cblxuICAgIHN1cGVyKFwiU3lzdGVtRXJyb3JcIiwga2V5LCBtZXNzYWdlKTtcblxuICAgIGNhcHR1cmVMYXJnZXJTdGFja1RyYWNlKHRoaXMpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW2tJc05vZGVFcnJvcl06IHtcbiAgICAgICAgdmFsdWU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBpbmZvOiB7XG4gICAgICAgIHZhbHVlOiBjb250ZXh0LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBlcnJubzoge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuZXJybm87XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29udGV4dC5lcnJubyA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9LFxuICAgICAgc3lzY2FsbDoge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuc3lzY2FsbDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb250ZXh0LnN5c2NhbGwgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGlmIChjb250ZXh0LnBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwicGF0aFwiLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gY29udGV4dC5wYXRoO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnRleHQucGF0aCA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoY29udGV4dC5kZXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRlc3RcIiwge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGVzdDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb250ZXh0LmRlc3QgPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIGAke3RoaXMubmFtZX0gWyR7dGhpcy5jb2RlfV06ICR7dGhpcy5tZXNzYWdlfWA7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVN5c3RlbUVycm9yV2l0aENvZGUoa2V5OiBzdHJpbmcsIG1zZ1ByZml4OiBzdHJpbmcpIHtcbiAgcmV0dXJuIGNsYXNzIE5vZGVFcnJvciBleHRlbmRzIE5vZGVTeXN0ZW1FcnJvciB7XG4gICAgY29uc3RydWN0b3IoY3R4OiBOb2RlU3lzdGVtRXJyb3JDdHgpIHtcbiAgICAgIHN1cGVyKGtleSwgY3R4LCBtc2dQcmZpeCk7XG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgY29uc3QgRVJSX0ZTX0VJU0RJUiA9IG1ha2VTeXN0ZW1FcnJvcldpdGhDb2RlKFxuICBcIkVSUl9GU19FSVNESVJcIixcbiAgXCJQYXRoIGlzIGEgZGlyZWN0b3J5XCIsXG4pO1xuXG5mdW5jdGlvbiBjcmVhdGVJbnZhbGlkQXJnVHlwZShcbiAgbmFtZTogc3RyaW5nLFxuICBleHBlY3RlZDogc3RyaW5nIHwgc3RyaW5nW10sXG4pOiBzdHJpbmcge1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9mM2ViMjI0L2xpYi9pbnRlcm5hbC9lcnJvcnMuanMjTDEwMzctTDEwODdcbiAgZXhwZWN0ZWQgPSBBcnJheS5pc0FycmF5KGV4cGVjdGVkKSA/IGV4cGVjdGVkIDogW2V4cGVjdGVkXTtcbiAgbGV0IG1zZyA9IFwiVGhlIFwiO1xuICBpZiAobmFtZS5lbmRzV2l0aChcIiBhcmd1bWVudFwiKSkge1xuICAgIC8vIEZvciBjYXNlcyBsaWtlICdmaXJzdCBhcmd1bWVudCdcbiAgICBtc2cgKz0gYCR7bmFtZX0gYDtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0eXBlID0gbmFtZS5pbmNsdWRlcyhcIi5cIikgPyBcInByb3BlcnR5XCIgOiBcImFyZ3VtZW50XCI7XG4gICAgbXNnICs9IGBcIiR7bmFtZX1cIiAke3R5cGV9IGA7XG4gIH1cbiAgbXNnICs9IFwibXVzdCBiZSBcIjtcblxuICBjb25zdCB0eXBlcyA9IFtdO1xuICBjb25zdCBpbnN0YW5jZXMgPSBbXTtcbiAgY29uc3Qgb3RoZXIgPSBbXTtcbiAgZm9yIChjb25zdCB2YWx1ZSBvZiBleHBlY3RlZCkge1xuICAgIGlmIChrVHlwZXMuaW5jbHVkZXModmFsdWUpKSB7XG4gICAgICB0eXBlcy5wdXNoKHZhbHVlLnRvTG9jYWxlTG93ZXJDYXNlKCkpO1xuICAgIH0gZWxzZSBpZiAoY2xhc3NSZWdFeHAudGVzdCh2YWx1ZSkpIHtcbiAgICAgIGluc3RhbmNlcy5wdXNoKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3RoZXIucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gU3BlY2lhbCBoYW5kbGUgYG9iamVjdGAgaW4gY2FzZSBvdGhlciBpbnN0YW5jZXMgYXJlIGFsbG93ZWQgdG8gb3V0bGluZVxuICAvLyB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBlYWNoIG90aGVyLlxuICBpZiAoaW5zdGFuY2VzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBwb3MgPSB0eXBlcy5pbmRleE9mKFwib2JqZWN0XCIpO1xuICAgIGlmIChwb3MgIT09IC0xKSB7XG4gICAgICB0eXBlcy5zcGxpY2UocG9zLCAxKTtcbiAgICAgIGluc3RhbmNlcy5wdXNoKFwiT2JqZWN0XCIpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlcy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKHR5cGVzLmxlbmd0aCA+IDIpIHtcbiAgICAgIGNvbnN0IGxhc3QgPSB0eXBlcy5wb3AoKTtcbiAgICAgIG1zZyArPSBgb25lIG9mIHR5cGUgJHt0eXBlcy5qb2luKFwiLCBcIil9LCBvciAke2xhc3R9YDtcbiAgICB9IGVsc2UgaWYgKHR5cGVzLmxlbmd0aCA9PT0gMikge1xuICAgICAgbXNnICs9IGBvbmUgb2YgdHlwZSAke3R5cGVzWzBdfSBvciAke3R5cGVzWzFdfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1zZyArPSBgb2YgdHlwZSAke3R5cGVzWzBdfWA7XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZXMubGVuZ3RoID4gMCB8fCBvdGhlci5sZW5ndGggPiAwKSB7XG4gICAgICBtc2cgKz0gXCIgb3IgXCI7XG4gICAgfVxuICB9XG5cbiAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPiAyKSB7XG4gICAgICBjb25zdCBsYXN0ID0gaW5zdGFuY2VzLnBvcCgpO1xuICAgICAgbXNnICs9IGBhbiBpbnN0YW5jZSBvZiAke2luc3RhbmNlcy5qb2luKFwiLCBcIil9LCBvciAke2xhc3R9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgbXNnICs9IGBhbiBpbnN0YW5jZSBvZiAke2luc3RhbmNlc1swXX1gO1xuICAgICAgaWYgKGluc3RhbmNlcy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgbXNnICs9IGAgb3IgJHtpbnN0YW5jZXNbMV19YDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG90aGVyLmxlbmd0aCA+IDApIHtcbiAgICAgIG1zZyArPSBcIiBvciBcIjtcbiAgICB9XG4gIH1cblxuICBpZiAob3RoZXIubGVuZ3RoID4gMCkge1xuICAgIGlmIChvdGhlci5sZW5ndGggPiAyKSB7XG4gICAgICBjb25zdCBsYXN0ID0gb3RoZXIucG9wKCk7XG4gICAgICBtc2cgKz0gYG9uZSBvZiAke290aGVyLmpvaW4oXCIsIFwiKX0sIG9yICR7bGFzdH1gO1xuICAgIH0gZWxzZSBpZiAob3RoZXIubGVuZ3RoID09PSAyKSB7XG4gICAgICBtc2cgKz0gYG9uZSBvZiAke290aGVyWzBdfSBvciAke290aGVyWzFdfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvdGhlclswXS50b0xvd2VyQ2FzZSgpICE9PSBvdGhlclswXSkge1xuICAgICAgICBtc2cgKz0gXCJhbiBcIjtcbiAgICAgIH1cbiAgICAgIG1zZyArPSBgJHtvdGhlclswXX1gO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtc2c7XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9BUkdfVFlQRV9SQU5HRSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBleHBlY3RlZDogc3RyaW5nIHwgc3RyaW5nW10sIGFjdHVhbDogdW5rbm93bikge1xuICAgIGNvbnN0IG1zZyA9IGNyZWF0ZUludmFsaWRBcmdUeXBlKG5hbWUsIGV4cGVjdGVkKTtcblxuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfQVJHX1RZUEVcIiwgYCR7bXNnfS4ke2ludmFsaWRBcmdUeXBlSGVscGVyKGFjdHVhbCl9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FSR19UWVBFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZXhwZWN0ZWQ6IHN0cmluZyB8IHN0cmluZ1tdLCBhY3R1YWw6IHVua25vd24pIHtcbiAgICBjb25zdCBtc2cgPSBjcmVhdGVJbnZhbGlkQXJnVHlwZShuYW1lLCBleHBlY3RlZCk7XG5cbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX0FSR19UWVBFXCIsIGAke21zZ30uJHtpbnZhbGlkQXJnVHlwZUhlbHBlcihhY3R1YWwpfWApO1xuICB9XG5cbiAgc3RhdGljIFJhbmdlRXJyb3IgPSBFUlJfSU5WQUxJRF9BUkdfVFlQRV9SQU5HRTtcbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FSR19WQUxVRV9SQU5HRSBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93biwgcmVhc29uOiBzdHJpbmcgPSBcImlzIGludmFsaWRcIikge1xuICAgIGNvbnN0IHR5cGUgPSBuYW1lLmluY2x1ZGVzKFwiLlwiKSA/IFwicHJvcGVydHlcIiA6IFwiYXJndW1lbnRcIjtcbiAgICBjb25zdCBpbnNwZWN0ZWQgPSBpbnNwZWN0KHZhbHVlKTtcblxuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9BUkdfVkFMVUVcIixcbiAgICAgIGBUaGUgJHt0eXBlfSAnJHtuYW1lfScgJHtyZWFzb259LiBSZWNlaXZlZCAke2luc3BlY3RlZH1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FSR19WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHZhbHVlOiB1bmtub3duLCByZWFzb246IHN0cmluZyA9IFwiaXMgaW52YWxpZFwiKSB7XG4gICAgY29uc3QgdHlwZSA9IG5hbWUuaW5jbHVkZXMoXCIuXCIpID8gXCJwcm9wZXJ0eVwiIDogXCJhcmd1bWVudFwiO1xuICAgIGNvbnN0IGluc3BlY3RlZCA9IGluc3BlY3QodmFsdWUpO1xuXG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0FSR19WQUxVRVwiLFxuICAgICAgYFRoZSAke3R5cGV9ICcke25hbWV9JyAke3JlYXNvbn0uIFJlY2VpdmVkICR7aW5zcGVjdGVkfWAsXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyBSYW5nZUVycm9yID0gRVJSX0lOVkFMSURfQVJHX1ZBTFVFX1JBTkdFO1xufVxuXG4vLyBBIGhlbHBlciBmdW5jdGlvbiB0byBzaW1wbGlmeSBjaGVja2luZyBmb3IgRVJSX0lOVkFMSURfQVJHX1RZUEUgb3V0cHV0LlxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmZ1bmN0aW9uIGludmFsaWRBcmdUeXBlSGVscGVyKGlucHV0OiBhbnkpIHtcbiAgaWYgKGlucHV0ID09IG51bGwpIHtcbiAgICByZXR1cm4gYCBSZWNlaXZlZCAke2lucHV0fWA7XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJmdW5jdGlvblwiICYmIGlucHV0Lm5hbWUpIHtcbiAgICByZXR1cm4gYCBSZWNlaXZlZCBmdW5jdGlvbiAke2lucHV0Lm5hbWV9YDtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgaWYgKGlucHV0LmNvbnN0cnVjdG9yICYmIGlucHV0LmNvbnN0cnVjdG9yLm5hbWUpIHtcbiAgICAgIHJldHVybiBgIFJlY2VpdmVkIGFuIGluc3RhbmNlIG9mICR7aW5wdXQuY29uc3RydWN0b3IubmFtZX1gO1xuICAgIH1cbiAgICByZXR1cm4gYCBSZWNlaXZlZCAke2luc3BlY3QoaW5wdXQsIHsgZGVwdGg6IC0xIH0pfWA7XG4gIH1cbiAgbGV0IGluc3BlY3RlZCA9IGluc3BlY3QoaW5wdXQsIHsgY29sb3JzOiBmYWxzZSB9KTtcbiAgaWYgKGluc3BlY3RlZC5sZW5ndGggPiAyNSkge1xuICAgIGluc3BlY3RlZCA9IGAke2luc3BlY3RlZC5zbGljZSgwLCAyNSl9Li4uYDtcbiAgfVxuICByZXR1cm4gYCBSZWNlaXZlZCB0eXBlICR7dHlwZW9mIGlucHV0fSAoJHtpbnNwZWN0ZWR9KWA7XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfT1VUX09GX1JBTkdFIGV4dGVuZHMgUmFuZ2VFcnJvciB7XG4gIGNvZGUgPSBcIkVSUl9PVVRfT0ZfUkFOR0VcIjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzdHI6IHN0cmluZyxcbiAgICByYW5nZTogc3RyaW5nLFxuICAgIGlucHV0OiB1bmtub3duLFxuICAgIHJlcGxhY2VEZWZhdWx0Qm9vbGVhbiA9IGZhbHNlLFxuICApIHtcbiAgICBhc3NlcnQocmFuZ2UsICdNaXNzaW5nIFwicmFuZ2VcIiBhcmd1bWVudCcpO1xuICAgIGxldCBtc2cgPSByZXBsYWNlRGVmYXVsdEJvb2xlYW5cbiAgICAgID8gc3RyXG4gICAgICA6IGBUaGUgdmFsdWUgb2YgXCIke3N0cn1cIiBpcyBvdXQgb2YgcmFuZ2UuYDtcbiAgICBsZXQgcmVjZWl2ZWQ7XG4gICAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQpICYmIE1hdGguYWJzKGlucHV0IGFzIG51bWJlcikgPiAyICoqIDMyKSB7XG4gICAgICByZWNlaXZlZCA9IGFkZE51bWVyaWNhbFNlcGFyYXRvcihTdHJpbmcoaW5wdXQpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJiaWdpbnRcIikge1xuICAgICAgcmVjZWl2ZWQgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgaWYgKGlucHV0ID4gMm4gKiogMzJuIHx8IGlucHV0IDwgLSgybiAqKiAzMm4pKSB7XG4gICAgICAgIHJlY2VpdmVkID0gYWRkTnVtZXJpY2FsU2VwYXJhdG9yKHJlY2VpdmVkKTtcbiAgICAgIH1cbiAgICAgIHJlY2VpdmVkICs9IFwiblwiO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWNlaXZlZCA9IGluc3BlY3QoaW5wdXQpO1xuICAgIH1cbiAgICBtc2cgKz0gYCBJdCBtdXN0IGJlICR7cmFuZ2V9LiBSZWNlaXZlZCAke3JlY2VpdmVkfWA7XG5cbiAgICBzdXBlcihtc2cpO1xuXG4gICAgY29uc3QgeyBuYW1lIH0gPSB0aGlzO1xuICAgIC8vIEFkZCB0aGUgZXJyb3IgY29kZSB0byB0aGUgbmFtZSB0byBpbmNsdWRlIGl0IGluIHRoZSBzdGFjayB0cmFjZS5cbiAgICB0aGlzLm5hbWUgPSBgJHtuYW1lfSBbJHt0aGlzLmNvZGV9XWA7XG4gICAgLy8gQWNjZXNzIHRoZSBzdGFjayB0byBnZW5lcmF0ZSB0aGUgZXJyb3IgbWVzc2FnZSBpbmNsdWRpbmcgdGhlIGVycm9yIGNvZGUgZnJvbSB0aGUgbmFtZS5cbiAgICB0aGlzLnN0YWNrO1xuICAgIC8vIFJlc2V0IHRoZSBuYW1lIHRvIHRoZSBhY3R1YWwgbmFtZS5cbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQU1CSUdVT1VTX0FSR1VNRU5UIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQU1CSUdVT1VTX0FSR1VNRU5UXCIsIGBUaGUgXCIke3h9XCIgYXJndW1lbnQgaXMgYW1iaWd1b3VzLiAke3l9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9BUkdfTk9UX0lURVJBQkxFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0FSR19OT1RfSVRFUkFCTEVcIiwgYCR7eH0gbXVzdCBiZSBpdGVyYWJsZWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQVNTRVJUSU9OIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQVNTRVJUSU9OXCIsIGAke3h9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9BU1lOQ19DQUxMQkFDSyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9BU1lOQ19DQUxMQkFDS1wiLCBgJHt4fSBtdXN0IGJlIGEgZnVuY3Rpb25gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0FTWU5DX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQVNZTkNfVFlQRVwiLCBgSW52YWxpZCBuYW1lIGZvciBhc3luYyBcInR5cGVcIjogJHt4fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQlJPVExJX0lOVkFMSURfUEFSQU0gZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0JST1RMSV9JTlZBTElEX1BBUkFNXCIsIGAke3h9IGlzIG5vdCBhIHZhbGlkIEJyb3RsaSBwYXJhbWV0ZXJgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihuYW1lPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9CVUZGRVJfT1VUX09GX0JPVU5EU1wiLFxuICAgICAgbmFtZVxuICAgICAgICA/IGBcIiR7bmFtZX1cIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHNgXG4gICAgICAgIDogXCJBdHRlbXB0IHRvIGFjY2VzcyBtZW1vcnkgb3V0c2lkZSBidWZmZXIgYm91bmRzXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0JVRkZFUl9UT09fTEFSR0UgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQlVGRkVSX1RPT19MQVJHRVwiLFxuICAgICAgYENhbm5vdCBjcmVhdGUgYSBCdWZmZXIgbGFyZ2VyIHRoYW4gJHt4fSBieXRlc2AsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NBTk5PVF9XQVRDSF9TSUdJTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9DQU5OT1RfV0FUQ0hfU0lHSU5UXCIsIFwiQ2Fubm90IHdhdGNoIGZvciBTSUdJTlQgc2lnbmFsc1wiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NISUxEX0NMT1NFRF9CRUZPUkVfUkVQTFkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NISUxEX0NMT1NFRF9CRUZPUkVfUkVQTFlcIixcbiAgICAgIFwiQ2hpbGQgY2xvc2VkIGJlZm9yZSByZXBseSByZWNlaXZlZFwiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DSElMRF9QUk9DRVNTX0lQQ19SRVFVSVJFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ0hJTERfUFJPQ0VTU19JUENfUkVRVUlSRURcIixcbiAgICAgIGBGb3JrZWQgcHJvY2Vzc2VzIG11c3QgaGF2ZSBhbiBJUEMgY2hhbm5lbCwgbWlzc2luZyB2YWx1ZSAnaXBjJyBpbiAke3h9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ0hJTERfUFJPQ0VTU19TVERJT19NQVhCVUZGRVIgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ0hJTERfUFJPQ0VTU19TVERJT19NQVhCVUZGRVJcIixcbiAgICAgIGAke3h9IG1heEJ1ZmZlciBsZW5ndGggZXhjZWVkZWRgLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DT05TT0xFX1dSSVRBQkxFX1NUUkVBTSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NPTlNPTEVfV1JJVEFCTEVfU1RSRUFNXCIsXG4gICAgICBgQ29uc29sZSBleHBlY3RzIGEgd3JpdGFibGUgc3RyZWFtIGluc3RhbmNlIGZvciAke3h9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ09OVEVYVF9OT1RfSU5JVElBTElaRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9DT05URVhUX05PVF9JTklUSUFMSVpFRFwiLCBcImNvbnRleHQgdXNlZCBpcyBub3QgaW5pdGlhbGl6ZWRcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUFVfVVNBR0UgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9DUFVfVVNBR0VcIiwgYFVuYWJsZSB0byBvYnRhaW4gY3B1IHVzYWdlICR7eH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19DVVNUT01fRU5HSU5FX05PVF9TVVBQT1JURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19DVVNUT01fRU5HSU5FX05PVF9TVVBQT1JURURcIixcbiAgICAgIFwiQ3VzdG9tIGVuZ2luZXMgbm90IHN1cHBvcnRlZCBieSB0aGlzIE9wZW5TU0xcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9GT1JNQVQgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9GT1JNQVRcIiwgYEludmFsaWQgRUNESCBmb3JtYXQ6ICR7eH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19FQ0RIX0lOVkFMSURfUFVCTElDX0tFWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9QVUJMSUNfS0VZXCIsXG4gICAgICBcIlB1YmxpYyBrZXkgaXMgbm90IHZhbGlkIGZvciBzcGVjaWZpZWQgY3VydmVcIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0VOR0lORV9VTktOT1dOIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfQ1JZUFRPX0VOR0lORV9VTktOT1dOXCIsIGBFbmdpbmUgXCIke3h9XCIgd2FzIG5vdCBmb3VuZGApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0ZJUFNfRk9SQ0VEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fRklQU19GT1JDRURcIixcbiAgICAgIFwiQ2Fubm90IHNldCBGSVBTIG1vZGUsIGl0IHdhcyBmb3JjZWQgd2l0aCAtLWZvcmNlLWZpcHMgYXQgc3RhcnR1cC5cIixcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0ZJUFNfVU5BVkFJTEFCTEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0NSWVBUT19GSVBTX1VOQVZBSUxBQkxFXCIsXG4gICAgICBcIkNhbm5vdCBzZXQgRklQUyBtb2RlIGluIGEgbm9uLUZJUFMgYnVpbGQuXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19IQVNIX0ZJTkFMSVpFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19IQVNIX0ZJTkFMSVpFRFwiLCBcIkRpZ2VzdCBhbHJlYWR5IGNhbGxlZFwiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19IQVNIX1VQREFURV9GQUlMRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9DUllQVE9fSEFTSF9VUERBVEVfRkFJTEVEXCIsIFwiSGFzaCB1cGRhdGUgZmFpbGVkXCIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOQ09NUEFUSUJMRV9LRVkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19JTkNPTVBBVElCTEVfS0VZXCIsIGBJbmNvbXBhdGlibGUgJHt4fTogJHt5fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOQ09NUEFUSUJMRV9LRVlfT1BUSU9OUyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9DUllQVE9fSU5DT01QQVRJQkxFX0tFWV9PUFRJT05TXCIsXG4gICAgICBgVGhlIHNlbGVjdGVkIGtleSBlbmNvZGluZyAke3h9ICR7eX0uYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX0lOVkFMSURfRElHRVNUIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19JTlZBTElEX0RJR0VTVFwiLCBgSW52YWxpZCBkaWdlc3Q6ICR7eH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19JTlZBTElEX0tFWV9PQkpFQ1RfVFlQRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfQ1JZUFRPX0lOVkFMSURfS0VZX09CSkVDVF9UWVBFXCIsXG4gICAgICBgSW52YWxpZCBrZXkgb2JqZWN0IHR5cGUgJHt4fSwgZXhwZWN0ZWQgJHt5fS5gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fSU5WQUxJRF9TVEFURSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19JTlZBTElEX1NUQVRFXCIsIGBJbnZhbGlkIHN0YXRlIGZvciBvcGVyYXRpb24gJHt4fWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfQ1JZUFRPX1BCS0RGMl9FUlJPUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19QQktERjJfRVJST1JcIiwgXCJQQktERjIgZXJyb3JcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9DUllQVE9fU0NSWVBUX0lOVkFMSURfUEFSQU1FVEVSIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfQ1JZUFRPX1NDUllQVF9JTlZBTElEX1BBUkFNRVRFUlwiLCBcIkludmFsaWQgc2NyeXB0IHBhcmFtZXRlclwiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19TQ1JZUFRfTk9UX1NVUFBPUlRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19TQ1JZUFRfTk9UX1NVUFBPUlRFRFwiLCBcIlNjcnlwdCBhbGdvcml0aG0gbm90IHN1cHBvcnRlZFwiKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0NSWVBUT19TSUdOX0tFWV9SRVFVSVJFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0NSWVBUT19TSUdOX0tFWV9SRVFVSVJFRFwiLCBcIk5vIGtleSBwcm92aWRlZCB0byBzaWduXCIpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfRElSX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0RJUl9DTE9TRURcIiwgXCJEaXJlY3RvcnkgaGFuZGxlIHdhcyBjbG9zZWRcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9ESVJfQ09OQ1VSUkVOVF9PUEVSQVRJT04gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0RJUl9DT05DVVJSRU5UX09QRVJBVElPTlwiLFxuICAgICAgXCJDYW5ub3QgZG8gc3luY2hyb25vdXMgd29yayBvbiBkaXJlY3RvcnkgaGFuZGxlIHdpdGggY29uY3VycmVudCBhc3luY2hyb25vdXMgb3BlcmF0aW9uc1wiLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9ETlNfU0VUX1NFUlZFUlNfRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0ROU19TRVRfU0VSVkVSU19GQUlMRURcIixcbiAgICAgIGBjLWFyZXMgZmFpbGVkIHRvIHNldCBzZXJ2ZXJzOiBcIiR7eH1cIiBbJHt5fV1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9ET01BSU5fQ0FMTEJBQ0tfTk9UX0FWQUlMQUJMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRE9NQUlOX0NBTExCQUNLX05PVF9BVkFJTEFCTEVcIixcbiAgICAgIFwiQSBjYWxsYmFjayB3YXMgcmVnaXN0ZXJlZCB0aHJvdWdoIFwiICtcbiAgICAgICAgXCJwcm9jZXNzLnNldFVuY2F1Z2h0RXhjZXB0aW9uQ2FwdHVyZUNhbGxiYWNrKCksIHdoaWNoIGlzIG11dHVhbGx5IFwiICtcbiAgICAgICAgXCJleGNsdXNpdmUgd2l0aCB1c2luZyB0aGUgYGRvbWFpbmAgbW9kdWxlXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0RPTUFJTl9DQU5OT1RfU0VUX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFXG4gIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9ET01BSU5fQ0FOTk9UX1NFVF9VTkNBVUdIVF9FWENFUFRJT05fQ0FQVFVSRVwiLFxuICAgICAgXCJUaGUgYGRvbWFpbmAgbW9kdWxlIGlzIGluIHVzZSwgd2hpY2ggaXMgbXV0dWFsbHkgZXhjbHVzaXZlIHdpdGggY2FsbGluZyBcIiArXG4gICAgICAgIFwicHJvY2Vzcy5zZXRVbmNhdWdodEV4Y2VwdGlvbkNhcHR1cmVDYWxsYmFjaygpXCIsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0VOQ09ESU5HX0lOVkFMSURfRU5DT0RFRF9EQVRBIGV4dGVuZHMgTm9kZUVycm9yQWJzdHJhY3Rpb25cbiAgaW1wbGVtZW50cyBUeXBlRXJyb3Ige1xuICBlcnJubzogbnVtYmVyO1xuICBjb25zdHJ1Y3RvcihlbmNvZGluZzogc3RyaW5nLCByZXQ6IG51bWJlcikge1xuICAgIHN1cGVyKFxuICAgICAgVHlwZUVycm9yLnByb3RvdHlwZS5uYW1lLFxuICAgICAgXCJFUlJfRU5DT0RJTkdfSU5WQUxJRF9FTkNPREVEX0RBVEFcIixcbiAgICAgIGBUaGUgZW5jb2RlZCBkYXRhIHdhcyBub3QgdmFsaWQgZm9yIGVuY29kaW5nICR7ZW5jb2Rpbmd9YCxcbiAgICApO1xuICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZih0aGlzLCBUeXBlRXJyb3IucHJvdG90eXBlKTtcblxuICAgIHRoaXMuZXJybm8gPSByZXQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9FTkNPRElOR19OT1RfU1VQUE9SVEVEIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9FTkNPRElOR19OT1RfU1VQUE9SVEVEXCIsIGBUaGUgXCIke3h9XCIgZW5jb2RpbmcgaXMgbm90IHN1cHBvcnRlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0VWQUxfRVNNX0NBTk5PVF9QUklOVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0VWQUxfRVNNX0NBTk5PVF9QUklOVFwiLCBgLS1wcmludCBjYW5ub3QgYmUgdXNlZCB3aXRoIEVTTSBpbnB1dGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0VWRU5UX1JFQ1VSU0lPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRVZFTlRfUkVDVVJTSU9OXCIsXG4gICAgICBgVGhlIGV2ZW50IFwiJHt4fVwiIGlzIGFscmVhZHkgYmVpbmcgZGlzcGF0Y2hlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9GRUFUVVJFX1VOQVZBSUxBQkxFX09OX1BMQVRGT1JNIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfRkVBVFVSRV9VTkFWQUlMQUJMRV9PTl9QTEFURk9STVwiLFxuICAgICAgYFRoZSBmZWF0dXJlICR7eH0gaXMgdW5hdmFpbGFibGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0sIHdoaWNoIGlzIGJlaW5nIHVzZWQgdG8gcnVuIE5vZGUuanNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfRlNfRklMRV9UT09fTEFSR0UgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0ZTX0ZJTEVfVE9PX0xBUkdFXCIsIGBGaWxlIHNpemUgKCR7eH0pIGlzIGdyZWF0ZXIgdGhhbiAyIEdCYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfRlNfSU5WQUxJRF9TWU1MSU5LX1RZUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0ZTX0lOVkFMSURfU1lNTElOS19UWVBFXCIsXG4gICAgICBgU3ltbGluayB0eXBlIG11c3QgYmUgb25lIG9mIFwiZGlyXCIsIFwiZmlsZVwiLCBvciBcImp1bmN0aW9uXCIuIFJlY2VpdmVkIFwiJHt4fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0FMVFNWQ19JTlZBTElEX09SSUdJTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0FMVFNWQ19JTlZBTElEX09SSUdJTlwiLFxuICAgICAgYEhUVFAvMiBBTFRTVkMgZnJhbWVzIHJlcXVpcmUgYSB2YWxpZCBvcmlnaW5gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfQUxUU1ZDX0xFTkdUSCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0FMVFNWQ19MRU5HVEhcIixcbiAgICAgIGBIVFRQLzIgQUxUU1ZDIGZyYW1lcyBhcmUgbGltaXRlZCB0byAxNjM4MiBieXRlc2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9DT05ORUNUX0FVVEhPUklUWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfQ09OTkVDVF9BVVRIT1JJVFlcIixcbiAgICAgIGA6YXV0aG9yaXR5IGhlYWRlciBpcyByZXF1aXJlZCBmb3IgQ09OTkVDVCByZXF1ZXN0c2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9DT05ORUNUX1BBVEggZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0NPTk5FQ1RfUEFUSFwiLFxuICAgICAgYFRoZSA6cGF0aCBoZWFkZXIgaXMgZm9yYmlkZGVuIGZvciBDT05ORUNUIHJlcXVlc3RzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0NPTk5FQ1RfU0NIRU1FIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9DT05ORUNUX1NDSEVNRVwiLFxuICAgICAgYFRoZSA6c2NoZW1lIGhlYWRlciBpcyBmb3JiaWRkZW4gZm9yIENPTk5FQ1QgcmVxdWVzdHNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfR09BV0FZX1NFU1NJT04gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0dPQVdBWV9TRVNTSU9OXCIsXG4gICAgICBgTmV3IHN0cmVhbXMgY2Fubm90IGJlIGNyZWF0ZWQgYWZ0ZXIgcmVjZWl2aW5nIGEgR09BV0FZYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0hFQURFUlNfQUZURVJfUkVTUE9ORCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSEVBREVSU19BRlRFUl9SRVNQT05EXCIsXG4gICAgICBgQ2Fubm90IHNwZWNpZnkgYWRkaXRpb25hbCBoZWFkZXJzIGFmdGVyIHJlc3BvbnNlIGluaXRpYXRlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9IRUFERVJTX1NFTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9IVFRQMl9IRUFERVJTX1NFTlRcIiwgYFJlc3BvbnNlIGhhcyBhbHJlYWR5IGJlZW4gaW5pdGlhdGVkLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0hFQURFUl9TSU5HTEVfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9IRUFERVJfU0lOR0xFX1ZBTFVFXCIsXG4gICAgICBgSGVhZGVyIGZpZWxkIFwiJHt4fVwiIG11c3Qgb25seSBoYXZlIGEgc2luZ2xlIHZhbHVlYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lORk9fU1RBVFVTX05PVF9BTExPV0VEIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lORk9fU1RBVFVTX05PVF9BTExPV0VEXCIsXG4gICAgICBgSW5mb3JtYXRpb25hbCBzdGF0dXMgY29kZXMgY2Fubm90IGJlIHVzZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9DT05ORUNUSU9OX0hFQURFUlMgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9JTlZBTElEX0NPTk5FQ1RJT05fSEVBREVSU1wiLFxuICAgICAgYEhUVFAvMSBDb25uZWN0aW9uIHNwZWNpZmljIGhlYWRlcnMgYXJlIGZvcmJpZGRlbjogXCIke3h9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9IRUFERVJfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lOVkFMSURfSEVBREVSX1ZBTFVFXCIsXG4gICAgICBgSW52YWxpZCB2YWx1ZSBcIiR7eH1cIiBmb3IgaGVhZGVyIFwiJHt5fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfSU5GT19TVEFUVVMgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9JTkZPX1NUQVRVU1wiLFxuICAgICAgYEludmFsaWQgaW5mb3JtYXRpb25hbCBzdGF0dXMgY29kZTogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX09SSUdJTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX0lOVkFMSURfT1JJR0lOXCIsXG4gICAgICBgSFRUUC8yIE9SSUdJTiBmcmFtZXMgcmVxdWlyZSBhIHZhbGlkIG9yaWdpbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX1BBQ0tFRF9TRVRUSU5HU19MRU5HVEggZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9QQUNLRURfU0VUVElOR1NfTEVOR1RIXCIsXG4gICAgICBgUGFja2VkIHNldHRpbmdzIGxlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2Ygc2l4YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfUFNFVURPSEVBREVSIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfSU5WQUxJRF9QU0VVRE9IRUFERVJcIixcbiAgICAgIGBcIiR7eH1cIiBpcyBhbiBpbnZhbGlkIHBzZXVkb2hlYWRlciBvciBpcyB1c2VkIGluY29ycmVjdGx5YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX0lOVkFMSURfU0VTU0lPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX0lOVkFMSURfU0VTU0lPTlwiLCBgVGhlIHNlc3Npb24gaGFzIGJlZW4gZGVzdHJveWVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfSU5WQUxJRF9TVFJFQU0gZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9IVFRQMl9JTlZBTElEX1NUUkVBTVwiLCBgVGhlIHN0cmVhbSBoYXMgYmVlbiBkZXN0cm95ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9NQVhfUEVORElOR19TRVRUSU5HU19BQ0sgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFAyX01BWF9QRU5ESU5HX1NFVFRJTkdTX0FDS1wiLFxuICAgICAgYE1heGltdW0gbnVtYmVyIG9mIHBlbmRpbmcgc2V0dGluZ3MgYWNrbm93bGVkZ2VtZW50c2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9ORVNURURfUFVTSCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfTkVTVEVEX1BVU0hcIixcbiAgICAgIGBBIHB1c2ggc3RyZWFtIGNhbm5vdCBpbml0aWF0ZSBhbm90aGVyIHB1c2ggc3RyZWFtLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9OT19TT0NLRVRfTUFOSVBVTEFUSU9OIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9OT19TT0NLRVRfTUFOSVBVTEFUSU9OXCIsXG4gICAgICBgSFRUUC8yIHNvY2tldHMgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBtYW5pcHVsYXRlZCAoZS5nLiByZWFkIGFuZCB3cml0dGVuKWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9PUklHSU5fTEVOR1RIIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfT1JJR0lOX0xFTkdUSFwiLFxuICAgICAgYEhUVFAvMiBPUklHSU4gZnJhbWVzIGFyZSBsaW1pdGVkIHRvIDE2MzgyIGJ5dGVzYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX09VVF9PRl9TVFJFQU1TIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9PVVRfT0ZfU1RSRUFNU1wiLFxuICAgICAgYE5vIHN0cmVhbSBJRCBpcyBhdmFpbGFibGUgYmVjYXVzZSBtYXhpbXVtIHN0cmVhbSBJRCBoYXMgYmVlbiByZWFjaGVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1BBWUxPQURfRk9SQklEREVOIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9QQVlMT0FEX0ZPUkJJRERFTlwiLFxuICAgICAgYFJlc3BvbnNlcyB3aXRoICR7eH0gc3RhdHVzIG11c3Qgbm90IGhhdmUgYSBwYXlsb2FkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1BJTkdfQ0FOQ0VMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSFRUUDJfUElOR19DQU5DRUxcIiwgYEhUVFAyIHBpbmcgY2FuY2VsbGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUElOR19MRU5HVEggZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1BJTkdfTEVOR1RIXCIsIGBIVFRQMiBwaW5nIHBheWxvYWQgbXVzdCBiZSA4IGJ5dGVzYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUFNFVURPSEVBREVSX05PVF9BTExPV0VEIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfUFNFVURPSEVBREVSX05PVF9BTExPV0VEXCIsXG4gICAgICBgQ2Fubm90IHNldCBIVFRQLzIgcHNldWRvLWhlYWRlcnNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfUFVTSF9ESVNBQkxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1BVU0hfRElTQUJMRURcIiwgYEhUVFAvMiBjbGllbnQgaGFzIGRpc2FibGVkIHB1c2ggc3RyZWFtc2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NFTkRfRklMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1NFTkRfRklMRVwiLCBgRGlyZWN0b3JpZXMgY2Fubm90IGJlIHNlbnRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TRU5EX0ZJTEVfTk9TRUVLIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TRU5EX0ZJTEVfTk9TRUVLXCIsXG4gICAgICBgT2Zmc2V0IG9yIGxlbmd0aCBjYW4gb25seSBiZSBzcGVjaWZpZWQgZm9yIHJlZ3VsYXIgZmlsZXNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU0VTU0lPTl9FUlJPUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1NFU1NJT05fRVJST1JcIiwgYFNlc3Npb24gY2xvc2VkIHdpdGggZXJyb3IgY29kZSAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU0VUVElOR1NfQ0FOQ0VMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSFRUUDJfU0VUVElOR1NfQ0FOQ0VMXCIsIGBIVFRQMiBzZXNzaW9uIHNldHRpbmdzIGNhbmNlbGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU09DS0VUX0JPVU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TT0NLRVRfQk9VTkRcIixcbiAgICAgIGBUaGUgc29ja2V0IGlzIGFscmVhZHkgYm91bmQgdG8gYW4gSHR0cDJTZXNzaW9uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1NPQ0tFVF9VTkJPVU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TT0NLRVRfVU5CT1VORFwiLFxuICAgICAgYFRoZSBzb2NrZXQgaGFzIGJlZW4gZGlzY29ubmVjdGVkIGZyb20gdGhlIEh0dHAyU2Vzc2lvbmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TVEFUVVNfMTAxIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TVEFUVVNfMTAxXCIsXG4gICAgICBgSFRUUCBzdGF0dXMgY29kZSAxMDEgKFN3aXRjaGluZyBQcm90b2NvbHMpIGlzIGZvcmJpZGRlbiBpbiBIVFRQLzJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU1RBVFVTX0lOVkFMSUQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0hUVFAyX1NUQVRVU19JTlZBTElEXCIsIGBJbnZhbGlkIHN0YXR1cyBjb2RlOiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU1RSRUFNX0VSUk9SIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfSFRUUDJfU1RSRUFNX0VSUk9SXCIsIGBTdHJlYW0gY2xvc2VkIHdpdGggZXJyb3IgY29kZSAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfU1RSRUFNX1NFTEZfREVQRU5ERU5DWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfU1RSRUFNX1NFTEZfREVQRU5ERU5DWVwiLFxuICAgICAgYEEgc3RyZWFtIGNhbm5vdCBkZXBlbmQgb24gaXRzZWxmYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1RSQUlMRVJTX0FMUkVBRFlfU0VOVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfVFJBSUxFUlNfQUxSRUFEWV9TRU5UXCIsXG4gICAgICBgVHJhaWxpbmcgaGVhZGVycyBoYXZlIGFscmVhZHkgYmVlbiBzZW50YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFAyX1RSQUlMRVJTX05PVF9SRUFEWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUDJfVFJBSUxFUlNfTk9UX1JFQURZXCIsXG4gICAgICBgVHJhaWxpbmcgaGVhZGVycyBjYW5ub3QgYmUgc2VudCB1bnRpbCBhZnRlciB0aGUgd2FudFRyYWlsZXJzIGV2ZW50IGlzIGVtaXR0ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUDJfVU5TVVBQT1JURURfUFJPVE9DT0wgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9IVFRQMl9VTlNVUFBPUlRFRF9QUk9UT0NPTFwiLCBgcHJvdG9jb2wgXCIke3h9XCIgaXMgdW5zdXBwb3J0ZWQuYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUF9IRUFERVJTX1NFTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0hUVFBfSEVBREVSU19TRU5UXCIsXG4gICAgICBgQ2Fubm90ICR7eH0gaGVhZGVycyBhZnRlciB0aGV5IGFyZSBzZW50IHRvIHRoZSBjbGllbnRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSFRUUF9JTlZBTElEX0hFQURFUl9WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUF9JTlZBTElEX0hFQURFUl9WQUxVRVwiLFxuICAgICAgYEludmFsaWQgdmFsdWUgXCIke3h9XCIgZm9yIGhlYWRlciBcIiR7eX1cImAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQX0lOVkFMSURfU1RBVFVTX0NPREUgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0hUVFBfSU5WQUxJRF9TVEFUVVNfQ09ERVwiLCBgSW52YWxpZCBzdGF0dXMgY29kZTogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0hUVFBfU09DS0VUX0VOQ09ESU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQX1NPQ0tFVF9FTkNPRElOR1wiLFxuICAgICAgYENoYW5naW5nIHRoZSBzb2NrZXQgZW5jb2RpbmcgaXMgbm90IGFsbG93ZWQgcGVyIFJGQzcyMzAgU2VjdGlvbiAzLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQX1RSQUlMRVJfSU5WQUxJRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSFRUUF9UUkFJTEVSX0lOVkFMSURcIixcbiAgICAgIGBUcmFpbGVycyBhcmUgaW52YWxpZCB3aXRoIHRoaXMgdHJhbnNmZXIgZW5jb2RpbmdgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5DT01QQVRJQkxFX09QVElPTl9QQUlSIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTkNPTVBBVElCTEVfT1BUSU9OX1BBSVJcIixcbiAgICAgIGBPcHRpb24gXCIke3h9XCIgY2Fubm90IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBvcHRpb24gXCIke3l9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5QVVRfVFlQRV9OT1RfQUxMT1dFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5QVVRfVFlQRV9OT1RfQUxMT1dFRFwiLFxuICAgICAgYC0taW5wdXQtdHlwZSBjYW4gb25seSBiZSB1c2VkIHdpdGggc3RyaW5nIGlucHV0IHZpYSAtLWV2YWwsIC0tcHJpbnQsIG9yIFNURElOYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9BTFJFQURZX0FDVElWQVRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5TUEVDVE9SX0FMUkVBRFlfQUNUSVZBVEVEXCIsXG4gICAgICBgSW5zcGVjdG9yIGlzIGFscmVhZHkgYWN0aXZhdGVkLiBDbG9zZSBpdCB3aXRoIGluc3BlY3Rvci5jbG9zZSgpIGJlZm9yZSBhY3RpdmF0aW5nIGl0IGFnYWluLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfQUxSRUFEWV9DT05ORUNURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlNQRUNUT1JfQUxSRUFEWV9DT05ORUNURURcIiwgYCR7eH0gaXMgYWxyZWFkeSBjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfQ0xPU0VEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSU5TUEVDVE9SX0NMT1NFRFwiLCBgU2Vzc2lvbiB3YXMgY2xvc2VkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5TUEVDVE9SX0NPTU1BTkQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOU1BFQ1RPUl9DT01NQU5EXCIsIGBJbnNwZWN0b3IgZXJyb3IgJHt4fTogJHt5fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOU1BFQ1RPUl9OT1RfQUNUSVZFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSU5TUEVDVE9SX05PVF9BQ1RJVkVcIiwgYEluc3BlY3RvciBpcyBub3QgYWN0aXZlYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5TUEVDVE9SX05PVF9BVkFJTEFCTEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9JTlNQRUNUT1JfTk9UX0FWQUlMQUJMRVwiLCBgSW5zcGVjdG9yIGlzIG5vdCBhdmFpbGFibGVgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfTk9UX0NPTk5FQ1RFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0lOU1BFQ1RPUl9OT1RfQ09OTkVDVEVEXCIsIGBTZXNzaW9uIGlzIG5vdCBjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlNQRUNUT1JfTk9UX1dPUktFUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0lOU1BFQ1RPUl9OT1RfV09SS0VSXCIsIGBDdXJyZW50IHRocmVhZCBpcyBub3QgYSB3b3JrZXJgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0FTWU5DX0lEIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZyB8IG51bWJlcikge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfQVNZTkNfSURcIiwgYEludmFsaWQgJHt4fSB2YWx1ZTogJHt5fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfQlVGRkVSX1NJWkUgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfQlVGRkVSX1NJWkVcIiwgYEJ1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9DVVJTT1JfUE9TIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9DVVJTT1JfUE9TXCIsXG4gICAgICBgQ2Fubm90IHNldCBjdXJzb3Igcm93IHdpdGhvdXQgc2V0dGluZyBpdHMgY29sdW1uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRkQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfRkRcIiwgYFwiZmRcIiBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcjogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRkRfVFlQRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX0ZEX1RZUEVcIiwgYFVuc3VwcG9ydGVkIGZkIHR5cGU6ICR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0ZJTEVfVVJMX0hPU1QgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX0ZJTEVfVVJMX0hPU1RcIixcbiAgICAgIGBGaWxlIFVSTCBob3N0IG11c3QgYmUgXCJsb2NhbGhvc3RcIiBvciBlbXB0eSBvbiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfRklMRV9VUkxfUEFUSCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX0ZJTEVfVVJMX1BBVEhcIiwgYEZpbGUgVVJMIHBhdGggJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfSEFORExFX1RZUEUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSU5WQUxJRF9IQU5ETEVfVFlQRVwiLCBgVGhpcyBoYW5kbGUgdHlwZSBjYW5ub3QgYmUgc2VudGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfSFRUUF9UT0tFTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfSFRUUF9UT0tFTlwiLCBgJHt4fSBtdXN0IGJlIGEgdmFsaWQgSFRUUCB0b2tlbiBbXCIke3l9XCJdYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9JUF9BRERSRVNTIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfSVBfQUREUkVTU1wiLCBgSW52YWxpZCBJUCBhZGRyZXNzOiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9PUFRfVkFMVUVfRU5DT0RJTkcgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX09QVF9WQUxVRV9FTkNPRElOR1wiLFxuICAgICAgYFRoZSB2YWx1ZSBcIiR7eH1cIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJlbmNvZGluZ1wiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUEVSRk9STUFOQ0VfTUFSSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9QRVJGT1JNQU5DRV9NQVJLXCIsXG4gICAgICBgVGhlIFwiJHt4fVwiIHBlcmZvcm1hbmNlIG1hcmsgaGFzIG5vdCBiZWVuIHNldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1BST1RPQ09MIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZywgeTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1BST1RPQ09MXCIsXG4gICAgICBgUHJvdG9jb2wgXCIke3h9XCIgbm90IHN1cHBvcnRlZC4gRXhwZWN0ZWQgXCIke3l9XCJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9SRVBMX0VWQUxfQ09ORklHIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9SRVBMX0VWQUxfQ09ORklHXCIsXG4gICAgICBgQ2Fubm90IHNwZWNpZnkgYm90aCBcImJyZWFrRXZhbE9uU2lnaW50XCIgYW5kIFwiZXZhbFwiIGZvciBSRVBMYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVQTF9JTlBVVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1JFUExfSU5QVVRcIiwgYCR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1NZTkNfRk9SS19JTlBVVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfU1lOQ19GT1JLX0lOUFVUXCIsXG4gICAgICBgQXN5bmNocm9ub3VzIGZvcmtzIGRvIG5vdCBzdXBwb3J0IEJ1ZmZlciwgVHlwZWRBcnJheSwgRGF0YVZpZXcgb3Igc3RyaW5nIGlucHV0OiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfVEhJUyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1RISVNcIiwgYFZhbHVlIG9mIFwidGhpc1wiIG11c3QgYmUgb2YgdHlwZSAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9UVVBMRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfVFVQTEVcIiwgYCR7eH0gbXVzdCBiZSBhbiBpdGVyYWJsZSAke3l9IHR1cGxlYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9VUkkgZXh0ZW5kcyBOb2RlVVJJRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1VSSVwiLCBgVVJJIG1hbGZvcm1lZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX0lQQ19DSEFOTkVMX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX0lQQ19DSEFOTkVMX0NMT1NFRFwiLCBgQ2hhbm5lbCBjbG9zZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfRElTQ09OTkVDVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSVBDX0RJU0NPTk5FQ1RFRFwiLCBgSVBDIGNoYW5uZWwgaXMgYWxyZWFkeSBkaXNjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfT05FX1BJUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9JUENfT05FX1BJUEVcIiwgYENoaWxkIHByb2Nlc3MgY2FuIGhhdmUgb25seSBvbmUgSVBDIHBpcGVgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9JUENfU1lOQ19GT1JLIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfSVBDX1NZTkNfRk9SS1wiLCBgSVBDIGNhbm5vdCBiZSB1c2VkIHdpdGggc3luY2hyb25vdXMgZm9ya3NgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9ERVBFTkRFTkNZX01JU1NJTkcgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTUFOSUZFU1RfREVQRU5ERU5DWV9NSVNTSU5HXCIsXG4gICAgICBgTWFuaWZlc3QgcmVzb3VyY2UgJHt4fSBkb2VzIG5vdCBsaXN0ICR7eX0gYXMgYSBkZXBlbmRlbmN5IHNwZWNpZmllcmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9JTlRFR1JJVFlfTUlTTUFUQ0ggZXh0ZW5kcyBOb2RlU3ludGF4RXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01BTklGRVNUX0lOVEVHUklUWV9NSVNNQVRDSFwiLFxuICAgICAgYE1hbmlmZXN0IHJlc291cmNlICR7eH0gaGFzIG11bHRpcGxlIGVudHJpZXMgYnV0IGludGVncml0eSBsaXN0cyBkbyBub3QgbWF0Y2hgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTUFOSUZFU1RfSU5WQUxJRF9SRVNPVVJDRV9GSUVMRCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcsIHk6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTUFOSUZFU1RfSU5WQUxJRF9SRVNPVVJDRV9GSUVMRFwiLFxuICAgICAgYE1hbmlmZXN0IHJlc291cmNlICR7eH0gaGFzIGludmFsaWQgcHJvcGVydHkgdmFsdWUgZm9yICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTUFOSUZFU1RfVERaIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfTUFOSUZFU1RfVERaXCIsIGBNYW5pZmVzdCBpbml0aWFsaXphdGlvbiBoYXMgbm90IHlldCBydW5gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NQU5JRkVTVF9VTktOT1dOX09ORVJST1IgZXh0ZW5kcyBOb2RlU3ludGF4RXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01BTklGRVNUX1VOS05PV05fT05FUlJPUlwiLFxuICAgICAgYE1hbmlmZXN0IHNwZWNpZmllZCB1bmtub3duIGVycm9yIGJlaGF2aW9yIFwiJHt4fVwiLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfTUVUSE9EX05PVF9JTVBMRU1FTlRFRFwiLCBgVGhlICR7eH0gbWV0aG9kIGlzIG5vdCBpbXBsZW1lbnRlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX01JU1NJTkdfQVJHUyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvciguLi5hcmdzOiAoc3RyaW5nIHwgc3RyaW5nW10pW10pIHtcbiAgICBsZXQgbXNnID0gXCJUaGUgXCI7XG5cbiAgICBjb25zdCBsZW4gPSBhcmdzLmxlbmd0aDtcblxuICAgIGNvbnN0IHdyYXAgPSAoYTogdW5rbm93bikgPT4gYFwiJHthfVwiYDtcblxuICAgIGFyZ3MgPSBhcmdzLm1hcCgoYSkgPT5cbiAgICAgIEFycmF5LmlzQXJyYXkoYSkgPyBhLm1hcCh3cmFwKS5qb2luKFwiIG9yIFwiKSA6IHdyYXAoYSlcbiAgICApO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgbXNnICs9IGAke2FyZ3NbMF19IGFyZ3VtZW50YDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIG1zZyArPSBgJHthcmdzWzBdfSBhbmQgJHthcmdzWzFdfSBhcmd1bWVudHNgO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG1zZyArPSBhcmdzLnNsaWNlKDAsIGxlbiAtIDEpLmpvaW4oXCIsIFwiKTtcbiAgICAgICAgbXNnICs9IGAsIGFuZCAke2FyZ3NbbGVuIC0gMV19IGFyZ3VtZW50c2A7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHN1cGVyKFwiRVJSX01JU1NJTkdfQVJHU1wiLCBgJHttc2d9IG11c3QgYmUgc3BlY2lmaWVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTUlTU0lOR19PUFRJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfTUlTU0lOR19PUFRJT05cIiwgYCR7eH0gaXMgcmVxdWlyZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9NVUxUSVBMRV9DQUxMQkFDSyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX01VTFRJUExFX0NBTExCQUNLXCIsIGBDYWxsYmFjayBjYWxsZWQgbXVsdGlwbGUgdGltZXNgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9OQVBJX0NPTlNfRlVOQ1RJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfTkFQSV9DT05TX0ZVTkNUSU9OXCIsIGBDb25zdHJ1Y3RvciBtdXN0IGJlIGEgZnVuY3Rpb25gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHUyBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHU1wiLFxuICAgICAgYGJ5dGVfb2Zmc2V0ICsgYnl0ZV9sZW5ndGggc2hvdWxkIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgc2l6ZSBpbiBieXRlcyBvZiB0aGUgYXJyYXkgcGFzc2VkIGluYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVCBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVFwiLFxuICAgICAgYHN0YXJ0IG9mZnNldCBvZiAke3h9IHNob3VsZCBiZSBhIG11bHRpcGxlIG9mICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTkFQSV9JTlZBTElEX1RZUEVEQVJSQVlfTEVOR1RIIGV4dGVuZHMgTm9kZVJhbmdlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9OQVBJX0lOVkFMSURfVFlQRURBUlJBWV9MRU5HVEhcIiwgYEludmFsaWQgdHlwZWQgYXJyYXkgbGVuZ3RoYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTk9fQ1JZUFRPIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9OT19DUllQVE9cIixcbiAgICAgIGBOb2RlLmpzIGlzIG5vdCBjb21waWxlZCB3aXRoIE9wZW5TU0wgY3J5cHRvIHN1cHBvcnRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfTk9fSUNVIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfTk9fSUNVXCIsXG4gICAgICBgJHt4fSBpcyBub3Qgc3VwcG9ydGVkIG9uIE5vZGUuanMgY29tcGlsZWQgd2l0aG91dCBJQ1VgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ0NMSUVOVFNFU1NJT05fRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDQ0xJRU5UU0VTU0lPTl9GQUlMRURcIixcbiAgICAgIGBGYWlsZWQgdG8gY3JlYXRlIGEgbmV3IFF1aWNDbGllbnRTZXNzaW9uOiAke3h9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRF9TRVRTT0NLRVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRF9TRVRTT0NLRVRcIixcbiAgICAgIGBGYWlsZWQgdG8gc2V0IHRoZSBRdWljU29ja2V0YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTRVNTSU9OX0RFU1RST1lFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NFU1NJT05fREVTVFJPWUVEXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBhZnRlciBhIFF1aWNTZXNzaW9uIGhhcyBiZWVuIGRlc3Ryb3llZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU0VTU0lPTl9JTlZBTElEX0RDSUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9RVUlDU0VTU0lPTl9JTlZBTElEX0RDSURcIiwgYEludmFsaWQgRENJRCB2YWx1ZTogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTRVNTSU9OX1VQREFURUtFWSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1FVSUNTRVNTSU9OX1VQREFURUtFWVwiLCBgVW5hYmxlIHRvIHVwZGF0ZSBRdWljU2Vzc2lvbiBrZXlzYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ1NPQ0tFVF9ERVNUUk9ZRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1FVSUNTT0NLRVRfREVTVFJPWUVEXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBhZnRlciBhIFF1aWNTb2NrZXQgaGFzIGJlZW4gZGVzdHJveWVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfSU5WQUxJRF9TVEFURUxFU1NfUkVTRVRfU0VDUkVUX0xFTkdUSFxuICBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NPQ0tFVF9JTlZBTElEX1NUQVRFTEVTU19SRVNFVF9TRUNSRVRfTEVOR1RIXCIsXG4gICAgICBgVGhlIHN0YXRlUmVzZXRUb2tlbiBtdXN0IGJlIGV4YWN0bHkgMTYtYnl0ZXMgaW4gbGVuZ3RoYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfTElTVEVOSU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfUVVJQ1NPQ0tFVF9MSVNURU5JTkdcIiwgYFRoaXMgUXVpY1NvY2tldCBpcyBhbHJlYWR5IGxpc3RlbmluZ2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTT0NLRVRfVU5CT1VORCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NPQ0tFVF9VTkJPVU5EXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBiZWZvcmUgYSBRdWljU29ja2V0IGhhcyBiZWVuIGJvdW5kYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTVFJFQU1fREVTVFJPWUVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9RVUlDU1RSRUFNX0RFU1RST1lFRFwiLFxuICAgICAgYENhbm5vdCBjYWxsICR7eH0gYWZ0ZXIgYSBRdWljU3RyZWFtIGhhcyBiZWVuIGRlc3Ryb3llZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU1RSRUFNX0lOVkFMSURfUFVTSCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NUUkVBTV9JTlZBTElEX1BVU0hcIixcbiAgICAgIGBQdXNoIHN0cmVhbXMgYXJlIG9ubHkgc3VwcG9ydGVkIG9uIGNsaWVudC1pbml0aWF0ZWQsIGJpZGlyZWN0aW9uYWwgc3RyZWFtc2AsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9RVUlDU1RSRUFNX09QRU5fRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfUVVJQ1NUUkVBTV9PUEVOX0ZBSUxFRFwiLCBgT3BlbmluZyBhIG5ldyBRdWljU3RyZWFtIGZhaWxlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1FVSUNTVFJFQU1fVU5TVVBQT1JURURfUFVTSCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfUVVJQ1NUUkVBTV9VTlNVUFBPUlRFRF9QVVNIXCIsXG4gICAgICBgUHVzaCBzdHJlYW1zIGFyZSBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgUXVpY1Nlc3Npb25gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfUVVJQ19UTFMxM19SRVFVSVJFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1FVSUNfVExTMTNfUkVRVUlSRURcIiwgYFFVSUMgcmVxdWlyZXMgVExTIHZlcnNpb24gMS4zYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRFwiLFxuICAgICAgXCJTY3JpcHQgZXhlY3V0aW9uIHdhcyBpbnRlcnJ1cHRlZCBieSBgU0lHSU5UYFwiLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU0VSVkVSX0FMUkVBRFlfTElTVEVOIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TRVJWRVJfQUxSRUFEWV9MSVNURU5cIixcbiAgICAgIGBMaXN0ZW4gbWV0aG9kIGhhcyBiZWVuIGNhbGxlZCBtb3JlIHRoYW4gb25jZSB3aXRob3V0IGNsb3NpbmcuYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NFUlZFUl9OT1RfUlVOTklORyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NFUlZFUl9OT1RfUlVOTklOR1wiLCBgU2VydmVyIGlzIG5vdCBydW5uaW5nLmApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NPQ0tFVF9BTFJFQURZX0JPVU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU09DS0VUX0FMUkVBRFlfQk9VTkRcIiwgYFNvY2tldCBpcyBhbHJlYWR5IGJvdW5kYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU09DS0VUX0JBRF9CVUZGRVJfU0laRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9CQURfQlVGRkVSX1NJWkVcIixcbiAgICAgIGBCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfQkFEX1BPUlQgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgcG9ydDogdW5rbm93biwgYWxsb3daZXJvID0gdHJ1ZSkge1xuICAgIGFzc2VydChcbiAgICAgIHR5cGVvZiBhbGxvd1plcm8gPT09IFwiYm9vbGVhblwiLFxuICAgICAgXCJUaGUgJ2FsbG93WmVybycgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIGJvb2xlYW4uXCIsXG4gICAgKTtcblxuICAgIGNvbnN0IG9wZXJhdG9yID0gYWxsb3daZXJvID8gXCI+PVwiIDogXCI+XCI7XG5cbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9CQURfUE9SVFwiLFxuICAgICAgYCR7bmFtZX0gc2hvdWxkIGJlICR7b3BlcmF0b3J9IDAgYW5kIDwgNjU1MzYuIFJlY2VpdmVkICR7cG9ydH0uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NPQ0tFVF9CQURfVFlQRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NPQ0tFVF9CQURfVFlQRVwiLFxuICAgICAgYEJhZCBzb2NrZXQgdHlwZSBzcGVjaWZpZWQuIFZhbGlkIHR5cGVzIGFyZTogdWRwNCwgdWRwNmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfQlVGRkVSX1NJWkUgZXh0ZW5kcyBOb2RlU3lzdGVtRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihjdHg6IE5vZGVTeXN0ZW1FcnJvckN0eCkge1xuICAgIHN1cGVyKFwiRVJSX1NPQ0tFVF9CVUZGRVJfU0laRVwiLCBjdHgsIFwiQ291bGQgbm90IGdldCBvciBzZXQgYnVmZmVyIHNpemVcIik7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU09DS0VUX0NMT1NFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NPQ0tFVF9DTE9TRURcIiwgYFNvY2tldCBpcyBjbG9zZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfREdSQU1fSVNfQ09OTkVDVEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU09DS0VUX0RHUkFNX0lTX0NPTk5FQ1RFRFwiLCBgQWxyZWFkeSBjb25uZWN0ZWRgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TT0NLRVRfREdSQU1fTk9UX0NPTk5FQ1RFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NPQ0tFVF9ER1JBTV9OT1RfQ09OTkVDVEVEXCIsIGBOb3QgY29ubmVjdGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU09DS0VUX0RHUkFNX05PVF9SVU5OSU5HIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU09DS0VUX0RHUkFNX05PVF9SVU5OSU5HXCIsIGBOb3QgcnVubmluZ2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NSSV9QQVJTRSBleHRlbmRzIE5vZGVTeW50YXhFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgY2hhcjogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TUklfUEFSU0VcIixcbiAgICAgIGBTdWJyZXNvdXJjZSBJbnRlZ3JpdHkgc3RyaW5nICR7bmFtZX0gaGFkIGFuIHVuZXhwZWN0ZWQgJHtjaGFyfSBhdCBwb3NpdGlvbiAke3Bvc2l0aW9ufWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fQUxSRUFEWV9GSU5JU0hFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfU1RSRUFNX0FMUkVBRFlfRklOSVNIRURcIixcbiAgICAgIGBDYW5ub3QgY2FsbCAke3h9IGFmdGVyIGEgc3RyZWFtIHdhcyBmaW5pc2hlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fQ0FOTk9UX1BJUEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9TVFJFQU1fQ0FOTk9UX1BJUEVcIiwgYENhbm5vdCBwaXBlLCBub3QgcmVhZGFibGVgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fREVTVFJPWUVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TVFJFQU1fREVTVFJPWUVEXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgJHt4fSBhZnRlciBhIHN0cmVhbSB3YXMgZGVzdHJveWVkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NUUkVBTV9OVUxMX1ZBTFVFUyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9TVFJFQU1fTlVMTF9WQUxVRVNcIiwgYE1heSBub3Qgd3JpdGUgbnVsbCB2YWx1ZXMgdG8gc3RyZWFtYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU1RSRUFNX1BSRU1BVFVSRV9DTE9TRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NUUkVBTV9QUkVNQVRVUkVfQ0xPU0VcIiwgYFByZW1hdHVyZSBjbG9zZWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1NUUkVBTV9QVVNIX0FGVEVSX0VPRlwiLCBgc3RyZWFtLnB1c2goKSBhZnRlciBFT0ZgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fVU5TSElGVF9BRlRFUl9FTkRfRVZFTlQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1NUUkVBTV9VTlNISUZUX0FGVEVSX0VORF9FVkVOVFwiLFxuICAgICAgYHN0cmVhbS51bnNoaWZ0KCkgYWZ0ZXIgZW5kIGV2ZW50YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1NUUkVBTV9XUkFQIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9TVFJFQU1fV1JBUFwiLFxuICAgICAgYFN0cmVhbSBoYXMgU3RyaW5nRGVjb2RlciBzZXQgb3IgaXMgaW4gb2JqZWN0TW9kZWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9TVFJFQU1fV1JJVEVfQUZURVJfRU5EIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU1RSRUFNX1dSSVRFX0FGVEVSX0VORFwiLCBgd3JpdGUgYWZ0ZXIgZW5kYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfU1lOVEhFVElDIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfU1lOVEhFVElDXCIsIGBKYXZhU2NyaXB0IENhbGxzdGFja2ApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19DRVJUX0FMVE5BTUVfSU5WQUxJRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIHJlYXNvbjogc3RyaW5nO1xuICBob3N0OiBzdHJpbmc7XG4gIGNlcnQ6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihyZWFzb246IHN0cmluZywgaG9zdDogc3RyaW5nLCBjZXJ0OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19DRVJUX0FMVE5BTUVfSU5WQUxJRFwiLFxuICAgICAgYEhvc3RuYW1lL0lQIGRvZXMgbm90IG1hdGNoIGNlcnRpZmljYXRlJ3MgYWx0bmFtZXM6ICR7cmVhc29ufWAsXG4gICAgKTtcbiAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgICB0aGlzLmhvc3QgPSBob3N0O1xuICAgIHRoaXMuY2VydCA9IGNlcnQ7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0RIX1BBUkFNX1NJWkUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9UTFNfREhfUEFSQU1fU0laRVwiLCBgREggcGFyYW1ldGVyIHNpemUgJHt4fSBpcyBsZXNzIHRoYW4gMjA0OGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19IQU5EU0hBS0VfVElNRU9VVCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1RMU19IQU5EU0hBS0VfVElNRU9VVFwiLCBgVExTIGhhbmRzaGFrZSB0aW1lb3V0YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0lOVkFMSURfQ09OVEVYVCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9UTFNfSU5WQUxJRF9DT05URVhUXCIsIGAke3h9IG11c3QgYmUgYSBTZWN1cmVDb250ZXh0YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0lOVkFMSURfU1RBVEUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19JTlZBTElEX1NUQVRFXCIsXG4gICAgICBgVExTIHNvY2tldCBjb25uZWN0aW9uIG11c3QgYmUgc2VjdXJlbHkgZXN0YWJsaXNoZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX0lOVkFMSURfUFJPVE9DT0xfVkVSU0lPTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcihwcm90b2NvbDogc3RyaW5nLCB4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19JTlZBTElEX1BST1RPQ09MX1ZFUlNJT05cIixcbiAgICAgIGAke3Byb3RvY29sfSBpcyBub3QgYSB2YWxpZCAke3h9IFRMUyBwcm90b2NvbCB2ZXJzaW9uYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1RMU19QUk9UT0NPTF9WRVJTSU9OX0NPTkZMSUNUIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHByZXZQcm90b2NvbDogc3RyaW5nLCBwcm90b2NvbDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfUFJPVE9DT0xfVkVSU0lPTl9DT05GTElDVFwiLFxuICAgICAgYFRMUyBwcm90b2NvbCB2ZXJzaW9uICR7cHJldlByb3RvY29sfSBjb25mbGljdHMgd2l0aCBzZWN1cmVQcm90b2NvbCAke3Byb3RvY29sfWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UTFNfUkVORUdPVElBVElPTl9ESVNBQkxFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVExTX1JFTkVHT1RJQVRJT05fRElTQUJMRURcIixcbiAgICAgIGBUTFMgc2Vzc2lvbiByZW5lZ290aWF0aW9uIGRpc2FibGVkIGZvciB0aGlzIHNvY2tldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UTFNfUkVRVUlSRURfU0VSVkVSX05BTUUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1RMU19SRVFVSVJFRF9TRVJWRVJfTkFNRVwiLFxuICAgICAgYFwic2VydmVybmFtZVwiIGlzIHJlcXVpcmVkIHBhcmFtZXRlciBmb3IgU2VydmVyLmFkZENvbnRleHRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVExTX1NFU1NJT05fQVRUQUNLIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfU0VTU0lPTl9BVFRBQ0tcIixcbiAgICAgIGBUTFMgc2Vzc2lvbiByZW5lZ290aWF0aW9uIGF0dGFjayBkZXRlY3RlZGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UTFNfU05JX0ZST01fU0VSVkVSIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UTFNfU05JX0ZST01fU0VSVkVSXCIsXG4gICAgICBgQ2Fubm90IGlzc3VlIFNOSSBmcm9tIGEgVExTIHNlcnZlci1zaWRlIHNvY2tldGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9UUkFDRV9FVkVOVFNfQ0FURUdPUllfUkVRVUlSRUQgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9UUkFDRV9FVkVOVFNfQ0FURUdPUllfUkVRVUlSRURcIixcbiAgICAgIGBBdCBsZWFzdCBvbmUgY2F0ZWdvcnkgaXMgcmVxdWlyZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVFJBQ0VfRVZFTlRTX1VOQVZBSUxBQkxFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCJFUlJfVFJBQ0VfRVZFTlRTX1VOQVZBSUxBQkxFXCIsIGBUcmFjZSBldmVudHMgYXJlIHVuYXZhaWxhYmxlYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5BVkFJTEFCTEVfRFVSSU5HX0VYSVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOQVZBSUxBQkxFX0RVUklOR19FWElUXCIsXG4gICAgICBgQ2Fubm90IGNhbGwgZnVuY3Rpb24gaW4gcHJvY2VzcyBleGl0IGhhbmRsZXJgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5DQVVHSFRfRVhDRVBUSU9OX0NBUFRVUkVfQUxSRUFEWV9TRVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFX0FMUkVBRFlfU0VUXCIsXG4gICAgICBcImBwcm9jZXNzLnNldHVwVW5jYXVnaHRFeGNlcHRpb25DYXB0dXJlKClgIHdhcyBjYWxsZWQgd2hpbGUgYSBjYXB0dXJlIGNhbGxiYWNrIHdhcyBhbHJlYWR5IGFjdGl2ZVwiLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5FU0NBUEVEX0NIQVJBQ1RFUlMgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVU5FU0NBUEVEX0NIQVJBQ1RFUlNcIiwgYCR7eH0gY29udGFpbnMgdW5lc2NhcGVkIGNoYXJhY3RlcnNgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTkhBTkRMRURfRVJST1IgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9VTkhBTkRMRURfRVJST1JcIiwgYFVuaGFuZGxlZCBlcnJvci4gKCR7eH0pYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5LTk9XTl9CVUlMVElOX01PRFVMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX1VOS05PV05fQlVJTFRJTl9NT0RVTEVcIiwgYE5vIHN1Y2ggYnVpbHQtaW4gbW9kdWxlOiAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5LTk9XTl9DUkVERU5USUFMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9VTktOT1dOX0NSRURFTlRJQUxcIiwgYCR7eH0gaWRlbnRpZmllciBkb2VzIG5vdCBleGlzdDogJHt5fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VOS05PV05fRU5DT0RJTkcgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVU5LTk9XTl9FTkNPRElOR1wiLCBgVW5rbm93biBlbmNvZGluZzogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VOS05PV05fRklMRV9FWFRFTlNJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOS05PV05fRklMRV9FWFRFTlNJT05cIixcbiAgICAgIGBVbmtub3duIGZpbGUgZXh0ZW5zaW9uIFwiJHt4fVwiIGZvciAke3l9YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VOS05PV05fTU9EVUxFX0ZPUk1BVCBleHRlbmRzIE5vZGVSYW5nZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVU5LTk9XTl9NT0RVTEVfRk9STUFUXCIsIGBVbmtub3duIG1vZHVsZSBmb3JtYXQ6ICR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTktOT1dOX1NJR05BTCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcIkVSUl9VTktOT1dOX1NJR05BTFwiLCBgVW5rbm93biBzaWduYWw6ICR7eH1gKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9VTlNVUFBPUlRFRF9ESVJfSU1QT1JUIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nLCB5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOU1VQUE9SVEVEX0RJUl9JTVBPUlRcIixcbiAgICAgIGBEaXJlY3RvcnkgaW1wb3J0ICcke3h9JyBpcyBub3Qgc3VwcG9ydGVkIHJlc29sdmluZyBFUyBtb2R1bGVzLCBpbXBvcnRlZCBmcm9tICR7eX1gLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVU5TVVBQT1JURURfRVNNX1VSTF9TQ0hFTUUgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1VOU1VQUE9SVEVEX0VTTV9VUkxfU0NIRU1FXCIsXG4gICAgICBgT25seSBmaWxlIGFuZCBkYXRhIFVSTHMgYXJlIHN1cHBvcnRlZCBieSB0aGUgZGVmYXVsdCBFU00gbG9hZGVyYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1VTRV9BRlRFUl9DTE9TRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHg6IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVVNFX0FGVEVSX0NMT1NFXCIsXG4gICAgICBgJHt4fSB3YXMgY2xvc2VkYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1Y4QlJFQUtJVEVSQVRPUiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVjhCUkVBS0lURVJBVE9SXCIsXG4gICAgICBgRnVsbCBJQ1UgZGF0YSBub3QgaW5zdGFsbGVkLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL3dpa2kvSW50bGAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WQUxJRF9QRVJGT1JNQU5DRV9FTlRSWV9UWVBFIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WQUxJRF9QRVJGT1JNQU5DRV9FTlRSWV9UWVBFXCIsXG4gICAgICBgQXQgbGVhc3Qgb25lIHZhbGlkIHBlcmZvcm1hbmNlIGVudHJ5IHR5cGUgaXMgcmVxdWlyZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVk1fRFlOQU1JQ19JTVBPUlRfQ0FMTEJBQ0tfTUlTU0lORyBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1ZNX0RZTkFNSUNfSU1QT1JUX0NBTExCQUNLX01JU1NJTkdcIixcbiAgICAgIGBBIGR5bmFtaWMgaW1wb3J0IGNhbGxiYWNrIHdhcyBub3Qgc3BlY2lmaWVkLmAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WTV9NT0RVTEVfQUxSRUFEWV9MSU5LRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9WTV9NT0RVTEVfQUxSRUFEWV9MSU5LRURcIiwgYE1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGxpbmtlZGApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1ZNX01PRFVMRV9DQU5OT1RfQ1JFQVRFX0NBQ0hFRF9EQVRBIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WTV9NT0RVTEVfQ0FOTk9UX0NSRUFURV9DQUNIRURfREFUQVwiLFxuICAgICAgYENhY2hlZCBkYXRhIGNhbm5vdCBiZSBjcmVhdGVkIGZvciBhIG1vZHVsZSB3aGljaCBoYXMgYmVlbiBldmFsdWF0ZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfVk1fTU9EVUxFX0RJRkZFUkVOVF9DT05URVhUIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9WTV9NT0RVTEVfRElGRkVSRU5UX0NPTlRFWFRcIixcbiAgICAgIGBMaW5rZWQgbW9kdWxlcyBtdXN0IHVzZSB0aGUgc2FtZSBjb250ZXh0YCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1ZNX01PRFVMRV9MSU5LSU5HX0VSUk9SRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1ZNX01PRFVMRV9MSU5LSU5HX0VSUk9SRURcIixcbiAgICAgIGBMaW5raW5nIGhhcyBhbHJlYWR5IGZhaWxlZCBmb3IgdGhlIHByb3ZpZGVkIG1vZHVsZWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WTV9NT0RVTEVfTk9UX01PRFVMRSBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfVk1fTU9EVUxFX05PVF9NT0RVTEVcIixcbiAgICAgIGBQcm92aWRlZCBtb2R1bGUgaXMgbm90IGFuIGluc3RhbmNlIG9mIE1vZHVsZWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9WTV9NT0RVTEVfU1RBVFVTIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfVk1fTU9EVUxFX1NUQVRVU1wiLCBgTW9kdWxlIHN0YXR1cyAke3h9YCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV0FTSV9BTFJFQURZX1NUQVJURUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9XQVNJX0FMUkVBRFlfU1RBUlRFRFwiLCBgV0FTSSBpbnN0YW5jZSBoYXMgYWxyZWFkeSBzdGFydGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX0lOSVRfRkFJTEVEIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfV09SS0VSX0lOSVRfRkFJTEVEXCIsIGBXb3JrZXIgaW5pdGlhbGl6YXRpb24gZmFpbHVyZTogJHt4fWApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1dPUktFUl9OT1RfUlVOTklORyBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRVJSX1dPUktFUl9OT1RfUlVOTklOR1wiLCBgV29ya2VyIGluc3RhbmNlIG5vdCBydW5uaW5nYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX09VVF9PRl9NRU1PUlkgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9PVVRfT0ZfTUVNT1JZXCIsXG4gICAgICBgV29ya2VyIHRlcm1pbmF0ZWQgZHVlIHRvIHJlYWNoaW5nIG1lbW9yeSBsaW1pdDogJHt4fWAsXG4gICAgKTtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9XT1JLRVJfVU5TRVJJQUxJWkFCTEVfRVJST1IgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9VTlNFUklBTElaQUJMRV9FUlJPUlwiLFxuICAgICAgYFNlcmlhbGl6aW5nIGFuIHVuY2F1Z2h0IGV4Y2VwdGlvbiBmYWlsZWRgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfV09SS0VSX1VOU1VQUE9SVEVEX0VYVEVOU0lPTiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih4OiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9FWFRFTlNJT05cIixcbiAgICAgIGBUaGUgd29ya2VyIHNjcmlwdCBleHRlbnNpb24gbXVzdCBiZSBcIi5qc1wiLCBcIi5tanNcIiwgb3IgXCIuY2pzXCIuIFJlY2VpdmVkIFwiJHt4fVwiYCxcbiAgICApO1xuICB9XG59XG5leHBvcnQgY2xhc3MgRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9PUEVSQVRJT04gZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoeDogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9XT1JLRVJfVU5TVVBQT1JURURfT1BFUkFUSU9OXCIsXG4gICAgICBgJHt4fSBpcyBub3Qgc3VwcG9ydGVkIGluIHdvcmtlcnNgLFxuICAgICk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfWkxJQl9JTklUSUFMSVpBVElPTl9GQUlMRUQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIkVSUl9aTElCX0lOSVRJQUxJWkFUSU9OX0ZBSUxFRFwiLCBgSW5pdGlhbGl6YXRpb24gZmFpbGVkYCk7XG4gIH1cbn1cbmV4cG9ydCBjbGFzcyBFUlJfRkFMU1lfVkFMVUVfUkVKRUNUSU9OIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIGNvbnN0cnVjdG9yKHJlYXNvbjogc3RyaW5nKSB7XG4gICAgc3VwZXIoXCJFUlJfRkFMU1lfVkFMVUVfUkVKRUNUSU9OXCIsIFwiUHJvbWlzZSB3YXMgcmVqZWN0ZWQgd2l0aCBmYWxzeSB2YWx1ZVwiKTtcbiAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9JTlZBTElEX1NFVFRJTkdfVkFMVUUgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGFjdHVhbDogdW5rbm93bjtcbiAgbWluPzogbnVtYmVyO1xuICBtYXg/OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhY3R1YWw6IHVua25vd24sIG1pbj86IG51bWJlciwgbWF4PzogbnVtYmVyKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9JTlZBTElEX1NFVFRJTkdfVkFMVUVcIixcbiAgICAgIGBJbnZhbGlkIHZhbHVlIGZvciBzZXR0aW5nIFwiJHtuYW1lfVwiOiAke2FjdHVhbH1gLFxuICAgICk7XG4gICAgdGhpcy5hY3R1YWwgPSBhY3R1YWw7XG4gICAgaWYgKG1pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1pbiA9IG1pbjtcbiAgICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIH1cbiAgfVxufVxuZXhwb3J0IGNsYXNzIEVSUl9IVFRQMl9TVFJFQU1fQ0FOQ0VMIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgb3ZlcnJpZGUgY2F1c2U/OiBFcnJvcjtcbiAgY29uc3RydWN0b3IoZXJyb3I6IEVycm9yKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9IVFRQMl9TVFJFQU1fQ0FOQ0VMXCIsXG4gICAgICB0eXBlb2YgZXJyb3IubWVzc2FnZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IGBUaGUgcGVuZGluZyBzdHJlYW0gaGFzIGJlZW4gY2FuY2VsZWQgKGNhdXNlZCBieTogJHtlcnJvci5tZXNzYWdlfSlgXG4gICAgICAgIDogXCJUaGUgcGVuZGluZyBzdHJlYW0gaGFzIGJlZW4gY2FuY2VsZWRcIixcbiAgICApO1xuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhpcy5jYXVzZSA9IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfQUREUkVTU19GQU1JTFkgZXh0ZW5kcyBOb2RlUmFuZ2VFcnJvciB7XG4gIGhvc3Q6IHN0cmluZztcbiAgcG9ydDogbnVtYmVyO1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzVHlwZTogc3RyaW5nLCBob3N0OiBzdHJpbmcsIHBvcnQ6IG51bWJlcikge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9BRERSRVNTX0ZBTUlMWVwiLFxuICAgICAgYEludmFsaWQgYWRkcmVzcyBmYW1pbHk6ICR7YWRkcmVzc1R5cGV9ICR7aG9zdH06JHtwb3J0fWAsXG4gICAgKTtcbiAgICB0aGlzLmhvc3QgPSBob3N0O1xuICAgIHRoaXMucG9ydCA9IHBvcnQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX0NIQVIgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBmaWVsZD86IHN0cmluZykge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9DSEFSXCIsXG4gICAgICBmaWVsZFxuICAgICAgICA/IGBJbnZhbGlkIGNoYXJhY3RlciBpbiAke25hbWV9YFxuICAgICAgICA6IGBJbnZhbGlkIGNoYXJhY3RlciBpbiAke25hbWV9IFtcIiR7ZmllbGR9XCJdYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9PUFRfVkFMVUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bikge1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5WQUxJRF9PUFRfVkFMVUVcIixcbiAgICAgIGBUaGUgdmFsdWUgXCIke3ZhbHVlfVwiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcIiR7bmFtZX1cImAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGlucHV0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX1JFVFVSTl9QUk9QRVJUWVwiLFxuICAgICAgYEV4cGVjdGVkIGEgdmFsaWQgJHtpbnB1dH0gdG8gYmUgcmV0dXJuZWQgZm9yIHRoZSBcIiR7cHJvcH1cIiBmcm9tIHRoZSBcIiR7bmFtZX1cIiBmdW5jdGlvbiBidXQgZ290ICR7dmFsdWV9LmAsXG4gICAgKTtcbiAgfVxufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuZnVuY3Rpb24gYnVpbGRSZXR1cm5Qcm9wZXJ0eVR5cGUodmFsdWU6IGFueSkge1xuICBpZiAodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IubmFtZSkge1xuICAgIHJldHVybiBgaW5zdGFuY2Ugb2YgJHt2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGB0eXBlICR7dHlwZW9mIHZhbHVlfWA7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1JFVFVSTl9QUk9QRVJUWV9WQUxVRSBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihpbnB1dDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHByb3A6IHN0cmluZywgdmFsdWU6IHVua25vd24pIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZX1ZBTFVFXCIsXG4gICAgICBgRXhwZWN0ZWQgJHtpbnB1dH0gdG8gYmUgcmV0dXJuZWQgZm9yIHRoZSBcIiR7cHJvcH1cIiBmcm9tIHRoZSBcIiR7bmFtZX1cIiBmdW5jdGlvbiBidXQgZ290ICR7XG4gICAgICAgIGJ1aWxkUmV0dXJuUHJvcGVydHlUeXBlKFxuICAgICAgICAgIHZhbHVlLFxuICAgICAgICApXG4gICAgICB9LmAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUkVUVVJOX1ZBTFVFIGV4dGVuZHMgTm9kZVR5cGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKGlucHV0OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdmFsdWU6IHVua25vd24pIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX0lOVkFMSURfUkVUVVJOX1ZBTFVFXCIsXG4gICAgICBgRXhwZWN0ZWQgJHtpbnB1dH0gdG8gYmUgcmV0dXJuZWQgZnJvbSB0aGUgXCIke25hbWV9XCIgZnVuY3Rpb24gYnV0IGdvdCAke1xuICAgICAgICBkZXRlcm1pbmVTcGVjaWZpY1R5cGUoXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIClcbiAgICAgIH0uYCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfSU5WQUxJRF9VUkwgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgaW5wdXQ6IHN0cmluZztcbiAgY29uc3RydWN0b3IoaW5wdXQ6IHN0cmluZykge1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfVVJMXCIsIGBJbnZhbGlkIFVSTDogJHtpbnB1dH1gKTtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1VSTF9TQ0hFTUUgZXh0ZW5kcyBOb2RlVHlwZUVycm9yIHtcbiAgY29uc3RydWN0b3IoZXhwZWN0ZWQ6IHN0cmluZyB8IFtzdHJpbmddIHwgW3N0cmluZywgc3RyaW5nXSkge1xuICAgIGV4cGVjdGVkID0gQXJyYXkuaXNBcnJheShleHBlY3RlZCkgPyBleHBlY3RlZCA6IFtleHBlY3RlZF07XG4gICAgY29uc3QgcmVzID0gZXhwZWN0ZWQubGVuZ3RoID09PSAyXG4gICAgICA/IGBvbmUgb2Ygc2NoZW1lICR7ZXhwZWN0ZWRbMF19IG9yICR7ZXhwZWN0ZWRbMV19YFxuICAgICAgOiBgb2Ygc2NoZW1lICR7ZXhwZWN0ZWRbMF19YDtcbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1VSTF9TQ0hFTUVcIiwgYFRoZSBVUkwgbXVzdCBiZSAke3Jlc31gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX01PRFVMRV9OT1RfRk9VTkQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwYXRoOiBzdHJpbmcsIGJhc2U6IHN0cmluZywgdHlwZTogc3RyaW5nID0gXCJwYWNrYWdlXCIpIHtcbiAgICBzdXBlcihcbiAgICAgIFwiRVJSX01PRFVMRV9OT1RfRk9VTkRcIixcbiAgICAgIGBDYW5ub3QgZmluZCAke3R5cGV9ICcke3BhdGh9JyBpbXBvcnRlZCBmcm9tICR7YmFzZX1gLFxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9JTlZBTElEX1BBQ0tBR0VfQ09ORklHIGV4dGVuZHMgTm9kZUVycm9yIHtcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nLCBiYXNlPzogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKSB7XG4gICAgY29uc3QgbXNnID0gYEludmFsaWQgcGFja2FnZSBjb25maWcgJHtwYXRofSR7XG4gICAgICBiYXNlID8gYCB3aGlsZSBpbXBvcnRpbmcgJHtiYXNlfWAgOiBcIlwiXG4gICAgfSR7bWVzc2FnZSA/IGAuICR7bWVzc2FnZX1gIDogXCJcIn1gO1xuICAgIHN1cGVyKFwiRVJSX0lOVkFMSURfUEFDS0FHRV9DT05GSUdcIiwgbXNnKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfTU9EVUxFX1NQRUNJRklFUiBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZXF1ZXN0OiBzdHJpbmcsIHJlYXNvbjogc3RyaW5nLCBiYXNlPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBcIkVSUl9JTlZBTElEX01PRFVMRV9TUEVDSUZJRVJcIixcbiAgICAgIGBJbnZhbGlkIG1vZHVsZSBcIiR7cmVxdWVzdH1cIiAke3JlYXNvbn0ke1xuICAgICAgICBiYXNlID8gYCBpbXBvcnRlZCBmcm9tICR7YmFzZX1gIDogXCJcIlxuICAgICAgfWAsXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVkFMSURfUEFDS0FHRV9UQVJHRVQgZXh0ZW5kcyBOb2RlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwa2dQYXRoOiBzdHJpbmcsXG4gICAga2V5OiBzdHJpbmcsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB0YXJnZXQ6IGFueSxcbiAgICBpc0ltcG9ydD86IGJvb2xlYW4sXG4gICAgYmFzZT86IHN0cmluZyxcbiAgKSB7XG4gICAgbGV0IG1zZzogc3RyaW5nO1xuICAgIGNvbnN0IHJlbEVycm9yID0gdHlwZW9mIHRhcmdldCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgIWlzSW1wb3J0ICYmXG4gICAgICB0YXJnZXQubGVuZ3RoICYmXG4gICAgICAhdGFyZ2V0LnN0YXJ0c1dpdGgoXCIuL1wiKTtcbiAgICBpZiAoa2V5ID09PSBcIi5cIikge1xuICAgICAgYXNzZXJ0KGlzSW1wb3J0ID09PSBmYWxzZSk7XG4gICAgICBtc2cgPSBgSW52YWxpZCBcImV4cG9ydHNcIiBtYWluIHRhcmdldCAke0pTT04uc3RyaW5naWZ5KHRhcmdldCl9IGRlZmluZWQgYCArXG4gICAgICAgIGBpbiB0aGUgcGFja2FnZSBjb25maWcgJHtwa2dQYXRofXBhY2thZ2UuanNvbiR7XG4gICAgICAgICAgYmFzZSA/IGAgaW1wb3J0ZWQgZnJvbSAke2Jhc2V9YCA6IFwiXCJcbiAgICAgICAgfSR7cmVsRXJyb3IgPyAnOyB0YXJnZXRzIG11c3Qgc3RhcnQgd2l0aCBcIi4vXCInIDogXCJcIn1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBtc2cgPSBgSW52YWxpZCBcIiR7aXNJbXBvcnQgPyBcImltcG9ydHNcIiA6IFwiZXhwb3J0c1wifVwiIHRhcmdldCAke1xuICAgICAgICBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICB0YXJnZXQsXG4gICAgICAgIClcbiAgICAgIH0gZGVmaW5lZCBmb3IgJyR7a2V5fScgaW4gdGhlIHBhY2thZ2UgY29uZmlnICR7cGtnUGF0aH1wYWNrYWdlLmpzb24ke1xuICAgICAgICBiYXNlID8gYCBpbXBvcnRlZCBmcm9tICR7YmFzZX1gIDogXCJcIlxuICAgICAgfSR7cmVsRXJyb3IgPyAnOyB0YXJnZXRzIG11c3Qgc3RhcnQgd2l0aCBcIi4vXCInIDogXCJcIn1gO1xuICAgIH1cbiAgICBzdXBlcihcIkVSUl9JTlZBTElEX1BBQ0tBR0VfVEFSR0VUXCIsIG1zZyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVSUl9QQUNLQUdFX0lNUE9SVF9OT1RfREVGSU5FRCBleHRlbmRzIE5vZGVUeXBlRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBzcGVjaWZpZXI6IHN0cmluZyxcbiAgICBwYWNrYWdlUGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIGJhc2U6IHN0cmluZyxcbiAgKSB7XG4gICAgY29uc3QgbXNnID0gYFBhY2thZ2UgaW1wb3J0IHNwZWNpZmllciBcIiR7c3BlY2lmaWVyfVwiIGlzIG5vdCBkZWZpbmVkJHtcbiAgICAgIHBhY2thZ2VQYXRoID8gYCBpbiBwYWNrYWdlICR7cGFja2FnZVBhdGh9cGFja2FnZS5qc29uYCA6IFwiXCJcbiAgICB9IGltcG9ydGVkIGZyb20gJHtiYXNlfWA7XG5cbiAgICBzdXBlcihcIkVSUl9QQUNLQUdFX0lNUE9SVF9OT1RfREVGSU5FRFwiLCBtc2cpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFUlJfUEFDS0FHRV9QQVRIX05PVF9FWFBPUlRFRCBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHN1YnBhdGg6IHN0cmluZywgcGtnUGF0aDogc3RyaW5nLCBiYXNlUGF0aD86IHN0cmluZykge1xuICAgIGxldCBtc2c6IHN0cmluZztcbiAgICBpZiAoc3VicGF0aCA9PT0gXCIuXCIpIHtcbiAgICAgIG1zZyA9IGBObyBcImV4cG9ydHNcIiBtYWluIGRlZmluZWQgaW4gJHtwa2dQYXRofXBhY2thZ2UuanNvbiR7XG4gICAgICAgIGJhc2VQYXRoID8gYCBpbXBvcnRlZCBmcm9tICR7YmFzZVBhdGh9YCA6IFwiXCJcbiAgICAgIH1gO1xuICAgIH0gZWxzZSB7XG4gICAgICBtc2cgPVxuICAgICAgICBgUGFja2FnZSBzdWJwYXRoICcke3N1YnBhdGh9JyBpcyBub3QgZGVmaW5lZCBieSBcImV4cG9ydHNcIiBpbiAke3BrZ1BhdGh9cGFja2FnZS5qc29uJHtcbiAgICAgICAgICBiYXNlUGF0aCA/IGAgaW1wb3J0ZWQgZnJvbSAke2Jhc2VQYXRofWAgOiBcIlwiXG4gICAgICAgIH1gO1xuICAgIH1cblxuICAgIHN1cGVyKFwiRVJSX1BBQ0tBR0VfUEFUSF9OT1RfRVhQT1JURURcIiwgbXNnKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVJSX0lOVEVSTkFMX0FTU0VSVElPTiBleHRlbmRzIE5vZGVFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U/OiBzdHJpbmcpIHtcbiAgICBjb25zdCBzdWZmaXggPSBcIlRoaXMgaXMgY2F1c2VkIGJ5IGVpdGhlciBhIGJ1ZyBpbiBOb2RlLmpzIFwiICtcbiAgICAgIFwib3IgaW5jb3JyZWN0IHVzYWdlIG9mIE5vZGUuanMgaW50ZXJuYWxzLlxcblwiICtcbiAgICAgIFwiUGxlYXNlIG9wZW4gYW4gaXNzdWUgd2l0aCB0aGlzIHN0YWNrIHRyYWNlIGF0IFwiICtcbiAgICAgIFwiaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2lzc3Vlc1xcblwiO1xuICAgIHN1cGVyKFxuICAgICAgXCJFUlJfSU5URVJOQUxfQVNTRVJUSU9OXCIsXG4gICAgICBtZXNzYWdlID09PSB1bmRlZmluZWQgPyBzdWZmaXggOiBgJHttZXNzYWdlfVxcbiR7c3VmZml4fWAsXG4gICAgKTtcbiAgfVxufVxuXG4vLyBVc2luZyBgZnMucm1kaXJgIG9uIGEgcGF0aCB0aGF0IGlzIGEgZmlsZSByZXN1bHRzIGluIGFuIEVOT0VOVCBlcnJvciBvbiBXaW5kb3dzIGFuZCBhbiBFTk9URElSIGVycm9yIG9uIFBPU0lYLlxuZXhwb3J0IGNsYXNzIEVSUl9GU19STURJUl9FTk9URElSIGV4dGVuZHMgTm9kZVN5c3RlbUVycm9yIHtcbiAgY29uc3RydWN0b3IocGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgY29kZSA9IGlzV2luZG93cyA/IFwiRU5PRU5UXCIgOiBcIkVOT1RESVJcIjtcbiAgICBjb25zdCBjdHg6IE5vZGVTeXN0ZW1FcnJvckN0eCA9IHtcbiAgICAgIG1lc3NhZ2U6IFwibm90IGEgZGlyZWN0b3J5XCIsXG4gICAgICBwYXRoLFxuICAgICAgc3lzY2FsbDogXCJybWRpclwiLFxuICAgICAgY29kZSxcbiAgICAgIGVycm5vOiBpc1dpbmRvd3MgPyBFTk9FTlQgOiBFTk9URElSLFxuICAgIH07XG4gICAgc3VwZXIoY29kZSwgY3R4LCBcIlBhdGggaXMgbm90IGEgZGlyZWN0b3J5XCIpO1xuICB9XG59XG5cbmludGVyZmFjZSBVdkV4Y2VwdGlvbkNvbnRleHQge1xuICBzeXNjYWxsOiBzdHJpbmc7XG4gIHBhdGg/OiBzdHJpbmc7XG59XG5leHBvcnQgZnVuY3Rpb24gZGVub0Vycm9yVG9Ob2RlRXJyb3IoZTogRXJyb3IsIGN0eDogVXZFeGNlcHRpb25Db250ZXh0KSB7XG4gIGNvbnN0IGVycm5vID0gZXh0cmFjdE9zRXJyb3JOdW1iZXJGcm9tRXJyb3JNZXNzYWdlKGUpO1xuICBpZiAodHlwZW9mIGVycm5vID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgcmV0dXJuIGU7XG4gIH1cblxuICBjb25zdCBleCA9IHV2RXhjZXB0aW9uKHtcbiAgICBlcnJubzogbWFwU3lzRXJybm9Ub1V2RXJybm8oZXJybm8pLFxuICAgIC4uLmN0eCxcbiAgfSk7XG4gIHJldHVybiBleDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdE9zRXJyb3JOdW1iZXJGcm9tRXJyb3JNZXNzYWdlKGU6IHVua25vd24pOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICBjb25zdCBtYXRjaCA9IGUgaW5zdGFuY2VvZiBFcnJvclxuICAgID8gZS5tZXNzYWdlLm1hdGNoKC9cXChvcyBlcnJvciAoXFxkKylcXCkvKVxuICAgIDogZmFsc2U7XG5cbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuICttYXRjaFsxXTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25uUmVzZXRFeGNlcHRpb24obXNnOiBzdHJpbmcpIHtcbiAgY29uc3QgZXggPSBuZXcgRXJyb3IobXNnKTtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgKGV4IGFzIGFueSkuY29kZSA9IFwiRUNPTk5SRVNFVFwiO1xuICByZXR1cm4gZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZ2dyZWdhdGVUd29FcnJvcnMoXG4gIGlubmVyRXJyb3I6IEFnZ3JlZ2F0ZUVycm9yLFxuICBvdXRlckVycm9yOiBBZ2dyZWdhdGVFcnJvciAmIHsgY29kZTogc3RyaW5nIH0sXG4pIHtcbiAgaWYgKGlubmVyRXJyb3IgJiYgb3V0ZXJFcnJvciAmJiBpbm5lckVycm9yICE9PSBvdXRlckVycm9yKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3V0ZXJFcnJvci5lcnJvcnMpKSB7XG4gICAgICAvLyBJZiBgb3V0ZXJFcnJvcmAgaXMgYWxyZWFkeSBhbiBgQWdncmVnYXRlRXJyb3JgLlxuICAgICAgb3V0ZXJFcnJvci5lcnJvcnMucHVzaChpbm5lckVycm9yKTtcbiAgICAgIHJldHVybiBvdXRlckVycm9yO1xuICAgIH1cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXhcbiAgICBjb25zdCBlcnIgPSBuZXcgQWdncmVnYXRlRXJyb3IoXG4gICAgICBbXG4gICAgICAgIG91dGVyRXJyb3IsXG4gICAgICAgIGlubmVyRXJyb3IsXG4gICAgICBdLFxuICAgICAgb3V0ZXJFcnJvci5tZXNzYWdlLFxuICAgICk7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAoZXJyIGFzIGFueSkuY29kZSA9IG91dGVyRXJyb3IuY29kZTtcbiAgICByZXR1cm4gZXJyO1xuICB9XG4gIHJldHVybiBpbm5lckVycm9yIHx8IG91dGVyRXJyb3I7XG59XG5jb2Rlcy5FUlJfSVBDX0NIQU5ORUxfQ0xPU0VEID0gRVJSX0lQQ19DSEFOTkVMX0NMT1NFRDtcbmNvZGVzLkVSUl9JTlZBTElEX0FSR19UWVBFID0gRVJSX0lOVkFMSURfQVJHX1RZUEU7XG5jb2Rlcy5FUlJfSU5WQUxJRF9BUkdfVkFMVUUgPSBFUlJfSU5WQUxJRF9BUkdfVkFMVUU7XG5jb2Rlcy5FUlJfT1VUX09GX1JBTkdFID0gRVJSX09VVF9PRl9SQU5HRTtcbmNvZGVzLkVSUl9TT0NLRVRfQkFEX1BPUlQgPSBFUlJfU09DS0VUX0JBRF9QT1JUO1xuY29kZXMuRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTID0gRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTO1xuY29kZXMuRVJSX1VOS05PV05fRU5DT0RJTkcgPSBFUlJfVU5LTk9XTl9FTkNPRElORztcbi8vIFRPRE8oa3Qzayk6IGFzc2lnbiBhbGwgZXJyb3IgY2xhc3NlcyBoZXJlLlxuXG4vKipcbiAqIFRoaXMgY3JlYXRlcyBhIGdlbmVyaWMgTm9kZS5qcyBlcnJvci5cbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgZXJyb3IgbWVzc2FnZS5cbiAqIEBwYXJhbSBlcnJvclByb3BlcnRpZXMgT2JqZWN0IHdpdGggYWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIGJlIGFkZGVkIHRvIHRoZSBlcnJvci5cbiAqIEByZXR1cm5zXG4gKi9cbmNvbnN0IGdlbmVyaWNOb2RlRXJyb3IgPSBoaWRlU3RhY2tGcmFtZXMoXG4gIGZ1bmN0aW9uIGdlbmVyaWNOb2RlRXJyb3IobWVzc2FnZSwgZXJyb3JQcm9wZXJ0aWVzKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XG4gICAgY29uc3QgZXJyID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIE9iamVjdC5hc3NpZ24oZXJyLCBlcnJvclByb3BlcnRpZXMpO1xuXG4gICAgcmV0dXJuIGVycjtcbiAgfSxcbik7XG5cbi8qKlxuICogRGV0ZXJtaW5lIHRoZSBzcGVjaWZpYyB0eXBlIG9mIGEgdmFsdWUgZm9yIHR5cGUtbWlzbWF0Y2ggZXJyb3JzLlxuICogQHBhcmFtIHsqfSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmZ1bmN0aW9uIGRldGVybWluZVNwZWNpZmljVHlwZSh2YWx1ZTogYW55KSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIFwiXCIgKyB2YWx1ZTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgJiYgdmFsdWUubmFtZSkge1xuICAgIHJldHVybiBgZnVuY3Rpb24gJHt2YWx1ZS5uYW1lfWA7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmICh2YWx1ZS5jb25zdHJ1Y3Rvcj8ubmFtZSkge1xuICAgICAgcmV0dXJuIGBhbiBpbnN0YW5jZSBvZiAke3ZhbHVlLmNvbnN0cnVjdG9yLm5hbWV9YDtcbiAgICB9XG4gICAgcmV0dXJuIGAke2luc3BlY3QodmFsdWUsIHsgZGVwdGg6IC0xIH0pfWA7XG4gIH1cbiAgbGV0IGluc3BlY3RlZCA9IGluc3BlY3QodmFsdWUsIHsgY29sb3JzOiBmYWxzZSB9KTtcbiAgaWYgKGluc3BlY3RlZC5sZW5ndGggPiAyOCkgaW5zcGVjdGVkID0gYCR7aW5zcGVjdGVkLnNsaWNlKDAsIDI1KX0uLi5gO1xuXG4gIHJldHVybiBgdHlwZSAke3R5cGVvZiB2YWx1ZX0gKCR7aW5zcGVjdGVkfSlgO1xufVxuXG5leHBvcnQgeyBjb2RlcywgZ2VuZXJpY05vZGVFcnJvciwgaGlkZVN0YWNrRnJhbWVzIH07XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgQWJvcnRFcnJvcixcbiAgRVJSX0FNQklHVU9VU19BUkdVTUVOVCxcbiAgRVJSX0FSR19OT1RfSVRFUkFCTEUsXG4gIEVSUl9BU1NFUlRJT04sXG4gIEVSUl9BU1lOQ19DQUxMQkFDSyxcbiAgRVJSX0FTWU5DX1RZUEUsXG4gIEVSUl9CUk9UTElfSU5WQUxJRF9QQVJBTSxcbiAgRVJSX0JVRkZFUl9PVVRfT0ZfQk9VTkRTLFxuICBFUlJfQlVGRkVSX1RPT19MQVJHRSxcbiAgRVJSX0NBTk5PVF9XQVRDSF9TSUdJTlQsXG4gIEVSUl9DSElMRF9DTE9TRURfQkVGT1JFX1JFUExZLFxuICBFUlJfQ0hJTERfUFJPQ0VTU19JUENfUkVRVUlSRUQsXG4gIEVSUl9DSElMRF9QUk9DRVNTX1NURElPX01BWEJVRkZFUixcbiAgRVJSX0NPTlNPTEVfV1JJVEFCTEVfU1RSRUFNLFxuICBFUlJfQ09OVEVYVF9OT1RfSU5JVElBTElaRUQsXG4gIEVSUl9DUFVfVVNBR0UsXG4gIEVSUl9DUllQVE9fQ1VTVE9NX0VOR0lORV9OT1RfU1VQUE9SVEVELFxuICBFUlJfQ1JZUFRPX0VDREhfSU5WQUxJRF9GT1JNQVQsXG4gIEVSUl9DUllQVE9fRUNESF9JTlZBTElEX1BVQkxJQ19LRVksXG4gIEVSUl9DUllQVE9fRU5HSU5FX1VOS05PV04sXG4gIEVSUl9DUllQVE9fRklQU19GT1JDRUQsXG4gIEVSUl9DUllQVE9fRklQU19VTkFWQUlMQUJMRSxcbiAgRVJSX0NSWVBUT19IQVNIX0ZJTkFMSVpFRCxcbiAgRVJSX0NSWVBUT19IQVNIX1VQREFURV9GQUlMRUQsXG4gIEVSUl9DUllQVE9fSU5DT01QQVRJQkxFX0tFWSxcbiAgRVJSX0NSWVBUT19JTkNPTVBBVElCTEVfS0VZX09QVElPTlMsXG4gIEVSUl9DUllQVE9fSU5WQUxJRF9ESUdFU1QsXG4gIEVSUl9DUllQVE9fSU5WQUxJRF9LRVlfT0JKRUNUX1RZUEUsXG4gIEVSUl9DUllQVE9fSU5WQUxJRF9TVEFURSxcbiAgRVJSX0NSWVBUT19QQktERjJfRVJST1IsXG4gIEVSUl9DUllQVE9fU0NSWVBUX0lOVkFMSURfUEFSQU1FVEVSLFxuICBFUlJfQ1JZUFRPX1NDUllQVF9OT1RfU1VQUE9SVEVELFxuICBFUlJfQ1JZUFRPX1NJR05fS0VZX1JFUVVJUkVELFxuICBFUlJfRElSX0NMT1NFRCxcbiAgRVJSX0RJUl9DT05DVVJSRU5UX09QRVJBVElPTixcbiAgRVJSX0ROU19TRVRfU0VSVkVSU19GQUlMRUQsXG4gIEVSUl9ET01BSU5fQ0FMTEJBQ0tfTk9UX0FWQUlMQUJMRSxcbiAgRVJSX0RPTUFJTl9DQU5OT1RfU0VUX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFLFxuICBFUlJfRU5DT0RJTkdfSU5WQUxJRF9FTkNPREVEX0RBVEEsXG4gIEVSUl9FTkNPRElOR19OT1RfU1VQUE9SVEVELFxuICBFUlJfRVZBTF9FU01fQ0FOTk9UX1BSSU5ULFxuICBFUlJfRVZFTlRfUkVDVVJTSU9OLFxuICBFUlJfRkFMU1lfVkFMVUVfUkVKRUNUSU9OLFxuICBFUlJfRkVBVFVSRV9VTkFWQUlMQUJMRV9PTl9QTEFURk9STSxcbiAgRVJSX0ZTX0VJU0RJUixcbiAgRVJSX0ZTX0ZJTEVfVE9PX0xBUkdFLFxuICBFUlJfRlNfSU5WQUxJRF9TWU1MSU5LX1RZUEUsXG4gIEVSUl9GU19STURJUl9FTk9URElSLFxuICBFUlJfSFRUUDJfQUxUU1ZDX0lOVkFMSURfT1JJR0lOLFxuICBFUlJfSFRUUDJfQUxUU1ZDX0xFTkdUSCxcbiAgRVJSX0hUVFAyX0NPTk5FQ1RfQVVUSE9SSVRZLFxuICBFUlJfSFRUUDJfQ09OTkVDVF9QQVRILFxuICBFUlJfSFRUUDJfQ09OTkVDVF9TQ0hFTUUsXG4gIEVSUl9IVFRQMl9HT0FXQVlfU0VTU0lPTixcbiAgRVJSX0hUVFAyX0hFQURFUlNfQUZURVJfUkVTUE9ORCxcbiAgRVJSX0hUVFAyX0hFQURFUlNfU0VOVCxcbiAgRVJSX0hUVFAyX0hFQURFUl9TSU5HTEVfVkFMVUUsXG4gIEVSUl9IVFRQMl9JTkZPX1NUQVRVU19OT1RfQUxMT1dFRCxcbiAgRVJSX0hUVFAyX0lOVkFMSURfQ09OTkVDVElPTl9IRUFERVJTLFxuICBFUlJfSFRUUDJfSU5WQUxJRF9IRUFERVJfVkFMVUUsXG4gIEVSUl9IVFRQMl9JTlZBTElEX0lORk9fU1RBVFVTLFxuICBFUlJfSFRUUDJfSU5WQUxJRF9PUklHSU4sXG4gIEVSUl9IVFRQMl9JTlZBTElEX1BBQ0tFRF9TRVRUSU5HU19MRU5HVEgsXG4gIEVSUl9IVFRQMl9JTlZBTElEX1BTRVVET0hFQURFUixcbiAgRVJSX0hUVFAyX0lOVkFMSURfU0VTU0lPTixcbiAgRVJSX0hUVFAyX0lOVkFMSURfU0VUVElOR19WQUxVRSxcbiAgRVJSX0hUVFAyX0lOVkFMSURfU1RSRUFNLFxuICBFUlJfSFRUUDJfTUFYX1BFTkRJTkdfU0VUVElOR1NfQUNLLFxuICBFUlJfSFRUUDJfTkVTVEVEX1BVU0gsXG4gIEVSUl9IVFRQMl9OT19TT0NLRVRfTUFOSVBVTEFUSU9OLFxuICBFUlJfSFRUUDJfT1JJR0lOX0xFTkdUSCxcbiAgRVJSX0hUVFAyX09VVF9PRl9TVFJFQU1TLFxuICBFUlJfSFRUUDJfUEFZTE9BRF9GT1JCSURERU4sXG4gIEVSUl9IVFRQMl9QSU5HX0NBTkNFTCxcbiAgRVJSX0hUVFAyX1BJTkdfTEVOR1RILFxuICBFUlJfSFRUUDJfUFNFVURPSEVBREVSX05PVF9BTExPV0VELFxuICBFUlJfSFRUUDJfUFVTSF9ESVNBQkxFRCxcbiAgRVJSX0hUVFAyX1NFTkRfRklMRSxcbiAgRVJSX0hUVFAyX1NFTkRfRklMRV9OT1NFRUssXG4gIEVSUl9IVFRQMl9TRVNTSU9OX0VSUk9SLFxuICBFUlJfSFRUUDJfU0VUVElOR1NfQ0FOQ0VMLFxuICBFUlJfSFRUUDJfU09DS0VUX0JPVU5ELFxuICBFUlJfSFRUUDJfU09DS0VUX1VOQk9VTkQsXG4gIEVSUl9IVFRQMl9TVEFUVVNfMTAxLFxuICBFUlJfSFRUUDJfU1RBVFVTX0lOVkFMSUQsXG4gIEVSUl9IVFRQMl9TVFJFQU1fQ0FOQ0VMLFxuICBFUlJfSFRUUDJfU1RSRUFNX0VSUk9SLFxuICBFUlJfSFRUUDJfU1RSRUFNX1NFTEZfREVQRU5ERU5DWSxcbiAgRVJSX0hUVFAyX1RSQUlMRVJTX0FMUkVBRFlfU0VOVCxcbiAgRVJSX0hUVFAyX1RSQUlMRVJTX05PVF9SRUFEWSxcbiAgRVJSX0hUVFAyX1VOU1VQUE9SVEVEX1BST1RPQ09MLFxuICBFUlJfSFRUUF9IRUFERVJTX1NFTlQsXG4gIEVSUl9IVFRQX0lOVkFMSURfSEVBREVSX1ZBTFVFLFxuICBFUlJfSFRUUF9JTlZBTElEX1NUQVRVU19DT0RFLFxuICBFUlJfSFRUUF9TT0NLRVRfRU5DT0RJTkcsXG4gIEVSUl9IVFRQX1RSQUlMRVJfSU5WQUxJRCxcbiAgRVJSX0lOQ09NUEFUSUJMRV9PUFRJT05fUEFJUixcbiAgRVJSX0lOUFVUX1RZUEVfTk9UX0FMTE9XRUQsXG4gIEVSUl9JTlNQRUNUT1JfQUxSRUFEWV9BQ1RJVkFURUQsXG4gIEVSUl9JTlNQRUNUT1JfQUxSRUFEWV9DT05ORUNURUQsXG4gIEVSUl9JTlNQRUNUT1JfQ0xPU0VELFxuICBFUlJfSU5TUEVDVE9SX0NPTU1BTkQsXG4gIEVSUl9JTlNQRUNUT1JfTk9UX0FDVElWRSxcbiAgRVJSX0lOU1BFQ1RPUl9OT1RfQVZBSUxBQkxFLFxuICBFUlJfSU5TUEVDVE9SX05PVF9DT05ORUNURUQsXG4gIEVSUl9JTlNQRUNUT1JfTk9UX1dPUktFUixcbiAgRVJSX0lOVEVSTkFMX0FTU0VSVElPTixcbiAgRVJSX0lOVkFMSURfQUREUkVTU19GQU1JTFksXG4gIEVSUl9JTlZBTElEX0FSR19UWVBFLFxuICBFUlJfSU5WQUxJRF9BUkdfVFlQRV9SQU5HRSxcbiAgRVJSX0lOVkFMSURfQVJHX1ZBTFVFLFxuICBFUlJfSU5WQUxJRF9BUkdfVkFMVUVfUkFOR0UsXG4gIEVSUl9JTlZBTElEX0FTWU5DX0lELFxuICBFUlJfSU5WQUxJRF9CVUZGRVJfU0laRSxcbiAgRVJSX0lOVkFMSURfQ0hBUixcbiAgRVJSX0lOVkFMSURfQ1VSU09SX1BPUyxcbiAgRVJSX0lOVkFMSURfRkQsXG4gIEVSUl9JTlZBTElEX0ZEX1RZUEUsXG4gIEVSUl9JTlZBTElEX0ZJTEVfVVJMX0hPU1QsXG4gIEVSUl9JTlZBTElEX0ZJTEVfVVJMX1BBVEgsXG4gIEVSUl9JTlZBTElEX0hBTkRMRV9UWVBFLFxuICBFUlJfSU5WQUxJRF9IVFRQX1RPS0VOLFxuICBFUlJfSU5WQUxJRF9JUF9BRERSRVNTLFxuICBFUlJfSU5WQUxJRF9NT0RVTEVfU1BFQ0lGSUVSLFxuICBFUlJfSU5WQUxJRF9PUFRfVkFMVUUsXG4gIEVSUl9JTlZBTElEX09QVF9WQUxVRV9FTkNPRElORyxcbiAgRVJSX0lOVkFMSURfUEFDS0FHRV9DT05GSUcsXG4gIEVSUl9JTlZBTElEX1BBQ0tBR0VfVEFSR0VULFxuICBFUlJfSU5WQUxJRF9QRVJGT1JNQU5DRV9NQVJLLFxuICBFUlJfSU5WQUxJRF9QUk9UT0NPTCxcbiAgRVJSX0lOVkFMSURfUkVQTF9FVkFMX0NPTkZJRyxcbiAgRVJSX0lOVkFMSURfUkVQTF9JTlBVVCxcbiAgRVJSX0lOVkFMSURfUkVUVVJOX1BST1BFUlRZLFxuICBFUlJfSU5WQUxJRF9SRVRVUk5fUFJPUEVSVFlfVkFMVUUsXG4gIEVSUl9JTlZBTElEX1JFVFVSTl9WQUxVRSxcbiAgRVJSX0lOVkFMSURfU1lOQ19GT1JLX0lOUFVULFxuICBFUlJfSU5WQUxJRF9USElTLFxuICBFUlJfSU5WQUxJRF9UVVBMRSxcbiAgRVJSX0lOVkFMSURfVVJJLFxuICBFUlJfSU5WQUxJRF9VUkwsXG4gIEVSUl9JTlZBTElEX1VSTF9TQ0hFTUUsXG4gIEVSUl9JUENfQ0hBTk5FTF9DTE9TRUQsXG4gIEVSUl9JUENfRElTQ09OTkVDVEVELFxuICBFUlJfSVBDX09ORV9QSVBFLFxuICBFUlJfSVBDX1NZTkNfRk9SSyxcbiAgRVJSX01BTklGRVNUX0RFUEVOREVOQ1lfTUlTU0lORyxcbiAgRVJSX01BTklGRVNUX0lOVEVHUklUWV9NSVNNQVRDSCxcbiAgRVJSX01BTklGRVNUX0lOVkFMSURfUkVTT1VSQ0VfRklFTEQsXG4gIEVSUl9NQU5JRkVTVF9URFosXG4gIEVSUl9NQU5JRkVTVF9VTktOT1dOX09ORVJST1IsXG4gIEVSUl9NRVRIT0RfTk9UX0lNUExFTUVOVEVELFxuICBFUlJfTUlTU0lOR19BUkdTLFxuICBFUlJfTUlTU0lOR19PUFRJT04sXG4gIEVSUl9NT0RVTEVfTk9UX0ZPVU5ELFxuICBFUlJfTVVMVElQTEVfQ0FMTEJBQ0ssXG4gIEVSUl9OQVBJX0NPTlNfRlVOQ1RJT04sXG4gIEVSUl9OQVBJX0lOVkFMSURfREFUQVZJRVdfQVJHUyxcbiAgRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0FMSUdOTUVOVCxcbiAgRVJSX05BUElfSU5WQUxJRF9UWVBFREFSUkFZX0xFTkdUSCxcbiAgRVJSX05PX0NSWVBUTyxcbiAgRVJSX05PX0lDVSxcbiAgRVJSX09VVF9PRl9SQU5HRSxcbiAgRVJSX1BBQ0tBR0VfSU1QT1JUX05PVF9ERUZJTkVELFxuICBFUlJfUEFDS0FHRV9QQVRIX05PVF9FWFBPUlRFRCxcbiAgRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRCxcbiAgRVJSX1FVSUNDTElFTlRTRVNTSU9OX0ZBSUxFRF9TRVRTT0NLRVQsXG4gIEVSUl9RVUlDU0VTU0lPTl9ERVNUUk9ZRUQsXG4gIEVSUl9RVUlDU0VTU0lPTl9JTlZBTElEX0RDSUQsXG4gIEVSUl9RVUlDU0VTU0lPTl9VUERBVEVLRVksXG4gIEVSUl9RVUlDU09DS0VUX0RFU1RST1lFRCxcbiAgRVJSX1FVSUNTT0NLRVRfSU5WQUxJRF9TVEFURUxFU1NfUkVTRVRfU0VDUkVUX0xFTkdUSCxcbiAgRVJSX1FVSUNTT0NLRVRfTElTVEVOSU5HLFxuICBFUlJfUVVJQ1NPQ0tFVF9VTkJPVU5ELFxuICBFUlJfUVVJQ1NUUkVBTV9ERVNUUk9ZRUQsXG4gIEVSUl9RVUlDU1RSRUFNX0lOVkFMSURfUFVTSCxcbiAgRVJSX1FVSUNTVFJFQU1fT1BFTl9GQUlMRUQsXG4gIEVSUl9RVUlDU1RSRUFNX1VOU1VQUE9SVEVEX1BVU0gsXG4gIEVSUl9RVUlDX1RMUzEzX1JFUVVJUkVELFxuICBFUlJfU0NSSVBUX0VYRUNVVElPTl9JTlRFUlJVUFRFRCxcbiAgRVJSX1NFUlZFUl9BTFJFQURZX0xJU1RFTixcbiAgRVJSX1NFUlZFUl9OT1RfUlVOTklORyxcbiAgRVJSX1NPQ0tFVF9BTFJFQURZX0JPVU5ELFxuICBFUlJfU09DS0VUX0JBRF9CVUZGRVJfU0laRSxcbiAgRVJSX1NPQ0tFVF9CQURfUE9SVCxcbiAgRVJSX1NPQ0tFVF9CQURfVFlQRSxcbiAgRVJSX1NPQ0tFVF9CVUZGRVJfU0laRSxcbiAgRVJSX1NPQ0tFVF9DTE9TRUQsXG4gIEVSUl9TT0NLRVRfREdSQU1fSVNfQ09OTkVDVEVELFxuICBFUlJfU09DS0VUX0RHUkFNX05PVF9DT05ORUNURUQsXG4gIEVSUl9TT0NLRVRfREdSQU1fTk9UX1JVTk5JTkcsXG4gIEVSUl9TUklfUEFSU0UsXG4gIEVSUl9TVFJFQU1fQUxSRUFEWV9GSU5JU0hFRCxcbiAgRVJSX1NUUkVBTV9DQU5OT1RfUElQRSxcbiAgRVJSX1NUUkVBTV9ERVNUUk9ZRUQsXG4gIEVSUl9TVFJFQU1fTlVMTF9WQUxVRVMsXG4gIEVSUl9TVFJFQU1fUFJFTUFUVVJFX0NMT1NFLFxuICBFUlJfU1RSRUFNX1BVU0hfQUZURVJfRU9GLFxuICBFUlJfU1RSRUFNX1VOU0hJRlRfQUZURVJfRU5EX0VWRU5ULFxuICBFUlJfU1RSRUFNX1dSQVAsXG4gIEVSUl9TVFJFQU1fV1JJVEVfQUZURVJfRU5ELFxuICBFUlJfU1lOVEhFVElDLFxuICBFUlJfVExTX0NFUlRfQUxUTkFNRV9JTlZBTElELFxuICBFUlJfVExTX0RIX1BBUkFNX1NJWkUsXG4gIEVSUl9UTFNfSEFORFNIQUtFX1RJTUVPVVQsXG4gIEVSUl9UTFNfSU5WQUxJRF9DT05URVhULFxuICBFUlJfVExTX0lOVkFMSURfUFJPVE9DT0xfVkVSU0lPTixcbiAgRVJSX1RMU19JTlZBTElEX1NUQVRFLFxuICBFUlJfVExTX1BST1RPQ09MX1ZFUlNJT05fQ09ORkxJQ1QsXG4gIEVSUl9UTFNfUkVORUdPVElBVElPTl9ESVNBQkxFRCxcbiAgRVJSX1RMU19SRVFVSVJFRF9TRVJWRVJfTkFNRSxcbiAgRVJSX1RMU19TRVNTSU9OX0FUVEFDSyxcbiAgRVJSX1RMU19TTklfRlJPTV9TRVJWRVIsXG4gIEVSUl9UUkFDRV9FVkVOVFNfQ0FURUdPUllfUkVRVUlSRUQsXG4gIEVSUl9UUkFDRV9FVkVOVFNfVU5BVkFJTEFCTEUsXG4gIEVSUl9VTkFWQUlMQUJMRV9EVVJJTkdfRVhJVCxcbiAgRVJSX1VOQ0FVR0hUX0VYQ0VQVElPTl9DQVBUVVJFX0FMUkVBRFlfU0VULFxuICBFUlJfVU5FU0NBUEVEX0NIQVJBQ1RFUlMsXG4gIEVSUl9VTkhBTkRMRURfRVJST1IsXG4gIEVSUl9VTktOT1dOX0JVSUxUSU5fTU9EVUxFLFxuICBFUlJfVU5LTk9XTl9DUkVERU5USUFMLFxuICBFUlJfVU5LTk9XTl9FTkNPRElORyxcbiAgRVJSX1VOS05PV05fRklMRV9FWFRFTlNJT04sXG4gIEVSUl9VTktOT1dOX01PRFVMRV9GT1JNQVQsXG4gIEVSUl9VTktOT1dOX1NJR05BTCxcbiAgRVJSX1VOU1VQUE9SVEVEX0RJUl9JTVBPUlQsXG4gIEVSUl9VTlNVUFBPUlRFRF9FU01fVVJMX1NDSEVNRSxcbiAgRVJSX1VTRV9BRlRFUl9DTE9TRSxcbiAgRVJSX1Y4QlJFQUtJVEVSQVRPUixcbiAgRVJSX1ZBTElEX1BFUkZPUk1BTkNFX0VOVFJZX1RZUEUsXG4gIEVSUl9WTV9EWU5BTUlDX0lNUE9SVF9DQUxMQkFDS19NSVNTSU5HLFxuICBFUlJfVk1fTU9EVUxFX0FMUkVBRFlfTElOS0VELFxuICBFUlJfVk1fTU9EVUxFX0NBTk5PVF9DUkVBVEVfQ0FDSEVEX0RBVEEsXG4gIEVSUl9WTV9NT0RVTEVfRElGRkVSRU5UX0NPTlRFWFQsXG4gIEVSUl9WTV9NT0RVTEVfTElOS0lOR19FUlJPUkVELFxuICBFUlJfVk1fTU9EVUxFX05PVF9NT0RVTEUsXG4gIEVSUl9WTV9NT0RVTEVfU1RBVFVTLFxuICBFUlJfV0FTSV9BTFJFQURZX1NUQVJURUQsXG4gIEVSUl9XT1JLRVJfSU5JVF9GQUlMRUQsXG4gIEVSUl9XT1JLRVJfTk9UX1JVTk5JTkcsXG4gIEVSUl9XT1JLRVJfT1VUX09GX01FTU9SWSxcbiAgRVJSX1dPUktFUl9VTlNFUklBTElaQUJMRV9FUlJPUixcbiAgRVJSX1dPUktFUl9VTlNVUFBPUlRFRF9FWFRFTlNJT04sXG4gIEVSUl9XT1JLRVJfVU5TVVBQT1JURURfT1BFUkFUSU9OLFxuICBFUlJfWkxJQl9JTklUSUFMSVpBVElPTl9GQUlMRUQsXG4gIE5vZGVFcnJvcixcbiAgTm9kZUVycm9yQWJzdHJhY3Rpb24sXG4gIE5vZGVSYW5nZUVycm9yLFxuICBOb2RlU3ludGF4RXJyb3IsXG4gIE5vZGVUeXBlRXJyb3IsXG4gIE5vZGVVUklFcnJvcixcbiAgYWdncmVnYXRlVHdvRXJyb3JzLFxuICBjb2RlcyxcbiAgY29ublJlc2V0RXhjZXB0aW9uLFxuICBkZW5vRXJyb3JUb05vZGVFcnJvcixcbiAgZG5zRXhjZXB0aW9uLFxuICBlcnJub0V4Y2VwdGlvbixcbiAgZXJyb3JNYXAsXG4gIGV4Y2VwdGlvbldpdGhIb3N0UG9ydCxcbiAgZ2VuZXJpY05vZGVFcnJvcixcbiAgaGlkZVN0YWNrRnJhbWVzLFxuICBpc1N0YWNrT3ZlcmZsb3dFcnJvcixcbiAgdXZFeGNlcHRpb24sXG4gIHV2RXhjZXB0aW9uV2l0aEhvc3RQb3J0LFxufTtcbiJdfQ==