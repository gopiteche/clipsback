// data Controller

const express = require('express');
const router = express.Router();
const modulefiles = require('../models/model');


const tempcomplaints = modulefiles.tempcomplaints;


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
  
router.get('', async (req, res) => {
    console.log(req.headers);
    page_from = 0;
    pageSize = 5;
    col_name = "_id";
    col_value = 1; // 1 - Asc, (-1) for Dec
    const collectionNamed = req.headers.referer.split("list/")[1];
    console.log(collectionNamed);
    console.log(req.query);
    if (req.query.page_from) {
        page_from = parseInt(req.query.page_from);
    }
    if (req.query.pageSize) {
        pageSize = parseInt(req.query.pageSize);
    }
    if (req.query.col_name) {
        col_name = req.query.col_name;
    }
    if (req.query.col_value) {
        if (req.query.col_value == "desc") {
            col_value = -1;
        }
    }
    //     await eval(collectionNamed).countDocuments(function(err, countValue) {
    //         console.log('Count iss '  + countValue);
    //    });

    await eval(collectionNamed)
        .aggregate([
            {
                $facet: {
                    data: [
                        { $skip: page_from },
                        { $limit: pageSize },
                        { $sort: { [col_name]: col_value } }
                    ],
                    pageInfo: [{ $group: { _id: null, count: { $sum: 1 } } }]
                }
            }
        ])
        .then(complaint => {
            res.json(complaint);
        })
        .catch(err => {
            res.status(500).send({
                msg: err.message
            });
        });
});


router.post('', (req, res) => {
    let collectionNamed = eval(req.headers.referer.split("list/")[1]);
    let datajson = req.body.data;
    console.log(datajson);
    const collectionNamed2 = new collectionNamed(datajson);
    eval(collectionNamed2)
        .save()
        .then(data => {
            res.json(data);
        })
        .catch(err => {
            res.status(500).json({
                msg: err.message
            });
        });
});


router.put('', async (req, res) => {
    let collectionNamed = req.headers.referer.split("list/")[1];
    let datajson = req.body.data;
    console.log(datajson);
    console.log(collectionNamed);
    // Find customer and update it
    await eval(collectionNamed)
        .findByIdAndUpdate(datajson._id, req.body.data, { new: true })
        .then(updateField => {
            if (!updateField) {
                return res.status(404).json({
                    msg: "Data not found with id " + datajson._id
                });
            }
            res.json(updateField);
        })
        .catch(err => {
            if (err.kind === "ObjectId") {
                return res.status(404).json({
                    msg: "Data not found with id " + datajson._id
                });
            }
            return res.status(500).json({
                msg: "Error updating data with this id " + datajson._id
            });
        });
});

router.delete('/:Id', async (req, res) => {
    let collectionNamed = req.headers.referer.split("list/")[1];
    console.log(req.params);
    eval(collectionNamed)
        .findByIdAndRemove(req.params.Id)
        .then(deletedata => {
            if (!deletedata) {
                return res.status(404).json({
                    msg: "Data not found with id " + req.params.Id
                });
            }
            res.json({ msg: "Data deleted successfully!" });
        })
        .catch(err => {
            if (err.kind === "ObjectId" || err.name === "NotFound") {
                return res.status(404).json({
                    msg: "Data not found with id " + req.params.Id
                });
            }
            return res.status(500).json({
                msg: "Could not delete Data with id " + req.params.Id
            });
        });
});

router.post('/bulkuploads', async (req, res) => {
    let collectionNamed = eval(req.headers.referer.split("list/")[1]);
    var getData = await eval(collectionNamed)
        .insertMany(req.body.data)
        .then(general => {
            // console.log(general);
            res.json(general);
        })
        .catch(err => {
            res.json({
                msg: err.message
            });
        });
    console.log("getDataaaa-->>", getData);
    res.json("Success");
});

router.get('/search', async (req, res) => {
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
            console.log('complainints list...', complaint);
            console.log('complainints list...', complaint[0].pageInfo);
            cleanUndefined(complaint[0].pageInfo[0]);
            console.log("complaintLength", complaint[0].pageInfo[0]['site'].length);
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




module.exports = router;