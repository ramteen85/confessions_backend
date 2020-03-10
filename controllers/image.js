const jwt = require('jsonwebtoken');

verifyToken = (token, key) => {
    try {
        return jwt.verify(token, key);
    } catch (e) {
        return null;
    }
}

exports.upload = async(req, res, next) => {
    let token = req.body.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(decodedToken === null) {
        res.status(500).json({
            message: 'invalid token'
        });
    }


    try {
        let file = req.file;
        console.log(file);
        console.log(token);
    }
    catch(err) {
        next(err);
    }
};