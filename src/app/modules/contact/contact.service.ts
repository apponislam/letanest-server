import ApiError from "../../../errors/ApiError";
import { IContactForm } from "./contact.interface";
import { Contact } from "./contact.model";
import httpStatus from "http-status";
import { sendContactReply } from "./contactEmail";

const createContact = async (contactData: IContactForm) => {
    const contact = await Contact.create(contactData);
    return contact;
};

const getContacts = async (query: any = {}) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build search filter
    const filter: any = {};

    // Search functionality
    if (query.search) {
        filter.$or = [{ firstName: { $regex: query.search, $options: "i" } }, { lastName: { $regex: query.search, $options: "i" } }, { email: { $regex: query.search, $options: "i" } }, { message: { $regex: query.search, $options: "i" } }];
    }

    // Status filter
    if (query.status) {
        filter.status = query.status;
    }

    const [contacts, total] = await Promise.all([Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Contact.countDocuments(filter)]);

    return {
        contacts,
        meta: {
            page,
            limit,
            total,
        },
    };
};

const getContactById = async (contactId: string) => {
    const contact = await Contact.findById(contactId);
    if (!contact) {
        throw new ApiError(httpStatus.NOT_FOUND, "Contact not found");
    }
    return contact;
};

const updateContactStatus = async (contactId: string, status: "pending" | "read" | "replied") => {
    const contact = await Contact.findByIdAndUpdate(contactId, { status }, { new: true });
    if (!contact) {
        throw new ApiError(httpStatus.NOT_FOUND, "Contact not found");
    }
    return contact;
};

const replyToContact = async (contactId: string, replyMessage: string) => {
    const contact = await Contact.findById(contactId);
    if (!contact) {
        throw new ApiError(httpStatus.NOT_FOUND, "Contact not found");
    }

    await sendContactReply({
        to: contact.email,
        name: `${contact.firstName} ${contact.lastName}`,
        originalMessage: contact.message,
        reply: replyMessage,
    });

    const updatedContact = await Contact.findByIdAndUpdate(
        contactId,
        {
            status: "replied",
            replyMessage: replyMessage,
            repliedAt: new Date(),
        },
        { new: true }
    );

    return updatedContact;
};

export const contactServices = {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    replyToContact,
};
