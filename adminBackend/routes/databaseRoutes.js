const express = require("express");
const router = express.Router();
const moduleFiles = require("../../backend/models/model");
const complaints = moduleFiles.complaints;
const generalexams = moduleFiles.generalexams;
const systemexams = moduleFiles.systemexams;
const medicines = moduleFiles.medicines;
const caseTransfer = moduleFiles.casetransfers;
const patients = moduleFiles.patients;
const users = moduleFiles.users;
const patientHistories = moduleFiles.patientshistory;

router.get("/disease", async (req, res) => {
  generalexamsSet = [];
  diseasesSet = [];
  sampleParse = [];
  console.log(req.query);
  sample = req.query.complaint;
  let sampleSplit = JSON.parse("[" + sample + "]");
  // sampleSplit = '['+sample+']';
  // sampleSplit = sample.split('},');
  // for (let i = 0; i < sampleSplit.length - 1; i++) {
  //   sampleSplit[i] = sampleSplit[i] + '}' ;
  // }

  console.log(sampleSplit);
  console.log(sampleSplit.length);

  for (let i = 0; i < sampleSplit.length; i++) {
    // sampleParse[i] = JSON.parse(sampleSplit[i]);

    await complaints
      .aggregate([
        {
          $facet: {
            pageInfo: [
              { $match: { complaints: sampleSplit[i].final_complaint } },
              {
                $match: {
                  $or: [
                    {
                      aggfactor: {
                        $exists: true,
                        $in: sampleSplit[i].final_aggfactor
                      }
                    },
                    {
                      duration: {
                        $exists: true,
                        $in: sampleSplit[i].final_duration
                      }
                    },
                    {
                      extent: {
                        $exists: true,
                        $in: sampleSplit[i].final_extent
                      }
                    },
                    {
                      frequency: {
                        $exists: true,
                        $in: sampleSplit[i].final_frequency
                      }
                    },
                    {
                      history: {
                        $exists: true,
                        $in: sampleSplit[i].final_history
                      }
                    },
                    {
                      nature: {
                        $exists: true,
                        $in: sampleSplit[i].final_nature
                      }
                    },
                    {
                      onset: { $exists: true, $in: sampleSplit[i].final_onset }
                    },
                    {
                      relfactor: {
                        $exists: true,
                        $in: sampleSplit[i].final_relfactor
                      }
                    },
                    {
                      severity: {
                        $exists: true,
                        $in: sampleSplit[i].final_severity
                      }
                    },
                    { site: { $exists: true, $in: sampleSplit[i].final_site } }
                  ]
                }
              },
              {
                $group: {
                  _id: null,
                  uniqueValuesDiseases: { $addToSet: "$disease" }
                }
              },

              {
                $project: {
                  diseases: "$uniqueValuesDiseases",
                  diiseaseCount: { $size: "$uniqueValuesDiseases" }
                }
              }
            ]
          }
        }
      ])
      .then(diseases => {
        console.log(
          "Disease List for Complaint",
          i,
          diseases[0].pageInfo[0].diseases
        );
        diseasesSet = diseasesSet.concat(diseases[0].pageInfo[0].diseases);
      })
      .catch(err => {
        console.log(err.message);
      });
  }
  let dup = [...new Set(diseasesSet)];
  console.log("Consolidated Diseases", dup);
  // sample = dup;
  // sampleSplit = dup.split(',');
  // console.log('query split', sampleSplit.length);
  await generalexams
    .aggregate([
      {
        $facet: {
          pageInfo: [
            { $match: { disease: { $in: dup } } },
            {
              $group: {
                _id: null,
                uniqueValuesGeneralExams: { $addToSet: "$generalexam" }
              }
            },
            {
              $project: {
                generalexams: "$uniqueValuesGeneralExams",
                generalexamcount: { $size: "$uniqueValuesGeneralExams" }
              }
            }
          ]
        }
      }
    ])
    .then(generalexams => {
      // res.json(generalexams);
      generalexamsSet = generalexams[0].pageInfo[0].generalexams;
    })
    .catch(err => {
      // res.status(500).send({
      //     msg: err.message
      // });
      console.log(err.message);
    });
  console.log("General Exam List", generalexamsSet);
  return res.json({
    generalExamsSet: generalexamsSet,
    diseaseSet: dup
  });
});

