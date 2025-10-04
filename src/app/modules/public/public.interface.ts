import { Types } from "mongoose";

export const roles = {
    HOST: "HOST" as const,
    ADMIN: "ADMIN" as const,
    GUEST: "GUEST" as const,
};

export type TermsCreator = typeof roles.ADMIN | typeof roles.HOST;
export type TermsTarget = typeof roles.HOST | typeof roles.GUEST;
export type HostTCTarget = "default" | "property";

export interface TermsAndConditions {
    _id?: string;
    content: string;
    version?: string;
    effectiveDate?: string;
    createdBy: Types.ObjectId;
    creatorType: TermsCreator;
    target: TermsTarget;
    hostTarget?: HostTCTarget;
    propertyId?: Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
}
