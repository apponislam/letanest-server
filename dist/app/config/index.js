"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
exports.default = {
    ip: process.env.IP,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodb_url: process.env.MONGODB_URL,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_access_expire: process.env.JWT_ACCESS_EXPIRE,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_refresh_expire: process.env.JWT_REFRESH_EXPIRE,
    client_url: process.env.CLIENT_URL,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
    callback_url: process.env.CALLBACK_URL,
    facebook_app_id: process.env.FACEBOOK_APP_ID,
    facebook_app_secret: process.env.FACEBOOK_APP_SECRET,
    mail: {
        smtp_host: process.env.SMTP_HOST,
        smtp_port: process.env.SMTP_PORT,
        smtp_user: process.env.SMTP_USER,
        smtp_pass: process.env.SMTP_PASS,
    },
    superAdminPassword: process.env.SUPERADMINPASSWORD,
    superAdminEmail: process.env.SUPERADMINEMAIL,
    // stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    // stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    // stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
};
