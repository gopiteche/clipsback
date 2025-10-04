//diagnosisController

const express = require('express');
const router = express.Router();
const modulefiles = require('../models/model');

const tempcomplaints = modulefiles.tempcomplaints;
const complaints = modulefiles.complaints;
const generalexams = modulefiles.generalexams;
const systemexams = modulefiles.systemexams;
const clinical = modulefiles.clinical;
const medicines = modulefiles.medicines;
const advices = modulefiles.advices;
const treatment = modulefiles.treatment;


function cleanUndefined(obj) {
    // console.log('cleanUndefined Entry', obj);
    const propNames = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < propNames.length; i++) {
      const propName = propNames[i];
  
      if (obj[propName] === null) {
      } else {
        // console.log('obj[propName].length', obj[propName].length, propName);
        for (let j = 0; j < obj[propName].length; j++) {
          if (obj[propName][j] == "undefined") {
            obj[propName].splice(j, 1);
          }
          // console.log('cleanUndefined before', obj[propName][j], propName);
        }
        // console.log( 'propName', propName, obj[propName]);
        if(obj[propName].length && obj[propName].length>0)
        obj[propName].sort(function (a, b) {
          return a.toLowerCase().localeCompare(b.toLowerCase());
        });
      }
    }
    // console.log('cleanUndefined after', obj);
  }


  function cleanMedicine(medicineSet) {
    let actualMedicineList = [];
    let uniqueMedicineList = [];
    let cleanMedicineList = [];
    console.log('cleanMedicine Entry', medicineSet);
    medicineSet.forEach((item, index) => {
      // const itemSplit = item.split('#',1);
      const tempDataArray = {};
      tempDataArray['userRef'] = item.substring(0, 24);
      tempDataArray['Medicine'] = item.substring(25);
      actualMedicineList.push(tempDataArray);
    });
    console.log('actualMedicineList', actualMedicineList);
    uniqueMedicineList = Array.from(new Set(actualMedicineList.map(a => a.Medicine)))
   .map(Medicine => {
     return actualMedicineList.find(a => a.Medicine === Medicine)
   })
   console.log('uniqueMedicineList', uniqueMedicineList);
   uniqueMedicineList.forEach((item, index) => {
    cleanMedicineList.push(item.userRef + '#' + item.Medicine);
   });
    console.log('cleanMedicine Exit', cleanMedicineList);
    return cleanMedicineList;
    // let diseaseSetSplit = diseaseSet.split(",");
  
    // actualMedicineList.split('#',1)[0];
    // const propNames = Object.getOwnPropertyNames(obj);
    // for (let i = 0; i < propNames.length; i++) {
    //   const propName = propNames[i];
  
    //   if (obj[propName] === null) {
    //   } else {
    //     // console.log('obj[propName].length', obj[propName].length, propName);
    //     for (let j = 0; j < obj[propName].length; j++) {
    //       if (obj[propName][j] == "undefined") {
    //         obj[propName].splice(j, 1);
    //       }
    //       // console.log('cleanUndefined before', obj[propName][j], propName);
    //     }
    //     // console.log( 'propName', propName, obj[propName]);
    //     if(obj[propName].length && obj[propName].length>0)
    //     obj[propName].sort(function (a, b) {
    //       return a.toLowerCase().localeCompare(b.toLowerCase());
    //     });
    //   }
    // }
    // // console.log('cleanUndefined after', obj);
  }

router.get('/data/searchWOSite', async (req, res) => {
    searchString = "";
    searchString = req.query.searchString;
    // collectionNamed = "complaints";
    // gender = "";
    console.log(req.query);
    ////// ****** Change collection Name(complaints) Here ****** ////////
    tempcomplaints
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        { $match: { complaints: searchString } },
                        {
                            $group: {
                                _id: null,
                                uniqueValuesSite: { $addToSet: "$site" },
                                uniqueValuesSeverity: { $addToSet: "$severity" },
                                uniqueValuesExtent: { $addToSet: "$extent" },
                                uniqueValuesNature: { $addToSet: "$nature" },
                                uniqueValuesAggfactor: { $addToSet: "$aggfactor" },
                                uniqueValuesRelfactor: { $addToSet: "$relfactor" },
                                uniqueValuesOnset: { $addToSet: "$onset" },
                                uniqueValuesFrequency: { $addToSet: "$frequency" },
                                uniqueValuesDuration: { $addToSet: "$duration" },
                                uniqueValuesHistory: { $addToSet: "$history" },
                                uniqueValuesDisease: { $addToSet: "$disease" }
                            }
                        },

                        {
                            $project: {
                                site: "$uniqueValuesSite",
                                severity: "$uniqueValuesSeverity",
                                extent: "$uniqueValuesExtent",
                                nature: "$uniqueValuesNature",
                                aggfactor: "$uniqueValuesAggfactor",
                                relfactor: "$uniqueValuesRelfactor",
                                onset: "$uniqueValuesOnset",
                                frequency: "$uniqueValuesFrequency",
                                duration: "$uniqueValuesDuration",
                                history: "$uniqueValuesHistory",
                                disease: "$uniqueValuesDisease",
                                sitecount: { $size: "$uniqueValuesSite" }
                            }
                        }
                    ]
                }
            }
        ])
        .then(complaint => {
            cleanUndefined(complaint[0].pageInfo[0]);
            // console.log(JSON.stringify(complaint), "complaintResponse");
            res.json(complaint);
        })
        .catch(err => {
            // return err.message;
            res.json({
                msg: err.message
            });
        });
});


