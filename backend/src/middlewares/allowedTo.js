const { error } = require('../utils/responses');

module.exports = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, 403, 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
    }
    next();
  };
};