router.get("/getGeneralExam", async (req, res) => {
  console.log(req.query.DataId.split(",").length);
  var arrayObject = req.query.DataId.split(",");

  var generalexamDiseaseSet = [];
  // arrayObject
  // var obj_ids = arrayObject.map(function(id) { console.log(id);  return ObjectId(id);});

  // var ids = ['512d5793abb900bf3e20d012', '512d5793abb900bf3e20d011'];
  var obj_ids = arrayObject.map(function(id) {
    return id;
  });

  console.log(obj_ids);

  await generalexams
    .aggregate([
      { $match: { disease: { $exists: true, $in: obj_ids } } },
      {
        $group: {
          _id: null,
          uniqueValuesDiseases: { $addToSet: "$disease" }
        }
      },
      { $project: { diseases: "$uniqueValuesDiseases", _id: 0 } }
    ])
    .then(generalexamDisease => {
      // console.log("generalExamDisease",generalexamDisease[0].diseases.length);
      // return res.json(generalexamDisease[0].diseases.length);
      this.generalexamDiseaseSet = generalexamDisease[0].diseases;

      // console.log("generalexamDiseaseSet",this.generalexamDiseaseSet.length);
    })
    .catch(err => {
      console.log("FailuregeneralExamDisease", err.message);
    });

  console.log("generalexamDiseaseSet", this.generalexamDiseaseSet);
  if (this.generalexamDiseaseSet.length > 0) {
    await systemexams
      .aggregate([
        { $addFields: { userRef: { $toString: "$_id" } } },
        {
          $match: {
            disease: { $exists: true, $in: this.generalexamDiseaseSet }
          }
        },
        {
          $project: {
            systemExamList: { $concat: ["$systemicexam", "#", "$userRef"] }
          }
        },
        { $project: { _id: 0 } }
      ])
      .then(systemexamRes => {
        console.log("ResponseOfSystemExam", systemexamRes);
        return res.json(systemexamRes);
      })
      .catch(err => {
        console.log("FailureOfSystemExam", err.message);
      });
  } else {
  }
});

router.get("/getAilments", async (req, res) => {
  var arrayObject = req.query.DataId.split(",");

  var diseaseSet = [];

  var obj_ids = arrayObject.map(function(id) {
    return ObjectId(id);
  });

  console.log(obj_ids);
  await systemexams
    .aggregate([
      { $match: { _id: { $exists: true, $in: obj_ids } } },
      {
        $group: {
          _id: null,
          uniqueValuesDiseases: { $addToSet: "$disease" }
        }
      },
      { $project: { diseases: "$uniqueValuesDiseases", _id: 0 } }
    ])
    .then(diseaseList => {
      // console.log("generalExamDisease",generalexamDisease[0].diseases.length);
      // return res.json(generalexamDisease[0].diseases.length);
      // this.generalexamDiseaseSet = diseaseList[0].diseases;

      console.log("diseaseList", this.diseaseList);
    })
    .catch(err => {
      console.log("FailuregeneralExamDisease", err.message);
    });
});

router.get("/getGenEx", async (req, res) => {
  // sampl = [];
  systematicDiseasesSet = [];
  console.log(req.query);
  sample = req.query.dis;
  hample = req.query.genex;
  sampleSplit = sample.split(",");
  hampleSplit = hample.split(",");
  console.log("query split", sampleSplit.length);
  console.log("query split", hampleSplit.length);
  await generalexams
    .aggregate([
      {
        $facet: {
          pageInfo: [
            { $match: { disease: { $exists: true, $in: sampleSplit } } },
            { $match: { generalexam: { $exists: true, $in: hampleSplit } } },
            {
              $group: {
                _id: null,
                uniqueValuesDiseases: { $addToSet: "$disease" }
              }
            },

            {
              $project: {
                diseases: "$uniqueValuesDiseases",
                generalexamcount: { $size: "$uniqueValuesDiseases" }
              }
            }
          ]
        }
      }
    ])
    .then(diseases => {
      console.log(
        "Disease List after Considering General Exams",
        diseases[0].pageInfo[0].diseases
      );
      systematicDiseasesSet = diseases[0].pageInfo[0].diseases;
      // res.json(diseases);
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });
  // let dup = [...new Set(systematicDiseasesSet)];
  await systemexams
    .aggregate([
      {
        $facet: {
          pageInfo: [
            { $match: { disease: { $in: systematicDiseasesSet } } },
            {
              $group: {
                _id: null,
                uniqueValuesSystemicExam: { $addToSet: "$systemicexam" }
              }
            },
            {
              $project: {
                systemicexams: "$uniqueValuesSystemicExam",
                systemicexamscount: { $size: "$uniqueValuesSystemicExam" }
              }
            }
          ]
        }
      }
    ])
    .then(systemicexams => {
      // res.json(generalexams);
      systemicexamsSet = systemicexams[0].pageInfo[0].systemicexams;
    })
    .catch(err => {
      // res.status(500).send({
      //     msg: err.message
      // });
      console.log(err.message);
    });
  console.log("Systemic Exam List", systemicexamsSet);
  return res.json({
    systemicExamsSet: systemicexamsSet,
    systemicDiseaseSet: systematicDiseasesSet
  });
});

