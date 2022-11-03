class Queue {
    #source;
    #queue;
    head;
    done;
    constructor(iterable) {
        this.#source = iterable[Symbol.asyncIterator]();
        this.#queue = {
            value: undefined,
            next: undefined,
        };
        this.head = this.#queue;
        this.done = false;
    }
    async next() {
        const result = await this.#source.next();
        if (!result.done) {
            const nextNode = {
                value: result.value,
                next: undefined,
            };
            this.#queue.next = nextNode;
            this.#queue = nextNode;
        }
        else {
            this.done = true;
        }
    }
}
export function tee(iterable, n = 2) {
    const queue = new Queue(iterable);
    async function* generator() {
        let buffer = queue.head;
        while (true) {
            if (buffer.next) {
                buffer = buffer.next;
                yield buffer.value;
            }
            else if (queue.done) {
                return;
            }
            else {
                await queue.next();
            }
        }
    }
    const branches = Array.from({ length: n }).map(() => generator());
    return branches;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWdCQSxNQUFNLEtBQUs7SUFDVCxPQUFPLENBQW1CO0lBQzFCLE1BQU0sQ0FBZTtJQUNyQixJQUFJLENBQWU7SUFFbkIsSUFBSSxDQUFVO0lBRWQsWUFBWSxRQUEwQjtRQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNoRCxJQUFJLENBQUMsTUFBTSxHQUFHO1lBQ1osS0FBSyxFQUFFLFNBQVU7WUFDakIsSUFBSSxFQUFFLFNBQVM7U0FDaEIsQ0FBQztRQUNGLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN4QixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUk7UUFDUixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxRQUFRLEdBQWlCO2dCQUM3QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7Z0JBQ25CLElBQUksRUFBRSxTQUFTO2FBQ2hCLENBQUM7WUFDRixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7WUFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7U0FDeEI7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQztDQUNGO0FBMkJELE1BQU0sVUFBVSxHQUFHLENBQ2pCLFFBQTBCLEVBQzFCLElBQU8sQ0FBTTtJQUViLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFJLFFBQVEsQ0FBQyxDQUFDO0lBRXJDLEtBQUssU0FBUyxDQUFDLENBQUMsU0FBUztRQUN2QixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1FBQ3hCLE9BQU8sSUFBSSxFQUFFO1lBQ1gsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUNmLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNyQixNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUM7YUFDcEI7aUJBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNyQixPQUFPO2FBQ1I7aUJBQU07Z0JBQ0wsTUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDcEI7U0FDRjtJQUNILENBQUM7SUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUM1QyxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FJbEIsQ0FBQztJQUNGLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG4vLyBVdGlsaXR5IGZvciByZXByZXNlbnRpbmcgbi10dXBsZVxudHlwZSBUdXBsZTxULCBOIGV4dGVuZHMgbnVtYmVyPiA9IE4gZXh0ZW5kcyBOXG4gID8gbnVtYmVyIGV4dGVuZHMgTiA/IFRbXSA6IFR1cGxlT2Y8VCwgTiwgW10+XG4gIDogbmV2ZXI7XG50eXBlIFR1cGxlT2Y8VCwgTiBleHRlbmRzIG51bWJlciwgUiBleHRlbmRzIHVua25vd25bXT4gPSBSW1wibGVuZ3RoXCJdIGV4dGVuZHMgTlxuICA/IFJcbiAgOiBUdXBsZU9mPFQsIE4sIFtULCAuLi5SXT47XG5cbmludGVyZmFjZSBRdWV1ZU5vZGU8VD4ge1xuICB2YWx1ZTogVDtcbiAgbmV4dDogUXVldWVOb2RlPFQ+IHwgdW5kZWZpbmVkO1xufVxuXG5jbGFzcyBRdWV1ZTxUPiB7XG4gICNzb3VyY2U6IEFzeW5jSXRlcmF0b3I8VD47XG4gICNxdWV1ZTogUXVldWVOb2RlPFQ+O1xuICBoZWFkOiBRdWV1ZU5vZGU8VD47XG5cbiAgZG9uZTogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihpdGVyYWJsZTogQXN5bmNJdGVyYWJsZTxUPikge1xuICAgIHRoaXMuI3NvdXJjZSA9IGl0ZXJhYmxlW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpO1xuICAgIHRoaXMuI3F1ZXVlID0ge1xuICAgICAgdmFsdWU6IHVuZGVmaW5lZCEsXG4gICAgICBuZXh0OiB1bmRlZmluZWQsXG4gICAgfTtcbiAgICB0aGlzLmhlYWQgPSB0aGlzLiNxdWV1ZTtcbiAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIG5leHQoKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy4jc291cmNlLm5leHQoKTtcbiAgICBpZiAoIXJlc3VsdC5kb25lKSB7XG4gICAgICBjb25zdCBuZXh0Tm9kZTogUXVldWVOb2RlPFQ+ID0ge1xuICAgICAgICB2YWx1ZTogcmVzdWx0LnZhbHVlLFxuICAgICAgICBuZXh0OiB1bmRlZmluZWQsXG4gICAgICB9O1xuICAgICAgdGhpcy4jcXVldWUubmV4dCA9IG5leHROb2RlO1xuICAgICAgdGhpcy4jcXVldWUgPSBuZXh0Tm9kZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCcmFuY2hlcyB0aGUgZ2l2ZW4gYXN5bmMgaXRlcmFibGUgaW50byB0aGUgbiBicmFuY2hlcy5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYHRzXG4gKiAgICAgaW1wb3J0IHsgdGVlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vYXN5bmMvdGVlLnRzXCI7XG4gKlxuICogICAgIGNvbnN0IGdlbiA9IGFzeW5jIGZ1bmN0aW9uKiBnZW4oKSB7XG4gKiAgICAgICB5aWVsZCAxO1xuICogICAgICAgeWllbGQgMjtcbiAqICAgICAgIHlpZWxkIDM7XG4gKiAgICAgfVxuICpcbiAqICAgICBjb25zdCBbYnJhbmNoMSwgYnJhbmNoMl0gPSB0ZWUoZ2VuKCkpO1xuICpcbiAqICAgICBmb3IgYXdhaXQgKGNvbnN0IG4gb2YgYnJhbmNoMSkge1xuICogICAgICAgY29uc29sZS5sb2cobik7IC8vID0+IDEsIDIsIDNcbiAqICAgICB9XG4gKlxuICogICAgIGZvciBhd2FpdCAoY29uc3QgbiBvZiBicmFuY2gyKSB7XG4gKiAgICAgICBjb25zb2xlLmxvZyhuKTsgLy8gPT4gMSwgMiwgM1xuICogICAgIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVlPFQsIE4gZXh0ZW5kcyBudW1iZXIgPSAyPihcbiAgaXRlcmFibGU6IEFzeW5jSXRlcmFibGU8VD4sXG4gIG46IE4gPSAyIGFzIE4sXG4pOiBUdXBsZTxBc3luY0l0ZXJhYmxlPFQ+LCBOPiB7XG4gIGNvbnN0IHF1ZXVlID0gbmV3IFF1ZXVlPFQ+KGl0ZXJhYmxlKTtcblxuICBhc3luYyBmdW5jdGlvbiogZ2VuZXJhdG9yKCk6IEFzeW5jR2VuZXJhdG9yPFQ+IHtcbiAgICBsZXQgYnVmZmVyID0gcXVldWUuaGVhZDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGJ1ZmZlci5uZXh0KSB7XG4gICAgICAgIGJ1ZmZlciA9IGJ1ZmZlci5uZXh0O1xuICAgICAgICB5aWVsZCBidWZmZXIudmFsdWU7XG4gICAgICB9IGVsc2UgaWYgKHF1ZXVlLmRvbmUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgcXVldWUubmV4dCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGJyYW5jaGVzID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogbiB9KS5tYXAoXG4gICAgKCkgPT4gZ2VuZXJhdG9yKCksXG4gICkgYXMgVHVwbGU8XG4gICAgQXN5bmNJdGVyYWJsZTxUPixcbiAgICBOXG4gID47XG4gIHJldHVybiBicmFuY2hlcztcbn1cbiJdfQ==