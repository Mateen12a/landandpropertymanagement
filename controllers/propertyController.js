const uuid = require("uuid");
const mongoose = require("mongoose")
const multer = require("multer");
const sharp = require("sharp");
const Property = require("../models/propertyModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const User = require("../models/userModel");


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, please upload only images"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadPropertyImages = (req, res, next) => {
  upload.fields([
    { name: "imageCover", maxCount: 1 },
    { name: "images", maxCount: 20 },
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer error occurred (e.g., file size exceeds limits)
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          new AppError(
            "Too many files uploaded for 'images' field. Maximum count is 20.",
            400
          )
        );
      }
    } else if (err) {
      // Other error occurred
      return next(err);
    }
    // No error, proceed to the next middleware
    next();
  });
};

exports.resizePropertyImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  if (req.files.imageCover) {
    req.body.imageCover = `property-${uuid.v4()}-${Date.now()}-cover.jpeg`;

    // Cover image

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/properties/${req.body.imageCover}`);
  }

  if (req.files.images) {
    //images
    if (!req.body.images) {
      req.body.images = [];
    } else if (typeof req.body.images === "string") {
      const arr = [];
      arr.push(req.body.images);

      req.body.images = [...arr];
    }

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `property-${uuid.v4()}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`public/img/properties/${filename}`);

        req.body.images.push(filename);
      })
    );
  }
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createProperty = catchAsync(async (req, res, next) => {
  console.log('Incoming request body:', req.body);

  req.body.amenities = JSON.parse(req.body.amenities);
  req.body.location = JSON.parse(req.body.location);
  console.log('Parsed request body:', req.body);

  // Default status to "published" if not provided
  if (!req.body.status) {
      req.body.status = 'published';
  }

  // Set approved to false by default
  req.body.approved = false;
  const filteredBody = filterObj(
      req.body,
      "amenities",
      "name",
      "price",
      "priceDiscount",
      "imageCover",
      "images",
      "tags",
      "area",
      "type",
      "location",
      "description",
      "agent",
      "status",
      "approved"
  );

  const currentUserId = req.user.id; // Assuming you have middleware to authenticate and set req.user

  const user = await User.findById(currentUserId);
  if (!['agent', 'admin', 'owner', 'developer'].includes(user.role)) {
      return next(new AppError('Only agents, admins, owners, and developers can create properties', 403));
  }
  
  // Inside createProperty
const propertyData = {
  ...filteredBody,
  agent: currentUserId 
};
  const property = await Property.create(propertyData);

  res.status(201).json({
      status: 'success',
      data: {
          data: property,
      },
  });
});


exports.getProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id).populate({
    path: "agent",
    fields: "name companyName",
  });
  // Check if the current user is an admin
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId);

  if (!property) {
    return next(new AppError('No property found with that ID', 404));
  }
    if (!property.approved && user.role !== 'admin') {
      return next(new AppError('You do not have permission to view this property', 403));
    }

  property.views += 1;
  await property.save();
  res.status(200).json({
    status: "success",
    data: {
      data: property,
    },
  });
});

exports.getAllProperty = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // Check if the current user is an admin
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId);
  if (user.role !== 'admin') {
    // If not an admin, only retrieve approved properties
    filter.approved = true;
  }

  const features = new APIFeatures(Property.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const properties = await features.query;

  res.status(200).json({
    status: "success",
    results: properties.length,
    data: {
      data: properties,
    },
  });
});

exports.searchProperties = catchAsync(async (req, res, next) => {
  try {
    const query = req.query.query;

    console.log('Search query:', query);

    // Build the search filter
    const searchFilter = {
      $or: [
        { name: { $regex: new RegExp(query, 'i') } },
        { 'location.city': { $regex: new RegExp(query, 'i') } },
        { 'location.state': { $regex: new RegExp(query, 'i') } },
        { 'location.street': { $regex: new RegExp(query, 'i') } },
        { type: { $regex: new RegExp(query, 'i') } },
      ],
    };

    console.log('Search filter:', JSON.stringify(searchFilter, null, 2));
    // Check if the current user is an admin
  const currentUserId = req.user.id;
  const user = await User.findById(currentUserId);
  if (user.role !== 'admin') {
    // If not an admin, only retrieve approved properties
    searchFilter.approved = true;
  }

    // Direct query
    const properties = await Property.find(searchFilter).select('-__v').exec();
    console.log('Direct query result:', properties);

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: {
        properties: properties
      }
    });
  } catch (error) {
    console.error('Error in searchProperties:', error);
    next(error);
  }
});




