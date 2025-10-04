//dataAuthController
const express = require('express');
const router = express.Router();
// const passport
const Bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const customerModel = require('../models/customer.model')
const moduleFiles = require('../../backend/models/model');
const users = moduleFiles.users;
const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates').EmailTemplate;
const path = require('path');
const Promise = require('bluebird');
const country = moduleFiles.countries;
let toUser = [
  {
    name: '',
    email: '',
    genRandomNumb: '',
    authenticationKey: ''
  }
];

// router.post('/login', function (req, res) {

//     passport.authenticate('local', function (err, user, info) {
//         var token;

//         // If Passport throws/catches an error
//         if (err) {
//             res.status(404).json(err);
//             return;
//         }

//         // If a user is found
//         if (user) {
//             token = user.generateJwt();
//             res.status(200);
//             res.json({
//                 "token": token
//             });
//         } else {
//             // If user is not found
//             res.status(401).json(info);
//         }
//     })(req, res);

// });

// router.post('', async function (req, res) {
//     // console.log('Register',req.body);
//     let collectionNamed = eval(req.headers.referer.split('list/')[1]);
//     let totalCount;
//     // if(!req.body.name || !req.body.email || !req.body.password) {
//     //   sendJSONresponse(res, 400, {
//     //     "message": "All fields required"
//     //   });
//     //   return;
//     // }

//     // var user = new users();

//     // user.name = req.body.name;
//     // user.email = req.body.email;

//     // user.setPassword(req.body.password);
//     var newArry = {
//         basicInfo: {
//             userType: 'medicalOfficer',
//             name: 'Raja serfoji',
//             gender: 'Male'
//         }, doctorsAtttributes: {
//             specialization: 'Cardiology',
//             primaryMobile: '123',
//             primaryEmail: 'aa@gmail.com'
//         }
//     };

//     await users.aggregate([
//         { $match: { userType: "doctorSpecialist" } },
//         { $count: "userType" }
//     ]).then(usersResponse => {
//         console.log(usersResponse[0].userType);
//         this.totalCount = usersResponse[0].userType + 1;
//     }).catch(error => {
//         console.log(error);
//     })
//     var reqInfo = req.body.data;
//     console.log(req.query.password, "req.query.password");
//     let hashValue = Bcrypt.hashSync(req.query.password, Bcrypt.genSaltSync(10));
//     reqInfo['userId'] = "CDOC" + this.totalCount;
//     // console.log(reqInfo);
//     const collect = new collectionNamed(req.body.data);
//     eval(collect).save(function (err) {
//         // var token;
//         // token = user.generateJwt();
//         // res.status(200);
//         // res.json({
//         //   "token" : token
//         // });
//         res.json({
//             "token": "success"
//         });
//     });

// });

router.post('/login', async (req, res) => {
  var usernameVble = '';
  var passwordVble = '';
  let validated = false;

  if (req.body.username) {
    usernameVble = String(req.body.username);
  }
  if (req.body.password) {
    passwordVble = req.body.password;
  }
  console.log('req.body', req.body);
  // let statusData =  await login.find({username:usernameVble}, function(err, data){
  // 	console.log("ResponseData", data.length, err);
  //       // return data;
  //   }).limit(1);

  users
    .find({$and:[{ authenticationKey: usernameVble },{userType:"admin"}]})
    .then(getUser => {
      console.log(getUser, 'getUser');
      if (getUser.length == 0) {
        // console.log("User not found with this id " + usernameVble);

        res.json({
          error: 'User Not Found',
          message: 'User not found with this Email ' + usernameVble
        });
      }
      if (getUser.length > 0) {
        // console.log("User Exist!",getUser[0].password);
        let isValid = Bcrypt.compareSync(
          passwordVble,
          getUser[0].authenticationValue
        );
        // console.log(isValid);
        if (isValid) {
          var userData = { username: '', password: '' };
          userData = {
            username: getUser[0].authenticationKey,
            password: getUser[0].authenticationValue
          };
          var token = jwt.sign({ userData: userData }, 'secretkey');
          // console.log("tokenGen", token);
          res.json({ token: token });
        } else {
          res.json({
            error: 'Invalid credentials',
            message: 'Something was wrong. Check your Username and Password'
          });
        }
      }
    })
    .catch(err => {
      console.log('loginError', err);
      res.json({ error: 'login Error' });
    });

  // let statusData =  await login.find({username:usernameVble}, function(err, data){
  //         return data;
  //    }).limit(1);
});

function getRandomInt_6() {
  return Math.floor(Math.random() * Math.floor(2176782335));
}
function getRandomInt_5() {
  return Math.floor(Math.random() * Math.floor(60466176));
}

function loadTemplate(templateName, contexts) {
  let template = new EmailTemplate(
    path.join(__dirname, 'templates', templateName)
  );
  return Promise.all(
    contexts.map(context => {
      console.log('context', context);
      return new Promise((resolve, reject) => {
        template.render(context, (err, result) => {
          if (err) reject(err);
          else resolve({ email: result, context });
        });
      });
    })
  );
}

