//searchController
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

router.get('/complaints', async (req, res) => {
  console.log('enters');
  if (req.query.searchString.length > 0) {
    if (req.query.searchString) {
      searchString = '^' + req.query.searchString;
    } else {
      searchString = '';
    }
    // console.log(req.query.searchString);
    col_name = 'complaints';
    col_value = 1; // 1 - Asc, (-1) for Dec
    collectionNamed = 'complaints';
    await complaints
      .aggregate([
        {
          $facet: {
            pageInfo: [
              { $match: { complaints: new RegExp(searchString, 'mi') } },
              {
                $group: {
                  _id: null,
                  uniqueValuesSite: { $addToSet: '$site' },
                  uniqueValuesComplaints: { $addToSet: '$complaints' }
                }
              },

              {
                $project: {
                  complaints: '$uniqueValuesComplaints',
                  sitecount: { $size: '$uniqueValuesSite' }
                }
              }
            ]
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
  } else {
    return false;
  }
});

router.get('/searchComplaints', async (req, res) => {
  searchString = '';
  searchString = req.query.searchString;
  collectionNamed = 'complaints';
  console.log(searchString);

  await complaints
    .aggregate([
      {
        $facet: {
          pageInfo: [
            { $match: { complaints: searchString } },
            {
              $group: {
                _id: null,
                uniqueValuesSite: { $addToSet: '$site' },
                uniqueValuesSeverity: { $addToSet: '$severity' },
                uniqueValuesExtent: { $addToSet: '$extent' },
                uniqueValuesNature: { $addToSet: '$nature' },
                uniqueValuesAggfactor: { $addToSet: '$aggfactor' },
                uniqueValuesRelfactor: { $addToSet: '$relfactor' },
                uniqueValuesOnset: { $addToSet: '$onset' },
                uniqueValuesFrequency: { $addToSet: '$frequency' },
                uniqueValuesDuration: { $addToSet: '$duration' },
                uniqueValuesHistory: { $addToSet: '$history' },
                uniqueValuesDisease: { $addToSet: '$disease' }
              }
            },

            {
              $project: {
                site: '$uniqueValuesSite',
                severity: '$uniqueValuesSeverity',
                extent: '$uniqueValuesExtent',
                nature: '$uniqueValuesNature',
                aggfactor: '$uniqueValuesAggfactor',
                relfactor: '$uniqueValuesRelfactor',
                onset: '$uniqueValuesOnset',
                frequency: '$uniqueValuesFrequency',
                duration: '$uniqueValuesDuration',
                history: '$uniqueValuesHistory',
                disease: '$uniqueValuesDisease',
                sitecount: { $size: '$uniqueValuesSite' }
              }
            }
          ]
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

router.get('/partialSearch', async (req, res) => {
  console.log('req..test...', req.query);
  console.log('req.test...params...', req.params);
  let searchString = '^' + req.query.searchstring;
  let collectionNamed = req.query.dbName;
  // let collectionNamed = req.headers.referer.split('list/')[1];
  console.log(collectionNamed, 'Step1');
  /* Dynamic search(Must keep fields as string data type */
  let keyJsonArray = [];
  await eval(collectionNamed)
    .findOne()
    .then(collectionNamed => {
      const jsonobject = JSON.parse(JSON.stringify(collectionNamed));
      for (var key in jsonobject) {
        if (jsonobject.hasOwnProperty(key)) {
          keyJsonArray.push(key);
        }
      }
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });

  var jsonStr = '';
  var indexk = 0;
  var arrayData = [];
  for (var k = 0; k < keyJsonArray.length; k++) {
    if (keyJsonArray[k] != '_id' && keyJsonArray[k] != '__v') {
      if (k < keyJsonArray.length) {
        if (indexk == 0) {
          //check here
          arrayData.push({ [keyJsonArray[k]]: new RegExp(searchString, 'i') });
          // arrayData.push({ [keyJsonArray[k]]: req.query.searchstring });
        } else {
          arrayData.push({ [keyJsonArray[k]]: new RegExp(searchString, 'i') });
          // arrayData.push({ [keyJsonArray[k]]: req.query.searchstring });
        }
        indexk++;
      }
    }
  }
  console.log(arrayData, 'Step2');
  eval(collectionNamed)
    .aggregate([
      {
        $facet: {
          data: [
            { $match: { $or: arrayData } },
            // { $match: {count:}}
            { $skip: parseInt(req.query.page_from) },
            { $limit: parseInt(req.query.pageSize) }
          ],
          pageInfo: [
            { $match: { $or: arrayData } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                dataset: { $addToSet: '$_id' }
              }
            },
            { $project: { count: { $size: '$dataset' } } }
          ]
        }
      }
    ])
    .then(collectionNamed => {
      console.log(collectionNamed);
      res.json(collectionNamed);
    })
    .catch(err => {
      res.status(500).send({
        msg: err.message
      });
    });
});

// router.get('/partialSearch', async (req, res) => {
//   let collectionNamed = req.headers.referer.split('list/')[1];
//   //   let collectionNamed = 'users';

//   console.log(collectionNamed, 'Step1');
//   /* Dynamic search(Must keep fields as string data type */
//   let keyJsonArray = [];
//   await eval(collectionNamed)
//     .findOne()
//     .then(collectionNamed => {
//       const jsonobject = JSON.parse(JSON.stringify(collectionNamed));
//       for (var key in jsonobject) {
//         if (jsonobject.hasOwnProperty(key)) {
//           keyJsonArray.push(key);
//         }
//       }
//     })
//     .catch(err => {
//       res.status(500).send({
//         msg: err.message
//       });
//     });

//   var jsonStr = '';
//   var indexk = 0;
//   var arrayData = [];
//   for (var k = 0; k < keyJsonArray.length; k++) {
//     if (keyJsonArray[k] != '_id' && keyJsonArray[k] != '__v') {
//       if (k < keyJsonArray.length) {
//         if (indexk == 0) {
//           //check here
//           arrayData.push({
//             [keyJsonArray[k]]: new RegExp(req.query.searchstring, 'i')
//           });
//         } else {
//           arrayData.push({
//             [keyJsonArray[k]]: new RegExp(req.query.searchstring, 'i')
//           });
//         }
//         indexk++;
//       }
//     }
//   }
//   console.log(arrayData, 'Step2');
//   eval(collectionNamed)
//     .aggregate([
//       {
//         $facet: {
//           data: [
//             { $match: { $or: arrayData } },
//             // { $match: {count:}}
//             { $skip: parseInt(req.query.page_from) },
//             { $limit: parseInt(req.query.pageSize) }
//           ],
//           pageInfo: [
//             { $match: { $or: arrayData } },
//             {
//               $group: {
//                 _id: null,
//                 count: { $sum: 1 },
//                 dataset: { $addToSet: '$_id' }
//               }
//             },
//             { $project: { count: { $size: '$dataset' } } }
//           ]
//         }
//       }
//     ])
//     .then(collectionNamed => {
//       console.log(collectionNamed);
//       res.json(collectionNamed);
//     })
//     .catch(err => {
//       res.status(500).send({
//         msg: err.message
//       });
//     });
// });

router.get('/search', async (req, res) => {
  searchString = '';
  searchString = req.query.searchString;
  collectionNamed = 'complaints';
  console.log(searchString);

  await complaints
    .aggregate([
      {
        $facet: {
          pageInfo: [
            { $match: { complaints: searchString } },
            {
              $group: {
                _id: null,
                uniqueValuesSite: { $addToSet: '$site' },
                uniqueValuesSeverity: { $addToSet: '$severity' },
                uniqueValuesExtent: { $addToSet: '$extent' },
                uniqueValuesNature: { $addToSet: '$nature' },
                uniqueValuesAggfactor: { $addToSet: '$aggfactor' },
                uniqueValuesRelfactor: { $addToSet: '$relfactor' },
                uniqueValuesOnset: { $addToSet: '$onset' },
                uniqueValuesFrequency: { $addToSet: '$frequency' },
                uniqueValuesDuration: { $addToSet: '$duration' },
                uniqueValuesHistory: { $addToSet: '$history' },
                uniqueValuesDisease: { $addToSet: '$disease' }
              }
            },

            {
              $project: {
                site: '$uniqueValuesSite',
                severity: '$uniqueValuesSeverity',
                extent: '$uniqueValuesExtent',
                nature: '$uniqueValuesNature',
                aggfactor: '$uniqueValuesAggfactor',
                relfactor: '$uniqueValuesRelfactor',
                onset: '$uniqueValuesOnset',
                frequency: '$uniqueValuesFrequency',
                duration: '$uniqueValuesDuration',
                history: '$uniqueValuesHistory',
                disease: '$uniqueValuesDisease',
                sitecount: { $size: '$uniqueValuesSite' }
              }
            }
          ]
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

module.exports = router;
