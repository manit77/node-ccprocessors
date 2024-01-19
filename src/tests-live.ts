import { CloverClient } from "./cloverClient";
import { CreditCardProcessor } from "./creditCardProcessor";
import { GetENV } from './env'
import { CCBrands, ChargeResult, CreditCardItem, CCProcessors } from "./models";

(async () => {

    let config = await GetENV();
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

    async function TestCloverApproval() {
        //response should be Success (approve)

        const clw = new CloverClient(config.clover_token, config.clover_environment);
        let apikey = await clw.GetAPIKey();
        var card = new CreditCardItem();

        card.brand = CCBrands.VISA;
        card.number = '4761530001111126';
        card.exp_month = '10';
        card.exp_year = '2027';
        card.name = 'Test User';
        card.cvv = '123';
        card.first6 = '601136';
        card.country = 'US';
        card.last4 = '6668';
        card.address_line1 = 'address1';
        card.address_line2 = 'address2';
        card.address_city = 'irving';
        card.address_state = 'tx';
        card.address_zip = '75063';
        card.address_country = 'US';

        let token = await clw.CreateCardToken(card, apikey);

        let charge = await clw.CreateCharge(token);
        charge.amount = 1000; //$10.00
        //charge.external_reference_id = "order123";
        //charge.external_customer_reference = "customer123";

        let chargeResult = await clw.ChargeCardToken(charge, "192.168.1.161");
        return chargeResult;
    }

    async function TestCCProcessorApproval(): Promise<ChargeResult> {

        //response should be Success (approve)        
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = "4761530001111126"; //'6011361000006668';
        card.exp_month = '10';
        card.exp_year = '2027';
        card.name = 'Test User';
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

        card.processortype = CCProcessors.clover;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        //console.log(result);
        console.log(`TestCCProcessorApproval result success: ${result.success} ${result.message}`);

        return result;
    }

    async function TestCCProcessorDecline(): Promise<ChargeResult> {

        //response should be Success (approve)   

        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '4005571702222222';
        card.exp_month = '10';
        card.exp_year = '2027';
        card.name = 'Test User';
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

        card.processortype = CCProcessors.clover;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorDecline result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestCCProcessorExpired(): Promise<ChargeResult> {

        //response should be Success (approve)   

        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '6011361000006668';
        card.exp_month = '10';
        card.exp_year = '2021';
        card.name = 'Test User';
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

        card.processortype = CCProcessors.clover;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorExpired result: ${result.success} ${result.message}`);

        return result;
    }

    async function TestCCProcessorBadNumber(): Promise<ChargeResult> {

        //response should be Success (approve)
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '66666666';
        card.exp_month = '10';
        card.exp_year = '2021';
        card.name = 'Test User';
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

        card.processortype = CCProcessors.clover;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorBadNumber result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestCCProcessorBadCVC(): Promise<ChargeResult> {

        //response should be Success (approve)
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '4761530001111126';
        card.exp_month = '10';
        card.exp_year = '2021';
        card.name = 'Test User';
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

        card.processortype = CCProcessors.clover;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorBadNumber result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestCCProcessorDeclinedAmount(): Promise<ChargeResult> {

        //response should be Success (approve)
        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = '4761530001111126';
        card.exp_month = '10';
        card.exp_year = '2021';
        card.name = 'Test User';
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

        card.processortype = CCProcessors.clover;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 1000000.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.ChargeCard(card);
        // console.log(result);
        console.log(`TestCCProcessorBadNumber result : ${result.success} ${result.message}`);

        return result;
    }

    async function TestCCProcessorAuthorizeChargeApproval(): Promise<ChargeResult> {

        //response should be Success (approve)

        let card = new CreditCardItem();
        card.brand = CCBrands.VISA;
        card.number = "4761530001111126"; //'6011361000006668';
        card.exp_month = '10';
        card.exp_year = '2027';
        card.name = 'Test User';
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

        card.processortype = CCProcessors.clover;
        card.clientIP = "192.168.1.1";
        card.amountCharge = 10.00;
        card.external_reference_id = "order456";
        card.external_customer_reference = "customer456";

        let result = await ccProc.AuthorizeCard(card);
        if (result.authid == null || result.authid == "") {
            result.success = false;
            result.message = "no authid generated"
            return result;
        }

        card.authid = result.authid;
        card.chargeid = result.chargeid;

        await ccProc.ChargeAuthorization(card);
        console.log(`TestCCProcessorAuthorizeChargeApproval result success: ${result.success} ${result.message}`);

        return result;
    }

    let response: ChargeResult = null;

    response = await TestCCProcessorApproval();
    if (response.success == true) {
        console.log("TestCCProcessorApproval Passed");
    } else {
        console.log("TestCCProcessorApproval Failed ***");
    }

    response = await TestCCProcessorDecline();
    if (response.success == false) {
        console.log("TestCCProcessorDecline Passed");
    } else {
        console.log("TestCCProcessorDecline Failed ***");
    }

    response = await TestCCProcessorExpired();
    if (response.success == false) {
        console.log("TestCCProcessorDecline Passed");
    } else {
        console.log("TestCCProcessorExpired Failed ***");
    }

    response = await TestCCProcessorBadNumber();
    if (response.success == false) {
        console.log("TestCCProcessorBadNumber Passed");
    } else {
        console.log("TestCCProcessorBadNumber Failed ***");
    }

    response = await TestCCProcessorBadCVC();
    if (response.success == false) {
        console.log("TestCCProcessorBadCVC Passed");
    } else {
        console.log("TestCCProcessorBadCVC Failed ***");
    }

    response = await TestCCProcessorDeclinedAmount();
    if (response.success == false) {
        console.log("TestCCProcessorDeclinedAmount Passed");
    } else {
        console.log("TestCCProcessorDeclinedAmount Failed ***");
    }

    response = await TestCCProcessorAuthorizeChargeApproval();
    if (response.success == true) {
        console.log("TestCCProcessorAuthorizeChargeApproval Passed");
    } else {
        console.log("TestCCProcessorAuthorizeChargeApproval Failed ***");
    }

})();


