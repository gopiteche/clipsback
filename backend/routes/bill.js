const express = require('express');
const router = express.Router();
const moduleFiles = require('../models/model');
const bills = moduleFiles.billings;
const monthlyBillsAttributes = moduleFiles.monthlyBillsAttributes;

router.get('', async (req, res) => {
    console.log('bills test....');
    bills.aggregate([
        {
            $facet: {
                billPaidResponse: [
                    {
                        $match: { coid: req.query.doctorId }

                    },
                    {
                        $match: { status: 'paid' }
                    },
                    {

                        $project: {
                            billNumber: { $cond: [{ $eq: ['$billPurpose', 'CaseTransfer Payment'] }, '-', '$billNumber'] },
                            amountPaid: '$billAmount',
                            status: 1,
                            billPaidDate: '$billPaidDate',
                            receiptNumber: '$receiptNumber',
                            receiptURL: '$receiptURL',
                            invoiceURL:'$invoiceURL'
                        }
                    }
                ],
                billunpaidResponse: [
                    {
                        $match: { coid: req.query.doctorId }
                    },
                    {
                        $match: { status: 'unpaid' }
                    },
                    {
                        $match: { billPurpose: 'MonthlyPayment' }
                    },
                    {
                        $project: {
                            billNumber: '$billNumber',
                            dueAmount: '$billAmount',
                            status: 1,
                            invoicePeriod: '$invoicePeriod',
                            dueDate: '$dueDate',
                            // receiptNumber:  '$receiptNumber',
                            invoiceURL: '$invoiceURL'
                        }
                    }
                ]
            }
        }

    ]).then(billResponse => {
        console.log('bill Response..test', billResponse);
        res.json(billResponse);
    });

});



// router.get('/test', async (req, res) => {
    
//     let newMonthlyBillAttributes = new monthlyBillsAttributes({
//         visitAmount: '50',
//             dueDate: '10'
//     });
    
//     newMonthlyBillAttributes.save().then(monthlyBillsFound => {
//         console.log('monthly bills..found..test', monthlyBillsFound);
//         res.json(monthlyBillsFound);
//     });
// })




module.exports = router;












// db.getCollection("billings").aggregate({
//     $group: {
//         _id: null,
//         coid: 'ZIN1LD0FG9'
//     }
// })