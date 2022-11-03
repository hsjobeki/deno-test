import { Buffer } from "../../buffer.ts";
import { pbkdf2Sync as pbkdf2 } from "./pbkdf2.ts";
const fixOpts = (opts) => {
    const out = { N: 16384, p: 1, r: 8, maxmem: 32 << 20 };
    if (!opts)
        return out;
    if (opts.N)
        out.N = opts.N;
    else if (opts.cost)
        out.N = opts.cost;
    if (opts.p)
        out.p = opts.p;
    else if (opts.parallelization)
        out.p = opts.parallelization;
    if (opts.r)
        out.r = opts.r;
    else if (opts.blockSize)
        out.r = opts.blockSize;
    if (opts.maxmem)
        out.maxmem = opts.maxmem;
    return out;
};
function blockxor(S, Si, D, Di, len) {
    let i = -1;
    while (++i < len)
        D[Di + i] ^= S[Si + i];
}
function arraycopy(src, srcPos, dest, destPos, length) {
    src.copy(dest, destPos, srcPos, srcPos + length);
}
const R = (a, b) => (a << b) | (a >>> (32 - b));
class ScryptRom {
    B;
    r;
    N;
    p;
    XY;
    V;
    B32;
    x;
    _X;
    constructor(b, r, N, p) {
        this.B = b;
        this.r = r;
        this.N = N;
        this.p = p;
        this.XY = Buffer.allocUnsafe(256 * r);
        this.V = Buffer.allocUnsafe(128 * r * N);
        this.B32 = new Int32Array(16);
        this.x = new Int32Array(16);
        this._X = Buffer.allocUnsafe(64);
    }
    run() {
        const p = this.p | 0;
        const r = this.r | 0;
        for (let i = 0; i < p; i++)
            this.scryptROMix(i, r);
        return this.B;
    }
    scryptROMix(i, r) {
        const blockStart = i * 128 * r;
        const offset = (2 * r - 1) * 64;
        const blockLen = 128 * r;
        const B = this.B;
        const N = this.N | 0;
        const V = this.V;
        const XY = this.XY;
        B.copy(XY, 0, blockStart, blockStart + blockLen);
        for (let i1 = 0; i1 < N; i1++) {
            XY.copy(V, i1 * blockLen, 0, blockLen);
            this.blockmix_salsa8(blockLen);
        }
        let j;
        for (let i2 = 0; i2 < N; i2++) {
            j = XY.readUInt32LE(offset) & (N - 1);
            blockxor(V, j * blockLen, XY, 0, blockLen);
            this.blockmix_salsa8(blockLen);
        }
        XY.copy(B, blockStart, 0, blockLen);
    }
    blockmix_salsa8(blockLen) {
        const BY = this.XY;
        const r = this.r;
        const _X = this._X;
        arraycopy(BY, (2 * r - 1) * 64, _X, 0, 64);
        let i;
        for (i = 0; i < 2 * r; i++) {
            blockxor(BY, i * 64, _X, 0, 64);
            this.salsa20_8();
            arraycopy(_X, 0, BY, blockLen + i * 64, 64);
        }
        for (i = 0; i < r; i++) {
            arraycopy(BY, blockLen + i * 2 * 64, BY, i * 64, 64);
            arraycopy(BY, blockLen + (i * 2 + 1) * 64, BY, (i + r) * 64, 64);
        }
    }
    salsa20_8() {
        const B32 = this.B32;
        const B = this._X;
        const x = this.x;
        let i;
        for (i = 0; i < 16; i++) {
            B32[i] = (B[i * 4 + 0] & 0xff) << 0;
            B32[i] |= (B[i * 4 + 1] & 0xff) << 8;
            B32[i] |= (B[i * 4 + 2] & 0xff) << 16;
            B32[i] |= (B[i * 4 + 3] & 0xff) << 24;
        }
        for (i = 0; i < 16; i++)
            x[i] = B32[i];
        for (i = 0; i < 4; i++) {
            x[4] ^= R(x[0] + x[12], 7);
            x[8] ^= R(x[4] + x[0], 9);
            x[12] ^= R(x[8] + x[4], 13);
            x[0] ^= R(x[12] + x[8], 18);
            x[9] ^= R(x[5] + x[1], 7);
            x[13] ^= R(x[9] + x[5], 9);
            x[1] ^= R(x[13] + x[9], 13);
            x[5] ^= R(x[1] + x[13], 18);
            x[14] ^= R(x[10] + x[6], 7);
            x[2] ^= R(x[14] + x[10], 9);
            x[6] ^= R(x[2] + x[14], 13);
            x[10] ^= R(x[6] + x[2], 18);
            x[3] ^= R(x[15] + x[11], 7);
            x[7] ^= R(x[3] + x[15], 9);
            x[11] ^= R(x[7] + x[3], 13);
            x[15] ^= R(x[11] + x[7], 18);
            x[1] ^= R(x[0] + x[3], 7);
            x[2] ^= R(x[1] + x[0], 9);
            x[3] ^= R(x[2] + x[1], 13);
            x[0] ^= R(x[3] + x[2], 18);
            x[6] ^= R(x[5] + x[4], 7);
            x[7] ^= R(x[6] + x[5], 9);
            x[4] ^= R(x[7] + x[6], 13);
            x[5] ^= R(x[4] + x[7], 18);
            x[11] ^= R(x[10] + x[9], 7);
            x[8] ^= R(x[11] + x[10], 9);
            x[9] ^= R(x[8] + x[11], 13);
            x[10] ^= R(x[9] + x[8], 18);
            x[12] ^= R(x[15] + x[14], 7);
            x[13] ^= R(x[12] + x[15], 9);
            x[14] ^= R(x[13] + x[12], 13);
            x[15] ^= R(x[14] + x[13], 18);
        }
        for (i = 0; i < 16; i++)
            B32[i] += x[i];
        let bi;
        for (i = 0; i < 16; i++) {
            bi = i * 4;
            B[bi + 0] = (B32[i] >> 0) & 0xff;
            B[bi + 1] = (B32[i] >> 8) & 0xff;
            B[bi + 2] = (B32[i] >> 16) & 0xff;
            B[bi + 3] = (B32[i] >> 24) & 0xff;
        }
    }
    clean() {
        this.XY.fill(0);
        this.V.fill(0);
        this._X.fill(0);
        this.B.fill(0);
        for (let i = 0; i < 16; i++) {
            this.B32[i] = 0;
            this.x[i] = 0;
        }
    }
}
export function scryptSync(password, salt, keylen, _opts) {
    const { N, r, p, maxmem } = fixOpts(_opts);
    const blen = p * 128 * r;
    if (32 * r * (N + 2) * 4 + blen > maxmem) {
        throw new Error("excedes max memory");
    }
    const b = pbkdf2(password, salt, 1, blen, "sha256");
    const scryptRom = new ScryptRom(b, r, N, p);
    const out = scryptRom.run();
    const fin = pbkdf2(password, out, 1, keylen, "sha256");
    scryptRom.clean();
    return fin;
}
export function scrypt(password, salt, keylen, _opts, cb) {
    if (!cb) {
        cb = _opts;
        _opts = null;
    }
    const { N, r, p, maxmem } = fixOpts(_opts);
    const blen = p * 128 * r;
    if (32 * r * (N + 2) * 4 + blen > maxmem) {
        throw new Error("excedes max memory");
    }
    try {
        const b = pbkdf2(password, salt, 1, blen, "sha256");
        const scryptRom = new ScryptRom(b, r, N, p);
        const out = scryptRom.run();
        const result = pbkdf2(password, out, 1, keylen, "sha256");
        scryptRom.clean();
        cb(null, result);
    }
    catch (err) {
        return cb(err);
    }
}
export default {
    scrypt,
    scryptSync,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyeXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyeXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXlCQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFFLFVBQVUsSUFBSSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFhbkQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFXLEVBQUUsRUFBRTtJQUM5QixNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7SUFDdkQsSUFBSSxDQUFDLElBQUk7UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUV0QixJQUFJLElBQUksQ0FBQyxDQUFDO1FBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3RCLElBQUksSUFBSSxDQUFDLElBQUk7UUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7SUFFdEMsSUFBSSxJQUFJLENBQUMsQ0FBQztRQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUN0QixJQUFJLElBQUksQ0FBQyxlQUFlO1FBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBRTVELElBQUksSUFBSSxDQUFDLENBQUM7UUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDdEIsSUFBSSxJQUFJLENBQUMsU0FBUztRQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUVoRCxJQUFJLElBQUksQ0FBQyxNQUFNO1FBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBRTFDLE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyxDQUFDO0FBRUYsU0FBUyxRQUFRLENBQUMsQ0FBUyxFQUFFLEVBQVUsRUFBRSxDQUFTLEVBQUUsRUFBVSxFQUFFLEdBQVc7SUFDekUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDWCxPQUFPLEVBQUUsQ0FBQyxHQUFHLEdBQUc7UUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUNELFNBQVMsU0FBUyxDQUNoQixHQUFXLEVBQ1gsTUFBYyxFQUNkLElBQVksRUFDWixPQUFlLEVBQ2YsTUFBYztJQUVkLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFaEUsTUFBTSxTQUFTO0lBQ2IsQ0FBQyxDQUFTO0lBQ1YsQ0FBQyxDQUFTO0lBQ1YsQ0FBQyxDQUFTO0lBQ1YsQ0FBQyxDQUFTO0lBQ1YsRUFBRSxDQUFTO0lBQ1gsQ0FBQyxDQUFTO0lBQ1YsR0FBRyxDQUFhO0lBQ2hCLENBQUMsQ0FBYTtJQUNkLEVBQUUsQ0FBUztJQUNYLFlBQVksQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUNwRCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQsR0FBRztRQUNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFbkQsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFFRCxXQUFXLENBQUMsQ0FBUyxFQUFFLENBQVM7UUFDOUIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDL0IsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNoQyxNQUFNLFFBQVEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsVUFBVSxHQUFHLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDN0IsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztRQUVELElBQUksQ0FBUyxDQUFDO1FBQ2QsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUM3QixDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0QyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2hDO1FBQ0QsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsZUFBZSxDQUFDLFFBQWdCO1FBQzlCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDbkIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ25CLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxDQUFDO1FBQ04sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFCLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNqQixTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDN0M7UUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QixTQUFTLENBQUMsRUFBRSxFQUFFLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyRCxTQUFTLENBQUMsRUFBRSxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDbEU7SUFDSCxDQUFDO0lBRUQsU0FBUztRQUNQLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDckIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNsQixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRWpCLElBQUksQ0FBQyxDQUFDO1FBQ04sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdkIsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDdEMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3ZDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV2QyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDOUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQy9CO1FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4QyxJQUFJLEVBQUUsQ0FBQztRQUVQLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3ZCLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDakMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDakMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FB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UUFFcEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUQsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2xCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDbEI7SUFBQyxPQUFPLEdBQVksRUFBRTtRQUNyQixPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNoQjtBQUNILENBQUM7QUFFRCxlQUFlO0lBQ2IsTUFBTTtJQUNOLFVBQVU7Q0FDWCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMiB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8qXG5NSVQgTGljZW5zZVxuXG5Db3B5cmlnaHQgKGMpIDIwMTggY3J5cHRvY29pbmpzXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG5jb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG5TT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi4vLi4vYnVmZmVyLnRzXCI7XG5pbXBvcnQgeyBwYmtkZjJTeW5jIGFzIHBia2RmMiB9IGZyb20gXCIuL3Bia2RmMi50c1wiO1xuaW1wb3J0IHsgSEFTSF9EQVRBIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxudHlwZSBPcHRzID0gUGFydGlhbDx7XG4gIE46IG51bWJlcjtcbiAgY29zdDogbnVtYmVyO1xuICBwOiBudW1iZXI7XG4gIHBhcmFsbGVsaXphdGlvbjogbnVtYmVyO1xuICByOiBudW1iZXI7XG4gIGJsb2NrU2l6ZTogbnVtYmVyO1xuICBtYXhtZW06IG51bWJlcjtcbn0+O1xuXG5jb25zdCBmaXhPcHRzID0gKG9wdHM/OiBPcHRzKSA9PiB7XG4gIGNvbnN0IG91dCA9IHsgTjogMTYzODQsIHA6IDEsIHI6IDgsIG1heG1lbTogMzIgPDwgMjAgfTtcbiAgaWYgKCFvcHRzKSByZXR1cm4gb3V0O1xuXG4gIGlmIChvcHRzLk4pIG91dC5OID0gb3B0cy5OO1xuICBlbHNlIGlmIChvcHRzLmNvc3QpIG91dC5OID0gb3B0cy5jb3N0O1xuXG4gIGlmIChvcHRzLnApIG91dC5wID0gb3B0cy5wO1xuICBlbHNlIGlmIChvcHRzLnBhcmFsbGVsaXphdGlvbikgb3V0LnAgPSBvcHRzLnBhcmFsbGVsaXphdGlvbjtcblxuICBpZiAob3B0cy5yKSBvdXQuciA9IG9wdHMucjtcbiAgZWxzZSBpZiAob3B0cy5ibG9ja1NpemUpIG91dC5yID0gb3B0cy5ibG9ja1NpemU7XG5cbiAgaWYgKG9wdHMubWF4bWVtKSBvdXQubWF4bWVtID0gb3B0cy5tYXhtZW07XG5cbiAgcmV0dXJuIG91dDtcbn07XG5cbmZ1bmN0aW9uIGJsb2NreG9yKFM6IEJ1ZmZlciwgU2k6IG51bWJlciwgRDogQnVmZmVyLCBEaTogbnVtYmVyLCBsZW46IG51bWJlcikge1xuICBsZXQgaSA9IC0xO1xuICB3aGlsZSAoKytpIDwgbGVuKSBEW0RpICsgaV0gXj0gU1tTaSArIGldO1xufVxuZnVuY3Rpb24gYXJyYXljb3B5KFxuICBzcmM6IEJ1ZmZlcixcbiAgc3JjUG9zOiBudW1iZXIsXG4gIGRlc3Q6IEJ1ZmZlcixcbiAgZGVzdFBvczogbnVtYmVyLFxuICBsZW5ndGg6IG51bWJlcixcbikge1xuICBzcmMuY29weShkZXN0LCBkZXN0UG9zLCBzcmNQb3MsIHNyY1BvcyArIGxlbmd0aCk7XG59XG5cbmNvbnN0IFIgPSAoYTogbnVtYmVyLCBiOiBudW1iZXIpID0+IChhIDw8IGIpIHwgKGEgPj4+ICgzMiAtIGIpKTtcblxuY2xhc3MgU2NyeXB0Um9tIHtcbiAgQjogQnVmZmVyO1xuICByOiBudW1iZXI7XG4gIE46IG51bWJlcjtcbiAgcDogbnVtYmVyO1xuICBYWTogQnVmZmVyO1xuICBWOiBCdWZmZXI7XG4gIEIzMjogSW50MzJBcnJheTtcbiAgeDogSW50MzJBcnJheTtcbiAgX1g6IEJ1ZmZlcjtcbiAgY29uc3RydWN0b3IoYjogQnVmZmVyLCByOiBudW1iZXIsIE46IG51bWJlciwgcDogbnVtYmVyKSB7XG4gICAgdGhpcy5CID0gYjtcbiAgICB0aGlzLnIgPSByO1xuICAgIHRoaXMuTiA9IE47XG4gICAgdGhpcy5wID0gcDtcbiAgICB0aGlzLlhZID0gQnVmZmVyLmFsbG9jVW5zYWZlKDI1NiAqIHIpO1xuICAgIHRoaXMuViA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSgxMjggKiByICogTik7XG4gICAgdGhpcy5CMzIgPSBuZXcgSW50MzJBcnJheSgxNik7IC8vIHNhbHNhMjBfOFxuICAgIHRoaXMueCA9IG5ldyBJbnQzMkFycmF5KDE2KTsgLy8gc2Fsc2EyMF84XG4gICAgdGhpcy5fWCA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSg2NCk7IC8vIGJsb2NrbWl4X3NhbHNhOFxuICB9XG5cbiAgcnVuKCkge1xuICAgIGNvbnN0IHAgPSB0aGlzLnAgfCAwO1xuICAgIGNvbnN0IHIgPSB0aGlzLnIgfCAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcDsgaSsrKSB0aGlzLnNjcnlwdFJPTWl4KGksIHIpO1xuXG4gICAgcmV0dXJuIHRoaXMuQjtcbiAgfVxuXG4gIHNjcnlwdFJPTWl4KGk6IG51bWJlciwgcjogbnVtYmVyKSB7XG4gICAgY29uc3QgYmxvY2tTdGFydCA9IGkgKiAxMjggKiByO1xuICAgIGNvbnN0IG9mZnNldCA9ICgyICogciAtIDEpICogNjQ7XG4gICAgY29uc3QgYmxvY2tMZW4gPSAxMjggKiByO1xuICAgIGNvbnN0IEIgPSB0aGlzLkI7XG4gICAgY29uc3QgTiA9IHRoaXMuTiB8IDA7XG4gICAgY29uc3QgViA9IHRoaXMuVjtcbiAgICBjb25zdCBYWSA9IHRoaXMuWFk7XG4gICAgQi5jb3B5KFhZLCAwLCBibG9ja1N0YXJ0LCBibG9ja1N0YXJ0ICsgYmxvY2tMZW4pO1xuICAgIGZvciAobGV0IGkxID0gMDsgaTEgPCBOOyBpMSsrKSB7XG4gICAgICBYWS5jb3B5KFYsIGkxICogYmxvY2tMZW4sIDAsIGJsb2NrTGVuKTtcbiAgICAgIHRoaXMuYmxvY2ttaXhfc2Fsc2E4KGJsb2NrTGVuKTtcbiAgICB9XG5cbiAgICBsZXQgajogbnVtYmVyO1xuICAgIGZvciAobGV0IGkyID0gMDsgaTIgPCBOOyBpMisrKSB7XG4gICAgICBqID0gWFkucmVhZFVJbnQzMkxFKG9mZnNldCkgJiAoTiAtIDEpO1xuICAgICAgYmxvY2t4b3IoViwgaiAqIGJsb2NrTGVuLCBYWSwgMCwgYmxvY2tMZW4pO1xuICAgICAgdGhpcy5ibG9ja21peF9zYWxzYTgoYmxvY2tMZW4pO1xuICAgIH1cbiAgICBYWS5jb3B5KEIsIGJsb2NrU3RhcnQsIDAsIGJsb2NrTGVuKTtcbiAgfVxuXG4gIGJsb2NrbWl4X3NhbHNhOChibG9ja0xlbjogbnVtYmVyKSB7XG4gICAgY29uc3QgQlkgPSB0aGlzLlhZO1xuICAgIGNvbnN0IHIgPSB0aGlzLnI7XG4gICAgY29uc3QgX1ggPSB0aGlzLl9YO1xuICAgIGFycmF5Y29weShCWSwgKDIgKiByIC0gMSkgKiA2NCwgX1gsIDAsIDY0KTtcbiAgICBsZXQgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMiAqIHI7IGkrKykge1xuICAgICAgYmxvY2t4b3IoQlksIGkgKiA2NCwgX1gsIDAsIDY0KTtcbiAgICAgIHRoaXMuc2Fsc2EyMF84KCk7XG4gICAgICBhcnJheWNvcHkoX1gsIDAsIEJZLCBibG9ja0xlbiArIGkgKiA2NCwgNjQpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgcjsgaSsrKSB7XG4gICAgICBhcnJheWNvcHkoQlksIGJsb2NrTGVuICsgaSAqIDIgKiA2NCwgQlksIGkgKiA2NCwgNjQpO1xuICAgICAgYXJyYXljb3B5KEJZLCBibG9ja0xlbiArIChpICogMiArIDEpICogNjQsIEJZLCAoaSArIHIpICogNjQsIDY0KTtcbiAgICB9XG4gIH1cblxuICBzYWxzYTIwXzgoKSB7XG4gICAgY29uc3QgQjMyID0gdGhpcy5CMzI7XG4gICAgY29uc3QgQiA9IHRoaXMuX1g7XG4gICAgY29uc3QgeCA9IHRoaXMueDtcblxuICAgIGxldCBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBCMzJbaV0gPSAoQltpICogNCArIDBdICYgMHhmZikgPDwgMDtcbiAgICAgIEIzMltpXSB8PSAoQltpICogNCArIDFdICYgMHhmZikgPDwgODtcbiAgICAgIEIzMltpXSB8PSAoQltpICogNCArIDJdICYgMHhmZikgPDwgMTY7XG4gICAgICBCMzJbaV0gfD0gKEJbaSAqIDQgKyAzXSAmIDB4ZmYpIDw8IDI0O1xuICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCAxNjsgaSsrKSB4W2ldID0gQjMyW2ldO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgeFs0XSBePSBSKHhbMF0gKyB4WzEyXSwgNyk7XG4gICAgICB4WzhdIF49IFIoeFs0XSArIHhbMF0sIDkpO1xuICAgICAgeFsxMl0gXj0gUih4WzhdICsgeFs0XSwgMTMpO1xuICAgICAgeFswXSBePSBSKHhbMTJdICsgeFs4XSwgMTgpO1xuICAgICAgeFs5XSBePSBSKHhbNV0gKyB4WzFdLCA3KTtcbiAgICAgIHhbMTNdIF49IFIoeFs5XSArIHhbNV0sIDkpO1xuICAgICAgeFsxXSBePSBSKHhbMTNdICsgeFs5XSwgMTMpO1xuICAgICAgeFs1XSBePSBSKHhbMV0gKyB4WzEzXSwgMTgpO1xuICAgICAgeFsxNF0gXj0gUih4WzEwXSArIHhbNl0sIDcpO1xuICAgICAgeFsyXSBePSBSKHhbMTRdICsgeFsxMF0sIDkpO1xuICAgICAgeFs2XSBePSBSKHhbMl0gKyB4WzE0XSwgMTMpO1xuICAgICAgeFsxMF0gXj0gUih4WzZdICsgeFsyXSwgMTgpO1xuICAgICAgeFszXSBePSBSKHhbMTVdICsgeFsxMV0sIDcpO1xuICAgICAgeFs3XSBePSBSKHhbM10gKyB4WzE1XSwgOSk7XG4gICAgICB4WzExXSBePSBSKHhbN10gKyB4WzNdLCAxMyk7XG4gICAgICB4WzE1XSBePSBSKHhbMTFdICsgeFs3XSwgMTgpO1xuICAgICAgeFsxXSBePSBSKHhbMF0gKyB4WzNdLCA3KTtcbiAgICAgIHhbMl0gXj0gUih4WzFdICsgeFswXSwgOSk7XG4gICAgICB4WzNdIF49IFIoeFsyXSArIHhbMV0sIDEzKTtcbiAgICAgIHhbMF0gXj0gUih4WzNdICsgeFsyXSwgMTgpO1xuICAgICAgeFs2XSBePSBSKHhbNV0gKyB4WzRdLCA3KTtcbiAgICAgIHhbN10gXj0gUih4WzZdICsgeFs1XSwgOSk7XG4gICAgICB4WzRdIF49IFIoeFs3XSArIHhbNl0sIDEzKTtcbiAgICAgIHhbNV0gXj0gUih4WzRdICsgeFs3XSwgMTgpO1xuICAgICAgeFsxMV0gXj0gUih4WzEwXSArIHhbOV0sIDcpO1xuICAgICAgeFs4XSBePSBSKHhbMTFdICsgeFsxMF0sIDkpO1xuICAgICAgeFs5XSBePSBSKHhbOF0gKyB4WzExXSwgMTMpO1xuICAgICAgeFsxMF0gXj0gUih4WzldICsgeFs4XSwgMTgpO1xuICAgICAgeFsxMl0gXj0gUih4WzE1XSArIHhbMTRdLCA3KTtcbiAgICAgIHhbMTNdIF49IFIoeFsxMl0gKyB4WzE1XSwgOSk7XG4gICAgICB4WzE0XSBePSBSKHhbMTNdICsgeFsxMl0sIDEzKTtcbiAgICAgIHhbMTVdIF49IFIoeFsxNF0gKyB4WzEzXSwgMTgpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgMTY7IGkrKykgQjMyW2ldICs9IHhbaV07XG5cbiAgICBsZXQgYmk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgYmkgPSBpICogNDtcbiAgICAgIEJbYmkgKyAwXSA9IChCMzJbaV0gPj4gMCkgJiAweGZmO1xuICAgICAgQltiaSArIDFdID0gKEIzMltpXSA+PiA4KSAmIDB4ZmY7XG4gICAgICBCW2JpICsgMl0gPSAoQjMyW2ldID4+IDE2KSAmIDB4ZmY7XG4gICAgICBCW2JpICsgM10gPSAoQjMyW2ldID4+IDI0KSAmIDB4ZmY7XG4gICAgfVxuICB9XG5cbiAgY2xlYW4oKSB7XG4gICAgdGhpcy5YWS5maWxsKDApO1xuICAgIHRoaXMuVi5maWxsKDApO1xuICAgIHRoaXMuX1guZmlsbCgwKTtcbiAgICB0aGlzLkIuZmlsbCgwKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgIHRoaXMuQjMyW2ldID0gMDtcbiAgICAgIHRoaXMueFtpXSA9IDA7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY3J5cHRTeW5jKFxuICBwYXNzd29yZDogSEFTSF9EQVRBLFxuICBzYWx0OiBIQVNIX0RBVEEsXG4gIGtleWxlbjogbnVtYmVyLFxuICBfb3B0cz86IE9wdHMsXG4pOiBCdWZmZXIge1xuICBjb25zdCB7IE4sIHIsIHAsIG1heG1lbSB9ID0gZml4T3B0cyhfb3B0cyk7XG5cbiAgY29uc3QgYmxlbiA9IHAgKiAxMjggKiByO1xuXG4gIGlmICgzMiAqIHIgKiAoTiArIDIpICogNCArIGJsZW4gPiBtYXhtZW0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJleGNlZGVzIG1heCBtZW1vcnlcIik7XG4gIH1cblxuICBjb25zdCBiID0gcGJrZGYyKHBhc3N3b3JkLCBzYWx0LCAxLCBibGVuLCBcInNoYTI1NlwiKTtcblxuICBjb25zdCBzY3J5cHRSb20gPSBuZXcgU2NyeXB0Um9tKGIsIHIsIE4sIHApO1xuICBjb25zdCBvdXQgPSBzY3J5cHRSb20ucnVuKCk7XG5cbiAgY29uc3QgZmluID0gcGJrZGYyKHBhc3N3b3JkLCBvdXQsIDEsIGtleWxlbiwgXCJzaGEyNTZcIik7XG4gIHNjcnlwdFJvbS5jbGVhbigpO1xuICByZXR1cm4gZmluO1xufVxuXG50eXBlIENhbGxiYWNrID0gKGVycjogdW5rbm93biwgcmVzdWx0PzogQnVmZmVyKSA9PiB2b2lkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2NyeXB0KFxuICBwYXNzd29yZDogSEFTSF9EQVRBLFxuICBzYWx0OiBIQVNIX0RBVEEsXG4gIGtleWxlbjogbnVtYmVyLFxuICBfb3B0czogT3B0cyB8IG51bGwgfCBDYWxsYmFjayxcbiAgY2I/OiBDYWxsYmFjayxcbikge1xuICBpZiAoIWNiKSB7XG4gICAgY2IgPSBfb3B0cyBhcyBDYWxsYmFjaztcbiAgICBfb3B0cyA9IG51bGw7XG4gIH1cbiAgY29uc3QgeyBOLCByLCBwLCBtYXhtZW0gfSA9IGZpeE9wdHMoX29wdHMgYXMgT3B0cyk7XG5cbiAgY29uc3QgYmxlbiA9IHAgKiAxMjggKiByO1xuICBpZiAoMzIgKiByICogKE4gKyAyKSAqIDQgKyBibGVuID4gbWF4bWVtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZXhjZWRlcyBtYXggbWVtb3J5XCIpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBiID0gcGJrZGYyKHBhc3N3b3JkLCBzYWx0LCAxLCBibGVuLCBcInNoYTI1NlwiKTtcblxuICAgIGNvbnN0IHNjcnlwdFJvbSA9IG5ldyBTY3J5cHRSb20oYiwgciwgTiwgcCk7XG4gICAgY29uc3Qgb3V0ID0gc2NyeXB0Um9tLnJ1bigpO1xuICAgIGNvbnN0IHJlc3VsdCA9IHBia2RmMihwYXNzd29yZCwgb3V0LCAxLCBrZXlsZW4sIFwic2hhMjU2XCIpO1xuICAgIHNjcnlwdFJvbS5jbGVhbigpO1xuICAgIGNiKG51bGwsIHJlc3VsdCk7XG4gIH0gY2F0Y2ggKGVycjogdW5rbm93bikge1xuICAgIHJldHVybiBjYihlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgc2NyeXB0LFxuICBzY3J5cHRTeW5jLFxufTtcbiJdfQ==