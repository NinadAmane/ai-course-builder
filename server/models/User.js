// A simple schema for now, can be expanded with password hashing (bcrypt), etc.
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  // We can add fields like password, createdAt, etc. later
});
