//patientController

const express = require("express");
const router = express.Router();
const modulefiles = require("../models/model");
const nodemailer = require("nodemailer");
const EmailTemplate = require("email-templates").EmailTemplate;
const path = require("path");
const Promise = require("bluebird");
const patientshistory = modulefiles.patientshistory;
const users = modulefiles.users;
const patients = modulefiles.patients;
const country = modulefiles.countries;
const patientLogs = modulefiles.patientLogs;
const advices = modulefiles.advices;
var ObjectId = require('mongodb').ObjectID;
const baseURL = require('../../env.json').baseURL;

var pdf = require("dynamic-html-pdf");

const multer = require("multer");
// const path = require('path');
let fs = require("fs-extra");
var html = fs.readFileSync("./backend/routes/pdf.html", "utf8");

const MIME_TYPE_MAP = {

  "image/jpg": "jpg",
  "image/png": "png",
  "image/jpeg": "jpeg",
  "application/pdf": "pdf"
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    console.log("invaid..eror...");
    if (isValid) {
      error = null;
      console.log("error,.....nulll......", error);
    }
    // let type = req.body.type;
    // console.log('type...', type);
    // console.log('Req..body in multer..folderName', file.originalname);
    console.log(
      "Req..body in multer..folderName",
      file.originalname.split("_")[0]
    );

    let path = `./reportfiles/${file.originalname.split("_")[0]}`;
    fs.mkdirsSync(path);

    cb(error, path);
    // http://52.14.30.0:3000/backend/images/doctor_profile-pic
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + "-" + Date.now() + "." + ext);
  }
});

let toPatient = [
  {
    name: "",
    email: "",
    patientId: ""
  }
];
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

function getRandomInt() {
  return Math.floor(Math.random() * Math.floor(60466176));
}

function loadTemplate(templateName, contexts) {
  let template = new EmailTemplate(
    path.join(__dirname, "templates", templateName)
  );
  return Promise.all(
    contexts.map(context => {
      console.log("context", context);
      return new Promise((resolve, reject) => {
        template.render(context, (err, result) => {
          if (err) reject(err);
          else resolve({ email: result, context });
        });
      });
    })
  );
}

function dateDiff(startingDate, endingDate) {
  let startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));
  if (!endingDate) {
    endingDate = new Date().toISOString().substr(0, 10); // need date in YYYY-MM-DD format
  }
  let endDate = new Date(endingDate);
  if (startDate > endDate) {
    const swap = startDate;
    startDate = endDate;
    endDate = swap;
  }
  const startYear = startDate.getFullYear();
  const february =
    (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0
      ? 29
      : 28;
  const daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let yearDiff = endDate.getFullYear() - startYear;
  let monthDiff = endDate.getMonth() - startDate.getMonth();
  if (monthDiff < 0) {
    yearDiff--;
    monthDiff += 12;
  }
  let dayDiff = endDate.getDate() - startDate.getDate();
  if (dayDiff < 0) {
    if (monthDiff > 0) {
      monthDiff--;
    } else {
      yearDiff--;
      monthDiff = 11;
    }
    dayDiff += daysInMonth[startDate.getMonth()];
  }

  return yearDiff + "Y " + monthDiff + "M " + dayDiff + "D";
}

