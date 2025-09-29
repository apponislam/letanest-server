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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const config_1 = __importDefault(require("../app/config"));
const auth_services_1 = require("../app/modules/auth/auth.services");
// --- GOOGLE ---
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: config_1.default.google_client_id,
    clientSecret: config_1.default.google_client_secret,
    callbackURL: `${config_1.default.callback_url}/api/v1/auth/google/callback`,
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield auth_services_1.authServices.handleGoogleLogin(profile);
        // Cast to unknown first to satisfy Passport type
        return done(null, result);
    }
    catch (error) {
        return done(error, false);
    }
})));
passport_1.default.use(new passport_facebook_1.Strategy({
    clientID: config_1.default.facebook_app_id,
    clientSecret: config_1.default.facebook_app_secret,
    callbackURL: `${config_1.default.callback_url}/api/v1/auth/facebook/callback`,
    profileFields: ["id", "displayName", "emails", "photos"],
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield auth_services_1.authServices.handleFacebookLogin(profile);
        // Wrap in object with 'user' property if missing
        if ("requiresEmail" in result) {
            // Facebook requires email branch
            return done(null, result);
        }
        // Social user branch
        const userWithTokens = {
            user: result.user, // ensure plain object
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        };
        return done(null, userWithTokens);
    }
    catch (error) {
        return done(error, false);
    }
})));
exports.default = passport_1.default;
