import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// The user's customizable daily form definition (versioned).
const FieldSchema = new Schema({
  fieldId: { type: String, required: true },     // stable id, never reused
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'longtext', 'number', 'select', 'multiselect', 'boolean', 'scale', 'time'], required: true },
  options: { type: [String], default: [] },      // for select / multiselect
  required: { type: Boolean, default: false },
  helpText: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },    // soft-delete: keep history
}, { _id: false });

const TrackerSchemaDef = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  version: { type: Number, default: 1 },
  fields: { type: [FieldSchema], default: [] },
}, { timestamps: true });

export default models.TrackerSchema || model('TrackerSchema', TrackerSchemaDef);
