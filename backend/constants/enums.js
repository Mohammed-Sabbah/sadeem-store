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

const STORE_APPROVE_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
}

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
    COMPLETED: "completed",
    REJECTED: "rejected",
    FAILED: "failed",
    CANCELLED: "cancelled",
};

const WALLET_STATUS = {
    ACTIVE: STATUS.ACTIVE,
    IN_ACTIVE: STATUS.IN_ACTIVE,
};

const ROLE_VALUES = Object.values(ROLE);
const STATUS_VALUES = Object.values(STATUS);
const STORE_APPROVE_STATUS_VALUES = Object.values(STORE_APPROVE_STATUS);
const WALLET_TRANSACTION_TYPE_VALUES = Object.values(WALLET_TRANSACTION_TYPE);
const BALANCE_TYPE_VALUES = Object.values(BALANCE_TYPE);
const TRANSACTION_STATUS_VALUES = Object.values(TRANSACTION_STATUS);
const WALLET_STATUS_VALUES = Object.values(WALLET_STATUS);

module.exports = {
    ROLE,
    STATUS,
    STORE_APPROVE_STATUS,
    WALLET_STATUS,
    WALLET_TRANSACTION_TYPE,
    BALANCE_TYPE,
    TRANSACTION_STATUS,
    ROLE_VALUES,
    STATUS_VALUES,
    STORE_APPROVE_STATUS_VALUES,
    WALLET_STATUS_VALUES,
    WALLET_TRANSACTION_TYPE_VALUES,
    BALANCE_TYPE_VALUES,
    TRANSACTION_STATUS_VALUES,
};
