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

const createQuote = async (sourceCurrency, targetCurrency, amount, profileId) => {
    try {
        const body = {
            sourceCurrency: sourceCurrency,
            targetCurrency: targetCurrency,
            sourceAmount: amount,
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

const createRecipient = async (person, currency, type, legalType, sortCode, accountNumber) => {
    try {
        const body = {
            accountHolderName: person,
            currency: currency,
            type: type,
            details: {
                legalType: legalType,
                sortCode: sortCode,
                accountNumber: accountNumber,
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
    if (!targetAccount || !quoteId) {
        throw new Error("targetAccount and quoteId are required for creating a transfer");
    }
    
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
    const quote = await createQuote("SGD", "GBP", 1000, profile.id);
    // Task 2: Console Log the Quote ID
    console.log(`Quote ID: ${quote.id}`);

    // Task 3: Console Log the Amount the recipient will receive, including the currency (e.g. "12.34 GBP")
    if (!quote.paymentOptions || quote.paymentOptions.length === 0) {
        console.error("No payment options found in the quote.");
        throw new Error("No payment options found in the quote");
    }
    const paymentOption = quote.paymentOptions.find(option => option.payIn === BANK_TRANSFER && option.payOut === BANK_TRANSFER);
    if (!paymentOption) {
        console.error("No BANK_TRANSFER payment option found in the quote.");
        throw new Error("No BANK_TRANSFER payment option found in the quote");
    }
    console.log(`Recipient receives: ${paymentOption.targetAmount} ${paymentOption.targetCurrency}`);

    // Task 4: Console Log the Exchange Rate (4 decimal places, e.g. "1.2345")
    if (typeof quote.rate !== 'number') {
        console.error("Invalid or missing exchange rate in quote");
        throw new Error("Invalid or missing exchange rate in quote");
    }
    const exchangeRate = quote.rate.toFixed(4);
    console.log(`Exchange rate: ${exchangeRate}`);

    // Task 5: Console Log the Fees (total fee)
    const totalFee = paymentOption?.price?.total;
    if (!totalFee || !totalFee.value) {
        console.error(`No total fee found in the payment option.`);
        throw new Error("No total fee found in the payment option");
    }
    const feeLabel = totalFee.label || `${totalFee.value} ${paymentOption.sourceCurrency}`;
    console.log(`Total fee: ${feeLabel}`);

    // Task 6: Console Log the Delivery Estimates (human readable format)
    let deliveryEstimate = "N/A";
    if (paymentOption.estimatedDelivery) {
        try {
            deliveryEstimate = new Date(paymentOption.estimatedDelivery).toLocaleString("en-US", dateOptions);
        } catch (dateError) {
            console.warn("Invalid delivery estimate date format:", paymentOption.estimatedDelivery);
            deliveryEstimate = paymentOption.estimatedDelivery;
        }
    }
    console.log(`Delivery Estimate: ${deliveryEstimate}`)

    // Create Recipient (GBP Sort Code)
    // Task 7: Console Log the Recipient ID
    const recipient = await createRecipient("Adam Smith", "GBP", "sort_code", "PRIVATE", "04-00-04", "12345678");
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

if (!process.env.API_KEY) {
    console.error("Missing API_KEY in environment variables.");
    console.error("Please create a .env file based on .env.example and add your Wise API key.");
    console.error("Get your API key from: https://sandbox.transferwise.tech (Settings > Integration and tools > API token)");
    process.exit(1);
}

if (!process.env.API_URL) {
    console.error("Missing API_URL in environment variables.");
    console.error("Please create a .env file based on .env.example and add the API URL.");
    console.error("For sandbox: API_URL=https://api.sandbox.transferwise.tech");
    process.exit(1);
}

Promise.resolve()
    .then(() => runLogic())
    .catch((error) => {
        console.error("An error occurred:", error.message);
        if (error.response) {
            console.error("API Error Details:", error.response.data);
        }
        process.exit(1);
    });

