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
exports.dashboardServices = void 0;
const auth_model_1 = require("../auth/auth.model");
const properties_model_1 = require("../property/properties.model");
const payment_model_1 = require("../payment/payment.model");
const rating_model_1 = require("../rating/rating.model");
/**
 * Get dashboard statistics
 */
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Get current date and previous date for comparison
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    // Total Users
    const totalUsers = yield auth_model_1.UserModel.countDocuments();
    const yesterdayUsers = yield auth_model_1.UserModel.countDocuments({
        createdAt: { $lt: yesterday },
    });
    const userGrowth = yesterdayUsers > 0 ? ((totalUsers - yesterdayUsers) / yesterdayUsers) * 100 : 0;
    // Total Properties
    const totalProperties = yield properties_model_1.PropertyModel.countDocuments({
        status: "published",
    });
    const yesterdayProperties = yield properties_model_1.PropertyModel.countDocuments({
        status: "published",
        createdAt: { $lt: yesterday },
    });
    const propertyGrowth = yesterdayProperties > 0 ? ((totalProperties - yesterdayProperties) / yesterdayProperties) * 100 : 0;
    // Revenue (Platform Total from payments)
    const revenueStats = yield payment_model_1.PaymentModel.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$platformTotal" },
                yesterdayRevenue: {
                    $sum: {
                        $cond: [{ $lt: ["$createdAt", yesterday] }, "$platformTotal", 0],
                    },
                },
            },
        },
    ]);
    const totalRevenue = ((_a = revenueStats[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    const yesterdayRevenue = ((_b = revenueStats[0]) === null || _b === void 0 ? void 0 : _b.yesterdayRevenue) || 0;
    const revenueGrowth = yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    // Recent activity counts (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsers = yield auth_model_1.UserModel.countDocuments({
        createdAt: { $gte: weekAgo },
    });
    const recentProperties = yield properties_model_1.PropertyModel.countDocuments({
        createdAt: { $gte: weekAgo },
    });
    const recentRevenue = yield payment_model_1.PaymentModel.aggregate([
        {
            $match: {
                createdAt: { $gte: weekAgo },
                status: "completed",
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$platformTotal" },
            },
        },
    ]);
    return {
        users: {
            total: totalUsers,
            growth: Number(userGrowth.toFixed(1)),
            recent: recentUsers,
        },
        properties: {
            total: totalProperties,
            growth: Number(propertyGrowth.toFixed(1)),
            recent: recentProperties,
        },
        revenue: {
            total: totalRevenue,
            growth: Number(revenueGrowth.toFixed(1)),
            recent: ((_c = recentRevenue[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
        },
    };
});
/**
 * Get revenue chart data by year
 */
const getRevenueChartData = (year) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const targetYear = year || new Date().getFullYear();
    const previousYear = targetYear - 1;
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);
    const prevStartDate = new Date(previousYear, 0, 1);
    const prevEndDate = new Date(previousYear, 11, 31);
    // Get current year revenue by month
    const revenueData = yield payment_model_1.PaymentModel.aggregate([
        {
            $match: {
                status: "completed",
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                },
                revenue: { $sum: "$platformTotal" },
            },
        },
        {
            $sort: {
                "_id.month": 1,
            },
        },
    ]);
    // Get previous year total revenue for growth calculation
    const previousYearRevenue = yield payment_model_1.PaymentModel.aggregate([
        {
            $match: {
                status: "completed",
                createdAt: {
                    $gte: prevStartDate,
                    $lte: prevEndDate,
                },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$platformTotal" },
            },
        },
    ]);
    // Get current year total revenue
    const currentYearRevenue = yield payment_model_1.PaymentModel.aggregate([
        {
            $match: {
                status: "completed",
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$platformTotal" },
            },
        },
    ]);
    // Create all months with 0 revenue
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthlyData = months.map((month, index) => ({
        month,
        revenue: 0,
    }));
    // Fill actual revenue
    revenueData.forEach((item) => {
        const monthIndex = item._id.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            monthlyData[monthIndex].revenue = item.revenue;
        }
    });
    // Calculate growth
    const currentTotal = ((_a = currentYearRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    const previousTotal = ((_b = previousYearRevenue[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
    let growth = 0;
    if (previousTotal > 0) {
        growth = ((currentTotal - previousTotal) / previousTotal) * 100;
    }
    else if (currentTotal > 0) {
        growth = 100; // If no previous data but current data exists
    }
    return {
        year: targetYear,
        data: monthlyData,
        growth: {
            percentage: Number(growth.toFixed(1)),
            isPositive: growth >= 0,
            currentYearTotal: currentTotal,
            previousYearTotal: previousTotal,
        },
    };
});
/**
 * Get property status statistics for pie chart
 */
const getPropertyStatusStats = () => __awaiter(void 0, void 0, void 0, function* () {
    // Get counts for each status
    const statusCounts = yield properties_model_1.PropertyModel.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);
    // Calculate total properties
    const totalProperties = yield properties_model_1.PropertyModel.countDocuments();
    // Create data array with all statuses, even if count is 0
    const allStatuses = ["published", "pending", "rejected", "hidden"];
    const statusData = allStatuses.map((status) => {
        const statusCount = statusCounts.find((item) => item._id === status);
        const count = (statusCount === null || statusCount === void 0 ? void 0 : statusCount.count) || 0;
        const percentage = totalProperties > 0 ? (count / totalProperties) * 100 : 0;
        return {
            status,
            count,
            percentage: Math.round(percentage),
        };
    });
    return {
        total: totalProperties,
        data: statusData,
    };
});
const getSiteStatsService = () => __awaiter(void 0, void 0, void 0, function* () {
    // 1. All published properties count
    const publishedPropertiesCount = yield properties_model_1.PropertyModel.countDocuments({
        status: "published",
        isDeleted: false,
    });
    // 2. ALL ratings with 3+ stars (both property and site)
    const goodRatingsCount = yield rating_model_1.RatingModel.countDocuments({
        overallExperience: { $gte: 3 },
    });
    // 3. Years since 2025
    const currentYear = new Date().getFullYear();
    const yearsSince2025 = currentYear - 2025;
    return {
        publishedPropertiesCount,
        propertiesWithGoodRatingsCount: goodRatingsCount,
        yearsSince2025: Math.max(0, yearsSince2025),
    };
});
exports.dashboardServices = {
    getDashboardStats,
    getRevenueChartData,
    getPropertyStatusStats,
    getSiteStatsService,
};
