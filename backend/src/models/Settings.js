import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'KM Stonex',
    },
    tagline: {
      type: String,
      default: 'Premium Marble, Granite & Stone Khata',
    },
    ownerName: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    ownerWhatsApp: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    gstin: {
      type: String,
      default: '',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Settings', settingsSchema);
