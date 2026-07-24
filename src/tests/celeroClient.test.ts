import {
    CeleroBillingInfo,
    CeleroClient,
    CeleroPaymentInfo
} from "../clients/celeroClient";

describe("CeleroClient test mode", () => {
    const payment: CeleroPaymentInfo = {
        type: "sale",
        amount: 10,
        ccnumber: "4111111111111111",
        exp_year: 2029,
        exp_month: 10,
        cvv: "999",
        orderid: "test-order"
    };

    const billing: CeleroBillingInfo = {
        first_name: "Test",
        last_name: "User",
        address1: "888",
        city: "Irving",
        state: "TX",
        zip: "77777"
    };

    test("enables gateway test mode in development", async () => {
        const client = new CeleroClient("test-key", "development");
        let submittedData: any;
        client.httpRequest = async (postData: any) => {
            submittedData = postData;
            return "response=1&response_code=100&responsetext=Approved";
        };

        await client.ChargePayment(payment, billing);

        expect(submittedData.test_mode).toBe("enabled");
    });

    test("does not enable gateway test mode in production", async () => {
        const client = new CeleroClient("test-key", "production");
        let submittedData: any;
        client.httpRequest = async (postData: any) => {
            submittedData = postData;
            return "response=1&response_code=100&responsetext=Approved";
        };

        await client.ChargePayment(payment, billing);

        expect(submittedData.test_mode).toBeUndefined();
    });
});
