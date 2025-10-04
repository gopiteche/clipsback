//notification controller

const express = require("express");
const router = express.Router();
const modulefiles = require("../models/model");

const caseTransfer = modulefiles.caseTransfer;
const users = modulefiles.users;
const notifications = modulefiles.notifications;
const billings = modulefiles.billings;

router.get("", async (req, res) => {
  try {
    let ctIds = [];
    console.log("get all notification tests...", req.query.doctorId);
    //   await caseTransfer
    //     .aggregate([
    //       {
    //         $facet: {
    //           pageInfo: [
    //             { $match: { transferedTo: req.query.doctorId } },
    //             { $match: { state: "Pending" } }
    //           ]
    //         }
    //       }
    //     ])
    //     .then(caseDetails => {
    //       console.log(caseDetails[0].pageInfo.length, "caseDetails");

    //       const tempDataArray = {};
    //       if (caseDetails[0].pageInfo.length == 1) {
    //         tempDataArray["message"] = "Someone transferred the medical case";
    //         tempDataArray["objectId"] =
    //           caseDetails[0].pageInfo[0].patientHistoryId;
    //       } else if (caseDetails[0].pageInfo.length > 1) {
    //         tempDataArray["message"] =
    //           "You have " + caseDetails[0].pageInfo.length + " case transfers";
    //         tempDataArray["objectId"] = 0;
    //       }

    //       notifyDetails.push(tempDataArray);

    //       res.json({ details: notifyDetails });
    //     })
    //     .catch(err => {
    //       console.log(err, "error messages");
    //     });

    // caseTransfer.find({$and:[{"transferedTo[transferedTo.length-1]":req.query.doctorId},{sent:true},{read:null}]}).then(notifyDetails => {
    //   console.log('notifyDetails..test',notifyDetails);
    //   res.json({details:notifyDetails});
    // })
    caseTransfer
      .aggregate([
        {
          $project: {
            receivedCaseTransfer: { $arrayElemAt: ["$transferedTo", -1] },
            closed_date: 1,
            transferedBy: 1,
            transferedTo: 1,
            patientHistoryId: 1,
            state: 1,
            level: 1,
            ctId: 1,
            patientName: 1,
            countryPreferred: 1,
            statePreferred: 1,
            cityPreferred: 1,
            sent: 1,
            sentDT: 1,
            delivered: 1,
            deliveredDT: 1,
            read: 1,
            readDT: 1,
            caseTransferComplete: 1,
            caseTransferCompleteDT: 1,
            title: 1,
            body: 1,
            activeNotifications: 1
          }
        },
        {
          $match: {
            $and: [
              { receivedCaseTransfer: req.query.doctorId },
              { sent: true },
              { caseTransferComplete: false },
              { activeNotifications: true }
            ]
          }
        }
      ])
      .then(allSentNotificationResponse => {
        console.log(
          "all notification Response..test",
          allSentNotificationResponse
        );

        caseTransfer
          .find({
            $and: [
              { transferedBy: req.query.doctorId },
              { sent: true },
              { read: true },
              { caseTransferComplete: true },
              { activeNotifications: true }
            ]
          })
          .then(allSuccessCaseTransferDetails => {
            console.log('allSuccessCaseTransferDetails...test', allSuccessCaseTransferDetails);
            allSuccessCaseTransferDetails.forEach(specificSuccesfulCase => {
              ctIds.push(specificSuccesfulCase.ctId);
              console.log('specificSuccesfulCase', specificSuccesfulCase);
            })

            billings.find({ $and: [{ coid: req.query.doctorId }, { status: 'unpaid' }, { sent: true }, { read: false }] }).then(allBillDetails => {
              console.log('allBillDetails..test..response', allBillDetails);


              res.json({
                receivedCaseTransferDetails: allSentNotificationResponse,
                successCaseTransferDetails: allSuccessCaseTransferDetails,
                allbillDetails: allBillDetails
              });
            })





            console.log('ctIds...', ctIds);




          });
      });

    // router.put('',async(req,res) => {

    // });

    // aggregate([
    //   { $project: { lastFriend: { $arrayElemAt: ['$transferedTo', -1] },closed_date:1,
    //   transferedBy: 1,
    //   transferedTo: 1,
    //   patientHistoryId: 1,
    //   state: 1,
    //   level: 1,
    //   ctId: 1,
    //   patientName: 1,
    //   notificationId:1,
    //   countryPreferred:1,
    //   statePreferred:1,
    //   cityPreferred:1,
    //   sent:1,
    //   sentDT:1,
    //   delivered:1,
    //   deliveredDT:1,
    //   read:1,
    //   readDT:1,
    //   title:1,
    //   body:1,
    //   activeNotifications:1 } },
    //   { $match: { 'lastFriend': 'CDOC11' } }
    // ]);
  } catch (e) {
    console.log("There was an errorss : %s", e);

    res.json({ error: "There was an error" });
  }
});

