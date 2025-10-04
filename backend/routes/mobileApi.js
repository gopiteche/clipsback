// mobileApi Controller

const express = require('express');
const router = express.Router();
const modulefiles = require('../models/model');

const complaints = modulefiles.complaints;
const generalexams = modulefiles.generalexams;
const systemexams = modulefiles.systemexams;
const medicines = modulefiles.medicines;
const advices = modulefiles.advices;
const treatment = modulefiles.treatment;

router.get('/diseaseApi', async (req, res) => {
    diseasesSet = [];
    // sampleParse = [];

    sample = req.query.complaint;

    sampleSplit = JSON.parse(sample);
    // if(obj.hasOwnProperty("key"))
    console.log(sampleSplit);
    // console.log(sampleSplit.length);
    for (let i = 0; i < sampleSplit.length; i++) {
        keyJsonArray = [];
        console.log(sampleSplit[i].extent);
        // sampleParse[i] = JSON.parse(sampleSplit[i]);
        aggfactor = "undefined";
        duration = "undefined";
        frequency = "undefined";
        history = "undefined";
        nature = "undefined";
        onset = "undefined";
        relfactor = "undefined";
        severity = "undefined";
        site = "undefined";
        extent = "undefined";

        if (sampleSplit[i].aggfactor) {
            aggfactor = JSON.parse(sampleSplit[i].aggfactor);
        }
        if (sampleSplit[i].duration) {
            duration = JSON.parse(sampleSplit[i].duration);
        }
        if (sampleSplit[i].extent) {
            extent = JSON.parse(sampleSplit[i].extent);
        }
        if (sampleSplit[i].frequency) {
            frequency = JSON.parse(sampleSplit[i].frequency);
        }
        if (sampleSplit[i].history) {
            history = JSON.parse(sampleSplit[i].history);
        }
        if (sampleSplit[i].nature) {
            nature = JSON.parse(sampleSplit[i].nature);
        }
        if (sampleSplit[i].onset) {
            onset = JSON.parse(sampleSplit[i].onset);
        }
        if (sampleSplit[i].relfactor) {
            relfactor = JSON.parse(sampleSplit[i].relfactor);
        }
        if (sampleSplit[i].severity) {
            severity = sampleSplit[i].severity;
        }
        if (sampleSplit[i].site) {
            site = JSON.parse(sampleSplit[i].site);
        }
        console.log(typeof duration, "typeof duration");
        console.log(
            "ENtriessssssssssssssssssssss",
            aggfactor,
            duration,
            extent,
            frequency,
            history,
            nature,
            onset,
            relfactor,
            severity,
            site
        );

        await complaints
            .aggregate([
                {
                    $facet: {
                        pageInfo: [
                            { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                            { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                            { $match: { sexnotpref: { $ne: req.query.gender } } },
                            { $match: { complaints: sampleSplit[i].complaint } },
                            {
                                $match: {
                                    $and: [
                                        { site: site },
                                        { aggfactor: aggfactor },
                                        { duration: duration },
                                        { extent: extent },
                                        { frequency: frequency },
                                        { history: history },
                                        { nature: nature },
                                        { onset: onset },
                                        { relfactor: relfactor },
                                        { severity: severity }
                                    ]
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
                // alldiseasesSet = alldiseasesSet.concat(diseases[0].pageInfo[0].alldiseases);
                // complainitdiseaseSets = diseasesSet;
            })
            .catch(err => {
                console.log(err.message);
            });
    }
    complaintdiseaseSets = [...new Set(diseasesSet)];
    console.log("Consolidated Diseases", complaintdiseaseSets);

    await generalexams
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        { $match: { disease: { $in: complaintdiseaseSets } } },
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
            generalexamsSet = generalexams[0].pageInfo[0].generalexams.sort(function (
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
        diseaseSet: diseasesSet
        // alldiseasesSet: alldiseasesSet
    });
});


router.get('/generaldiseaseApi', async (req, res) => {
    systemicDiseasesSet = [];
    systemicexamsSet = [];
    var responseData = JSON.parse(req.query.resultSet);
    console.log("Hai", req.query);
    console.log("selectedDiseaseSet", responseData[1].diseaseSet);
    console.log("selectedGeneralExamsSet", responseData[0].generalExamsSet);

    console.log(
        "generalExamsSetLength",
        JSON.parse(responseData[0].generalExamsSet).length
    );
    if (JSON.parse(responseData[0].generalExamsSet).length > 0) {
        await generalexams
            .aggregate([
                {
                    $facet: {
                        pageInfo: [
                            { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                            { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                            { $match: { sexnotpref: { $ne: req.query.gender } } },
                            // { $match: { disease: { $exists: true, $in: JSON.parse(responseData[1].diseaseSet) } } },
                            {
                                $match: {
                                    generalexam: {
                                        $exists: true,
                                        $in: JSON.parse(responseData[0].generalExamsSet)
                                    }
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
                                    generalexamcount: { $size: "$uniqueValuesDiseases" }
                                }
                            }
                        ]
                    }
                }
            ])
            .then(diseases => {
                console.log("Disease List after Considering General Exams");
                systemicDiseasesSet = diseases[0].pageInfo[0].diseases;
                // res.json(diseases);
            })
            .catch(err => {
                console.log("D", err.message);
                res.status(500).send({
                    msg: err.message
                });
            });
    } else {
        systemicDiseasesSet = JSON.parse(responseData[1].diseaseSet);
    }
    // let dup = [...new Set(systemicDiseasesSet)];
    console.log("systemicDiseasesSet", systemicDiseasesSet);
    await systemexams
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        {
                            $match: { disease: { $exists: true, $in: systemicDiseasesSet } }
                        },
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
            console.log("syssss", systemicexams);
            // res.json(generalexams);
            systemicexamsSet = systemicexams[0].pageInfo[0].systemicexams.sort(
                function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                }
            );
        })
        .catch(err => {
            // res.status(500).send({
            //     msg: err.message
            // });
            console.log(err.message);
        });
    console.log({
        systemicExamsSet: systemicexamsSet,
        systemicDiseaseSet: systemicDiseasesSet
    });
    return res.json({
        systemicExamsSet: systemicexamsSet,
        systemicDiseaseSet: systemicDiseasesSet
    });
});

router.get('/systemicdiseaseApi', async (req, res) => {
    var finalDiseasesSet = [];
    var responseData = JSON.parse(req.query.resultSet);
    console.log(responseData, "systemicdiseaseApi");
    console.log("selectedSysytemicExam", responseData[0].systemicExamsSet);

    await systemexams
        .aggregate([
            {
                $facet: {
                    pageInfo: [
                        { $match: { agelower: { $lte: parseInt(req.query.age) } } },
                        { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
                        { $match: { sexnotpref: { $ne: req.query.gender } } },
                        {
                            $match: {
                                disease: {
                                    $exists: true,
                                    $in: JSON.parse(responseData[1].diseaseSet)
                                }
                            }
                        },
                        {
                            $match: {
                                systemicexam: {
                                    $exists: true,
                                    $in: JSON.parse(responseData[0].systemicExamsSet)
                                }
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
            finalDiseasesSet = diseases[0].pageInfo[0].diseases.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
        })
        .catch(err => {
            console.log(err.message);
            res.status(500).send({
                msg: err.message
            });
        });

    return res.json({ finalDiseasesSet: finalDiseasesSet });
});


router.get('/medicineApi', async (req, res) => {
    let medicineSet = [];

    console.log("req.query", req.query);
    var responseData = JSON.parse(req.query.resultSet);
    // console.log('Diseasesssss', responseData[0].finalDiseaseList);
    var testtee = responseData[0].finalDiseaseList;
    // console.log(typeof testtee);
    // sample = req.query.dis;
    // sampleSplit = sample.split(',');
    let adviceSetArray = [];
    let advicesSet = [];
    let diseaseSetSplit = JSON.parse(responseData[0].finalDiseaseList);
    // let diseaseSetSplit = diseaseSet.split(",");
    let furtherTreatmentsArray = [];
    let diagnosisSetArray = JSON.parse(responseData[0].finalDiseaseList);
    // let diagnosisSetArray = diagnosisSet.split(",");

    await medicines
        .aggregate([
            { $addFields: { userRef: { $toString: "$_id" } } },
            // { $match: { agelower: { $lte: parseInt(req.query.age) } } },
            // { $match: { ageupper: { $gte: parseInt(req.query.age) } } },
            // { $match: { sexnotpref: { $ne: req.query.gender } } },
            // { $match: { weightupper: { $gte: parseInt(req.query.weight) } } },
            // { $match: { weightlower: { $lte: parseInt(req.query.weight) } } },
            {
                $match: {
                    disease: {
                        $exists: true, $in: JSON.parse(responseData[0].finalDiseaseList)
                    }
                }
            },
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
            console.log(medicineList);
            medicineList.forEach((item, index) => {
                medicineSet.push(item.medicineList);
            });
            console.log({ medicineList: medicineSet });
            // res.json({ medicineList: medicineSet });
        })
        .catch(err => {
            console.log(err.message);
            res.status(500).send({
                msg: err.message
            });
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
                    furtherTreatmentsArray.push(furtherTreatments[j].treatment);
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


    return res.json({
        medicineList: medicineSet,
        advicesSet: advicesSet,
        furtherTreatmentsArray: furtherTreatmentsArray
        // alldiseasesSet: alldiseasesSet
    });
});

module.exports = router;