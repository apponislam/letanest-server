export interface IContactForm {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}

export interface IContact extends Document {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
    status: "pending" | "read" | "replied";
    createdAt: Date;
    updatedAt: Date;
}
