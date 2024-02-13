import { CeleroCharge, CeleroClient } from "src/celeroClient";
import { CreditCardProcessor } from "../creditCardProcessor";
import { GetENV } from '../env'
import { CCBrands, ChargeResult, ICreditCardItem, CCProcessors } from "../models";

const PROCESSOR = CCProcessors.celero;
const CONFIGFILE = "./src/tests/dev-env-celero.json";

//this is a live test! make sure you set your cc_environment to sandbox
export class CreditCardItem implements ICreditCardItem {
    brand: CCBrands = CCBrands.MC; // ** required
    number: string = ""; // cc number ** required
    exp_month: number; // two digit month ** required
    exp_year: number; // 4 digit year ** required
    fname: string = "";
    lname: string = "";
    cvv: string = ""; //security code ** required
    first6: string = "000000";  //first 6 digits of card ** required
    country: string = "US"; //country code ** required
    last4: string = "0000"; // ** required
    address_line1: string = ""; //'address1';
    address_line2: string = ""; //'address2';
    address_city: string = ""; //'irving';
    address_state: string = ""; // 'tx';
    address_zip: string = ""; // "75063";
    address_country: "US"
    amountCharge: number; //format is 1.00 = $1.00
    processortype: CCProcessors;
    clientIP = "192.168.1.1";
    external_reference_id: string = ""; //order number
    external_customer_reference: string = ""; //customer number
    cardid: string = "";
    authid: string = "";
    chargeid: string = "";
}

