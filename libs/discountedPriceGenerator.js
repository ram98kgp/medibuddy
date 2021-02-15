//Calculate net price from discount and base price
exports.generate = function(price,discount){

	var totalPrice = price - (0.01*discount*price);

    return totalPrice;

};