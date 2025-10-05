import { PropertyModel } from "./properties.model";
import { IProperty, IPropertyListResponse, IPropertyQuery } from "./properties.interface";
import { Types } from "mongoose";

const createPropertyService = async (data: IProperty): Promise<IProperty> => {
    return PropertyModel.create(data);
};

const updatePropertyService = async (id: string, data: Partial<IProperty>): Promise<IProperty | null> => {
    return PropertyModel.findByIdAndUpdate(id, data, { new: true });
};

const getSinglePropertyService = async (id: string): Promise<IProperty | null> => {
    return PropertyModel.findById(id);
};

const getAllPropertiesService = async (query: IPropertyQuery): Promise<IPropertyListResponse> => {
    const { page = 1, limit = 10, search, status, createdBy } = query;

    const filter: Record<string, any> = {};

    if (search) {
        filter.$or = [{ title: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }];
    }

    if (status) filter.status = status;
    if (createdBy) filter.createdBy = new Types.ObjectId(createdBy);

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([PropertyModel.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), PropertyModel.countDocuments(filter)]);

    return {
        properties,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
    };
};

export const propertyServices = {
    createPropertyService,
    updatePropertyService,
    getSinglePropertyService,
    getAllPropertiesService,
};
