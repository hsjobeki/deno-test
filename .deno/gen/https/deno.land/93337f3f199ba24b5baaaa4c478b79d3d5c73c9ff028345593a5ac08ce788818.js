const hexTable = new TextEncoder().encode("0123456789abcdef");
function errInvalidByte(byte) {
    return new TypeError(`Invalid byte '${String.fromCharCode(byte)}'`);
}
function errLength() {
    return new RangeError("Odd length hex string");
}
function fromHexChar(byte) {
    if (48 <= byte && byte <= 57)
        return byte - 48;
    if (97 <= byte && byte <= 102)
        return byte - 97 + 10;
    if (65 <= byte && byte <= 70)
        return byte - 65 + 10;
    throw errInvalidByte(byte);
}
export function encode(src) {
    const dst = new Uint8Array(src.length * 2);
    for (let i = 0; i < dst.length; i++) {
        const v = src[i];
        dst[i * 2] = hexTable[v >> 4];
        dst[i * 2 + 1] = hexTable[v & 0x0f];
    }
    return dst;
}
export function decode(src) {
    const dst = new Uint8Array(src.length / 2);
    for (let i = 0; i < dst.length; i++) {
        const a = fromHexChar(src[i * 2]);
        const b = fromHexChar(src[i * 2 + 1]);
        dst[i] = (a << 4) | b;
    }
    if (src.length % 2 == 1) {
        fromHexChar(src[dst.length * 2]);
        throw errLength();
    }
    return dst;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWFBLE1BQU0sUUFBUSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFFOUQsU0FBUyxjQUFjLENBQUMsSUFBWTtJQUNsQyxPQUFPLElBQUksU0FBUyxDQUFDLGlCQUFpQixNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBRUQsU0FBUyxTQUFTO0lBQ2hCLE9BQU8sSUFBSSxVQUFVLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBR0QsU0FBUyxXQUFXLENBQUMsSUFBWTtJQUUvQixJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7UUFBRSxPQUFPLElBQUksR0FBRyxFQUFFLENBQUM7SUFFL0MsSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHO1FBQUUsT0FBTyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUVyRCxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7UUFBRSxPQUFPLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBRXBELE1BQU0sY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFHRCxNQUFNLFVBQVUsTUFBTSxDQUFDLEdBQWU7SUFDcEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMzQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNuQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDckM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFNRCxNQUFNLFVBQVUsTUFBTSxDQUFDLEdBQWU7SUFDcEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMzQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNuQyxNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDdkI7SUFFRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUd2QixXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQyxNQUFNLFNBQVMsRUFBRSxDQUFDO0tBQ25CO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMDkgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvbWFzdGVyL0xJQ0VOU0Vcbi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKiBQb3J0IG9mIHRoZSBHb1xuICogW2VuY29kaW5nL2hleF0oaHR0cHM6Ly9naXRodWIuY29tL2dvbGFuZy9nby9ibG9iL2dvMS4xMi41L3NyYy9lbmNvZGluZy9oZXgvaGV4LmdvKVxuICogbGlicmFyeS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbmNvbnN0IGhleFRhYmxlID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiMDEyMzQ1Njc4OWFiY2RlZlwiKTtcblxuZnVuY3Rpb24gZXJySW52YWxpZEJ5dGUoYnl0ZTogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIGJ5dGUgJyR7U3RyaW5nLmZyb21DaGFyQ29kZShieXRlKX0nYCk7XG59XG5cbmZ1bmN0aW9uIGVyckxlbmd0aCgpIHtcbiAgcmV0dXJuIG5ldyBSYW5nZUVycm9yKFwiT2RkIGxlbmd0aCBoZXggc3RyaW5nXCIpO1xufVxuXG4vKiogQ29udmVydHMgYSBoZXggY2hhcmFjdGVyIGludG8gaXRzIHZhbHVlLiAqL1xuZnVuY3Rpb24gZnJvbUhleENoYXIoYnl0ZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gJzAnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnOSdcbiAgaWYgKDQ4IDw9IGJ5dGUgJiYgYnl0ZSA8PSA1NykgcmV0dXJuIGJ5dGUgLSA0ODtcbiAgLy8gJ2EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnZidcbiAgaWYgKDk3IDw9IGJ5dGUgJiYgYnl0ZSA8PSAxMDIpIHJldHVybiBieXRlIC0gOTcgKyAxMDtcbiAgLy8gJ0EnIDw9IGJ5dGUgJiYgYnl0ZSA8PSAnRidcbiAgaWYgKDY1IDw9IGJ5dGUgJiYgYnl0ZSA8PSA3MCkgcmV0dXJuIGJ5dGUgLSA2NSArIDEwO1xuXG4gIHRocm93IGVyckludmFsaWRCeXRlKGJ5dGUpO1xufVxuXG4vKiogRW5jb2RlcyBgc3JjYCBpbnRvIGBzcmMubGVuZ3RoICogMmAgYnl0ZXMuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKHNyYzogVWludDhBcnJheSk6IFVpbnQ4QXJyYXkge1xuICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShzcmMubGVuZ3RoICogMik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZHN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgdiA9IHNyY1tpXTtcbiAgICBkc3RbaSAqIDJdID0gaGV4VGFibGVbdiA+PiA0XTtcbiAgICBkc3RbaSAqIDIgKyAxXSA9IGhleFRhYmxlW3YgJiAweDBmXTtcbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vKipcbiAqIERlY29kZXMgYHNyY2AgaW50byBgc3JjLmxlbmd0aCAvIDJgIGJ5dGVzLlxuICogSWYgdGhlIGlucHV0IGlzIG1hbGZvcm1lZCwgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoc3JjOiBVaW50OEFycmF5KTogVWludDhBcnJheSB7XG4gIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KHNyYy5sZW5ndGggLyAyKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhID0gZnJvbUhleENoYXIoc3JjW2kgKiAyXSk7XG4gICAgY29uc3QgYiA9IGZyb21IZXhDaGFyKHNyY1tpICogMiArIDFdKTtcbiAgICBkc3RbaV0gPSAoYSA8PCA0KSB8IGI7XG4gIH1cblxuICBpZiAoc3JjLmxlbmd0aCAlIDIgPT0gMSkge1xuICAgIC8vIENoZWNrIGZvciBpbnZhbGlkIGNoYXIgYmVmb3JlIHJlcG9ydGluZyBiYWQgbGVuZ3RoLFxuICAgIC8vIHNpbmNlIHRoZSBpbnZhbGlkIGNoYXIgKGlmIHByZXNlbnQpIGlzIGFuIGVhcmxpZXIgcHJvYmxlbS5cbiAgICBmcm9tSGV4Q2hhcihzcmNbZHN0Lmxlbmd0aCAqIDJdKTtcbiAgICB0aHJvdyBlcnJMZW5ndGgoKTtcbiAgfVxuXG4gIHJldHVybiBkc3Q7XG59XG4iXX0=