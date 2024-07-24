const User = require("../models/userModel");
const Property = require("../models/propertyModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
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
    const properties = await Property.find({ featured: true }).populate("agent");
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
        // console.log("Fetching featured properties...");
        const featuredProperties = await Property.find({ featured: true }).populate("agent");
        // console.log("Featured properties fetched:", featuredProperties);

        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        // console.log("Applying filters and pagination...");
        const features = new APIFeatures(Property.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // console.log("Fetching main properties...");
        const mainproperties = await features.query;
        // console.log("Main properties fetched:", mainproperties);

        const totalProperties = await Property.countDocuments(filter);
        const totalPages = Math.ceil(totalProperties / 9); // 9 properties per page

        // console.log("Rendering properties page...");
        res.status(200).render("properties", {
            title: "All Properties",
            activePage: "properties",
            mainproperties: mainproperties,
            properties: featuredProperties,
            currentPage: req.query.page || 1,
            totalPages: totalPages,
            user: res.locals.user
        });
        // console.log("Properties page rendered successfully");
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
    // console.log("the current prroperty details is :", property)
  
    res.status(200).render("singleproperty", {
      title: property.name,
      property: property,
      activePage: "properties"
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
    const agentId = req.user.id; // Assuming you have authentication middleware
  
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
  
    res.render('account', { 
      title: 'Account', 
      activePage: 'account', 
      totalViews: totalViews,
      listings: properties.length,
      listingsByType: listingsByTypeFormatted
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
        title: 'My listings', 
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
      title: 'My Profile',
      activePage: 'account'
    });
}