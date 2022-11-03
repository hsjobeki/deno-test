import { Buffer } from "../../buffer.ts";
import { ERR_INVALID_ARG_TYPE } from "../errors.ts";
import { isArrayBufferView } from "../util/types.ts";
import { notImplemented } from "../../_utils.ts";
export class X509Certificate {
    constructor(buffer) {
        if (typeof buffer === "string") {
            buffer = Buffer.from(buffer);
        }
        if (!isArrayBufferView(buffer)) {
            throw new ERR_INVALID_ARG_TYPE("buffer", ["string", "Buffer", "TypedArray", "DataView"], buffer);
        }
        notImplemented("crypto.X509Certificate");
    }
    get ca() {
        notImplemented("crypto.X509Certificate.prototype.ca");
        return false;
    }
    checkEmail(_email, _options) {
        notImplemented("crypto.X509Certificate.prototype.checkEmail");
    }
    checkHost(_name, _options) {
        notImplemented("crypto.X509Certificate.prototype.checkHost");
    }
    checkIP(_ip) {
        notImplemented("crypto.X509Certificate.prototype.checkIP");
    }
    checkIssued(_otherCert) {
        notImplemented("crypto.X509Certificate.prototype.checkIssued");
    }
    checkPrivateKey(_privateKey) {
        notImplemented("crypto.X509Certificate.prototype.checkPrivateKey");
    }
    get fingerprint() {
        notImplemented("crypto.X509Certificate.prototype.fingerprint");
        return "";
    }
    get fingerprint256() {
        notImplemented("crypto.X509Certificate.prototype.fingerprint256");
        return "";
    }
    get fingerprint512() {
        notImplemented("crypto.X509Certificate.prototype.fingerprint512");
        return "";
    }
    get infoAccess() {
        notImplemented("crypto.X509Certificate.prototype.infoAccess");
        return "";
    }
    get issuer() {
        notImplemented("crypto.X509Certificate.prototype.issuer");
        return "";
    }
    get issuerCertificate() {
        notImplemented("crypto.X509Certificate.prototype.issuerCertificate");
        return {};
    }
    get keyUsage() {
        notImplemented("crypto.X509Certificate.prototype.keyUsage");
        return [];
    }
    get publicKey() {
        notImplemented("crypto.X509Certificate.prototype.publicKey");
        return {};
    }
    get raw() {
        notImplemented("crypto.X509Certificate.prototype.raw");
        return {};
    }
    get serialNumber() {
        notImplemented("crypto.X509Certificate.prototype.serialNumber");
        return "";
    }
    get subject() {
        notImplemented("crypto.X509Certificate.prototype.subject");
        return "";
    }
    get subjectAltName() {
        notImplemented("crypto.X509Certificate.prototype.subjectAltName");
        return "";
    }
    toJSON() {
        return this.toString();
    }
    toLegacyObject() {
        notImplemented("crypto.X509Certificate.prototype.toLegacyObject");
    }
    toString() {
        notImplemented("crypto.X509Certificate.prototype.toString");
    }
    get validFrom() {
        notImplemented("crypto.X509Certificate.prototype.validFrom");
        return "";
    }
    get validTo() {
        notImplemented("crypto.X509Certificate.prototype.validTo");
        return "";
    }
    verify(_publicKey) {
        notImplemented("crypto.X509Certificate.prototype.verify");
    }
}
export default {
    X509Certificate,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieDUwOS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIng1MDkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUNwRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNyRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUE2QmpELE1BQU0sT0FBTyxlQUFlO0lBQzFCLFlBQVksTUFBa0I7UUFDNUIsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDOUIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDOUI7UUFFRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDOUIsTUFBTSxJQUFJLG9CQUFvQixDQUM1QixRQUFRLEVBQ1IsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsRUFDOUMsTUFBTSxDQUNQLENBQUM7U0FDSDtRQUVELGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxJQUFJLEVBQUU7UUFDSixjQUFjLENBQUMscUNBQXFDLENBQUMsQ0FBQztRQUV0RCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxVQUFVLENBQ1IsTUFBYyxFQUNkLFFBQTRDO1FBRTVDLGNBQWMsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCxTQUFTLENBQUMsS0FBYSxFQUFFLFFBQTJCO1FBQ2xELGNBQWMsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxPQUFPLENBQUMsR0FBVztRQUNqQixjQUFjLENBQUMsMENBQTBDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsV0FBVyxDQUFDLFVBQTJCO1FBQ3JDLGNBQWMsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxlQUFlLENBQUMsV0FBc0I7UUFDcEMsY0FBYyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELElBQUksV0FBVztRQUNiLGNBQWMsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1FBRS9ELE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELElBQUksY0FBYztRQUNoQixjQUFjLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUVsRSxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxJQUFJLGNBQWM7UUFDaEIsY0FBYyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7UUFFbEUsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osY0FBYyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7UUFFOUQsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQsSUFBSSxNQUFNO1FBQ1IsY0FBYyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7UUFFMUQsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBRUQsSUFBSSxpQkFBaUI7UUFDbkIsY0FBYyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7UUFFckUsT0FBTyxFQUFxQixDQUFDO0lBQy9CLENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDVixjQUFjLENBQUMsMkNBQTJDLENBQUMsQ0FBQztRQUU1RCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxJQUFJLFNBQVM7UUFDWCxjQUFjLENBQUMsNENBQTRDLENBQUMsQ0FBQztRQUU3RCxPQUFPLEVBQWUsQ0FBQztJQUN6QixDQUFDO0lBRUQsSUFBSSxHQUFHO1FBQ0wsY0FBYyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7UUFFdkQsT0FBTyxFQUFZLENBQUM7SUFDdEIsQ0FBQztJQUVELElBQUksWUFBWTtRQUNkLGNBQWMsQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1FBRWhFLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELElBQUksT0FBTztRQUNULGNBQWMsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1FBRTNELE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUVELElBQUksY0FBYztRQUNoQixjQUFjLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUVsRSxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxNQUFNO1FBQ0osT0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELGNBQWM7UUFDWixjQUFjLENBQUMsaURBQWlELENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQsUUFBUTtRQUNOLGNBQWMsQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRCxJQUFJLFNBQVM7UUFDWCxjQUFjLENBQUMsNENBQTRDLENBQUMsQ0FBQztRQUU3RCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxJQUFJLE9BQU87UUFDVCxjQUFjLENBQUMsMENBQTBDLENBQUMsQ0FBQztRQUUzRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRCxNQUFNLENBQUMsVUFBcUI7UUFDMUIsY0FBYyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7SUFDNUQsQ0FBQztDQUNGO0FBRUQsZUFBZTtJQUNiLGVBQWU7Q0FDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBOb2RlLmpzIGNvbnRyaWJ1dG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IEtleU9iamVjdCB9IGZyb20gXCIuL2tleXMudHNcIjtcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCIuLi8uLi9idWZmZXIudHNcIjtcbmltcG9ydCB7IEVSUl9JTlZBTElEX0FSR19UWVBFIH0gZnJvbSBcIi4uL2Vycm9ycy50c1wiO1xuaW1wb3J0IHsgaXNBcnJheUJ1ZmZlclZpZXcgfSBmcm9tIFwiLi4vdXRpbC90eXBlcy50c1wiO1xuaW1wb3J0IHsgbm90SW1wbGVtZW50ZWQgfSBmcm9tIFwiLi4vLi4vX3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBCaW5hcnlMaWtlIH0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxuLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIFBlZXJDZXJ0aWZpY2F0ZSA9IGFueTtcblxuZXhwb3J0IGludGVyZmFjZSBYNTA5Q2hlY2tPcHRpb25zIHtcbiAgLyoqXG4gICAqIEBkZWZhdWx0ICdhbHdheXMnXG4gICAqL1xuICBzdWJqZWN0OiBcImFsd2F5c1wiIHwgXCJuZXZlclwiO1xuICAvKipcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgd2lsZGNhcmRzOiBib29sZWFuO1xuICAvKipcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgcGFydGlhbFdpbGRjYXJkczogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEBkZWZhdWx0IGZhbHNlXG4gICAqL1xuICBtdWx0aUxhYmVsV2lsZGNhcmRzOiBib29sZWFuO1xuICAvKipcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHNpbmdsZUxhYmVsU3ViZG9tYWluczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFg1MDlDZXJ0aWZpY2F0ZSB7XG4gIGNvbnN0cnVjdG9yKGJ1ZmZlcjogQmluYXJ5TGlrZSkge1xuICAgIGlmICh0eXBlb2YgYnVmZmVyID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBidWZmZXIgPSBCdWZmZXIuZnJvbShidWZmZXIpO1xuICAgIH1cblxuICAgIGlmICghaXNBcnJheUJ1ZmZlclZpZXcoYnVmZmVyKSkge1xuICAgICAgdGhyb3cgbmV3IEVSUl9JTlZBTElEX0FSR19UWVBFKFxuICAgICAgICBcImJ1ZmZlclwiLFxuICAgICAgICBbXCJzdHJpbmdcIiwgXCJCdWZmZXJcIiwgXCJUeXBlZEFycmF5XCIsIFwiRGF0YVZpZXdcIl0sXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbm90SW1wbGVtZW50ZWQoXCJjcnlwdG8uWDUwOUNlcnRpZmljYXRlXCIpO1xuICB9XG5cbiAgZ2V0IGNhKCk6IGJvb2xlYW4ge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUuY2FcIik7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjaGVja0VtYWlsKFxuICAgIF9lbWFpbDogc3RyaW5nLFxuICAgIF9vcHRpb25zPzogUGljazxYNTA5Q2hlY2tPcHRpb25zLCBcInN1YmplY3RcIj4sXG4gICk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgbm90SW1wbGVtZW50ZWQoXCJjcnlwdG8uWDUwOUNlcnRpZmljYXRlLnByb3RvdHlwZS5jaGVja0VtYWlsXCIpO1xuICB9XG5cbiAgY2hlY2tIb3N0KF9uYW1lOiBzdHJpbmcsIF9vcHRpb25zPzogWDUwOUNoZWNrT3B0aW9ucyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgbm90SW1wbGVtZW50ZWQoXCJjcnlwdG8uWDUwOUNlcnRpZmljYXRlLnByb3RvdHlwZS5jaGVja0hvc3RcIik7XG4gIH1cblxuICBjaGVja0lQKF9pcDogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLmNoZWNrSVBcIik7XG4gIH1cblxuICBjaGVja0lzc3VlZChfb3RoZXJDZXJ0OiBYNTA5Q2VydGlmaWNhdGUpOiBib29sZWFuIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLmNoZWNrSXNzdWVkXCIpO1xuICB9XG5cbiAgY2hlY2tQcml2YXRlS2V5KF9wcml2YXRlS2V5OiBLZXlPYmplY3QpOiBib29sZWFuIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLmNoZWNrUHJpdmF0ZUtleVwiKTtcbiAgfVxuXG4gIGdldCBmaW5nZXJwcmludCgpOiBzdHJpbmcge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUuZmluZ2VycHJpbnRcIik7XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGdldCBmaW5nZXJwcmludDI1NigpOiBzdHJpbmcge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUuZmluZ2VycHJpbnQyNTZcIik7XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGdldCBmaW5nZXJwcmludDUxMigpOiBzdHJpbmcge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUuZmluZ2VycHJpbnQ1MTJcIik7XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGdldCBpbmZvQWNjZXNzKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgbm90SW1wbGVtZW50ZWQoXCJjcnlwdG8uWDUwOUNlcnRpZmljYXRlLnByb3RvdHlwZS5pbmZvQWNjZXNzXCIpO1xuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICBnZXQgaXNzdWVyKCk6IHN0cmluZyB7XG4gICAgbm90SW1wbGVtZW50ZWQoXCJjcnlwdG8uWDUwOUNlcnRpZmljYXRlLnByb3RvdHlwZS5pc3N1ZXJcIik7XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGdldCBpc3N1ZXJDZXJ0aWZpY2F0ZSgpOiBYNTA5Q2VydGlmaWNhdGUgfCB1bmRlZmluZWQge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUuaXNzdWVyQ2VydGlmaWNhdGVcIik7XG5cbiAgICByZXR1cm4ge30gYXMgWDUwOUNlcnRpZmljYXRlO1xuICB9XG5cbiAgZ2V0IGtleVVzYWdlKCk6IHN0cmluZ1tdIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLmtleVVzYWdlXCIpO1xuXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0IHB1YmxpY0tleSgpOiBLZXlPYmplY3Qge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUucHVibGljS2V5XCIpO1xuXG4gICAgcmV0dXJuIHt9IGFzIEtleU9iamVjdDtcbiAgfVxuXG4gIGdldCByYXcoKTogQnVmZmVyIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLnJhd1wiKTtcblxuICAgIHJldHVybiB7fSBhcyBCdWZmZXI7XG4gIH1cblxuICBnZXQgc2VyaWFsTnVtYmVyKCk6IHN0cmluZyB7XG4gICAgbm90SW1wbGVtZW50ZWQoXCJjcnlwdG8uWDUwOUNlcnRpZmljYXRlLnByb3RvdHlwZS5zZXJpYWxOdW1iZXJcIik7XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuXG4gIGdldCBzdWJqZWN0KCk6IHN0cmluZyB7XG4gICAgbm90SW1wbGVtZW50ZWQoXCJjcnlwdG8uWDUwOUNlcnRpZmljYXRlLnByb3RvdHlwZS5zdWJqZWN0XCIpO1xuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICBnZXQgc3ViamVjdEFsdE5hbWUoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLnN1YmplY3RBbHROYW1lXCIpO1xuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICB0b0pTT04oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICB9XG5cbiAgdG9MZWdhY3lPYmplY3QoKTogUGVlckNlcnRpZmljYXRlIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLnRvTGVnYWN5T2JqZWN0XCIpO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBub3RJbXBsZW1lbnRlZChcImNyeXB0by5YNTA5Q2VydGlmaWNhdGUucHJvdG90eXBlLnRvU3RyaW5nXCIpO1xuICB9XG5cbiAgZ2V0IHZhbGlkRnJvbSgpOiBzdHJpbmcge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUudmFsaWRGcm9tXCIpO1xuXG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cblxuICBnZXQgdmFsaWRUbygpOiBzdHJpbmcge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUudmFsaWRUb1wiKTtcblxuICAgIHJldHVybiBcIlwiO1xuICB9XG5cbiAgdmVyaWZ5KF9wdWJsaWNLZXk6IEtleU9iamVjdCk6IGJvb2xlYW4ge1xuICAgIG5vdEltcGxlbWVudGVkKFwiY3J5cHRvLlg1MDlDZXJ0aWZpY2F0ZS5wcm90b3R5cGUudmVyaWZ5XCIpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgWDUwOUNlcnRpZmljYXRlLFxufTtcbiJdfQ==