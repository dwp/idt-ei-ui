module.exports = (route) => (req, res, next) => Promise.resolve(route(req, res, next)).catch(next);