router.get("/notificationDetails", async (req, res) => {
  try {
    let notifyDetailsArray = [];
    console.log("req.body..", req.query);

    console.log(req.query.doctorId);
    await caseTransfer
      .aggregate([
        {
          $facet: {
            data: [
              {
                $project: {
                  notificationDetails: { $arrayElemAt: ["$transferedTo", -1] },
                  closed_date: 1,
                  transferedBy: 1,
                  transferedTo: 1,
                  patientHistoryId: 1,
                  state: 1,
                  level: 1,
                  ctId: 1,
                  patientName: 1,
                  notificationId: 1,
                  countryPreferred: 1,
                  statePreferred: 1,
                  cityPreferred: 1,
                  sent: 1,
                  sentDT: 1,
                  delivered: 1,
                  deliveredDT: 1,
                  read: 1,
                  readDT: 1,
                  title: 1,
                  body: 1,
                  activeNotifications: 1
                }
              },
              { $match: { notificationDetails: req.query.doctorId } },
              { $sort: { _id: -1 } },
              { $skip: +req.query.pageFrom },
              { $limit: +req.query.pageSize }
            ],
            pageInfo: [
              {
                $project: {
                  notificationDetails: { $arrayElemAt: ["$transferedTo", -1] },
                  closed_date: 1,
                  transferedBy: 1,
                  transferedTo: 1,
                  patientHistoryId: 1,
                  state: 1,
                  level: 1,
                  ctId: 1,
                  patientName: 1,
                  notificationId: 1,
                  countryPreferred: 1,
                  statePreferred: 1,
                  cityPreferred: 1,
                  sent: 1,
                  sentDT: 1,
                  delivered: 1,
                  deliveredDT: 1,
                  read: 1,
                  readDT: 1,
                  title: 1,
                  body: 1,
                  activeNotifications: 1
                }
              },
              { $match: { notificationDetails: req.query.doctorId } },
              {
                $group: { _id: null, count: { $sum: 1 }, ctIds: { $addToSet: "$ctId" } },

              }
            ]
          }
        }
      ])
      .then(caseDetails => {
        console.log("caseDetails..test...", caseDetails);
        console.log("caseDetails..test...test...", caseDetails[0].pageInfo);
        console.log("caseDetails..ctId", caseDetails[0].pageInfo[0].ctIds);
        // caseDetails[0].data.forEach(specificCaseDetail => {
        //   console.log('specificCase Detail test',specificCaseDetail);
        // notifyDetailsArray.push(specificCaseDetail.)
        // caseTransfer.updateOne({$and:[{ctId:specificCaseDetail.ctId},{read:false}]},{$set:{read:true},$push:{readDT:new Date()}}).then(readNotificationUpdated => {
        //   console.log('read Notification data updated',readNotificationUpdated);
        // });
        // });
        // caseTransfer.updateMany({}).ski

        caseTransfer
          .updateMany({
            $and: [
              { ctId: { $in: caseDetails[0].pageInfo[0].ctIds } },
              { read: false }
            ]
          }, { $set: { read: true }, $push: { readDT: new Date() } })
          .then(readNotificationUpdated => {
            console.log(
              "readNotificationUpdated..test..",
              readNotificationUpdated
            );
          });
        res.json({ notificationDetails: caseDetails[0] });
      })
      .catch(err => {
        console.log(err, "error messages");
      });
  } catch (e) {
    console.log("There was an errorss : %s", e);

    res.json({ error: "There was an error" });
  }
});

