const Property = require('../models/propertyModel');

const createProperty = async (req, res) => {
  try {
    // Assuming req.body contains the data from the form or API request
    const {
      name,
      price,
      priceDiscount,
      currency,
      description,
      imageCover,
      images,
      location,
      areaSize,
      type,
      purpose,
      amenities,
      features,
      youtubeVideo,
      instagramVideo,
      agent, // Assuming this comes from authentication or session
      featured,
      tags,
      installmentPayment
    } = req.body;

    // Create a new Property instance
    const newProperty = new Property({
      name,
      price,
      priceDiscount,
      currency,
      description,
      imageCover,
      images,
      location,
      areaSize,
      type,
      purpose,
      amenities,
      features,
      youtubeVideo,
      instagramVideo,
      agent, // This should be populated with the authenticated agent's ObjectId
      featured,
      tags,
      installmentPayment
    });

    // Save the property to the database
    await newProperty.save();

    // Redirect or respond with a success message
    res.redirect('/properties'); // Redirect to the properties list or home page
  } catch (error) {
    // Handle any errors that occur during property creation
    console.error(error);
    res.status(500).send('Error creating property');
  }
};

module.exports = createProperty;
