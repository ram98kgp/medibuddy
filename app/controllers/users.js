var mongoose = require('mongoose');
var express = require('express');
mongoose.Promise = require('bluebird');

// express router // used to define routes 
var userRouter  = express.Router();
var userModel = mongoose.model('User');
var orderModel = mongoose.model('Order');
var otpGenerator = require('otp-generator');
var responseGenerator = require('./../../libs/responseGenerator');
var otpMailer = require('./../../libs/otpSenderWithNodeMailer');
var auth = require("./../../middlewares/auth");


module.exports.controllerFunction = function(app) {

    //Login Screen
    userRouter.get('/login/screen',function(req,res){
          
          //Check if error message
          var error=req.session.error;
          req.session.error=null;
          res.render('login',{error:error});     

    });//end get login screen


    //Sign up Screen
    userRouter.get('/signup/screen',function(req,res){
            
        res.render('signup');

    });//end get signup screen


    //Forgot password Screen
    userRouter.get('/forgot-password/screen',function(req,res){
        var error=req.session.error;
        req.session.error=null;   
        res.render('forgot-password',{error:error});

    });//end get forgot passwrord screen


    //Change password Screen
    userRouter.get('/change-password/screen',function(req,res){
        var error=req.session.error;
        req.session.error=null;
        res.render('change-password',{error:error});

    });//end get Change password Screen


    //Logout
    userRouter.get('/logout',auth.checkLogin,function(req,res){
      
      //Destroy session
      req.session.destroy(function(err) {

        res.redirect('/users/login/screen');

      })  ;

    });//end logout
    

    //Get all users
    userRouter.get('/all',auth.checkLogin,function(req,res){

        //begin user find
        userModel.find({},function(err,allUsers){
            if(err){
                var myResponse = responseGenerator.generate(true,"some error",500,null);          
                res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data
                });
            }
            else{
                if(allUsers == null || allUsers[0].userName == undefined)
                {
                    var myResponse = responseGenerator.generate(false,"No users found",200,null);
                    console.log(myResponse);
                    res.render('all-users',{users:allUsers,count:req.session.count});
                }
                else
                {
                    var myResponse = responseGenerator.generate(false,"Fetched Users",200,allUsers);
                    console.log(myResponse);
                    res.render('all-users',{users:allUsers,count:req.session.count});
                }         
               

            }

        });//end user model find 

    });//end get all users


    //Signup
    userRouter.post('/signup',function(req,res){

        //Verify body parameters
        if(req.body.firstName!=undefined && req.body.lastName!=undefined && req.body.email!=undefined && req.body.password!=undefined){

            var newUser = new userModel({
                userName            : req.body.firstName+''+req.body.lastName,
                firstName           : req.body.firstName,
                lastName            : req.body.lastName,
                email               : req.body.email,
                mobileNumber        : req.body.mobile,
                password            : req.body.password,
                billingAddress      : req.body.billingAddress


            });// end new user 

            //Save user
            newUser.save(function(err){
                if(err){

                    var myResponse = responseGenerator.generate(true,"some error"+err,500,null);
                    console.log(myResponse);
                   //res.send(myResponse);
                   res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data,
                     status: myResponse.status
                   });

                }
                else{

                   var myResponse = responseGenerator.generate(false,"Signup Up Successfully",200,newUser);
                   console.log(myResponse);
                   req.session.user = newUser;
                   delete req.session.user.password;
                   res.redirect('/');
                }

            });//end new user save


        }
        else{

            var myResponse = {
                error: true,
                message: "Some body parameter is missing",
                status: 403,
                data: null
            };

            //res.send(myResponse);
            console.log(myResponse);
             res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data,
                     status: myResponse.status
              });

        }
        

    });//end signup


    //Login
    userRouter.post('/login',function(req,res){

        //begin user find
        userModel.findOne({$and:[{'email':req.body.email},{'password':req.body.password}]},function(err,foundUser){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error occurred",500,null);
                console.log(myResponse);
                //res.send(myResponse);
                res.render('error', {
                  message: myResponse.message,
                  error: myResponse.data
                });

            }
            else if(foundUser==null || foundUser==undefined || foundUser.userName==undefined){

                var myResponse = responseGenerator.generate(false,"user not found. Check your email and password",404,null);
                console.log(myResponse.message);
                //res.send(myResponse);
                req.session.error='Invalid Email Id or Password.Try Again';
                res.redirect('login/screen');

            }
            else{
                  var myResponse = responseGenerator.generate(false,"Login Successfull",200,foundUser);
                  console.log(myResponse.message);
                  req.session.user = foundUser;
                   delete req.session.user.password;
                  res.redirect('/');

            }

        });// end find


    });//end login


    //Forgot password Post email
    userRouter.post('/forgot-password',function(req,res){

        //Save email in session
        req.session.toEmail = req.body.email;

        //Begin user email search
        userModel.findOne({'email':req.session.toEmail},function(err,foundUser){
            if(err){
                var myResponse = responseGenerator.generate(true,"some error"+err,500,null);
                console.log(myResponse);
                res.render('error', {
                       message: myResponse.message,
                       error: myResponse.data,
                       status: myResponse.status
                });
            }
            else if(foundUser==null || foundUser==undefined || foundUser.userName==undefined){

                var myResponse = responseGenerator.generate(true,"user not found. Check your email and password",404,null);
                //res.send(myResponse);
                req.session.error='Email not registered.Try again.';
                res.redirect('forgot-password/screen');

            }
            else{
                  var myResponse = responseGenerator.generate(false,"Email Found",200,foundUser);
                  console.log(myResponse);
                  var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
                  req.session.otp=otp;
                  otpMailer.send(otp,req.session.toEmail);
                  res.render('change-password',{count:req.session.count});

            } 
        });//end email search
        

    });//end Forgot password Post email



    //Change password.Post OTP and New Password
    userRouter.post('/change-password',function(req,res){
        
        //Save new password
        var newPassword = req.body;

        //Check if otp is correct
        if(req.session.otp==req.body.otp)
        {
          //Begin user find
          userModel.findOneAndUpdate({'email':req.session.toEmail},newPassword,function(err,foundUser){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);
                console.log(myResponse);
                res.render('error', {
                         message: myResponse.message,
                         error: myResponse.data,
                         status: myResponse.status
                  });

            }
            else{
                  var myResponse = responseGenerator.generate(false,"Changed Password",200,foundUser);
                  console.log(myResponse);
                  res.render('pass-change-success', {
                  count:req.session.count
                });

            }

          });// end find
        }
        else{
            var myResponse = responseGenerator.generate(false,"Invalid OTP",404,null);
            console.log(myResponse);
            req.session.error='Invalid OTP.Try again.';
            res.redirect('change-password/screen');
        }

    });//end change password


    //Delete user by id.Admin section
    userRouter.post('/:userId/delete',auth.checkLogin,function(req,res){
        
        //Remove all cart items of user
        orderModel.remove({'user_id':req.params.userId},function(err,item){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error.Check Id"+err,500,null);
                res.render('error', {
                         message: myResponse.message,
                         error: myResponse.data,
                         status: myResponse.status
                  });
                console.log(myResponse);
             }
            else
            {
                if(item == null || item.length==0)
                {
                  var myResponse = responseGenerator.generate(false,"No cart items",200,item);
                  console.log(myResponse);
                }
                else
                {
                  var myResponse = responseGenerator.generate(false,"Successfully deleted cart items",200,item);
                  console.log(myResponse);
                }
                
            }
        });//end remove

        //Remove user
        userModel.remove({'_id':req.params.userId},function(err,item){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error.Check Id"+err,500,null);
                console.log(myResponse);
                res.render('error', {
                         message: myResponse.message,
                         error: myResponse.data,
                         status: myResponse.status
                  });
             }
            else
            {
                var myResponse = responseGenerator.generate(false,"Successfully deleted user",200,item);
                console.log(myResponse);
                res.redirect('/admin');
            }
        });//end remove


    });//end remove user


    //Get my account details
    userRouter.get('/me',auth.checkLogin,function(req,res){
        console.log(req.session.user);
        res.render('my-account',{user:req.session.user,count:req.session.count});


    });//end get my account details


    //name api
    app.use('/users', userRouter);



 
};//end contoller code