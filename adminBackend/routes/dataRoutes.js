//dataController
const express = require('express');
const router = express.Router();
const moduleFiles = require('../../backend/models/model');
const complaints = moduleFiles.complaints;
const generalexams = moduleFiles.generalexams;
const systemexams = moduleFiles.systemexams;
const medicines = moduleFiles.medicines;
const caseTransfer = moduleFiles.casetransfers;
const advices = moduleFiles.advices;
const clinical = moduleFiles.clinical;
const treatment = moduleFiles.treatment;
const users = moduleFiles.users;
const userRoles = moduleFiles.userRoles;

router.get('', async (req, res) => {
  console.log('params..', req.params);
  console.log('query...', req.query);
  // console.log('database name', req.params.dbName);
  // console.log('page from..test', req.params.pageFrom);
  // console.log('page to..test', req.params.pageSize);
  const dbName = req.query.dbName;
  // const page_from = req.params.pageFrom;
  // const pageSize = req.params.pageSize;

  // if (req.query.page_from) {
  //   page_from = parseInt(req.query.page_from);
  // }
  // if (req.query.pageSize) {
  //   pageSize = parseInt(req.query.pageSize);
  // }

  // const page_from = 10;
  // const pageSize = 5;
  // console.log(req.headers);

  // var checkToken = verifyToken(req);

  // console.log("AuthToken",checkToken);

  page_from = '';
  pageSize = '';
  // col_name = '_id';
  // col_value = 1; // 1 - Asc, (-1) for Dec
  // console.log('req url test...', req.headers.referer);
  // const collectionNamed = req.headers.referer.split('list/')[1];
  // console.log('receviedCollectionName', collectionNamed);
  // console.log('test request.query...', req.query);
  if (req.query.pageFrom) {
    page_from = parseInt(req.query.pageFrom);
  }
  if (req.query.pageSize) {
    pageSize = parseInt(req.query.pageSize);
  }
  // if (req.query.col_name) {
  //   col_name = req.query.col_name;
  // }
  // if (req.query.col_value) {
  //   if (req.query.col_value == 'desc') {
  //     col_value = -1;
  //   }
  // }

  try {
    // await eval(collectionNamed)
    //   .aggregate([
    //     {
    //       $facet: {
    //         data: [{ $skip: page_from }, { $limit: pageSize }],
    //         pageInfo: [{ $group: { _id: null, count: { $sum: 1 } } }]
    //       }
    //     }
    //   ])

    // { disease: 1, complaints: 1, nature: 1, site: 1 }

    await eval(dbName)
      .aggregate([
        {
          $facet: {
            data: [{ $skip: page_from }, { $limit: pageSize }],
            pageInfo: [{ $group: { _id: null, count: { $sum: 1 } } }]

          }
        }
      ]).sort({ _id: 1 })

      //   .find({})
      .then(complaint => {
        console.log('////////////////////', complaint);
        res.json(complaint);
      })
      .catch(error => {
        console.log('There was an errorss : %s', error.detail);
      });
  } catch (e) {
    //console.log('entr',e);
    console.log('There was an error in catch : %s', e);
    res.json({ error: 'There was an errorsss' });
    // return;
    // if (e instanceof ReferenceError) {
    //   // Output expected ReferenceErrors.
    //   console.log(e);
    // } else {
    //   // Output unexpected Errors.
    //   console.log(e, false);
    // }
  }
});

// router.get('', async (req, res) => {
//   console.log('query', req.params);
//   console.log('database name', req.params.dbName);
//   const dbName = req.params.dbName;
//   // console.log(req.headers);

//   // var checkToken = verifyToken(req);

//   // console.log("AuthToken",checkToken);

//   page_from = 0;
//   pageSize = 0;
//   col_name = '_id';
//   col_value = 1; // 1 - Asc, (-1) for Dec
//   console.log('req url test...', req.headers.referer);
//   const collectionNamed = req.headers.referer.split('list/')[1];
//   console.log('receviedCollectionName', collectionNamed);
//   console.log('test request.query...', req.query);
//   if (req.query.page_from) {
//     page_from = parseInt(req.query.page_from);
//   }
//   if (req.query.pageSize) {
//     pageSize = parseInt(req.query.pageSize);
//   }
//   if (req.query.col_name) {
//     col_name = req.query.col_name;
//   }
//   if (req.query.col_value) {
//     if (req.query.col_value == 'desc') {
//       col_value = -1;
//     }
//   }

//   try {
//     await eval(collectionNamed)
//       .aggregate([
//         {
//           $facet: {
//             data: [{ $skip: page_from }, { $limit: pageSize }],
//             pageInfo: [{ $group: { _id: null, count: { $sum: 1 } } }]
//           }
//         }
//       ])
//       // eval(dbName)
//       // .find({})
//       .then(complaint => {
//         console.log('////////////////////', complaint);
//         res.json(complaint);
//       })
//       .catch(error => {
//         console.log('There was an errorss : %s', error.detail);
//       });
//   } catch (e) {
//     //console.log('entr',e);
//     console.log('There was an error in catch : %s', e);
//     res.json({ error: 'There was an errorsss' });
//     // return;
//     // if (e instanceof ReferenceError) {
//     //   // Output expected ReferenceErrors.
//     //   console.log(e);
//     // } else {
//     //   // Output unexpected Errors.
//     //   console.log(e, false);
//     // }
//   }
// });

