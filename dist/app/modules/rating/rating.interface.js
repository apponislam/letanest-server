"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingStatus = exports.RatingType = void 0;
var RatingType;
(function (RatingType) {
    RatingType["PROPERTY"] = "property";
    RatingType["GUEST"] = "guest";
    RatingType["SITE"] = "site";
})(RatingType || (exports.RatingType = RatingType = {}));
var RatingStatus;
(function (RatingStatus) {
    RatingStatus["PENDING"] = "pending";
    RatingStatus["APPROVED"] = "approved";
    RatingStatus["REJECTED"] = "rejected";
})(RatingStatus || (exports.RatingStatus = RatingStatus = {}));
