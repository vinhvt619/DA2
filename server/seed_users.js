import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './.env' }); // Adjust if needed

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash('1111', salt);

    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = await User.create({ username: 'admin', email: 'admin@company.com', password: hashPassword, role: 'admin' });
      console.log("Created admin");
    } else {
      admin.password = hashPassword;
      await admin.save();
      console.log("Updated admin password");
    }

    let candidate = await User.findOne({ username: 'candidate1' });
    if (!candidate) {
      candidate = await User.create({ username: 'candidate1', email: 'candidate1@user.com', password: hashPassword, role: 'employee' });
      console.log("Created candidate1");
    } else {
      candidate.password = hashPassword;
      await candidate.save();
      console.log("Updated candidate1 password");
    }

    // Check conversation
    let conv = await Conversation.findOne({
      participants: { $all: [admin._id, candidate._id] }
    });
    if (!conv) {
      conv = await Conversation.create({ participants: [admin._id, candidate._id] });
      console.log("Created conversation between admin and candidate1");
    } else {
      console.log("Conversation already exists");
    }

    mongoose.disconnect();
    console.log("Done");
  } catch (err) {
    console.error(err);
  }
}

seed();
