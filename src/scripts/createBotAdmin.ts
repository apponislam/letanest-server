import bcrypt from "bcrypt";
import { UserModel } from "../app/modules/auth/auth.model";
import config from "../app/config";
import { roles } from "../app/modules/auth/auth.interface";

async function createBotAdmin() {
    try {
        const existingBot = await UserModel.findOne({
            isBot: true,
            role: roles.ADMIN,
        });

        if (existingBot) {
            console.log("✅ Bot admin already exists:", existingBot.email);
            return;
        }

        const passwordHash = await bcrypt.hash(config.botPassword!, Number(config.bcrypt_salt_rounds));

        const botData = {
            name: "Letanest",
            email: config.botEmail,
            password: passwordHash,
            role: roles.ADMIN,
            isActive: true,
            phone: undefined,
            profileImg: undefined,
            isEmailVerified: true,
            isBot: true,
        };

        const botAdmin = await UserModel.create(botData);
        console.log("✅ Bot admin created:", botAdmin.email, "with ID:", botAdmin._id, "Role:", botAdmin.role);
    } catch (error) {
        console.error("❌ Error creating bot admin:", error);
    }
}

export default createBotAdmin;
