const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

const dbConnect = async () => {
  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(process.env.MONGODB_URL);
};
exports.dbConnect = dbConnect;