(async () => {

    let config = await GetENV(CONFIGFILE);
    let ccProc = new CreditCardProcessor(config);

    /*
    Card	    Account number	    Response code	Response
    Discover	6011 3610 0000 6668	    0	        Success (approve)
    Visa	    4005 5780 0333 3335	    2	        Approve for partial amounts
    Visa	    4005 5717 0222 2222	    500	        Decline

    Ecomm test cards for AVS success scenarios
    Card Brand	PAN
    Visa	    4761530001111126
    Mastercard	5204245250003294
    Amex	    375186917371340
    Discover	6011000050617475
    */
    async function TestChargeCard(): Promise<ChargeResult> {

        //response should be Success (approve)        
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = "4111111111111111";
        card.exp_month = 10;
        card.exp_year = (new Date()).getFullYear() + 2;
        card.fname = 'Test';
        card.lname = 'User';
        card.cvv = '999'; //To simulate a CVV match, pass 999 in the cvv field.
        card.first6 = '527515';
        card.country = 'US';
        card.last4 = '1203';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '77777'; //To simulate an AVS match, pass 888 in the address1 field, 77777 for zip.
        card.address_country = 'US';

        card.processortype = PROCESSOR;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        //console.log(result);
        console.log(`TestCCProcessorApproval result success: ${result.success} ${result.result} ${result.message}`);

        return result;
    }

    async function TestChargeCardDecline(): Promise<ChargeResult> {

        //response should be Success (approve)   

        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '5431111111111111';
        card.exp_month = 10;
        card.exp_year = (new Date()).getFullYear() + 2;
        card.fname = 'Test';
        card.lname = 'User';
        card.cvv = '123';
        card.first6 = '527515';
        card.country = 'US';
        card.last4 = '1203';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '75063';
        card.address_country = 'US';

        card.processortype = PROCESSOR;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 0.01; //To cause a declined message, pass an amount less than 1.00
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorDecline result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestExpired(): Promise<ChargeResult> {

        //this card is expired 
        //charge should fail
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '6011000991300009';
        card.exp_month = 10;
        card.exp_year = 2000;
        card.fname = 'Test';
        card.lname = 'User';
        card.cvv = '123';
        card.first6 = '527515';
        card.country = 'US';
        card.last4 = '1203';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '75063';
        card.address_country = 'US';

        card.processortype = PROCESSOR;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorExpired result: ${result.success} ${result.message} ${result.result}`);

        return result;
    }

    async function TestBadNumber(): Promise<ChargeResult> {

        //response should be Success (approve)
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '66666666';
        card.exp_month = 10;
        card.exp_year = (new Date()).getFullYear() + 1;
        card.fname = 'Test';
        card.lname = 'User';
        card.cvv = '123';
        card.first6 = '527515';
        card.country = 'US';
        card.last4 = '1203';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '75063';
        card.address_country = 'US';

        card.processortype = PROCESSOR;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorBadNumber result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestBadCVV(): Promise<ChargeResult> {

        //response should be Success (approve)
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '341111111111111';
        card.exp_month = 10;
        card.exp_year = (new Date()).getFullYear() + 1;
        card.fname = 'Test';
        card.lname = 'User';
        card.cvv = '99';
        card.first6 = '527515';
        card.country = 'US';
        card.last4 = '1203';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '75063';
        card.address_country = 'US';

        card.processortype = PROCESSOR;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorBadNumber result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestDeclineAmount(): Promise<ChargeResult> {

        //response should be Success (approve)
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '6799990100000000019';
        card.exp_month = 10;
        card.exp_year = (new Date()).getFullYear() + 1;
        card.fname = 'Test';
        card.lname = 'User';
        card.cvv = '123';
        card.first6 = '527515';
        card.country = 'US';
        card.last4 = '1203';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '75063';
        card.address_country = 'US';

        card.processortype = PROCESSOR;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 1000000.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorBadNumber result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestAuthorizeAndCharge(): Promise<ChargeResult> {

        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = "341111111111111";
        card.exp_month = 10;
        card.exp_year = (new Date()).getFullYear() + 2;
        card.fname = 'Test';
        card.lname = 'User';
        card.cvv = '123';
        card.first6 = '527515';
        card.country = 'US';
        card.last4 = '1203';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '75063';
        card.address_country = 'US';

        card.processortype = PROCESSOR;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.23;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.AuthorizeCard(card);
        console.log(`AuthorizeCard result success: ${result.success} ${result.message} ${result.result}`);
        if (result.success == false || result.authid == null || result.authid == "") {
            return result;
        }

        card.authid = result.authid;

        //response should be Success (approve)
        let p = new Promise<ChargeResult>((resolve, reject) => {
            //consecutive fetch will throw an error
            setTimeout(async () => {
                result = await ccProc.ChargeAuthorization(card);
                console.log(`ChargeAuthorization result success: ${result.success} ${result.message} ${result.result}`);
                resolve(result);
            }, 5000);
        });

        return p;
    }

    let response: ChargeResult = null;

    // response = await TestChargeCard();
    // if (response.success == true) {
    //     console.log("TestChargeCard Passed");
    // } else {
    //     console.log("TestChargeCard Failed ***");
    // }

    // response = await TestChargeCardDecline();
    // if (response.success == false) {
    //     console.log("TestChargeCardDecline Passed");
    // } else {
    //     console.log("TestChargeCardDecline Failed ***");
    // }

    // response = await TestExpired();
    // if (response.success == false) {
    //     console.log("TestExpired Passed");
    // } else {
    //     console.log("TestExpired Failed ***");
    // }

    // response = await TestBadNumber();
    // if (response.success == false) {
    //     console.log("TestBadNumber Passed");
    // } else {
    //     console.log("TestBadNumber Failed ***");
    // }

    // response = await TestBadCVV();
    // if (response.success == false) {
    //     console.log("TestBadCVV Passed");
    // } else {
    //     console.log("TestBadCVV Failed ***");
    // }

    // response = await TestDeclineAmount();
    // if (response.success == false) {
    //     console.log("TestDeclineAmount Passed");
    // } else {
    //     console.log("TestDeclineAmount Failed ***");
    // }

    response = await TestAuthorizeAndCharge();
    if (response.success == true) {
        console.log("TestAuthorizeAndCharge Passed");
    } else {
        console.log("TestAuthorizeAndCharge Failed ***");
    }

    //     let celeroClient = ccProc.GetProcessorClient(PROCESSOR) as CeleroClient;

    //     let charge: CeleroCharge = {
    //         capture: {
    //             amount: 10.16,
    //             orderid: "order456",
    //             transactionid: "9210061569",
    //             type: "capture"
    //         }
    //     }

    //    let celresponse = await celeroClient.ChargeAuthorization(charge);
    //    console.log(celresponse);

})();


