//Calculate total price from quantity and base price
exports.generate = function(quantity,price){

	var totalPrice = quantity*price;

    return totalPrice;

};