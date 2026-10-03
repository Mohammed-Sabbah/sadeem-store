const ROLE = {
    ADMIN: 'admin',
    USER: 'user',
    SELLER: 'seller',
};

const STATUS = {
    ACTIVE: 'active',
    IN_ACTIVE: 'inActive',
    PENDING_APPROVAL: 'pendingApproval',
};

const ROLE_VALUES = Object.values(ROLE);
const STATUS_VALUES = Object.values(STATUS);

module.exports = {
    ROLE,
    STATUS,
    ROLE_VALUES,
    STATUS_VALUES,
};
