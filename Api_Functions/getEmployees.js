const User = require('../Db_Functions/models/User');

async function getEmployees(req, res) {
  try {
    const employees = await User.find().sort({ createdAt: -1 }).exec();

    const employeeList = employees.map(emp => ({
      id: emp._id,
      name: emp.name,
      age: emp.age,
      class: emp.class,
      subject: emp.subject,
      attendance: emp.attendance,
      createdAt: emp.createdAt,
    }));

    return res.status(200).json({ message: 'Employees fetched', employees: employeeList });
  } catch (err) {
    console.error('getEmployees error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getEmployees,
};
