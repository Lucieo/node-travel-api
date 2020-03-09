const {validationResult} = require('express-validator');
const Post = require('../models/post');
const User = require('../models/user');
const {throwServerError, throwCustomError, clearImage} = require('../utils/helpers');
const io = require('../socket');


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

exports.getPosts = async (req, res, next)=>{
    const currentPage = +req.query.page || 1;
    const ownPosts = Boolean(req.query.ownPosts==='true'? 1 : 0);
    const perPage = 8;
    const query = ownPosts ? {creator: req.userId.toString()}:{validated: true}
    try{
        const totalItems = await Post
        .find(query)
        .countDocuments();
        const lastPage = totalItems/perPage;
        const posts = await Post.find(query)
            .populate('creator')
            .sort({createdAt:-1})
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        res
        .status(200)
        .json({
            message: "Fetched posts",
            posts,
            totalItems,
            lastPage,
        })
    }catch(err){
        throwServerError(err, next);
    }
};

exports.createPost = async (req, res, next)=>{
    const errors = validationResult(req);
    !errors.isEmpty() && throwCustomError('Validation failed, incorrect data provided', 422, errors);
    !req.file && throwCustomError('No file attached cannot create travel Post', 422);
    const title = req.body.title;
    const content = req.body.content; 
    const longitude = req.body.longitude;
    const latitude = req.body.latitude;
    const imageUrl = req.file.path;
    const post = new Post({
        title,
        content,
        creator: req.userId,
        imageUrl,
        longitude,
        latitude
    });
    try{
        await post.save();
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        //send to all user, event of name 'post' and data you send
        io.getIO().emit('posts', {
            action: 'create',
            post: {...post._doc, creator:{
                _id: req.userId,
                name: user.name
            }}
        })
        res.status(201)
        .json({
            message:'Post created successfully!',
            post,
            creator: {_id: user._id, name: user.name}
        });
    }
    catch(err){
        throwServerError(err, next)
    }
};

exports.updatePost = async(req, res, next)=>{
    const errors = validationResult(req);
    !errors.isEmpty() && throwCustomError('Validation failed, incorrect data provided', 422, errors)

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    const longitude = req.body.longitude;
    const latitude = req.body.latitude;

    let imageUrl;
    if (req.file){
        imageUrl = req.file.path;
    }

    try{
        const post = await Post.findById(postId)
        .populate('creator')
        !post && throwCustomError('Post not found', 404);
        (post.creator._id.toString()!==req.userId) && throwCustomError('Not authorized', 401);
        if (imageUrl && imageUrl!== post.imageUrl){
            clearImage(post.imageUrl);
            post.imageUrl = imageUrl;
        }
        post.title = title;
        post.content = content;
        post.longitude = longitude;
        post.latitude = latitude;
        await post.save();
        io.getIO().emit('posts', {action: 'update', post})
        res
        .status(200)
        .json({message: 'Post updated', post})
    }
    catch(err){
        throwServerError(err, next)
    }
}

exports.deletePost = async(req, res, next)=>{
    const postId = req.params.postId;
    try{
        const post = await Post.findById(postId)
        !post && throwCustomError('Could not find post', 404);
        (post.creator.toString()!==req.userId) && throwCustomError('Not authorized', 401);
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postId)
        const user = await User.findById(req.userId)
        user.posts.pull(postId);
        await user.save();
        io.getIO().emit('posts', {action: 'delete', post: postId})
        return res.status(200)
        .json({message: 'Post deleted'})
    } catch(err){
        throwServerError(err, next)
    }
};



