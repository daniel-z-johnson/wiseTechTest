const axios = require("axios");
const uuid = require("uuid");

const listProfiles = async () => {
    try {
        const url = `https://api.sandbox.transferwise.tech/v2/profiles`;
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        };

        const response = await axios.get(url, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const createQuote = async (profileId) => {
    try {
        const url = `https://api.sandbox.transferwise.tech/v3/profiles/${profileId}/quotes`;
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        };
        const body = {
            sourceCurrency: "SGD",
            targetCurrency: "GBP",
            sourceAmount: 1000,
        };

        const response = await axios.post(url, body, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const createRecipient = async () => {
    try {
        const url = `https://api.sandbox.transferwise.tech/v1/accounts`;
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        };
        const body = {
            accountHolderName: "GBP Person Name",
            currency: "GBP",
            type: "sort_code",
            details: {
                legalType: "PRIVATE",
                sortCode: "04-00-04",
                accountNumber: "12345678",
            },
        };

        const response = await axios.post(url, body, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const createTransfer = async () => {
    try {
        const url = `https://api.sandbox.transferwise.tech`;
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        };
        const body = {};

        const response = await axios.post(url, body, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const runLogic = async () => {
    // Task 1: Find out the Personal Profile ID of the user.
    const profiles = await listProfiles();
    const profileId = null;
    console.log(`Profile ID: ${profileId}`); // Example Console Log

    // Create Quote
    const quote = await createQuote(profileId);

    // [IMP] Select BANK_TRANSFER option for both payin and payout
    // Make sure you are selecting the correct payin and payout options to get the            correct transfer fee.
    // Task 2: Console Log the Quote ID
    // Task 3: Console Log the Amount the recipient will receive, including the               currency (e.g. "12.34 GBP")
    // Task 4: Console Log the Exchange Rate (4 decimal places, e.g. "1.2345")
    // Task 5: Console Log the Fees (total fee)
    // Task 6: Console Log the Delivery Estimates (human readable format)

    // Create Recipient (GBP Sort Code)
    const recipient = await createRecipient();
    // Task 7: Console Log the Recipient ID

    // Create Transfer
    const transfer = await createTransfer();
    // Task 8: Console Log the Transfer ID
    // Task 9: Console Log the Transfer Status

    // Remember to copy all the console logs to a text file for submission.
    console.log("All tasks completed successfully.");
};

Promise.resolve()
    .then(() => runLogic())
    .catch((error) => {
        console.error("An error occurred");
    });

