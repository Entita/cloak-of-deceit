const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameStateSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    players: {
      type: [{
        _id: { type: String, required: true },
        socketId: { type: String, required: true },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
      }],
      required: true,
    },
  },
  { timestamps: true },
);

const declareModel = () => {
  try {
    const model = mongoose.model('game-states');
    // model already declared
    return model;
  } catch {
    // declare model
    return mongoose.model('game-states', gameStateSchema);
  }
};

module.exports = declareModel();