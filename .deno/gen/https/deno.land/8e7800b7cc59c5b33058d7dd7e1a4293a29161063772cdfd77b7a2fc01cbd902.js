export function indexOfNeedle(source, needle, start = 0) {
    if (start >= source.length) {
        return -1;
    }
    if (start < 0) {
        start = Math.max(0, source.length + start);
    }
    const s = needle[0];
    for (let i = start; i < source.length; i++) {
        if (source[i] !== s)
            continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while (matched < needle.length) {
            j++;
            if (source[j] !== needle[j - pin]) {
                break;
            }
            matched++;
        }
        if (matched === needle.length) {
            return pin;
        }
    }
    return -1;
}
export function lastIndexOfNeedle(source, needle, start = source.length - 1) {
    if (start < 0) {
        return -1;
    }
    if (start >= source.length) {
        start = source.length - 1;
    }
    const e = needle[needle.length - 1];
    for (let i = start; i >= 0; i--) {
        if (source[i] !== e)
            continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while (matched < needle.length) {
            j--;
            if (source[j] !== needle[needle.length - 1 - (pin - j)]) {
                break;
            }
            matched++;
        }
        if (matched === needle.length) {
            return pin - needle.length + 1;
        }
    }
    return -1;
}
export function startsWith(source, prefix) {
    for (let i = 0, max = prefix.length; i < max; i++) {
        if (source[i] !== prefix[i])
            return false;
    }
    return true;
}
export function endsWith(source, suffix) {
    for (let srci = source.length - 1, sfxi = suffix.length - 1; sfxi >= 0; srci--, sfxi--) {
        if (source[srci] !== suffix[sfxi])
            return false;
    }
    return true;
}
export function repeat(source, count) {
    if (count === 0) {
        return new Uint8Array();
    }
    if (count < 0) {
        throw new RangeError("bytes: negative repeat count");
    }
    else if ((source.length * count) / count !== source.length) {
        throw new Error("bytes: repeat count causes overflow");
    }
    const int = Math.floor(count);
    if (int !== count) {
        throw new Error("bytes: repeat count must be an integer");
    }
    const nb = new Uint8Array(source.length * count);
    let bp = copy(source, nb);
    for (; bp < nb.length; bp *= 2) {
        copy(nb.slice(0, bp), nb, bp);
    }
    return nb;
}
export function concat(...buf) {
    let length = 0;
    for (const b of buf) {
        length += b.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const b of buf) {
        output.set(b, index);
        index += b.length;
    }
    return output;
}
export function includesNeedle(source, needle, start = 0) {
    return indexOfNeedle(source, needle, start) !== -1;
}
export function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
export { equals } from "./equals.ts";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTBCQSxNQUFNLFVBQVUsYUFBYSxDQUMzQixNQUFrQixFQUNsQixNQUFrQixFQUNsQixLQUFLLEdBQUcsQ0FBQztJQUVULElBQUksS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDMUIsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUNYO0lBQ0QsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1FBQ2IsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDNUM7SUFDRCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUFFLFNBQVM7UUFDOUIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE9BQU8sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUU7WUFDOUIsQ0FBQyxFQUFFLENBQUM7WUFDSixJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFO2dCQUNqQyxNQUFNO2FBQ1A7WUFDRCxPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBSSxPQUFPLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUM3QixPQUFPLEdBQUcsQ0FBQztTQUNaO0tBQ0Y7SUFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ1osQ0FBQztBQWtCRCxNQUFN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Q0FBQztBQTRCRCxNQUFNLFVBQVUsSUFBSSxDQUFDLEdBQWUsRUFBRSxHQUFlLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFDNUQsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2pELE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7SUFDL0MsSUFBSSxHQUFHLENBQUMsVUFBVSxHQUFHLGlCQUFpQixFQUFFO1FBQ3RDLEdBQUcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbEIsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ3hCLENBQUM7QUFFRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqXG4gKiBQcm92aWRlcyBoZWxwZXIgZnVuY3Rpb25zIHRvIG1hbmlwdWxhdGUgYFVpbnQ4QXJyYXlgIGJ5dGUgc2xpY2VzIHRoYXQgYXJlIG5vdFxuICogaW5jbHVkZWQgb24gdGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUuXG4gKlxuICogQG1vZHVsZVxuICovXG5cbi8qKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiB0aGUgbmVlZGxlIGFycmF5IGluIHRoZSBzb3VyY2VcbiAqIGFycmF5LCBvciAtMSBpZiBpdCBpcyBub3QgcHJlc2VudC5cbiAqXG4gKiBBIHN0YXJ0IGluZGV4IGNhbiBiZSBzcGVjaWZpZWQgYXMgdGhlIHRoaXJkIGFyZ3VtZW50IHRoYXQgYmVnaW5zIHRoZSBzZWFyY2hcbiAqIGF0IHRoYXQgZ2l2ZW4gaW5kZXguIFRoZSBzdGFydCBpbmRleCBkZWZhdWx0cyB0byB0aGUgc3RhcnQgb2YgdGhlIGFycmF5LlxuICpcbiAqIFRoZSBjb21wbGV4aXR5IG9mIHRoaXMgZnVuY3Rpb24gaXMgTyhzb3VyY2UubGVudGggKiBuZWVkbGUubGVuZ3RoKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaW5kZXhPZk5lZWRsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2J5dGVzL21vZC50c1wiO1xuICogY29uc3Qgc291cmNlID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDIsIDEsIDIsIDEsIDIsIDNdKTtcbiAqIGNvbnN0IG5lZWRsZSA9IG5ldyBVaW50OEFycmF5KFsxLCAyXSk7XG4gKiBjb25zb2xlLmxvZyhpbmRleE9mTmVlZGxlKHNvdXJjZSwgbmVlZGxlKSk7IC8vIDFcbiAqIGNvbnNvbGUubG9nKGluZGV4T2ZOZWVkbGUoc291cmNlLCBuZWVkbGUsIDIpKTsgLy8gM1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmRleE9mTmVlZGxlKFxuICBzb3VyY2U6IFVpbnQ4QXJyYXksXG4gIG5lZWRsZTogVWludDhBcnJheSxcbiAgc3RhcnQgPSAwLFxuKTogbnVtYmVyIHtcbiAgaWYgKHN0YXJ0ID49IHNvdXJjZS5sZW5ndGgpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gTWF0aC5tYXgoMCwgc291cmNlLmxlbmd0aCArIHN0YXJ0KTtcbiAgfVxuICBjb25zdCBzID0gbmVlZGxlWzBdO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBzb3VyY2UubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc291cmNlW2ldICE9PSBzKSBjb250aW51ZTtcbiAgICBjb25zdCBwaW4gPSBpO1xuICAgIGxldCBtYXRjaGVkID0gMTtcbiAgICBsZXQgaiA9IGk7XG4gICAgd2hpbGUgKG1hdGNoZWQgPCBuZWVkbGUubGVuZ3RoKSB7XG4gICAgICBqKys7XG4gICAgICBpZiAoc291cmNlW2pdICE9PSBuZWVkbGVbaiAtIHBpbl0pIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBtYXRjaGVkKys7XG4gICAgfVxuICAgIGlmIChtYXRjaGVkID09PSBuZWVkbGUubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gcGluO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbGFzdCBvY2N1cnJlbmNlIG9mIHRoZSBuZWVkbGUgYXJyYXkgaW4gdGhlIHNvdXJjZVxuICogYXJyYXksIG9yIC0xIGlmIGl0IGlzIG5vdCBwcmVzZW50LlxuICpcbiAqIEEgc3RhcnQgaW5kZXggY2FuIGJlIHNwZWNpZmllZCBhcyB0aGUgdGhpcmQgYXJndW1lbnQgdGhhdCBiZWdpbnMgdGhlIHNlYXJjaFxuICogYXQgdGhhdCBnaXZlbiBpbmRleC4gVGhlIHN0YXJ0IGluZGV4IGRlZmF1bHRzIHRvIHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICpcbiAqIFRoZSBjb21wbGV4aXR5IG9mIHRoaXMgZnVuY3Rpb24gaXMgTyhzb3VyY2UubGVudGggKiBuZWVkbGUubGVuZ3RoKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgbGFzdEluZGV4T2ZOZWVkbGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9ieXRlcy9tb2QudHNcIjtcbiAqIGNvbnN0IHNvdXJjZSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyLCAxLCAyLCAxLCAyLCAzXSk7XG4gKiBjb25zdCBuZWVkbGUgPSBuZXcgVWludDhBcnJheShbMSwgMl0pO1xuICogY29uc29sZS5sb2cobGFzdEluZGV4T2ZOZWVkbGUoc291cmNlLCBuZWVkbGUpKTsgLy8gNVxuICogY29uc29sZS5sb2cobGFzdEluZGV4T2ZOZWVkbGUoc291cmNlLCBuZWVkbGUsIDQpKTsgLy8gM1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXN0SW5kZXhPZk5lZWRsZShcbiAgc291cmNlOiBVaW50OEFycmF5LFxuICBuZWVkbGU6IFVpbnQ4QXJyYXksXG4gIHN0YXJ0ID0gc291cmNlLmxlbmd0aCAtIDEsXG4pOiBudW1iZXIge1xuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChzdGFydCA+PSBzb3VyY2UubGVuZ3RoKSB7XG4gICAgc3RhcnQgPSBzb3VyY2UubGVuZ3RoIC0gMTtcbiAgfVxuICBjb25zdCBlID0gbmVlZGxlW25lZWRsZS5sZW5ndGggLSAxXTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpID49IDA7IGktLSkge1xuICAgIGlmIChzb3VyY2VbaV0gIT09IGUpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBpbiA9IGk7XG4gICAgbGV0IG1hdGNoZWQgPSAxO1xuICAgIGxldCBqID0gaTtcbiAgICB3aGlsZSAobWF0Y2hlZCA8IG5lZWRsZS5sZW5ndGgpIHtcbiAgICAgIGotLTtcbiAgICAgIGlmIChzb3VyY2Vbal0gIT09IG5lZWRsZVtuZWVkbGUubGVuZ3RoIC0gMSAtIChwaW4gLSBqKV0pIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBtYXRjaGVkKys7XG4gICAgfVxuICAgIGlmIChtYXRjaGVkID09PSBuZWVkbGUubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gcGluIC0gbmVlZGxlLmxlbmd0aCArIDE7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgcHJlZml4IGFycmF5IGFwcGVhcnMgYXQgdGhlIHN0YXJ0IG9mIHRoZSBzb3VyY2UgYXJyYXksXG4gKiBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogVGhlIGNvbXBsZXhpdHkgb2YgdGhpcyBmdW5jdGlvbiBpcyBPKHByZWZpeC5sZW5ndGgpLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBzdGFydHNXaXRoIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYnl0ZXMvbW9kLnRzXCI7XG4gKiBjb25zdCBzb3VyY2UgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMiwgMSwgMiwgMSwgMiwgM10pO1xuICogY29uc3QgcHJlZml4ID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDJdKTtcbiAqIGNvbnNvbGUubG9nKHN0YXJ0c1dpdGgoc291cmNlLCBwcmVmaXgpKTsgLy8gdHJ1ZVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFydHNXaXRoKHNvdXJjZTogVWludDhBcnJheSwgcHJlZml4OiBVaW50OEFycmF5KTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwLCBtYXggPSBwcmVmaXgubGVuZ3RoOyBpIDwgbWF4OyBpKyspIHtcbiAgICBpZiAoc291cmNlW2ldICE9PSBwcmVmaXhbaV0pIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgc3VmZml4IGFycmF5IGFwcGVhcnMgYXQgdGhlIGVuZCBvZiB0aGUgc291cmNlIGFycmF5LFxuICogZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIFRoZSBjb21wbGV4aXR5IG9mIHRoaXMgZnVuY3Rpb24gaXMgTyhzdWZmaXgubGVuZ3RoKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgZW5kc1dpdGggfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9ieXRlcy9tb2QudHNcIjtcbiAqIGNvbnN0IHNvdXJjZSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyLCAxLCAyLCAxLCAyLCAzXSk7XG4gKiBjb25zdCBzdWZmaXggPSBuZXcgVWludDhBcnJheShbMSwgMiwgM10pO1xuICogY29uc29sZS5sb2coZW5kc1dpdGgoc291cmNlLCBzdWZmaXgpKTsgLy8gdHJ1ZVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmRzV2l0aChzb3VyY2U6IFVpbnQ4QXJyYXksIHN1ZmZpeDogVWludDhBcnJheSk6IGJvb2xlYW4ge1xuICBmb3IgKFxuICAgIGxldCBzcmNpID0gc291cmNlLmxlbmd0aCAtIDEsIHNmeGkgPSBzdWZmaXgubGVuZ3RoIC0gMTtcbiAgICBzZnhpID49IDA7XG4gICAgc3JjaS0tLCBzZnhpLS1cbiAgKSB7XG4gICAgaWYgKHNvdXJjZVtzcmNpXSAhPT0gc3VmZml4W3NmeGldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBSZXR1cm5zIGEgbmV3IFVpbnQ4QXJyYXkgY29tcG9zZWQgb2YgYGNvdW50YCByZXBldGl0aW9ucyBvZiB0aGUgYHNvdXJjZWBcbiAqIGFycmF5LlxuICpcbiAqIElmIGBjb3VudGAgaXMgbmVnYXRpdmUsIGEgYFJhbmdlRXJyb3JgIGlzIHRocm93bi5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgcmVwZWF0IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYnl0ZXMvbW9kLnRzXCI7XG4gKiBjb25zdCBzb3VyY2UgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMl0pO1xuICogY29uc29sZS5sb2cocmVwZWF0KHNvdXJjZSwgMykpOyAvLyBbMCwgMSwgMiwgMCwgMSwgMiwgMCwgMSwgMl1cbiAqIGNvbnNvbGUubG9nKHJlcGVhdChzb3VyY2UsIDApKTsgLy8gW11cbiAqIGNvbnNvbGUubG9nKHJlcGVhdChzb3VyY2UsIC0xKSk7IC8vIFJhbmdlRXJyb3JcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVwZWF0KHNvdXJjZTogVWludDhBcnJheSwgY291bnQ6IG51bWJlcik6IFVpbnQ4QXJyYXkge1xuICBpZiAoY291bnQgPT09IDApIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoKTtcbiAgfVxuXG4gIGlmIChjb3VudCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcImJ5dGVzOiBuZWdhdGl2ZSByZXBlYXQgY291bnRcIik7XG4gIH0gZWxzZSBpZiAoKHNvdXJjZS5sZW5ndGggKiBjb3VudCkgLyBjb3VudCAhPT0gc291cmNlLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImJ5dGVzOiByZXBlYXQgY291bnQgY2F1c2VzIG92ZXJmbG93XCIpO1xuICB9XG5cbiAgY29uc3QgaW50ID0gTWF0aC5mbG9vcihjb3VudCk7XG5cbiAgaWYgKGludCAhPT0gY291bnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJieXRlczogcmVwZWF0IGNvdW50IG11c3QgYmUgYW4gaW50ZWdlclwiKTtcbiAgfVxuXG4gIGNvbnN0IG5iID0gbmV3IFVpbnQ4QXJyYXkoc291cmNlLmxlbmd0aCAqIGNvdW50KTtcblxuICBsZXQgYnAgPSBjb3B5KHNvdXJjZSwgbmIpO1xuXG4gIGZvciAoOyBicCA8IG5iLmxlbmd0aDsgYnAgKj0gMikge1xuICAgIGNvcHkobmIuc2xpY2UoMCwgYnApLCBuYiwgYnApO1xuICB9XG5cbiAgcmV0dXJuIG5iO1xufVxuXG4vKiogQ29uY2F0ZW5hdGUgdGhlIGdpdmVuIGFycmF5cyBpbnRvIGEgbmV3IFVpbnQ4QXJyYXkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNvbmNhdCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2J5dGVzL21vZC50c1wiO1xuICogY29uc3QgYSA9IG5ldyBVaW50OEFycmF5KFswLCAxLCAyXSk7XG4gKiBjb25zdCBiID0gbmV3IFVpbnQ4QXJyYXkoWzMsIDQsIDVdKTtcbiAqIGNvbnNvbGUubG9nKGNvbmNhdChhLCBiKSk7IC8vIFswLCAxLCAyLCAzLCA0LCA1XVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uY2F0KC4uLmJ1ZjogVWludDhBcnJheVtdKTogVWludDhBcnJheSB7XG4gIGxldCBsZW5ndGggPSAwO1xuICBmb3IgKGNvbnN0IGIgb2YgYnVmKSB7XG4gICAgbGVuZ3RoICs9IGIubGVuZ3RoO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgbGV0IGluZGV4ID0gMDtcbiAgZm9yIChjb25zdCBiIG9mIGJ1Zikge1xuICAgIG91dHB1dC5zZXQoYiwgaW5kZXgpO1xuICAgIGluZGV4ICs9IGIubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqIFJldHVybnMgdHJ1ZSBpZiB0aGUgc291cmNlIGFycmF5IGNvbnRhaW5zIHRoZSBuZWVkbGUgYXJyYXksIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBBIHN0YXJ0IGluZGV4IGNhbiBiZSBzcGVjaWZpZWQgYXMgdGhlIHRoaXJkIGFyZ3VtZW50IHRoYXQgYmVnaW5zIHRoZSBzZWFyY2hcbiAqIGF0IHRoYXQgZ2l2ZW4gaW5kZXguIFRoZSBzdGFydCBpbmRleCBkZWZhdWx0cyB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheS5cbiAqXG4gKiBUaGUgY29tcGxleGl0eSBvZiB0aGlzIGZ1bmN0aW9uIGlzIE8oc291cmNlLmxlbmd0aCAqIG5lZWRsZS5sZW5ndGgpLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBpbmNsdWRlc05lZWRsZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2J5dGVzL21vZC50c1wiO1xuICogY29uc3Qgc291cmNlID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDEsIDIsIDEsIDIsIDEsIDIsIDNdKTtcbiAqIGNvbnN0IG5lZWRsZSA9IG5ldyBVaW50OEFycmF5KFsxLCAyXSk7XG4gKiBjb25zb2xlLmxvZyhpbmNsdWRlc05lZWRsZShzb3VyY2UsIG5lZWRsZSkpOyAvLyB0cnVlXG4gKiBjb25zb2xlLmxvZyhpbmNsdWRlc05lZWRsZShzb3VyY2UsIG5lZWRsZSwgNikpOyAvLyBmYWxzZVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmNsdWRlc05lZWRsZShcbiAgc291cmNlOiBVaW50OEFycmF5LFxuICBuZWVkbGU6IFVpbnQ4QXJyYXksXG4gIHN0YXJ0ID0gMCxcbik6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5kZXhPZk5lZWRsZShzb3VyY2UsIG5lZWRsZSwgc3RhcnQpICE9PSAtMTtcbn1cblxuLyoqIENvcHkgYnl0ZXMgZnJvbSB0aGUgYHNyY2AgYXJyYXkgdG8gdGhlIGBkc3RgIGFycmF5LiBSZXR1cm5zIHRoZSBudW1iZXIgb2ZcbiAqIGJ5dGVzIGNvcGllZC5cbiAqXG4gKiBJZiB0aGUgYHNyY2AgYXJyYXkgaXMgbGFyZ2VyIHRoYW4gd2hhdCB0aGUgYGRzdGAgYXJyYXkgY2FuIGhvbGQsIG9ubHkgdGhlXG4gKiBhbW91bnQgb2YgYnl0ZXMgdGhhdCBmaXQgaW4gdGhlIGBkc3RgIGFycmF5IGFyZSBjb3BpZWQuXG4gKlxuICogQW4gb2Zmc2V0IGNhbiBiZSBzcGVjaWZpZWQgYXMgdGhlIHRoaXJkIGFyZ3VtZW50IHRoYXQgYmVnaW5zIHRoZSBjb3B5IGF0XG4gKiB0aGF0IGdpdmVuIGluZGV4IGluIHRoZSBgZHN0YCBhcnJheS4gVGhlIG9mZnNldCBkZWZhdWx0cyB0byB0aGUgYmVnaW5uaW5nIG9mXG4gKiB0aGUgYXJyYXkuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGNvcHkgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9ieXRlcy9tb2QudHNcIjtcbiAqIGNvbnN0IHNyYyA9IG5ldyBVaW50OEFycmF5KFs5LCA4LCA3XSk7XG4gKiBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheShbMCwgMSwgMiwgMywgNCwgNV0pO1xuICogY29uc29sZS5sb2coY29weShzcmMsIGRzdCkpOyAvLyAzXG4gKiBjb25zb2xlLmxvZyhkc3QpOyAvLyBbOSwgOCwgNywgMywgNCwgNV1cbiAqIGBgYFxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBjb3B5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYnl0ZXMvbW9kLnRzXCI7XG4gKiBjb25zdCBzcmMgPSBuZXcgVWludDhBcnJheShbMSwgMSwgMSwgMV0pO1xuICogY29uc3QgZHN0ID0gbmV3IFVpbnQ4QXJyYXkoWzAsIDAsIDAsIDBdKTtcbiAqIGNvbnNvbGUubG9nKGNvcHkoc3JjLCBkc3QsIDEpKTsgLy8gM1xuICogY29uc29sZS5sb2coZHN0KTsgLy8gWzAsIDEsIDEsIDFdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvcHkoc3JjOiBVaW50OEFycmF5LCBkc3Q6IFVpbnQ4QXJyYXksIG9mZiA9IDApOiBudW1iZXIge1xuICBvZmYgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihvZmYsIGRzdC5ieXRlTGVuZ3RoKSk7XG4gIGNvbnN0IGRzdEJ5dGVzQXZhaWxhYmxlID0gZHN0LmJ5dGVMZW5ndGggLSBvZmY7XG4gIGlmIChzcmMuYnl0ZUxlbmd0aCA+IGRzdEJ5dGVzQXZhaWxhYmxlKSB7XG4gICAgc3JjID0gc3JjLnN1YmFycmF5KDAsIGRzdEJ5dGVzQXZhaWxhYmxlKTtcbiAgfVxuICBkc3Quc2V0KHNyYywgb2ZmKTtcbiAgcmV0dXJuIHNyYy5ieXRlTGVuZ3RoO1xufVxuXG5leHBvcnQgeyBlcXVhbHMgfSBmcm9tIFwiLi9lcXVhbHMudHNcIjtcbiJdfQ==