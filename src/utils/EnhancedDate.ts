// Enhanced date creation function
const createSubscriptionDates = (subscription: StripeSubscription, subscriptionPlan: any): { currentPeriodStart: Date; currentPeriodEnd: Date } => {
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;

    // Get the start timestamp from available sources
    const startTimestamp = subscription.current_period_start || subscription.billing_cycle_anchor || subscription.start_date || subscription.created;

    if (startTimestamp) {
        currentPeriodStart = createSafeDate(startTimestamp, "period_start");
        currentPeriodEnd = new Date(startTimestamp * 1000); // Convert to milliseconds

        // CRITICAL: Calculate end date based on ACTUAL billing period
        console.log("📅 Calculating period end for:", subscriptionPlan.billingPeriod);

        switch (subscriptionPlan.billingPeriod) {
            case "monthly":
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
                console.log("✅ Added 1 month for monthly plan");
                break;

            case "annual":
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
                console.log("✅ Added 1 year for annual plan");
                break;

            case "quarterly":
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
                console.log("✅ Added 3 months for quarterly plan");
                break;

            case "none":
                // For free tiers, set a far future date or handle differently
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100); // 100 years
                console.log("✅ Set far future date for free tier");
                break;

            default:
                // Default to monthly
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
                console.log("⚠️ Unknown billing period, defaulting to 1 month");
        }
    } else {
        // Fallback: current date + period
        currentPeriodStart = new Date();
        currentPeriodEnd = new Date();

        switch (subscriptionPlan.billingPeriod) {
            case "monthly":
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
                break;
            case "annual":
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
                break;
            case "quarterly":
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
                break;
            case "none":
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);
                break;
            default:
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        }
        console.warn("⚠️ Using current date with calculated period end");
    }

    console.log("📅 Final dates:", {
        start: currentPeriodStart.toISOString(),
        end: currentPeriodEnd.toISOString(),
        billingPeriod: subscriptionPlan.billingPeriod,
        planName: subscriptionPlan.name,
    });

    return { currentPeriodStart, currentPeriodEnd };
};
