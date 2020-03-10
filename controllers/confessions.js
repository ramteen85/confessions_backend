const User = require('../models/user');
const Confession = require('../models/confession');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const cloudinary = require('cloudinary');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// function to verity the token
verifyToken = (token, key) => {
    try {
        return jwt.verify(token, key);
    } catch (e) {
        return null;
    }
}

// upload to cloudinary
uploads = (file, folder) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, (result) => {
            resolve({
                url: result.url,
                id: result.public_id,
                version: result.version
            });
        }, {
            resource_type: "auto",
            folder: folder
        });
    });
}

// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString('base64');
}

// function to create file from base64 encoded string
// function base64_decode(base64str, file) {
//     // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
//     var bitmap = Buffer.from(base64str, 'base64');
//     // write buffer to file
//     fs.writeFileSync(file, bitmap);
//     console.log('******** File created from base64 encoded string ********');
// }

function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
};

exports.createConfession = async(req, res, next) => {

    // todo: create loading screen / progress bar on frontend

    // get token
    token = req.body.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(decodedToken === null) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        // console.log(req.file);

        // form validation
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const error = new Error('Validation failed.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        let result;

        // if imageUrl is blank, give it a default value
        if(req.files[0] === undefined) {
            // image does not exist. set default image URL
            imageUrl = 'https://www.bigstockphoto.com/blog/wp-content/uploads/2014/01/66006-bigstock-confession-concept-42406879.jpg';
            result = {
                id: '',
                version: ''
            };
        }else {
            // get string encoding of file
            const fileString = base64_encode(req.files[0].path);

            // initialise uploader
            const uploader = async(path) => await uploads(path, 'confessions');

            // image exists - handle image upload here
            result = await uploader(fileString);

            console.log('result');
            console.log(result);

            // delete file
            fs.unlinkSync(req.file.path);

            // save cloudinary image url
            imageUrl = result.url;

        }

        // get user
        let usr = await User.findById(decodedToken.userId);

        // get the other variables
        confData = {
            imageUrl: imageUrl,
            categories: req.body.categories,
            subject: req.body.subject,
            post: req.body.post,
            creator: decodedToken.userId,
            location: usr.location.coordinates
        };

        // create confession
        const confession = new Confession({
            creator: confData.creator,
            subject: confData.subject,
            categories: confData.categories,
            content: confData.post,
            imageUrl: confData.imageUrl, // have to work on this
            location: {
                type: "Point",
                coordinates: confData.location
            },
            image: {
                imgId: result.id,
                imgVersion: result.version
            }
            // createdAt: moment.tz(Date.now(), "Australia/Sydney")
        });

        await confession.save();

        // add confession to confessions list
        usr.confessionList.push({
            confessionId: confession._id
        });

        // save user

        await usr.save();

        // send signal back (will have to restrict data later)
        console.log('success!');

        res.status(200).json({
            message: 'Confession created!',
            confession: confession
        });

    }
    catch(err) {
        console.log(err);
        next(err);
    };

};

exports.getLatestConfessions = async(req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        //variables
        const currentPage = req.body.confData.page || 1;
        const perPage = 8;

        let confessions = await Confession.find()
        .sort({createdAt: 'desc'})
        .select("totalHearts totalHates subject content imageUrl _id createdAt")
        .populate("creator", 'nickname location')
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

        // return response
        res.status(200).json({
            message: 'Confessions fetched!',
            confessions: confessions
        });

    }
    catch(err) {
        console.log(err);
        next(err);
    };
};

exports.getPopularConfessions = async(req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        //variables
        const currentPage = req.body.confData.page || 1;
        const perPage = 8;

        let confessions = await Confession.find()
        .sort({popScore: 'desc'})
        .select("totalHearts totalHates subject content imageUrl _id createdAt")
        .populate("creator", 'nickname location')
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

        // return response
        res.status(200).json({
            message: 'Confessions fetched!',
            confessions: confessions
        });
    }
    catch(err) {
        console.log(err);
    };
};

exports.getHatedConfessions = async(req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }


    try {
    //variables
        const currentPage = req.body.confData.page || 1;
        const perPage = 8;

        let confessions = await Confession.find()
        .sort({popScore: 'asc'})
        .select("totalHearts totalHates subject content imageUrl _id createdAt")
        .populate("creator", 'nickname location')
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

        // return response
        res.status(200).json({
            message: 'Confessions fetched!',
            confessions: confessions
        });
    }
    catch(err) {
        console.log(err);
        next(err);
    };
}

exports.saveDistance = async(req, res, next) => {
    // get token
    token = req.body.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }


    try{
        // get distance
        let distance = req.body.distance;
        let usr = await User.findById(decodedToken.userId);

        usr.distance = distance;
        await usr.save();

        res.status(200).json({
            message: "ok"
        });
    }
    catch(err) {
        console.log(err);
        next(err);
    }
}


