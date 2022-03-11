var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post("/creatementor", async (req, res) => {
  res.send("I will create")
})
module.exports = router;
