//paymentController

const express = require('express');
const router = express.Router();
const modulefiles = require('../models/model');
const billings = modulefiles.billings;
const RazorPay = require('razorpay');
const env = require('../../env.json');
let fs = require('fs-extra');
var ObjectId = require('mongodb').ObjectID;
const razorPay = new RazorPay({

    key_id: env.razorPay_key_id,
    key_secret: env.razorPay_key_secret,
});
const CryptoJS = require("crypto-js");
const baseURL = require('../../env.json').baseURL;

var pdf = require("dynamic-html-pdf");

var html = fs.readFileSync("./backend/routes/bill.html", "utf8");
const subscription = modulefiles.subscriptions;
const users = modulefiles.users;
const subscriptionHistory = modulefiles.subscription_histories;
const caseTransfer = modulefiles.caseTransfer;
const patientshistory = modulefiles.patientshistory;
const firebase = require("./fireBase").firebase;
const options = require("./fireBase").options;
const notifications = modulefiles.notifications;


// var getPlanDetails = async function (code) {
//     await subscription
//         .aggregate([{ $match: { planCode: code } }])
//         .then(subscriptionDetails => {
//             console.log(subscriptionDetails, "subscriptionDetails");
//             return subscriptionDetails;
//         })
//         .catch(error => {
//             console.log("There was an error : %s", error);
//         });
// };

function getRandomInt_5() {
    return Math.floor(Math.random() * Math.floor(60466176));
}

function generateBill(billDetails) {
    console.log('generate bill function callled...test', billDetails);
    var options = {
        format: "A4",
        orientation: "potrait"
    };
    // console.log("html", html);
    var document = {
        template: html,
        context: {
            pdfData: billDetails
        },
        // context: {
        //   pdfData: {
        //     doctorName: doctorData.name,
        //     doctorId: doctorData.authenticationKey,
        //     designation: doctorData.designation,
        //     patientName:
        //       patientData.firstName + " " + patientData.lastName,
        //     patientId: patientData.patientId,
        //     patientAge: dateDiff(patientData.dateofbirth, today),
        //     gender: patientData.gender,
        //     date:
        //       today.getDate() +
        //       " " +
        //       months[today.getMonth()] +
        //       " " +
        //       today.getFullYear(),
        //     enclosuresLink: fileArray

        //     // fname: 'Arun',
        //     // mname: '',
        //     // lname: 'Varadharajulu',
        //     // img: 'http://www.grupoproductivo.com.ar/img/goo.jpg'
        //   },
        //   prescriptionData: JSON.parse(datajson[5]),
        //   advices: advicesFound,
        //   signatureImage: doctorData.userSignatureURL
        //   // signatureImage:'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg'
        // },
        path: billDetails.path
    };

    // console.log("document..testwith console...", document);

    pdf
        .create(document, options)
        .then(result => {
            console.log("test response..for pdf", result);
        })
        .catch(error => {
            console.error("error response", error);
        });

}

// function orderSave(order,userFound,billId,price) {
//     console.log('order Save..test',order);
//     console.log('userFOund...',userFound);



// }

router.get('/retrieveOrderId', async (req, res) => {
    console.log('req.body..test', req.query);
    let saveBill_Details;
    do {
        let genRandomNumb_5 = getRandomInt_5().toString(36).toUpperCase();
        genRandomNumb_5.padStart(5, '0');
        billId = 'B' + new Date().getFullYear().toString().substring(4, 2) + (new Date().getMonth() + 1).toString() + new Date().getDate().toString() + genRandomNumb_5;
        await billings.find({ billNumber: billId }).then(count => {
            if (count.length > 0) {
                saveBill_Details = false;
            } else {
                saveBill_Details = true;
            }
        });
    } while (!saveBill_Details);

    subscription
        .aggregate([{ $match: { planCode: req.query.planCode } }])
        .then(planDetails => {
            users.findOne({ authenticationKey: req.query.doctorId }).then(userFound => {
                console.log('user Found test..', userFound);

                console.log('planDetails...test', typeof planDetails[0].price, planDetails[0].price);
                const price = planDetails[0].price * 100;
                const options = {
                    amount: price,  // amount in the smallest currency unit
                    currency: "INR",
                    receipt: billId,
                    payment_capture: true
                };

                console.log('Payment Routes Called');
                razorPay.orders.create(options, function (err, order) {
                    console.log('error...', err);
                    console.log('order..test..razorpay', order);
                    const newBilling = new billings({
                        billNumber: billId,
                        razorpay_order_id: order.id,
                        razorpay_payment_id: '',
                        razorpay_signature: '',
                        coid: userFound.authenticationKey,
                        coName: userFound.name,
                        billDate: new Date(),
                        dueDate: null,
                        invoicePeriod: '',
                        receiptNumber: '',
                        invoiceURL: '',
                        receiptURL: '',
                        billAmount: price,
                        billPaidDate: null,
                        status: 'unpaid',
                        billCurrency: "INR",
                        billPurpose: "subscription payment",
                        caseTransfeId: null,

                    });
                    console.log('test new BIlling..', newBilling);
                    newBilling.save().then(newBillSaved => {
                        console.log('new bill saved..test', newBillSaved);
                        res.json({ orderDetails: order });
                    })
                });
            })

        }).catch(err => {
            console.log('err test..', err);
        })
    // const planDetails = getPlanDetails(req.query.planCode);




});