exports.getNearestConfessions = async (req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        //variables
        const currentPage = req.body.confData.page || 1;
        const perPage = 8;
        let distance;

        let usr = await User.findById(decodedToken.userId);
        console.log('reached user');
        console.log(usr);
        distance = usr.distance * 1000;
        let confessions = await Confession.find(
            {
                location: {
                    $near: {
                        $maxDistance: distance,
                        $geometry: {
                            type: "Point",
                            coordinates: [usr.location.coordinates[0], usr.location.coordinates[1]]
                        }
                    }
                }
            }
        )
        .select("totalHearts totalHates subject content imageUrl _id createdAt")
        .populate("creator", 'nickname location')
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

        // return response
        res.status(200).json({
            message: 'Confessions fetched!',
            confessions: confessions,
            distance: distance / 1000
        });
    }
    catch(err) {
        err.statusCode = 500;
        err.message = "could not get geotag from user for query...";
        next(err);
    };

    // res.status(200).json({ results: distance(150.895533, 34.414467699999996, 150.844376, 34.673820, "K") });
};

exports.getConfession = async(req, res, next) => {
    // get token
    token = req.body.confData.token;
    id = req.body.confData.id;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        let usrlat = 0;
        let usrlng = 0;

        let usr = await User.findById(decodedToken.userId);

        usrlat = usr.location.coordinates[1];
        usrlng = usr.location.coordinates[0];

        // get the confession
        let confession = await Confession.findOne({_id: id})
        .populate("creator", "nickname location _id");

        res.status(200).json({
            confession: confession,
            distance: distance(usrlng, usrlat, confession.location.coordinates[0], confession.location.coordinates[1], "K")
        });
    }
    catch(err) {
        err.statusCode = 500;
        next(err);
    }
};

exports.heartPost = async(req, res, next) => {
    token = req.body.confData.token;

    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        confession_id = req.body.confData.id;
        let totalHearts;
        let confession = await Confession.findOne({_id: confession_id});

        if(confession.usersHearted.includes(decodedToken.userId) === false) {
            if(confession.usersHated.includes(decodedToken.userId) === true) {
                tempIndex = confession.usersHated.indexOf(decodedToken.userId);
                confession.usersHated.splice(tempIndex, 1);
                confession.totalHates -= 1;
            }
            confession.totalHearts += 1;
            confession.usersHearted.push(decodedToken.userId);
        } else {
            confession.totalHearts -= 1;
            index = confession.usersHearted.indexOf(decodedToken.userId);
            confession.usersHearted.splice(index, 1);
        }

        confession.popScore = confession.totalHearts - confession.totalHates;


        await confession.save();

        res.status(200)
        .json({
            confession: confession,
            hearts: confession.totalHearts,
            hates: confession.totalHates
        });
    }
    catch(err) {
        err.statusCode = 500;
        next(err);
    };
}

exports.hatePost = async(req, res, next) => {
    token = req.body.confData.token;

    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        confession_id = req.body.confData.id;
        let confession = await Confession.findOne({_id: confession_id});

        if(confession.usersHated.includes(decodedToken.userId) === false) {
            if(confession.usersHearted.includes(decodedToken.userId) === true) {
                tempIndex = confession.usersHearted.indexOf(decodedToken.userId);
                confession.usersHearted.splice(tempIndex, 1);
                confession.totalHearts -= 1;
            }
            confession.totalHates += 1;
            confession.usersHated.push(decodedToken.userId);
        } else {
            confession.totalHates -= 1;
            index = confession.usersHated.indexOf(decodedToken.userId);
            confession.usersHated.splice(index, 1);
        }

        confession.popScore = confession.totalHearts - confession.totalHates;

        await confession.save();
        res.status(200)
        .json({
            confession: confession,
            hearts: confession.totalHearts,
            hates: confession.totalHates
        });
    }
    catch(err) {
        err.statusCode = 500;
        next(err);
    }
}

exports.deleteConfession = async(req, res, next) => {
    token = req.body.confData.token;

    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken = verifyToken(token, process.env.SECRET_KEY);

    if(!decodedToken) {
        res.status(200).json({
            message: 'invalid token'
        });
    }

    try {

        //get confession id
        confessionId = req.body.confData.id;

        let user = await User.findById(decodedToken._id);

        //get user confessionList
        let confessionList = user.confessionList;
        let index = confessionList.findIndex(conf => conf.confessionId === confessionId);

        if(index === -1) {
            res.status(200).json({
                message: 'This user cannot delete this confession...'
            });
        }
        else {
            confessionList = confessionList.splice(index, 1);
            user.confessionList = confessionList;
            await user.save();
        }

        //get actual confession
        let data = await Confession.deleteOne({"_id": confessionId});

        console.log(user);
        res.status(200).json({
            data: data
        });
    }
    catch(err) {
        err.statusCode = 500;
        next(err);
    }
}