const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

var Long = mongoose.Schema.Types.Long;
// var NumberInt = require('mongoose-int32');

const ComplaintsSchema = mongoose.Schema({
  disease: String,
  agelower: Number,
  ageupper: Number,
  sexnotpref: String,
  complaints: String,
  site: String,
  severity: String,
  extent: String,
  nature: String,
  aggfactor: String,
  relfactor: String,
  onset: String,
  frequency: String,
  duration: String,
  history: String
});
module.exports.complaints = mongoose.model('complaints', ComplaintsSchema);

const DegreeSchema = mongoose.Schema({
  degree: String,
  abbrevation: String
});
module.exports.degrees = mongoose.model('degrees', DegreeSchema);

const SpecializationsSchema = mongoose.Schema({
  specialization: String
});
module.exports.specializations = mongoose.model(
  'specializations',
  SpecializationsSchema
);

const TempComplaintsSchema = mongoose.Schema({
  disease: String,
  agelower: Number,
  ageupper: Number,
  sexnotpref: String,
  complaints: String,
  site: String,
  severity: String,
  extent: String,
  nature: String,
  aggfactor: String,
  relfactor: String,
  onset: String,
  frequency: String,
  duration: String,
  history: String
});
module.exports.tempcomplaints = mongoose.model(
  'temp_complaints',
  TempComplaintsSchema
);

const GeneralExamSchema = mongoose.Schema({
  disease: String,
  generalexam: String,
  agelower: String,
  ageupper: String,
  sexnot: String,
  meanings: String,
  status: String,
  timestamp: String,
  IMPCODE: String,
  UPCODE: String
});
module.exports.generalexams = mongoose.model('generalexams', GeneralExamSchema);

const SystemicSchema = mongoose.Schema({
  disease: String,
  agelower: Number,
  ageupper: Number,
  sexnotpref: String,
  systemicexam: String,
  meaning: String
});
module.exports.systemexams = mongoose.model('systemexams', SystemicSchema);

const CountrySchema = mongoose.Schema({
  country: String,
  code: String
});
module.exports.countries = mongoose.model('countries', CountrySchema);

const MedicineSchema = mongoose.Schema({
  disease: String,
  age: String,
  weight: String,
  pregnant: String,
  lactating: String,
  medicineName: String,
  form: String,
  strength: String,
  dose: String,
  route: String,
  frequency: String,
  frequency1: String,
  limits: String,
  duration: String,
  condition: String,
  commercialName: String,
  initialDose: String,
  laterDose: String
});
module.exports.medicines = mongoose.model('medicines', MedicineSchema);

const AdviceSchema = mongoose.Schema({
  disease: String,
  advice: String
});
module.exports.advices = mongoose.model('advices', AdviceSchema);

const userRolesSchema = mongoose.Schema({
  roleName: String,
  status: String
});
module.exports.userRoles = mongoose.model('userRoles', userRolesSchema);

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  authenticationKey: { type: String }, // ex. CDOC3
  authenticationValue: String, // ex. password
  designation: String,
  userType: String,
  gender: String,
  password: String,
  primaryMobile: { type: String, max_length: 10 },
  secondaryMobile: { type: String, max_length: 10 },
  primaryEmail: String,
  secondaryEmail: String,
  degree: String,
  college: String,
  completionYear: Number,
  experienceYear: Number,
  specialization: String,
  consultantFee: Number,
  expiryDate: Date,
  level: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  userImageURL: String,
  userSignatureURL: String,
  country: String,
  state: String,
  city: String,
  currency: String,
  notificationToken: String,
  accessKey: String,
  ppspFlag: String,
  userActivation: String
});
module.exports.users = mongoose.model('users', userSchema);

// const userSchema = mongoose.Schema({
//   name: String,
//   email: String,
//   authenticationKey: { type: String }, // ex. CDOC3
//   authenticationValue: String, // ex. password
//   designation: String,
//   userType: String,
//   gender: String,
//   password: String,
//   primaryMobile: { type: String, max_length: 10 },
//   secondaryMobile: { type: String, max_length: 10 },
//   primaryEmail: String,
//   secondaryEmail: String,
//   degree: String,
//   college: String,
//   completionYear: Number,
//   experienceYear: Number,
//   specialization: String,
//   consultantFee: Number,
//   expiryDate: Date,
//   level: String,
//   resetPasswordToken: String,
//   resetPasswordExpires: Date,
//   userImageURL: String,
//   userSignatureURL: String
// });
// module.exports.users = mongoose.model('users', userSchema);

const patientHistorySchema = mongoose.Schema({
  patientId: { type: String },
  patientName: { type: String },
  status: { type: String, default: 'Under Treatment' },
  date: { type: Date, default: Date.now },
  visit: Array
});
module.exports.patientshistory = mongoose.model(
  'patientshistory',
  patientHistorySchema
);

const furtherTreatmentSchema = mongoose.Schema({
  disease: String,
  treatment: String
});
module.exports.treatment = mongoose.model(
  'further_treatments',
  furtherTreatmentSchema
);

