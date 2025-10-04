const express = require('express');
const router = express.Router();
const modulefiles = require('../models/model');
const subscription = modulefiles.subscriptions;
const users = modulefiles.users;

router.get('',async(req,res) => {
    console.log('req..for subscription..',req.query);
    subscription.find({}).then(subscriptionResponse => {
      
        console.log('subscription Response...test',subscriptionResponse);
        res.json(subscriptionResponse);
    });


});

module.exports = router;