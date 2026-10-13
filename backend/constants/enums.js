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

const APPROVE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

const STORE_APPROVE_STATUS = APPROVE_STATUS;

const ROLE_VALUES = Object.values(ROLE);
const STATUS_VALUES = Object.values(STATUS);
const APPROVE_STATUS_VALUES = Object.values(APPROVE_STATUS);
const STORE_APPROVE_STATUS_VALUES = APPROVE_STATUS_VALUES;

module.exports = {
    ROLE,
    STATUS,
    APPROVE_STATUS,
    STORE_APPROVE_STATUS,
    ROLE_VALUES,
    STATUS_VALUES,
    APPROVE_STATUS_VALUES,
    STORE_APPROVE_STATUS_VALUES,
};
