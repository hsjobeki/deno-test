import { Buffer } from "../buffer.ts";
import { timingSafeEqual as stdTimingSafeEqual } from "../../crypto/timing_safe_equal.ts";
export const timingSafeEqual = (a, b) => {
    if (a instanceof Buffer)
        a = new DataView(a.buffer);
    if (a instanceof Buffer)
        b = new DataView(a.buffer);
    return stdTimingSafeEqual(a, b);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3RpbWluZ1NhZmVFcXVhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIl90aW1pbmdTYWZlRXF1YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQUUsZUFBZSxJQUFJLGtCQUFrQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFFMUYsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHLENBQzdCLENBQWtDLEVBQ2xDLENBQWtDLEVBQ3pCLEVBQUU7SUFDWCxJQUFJLENBQUMsWUFBWSxNQUFNO1FBQUUsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwRCxJQUFJLENBQUMsWUFBWSxNQUFNO1FBQUUsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwRCxPQUFPLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4uL2J1ZmZlci50c1wiO1xuaW1wb3J0IHsgdGltaW5nU2FmZUVxdWFsIGFzIHN0ZFRpbWluZ1NhZmVFcXVhbCB9IGZyb20gXCIuLi8uLi9jcnlwdG8vdGltaW5nX3NhZmVfZXF1YWwudHNcIjtcblxuZXhwb3J0IGNvbnN0IHRpbWluZ1NhZmVFcXVhbCA9IChcbiAgYTogQnVmZmVyIHwgRGF0YVZpZXcgfCBBcnJheUJ1ZmZlcixcbiAgYjogQnVmZmVyIHwgRGF0YVZpZXcgfCBBcnJheUJ1ZmZlcixcbik6IGJvb2xlYW4gPT4ge1xuICBpZiAoYSBpbnN0YW5jZW9mIEJ1ZmZlcikgYSA9IG5ldyBEYXRhVmlldyhhLmJ1ZmZlcik7XG4gIGlmIChhIGluc3RhbmNlb2YgQnVmZmVyKSBiID0gbmV3IERhdGFWaWV3KGEuYnVmZmVyKTtcbiAgcmV0dXJuIHN0ZFRpbWluZ1NhZmVFcXVhbChhLCBiKTtcbn07XG4iXX0=