router.get("/getSysEx", async (req, res) => {
  finalDiseasesSet = [];
  console.log(req.query);
  sample = req.query.dis;
  hample = req.query.sysex;
  sampleSplit = sample.split(",");
  hampleSplit = hample.split(",");
  console.log("query split", sampleSplit.length);
  console.log("query split", hampleSplit.length);
  await systemexams
    .aggregate([
      {
        $facet: {
          pageInfo: [
            { $match: { disease: { $exists: true, $in: sampleSplit } } },
            { $match: { systemicexam: { $exists: true, $in: hampleSplit } } },
            {
              $group: {
                _id: null,
                uniqueValuesDiseases: { $addToSet: "$disease" }
              }
            },

            {
              $project: {
                diseases: "$uniqueValuesDiseases",
                diseasescount: { $size: "$uniqueValuesDiseases" }
              }
            }
          ]
        }
      }
    ])
    .then(diseases => {
      console.log(
        "Disease List after Considering Systemic Exams",
        diseases[0].pageInfo[0].diseases
      );
      finalDiseasesSet = diseases[0].pageInfo[0].diseases;
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });
  // await systemexams.aggregate([
  //   {
  //     $facet: {
  //       pageInfo: [
  //         { $match : { disease : { $in : systematicDiseasesSet } } },
  //         { $group:
  //           {
  //             _id: null,
  //             uniqueValuesSystemicExam: {$addToSet: "$systemicexam"},
  //           }
  //         },
  //         {
  //           $project: {
  //             systemicexams:"$uniqueValuesSystemicExam",
  //             systemicexamscount: {$size: "$uniqueValuesSystemicExam"}
  //           }
  //         },
  //       ],
  //     },
  //   },
  // ])
  // .then(systemicexams => {
  //   systemicexamsSet = systemicexams[0].pageInfo[0].systemicexams;
  // }).catch(err => {
  //   console.log(err.message);
  // });
  // console.log('Systemic Exam List', systemicexamsSet);
  return res.json({
    // systemicExamsSet: systemicexamsSet,
    finalDiseasesSet: finalDiseasesSet
    // systemicDiseaseSet: systematicDiseasesSet
  });
});

