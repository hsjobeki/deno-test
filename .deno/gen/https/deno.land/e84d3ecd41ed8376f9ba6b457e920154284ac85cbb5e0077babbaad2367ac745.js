export function delay(ms, options = {}) {
    const { signal, persistent } = options;
    if (signal?.aborted) {
        return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
    }
    return new Promise((resolve, reject) => {
        const abort = () => {
            clearTimeout(i);
            reject(new DOMException("Delay was aborted.", "AbortError"));
        };
        const done = () => {
            signal?.removeEventListener("abort", abort);
            resolve();
        };
        const i = setTimeout(done, ms);
        signal?.addEventListener("abort", abort, { once: true });
        if (persistent === false) {
            try {
                Deno.unrefTimer(i);
            }
            catch (error) {
                if (!(error instanceof ReferenceError)) {
                    throw error;
                }
                console.error("`persistent` option is only available in Deno");
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkZWxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVQSxNQUFNLFVBQVUsS0FBSyxDQUFDLEVBQVUsRUFBRSxVQUF3QixFQUFFO0lBQzFELE1BQU0sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBQ3ZDLElBQUksTUFBTSxFQUFFLE9BQU8sRUFBRTtRQUNuQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsb0JBQW9CLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztLQUM3RTtJQUNELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsTUFBTSxLQUFLLEdBQUcsR0FBRyxFQUFFO1lBQ2pCLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsb0JBQW9CLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUM7UUFDRixNQUFNLElBQUksR0FBRyxHQUFHLEVBQUU7WUFDaEIsTUFBTSxFQUFFLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUMsQ0FBQztRQUNGLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDL0IsTUFBTSxFQUFFLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN6RCxJQUFJLFVBQVUsS0FBSyxLQUFLLEVBQUU7WUFDeEIsSUFBSTtnQkFFRixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BCO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLENBQUMsS0FBSyxZQUFZLGNBQWMsQ0FBQyxFQUFFO29CQUN0QyxNQUFNLEtBQUssQ0FBQztpQkFDYjtnQkFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7YUFDaEU7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVsYXlPcHRpb25zIHtcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gIC8qKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgcHJvY2VzcyBzaG91bGQgY29udGludWUgdG8gcnVuIGFzIGxvbmcgYXMgdGhlIHRpbWVyIGV4aXN0cy4gVGhpcyBpcyBgdHJ1ZWAgYnkgZGVmYXVsdC4gKi9cbiAgcGVyc2lzdGVudD86IGJvb2xlYW47XG59XG5cbi8qIFJlc29sdmVzIGFmdGVyIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGF5KG1zOiBudW1iZXIsIG9wdGlvbnM6IERlbGF5T3B0aW9ucyA9IHt9KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHsgc2lnbmFsLCBwZXJzaXN0ZW50IH0gPSBvcHRpb25zO1xuICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBET01FeGNlcHRpb24oXCJEZWxheSB3YXMgYWJvcnRlZC5cIiwgXCJBYm9ydEVycm9yXCIpKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGFib3J0ID0gKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KGkpO1xuICAgICAgcmVqZWN0KG5ldyBET01FeGNlcHRpb24oXCJEZWxheSB3YXMgYWJvcnRlZC5cIiwgXCJBYm9ydEVycm9yXCIpKTtcbiAgICB9O1xuICAgIGNvbnN0IGRvbmUgPSAoKSA9PiB7XG4gICAgICBzaWduYWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfTtcbiAgICBjb25zdCBpID0gc2V0VGltZW91dChkb25lLCBtcyk7XG4gICAgc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgYWJvcnQsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICBpZiAocGVyc2lzdGVudCA9PT0gZmFsc2UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgRm9yIGJyb3dzZXIgY29tcGF0aWJpbGl0eVxuICAgICAgICBEZW5vLnVucmVmVGltZXIoaSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIFJlZmVyZW5jZUVycm9yKSkge1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJgcGVyc2lzdGVudGAgb3B0aW9uIGlzIG9ubHkgYXZhaWxhYmxlIGluIERlbm9cIik7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==