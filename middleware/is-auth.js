const jwt = require('jsonwebtoken');
const {jsonTokenSecret} = require('../utils/connect');
const {throwCustomError} = require('../utils/helpers');

module.exports = (req, res, next)=>{
    const authHeader = req.get('Authorization')
    !authHeader && throwCustomError('Not authenticated', 401);
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try{
        decodedToken = jwt.verify(token, jsonTokenSecret)
    } catch(err){
        err.statusCode = 500;
        throw err;
    }
    //Wasn't able to verify token
    !decodedToken && throwCustomError('Not authenticated', 401);
    //Else store userid
    req.userId = decodedToken.userId;
    next()
};