router.get('/caseTransfer/retrieveOrderId', async (req, res) => {
    console.log('req.....doctorId', req.query.doctorId);
    let saveBill_Details;
    do {
        let genRandomNumb_5 = getRandomInt_5().toString(36).toUpperCase();
        genRandomNumb_5.padStart(5, '0');
        receiptId = 'R' + new Date().getFullYear().toString().substring(4, 2) + (new Date().getMonth() + 1).toString() + new Date().getDate().toString() + genRandomNumb_5;
        await billings.find({ receiptNumber: receiptId }).then(count => {
            if (count.length > 0) {
                saveBill_Details = false;
            } else {
                saveBill_Details = true;
            }
        });
    } while (!saveBill_Details);

    const options = {
        amount: 5000,  // amount in the smallest currency unit
        currency: "INR",
        receipt: receiptId,
        payment_capture: true
    };
    users.findOne({ authenticationKey: req.query.doctorId }).then(userFound => {
        console.log('user Found test..', userFound);


        console.log('Payment Routes Called');
        razorPay.orders.create(options, function (err, order) {
            console.log('error...', err);
            console.log('order..test..razorpay', order);
            const newBilling = new billings({
                receiptNumber: receiptId,
                razorpay_order_id: order.id,
                razorpay_payment_id: '',
                razorpay_signature: '',
                coid: userFound.authenticationKey,
                coName: userFound.name,
                billDate: new Date(),
                dueDate: null,
                invoicePeriod: '',
                billNumber: '',
                invoiceURL: '',
                receiptURL: '',
                billAmount: 5000,
                billPaidDate: null,
                status: 'unpaid',
                billCurrency: "INR",
                billPurpose: "CaseTransfer Payment",
                caseTransferId: null
            });
            console.log('test new BIlling..', newBilling);
            newBilling.save().then(newBillSaved => {
                console.log('new bill saved..test', newBillSaved);
                res.json({ orderDetails: order });
            })
        });
    });




});


router.get('/retrievePayId', async (req, res) => {
    console.log('req...payId', req.query);


    const generated_signature = CryptoJS.HmacSHA256(req.query.orderId + "|" + req.query.payId, 'oOrwWlyuVhxB3A7QF1BHqJZA');
    console.log('generated_signature', generated_signature);
    console.log('req.query.signatureId', req.query.signatureId);
    if (generated_signature == req.query.signatureId) {

        razorPay.orders.fetchPayments(req.query.orderId).then(paymentResponseDetails => {
            console.log('payment Details..test', paymentResponseDetails);
            const paymentDetails = paymentResponseDetails;
            if (paymentDetails.items[0].status === 'captured') {
                let billDetails = {};
                billings.updateOne({ $and: [{ razorpay_order_id: paymentDetails.items[0].order_id }, { billAmount: paymentDetails.items[0].amount }, { billCurrency: paymentDetails.items[0].currency }] }, { $set: { billPaidDate: new Date(), status: 'paid', razorpay_payment_id: paymentDetails.items[0].id, razorpay_signature: req.query.signatureId } }).then(subscriptionUpdated => {
                    console.log('subscription updated response..test', subscriptionUpdated);
                    if (subscriptionUpdated.nModified > 0) {
                        users.updateOne({ authenticationKey: req.query.doctorId }, { $set: { expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) } }).then(expiryDateUpdated => {
                            console.log('expiry Date updated', expiryDateUpdated);
                            res.json({ msg: 'paymentSuccess' });
                        });
                    }

                });

                // let path = `./bills/${subscriptionUpdated.coid}`;
                // fs.mkdirsSync(path);

                // billDetails = {
                //     officerName:'',
                //     officerAddress:'',
                //     officerId:'',
                //     payedAt:'',
                //     amount:'',
                //     transactionNumber:'',
                //     transactionDetails:'',
                //     transactionPurpose:'',

                // };


            } else {
                res.json({ msg: 'paymentFailed' });
            }




        });
    } else {
        res.json({ msg: 'paymentFailed' });
    }

});