router.post(
  "/patientHistory",
  multer({ storage: storage }).array("reportFiles"),
  (req, res) => {
    // console.log("req.files test...", req.files);
    // console.log("req.body...test", req.body);
    let reportFilesArray = [];
    let fileArray = [];
    for (let file of req.files) {
      reportFilesArray.push(
        `${baseURL}reportfiles/` +
        file.originalname.split("_")[0] +
        "/" +
        file.filename
      );
      fileArray.push(file.originalname);
    }
    let datajson = req.body.patientData;
    console.log("dataJSON..test", datajson);
    let visitData = {};
    // let adviceArraySet = [];
    visitData["complaintSet"] = JSON.parse(datajson[0]);
    visitData["generalexamSet"] = JSON.parse(datajson[1]);
    visitData["systemicexamSet"] = JSON.parse(datajson[2]);
    visitData["clinicalInvestigationSet"] = JSON.parse(datajson[3]);
    visitData["reportFiles"] = reportFilesArray;
    visitData["disease"] = JSON.parse(datajson[4]);
    visitData["medicine"] = JSON.parse(datajson[5]);
    visitData["doctor"] = datajson[6];
    visitData["updatedOn"] = new Date();
    visitData["remarks"] = datajson[8];

    // visitData.push(
    //   {complaintSet: datajson[0]},
    //   {generalexamSet: datajson[1]},
    //   {systemicexamSet: datajson[2]},
    //   {disease: datajson[3]},
    //   {clinicalInvestigationSet: datajson[4]},
    //   {medicine: datajson[5]},
    //   {doctor: datajson[6]},
    //   {updatedOn: new Date()}
    //   );

    // visitData[0] = ;
    // visitData[1] = ;
    // visitData[2] = ;
    // visitData[3] = ;
    // visitData[4] = ;
    // visitData[5] = ;
    // visitData[6] = ;
    // visitData[7] = ;

    let visitDataSet = [];
    let today = new Date();
    visitDataSet.push(visitData);
    // let visit = {};
    patients
      .findOne({ patientId: datajson[7] })
      .then(patientData => {
        console.log("tempData", visitDataSet);
        if (visitDataSet) {
          const patientshistory1 = new patientshistory({
            patientId: datajson[7],
            patientName: patientData.firstName + " " + patientData.lastName,
            visit: visitDataSet
          });
          console.log("patientshistory1", patientshistory1);
          patientshistory1.save().then(data => {
            users
              .findOne({ authenticationKey: datajson[6].split(" ")[0] })
              .then(doctorData => {
                console.log("doctorData..test...", doctorData);

                console.log("patients Data..test..", patientData);
                advices
                  .find({ disease: { $in: JSON.parse(datajson[4]) } })
                  .distinct("advice", { advice: { $ne: "undefined" } })
                  .then(advicesFound => {
                    console.log("advices..found", advicesFound);
                    let path = `./prescription/${data.patientId}`;
                    fs.mkdirsSync(path);

                    pdf.registerHelper("incremented", function (index) {
                      index++;
                      return index;
                    });
                    var options = {
                      format: "A4",
                      orientation: "landscape"
                    };
                    console.log("html", html);
                    var document = {
                      template: html,
                      context: {
                        pdfData: {
                          doctorName: doctorData.name,
                          doctorId: doctorData.authenticationKey,
                          designation: doctorData.designation,
                          patientName:
                            patientData.firstName + " " + patientData.lastName,
                          patientId: patientData.patientId,
                          patientAge: dateDiff(patientData.dateofbirth, today),
                          gender: patientData.gender,
                          date:
                            today.getDate() +
                            " " +
                            months[today.getMonth()] +
                            " " +
                            today.getFullYear(),
                          enclosuresLink: fileArray

                          // fname: 'Arun',
                          // mname: '',
                          // lname: 'Varadharajulu',
                          // img: 'http://www.grupoproductivo.com.ar/img/goo.jpg'
                        },
                        prescriptionData: JSON.parse(datajson[5]),
                        advices: advicesFound,
                        signatureImage: doctorData.userSignatureURL
                        // signatureImage:'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg'
                      },
                      path: `./prescription/${data.patientId}/${data._id}_0.pdf`
                    };

                    console.log("document..testwith console...", document);

                    pdf
                      .create(document, options)
                      .then(result => {
                        console.log("test response", result);
                        patientshistory
                          .updateOne(
                            { _id: data._id },
                            {
                              $push: {
                                "visit.0.prescriptionURL": `${baseURL}prescription/${data.patientId}/${data._id}_0.pdf`
                              }
                            }
                          )
                          .then(prescriptionPDF => {
                            console.log("priscription PDF updated...");
                            res.json({ msg: "Success", data: data });
                          });
                      })
                      .catch(error => {
                        console.error("error response", error);
                      });
                  });
              });

            console.log("data", data);
          });
        }
      })
      .catch(err => {
        res.status(500).json({
          msg: err.message
        });
      });
  }
);

router.get("/getPatientHistory", async (req, res) => {
  console.log("patientID", req.query.patientId);
  // console.log('testing get patient details...');
  // let datajson = req.body;
  // console.log(datajson);

  await patientshistory
    .find({ patientId: req.query.patientId })
    .sort({ _id: -1 })
    .then(patientHistoryList => {
      console.log("patient History List", patientHistoryList);
      res.json({
        patientsHistorySet: patientHistoryList
      });
    })
    .catch(err => {
      res.json({
        msg: err.message
      });
    });
});

