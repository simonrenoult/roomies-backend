var
  restify = require('restify'),
  conf    = require('./app'),
  models  = require('./models');

// ---------------- SERVER CONF ---------------- //

var app = restify.createServer({
  logging: true,
  name: conf.name,
  version: '1.0.0'
});

app.use(restify.bodyParser());

app.use(function(req, res, next){
  req.models = models;
  return next();
});

app.use(function(req, res, next) {
  res.setHeader('content-type', 'application/json');
  return next();
});

app.use(function(req, res, next){
  if(req.method === 'GET' && req.url === '/api/auth') {
    return next();
  }

  if(req.method === 'POST' && req.url === '/api/roomies') {
    return next();
  }

  req.models.Roomy
    .findAll({where:{token: req.headers.authorization}})
    .on('success', function(roomy) {
      if(!roomy.length){
        return res.send(401, {error: true, message: 'Unknown token'});
      }

      return next();
    });
});

// ---------------- MONITORING ------------ //

var opbeat = require('opbeat')({
  logging: false,
  organizationId: process.env.OPBEAT_ORG_ID,
  appId: process.env.OPBEAT_APP_ID,
  secretToken: process.env.OPBEAT_SECRET_TOKEN
});

// ---------------- HANLDERS ---------------- //

var miscHandler = require('./handlers/misc');
var roomyHandler = require('./handlers/roomy');

// ---------------- ROUTES ---------------- //

app.get('/', miscHandler.redirectToRootAPI(app));
app.get('/api', miscHandler.apiMethodsList);
app.get('/api/docs', miscHandler.getDocumentation);
app.get('/api/conf', miscHandler.getConf);

app.get('/api/auth', miscHandler.authenticate);

app.get ('/api/roomies', roomyHandler.findAll);
app.post('/api/roomies', roomyHandler.createOne);
app.del ('/api/roomies', roomyHandler.deleteAll);
app.put ('/api/roomies', miscHandler.methodNotAllowed);

app.get ('/api/roomies/:uuid', roomyHandler.findOne);
app.put ('/api/roomies/:uuid', roomyHandler.updateOne);
app.del ('/api/roomies/:uuid', roomyHandler.deleteOne);
app.post('/api/roomies/:uuid', miscHandler.methodNotAllowed);

// ---------------- MISC ---------------- //

module.exports = app;
