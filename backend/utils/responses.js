const success = (res, status, data) =>
    res.status(status || 200).json(data || { status: 'success', msg: 'تمت العملية بنجاح' });

const error = (res, status, msg) =>
    res.status(status || 400).json({ status: 'fail', msg: msg || 'حدث خطأ ما' });

const serverError = (res, msg) =>
    res.status(500).json({ status: 'error', msg: msg || 'حدث خطأ ما' });

module.exports = {
    success,
    error,
    serverError,
};
