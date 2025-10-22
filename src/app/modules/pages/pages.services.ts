import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
import { PageConfigModel } from "./pages.model";
import { IPageConfig, IUpdatePageConfig } from "./pages.interface";

const getPageConfigService = async (pageType: "signin" | "signup"): Promise<IPageConfig | null> => {
    return await PageConfigModel.findOne({ pageType, isActive: true });
};

const getAllPageConfigsService = async (): Promise<IPageConfig[]> => {
    return await PageConfigModel.find({ isActive: true }).sort({ pageType: 1 });
};

const upsertPageConfigService = async (pageType: "signin" | "signup", updateData: IUpdatePageConfig, logoFile?: Express.Multer.File): Promise<IPageConfig> => {
    // If there's a new logo file, update the logo path
    if (logoFile) {
        updateData.logo = `/uploads/pages/${logoFile.filename}`;
    }

    // Find existing config for this page type
    const existingConfig = await PageConfigModel.findOne({ pageType });

    if (existingConfig) {
        // Update existing config
        const updatedConfig = await PageConfigModel.findByIdAndUpdate(existingConfig._id, updateData, { new: true, runValidators: true });

        if (!updatedConfig) {
            throw new ApiError(httpStatus.NOT_FOUND, "Page configuration not found");
        }

        return updatedConfig;
    } else {
        // Create only if doesn't exist (first time setup)
        const newConfig = await PageConfigModel.create({
            pageType,
            title: updateData.title || (pageType === "signin" ? "Sign In" : "Sign Up"),
            logo: updateData.logo || "",
            isActive: true,
        });

        return newConfig;
    }
};

const deletePageConfigService = async (id: string): Promise<void> => {
    const result = await PageConfigModel.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Page configuration not found");
    }
};

export const pageConfigServices = {
    getPageConfigService,
    getAllPageConfigsService,
    upsertPageConfigService,
    deletePageConfigService,
};
