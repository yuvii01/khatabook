import mongoose from 'mongoose';

const partySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Party name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['party', 'customer', 'supplier', 'both'],
      default: 'party',
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

partySchema.virtual('balanceStatus').get(function () {
  if (this.currentBalance > 0) return 'RECEIVABLE';
  if (this.currentBalance < 0) return 'PAYABLE';
  return 'SETTLED';
});

partySchema.set('toJSON', { virtuals: true });
partySchema.set('toObject', { virtuals: true });

export default mongoose.model('Party', partySchema);
