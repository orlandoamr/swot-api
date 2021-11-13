var express = require('express');
var router = express.Router();

const passport = require('passport');
const passportJWT = require('passport-jwt');
const extractJWT = passportJWT.ExtractJwt;
const strategyJWT = passportJWT.Strategy;

var swotRouter = require('./swot/index');
var secRouter = require('./sec/index');

passport.use(
    new strategyJWT(
        {
            jwtFromRequest : extractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey : process.env.JWT_SECRET
        },
        (payload, next) => {
            //se pueden hacer validaciones extras
            return next(null, payload);
        }
    )
)


const jwtMiddleware = passport.authenticate('jwt', {session:false});

router.use(passport.initialize());

router.get('/', (req, res, next)=>{
    res.status(200).json({"msg":"Api V1 JSON"});
});

router.use('/swot', jwtMiddleware, swotRouter);
router.use('/sec', secRouter);

module.exports = router;