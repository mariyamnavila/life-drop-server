const Stripe = require("stripe");
require('dotenv').config();

const stripe = new Stripe(process.env.PAYMENT_GATEWAY_KEY);

module.exports = stripe;
