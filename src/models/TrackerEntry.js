import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;

// One daily check-in. values keyed by fieldId so renames/deletes never corrupt history.
const TrackerEntrySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },        // 'YYYY-MM-DD' (user local day)
  schemaVersion: { type: Number, default: 1 },
  values: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

TrackerEntrySchema.index({ userId: 1, date: 1 }, { unique: true });
export default models.TrackerEntry || model('TrackerEntry', TrackerEntrySchema);
