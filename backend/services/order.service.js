const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/Product")
const Variant = require("../models/Variant")
const Store = require("../models/Store")
const OrderGroup = require("../models/OrderGroup.model")
const error = require("../utils/error");
const {
    ORDER_STATUS_VALUES,
    STATUS,
    APPROVE_STATUS,
    PAYMENT_METHODS_VALUES,
    PAYMENT_METHODS,
    ORDER_STATUS,
    PAYMENT_STATUS
} = require("../constants/enums")
const { ROLE } = require("../constants/enums")
const { escapeRegex } = require("../utils")
const { payForOrder, refundOrder, refundOrderItemsCancellation } = require("../services/walletService");
const SORT_FIELDS = ["createdAt", "updatedAt", "totalAmount"];

// Helpers
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
        items.map(async ({ variantId, quantity }) => {

            // 1. Find the variant
            const variant = await Variant.findOne({
                _id: variantId,
                ...filters,
            }).session(session);

            if (!variant) {
                throw error("Invalid Order Items");
            }

            // 2. Find the product associated with the variant
            const product = await Product.findOne({
                _id: variant.productId,
                ...filters,
            }).session(session);

            if (!product) {
                throw error("Invalid Order Items");
            }

            // 4. Validate stock
            if (variant.stock < quantity) {
                throw error("Insufficient Stock");
            }

            return {
                productId: product._id,
                variantId: variant._id,
                productTitle: product.title,
                storeId: product.storeId,
                image: variant.image,
                quantity,
                unitPrice: variant.price,
                subtotal: variant.price * quantity,
            };
        })
    );

    return {
        orderItems: validatedItems,
    };
};

const divideByStore = async (items, session) => {
    const storeMap = new Map();

    // 1. Group items by store
    for (const item of items) {
        const storeId = item.storeId.toString();

        if (!storeMap.has(storeId)) {
            storeMap.set(storeId, {
                storeId: item.storeId,
                items: [],
                subtotal: 0
            });
        }

        const storeOrder = storeMap.get(storeId);

        storeOrder.items.push(item);
        storeOrder.subtotal += item.subtotal;
    }

    // 2. Verify each unique store
    const storeIds = [...storeMap.keys()];

    const stores = await Store.find({
        _id: { $in: storeIds },
        status: STATUS.ACTIVE,
    })
        .select("_id regionId")
        .session(session)
        .lean();

    if (stores.length !== storeIds.length) {
        throw error("One or more stores are invalid or inactive");
    }

    // 3. Attach regionId to each store order
    const storeRegionMap = new Map(
        stores.map(store => [
            store._id.toString(),
            store.regionId
        ])
    );

    return Array.from(storeMap.values()).map(storeOrder => ({
        ...storeOrder,
        regionId: storeRegionMap.get(storeOrder.storeId.toString())
    }));
};

const divideByRegion = (storeOrders) => {
    const regionMap = new Map();

    for (const order of storeOrders) {
        const regionId = order.regionId.toString();

        if (!regionMap.has(regionId)) {
            regionMap.set(regionId, {
                regionId: order.regionId,
                orders: [],
                subtotal: 0
            });
        }

        const region = regionMap.get(regionId);

        region.orders.push(order);
        region.subtotal += order.subtotal;
    }

    return Array.from(regionMap.values());
};

const createStoresOrders = async ({ orders, userId, orderGroupId, deliveryPhone, deliveryAddress }, session) => {
    const createdOrders = [];

    for (const order of orders) {
        const [createdOrder] = await Order.create([{
            storeId: order.storeId,
            userId,
            orderGroupId,
            items: order.items,
            subtotal: order.subtotal,
            deliveryPhone,
            deliveryAddress,
            regionId: order.regionId
        }], { session });

        createdOrders.push(createdOrder);
    }

    return createdOrders;
}

const calculateTotalOrdersAmount = (storeOrders, deliveryFee) => {
    const subtotal = storeOrders.reduce(
        (total, order) => total + order.subtotal,
        0
    );

    return {
        subtotal,
        totalAmount: subtotal ? subtotal + deliveryFee : subtotal
    };
}

const calculateOrderSubtotal = (order) => order.items
    .filter(item => item.status === STATUS.ACTIVE)
    .reduce((sum, item) => sum + item.subtotal, 0)

