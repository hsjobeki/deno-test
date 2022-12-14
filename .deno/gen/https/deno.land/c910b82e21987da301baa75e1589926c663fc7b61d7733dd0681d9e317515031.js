import { kKeyObject } from "./constants.ts";
export const kKeyType = Symbol("kKeyType");
export function isKeyObject(obj) {
    return (obj != null && obj[kKeyType] !== undefined);
}
export function isCryptoKey(obj) {
    return (obj != null && obj[kKeyObject] !== undefined);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2tleXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfa2V5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFNUMsTUFBTSxDQUFDLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUUzQyxNQUFNLFVBQVUsV0FBVyxDQUFDLEdBQVk7SUFDdEMsT0FBTyxDQUNMLEdBQUcsSUFBSSxJQUFJLElBQUssR0FBK0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxTQUFTLENBQ3hFLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxHQUFZO0lBQ3RDLE9BQU8sQ0FDTCxHQUFHLElBQUksSUFBSSxJQUFLLEdBQStCLENBQUMsVUFBVSxDQUFDLEtBQUssU0FBUyxDQUMxRSxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIyLTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBrS2V5T2JqZWN0IH0gZnJvbSBcIi4vY29uc3RhbnRzLnRzXCI7XG5cbmV4cG9ydCBjb25zdCBrS2V5VHlwZSA9IFN5bWJvbChcImtLZXlUeXBlXCIpO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNLZXlPYmplY3Qob2JqOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgb2JqICE9IG51bGwgJiYgKG9iaiBhcyBSZWNvcmQ8c3ltYm9sLCB1bmtub3duPilba0tleVR5cGVdICE9PSB1bmRlZmluZWRcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ3J5cHRvS2V5KG9iajogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIG9iaiAhPSBudWxsICYmIChvYmogYXMgUmVjb3JkPHN5bWJvbCwgdW5rbm93bj4pW2tLZXlPYmplY3RdICE9PSB1bmRlZmluZWRcbiAgKTtcbn1cbiJdfQ==