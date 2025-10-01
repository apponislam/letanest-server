import { Types } from "mongoose";

const roles = {
    GUEST: "GUEST" as const,
    HOST: "HOST" as const,
    ADMIN: "ADMIN" as const,
};

export type TermsCreator = typeof roles.ADMIN | typeof roles.HOST;

export type HostTCTarget = "default" | "property";

export interface TermsAndConditions {
    id: string;
    title: string;
    content: string;
    version?: string;
    effectiveDate?: string;
    createdBy: Types.ObjectId;
    creatorType: TermsCreator;
    hostTarget?: HostTCTarget;
    propertyId?: string;
    createdAt?: string;
    updatedAt?: string;
}
