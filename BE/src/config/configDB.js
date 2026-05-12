import { configDotenv } from 'dotenv';

configDotenv();

const env = process.env.NODE_ENV || "development"

const configs = {
    development: {
        uri: process.env.DEV_MONGODB_URI || "",
    },
    test: {
        uri: process.env.TEST_MONGODB_URI || "",
    },
    production: {
        uri: process.env.PROD_MONGODB_URI,
    }
}

export default configs[env];