router.get('/data/searchSite', async (req, res) => {
    searchString = "";
    searchString = req.query.searchString;

    // collectionNamed = "complaints";
    console.log(req.query, "complaints");

    await tempcomplaints
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { complaints: req.query.complaints } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        { $match: { site: { $in: req.query.site.split(",") } } },
                        {
                            $group: {
                                _id: null,
                                uniqueValuesSeverity: { $addToSet: "$severity" },
                                uniqueValuesExtent: { $addToSet: "$extent" },
                                uniqueValuesNature: { $addToSet: "$nature" },
                                uniqueValuesAggfactor: { $addToSet: "$aggfactor" },
                                uniqueValuesRelfactor: { $addToSet: "$relfactor" },
                                uniqueValuesOnset: { $addToSet: "$onset" },
                                uniqueValuesFrequency: { $addToSet: "$frequency" },
                                uniqueValuesDuration: { $addToSet: "$duration" },
                                uniqueValuesHistory: { $addToSet: "$history" },
                                uniqueValuesDisease: { $addToSet: "$disease" }
                            }
                        },

                        {
                            $project: {
                                severity: "$uniqueValuesSeverity",
                                extent: "$uniqueValuesExtent",
                                nature: "$uniqueValuesNature",
                                aggfactor: "$uniqueValuesAggfactor",
                                relfactor: "$uniqueValuesRelfactor",
                                onset: "$uniqueValuesOnset",
                                frequency: "$uniqueValuesFrequency",
                                duration: "$uniqueValuesDuration",
                                history: "$uniqueValuesHistory",
                                disease: "$uniqueValuesDisease"
                            }
                        }
                    ]
                }
            }
        ])
        .then(complaint => {
            cleanUndefined(complaint[0].pageInfo[0]);
            res.json(complaint);
        })
        .catch(err => {
            res.json({
                msg: err.message
            });
        });
});

router.get('/search/complaints', async (req, res) => {
    if (req.query.searchString) {
        searchString = req.query.searchString;
    } else {
        searchString = "";
    }

    col_name = "complaints";
    col_value = 1; // 1 - Asc, (-1) for Dec
    collectionNamed = "complaints";
    // console.log(req.query, "req.query.age");
    console.log(req.query);
    // console.log(req.body);
    // console.log(req.params);
    ////// ****** Change collection Name(complaints) Here ****** ////////
    await tempcomplaints
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        { $match: { complaints: new RegExp(searchString, "mi") } },
                        {
                            $group: {
                                _id: null,
                                // uniqueValuesSite: { $addToSet: "$site" },
                                uniqueValuesComplaints: { $addToSet: "$complaints" }
                            }
                        },

                        {
                            $project: {
                                complaints: "$uniqueValuesComplaints"
                                // sitecount: { $size: "$uniqueValuesSite" }
                            }
                        }
                    ]
                }
            }
        ])
        .then(complaint => {
            complaint[0].pageInfo[0].complaints.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            res.json(complaint);
        })
        .catch(err => {
            res.json({
                msg: err.message
            });
        });
});