const cancelItem = (order, variantId) => {
    const orderItem = order.items.find(
        item => item.variantId.toString() === variantId &&
            item.status === STATUS.ACTIVE
    );
    if (!orderItem)
        throw error("Order Item Not Found")

    order.items = order.items.map(item =>
        item.variantId.toString() === variantId
            ? { ...item.toObject(), status: STATUS.IN_ACTIVE }
            : item
    );
    return orderItem
}

const decreaseVariantsStock = async (items, session) => {
    const decreaseVariantStock = async (item, session) => {
        const variant = await Variant.findOneAndUpdate(
            {
                _id: item.variantId,
                productId: item.productId,
                status: STATUS.ACTIVE,
                approveStatus: APPROVE_STATUS.APPROVED,
                isDeleted: false,
                stock: { $gte: item.quantity },
            },
            {
                $inc: { stock: -item.quantity },
            },
            { session, new: true }
        );

        if (!variant) {
            throw error("Insufficient Stock or invalid variant");
        }
    };
    await Promise.all(
        items.map(async (item) => {
            await decreaseVariantStock(item, session)
        })
    )
}

const increaseVariantsStock = async (items, session) => {
    const increaseVariantStock = async (item, session) => {
        const variant = await Variant.findOneAndUpdate(
            {
                _id: item.variantId,
                productId: item.productId,
                status: STATUS.ACTIVE,
                approveStatus: APPROVE_STATUS.APPROVED,
                isDeleted: false,
            },
            {
                $inc: { stock: +item.quantity },
            },
            { session, new: true }
        );

        if (!variant) {
            throw error("Insufficient Stock or invalid variant");
        }
    }

    await Promise.all(
        items.map(async (item) => {
            await increaseVariantStock(item, session)
        })
    )

}

const payWithJawwalPay = () => {

}

const payWithWallet = async (orderGroup, session) => {
    await payForOrder({
        orderGroupId: orderGroup._id,
        userId: orderGroup.userId,
        amount: orderGroup.totalAmount
    }, session)
}