router.post('/register', async function (req, res) {
  console.log('req.body..test', req.body);
  console.log('req.body.dbName', req.body.dbName);
  let countryCode = '';
  let genderCode = '';
  let collectionNamed = req.body.dbName;
  let saveCO_Details = false;
  var reqInfo = req.body.data;
  let COID;
  // let collectionNamed = eval(req.headers.referer.split('list/')[1]);
  // let totalUsersCount;

  // await country.find({ country: req.body.data }).then(country => {
  //   console.log('country', country);
  //   countryCode = country[0].code;
  // });

  let genRandomNumb_6 = getRandomInt_6().toString(36).toUpperCase();
  genRandomNumb_6.padStart(6, '0');
  // let genRandomNumb_5 = getRandomInt_5().toString(36).toUpperCase();
  // genRandomNumb_5.padStart(5, '0');

  if (reqInfo.gender === 'Male'){
    reqInfo['userImageURL'] =
      'http://52.14.30.0:3000/images/defaultDoc/male_doctor.png';
      genderCode = '1';
  }
  else{
    reqInfo['userImageURL'] =
      'http://52.14.30.0:3000/images/defaultDoc/female_doctor.png';
      genderCode = '2';
  }




  // await eval(collectionNamed)
  //   .aggregate([
  //     { $match: { userType: 'practitioner' } },
  //     { $count: 'userType' }
  //   ])
  //   .then(usersResponse => {
  //     console.log(usersResponse[0].userType);
  //     totalUsersCount = usersResponse[0].userType + 1;
  //   })
  //   .catch(error => {
  //     console.log(error);
  //   });

  await country.find({ country: reqInfo.country }).then(country => {
    console.log('country', country);
    countryCode = country[0].code;
  });
  console.log('genRandomNumb', genRandomNumb_6);
  let hashValue = Bcrypt.hashSync(genRandomNumb_6, Bcrypt.genSaltSync(10));
  
  console.log('req.body.data....doctorRegistration...', reqInfo);

  do {
    let genRandomNumb_coId = getRandomInt_6().toString(36).toUpperCase();
    genRandomNumb_coId.padStart(6, '0');
    COID = 'Z' + countryCode + genderCode + genRandomNumb_coId
    await users.find({ authenticationKey: COID }).then(count => {
      if (count.length > 0) {
        saveCO_Details = false;
      } else {
        saveCO_Details = true;
      }
    });
  } while (!saveCO_Details);

  reqInfo['authenticationKey'] = COID;
  reqInfo['authenticationValue'] = hashValue;
  reqInfo['userType'] = 'practitioner';
  reqInfo['userSignatureURL'] = 'http://52.14.30.0:3000/images/defaultDoc/sign.png'
  // set expiry date for 7 days from the date of registration
  reqInfo['expiryDate'] = new Date(
    new Date().getTime() + 7 * 24 * 60 * 60 * 1000
  );
  reqInfo['primaryEmail'] = reqInfo["primaryEmail"].toUpperCase();
  reqInfo['ppspFlag'] = '00';
  reqInfo['userActivation']='activate';

  users.findOne( {$or:[{ "primaryMobile": reqInfo.primaryMobile},{"primaryEmail":reqInfo.primaryEmail}]})
  .then(userFound => {
    console.log('userFoundTest',userFound);
    if(userFound){
      res.json({msg:'Mobile Number or EmailId already exists'});
    }
    else if(!userFound){

      const collect = new users(reqInfo);
      console.log(collect, 'req.body.data');
      collect.save().then(userDetails => {
        console.log('saved userDetails Details...', userDetails);
        console.log('toUser[0] Details...', toUser[0]);
        toUser[0].name = userDetails.name;
        toUser[0].email = userDetails.primaryEmail;
        toUser[0].genRandomNumb = genRandomNumb_6;
        toUser[0].authenticationKey = userDetails.authenticationKey;
    
        console.log('toUser', toUser[0]);
    
        var smtpTrans = nodemailer.createTransport({
          host: 'mail.ruahtech.com',
          port: 465,
          secure: true,
          auth: {
            user: 'clipssupport@ruahtech.com',
            pass: '$p5Zg-s)1CuS'
          }
        });
    
        console.log('step 3');
        loadTemplate('registration', toUser).then(results => {
          console.log(JSON.stringify(results, null, 4));
    
          return Promise.all(
            results.map(results => {
              smtpTrans.sendMail(
                {
                  from: "'CLIPS SUPPORT' <clipssupport@ruahtech.com>",
                  to: userDetails.primaryEmail,
                  subject: results.email.subject,
                  html: results.email.html,
                  text: results.email.text
                },
                function (err) {
                  console.log('sent');
                }
              );
            })
          );
        });
    
        res.json({
          msg: 'success'
        });
      });
    }
  })
  


});

module.exports = router;
