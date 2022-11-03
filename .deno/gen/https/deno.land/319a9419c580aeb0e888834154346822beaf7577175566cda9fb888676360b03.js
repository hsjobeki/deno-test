import { deferred } from "../async/mod.ts";
import { assert, assertStringIncludes, fail } from "../testing/asserts.ts";
import { readAll } from "../streams/conversion.ts";
import { errorMap } from "./internal_binding/uv.ts";
import { codes } from "./internal/error_codes.ts";
export function notImplemented(msg) {
    const message = msg ? `Not implemented: ${msg}` : "Not implemented";
    throw new Error(message);
}
export function warnNotImplemented(msg) {
    const message = msg
        ? `Warning: Not implemented: ${msg}`
        : "Warning: Not implemented";
    console.warn(message);
}
export const _TextDecoder = TextDecoder;
export const _TextEncoder = TextEncoder;
export function intoCallbackAPI(func, cb, ...args) {
    func(...args).then((value) => cb && cb(null, value), (err) => cb && cb(err));
}
export function intoCallbackAPIWithIntercept(func, interceptor, cb, ...args) {
    func(...args).then((value) => cb && cb(null, interceptor(value)), (err) => cb && cb(err));
}
export function spliceOne(list, index) {
    for (; index + 1 < list.length; index++)
        list[index] = list[index + 1];
    list.pop();
}
export function normalizeEncoding(enc) {
    if (enc == null || enc === "utf8" || enc === "utf-8")
        return "utf8";
    return slowCases(enc);
}
function slowCases(enc) {
    switch (enc.length) {
        case 4:
            if (enc === "UTF8")
                return "utf8";
            if (enc === "ucs2" || enc === "UCS2")
                return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf8")
                return "utf8";
            if (enc === "ucs2")
                return "utf16le";
            break;
        case 3:
            if (enc === "hex" || enc === "HEX" || `${enc}`.toLowerCase() === "hex") {
                return "hex";
            }
            break;
        case 5:
            if (enc === "ascii")
                return "ascii";
            if (enc === "ucs-2")
                return "utf16le";
            if (enc === "UTF-8")
                return "utf8";
            if (enc === "ASCII")
                return "ascii";
            if (enc === "UCS-2")
                return "utf16le";
            enc = `${enc}`.toLowerCase();
            if (enc === "utf-8")
                return "utf8";
            if (enc === "ascii")
                return "ascii";
            if (enc === "ucs-2")
                return "utf16le";
            break;
        case 6:
            if (enc === "base64")
                return "base64";
            if (enc === "latin1" || enc === "binary")
                return "latin1";
            if (enc === "BASE64")
                return "base64";
            if (enc === "LATIN1" || enc === "BINARY")
                return "latin1";
            enc = `${enc}`.toLowerCase();
            if (enc === "base64")
                return "base64";
            if (enc === "latin1" || enc === "binary")
                return "latin1";
            break;
        case 7:
            if (enc === "utf16le" ||
                enc === "UTF16LE" ||
                `${enc}`.toLowerCase() === "utf16le") {
                return "utf16le";
            }
            break;
        case 8:
            if (enc === "utf-16le" ||
                enc === "UTF-16LE" ||
                `${enc}`.toLowerCase() === "utf-16le") {
                return "utf16le";
            }
            break;
        default:
            if (enc === "")
                return "utf8";
    }
}
export function validateIntegerRange(value, name, min = -2147483648, max = 2147483647) {
    if (!Number.isInteger(value)) {
        throw new Error(`${name} must be 'an integer' but was ${value}`);
    }
    if (value < min || value > max) {
        throw new Error(`${name} must be >= ${min} && <= ${max}. Value was ${value}`);
    }
}
export function once(callback) {
    let called = false;
    return function (...args) {
        if (called)
            return;
        called = true;
        callback.apply(this, args);
    };
}
export function mustCall(fn = () => { }, expectedExecutions = 1, timeout = 1000) {
    if (expectedExecutions < 1) {
        throw new Error("Expected executions can't be lower than 1");
    }
    let timesExecuted = 0;
    const completed = deferred();
    const abort = setTimeout(() => completed.reject(), timeout);
    function callback(...args) {
        timesExecuted++;
        if (timesExecuted === expectedExecutions) {
            completed.resolve();
        }
        fn.apply(this, args);
    }
    const result = completed
        .then(() => clearTimeout(abort))
        .catch(() => fail(`Async operation not completed: Expected ${expectedExecutions}, executed ${timesExecuted}`));
    return [
        result,
        callback,
    ];
}
export async function assertCallbackErrorUncaught({ prelude, invocation, cleanup }) {
    const p = Deno.run({
        cmd: [
            Deno.execPath(),
            "eval",
            "--no-check",
            "--unstable",
            `${prelude ?? ""}

      ${invocation}(err) => {
        // If the bug is present and the callback is called again with an error,
        // don't throw another error, so if the subprocess fails we know it had the correct behaviour.
        if (!err) throw new Error("success");
      });`,
        ],
        stderr: "piped",
    });
    const status = await p.status();
    const stderr = new TextDecoder().decode(await readAll(p.stderr));
    p.close();
    p.stderr.close();
    await cleanup?.();
    assert(!status.success);
    assertStringIncludes(stderr, "Error: success");
}
export function makeMethodsEnumerable(klass) {
    const proto = klass.prototype;
    for (const key of Object.getOwnPropertyNames(proto)) {
        const value = proto[key];
        if (typeof value === "function") {
            const desc = Reflect.getOwnPropertyDescriptor(proto, key);
            if (desc) {
                desc.enumerable = true;
                Object.defineProperty(proto, key, desc);
            }
        }
    }
}
const NumberIsSafeInteger = Number.isSafeInteger;
export function getSystemErrorName(code) {
    if (typeof code !== "number") {
        throw new codes.ERR_INVALID_ARG_TYPE("err", "number", code);
    }
    if (code >= 0 || !NumberIsSafeInteger(code)) {
        throw new codes.ERR_OUT_OF_RANGE("err", "a negative integer", code);
    }
    return errorMap.get(code)?.[0];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMzQyxPQUFPLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQzNFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDcEQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBaUJsRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQVc7SUFDeEMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDO0lBQ3BFLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxHQUFZO0lBQzdDLE1BQU0sT0FBTyxHQUFHLEdBQUc7UUFDakIsQ0FBQyxDQUFDLDZCQUE2QixHQUFHLEVBQUU7UUFDcEMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDO0lBQy9CLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUdELE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUM7QUFHeEMsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQztBQVF4QyxNQUFNLFVBQVUsZUFBZSxDQUU3QixJQUFvQyxFQUNwQyxFQUFzRSxFQUV0RSxHQUFHLElBQVc7SUFFZCxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQ2hCLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxD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LE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekIsSUFBSSxPQUFPLEtBQUssS0FBSyxVQUFVLEVBQUU7WUFDL0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMxRCxJQUFJLElBQUksRUFBRTtnQkFDUixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDdkIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxNQUFNLG1CQUFtQixHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7QUFNakQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLElBQVk7SUFDN0MsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzdEO0lBQ0QsSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDckU7SUFDRCxPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7IGRlZmVycmVkIH0gZnJvbSBcIi4uL2FzeW5jL21vZC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0LCBhc3NlcnRTdHJpbmdJbmNsdWRlcywgZmFpbCB9IGZyb20gXCIuLi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbmltcG9ydCB7IHJlYWRBbGwgfSBmcm9tIFwiLi4vc3RyZWFtcy9jb252ZXJzaW9uLnRzXCI7XG5pbXBvcnQgeyBlcnJvck1hcCB9IGZyb20gXCIuL2ludGVybmFsX2JpbmRpbmcvdXYudHNcIjtcbmltcG9ydCB7IGNvZGVzIH0gZnJvbSBcIi4vaW50ZXJuYWwvZXJyb3JfY29kZXMudHNcIjtcblxuZXhwb3J0IHR5cGUgQmluYXJ5RW5jb2RpbmdzID0gXCJiaW5hcnlcIjtcblxuZXhwb3J0IHR5cGUgVGV4dEVuY29kaW5ncyA9XG4gIHwgXCJhc2NpaVwiXG4gIHwgXCJ1dGY4XCJcbiAgfCBcInV0Zi04XCJcbiAgfCBcInV0ZjE2bGVcIlxuICB8IFwidWNzMlwiXG4gIHwgXCJ1Y3MtMlwiXG4gIHwgXCJiYXNlNjRcIlxuICB8IFwibGF0aW4xXCJcbiAgfCBcImhleFwiO1xuXG5leHBvcnQgdHlwZSBFbmNvZGluZ3MgPSBCaW5hcnlFbmNvZGluZ3MgfCBUZXh0RW5jb2RpbmdzO1xuXG5leHBvcnQgZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQobXNnOiBzdHJpbmcpOiBuZXZlciB7XG4gIGNvbnN0IG1lc3NhZ2UgPSBtc2cgPyBgTm90IGltcGxlbWVudGVkOiAke21zZ31gIDogXCJOb3QgaW1wbGVtZW50ZWRcIjtcbiAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2Fybk5vdEltcGxlbWVudGVkKG1zZz86IHN0cmluZykge1xuICBjb25zdCBtZXNzYWdlID0gbXNnXG4gICAgPyBgV2FybmluZzogTm90IGltcGxlbWVudGVkOiAke21zZ31gXG4gICAgOiBcIldhcm5pbmc6IE5vdCBpbXBsZW1lbnRlZFwiO1xuICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG59XG5cbmV4cG9ydCB0eXBlIF9UZXh0RGVjb2RlciA9IHR5cGVvZiBUZXh0RGVjb2Rlci5wcm90b3R5cGU7XG5leHBvcnQgY29uc3QgX1RleHREZWNvZGVyID0gVGV4dERlY29kZXI7XG5cbmV4cG9ydCB0eXBlIF9UZXh0RW5jb2RlciA9IHR5cGVvZiBUZXh0RW5jb2Rlci5wcm90b3R5cGU7XG5leHBvcnQgY29uc3QgX1RleHRFbmNvZGVyID0gVGV4dEVuY29kZXI7XG5cbi8vIEFQSSBoZWxwZXJzXG5cbmV4cG9ydCB0eXBlIE1heWJlTnVsbDxUPiA9IFQgfCBudWxsO1xuZXhwb3J0IHR5cGUgTWF5YmVEZWZpbmVkPFQ+ID0gVCB8IHVuZGVmaW5lZDtcbmV4cG9ydCB0eXBlIE1heWJlRW1wdHk8VD4gPSBUIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIGludG9DYWxsYmFja0FQSTxUPihcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+LFxuICBjYjogTWF5YmVFbXB0eTwoZXJyOiBNYXliZU51bGw8RXJyb3I+LCB2YWx1ZT86IE1heWJlRW1wdHk8VD4pID0+IHZvaWQ+LFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAuLi5hcmdzOiBhbnlbXVxuKSB7XG4gIGZ1bmMoLi4uYXJncykudGhlbihcbiAgICAodmFsdWUpID0+IGNiICYmIGNiKG51bGwsIHZhbHVlKSxcbiAgICAoZXJyKSA9PiBjYiAmJiBjYihlcnIpLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50b0NhbGxiYWNrQVBJV2l0aEludGVyY2VwdDxUMSwgVDI+KFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VDE+LFxuICBpbnRlcmNlcHRvcjogKHY6IFQxKSA9PiBUMixcbiAgY2I6IE1heWJlRW1wdHk8KGVycjogTWF5YmVOdWxsPEVycm9yPiwgdmFsdWU/OiBNYXliZUVtcHR5PFQyPikgPT4gdm9pZD4sXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIC4uLmFyZ3M6IGFueVtdXG4pIHtcbiAgZnVuYyguLi5hcmdzKS50aGVuKFxuICAgICh2YWx1ZSkgPT4gY2IgJiYgY2IobnVsbCwgaW50ZXJjZXB0b3IodmFsdWUpKSxcbiAgICAoZXJyKSA9PiBjYiAmJiBjYihlcnIpLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaWNlT25lKGxpc3Q6IHN0cmluZ1tdLCBpbmRleDogbnVtYmVyKSB7XG4gIGZvciAoOyBpbmRleCArIDEgPCBsaXN0Lmxlbmd0aDsgaW5kZXgrKykgbGlzdFtpbmRleF0gPSBsaXN0W2luZGV4ICsgMV07XG4gIGxpc3QucG9wKCk7XG59XG5cbi8vIFRha2VuIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL2JhNjg0ODA1YjZjMGVkZWQ3NmU1Y2Q4OWVlMDAzMjhhYzdhNTkzNjUvbGliL2ludGVybmFsL3V0aWwuanMjTDEyNVxuLy8gUmV0dXJuIHVuZGVmaW5lZCBpZiB0aGVyZSBpcyBubyBtYXRjaC5cbi8vIE1vdmUgdGhlIFwic2xvdyBjYXNlc1wiIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gdG8gbWFrZSBzdXJlIHRoaXMgZnVuY3Rpb24gZ2V0c1xuLy8gaW5saW5lZCBwcm9wZXJseS4gVGhhdCBwcmlvcml0aXplcyB0aGUgY29tbW9uIGNhc2UuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRW5jb2RpbmcoXG4gIGVuYzogc3RyaW5nIHwgbnVsbCxcbik6IFRleHRFbmNvZGluZ3MgfCB1bmRlZmluZWQge1xuICBpZiAoZW5jID09IG51bGwgfHwgZW5jID09PSBcInV0ZjhcIiB8fCBlbmMgPT09IFwidXRmLThcIikgcmV0dXJuIFwidXRmOFwiO1xuICByZXR1cm4gc2xvd0Nhc2VzKGVuYyk7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL2JhNjg0ODA1YjZjMGVkZWQ3NmU1Y2Q4OWVlMDAzMjhhYzdhNTkzNjUvbGliL2ludGVybmFsL3V0aWwuanMjTDEzMFxuZnVuY3Rpb24gc2xvd0Nhc2VzKGVuYzogc3RyaW5nKTogVGV4dEVuY29kaW5ncyB8IHVuZGVmaW5lZCB7XG4gIHN3aXRjaCAoZW5jLmxlbmd0aCkge1xuICAgIGNhc2UgNDpcbiAgICAgIGlmIChlbmMgPT09IFwiVVRGOFwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gICAgICBpZiAoZW5jID09PSBcInVjczJcIiB8fCBlbmMgPT09IFwiVUNTMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBlbmMgPSBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1dGY4XCIpIHJldHVybiBcInV0ZjhcIjtcbiAgICAgIGlmIChlbmMgPT09IFwidWNzMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICBpZiAoZW5jID09PSBcImhleFwiIHx8IGVuYyA9PT0gXCJIRVhcIiB8fCBgJHtlbmN9YC50b0xvd2VyQ2FzZSgpID09PSBcImhleFwiKSB7XG4gICAgICAgIHJldHVybiBcImhleFwiO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSA1OlxuICAgICAgaWYgKGVuYyA9PT0gXCJhc2NpaVwiKSByZXR1cm4gXCJhc2NpaVwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1Y3MtMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBpZiAoZW5jID09PSBcIlVURi04XCIpIHJldHVybiBcInV0ZjhcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiQVNDSUlcIikgcmV0dXJuIFwiYXNjaWlcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiVUNTLTJcIikgcmV0dXJuIFwidXRmMTZsZVwiO1xuICAgICAgZW5jID0gYCR7ZW5jfWAudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChlbmMgPT09IFwidXRmLThcIikgcmV0dXJuIFwidXRmOFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJhc2NpaVwiKSByZXR1cm4gXCJhc2NpaVwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJ1Y3MtMlwiKSByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDY6XG4gICAgICBpZiAoZW5jID09PSBcImJhc2U2NFwiKSByZXR1cm4gXCJiYXNlNjRcIjtcbiAgICAgIGlmIChlbmMgPT09IFwibGF0aW4xXCIgfHwgZW5jID09PSBcImJpbmFyeVwiKSByZXR1cm4gXCJsYXRpbjFcIjtcbiAgICAgIGlmIChlbmMgPT09IFwiQkFTRTY0XCIpIHJldHVybiBcImJhc2U2NFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJMQVRJTjFcIiB8fCBlbmMgPT09IFwiQklOQVJZXCIpIHJldHVybiBcImxhdGluMVwiO1xuICAgICAgZW5jID0gYCR7ZW5jfWAudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChlbmMgPT09IFwiYmFzZTY0XCIpIHJldHVybiBcImJhc2U2NFwiO1xuICAgICAgaWYgKGVuYyA9PT0gXCJsYXRpbjFcIiB8fCBlbmMgPT09IFwiYmluYXJ5XCIpIHJldHVybiBcImxhdGluMVwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSA3OlxuICAgICAgaWYgKFxuICAgICAgICBlbmMgPT09IFwidXRmMTZsZVwiIHx8XG4gICAgICAgIGVuYyA9PT0gXCJVVEYxNkxFXCIgfHxcbiAgICAgICAgYCR7ZW5jfWAudG9Mb3dlckNhc2UoKSA9PT0gXCJ1dGYxNmxlXCJcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gXCJ1dGYxNmxlXCI7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDg6XG4gICAgICBpZiAoXG4gICAgICAgIGVuYyA9PT0gXCJ1dGYtMTZsZVwiIHx8XG4gICAgICAgIGVuYyA9PT0gXCJVVEYtMTZMRVwiIHx8XG4gICAgICAgIGAke2VuY31gLnRvTG93ZXJDYXNlKCkgPT09IFwidXRmLTE2bGVcIlxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBcInV0ZjE2bGVcIjtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAoZW5jID09PSBcIlwiKSByZXR1cm4gXCJ1dGY4XCI7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlSW50ZWdlclJhbmdlKFxuICB2YWx1ZTogbnVtYmVyLFxuICBuYW1lOiBzdHJpbmcsXG4gIG1pbiA9IC0yMTQ3NDgzNjQ4LFxuICBtYXggPSAyMTQ3NDgzNjQ3LFxuKSB7XG4gIC8vIFRoZSBkZWZhdWx0cyBmb3IgbWluIGFuZCBtYXggY29ycmVzcG9uZCB0byB0aGUgbGltaXRzIG9mIDMyLWJpdCBpbnRlZ2Vycy5cbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtuYW1lfSBtdXN0IGJlICdhbiBpbnRlZ2VyJyBidXQgd2FzICR7dmFsdWV9YCk7XG4gIH1cblxuICBpZiAodmFsdWUgPCBtaW4gfHwgdmFsdWUgPiBtYXgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgJHtuYW1lfSBtdXN0IGJlID49ICR7bWlufSAmJiA8PSAke21heH0uIFZhbHVlIHdhcyAke3ZhbHVlfWAsXG4gICAgKTtcbiAgfVxufVxuXG50eXBlIE9wdGlvbmFsU3ByZWFkPFQ+ID0gVCBleHRlbmRzIHVuZGVmaW5lZCA/IFtdXG4gIDogW1RdO1xuXG5leHBvcnQgZnVuY3Rpb24gb25jZTxUID0gdW5kZWZpbmVkPihcbiAgY2FsbGJhY2s6ICguLi5hcmdzOiBPcHRpb25hbFNwcmVhZDxUPikgPT4gdm9pZCxcbikge1xuICBsZXQgY2FsbGVkID0gZmFsc2U7XG4gIHJldHVybiBmdW5jdGlvbiAodGhpczogdW5rbm93biwgLi4uYXJnczogT3B0aW9uYWxTcHJlYWQ8VD4pIHtcbiAgICBpZiAoY2FsbGVkKSByZXR1cm47XG4gICAgY2FsbGVkID0gdHJ1ZTtcbiAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gW2V4cGVjdGVkRXhlY3V0aW9ucyA9IDFdXG4gKiBAcGFyYW0gW3RpbWVvdXQgPSAxMDAwXSBNaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgdGhlIHByb21pc2UgaXMgZm9yY2VmdWxseSBleGl0ZWQgKi9cbmV4cG9ydCBmdW5jdGlvbiBtdXN0Q2FsbDxUIGV4dGVuZHMgdW5rbm93bltdPihcbiAgZm46ICguLi5hcmdzOiBUKSA9PiB2b2lkID0gKCkgPT4ge30sXG4gIGV4cGVjdGVkRXhlY3V0aW9ucyA9IDEsXG4gIHRpbWVvdXQgPSAxMDAwLFxuKTogW1Byb21pc2U8dm9pZD4sICguLi5hcmdzOiBUKSA9PiB2b2lkXSB7XG4gIGlmIChleHBlY3RlZEV4ZWN1dGlvbnMgPCAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgZXhlY3V0aW9ucyBjYW4ndCBiZSBsb3dlciB0aGFuIDFcIik7XG4gIH1cbiAgbGV0IHRpbWVzRXhlY3V0ZWQgPSAwO1xuICBjb25zdCBjb21wbGV0ZWQgPSBkZWZlcnJlZCgpO1xuXG4gIGNvbnN0IGFib3J0ID0gc2V0VGltZW91dCgoKSA9PiBjb21wbGV0ZWQucmVqZWN0KCksIHRpbWVvdXQpO1xuXG4gIGZ1bmN0aW9uIGNhbGxiYWNrKHRoaXM6IHVua25vd24sIC4uLmFyZ3M6IFQpIHtcbiAgICB0aW1lc0V4ZWN1dGVkKys7XG4gICAgaWYgKHRpbWVzRXhlY3V0ZWQgPT09IGV4cGVjdGVkRXhlY3V0aW9ucykge1xuICAgICAgY29tcGxldGVkLnJlc29sdmUoKTtcbiAgICB9XG4gICAgZm4uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSBjb21wbGV0ZWRcbiAgICAudGhlbigoKSA9PiBjbGVhclRpbWVvdXQoYWJvcnQpKVxuICAgIC5jYXRjaCgoKSA9PlxuICAgICAgZmFpbChcbiAgICAgICAgYEFzeW5jIG9wZXJhdGlvbiBub3QgY29tcGxldGVkOiBFeHBlY3RlZCAke2V4cGVjdGVkRXhlY3V0aW9uc30sIGV4ZWN1dGVkICR7dGltZXNFeGVjdXRlZH1gLFxuICAgICAgKVxuICAgICk7XG5cbiAgcmV0dXJuIFtcbiAgICByZXN1bHQsXG4gICAgY2FsbGJhY2ssXG4gIF07XG59XG4vKiogQXNzZXJ0cyB0aGF0IGFuIGVycm9yIHRocm93biBpbiBhIGNhbGxiYWNrIHdpbGwgbm90IGJlIHdyb25nbHkgY2F1Z2h0LiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzc2VydENhbGxiYWNrRXJyb3JVbmNhdWdodChcbiAgeyBwcmVsdWRlLCBpbnZvY2F0aW9uLCBjbGVhbnVwIH06IHtcbiAgICAvKiogQW55IGNvZGUgd2hpY2ggbmVlZHMgdG8gcnVuIGJlZm9yZSB0aGUgYWN0dWFsIGludm9jYXRpb24gKG5vdGFibHksIGFueSBpbXBvcnQgc3RhdGVtZW50cykuICovXG4gICAgcHJlbHVkZT86IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBUaGUgc3RhcnQgb2YgdGhlIGludm9jYXRpb24gb2YgdGhlIGZ1bmN0aW9uLCBlLmcuIGBvcGVuKFwiZm9vLnR4dFwiLCBgLlxuICAgICAqIFRoZSBjYWxsYmFjayB3aWxsIGJlIGFkZGVkIGFmdGVyIGl0LlxuICAgICAqL1xuICAgIGludm9jYXRpb246IHN0cmluZztcbiAgICAvKiogQ2FsbGVkIGFmdGVyIHRoZSBzdWJwcm9jZXNzIGlzIGZpbmlzaGVkIGJ1dCBiZWZvcmUgcnVubmluZyB0aGUgYXNzZXJ0aW9ucywgZS5nLiB0byBjbGVhbiB1cCBjcmVhdGVkIGZpbGVzLiAqL1xuICAgIGNsZWFudXA/OiAoKSA9PiBQcm9taXNlPHZvaWQ+IHwgdm9pZDtcbiAgfSxcbikge1xuICAvLyBTaW5jZSB0aGUgZXJyb3IgaGFzIHRvIGJlIHVuY2F1Z2h0LCBhbmQgdGhhdCB3aWxsIGtpbGwgdGhlIERlbm8gcHJvY2VzcyxcbiAgLy8gdGhlIG9ubHkgd2F5IHRvIHRlc3QgdGhpcyBpcyB0byBzcGF3biBhIHN1YnByb2Nlc3MuXG4gIGNvbnN0IHAgPSBEZW5vLnJ1bih7XG4gICAgY21kOiBbXG4gICAgICBEZW5vLmV4ZWNQYXRoKCksXG4gICAgICBcImV2YWxcIixcbiAgICAgIFwiLS1uby1jaGVja1wiLCAvLyBSdW5uaW5nIFRTQyBmb3IgZXZlcnkgb25lIG9mIHRoZXNlIHRlc3RzIHdvdWxkIHRha2Ugd2F5IHRvbyBsb25nXG4gICAgICBcIi0tdW5zdGFibGVcIixcbiAgICAgIGAke3ByZWx1ZGUgPz8gXCJcIn1cblxuICAgICAgJHtpbnZvY2F0aW9ufShlcnIpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIGJ1ZyBpcyBwcmVzZW50IGFuZCB0aGUgY2FsbGJhY2sgaXMgY2FsbGVkIGFnYWluIHdpdGggYW4gZXJyb3IsXG4gICAgICAgIC8vIGRvbid0IHRocm93IGFub3RoZXIgZXJyb3IsIHNvIGlmIHRoZSBzdWJwcm9jZXNzIGZhaWxzIHdlIGtub3cgaXQgaGFkIHRoZSBjb3JyZWN0IGJlaGF2aW91ci5cbiAgICAgICAgaWYgKCFlcnIpIHRocm93IG5ldyBFcnJvcihcInN1Y2Nlc3NcIik7XG4gICAgICB9KTtgLFxuICAgIF0sXG4gICAgc3RkZXJyOiBcInBpcGVkXCIsXG4gIH0pO1xuICBjb25zdCBzdGF0dXMgPSBhd2FpdCBwLnN0YXR1cygpO1xuICBjb25zdCBzdGRlcnIgPSBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYXdhaXQgcmVhZEFsbChwLnN0ZGVycikpO1xuICBwLmNsb3NlKCk7XG4gIHAuc3RkZXJyLmNsb3NlKCk7XG4gIGF3YWl0IGNsZWFudXA/LigpO1xuICBhc3NlcnQoIXN0YXR1cy5zdWNjZXNzKTtcbiAgYXNzZXJ0U3RyaW5nSW5jbHVkZXMoc3RkZXJyLCBcIkVycm9yOiBzdWNjZXNzXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1ldGhvZHNFbnVtZXJhYmxlKGtsYXNzOiB7IG5ldyAoKTogdW5rbm93biB9KSB7XG4gIGNvbnN0IHByb3RvID0ga2xhc3MucHJvdG90eXBlO1xuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm90bykpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHByb3RvW2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zdCBkZXNjID0gUmVmbGVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG8sIGtleSk7XG4gICAgICBpZiAoZGVzYykge1xuICAgICAgICBkZXNjLmVudW1lcmFibGUgPSB0cnVlO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIGtleSwgZGVzYyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IE51bWJlcklzU2FmZUludGVnZXIgPSBOdW1iZXIuaXNTYWZlSW50ZWdlcjtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3lzdGVtIGVycm9yIG5hbWUgZnJvbSBhbiBlcnJvciBjb2RlIG51bWJlci5cbiAqIEBwYXJhbSBjb2RlIGVycm9yIGNvZGUgbnVtYmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTeXN0ZW1FcnJvck5hbWUoY29kZTogbnVtYmVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiBjb2RlICE9PSBcIm51bWJlclwiKSB7XG4gICAgdGhyb3cgbmV3IGNvZGVzLkVSUl9JTlZBTElEX0FSR19UWVBFKFwiZXJyXCIsIFwibnVtYmVyXCIsIGNvZGUpO1xuICB9XG4gIGlmIChjb2RlID49IDAgfHwgIU51bWJlcklzU2FmZUludGVnZXIoY29kZSkpIHtcbiAgICB0aHJvdyBuZXcgY29kZXMuRVJSX09VVF9PRl9SQU5HRShcImVyclwiLCBcImEgbmVnYXRpdmUgaW50ZWdlclwiLCBjb2RlKTtcbiAgfVxuICByZXR1cm4gZXJyb3JNYXAuZ2V0KGNvZGUpPy5bMF07XG59XG4iXX0=