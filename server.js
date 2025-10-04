// Server for CLIPS by Ruah

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const moduleFiles = require('./backend/models/model');
const users = moduleFiles.users;
const cron = require('node-cron');
const env = require('./env.json');
const paymentCronJob = moduleFiles.paymentCronJob;
const billings = moduleFiles.billings;

const RazorPay = require('razorpay');
const razorPay = new RazorPay({

  key_id: env.razorPay_key_id,
  key_secret: env.razorPay_key_secret
});


function checkInvoice(req,res,next) {
  console.log('checkInvoice..test');
  next();
}



app.use('/images',checkInvoice, express.static(__dirname+'/images'));
app.use('/reportfiles',checkInvoice, express.static(__dirname+'/reportfiles'));
app.use('/prescription',checkInvoice, express.static(__dirname+'/prescription'));
app.use('/assets',checkInvoice, express.static(__dirname+'/assets'));
app.use('/invoices', checkInvoice, express.static(__dirname+'/invoices'));
app.use('/bills',checkInvoice,express.static(__dirname+'/bills'));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  next();
});

app.set('trust proxy', 1); // trust first proxy
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  })
);
// app.use(passport.initialize()); // passport initialize middleware
// app.use(passport.session());

// Configuring the database

const dbConfig = require('./backend/config/mongodb.config.js');
const mongoose = require('mongoose');

// let customermodel = require('./model.js');

mongoose.Promise = global.Promise;

// Connecting to the database

mongoose
  .connect(dbConfig.url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch(err => {
    console.log('Could not connect to MongoDB.');
    process.exit();
  });

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

//using cors operation.
app.use(cors());

const server = app.listen(3000, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log('host...', host);

  console.log('App listening at http://%s:%s', host, port);
});


function checkJWT(req, res, next) {
  console.log('headers test with JSONWEb token...', req.headers);
  console.log('checkJWT works...', req.body);
  try {
    var decoded = jwt.verify(req.headers.authorization.split(" ")[1], 'Rajaserfoji');
    console.log('testDexoded test...', decoded.userData.username.split("-")[0]);
    console.log('accessToken test...', req.headers.authorization.split(" ")[1]);
    users.findOne({ $and: [{ authenticationKey: decoded.userData.username.split("-")[0] }, { accessKey: req.headers.authorization.split(" ")[1] }, { userActivation: 'activate' }] }).then(userFound => {
      console.log('userFoundTest..', userFound);
      if (!userFound) {
        res.json({ jsonTokenID: 'invalid' });
      } else {
        next();
      }

    });

  }
  catch (err) {
    // err
    console.log('JWT token error..test');
    res.json({ jsonTokenID: 'invalid' });
  }


}
//declaration for all Controllers

const loginRoutes = require('./backend/routes/login');
const notificationRoutes = require('./backend/routes/notification');
const dataRoutes = require('./backend/routes/data');
const diagnosisRoutes = require('./backend/routes/diagnosis');
const mobileApiRoutes = require('./backend/routes/mobileApi');
const patientRoutes = require('./backend/routes/patient');
const doctorRoutes = require('./backend/routes/doctor');
const caseTransferRoutes = require('./backend/routes/caseTransfer');
const paymentRoutes = require('./backend/routes/payment');
const getFormDetailsRoutes = require('./backend/routes/getFormDetails');
const uploadImageRoutes = require('./backend/routes/uploadImage');
const subscriptionRoutes = require('./backend/routes/subscription');
const billRoutes = require('./backend/routes/bill');


//declaration for all adminControllers

const dataAuthRoutes = require('./adminBackend/routes/dataAuthRoutes');
const databaseRoutes = require('./adminBackend/routes/databaseRoutes');
const dataAdminRoutes = require('./adminBackend/routes/dataRoutes');
const searchRoutes = require('./adminBackend/routes/searchRoutes');
const billingRoutes = require('./adminBackend/routes/billing');

//Routes for every Component

app.use('/api/login', loginRoutes);
app.use('/api/notification', checkJWT, notificationRoutes);
app.use('/api/data', checkJWT, dataRoutes);
app.use('/api/diagnosis', checkJWT, diagnosisRoutes);
app.use('/api/mobileApi', checkJWT, mobileApiRoutes);
app.use('/api/patient', checkJWT, patientRoutes);
app.use('/api/doctor', checkJWT, doctorRoutes);
app.use('/api/caseTransfer', caseTransferRoutes);
app.use('/api/payment', paymentRoutes);
// app.use('/my-api/payment',checkJWT, paymentRoutes);
app.use('/api/getFormDetails', getFormDetailsRoutes);
app.use('/api/uploadImage', uploadImageRoutes);
app.use('/api/subscriptions', checkJWT, subscriptionRoutes);
app.use('/api/bills',billRoutes)


