const modulefiles = require('../models/model');
const Bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
// const login = modulefiles.login;
const users = modulefiles.users;
const patients = modulefiles.patients;
const userlogs = modulefiles.userlogs;

const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const multer = require('multer');
// const path = require('path');
let fs = require('fs-extra');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error('Invalid mime type');
    console.log('invaid..eror...');
    if (isValid) {
      error = null;
      console.log('error,.....nulll......', error);
    }
    // let type = req.body.type;
    // console.log('type...', type);
    // console.log('Req..body in multer..folderName', file.originalname);
    console.log('Req..body in multer..folderName', file.originalname);

    let path = `./images/${file.originalname}`;
    fs.mkdirsSync(path);

    cb(error, path);
    // http://52.14.30.0:3000/backend/images/doctor_profile-pic
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .split(' ')
      .join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});

router.post('', async (req, res) => {
  console.log('test loginController works...');
  // console.log(req.headers, "headers Orgin");
  var usernameVble = '';
  var passwordVble = '';
  let validated = false;

  if (req.body.username) {
    usernameVble = String(req.body.username).toUpperCase();
  }
  if (req.body.password) {
    passwordVble = req.body.password;
  }
  console.log(usernameVble);
  // let statusData =  await login.find({username:usernameVble}, function(err, data){
  // 	console.log("ResponseData", data.length, err);
  //       // return data;
  //   }).limit(1);

  users
    .find({ $and: [{ $or: [{ authenticationKey: usernameVble }, { primaryMobile: usernameVble }, { primaryEmail: usernameVble }] }, { userType: 'practitioner' }] })
    .then(getUser => {
      console.log(getUser[0], 'getUser');
      if (getUser.length == 0) {
        // console.log("User not found with this id " + usernameVble);
        // res.statusCode()
        return res.json({
          error: 'User Not Found',
          message: 'User not found with this ID ' + usernameVble
        });
      }

      if (getUser.length > 0) {
        if (getUser[0].userActivation === 'activate') {

          console.log(getUser[0]['level'], 'getUserLevel');

          // console.log("User Exist!",getUser[0].password);
          let isValid = Bcrypt.compareSync(
            passwordVble,
            getUser[0].authenticationValue
          );
          console.log('check isValid..test', isValid);
          if (isValid) {
            const newUserLogs = new userlogs({
              officerID: usernameVble,
              loggedIn: new Date()
            });
            newUserLogs.save().then(response => {
              console.log('userLogs response...', response);
            });

            var userData = { username: '' };
            userData = {
              username: getUser[0].authenticationKey + '-' + new Date()
            };
            var token = jwt.sign({ userData: userData }, 'Rajaserfoji');

            var accessProd = true;

            // accessProd will be chnaged to false if subscription module required.
            if (getUser[0].expiryDate - new Date() < 0) {
              accessProd = true;
            }
            console.log('doctorLevel', getUser[0].level);
            // console.log("User Data", getUser[0]);
            users.updateOne({ $or: [{ authenticationKey: usernameVble }, { primaryMobile: usernameVble }, { primaryEmail: usernameVble }] }, { $set: { accessKey: token } }).then(tokenUpdated => {
              console.log('tokenUpdated Successfully...', tokenUpdated);

              res.status(200).json({
                statuscode:200,
                message:'token verified',
                authStatus: true,
                name: getUser[0].name,
                designation: getUser[0].designation,
                doctorId: getUser[0].authenticationKey,
                token: token,
                accessProd: accessProd,
                docLevel: getUser[0].level,
                gender: getUser[0].gender,
                userImageURL: getUser[0].userImageURL,
                userSignatureURL: getUser[0].userSignatureURL,
                ppspFlag: getUser[0].ppspFlag
              });
            });

          } else {
            const newUserLogs = new userlogs({
              officerID: usernameVble,
              failedToLoggedIn: new Date()
            });
            newUserLogs.save().then(response => {
              console.log('user failed logs response...', response);
              res.json({
                error: 'Invalid credentials',
                message: 'Something went wrong. Check your ID and Password'
              });
            });
          }
        }else{
          return res.json({error:'userBlocked',message:'Your account blocked, Please contact CLIPS support Team.'})
        }

      }
    })
    .catch(err => {
      // console.log("loginError",err);
      res.json({ error: 'Invalid credentials', message: 'Invalid credentials' });
    });

  // let statusData =  await login.find({username:usernameVble}, function(err, data){
  //         return data;
  //    }).limit(1);
});

router.post(
  '/profilePic',
  multer({ storage: storage }).single('image'),
  async (req, res) => {
    console.log(
      'req.body...multer test doctorID... received in body',
      req.body
    );
    console.log('doctor Id...test .doctorId..', req.body.doctorId);
    console.log('req.body...multer test', req.file);
    const url = req.protocol + '://' + req.get('host');
    users
      .updateOne(
        { authenticationKey: req.body.doctorId },
        {
          $set: {
            userImageURL:
              url + '/images/' + req.file.originalname + '/' + req.file.filename
          }
        }
      )
      .then(response => {
        console.log(response);

        users
          .findOne({ authenticationKey: req.body.doctorId })
          .then(response => {
            console.log(response);
            res.json({ profilePicResponse: response, msg: 'success' });
          });
      });

    // res.json({ msg: 'success' });
  }
);
// patientProfilePic