router.get("/disease", async (req, res) => {
  generalexamsSet = [];
  diseasesSet = [];
  sampleParse = [];
  console.log(req.query);
  sample = req.query.complaint;
  let sampleSplit = JSON.parse("[" + sample + "]");
  // sampleSplit = '['+sample+']';
  // sampleSplit = sample.split('},');
  // for (let i = 0; i < sampleSplit.length - 1; i++) {
  //   sampleSplit[i] = sampleSplit[i] + '}' ;
  // }

  console.log(sampleSplit);
  console.log(sampleSplit.length);

  for (let i = 0; i < sampleSplit.length; i++) {
    // sampleParse[i] = JSON.parse(sampleSplit[i]);

    await complaints
      .aggregate([
        {
          $facet: {
            pageInfo: [
              { $match: { complaints: sampleSplit[i].final_complaint } },
              {
                $match: {
                  $or: [
                    {
                      aggfactor: {
                        $exists: true,
                        $in: sampleSplit[i].final_aggfactor
                      }
                    },
                    {
                      duration: {
                        $exists: true,
                        $in: sampleSplit[i].final_duration
                      }
                    },
                    {
                      extent: {
                        $exists: true,
                        $in: sampleSplit[i].final_extent
                      }
                    },
                    {
                      frequency: {
                        $exists: true,
                        $in: sampleSplit[i].final_frequency
                      }
                    },
                    {
                      history: {
                        $exists: true,
                        $in: sampleSplit[i].final_history
                      }
                    },
                    {
                      nature: {
                        $exists: true,
                        $in: sampleSplit[i].final_nature
                      }
                    },
                    {
                      onset: { $exists: true, $in: sampleSplit[i].final_onset }
                    },
                    {
                      relfactor: {
                        $exists: true,
                        $in: sampleSplit[i].final_relfactor
                      }
                    },
                    {
                      severity: {
                        $exists: true,
                        $in: sampleSplit[i].final_severity
                      }
                    },
                    { site: { $exists: true, $in: sampleSplit[i].final_site } }
                  ]
                }
              },
              {
                $group: {
                  _id: null,
                  uniqueValuesDiseases: { $addToSet: "$disease" }
                }
              },

              {
                $project: {
                  diseases: "$uniqueValuesDiseases",
                  diiseaseCount: { $size: "$uniqueValuesDiseases" }
                }
              }
            ]
          }
        }
      ])
      .then(diseases => {
        console.log(
          "Disease List for Complaint",
          i,
          diseases[0].pageInfo[0].diseases
        );
        diseasesSet = diseasesSet.concat(diseases[0].pageInfo[0].diseases);
      })
      .catch(err => {
        console.log(err.message);
      });
  }
  let dup = [...new Set(diseasesSet)];
  console.log("Consolidated Diseases", dup);
  // sample = dup;
  // sampleSplit = dup.split(',');
  // console.log('query split', sampleSplit.length);
  await generalexams
    .aggregate([
      {
        $facet: {
          pageInfo: [
            { $match: { disease: { $in: dup } } },
            {
              $group: {
                _id: null,
                uniqueValuesGeneralExams: { $addToSet: "$generalexam" }
              }
            },
            {
              $project: {
                generalexams: "$uniqueValuesGeneralExams",
                generalexamcount: { $size: "$uniqueValuesGeneralExams" }
              }
            }
          ]
        }
      }
    ])
    .then(generalexams => {
      // res.json(generalexams);
      generalexamsSet = generalexams[0].pageInfo[0].generalexams;
    })
    .catch(err => {
      // res.status(500).send({
      //     msg: err.message
      // });
      console.log(err.message);
    });
  console.log("General Exam List", generalexamsSet);
  return res.json({
    generalExamsSet: generalexamsSet,
    diseaseSet: dup
  });
});

router.get("/getMedicine", async (req, res) => {
  medicineSet = [];
  console.log("Disease List", req.query);
  sample = req.query.dis;
  sampleSplit = sample.split(",");

  await medicines
    .aggregate([
      { $addFields: { userRef: { $toString: "$_id" } } },
      { $match: { disease: { $exists: true, $in: sampleSplit } } },
      // { $group:
      //   {
      //     _id: null,
      //     uniqueValuesMedicines: {$addToSet: "$userRef"},
      //   }
      // },
      {
        $project: {
          medicineList: {
            $concat: [
              "$userRef",
              "#",
              "$medicineName",
              "#",
              "$strength",
              "#",
              "$frequency",
              "#",
              "$duration",
              "#",
              "$route",
              "#",
              "$form",
              "#",
              "$dose"
            ]
          }
        }
      },
      { $project: { _id: 0 } }
    ])
    .then(medicineList => {
      console.log("Medicine List after Considering", medicineList);
      // medicineSet = medicineList[0].pageInfo[0].medicineList;
      res.json({
        medicineSet: medicineList
      });
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });
});

router.get("/getAllPatientHistory", async function(req, res) {
  // var checkToken = verifyToken(req);
  page_from = 0;
  pageSize = 5;
  col_name = "_id";
  col_value = 1; // 1 - Asc, (-1) for Dec

  try {
    await caseTransfer
      .aggregate([
        {
          $facet: {
            data: [
              { $match: { state: "Pending" } },
              { $skip: page_from },
              { $limit: pageSize },
              { $sort: { [col_name]: col_value } }
            ]
          }
        }
      ])
      .then(historyDetails => {
        console.log("historyDetails", historyDetails);
        res.json({ historyDetails });
      })
      .catch(error => {
        console.log("There was an error : %s", error);
      });
  } catch (e) {
    console.log("There was an errorss : %s", e);
    res.json({ error: "There was an error" });
  }
});

