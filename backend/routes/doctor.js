//doctorController

const express = require('express');
const router = express.Router();
const modulefiles = require('../models/model');

const users = modulefiles.users;
const degrees = modulefiles.degrees;
const specializations = modulefiles.specializations;
const subscription = modulefiles.subscriptions;


router.get('/getDoctorsList', async (req, res) => {
    await users
        .find({ 'authenticationKey': { $ne: req.query.doctorId } })
        .then(doctorsList => {
            console.log("doctorsList", doctorsList);
            let doctorsListArray = [];
            doctorsList.forEach((item, index) => {
                const tempArray = {};
                tempArray["doctorId"] = item.authenticationKey;
                tempArray["name"] = item.name;
                tempArray["specialization"] = item.specialization;
                tempArray["designation"] = item.designation;
                doctorsListArray.push(tempArray);
            });
            res.json({
                doctorsListArray
            });
        })
        .catch(err => {
            res.status(500).send({
                msg: err.message
            });
        });
});


router.get('/getDoctorDetails', async (req, res) => {
    let doctorsDetailsAll = [];
    let degreesAll = [];
    let specializationsAll = [];
    console.log("req.query.doctorId", req.query.doctorId);
    await users
        .find({ 'authenticationKey': req.query.doctorId }, { authenticationValue: 0, _id: 0 })
        .then(doctorsDetails => {
            console.log(" >>>>>>>>>", doctorsDetails);
            doctorsDetailsAll = doctorsDetails;
        })
        .catch(err => {
            console.log('doctorsDetailsAll err.msg:', err.message);
        });

    await degrees
        .find({}, { _id: 0 })
        .then(degreesList => {
            console.log("degreesList", degreesList);
            degreesAll = degreesList;
        })
        .catch(err => {
            console.log('degreesAll err.msg:', err.message);
        });

    await specializations
        .find({}, { _id: 0 })
        .then(specializationsList => {
            console.log("specializationsList", specializationsList);
            specializationsAll = specializationsList;
        })
        .catch(err => {
            console.log("specializationsAll err.msg:", err.message);
        });

    return res.json({
        doctorsDetails: doctorsDetailsAll,
        degreesList: degreesAll,
        specializationsList: specializationsAll
    });
});

router.get('/getDegree', async (req, res) => {
    await degrees
        .find({})
        .then(degreesList => {
            console.log("doctorsList", degreesList);
            res.json({
                degreesList
            });
        })
        .catch(err => {
            res.status(500).send({
                msg: err.message
            });
        });
});

router.get('/getSpecialization', async (req, res) => {
    await specializations
        .find({})
        .then(specializationsList => {
            console.log("doctorsList", specializationsList);
            res.json({
                specializationsList
            });
        })
        .catch(err => {
            res.status(500).send({
                msg: err.message
            });
        });
});


router.put('/updateDoctorDetails', async (req, res) => {
    console.log(req.body, "req.body");
    let doctorDetails = req.body.doctorDetails;
    doctorDetails.authenticationKey = req.body.authenticationKey;

    // name: ['', [Validators.required, Validators.maxLength(30), Validators.minLength(3)]],
    // specialization: ['', Validators.required],
    // degree: ['', Validators.required],
    // college: ['', Validators.required],
    // completionYear: ['', Validators.required],
    // experienceYear: ['', Validators.required],
    // consultantFee: ['', Validators.required],
    // primaryEmail: ['', [Validators.maxLength(64), Validators.email, Validators.minLength(8)]],
    // primaryMobile: ['', [Validators.required, Validators.maxLength(12)]],
    // secondaryEmail: ['', [Validators.maxLength(64), Validators.email, Validators.minLength(8)]],
    // secondaryMobile: ['', [Validators.required, Validators.maxLength(12)]],

    console.log(doctorDetails.name, "this.dateOfBirth");
    await users
        .updateOne(
            { authenticationKey: doctorDetails.authenticationKey },
            {
                $set: {
                    name: doctorDetails.name,
                    specialization: doctorDetails.specialization,
                    degree: doctorDetails.degree,
                    college: doctorDetails.college,
                    completionYear: doctorDetails.completionYear,
                    experienceYear: doctorDetails.experienceYear,
                    consultantFee: doctorDetails.consultantFee,
                    primaryEmail: doctorDetails.primaryEmail,
                    primaryMobile: doctorDetails.primaryMobile,
                    secondaryEmail: doctorDetails.secondaryEmail,
                    secondaryMobile: doctorDetails.secondaryMobile
                }
            }
        )
        .then(updated => {
            console.log("Details Updated", updated);
            if (updated.nModified === 1) {
                // let getPatientDetail = getPatientDetails(patientDetails._id);
                res.status(200).send({
                    msg: "Success"
                    // patientDetails: getPatientDetail
                });
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

router.put('/updateDoctorDetailsWeb', async (req, res) => {
    let doctorDetails = JSON.parse(req.body.doctorDetails)[0];
    console.log(doctorDetails.authenticationKey, "req.body.autoId");

    await users
        .updateOne(
            { authenticationKey: doctorDetails.authenticationKey },
            {
                $set: {
                    name: doctorDetails.name,
                    gender: doctorDetails.gender,
                    primaryMobile: doctorDetails.primaryMobile,
                    secondaryMobile: doctorDetails.secondaryMobile,
                    primaryEmail: doctorDetails.primaryEmail,
                    secondaryEmail: doctorDetails.secondaryEmail,
                    consultantFee: doctorDetails.consultantFee,
                    // specialization: doctorDetails.specialization,
                    // degree: doctorDetails.degree
                }
            }
        )
        .then(updated => {
            console.log("Details Updated", updated);
            if (updated.nModified === 1) {
                // let getPatientDetail = getPatientDetails(patientDetails._id);
                res.status(200).send({
                    msg: "Success"
                    // patientDetails: getPatientDetail
                });
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


router.get('/getSubscription', async function (req, res) {
    console.log("getSubscription", req.query);
    try {
        await subscription
            .find({ planCode: req.query.planCode })
            .then(subscriptionDetails => {
                console.log("subscriptionDetailssss", subscriptionDetails);
                res.json({ subscriptionDetails: subscriptionDetails });
            })
            .catch(error => {
                console.log("There was an error : %s", error);
            });
    } catch (e) {
        console.log("There was an errorss : %s", e);
        res.json({ error: "There was an error" });
    }
});

module.exports = router;