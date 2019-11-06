const express = require("express");
const router = express.Router();
const Models = require("./../models");
const User = Models.User;
const Exercise = Models.Exercise;

router.post("/new-user", function(req, res, next) {
  let payload = req.body;
  if (!payload.username) {
    return res.json({ error: "Invalid username" });
  }
  let user = { username: payload.username };
  User.create(user, (err, data) => {
    if (err && err.code === 11000) {
      return res.status(400).json({ error: "username already exists" });
    }

    if (err) return res.status(500).json(err);

    return res.json(data);
  });
});

router.get("/users", function(req, res, next) {
  User.find()
    .then(users => {
      return res.json(users);
    })
    .catch(res.status(500).json);
});

router.post("/add", function(req, res, next) {
  let payload = req.body;
  if (!payload.userId || !payload.description || !payload.duration) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  let date = new Date(payload.date);

  date = isNaN(date) ? new Date() : date;

  var exercise = {
    userId: payload.userId,
    description: payload.description,
    duration: payload.duration,
    date: date
  };

  let result = {};

  User.findOne({ _id: payload.userId })
    .then(user => {
      if (!user) {
        throw { code: "IN_NO_USER" };
      }
      result = user.toJSON();
      return Exercise.create(exercise);
    })
    .then(exercise => {
      exercise = exercise.toJSON();
      result.description = exercise.description;
      result.duration = exercise.duration;
      result.date = exercise.date;
      return res.json(result);
    })
    .catch(err => {
      if (err.code === "IN_NO_USER") {
        return res.status(400).json({ error: "No user found with given id" });
      }
      if (err.kind === "ObjectId" && err.name === "CastError") {
        return res.status(400).json({ error: "Invalid userid" });
      }
      return res.status(500).json(err);
    });
});

router.get("/log", function(req, res, next) {
  let query = req.query;

  if (!query.userId) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  let exerciseQuery = { userId: query.userId };

  if (query.from) {
    let fromDate = new Date(query.from);
    if (isNaN(fromDate)) {
      return res
        .status(400)
        .json({ error: "Invalid date format given yyyy-mm-dd" });
    }
    exerciseQuery.date = exerciseQuery.date || {};
    exerciseQuery.date["$gte"] = fromDate;
  }

  if (query.to) {
    let toDate = new Date(query.to);
    if (isNaN(toDate)) {
      return res
        .status(400)
        .json({ error: 'Invalid "date", format given yyyy-mm-dd' });
    }
    exerciseQuery.date = exerciseQuery.date || {};
    exerciseQuery.date["$lte"] = toDate;
  }

  let queryLimit = 1000;

  if (query.limit) {
    queryLimit = parseInt(query.limit);
    if (isNaN(queryLimit)) {
      return res
        .status(400)
        .json({ error: 'Invalid "limit", format should be number' });
    }
  }

  let result = {};
  User.findOne({ _id: query.userId })
    .then(user => {
      if (!user) {
        throw { code: "IN_NO_USER" };
      }
      result = user.toJSON();
      return Exercise.find(exerciseQuery)
        .select("-_id -userId")
        .limit(queryLimit);
    })
    .then(exercises => {
      result.count = exercises.length;
      result.log = exercises;
      return res.json(result);
    })
    .catch(err => {
      if (err.code === "IN_NO_USER") {
        return res.status(400).json({ error: "No user found with given id" });
      }

      return res.status(500).json(err);
    });
});

module.exports = router;