router.get("/getDashboardDetails", async function(req, res) {
  let totalPractitionerCount;
  let totalPatientCount;
  let PatientUnderTreatmentCount;
  let PatientRecoveredCount;
  let PatientCaseTransferedCount;
  users
    .aggregate([
      { $match: { userType: "practitioner" } },
      { $count: "practitionerCount" }
    ])
    .then(practitionerCount => {
      console.log("practitionerCount", practitionerCount);
      patients
        .countDocuments({}, function(err, count) {
          console.log("Number of patients:", count);
        })
        .then(patientCount => {
          console.log("patientCount", patientCount);
          patientHistories
            .aggregate([
              { $match: { status: "Under Treatment" } },
              { $count: "PatientUnderTreatmentCount" }
            ])
            .then(UnderTreatmentCount => {
              console.log(
                "PatientUnderTreatmentCount",
                UnderTreatmentCount[0].PatientUnderTreatmentCount
              );
              patientHistories
                .aggregate([
                  { $match: { status: "Recovered" } },
                  { $count: "PatientRecovered" }
                ])
                .then(RecoveredCount => {
                  console.log(
                    "PatientRecovered",
                    RecoveredCount[0].PatientRecovered
                  );
                  patientHistories
                    .aggregate([
                      { $match: { status: "Case Transfered" } },
                      { $count: "PatientCaseTransfered" }
                    ])
                    .then(CaseTransferedCount => {
                      totalPatientCount = patientCount;
                      totalPractitionerCount =
                        practitionerCount[0].practitionerCount;
                      PatientUnderTreatmentCount =
                        UnderTreatmentCount[0].PatientUnderTreatmentCount;
                      PatientRecoveredCount =
                        RecoveredCount[0].PatientRecovered;
                      PatientCaseTransferedCount =
                        CaseTransferedCount[0].PatientCaseTransfered;
                      console.log(
                        "totalPractitionerCount :",
                        totalPractitionerCount,
                        " totalPatientCount :",
                        totalPatientCount,
                        " PatientUnderTreatmentCount : ",
                        PatientUnderTreatmentCount,
                        " PatientRecoveredCount :",
                        PatientRecoveredCount,
                        " PatientCaseTransferedCount :",
                        PatientCaseTransferedCount
                      );
                      res.json({
                        totalPractitionerCount: totalPractitionerCount,
                        totalPatientCount: totalPatientCount,
                        PatientUnderTreatmentCount: PatientUnderTreatmentCount,
                        PatientRecoveredCount: PatientRecoveredCount,
                        PatientCaseTransferedCount: PatientCaseTransferedCount,
                        msg: "Success"
                      });
                    });
                  // .catch(error => {
                  //     console.log('patients.UnderTreatment.error', error);
                  //     res.json({ msg: 'Unable to count number of Patient' });
                  // });
                });
              // .catch(error => {
              //     console.log('patients.UnderTreatment.error', error);
              //     res.json({ msg: 'Unable to count number of Patient' });
              // });
            });
          // .catch(error => {
          //     console.log('patients.UnderTreatment.error', error);
          //     res.json({ msg: 'Unable to count number of Patient' });
          // });
        });
      // .catch(error => {
      //     console.log('patients.countDocument.error', error);
      //     res.json({ msg: 'Unable to count number of Patient Under Treatment' });
      // });
    })
    .catch(error => {
      console.log("users.aggregate.error", error);
      // res.json({ msg: 'Unable to count number of Clinical Officers' });
      res.json({ msg: "Count Error in getting Dashboard Details" });
    });
});

