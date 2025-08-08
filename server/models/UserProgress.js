const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  quizResults: [
    {
      moduleId: mongoose.Schema.Types.ObjectId,
      score: Number, // e.g., 80 for 80%
      answers: [
        {
          question: String,
          selectedAnswer: String,
          isCorrect: Boolean,
        },
      ],
    },
  ],
  completedModules: [{ type: mongoose.Schema.Types.ObjectId }],
  lastAccessed: { type: Date, default: Date.now },
});
