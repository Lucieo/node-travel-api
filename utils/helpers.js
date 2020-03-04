const fs = require('fs');
const path = require('path');

exports.clearImage = filePath =>{
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err=> console.log(err))
}

exports.throwCustomError = (message, code, errors=undefined)=>{
    const error = new Error(message);
    error.statusCode = code;
    error.data = errors.array();
    throw error;
}

exports.throwServerError = (err, next)=>{
    if(!err.statusCode){
        err.statusCode = 500;
    }
    next(err);
}