router.get("/getUserRecords", async function(req, res) {
  // let userRecords = [];
  console.log("getUserRecords", req.query);
  console.log("date..test", parseInt(req.query.month));
  console.log("date..test", parseInt(req.query.year));
  let currentDate = new Date();
  let latestDate = new Date();
  let fromDate = "";
  let toDate = "";

  currentDate.setMonth(parseInt(req.query.month));
  currentDate.setFullYear(parseInt(req.query.year));
  currentDate.setDate(01);
  currentDate.setMinutes(0);
  currentDate.setHours(0);
  currentDate.setMinutes(0);
  currentDate.setMilliseconds(0);
  fromDate = currentDate.toISOString();

  latestDate.setMonth(parseInt(req.query.month));
  latestDate.setFullYear(parseInt(req.query.year));
  latestDate.setDate(31);
  latestDate.setMinutes(0);
  latestDate.setHours(0);
  latestDate.setMinutes(0);
  latestDate.setMilliseconds(0);
  toDate = latestDate.toISOString();

  console.log("today's date..", new Date());
  console.log("date..test..after", parseInt(req.query.month));
  console.log("date..test..after", parseInt(req.query.year));
  console.log("fromDate...", typeof fromDate, fromDate);
  console.log("toDate...", typeof toDate, toDate);

  // $or: [
  //   { patientId: new RegExp(req.query.searchString, 'mi') },
  //   { phone: new RegExp(req.query.searchString, 'mi') },
  //   // { firstName: new RegExp(req.query.searchString, 'mi') },
  // ]
  // { name: new RegExp("^" + req.query.coName, "mi") } 
  users
    .aggregate([
      {
        $facet: {
          data: [
            { $match: { userType: "practitioner" } },
            { $match: {$or: [
                { name: new RegExp(req.query.coName, 'mi') },
                { authenticationKey: new RegExp(req.query.coName, 'mi') },
                {primaryMobile:new RegExp(req.query.coName, 'mi')}
                // { firstName: new RegExp(req.query.searchString, 'mi') },
              ] }},
            { $skip: +req.query.pageFrom },
            { $limit: +req.query.pageSize },
            {
              $group: {
                _id: null,
                clinicalOfficer: {
                  $addToSet: { $concat: ["$authenticationKey", " - ", "$name"] }
                }
              }
            },
            {
              $project: { officersList: "$clinicalOfficer", count: "$count" }
            }
          ]
        }
      }
    ])
    .then(officersList => {
      var totalPractitionerCount;
      users
        .aggregate([
          { $match: { userType: "practitioner" } },
          { $count: "practitionerCount" }
        ])
        .then(practitionerCount => {
          totalPractitionerCount = practitionerCount[0].practitionerCount;
          console.log(
            "practitionerCount",
            practitionerCount[0].practitionerCount
          );
        });
      console.log("usersList", officersList[0].data[0]);

      var clinicalOfficerVisitCount = ele => {
        return new Promise((resolve, reject) => {
          patientHistories
            .aggregate([
              { $match: { visit: { $elemMatch: { doctor: ele } } } },
              {
                $match: {
                  visit: {
                    $elemMatch: { updatedOn: { $gte: new Date(fromDate) } }
                  }
                }
              },
              {
                $match: {
                  visit: {
                    $elemMatch: { updatedOn: { $lte: new Date(toDate) } }
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: { $size: "$visit" } },
                  clinicalOfficer: { $addToSet: ele }
                }
              },
              { $project: { officerName: ele, count: { $toString: "$count" } } }
            ])
            .then(patientHis => {
              if (patientHis.length > 0) {
                users.findOne({authenticationKey: ele.split(' ')[0]}).then(userFound => {
                  console.log('user Found..test',userFound);
                  patientHis[0].userActivation = userFound.userActivation;
                  resolve(patientHis[0]);
                });
              } else {
                users.findOne({authenticationKey: ele.split(' ')[0]}).then(userFound => {
                  console.log('user Found..test',userFound);
                  // patientHis[0].userActivation = userFound.userActivation;
                  resolve({ _id: null, officerName: ele, count: "0",userActivation: userFound.userActivation });
                });
                
              }
            })
            .catch(err => {
              console.log("msg: ", err.message);
              resolve(err.message);
            });
        });
      };

      var promises = officersList[0].data[0].officersList.map(async ele => {
        var result = await clinicalOfficerVisitCount(ele);
        return new Promise((res, rej) => {
          res(result);
        });
      });

      Promise.all(promises).then(userRecords => {
        // userRecords.sort({_id:1});
        console.log("All promises", userRecords);
        res.json({
          userRecords: userRecords,
          userRecordsCount: totalPractitionerCount
        });
      });
    })
    .catch(err => {
      console.log("msg: ", err.message);
    });
});

