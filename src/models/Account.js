const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    provider: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const declareModel = () => {
  try {
    const model = mongoose.model('accounts');
    return model;
  } catch {
    return mongoose.model('accounts', accountSchema);
  }
};

module.exports = declareModel();
