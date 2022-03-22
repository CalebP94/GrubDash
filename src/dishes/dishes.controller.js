const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res){
    const dishId = Number(req.params.id)
    res.json({ data: dishes.filter(dishId ? dish => dish.id === dishId : () => true)});
}

function create(req, res){
    const { data: {name, description, price, image_url} = {} } = req.body;
    const newId = nextId();
    const newDish = {
        id: newId,
        name,
        description,
        price,
        image_url
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}
function update(req, res, next){
    const dish = res.locals.dish;
    const { data: {name, description, price, image_url} = {} } = req.body;
    if(dish.name !== name){
        dish.name = name;
    }
    if(dish.description !== description){
        dish.description = description;
    }
    if(dish.price !== price){
        dish.price = price;
    }
    if(dish.image_url !== image_url){
        dish.image_url = image_url;
    }

    res.json({data: dish})
}
function read(req, res){
    res.json({data: res.locals.dish})
}

//Validation functions using separate functions
function bodyHasName(req, res, next){
    const { data: {name} = {} } = req.body;
    if(name && name !== ""){
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a name"
    })
}
function bodyHasDescription(req, res, next){
    const { data: {description} = {} } = req.body;
    if(description && description !== ""){
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a description"
    })
}
function bodyHasPrice(req, res, next){
    const { data: {price} = {} } = req.body;
    if(!price){
        return next({
            status: 400,
            message: "Dish must include a price"
        })
    }
    if(price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        })
    }
    next();
}
function bodyHasUrl(req, res, next){
    const { data: {image_url} = {} } = req.body;
    if(image_url && image_url !== ""){
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a image_url"
    })
}
function dishExists(req, res, next){
    const {dishId} = req.params;
    const found = dishes.find(dish => dish.id === dishId)
    if(found){
        res.locals.dish = found;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}`
    })
}
function validId(req, res, next){
    const {dishId} = req.params;
    const { data: {id} = {} } = req.body;
    if(!id || dishId === id){
        return next();
    }   
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    })
}
module.exports = {
    list,
    create: [
        bodyHasDescription,
        bodyHasName,
        bodyHasPrice,
        bodyHasUrl,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        validId,
        bodyHasDescription,
        bodyHasName,
        bodyHasPrice,
        bodyHasUrl,
        update
    ]
}