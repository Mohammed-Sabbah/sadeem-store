exports.sanitizeUser = (user) => {
    const plainUser = user.toObject ? user.toObject() : { ...user };
    const { password, ...safeUser } = plainUser;
    return safeUser;
}