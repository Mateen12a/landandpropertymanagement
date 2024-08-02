const User = require("../models/userModel");
const Property = require("../models/propertyModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");


exports.getSignup = (req, res) => {
  const role = req.query.role || '';
  // console.log('role: ', role)
    res.status(200).render("signup", {
        user: res.locals.user,
        title: "Create an account",
        activePage: 'register',
        role
    });
  };

exports.getLogin = (req, res) => {
    res.status(200).render("login", {
        user: res.locals.user,
      title: "Login to your account",
      activePage: "login"
    });
  };

exports.getOverview = catchAsync(async (req, res, next) => {
    const properties = await Property.find({ featured: true, approved: true }).populate("agent");
    // const blogs = await Blog.find();
    // console.log("Home is rendered")
    res.status(200).render("home", {
      title: "Land and Property management",
      activePage: "home",
      properties: properties,
      user: res.locals.user
    });
  });

exports.newProperty = (req, res) => {
    res.status(200).render("newproperty", {
      user: req.user,
      title: "Submit New Property",
      activePage: "newproperty"
    });
  };

  exports.getErrorPage = (req, res) => {
    res.status(404).render("404",  { 
        title: "Page not available", 
        activePage: '404',
        msg: "page unavialable"
    });
  };
  exports.getAllProperties = catchAsync(async (req, res, next) => {
    try {
      // Determine if the user is logged in and their role
      let isAdmin = false;
      if (res.locals.user) {
        const currentUserId = res.locals.user.id;
        const user = await User.findById(currentUserId);
        if (user && user.role === 'admin') {
          isAdmin = true;
        }
      }
  
      // Filter for featured properties
      const featuredFilter = isAdmin ? { featured: true } : { featured: true, approved: true };
      const featuredProperties = await Property.find(featuredFilter).populate("agent");
  
      // Filter for main properties
      let filter = {};
      if (req.params.tourId) filter = { tour: req.params.tourId };
      if (!isAdmin) {
        // If not an admin, only retrieve approved properties
        filter.approved = true;
      }
  
      const features = new APIFeatures(Property.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
  
      const mainproperties = await features.query;
      const totalProperties = await Property.countDocuments(filter);
      const totalPages = Math.ceil(totalProperties / 9); // 9 properties per page
  
      res.status(200).render("properties", {
        title: "All Properties",
        activePage: "properties",
        mainproperties: mainproperties,
        properties: featuredProperties,
        currentPage: req.query.page || 1,
        totalPages: totalPages,
        user: res.locals.user
      });
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).send("Server Error");
    }
  });

  exports.getProperty = catchAsync(async (req, res, next) => {
    const property = await Property.findById(req.params.id).populate({
      path: "agent",
      fields: "name companyName logo contact role",
    });
    // Check if the current user is an admin
  const currentUserId = res.locals.user.id;
  const user = res.locals.user;


  if (!property) {
    return next(new AppError('No property found with that ID', 404));
  }

  // let userBuyRequestStatus = null;
  // if (res.locals.user) {
  //   const userBuyRequest = property.buyRequests.find(
  //     (request) => request.user._id.toString() === req.user._id.toString()
  //   );
  //   userBuyRequestStatus = userBuyRequest ? userBuyRequest.status : null;
  // }
  

  console.log('User ID:', user.id);
  console.log('Property Agent ID:', property.agent._id);

  // Allow access if the property is approved or if the user is an admin or the property owner
  if (!property.approved && user.role !== 'admin' && !property.agent._id.equals(user._id)) {
    console.error("You do not have permission to view this property");
    return next(new AppError('You do not have permission to view this property', 403));
  }
    // console.log("the current prroperty details is :", property)
    property.views += 1;
    await property.save();

    res.status(200).render("singleproperty", {
      title: property.name,
      property: property,
      activePage: "properties",
      user
    });
  });


  exports.searchProperties = async (req, res, next) => {
    try {
      const query = req.query.query || '';
      const page = req.query.page * 1 || 1; // Default to page 1
      const limit = 10; // Number of properties per page
      const skip = (page - 1) * limit;
  
      // Build the query object
      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'location.city': { $regex: query, $options: 'i' } },
          { 'location.state': { $regex: query, $options: 'i' } },
          { 'location.street': { $regex: query, $options: 'i' } },
          { type: { $regex: query, $options: 'i' } },
        ],
      };
      if (user.role !== 'admin') {
        // If not an admin, only retrieve approved properties
        searchQuery.approved = true;
      }
  
      // Fetch properties
      const properties = await Property.find(searchQuery).skip(skip).limit(limit);
      const totalProperties = await Property.countDocuments(searchQuery);
      const totalPages = Math.ceil(totalProperties / limit);
  
      res.status(200).render('searchproperties', {
        title: 'Search Results',
        activePage: 'properties',
        mainproperties: properties,
        properties: properties,
        currentPage: page,
        totalPages: totalPages,
        query: query,
        message: totalProperties === 0 ? 'No properties found.' : null,
        user: res.locals.user
      });
    } catch (err) {
      res.status(404).json({
        status: 'fail',
        message: err.message,
      });
    }
  };

