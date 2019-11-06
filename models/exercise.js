const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date },
  __v: { type: Number, select: false }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);
module.exports = Exercise;