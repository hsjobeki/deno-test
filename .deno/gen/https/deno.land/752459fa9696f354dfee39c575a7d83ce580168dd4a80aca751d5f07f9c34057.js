import { notImplemented } from "../_utils.ts";
export function guessHandleType(_fd) {
    notImplemented("util.guessHandleType");
}
export const ALL_PROPERTIES = 0;
export const ONLY_WRITABLE = 1;
export const ONLY_ENUMERABLE = 2;
export const ONLY_CONFIGURABLE = 4;
export const ONLY_ENUM_WRITABLE = 6;
export const SKIP_STRINGS = 8;
export const SKIP_SYMBOLS = 16;
const isNumericLookup = {};
export function isArrayIndex(value) {
    switch (typeof value) {
        case "number":
            return value >= 0 && (value | 0) === value;
        case "string": {
            const result = isNumericLookup[value];
            if (result !== void 0) {
                return result;
            }
            const length = value.length;
            if (length === 0) {
                return isNumericLookup[value] = false;
            }
            let ch = 0;
            let i = 0;
            for (; i < length; ++i) {
                ch = value.charCodeAt(i);
                if (i === 0 && ch === 0x30 && length > 1 ||
                    ch < 0x30 || ch > 0x39) {
                    return isNumericLookup[value] = false;
                }
            }
            return isNumericLookup[value] = true;
        }
        default:
            return false;
    }
}
export function getOwnNonIndexProperties(obj, filter) {
    let allProperties = [
        ...Object.getOwnPropertyNames(obj),
        ...Object.getOwnPropertySymbols(obj),
    ];
    if (Array.isArray(obj)) {
        allProperties = allProperties.filter((k) => !isArrayIndex(k));
    }
    if (filter === ALL_PROPERTIES) {
        return allProperties;
    }
    const result = [];
    for (const key of allProperties) {
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        if (desc === undefined) {
            continue;
        }
        if (filter & ONLY_WRITABLE && !desc.writable) {
            continue;
        }
        if (filter & ONLY_ENUMERABLE && !desc.enumerable) {
            continue;
        }
        if (filter & ONLY_CONFIGURABLE && !desc.configurable) {
            continue;
        }
        if (filter & SKIP_STRINGS && typeof key === "string") {
            continue;
        }
        if (filter & SKIP_SYMBOLS && typeof key === "symbol") {
            continue;
        }
        result.push(key);
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBMkJBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFOUMsTUFBTSxVQUFVLGVBQWUsQ0FBQyxHQUFXO0lBQ3pDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDL0IsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQztBQUNqQyxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFDbkMsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDOUIsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztBQVkvQixNQUFNLGVBQWUsR0FBNEIsRUFBRSxDQUFDO0FBQ3BELE1BQU0sVUFBVSxZQUFZLENBQUMsS0FBYztJQUN6QyxRQUFRLE9BQU8sS0FBSyxFQUFFO1FBQ3BCLEtBQUssUUFBUTtZQUNYLE9BQU8sS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUM7UUFDN0MsS0FBSyxRQUFRLENBQUMsQ0FBQztZQUNiLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxJQUFJLE1BQU0sS0FBSyxLQUFLLENBQUMsRUFBRTtnQkFDckIsT0FBTyxNQUFNLENBQUM7YUFDZjtZQUNELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDNUIsSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNoQixPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7YUFDdkM7WUFDRCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDWCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixPQUFPLENBQUMsR0FBRyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RCLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixJQUNFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQztvQkFDcEMsRUFBRSxHQUFHLElBQUksSUFBWSxFQUFFLEdBQUcsSUFBSSxFQUM5QjtvQkFDQSxPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7aUJBQ3ZDO2FBQ0Y7WUFDRCxPQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDdEM7UUFDRDtZQUNFLE9BQU8sS0FBSyxDQUFDO0tBQ2hCO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FFdEMsR0FBVyxFQUNYLE1BQWM7SUFFZCxJQUFJLGFBQWEsR0FBRztRQUNsQixHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUM7UUFDbEMsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDO0tBQ3JDLENBQUM7SUFFRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDdEIsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0Q7SUFFRCxJQUFJLE1BQU0sS0FBSyxjQUFjLEVBQUU7UUFDN0IsT0FBTyxhQUFhLENBQUM7S0FDdEI7SUFFRCxNQUFNLE1BQU0sR0FBd0IsRUFBRSxDQUFDO0lBQ3ZDLEtBQUssTUFBTSxHQUFHLElBQUksYUFBYSxFQUFFO1FBQy9CLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkQsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO1lBQ3RCLFNBQVM7U0FDVjtRQUNELElBQUksTUFBTSxHQUFHLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDNUMsU0FBUztTQUNWO1FBQ0QsSUFBSSxNQUFNLEdBQUcsZUFBZSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNoRCxTQUFTO1NBQ1Y7UUFDRCxJQUFJLE1BQU0sR0FBRyxpQkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDcEQsU0FBUztTQUNWO1FBQ0QsSUFBSSxNQUFNLEdBQUcsWUFBWSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtZQUNwRCxTQUFTO1NBQ1Y7UUFDRCxJQUFJLE1BQU0sR0FBRyxZQUFZLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQ3BELFNBQVM7U0FDVjtRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDbEI7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyBUaGlzIG1vZHVsZSBwb3J0czpcbi8vIC0gaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2Jsb2IvbWFzdGVyL3NyYy91dGlsLWlubC5oXG4vLyAtIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL21hc3Rlci9zcmMvdXRpbC5jY1xuLy8gLSBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9tYXN0ZXIvc3JjL3V0aWwuaFxuXG5pbXBvcnQgeyBub3RJbXBsZW1lbnRlZCB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGd1ZXNzSGFuZGxlVHlwZShfZmQ6IG51bWJlcik6IHN0cmluZyB7XG4gIG5vdEltcGxlbWVudGVkKFwidXRpbC5ndWVzc0hhbmRsZVR5cGVcIik7XG59XG5cbmV4cG9ydCBjb25zdCBBTExfUFJPUEVSVElFUyA9IDA7XG5leHBvcnQgY29uc3QgT05MWV9XUklUQUJMRSA9IDE7XG5leHBvcnQgY29uc3QgT05MWV9FTlVNRVJBQkxFID0gMjtcbmV4cG9ydCBjb25zdCBPTkxZX0NPTkZJR1VSQUJMRSA9IDQ7XG5leHBvcnQgY29uc3QgT05MWV9FTlVNX1dSSVRBQkxFID0gNjtcbmV4cG9ydCBjb25zdCBTS0lQX1NUUklOR1MgPSA4O1xuZXhwb3J0IGNvbnN0IFNLSVBfU1lNQk9MUyA9IDE2O1xuXG4vKipcbiAqIEVmZmljaWVudGx5IGRldGVybWluZSB3aGV0aGVyIHRoZSBwcm92aWRlZCBwcm9wZXJ0eSBrZXkgaXMgbnVtZXJpY1xuICogKGFuZCB0aHVzIGNvdWxkIGJlIGFuIGFycmF5IGluZGV4ZXIpIG9yIG5vdC5cbiAqXG4gKiBBbHdheXMgcmV0dXJucyB0cnVlIGZvciB2YWx1ZXMgb2YgdHlwZSBgJ251bWJlcidgLlxuICpcbiAqIE90aGVyd2lzZSwgb25seSByZXR1cm5zIHRydWUgZm9yIHN0cmluZ3MgdGhhdCBjb25zaXN0IG9ubHkgb2YgcG9zaXRpdmUgaW50ZWdlcnMuXG4gKlxuICogUmVzdWx0cyBhcmUgY2FjaGVkLlxuICovXG5jb25zdCBpc051bWVyaWNMb29rdXA6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+ID0ge307XG5leHBvcnQgZnVuY3Rpb24gaXNBcnJheUluZGV4KHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgbnVtYmVyIHwgc3RyaW5nIHtcbiAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICByZXR1cm4gdmFsdWUgPj0gMCAmJiAodmFsdWUgfCAwKSA9PT0gdmFsdWU7XG4gICAgY2FzZSBcInN0cmluZ1wiOiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBpc051bWVyaWNMb29rdXBbdmFsdWVdO1xuICAgICAgaWYgKHJlc3VsdCAhPT0gdm9pZCAwKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBjb25zdCBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBpc051bWVyaWNMb29rdXBbdmFsdWVdID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBsZXQgY2ggPSAwO1xuICAgICAgbGV0IGkgPSAwO1xuICAgICAgZm9yICg7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICBjaCA9IHZhbHVlLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBpID09PSAwICYmIGNoID09PSAweDMwICYmIGxlbmd0aCA+IDEgLyogbXVzdCBub3Qgc3RhcnQgd2l0aCAwICovIHx8XG4gICAgICAgICAgY2ggPCAweDMwIC8qIDAgKi8gfHwgY2ggPiAweDM5IC8qIDkgKi9cbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIGlzTnVtZXJpY0xvb2t1cFt2YWx1ZV0gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGlzTnVtZXJpY0xvb2t1cFt2YWx1ZV0gPSB0cnVlO1xuICAgIH1cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPd25Ob25JbmRleFByb3BlcnRpZXMoXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG4gIG9iajogb2JqZWN0LFxuICBmaWx0ZXI6IG51bWJlcixcbik6IChzdHJpbmcgfCBzeW1ib2wpW10ge1xuICBsZXQgYWxsUHJvcGVydGllcyA9IFtcbiAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmopLFxuICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqKSxcbiAgXTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgYWxsUHJvcGVydGllcyA9IGFsbFByb3BlcnRpZXMuZmlsdGVyKChrKSA9PiAhaXNBcnJheUluZGV4KGspKTtcbiAgfVxuXG4gIGlmIChmaWx0ZXIgPT09IEFMTF9QUk9QRVJUSUVTKSB7XG4gICAgcmV0dXJuIGFsbFByb3BlcnRpZXM7XG4gIH1cblxuICBjb25zdCByZXN1bHQ6IChzdHJpbmcgfCBzeW1ib2wpW10gPSBbXTtcbiAgZm9yIChjb25zdCBrZXkgb2YgYWxsUHJvcGVydGllcykge1xuICAgIGNvbnN0IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5KTtcbiAgICBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGZpbHRlciAmIE9OTFlfV1JJVEFCTEUgJiYgIWRlc2Mud3JpdGFibGUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyICYgT05MWV9FTlVNRVJBQkxFICYmICFkZXNjLmVudW1lcmFibGUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyICYgT05MWV9DT05GSUdVUkFCTEUgJiYgIWRlc2MuY29uZmlndXJhYmxlKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGZpbHRlciAmIFNLSVBfU1RSSU5HUyAmJiB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGZpbHRlciAmIFNLSVBfU1lNQk9MUyAmJiB0eXBlb2Yga2V5ID09PSBcInN5bWJvbFwiKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIl19