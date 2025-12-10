const express = require('express');
const bodyParser = require('express').json;
require('dotenv').config();
const cors=require('cors');

const { registerEmployee } = require('./Api_Functions/registerEmployee');
const { getEmployees } = require('./Api_Functions/getEmployees');
const { register, login } = require('./Api_Functions/auth');
const { applyGraphQL } = require('./Api_Functions/graphql_fixed');
const { connectDB } = require('./Db_Functions/connection');
const { attachAccount } = require('./Api_Functions/authHelpers');

const app = express();
const PORT = process.env.PORT || 4000;
const GRAPHQL_PATH = process.env.GRAPHQL_PATH || '/graphql';

app.use(bodyParser());

const corsOptions = {
    origin: [
        'http://localhost:4000',
        'http://localhost:5173',
        'https://sprightly-yeot-927fb6.netlify.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

app.post('/auth/register', register);
app.post('/auth/login', login);

app.post('/register-employee', registerEmployee);
app.get('/get-employees', getEmployees);
app.get('/employee/:id', require('./Api_Functions/getEmployeeById').getEmployeeById);
app.put('/update-employee', require('./Api_Functions/updateEmployee').updateEmployee);
app.delete('/delete-employee/:id', require('./Api_Functions/deleteEmployee').deleteEmployee);


(async function start() {
    await connectDB();
    await applyGraphQL(app, GRAPHQL_PATH);
    console.log('Starting server...', { PORT, GRAPHQL_PATH, hasMongoURI: !!process.env.MONGODB_URI, nodeEnv: process.env.NODE_ENV || 'development' });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
})();
