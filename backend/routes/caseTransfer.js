//caseTransferController

const express = require("express");
const router = express.Router();
const modulefiles = require("../models/model");

const patientshistory = modulefiles.patientshistory;
const users = modulefiles.users;
const caseTransfer = modulefiles.caseTransfer;
const firebase = require("./fireBase").firebase;
const options = require("./fireBase").options;
const notifications = modulefiles.notifications;

function getRandomInt_5() {
  return Math.floor(Math.random() * Math.floor(60466176));
}

router.get("/getCaseTransPatientRecord", async (req, res) => {
  console.log("getCaseTransPatientRecord");
  await patientshistory
    .find({ _id: req.query.historyId })
    .sort({ _id: -1 })
    .then(responseData => {
      res.json({
        patientRecord: responseData
      });
    })
    .catch(err => {
      console.log(err.message);
      res.json({
        msg: err.message
      });
    });
});

router.get("/getPatientCaseTransferRecord", async (req, res) => {
  console.log(req.query.objectId, "req.query.objectId");
  await patientshistory
    .find({ _id: req.query.objectId })
    .then(patientDetails => {
      console.log(patientDetails);
      res.json({
        patientsHistorySet: patientDetails
      });
    })
    .catch(err => {
      res.json({
        msg: err.message
      });
    });
});

router.get("/sendRequest", async (req, res) => {
  console.log("receivedData...test send request..", req.query);

  console.log(
    "preferred location data...",
    JSON.parse(req.query.preferredLocationData)
  );

  let today = new Date();
  let preferredLocationData = JSON.parse(req.query.preferredLocationData);
  let assignDoc = "";
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
  assignDoc = [];
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
      console.log(doctorsRecord, "doctorsRecord");
      assignDoc.push(doctorsRecord[0].docId[0]);
    })
    .catch(err => {
      console.log(err, "errorMessage");
      res.json({
        msg: err.message
      });
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
  if (assignDoc !== "" && assignDoc !== null && assignDoc !== undefined) {
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
        res.json(data.ctId);
        console.log('responseData', data);
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
        res.json({
          msg: err.message
        });
      });
  }

  await patientshistory
    .updateOne(
      { _id: req.query.historyId },
      { $set: { status: "Case Transfered" } }
    )
    .then(data => {
      // res.json({msg: 'Success', data: data});
      console.log("data", data);
    })
    .catch(err => {
      res.status(500).json({
        msg: err.message
      });
    });
});