router.get("/getPatientIds", async (req, res) => {
  console.log(req.query.searchString);
  await patients
    // find({}, {patientId:1, _id:0})
    .aggregate([
      {
        $facet: {
          pageInfo: [
            {
              $match: {
                $or: [
                  { patientId: new RegExp(req.query.searchString, "mi") },
                  { phone: new RegExp(req.query.searchString, "mi") }
                  // { firstName: new RegExp(req.query.searchString, 'mi') },
                ]
              }
            },
            {
              $group: {
                _id: null,
                uniqueValuesKey: { $addToSet: "$patientId" },
                uniquePatientNumbers: { $addToSet: "$phone" },
                patientIdMob: {
                  $addToSet: {
                    $concat: [
                      "$patientId",
                      " - ",
                      "$phone",
                      " - ",
                      "$firstName"
                    ]
                  }
                }
              }
            },
            {
              $project: {
                patientId: "$uniqueValuesKey",
                patientIdMob: "$patientIdMob",
                _id: 0
              }
            }
          ]
        }
      }
    ])
    .then(patientDetails => {
      console.log("patient info", patientDetails[0].pageInfo[0].patientId);
      // console.log('patient Details...', patientDetails[0].pageInfo[0].patientId);
      res.json({
        patientIds: patientDetails[0].pageInfo[0].patientId,
        patientIdMob: patientDetails[0].pageInfo[0].patientIdMob,
        msg: "Success"
      });
    })
    .catch(err => {
      res.json({
        msg: "Invalid Patent Details"
      });
    });
});

router.get("/getPatientLastRecord", async (req, res) => {
  console.log("req.query", req.query);
  console.log("patientID", req.query.patientId);
  console.log("doctorID", req.query.doctorId);
  console.log("patient get details test success...");
  let patientLastRecord = {};
  await patientshistory
    .find({ patientId: req.query.patientId })
    .sort({ _id: -1 })
    .limit(1)
    .then(patientLastVisitRecord => {
      console.log("patient Last VISIT record", patientLastVisitRecord);

      patientLastRecord["_id"] = patientLastVisitRecord[0]._id;
      patientLastRecord["patientId"] = patientLastVisitRecord[0].patientId;
      patientLastRecord["status"] = patientLastVisitRecord[0].status;
      // console.log('Visit Length', patientLastVisitRecord[0].visit.length);
      let lastVistNumber = patientLastVisitRecord[0].visit.length - 1;
      patientLastRecord["complaintSet"] =
        patientLastVisitRecord[0].visit[lastVistNumber].complaintSet;
      patientLastRecord["generalexamSet"] =
        patientLastVisitRecord[0].visit[lastVistNumber].generalexamSet;
      patientLastRecord["systemicexamSet"] =
        patientLastVisitRecord[0].visit[lastVistNumber].systemicexamSet;
      patientLastRecord["disease"] =
        patientLastVisitRecord[0].visit[lastVistNumber].disease;
      patientLastRecord["clinicalInvestigationSet"] =
        patientLastVisitRecord[0].visit[
          lastVistNumber
        ].clinicalInvestigationSet;
      patientLastRecord["furtherTreatment"] =
        patientLastVisitRecord[0].visit[lastVistNumber].furtherTreatment;
      patientLastRecord["medicine"] =
        patientLastVisitRecord[0].visit[lastVistNumber].medicine;
      patientLastRecord["doctor"] =
        patientLastVisitRecord[0].visit[lastVistNumber].doctor;
      patientLastRecord["updatedOn"] =
        patientLastVisitRecord[0].visit[lastVistNumber].updatedOn;
      console.log("patient Last record", patientLastRecord);
      let patientLtestRecord = [];
      patientLtestRecord.push(patientLastRecord);

      res.json({
        patientLastRecord: patientLtestRecord
      });
    })
    .catch(err => {
      console.log(err.message);
      res.json({
        msg: err.message
      });
    });
});

