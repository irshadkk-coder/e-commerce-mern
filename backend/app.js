require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { validateEnv } = require('./config/env');
const { corsOptions,helmetMiddleware,generalLimiter, uploadOptions} = require('./config/security');
const db = require('./config/connection');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

validateEnv();

const app = express();

app.use(helmetMiddleware);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload(uploadOptions));

app.use('/api', userRouter);
app.use('/api/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);



const startServer = () => {
  const PORT = process.env.PORT || 3000;

  db.connect((err) => {
    if (err) {
      console.error('Database connection error:', err);
      process.exit(1);
    }
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
