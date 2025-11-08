import bcrypt from "bcrypt";
import { UserModel } from "../app/modules/auth/auth.model";
import config from "../app/config";
import { roles } from "../app/modules/auth/auth.interface";

async function createSuperAdmin() {
    try {
        const existingAdmin = await UserModel.findOne({ role: roles.ADMIN });
        if (existingAdmin) {
            console.log("✅ Admin already exists:", existingAdmin.email);
            return;
        }
        const passwordHash = await bcrypt.hash(config.superAdminPassword!, Number(config.bcrypt_salt_rounds));
        const userData = {
            name: "Super Admin",
            email: config.superAdminEmail,
            password: passwordHash,
            role: roles.ADMIN,
            isActive: true,
            phone: undefined,
            profileImg: undefined,
            isEmailVerified: true,
        };
        const superAdmin = await UserModel.create(userData);
        console.log("✅ Super admin created:", superAdmin.email, "with ID:", superAdmin._id);
    } catch (error) {
        console.error("❌ Error creating super admin:", error);
    }
}

export default createSuperAdmin;
