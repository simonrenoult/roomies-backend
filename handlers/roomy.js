var Sequelize = require('sequelize');
var restify = require('restify');

exports.findAll = function(req, res, next){
  req.models.Roomy
    .findAll()
    .complete(function(err, roomies){
      if(!!err) {
        return next(err);
      }

      res.send(200, {error: false, message: roomies});
      return next(roomies);
    });
};

exports.findOne = function(req, res, next){
  req.models.Roomy
    .find({
      where: {uuid: req.params.uuid},
      include: [req.models.Collocation]
    })
    .complete(function(err, roomy){
      if(!!err) {
        return next(err);
      }

      if(!roomy) {
        res.send(404, {
          error: false, 
          message:'Resource #' + req.params.uuid + ' does not exist.'
        });
        return next(roomy);
      }

      res.send(200, {error: false, message: roomy});
      return next(roomy);
    });
};

exports.deleteAll = function(req, res, next){
  req.models.Roomy
    .findAll()
    .complete(function(err, roomies){
      if(!!err) {
        return next(err);
      }

      if(!roomies.length) {
        res.send(404);
        return next();
      }

      var chainer = new Sequelize.Utils.QueryChainer();
      roomies.forEach(function(roomy) {
          chainer.add(roomy.destroy());
      });

      chainer.run();
      res.send(200, {error: false, message: 'Roomies removed'});
      return next();
    });
};

exports.deleteOne = function(req, res, next){
  req.models.Roomy
    .find({where:{uuid:req.params.uuid}})
    .complete(function(err, roomy){
      if(!!err) {
        return next(err);
      }

      if(!roomy) {
        res.send(404);
        return next();
      }

      roomy.destroy().complete(function(err){
        if(err) {
          res.send(500);
          return next();
        }

        res.send(200, {
          error: false, 
          message: 'Roomy #' + roomy.id + ' deleted.'
        });

        return next(roomy);
      });
  });
};

exports.createOne = function(req, res, next) {
  var email    = req.body.email;
  var password = req.body.password;
  var username = req.body.username;

  if(!email) {
    res.send(400, {error: true, message: 'Email is missing'});
    return next();
  }

  if(!username) {
    res.send(400, {error: true, message: 'Username is missing'});
    return next();
  }

  if(!password) {
    res.send(400, {error: true, message: 'Password is missing'});
    return next();
  }

  var roomy = req.models.Roomy.build({
    email: email,
    password: password,
    username: username,
    lat: req.body.lat,
    lng: req.body.lng,
    balance: req.body.balance,
    CollocationId: req.body.collocationId
  });

  roomy
    .save()
    .complete(function(err, roomy) {
      if(!!err){
        if(err.name === 'SequelizeUniqueConstraintError') {
          res.send(409, {
            error: true, 
            message: 'This ' + err.index + ' is already taken'
          });
        }
        // Unhandled error still fails.
        return next(err);
      }

      // Successful save.
      res.send(200, {error: false, message: roomy});
      return next(roomy);
    });
};

exports.updateOne = function(req, res, next){
  req.models.Roomy
    .find({
      where: {uuid: req.params.uuid},
      include: [req.models.Collocation]
    })
    .complete(function(err, roomy){
      if(!!err) {
        return next(err);
      }

      if(!roomy) {
        res.send(404, {error: true, message: 'Could not find the user'});
        return next();
      }

      if(!req.params.collocationId) {
        return next();
      }

      roomy.updateAttributes({CollocationId: req.params.collocationId}).then(function(roomy){
        res.send(200, {error: false, message: roomy});
        return next(roomy);
      });
  });
};
