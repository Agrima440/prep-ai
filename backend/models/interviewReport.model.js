import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// ✅ Define this FIRST (you were using it before declaration)
const preparationPlanSchema = new Schema({
  day: {
    type: Number,
    required: [true, "Day is required"]
  },
  focus: {
    type: String,
    required: [true, "Focus is required"]
  },
  tasks: [{
    type: String,
    required: [true, "Task is required"]
  }]
}, {
  _id: false
});

const technicalQuestionsSchema = new Schema({
  question: {
    type: String,
    required: [true, "Question is required"]
  },
  intenton: {   // ⚠️ typo: should be "intention"
    type: String,
    required: [true, "Intention is required"]
  },
  answer: {
    type: String,
    required: [true, "Answer is required"]
  }
}, {
  _id: false
});

const behavioralQuestionsSchema = new Schema({
  question: {
    type: String,
    required: [true, "Question is required"]
  },
  intenton: {
    type: String,
    required: [true, "Intention is required"]
  },
  answer: {
    type: String,
    required: [true, "Answer is required"]
  }
}, {
  _id: false
});

const skillGapSchema = new Schema({
  skill: {
    type: String,
    required: [true, "Skill is required"]
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: [true, "Severity is required"]
  }
}, {
  _id: false
});

const interviewReportSchema = new Schema({
  jobDescription: { 
    type: String, 
    required: [true, "Job description is required"] 
  },
  resume: {
    type: String,
  },
  selfDescription: { 
    type: String 
  },
  matchScore: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  technicalQuestions: [technicalQuestionsSchema],
  behavioralQuestions: [behavioralQuestionsSchema],
  skillGaps: [skillGapSchema],
  preparationPlan: [preparationPlanSchema],
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
  },
  title:{
    type:String,
    required:[true, "Job title is required"]
  }
}, {
  timestamps: true
});

// ✅ Use ES Module export
const interviewReportModel = model("InterviewReport", interviewReportSchema);

export default interviewReportModel;