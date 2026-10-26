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

const WALLET_TRANSACTION_TYPE = {
    DEPOSIT: "deposit",
    ORDER_PAYMENT: "orderPayment",
    ORDER_REFUND: "orderRefund",
    ORDER_CANCELLATION_CREDIT: "orderCancellationCredit",
    WITHDRAWAL: "withdrawal",
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
};

const WALLET_STATUS = {
    ACTIVE: STATUS.ACTIVE,
    IN_ACTIVE: STATUS.IN_ACTIVE,
};

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

module.exports = {
    ROLE,
    STATUS,
    APPROVE_STATUS,
    ATTRIBUTE_VALUE_TYPE,
    WALLET_STATUS,
    WALLET_TRANSACTION_TYPE,
    BALANCE_TYPE,
    TRANSACTION_STATUS,
    ROLE_VALUES,
    STATUS_VALUES,
    APPROVE_STATUS_VALUES,
    ATTRIBUTE_VALUE_TYPE_VALUES,
    WALLET_STATUS_VALUES,
    WALLET_TRANSACTION_TYPE_VALUES,
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS_VALUES,
};
