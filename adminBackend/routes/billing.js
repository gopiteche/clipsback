
const express = require('express');
const router = express.Router();
const moduleFiles = require("../../backend/models/model");
const patientHistories = moduleFiles.patientshistory;
const monthlyBills = moduleFiles.monthlyBills;
const users = moduleFiles.users;
const billings = moduleFiles.billings;
const monthlyBillAttributes = moduleFiles.monthlyBillsAttributes;
const baseURL = require('../../env.json').baseURL;
const firebase = require("../../backend/routes/fireBase").firebase;
const options = require("../../backend/routes/fireBase").options;

var pdf = require("dynamic-html-pdf");
let fs = require("fs-extra");
var html = fs.readFileSync("./adminBackend/routes/invoice.html", "utf8");

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

function getRandomInt_5() {
  return Math.floor(Math.random() * Math.floor(60466176));
}

router.get('/monthlyPayment', async (req, res) => {
  console.log('test req..query..', req.query);
  console.log('months..', months);
  let month;
  let year;

  month = months.indexOf(req.query.month) + 1;
  year = +req.query.year;
  console.log('month and year', month, year);

  users.find({ userType: "practitioner" }).then(practionerFound => {
    console.log('practioner found..test', practionerFound);


    var clinicalOfficerVisitCount = ele => {
      return new Promise((resolve, reject) => {
        patientHistories
          .aggregate([
            {
              $match: {
                visit: {
                  $elemMatch: { doctor: ele }
                }
              }
            },
            { $project: { month: { $month: '$date' }, year: { $year: '$date' }, patientId: 1, status: 1, visit: 1, date: 1, patientName: 1 } },
            { $match: { 'month': month } },
            { $match: { 'year': year } },
            {
              $group: {
                _id: null, doctorCount: { $sum: { $size: "$visit" } }, 'totalVisitDetails': {
                  $push: {
                    'patientHistoryId': '$_id',
                    'visitDetails': "$visit",
                    'patientID': "$patientId",
                    'status': '$status',
                    'patientName': "$patientName",
                    "count": { "$size": "$visit" },
                    // "date":'$visit.$count-1.updatedOn'
                  },

                }
              }
            },
            { $project: { officerName: ele, count: { $toString: "$doctorCount" }, totalVisitDetails: '$totalVisitDetails' } }
          ])
          .then(patientHis => {
            if (patientHis.length > 0) {
              console.log('patient in promise...', patientHis[0]);
              users.findOne({ authenticationKey: patientHis[0].officerName.split(" ")[0] }).then(async officerFound => {
                console.log('officer Found..test', officerFound);

                await monthlyBillAttributes.findOne({}).then(async monthlyBillAttributesFound => {
                  console.log('monthly bill Attributes found', monthlyBillAttributesFound);

                  //   resolve(patientHis[0]);
                  let billId = '';
                  do {
                    let genRandomNumb_5 = getRandomInt_5().toString(36).toUpperCase();
                    genRandomNumb_5.padStart(5, '0');
                    billId = 'B' + (months.indexOf(req.query.month) + 1).toString() + parseInt(req.query.year) + genRandomNumb_5;
                    await billings.find({ billNumber: billId }).then(count => {
                      if (count.length > 0) {
                        saveBill_Details = false;
                      } else {
                        saveBill_Details = true;
                      }
                    });
                  } while (!saveBill_Details);


                  //         users
                  // .findOne({ authenticationKey: data.transferedTo[data.transferedTo.length - 1] })
                  // .distinct("notificationToken")
                  // .then(sendNotificationDetails => {
                  //   console.log(
                  //     "sendNotification details...test",
                  //     sendNotificationDetails
                  //   );
                  const firebaseToken = officerFound.notificationToken;

                  const payload = {
                    notification: {
                      title: "Case Transfer",
                      body:
                        "your monthly bill payment"
                      // notificationId: JSON.stringify(newNotificationResponse._id)
                    }
                  };
                  firebase
                    .messaging()
                    .sendToDevice(firebaseToken, payload, options)
                    .then(response => {
                      console.log("notification sent successfully", response);
                    })
                    .catch(e => {
                      console.log("error notification message...", e);
                    });
                  // });

                  let path = `./invoices/${patientHis[0].officerName}`;
                  fs.mkdirsSync(path);

                  // pdf.registerHelper("incremented", function (index) {
                  //     index++;
                  //     return index;
                  // });
                  var options = {
                    format: "A4",
                    orientation: "potrait"
                  };
                  // console.log("html", html);
                  var document = {
                    template: html,
                    context: {
                      pdfData: {
                        officerName: patientHis[0].officerName,
                        officerCountry: officerFound.country,
                        officerState: officerFound.state,
                        officerCity: officerFound.city,
                        officerMobileNumber: officerFound.primaryMobile,
                        officerEmail: officerFound.primaryEmail,
                        billDate: new Date(),
                        dueDate: new Date(new Date().setDate(new Date().getDate() + monthlyBillAttributesFound.dueDate)),
                        inVoicePeriod: req.query.month + ' ' + req.query.year,
                        purchaseOrderNumber: billId,
                        officerVisitCount: patientHis[0].count,
                        amount: patientHis[0].count * monthlyBillAttributesFound.visitAmount



                        // doctorName: doctorData.name,
                        // doctorId: doctorData.authenticationKey,
                        // designation: doctorData.designation,
                        // patientName:
                        //     patientData.firstName + " " + patientData.lastName,
                        // patientId: patientData.patientId,
                        // patientAge: dateDiff(patientData.dateofbirth, today),
                        // gender: patientData.gender,
                        // date:
                        //     today.getDate() +
                        //     " " +
                        //     months[today.getMonth()] +
                        //     " " +
                        //     today.getFullYear(),
                        // enclosuresLink: fileArray

                        // fname: 'Arun',
                        // mname: '',
                        // lname: 'Varadharajulu',
                        // img: 'http://www.grupoproductivo.com.ar/img/goo.jpg'
                      },
                      officerVisitDetails: patientHis[0].totalVisitDetails
                      // prescriptionData: JSON.parse(datajson[5]),
                      // advices: advicesFound,
                      // signatureImage: doctorData.userSignatureURL
                      // signatureImage:'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg'
                    },
                    path: `./invoices/${patientHis[0].officerName}/${billId}.pdf`
                  };

                  // console.log("document..testwith console...", document);

                  pdf.registerHelper("updatedDate", function (visitDetails) {
                    if (visitDetails[visitDetails.length - 1].updatedOn) {
                      return visitDetails[visitDetails.length - 1].updatedOn;
                    } else {
                      return '-';
                    }
                  });

                  pdf.registerHelper('if_eq', function (a, b, opts) {
                    if (a == b) {
                      return opts.fn(this);
                    } else {
                      return opts.inverse(this);
                    }
                  });

                  pdf
                    .create(document, options)
                    .then(result => {
                      // console.log("test response", result);




                      const newPayment = new billings({
                        billNumber: billId,
                        coid: officerFound.authenticationKey,
                        coName: officerFound.name,
                        billDate: new Date(),
                        dueDate: new Date(new Date().setDate(new Date().getDate() + monthlyBillAttributesFound.dueDate)),
                        invoicePeriod: req.query.month + ' ' + req.query.year,
                        // receiptNumber: String,
                        invoiceURL: `${baseURL}invoices/${patientHis[0].officerName}/${billId}.pdf`,
                        // receiptURL: String,
                        billAmount: patientHis[0].count * monthlyBillAttributesFound.visitAmount,
                        status: 'unpaid',
                        // billPaidDate: Date,
                        // trenasactionId: String,
                        // billCurrency: String,
                        billPurpose: 'MonthlyPayment',
                        sent: true,
                        sentDT: [new Date()],
                        delivered:false,
                        read:false,
                        title: 'Monthly Payment',
                        body: 'Monthly Bill for '+req.query.month+' '+req.query.year,
                        activeNotifications: true
                        // delivered: Boolean,
                        // deliveredDT: Array,
                        // read: Boolean,
                        // readDT: Array,
                        // caseTransfeId: String,
                      });

                      newPayment.save().then(billResponse => {
                        console.log('billResponse..test', billResponse);
                        resolve(patientHis[0]);
                      });

                    })
                    .catch(error => {
                      console.error("error response", error);
                    });

                });

              });

            } else {
              users.findOne({ authenticationKey: ele.split(" ")[0] }).then(async officerFound => {
                console.log('officer Found..test', officerFound);
                await monthlyBillAttributes.findOne({}).then(async monthlyBillAttributesFound => {
                  console.log('monthly bill attributes..found..', monthlyBillAttributesFound);

                  //   resolve(patientHis[0]);
                  let billId = '';

                  do {
                    let genRandomNumb_5 = getRandomInt_5().toString(36).toUpperCase();
                    genRandomNumb_5.padStart(5, '0');
                    billId = 'B' + (months.indexOf(req.query.month) + 1).toString() + req.query.year + genRandomNumb_5;
                    await billings.find({ billNumber: billId }).then(count => {
                      if (count.length > 0) {
                        saveBill_Details = false;
                      } else {
                        saveBill_Details = true;
                      }
                    });
                  } while (!saveBill_Details);

                  let path = `./invoices/${ele}`;
                  fs.mkdirsSync(path);

                  // pdf.registerHelper("incremented", function (index) {
                  //     index++;
                  //     return index;
                  // });
                  var options = {
                    format: "A4",
                    orientation: "potrait"
                  };
                  // console.log("html", html);
                  var document = {
                    template: html,
                    context: {
                      pdfData: {
                        officerName: ele,
                        officerCountry: officerFound.country,
                        officerState: officerFound.state,
                        officerCity: officerFound.city,
                        officerMobileNumber: officerFound.primaryMobile,
                        officerEmail: officerFound.primaryEmail,
                        billDate: new Date(),
                        dueDate: new Date().setDate(new Date().getDate() + monthlyBillAttributesFound.dueDate),
                        inVoicePeriod: req.query.month + ' ' + req.query.year,
                        purchaseOrderNumber: billId,
                        officerVisitCount: 0


                        // doctorName: doctorData.name,
                        // doctorId: doctorData.authenticationKey,
                        // designation: doctorData.designation,
                        // patientName:
                        //     patientData.firstName + " " + patientData.lastName,
                        // patientId: patientData.patientId,
                        // patientAge: dateDiff(patientData.dateofbirth, today),
                        // gender: patientData.gender,
                        // date:
                        //     today.getDate() +
                        //     " " +
                        //     months[today.getMonth()] +
                        //     " " +
                        //     today.getFullYear(),
                        // enclosuresLink: fileArray

                        // fname: 'Arun',
                        // mname: '',
                        // lname: 'Varadharajulu',
                        // img: 'http://www.grupoproductivo.com.ar/img/goo.jpg'
                      },
                      officerVisitDetails: [{ patientID: '-', count: '-', patientName: '-', totalVisitDetails: [{ updatedOn: undefined }] }]
                      // prescriptionData: JSON.parse(datajson[5]),
                      // advices: advicesFound,
                      // signatureImage: doctorData.userSignatureURL
                      // signatureImage:'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg'
                    },
                    path: `./invoices/${ele}/${billId}.pdf`
                  };

                  // console.log("document..testwith console...", document);

                  pdf.registerHelper("updatedDate", function (visitDetails) {
                    return '-';
                  });
                  pdf.registerHelper('if_eq', function (a, b, opts) {
                    if (a == b) {
                      return opts.fn(this);
                    } else {
                      return opts.inverse(this);
                    }
                  });

                  pdf
                    .create(document, options)
                    .then(result => {
                      // console.log("test response", result);

                      const newBillPayment = new billings({
                        billNumber: billId,
                        coid: officerFound.authenticationKey,
                        coName: officerFound.name,
                        billDate: new Date(),
                        dueDate: new Date(new Date().setDate(new Date().getDate() + monthlyBillAttributesFound.dueDate)),
                        invoicePeriod: req.query.month + ' ' + req.query.year,
                        // receiptNumber: String,
                        invoiceURL: `${baseURL}invoices/${ele}/${billId}.pdf`,
                        // receiptURL: String,
                        billAmount: 0,
                        // billPaidDate: Date,
                        // trenasactionId: String,
                        // billCurrency: String,
                        billPurpose: 'MonthlyPayment',
                        status: 'unpaid'
                        // caseTransfeId: String,
                      });

                      newBillPayment.save().then(billResponse => {
                        console.log('billResponse..test', billResponse);
                        resolve({ _id: null, officerName: ele, count: "0" });
                      });
                      // resolve(patientHis[0]);

                    })
                    .catch(error => {
                      console.error("error response", error);
                    });


                });

              });

            }
          })
          .catch(err => {
            console.log("msg: ", err.message);
            resolve(err.message);
          });
      });
    };

    var promises = practionerFound.map(async ele => {
      var result = await clinicalOfficerVisitCount(ele.authenticationKey + ' - ' + ele.name);
      return new Promise((res, rej) => {
        res(result);
      });
    });

    Promise.all(promises).then(userRecords => {
      // userRecords.sort({_id:1});
      console.log("All promises", userRecords);
      const newMonthlyBills = new monthlyBills({
        billingMonthYear: req.query.month + ' ' + req.query.year
      });
      newMonthlyBills.save().then(invoiceGenerated => {
        console.log('invoice generated..test', invoiceGenerated);
        res.json({ msg: 'billGenerated', userRecords: userRecords });
      });
      // res.json({
      //   userRecords: userRecords,
      //   userRecordsCount: totalPractitionerCount
      // });
    });
  })
    .catch(err => {
      console.log("msg: ", err.message);
    });

  // patientHistories.aggregate([
  //     {
  //         $match: {
  //             visit: {
  //                 $elemMatch: { doctor: ele }
  //             }
  //         }
  //     },
  //     { $project: { month: { $month: '$date' }, year: { $year: '$date' }, patientId: 1, status: 1, visit: 1, date: 1 } },
  //     { $match: { 'month': month } },
  //     { $match: { 'year': year } },
  //     { $group:{_id:null,count: { $sum: { $size: "$visit" } }}},
  //     {$project:{officerName:ele,count:'$count'}}

  // ]).then(paymentResponse => {
  //     console.log('paymentResponse..test', paymentResponse);

  //     let path = `./invoices/${paymentResponse.patientId}`;
  //     fs.mkdirsSync(path);

  //     // pdf.registerHelper("incremented", function (index) {
  //     //     index++;
  //     //     return index;
  //     // });
  //     var options = {
  //         format: "A4",
  //         orientation: "landscape"
  //     };
  //     console.log("html", html);
  //     var document = {
  //         template: html,
  //         context: {
  //             pdfData: {
  //                 // doctorName: doctorData.name,
  //                 // doctorId: doctorData.authenticationKey,
  //                 // designation: doctorData.designation,
  //                 // patientName:
  //                 //     patientData.firstName + " " + patientData.lastName,
  //                 // patientId: patientData.patientId,
  //                 // patientAge: dateDiff(patientData.dateofbirth, today),
  //                 // gender: patientData.gender,
  //                 // date:
  //                 //     today.getDate() +
  //                 //     " " +
  //                 //     months[today.getMonth()] +
  //                 //     " " +
  //                 //     today.getFullYear(),
  //                 // enclosuresLink: fileArray

  //                 // fname: 'Arun',
  //                 // mname: '',
  //                 // lname: 'Varadharajulu',
  //                 // img: 'http://www.grupoproductivo.com.ar/img/goo.jpg'
  //             },
  //             // prescriptionData: JSON.parse(datajson[5]),
  //             // advices: advicesFound,
  //             // signatureImage: doctorData.userSignatureURL
  //             // signatureImage:'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg'
  //         },
  //         path: `./invoice/${paymentResponse.patientId}/${paymentResponse._id}_0.pdf`
  //     };

  //     console.log("document..testwith console...", document);

  //     pdf
  //         .create(document, options)
  //         .then(result => {
  //             console.log("test response", result);

  //         })
  //         .catch(error => {
  //             console.error("error response", error);
  //         });
  // });




});


router.get('/checkPayment', async (req, res) => {
  console.log('test req..query');
  monthlyBills.find().distinct('billingMonthYear').then(checkPaymentResponse => {
    console.log('checkPaymentResponse..', checkPaymentResponse);
    res.json({ enablePayment: checkPaymentResponse })
  });

})

router.get('/getRecords', async (req, res) => {
  console.log('test...query..', req.query);
  billings.aggregate([
    {
      $facet: {
        invoiceBillArray: [
          {
            $match: {
              invoicePeriod: req.query.month + ' ' + req.query.year
            }
          },
          { $skip: +req.query.pageFrom },
          { $limit: +req.query.pageSize }
        ],
        pageInfo: [
          {
            $match: {
              invoicePeriod: req.query.month + ' ' + req.query.year
            }
          },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]
      }
    }
  ]).then(monthlyBillResponse => {
    console.log('monthlyResponse..test', monthlyBillResponse);
    res.json(monthlyBillResponse[0]);
  });
});


module.exports = router;