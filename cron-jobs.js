const cron = require('node-cron');
const Post = require('./models/post');
const User = require('./models/user');

//Guest Posts Cleaning Cron
exports.postCleaningCron = ()=>{
    cron.schedule("30 23 * * *", async function(){
        console.log("Cleaning post cron starting")
        const guests = await User
        .find({admin: false})
        await Post.find({creator: {$in: guests}}).deleteMany();
        await User.update({admin: false}, {posts: []});
        console.log("Cleaning post cron finished")
    });
}