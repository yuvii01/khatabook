import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party',
      required: [true, 'Party is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'YOU_GOT',
        'YOU_GAVE',
        'SALE_BILL',
        'PURCHASE_BILL',
      ],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: [
        'Cash',
        'UPI / GPay / PhonePe',
        'Bank Transfer (NEFT/RTGS/IMPS)',
        'Cheque',
        'Credit Note',
        'Other',
      ],
      default: 'Cash',
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    billNumber: {
      type: String,
      trim: true,
      default: '',
    },
    items: [
      {
        itemName: { type: String, default: '' },
        quantity: { type: Number, default: 0 },
        unit: { type: String, default: 'sq.ft' },
        rate: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
    ],
    isRouted: {
      type: Boolean,
      default: false,
    },
    paymentSplitRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentSplit',
      default: null,
    },
    routeRole: {
      type: String,
      enum: ['none', 'source_received', 'target_distributed'],
      default: 'none',
    },
    routeNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Transaction', transactionSchema);
