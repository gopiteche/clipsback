const express = require('express');
const router = express.Router();
const modulefiles = require('../models/model');
const users = modulefiles.users;
var replaceColor = require('replace-color')
var Jimp = require('jimp');
const baseURL = require('../../env.json').baseURL;

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
    console.log('Req..body in multer..folderName', file.originalname.split('_')[0]);

    let path = `./images/${file.originalname.split('_')[0]}`;
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

router.put('', multer({ storage: storage }).array('images', 2), async (req, res) => {
  console.log('check upload router test file...', req.files);
  console.log('check upload router test body...', req.body);
  let profileImage = '';
  let signatureImage = '';
  for (let file of req.files) {
    console.log('file test...', file);
    if (file.originalname.split('_')[1] === 'ProfilePic') {
      profileImage = `${baseURL}images/` + file.originalname.split('_')[0] + '/' + file.filename;
    }
    else if (file.originalname.split('_')[1] === 'SignaturePic') {

      console.log('baseUrl...', baseURL);
      // `${baseURL}'images/'${file.originalname.split('_')[0]}/${file.filename}`
      console.log('images...foleder..', baseURL + 'images/' + file.originalname.split('_')[0] + '/' + file.filename);
      Jimp.read(baseURL + 'images/' + file.originalname.split('_')[0] + '/' + file.filename, (err, ram) => {
        console.log('test jimp read..test', ram);
        if (err) throw err;

        ram.resize(512, 128)
        ram.quality(60)
        ram.greyscale()
        ram.rgba(true)
        ram.contrast(0.5)
        // sign.color([
        //   {apply:'tint',params:[190]}
        // ])
        ram.write(__dirname+`/images/${file.originalname.split('_')[0]}/${file.filename}`, function () {
          replaceColor({
            image: __dirname+`/images/${file.originalname.split('_')[0]}/${file.filename}`,
            colors: {
              type: 'rgb',
              targetColor: [255, 255, 255],
              replaceColor: [255, 255, 255, 0]
            },
            deltaE: 10
          })
            .then((jimpObject) => {
              jimpObject.write(`./images/${file.originalname.split('_')[0]}/${file.filename.split('.')[0]}.png`, (err) => {
                if (err) return console.log(err)

                fs.remove(`./images/${file.originalname.split('_')[0]}/${file.filename}`, err => {
                  if (err) return console.error(err)

                  console.log('success!')
                })

                signatureImage = `${baseURL}images/` + file.originalname.split('_')[0] + '/' + file.filename.split('.')[0] + '.png';
                console.log('test signature image', signatureImage);
                users.updateOne({ authenticationKey: req.body.doctorId }, { $set: { userImageURL: profileImage, userSignatureURL: signatureImage, ppspFlag: '11' } }).then(imageUploadedResponse => {
                  console.log('imageUploadedResponse..test', imageUploadedResponse);

                  res.json({ msg: 'imageUploaded' });
                });
              })
            })
            .catch((err) => {
              console.log(err)
            })

        })



      });

    }
  }
  //   userImageURL: String,


});



module.exports = router;