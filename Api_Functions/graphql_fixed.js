const { buildSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql');
const User = require('../Db_Functions/models/User');
const Account = require('../Db_Functions/models/Account');
const { generateToken, verifyToken, getTokenFromHeader } = require('./authHelpers');

const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    age: Int!
    class: String!
    subject: String!
    attendance: String!
    createdAt: String
  }

  type Account {
    id: ID!
    name: String
    email: String!
    role: String!
  }

  type AuthResponse {
    message: String!
    token: String!
    account: Account!
  }

  type QueryResponse {
    message: String!
    users: [User!]!
    total: Int!
    page: Int!
    limit: Int!
  }

  type MutationResponse {
    message: String!
    user: User!
  }

  input EmployeeFilter {
    name: String
    class: String
    subject: String
  }

  type Query {
    employees(
      filters: EmployeeFilter
      page: Int
      limit: Int
      sortBy: String
      sortOrder: String
    ): QueryResponse!
    employee(id: ID!): User
    me: Account
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, role: String): AuthResponse!
    login(email: String!, password: String!): AuthResponse!
    createEmployee(name: String!, age: Int!, class: String!, subject: String!, attendance: String!): MutationResponse!
    updateEmployee(id: ID!, name: String, age: Int, class: String, subject: String, attendance: String): MutationResponse!
    deleteEmployee(id: ID!): MutationResponse!
  }
