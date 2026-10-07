const ROLE = {
    ADMIN: 'admin',
    USER: 'user',
    SELLER: 'seller',
    COURIER: 'courier',
};

const STATUS = {
    ACTIVE: 'active',
    IN_ACTIVE: 'inActive',
};

const STORE_APPROVE_STATUS = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
}

const ROLE_VALUES = Object.values(ROLE);
const STATUS_VALUES = Object.values(STATUS);
const STORE_APPROVE_STATUS_VALUES = Object.values(STORE_APPROVE_STATUS);

module.exports = {
    ROLE,
    STATUS,
    STORE_APPROVE_STATUS,
    ROLE_VALUES,
    STATUS_VALUES,
    STORE_APPROVE_STATUS_VALUES
};
