const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title:{
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creator:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    longitude:{
        type: Number,
        default: '2.3488'
    },
    latitude:{
        type: Number,
        default: '48.8534'
    },
    validated:{
        type: Boolean,
        default: false
    }
}, 
{timestamps: true})
// Auto created at updated at timestamps

module.exports = mongoose.model('Post', postSchema);