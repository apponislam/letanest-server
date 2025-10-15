import ApiError from "../../errors/ApiError";
import catchAsync from "../../utils/catchAsync";
import { paymentMethodServices } from "../modules/paymentMethod/paymentMethod.services";
import httpStatus from "http-status";

export const checkPaymentMethodOwnership = catchAsync(async (req, res, next) => {
    const { paymentMethodId } = req.params;

    const isOwner = await paymentMethodServices.validatePaymentMethodOwnership(req.user._id, paymentMethodId);
    if (!isOwner) {
        throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to access this payment method");
    }

    next();
});
