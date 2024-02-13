//const https = require('https');
import querystring from 'querystring';
import { GetENV } from "../env";
import https from 'https'
import { ParseQueryString } from 'src/utilities';

let ResultCodes = {
    "100": "Transaction was approved.",
    "200": "Transaction was declined by processor.",
    "201": "Do not honor.",
    "202": "Insufficient funds.",
    "203": "Over limit.",
    "204": "Transaction not allowed.",
    "220": "Incorrect payment information.",
    "221": "No such card issuer.",
    "222": "No card number on file with issuer.",
    "223": "Expired card.",
    "224": "Invalid expiration date.",
    "225": "Invalid card security code.",
    "226": "Invalid PIN.",
    "240": "Call issuer for further information.",
    "250": "Pick up card.",
    "251": "Lost card.",
    "252": "Stolen card.",
    "253": "Fraudulent card.",
    "260": "Declined",
    "261": "Declined-Stop all recurring payments.",
    "262": "Declined-Stop this recurring program.",
    "263": "Declined-Update cardholder data available.",
    "264": "Declined-Retry in a few days.",
    "300": "Transaction was rejected by gateway.",
    "400": "Transaction error returned by processor.",
    "410": "Invalid merchant configuration.",
    "411": "Merchant account is inactive.",
    "420": "Communication error.",
    "421": "Communication error with issuer.",
    "430": "Duplicate transaction at processor.",
    "440": "Processor format error.",
    "441": "Invalid transaction information.",
    "460": "Processor feature not available.",
    "461": "Unsupported card type."
}


class PaymentInfo {
    type : "sale" = "sale";
    amount : number;
    ccnumber: string;
    ccexp: string;
    cvv: string;
    orderid: string;
}

class BillingInfo {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    state: string;
    zip: string = "";
}

class PaymentResponse {
    response: string;
    responsetext: string;
    authcode: string;
    transactionid: string;
    avsresponse: string;
    cvvresponse: string;
    orderid: string;
    type: string;
    response_code: string;
}

class CeleroClient {

    constructor(private security_key) {
        this.security_key = security_key;
    }

    async doSale(payment: PaymentInfo, billing: BillingInfo): Promise<PaymentResponse> {                
        let postData = {};
        Object.assign(postData, payment, billing);        
        let result = await this.httpRequest(postData);        
        return ParseQueryString(result) as PaymentResponse;
    }

    async httpRequest(postData): Promise<string> {
        const hostName = 'connect.transactiongateway.com';
        const path = '/api/transact.php';

        postData.security_key = this.security_key;
        postData = querystring.stringify(postData);

        const options = {
            hostname: hostName,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // Make request to Payment API

        let p = new Promise<string>((resolve, reject) => {
            const req = https.request(options, (res) => {
                res.setEncoding('utf8');
                let responseBody = '';

                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    resolve(responseBody);
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.write(postData)
            req.end();
        });

        return p;

        // const req = https.request(options, (response) => {
        //     console.log(`STATUS: ${response.statusCode}`);
        //     console.log(`HEADERS: ${JSON.stringify(response.headers)}`);

        //     response.on('data', (chunk) => {
        //         console.log(`BODY: ${chunk}`);
        //     });
        //     response.on('end', () => {
        //         console.log('No more data in response.');
        //     });
        // });

        // req.on('error', (e) => {
        //     console.error(`Problem with request: ${e.message}`);
        // });

        // // Write post data to request body
        // req.write(postData);
        // req.end();
    }
}

(async () => {

    let config = await GetENV();
    let security_key = config.cc_token;
    console.log(`security_key=${security_key}`);

    const dp = new CeleroClient(security_key);
    const billingInfo = new BillingInfo();

    billingInfo.first_name = "Test";
    billingInfo.last_name = "User";
    billingInfo.address1 = "123 Main St";
    billingInfo.city = "New York";
    billingInfo.state = "NY";
    billingInfo.zip = "12345";

    const paymentInfo = new PaymentInfo();
    paymentInfo.amount = 1.01;
    paymentInfo.ccnumber = "4111111111111111";
    paymentInfo.cvv = "123";
    paymentInfo.ccexp = "1221";
    paymentInfo.type= "sale";
    paymentInfo.orderid = "order0002";


    // Set dummy data for sale
    let resObj = await dp.doSale(paymentInfo, billingInfo);
    console.log(resObj);

    console.log(`response: ${resObj.response}`);
    console.log(`responsetext: ${resObj.responsetext}`);
    console.log(`response_code: ${resObj.response_code}`);

    if(resObj.response_code === "100") {
        console.log("Transaction was approved.");
    } else {
        console.log(`Transaction failed. ${resObj.responsetext}`);
    }

})();

