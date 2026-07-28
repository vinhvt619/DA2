import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
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
      select: false,
    },
    // Profile Information
    fullName: { type: String, default: "" },
    address: { type: String, default: "" },
    country: { type: String, default: "" },
    hometown: { type: String, default: "" },
    age: { type: Number, default: null },
    birthDate: { type: String, default: "" },
    companyIndustry: { type: String, default: "" },
    companySize: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
    companyDescription: { type: String, default: "" },
    companyFoundedYear: { type: String, default: "" },
    companyTaxCode: { type: String, default: "" },

    // Security Information
    phoneNumber: { type: String, default: "" },
    pin: { type: String, default: "", select: false },

    // Array Fields for Profile additions
    educations: { type: Array, default: [] },
    experiences: { type: Array, default: [] },
    activities: { type: Array, default: [] },

    // Saved Jobs
    savedJobs: [{
      jobId: { type: String, required: true },
      savedAt: { type: Date, default: Date.now }
    }],

    // User Role Selection
    role: {
      type: String,
      enum: ["admin", "employee", "company"],
      default: "employee",
    },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: "active",
    },
    companyVerificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: undefined,
    },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", UserSchema);