router.post(
  '/patientProfilePic',
  multer({ storage: storage }).single('image'),
  async (req, res) => {
    console.log('req.body...multer test', req.body);
    console.log('doctor Id...test', req.body.patientId);
    console.log('req.body...multer test', req.file);
    const url = req.protocol + '://' + req.get('host');
    patients
      .updateOne(
        { patientId: req.body.patientId },
        {
          $set: {
            patientImageURL:
              url + '/images/' + req.file.originalname + '/' + req.file.filename
          }
        }
      )
      .then(response => {
        console.log(response);

        patients.findOne({ patientId: req.body.patientId }).then(response => {
          console.log('patientProfilePic response', response);
          res.json({ patientProfilePicResponse: response, msg: 'success' });
        });
      });

    // res.json({ msg: 'success' });
  }
);

router.post('/changePassword', async (req, res) => {
  console.log('request body...', req.body);
  var hashValue = '';

  // try {
  //     var decodedToken = jwt.verify(
  //         req.body.token,
  //         'password_should_be_longer'
  //     );
  // } catch (err) {
  //     console.log('json web token error..', err);
  //     return res.json({ err: err });
  // }

  console.log('test');
  // console.log('decodedToken...', decodedToken);
  users.findOne({ authenticationKey: req.body.doctorId }).then(getUser => {
    console.log('userResponse...', getUser);
    let isValid = Bcrypt.compareSync(
      req.body.userData.oldPassword,
      getUser.authenticationValue
    );
    console.log('isValid...', isValid);
    console.log('...req.body..password...', req.body.userData);
    if (isValid) {
      console.log('isvalid....in function...', isValid);
      hashValue = Bcrypt.hashSync(
        req.body.userData.newPassword,
        Bcrypt.genSaltSync(10)
      );
      users
        .updateOne(
          { authenticationKey: req.body.doctorId },
          { $set: { authenticationValue: hashValue } }
        )
        .then(response => {
          console.log(response);
          res.json({ msg: 'success' });
        });
    } else if (!isValid) {
      res.json({ response: 'password invalid' });
    }
  });
});

router.post('/generatePasswordToken', async (req, res) => {
  console.log('req.body....', req.body);
  var input = req.body.doctorId;
  console.log('input', input);

  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(6, function (err, buf) {
          var token = buf.toString('hex');
          console.log('token generated for forgot password', token);
          done(err, token);
        });
      },

      function (token, done) {
        // users.find

        users
          .updateOne(
            {
              $and: [
                { primaryEmail: req.body.emailId },
                { authenticationKey: req.body.doctorId }
              ]
            },

            {
              $set: {
                resetPasswordToken: token,
                resetPasswordExpires: Date.now() + 3600000
              }
            }
          )
          .then(response => {
            console.log('response : ' + response);

            users
              .findOne({
                $and: [
                  { primaryEmail: req.body.emailId },
                  { authenticationKey: req.body.doctorId }
                ]
              })
              .then((user, err) => {
                if (!user) {
                  res.json({ msg: 'error' });
                }
                console.log('user', user);
                console.log('error', err);
                done(err, token, user);
              });
          });
      },
      function (token, user, done) {
        console.log('step 2');
        console.log('user', user);
        console.log(
          'user primaryEmail...',
          typeof user.primaryEmail,
          user.primaryEmail
        );

        var smtpTrans = nodemailer.createTransport({
          host: 'mail.ruahtech.com',
          port: 465,
          secure: true,
          auth: {
            user: 'clipssupport@ruahtech.com',
            pass: '$p5Zg-s)1CuS'
          }
        });
        var mailOptions = {
          from: 'clipssupport@ruahtech.com',
          to: user.primaryEmail,
          subject: 'Clips Password Reset',
          text:
            'You are receiving this email because you have requested the password reset for your CLIPS account.\n\n' +
            'Please copy and paste the below verification code to reset your password.\n\n' +
            token +
            '\n\n' +
            'If you did not request for password reset, please ignore this email. Your password will remain unchanged.\n'
        };
        console.log('step 3');

        smtpTrans.sendMail(mailOptions, function (err) {
          console.log('sent');
        });
        done('done');
      }
    ],
    function (done) {
      console.log('this done' + ' ' + done);
      res.json({ msg: 'success' });
    }
  );
});
router.post('/matchPasswordToken', async (req, res) => {
  console.log('test 123');
  console.log('body', req.body);
  users
    .findOne({
      $and: [
        { resetPasswordToken: req.body.userData },
        { authenticationKey: req.body.doctorId }
      ]
    })
    .then(response => {
      console.log(response);
      if (response) {
        res.json({ msg: 'success', userDetails: response });
      } else {
        res.json({ msg: 'error' });
      }
    });
});
router.post('/forgotPassword', async (req, res) => {
  console.log('request', req.body);
  console.log('token', req.body.token);
  console.log('password', req.body.userData);
  hashValue = '';
  hashValue = Bcrypt.hashSync(req.body.userData, Bcrypt.genSaltSync(10));
  users
    .findOne({
      resetPasswordToken: req.body.token,
      resetPasswordExpires: { $gt: Date.now() }
    })
    .then(response => {
      console.log(response);
      if (response) {
        users
          .updateOne(
            {
              resetPasswordToken: req.body.token
            },
            {
              $set: {
                authenticationValue: hashValue
              }
            }
          )
          .then(response => {
            console.log(response);
            users
              .updateOne(
                { resetPasswordToken: req.body.token },
                { $unset: { resetPasswordToken: '', resetPasswordExpires: '' } }
              )
              .then(response => {
                console.log(response);
              });
          });
        res.json({ msg: 'success' });
      } else {
        console.log('successfully redirected...');
        res.json({ msg: 'token-expired' });
      }
    });
});

module.exports = router;