`);

const root = {
  employees: async ({ filters, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }, context) => {
    try {
      const query = {};
      if (filters) {
        if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
        if (filters.class) query.class = filters.class;
        if (filters.subject) query.subject = filters.subject;
      }

      const pageNum = Math.max(1, page);
      const pageSize = Math.max(1, Math.min(limit, 100));
      const skip = (pageNum - 1) * pageSize;

      const sort = {};
      const validSortFields = ['name', 'age', 'attendance', 'createdAt'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      sort[sortField] = sortDirection;

      const employees = await User.find(query).sort(sort).skip(skip).limit(pageSize).exec();
      const total = await User.countDocuments(query);

      return {
        message: 'Employees fetched successfully',
        users: employees.map(emp => ({
          id: emp._id.toString(),
          name: emp.name,
          age: emp.age,
          class: emp.class,
          subject: emp.subject,
          attendance: emp.attendance,
          createdAt: emp.createdAt && emp.createdAt.toISOString(),
        })),
        total,
        page: pageNum,
        limit: pageSize,
      };
    } catch (err) {
      console.error('employees query error:', err);
      throw new Error('Failed to fetch employees');
    }
  },

  employee: async ({ id }) => {
    try {
      const emp = await User.findById(id).exec();
      if (!emp) return null;
      return {
        id: emp._id.toString(),
        name: emp.name,
        age: emp.age,
        class: emp.class,
        subject: emp.subject,
        attendance: emp.attendance,
        createdAt: emp.createdAt && emp.createdAt.toISOString(),
      };
    } catch (err) {
      console.error('employee query error:', err);
      throw new Error('Failed to fetch employee');
    }
  },

  me: async (_, context) => {
    try {
      if (!context.account) {
        throw new Error('Unauthorized: Please login first');
      }
      return {
        id: context.account._id.toString(),
        name: context.account.name || context.account.username,
        email: context.account.email,
        role: context.account.role,
      };
    } catch (err) {
      console.error('me query error:', err);
      throw new Error(err.message);
    }
  },

  register: async ({ name, email, password, role }) => {
    try {
      if (!name || !email || !password) {
        throw new Error('Missing required fields');
      }
      // derive username from name internally
      const usernameBase = name.trim().toLowerCase().replace(/\s+/g, '');
      let username = usernameBase;
      let counter = 0;
      while (await Account.exists({ username })) {
        counter += 1;
        username = `${usernameBase}${counter}`;
      }

      const existing = await Account.findOne({ $or: [{ username }, { email }] });
      if (existing) {
        throw new Error('Name-derived username or email already exists');
      }
      // Always create an admin account via this register mutation
      const account = await Account.create({
        name: name.trim(),
        username,
        email: email.trim().toLowerCase(),
        password,
        role: 'admin',
      });
      const token = generateToken(account._id, account.role);
      return {
        message: 'Account registered successfully',
        token,
        account: {
          id: account._id.toString(),
          name: account.name || account.username,
          email: account.email,
          role: account.role,
        },
      };
    } catch (err) {
      console.error('register mutation error:', err);
      throw new Error(err.message);
    }
  },

  login: async ({ email, password }) => {
    try {
      if (!email || !password) {
        throw new Error('Missing email or password');
      }
      const account = await Account.findOne({ email: email.trim().toLowerCase() });
      if (account) {
        const isMatch = await account.comparePassword(password);
        if (!isMatch) throw new Error('Invalid credentials');
        const token = generateToken(account._id, account.role);
        return {
          message: 'Login successful',
          token,
          account: {
            id: account._id.toString(),
            name: account.name || account.username,
            email: account.email,
            role: account.role,
          },
        };
      }

      // fallback to User collection
      const user = await User.findOne({ email: email.trim().toLowerCase() }).exec();
      if (!user || !user.password) throw new Error('Invalid credentials');
      const bcrypt = require('bcryptjs');
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) throw new Error('Invalid credentials');
      const token = generateToken(user._id, 'employee');
      return {
        message: 'Login successful',
        token,
        account: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: 'employee',
        },
      };
    } catch (err) {
      console.error('login mutation error:', err);
      throw new Error(err.message);
    }
  },

  createEmployee: async ({ name, age, class: className, subject, attendance }, context) => {
    try {
      // no admin required: public creation
      if (!name || !className || !subject || !attendance) {
        throw new Error('Missing required fields');
      }
      const newUser = await User.create({
        name: name.trim(),
        age,
        class: className.trim(),
        subject: subject.trim(),
        attendance: attendance.toString().trim(),
      });
      return {
        message: 'Employee created successfully',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          age: newUser.age,
          class: newUser.class,
          subject: newUser.subject,
          attendance: newUser.attendance,
          createdAt: newUser.createdAt && newUser.createdAt.toISOString(),
        },
      };
    } catch (err) {
      console.error('createEmployee mutation error:', err);
      throw new Error(err.message);
    }
  },

  updateEmployee: async ({ id, name, age, class: className, subject, attendance }, context) => {
    try {
      // no admin required
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (age) updateData.age = age;
      if (className) updateData.class = className.trim();
      if (subject) updateData.subject = subject.trim();
      if (attendance) updateData.attendance = attendance.toString().trim();

      const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).exec();
      if (!updatedUser) {
        throw new Error('Employee not found');
      }
      return {
        message: 'Employee updated successfully',
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          age: updatedUser.age,
          class: updatedUser.class,
          subject: updatedUser.subject,
          attendance: updatedUser.attendance,
          createdAt: updatedUser.createdAt && updatedUser.createdAt.toISOString(),
        },
      };
    } catch (err) {
      console.error('updateEmployee mutation error:', err);
      throw new Error(err.message);
    }
  },

  deleteEmployee: async ({ id }, context) => {
    try {
      // no admin required
      const deletedUser = await User.findByIdAndDelete(id).exec();
      if (!deletedUser) {
        throw new Error('Employee not found');
      }
      return {
        message: 'Employee deleted successfully',
        user: {
          id: deletedUser._id.toString(),
          name: deletedUser.name,
          age: deletedUser.age,
          class: deletedUser.class,
          subject: deletedUser.subject,
          attendance: deletedUser.attendance,
          createdAt: deletedUser.createdAt && deletedUser.createdAt.toISOString(),
        },
      };
    } catch (err) {
      console.error('deleteEmployee mutation error:', err);
      throw new Error(err.message);
    }
  },
};

function graphqlMiddleware(context = {}) {
  return graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
    context,
  });
}

async function applyGraphQL(app, path = '/graphql') {
  app.use(path, async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = getTokenFromHeader(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        try {
          const account = await Account.findById(decoded.accountId);
          req.context = { account };
        } catch (err) {
          req.context = {};
        }
      } else {
        req.context = {};
      }
    } else {
      req.context = {};
    }
    next();
  });

  app.use(path, (req, res, next) => {
    graphqlMiddleware(req.context)(req, res, next);
  });
}

module.exports = {
  graphqlMiddleware,
  applyGraphQL,
};