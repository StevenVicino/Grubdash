const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

function list(req, res) {
  //Responds with all orders data
  res.json({ data: orders });
}

function bodyHas(propertyName) {
  //Validates if data body has input property and that property is not empty
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName].length > 0) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function validDish(req, res, next) {
  //Validates that there is at least one dish in the order
  const { data: { dishes } = {} } = req.body;
  if (dishes.length < 1 || !Array.isArray(dishes)) {
    next({ status: 400, message: "Order must include at least one dish" });
  }
  return next();
}

function validQuantity(req, res, next) {
  //Validates that the quantity is an integer greater than 0
  const { data: { dishes } = {} } = req.body;
  dishes.map((dish, index) => {
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      dish.quantity < 1
    ) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function create(req, res, next) {
  //Creates a new order with a randomly generated id
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
  //Validates that the requested order exists in the orders-data array
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order does not exist ${orderId}` });
}

function read(req, res, next) {
  //Responds with the requested order data
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  //Updates specified order if there is a status that is pending
  const order = res.locals.order;
  const { orderId } = req.params;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  if (!status || status !== "pending") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if (orderId == id || !id || id.length < 1) {
    order.id = orderId;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    res.json({ data: order });
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
}

function destroy(req, res, next) {
  //Deletes order if status is pending
  const { orderId } = req.params;

  if (res.locals.order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    bodyHas("dishes"),
    validDish,
    validQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHas("deliverTo"),
    bodyHas("mobileNumber"),
    bodyHas("dishes"),
    validDish,
    validQuantity,
    update,
  ],
  delete: [orderExists, destroy],
};
