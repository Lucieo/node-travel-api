const User = require('../models/user');
const {throwServerError, throwCustomError} = require('../utils/helpers');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const {jsonTokenSecret} = require('../utils/connect')

exports.signup=(req, res, next)=>{
    const errors = validationResult(req);
    !errors.isEmpty() && throwCustomError('Validation failed', 422, errors);
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    bcrypt.hash(password, 12)
    .then(hashedPw =>{
        user = new User({            
            email,
            name,
            password: hashedPw,
            name
        });
        return user.save();
    })
    .then(result=>{
        res.status(201)
        .json({message: 'User created', userId: result._id})
    })
    .catch(err=>throwServerError(err, next))
}

exports.login=(req, res, next)=>{
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({email})
    .then(user=>{
        !user && throwCustomError('Account with this email does not exist.', 404);
        loadedUser = user;
        return bcrypt.compare(password, user.password)
    })
    .then(isEqual=>{
        !isEqual && throwCustomError('Wrong password provovided', 401);
        const token = jwt.sign({
            email: loadedUser.email,
            userId: loadedUser._id.toString()
            }, 
            jsonTokenSecret,
            { expiresIn: '1h'}
        );
        res.status(200)
        .json({token, userId: loadedUser._id.toString()})
    })
    .catch(err=>throwServerError(err, next))
}