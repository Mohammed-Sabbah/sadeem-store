const ROLE = {
    ADMIN: 'admin',
    USER: 'user',
    SELLER: 'seller',
    DRIVER: 'driver',
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
const TRANSACTION_TYPE = {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    PURCHASE: 'purchase',
    REFUND: 'refund',
    DRIVER_EARNING: "driver_earning",
    DRIVER_PAYOUT: "driver_payout",
    STORE_EARNING: "store_earning",
    STORE_PAYOUT: "store_payout"
};

const TRANSFER_PROVIDER = {
    PALESTINE: 'palestine',
    JAWWAL_PAY: 'jawwalpay',
    PAL_PAY: 'palpay',
};

const BALANCE_TYPE = {
    WITHDRAWABLE: "withdrawable",
    STORE_CREDIT: "storeCredit",
};

const TRANSACTION_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    COMPLETED: "completed",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
    PARTIALLY_REFUND: "partially_refund"
};

const WALLET_STATUS = {
    ACTIVE: STATUS.ACTIVE,
    IN_ACTIVE: STATUS.IN_ACTIVE,
};

// Order 
const ORDER_STATUS = {
    PENDING: "pending",
    COLLECTING: "collecting",
    COLLECTED: "collected",
    IN_DELIVERY: "in_delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled"
}

const PAYMENT_METHODS = {
    WALLET: "wallet",
    JAWWALPAY: "jawwalpay"
}

const PAYMENT_STATUS = {
    PAID: "paid",
    REFUNDED: "refunded"
}

// Delivery
const DELIVERY_STATUS = {
    COMPLETED: "completed",
    INPROGRESS: "inprogress",
    CANCELLED: "cancelled"
}

const DELIVERY_TYPE = {
    COLLECTION: "collection",
    FINAL: "final"
}

const DRIVER_PAYOUT_STATUS = {
    PENDING: "pending",
    PAID: "paid"
}

// General Enums
const ROLE_VALUES = Object.values(ROLE);
const STATUS_VALUES = Object.values(STATUS);
const APPROVE_STATUS_VALUES = Object.values(APPROVE_STATUS);
const ATTRIBUTE_VALUE_TYPE_VALUES = Object.values(ATTRIBUTE_VALUE_TYPE);

// Wallet Enums
const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPE);
const TRANSFER_PROVIDER_VALUES = Object.values(TRANSFER_PROVIDER);
const BALANCE_TYPE_VALUES = Object.values(BALANCE_TYPE);
const TRANSACTION_STATUS_VALUES = Object.values(TRANSACTION_STATUS);
const WALLET_STATUS_VALUES = Object.values(WALLET_STATUS);

// Order Enums
const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS)
const PAYMENT_METHODS_VALUES = Object.values(PAYMENT_METHODS)
const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS)

// Delivery
const DELIVERY_STATUS_VALUES = Object.values(DELIVERY_STATUS)
const DELIVERY_TYPE_VALUES = Object.values(DELIVERY_TYPE)
const DRIVER_PAYOUT_STATUS_VALUES = Object.values(DRIVER_PAYOUT_STATUS)
module.exports = {
    ROLE,
    STATUS,
    APPROVE_STATUS,
    ATTRIBUTE_VALUE_TYPE,
    WALLET_STATUS,
    TRANSACTION_TYPE,
    TRANSFER_PROVIDER,
    BALANCE_TYPE,
    TRANSACTION_STATUS,
    ORDER_STATUS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    DELIVERY_STATUS,
    DELIVERY_TYPE,
    DRIVER_PAYOUT_STATUS,
    ROLE_VALUES,
    STATUS_VALUES,
    APPROVE_STATUS_VALUES,
    ATTRIBUTE_VALUE_TYPE_VALUES,
    WALLET_STATUS_VALUES,
    TRANSACTION_TYPE_VALUES,
    TRANSFER_PROVIDER_VALUES,
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS_VALUES,
    ORDER_STATUS_VALUES,
    PAYMENT_METHODS_VALUES,
    PAYMENT_STATUS_VALUES,
    DELIVERY_STATUS_VALUES,
    DELIVERY_TYPE_VALUES,
    DRIVER_PAYOUT_STATUS_VALUES
};