const proccessPayment = async (orderGroup, session) => {
    if (!PAYMENT_METHODS_VALUES.includes(orderGroup.paymentMethod))
        throw error("Invalid Payment Method")

    switch (orderGroup.paymentMethod) {
        case PAYMENT_METHODS.WALLET:
            await payWithWallet(orderGroup, session)
            break;
        case PAYMENT_METHODS.JAWWALPAY:
            throw error("JawwalPay is not implemented yet", 501)
            // payWithJawwalPay()
            break;
        default: throw error("Invalid Payment Method")
    }
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
            if (!storeId) {
                throw error("Store not found", 404);
            }

            query.storeId = storeId;
            break;

        case ROLE.ADMIN:
            // Admin can list orders across the marketplace.
            if (userId) {
                if (!mongoose.isValidObjectId(userId)) {
                    throw error("Invalid user ID", 400);
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

const createOrder = async ({ userId, items, deliveryAddress, deliveryPhone, paymentMethod }) => {
    const session = await mongoose.startSession()
    try {
        let createdOrderGroup;
        let createdOrders;
        await session.withTransaction(async () => {
            // validate order items - return validated order items 
            const { orderItems } = await validateOrderItems(items, session)

            // divide order items by store
            const storeOrders = await divideByStore(orderItems, session)

            // divide store orders by region
            const regionOrders = divideByRegion(storeOrders)

            // calculate delivery fees - based on the regions and stores of every region
            const deliveryFee = 10

            // calculate total amount for each region order
            const { totalAmount, subtotal } = calculateTotalOrdersAmount(storeOrders, deliveryFee)

            // create the order group
            const [orderGroup] = await OrderGroup.create(
                [{
                    userId,
                    deliveryAddress,
                    deliveryPhone,
                    paymentMethod,
                    subtotal,
                    deliveryFee,
                    totalAmount
                }],
                { session }
            );

            // process Payment - with wallet in v1
            await proccessPayment(orderGroup, session)

            // create the store orders
            const subOrders = await createStoresOrders({
                orders: storeOrders,
                userId,
                orderGroupId: orderGroup._id,
                deliveryAddress,
                deliveryPhone
            }, session)

            const subOrdersIds = subOrders.map(subOrder => subOrder._id)
            orderGroup.orders = subOrdersIds
            await orderGroup.save({ session })

            // decrease variants stock
            await decreaseVariantsStock(orderItems, session)

            createdOrderGroup = orderGroup
            createdOrders = subOrders
        })
        return { createdOrderGroup, createdOrders }
    } finally {
        await session.endSession()
    }
}

const cancelOrderItem = async ({ orderId, storeId, variantId }) => {
    const session = await mongoose.startSession()
    try {
        let updatedOrder;
        await session.withTransaction(async () => {
            // Find Order
            const order = await Order.findOne(
                {
                    _id: orderId,
                    storeId,
                    status: ORDER_STATUS.PENDING
                }).session(session)
            if (!order) throw error("Order Not Found")

            // cancel item
            const orderItem = cancelItem(order, variantId)

            // update the item stock
            await increaseVariantsStock([orderItem], session)

            // check if all items are cancelled, then cancel the order
            const allItemsCancelled = order.items.every(item => item.status === STATUS.IN_ACTIVE);
            if (allItemsCancelled) {
                order.status = ORDER_STATUS.CANCELLED
                order.cancelledBy = storeId
                order.cancelledAt = new Date()
            }

            // calculate the new subtotal and amount and refund the user
            const newSubtotal = calculateOrderSubtotal(order)
            order.subtotal = newSubtotal;

            // save the order
            await order.save({ session })

            // find order group
            const orderGroup = await OrderGroup.findOne({
                _id: order.orderGroupId,
                status: ORDER_STATUS.PENDING
            }).session(session)

            if (!orderGroup)
                throw error("Order Group not found")

            // get the old total amount
            const oldTotalAmount = orderGroup.totalAmount

            // find subOrders of the order group
            const subOrders = await Order.find({ orderGroupId: orderGroup._id }).session(session)

            // check all orders cancelled 
            const allOrdersCancelled = subOrders.every(
                subOrder => subOrder.status === ORDER_STATUS.CANCELLED
            );

            if (allOrdersCancelled) {
                orderGroup.status = ORDER_STATUS.CANCELLED;
            }

            // calculate the new deliveryfee
            const deliveryFee = 10

            // calculate the new subtotal and amount of the order group
            const { subtotal, totalAmount } = calculateTotalOrdersAmount(subOrders, deliveryFee)

            // update the order group
            orderGroup.subtotal = subtotal
            orderGroup.totalAmount = totalAmount
            orderGroup.deliveryFee = deliveryFee
            await orderGroup.save({ session })

            // refund the user 
            const refundAmount = oldTotalAmount - totalAmount
            if (refundAmount > 0) {
                await refundOrderItemsCancellation({
                    orderGroupId: orderGroup._id,
                    userId: orderGroup.userId,
                    amount: refundAmount,
                    paymentMethod: orderGroup.paymentMethod
                }, session);
            }
            updatedOrder = orderGroup
        })
        return updatedOrder
    } finally {
        await session.endSession()
    }
}

const cancelOrder = async ({ user, orderGroupId, orderId, store = null }) => {
    const targetGroupId = orderGroupId || orderId;
    const session = await mongoose.startSession()
    try {
        let cancelledOrder;
        await session.withTransaction(async () => {
            const userRole = user?.role

            let userId;
            switch (userRole) {
                case ROLE.ADMIN:
                    break;
                case ROLE.USER:
                    userId = user._id
                    break;
                default:
                    throw error("Invalid User Role", 400)
            }

            // Update Order
            const orderFilters = {
                _id: targetGroupId,
                status: ORDER_STATUS.PENDING,
                ...(userId ? { userId } : {}),
            }
            const orderGroup = await OrderGroup.findOneAndUpdate(
                orderFilters,
                { status: ORDER_STATUS.CANCELLED, paymentStatus: PAYMENT_STATUS.REFUNDED },
                { session, new: true }
            )

            if (!orderGroup)
                throw error("Order Not Found")

            // refund order
            await refundOrder({ orderGroupId: orderGroup._id, userId: orderGroup.userId }, session)

            // update variants stock
            const subOrders = await Order.find({ orderGroupId: orderGroup._id }).session(session)
            const allItems = subOrders.flatMap(order => order.items).filter(item => item.status === STATUS.ACTIVE)
            await increaseVariantsStock(allItems, session)

            // cancel orders 
            subOrders.map(order => order.status = ORDER_STATUS.CANCELLED)
            await Promise.all(subOrders.map(order => order.save({ session })))

            cancelledOrder = orderGroup
        })
        return cancelledOrder;
    } finally {
        session.endSession()
    }
}

module.exports = {
    listOrders,
    listOrder,
    createOrder,
    cancelOrder,
    cancelOrderItem
}