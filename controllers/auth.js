const User = require('../models/user');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

exports.register = (req, res, next) => {

    // complete

    const email = req.body.result.email;
    let nickname = req.body.result.nickname;
    if(nickname === '') {
        nickname = 'Anonymous';
    }
    const password = req.body.result.password;

    bcrypt.hash(password, 12)
    .then(hashedPw => {
        const user = new User({
            email: email,
            password: hashedPw,
            nickname: nickname,
            gender: req.body.result.gender,
            lat: '',
            lng: '',
            accessLevel: 0
        });
        return user.save();
    })
    .then(result => {
        const token = jwt.sign({
            email: result.email,
            userId: result._id.toString()
        },
            `${process.env.SECRET_KEY}`,
            { expiresIn: '12h' }
        );


        res.status(201).json({message: 'User created!', userId: result._id, token: token});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.saveTrueUserLoc = (req, res, next) => {

    // get token
    // get latitude
    // get longitude
    // get api key
    token = req.body.data.token;
    lat = req.body.data.lat;
    lng = req.body.data.lng;
    api = process.env.GOOGLE_API_KEY;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }


    // get user records
    User.findOne({_id: decodedToken.userId})
    .then(usr => {
        // got user records
        // console.log(user);

        usr.location = {
            type: "Point",
            coordinates: [lng, lat]
        };

        if(usr.trueLoc === false) {
            // have latitude and longitude - get other info
            axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${api}`)
            .then(result => {
                // got location!

                    // save callback results
                    usr.streetNumber = result.data.results[0].address_components[0].long_name;
                    usr.streetName = result.data.results[0].address_components[1].long_name;
                    usr.suburb = result.data.results[0].address_components[2].long_name;
                    usr.state = result.data.results[0].address_components[4].long_name;
                    usr.country = result.data.results[0].address_components[5].long_name;
                    usr.countryCode = result.data.results[0].address_components[5].short_name;
                    usr.postcode = result.data.results[0].address_components[6].long_name;
                    usr.trueLoc = true;
                    usr.save();

                    // store saved user data in a return object for the client
                    clientReturn = {
                        suburb: usr.suburb,
                        state: usr.state,
                        country: usr.country,
                        countryCode: usr.countryCode,
                        postcode: usr.postcode,
                        trueLoc: usr.trueLoc
                    };

                    //return json
                    res.status(200).json({
                        message: "User true location saved!",
                        user: clientReturn
                    });
            })
            .catch((err) => {
                console.log(err);
                err.statusCode = 500;
                err.message = "Google maps failed!";
                throw err;
            });
        } else {
            // true location data exists
            //return json
            res.status(200).json({
                message: "data exists"
            });
        }
    })
    .catch(err => {
        // couldnt get user records therefore invalid token
        console.log(err);
        err.statusCode = 500;
        throw err;
    });
};

exports.saveRoughUserLoc = (req, res, next) => {
    token = req.body.data.token;
    ip = req.body.data.ip;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        throw err;
    }

    // now need to get geolocation from ip
    axios.get(`${process.env.GEOSITE}?ip=` + ip)
    .then(result => {
        // success managed to get location without permission (not accurate though - save later!)!
        console.log('got location!');
        console.log(result);

        // get user records
        User.findOne({_id: decodedToken.userId})
        .then(usr => {
            // got user records

            // should check to see if a true location exists. if so, push existing location to location array
            if(usr.trueLoc === true) {
                // true location exists

                // arrayTemp = usr.prevLocs || [];
                // arrayTemp.push({
                //     trueLoc: usr.trueLoc,
                //     country: usr.country,
                //     countryCode: usr.countryCode,
                //     state: usr.state,
                //     suburb: usr.suburb,
                //     streetNumber: usr.streetNumber,
                //     streetName: usr.streetName,
                //     postcode: usr.postcode
                // });
            }
            else {

                // update user values and reset true location back to false
                usr.trueLoc = false;
                usr.country = result.data.geoplugin_countryName;
                usr.countryCode = result.data.geoplugin_countryCode;
                usr.state = result.data.geoplugin_regionName;
                usr.suburb = result.data.geoplugin_city;
                lng = result.data.geoplugin_longitude;
                lat = result.data.geoplugin_latitude;


                // geotagging
                usr.location = {
                    type: "Point",
                    coordinates: [lng,lat]
                };

                //save user
                usr.save();
            }

            usrReturn = {
                country: usr.country,
                countryCode: usr.countryCode,
                state: usr.state,
                suburb: usr.suburb,
                location: usr.location.coordinates,
                trueLoc: usr.trueLoc,
            };

            console.log('responding...');

            // respond with client info
            res.status(200).json({user: usrReturn});
        })
        .catch(err => {
            // couldnt get user records therefore invalid token
            console.log(err);
            err.statusCode = 500;
            throw err;
        });
    })
    .catch(err => {
        // let user know page cannot load until they allow geolocation
        err.message = 'could not get location goddamnit';
        err.statusCode = 500;
        next(err);
    });
}


exports.getUserLoc = (req, res, next) => {

    // get user location details from database

    // get tokens
    token = req.body.data.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        next(err)
    }

    // get user records
    User.findOne({_id: decodedToken.userId})
    .then(result => {

        // store user location details to send back
        const locInfo = {
            lat: result.lat,
            lng: result.lng,
            country: result.country,
            countryCode: result.countryCode,
            state: result.state,
            suburb: result.suburb,
            postcode: result.postcode,
            trueLoc: result.trueLoc
        };

        // send back user location details from database
        res.status(200).json({ locInfo });
    })
    .catch(err => {
        err.statusCode = 500;
        err.message = "Error finding user in database. Invalid token?";
        throw err;
    });
};

exports.getUserById = (req, res, next) => {
     // get tokens
     token = req.body.data.token;
     id = req.body.data.id;

     

     // verify token
     let decodedToken;
     try {
         decodedToken = jwt.verify(token, process.env.SECRET_KEY)
     } catch(err) {
         res.status(200).json({
             message: "An error occurred"
         });
     }

     const user = User.findById(id)
            .populate('confessionsList')
            .populate('chatList')
            .then(result => {
                console.log("id: " + id);
                console.log(result);
                res.json({
                    user: {
                        _id: result._id,
                        nickname: result.nickname,
                        chatList: result.chatList
                    }
                });
            })
            .catch(err => {
                err.statusCode = 500;
                throw err;
            });

}

exports.getChatList = async(req, res, next) => {

    token = req.body.data.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        res.status(200).json({
            message: "An error occurred"
        });
    }

    console.log(decodedToken.userId);

    userId = decodedToken.userId;

    Message.find({
        $or: [
            {receiver: userId},
            {sender: userId}
        ]
    })
    .select('message conversationId sender receiver')
    .then( data => {
        if(data === null)
        {
            res.status(200).json({
              error: "No Conversation Exists",
              messages: {
                message: []
              }

            });
        }
        if(data) {
            let finaldata = [];
            for(let i = 0; i < data.length; i++) {
                if(userId === data[i].sender || userId === data[i].receiver) {
                    finaldata.push(data[i]);
                }
            }
            res.status(200).json({
                message: 'Conversations Returned!',
                conversations: finaldata
            });
        }

    })
    .catch(err => {
        console.log(err);
    });

}

exports.login = (req, res, next) => {

    // console.log(req.body.result.email);

    const email = req.body.result.email;
    const password = req.body.result.password;
    let loadedUser;
    User.findOne({email: email})
    .then(user => {
        if(!user) {
            const error = new Error('Invalid Username/Password');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
        if(!isEqual) {
            const error = new Error('Invalid Username/Password');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign({
            email: loadedUser.email,
            userId: loadedUser._id.toString()
        },
            process.env.SECRET_KEY,
            { expiresIn: '12h' }
        );
        res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.getAllUsers = (req, res, next) => {

    token = req.body.data.token;

    // verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    } catch(err) {
        err.statusCode = 500;
        next(err)
    }

    User.find({})
    .populate('confessionsList')
    .populate('chatList')
    .then(users => {
        console.log(users);
        res.status(200).json({
            message: 'All users',
            users: users
        });
    })
    .catch(err => {
        err.statusCode = 500;
        next(err);
    })
}