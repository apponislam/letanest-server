import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse.";
import { contactServices } from "./contact.service";
import httpStatus from "http-status";

const createContact = catchAsync(async (req, res) => {
    const contact = await contactServices.createContact(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Contact message sent successfully",
        data: contact,
    });
});

const getContacts = catchAsync(async (req, res) => {
    const result = await contactServices.getContacts(req.query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Contacts fetched successfully",
        data: result.contacts,
        meta: result.meta,
    });
});

const getContactById = catchAsync(async (req, res) => {
    const contact = await contactServices.getContactById(req.params.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Contact fetched successfully",
        data: contact,
    });
});

const updateContactStatus = catchAsync(async (req, res) => {
    const contact = await contactServices.updateContactStatus(req.params.id, req.body.status);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Contact status updated successfully",
        data: contact,
    });
});

export const contactControllers = {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
};
