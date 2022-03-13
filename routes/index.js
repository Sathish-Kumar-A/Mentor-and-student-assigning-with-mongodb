var express = require('express');
var router = express.Router();
const { mongodb, db_url, MongoClient, getCollection } = require("../dbConfig");


router.get('/:collectionname/:id', async function (req, res) {
  const {query} = req.query;
  const id=req.params.id;
  const collectionName = req.params.collectionname;
  const { collection, client } = await getCollection(collectionName);
  let sendingData=[]
  try {
    let document = await collection.find({ _id: mongodb.ObjectId(id) }).toArray();
    if (query) {
      sendingData = {
        [query]: document[0][query]
      };
    }
    else {
      sendingData=document[0]
    }
    if (document.length) {
      res.send({
        message: "Success",
        data: sendingData
      });   
    }
    else {
      res.status(404).send({
        message: `Invalid ${collectionName.slice(0,collectionName.length-1)} id`,
      })
    }
  }
  catch (err) {
    console.log(err);
    res.status(500).send({
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
    res.status(500).send({
      message:"Internal Server Error"
    })
  }
  finally {
    client.close();
  }
})

router.put("/mentors/:mentorid", async (req, res) => {
  const body = req.body;
  const mentorName = req.body.mentorName;
  const students = body['students'];
  let idArray = students.map((student) => {
    return mongodb.ObjectId(student["id"]);
  })
  const id = req.params.mentorid;
  // Getting students and mentors collections
  const { collection, client } = await getCollection("mentors");
  const studentCollection = await getCollection("students");
  try {
    // getting students who are not assigned to any mentor
    let getStudents = await studentCollection.collection.find({"_id":{$in:idArray}}).toArray();
    const studentArray = getStudents.map((student) => {
      if (student.mentor!==null) {
        return {
          name: student.name,
          id: student._id
        };
      }
    });

    // Updating students who are not assigned to any mentor
    await studentCollection["collection"].updateMany({ mentor: null, _id: { $in: idArray } }, { $set: { mentor: { name: mentorName, id: id } } });
    // Updating mentor's students list
    let document = await collection.findOneAndUpdate({ _id: mongodb.ObjectId(id) }, { $push: { students: { $each: studentArray} }
    });
    if (document.value) {
      res.status(200).send({
        message: "updated successfully"
      })
    }
    else {
      res.status(404).send({
        message:"Invalid Id of either mentor or student"
      })
    }

  }
  catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Internal Server Error"
    });
  }
  finally {
    client.close();
    studentCollection["client"].close();
  }
})


router.put("/students/:studentid", async (req, res) => { 
  const studentId = req.params.studentid;
  const mentor = req.body.mentor;
  const currentMentorId = req.body.currentMentorId;
  const studentName = req.body.studentName;
  // Getting students and mentors collections
  const { collection, client } = await getCollection("students");
  const mentorCollection=await getCollection("mentors");
  try {
    // Updating the student collection with the mentor name and id
    let document = await collection.findOneAndUpdate({ _id: mongodb.ObjectId(studentId) }, { $set: { mentor: { name: mentor.name, id: mentor.id } } });
    // Removing the student from previous students list
    await mentorCollection["collection"].updateOne({ _id: mongodb.ObjectId(currentMentorId) }, { $pull: { students: { id: mongodb.ObjectId(studentId) } } });
    // Adding the student to the new mentor's students list
    let mentorDocument=await mentorCollection["collection"].findOneAndUpdate({_id:mongodb.ObjectId(mentor.id)},{$push:{students:{name:studentName,id:mongodb.ObjectId(studentId)}}});
    if (document.value && mentorDocument.value) {
      res.status(200).send({
        message: "Student's and mentor's data Updated successfully"
      })
    }
    else {
      res.status(404).send({
        message:"Invalid Id of student or mentor"
      })
    }
  }
  catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Internal Server Error"
    });
  }
  finally { 
    client.close();
  }
})
module.exports = router;
