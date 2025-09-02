const axios = require("axios");
const uuid = require("uuid");
require("dotenv").config();

const BANK_TRANSFER = "BANK_TRANSFER";
const wiseClient = axios.create({
    baseURL: process.env.API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`,
        "Accept": "application/json"
    },
});

const dateOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
};

const defaultErrorHandler = (error) => {
    if (error.response) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
    } else {
        console.error(error.message);
    }
}

const listProfiles = async () => {
    try {
        const response = await wiseClient.get("/v2/profiles");
        return response.data;
    } catch (error) {
        defaultErrorHandler(error);
        throw error;
    }
};

const createQuote = async (profileId) => {
    try {
        const body = {
            sourceCurrency: "SGD",
            targetCurrency: "GBP",
            sourceAmount: 1000,
            preferredPayIn: BANK_TRANSFER,
            payOut: BANK_TRANSFER
        };

        const response = await wiseClient.post(`/v3/profiles/${profileId}/quotes`, body);
        return response.data;
    } catch (error) {
        defaultErrorHandler(error);
        throw error;
    }
};

const createRecipient = async () => {
    try {
        const body = {
            accountHolderName: "Adam Smith",
            currency: "GBP",
            type: "sort_code",
            details: {
                legalType: "PRIVATE",
                sortCode: "04-00-04",
                accountNumber: "12345678",
            },
        };

        const response = await wiseClient.post("/v1/accounts", body);
        return response.data;
    } catch (error) {
        defaultErrorHandler(error);
        throw error;
    }
};

const createTransfer = async (targetAccount, quoteId, transactionId) => {
    const body = {
        targetAccount: targetAccount,
        quoteUuid: quoteId,
        customerTransactionId: transactionId || uuid.v4(),
        details: {
            reference: "Wise Tech Test"
        }
    };

    try {
        const response = await wiseClient.post("/v1/transfers", body);
        return response.data;
    } catch (error) {
        defaultErrorHandler(error);
        throw error;
    }
};

const runLogic = async () => {
    // Task 1: Find out the Personal Profile ID of the user.
    const profiles = await listProfiles();
    const profile = profiles.find(profile => (profile.type || "").toLowerCase() === "personal");
    if (!profile) {
        console.error("No profile found.");
        throw new Error("No personal profile found");
    }

    console.log(`Profile ID: ${profile.id}`);

    // Create Quote
    // [IMP] Select BANK_TRANSFER option for both payin and payout
    // Make sure you are selecting the correct payin and payout options to get the correct transfer fee.
    const quote = await createQuote(profile.id);
    // Task 2: Console Log the Quote ID
    console.log(`Quote ID: ${quote.id}`);

    // Task 3: Console Log the Amount the recipient will receive, including the currency (e.g. "12.34 GBP")
    if (!quote.paymentOptions || quote.paymentOptions.length === 0) {
        console.error("No payment options found in the quote.");
        throw new Error("No payment options found in the quote");
    }
    const paymentOption = quote.paymentOptions.find(option => option.payIn === BANK_TRANSFER && option.payOut === BANK_TRANSFER);
    console.log(`Recipient receives: ${paymentOption.targetAmount} ${paymentOption.targetCurrency}`);

    // Task 4: Console Log the Exchange Rate (4 decimal places, e.g. "1.2345")
    const exchangeRate = (quote.rate || 0).toFixed(4);
    console.log(`Exchange rate: ${exchangeRate}`);

    // Task 5: Console Log the Fees (total fee)
    const totalFee = paymentOption?.price?.total?.value;
    if (!totalFee) {
        console.error(`No total fee found in the payment option.`);
        throw new Error("No total fee found in the payment option");
    }
    console.log(`Total fee: ${totalFee.label}`);

    // Task 6: Console Log the Delivery Estimates (human readable format)
    const deliveryEstimate = paymentOption.estimatedDelivery ? new Date(paymentOption.estimatedDelivery).toLocaleString("en-US", dateOptions) : "N/A";
    console.log(`Delivery Estimate: ${deliveryEstimate}`)

    // Create Recipient (GBP Sort Code)
    // Task 7: Console Log the Recipient ID
    const recipient = await createRecipient();
    console.log(`Recipient ID: ${recipient.id}`);

    // Create Transfer
    const transfer = await createTransfer(recipient.id, quote.id, uuid.v4());

    // Task 8: Console Log the Transfer ID
    console.log(`Transfer ID: ${transfer.id}`);

    // Task 9: Console Log the Transfer Status
    console.log(`Transfer Status: ${transfer.status}`);

    // Remember to copy all the console logs to a text file for submission.
    console.log("All tasks completed successfully.");
};

Promise.resolve()
    .then(() => runLogic())
    .catch((error) => {
        console.error("An error occurred");
    });