router.get("/caseTransferResponse", async (req, res) => {
  console.log("req.query", req.query);
  let assignDoc;
  // console.log("req.query.notificationId..test", req.query.notificationId);
  let caseTransferID = req.query.caseTransferId;
  await caseTransfer
    .findOneAndUpdate(
      { _id: caseTransferID },
      {
        $set: {
          state: req.query.status
          // updatedOn: new Date()
        }
      }
    )
    .then(updated => {
      console.log("Details Updated", updated);
      console.log('updated.transferedBy', updated.transferedBy);
      let message = "";

      if (req.query.status == "Accept") {
        message = "Thank you for your Acknowledgement";
        caseTransfer
          .updateOne(
            { _id: caseTransferID },
            { $set: { caseTransferComplete:true, title: 'Case Transfer Success', body: updated.transferedTo[updated.transferedTo.length - 1] + ' accepted your case transfer for patient ' + updated.patientName }, $push: { caseTransferCompleteDT: new Date() } }
          )
          .then(ackDateupdated => {
            console.log("ackDateupdated for case transfer..", ackDateupdated);
            users.findOne({ authenticationKey: updated.transferedBy }).then(caseTransferedBy => {
              console.log('test..caseTransferedBy', caseTransferedBy);

              const firebaseToken = caseTransferedBy.notificationToken;

              const payload = {
                notification: {
                  title: "Case Transfer Success",
                  body: updated.transferedTo[updated.transferedTo.length - 1] + ' accepted your case transfer for patient ' + updated.patientName
                },


              };
              firebase
                .messaging()
                .sendToDevice(firebaseToken, payload, options)
                .then(response => {
                  console.log(
                    "notification sent successfully",
                    response
                  );
                })
                .catch(e => {
                  console.log("error notification message...", e);
                });
            });

          });
        // notifications
        //   .findOneAndUpdate(
        //     { _id: req.query.notificationId },
        //     { $set: { read: true, readDT: new Date() } }
        //   )
        //   .then(notificationReadResponse => {
        //     console.log(
        //       "notification Read Response..test",
        //       notificationReadResponse
        //     );

        //   const acceptNotification = new notifications({
        //     fromCoId: notificationReadResponse.fromCoId,
        // toCoId: notificationReadResponse.toCoId,
        // sent: true,
        // sentDT: new Date(),
        // status: "Case Transfer Success",
        // title: "Case Transfer Success",
        // body:notificationReadResponse.toCoId +
        //   " accepted your case transfer" +
        //   " for patient " +
        //   notificationReadResponse.patientName,
        //   activeAcceptNotifications:false
        //   });

        //   acceptNotification.save().then(acceptNotificationResponse => {
        //     console.log('active notification response test',acceptNotificationResponse);
        //   });
        // });
      } else {
        message = "Thank you for your response";
        console.log(req.query, "req.query");
        caseTransfer
          .findOne({ _id: caseTransferID })
          .then(caseTransferFound => {
            console.log("case Transfer found test...", caseTransferFound);

            users
              .aggregate([
                { $match: { authenticationKey: { $ne: req.query.doctorId } } },
                // { $match: { authenticationKey: { $ne: req.query.doctorId } } },
                { $match: { level: req.query.docLevel } },
                { $match: { country: caseTransferFound.countryPreferred } },
                { $match: { state: caseTransferFound.statePreferred } },
                { $match: { city: caseTransferFound.cityPreferred } },
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
                console.log(doctorsRecord, "doctorsRecord");
                assignDoc = doctorsRecord[0].docId[0];

                caseTransfer
                  .updateOne(
                    { _id: caseTransferID },
                    {
                      $push: {
                        transferedTo: assignDoc,
                        sentDT: new Date(),
                        deliveredDT: [],
                        readDT: [],
                        caseTransferCompleteDT: []
                      },
                      $set: {
                        sent: true,
                        delivered: false,
                        read: false,
                        caseTransferComplete: false,
                        title: "Case Transfer",
                        body:
                          "Case Transferred from " +
                          assignDoc +
                          " for patient " +
                          caseTransferFound.patientName,
                        activeNotifications: true
                      }
                    }
                  )
                  .then(doctorsRecord => {
                    console.log(doctorsRecord, "Successfully Reassigned");

                    // notifications
                    //   .updateOne(
                    //     { _id: caseTransferFound.notificationId },
                    //     {
                    //       $set: {
                    //         toCoId: assignDoc,
                    //         sent: true,
                    //         sentDT: new Date(),
                    //         delivered: null,
                    //         deliveredDT: null,
                    //         body:
                    //           "Case Transferred from " +
                    //           assignDoc +
                    //           " for patient " +
                    //           caseTransferFound.patientName
                    //       }
                    //     }
                    //   )
                    //   .then(notificationFound => {
                    //     console.log(
                    //       "notification found..test",
                    //       notificationFound
                    //     );
                    // const newIgnoreNotification = new notifications({
                    //   fromCoId: String,
                    //   toCoId:String,
                    //   sent:Boolean,
                    //   sentDT:Date,
                    // });
                    users
                      .findOne({ authenticationKey: assignDoc })
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
                              assignDoc +
                              " for patient " +
                              caseTransferFound.patientName
                          }
                        };
                        firebase
                          .messaging()
                          .sendToDevice(firebaseToken, payload, options)
                          .then(response => {
                            console.log(
                              "notification sent successfully",
                              response
                            );
                          })
                          .catch(e => {
                            console.log("error notification message...", e);
                          });
                      });
                    // });
                  });
              });
          });
      }
      res.json({
        msg: message
      });
    })
    .catch(err => {
      console.log("Error", err);
      res.json({
        msg: err.message
      });
    });
});

router.get("/getAllCountries/:level", async (req, res) => {
  console.log("req in getAllCountries..test..", req.params);

  // users.find({},{country:1,_id:0}).then(countryResponse => {
  //   console.log('country response...',countryResponse)
  // });

  users
    .find({ level: req.params.level, "authenticationKey": { $ne: req.query.doctorId } })
    .distinct("country")
    .then(countryResponse => {
      console.log("countryResponse...test", countryResponse);
      countryResponse.sort();
      res.json({ countryResponse });
    });
});

router.get("/getState/:level/:countryName", async (req, res) => {
  console.log("req...params...test", req.params);
  users
    .find({
      $and: [{ level: req.params.level }, { country: req.params.countryName }]
    })
    .distinct("state")
    .then(stateResponse => {
      console.log("state Response...test", stateResponse);
      stateResponse.sort();
      res.json({ stateResponse });
    });
});

router.get("/getCity/:level/:countryName/:stateName", async (req, res) => {
  console.log("req..params..test..stateName", req.params);
  users
    .find({
      $and: [
        { level: req.params.level },
        { country: req.params.countryName },
        { state: req.params.stateName }
      ]
    })
    .distinct("city")
    .then(cityResponse => {
      console.log("cityResponse..test", cityResponse);
      cityResponse.sort();
      res.json({ cityResponse });
    });
});

router.get("/getDoctorDetails", async (req, res) => {
  console.log("req.queryParams..test", req.query);

  users
    .findOne(
      { authenticationKey: req.query.transferredDoctorId },
      {
        _id: 0,
        authenticationValue: 0,
        resetPasswordExpires: 0,
        resetPasswordToken: 0
      }
    )
    .then(doctorDetails => {
      console.log("doctorDetails..test", doctorDetails);
      res.json({ doctorDetails });
    });
});

module.exports = router;
