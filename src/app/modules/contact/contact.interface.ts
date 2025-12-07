export interface IContactForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string;
}

export interface IContact extends Document {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string;
    status: "pending" | "read" | "replied";
    replyMessage?: string;
    repliedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
