require('dotenv').config();
import express = require('express');
import cors = require('cors');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');

import adminRouter from './modules/admin/adminRouter';
import { dbConnection } from './utils/dbConnection';
import artistsRouter from './modules/artist/artistsRouter';
import artsRouter from './modules/art/artsRouter';
import supportsRouter from './modules/payment/paymentsRouter';
import contactMessagesRouter from './modules/contactMessages/contactMessagesRouter';
import customerRouter from './modules/customer/customerRouter';
import Artist from './modules/artist/artistModel';
const PORT = process.env.PORT || 8000;

const app = express();
app.use(cors());
dbConnection()
  .then(() => {
    console.log('Database connected');

    // Safe auto-migration: Ensure existing artists without a status are set to approved
    Artist.updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }] },
      { $set: { status: 'approved' } }
    )
      .then((res) => {
        if (res.modifiedCount > 0) {
          console.log(`Auto-migration: set ${res.modifiedCount} existing artists to 'approved'`);
        }
      })
      .catch((err) => {
        console.error('Auto-migration error:', err);
      });

    // Auto-migration: Ensure pre-existing artists without verification fields are marked verified
    Artist.updateMany(
      {
        $or: [
          { isEmailVerified: { $exists: false } },
          { isEmailVerified: null },
          { isPhoneVerified: { $exists: false } },
          { isPhoneVerified: null },
        ],
      },
      {
        $set: {
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      }
    )
      .then((res) => {
        if (res.modifiedCount > 0) {
          console.log(`Auto-migration: marked ${res.modifiedCount} existing artists as verified`);
        }
      })
      .catch((err) => {
        console.error('Auto-migration error:', err);
      });

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,DELETE'
  );
  res.setHeader(
    'Access-Contxprol-Allow-Headers',
    'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization'
  );
  next();
});

app.use((req, res, next) => {
  console.log(req.originalUrl, '\t', req.method, '\t', req.url);
  next();
});

// router middlewares
app.use('/admin', adminRouter);
app.use('/artists', artistsRouter);
app.use('/arts', artsRouter);
app.use('/supports', supportsRouter);
app.use('/contact-messages', contactMessagesRouter);
app.use('/customers', customerRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Supported/Spedat APIs' });
});
