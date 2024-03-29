import { CloverCharge, CloverClient } from "../clients/cloverClient";
import { IProcessorClient } from "./iProcessorClient";
import { CeleroCharge, CeleroClient, CeleroResultCodes } from "../clients/celeroClient"
import { CCBrands, ChargeResult, ICreditCardItem, CCProcessors, IAuthorization } from "./models";
import * as utils from "../utils/utilities"
import NodeCache from "node-cache";
import { AppConfig } from "./appConfig";


export class CreditCardProcessor {

    cache = new NodeCache({ stdTTL: 3600, checkperiod: 3620 });
    ccClient: IProcessorClient = null;

    constructor(private appConfig : AppConfig) {

    }

    GetProcessorClient(ptype: CCProcessors): IProcessorClient {
        if (ptype == CCProcessors.clover) {
            if (this.ccClient == null) {
                this.ccClient = new CloverClient(this.appConfig.cc_token(), this.appConfig.cc_environment());
            }
            return this.ccClient;
        } else if (ptype == CCProcessors.celero) {
            if (this.ccClient == null) {
                //Celero environment is handled in the admin interface
                this.ccClient = new CeleroClient(this.appConfig.cc_token());
            }
            return this.ccClient;
        }
        return null;
    }

    GetCardType(number: string): CCBrands {
        const re = {
            VISA: /^4[0-9]{12}(?:[0-9]{3})?$/,
            MC: /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/,
            AMEX: /^3[47][0-9]{13}$/,
            DISCOVER: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
            // DINERS: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,          
            // JCB: /^(?:2131|1800|35\d{3})\d{11}$/
            // electron: /^(4026|417500|4405|4508|4844|4913|4917)\d+$/,
            // maestro: /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/,
            // dankort: /^(5019)\d+$/,
            // interpayment: /^(636)\d+$/,
            // unionpay: /^(62|88)\d+$/,

        }

        for (var key in re) {
            if (re[key].test(number)) {
                return key as CCBrands
            }
        }

        return null;
    }

    /// charge an authorization the charges on a card
    async AuthorizeCard(card: ICreditCardItem): Promise<ChargeResult> {

        let ccresult = new ChargeResult();

        switch (card.processortype) {

            case CCProcessors.clover:
                {
                    try {

                        let cloverClient = this.GetProcessorClient(card.processortype) as CloverClient;
                        let apiKey: string = this.cache.get("clover_apiKey");
                        if (apiKey == undefined || apiKey == "") {
                            apiKey = await cloverClient.GetAPIKey();
                            this.cache.set("clover_apiKey", apiKey);
                        }
                      
                        let token = await cloverClient.CreateCardToken(card, apiKey);

                        card.cardid = token;

                        let charge = await cloverClient.CreateCharge(token);

                        //transfer values over
                        charge.amount = card.amount * 100; //0.10 = 100, 10.00 * 100 = 1000, 10.01 * 100 = 1001                        
                        charge.external_customer_reference = card.external_customer_reference;
                        charge.external_reference_id = card.external_reference_id;
                        charge.clientip = card.clientip;

                        let returnData: any = await cloverClient.AuthorizeCard(charge);
                        if (returnData.status === "succeeded") {
                            ccresult.authid = returnData.id;
                            ccresult.success = true;
                            ccresult.message = "card authorized.";
                        }
                        ccresult.result = JSON.stringify(returnData);

                    } catch (err: any) {
                        ccresult.success = false;
                        ccresult.result = JSON.stringify(err);

                        if (err.data && err.data.error && err.data.error.message) {
                            ccresult.message = err.data.error.message;
                        } else if (err.message) {
                            ccresult.message = err.message;
                        } else {
                            ccresult.message = "error authorizing credit card.";
                        }
                    }
                    break;
                }
            case CCProcessors.celero:
                try {
                    let celeroClient = this.GetProcessorClient(card.processortype) as CeleroClient;
                    let charge: CeleroCharge = {
                        billing: {
                            first_name: card.fname,
                            last_name: card.lname,
                            address1: card.address_line1,
                            city: card.address_city,
                            state: card.address_state,
                            zip: card.address_zip
                        },
                        payment: {
                            amount: card.amount,
                            exp_year: card.exp_year,
                            exp_month: card.exp_month,
                            ccnumber: card.number,
                            cvv: card.cvv,
                            orderid: card.external_reference_id,
                            type: "auth"
                        }
                    }
                    let returnData = await celeroClient.AuthorizeCard(charge);
                    if (returnData.response_code == "100") {
                        ccresult.success = true;
                        ccresult.authid = returnData.transactionid;
                    } else {
                        ccresult.success = false;
                    }
                    ccresult.message = returnData.responsetext;
                    ccresult.result = JSON.stringify(returnData);

                    console.log(ccresult);

                } catch (err: any) {
                    ccresult.success = false;
                    ccresult.result = JSON.stringify(err);

                    if (err.data && err.data.error && err.data.error.message) {
                        ccresult.message = err.data.error.message;
                    } else if (err.message) {
                        ccresult.message = err.message;
                    } else {
                        ccresult.message = "error authorizing credit card.";
                    }
                }

                break;
            default: {
                ccresult.success = false;
                ccresult.result = "processor type not supported."
            }
        }

        return ccresult;
    }