const patientSchema = mongoose.Schema({
  patientId: { type: String },
  firstName: String,
  lastName: String,
  dateofbirth: Date,
  gender: String,
  bloodgroup: String,
  weight: String,
  street: String,
  city: String,
  state: String,
  country: String,
  zip: String,
  phone: String,
  // password: String,
  email: String,
  patientImageURL: String
});
module.exports.patients = mongoose.model('patients', patientSchema);

const patientLogs = mongoose.Schema({
  doctorId: String,
  patientId: String,
  viewedAt: Date,
  editedAt: Date,
  registeredAt: Date
});
module.exports.patientLogs = mongoose.model('patientlogs', patientLogs);

const caseTransferSchema = mongoose.Schema({
  // init_date: { type: Date, default: Date.now },
  // ack_date: { type: Date },
  closed_date: { type: Date },
  transferedBy: String,
  transferedTo: Array,
  patientHistoryId: String,
  state: { type: String, default: 'Pending' },
  level: String,
  ctId: String,
  patientName: String,
  countryPreferred: String,
  statePreferred: String,
  cityPreferred: String,
  sent: Boolean,
  sentDT: Array,
  delivered: Boolean,
  deliveredDT: Array,
  read: Boolean,
  readDT: Array,
  caseTransferComplete: Boolean,
  caseTransferCompleteDT: Array,
  title: String,
  body: String,
  activeNotifications: Boolean
});
module.exports.caseTransfer = mongoose.model(
  'caseTransfers',
  caseTransferSchema
);

const ClinicalSchema = mongoose.Schema({
  disease: String,
  agelower: Number,
  ageupper: Number,
  sexnot: String,
  labtest: String,
  meaning: String
});
module.exports.clinical = mongoose.model(
  'clinical_investigations',
  ClinicalSchema
);

const subscriptionPlansSchema = mongoose.Schema({
  planName: String,
  planCode: String,
  price: Number,
  visits: Number
});
module.exports.subscriptions = mongoose.model(
  'subscriptions',
  subscriptionPlansSchema
);

var subscriptionHistoriesSchema = mongoose.Schema({
  planCode: String,
  userId: String,
  price: Number,
  createdAt: Date
});

module.exports.subscription_histories = mongoose.model(
  'subscription_histories',
  subscriptionHistoriesSchema
);

var CurrencySchema = mongoose.Schema({
  country: String,
  code: String
});
module.exports.currency = mongoose.model('currencies', CurrencySchema);

const UserLogs = mongoose.Schema({
  officerID: String,
  loggedIn: Date,
  failedToLoggedIn: Date,
  ipAddress: String,
  loggedOutAt: Date
});
module.exports.userlogs = mongoose.model('userlogs', UserLogs);

const AdminLogs = mongoose.Schema({
  officerID: String,
  loggedIn: Date,
  failedToLoggedIn: Date,
  ipAddress: String,
  loggedOutAt: Date
})
module.exports.adminLogs = mongoose.model('adminLogs', AdminLogs);

const OfficerCreationLogs = mongoose.Schema({
  officerCreatedAt: Date,
  officerId: String,
  ipAddress: String
})
module.exports.officerCreationLogs = mongoose.model('officerCreationLogs', OfficerCreationLogs);


const PaymentSchema = mongoose.Schema({
  billNumber: String,
  coid: String,
  coName: String,
  billDate: Date,
  dueDate: Date,
  invoicePeriod: String,
  receiptNumber: String,
  invoiceURL: String,
  receiptURL: String,
  billAmount: Number,
  billPaidDate: Date,
  status: String,
  // trenasactionId: String,
  billCurrency: String,
  billPurpose: String,
  caseTransfeId: String,
  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,
  sent: Boolean,
  sentDT: Array,
  delivered: Boolean,
  deliveredDT: Array,
  read: Boolean,
  readDT: Array,
  title: String,
  body: String,
  activeNotifications: Boolean
});
module.exports.billings = mongoose.model('billings', PaymentSchema);

const BillGenerationSchema = mongoose.Schema({
  billingMonthYear: String,
  // billGenerated: Boolean,
  // billGeneratedDate: Date
});
module.exports.monthlyBills = mongoose.model('monthlyBills', BillGenerationSchema);


const PaymentCronJob = mongoose.Schema({
  startedAt: Date,
  endedAt: Date,
  paymentFrom: Date,
  paymentTo: Date,
  refundPayIds: Array
});
module.exports.paymentCronJob = mongoose.model('paymentCronJobs', PaymentCronJob)

const monthlyBillsAttributes = mongoose.Schema({
  visitAmount: Number,
  dueDate: Number
});
module.exports.monthlyBillsAttributes = mongoose.model('monthlyBillsAttributes', monthlyBillsAttributes)
// var degrees = mongoose.Schema({
//     degree: []
// });
// module.exports.degrees = mongoose.model('degrees', degrees);
