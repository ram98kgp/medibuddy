
// defining a mongoose schema 
// including the module
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
// declare schema object.
var Schema = mongoose.Schema;

var itemSchema = new Schema({

	itemName  			: {type:String,default:'',required:true},
	category			: {type:String,default:'',required:true},
	itemDescription		: {type:String,default:''},
	itemBrand			: {type:String,default:'',required:true},
	manufacturer		: {type:String,default:''},
	imageUrl  			: {type:String,default:'',required:true},
	price	  			: {type:Number,default:'',required:true},
	inStock				: {type:Boolean,default:'',required:true},
	isAvailable			: {type:Boolean,default:'',required:true},
	codAvailable		: {type:Boolean,default:''},
	deliveredBy			: {type:String,default:'MediBuddy'},
	offers				: {type:String,default:''},
	discount			: {type:Number,default:0,required:true},
	size				: {type:String,default:''},
	color				: {type:String,default:''},
	netPrice            : {type:Number,default:0},
	stockCount			: {type:Number,default:0}
});


mongoose.model('Item',itemSchema);