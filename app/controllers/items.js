var mongoose = require('mongoose');
var express = require('express');
mongoose.Promise = require('bluebird');
// express router // used to define routes 
var itemRouter  = express.Router();
var itemModel = mongoose.model('Item');
var orderModel = mongoose.model('Order');
var responseGenerator = require('./../../libs/responseGenerator');
var discountedPriceGenerator = require('./../../libs/discountedPriceGenerator');
var auth = require("./../../middlewares/auth");


module.exports.controllerFunction = function(app) {


    //Home Page 
    app.get('/',auth.checkLogin,function(req,res){

        //Begin order model find for setting cart count
        orderModel.find({'user_id':req.session.user._id},function(err,allOrders){
            if(err){
                 var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);                
                console.log(myResponse);
            }
            else{
                if(allOrders == null || allOrders.length==0)
                {
                    req.session.count=0;
                }
                else
                {
                    req.session.count=allOrders.length;
                }                
            }

        });//end order model find 


        //Begin item model find to get all items
        itemModel.find({},function(err,allItems){
            if(err){                
                var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);                
                console.log(myResponse);
            }
            else{
                if(allItems == null || allItems.itemName == undefined)
                {
                    var myResponse = responseGenerator.generate(false,"No items found"+err,404,null);                
                    console.log(myResponse);
                    res.render('home',{items:allItems,count:req.session.count});
                }
                else
                {
                    var myResponse = responseGenerator.generate(false,"Fetched items",200,allItems);                
                    console.log(myResponse);
                    res.render('home',{items:allItems,count:req.session.count});
                }                
            }

        });//end item model find 

    });//end home

    

    //Admin Section
    app.get('/admin',auth.checkLogin,function(req,res){
        
        //Manage available items
        itemModel.find({},function(err,allItems){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);                
                console.log(myResponse);           
                res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data,
                     status:myResponse.status
              });
            }
            else{
                if(allItems == null || allItems.itemName == undefined)
                {
                    var myResponse = responseGenerator.generate(false,"No items found"+err,404,null);                
                    console.log(myResponse);
                    res.render('admin',{items:allItems,count:req.session.count});
                }
                else
                {
                    var myResponse = responseGenerator.generate(false,"Fetched items",200,allItems);                
                    console.log(myResponse);
                    res.render('admin',{items:allItems,count:req.session.count});
                }                
            }

        });//end item model find


    });//end admin



    //Create item screen
    itemRouter.get('/create/screen',auth.checkLogin,function(req,res){
            
        res.render('create-item',{count:req.session.count});

    });//end create item screen


    //Delete item screen
    itemRouter.get('/delete/screen',auth.checkLogin,function(req,res){
            
        res.render('delete-item',{count:cartLength.getCartLength(req.session.user._id)});

    });//end delete item screen


    //edit item screen
    itemRouter.get('/:itemId/edit/screen',auth.checkLogin,function(req,res){

        itemModel.findOne({'_id':req.params.itemId},function(err,item){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);
                console.log(myResponse);
                res.render('error', {
                         message: myResponse.message,
                         error: myResponse.data,
                         status:myResponse.status
                  });
            }
            else
            {
                var myResponse = responseGenerator.generate(false,"Product Found",200,item);
                req.session.item=item;
                console.log(myResponse);
                res.render('edit-item',{item : item,count:req.session.count});
            }
       

        });//end item find

    });//end edit item screen


    //Create an Item
    itemRouter.post('/create',auth.checkLogin,function(req,res){

        //Verify required values are entered
        if(req.body.itemName!=undefined && req.body.imageUrl!=undefined && req.body.itemDescription!=undefined && req.body.itemBrand!=undefined && req.body.price!=undefined){

            var newItem = new itemModel({
                itemName            : req.body.itemName,
                imageUrl            : req.body.imageUrl,
                price               : req.body.price,
                category            : req.body.category, 
                manufacturer        : req.body.manufacturer,
                deliveredBy         : req.body.deliveredBy,
                itemDescription     : req.body.itemDescription,
                itemBrand           : req.body.itemBrand,
                inStock             : req.body.inStock,
                isAvailable         : req.body.isAvailable,
                codAvailable        : req.body.codAvailable,
                offers              : req.body.offers,
                discount            : req.body.discount,
                size                : req.body.size,
                color               : req.body.color,
                netPrice            : discountedPriceGenerator.generate(req.body.price,req.body.discount),
                stockCount          : req.body.stockCount

            });// end new item 

            //Save new item
            newItem.save(function(err){
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

                    var myResponse = responseGenerator.generate(false,"successfully created item",200,newItem);
                    console.log(myResponse);
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
            console.log(myResponse);
            res.render('error', {
                message: myResponse.message,
                error: myResponse.data,
                status: myResponse.status
            });

        }
        

    });//end create item


    //Edit an item by Id
    itemRouter.post('/:itemId/edit',auth.checkLogin, function (req, res) {

        //Get all changes
        var changes = req.body;

        //Check if discount changed
        if(req.body.hasOwnProperty('discount'))
        {
            changes.netPrice=discountedPriceGenerator.generate(req.body.price,req.body.discount);
        }

        //Begin item update
        itemModel.findOneAndUpdate({'_id':req.params.itemId},changes,function(err,item){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error occurred.Check all parameters."+err,500,null);
                console.log(myResponse);
                res.render('error', {
                     message: myResponse.message,
                     error: myResponse.data
                });
            }
            else
            {           
                var myResponse = responseGenerator.generate(false,"Successfully edited product",200,item);
                console.log(myResponse);
                res.redirect('/admin');
            }
        });//end item update
        
    });//end edit item


    //Delete item by id
    itemRouter.post('/:itemId/delete',auth.checkLogin,function(req,res){
        
        //Begin item remove
        itemModel.remove({'_id':req.params.itemId},function(err,item){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error.Check Id"+err,500,null);
                console.log(myResponse);
                res.render('error', {
                         message: myResponse.message,
                         error: myResponse.data
                  });
             }
            else
            {
                var myResponse = responseGenerator.generate(false,"Successfully deleted product",200,item);
                console.log(myResponse);
                res.redirect('/admin');
            }
        });//end item remove

    });//end delete


    //View a particular item by Id
    itemRouter.get('/:itemId/view',auth.checkLogin,function(req,res){
        
        //begin item find
        itemModel.findOne({'_id':req.params.itemId},function(err,item){
            if(err){
                var myResponse = responseGenerator.generate(true,"Some error"+err,500,null);
                console.log(myResponse);
                res.render('error', {
                         message: myResponse.message,
                         error: myResponse.data
                  });
            }
            else if(item == null || item == undefined || item.itemName == undefined)
            {
                var myResponse = responseGenerator.generate(true,"Product not Found",404,null);
                console.log(myResponse);
                res.render('error', {
                         message: myResponse.message,
                         error: myResponse.data
                  });
            }
            else
            {
                var myResponse = responseGenerator.generate(false,"Product Found",200,item);
                req.session.item=item;
                console.log(myResponse);
                res.render('view-product',{item : item,count:req.session.count});
            }
        });//end item find

    });//end item view




    //Name api
    app.use('/item', itemRouter);



 
};//end contoller code
