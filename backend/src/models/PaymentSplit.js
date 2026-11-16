import mongoose from 'mongoose';

const paymentSplitSchema = new mongoose.Schema(
  {
    sourceParty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party',
      required: true,
    },
    sourceTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    totalAmountReceived: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      default: 'Cash',
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      default: '',
    },
    distributions: [
      {
        recipientParty: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Party',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        transactionRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Transaction',
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
    retainedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('PaymentSplit', paymentSplitSchema);
