const express = require("express");
const propertyController = require("../controllers/propertyController");
const authController = require("../controllers/authController");

const route = express.Router();

route.get("/search", propertyController.searchProperties)
      .get('/agent/:agentId', propertyController.getPropertiesByAgent)
      .get('/agent/total-views/:agentId', propertyController.getTotalViewsByAgent);;
route.post(
  "/new", authController.protect,
  propertyController.uploadPropertyImages,
  propertyController.resizePropertyImages,
  propertyController.createProperty,
);

route.post('/buy/:id', authController.protect, propertyController.sendBuyRequest);
route.patch('/approve/:id', authController.protect, authController.restrictTo(), propertyController.approveProperty);
route.patch('/rejectbuy/:id', authController.protect, authController.restrictTo(), propertyController.rejectBuyRequest);
route.patch('/approvebuy/:id', authController.protect, authController.restrictTo(), propertyController.approveBuyRequest);
route.patch('/pendbuy/:id', authController.protect, authController.restrictTo(), propertyController.pendBuyRequest);
route.patch('/pend/:id', authController.protect, authController.restrictTo(), propertyController.pendingProperty);

route
  .get("/:id", propertyController.getProperty)
  .delete("/:id", authController.protect, propertyController.deleteProperty)
  .patch(
    "/:id",
    authController.protect,
    propertyController.uploadPropertyImages,
    propertyController.resizePropertyImages,
    propertyController.updateProperty
  );
route.get("/", propertyController.getAllProperty);



module.exports = route;
