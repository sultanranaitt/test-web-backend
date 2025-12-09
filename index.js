const express = require('express');
const bodyParser = require('express').json;
require('dotenv').config();

const { registerEmployee } = require('./Api_Functions/registerEmployee');
const { getEmployees } = require('./Api_Functions/getEmployees');
const { register, login } = require('./Api_Functions/auth');
const { applyGraphQL } = require('./Api_Functions/graphql');
const { connectDB } = require('./Db_Functions/connection');

const app = express();
const PORT = process.env.PORT || 4000;
const GRAPHQL_PATH = process.env.GRAPHQL_PATH || '/graphql';

app.use(bodyParser());

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

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
    });
})();
