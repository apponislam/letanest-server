import { IUser } from "../auth/auth.interface";
import { UserModel } from "../auth/auth.model";

interface IUserQuery {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: string;
}

const getAllUsersService = async (query: IUserQuery) => {
    const { page = 1, limit = 10, search, role, isActive } = query;

    const filter: Record<string, any> = {};

    if (search) {
        filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
    }

    if (role) filter.role = role;
    if (isActive) filter.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([UserModel.find(filter).select("-password").skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), UserModel.countDocuments(filter)]);

    return {
        users,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

const getSingleUserService = async (id: string): Promise<IUser | null> => {
    return await UserModel.findById(id).select("-password");
};

export const userServices = {
    getAllUsersService,
    getSingleUserService,
};
