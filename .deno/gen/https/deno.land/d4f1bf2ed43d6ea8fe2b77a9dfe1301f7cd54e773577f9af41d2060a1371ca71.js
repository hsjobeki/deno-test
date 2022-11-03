import * as base64 from "../../encoding/base64.ts";
import * as base64url from "../../encoding/base64url.ts";
export function asciiToBytes(str) {
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
    }
    return new Uint8Array(byteArray);
}
export function base64ToBytes(str) {
    str = base64clean(str);
    str = str.replaceAll("-", "+").replaceAll("_", "/");
    return base64.decode(str);
}
const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
function base64clean(str) {
    str = str.split("=")[0];
    str = str.trim().replace(INVALID_BASE64_RE, "");
    if (str.length < 2)
        return "";
    while (str.length % 4 !== 0) {
        str = str + "=";
    }
    return str;
}
export function base64UrlToBytes(str) {
    str = base64clean(str);
    str = str.replaceAll("+", "-").replaceAll("/", "_");
    return base64url.decode(str);
}
export function hexToBytes(str) {
    const byteArray = new Uint8Array(Math.floor((str || "").length / 2));
    let i;
    for (i = 0; i < byteArray.length; i++) {
        const a = Number.parseInt(str[i * 2], 16);
        const b = Number.parseInt(str[i * 2 + 1], 16);
        if (Number.isNaN(a) && Number.isNaN(b)) {
            break;
        }
        byteArray[i] = (a << 4) | b;
    }
    return new Uint8Array(i === byteArray.length ? byteArray : byteArray.slice(0, i));
}
export function utf16leToBytes(str, units) {
    let c, hi, lo;
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) {
            break;
        }
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
    }
    return new Uint8Array(byteArray);
}
export function bytesToAscii(bytes) {
    let ret = "";
    for (let i = 0; i < bytes.length; ++i) {
        ret += String.fromCharCode(bytes[i] & 127);
    }
    return ret;
}
export function bytesToUtf16le(bytes) {
    let res = "";
    for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sS0FBSyxNQUFNLE1BQU0sMEJBQTBCLENBQUM7QUFDbkQsT0FBTyxLQUFLLFNBQVMsTUFBTSw2QkFBNkIsQ0FBQztBQUV6RCxNQUFNLFVBQVUsWUFBWSxDQUFDLEdBQVc7SUFDdEMsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ25DLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztLQUN6QztJQUNELE9BQU8sSUFBSSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsR0FBVztJQUN2QyxHQUFHLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCLEdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBRUQsTUFBTSxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQztBQUM5QyxTQUFTLFdBQVcsQ0FBQyxHQUFXO0lBRTlCLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhCLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRWhELElBQUksR0FBRyxDQUFDLE1BQU0s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QUFHLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7S0FDNUM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQWlCO0lBQzlDLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzVDLEdBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0tBQzNEO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCAqIGFzIGJhc2U2NCBmcm9tIFwiLi4vLi4vZW5jb2RpbmcvYmFzZTY0LnRzXCI7XG5pbXBvcnQgKiBhcyBiYXNlNjR1cmwgZnJvbSBcIi4uLy4uL2VuY29kaW5nL2Jhc2U2NHVybC50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNjaWlUb0J5dGVzKHN0cjogc3RyaW5nKSB7XG4gIGNvbnN0IGJ5dGVBcnJheSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMjU1KTtcbiAgfVxuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnl0ZUFycmF5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMoc3RyOiBzdHJpbmcpIHtcbiAgc3RyID0gYmFzZTY0Y2xlYW4oc3RyKTtcbiAgc3RyID0gc3RyLnJlcGxhY2VBbGwoXCItXCIsIFwiK1wiKS5yZXBsYWNlQWxsKFwiX1wiLCBcIi9cIik7XG4gIHJldHVybiBiYXNlNjQuZGVjb2RlKHN0cik7XG59XG5cbmNvbnN0IElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZztcbmZ1bmN0aW9uIGJhc2U2NGNsZWFuKHN0cjogc3RyaW5nKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KFwiPVwiKVswXTtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgc3RkL2Jhc2U2NCBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsIFwiXCIpO1xuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuIFwiXCI7XG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIHN0ZC9iYXNlNjQgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgXCI9XCI7XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2U2NFVybFRvQnl0ZXMoc3RyOiBzdHJpbmcpIHtcbiAgc3RyID0gYmFzZTY0Y2xlYW4oc3RyKTtcbiAgc3RyID0gc3RyLnJlcGxhY2VBbGwoXCIrXCIsIFwiLVwiKS5yZXBsYWNlQWxsKFwiL1wiLCBcIl9cIik7XG4gIHJldHVybiBiYXNlNjR1cmwuZGVjb2RlKHN0cik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZXhUb0J5dGVzKHN0cjogc3RyaW5nKSB7XG4gIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KE1hdGguZmxvb3IoKHN0ciB8fCBcIlwiKS5sZW5ndGggLyAyKSk7XG4gIGxldCBpO1xuICBmb3IgKGkgPSAwOyBpIDwgYnl0ZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYSA9IE51bWJlci5wYXJzZUludChzdHJbaSAqIDJdLCAxNik7XG4gICAgY29uc3QgYiA9IE51bWJlci5wYXJzZUludChzdHJbaSAqIDIgKyAxXSwgMTYpO1xuICAgIGlmIChOdW1iZXIuaXNOYU4oYSkgJiYgTnVtYmVyLmlzTmFOKGIpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgYnl0ZUFycmF5W2ldID0gKGEgPDwgNCkgfCBiO1xuICB9XG4gIHJldHVybiBuZXcgVWludDhBcnJheShcbiAgICBpID09PSBieXRlQXJyYXkubGVuZ3RoID8gYnl0ZUFycmF5IDogYnl0ZUFycmF5LnNsaWNlKDAsIGkpLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMoc3RyOiBzdHJpbmcsIHVuaXRzOiBudW1iZXIpIHtcbiAgbGV0IGMsIGhpLCBsbztcbiAgY29uc3QgYnl0ZUFycmF5ID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgaGkgPSBjID4+IDg7XG4gICAgbG8gPSBjICUgMjU2O1xuICAgIGJ5dGVBcnJheS5wdXNoKGxvKTtcbiAgICBieXRlQXJyYXkucHVzaChoaSk7XG4gIH1cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVBcnJheSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBieXRlc1RvQXNjaWkoYnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgbGV0IHJldCA9IFwiXCI7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSAmIDEyNyk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9VdGYxNmxlKGJ5dGVzOiBVaW50OEFycmF5KSB7XG4gIGxldCByZXMgPSBcIlwiO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuIl19