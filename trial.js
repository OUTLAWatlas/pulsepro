// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
// Middleware to verify Firebase ID tokens
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // Attach user info to request
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        res.status(403).send('Unauthorized: Invalid token');
    }
};

// Protect routes with authentication middleware
app.use('/store-ecg-data', authenticateUser);
app.use('/fetch-ecg-data/:userId', authenticateUser);
app.use('/store-user-data', authenticateUser);
app.use('/fetch-user-data/:userId', authenticateUser);
app.use('/add-patient-history', authenticateUser);
app.use('/fetch-patient-history/:userId', authenticateUser);
app.use('/fetch-doctors', authenticateUser);

// Example protected route
app.get('/protected-route', authenticateUser, (req, res) => {
    res.json({ message: `Welcome, ${req.user.email}` });
});

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Replace with your Firebase service account JSON file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-database-name.firebaseio.com" // Replace with your Firebase database URL
});

const db = admin.firestore();

// Utility function for error handling
const handleErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Routes

// 1. ECG Data Management
app.post('/store-ecg-data', [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('ecgData').notEmpty().withMessage('ECG data is required')
], handleErrors, async (req, res) => {
    try {
        const { userId, ecgData, timestamp } = req.body;

        const docRef = db.collection('ecgData').doc();
        await docRef.set({
            userId,
            ecgData,
            timestamp: timestamp || new Date().toISOString()
        });

        res.json({ message: 'ECG data stored successfully', id: docRef.id });
    } catch (error) {
        console.error('Error storing ECG data:', error);
        res.status(500).send('Unable to store ECG data');
    }
});

app.get('/fetch-ecg-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const snapshot = await db.collection('ecgData').where('userId', '==', userId).get();
        if (snapshot.empty) {
            return res.status(404).send('No ECG data found for this user');
        }

        const ecgRecords = [];
        snapshot.forEach(doc => {
            ecgRecords.push({ id: doc.id, ...doc.data() });
        });

        res.json(ecgRecords);
    } catch (error) {
        console.error('Error fetching ECG data:', error);
        res.status(500).send('Unable to fetch ECG data');
    }
});

// 2. User Data Management
app.post('/store-user-data', [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isNumeric().withMessage('Age must be a number'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('medicalHistory').isArray().withMessage('Medical history must be an array')
], handleErrors, async (req, res) => {
    try {
        const { userId, name, age, contact, medicalHistory } = req.body;

        const docRef = db.collection('users').doc(userId);
        await docRef.set({
            name,
            age,
            contact,
            medicalHistory
        });

        res.json({ message: 'User data stored successfully' });
    } catch (error) {
        console.error('Error storing user data:', error);
        res.status(500).send('Unable to store user data');
    }
});

app.get('/fetch-user-data/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const doc = await db.collection('users').doc(userId).get();
        if (!doc.exists) {
            return res.status(404).send('User not found');
        }

        res.json(doc.data());
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Unable to fetch user data');
    }
});

// 3. Doctor Management
app.post('/add-doctor', [
    body('name').notEmpty().withMessage('Doctor name is required'),
    body('specialty').notEmpty().withMessage('Specialty is required'),
    body('address').notEmpty().withMessage('Address is required')
], handleErrors, async (req, res) => {
    try {
        const { name, specialty, address } = req.body;

        const docRef = db.collection('doctors').doc();
        await docRef.set({ name, specialty, address });

        res.json({ message: 'Doctor added successfully', id: docRef.id });
    } catch (error) {
        console.error('Error adding doctor:', error);
        res.status(500).send('Unable to add doctor');
    }
});

app.get('/fetch-doctors', async (req, res) => {
    try {
        const snapshot = await db.collection('doctors').get();

        if (snapshot.empty) {
            return res.status(404).send('No doctors found');
        }

        const doctors = [];
        snapshot.forEach(doc => {
            doctors.push({ id: doc.id, ...doc.data() });
        });

        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).send('Unable to fetch doctors');
    }
});

// 4. Patient History Management
app.post('/add-patient-history', [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('history').isArray().withMessage('History must be an array')
], handleErrors, async (req, res) => {
    try {
        const { userId, history } = req.body;

        const docRef = db.collection('patientHistory').doc();
        await docRef.set({ userId, history, timestamp: new Date().toISOString() });

        res.json({ message: 'Patient history added successfully', id: docRef.id });
    } catch (error) {
        console.error('Error adding patient history:', error);
        res.status(500).send('Unable to add patient history');
    }
});

app.get('/fetch-patient-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const snapshot = await db.collection('patientHistory').where('userId', '==', userId).get();
        if (snapshot.empty) {
            return res.status(404).send('No patient history found for this user');
        }

        const historyRecords = [];
        snapshot.forEach(doc => {
            historyRecords.push({ id: doc.id, ...doc.data() });
        });

        res.json(historyRecords);
    } catch (error) {
        console.error('Error fetching patient history:', error);
        res.status(500).send('Unable to fetch patient history');
    }
});

// 5. Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({ message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
