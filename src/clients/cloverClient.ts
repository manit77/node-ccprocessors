import * as utils from "../utils/utilities"
import { ICreditCardItem } from "../models/models";
import { IProcessorClient } from "../models/iProcessorClient";
import { clone } from "lodash"
import axios from "axios";

// https://docs.clover.com/docs/test-card-numbers

export class CloverCharge {

    ecomind: string = 'ecom';
    amount: number = 0; //10 = $0.10, 100 = $1.00
    currency: string = "usd";
    // metadata = { existingDebtIndicator: false } ;        
    capture: boolean = true;
    external_reference_id: string = ""; //order number
    external_customer_reference: string = ""; //customer number
    source: string = ""; //token
    clientip : string;
    chargeid : string;
    authid : string;

}

export class CloverClient implements IProcessorClient {

    // cloverInstance: any = null;
    ACCESS_TOKEN = "";
    ENVIRONMENT = "";
    //platform_base_url = "https://scl-sandbox.dev.clover.com";
    token_base_url = "https://token-sandbox.dev.clover.com";
    ecomm_base_url = "https://scl-sandbox.dev.clover.com";

    constructor(token: string, environment: string) {
        this.ACCESS_TOKEN = token;
        this.ENVIRONMENT = environment; //production or development
        if (environment == "production" || environment == "prod") {
            this.ecomm_base_url = "https://scl.clover.com";
            this.token_base_url = "https://token.clover.com";
        }
    }

