const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    winners: {
      type: String,
      enum: ['', 'escapee', 'saboteur'],
      default: '',
    },
    status: {
      type: String,
      enum: ['playing', 'ended', 'cancelled'],
      default: 'playing',
    },
    players: {
      type: [{
        _id: { type: String, required: true },
        socketId: { type: String, required: true },
        username: { type: String, required: true },
        leader: { type: Boolean, default: false },
        // role: { type: 'a' | 'b', required: true },
        team: { type: String, enum: ['escapee', 'saboteur'], required: true },
      }],
      required: true,
    },
  },
  { timestamps: true },
);

const declareModel = () => {
  try {
    const model = mongoose.model('games');
    return model;
  } catch {
    return mongoose.model('games', gameSchema);
  }
};

module.exports = declareModel();