router.get("/getPatientLastRecordById", async (req, res) => {
  console.log("patientID--->", req.query.objId);
  let patientLastRecord = {};
  await patientshistory
    .find({ _id: req.query.objId })
    .sort({ _id: -1 })
    .limit(1)
    .then(patientLastVisitRecord => {
      console.log("patient Last VISIT record", patientLastVisitRecord);

      patientLastRecord["_id"] = patientLastVisitRecord[0]._id;
      patientLastRecord["patientId"] = patientLastVisitRecord[0].patientId;
      patientLastRecord["status"] = patientLastVisitRecord[0].status;
      // console.log('Visit Length', patientLastVisitRecord[0].visit.length);
      let lastVistNumber = patientLastVisitRecord[0].visit.length - 1;
      patientLastRecord["complaintSet"] =
        patientLastVisitRecord[0].visit[lastVistNumber].complaintSet;
      patientLastRecord["generalexamSet"] =
        patientLastVisitRecord[0].visit[lastVistNumber].generalexamSet;
      patientLastRecord["systemicexamSet"] =
        patientLastVisitRecord[0].visit[lastVistNumber].systemicexamSet;
      patientLastRecord["disease"] =
        patientLastVisitRecord[0].visit[lastVistNumber].disease;
      patientLastRecord["clinicalInvestigationSet"] =
        patientLastVisitRecord[0].visit[
          lastVistNumber
        ].clinicalInvestigationSet;
      patientLastRecord["medicine"] =
        patientLastVisitRecord[0].visit[lastVistNumber].medicine;
      patientLastRecord["doctor"] =
        patientLastVisitRecord[0].visit[lastVistNumber].doctor;
      patientLastRecord["updatedOn"] =
        patientLastVisitRecord[0].visit[lastVistNumber].updatedOn;
      console.log("patient Last record", patientLastRecord);
      let patientLtestRecord = [];
      patientLtestRecord.push(patientLastRecord);

      res.json({
        patientLastRecord: patientLtestRecord
      });
    })
    .catch(err => {
      console.log(err.message);
      res.json({
        msg: err.message
      });
    });
});

router.put(
  "/patientHistory",
  multer({ storage: storage }).array("reportFiles"),
  async (req, res) => {
    console.log("request Data", req.body.patientData);
    let reportFilesArray = [];
    for (let file of req.files) {
      reportFilesArray.push(
        `${baseURL}reportfiles/` +
        file.originalname.split("_")[0] +
        "/" +
        file.filename
      );
    }
    let datajson = req.body.patientData;
    let visitData = {};
    visitData["complaintSet"] = JSON.parse(datajson[0]);
    visitData["generalexamSet"] = JSON.parse(datajson[1]);
    visitData["systemicexamSet"] = JSON.parse(datajson[2]);
    visitData["clinicalInvestigationSet"] = JSON.parse(datajson[3]);
    visitData["reportFiles"] = reportFilesArray;
    visitData["disease"] = JSON.parse(datajson[4]);
    visitData["medicine"] = JSON.parse(datajson[5]);
    visitData["doctor"] = datajson[6];
    visitData["updatedOn"] = new Date();
    visitData["remarks"] = datajson[9];
    // if (datajson[9]) {
    //   visitData["furtherTreatment"] = datajson[9];
    // } else {
    //   visitData["furtherTreatment"] = [];
    // }

    let visitDataSet = [];
    let today = new Date();

    visitDataSet.push(visitData);
    console.log("visit Data set...", visitDataSet);
    let patientRecordId = datajson[8];
    // patientshistory.findOne()
    if (visitDataSet) {
      console.log("tempData", visitDataSet);
      await patientshistory
        .findOneAndUpdate(
          { _id: patientRecordId },
          { $push: { visit: visitDataSet } }
        )
        .then(data => {
          console.log("data", data);
          let path = `./prescription/${data.patientId}`;
          fs.mkdirsSync(path);

          users
            .findOne({ authenticationKey: datajson[6].split(" ")[0] })
            .then(doctorData => {

              patients
                .findOne({ patientId: datajson[7] })
                .then(patientData => {
                  console.log('patientData...test for datajson[7]',patientData);
                  advices
                    .find({ disease: { $in: JSON.parse(datajson[4]) } })
                    .distinct("advice", { advice: { $ne: "undefined" } })
                    .then(advicesFound => {
                      console.log("advices..found", advicesFound);
                      console.log('patientRecordId with aggregate..test',patientRecordId);
                      patientshistory.aggregate([
                        { $match: {"_id": ObjectId(patientRecordId) } },
                        {
                          $project: {
                            data: '$visit',
                            size: { $size: '$visit' }
                          }
                        }
                      ]).then(visitArraySizeFound => {
                        console.log('visitArraySizeFound..test', visitArraySizeFound);
                        console.log('test lenght..',visitArraySizeFound[0].data[visitArraySizeFound[0].data.length-1].updatedOn);
                        
                      pdf.registerHelper("incremented", function (index) {
                        index++;
                        return index;
                      });
                      var options = {
                        format: "A4",
                        orientation: "landscape"
                      };
                      console.log("html", html);
                      var document = {
                        template: html,
                        context: {
                          pdfData: {
                            doctorName: doctorData.name,
                            doctorId: doctorData.authenticationKey,
                            designation: doctorData.designation,
                            patientName:
                              patientData.firstName + " " + patientData.lastName,
                            patientId: patientData.patientId,
                            patientAge: dateDiff(patientData.dateofbirth, today),
                            gender: patientData.gender,
                            date:
                              today.getDate() +
                              " " +
                              months[today.getMonth()] +
                              " " +
                              today.getFullYear(),
                            enclosuresLink: reportFilesArray

                            // fname: 'Arun',
                            // mname: '',
                            // lname: 'Varadharajulu',
                            // img: 'http://www.grupoproductivo.com.ar/img/goo.jpg'
                          },
                          prescriptionData: JSON.parse(datajson[5]),
                          advices: advicesFound,
                          signatureImage: doctorData.userSignatureURL
                          // signatureImage:'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg'
                        },
                        path: `./prescription/${data.patientId}/${data._id}_${visitArraySizeFound[0].size-1}.pdf`
                      };

                      console.log("document..testwith console...", document);

                      pdf
                        .create(document, options)
                        .then(result => {
                          console.log("test response", result);
                            patientshistory
                              .findOneAndUpdate(
                                { _id: data._id },
                                {
                                  $set: {
                                    "visit.$[element].prescriptionURL": `${baseURL}prescription/${data.patientId}/${data._id}_${visitArraySizeFound[0].size-1}.pdf`
                                  },

                                },
                                {
                                  arrayFilters: [{
                                    'element.updatedOn': visitArraySizeFound[0].data[visitArraySizeFound[0].data.length-1].updatedOn
                                  }]
                                }

                              )

                              // { <query conditions> },
                              // { <update operator>: { "<array>.$[<identifier>]" : value } },
                              // { arrayFilters: [ { <identifier>: <condition> } ] }

                              .then(prescriptionPDF => {
                                console.log("priscription PDF updated...");
                                res.json({ msg: "Success", data: data });
                              });
                          });
                        })
                        .catch(error => {
                          console.error("error response", error);
                        });
                    });
                });
            });
        })
        .catch(err => {
          res.status(500).json({
            msg: err.message
          });
        });
    }
  }
);

