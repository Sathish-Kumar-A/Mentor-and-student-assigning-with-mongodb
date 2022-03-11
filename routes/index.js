var express = require('express');
var router = express.Router();
const { mongodb, db_url, MongoClient, getCollection } = require("../dbConfig");

/* GET home page. */
router.get('/:collectionname', async function (req, res, next) {
  const collectionName = req.params.collectionname;
  const {collection,client} = await getCollection(collectionName);
  try {
    let document = await collection.find().toArray();
    res.send({
      message: "Success",
      data: document
    });
  }
  catch (err) {
    console.log(err);
    res.status(404).send({
      message:"Internal Server Error"
    })
  }
  finally {
    client.close();
  }
});

router.post("/:collectionname/create", async (req, res) => {
  const collectionName = req.params.collectionname;
  const {collection,client} = await getCollection(collectionName);
  try {
    const body = req.body;
    await collection.insertMany([body]);
    res.status(200).send({
      message: `${collectionName} created`,
    })
  }
  catch (err) {
    console.log(err);
    res.status(404).send({
      message:"Internal Server Error"
    })
  }
  finally {
    client.close();
  }
})

router.put("/mentors/:mentorid", async (req, res) => {
  const body = req.body;
  const students = body['students'];
  let idArray = students.map((student) => {
    return student["id"];
  })
  const id = req.params.mentorid;
  console.log(idArray)
  const { collection, client } = await getCollection("mentors");
  try {
    let document = await collection.findOneAndUpdate({ _id: mongodb.ObjectId(id) }, { $set: body });
    if (document.value) {
      res.status(200).send({
        message:"updated successfully"
      })
    }
    else {
      res.status(404).send({
        message:"Invalid Id"
      })
    }

  }
  catch (err) {
    console.log(err);
    res.send({
      message: "Internal Server Error"
    });
  }
  finally {
    client.close();
  }
})

module.exports = router;
