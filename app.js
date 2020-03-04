const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {mongoUrl} = require('./utils/connect');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

//MULTER Where to store uploaded files => where to save / how to name file
const fileStorage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, 'images')
    },
    filename: (req, file, cb)=>{
        cb(null, new Date().toISOString()+"_"+file.originalname)
    }
})

//MULTER Filter files that do not comply with format accepted
const fileFilter = (req, file, cb)=>{
    if(file.mimetype === 'image/png' 
        || file.mimetype === 'image/jpeg' 
        || file.mimetype === 'image/jpg'
    ){
        cb(null, true);
    }else{
        cb(null, false);
    }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
//Register MULTER - expect single file in field called image
app.use(multer({storage: fileStorage, fileFilter}).single('image'));
//Serve Static Files
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes); 

// Global error handling functionality
app.use((error, req, res, next)=>{
    console.log(error); // display it for dev
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message, data})
});

mongoose
.connect(mongoUrl)
.then(result=>{
    app.listen(8080);
})
