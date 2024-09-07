const GameState = require('../models/GameState')

const createGameState = async (data) => {
  return await GameState(data).save();
}

exports.createGameState = createGameState;
