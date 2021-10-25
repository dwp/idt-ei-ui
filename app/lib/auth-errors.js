// TODO: Create functions to detect more specific errors returned from AM tree
const isAuthFailure = (err) => err.response && err.response.status === 401;

module.exports = { isAuthFailure };
