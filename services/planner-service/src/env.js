// Loads the single root .env (ignored silently when absent, e.g. inside Docker)
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
