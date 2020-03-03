const User = require('../models/user');
const Confession = require('../models/confession');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

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
}

exports.createConfession = (req, res, next) => {

    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, `${process.env.SECRET_KEY}`)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    // form validation
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    //get image
    imageUrl = req.body.confData.imageUrl;

    // if imageUrl is blank, give it a default value
    if(imageUrl === '' || !imageUrl) {
        imageUrl = '@/img/66006-bigstock-confession-concept-42406879.jpg';
    }

    // get user
    User.findById(decodedToken.userId )
    .then(usr => {

        console.log(usr);

        // get the other variables
        confData = {
            imageUrl: imageUrl,
            categories: req.body.confData.categories,
            subject: req.body.confData.subject,
            post: req.body.confData.post,
            creator: decodedToken.userId,
            location: usr.location.coordinates
        };

        // create confession
        const confession = new Confession({
            creator: confData.creator,
            subject: confData.subject,
            categories: confData.categories,
            content: confData.post,
            imageUrl: confData.imageUrl,
            location: {
                type: "Point",
                coordinates: confData.location
            }
            // createdAt: moment.tz(Date.now(), "Australia/Sydney")
        });

        confession.save();

        // add confession to confessions list
        usr.confessionList.push({
            confessionId: confession._id
        });

        // save user

        usr.save();

        // send signal back (will have to restrict data later)

        res.status(200).json({
            message: 'Confession created!',
            confession: confession
        });
    })
    .catch(err => {
        console.log(err);
    });

};

exports.getLatestConfessions = (req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, `${process.env.SECRET_KEY}`)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    //variables
    const currentPage = req.body.confData.page || 1;
    const perPage = 8;

    Confession.find()
    .sort({createdAt: 'desc'})
    .select("totalHearts totalHates subject content imageUrl _id createdAt")
    .populate("creator", 'nickname location')
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then(confessions => {
        // return response
        res.status(200).json({
            message: 'Confessions fetched!',
            confessions: confessions
        });
    })
    .catch(err => {
        console.log(err);
    });
}

exports.getPopularConfessions = (req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    //variables
    const currentPage = req.body.confData.page || 1;
    const perPage = 8;

    Confession.find()
    .sort({popScore: 'desc'})
    .select("totalHearts totalHates subject content imageUrl _id createdAt")
    .populate("creator", 'nickname location')
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then(confessions => {
        // return response
        res.status(200).json({
            message: 'Confessions fetched!',
            confessions: confessions
        });
    })
    .catch(err => {
        console.log(err);
    });
}

exports.getHatedConfessions = (req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    //variables
    const currentPage = req.body.confData.page || 1;
    const perPage = 8;

    Confession.find()
    .sort({popScore: 'asc'})
    .select("totalHearts totalHates subject content imageUrl _id createdAt")
    .populate("creator", 'nickname location')
    .skip((currentPage - 1) * perPage)
    .limit(perPage)
    .then(confessions => {
        // return response
        res.status(200).json({
            message: 'Confessions fetched!',
            confessions: confessions
        });
    })
    .catch(err => {
        console.log(err);
    });
}

exports.saveDistance = (req, res, next) => {
    // get token
    token = req.body.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    // get distance
    let distance = req.body.distance;

    user = User.findById(decodedToken.userId)
    .then(usr => {
        usr.distance = distance;
        usr.save()
        .then(() => {
            res.status(200).json({
                message: "ok"
            });
        })
        .catch(err => {
            next(err);
        });
    })
    .catch(err => {
        console.log(err);
    })
}


exports.getNearestConfessions = (req, res, next) => {
    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    //variables
    const currentPage = req.body.confData.page || 1;
    const perPage = 8;
    let distance;

    user = User.findById(decodedToken.userId)
            .then(usr => {
                distance = usr.distance * 1000;
                Confession.find(
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
                .limit(perPage)
                .then(confessions => {
                    // return response
                    res.status(200).json({
                        message: 'Confessions fetched!',
                        confessions: confessions,
                        distance: distance / 1000
                    });
                })
                .catch(err => {
                    console.log(err);
                });
            })
            .catch(err => {
                err.statusCode = 500;
                err.message = "could not get geotag from user for query...";
                throw err;
            });

    // res.status(200).json({ results: distance(150.895533, 34.414467699999996, 150.844376, 34.673820, "K") });

    // get all confessions within a certain distance
};

exports.getConfession = (req, res, next) => {
    // get token
    token = req.body.confData.token;
    id = req.body.confData.id;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    let usrlat = 0;
    let usrlng = 0;

    user = User.findById(decodedToken.userId)
    .then(usr => {
        usrlat = usr.location.coordinates[1];
        usrlng = usr.location.coordinates[0];
        // get the confession
        Confession.findOne({_id: id}, function(err, conf){
            if (err){
                err.statusCode = 500;
                throw err;
            }else{
                // found confession
                confession = conf;
                return confession;
            }
        })
        .populate("creator", "nickname location _id")
        .then(confession => {

            res.status(200).json({
                confession: confession,
                distance: distance(usrlng, usrlat, confession.location.coordinates[0], confession.location.coordinates[1], "K")
            });
        })
        .catch(err => {
            err.statusCode = 500;
            throw err;
        });
    })
    .catch(err => {
        next(err);
    })
};

exports.heartPost = (req, res, next) => {
    token = req.body.confData.token;

    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }


    confession_id = req.body.confData.id;

    let confession;
    let totalHearts;

    Confession.findOne({_id: confession_id}, function(err, conf){
        if (err){
            err.statusCode = 500;
            throw err;
        }else{
            // found confession
            confession = conf;
            return confession;
        }
    })
    .then(confession => {
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


        confession.save();

        return confession;
    })
    .then(confession => {
        res.status(200)
           .json({
               confession: confession,
               hearts: confession.totalHearts,
               hates: confession.totalHates
           });
    })
    .catch(err => {
        next(err);
    });
}

exports.hatePost = (req, res, next) => {
    token = req.body.confData.token;

    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }


    confession_id = req.body.confData.id;

    let confession;

    Confession.findOne({_id: confession_id}, function(err, conf){
        if (err){
            err.statusCode = 500;
            throw err;
        }else{
            // found confession
            confession = conf;
            return confession;
        }
    })
    .then(confession => {
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

        confession.save();

        return confession;
    })
    .then(confession => {
        res.status(200)
           .json({
               confession: confession,
               hearts: confession.totalHearts,
               hates: confession.totalHates
           });
    });
}

exports.deleteConfession = (req, res, next) => {
    token = req.body.confData.token;

    // get token
    token = req.body.confData.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    //get confession id
    confessionId = req.body.confData.id;

    //get actual confession
    Confession.deleteOne({"_id": confessionId})
    .then(data => {

        User.findById(decodedToken._id)
        .then(user => {
            console.log(user);
            res.status(200).json({
                data: data
            });
        })
        .catch(err => {
            console.log(err);
        });
    });
}