router.get("/getSentNotificationDetails", async (req, res) => {
  let ctIds = [];
  caseTransfer
    .aggregate([
      {
        $facet: {
          data: [
            { $match: { transferedBy: req.query.doctorId } },
            { $sort: { _id: -1 } },
            { $skip: +req.query.pageFrom },
            { $limit: +req.query.pageSize }
          ],
          pageInfo: [
            { $match: { transferedBy: req.query.doctorId } },
            { $group: { _id: null, count: { $sum: 1 }, ctIds: { $addToSet: "$ctId" } } }
          ]
        }
      }
    ])
    // .sort({'_id': -1})
    .then(caseTransferDetails => {
      // console.log('case Transfer Details test...',typeof caseTransferDetails[0].pageInfo);
      // console.log('case Transfer Details test...array', caseTransferDetails[0].pageInfo);

      // for(let case of caseTransferDetails[0].pageInfo){
      // }
      // for(let i=0;i<;i++) {

      // }
      // caseTransferDetails[0].pageInfo.sort();

      // caseTransfer.updateMany({$and:[{ctId:{$in:caseTransferDetails[0].pageInfo[0].ctIds}},{caseTransferComplete:true},{activeNotifications:true}]},{$set:{activeNotifications:false}}).then(activeNotificationResponse => {
      //   console.log('activeNotificationResponse..test...caseTransfer',activeNotificationResponse);
      // })
      console.log("test....................................");
      caseTransferDetails[0].data.forEach(sentCaseTransfer => {
        console.log("test....element", sentCaseTransfer);
        ctIds.push(sentCaseTransfer.ctId);

        if (sentCaseTransfer.state === "Pending") {
          sentCaseTransfer.transferedTo = "Pending Doctor's Approval";
        }
        if (sentCaseTransfer.state === "Accept") {
          sentCaseTransfer.state = "Confirmed";
        }
      });

      caseTransfer.updateMany({ $and: [{ ctId: { $in: ctIds } }, { caseTransferComplete: true }, { activeNotifications: true }] }, { $set: { activeNotifications: false } }).then(activeNotificationResponse => {
        console.log('activeNotificationResponse..test', activeNotificationResponse);
      });
      // const sentNotificationList = caseTransferDetails[0].pageInfo;
      // for(let case of sentNotificationList) {
      //     console.log(case);
      // }
      // caseTransferDetails[0].pageInfo.sort({state:1});
      res.json({ notificationDetails: caseTransferDetails[0] });
    });

  // catch(e){
  //     res.json({error:"There was an error"});
  // }
});

router.get("/deliver", async (req, res) => {
  console.log(
    "req..test..params..notification deliver route test",
    req.query.doctorId
  );
  // caseTransfer.updateOne({$and:[{activeNotifications:true},{sent:true},{delivered:false},{read:false}]},{$set:{delivered:true},$push:{deliveredDT:new Date()}}).then(deliverNotificationResponse => {
  //   console.log('deliverNotificationResponse..test...',deliverNotificationResponse);
  // });

  caseTransfer
    .updateMany(
      {
        $and: [
          {
            $expr: {
              $eq: [{ $arrayElemAt: ["$transferedTo", -1] }, req.query.doctorId]
            }
          },
          { activeNotifications: true },
          { sent: true },
          { delivered: false },
          { read: false },
          { caseTransferComplete: false }
        ]
      },
      { $set: { delivered: true }, $push: { deliveredDT: new Date() } }
    )
    .then(deliveredCaseTransferResponse => {
      console.log("deliveredResponse..test", deliveredCaseTransferResponse);

      billings
        .updateMany(
          {
            $and: [
              {
                // $expr: {
                //   $eq: [{ $arrayElemAt: ["$transferedTo", -1] }, req.query.doctorId]
                // }
                coid: req.query.doctorId
              },
              { activeNotifications: true },
              { sent: true },
              { delivered: false },
              { read: false }
            ]
          },
          { $set: { delivered: true }, $push: { deliveredDT: new Date() } }
        ).then(deliveredBillResponse => {
          console.log('deliveredBillResponse..test', deliveredBillResponse);
          res.json({ notificationDelivered: "success" });
        })

    });
  // caseTransfer.aggregate([
  //   {
  //     $facet: {
  //       data: [
  //         {
  //           $project: {
  //             deliveryDetails: { $arrayElemAt: ['$transferedTo', -1] }, closed_date: 1,
  //             transferedBy: 1,
  //             transferedTo: 1,
  //             patientHistoryId: 1,
  //             state: 1,
  //             level: 1,
  //             ctId: 1,
  //             patientName: 1,
  //             notificationId: 1,
  //             countryPreferred: 1,
  //             statePreferred: 1,
  //             cityPreferred: 1,
  //             sent: 1,
  //             sentDT: 1,
  //             delivered: 1,
  //             deliveredDT: 1,
  //             read: 1,
  //             readDT: 1,
  //             title: 1,
  //             body: 1,
  //             activeNotifications: 1
  //           }
  //         },
  //         { $match: { deliveryDetails: req.query.doctorId } },
  //         { $sort: { _id: -1 } },
  //         { $skip: +req.query.pageFrom },
  //         { $limit: +req.query.pageSize }
  //       ]
  //     }
  //   }]);
});

router.get("/:notificationToken/:doctorId", async (req, res) => {
  console.log("req.params..test..update notification", req.params);

  users
    .updateOne(
      { authenticationKey: req.params.doctorId },
      { $set: { notificationToken: req.params.notificationToken } }
    )
    .then(updateNotificationToken => {
      console.log("updateNotificationToken..test..", updateNotificationToken);
      res.json({ notificationToken: "updated" });
    });
});

module.exports = router;
