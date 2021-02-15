//OTP sending Module

//Important instructions for using this module
//Sir please allow less secure apps in gmail for this to work
exports.send = function(otp,toEmail){

	var nodemailer = require('nodemailer');
	var smtpTransport = require('nodemailer-smtp-transport');
	var transporter = nodemailer.createTransport(smtpTransport({
	   //First enter Service of your email
	   service: 'Gmail',
	   auth: {
		   //Enter email here
	       user: yourEmailHere,

		   //Enter your password here
	       pass: yourPasswordHere
	   }
	}));

	//OTP Message
    var otpString = "Your OTP is "+otp+".DO NOT SHARE THIS !";

    //Send mail
	transporter.sendMail({
           from: 'hbk46141@gmail.com',
           to: toEmail,
           subject: 'OTP from MediBuddy.com',
           html: otpString,
           text: otpString
        });

	//Free up the resources
    transporter.close();     

};