router.get('/searchComplaints', async (req, res) => {
    searchString = "";
    searchString = req.query.searchString;
    collectionNamed = "complaints";
    gender = "";
    console.log(req.query);
    ////// ****** Change collection Name(complaints) Here ****** ////////
    // if(req.query.searchString === "Pain"){
    await tempcomplaints.aggregate([
        {
            $facet: {
                pageInfo: [
                    { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                    { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                    { $match: { sexnotpref: { $ne: req.query.gender } } },
                    { $match: { complaints: searchString } },
                    {
                        $group:
                        {
                            _id: null,
                            uniqueValuesSite: { $addToSet: "$site" },

                        }
                    },

                    {
                        $project: {
                            site: "$uniqueValuesSite",

                        }
                    },
                ],
            },
        },
    ])
        .then(complaint => {
            cleanUndefined(complaint[0].pageInfo[0]);
            console.log(complaint[0].pageInfo[0]['site'].length, "complaintLength");
            if (complaint[0].pageInfo[0]['site'].length > 0) {

                complaint.forEach((item, index) => {
                    // console.log('Name', item);
                });
                res.json(complaint);
            } else {
                // var responseValue =  getAllFactors(searchString);
                console.log(req.query, "else Statement");

                ////// ****** Change collection Name(complaints) Here ****** ////////
                tempcomplaints.aggregate([
                    {
                        $facet: {
                            pageInfo: [
                                { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                                { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                                { $match: { sexnotpref: { $ne: req.query.gender } } },
                                { $match: { complaints: req.query.searchString } },
                                {
                                    $group:
                                    {
                                        _id: null,
                                        uniqueValuesSite: { $addToSet: "$site" },
                                        uniqueValuesSeverity: { $addToSet: "$severity" },
                                        uniqueValuesExtent: { $addToSet: "$extent" },
                                        uniqueValuesNature: { $addToSet: "$nature" },
                                        uniqueValuesAggfactor: { $addToSet: "$aggfactor" },
                                        uniqueValuesRelfactor: { $addToSet: "$relfactor" },
                                        uniqueValuesOnset: { $addToSet: "$onset" },
                                        uniqueValuesFrequency: { $addToSet: "$frequency" },
                                        uniqueValuesDuration: { $addToSet: "$duration" },
                                        uniqueValuesHistory: { $addToSet: "$history" },
                                        uniqueValuesDisease: { $addToSet: "$disease" },

                                    }
                                },

                                {
                                    $project: {
                                        site: "$uniqueValuesSite",
                                        severity: "$uniqueValuesSeverity",
                                        extent: "$uniqueValuesExtent",
                                        nature: "$uniqueValuesNature",
                                        aggfactor: "$uniqueValuesAggfactor",
                                        relfactor: "$uniqueValuesRelfactor",
                                        onset: "$uniqueValuesOnset",
                                        frequency: "$uniqueValuesFrequency",
                                        duration: "$uniqueValuesDuration",
                                        history: "$uniqueValuesHistory",
                                        disease: "$uniqueValuesDisease",
                                        sitecount: { $size: "$uniqueValuesSite" }

                                    }
                                },
                            ],
                        },
                    },
                ])
                    .then(complaint => {
                        cleanUndefined(complaint[0].pageInfo[0]);
                        console.log(JSON.stringify(complaint), "complaintResponse");
                        res.json(complaint);
                    }).catch(err => {
                        console.log(err, "errerr");
                        res.json({
                            msg: err.message
                        });
                    });


            }
        }).catch(err => {
            res.json({
                msg: err.message
            });
        });
    // }else{
    // await complaints.aggregate([
    //     {
    //       $facet: {
    //         pageInfo: [
    //           { $match : { complaints : searchString }},
    //           { $group:
    //             {
    //               _id: null,
    //               uniqueValuesSite: {$addToSet: "$site"},
    //               uniqueValuesSeverity: {$addToSet: "$severity"},
    //               uniqueValuesExtent: {$addToSet: "$extent"},
    //               uniqueValuesNature: {$addToSet: "$nature"},
    //               uniqueValuesAggfactor: {$addToSet: "$aggfactor"},
    //               uniqueValuesRelfactor: {$addToSet: "$relfactor"},
    //               uniqueValuesOnset: {$addToSet: "$onset"},
    //               uniqueValuesFrequency: {$addToSet: "$frequency"},
    //               uniqueValuesDuration: {$addToSet: "$duration"},
    //               uniqueValuesHistory: {$addToSet: "$history"},
    //               uniqueValuesDisease: {$addToSet: "$disease"},

    //             }
    //           },

    //           {
    //             $project: {
    //               site:"$uniqueValuesSite",
    //               severity:"$uniqueValuesSeverity",
    //               extent:"$uniqueValuesExtent",
    //               nature:"$uniqueValuesNature",
    //               aggfactor:"$uniqueValuesAggfactor",
    //               relfactor:"$uniqueValuesRelfactor",
    //               onset:"$uniqueValuesOnset",
    //               frequency:"$uniqueValuesFrequency",
    //               duration:"$uniqueValuesDuration",
    //               history:"$uniqueValuesHistory",
    //               disease:"$uniqueValuesDisease",
    //               sitecount: {$size: "$uniqueValuesSite"}

    //             }
    //           },
    //         ],
    //       },
    //     },
    //   ])
    //   .then(complaint => {
    //     cleanUndefined(complaint[0].pageInfo[0]);
    //       res.json(complaint);
    //   }).catch(err => {
    //       res.status(500).send({
    //           msg: err.message
    //       });
    //   });
    // }
});


router.get('/getGeneralExam', async (req, res) => {
    let complaintdiseaseSets = [];
    let generalexamsSet = [];
    let diseasesSet = [];
    let complaintParse = [];
    let may02disease = [];
    let may02diseaseWithId = [];
    let may02diseaseCount = {};
    let may02diseaseSorted = [];
    // alldiseasesSet = [];
    console.log("queryyyyyyyyyy", req.query);
    let complaint = req.query.complaint;
    let complaintSplit = JSON.parse(complaint);

    console.log(complaintSplit, "receivedData");
    // console.log(complaintSplit.length);

    for (let i = 0; i < complaintSplit.length; i++) {

        var factors = false;

        var options = {
            agelower: { $lte: parseInt(req.query.age) },
            ageupper: { $gte: parseInt(req.query.age) },
            sexnotpref: { $ne: req.query.gender },
            // complaints: new RegExp(complaintSplit[i].complaint, "i"),
            complaints: complaintSplit[i].complaint,
            // new RegExp(searchString, "mi")
            // site: complaintSplit[i].site,
            // aggfactor: complaintSplit[i].aggfactor,
            // duration: complaintSplit[i].duration,
            // extent: complaintSplit[i].extent,
            // frequency: complaintSplit[i].frequency,
            // history: complaintSplit[i].history,
            // nature: complaintSplit[i].nature,
            // onset: complaintSplit[i].onset,
            // relfactor: complaintSplit[i].relfactor,
            // severity: complaintSplit[i].severity
            // site: site,
            // aggfactor: aggfactor
        };

        options.aggfactor = "undefined";
        options.duration = "undefined";
        options.frequency = "undefined";
        options.history = "undefined";
        options.nature = "undefined";
        options.onset = "undefined";
        options.relfactor = "undefined";
        options.severity = "undefined";
        options.site = "undefined";
        options.extent = "undefined";

        // if(complaintSplit[i].aggfactor.length>0 || complaintSplit[i].duration.length>0 || complaintSplit[i].extent.length>0 || complaintSplit[i].frequency.length>0 || complaintSplit[i].history.length>0 || complaintSplit[i].nature.length>0 || complaintSplit[i].onset.length>0 || complaintSplit[i].relfactor.length>0 || complaintSplit[i].severity.length>0 || complaintSplit[i].site.length>0){
        //   factors = true;
        // }

        console.log(complaintSplit[i].history, "testeeee");

        if (complaintSplit[i].aggfactor != undefined) {
            if (complaintSplit[i].aggfactor.length > 0) {
                factors = true;
                options.aggfactor = complaintSplit[i].aggfactor;
            } else {
                options.aggfactor = "undefined"
            }
            aggfactor =
                complaintSplit[i].aggfactor.length > 0
                    ? complaintSplit[i].aggfactor
                    : options.aggfactor;
            // aggfactor = complaintSplit[i].aggfactor;
        }
        if (complaintSplit[i].duration != undefined) {
            if (complaintSplit[i].duration.length > 0) {
                factors = true;
                options.duration = complaintSplit[i].duration;
            } else {
                options.duration = "undefined"
            }
            duration =
                complaintSplit[i].duration.length > 0
                    ? complaintSplit[i].duration
                    : options.duration;
            // duration = complaintSplit[i].duration;
        }
        if (complaintSplit[i].extent != undefined) {
            if (complaintSplit[i].extent.length > 0) {
                factors = true;
                options.extent = complaintSplit[i].extent;
            } else {
                options.extent = "undefined"
            }
            extent =
                complaintSplit[i].extent.length > 0 ? complaintSplit[i].extent : options.extent;
            // extent = complaintSplit[i].extent;
        }
        if (complaintSplit[i].frequency != undefined) {
            if (complaintSplit[i].frequency.length > 0) {
                factors = true;
                options.frequency = complaintSplit[i].frequency;
            } else {
                options.frequency = "undefined"
            }
            frequency =
                complaintSplit[i].frequency.length > 0
                    ? complaintSplit[i].frequency
                    : options.frequency;
            // frequency = complaintSplit[i].frequency;
        }
        if (complaintSplit[i].history != undefined) {
            if (complaintSplit[i].history.length > 0) {
                factors = true;
                options.history = complaintSplit[i].history;
            } else {
                options.history = "undefined"
            }
            history =
                complaintSplit[i].history.length > 0
                    ? complaintSplit[i].history
                    : options.history;
            // history = complaintSplit[i].history;
        }
        if (complaintSplit[i].nature != undefined) {
            if (complaintSplit[i].nature.length > 0) {
                factors = true;
                options.nature = complaintSplit[i].nature;
            } else {
                options.nature = "undefined"
            }
            nature =
                complaintSplit[i].nature.length > 0 ? complaintSplit[i].nature : options.nature;
            // nature = complaintSplit[i].nature;
        }
        if (complaintSplit[i].onset != undefined) {
            if (complaintSplit[i].onset.length > 0) {
                factors = true;
                options.onset = complaintSplit[i].onset;
            } else {
                options.onset = "undefined"
            }
            onset =
                complaintSplit[i].onset.length > 0 ? complaintSplit[i].onset : options.onset;
            // onset = complaintSplit[i].onset;
        }
        if (complaintSplit[i].relfactor != undefined) {
            if (complaintSplit[i].relfactor.length > 0) {
                factors = true;
                options.relfactor = complaintSplit[i].relfactor;
            } else {
                options.relfactor = "undefined"
            }
            relfactor =
                complaintSplit[i].relfactor.length > 0
                    ? complaintSplit[i].relfactor
                    : options.relfactor;
            // relfactor = complaintSplit[i].relfactor;
        }
        if (complaintSplit[i].severity != undefined) {
            if (complaintSplit[i].severity.length > 0) {
                factors = true;
                options.severity = complaintSplit[i].severity;
            } else {
                options.severity = "undefined"
            }
            severity =
                complaintSplit[i].severity.length > 0
                    ? complaintSplit[i].severity
                    : options.severity;
            // severity = complaintSplit[i].severity;
        }
        if (complaintSplit[i].site != undefined) {
            if (complaintSplit[i].site.length > 0) {
                factors = true;
                options.site = complaintSplit[i].site;
            } else {
                options.site = "undefined"
            }
            site = complaintSplit[i].site.length > 0 ? complaintSplit[i].site : options.site;
            // site = complaintSplit[i].site;
        }
        // console.log(
        //   aggfactor,
        //   duration,
        //   extent,
        //   frequency,
        //   history,
        //   nature,
        //   onset,
        //   relfactor,
        //   severity,
        //   site,
        //   "factors"
        // );



        // let testVariable  = {site: site,aggfactor: aggfactor,duration: duration,extent: extent,frequency: frequency,history: history,nature: nature,onset: onset,relfactor: relfactor,severity: severity};
        console.log(options, "final options");
        if (factors) {
            await complaints.find(
                options
                //   {
                //   agelower: { $lte: parseInt(req.query.age) },
                //   ageupper: { $gte: parseInt(req.query.age) }, 
                //   sexnotpref: { $ne: req.query.gender },
                //   complaints: complaintSplit[i].complaint,
                //   site: site,
                //   aggfactor: aggfactor,
                //   duration: duration,
                //   extent: extent,
                //   frequency: frequency,
                //   history: history,
                //   nature: nature,
                //   onset: onset,
                //   relfactor: relfactor,
                //   severity: severity
                //   // site: site,
                //   // aggfactor: aggfactor
                // }
            ).sort({ _id: 1 })
                .then(diseases => {
                    console.log("Disease List for Complaint", i, diseases);
                    diseases.forEach((item, index) => {
                        diseasesSet.push(item);
                    });
                    // alldiseasesSet = alldiseasesSet.concat(diseases[0].pageInfo[0].alldiseases);
                    // complainitdiseaseSets = diseasesSet;
                })
                .catch(err => {
                    console.log(err.message);
                });
        } else {
            await complaints.find(
                options
                //   {
                //   agelower: { $lte: parseInt(req.query.age) },
                //   ageupper: { $gte: parseInt(req.query.age) }, 
                //   sexnotpref: { $ne: req.query.gender },
                //   complaints: complaintSplit[i].complaint,
                //   site: site,
                //   aggfactor: aggfactor,
                //   duration: duration,
                //   extent: extent,
                //   frequency: frequency,
                //   history: history,
                //   nature: nature,
                //   onset: onset,
                //   relfactor: relfactor,
                //   severity: severity
                //   // site: site,
                //   // aggfactor: aggfactor
                // }
            ).sort({ _id: 1 })
                .then(diseases => {
                    console.log("Disease List for Complaint", i, diseases);
                    diseases.forEach((item, index) => {
                        diseasesSet.push(item);
                    });
                    // diseasesSet.push(diseases[0]);
                    // alldiseasesSet = alldiseasesSet.concat(diseases[0].pageInfo[0].alldiseases);
                    // complainitdiseaseSets = diseasesSet;
                })
                .catch(err => {
                    console.log(err.message);
                });
        }
    }


    // diseasesSet.sort(function (a, b) {
    //   const nameA = a._id, nameB = b._id;
    //   if (nameA < nameB) {
    //     return -1;
    //   }
    //   if (nameA > nameB) {
    //     return 1;
    //   }
    //   return 0; // default return value (no sorting)
    // });
    // console.log("diseasesSet sort", diseasesSet);


    diseasesSet.forEach((item, index) => {
        const tempDataArray = {};
        tempDataArray['_id'] = item._id;
        tempDataArray['disease'] = item.disease;
        may02diseaseWithId.push(tempDataArray);
    });

    may02diseaseWithId.sort(function (a, b) {
        var keyA = a._id,
            keyB = b._id;
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
    console.log("may02diseaseWithId Sorted With Duplicates", may02diseaseWithId);


    may02diseaseWithId = may02diseaseWithId.filter((thing, index, self) =>
        index === self.findIndex((t) => (
            t.disease === thing.disease
        ))
    )

    console.log("may02diseaseWithId Sorted No Duplicates", may02diseaseWithId);

    may02diseaseWithId.forEach((item, index) => {
        may02disease.push(item.disease);
    });

    // count = function (ary, classifier) {
    //   classifier = classifier || String;
    //   return ary.reduce(function (counter, item) {
    //       var p = classifier(item);
    //       counter[p] = counter.hasOwnProperty(p) ? counter[p] + 1 : 1;
    //       return counter;
    //   }, {})
    // };

    // countByDisease = count(may02diseaseWithId, function (item) {
    //   return item.disease
    // });

    console.log("may02disease", may02disease);
    // console.log("may02diseaseWithId", may02diseaseWithId);

    // counter = {}

    // may02diseaseWithId.forEach(function(obj) {
    //     var key = JSON.stringify(obj)
    //     counter[key] = (counter[key] || 0) + 1
    // })

    // may02disease.forEach(function (i) {
    //   may02diseaseCount[i] = may02diseaseCount[i] + 1 || 1;
    // });
    // console.log("may02disease Count", may02diseaseCount);

    // may02diseaseSorted = Object.keys(may02diseaseCount).sort(function (a, b) {

    //   return may02diseaseCount[b] - may02diseaseCount[a];
    // });



    // console.log("may02disease Sort", may02diseaseSorted);



    // complaintdiseaseSets = [...new Set(may02diseaseSorted)];
    // console.log("Consolidated Diseases", complaintdiseaseSets);

    await generalexams
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        { $match: { disease: { $in: may02disease } } },
                        {
                            $group: {
                                _id: null,
                                myfield: { $push: { $concat: ["$generalexam", "#", "$meanings"] } },
                                uniqueIds: { $addToSet: "$_id" }
                            }
                        },
                        {
                            $project: { generalexams: "$myfield" }
                        }
                    ]
                }
            }
        ])
        .then(generalexams => {
            // console.log( "generalexams", generalexams);
            let removedDuplicateValues = [...new Set(generalexams[0].pageInfo[0].generalexams)];
            console.log(removedDuplicateValues, "withoutDup");
            generalexamsSet = removedDuplicateValues.sort(function (
                a,
                b
            ) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
        })
        .catch(err => {
            console.log(err.message);
        });
    console.log("General Exam List", generalexamsSet);
    return res.json({
        generalExamsSet: generalexamsSet,
        // may02disease: may02disease,
        // may02diseaseCount: may02diseaseCount,
        diseaseSet: may02disease,
        // may02diseaseWithId: may02diseaseWithId,
        // countByDisease: countByDisease
        // alldiseasesSet: alldiseasesSet
    });
});


router.get('/getSystemExam', async (req, res) => {
    generaldiseaseSets = [];
    systemicexamsSet = [];
    // systemicdiseaseSets = [];
    // alldiseasesSet = [];
    // systemicDiseasesSet = [];
    console.log(req.query);
    disease = req.query.dis;
    generalExams = req.query.genex;
    console.log(generalExams.length, "generalExams Length");
    diseaseSplit = disease.split(",");
    generalExamsSplit = generalExams.split(",");
    console.log("disease split", disease.length);
    console.log("generalExams split", generalExamsSplit.length);
    if (generalExams.length > 0) {
        await generalexams
            .aggregate([
                {
                    $facet: {
                        pageInfo: [
                            { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                            { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                            { $match: { sexnotpref: { $ne: req.query.gender } } },
                            { $match: { disease: { $exists: true, $in: diseaseSplit } } },
                            {
                                $match: {
                                    generalexam: { $exists: true, $in: generalExamsSplit }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    // valuesDiseasesAll: { $push: "$disease" },
                                    uniqueValuesDiseases: { $addToSet: "$disease" }
                                }
                            },

                            {
                                $project: {
                                    diseases: "$uniqueValuesDiseases"
                                    // alldiseases: "$valuesDiseasesAll",
                                }
                            }
                        ]
                    }
                }
            ])
            .then(diseasess => {
                console.log(
                    "Disease List after Considering General Exams",
                    diseasess[0].pageInfo[0].diseases
                );
                generaldiseaseSets = diseasess[0].pageInfo[0].diseases;
                // alldiseasesSet = diseases[0].pageInfo[0].alldiseases;
                // systemicdiseaseSets = systemicDiseasesSet;
            })
            .catch(err => {
                res.json({
                    msg: err.message
                });
            });
    }
    // else {
    // systemicDiseasesSet = sampleSplit;
    // alldiseasesSet = sampleSplit;
    // systemicdiseaseSets = systemicDiseasesSet;
    // }

    await systemexams
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        { $match: { disease: { $in: diseaseSplit } } },
                        {
                            $group: {
                                _id: null,
                                myfield: { $push: { $concat: ["$systemicexam", "#", "$meaning"] } },
                                uniqueIds: { $addToSet: "$_id" }
                            }
                        },
                        {
                            $project: { systemicexams: "$myfield" }
                        }
                    ]
                }
            }
        ])
        .then(systemicexamsss => {
            // let filtered = systemicexamsss[0].pageInfo[0].systemicexams.filter(el => el !== null);
            // console.log(filtered, "output");

            let removedDuplicateValues = [...new Set(systemicexamsss[0].pageInfo[0].systemicexams)];
            console.log(removedDuplicateValues, "removedDup");

            systemicexamsSet = removedDuplicateValues.sort(
                function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                }
            );
        })
        .catch(err => {
            console.log(err.message);
        });
    console.log("Systemic Exam List", systemicexamsSet);

    return res.json({
        systemicExamsSet: systemicexamsSet,
        generaldiseaseSets: generaldiseaseSets
        // alldiseasesSet: alldiseasesSet,
        // systemicDiseaseSet: generaldiseaseSets
    });
});

