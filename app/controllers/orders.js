var mongoose = require('mongoose');
var express = require('express');

// express router // used to define routes 
var orderRouter  = express.Router();
var boughtItemModel = mongoose.model('boughtItem');
var orderModel = mongoose.model('Order');
var userModel = mongoose.model('User');
var itemModel = mongoose.model('Item');
mongoose.Promise = require('bluebird');
var responseGenerator = require('./../../libs/responseGenerator');
var orderNumberGenerator = require('gen-id')('nnnnnnnc');
var priceGenerator = require('./../../libs/priceGenerator');
var auth = require("./../../middlewares/auth");


module.exports.controllerFunction = function(app) {

    //Get all cart items made by user
    orderRouter.get('/',auth.checkLogin,function(req,res){
          
        //begin order model  find  
        orderModel.find({'user_id':req.session.user._id},function(err,allOrders){
            if(err){                
                var myResponse = responseGenerator.generate(true,"some error"+err,500,null);
                console.log(myResponse);          
                res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data
                });
            }
            else{
                if(allOrders == null || allOrders.length == 0)
                {
                    var myResponse = responseGenerator.generate(false,"No orders found",200,allOrders);
                    console.log(myResponse);
                    res.render('cart',{orders:allOrders,count:req.session.count});
                }
                else
                {
                    var myResponse = responseGenerator.generate(false,"Fetched orders",200,allOrders);
                    console.log(myResponse);
                    res.render('cart',{orders:allOrders,count:req.session.count});
                }
                
            }

        });//end order model find 

    });//end get cart items


    //Add to Cart
    orderRouter.post('/add',auth.checkLogin,function(req,res){
        
        //Verify body parameters
        if(req.session.item.itemName!=undefined && req.session.item.imageUrl!=undefined && req.session.item.itemDescription!=undefined && req.session.item.itemBrand!=undefined && req.session.item.price!=undefined){

            var date= new Date();
              
            var newOrder = new orderModel({
                item_id				: req.session.item._id,
                user_id             : req.session.user._id,
                billingAddress      : req.session.user.billingAddress,
                confirmationNumber  : '',
                deliveredBy         : req.session.item.deliveredBy,
                deliveryType        : req.body.deliveryType,
                imageUrl            : req.session.item.imageUrl,
                isGift              : req.body.isGift,
                itemBrand           : req.session.item.itemBrand,
                itemDescription     : req.session.item.itemDescription,
                itemName            : req.session.item.itemName,
                manufacturer        : req.session.item.manufacturer,
                offers              : req.session.item.offers,
                orderDate           : date,
                orderNumber         : 1,
                orderStatus         : '',
                paymentMethod       : '',
                price               : req.session.item.netPrice,
                quantity            : req.body.quantity,
                totalPrice          : priceGenerator.generate(req.session.item.netPrice,req.body.quantity),


            });// end new item      

            //Begin save
            newOrder.save(function(err){
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

                   var myResponse = responseGenerator.generate(false,"Added to Cart",200,newOrder);
                   console.log(myResponse);
                   //req.session.order = newOrder;
                   req.session.count++;

                   
                   res.redirect('/orders');
                }

            });//end new order save


        }
        else{

            var myResponse = {
                error: true,
                message: "Some body parameter is missing",
                status: 403,
                data: null
            };
            console.log(myResponse);

             res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data,
                     status: myResponse.status
              });

        }
        

    });//end add to cart


    //Delete cart item
    orderRouter.post('/:orderId/delete',auth.checkLogin,function(req,res){
        
        //Begin cart item remove
        orderModel.remove({'_id':req.params.orderId},function(err,item){
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
                var myResponse = responseGenerator.generate(false,"Successfully deleted order",200,item);
                console.log(myResponse);
                req.session.count--;
                res.redirect('/orders');
            }
        });//end cart remove

    });//end delete

    orderRouter.post('/:orderId/buy',auth.checkLogin,function(req,res){

        
        //begin buying items
        orderModel.findOne({'_id':req.params.orderId},function(err,order){
            if(err || order==null){
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
                itemModel.findOne({'_id': order.item_id},function(err, bought_item){
                    if(err){
                        var myResponse = responseGenerator.generate(true,"Some error.Check Id"+err,500,null);
                        console.log(myResponse);
                        res.render('error', {
                                 message: myResponse.message,
                                 error: myResponse.data,
                                 status: myResponse.status
                          });
                     }
                     else{
                         console.log(`Item found, Stock Count ${bought_item.stockCount}`);
                         itemModel.findByIdAndUpdate(bought_item._id, {'stockCount' : bought_item.stockCount-order.quantity}, function(err,updatedItem){
                            if(err){
                                var myResponse = responseGenerator.generate(true,"Some error.Check Id"+err,500,null);
                                console.log(myResponse);
                                res.render('error', {
                                         message: myResponse.message,
                                         error: myResponse.data,
                                         status: myResponse.status
                                  });
                             }
                             else{
                                 console.log("Stock count successfully updated");
                                 orderModel.remove({'_id': order._id},function(err,removedItem){
                                    if(err){
                                        var myResponse = responseGenerator.generate(true,"Some error.Check Id"+err,500,null);
                                        console.log(myResponse);
                                        res.render('error', {
                                                 message: myResponse.message,
                                                 error: myResponse.data,
                                                 status: myResponse.status
                                          });
                                     }
                                     else{
                                         console.log("Item removed from cart");
                                     }
                                 });
                             }
                         });
                     }
                });
                
            }
            var date = new Date()

            var newBought = new boughtItemModel({
                item_id				: order.item_id,
                user_id             : order.user_id,
                billingAddress      : order.billingAddress,
                confirmationNumber  : '',
                deliveredBy         : order.deliveredBy,
                deliveryType        : order.deliveryType,
                imageUrl            : order.imageUrl,
                isGift              : order.isGift,
                itemBrand           : order.itemBrand,
                itemDescription     : order.itemDescription,
                itemName            : order.itemName,
                manufacturer        : order.manufacturer,
                offers              : order.offers,
                orderDate           : order.orderDate,
                orderNumber         : 1,
                orderStatus         : '',
                paymentMethod       : '',
                price               : order.netPrice,
                quantity            : order.quantity,
                totalPrice          : order.totalPrice,
                boughtDate          : date

            });
            newBought.save(function(err){
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
                   var myResponse = responseGenerator.generate(false,"Added to Bought Items",200,newBought);
                   console.log(myResponse);
                   req.session.count--;

                   console.log("redirecting ... to bought item");
                   res.redirect('/boughtItem');
                }

            });
        });

    });
    app.get('/boughtItem',auth.checkLogin,function(req,res){
          
        //begin order model  find  
        boughtItemModel.find({'user_id':req.session.user._id},function(err,allBoughtItems){
            if(err){                
                var myResponse = responseGenerator.generate(true,"some error"+err,500,null);
                console.log(myResponse);          
                res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data
                });
            }
            else{
                if(allBoughtItems == null || allBoughtItems.length == 0)
                {
                    var myResponse = responseGenerator.generate(false,"No orders found",200,allBoughtItems);
                    console.log(myResponse);
                    res.render('boughtItem',{orders:allBoughtItems,count:req.session.count});
                }
                else
                {
                    var myResponse = responseGenerator.generate(false,"Fetched orders",200,allBoughtItems);
                    console.log(myResponse);
                    res.render('boughtItem',{orders:allBoughtItems,count:req.session.count});
                }
                
            }

        });//end order model find 

    });

    //Name api 
    app.use('/orders', orderRouter);



 
};//end contoller code