exports.deleteProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findByIdAndDelete(req.params.id);

  if (!property)
    return next(new AppError("No document found with that id", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateProperty = catchAsync(async (req, res, next) => {
  // Parse JSON fields
  req.body.amenities = JSON.parse(req.body.amenities);

  // Check if location is sent and parse if necessary
  if (req.body.location) {
    req.body.location = JSON.parse(req.body.location);
  }

  // Filter out unwanted fields
  const filteredBody = filterObj(
    req.body,
    "name",
    "price",
    "priceDiscount",
    "amenities",
    "imageCover",
    "images",
    "tags",
    "area",
    "type",
    "location",
    "description",
    "agent",
    "status"
  );

  // Get the currently logged-in user's ID
  const currentUserId = req.user.id; // Assuming you have middleware to authenticate and set req.user

  // Validate that the user is an agent or admin
  const user = await User.findById(currentUserId);
  if (!['agent', 'admin', 'owner', 'developer'].includes(user.role)) {
    return next(
      new AppError("Only agents, admins, owners, and developers can update properties", 403)
    );
  }

  // Update the property
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!property) {
    return next(new AppError('No property found with that ID', 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: property,
    },
  });
});


exports.getPropertiesByAgent = catchAsync(async (req, res, next) => {
  const agentId = req.params.agentId; // Get agent ID from the URL parameter

  // Validate agentId 
  if (!agentId) {
    return next(new AppError('Invalid agent ID', 400));
  }

  // Find properties by agent, populate the 'agent' field for agent details
  const properties = await Property.find({ agent: agentId }).populate({
    path: 'agent',
    select: 'name companyName' // Select specific fields to populate
  });

  res.status(200).json({
    status: 'success',
    results: properties.length, // Include the number of results for convenience
    data: {
      properties,
    },
  });
});
exports.getTotalViewsByAgent = catchAsync(async (req, res, next) => {
  const agentId = req.params.agentId;

  // Validate agentId 
  if (!agentId) {
    return next(new AppError('Invalid agent ID', 400));
  }

  const result = await Property.aggregate([
    { $match: { agent: new mongoose.Types.ObjectId(agentId) } }, // Filter by agent
    { $group: { _id: null, totalViews: { $sum: "$views" } } } // Sum the views
  ]);

  const totalViews = result.length > 0 ? result[0].totalViews : 0; // Handle case where no properties are found

  res.status(200).json({
    status: 'success',
    data: {
      totalViews,
    },
  });
});

exports.getApprovalRequests = catchAsync(async (req, res, next) => {
  const properties = await Property.find({ approved: false }).populate('agent', 'name email');
  res.status(200).json({
    status: 'success',
    results: properties.length,
    data: {
      properties,
    },
  });
});

exports.getBuyRequests = catchAsync(async (req, res, next) => {
  const properties = await Property.find({ 'buyRequests.0': { $exists: true } }).populate('buyRequests.user', 'name email');
  res.status(200).json({
    status: 'success',
    results: properties.length,
    data: {
      properties,
    },
  });
});

exports.approveProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findByIdAndUpdate(req.params.id, { approved: true }, {
    new: true,
    runValidators: true,
  });

  if (!property) {
    return next(new AppError('No property found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      property,
    },
  });
});

exports.approveBuyRequest = catchAsync(async (req, res, next) => {

  const { id: propertyId } = req.params;
  const { requestId } = req.body; // Ensure this is correctly passed in the body
  console.log("requestId: ", requestId)
  console.log("propertyId: ", propertyId)


  if (!requestId) {
    return next(new AppError('Buy request ID is required', 400));
  }

  const property = await Property.findOneAndUpdate(
    { _id: propertyId, 'buyRequests._id': requestId },
    { 'buyRequests.$.status': 'approved' },
    {
      new: true,
      runValidators: true,
    }
  );
  console.log("Approved Buy request: ", property)

  if (!property) {
    return next(new AppError('No property or buy request found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      property,
    },
  });
});

exports.rejectBuyRequest = catchAsync(async (req, res, next) => {
  const { id: propertyId } = req.params;
  const { requestId } = req.body; // Ensure this is correctly passed in the body
  console.log("requestId: ", requestId)
  console.log("propertyId: ", propertyId)


  if (!requestId) {
    return next(new AppError('Buy request ID is required', 400));
  }

  const property = await Property.findOneAndUpdate(
    { _id: propertyId, 'buyRequests._id': requestId },
    { 'buyRequests.$.status': 'rejected' },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!property) {
    return next(new AppError('No property or buy request found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      property,
    },
  });
});

exports.pendBuyRequest = catchAsync(async (req, res, next) => {
  const { id: propertyId } = req.params;
  const { requestId } = req.body; // Ensure this is correctly passed in the body


  if (!requestId) {
    return next(new AppError('Buy request ID is required', 400));
  }

  const property = await Property.findOneAndUpdate(
    { _id: propertyId, 'buyRequests._id': requestId },
    { 'buyRequests.$.status': 'pending' },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!property) {
    return next(new AppError('No property found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      property,
    },
  });
});

exports.pendingProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findByIdAndUpdate(req.params.id, { approved: false }, {
    new: true,
    runValidators: true,
  });

  if (!property) {
    return next(new AppError('No property found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      property,
    },
  });
});


exports.sendBuyRequest = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError('No property found with that ID', 404));
  }

  const buyRequest = {
    user: req.user.id
  };

  property.buyRequests.push(buyRequest);
  await property.save();

  res.status(200).json({
    status: 'success',
    data: {
      property
    }
  });
});