    async GetAPIKey(): Promise<string> {
        //https://docs.clover.com/reference/getapikey
        console.log("** getAPIKey");
        try {

            const options = {                
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${this.ACCESS_TOKEN}`
                }
            };

            let response = await axios.get(`${this.ecomm_base_url}/pakms/apikey`, options);
            let returnData = response.data;
            //let returnData : any = await (await fetch(`${this.ecomm_base_url}/pakms/apikey`, options)).json();
            if(returnData.apiAccessKey){
                return returnData.apiAccessKey;
            } else {
                if(returnData.error){
                    throw returnData.error;
                } else if (returnData.message) {
                    throw returnData.message;
                } else {
                    throw "Error generating apikey."
                }
            }
            // const sdk = require('api')('@clover-platform/v3#20512plgcl0cxw');
            // sdk.auth(this.ACCESS_TOKEN);
            // let returnData = await sdk.getApiKey();  
            // console.log(returnData.data);
            //return returnData.apiAccessKey;
        }
        catch (err) {
            throw err;
        }
    }

    async CreateCardToken(card: ICreditCardItem, apikey: string): Promise<string> {
        //https://docs.clover.com/reference/create-card-token
        // console.log("** createCardToken");

        let cc : ICreditCardItem | any = clone(card);
        if (apikey == null || apikey == "") {
            throw new Error("apikey is required.");
        }

        cc["exp_month"] = utils.CCFormatMM(card.exp_month);

        //clover requires name to be in one field
        cc["name"] = cc.fname + " " + cc.lname;        
        delete cc.fname;
        delete cc.lname;

        if (utils.IsNullOrUndefined(cc["name"])) {
            throw new Error("ccname is required.");
        }

        if (cc.number == "") {
            throw new Error("ccnumber is required.");
        }

        if (cc.exp_month == null || cc.exp_month == "") {
            throw new Error("exp_month is required.");
        }

        if (cc.exp_year == null || cc.exp_year == "") {
            throw new Error("exp_year is required.");
        }
        
        if (cc.cvv == null || cc.cvv == "") {
            throw new Error("cvv is required.");
        }
        
        if(utils.CCIsCardExpired(card.exp_year, card.exp_month)){
            //expired
            throw new Error("card is expired.");
        }
        
        try {

            const config = {                
                headers: {
                    accept: 'application/json',
                    apikey: `${apikey}`,
                    'content-type': 'appclication/json'
                }
            };
            let data = { card: cc };
            let url = `${this.token_base_url}/v1/tokens`;
            let response = await axios.post(url, data, config);
            let returnData = response.data;
            //let returnData : any = await(await fetch(`${this.token_base_url}/v1/tokens`, options)).json();

            if(returnData.id){
                return returnData.id
            } else {
                if(returnData.error){
                    throw returnData.error;
                } else if (returnData.message) {
                    throw returnData.message;
                } else {
                    throw "Error generating card token."
                }
            }

            // let sdk = require('api')('@clover-platform/v3#10x31d18lkku3sih');   
            // let returnData = await sdk.createToken({ card: cc}, {apikey: apikey});            
            // console.log(returnData.data);
            //return returnData.id;

        } catch (err) {
            throw err;
        }
    }

    async CreateCharge(token: string): Promise<CloverCharge> {
        // https://docs.clover.com/reference/createcharge        
        // console.log("** CreateCharge");

        if (token == null || token == "") {
            throw new Error("card token is required.");
        }

        let charge = new CloverCharge();
        charge.source = token;
        return charge;

    }

    async ChargeCard(charge: CloverCharge) : Promise<any> {

        // console.log("** chargeCardToken");

        if (charge.amount <= 0) {
            throw new Error("amount must be greater than zero.");
        }

        if (charge.external_reference_id == null || charge.external_reference_id == "") {
            throw new Error("external_reference_id is required.");
        }

        if (charge.clientip == null || charge.clientip == "") {
            throw new Error("clientip is required.");
        }

        try {

            charge.capture = true;

            const options = {                
                headers: {
                    accept: 'application/json',
                    'x-forwarded-for': `${charge.clientip}`,
                    'content-type': 'application/json',
                    authorization: `Bearer ${this.ACCESS_TOKEN}`
                }                
            };

            //let returnData : any = await(await fetch(`${this.ecomm_base_url}/v1/charges`, options)).json();
            let response = await axios.post(`${this.ecomm_base_url}/v1/charges`, charge, options);
            let returnData = response.data;

            if(returnData.paid !== undefined && returnData.status !== undefined) {
                return returnData;
            } else {
                if(returnData.error){
                    throw returnData.error;
                } else if (returnData.message) {
                    throw returnData.message;
                } else {
                    throw "Error charging card."
                }
            }

            // const sdk = require('api')('@clover-platform/v3#h6o36lmhj0usb');
            // sdk.auth(this.ACCESS_TOKEN);
            // let returnData = await sdk.createCharge(charge, {'x-forwarded-for': clientip});
            // console.log(returnData.data);
            // return returnData;
        } catch (err) {
            throw err;
        }
    }

    async AuthorizeCard(charge: CloverCharge) : Promise<any> {

        // console.log("** chargeCardToken");

        if (charge.amount <= 0) {
            throw new Error("amount must be greater than zero.");
        }

        if (charge.external_reference_id == null || charge.external_reference_id == "") {
            throw new Error("external_reference_id is required.");
        }

        if (charge.clientip == null || charge.clientip == "") {
            throw new Error("clientip is required.");
        }

        try {

            charge.capture = false;

            const options = {              
                headers: {
                    accept: 'application/json',
                    'x-forwarded-for': `${charge.clientip}`,
                    'content-type': 'application/json',
                    authorization: `Bearer ${this.ACCESS_TOKEN}`
                }                
            };

            //let returnData : any = await(await fetch(`${this.ecomm_base_url}/v1/charges`, options)).json();
            let response = await axios.post(`${this.ecomm_base_url}/v1/charges`, charge, options);
            let returnData = response.data;
/*               
{
  "id": "8N3BCGMQAS7AJ",
  "amount": 1000,
  "payment_method_details": "card",
  "amount_refunded": 0,
  "currency": "USD",
  "created": 1695181014625,
  "captured": false,
  "ref_num": "326300500425",
  "auth_code": "OK3455",
  "outcome": {
    "network_status": "approved_by_network",
    "type": "authorized"
  },
  "status": "succeeded",
  "source": {
    "id": "clv_1TSTSD1opYbAj2xNCDUkzA2F",
    "brand": "VISA",
    "cvc_check": "pass",
    "exp_month": "10",
    "exp_year": "1977",
    "first6": "476153",
    "last4": "1126"
  },
  "ecomind": "ecom"
}
*/
            if(returnData.status !== undefined) {                
                return returnData;
            } else {
                if(returnData.error){
                    throw returnData.error;
                } else if (returnData.message) {
                    throw returnData.message;
                } else {
                    throw "Error charging card."
                }
            }

            // const sdk = require('api')('@clover-platform/v3#h6o36lmhj0usb');
            // sdk.auth(this.ACCESS_TOKEN);
            // let returnData = await sdk.createCharge(charge, {'x-forwarded-for': clientip});
            // console.log(returnData.data);
            // return returnData;
        } catch (err) {
            throw err;
        }
    }

    async ChargeAuthorization(charge: CloverCharge) : Promise<any>{
        return this.ChargeCard(charge);
    }

    // async ChargeCard(charge: CloverCharge) : Promise<any> {

    //     // console.log("** chargeCardToken");

    //     if (charge.amount <= 0) {
    //         throw new Error("amount must be greater than zero.");
    //     }
        
    //     if (charge.clientip == null || charge.clientip == "") {
    //         throw new Error("clientip is required.");
    //     }

    //     if (charge.chargeid == null || charge.chargeid == "") {
    //         throw new Error("chargeid is required.");
    //     }

    //     try {

    //         const options = {               
    //             headers: {
    //                 accept: 'application/json',
    //                 'x-forwarded-for': `${charge.clientip}`,
    //                 'content-type': 'application/json',
    //                 authorization: `Bearer ${this.ACCESS_TOKEN}`
    //             }              
    //         };

    //         //let returnData : any = await(await fetch(`${this.ecomm_base_url}/v1/charges/${charge.chargeid}/capture`, options)).json();
    //         let response = await axios.post(`${this.ecomm_base_url}/v1/charges/${charge.chargeid}/capture`, charge, options);
    //         let returnData = response.data;

    //         if(returnData.paid !== undefined && returnData.status !== undefined) {
    //             return returnData;
    //         } else {
    //             if(returnData.error){
    //                 throw returnData.error;
    //             } else if (returnData.message) {
    //                 throw returnData.message;
    //             } else {
    //                 throw "Error charging card."
    //             }
    //         }

    //         // const sdk = require('api')('@clover-platform/v3#h6o36lmhj0usb');
    //         // sdk.auth(this.ACCESS_TOKEN);
    //         // let returnData = await sdk.createCharge(charge, {'x-forwarded-for': clientip});
    //         // console.log(returnData.data);
    //         // return returnData;
    //     } catch (err) {
    //         throw err;
    //     }
    // }

}