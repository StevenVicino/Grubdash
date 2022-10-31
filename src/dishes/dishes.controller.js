const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function list(req, res) {
  //Responds with all dish data
  res.json({ data: dishes });
}

function bodyHas(propertyName) {
  //Validates if data body has property and that property is not empty
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName].length > 0) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function validPrice(req, res, next) {
  //Validates that the price is an integer greater than 0
  const { data: { price } = {} } = req.body;
  if (price < 1 || !Number.isInteger(price)) {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  return next();
}

function dishExists(req, res, next) {
  //Validates that the dish requested exists in dishes-data array
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish id does not exist: ${dishId}` });
}

function read(req, res, next) {
  //Responds with the data of requested dish
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  //Updates requested dish even if there is no dish id in the body data but not if the body id does not match the requested dish id
  const dish = res.locals.dish;
  const { dishId } = req.params;
  const { data: { id, name, description, image_url, price } = {} } = req.body;
  if (id === dishId || !id) {
    dish.name = name;
    dish.description = description;
    dish.image_url = image_url;
    dish.price = price;
    res.json({ data: dish });
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function create(req, res, next) {
  //Creates a new dish with a new randomized id
  const { data: { id, name, description, image_url, price } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    image_url: image_url,
    price: price,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

module.exports = {
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHas("name"),
    bodyHas("description"),
    bodyHas("image_url"),
    validPrice,
    update,
  ],
  create: [
    bodyHas("name"),
    bodyHas("description"),
    bodyHas("image_url"),
    validPrice,
    create,
  ],
};