exports.account = catchAsync(async (req, res, next) => {
  const userId = res.locals.user.id; // Assuming you have authentication middleware
  const userRole = res.locals.user.role;

  // Fetch common data
  const agentId = userId;

  // Find properties for the agent
  const properties = await Property.find({ agent: agentId })
                                   .populate('agent', 'name companyName');

  // Aggregate total views
  const totalViewsResult = await Property.aggregate([
    { $match: { agent: new mongoose.Types.ObjectId(agentId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } }
  ]);

  // Aggregate listings by property type
  const listingsByType = await Property.aggregate([
    { $match: { agent: new mongoose.Types.ObjectId(agentId) } },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);

  // Format the listings by type for easy use in the template
  const listingsByTypeFormatted = listingsByType.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // Extract total views
  const totalViews = totalViewsResult.length > 0 ? totalViewsResult[0].totalViews : 0;

  // Initialize additional variables
  let buyRequests = [];
  let approvalRequests = [];
  let allProperties = [];
  let approvedProperties = [];

  // Admin-specific data
  if (userRole === 'admin') {
    // Fetch buy requests for admin
    buyRequests = await Property.find({ 'buyRequests.user': { $exists: true } })
                                .populate('buyRequests.user', 'name photo role');

    // Fetch approval requests for properties
    approvalRequests = await Property.find({ approved: false }).select('+createdAt');

    // Fetch all properties (both approved and pending)
    allProperties = await Property.find().select('+createdAt');
    
  }
  // Fetch sold properties and total sales amount
  const { soldProperties, totalSalesAmount, startDate, endDate } = await Property.calculateTotalSales();
  const totalVerifiedUsers = await User.countDocuments({ verified: true });
  const totalUnverifiedUsers = await User.countDocuments({ verified: false });
  const totalUsers = totalVerifiedUsers + totalUnverifiedUsers;

  const percentageVerified = totalUsers ? (totalVerifiedUsers / totalUsers) * 100 : 0;
  const percentageUnverified = totalUsers ? (totalUnverifiedUsers / totalUsers) * 100 : 0;

  // Agent-specific data
  if (userRole === 'agent' || userRole === 'owner' || userRole === 'developer') {
    // Fetch approved properties for the agent
    approvedProperties = await Property.find({ agent: agentId, approved: true });

    // Fetch all properties (both pending and approved) for the agent
    allProperties = await Property.find({ agent: agentId });
  }

  res.render('account', { 
    title: 'Account', 
    activePage: 'account', 
    totalViews: totalViews,
    listings: properties.length,
    listingsByType: listingsByTypeFormatted,
    approvedProperties,
    allProperties,
    buyRequests,
    approvalRequests,
    totalSalesAmount,
    totalVerifiedUsers,
    totalUnverifiedUsers,
    percentageVerified,
    percentageUnverified,
    user: res.locals.user,
    startDate,
    endDate
  });
});


exports.getUsers = catchAsync(async(req, res, next)=>{
  const users = await User.find({ role: { $ne: 'admin' } });
  res.render('users', { 
    title: 'Users', 
    activePage: 'account',
    allUsers: users
  });
});
exports.getUser = catchAsync(async(req, res, next)=>{
  const user = await User.findById(req.params.id)

  res.render('singleuser', { 
    title: user.name, 
    activePage: 'account',
    currentUser: user
  });
})

exports.getBuyRequests = catchAsync(async(req, res, next)=>{
  const userId = res.locals.user.id;

  // Find properties with buy requests made by the logged-in user
  const buyRequests = await Property.find({ 'buyRequests.user': userId })
    .populate('buyRequests.user', 'name photo role')
    .select('+buyRequests.createdAt');

  // Separate buy requests by status
  const pendingBuyRequests = buyRequests.filter(request => request.status === 'pending');
  const approvedBuyRequests = buyRequests.filter(request => request.status === 'approved');
  const rejectedBuyRequests = buyRequests.filter(request => request.status === 'rejected')
  res.render('buyRequests', {
    title: 'Buy Requests',
    activePage: 'account',
    pendingBuyRequests,
    approvedBuyRequests,
    rejectedBuyRequests
  });
});

exports.getBoughtProperties = catchAsync(async (req, res, next) => {
  const userId = res.locals.user.id;
  const boughtProperties = await Property.find({ 'buyRequests.user': userId })
    .populate({
      path: 'buyRequests.user',
      select: 'name photo role',
    });

  res.render('boughtproperties', {
    title: 'Purchased Properties',
    activePage: 'account',
    boughtProperties
  });
});


  //My Listings
exports.mylistings = catchAsync(async (req, res, next) => {
    const agentId = req.user.id; 

    const properties = await Property.find({ agent: agentId })
                                    .populate('agent', 'name companyName');

    // Split properties into 'published' and 'closed'
    const publishedProperties = properties.filter(prop => prop.status === 'published');
    const closedProperties = properties.filter(prop => prop.status === 'closed'); // Assuming you have a 'status' field

    const totalViews = await Property.aggregate([
        { $match: { agent: new mongoose.Types.ObjectId(agentId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    res.render('mylistings', { 
        title: 'Listings', 
        activePage: 'account',
        publishedProperties, // Pass published properties
        closedProperties, // Pass closed properties
        totalViews: totalViews.length > 0 ? totalViews[0].totalViews : 0,
        noListings: properties.length === 0 // Flag for no listings
    });
});
  exports.performance = (req, res) => {
    res.render('performance', { title: 'Performance', activePage: 'account' });
  }
  exports.notifications = (req, res) => {
    res.render('notifications', { title: 'Notifications', activePage: 'account' });
  }

  exports.updateProperty = catchAsync(async (req, res, next) => {
    try {
      // console.log("Req Params: ", req.params.id)
      const property = await Property.findById(req.params.id);
      res.render('updateproperty', {
        title: 'Edit Property',
        property: property,
        activePage: 'account'
      });
    } catch (err) {
      res.status(500).send(err);
    }
  });

  exports.getBookmarks = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate('bookmark');
  
    res.render('bookmark', {
        title: 'Saved Properties',
        properties: user.bookmark,
        activePage: 'account'
      });
  });

exports.getMe = (req, res)=> {
  
    res.render('userprofile', {
      title: 'Profile',
      activePage: 'account'
    });
}