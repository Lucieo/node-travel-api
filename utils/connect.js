exports.mongoUrl = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-zdkjd.mongodb.net/${process.env.MONGO_DEFAULT_DB}?retryWrites=true&w=majority`;

exports.jsonTokenSecret = process.env.JSON_TOKEN_SECRET;