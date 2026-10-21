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

const ATTRIBUTE_VALUE_TYPE = {
    STRING: 'String',
    NUMBER: 'Number',
    BOOLEAN: 'Boolean',
}

const ROLE_VALUES = Object.values(ROLE);
const STATUS_VALUES = Object.values(STATUS);
const APPROVE_STATUS_VALUES = Object.values(APPROVE_STATUS);
const ATTRIBUTE_VALUE_TYPE_VALUES = Object.values(ATTRIBUTE_VALUE_TYPE);

module.exports = {
    ROLE,
    STATUS,
    APPROVE_STATUS,
    ATTRIBUTE_VALUE_TYPE,
    ROLE_VALUES,
    STATUS_VALUES,
    APPROVE_STATUS_VALUES,
    ATTRIBUTE_VALUE_TYPE_VALUES,
};