router.get('/caseTransfer/retrievePayId', async (req, res) => {
    console.log('req...query..', req.query);


    const generated_signature = CryptoJS.HmacSHA256(req.query.orderId + "|" + req.query.payId, env.razorPay_key_secret);
    console.log('generated_signature', generated_signature);
    console.log('req.query.signatureId', req.query.signatureId);
    if (generated_signature == req.query.signatureId) {

        razorPay.orders.fetchPayments(req.query.orderId).then(paymentResponseDetails => {
            console.log('payment Details..test', paymentResponseDetails);
            const paymentDetails = paymentResponseDetails;
            if (paymentDetails.items[0].status === 'captured') {

                billings.findOneAndUpdate({ $and: [{ razorpay_order_id: paymentDetails.items[0].order_id }, { billAmount: paymentDetails.items[0].amount }, { billCurrency: paymentDetails.items[0].currency }] }, { $set: { billPaidDate: new Date(), status: 'paid', razorpay_payment_id: paymentDetails.items[0].id, razorpay_signature: req.query.signatureId } }).then(subscriptionUpdated => {
                    console.log('subscription updated response..test', subscriptionUpdated);
                    // if (subscriptionUpdated.nModified > 0) {
                    //     users.updateOne({ authenticationKey: req.query.doctorId }, { $set: { expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) } }).then(expiryDateUpdated => {
                    //         console.log('expiry Date updated', expiryDateUpdated);
                    //     });
                    // }

                    let path = `./bills/${subscriptionUpdated.coid}`;
                    fs.mkdirsSync(path);
                    users.findOne({ authenticationKey: subscriptionUpdated.coid }).then(async usersFound => {
                        console.log('users Found..test', usersFound);


                        let today = new Date();
                        console.log('preferred locationData..test...parse', req.query.preferredLocationData);
                        let preferredLocationData = JSON.parse(req.query.preferredLocationData);
                        // let assignDoc = "";
                        let caseTransferSaved;
                        // if (
                        //   req.query.caseTransferToDoctorId != "" &&
                        //   req.query.caseTransferToDoctorId != "undefined"
                        // ) {
                        //   console.log(
                        //     req.query.caseTransferToDoctorId,
                        //     "req.query.caseTransferToDoctorId"
                        //   );
                        //   assignDoc = req.query.caseTransferToDoctorId.trim();
                        // } else {
                        let assignDoc = [];
                        await users
                            .aggregate([
                                { $match: { authenticationKey: { $ne: req.query.doctorId } } },
                                { $match: { level: req.query.level } },
                                { $match: { country: preferredLocationData.country } },
                                { $match: { state: preferredLocationData.state } },
                                { $match: { city: preferredLocationData.city } },
                                { $sample: { size: 1 } },
                                {
                                    $group: {
                                        _id: null,
                                        uniqueValuesKey: { $addToSet: "$authenticationKey" }
                                    }
                                },
                                { $project: { docId: "$uniqueValuesKey" } }
                            ])
                            .then(doctorsRecord => {
                                console.log("doctorsRecord...test", doctorsRecord);
                                assignDoc.push(doctorsRecord[0].docId[0]);
                                console.log('assignDoctor..test', assignDoc);
                            })
                            .catch(err => {
                                console.log(err, "errorMessage");
                                // res.json({
                                //     msg: err.message
                                // });
                            });
                        // }
                        ctCount = 0;
                        await caseTransfer.countDocuments().then(count => {
                            ctCount = count + 200;
                        });

                        do {
                            genRandomNumb = getRandomInt_5()
                                .toString(36)
                                .toUpperCase();
                            CTID = (today.getFullYear()).toString().substring(2, 4)
                                .concat((today.getMonth() + 1).toString().padStart(2, '0'))
                                .concat((today.getDate()).toString().padStart(2, '0'))
                                .concat(genRandomNumb.padStart(5, '0'));
                            await caseTransfer.find({ ctId: CTID }).then(count => {
                                if (count.length > 0) {
                                    caseTransferSaved = false;
                                } else {
                                    caseTransferSaved = true;
                                }
                            });
                        } while (!caseTransferSaved);

                        // let str1 = "CT";
                        // str2 = ctCount.toString(36).toUpperCase();
                        // let CTID = str1.concat(str2);
                        console.log("outside Casetransfer", assignDoc);
                        // assignDoc !== "" && assignDoc !== null && assignDoc !== undefined && 
                        if (assignDoc.length !== 0) {
                            console.log("Enter Casetransfer");
                            const caseTransfering = new caseTransfer({
                                // closed_date: Date,
                                transferedBy: req.query.doctorId,
                                transferedTo: assignDoc,
                                patientHistoryId: req.query.historyId,
                                level: req.query.level,
                                ctId: CTID,
                                patientName: req.query.patientName,
                                countryPreferred: preferredLocationData.country,
                                statePreferred: preferredLocationData.state,
                                cityPreferred: preferredLocationData.city,
                                sent: true,
                                sentDT: new Date(),
                                delivered: false,
                                deliveredDT: [],
                                read: false,
                                readDT: [],
                                caseTransferComplete: false,
                                caseTransferCompleteDT: [],
                                status: "Case Transfer Initiated",
                                title: "Case Transfer",
                                body:
                                    "Case Transferred from " +
                                    req.query.doctorId +
                                    " for patient " +
                                    req.query.patientName,
                                activeNotifications: true,
                            });

                            caseTransfering
                                .save()
                                .then(data => {
                                    console.log('responseData', data);
                                    patientshistory
                                        .updateOne(
                                            { _id: ObjectId(req.query.historyId) },
                                            { $set: { status: "Case Transfered" } }
                                        )
                                        .then(data1 => {
                                            res.json(data.ctId);

                                            // res.json({msg: 'Success', data: data});
                                            console.log("data", data1);
                                        })
                                        .catch(err => {
                                            console.log('in patienthistory update', err);
                                            // res.status(500).json({
                                            //     msg: err.message
                                            // });
                                        });
                                    // const newNotification = new notifications({
                                    //   fromCoId: req.query.doctorId,
                                    //   toCoId: assignDoc,
                                    //   sent: true,
                                    //   sentDT: new Date(),
                                    //   status: "Case Transfer Initiated",
                                    //   title: "Case Transfer",
                                    //   body:
                                    //     "Case Transferred from " +
                                    //     assignDoc +
                                    //     " for patient " +
                                    //     req.query.patientName,
                                    //   patientName:req.query.patientName
                                    // });

                                    // newNotification.save().then(newNotificationResponse => {
                                    // console.log("new notification response", newNotificationResponse);
                                    // caseTransfer
                                    //   .updateOne(
                                    //     { ctId: data.ctId },
                                    //     { $set: { notificationId: newNotificationResponse._id } }
                                    //   )
                                    //   .then(caseTransferUpdated => {
                                    //     console.log("case transfer updated..test", caseTransferUpdated);
                                    //   });

                                    // users
                                    //   .find({
                                    //     $or: [
                                    //       { authenticationKey: data.transferedBy },
                                    //       { authenticationKey: data.transferedTo }
                                    //     ]
                                    //   })

                                    billDetails = {
                                        officerName: usersFound.name,
                                        officerAddress: usersFound.country,
                                        officerId: usersFound.authenticationKey,
                                        patientId: req.query.patientId,
                                        patientName: data.patientName,
                                        payedAt: new Date(),
                                        amount: subscriptionUpdated.billAmount,
                                        transactionNumber: subscriptionUpdated.receiptNumber,
                                        orderId: req.query.orderId,
                                        transactionPurpose: subscriptionUpdated.billPurpose,
                                        caseTransferId: data.ctId,
                                        path: `./bills/${usersFound.authenticationKey}/${data.ctId}.pdf`
                                    };
                                    generateBill(billDetails);

                                    billings.updateOne({ razorpay_order_id: paymentDetails.items[0].order_id }, { $set: { receiptURL: env.baseURL + `bills/${billDetails.officerId}/${billDetails.caseTransferId}.pdf` } }).then(billReceiptUrl => {
                                        console.log('bill receipt url..test', billReceiptUrl);
                                    });
                                    users
                                        .findOne({ authenticationKey: data.transferedTo[data.transferedTo.length - 1] })
                                        .distinct("notificationToken")
                                        .then(sendNotificationDetails => {
                                            console.log(
                                                "sendNotification details...test",
                                                sendNotificationDetails
                                            );
                                            const firebaseToken = sendNotificationDetails;

                                            const payload = {
                                                notification: {
                                                    title: "Case Transfer",
                                                    body:
                                                        "Case Transferred from " +
                                                        req.query.doctorId +
                                                        " for patient " +
                                                        req.query.patientName
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
                                        });
                                    // });
                                })
                                .catch(err => {
                                    console.log('err message..test..called', err.message);
                                    // res.json({
                                    //     msg: err.message
                                    // });
                                });

                            console.log('patient History..test..with id', req.query.historyId);


                        }
                        else {
                            res.json('No doctor Available');
                        }




                    });


                    // res.json({ msg: 'paymentSuccess' });
                });



            } else {
                res.json({ msg: 'paymentFailed' });
            }




        });
    } else {
        res.json({ msg: 'paymentFailed' });
    }

});


router.post('/monthlyPayment/retrieveOrderId', async (req, res) => {
    console.log('req.body..test', req.body);
    billings.findOne({ billNumber: req.body.billNumber }).then(monthlyBillResponse => {
        console.log('monthlyBillResponse...test', monthlyBillResponse);
        const options = {
            amount: monthlyBillResponse.billAmount * 100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: monthlyBillResponse.billNumber,
            payment_capture: true
        };

        razorPay.orders.create(options, function (err, order) {
            console.log('error...', err);
            console.log('order..test..razorpay', order);
            billings.updateOne({ billNumber: req.body.billNumber }, { $set: { razorpay_order_id: order.id } }).then(monthlyBillOrderUpdated => {
                console.log(monthlyBillOrderUpdated);
                res.json({ orderDetails: order });
            })

        });

    });


});

router.post('/monthlyPayment/retrievePayId', async (req, res) => {
    console.log('req.body..test payiD', req.body);

    let billDetails = {};
    let receiptId = '';

    const generated_signature = CryptoJS.HmacSHA256(req.body.orderId + "|" + req.body.payId, env.razorPay_key_secret);
    console.log('generated_signature', generated_signature);
    console.log('req.query.signatureId', req.body.signatureId);
    if (generated_signature == req.body.signatureId) {

        razorPay.orders.fetchPayments(req.body.orderId).then(async paymentResponseDetails => {
            console.log('payment Details..test', paymentResponseDetails);
            const paymentDetails = paymentResponseDetails;
            let saveBill_Details;
            do {
                let genRandomNumb_5 = getRandomInt_5().toString(36).toUpperCase();
                genRandomNumb_5.padStart(5, '0');
                receiptId = 'R' + new Date().getFullYear().toString().substring(4, 2) + (new Date().getMonth() + 1).toString() + new Date().getDate().toString() + genRandomNumb_5;
                await billings.find({ receiptNumber: receiptId }).then(count => {
                    if (count.length > 0) {
                        saveBill_Details = false;
                    } else {
                        saveBill_Details = true;
                    }
                });
            } while (!saveBill_Details);
            billings.findOne({ razorpay_order_id: req.body.orderId }).then(billFound => {
                console.log('billlFound..test', billFound);
                users.findOne({ authenticationKey: billFound.coid }).then(userFound => {
                    billDetails = {
                        officerName: userFound.name,
                        officerAddress: userFound.country,
                        officerId: userFound.authenticationKey,
                        payedAt: new Date(),
                        amount: billFound.billAmount,
                        transactionNumber: receiptId,
                        orderId: req.body.orderId,
                        transactionPurpose: billFound.billPurpose,
                        path: `./bills/${userFound.authenticationKey}/${req.body.orderId}.pdf`
                    };
                    generateBill(billDetails);

                    console.log("paymentDetails.items[0].status...test", paymentDetails.items[0].status);
                    if (paymentDetails.items[0].status === 'captured') {
                        console.log('receiptURl..test...url', env.baseURL + "bills/" + userFound.authenticationKey + "/" + req.body.orderId + ".pdf");
                        billings.updateOne({ razorpay_order_id: req.body.orderId }, {
                            $set: {
                                razorpay_payment_id: req.body.payId, razorpay_signature: req.body.signatureId, billPaidDate: new Date(), receiptNumber: receiptId, status: 'paid', receiptURL: env.baseURL + "bills/" + userFound.authenticationKey + "/" + req.body.orderId + ".pdf", read: true,
                                readDT: [new Date()],activeNotifications:false
                            }
                        }).then(monthlyBillUpdated => {
                            console.log('monthly..bill updated..test', monthlyBillUpdated);
                            res.json({ msg: 'Payment Success' });
                        }).catch((err) => {
                            console.log('err response..', err);
                        });



                    } else {
                        res.json({ msg: 'Payment Failed' });
                    }


                });
            })





        });
    } else {
        res.json({ msg: 'Payment Failed' });
    }
});
// router.post('/create-payment', async (req, res) => {
//     console.log('req.body....create payment',req.body.plan);
//     var planAmount = req.body.plan;
//     var planDetails = getPlanDetails(planAmount);

//     console.log(planDetails, "planDetails");
//     await subscription
//         .aggregate([{ $match: { planCode: req.body.plan } }])
//         .then(subscriptionDetails => {
//             request.post(
//                 PAYPAL_API + "/v1/payments/payment",
//                 {
//                     auth: {
//                         user: CLIENT,
//                         pass: SECRET
//                     },
//                     body: {
//                         intent: "sale",
//                         payer: {
//                             payment_method: "paypal"
//                         },
//                         transactions: [
//                             {
//                                 amount: {
//                                     total: subscriptionDetails[0].price,
//                                     currency: "USD"
//                                 }
//                             }
//                         ],
//                         redirect_urls: {
//                             return_url: "http://localhost:4200/",
//                             cancel_url: "http://localhost:4200/"
//                         }
//                     },
//                     json: true
//                 },
//                 function (err, response) {
//                     if (err) {
//                         console.error(err);
//                         return res.sendStatus(500);
//                     }
//                     res.json({
//                         id: response.body.id
//                     });
//                 }
//             );
//         })
//         .catch(error => {
//             console.log("There was an error in create payment : %s", error);
//         });
// });


// router.post('/execute-payment', async (req, res) => {
//     var paymentID = req.body.paymentID;
//     var payerID = req.body.payerID;
//     var planCode = req.body.plan;
//     var userId = req.body.userId;
//     console.log("req.body....execute payment",req.body );
//     // 3. Call /v1/payments/payment/PAY-XXX/execute to finalize the payment.
//     request.post(
//         PAYPAL_API + "/v1/payments/payment/" + paymentID + "/execute",
//         {
//             auth: {
//                 user: CLIENT,
//                 pass: SECRET
//             },
//             body: {
//                 payer_id: payerID,
//                 transactions: [
//                     {
//                         amount: {
//                             total: 50,
//                             currency: "USD"
//                         }
//                     }
//                 ]
//             },
//             json: true
//         },
//         function (err, response) {
//             // console.log(response, "Receieved Response");
//             if (err) {
//                 console.error(err);
//                 return res.sendStatus(500);
//             } else {
//                 // getPlanDetails(userId);
//                 subscription
//                     .aggregate([
//                         {
//                             $match: {
//                                 planCode: planCode
//                             }
//                         }
//                     ])
//                     .then(subscriptionDetails => {
//                         console.log(subscriptionDetails[0].tarrifType, "dataSave");

//                         function addDays(theDate, days) {
//                             return new Date(theDate.getTime() + days * 24 * 60 * 60 * 1000);
//                         }
//                         if (subscriptionDetails[0].tarrifType == "month")
//                             var expiryDate = addDays(new Date(), 30);
//                         else var expiryDate = addDays(new Date(), 365);

//                         users
//                             .updateOne(
//                                 {
//                                     authenticationKey: userId
//                                 },
//                                 {
//                                     $set: {
//                                         expiryDate: expiryDate
//                                     }
//                                 }
//                             )
//                             .then(data => {
//                                 // res.json({msg: 'Success', data: data});
//                                 console.log("data", data);
//                             })
//                             .catch(err => {
//                                 res.status(500).json({
//                                     msg: err.message
//                                 });
//                             });
//                         var subscriptionCreation = new subscriptionHistory({
//                             planCode: planCode,
//                             userId: userId,
//                             price: subscriptionDetails[0].price,
//                             createdAt: new Date()
//                         });

//                         subscriptionCreation
//                             .save()
//                             .then(data => {
//                                 console.log(data);
//                                 // res.json({
//                                 //  message: 'Subscription addedd!'
//                                 //  });
//                             })
//                             .catch(err => {
//                                 console.log(err, "error messages");
//                                 // res.status(500).json({
//                                 //     msg: err.message
//                                 // });
//                             });
//                     });
//             }
//             // 4. Return a success response to the client
//             res.json({
//                 status: response
//             });
//         }
//     );
// });



module.exports = router;