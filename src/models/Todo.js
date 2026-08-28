import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

const TodoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'ongoing', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  deadline: { type: Date, default: null },
  goalId: { type: Schema.Types.ObjectId, ref: 'Goal', default: null },
}, { timestamps: true });

export default models.Todo || model('Todo', TodoSchema);
