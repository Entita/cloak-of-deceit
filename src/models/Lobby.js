const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lobbySchema = new Schema(
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
        username: { type: String, required: true },
        leader: { type: Boolean, default: false }
      }],
      required: true,
    },
    expireAt: {
      type: Date,
      default: new Date().setDate(new Date().getDate() + 1),
    }
  },
  { timestamps: true },
);

const declareModel = () => {
  try {
    const model = mongoose.model('lobbies');
    return model;
  } catch {
    return mongoose.model('lobbies', lobbySchema);
  }
};

module.exports = declareModel();
