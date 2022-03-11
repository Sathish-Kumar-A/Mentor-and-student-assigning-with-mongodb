const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const db_url = "mongodb+srv://sathishkumar:sathish25@cluster0.mkek8.mongodb.net/test";

const getCollection = async(collectionName) => {
    const client =await MongoClient.connect(db_url);
    const db =await client.db("nodemongoconnect");
    const collection = await db.collection(collectionName);
    return {collection:collection,client:client};
}
module.exports = { mongodb, MongoClient, db_url,getCollection };