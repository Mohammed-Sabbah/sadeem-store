const User = require("../models/User")
const Wallet = require("../models/Wallet")
const Store = require("../models/Store")
const { ROLE, STATUS } = require("../constants/enums")
const { escapeRegex } = require("../utils")
const error = require("../utils/error")
const { hasActiveTask } = require("./delivery.service")

const changeStatus = async (_id, role, status) => {
    const user = await User.findOneAndUpdate(
        { _id, role },
        { $set: { status } },
    )
    if (!user)
        throw error("User not found")
    return user
}

exports.checkRegistrationConflicts = async (email, phoneNumber) => {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return 'Email already exists';
    }

    if (phoneNumber && await User.findOne({ phoneNumber })) {
        return 'Phone number already exists';
    }

    return null;
}

exports.createUserWithWallet = async (userData, session) => {
    const options = session ? { session } : {};
    const [user] = await User.create([userData], options);

    if (user.role === ROLE.USER) {
        await Wallet.create([{
            userId: user._id,
            withdrawableBalance: 0,
            storeCreditBalance: 0,
            balance: 0,
            currency: 'ILS',
            status: STATUS.ACTIVE,
        }], options);
    }

    return user;
}

exports.listUsers = async (filters = {}) => {
    const {
        role,
        status,
        isDeleted = false,
        search,
        name,
        email,
        phoneNumber,
        createdFrom,
        createdTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = filters

    const query = { isDeleted: isDeleted ? true : { $ne: true } }
    if (role) query.role = role
    if (status) query.status = status

    const searchPattern = (value) => new RegExp(escapeRegex(value.trim()), 'i')
    if (search) {
        const pattern = searchPattern(search)
        query.$or = [
            { name: pattern },
            { email: pattern },
            { phoneNumber: pattern },
        ]
    }

    for (const [field, value] of [['name', name], ['email', email], ['phoneNumber', phoneNumber]]) {
        if (value) query[field] = searchPattern(value)
    }

    if (createdFrom || createdTo) {
        query.createdAt = {}
        if (createdFrom) query.createdAt.$gte = new Date(createdFrom)
        if (createdTo) query.createdAt.$lte = new Date(createdTo)
    }

    const pageNumber = Number(page)
    const pageSize = Number(limit)
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    const skip = (pageNumber - 1) * pageSize

    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password')
            .sort({ [sortBy]: sortDirection, _id: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean(),
        User.countDocuments(query),
    ])

    const sellers = users.filter((user) => user.role === ROLE.SELLER)
    if (sellers.length) {
        const stores = await Store.find({
            ownerId: { $in: sellers.map((user) => user._id) },
            isDeleted: { $ne: true },
        })
            .select('ownerId name logo status approveStatus')
            .lean()
        const storesByOwnerId = new Map(stores.map((store) => [store.ownerId.toString(), store]))
        for (const user of sellers) {
            user.store = storesByOwnerId.get(user._id.toString()) || null
        }
    }

    return {
        users,
        pagination: {
            page: pageNumber,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            hasNextPage: pageNumber * pageSize < total,
            hasPreviousPage: pageNumber > 1,
        },
    }
}

exports.listUser = async (userId) => {
    const user = await User.findOne({ _id: userId })
    if (!user) throw error("User not found")
    return user
}

exports.changeUserStatus = async (userId, status) => {
    const user = await User.findOne({ _id: userId, isDeleted: false })
    await changeStatus(userId, ROLE.USER, status)
}

exports.changeDriverStatus = async (driverId, status) => {
    if (await hasActiveTask(driverId))
        throw error("Cant change status of this driver because he has an active task")

    await changeStatus(driverId, ROLE.DRIVER, status)
}