router.post('', (req, res) => {
  let collectionNamed = eval(req.body.dbName);
  // let collectionNamed = eval(req.headers.referer.split('list/')[1]);

  let datajson = req.body.data;
  console.log(datajson);

  const collectionNamed2 = new collectionNamed(datajson);
  console.log('collectionNamed2...', eval(collectionNamed2));
  eval(collectionNamed2)
    .save()
    .then(data => {
      //   eval(collectionNamed).aggregate([
      //     {
      //     $facet: {
      //       data: [
      //       { $skip: 0 },
      //         { $limit: 5 },
      //         { $sort: { [col_name] : -1 } }
      //       ],
      //       pageInfo: [
      //         { $group: { _id: null, count: { $sum: 1 } } },
      //       ],
      //     },
      //   },
      // ])
      //   .then(complaint => {
      //       res.json(complaint);
      //   }).catch(err => {
      //       res.status(500).send({
      //           msg: err.message
      //       });
      //   });
      res.json(data);
    })
    .catch(err => {
      res.status(500).json({
        msg: err.message
      });
    });
});

router.put('', (req, res) => {
  // let collectionNamed = eval(req.headers.referer.split('list/')[1]);
  let datajson = req.body.data;
  let dbName = req.body.dbName;
  console.log(datajson, 'TESTEEEE');
  // Find customer and update it
  eval(dbName)
    .findByIdAndUpdate(datajson._id, req.body.data, { new: true })
    .then(updateField => {
      if (!updateField) {
        return res.status(404).json({
          msg: 'Data not found with id ' + datajson._id
        });
      }
      res.json(updateField);
    })
    .catch(err => {
      if (err.kind === 'ObjectId') {
        return res.status(404).json({
          msg: 'Data not found with id ' + datajson._id
        });
      }
      return res.status(500).json({
        msg: 'Error updating data with id ' + datajson._id
      });
    });
});

// router.delete('/:Id', (req, res) => {
//   let collectionNamed = eval(req.headers.referer.split('list/')[1]);
//   collectionNamed
//     .findByIdAndRemove(req.params.Id)
//     .then(deletedata => {
//       if (!deletedata) {
//         return res.status(404).json({
//           msg: 'Data not found with id ' + req.params.Id
//         });
//       }
//       res.json({ msg: 'Data deleted successfully!' });
//     })
//     .catch(err => {
//       if (err.kind === 'ObjectId' || err.name === 'NotFound') {
//         return res.status(404).json({
//           msg: 'Data not found with id ' + req.params.Id
//         });
//       }
//       return res.status(500).json({
//         msg: 'Could not delete Data with id ' + req.params.Id
//       });
//     });
// });

router.delete('', (req, res) => {
  console.log('req.query..', req.query);
  console.log('dbDetails', eval(req.query.dbName));
  // let collectionNamed = eval(req.headers.referer.split('list/')[1]);
  // collectionNamed
  eval(req.query.dbName)
    .findByIdAndRemove(req.query.id)
    .then(deletedata => {
      if (!deletedata) {
        return res.status(404).json({
          msg: 'Data not found with id ' + req.query.id
        });
      }
      res.json({ msg: 'Data deleted successfully!' });
    })
    .catch(err => {
      if (err.kind === 'ObjectId' || err.name === 'NotFound') {
        return res.status(404).json({
          msg: 'Data not found with id ' + req.query.id
        });
      }
      return res.status(500).json({
        msg: 'Could not delete Data with id ' + req.query.id
      });
    });
});

router.post('/bulkuploads', async (req, res) => {
  console.log('getDataaaa-->>..req.data...', req.body);
  let collectionNamed = req.body.dbName;
  var getData = await eval(collectionNamed)
    .insertMany(req.body.data)
    .then(general => {
      console.log(general);
      res.json('success');
    })
    .catch(err => {
      console.log(err);
      // res.status(500).send({
      //     msg: err.message
      // });
    });
  console.log('getDataaaa-->>', getData);
  // res.json('Success');
});

module.exports = router;









// db.getCollection("patientshistories").aggregate([
//   {
//     $facet: {
//       "data": [{ $match: { visit: { $elemMatch: { doctor: 'ZIN1LD0FG9 - Babu' } } } },
      
//       $bucket:{"$groupBy": {
//           // "_id": '$_id',
//           "_id": null,
//           "count": { "$sum": { "$size": "$visit" } },
//           'totalVisitDetails': {
//             $push: {
//               'patientHistoryId': '$_id',
//               'visitDetails': "$visit",
//               'patientID': "$patientId",
//               'status': '$status',
//               "countVisit": { "$sum": { "$size": "$visit" } },
//               'patientName': '$patientName',
//             }
//           }
//         }
//       }]
      
//     }
//   }

//   // { $project: { officerName: 'COIN14J8IB - Arun.v', count: { '$toString':'$count' } } }
// ]);