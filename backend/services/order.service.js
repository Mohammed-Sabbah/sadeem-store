const mongoose = require("mongoose");
const Order = require("../models/order.model");
const error = require("../utils/error");
const { ORDER_STATUS_VALUES } = require("../constants/enums")
const { ROLE } = require("../constants/enums")

const SORT_FIELDS = ["createdAt", "updatedAt", "totalAmount"];

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listOrders = async ({
    actor,
    status,
    search,
    startDate,
    endDate,
    userId,
    storeId,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
}) => {
    if (!actor?.id || !actor?.role) {
        throw error("Authentication required", 401);
    }

    const query = {};

    // 1. Apply access restrictions based on the authenticated role.
    switch (actor.role) {
        case ROLE.USER:
            query.userId = actor._id;
            break;

        case ROLE.SELLER:
            if (!actor.storeId) {
                throw error("Store not found", 404);
            }

            query.storeId = actor.storeId;
            break;

        case ROLE.ADMIN:
            // Admin can list orders across the marketplace.
            if (userId) {
                if (!mongoose.isValidObjectId(userId)) {
                    throw error("Invalid buyer ID", 400);
                }

                query.userId = userId;
            }

            if (storeId) {
                if (!mongoose.isValidObjectId(storeId)) {
                    throw error("Invalid store ID", 400);
                }

                query.storeId = storeId;
            }
            break;

        default:
            throw error("Forbidden", 403);
    }

    // 2. Filter by order status.
    if (status) {
        if (!ORDER_STATUS_VALUES.includes(status)) {
            throw error("Invalid order status", 400);
        }
        query.status = status;
    }

    // 3. Search by order number or product title.
    if (search?.trim()) {
        const searchRegex = new RegExp(
            escapeRegex(search.trim()),
            "i"
        );
        query.$or = [
            { orderNumber: searchRegex },
            { "items.productTitle": searchRegex },
        ];
    }

    // 4. Filter by creation date.
    if (startDate || endDate) {
        const dateFilter = {};

        if (startDate) {
            const start = new Date(startDate);

            if (Number.isNaN(start.getTime())) {
                throw error("Invalid start date", 400);
            }

            dateFilter.$gte = start;
        }

        if (endDate) {
            const end = new Date(endDate);

            if (Number.isNaN(end.getTime())) {
                throw error("Invalid end date", 400);
            }

            // Include the entire specified end date.
            end.setUTCHours(23, 59, 59, 999);
            dateFilter.$lte = end;
        }

        if (
            dateFilter.$gte &&
            dateFilter.$lte &&
            dateFilter.$gte > dateFilter.$lte
        ) {
            throw error(
                "Start date must be before end date",
                400
            );
        }

        query.createdAt = dateFilter;
    }

    // 5. Validate pagination.
    page = Number(page);
    limit = Number(limit);

    if (
        !Number.isInteger(page) ||
        !Number.isInteger(limit) ||
        page < 1 ||
        limit < 1
    ) {
        throw error("Invalid pagination parameters", 400);
    }

    limit = Math.min(limit, 100);

    // 6. Whitelist sorting fields and direction.
    if (!SORT_FIELDS.includes(sortBy)) {
        sortBy = "createdAt";
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    // 7. Fetch results and total count.
    const [orders, totalOrders] = await Promise.all([
        Order.find(query)
            .sort({ [sortBy]: sortDirection, _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate("storeId", "name logo")
            .populate("userId", "name phoneNumber")
            .lean(),
        Order.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            page,
            limit,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            hasNextPage: page * limit < totalOrders,
            hasPreviousPage: page > 1,
        },
    };
};

const listOrder = async ({ orderId, actor, storeId }) => {
    const filter = { _id: orderId };

    switch (actor.role) {
        case ROLE.USER:
            filter.userId = actor._id;
            break;

        case ROLE.SELLER:
            if (!storeId) throw error("Store Not Found");
            filter.storeId = storeId;
            break;

        case ROLE.ADMIN:
            // Admin can access any order
            break;

        default:
            throw error("Unauthorized");
    }

    const order = await Order.findOne(filter);

    if (!order) throw error("Order Not Found");

    return order;
};

const createOrder = () => {

}

module.exports = {
    listOrders,
    listOrder,
    createOrder
}