router.get("/getPatientRecords", async (req, res) => {
  console.log("request..test", req.query);

  let currentDate = new Date();
  let latestDate = new Date();
  let fromDate = "";
  let toDate = "";

  currentDate.setMonth(parseInt(req.query.month));
  currentDate.setFullYear(parseInt(req.query.year));
  currentDate.setDate(01);
  currentDate.setMinutes(0);
  currentDate.setHours(0);
  currentDate.setMinutes(0);
  currentDate.setMilliseconds(0);
  fromDate = currentDate.toISOString();

  latestDate.setMonth(parseInt(req.query.month));
  latestDate.setFullYear(parseInt(req.query.year));
  latestDate.setDate(31);
  latestDate.setMinutes(0);
  latestDate.setHours(0);
  latestDate.setMinutes(0);
  latestDate.setMilliseconds(0);
  toDate = latestDate.toISOString();

  patientHistories.aggregate([
    {
        $facet: {
            pageInfo: [
                { $match: { visit: { $elemMatch: { doctor: req.query.doctorId }  } } },
                {
                  $match: {
                    visit: {
                      $elemMatch: { updatedOn: { $gte: new Date(fromDate) } }
                    }
                  }
                },
                {
                  $match: {
                    visit: {
                      $elemMatch: { updatedOn: { $lte: new Date(toDate) } }
                    }
                  }
                },
                {
                    "$group": {
                        "_id": null,
                        "count": { "$sum": { "$size": "$visit" } },
                        "countRecords":{"$sum":1}
                    }
                }
            ],
            data: [
                { $match: { visit: { $elemMatch: { doctor: req.query.doctorId } } } },
                {
                    $match: {
                      visit: {
                        $elemMatch: { updatedOn: { $gte: new Date(fromDate) } }
                      }
                    }
                  },
                  {
                    $match: {
                      visit: {
                        $elemMatch: { updatedOn: { $lte: new Date(toDate) } }
                      }
                    }
                  },
                { $skip: +req.query.pageFrom },
                { $limit: +req.query.pageSize },
                {
                    "$group": {
                        "_id": null,
                        'totalVisitDetails': {
                            $push: {
                                'patientHistoryId': '$_id',
                                'visitDetails': "$visit",
                                'patientID': "$patientId",
                                'status': '$status',
                                'patientName': '$patientName',
                                "count": { "$size": "$visit" } 
                            },

                        },


                    }
                }


            ]
        }
    }
]).then(patientResult => {
      console.log('patientsResults...test',patientResult);
      res.json({totalVisitDetails:patientResult[0].data[0].totalVisitDetails,count:patientResult[0].pageInfo[0]});
  });
});


router.get('/allPatientRecords',async(req,res) => {


  console.log('query..',req.query);
  let currentDate = new Date();
  let latestDate = new Date();
  let fromDate = "";
  let toDate = "";

  currentDate.setMonth(parseInt(req.query.month));
  currentDate.setFullYear(parseInt(req.query.year));
  currentDate.setDate(01);
  currentDate.setMinutes(0);
  currentDate.setHours(0);
  currentDate.setMinutes(0);
  currentDate.setMilliseconds(0);
  fromDate = currentDate.toISOString();

  latestDate.setMonth(parseInt(req.query.month));
  latestDate.setFullYear(parseInt(req.query.year));
  latestDate.setDate(31);
  latestDate.setMinutes(0);
  latestDate.setHours(0);
  latestDate.setMinutes(0);
  latestDate.setMilliseconds(0);
  toDate = latestDate.toISOString();

  console.log('fromDate..',fromDate);
  console.log('toDate..',toDate);


  patients.find(
    {$or: [
      { firstName: new RegExp(req.query.patString, 'mi') },
      { patientId: new RegExp(req.query.patString, 'mi') },
      { phone:new RegExp(req.query.patString, 'mi')}
    ]}
  ).skip(+req.query.pageFrom).limit(+req.query.pageSize).sort({_id:-1}).then(allPatientRecords => {

    var promises = allPatientRecords.map(async ele => {
      var result = await patientVisitCount(ele.patientId);
      result['patientId'] = ele.patientId+' - '+ele.firstName+' '+ele.lastName;
      return new Promise((res, rej) => {
        res(result);
      });
    });


    Promise.all(promises).then(patientRecords => {
      console.log("All promises", patientRecords);
      patients.countDocuments().then(patientCount => {
        console.log('patientCounts', patientCount);
        res.json({
          userRecords: patientRecords, patientCount: patientCount
        });
      });

    });
  })



  var patientVisitCount = ele => {
    return new Promise((resolve, reject) => {
      patientHistories
          .aggregate([
            { $match: { patientId:  ele } },
            {
              $match: {
                visit: {
                  $elemMatch: { updatedOn: { $gte: new Date(fromDate) } }
                }
              }
            },
            {
              $match: {
                visit: {
                  $elemMatch: { updatedOn: { $lte: new Date(toDate) } }
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: { $size: "$visit" } },
              }
            },
            { $project: { count: { $toString: "$count" } } }
          ])
          .then(patientHis => {
            if (patientHis.length > 0) {
              resolve(patientHis[0]);
            } else {
              resolve({ _id: null, count: "0" });
            }
          })
          .catch(err => {
            console.log("msg: ", err.message);
            resolve(err.message);
          });
      
    });
  }
});

