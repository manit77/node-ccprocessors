import querystring from 'querystring';
import https from 'https'
import { CCFormatAmount, CCFormatMM, CCIsCardExpired, IsNullOrUndefined, ParseQueryString } from '../utils/utilities';
import { IProcessorClient } from '../models/iProcessorClient';
import { clone } from 'lodash';

//reference: https://connect.transactiongateway.com/merchants/resources/integration/integration_portal.php

let CeleroResultCodes = {
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

export interface CeleroCharge {
    billing?: CeleroBillingInfo;
    payment?: CeleroPaymentInfo;
    capture?: CeleroCaptureInfo;
}

export interface CeleroCaptureInfo {
    type: "sale" | "auth" | "capture";
    transactionid: string;
    amount: number;
    orderid: string;
}

export interface CeleroPaymentInfo {
    type: "sale" | "auth";
    amount: number;
    ccnumber: string;
    exp_year: number;
    exp_month: number;
    cvv: string;
    orderid: string;
}

export interface CeleroBillingInfo {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    state: string;
    zip: string;
}

export interface CeleroPaymentResponse {
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

export class CeleroClient implements IProcessorClient {

    hostName = 'connect.transactiongateway.com';
    path = '/api/transact.php';

    constructor(private security_key) {
        this.security_key = security_key;
    }

    async AuthorizeCard(charge: CeleroCharge) {
        if (IsNullOrUndefined(charge.payment)) {
            throw "CeleroPaymentInfo is required.";
        }

        if (IsNullOrUndefined(charge.billing)) {
            throw "CeleroBillingInfo is required.";
        }

        return this.AuthorizePayment(charge.payment, charge.billing);
    };

    async ChargeAuthorization(charge: CeleroCharge) {
        if (IsNullOrUndefined(charge.capture)) {
            throw "CeleroCaptureInfo is required.";
        }
        return this.CaptureAuthorization(charge.capture);
    };

    async ChargeCard(charge: CeleroCharge) {

        if (IsNullOrUndefined(charge.payment)) {
            throw "CeleroPaymentInfo is required.";
        }

        if (IsNullOrUndefined(charge.billing)) {
            throw "CeleroBillingInfo is required.";
        }

        return this.ChargePayment(charge.payment, charge.billing);
    };

    async ChargePayment(payment: CeleroPaymentInfo, billing: CeleroBillingInfo): Promise<CeleroPaymentResponse> {

        if (!this.security_key) {
            throw "Celero security_key is required."
        }

        let postData = {
            security_key: this.security_key
        };

        payment.type = "sale";

        //change the exp date
        let paymentfmt = clone<any>(payment);
        paymentfmt["ccexp"] = CCFormatMM(payment.exp_month) + payment.exp_year;
        delete payment.exp_month;
        delete payment.exp_year;
        paymentfmt["amount"] = CCFormatAmount(payment.amount);

        Object.assign(postData, paymentfmt, billing);

        let result = await this.httpRequest(postData);

        // let datastr = querystring.stringify(postData)
        // const options = {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/x-www-form-urlencoded',
        //         "Content-Length": Buffer.byteLength(datastr)
        //     },
        //     body: datastr
        // };
        // let result: any = await (await fetch(`https://${this.hostName}${this.path}`, options)).text();

        return ParseQueryString(result) as CeleroPaymentResponse;
    }

    async AuthorizePayment(payment: CeleroPaymentInfo, billing: CeleroBillingInfo): Promise<CeleroPaymentResponse> {
        if (!this.security_key) {
            throw "Celero security_key is required."
        }
        let postData = {
            security_key: this.security_key
        };
        payment.type = "auth";

        let paymentfmt = clone<any>(payment);
        paymentfmt["ccexp"] = CCFormatMM(payment.exp_month) + payment.exp_year;
        paymentfmt["amount"] = CCFormatAmount(payment.amount);

        delete payment.exp_month;
        delete payment.exp_year;

        Object.assign(postData, paymentfmt, billing);

        let result = await this.httpRequest(postData);

        // let datastr = querystring.stringify(postData)
        // const options = {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/x-www-form-urlencoded',
        //         "Content-Length": Buffer.byteLength(datastr)
        //     },
        //     body: datastr
        // };

        // let result: any = await (await fetch(`https://${this.hostName}${this.path}`, options)).text();

        return ParseQueryString(result) as CeleroPaymentResponse;
    }

    async CaptureAuthorization(capture: CeleroCaptureInfo): Promise<CeleroPaymentResponse> {

        if (!this.security_key) {
            throw "Celero security_key is required."
        }

        let postData = {
            security_key: this.security_key
        };

        let capturefmt = clone<any>(capture);
        capturefmt.type = "capture";
        capturefmt.amount = CCFormatAmount(capture.amount);

        Object.assign(postData, capturefmt);

        let result = await this.httpRequest(postData);

        // let postDatastr = querystring.stringify(postData);
        // const options = {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/x-www-form-urlencoded'
        //     },
        //     body: postDatastr
        // };

        // let result: any = await (await fetch(`https://${this.hostName}${this.path}`, options)).text();

        return ParseQueryString(result) as CeleroPaymentResponse;

    }

    async httpRequest(postData): Promise<string> {

        postData = querystring.stringify(postData);
        let len = Buffer.byteLength(postData);

        //console.log(postData);
        //console.log(len);

        const options = {
            hostname: this.hostName,
            path: this.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': len
            }
        };

        let p = new Promise<string>((resolve, reject) => {

            let responseBody = '';
            const req = https.request(options, (res) => {
                res.setEncoding('utf8');

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

            req.write(postData);

            req.end();

        });

        return p;
    }

}