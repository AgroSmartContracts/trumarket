import mongoose, { Schema } from 'mongoose';

import { ConflictError } from '@/errors';

const documentSchema = new Schema({
  description: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
});

documentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
  },
});

const walletSchema = new Schema({
  address: {
    type: String,
    lowercase: true,
    required: true,
  },
});

walletSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
  },
});

// Define the Milestone schema
const milestoneSchema = new Schema({
  description: {
    type: String,
    required: true,
  },
  fundsDistribution: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100,
  },
  location: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: false,
  },
  docs: {
    type: [documentSchema],
  },
});

milestoneSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = doc._id.toString();
  },
});

// Define the Deal schema
const dealSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  // Shipping Properties
  contractId: {
    type: Number,
    required: true,
  },
  contractAddress: {
    type: String,
    required: false,
  },
  nftID: {
    type: Number,
    required: false,
  },
  mintTxHash: {
    type: String,
    required: false,
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  portOfOrigin: {
    type: String,
    required: true,
  },
  portOfDestination: {
    type: String,
    required: true,
  },
  transport: {
    type: String,
    required: true,
  },
  presentation: {
    type: String,
    required: false,
  },
  size: {
    type: String,
    required: false,
  },
  variety: {
    type: String,
    required: false,
  },
  quality: {
    type: String,
    required: false,
  },
  offerUnitPrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  shippingStartDate: {
    type: Date,
    required: true,
  },
  expectedShippingEndDate: {
    type: Date,
    required: true,
  },
  coverImageUrl: {
    type: String,
    required: false,
  },
  docs: {
    type: [documentSchema],
  },
  currentMilestone: {
    type: Number,
    required: true,
    default: 0,
  },
  milestones: {
    type: [milestoneSchema],
    validate: [
      {
        validator: (value) => value.length === 7,
        message: 'Milestones array must have exactly 7 elements',
      },
    ],
    required: true,
  },
  // Financial Properties
  investmentAmount: {
    type: Number,
    required: true,
  },
  revenue: {
    type: Number,
    required: true,
  },
  netBalance: {
    type: Number,
    required: true,
  },
  roi: {
    type: Number,
    required: true,
  },
  carbonFootprint: {
    type: String,
  },
  whitelist: {
    type: [walletSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ['proposal', 'confirmed', 'finished'],
    default: 'proposal',
  },
  buyerId: {
    type: String,
    required: false,
  },
  supplierId: {
    type: String,
    required: false,
  },
  proposalBuyerEmail: {
    type: String,
    required: false,
  },
  proposalSupplierEmail: {
    type: String,
    required: false,
  },
  buyerConfirmed: {
    type: Boolean,
    default: false,
  },
  supplierConfirmed: {
    type: Boolean,
    default: false,
  },
});

dealSchema.pre('save', function (next) {
  const totalFundsDistribution = this.milestones.reduce(
    (sum, milestone) => sum + milestone.fundsDistribution,
    0,
  );
  if (totalFundsDistribution !== 100) {
    throw new ConflictError(
      'Sum of all milestones fundsDistribution must be 100',
    );
  }

  next();
});

dealSchema.set('toJSON', {
  transform: function (doc: any, ret) {
    ret.id = doc._id.toString();
    // TODO: update status as completed in db when currentMilestone was changed to value 8
    // ret.status = doc.currentMilestone === 8 ? 'Completed' : 'Ongoing';

    const startDate: Date = doc.shippingStartDate;
    const endDate: Date = doc.expectedShippingEndDate;

    const durationDiff: number = endDate.getTime() - startDate.getTime();
    const daysLeftDiff: number = endDate.getTime() - new Date().getTime();

    const daysInWeek: number = 7;
    const totalDays: number = Math.floor(durationDiff / (1000 * 3600 * 24)); // Converting milliseconds to days
    const totalDaysLeft: number = Math.floor(daysLeftDiff / (1000 * 3600 * 24)); // Converting milliseconds to days

    const duration = Math.ceil(totalDays / daysInWeek);

    ret.duration = duration + ' week' + (duration === 1 ? '' : 's');
    ret.daysLeft = totalDaysLeft;
    ret.totalValue = doc.offerUnitPrice * doc.quantity;
  },
});

const DealModel = mongoose.model<any>('Deal', dealSchema);

export default DealModel;