router.get('/getClinicalInvestigation', async (req, res) => {
    systemicExams = req.query.sysex;
    systemicExamsSplit = systemicExams.split(",");
    console.log("systemicExamsSplit length", systemicExamsSplit.length);
    systemicdiseaseSets = [];
    clinicalInvestigations = [];
    console.log("clinicalInvestigation Query", req.query);
    disease = req.query.disease;
    diseaseSplit = disease.split(",");
    console.log("clinicalDisease split", diseaseSplit);
    await clinical
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        { $match: { disease: { $exists: true, $in: diseaseSplit } } },
                        {
                            $group: {
                                _id: null,
                                myfield: { $push: { $concat: ["$labtest", "#", "$meaning"] } },
                                uniqueIds: { $addToSet: "$_id" }
                            }
                        },
                        {
                            $project: { clinicalInvestigation: "$myfield" }
                        }
                    ]
                }
            }
        ])
        .then(clinicalInvestigation => {
            console.log(
                "ClinicalInvestiigation List after Systemic Exams",
                clinicalInvestigation[0].pageInfo[0].clinicalInvestigation
            );
            let removedDuplicateValues = [...new Set(clinicalInvestigation[0].pageInfo[0].clinicalInvestigation)];
            clinicalInvestigations = removedDuplicateValues.sort(
                function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                }
            );
            // res.json({ clinicalInvestigationSet: clinicalInvestigations });
        })
        .catch(err => {
            console.log({ msg: err.message });

        });

    if (systemicExams.length > 0) {
        await systemexams
            .aggregate([
                {
                    $facet: {
                        pageInfo: [
                            { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                            { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                            { $match: { sexnotpref: { $ne: req.query.gender } } },
                            { $match: { disease: { $exists: true, $in: diseaseSplit } } },
                            {
                                $match: {
                                    systemicexam: { $exists: true, $in: systemicExamsSplit }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    // valuesDiseasesAll: { $push: "$disease" },
                                    uniqueValuesDiseases: { $addToSet: "$disease" }
                                }
                            },

                            {
                                $project: {
                                    diseases: "$uniqueValuesDiseases",
                                    // alldiseases: "$valuesDiseasesAll",
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
                systemicdiseaseSets = diseases[0].pageInfo[0].diseases.sort(function (
                    a,
                    b
                ) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
                // alldiseasesSet = diseases[0].pageInfo[0].alldiseases;
                // finaldiseasesSets = finalDiseasesSet;
            })
            .catch(err => {
                console.log({ msg: err.message });
            });
    }
    console.log('systemicdiseaseSets', systemicdiseaseSets);
    return res.json({ clinicalInvestigationSet: clinicalInvestigations, systemicdiseaseSets: systemicdiseaseSets });
});


router.get('/getAilment', async (req, res) => {
    errMessage = '';
    clinicaldiseaseSets = [];
    clinicalDiseaseList = [];
    finaldiseaseSets = [];
    finaldiseaseSetsCount = {};
    finaldiseaseSetsSorted = [];
    console.log("clinicaldisease", req.query);
    if (req.query) {
        complaintdiseaseSets = req.query.GD.split(",");
        generaldiseaseSets = req.query.SD.split(",");
        systemicdiseaseSets = req.query.CD.split(",");
        if (complaintdiseaseSets[0] == '') { complaintdiseaseSets = []; };
        if (generaldiseaseSets[0] == '') { generaldiseaseSets = []; };
        if (systemicdiseaseSets[0] == '') { systemicdiseaseSets = []; };
    }
    clinicalInvestigation = req.query.clinicalInvestigation;
    clinicalInvestigationSplit = clinicalInvestigation.split(",");
    console.log("clinicalDisease split", clinicalInvestigationSplit);
    if (clinicalInvestigation.length > 0) {
        await clinical
            .aggregate([
                {
                    $facet: {
                        pageInfo: [
                            { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                            { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                            { $match: { sexnotpref: { $ne: req.query.gender } } },
                            {
                                $match: {
                                    labtest: { $exists: true, $in: clinicalInvestigationSplit }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    // valuesDiseasesAll: { $push: "$disease" },
                                    uniqueValuesDiseases: { $addToSet: "$disease" }
                                }
                            },

                            {
                                $project: {
                                    diseases: "$uniqueValuesDiseases"
                                    // alldiseases: "$valuesDiseasesAll",
                                }
                            }
                        ]
                    }
                }
            ])
            .then(clinicalDiseaseSet => {
                console.log(
                    "ClinicalInvestiigationDiseaseeeeee",
                    clinicalDiseaseSet[0].pageInfo[0]
                );
                clinicaldiseaseSets = clinicalDiseaseSet[0].pageInfo[0].diseases;
            })
            .catch(err => {
                console.log('errMessage', err.message);
                errMessage = err.message;
            });
    }

    finaldiseaseSets = finaldiseaseSets.concat(complaintdiseaseSets);
    finaldiseaseSets = finaldiseaseSets.concat(generaldiseaseSets);
    finaldiseaseSets = finaldiseaseSets.concat(systemicdiseaseSets);
    finaldiseaseSets = finaldiseaseSets.concat(clinicaldiseaseSets);

    finaldiseaseSets.forEach(function (i) {
        finaldiseaseSetsCount[i] = (finaldiseaseSetsCount[i] || 0) + 1;
    });

    console.log("complaintdiseaseSets", complaintdiseaseSets);
    console.log("generaldiseaseSets", generaldiseaseSets);
    console.log("systemicdiseaseSets", systemicdiseaseSets);
    console.log("clinicaldiseaseSets", clinicaldiseaseSets);
    console.log("finaldiseaseSets", finaldiseaseSets);
    console.log("finaldiseaseSetsCount", finaldiseaseSetsCount);
    finaldiseaseSetsSorted = Object.keys(finaldiseaseSetsCount).sort(function (a, b) {
        return finaldiseaseSetsCount[b] - finaldiseaseSetsCount[a];
    });
    console.log("finaldiseaseSetsSorted", finaldiseaseSetsSorted);

    return res.json({
        disease_final: finaldiseaseSetsSorted,
        msg: errMessage
        // clinicalDiseaseList: clinicalDiseaseList,
        // alldiseasesSet: alldiseasesSet
    });

});

router.get('/getMedicine', async (req, res) => {
    let medicineSet = [];
    let medicineSet1 = [];
    let msg = '';
    console.log("Disease List", req.query);
    let adviceSetArray = [];
    let advicesSet = [];
    let diseaseSet = req.query.dis;
    let diseaseSetSplit = diseaseSet.split(",");
    let furtherTreatmentsArray = [];
    let diagnosisSet = req.query.dis;
    let diagnosisSetArray = diagnosisSet.split(",");
    console.log("diseaseSetSplit", diseaseSetSplit);

    await medicines
        .aggregate([
            { $addFields: { userRef: { $toString: "$_id" } } },
            // { $match: { agelower: { $lte: parseInt(req.query.age) } } },
            // { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
            // { $match: { sexnotpref: { $ne: req.query.gender } } },
            // { $match: { weightupper: { $gte: parseInt(req.query.weight) } } },
            // { $match: { weightlower: { $lte: parseInt(req.query.weight) } } },
            { $match: { disease: { $exists: true, $in: diseaseSetSplit } } },
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
                            "$dose",
                            "#",
                            "$limits"
                        ]
                    }
                }
            },
            { $project: { _id: 0 } }
        ])
        .then(medicineList => {
            // console.log("Medicine List after Considering", medicineList);
            medicineList.forEach((item, index) => {
                medicineSet1.push(item.medicineList);
            });
            console.log("medicineSet1", medicineSet1);
            medicineSet = cleanMedicine(medicineSet1);
            // medicineSet = medicineList;
        })
        .catch(err => {
            msg = err.message;
        });

    await advices
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { disease: { $exists: true, $in: diseaseSetSplit } } },
                        {
                            $group: {
                                _id: null,
                                uniqueValuesAdvice: { $addToSet: "$advice" }
                            }
                        },
                        {
                            $project: {
                                adviceSet: "$uniqueValuesAdvice"
                            }
                        }
                    ]
                }
            }
        ])
        .then(adviceSet => {
            // console.log(adviceSet[0].pageInfo[0].adviceSet);
            if (adviceSet[0].pageInfo.length > 0) {
                for (let j = 0; j < adviceSet[0].pageInfo[0].adviceSet.length; j++) {
                    if (adviceSet[0].pageInfo[0].adviceSet[j] !== "undefined" && adviceSet[0].pageInfo[0].adviceSet[j] !== null) {
                        adviceSetArray.push(adviceSet[0].pageInfo[0].adviceSet[j]);
                    }
                }
            }
            console.log("Advice Set", adviceSetArray);
            advicesSet = adviceSetArray
            // res.json({adviceSet: adviceSet[0].pageInfo[0].adviceSet});
        })
        .catch(err => {
            msg = err.message;
        });

    await treatment
        .aggregate([
            { $match: { disease: { $exists: true, $in: diagnosisSetArray } } },
            { $project: { _id: 0, treatment: 1 } }
        ])
        .then(furtherTreatments => {
            for (let j = 0; j < furtherTreatments.length; j++) {
                // console.log("Before Cleaning", furtherTreatments[j]);
                // console.log("While Cleaning", furtherTreatments[j]);
                if (furtherTreatments[j].treatment !== "undefined") {
                    furtherTreatmentsArray.push(furtherTreatments[j].treatment);
                }
            }
            console.log("Further Treatment Details", furtherTreatmentsArray);
            // res.json({
            //   furtherTreatmentsArray
            // });
        })
        .catch(err => {
            msg = err.message;
        });


    return res.json({
        medicineList: medicineSet,
        // medicineSet: medicineSet,
        advicesSet: advicesSet,
        furtherTreatmentsArray: furtherTreatmentsArray,
        errMsg: msg
        // alldiseasesSet: alldiseasesSet
    });
});



