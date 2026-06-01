const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.use('/api', routes);
    app.get('/', (req, res) => res.json({ status: 'ok', message: 'Smart Healthcare API' }));
    app.use(require('./middleware/errorHandler'));

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