router.put("/updatePatientVisit", async (req, res) => {
  let patientRecordId = req.body.lastInsertId;
  let treatmentList;
  if (typeof req.body.treatmentList == "string") {
    treatmentList = JSON.parse(req.body.treatmentList);
  } else {
    treatmentList = req.body.treatmentList;
  }
  console.log(
    typeof req.body.treatmentList,
    req.body.treatmentList,
    "received Values from further treatment "
  );
  await patientshistory
    .updateOne(
      { _id: patientRecordId },
      {
        $set: {
          "visit.0.furtherTreatment": treatmentList
        }
      }
    )
    .then(updated => {
      console.log("Details Updated", updated);
      res.status(200).send({
        msg: "Success"
      });
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });
});

router.put("/changeStatus", async (req, res) => {
  let patientRecordId = req.body.autoId;
  console.log(patientRecordId);
  await patientshistory
    .updateOne(
      { _id: patientRecordId },
      {
        $set: {
          status: "Recovered",
          updatedOn: new Date()
        }
      }
    )
    .then(updated => {
      console.log("Details Updated", updated);
      res.status(200).send({
        msg: "Success"
      });
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });
});

router.get("/checkPatientId", async (req, res) => {
  console.log("req.query...for get patient details...", req.query);
  // console.log('patientID', req.query.patientId);

  // .aggregate([
  //   { $match : { patientId : req.query.patientId } },
  //   { $project: {
  //   age: {
  //   $divide: [{$subtract: [ new Date(), "$dateofbirth" ] },
  //   (365.2425 * 246060*1000)]
  //   },firstName: 1,lastName: 1, dateofbirth:1, gender: 1, email: 1,street:1, city:1, state:1,zip:1,phone:1,patientId:1 } }
  //   ])
  await patients
    .find({ patientId: req.query.patientId })
    .then(patientDetails => {
      console.log(typeof patientDetails);

      const newPatientLogs = new patientLogs({
        doctorId: req.query.doctorId,
        patientId: req.query.patientId,
        viewedAt: new Date()
      });
      newPatientLogs.save().then(response => {
        console.log("new Patient logs response..", response);
        res.json({
          patientDetails: patientDetails
        });
      });
    })
    .catch(err => {
      res.json({
        msg: err.message
      });
    });
});

