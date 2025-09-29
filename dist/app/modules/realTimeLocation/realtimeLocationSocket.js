"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationSocketHandler = void 0;
const realTimeLocation_model_1 = require("./realTimeLocation.model");
const distance_1 = require("../../../utils/distance");
const locationSocketHandler = (io, socket) => {
    // join personal room
    socket.on("joinRoom", (userId) => {
        socket.join(`user::${userId}`);
        console.log("📥 Joining room for user:", `user::${userId}`);
    });
    // listen for real-time location updates
    socket.on("updateLocation", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, latitude, longitude, speed = 0, heading = 0 } = data;
        // update this user's location in DB
        const location = yield realTimeLocation_model_1.RealtimeLocationModel.findOneAndUpdate({ user: userId }, { $set: { latitude, longitude, speed, heading } }, { new: true, upsert: true, setDefaultsOnInsert: true });
        if (!location)
            return;
        // get all users except current
        const otherUsers = yield realTimeLocation_model_1.RealtimeLocationModel.find({
            user: { $nin: [userId, null] },
            hideLocation: false,
        })
            .populate({
            path: "user",
            select: "name email phone role profileImg",
            populate: {
                path: "profile",
                select: "gender bloodGroup totalDonations lastDonationDate dateOfBirth",
            },
        })
            .lean();
        // calculate distance from this user to all others
        const distances = otherUsers.map((u) => ({
            serialId: u.serialId,
            user: u.user,
            latitude: u.latitude,
            longitude: u.longitude,
            distanceMeters: (0, distance_1.getDistanceInMeters)(latitude, longitude, u.latitude, u.longitude),
        }));
        // send back **all users + distance from current user**
        socket.emit(`usersDistance`, distances);
        // socket.emit(`usersDistance`, otherUsers);
        // also emit to all other users (optional) the updated location
        io.emit("locationUpdated", {
            serialId: location.serialId,
            user: location.user,
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            heading: location.heading,
        });
    }));
};
exports.locationSocketHandler = locationSocketHandler;
