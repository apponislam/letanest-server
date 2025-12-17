import { UserModel } from "../auth/auth.model";
import { PropertyModel } from "../property/properties.model";
import { PaymentModel } from "../payment/payment.model";
import { RatingModel } from "../rating/rating.model";

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
    // Get current date and previous date for comparison
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Total Users
    const totalUsers = await UserModel.countDocuments();
    const yesterdayUsers = await UserModel.countDocuments({
        createdAt: { $lt: yesterday },
    });
    const userGrowth = yesterdayUsers > 0 ? ((totalUsers - yesterdayUsers) / yesterdayUsers) * 100 : 0;

    // Total Properties
    const totalProperties = await PropertyModel.countDocuments({
        status: "published",
    });
    const yesterdayProperties = await PropertyModel.countDocuments({
        status: "published",
        createdAt: { $lt: yesterday },
    });
    const propertyGrowth = yesterdayProperties > 0 ? ((totalProperties - yesterdayProperties) / yesterdayProperties) * 100 : 0;

    // Revenue (Platform Total from payments)
    const revenueStats = await PaymentModel.aggregate([
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

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const yesterdayRevenue = revenueStats[0]?.yesterdayRevenue || 0;
    const revenueGrowth = yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Recent activity counts (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentUsers = await UserModel.countDocuments({
        createdAt: { $gte: weekAgo },
    });

    const recentProperties = await PropertyModel.countDocuments({
        createdAt: { $gte: weekAgo },
    });

    const recentRevenue = await PaymentModel.aggregate([
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
            recent: recentRevenue[0]?.total || 0,
        },
    };
};

/**
 * Get revenue chart data by year
 */
const getRevenueChartData = async (year?: number) => {
    const targetYear = year || new Date().getFullYear();
    const previousYear = targetYear - 1;

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);

    const prevStartDate = new Date(previousYear, 0, 1);
    const prevEndDate = new Date(previousYear, 11, 31);

    // Get current year revenue by month
    const revenueData = await PaymentModel.aggregate([
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
    const previousYearRevenue = await PaymentModel.aggregate([
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
    const currentYearRevenue = await PaymentModel.aggregate([
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
    const currentTotal = currentYearRevenue[0]?.total || 0;
    const previousTotal = previousYearRevenue[0]?.total || 0;

    let growth = 0;
    if (previousTotal > 0) {
        growth = ((currentTotal - previousTotal) / previousTotal) * 100;
    } else if (currentTotal > 0) {
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
};

/**
 * Get property status statistics for pie chart
 */
// const getPropertyStatusStats = async () => {
//     // Get counts for each status
//     const statusCounts = await PropertyModel.aggregate([
//         {
//             $group: {
//                 _id: "$status",
//                 count: { $sum: 1 },
//             },
//         },
//     ]);

//     // Calculate total properties
//     const totalProperties = await PropertyModel.countDocuments();

//     // Create data array with all statuses, even if count is 0
//     const allStatuses = ["published", "pending", "rejected", "hidden"];

//     const statusData = allStatuses.map((status) => {
//         const statusCount = statusCounts.find((item) => item._id === status);
//         const count = statusCount?.count || 0;
//         const percentage = totalProperties > 0 ? (count / totalProperties) * 100 : 0;

//         return {
//             status,
//             count,
//             percentage: Math.round(percentage),
//         };
//     });

//     return {
//         total: totalProperties,
//         data: statusData,
//     };
// };

const getPropertyStatusStats = async (filters: { propertyType?: string; startDate?: Date; endDate?: Date } = {}) => {
    // Build match stage for filters
    const matchStage: any = {};

    if (filters.propertyType) {
        matchStage.propertyType = filters.propertyType;
    }

    if (filters.startDate || filters.endDate) {
        matchStage.createdAt = {};
        if (filters.startDate) {
            matchStage.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
            matchStage.createdAt.$lte = filters.endDate;
        }
    }

    // Get counts for each status with filters
    const statusCounts = await PropertyModel.aggregate([
        {
            $match: matchStage,
        },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    // Calculate total properties with filters
    const totalProperties = await PropertyModel.countDocuments(matchStage);

    // Create data array with all statuses, even if count is 0
    const allStatuses = ["published", "pending", "rejected", "hidden"];

    const statusData = allStatuses.map((status) => {
        const statusCount = statusCounts.find((item) => item._id === status);
        const count = statusCount?.count || 0;
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
        filters: {
            propertyType: filters.propertyType,
            startDate: filters.startDate,
            endDate: filters.endDate,
        },
    };
};

const getSiteStatsService = async () => {
    // 1. All published properties count
    const publishedPropertiesCount = await PropertyModel.countDocuments({
        status: "published",
        isDeleted: false,
    });

    // 2. ALL ratings with 3+ stars (both property and site)
    const goodRatingsCount = await RatingModel.countDocuments({
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
};

const getHostStats = async (hostId: string) => {
    const totalBookings = await PaymentModel.countDocuments({
        hostId: hostId,
        status: "completed",
    });

    const totalProperties = await PropertyModel.countDocuments({
        createdBy: hostId,
        isDeleted: false,
        status: "published",
    });

    return {
        totalBookings,
        totalProperties,
    };
};

export const dashboardServices = {
    getDashboardStats,
    getRevenueChartData,
    getPropertyStatusStats,
    getSiteStatsService,
    getHostStats,
};
