"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomId = generateRandomId;
const crypto_1 = __importDefault(require("crypto"));
function generateRandom6Digits() {
    return String(crypto_1.default.randomInt(0, 1000000)).padStart(6, "0");
}
function generateRandomId(model_1) {
    return __awaiter(this, arguments, void 0, function* (model, prefix = "BDU") {
        let id = "";
        let exists = true;
        while (exists) {
            id = `${prefix}-${generateRandom6Digits()}-${generateRandom6Digits()}`;
            const doc = yield model.exists({ serialId: id });
            exists = !!doc;
        }
        return id;
    });
}