router.post("/patientRegisteration", async (req, res) => {
  let datajson = req.body.patientData;
  if (typeof datajson == "string") datajson = JSON.parse(datajson);
  let tempId = "";

  console.log("DataJson", datajson);

  // await patients.countDocuments().then(count => {
  //   patientcount = count + 200;
  // });

  // sample Patient ID = KEYY112AB2

  let dateOfBirth = "";
  let yearOfBirth = "";
  let patientImage = "";
  if (datajson.dateofbirth.indexOf("T") > -1) {
    dateOfBirth = datajson.dateofbirth.split("T")[0];
    yearOfBirth = dateOfBirth.substring(2, 4);
    console.log("yearOfBirth", yearOfBirth);
    // this.dateOfBirth = this.dateOfBirth;
  } else {
    var date = new Date(datajson.dateofbirth);
    var dateTime = date.toISOString();
    dateOfBirth = dateTime.split("T")[0];
    yearOfBirth = dateOfBirth.substring(2, 4);
    console.log("yearOfBirth", yearOfBirth);
    // this.dateOfBirth = dateTime;
  }

  let patCountry = datajson.country;
  let countryCode = "";
  await country.find({ country: patCountry }).then(country => {
    console.log("country", country);
    countryCode = country[0].code;
  });
  let genderRepresentation = "";
  if (datajson.gender === "Male") {
    genderRepresentation = "1";
  } else if (datajson.gender === "Female") {
    genderRepresentation = "2";
  } else {
    genderRepresentation = "3";
  }

  console.log("genderRepresentation", genderRepresentation);

  console.log("countryCode", countryCode);
  let genRandomNumb = "";
  let CPATID = "";
  let patientDetailsSaved = false;
  do {
    genRandomNumb = getRandomInt()
      .toString(36)
      .toUpperCase();
    CPATID = countryCode
      .concat(yearOfBirth)
      .concat(genderRepresentation)
      .concat(genRandomNumb.padStart(5, "0"));
    await patients.find({ patientId: CPATID }).then(count => {
      if (count.length > 0) {
        patientDetailsSaved = false;
      } else {
        patientDetailsSaved = true;
      }
    });
  } while (!patientDetailsSaved);

  console.log(req.body);
  // Age Calculation Goes Here

  // var date1 = new Date(this.dateOfBirth);
  // var date2 = new Date();

  // console.log(date1, "date1date1date1");

  // var timeDiff = Math.abs(date2.getTime() - date1.getTime());
  // var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // console.log(Math.floor(diffDays/365.2425), "date2");

  // console.log('datajson.dateofbirth', dateTime);

  //patientImageURL

  if (datajson.gender === "Male") {
    patientImage = "http://52.14.30.0:3000/images/defaultPatient/Male.png";
  } else {
    patientImage = "http://52.14.30.0:3000/images/defaultPatient/Female.png";
  }

  const patientsregistration = new patients({
    patientId: CPATID,
    firstName: datajson.firstName,
    lastName: datajson.lastName,
    dateofbirth: dateOfBirth,
    gender: datajson.gender,
    bloodgroup: datajson.bloodgroup,
    weight: datajson.weight,
    street: datajson.street,
    city: datajson.city,
    state: datajson.state,
    country: datajson.country,
    zip: datajson.zip,
    phone: datajson.phone,
    email: datajson.email,
    patientImageURL: patientImage
  });
  console.log("PatientRegistration", patientsregistration);
  try {
    console.log("enter");
    patientsregistration
      .save()
      .then(data => {
        console.log("data of patients...", data);

        const newPatientLogs = new patientLogs({
          doctorId: req.body.doctorId,
          patientId: data.patientId,
          registeredAt: new Date()
        });

        if (data.email) {
          toPatient[0].name = data.firstName + " " + data.lastName;
          toPatient[0].email = data.email;
          toPatient[0].patientId = data.patientId;

          var smtpTrans = nodemailer.createTransport({
            host: "mail.ruahtech.com",
            port: 465,
            secure: true,
            auth: {
              user: "clipssupport@ruahtech.com",
              pass: "$p5Zg-s)1CuS"
            }
          });

          console.log("step 3");
          loadTemplate("registration", toPatient).then(results => {
            console.log(JSON.stringify(results, null, 4));

            return Promise.all(
              results.map(results => {
                smtpTrans.sendMail(
                  {
                    from: '"CLIPS SUPPORT" <clipssupport@ruahtech.com>',
                    to: data.email,
                    subject: results.email.subject,
                    html: results.email.html,
                    text: results.email.text
                  },
                  function (err) {
                    console.log("sent");
                  }
                );
              })
            );
          });
        }

        newPatientLogs.save().then(response => {
          console.log("response..", response);
          res.status(200).send({
            msg: "Success",
            patientId: data.patientId
          });
        });
      })
      .catch(err => {
        res.status(500).json({
          msg: err.message
        });
      });
  } catch (e) {
    console.log("exception", e);
  }

  //   patientsregistration.updateOne(
  //     { _id: ObjectID(tempId) },
  //     { $set:
  //        {
  //         patientId: 'TEST PATIENT UPDATED',
  //        }
  //     }
  //  ).then(updated => {
  //    console.log('detais updated', updated);
  //    res.json(updated);
  //  });

  /// Registeration Email

  // let transporter = nodeMailer.createTransport({
  //     host: 'email-smtp.us-east-1.amazonaws.com',
  //     port: 465,
  //     secure: true,  //true for 465 port, false for other ports
  //     auth: {
  //         user: 'AKIA53SGDVJS5FKZM5DC',
  //         pass: 'BLBbnTOK23qOhkdc7afx/m61laNIL3W9swOJ0pxEUcxK'
  //     }
  // });

  // // setup email data with unicode symbols
  // let mailOptions = {
  //     from: '"Your Name" <noreply@gmail.com>', // sender address
  //     to: 'serfoji.prsnll@gmail.com', // list of receivers
  //     subject: 'Hello ✔', // Subject line
  //     text: 'Hello world?', // plain text body
  //     html: '<b>Hello world?</b>' // html body
  // };

  // transporter.sendMail(mailOptions, (error, info) => {
  //     if (error) {
  //         console.log(error);
  //         res.status(400).send({success: false})
  //     } else {
  //         res.status(200).send({success: true});
  //     }
  // });

  // aws.config.update({
  //     accessKeyId: 'AKIAIWTZD73P6O7JWRLA',
  //     secretAccessKey: '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',
  //     region: 'us-east-1'
  //   });

  // load AWS SES
  // var ses = new aws.SES({apiVersion: 'latest'});

  // this sends the email
  // ses.sendEmail({
  //       Source: "serfoji.prsnll@gmail.com",
  //       Destination: {
  //         ToAddresses: ["raja@gmail.com"]
  //       },
  //       Message: {
  //         Subject: {
  //           Data: "Testing Email"
  //         },
  //         Body: {
  //           Html: {
  //             Data: "Testing Entry From Admin !!!!!"
  //           }
  //         }
  //       }
  //     }
  //     , function (err, data) {
  //       if (err) {
  //         console.log(err, "Email Error");
  //       } else {
  //         console.log('Email sent:');
  //         console.log(data);
  //       }
  //     });
});

