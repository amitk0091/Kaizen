import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// On/off checklists. Items are checked each time; a "reset" simply unchecks all.
const ChecklistItem = new Schema({
  itemId: { type: String, required: true },
  text: { type: String, required: true },
  done: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: false });

const ChecklistSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  items: { type: [ChecklistItem], default: [] },
}, { timestamps: true });

export default models.Checklist || model('Checklist', ChecklistSchema);