router.get('/getAdvices', async (req, res) => {
    let adviceSetArray = [];
    let diseaseSet = req.query.disease;
    let diseaseSetSplit = diseaseSet.split(",");
    console.log(req.query.dis);
    let furtherTreatmentsArray = [];
    let diagnosisSet = req.query.disease;
    let diagnosisSetArray = diagnosisSet.split(",");
    console.log("diseaseSetSplit", diseaseSetSplit);
    await advices
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { disease: { $exists: true, $in: diseaseSetSplit } } },
                        {
                            $group: {
                                _id: null,
                                uniqueValuesAdvice: { $addToSet: "$advice" }
                            }
                        },
                        {
                            $project: {
                                adviceSet: "$uniqueValuesAdvice"
                            }
                        }
                    ]
                }
            }
        ])
        .then(adviceSet => {
            // console.log(adviceSet[0].pageInfo[0].adviceSet);
            if (adviceSet[0].pageInfo.length > 0) {
                for (let j = 0; j < adviceSet[0].pageInfo[0].adviceSet.length; j++) {
                    if (adviceSet[0].pageInfo[0].adviceSet[j] !== "undefined" && adviceSet[0].pageInfo[0].adviceSet[j] !== null) {
                        adviceSetArray.push(adviceSet[0].pageInfo[0].adviceSet[j]);
                    }
                }
            }
            console.log("Advice Set", adviceSetArray);
            // res.json({ adviceSet: adviceSetArray });
            // res.json({adviceSet: adviceSet[0].pageInfo[0].adviceSet});
        })
        .catch(err => {
            res.json({ msg: err.message });
        });


    await treatment
        .aggregate([
            { $match: { disease: { $exists: true, $in: diagnosisSetArray } } },
            { $project: { _id: 0, treatment: 1 } }
        ])
        .then(furtherTreatments => {
            for (let j = 0; j < furtherTreatments.length; j++) {
                console.log("Before Cleaning", furtherTreatments[j]);
                console.log("While Cleaning", furtherTreatments[j]);
                if (furtherTreatments[j].treatment !== "undefined") {
                    furtherTreatmentsArray.push(furtherTreatments[j]);
                }
            }
            console.log("Further Treatment Details", furtherTreatmentsArray);
            // res.json({
            //   furtherTreatmentsArray
            // });
        })
        .catch(err => {
            res.status(500).send({
                msg: err.message
            });
        });
    res.json({ adviceSet: adviceSetArray, furtherTreatmentsArray: furtherTreatmentsArray });

});

router.get('/furtherTreatment', async (req, res) => {
    console.log(req.query.dis);
    let furtherTreatmentsArray = [];
    let diagnosisSet = req.query.dis;
    let diagnosisSetArray = diagnosisSet.split(",");
    await treatment
        .aggregate([
            { $match: { disease: { $exists: true, $in: diagnosisSetArray } } },
            { $project: { _id: 0, treatment: 1 } }
        ])
        .then(furtherTreatments => {
            for (let j = 0; j < furtherTreatments.length; j++) {
                console.log("Before Cleaning", furtherTreatments[j]);
                console.log("While Cleaning", furtherTreatments[j]);
                if (furtherTreatments[j].treatment !== "undefined") {
                    furtherTreatmentsArray.push(furtherTreatments[j]);
                }
            }
            console.log("Further Treatment Details", furtherTreatmentsArray);
            res.json({
                furtherTreatmentsArray
            });
        })
        .catch(err => {
            res.status(500).send({
                msg: err.message
            });
        });
});

module.exports = router;
