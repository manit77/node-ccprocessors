import fetch from "node-fetch"
import * as utils from "./utilities"
import { ICreditCardItem } from "./models";

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

}

export class CloverClient {

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
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    authorization: `Bearer ${this.ACCESS_TOKEN}`
                }
            };       

            let returnData : any = await (await fetch(`${this.ecomm_base_url}/pakms/apikey`, options)).json();
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

    async CreateCardToken(cc: ICreditCardItem, apikey: string): Promise<string> {
        //https://docs.clover.com/reference/create-card-token
        // console.log("** createCardToken");

        if (apikey == null || apikey == "") {
            throw new Error("apikey is required.");
        }

        if (cc.name == null || cc.name == "") {
            throw new Error("ccname is required.");
        }

        if (cc.name == null || cc.number == "") {
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
        
        try {

            const options = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    apikey: `${apikey}`,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ card: cc })
            };

            let returnData : any = await(await fetch(`${this.token_base_url}/v1/tokens`, options)).json();

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

    async ChargeCardToken(charge: CloverCharge, clientip: string) : Promise<any> {

        // console.log("** chargeCardToken");

        if (charge.amount <= 0) {
            throw new Error("amount must be greater than zero.");
        }

        if (charge.external_reference_id == null || charge.external_reference_id == "") {
            throw new Error("external_reference_id is required.");
        }

        if (clientip == null || clientip == "") {
            throw new Error("clientip is required.");
        }

        try {

            charge.capture = true;

            const options = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'x-forwarded-for': `${clientip}`,
                    'content-type': 'application/json',
                    authorization: `Bearer ${this.ACCESS_TOKEN}`
                },
                body: JSON.stringify(charge)
            };

            let returnData : any = await(await fetch(`${this.ecomm_base_url}/v1/charges`, options)).json();
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

    async AuthorizeCard(charge: CloverCharge, clientip: string) : Promise<any> {

        // console.log("** chargeCardToken");

        if (charge.amount <= 0) {
            throw new Error("amount must be greater than zero.");
        }

        if (charge.external_reference_id == null || charge.external_reference_id == "") {
            throw new Error("external_reference_id is required.");
        }

        if (clientip == null || clientip == "") {
            throw new Error("clientip is required.");
        }

        try {

            charge.capture = false;

            const options = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'x-forwarded-for': `${clientip}`,
                    'content-type': 'application/json',
                    authorization: `Bearer ${this.ACCESS_TOKEN}`
                },
                body: JSON.stringify(charge)
            };

            let returnData : any = await(await fetch(`${this.ecomm_base_url}/v1/charges`, options)).json();
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

    async ChargeChargeId(amount: number, clientip: string, chargeid: string) : Promise<any> {

        // console.log("** chargeCardToken");

        if (amount <= 0) {
            throw new Error("amount must be greater than zero.");
        }

        
        if (clientip == null || clientip == "") {
            throw new Error("clientip is required.");
        }

        if (chargeid == null || chargeid == "") {
            throw new Error("chargeid is required.");
        }

        try {


            const options = {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'x-forwarded-for': `${clientip}`,
                    'content-type': 'application/json',
                    authorization: `Bearer ${this.ACCESS_TOKEN}`
                },
                body: JSON.stringify({amount: 1000})
            };

            let returnData : any = await(await fetch(`${this.ecomm_base_url}/v1/charges/${chargeid}/capture`, options)).json();
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

}