    /// charge an authorization received from AuthorizeCard
    async ChargeAuthorization(card: IAuthorization): Promise<ChargeResult> {

        let ccresult = new ChargeResult();

        switch (card.processortype) {

            case CCProcessors.clover:
                try {

                    let cloverClient = this.GetProcessorClient(card.processortype) as CloverClient;
                    let charge = new CloverCharge();
                    charge.authid = card.authid;
                    charge.amount = card.amount * 100; //0.10 = 100, 10.00 * 100 = 1000, 10.01 * 100 = 1001
                    charge.clientip = card.clientip;

                    let returnData: any = await cloverClient.ChargeCard(charge);
                    if (returnData.paid === true && returnData.status === "succeeded") {
                        ccresult.chargeid = returnData.id;
                        ccresult.success = true;
                        ccresult.message = "card charged.";
                    }

                    ccresult.result = JSON.stringify(returnData);

                } catch (err: any) {
                    ccresult.success = false;
                    ccresult.result = JSON.stringify(err);

                    if (err.data && err.data.error && err.data.error.message) {
                        ccresult.message = err.data.error.message;
                    } else if (err.message) {
                        ccresult.message = err.message;
                    } else {
                        if (utils.IsString(err)) {
                            ccresult.message = err;
                        } else {
                            ccresult.message = "error charging credit card.";
                        }
                    }
                }
                break;

            case CCProcessors.celero:
                try {
                    let celeroClient = this.GetProcessorClient(card.processortype) as CeleroClient;
                    let charge: CeleroCharge = {
                        capture: {
                            amount: card.amount,
                            orderid: card.external_reference_id,
                            transactionid: card.authid,
                            type: "capture",
                        }
                    }
                    let celerRes = await celeroClient.ChargeAuthorization(charge);
                    if (celerRes.response_code == "100") {
                        ccresult.success = true;

                    } else {
                        ccresult.success = false;
                    }

                    ccresult.message = celerRes.responsetext;
                    ccresult.result = JSON.stringify(celerRes);

                    //return friendly message
                    if(CeleroResultCodes[celerRes.response_code]) {
                        ccresult.message = CeleroResultCodes[celerRes.response_code];
                    }

                } catch (err: any) {
                    ccresult.success = false;
                    ccresult.result = JSON.stringify(err);

                    if (err.data && err.data.error && err.data.error.message) {
                        ccresult.message = err.data.error.message;
                    } else if (err.message) {
                        ccresult.message = err.message;
                    } else {
                        ccresult.message = "error authorizing credit card.";
                    }
                }
                break;
            default: {
                ccresult.success = false;
                ccresult.result = "processor type not supported."
            }
        }

        return ccresult;
    }
    
    /// Charge a card without pre-authorization    
    async ChargeCard(card: ICreditCardItem): Promise<ChargeResult> {

        let ccresult = new ChargeResult();

        switch (card.processortype) {

            case CCProcessors.clover:
                {
                    try {
                        let cloverClient = this.GetProcessorClient(card.processortype) as CloverClient;
                        let apiKey: string = this.cache.get("clover_apiKey");
                        if (apiKey == undefined || apiKey == "") {
                            apiKey = await cloverClient.GetAPIKey();
                            this.cache.set("clover_apiKey", apiKey);
                        }

                        let token = await cloverClient.CreateCardToken(card, apiKey);
                        ccresult.cardid = token;

                        let charge = await cloverClient.CreateCharge(token);

                        charge.amount = card.amount * 100; //0.10 = 100, 10.00 * 100 = 1000, 10.01 * 100 = 1001                        
                        charge.external_customer_reference = card.external_customer_reference;
                        charge.external_reference_id = card.external_reference_id;
                        charge.clientip = card.clientip;

                        let returnData: any = await cloverClient.ChargeCard(charge);
                        if (returnData.paid === true && returnData.status === "succeeded") {
                            ccresult.chargeid = returnData.id;
                            ccresult.success = true;
                            ccresult.message = "card charged.";
                        }
                        ccresult.result = JSON.stringify(returnData);

                    } catch (err: any) {
                        ccresult.success = false;

                        if(err?.response?.data?.error){
                            ccresult.result = JSON.stringify(err.response.data.error);
                        } else {
                            ccresult.result = JSON.stringify(err);
                        }
                    }
                    break;
                }
            case CCProcessors.celero:
                try {
                    let cleroClient = this.GetProcessorClient(card.processortype) as CeleroClient;
                    let charge: CeleroCharge = {
                        billing: {
                            address1: card.address_line1,
                            city: card.address_city,
                            state: card.address_state,
                            first_name: card.fname,
                            last_name: card.lname,
                            zip: card.address_zip
                        },
                        payment: {
                            amount: card.amount,
                            exp_month: card.exp_month,
                            exp_year: card.exp_year,
                            ccnumber: card.number,
                            cvv: card.cvv,
                            orderid: card.external_reference_id,
                            type: "sale"
                        }
                    }

                    let celerRes = await cleroClient.ChargeCard(charge);
                    if (celerRes.response_code == "100") {
                        ccresult.success = true;

                    } else {
                        ccresult.success = false;
                    }

                    ccresult.message = celerRes.responsetext;
                    ccresult.result = JSON.stringify(celerRes);

                    //return friendly message
                    if(CeleroResultCodes[celerRes.response_code]){
                        ccresult.message = CeleroResultCodes[celerRes.response_code];
                    }

                } catch (err: any) {
                    ccresult.success = false;
                    ccresult.result = JSON.stringify(err);

                    if (err.data && err.data.error && err.data.error.message) {
                        ccresult.message = err.data.error.message;
                    } else if (err.message) {
                        ccresult.message = err.message;
                    } else {
                        ccresult.message = "error charging credit card.";
                    }
                }
                break;
            default: {
                ccresult.success = false;
                ccresult.result = "processor type not supported."
            }
        }

        return ccresult;
    }


}


