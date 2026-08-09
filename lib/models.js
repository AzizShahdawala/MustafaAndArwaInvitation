import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
  eventId: { type: String, enum: ['preWedding', 'reception'], required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 200 },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
  attending: { type: String, enum: ['yes', 'no'], required: true },
  guestCount: { type: Number, min: 0, max: 20, default: 0 },
  dietaryNotes: { type: String, trim: true, maxlength: 300, default: '' },
  message: { type: String, trim: true, maxlength: 500, default: '' },
  confirmationSentAt: Date,
  reminderSentAt: Date
}, { timestamps: true });
rsvpSchema.index({ eventId: 1, email: 1 }, { unique: true });

export const RSVP = mongoose.models.RSVP || mongoose.model('RSVP', rsvpSchema);
