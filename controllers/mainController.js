const User = require("../models/userModel");
const Property = require("../models/propertyModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");


exports.getSignup = (req, res) => {
  const role = req.query.role || '';
  console.log('role: ', role)
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
  
    res.status(200).render("home", {
      title: "Land and Property management",
      activePage: "home",
      properties: properties
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
        console.log("Fetching featured properties...");
        const featuredProperties = await Property.find({ featured: true }).populate("agent");
        console.log("Featured properties fetched:", featuredProperties);

        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };

        console.log("Applying filters and pagination...");
        const features = new APIFeatures(Property.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        console.log("Fetching main properties...");
        const mainproperties = await features.query;
        console.log("Main properties fetched:", mainproperties);

        const totalProperties = await Property.countDocuments(filter);
        const totalPages = Math.ceil(totalProperties / 9); // 9 properties per page

        console.log("Rendering properties page...");
        res.status(200).render("properties", {
            title: "All Properties",
            activePage: "properties",
            mainproperties: mainproperties,
            properties: featuredProperties,
            currentPage: req.query.page || 1,
            totalPages: totalPages
        });
        console.log("Properties page rendered successfully");
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
    console.log("the current prroperty details is :", property)
  
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
      });
    } catch (err) {
      res.status(404).json({
        status: 'fail',
        message: err.message,
      });
    }
  };
  