//Routes for AdminComponent...

app.use('/api/admin/data', dataAdminRoutes);
app.use('/api/admin/dataAuth', dataAuthRoutes);
app.use('/api/admin/search', searchRoutes);
app.use('/api/admin/dataBase', databaseRoutes);
app.use('/api/admin/billing', billingRoutes)
// app.use('/api/admin/getDashboardDetails', databaseRoutes);

// const firebase = require('./backend/routes/fireBase').firebase;


// const firebaseToken = ['eIZ5VYbP9sI:APA91bHJNQ1zneF5QiCdCaVxzdpAbM228iV_z13cSwXxqeDhWu852hsxGyU3eLs6YJRA2oAUTjMoka0HuC8ulN5tLFiV-h8Dprq2cjgGzE0e0HIWX-r0kdGsClXxa1q5OqPSbSMPQZcN'];
// const payload = {
//   notification: {
//     title: 'Notification Title',
//     body: 'This is an example notification',
//   }
// };

// const options = require('./backend/routes/fireBase').options;


// firebase.messaging().sendToDevice(firebaseToken, payload, options).then(response => {
//   console.log('notification sent successfully',response);
// }).catch(e => {
//   console.log('error notification message...',e);
// });



const paymentRefund = cron.schedule('0 */2 * * *', () => {
  console.log('test payment refund...');

  paymentCronJob.find({}).sort({ _id: -1 }).then(cronJobFound => {
    console.log('Cron Job Found..test', cronJobFound);
    if (cronJobFound.length > 0) {
      console.log('latest data', cronJobFound[0]);
      const dummyPaymentTo = JSON.stringify(cronJobFound[0].paymentTo);
      console.log('dummyPaymentTo..test',typeof dummyPaymentTo,dummyPaymentTo);
      console.log('cronJobFound[0].paymentTo.getHours() + 2..test',typeof (cronJobFound[0].paymentTo.getHours() + 2),cronJobFound[0].paymentTo.getHours() + 2);
      console.log('parse date..dummy',typeof JSON.parse(dummyPaymentTo),JSON.parse(dummyPaymentTo));
      console.log('test.....dummy',new Date(new Date(JSON.parse(dummyPaymentTo)).setHours(12)));
      // paymentTo: new Date(new Date(JSON.parse(dummyPaymentTo)).setHours(cronJobFound[0].paymentTo.getHours() + 2))

      const newCronJob = paymentCronJob({
        startedAt: new Date(),
        paymentFrom: cronJobFound[0].paymentTo,
        paymentTo: new Date()
      });

      newCronJob.save().then( async cronJob => {
        console.log('new CRON JOB Details..', cronJob);
        console.log('cronJOB...paymentFrom', cronJob.paymentFrom, Math.floor(cronJob.paymentFrom.getTime() / 1000.0));
        console.log('cronJob..paymentTo...', cronJob.paymentTo, Math.floor(cronJob.paymentTo.getTime() / 1000.0));
        // const paymentTo = cronJob.paymentTo;
        const skipValue = 0;
        let stop = false;
        const payIdsArray = [];
        let array = [];

        // (function loop(i) {
        //   if(!stop){

        //     new Promise((resolve, reject) => {

        //       if(i<50){
        //         stop = true;
        //       }
        //       else {
        //         razorPay.payments.all({ from: Math.floor(cronJob.paymentFrom.getTime() / 1000.0), to: Math.floor(paymentTo.getTime() / 1000.0), count: 50, skip: i }).then(razorpayPaymentResponse => {
        //           console.log('razorPay Payment Response..cronJob..details', razorpayPaymentResponse,razorpayPaymentResponse.count);
        //           resolve();
        //         }).catch(err => {
        //           console.log('razorPay error Payment Cron Job Details...', err);
        //           reject();
        //         });
        //       }


        //       // setTimeout( () => {
        //       //     console.log(i);
        //       //     resolve();
        //       // }, Math.random() * 1000);
        //     }).then(loop.bind(null, i + 50));
        //   }

        // })(skipValue);
        const countValue = 2;

        async function loop(skipValue) {
          await razorPay.payments.all({ from: Math.floor(cronJob.paymentFrom.getTime() / 1000.0), to: Math.floor(cronJob.paymentTo.getTime() / 1000.0), count: countValue, skip: skipValue }).then(async razorpayPaymentResponse => {
            console.log('razorPay Payment Response..cronJob..details with count...', razorpayPaymentResponse.count, razorpayPaymentResponse);

            if (razorpayPaymentResponse.count < countValue) {
              console.log('test..ifcondition in loop...', razorpayPaymentResponse.count);
               razorpayPaymentResponse.items.map(ele => {
                console.log('element..test..each item',ele.id);
                payIdsArray.push({id:ele.id,status:ele.status,paidAt:ele.created_at,order_id:ele.order_id});
              });
              // payIdsArray.push(razorpayPaymentResponse.items);
              console.log('total PayIds Array..testin if condition...process...completed', payIdsArray);
              // return payIdsArray;
            } else {
              console.log('test..elsecondition in loop...', razorpayPaymentResponse.count);
              // payIdsArray.push(razorpayPaymentResponse.items);
                razorpayPaymentResponse.items.map(ele => {
                console.log('element..test..each item',ele.id);
                payIdsArray.push({id:ele.id,status:ele.status,paidAt:ele.created_at,order_id:ele.order_id});
              });
              console.log('payIds test before recursive...',payIdsArray);
              await loop(skipValue + countValue)
            }
          }).catch(err => {
            console.log('razorPay error Payment Cron Job Details...', err);
          });
        }
        // razorPay.payments.all({ from: Math.floor(cronJob.paymentFrom.getTime() / 1000.0), to: Math.floor(paymentTo.getTime() / 1000.0), count: 100, skip: 0 }).then(razorpayPaymentResponse => {
        //   console.log('razorPay Payment Response..cronJob..details', razorpayPaymentResponse);
        // }).catch(err => {
        //   console.log('razorPay error Payment Cron Job Details...', err);
        // });
        // array = await loop(skipValue);
        // (async () => console.log(await loop(skipValue)))();
        // console.log('array retuirned...test....',await loop(skipValue));

       
        loop(skipValue).then(list => {
          console.log('test..list...response',list);
          console.log('test payIds array...',payIdsArray);

          
          var payId = ele => {
            return new Promise((resolve, reject) => {
              if(ele.status === 'captured'){
                billings.updateOne({$and:[{razorpay_order_id:ele.order_id},{status:'unpaid'}]},{$set:{status:'paid',razorpay_payment_id:ele.id,billPaidDate:new Date(ele.paidAt*1000)}}).then(payIdUpdated => {
                  console.log('payId updated..test',payIdUpdated);
                  resolve(payIdUpdated.nModified);
                });
              }
              else {
                reject('rejected');
              }
             
            });
          };

          var promises = payIdsArray.map(async ele => {
            var result = await payId(ele);
            return new Promise((res, rej) => {
              res(result);
            });
          });

          Promise.all(promises).then(updatedResults => {
            // userRecords.sort({_id:1});
            console.log("All promises", updatedResults);
            
          }).catch(err => {
            console.log('error response...',err);
          });;


        });
      });
    }
    else {
      console.log('payment From in else part..', new Date(new Date().setHours(new Date().getHours() + 2)));
      const firstCronJob = paymentCronJob({
        startedAt: new Date(),
        paymentFrom: new Date(new Date().setHours(new Date().getHours() - 2)),
        paymentTo: new Date()
      });

      firstCronJob.save().then(firstCronJobResponse => {
        console.log('firstCronJob Response...', firstCronJobResponse);

        console.log('cronJOB...paymentFrom', firstCronJobResponse.paymentFrom.getHours(), typeof firstCronJobResponse.paymentFrom.getTime() / 1000.0, firstCronJobResponse.paymentFrom.getTime() / 1000.0);
        const dummyPaymentFrom = firstCronJobResponse.paymentFrom;
        // console.log('cronJob...payment From - 2 hours...',new Date(dummyPaymentFrom.setHours(firstCronJobResponse.paymentFrom.getHours()-2)));
        // const paymentTo = new Date();
        // console.log('payment To...', paymentTo.getHours(), typeof paymentTo.getTime() / 1000.0, paymentTo.getTime() / 1000.0);
        // razorPay.payments.all({ from: Math.floor(firstCronJobResponse.paymentFrom.getTime() / 1000.0), to: Math.floor(paymentTo.getTime() / 1000.0), count: 100, skip: 0 }).then(razorpayPaymentResponse => {
        //   console.log('razorPay Payment Response..cronJob..details', razorpayPaymentResponse);
        // }).catch(err => {
        //   console.log('razorPay error Payment Cron Job Details...', err);
        // });
        let payIdsArray = [];
        const skipValue = 0;
        const countValue = 2;

        async function loop(skipValue) {
          await razorPay.payments.all({ from: Math.floor(firstCronJobResponse.paymentFrom.getTime() / 1000.0), to: Math.floor(firstCronJobResponse.paymentTo.getTime() / 1000.0), count: countValue, skip: skipValue }).then(async razorpayPaymentResponse => {
            console.log('razorPay Payment Response..cronJob..details with count...', razorpayPaymentResponse.count, razorpayPaymentResponse);

            if (razorpayPaymentResponse.count < countValue) {
              console.log('test..ifcondition in loop...', razorpayPaymentResponse.count);
               razorpayPaymentResponse.items.map(ele => {
                console.log('element..test..each item',ele.id);
                payIdsArray.push({id:ele.id,status:ele.status,paidAt:ele.created_at,order_id:ele.order_id});
              });
              // payIdsArray.push(razorpayPaymentResponse.items);
              console.log('total PayIds Array..testin if condition...process...completed', payIdsArray);
              // return payIdsArray;
            } else {
              console.log('test..elsecondition in loop...', razorpayPaymentResponse.count);
              // payIdsArray.push(razorpayPaymentResponse.items);
                razorpayPaymentResponse.items.map(ele => {
                console.log('element..test..each item',ele.id);
                payIdsArray.push({id:ele.id,status:ele.status,paidAt:ele.created_at,order_id:ele.order_id});
              });
              console.log('payIds test before recursive...',payIdsArray);
              await loop(skipValue + countValue)
            }
          }).catch(err => {
            console.log('razorPay error Payment Cron Job Details...', err);
          });
        }
        // razorPay.payments.all({ from: Math.floor(cronJob.paymentFrom.getTime() / 1000.0), to: Math.floor(paymentTo.getTime() / 1000.0), count: 100, skip: 0 }).then(razorpayPaymentResponse => {
        //   console.log('razorPay Payment Response..cronJob..details', razorpayPaymentResponse);
        // }).catch(err => {
        //   console.log('razorPay error Payment Cron Job Details...', err);
        // });
        // array = await loop(skipValue);
        // (async () => console.log(await loop(skipValue)))();
        // console.log('array retuirned...test....',await loop(skipValue));
        loop(skipValue).then(list => {
          console.log('test..list...response',list);
          console.log('test payIds array...',payIdsArray);


          var payId = ele => {
            return new Promise((resolve, reject) => {
              if(ele.status === 'captured'){
                billings.updateOne({$and:[{razorpay_order_id:ele.order_id},{status:'unpaid'}]},{$set:{status:'paid',razorpay_payment_id:ele.id,billPaidDate:new Date(ele.paidAt*1000)}}).then(payIdUpdated => {
                  console.log('payId updated..test',payIdUpdated);
                  resolve(payIdUpdated.nModified);
                });
              }
              else {
                reject('rejected');
              }
             
            });
          };

          var promises = payIdsArray.map(async ele => {
            var result = await payId(ele);
            return new Promise((res, rej) => {
              res(result);
            });
          });

          Promise.all(promises).then(updatedResults => {
            // userRecords.sort({_id:1});
            console.log("All promises", updatedResults);
            
          }).catch(err => {
            console.log('error response...',err);
          });
        });


      });
    }
  });


  // razorPay.payments.refund('pay_Du2jl0E6By0q43', { amount: 100, notes: [] }).then(refundResponse => {
  //   console.log('refundResponse..test', refundResponse);
  //   res.json(refundResponse);
  // }).catch(err => {
  //   console.log('error..response', err);
  // });



  // order Details...with createdAt...

  // razorPay.orders.all().then(orderLists => {
  //   console.log('orders list test...',orderLists);
  // }).catch(err => {
  //   console.log('err test...console...',err);
  // });
});

paymentRefund.start();





// const paymentRefund = cron.schedule('* * * * *', () => {
//     console.log('test payment refund...');
//     razorPay.payments.all({count:100,skip:50}).then(allPayments => {
//       console.log('allPayments list...',allPayments);
//     }); 
//   });

//   paymentRefund.start();











// (function loop(i) {
//   if (i < 10) new Promise((resolve, reject) => {
//     setTimeout(() => {

//       newArray.push(i);
//       resolve(i);
//     }, Math.random() * 1000);
//   }).then(result => {
//     console.log(result);
//     loop.bind(null, i + 1)
// })
// }) (0);
