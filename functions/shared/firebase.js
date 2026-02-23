const functions = require('firebase-functions/v1');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

admin.initializeApp();
const db = admin.firestore();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

module.exports = { functions, admin, fetch, db, genAI, GOOGLE_API_KEY };
