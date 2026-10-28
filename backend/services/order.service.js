const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/Product")
const Variant = require("../models/Variant")
const User = require("../models/User")
const Store = require("../models/Store")
const error = require("../utils/error");
const { ORDER_STATUS_VALUES, STATUS, APPROVE_STATUS, PAYMENT_METHODS_VALUES, PAYMENT_METHODS } = require("../constants/enums")
const { ROLE } = require("../constants/enums")
const { escapeRegex } = require("../utils")
const { payForOrder } = require("../services/walletService");
const { updateVariantStock } = require("./variant.service");

const SORT_FIELDS = ["createdAt", "updatedAt", "totalAmount"];

// Helpers
const payWithJawwalPay = () => {

}

const payWithWallet = async (order, session) => {
    await payForOrder({
        orderId: order._id,
        userId: order.userId,
        amount: order.totalAmount
    }, session)
}

const validateOrderItems = async (items, session) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw error("Can't create an empty order");
    }

    const filters = {
        isDeleted: false,
        status: STATUS.ACTIVE,
        approveStatus: APPROVE_STATUS.APPROVED,
    };

    const validatedItems = await Promise.all(
        items.map(async ({ productId, variantId, quantity }) => {
            const product = await Product.findOne({
                _id: productId,
                ...filters,
            }).session(session);

            if (!product) {
                throw error("Invalid Order Items");
            }

            const variant = await Variant.findOne({
                _id: variantId,
                productId: product._id,
                ...filters,
            }).session(session);

            if (!variant) {
                throw error("Invalid Order Items");
            }

            if (variant.stock < quantity) {
                throw error("Insufficient Stock");
            }

            return {
                product,
                variant,
                quantity,
                unitPrice: variant.price,
                subtotal: variant.price * quantity,
            };
        })
    );

    return validatedItems;
};

const validateUserAndStore = async ({ userId, storeId }, session) => {
    const user = await User.findOne({ _id: userId, status: STATUS.ACTIVE, isDeleted: false }).session(session)
    if (!user)
        throw error("User not Found")
    const store = await Store.findOne({ _id: storeId, status: STATUS.ACTIVE, approveStatus: APPROVE_STATUS.APPROVED, isDeleted: false }).session(session)
    if (!store)
        throw error("Store not Found")
    return { store, user }
}

const calculateOrderTotalAmount = (items) => {
    return items.reduce((total, item) => total + item.subtotal, 0);
}

const proccessPayment = async (order, session) => {
    if (!PAYMENT_METHODS_VALUES.includes(order.paymentMethod))
        throw error("Invalid Payment Method")

    switch (order.paymentMethod) {
        case PAYMENT_METHODS.WALLET:
            await payWithWallet(order, session)
            break;
        case PAYMENT_METHODS.JAWWALPAY:
            payWithJawwalPay()
            break;
        default: throw error("Invalid Payment Method")
    }
}

const decreaseVariantStock = async (item, session) => {
    const itemStock = item.quantity
    const newStock = item.variant.stock - itemStock
    await updateVariantStock({ variantId: item.variant._id, newStock }, session)
}

const decreaseVariantsStock = async (items, session) => {
    await Promise.all(
        items.map(async (item) => {
            await decreaseVariantStock(item, session)
        })
    )

}

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

const createOrder = async ({ userId, storeId, items, deliveryAddress, deliveryPhone, paymentMethod }) => {
    const session = await mongoose.startSession()
    try {
        let createdOrder;
        await session.withTransaction(async () => {
            // validate order items
            const orderItems = await validateOrderItems(items, session)

            // validate user and store
            const { user, store } = await validateUserAndStore({ userId, storeId }, session)

            //  calculate Total Amount 
            const totalAmount = calculateOrderTotalAmount(orderItems)

            // create Order
            const [order] = await Order.create(
                [{
                    userId: user._id,
                    storeId: store._id,
                    items: orderItems,
                    deliveryAddress,
                    deliveryPhone,
                    paymentMethod,
                    totalAmount,
                }],
                { session }
            );

            // complete Payment
            await proccessPayment(order, session)

            // decrease item stock
            await decreaseVariantsStock(orderItems, session)
            createdOrder = order
        })
        return createdOrder
    } finally {
        await session.endSession()
    }
}

module.exports = {
    listOrders,
    listOrder,
    createOrder
}