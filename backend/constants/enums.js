const ROLE = {
    ADMIN: 'admin',
    USER: 'user',
    SELLER: 'seller',
    COURIER: 'courier',
};

const STATUS = {
    ACTIVE: 'active',
    IN_ACTIVE: 'inActive',
    PENDING_APPROVAL: 'pendingApproval',
};

const APPROVE_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
}

const ATTRIBUTE_VALUE_TYPE = {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
};

// Wallet 
const WALLET_TRANSACTION_TYPE = {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    PURCHASE: 'purchase',
    REFUND: 'refund',
};

const BALANCE_TYPE = {
    WITHDRAWABLE: "withdrawable",
    STORE_CREDIT: "storeCredit",
};

const TRANSACTION_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
    REFUNDED: "refunded"
};

const WALLET_STATUS = {
    ACTIVE: STATUS.ACTIVE,
    IN_ACTIVE: STATUS.IN_ACTIVE,
};

// Order 
const ORDER_STATUS = {
    CONFIRMED: "confirmed",
    PREPARING: "preparing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
}

const PAYMENT_METHODS = {
    WALLET: "wallet",
    JAWWALPAY: "jawwalpay"
}

const PAYMENT_STATUS = {
    PAID: "paid",
    REFUNDED: "refunded"
}

// General Enums
const ROLE_VALUES = Object.values(ROLE);
const STATUS_VALUES = Object.values(STATUS);
const APPROVE_STATUS_VALUES = Object.values(APPROVE_STATUS);
const ATTRIBUTE_VALUE_TYPE_VALUES = Object.values(ATTRIBUTE_VALUE_TYPE);

// Wallet Enums
const WALLET_TRANSACTION_TYPE_VALUES = Object.values(WALLET_TRANSACTION_TYPE);
const BALANCE_TYPE_VALUES = Object.values(BALANCE_TYPE);
const TRANSACTION_STATUS_VALUES = Object.values(TRANSACTION_STATUS);
const WALLET_STATUS_VALUES = Object.values(WALLET_STATUS);

// Order Enums
const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS)
const PAYMENT_METHODS_VALUES = Object.values(PAYMENT_METHODS)
const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS)

module.exports = {
    ROLE,
    STATUS,
    APPROVE_STATUS,
    ATTRIBUTE_VALUE_TYPE,
    WALLET_STATUS,
    WALLET_TRANSACTION_TYPE,
    BALANCE_TYPE,
    TRANSACTION_STATUS,
    ORDER_STATUS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    ROLE_VALUES,
    STATUS_VALUES,
    APPROVE_STATUS_VALUES,
    ATTRIBUTE_VALUE_TYPE_VALUES,
    WALLET_STATUS_VALUES,
    WALLET_TRANSACTION_TYPE_VALUES,
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS_VALUES,
    ORDER_STATUS_VALUES,
    PAYMENT_METHODS_VALUES,
    PAYMENT_STATUS_VALUES
};
