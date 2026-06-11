import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Profile Information
  fullName: { type: String, default: "" },
  address: { type: String, default: "" },
  country: { type: String, default: "" },
  hometown: { type: String, default: "" },
  age: { type: Number, default: null },
  birthDate: { type: String, default: "" },

  // Security Information
  phoneNumber: { type: String, default: "" },
  pin: { type: String, default: "" },

  // Array Fields for Profile additions
  educations: { type: Array, default: [] },
  experiences: { type: Array, default: [] },
  activities: { type: Array, default: [] },

  // User Role Selection
  role: {
    type: String,
    enum: ["admin", "employee", "company"],
    default: "employee",
  },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
