const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser')
//ROUTES//
const keychain = require('./routes/keychain/route');
const appKeys = require('./routes/appKeys/route');
const getConfig = require('./routes/getConfig/route');
const updateConfig = require('./routes/updateConfig/route');
const createContract = require('./routes/createContract/route');
const pinContent = require('./routes/pinContent/route');
const fetchContent = require('./routes/fetchPinnedContent/route');
const sendTx = require('./routes/sendTx/route');
//END ROUTES///
const cors = require('cors')
const port = 5000;
const app = express();
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json({ limit: '200mb' }))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/v1/keychain', keychain);
app.use('/v1/appkeys', appKeys);
app.use('/v1/getConfig', getConfig);
app.use('/v1/updateConfig', updateConfig);
app.use('/v1/createContract', createContract);
app.use('/v1/pinContent', pinContent);
app.use('/v1/fetchContent', fetchContent);
app.use('/v1/sendTx', sendTx);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

app.listen(port, () => console.log(`Server running on port ${port}!`))

module.exports = app;