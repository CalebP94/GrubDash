const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res){
    res.json({data: orders});
}
function read(req, res){
    res.json({data: res.locals.order})
}
function create(req, res){
    const { data: {deliverTo, mobileNumber, dishes} = {} } = req.body;
    const newId = nextId();
    const newOrder ={
        id: newId,
        deliverTo,
        mobileNumber,
        status: "preparing",
        dishes
    }
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}
function update(req, res, next){
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status } = {} } = req.body;
    if(order.status === "delivered"){
        return next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    }
    if(order.deliverTo !== deliverTo){
        order.deliverTo = deliverTo;
    }
    if(order.mobileNumber !== mobileNumber){
        order.mobileNumber = mobileNumber;
    }
    if(order.status !== status){
        order.status = status;
    }
    res.json({data: order})
}
function destroy(req, res, next){
    const { orderId } = req.params;
    const order = res.locals.order;
    if(order.status !== "pending"){
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        })
    }
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}
//Validation functions using bodyDataHas
function bodyDataHas(propertyName){
    return function(req, res, next){
        const { data = {} } = req.body;
        if(data[propertyName]){
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        });
    }
}
function bodyDataIsValid(propertyName){
    return function(req, res, next){
        const { data = {} } = req.body;
        if(data[propertyName] !== ""){
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        });
    }
}
function dishesAreValid(req, res, next){
    const {data: {dishes} = {} } = req.body;
    if(Array.isArray(dishes) && dishes.length !== 0){
        return next();
    }
    next({
        status: 400,
        message: `Order must include at least one dish`
    })
}
function dishIsValid(req, res, next){
    const {data: {dishes} = {} } = req.body;
    dishes.forEach(dish => {
        if(!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)){
            next({
                status: 400,
                message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`
            })
        }
    })
    next();
}
function orderExists(req, res, next){
    const { orderId } = req.params;
    const found = orders.find(order => order.id === orderId);
    if(found){
        res.locals.order = found;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}`
    })
}
function validId( req, res, next){
    const {orderId} = req.params;
    const { data: {id} = {} } = req.body;
    if(!id || orderId === id){
        return next();
    }
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    })
}
function statusPropertyIsValid(req, res, next){
    const { data: { status } = {} } = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];

    !validStatus.includes(status)
        ? next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, or delivered`
        })
        : status === "delivered"
        ? next({ status: 400, message: `A delivered order cannot be changed`})
        : next();
}
module.exports = {
    list,
    read: [orderExists, read],
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataIsValid("deliverTo"),
        bodyDataIsValid("mobileNumber"),
        dishesAreValid,
        dishIsValid,
        create
    ],
    update: [
        orderExists,
        validId,
        bodyDataHas("deliverTo"),
        bodyDataIsValid("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataIsValid("mobileNumber"),
        bodyDataHas("dishes"),
        statusPropertyIsValid,
        dishesAreValid,
        dishIsValid,
        update
    ],
    delete: [orderExists, destroy],
}