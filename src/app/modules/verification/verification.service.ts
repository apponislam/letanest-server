import mongoose, { Types } from "mongoose";
import httpStatus from "http-status";
import { IFileInfo, IStatusUpdate, IVerification, IVerificationInput, IVerificationQuery } from "./verification.interface";
import { Verification } from "./verification.model";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";

const createVerification = async (verificationData: IVerificationInput, files: { [fieldname: string]: Express.Multer.File[] }, userId: Types.ObjectId): Promise<IVerification> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const verification = new Verification({
            ...verificationData,
            proofAddress: mapFileInfo(files.proofAddress[0]),
            proofID: mapFileInfo(files.proofID[0]),
            userId,
            dob: new Date(verificationData.dob),
        });

        const savedVerification = await verification.save({ session });

        // Update user verification status to "pending"
        await UserModel.findByIdAndUpdate(
            userId,
            {
                verificationStatus: "pending",
                isVerifiedByAdmin: false,
            },
            { session }
        );

        await session.commitTransaction();
        return savedVerification;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const getVerificationById = async (id: string, userId?: Types.ObjectId): Promise<IVerification | null> => {
    const query: any = { _id: id };
    if (userId) {
        query.userId = userId;
    }

    return await Verification.findOne(query);
};

const getVerificationsByUser = async (userId: Types.ObjectId, query: IVerificationQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (query.status) {
        filter.status = query.status;
    }

    const [verifications, total] = await Promise.all([Verification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Verification.countDocuments(filter)]);

    return {
        verifications,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getAllVerifications = async (query: IVerificationQuery) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) {
        filter.status = query.status;
    }

    const [verifications, total] = await Promise.all([Verification.find(filter).populate("userId", "email firstName lastName").sort({ createdAt: -1 }).skip(skip).limit(limit), Verification.countDocuments(filter)]);

    return {
        verifications,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const updateVerificationStatus = async (id: string, statusData: IStatusUpdate): Promise<IVerification | null> => {
    const verification = await Verification.findById(id);
    if (!verification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Verification not found");
    }

    const updateData: any = {
        status: statusData.status,
        reviewedAt: new Date(),
    };

    if (statusData.reviewNotes) {
        updateData.reviewNotes = statusData.reviewNotes;
    }

    return await Verification.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate("userId", "email firstName lastName");
};

const deleteVerification = async (id: string, userId?: Types.ObjectId): Promise<IVerification | null> => {
    const query: any = { _id: id };
    if (userId) {
        query.userId = userId;
    }

    const verification = await Verification.findOne(query);
    if (!verification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Verification not found");
    }

    return await Verification.findOneAndDelete(query);
};

const mapFileInfo = (file: Express.Multer.File): IFileInfo => {
    return {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
    };
};

export const verificationService = {
    createVerification,
    getVerificationById,
    getVerificationsByUser,
    getAllVerifications,
    updateVerificationStatus,
    deleteVerification,
};
