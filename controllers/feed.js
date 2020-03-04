const {validationResult} = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
const {throwServerError, throwCustomError, clearImage} = require('../utils/helpers');



exports.getPost = (req, res, next)=>{
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post=>{
        !post && throwCustomError(errors, 'Could not find post', 404);
        res
        .status(200)
        .json({
            message: 'Post fetched', 
            post
        })
    })
    .catch(err=> throwServerError(err, next))
}

exports.getPosts = (req, res, next)=>{
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post
    .find()
    .countDocuments()
    .then(count=>{
        totalItems = count;
        return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then(posts=>{
        res
        .status(200)
        .json({
            message: "Fetched posts",
            posts,
            totalItems,
        })
    })
    .catch(err=> throwServerError(err, next))
};

exports.createPost = (req, res, next)=>{
    const errors = validationResult(req);
    !errors.isEmpty() && throwCustomError('Validation failed, incorrect data provided', 422, errors);
    !req.file && throwCustomError('No file attached cannot create travel Post', 422);
    const title = req.body.title;
    const content = req.body.content; 
    const imageUrl = req.file.path;
    let creator
    const post = new Post({
        title,
        content,
        creator: req.userId,
        imageUrl
    });
    post
    .save()
    .then(result=>{
        return User.findById(req.userId)
    })
    .then(user=>{
        creator = user;
        user.posts.push(post);
        return user.save();
    })
    .then(result=>{
        res.status(201)
        .json({
            message:'Post created successfully!',
            post,
            creator: {_id: creator._id, name: creator.name}
        });
    })
    .catch(err=> throwServerError(err, next))
};

exports.updatePost = (req, res, next)=>{
    const errors = validationResult(req);
    !errors.isEmpty() && throwCustomError('Validation failed, incorrect data provided', 422, errors)

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.imageUrl;
    if (req.file){
        imageUrl = req.file.path;
    }
    !imageUrl && throwCustomError('No file picked', 422);

    Post.findById(postId)
    .then(post=>{
        !post && throwCustomError('Post not found', 404);
        (post.creator.toString()!==req.userId) && throwCustomError('Not authorized', 401);
        if (imageUrl!== post.imageUrl){
            clearImage(post.imageUrl)
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save();
    })
    .then(result=>{
        res
        .status(200)
        .json({message: 'Post updated', post: result})
    })
    .catch(err=> throwServerError(err, next))
}

exports.deletePost = (req, res, next)=>{
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post=>{
        //Check logged in user
        !post && throwCustomError('Could not find post', 404);
        (post.creator.toString()!==req.userId) && throwCustomError('Not authorized', 401);
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId)
    })
    .then(result=>{
        return User.findById(req.userId)
    })
    .then(user=>{
        user.post.pull(postId);
        return user.save();
    })
    .catch(err=>throwServerError(err, next))
};