router.put("/patientDetailsUpdate", async (req, res) => {
  console.log(req.body.autoId, "req.body.autoId");
  let patientDetails = JSON.parse(req.body.autoId);
  let dateOfBirth = "";

  if (patientDetails.dateofbirth.indexOf(",") > -1) {
    dateOfBirth = patientDetails.dateofbirth.split(",")[0];
  } else {
    dateOfBirth = patientDetails.dateofbirth;
  }

  console.log(dateOfBirth, "this.dateOfBirth");
  patients
    .updateOne(
      { _id: patientDetails._id },
      {
        $set: {
          firstName: patientDetails.firstName,
          lastName: patientDetails.lastName,
          dateofbirth: dateOfBirth,
          gender: patientDetails.gender,
          bloodgroup: patientDetails.bloodgroup,
          weight: patientDetails.weight,
          street: patientDetails.street,
          city: patientDetails.city,
          state: patientDetails.state,
          country: patientDetails.country,
          zip: patientDetails.zip,
          phone: patientDetails.phone,
          email: patientDetails.email
        }
      }
    )
    .then(updated => {
      console.log("Details Updated", updated);
      if (updated.nModified === 1) {
        const newPatientLogs = new patientLogs({
          doctorId: req.body.doctorId,
          patientId: req.body.patientId,
          editedAt: new Date()
        });
        newPatientLogs.save().then(response => {
          console.log("response...", response);
          res.status(200).send({
            msg: "Success"
            // patientDetails: getPatientDetail
          });
        });
        // let getPatientDetail = getPatientDetails(patientDetails._id);
      } else {
        res.json({
          msg: "Record Not Updated"
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });
});

router.get("/getCountry", async (req, res) => {
  await country
    .find()
    .then(country => {
      let countryList = [];
      country.forEach(item => {
        // console.log('Name', item);
        countryList.push(item.country);
      });
      console.log("country", countryList);
      res.status(200).send({
        msg: "Success",
        countries: countryList
      });
    })
    .catch(err => {
      res.status(500).json({
        msg: err.message
      });
    });
});

module.exports = router;


// db.getCollection("patientshistories").updateOne(
//   { _id: ObjectId("5df2053268ce002efc1907d6") },
//   {
//     $set: {
//       "visit.$[element].remarks": 'test1234'
//     }

//   },
//   {arrayFilters:[{element:0}]}

// )



// db.getCollection("patientshistories").updateOne(
//   { _id: ObjectId("5df2053268ce002efc1907d6") },
//   {
//     $set: {
//       "visit.$[element].remarks": 'test1234'
//     }

//   },
//   { arrayFilters: [{ element: 0 }], upsert: true },


// )















// { 
//   "_id" : ObjectId("5df2053268ce002efc1907d6"), 
//   "status" : "Case Transfered", 
//   "visit" : [
//       {
//           "complaintSet" : [
//               {
//                   "complaint" : "Fear", 
//                   "severity" : "Severe"
//               }
//           ], 
//           "generalexamSet" : [
//               "Sweating"
//           ], 
//           "systemicexamSet" : [
//               "Tachycardia"
//           ], 
//           "clinicalInvestigationSet" : [

//           ], 
//           "reportFiles" : [
//               "http://192.168.0.112:3000/reportfiles/ZAL1T5Q39Y/zal1t5q39y_a-1576142129931.jpg", 
//               "http://192.168.0.112:3000/reportfiles/ZAL1T5Q39Y/zal1t5q39y_b-1576142129949.jpg"
//           ], 
//           "disease" : [
//               "Panic Attack"
//           ], 
//           "medicine" : [
//               {
//                   "index" : NumberInt(0), 
//                   "userRef" : "5d7604c9eba0672990bbfb11", 
//                   "medicineName" : "Clomipramine", 
//                   "strength" : "10mg", 
//                   "frequency" : "12 hourly", 
//                   "duration" : "14 days", 
//                   "route" : "PO", 
//                   "form" : "Tablet", 
//                   "dose" : "1", 
//                   "limits" : "undefined"
//               }
//           ], 
//           "doctor" : "ZAL1T5Q39Y - Ezekiel", 
//           "updatedOn" : ISODate("2019-12-12T09:15:29.976+0000"), 
//           "remarks" : "test123456789"
//       },
//       {
//         "complaintSet" : [
//             {
//                 "complaint" : "Fear", 
//                 "severity" : "Severe"
//             }
//         ], 
//         "generalexamSet" : [
//             "Sweating"
//         ], 
//         "systemicexamSet" : [
//             "Tachycardia"
//         ], 
//         "clinicalInvestigationSet" : [

//         ], 
//         "reportFiles" : [
//             "http://192.168.0.112:3000/reportfiles/ZAL1T5Q39Y/zal1t5q39y_a-1576142129931.jpg", 
//             "http://192.168.0.112:3000/reportfiles/ZAL1T5Q39Y/zal1t5q39y_b-1576142129949.jpg"
//         ], 
//         "disease" : [
//             "Panic Attack"
//         ], 
//         "medicine" : [
//             {
//                 "index" : NumberInt(0), 
//                 "userRef" : "5d7604c9eba0672990bbfb11", 
//                 "medicineName" : "Clomipramine", 
//                 "strength" : "10mg", 
//                 "frequency" : "12 hourly", 
//                 "duration" : "14 days", 
//                 "route" : "PO", 
//                 "form" : "Tablet", 
//                 "dose" : "1", 
//                 "limits" : "undefined"
//             }
//         ], 
//         "doctor" : "ZAL1T5Q39Y - Ezekiel", 
//         "updatedOn" : ISODate("2019-12-12T09:15:29.976+0000"), 
//         "remarks" : "test123456789"
//     }
//   ], 
//   "patientId" : "IN901RMUOW", 
//   "patientName" : "venkatesh GR", 
//   "date" : ISODate("2019-12-12T09:15:30.026+0000"), 
//   "__v" : NumberInt(0)
// }



