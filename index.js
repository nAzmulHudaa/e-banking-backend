const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// Connect to MongoDB database
mongoose.connect('mongodb+srv://nazmulhuda:62968512@cluster0.vzheu8o.mongodb.net/User-DB?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err.message));


const Schema = mongoose.Schema;

const transactionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  accountNo: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentType: {
    type: String,
    enum: ['send', 'received'],
    required: true,
  },
}, { timestamps: true });

// user schema

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  accountNumber: {
    type: String,
    unique: true,
  },
  transactions: [transactionSchema],
  depositBalance: {
    type: Number,
    default: 0,
  },
  currentBalance: {
    type: Number,
    default: 100,
  },
  cardBalance: {
    type: Number,
    default: 0,
  },
});

userSchema.pre('save', function (next) {
  let user = this;
  if (!user.accountNumber) {
    // Generate random account number and set it to user
    let accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    user.accountNumber = accountNumber.toString();
  }
  next();
});




const Transaction = mongoose.model('Transaction', transactionSchema);
const User = mongoose.model('User', userSchema);



// Create Express app
const app = express();
app.use(cors());

// Middleware
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

const JWT_SECRET = crypto.randomBytes(64).toString('hex');
console.log(JWT_SECRET);

// Create a new user
app.post('/user/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = new User({ name, email, password }); // use the hashed password in the user object
    await user.save();
    res.status(201).send(user);
    console.log('user created')
  } catch (error) {
    res.status(400).send(error);
  }
})


// Login
// Login user
app.post('/user/login', async (req, res) => {
  const { email, password } = req.body;
  // console.log(req.body);
  try {
    // Find user by email
    const user = await User.findOne({ email });
    console.log(user)

    // If user not found, send error response
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If password doesn't match, send error response
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Send success response
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/user/logout', (req, res) => {
  res.status(200).send('Logged out successfully');
  console.log("logged out");
});


// withdraw 

app.post('/api/withdraw', async (req, res) => {
  try {
    const {
      senderName,
      senderEmail,
      senderAccountNumber,
      receiverName,
      receiverEmail,
      receiverAccountNumber,
      amount
    } = req.body;

    const senderUser = await User.findOne({ email: senderEmail });
    const receiverUser = await User.findOne({ email: receiverEmail });

    if (!senderUser) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Add transaction details for sender
    const senderTransaction = {
      name: receiverName,
      email: receiverEmail,
      accountNo: receiverAccountNumber,
      amount,
      paymentType: 'send'
    };

    senderUser.transactions.push(senderTransaction);
    let newBalanceSender = Number(senderUser.currentBalance) - Number(amount);
    senderUser.currentBalance = newBalanceSender.toString();
    await senderUser.save();
    // Add transaction details for receiver
    const receiverTransaction = {
      name: senderName,
      email: senderEmail,
      accountNo: senderAccountNumber,
      amount,
      paymentType: 'received'
    };

    receiverUser.transactions.push(receiverTransaction);
    let newBalanceReceiver = Number(receiverUser.currentBalance) + Number(amount);
    receiverUser.currentBalance = newBalanceReceiver.toString();
    await receiverUser.save();
    res.status(200).json({ message: 'Transaction successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// transfer

// withdraw 

app.post('/api/transfer', async (req, res) => {
  try {
    const {
      senderName,
      senderEmail,
      senderAccountNumber,
      receiverName,
      receiverEmail,
      receiverAccountNumber,
      amount
    } = req.body;

    const senderUser = await User.findOne({ email: senderEmail });
    const receiverUser = await User.findOne({ email: receiverEmail });

    if (!senderUser) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Add transaction details for sender
    const senderTransaction = {
      name: receiverName,
      email: receiverEmail,
      accountNo: receiverAccountNumber,
      amount,
      paymentType: 'send'
    };

    senderUser.transactions.push(senderTransaction);
    let newBalanceSender = Number(senderUser.currentBalance) - Number(amount);
    senderUser.currentBalance = newBalanceSender.toString();
    await senderUser.save();
    // Add transaction details for receiver
    const receiverTransaction = {
      name: senderName,
      email: senderEmail,
      accountNo: senderAccountNumber,
      amount,
      paymentType: 'received'
    };

    receiverUser.transactions.push(receiverTransaction);
    let newBalanceReceiver = Number(receiverUser.currentBalance) + Number(amount);
    receiverUser.currentBalance = newBalanceReceiver.toString();
    await receiverUser.save();
    res.status(200).json({ message: 'Transaction successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// latest transactions
app.get('/latest/:email', async (req, res) => {
  const userEmail = req.params.email;
  console.log(userEmail);
  try {
    const user = await User.findOne({ email: userEmail });
    const latestTransactions = user.transactions.slice(0, 10);
    res.json(latestTransactions);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// current balance retrive
app.get('/current-balance/:email', async (req, res) => {
  const userEmail = req.params.email;
  try {
    const user = await User.findOne({ email: userEmail });
    res.json({ currentBalance: user.currentBalance });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});




// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});