router.get('/patientVisitDetails', async(req,res) => {

  console.log('patientVisitDetails..route works..');

  console.log('query..',req.query);
  let currentDate = new Date();
  let latestDate = new Date();
  let fromDate = "";
  let toDate = "";

  currentDate.setMonth(parseInt(req.query.month));
  currentDate.setFullYear(parseInt(req.query.year));
  currentDate.setDate(01);
  currentDate.setMinutes(0);
  currentDate.setHours(0);
  currentDate.setMinutes(0);
  currentDate.setMilliseconds(0);
  fromDate = currentDate.toISOString();

  latestDate.setMonth(parseInt(req.query.month));
  latestDate.setFullYear(parseInt(req.query.year));
  latestDate.setDate(31);
  latestDate.setMinutes(0);
  latestDate.setHours(0);
  latestDate.setMinutes(0);
  latestDate.setMilliseconds(0);
  toDate = latestDate.toISOString();

  // patientHistories.find({ date: { $and: [{ $gte: new Date(fromDate) }, { $lte: new Date(toDate) }] } }).skip(+req.query.pageFrom).limit(+req.query.pageSize).then(patientDetials => {
  //   console.log('patientDetials...', patientDetials);

  //   patientHistories.find({ date: { $and: [{ $gte: new Date(fromDate) }, { $lte: new Date(toDate) }] } }).countDocuments().then(totalCount => {
  //     console.log('patients total count',totalCount);
  //     res.json({patientDetails:patientDetials,patientHistoryCount:totalCount});
  //   });

  // });
  console.log('fromDate..',fromDate);
  console.log('toDate...',toDate);

  patientHistories
    .aggregate([
      {
        $facet: {
          patientDetails: [
            {
              $match: {
                patientId: req.query.patientId
              }
            },
            {
              $match: {
                visit: {
                  $elemMatch: { updatedOn: { $gte: new Date(fromDate) } }
                }
              }
            },
            {
              $match: {
                visit: {
                  $elemMatch: { updatedOn: { $lte: new Date(toDate) } }
                }
              }
            },
            {
              $skip: +req.query.pageFrom
            },
            { $limit: +req.query.pageSize }
          ],
          pageInfo:[
            {
              $match: {
                patientId: req.query.patientId
              }
            },
            {
              $match: {
                visit: {
                  $elemMatch: { updatedOn: { $gte: new Date(fromDate) } }
                }
              }
            },
            {
              $match: {
                visit: {
                  $elemMatch: { updatedOn: { $lte: new Date(toDate) } }
                }
              }
            },
            {"$group":{_id:null,count:{$sum:1}}}
          ]
        }
      }
    ])
    .then(patientHistoriesResponse => {
      console.log("patientHistoriesResponse..test..", patientHistoriesResponse);
      res.json(patientHistoriesResponse);
    });
})

router.get('/userPermission',async(req,res) => {
  console.log('req.query..test',req.query);
  users.findOne({authenticationKey:req.query.doctorId}).then(userFound => {
    if(userFound.userActivation === 'activate'){
      users.updateOne({authenticationKey:req.query.doctorId},{$set:{userActivation:'deactivate'}}).then(userPermissionUpdated => {
        console.log('userPermission..updated..test..activated',userPermissionUpdated);
        res.json(userPermissionUpdated)
        // users.findOne({authenticationKey:req.query.doctorId}).then(userpermissionChanged => {
        //   console.log('userPermissionChanged.....test',userpermissionChanged);
        //   res.json(userpermissionChanged);
        // });
      })
    }else if(userFound.userActivation === 'deactivate'){
      users.findOneAndUpdate({authenticationKey:req.query.doctorId},{$set:{userActivation:'activate'}}).then(userPermissionUpdated => {
        console.log('userPermission..updated..test..deactivated',userPermissionUpdated);
        // users.findOne({authenticationKey:req.query.doctorId}).then(userpermissionChanged => {
        //   console.log('userPermissionChanged.....test',userpermissionChanged);
        //   res.json(userpermissionChanged);
        // });
        res.json(userPermissionUpdated);
      })
    }
  })
})

module.exports = router;
