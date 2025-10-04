// get Form Details routes

const express = require('express');
const router = express.Router();
const moduleFiles = require('../models/model');
const degrees = moduleFiles.degrees;
const specializations = moduleFiles.specializations;
const currency = moduleFiles.currency;

router.get('', async (req, res) => {
    degrees.find({}).then(response => {
        console.log('degree response..', response);
        specializations.find({}).then(response1 => {
            console.log('specialization response..', response1);
            currency.find({}).then(response2 => {
                console.log('currency.........', response2);
                res.json({ degreeList: response, specializationList: response1, currency: response2 });
            });

        });

    });
});
module.exports = router;