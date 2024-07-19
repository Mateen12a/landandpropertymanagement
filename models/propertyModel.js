const mongoose = require("mongoose");
const slugify = require("slugify");

const alphanumericValidator = (value) => /^[a-zA-Z0-9\s/.()-]+$/.test(value);

const propertyTypeCheck = function () {
  return this.type !== "land";
};

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A property must have a name"],
    trim: true,
    maxLength: [200, "A property must have less or equal than 200 characters"],
    validate: {
      validator: alphanumericValidator,
      message: "Property name must contain only alphanumeric characters",
    },
  },
  slug: String,
  price: {
    type: Number,
    required: [true, "A property must have a price"],
    validate: {
      validator: function (val) {
        return val >= 0;
      },
      message: "Price ({VALUE}) must be greater than or equal to zero",
    },
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        return val >= 0;
      },
      message: "Discount price ({VALUE}) must be greater than or equal to zero",
    },
  },
  description: {
    type: String,
    trim: true,
    required: [true, "A property must have a description"],
    maxLength: [5000, "Description should not exceed 5000 characters"],
  },
  imageCover: {
    type: String,
    required: [true, "A property must have a cover image"],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  location: {
    state: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
  },
  type: {
    type: String,
    enum: ["sell", "shortlet", "rent", "land"],
    required: [true, "Select listing type"],
  },
  amenities: {
    type: [
      {
        amenity: {
          type: String,
          trim: true,
          enum: ["bed", "bath", "toilet", "beds", "baths", "toilets"],
          required: function () {
            return this.type !== "land";
          },
        },
        quantity: {
          type: Number,
          required: function () {
            return this.type !== "land";
          },
          validate: {
            validator: function (val) {
              return val >= 0;
            },
            message: "Quantity must be greater than or equal to zero",
          },
        },
      },
    ],
    required: function () {
      return this.type !== "land";
    },
  },
  features: [String],
  youtubeVideo: String,
  instagramVideo: String,
  agent: { type: mongoose.Schema.ObjectId, ref: "User" },
  featured: { type: Boolean, default: false },
  tags: [String],
  installmentPayment: {
    initialPayment: Number,
    monthlyPayment: Number,
    duration: Number, // Duration in months
  },
});

propertySchema.pre("save", function (next) {
  if (propertyTypeCheck()) {
    this.amenities.forEach((el) => {
      if (+el.quantity > 1) el.amenity += "s";
    });
  }
  next();
});

propertySchema.pre("save", function (next) {
  if (this.priceDiscount && this.priceDiscount > this.price) {
    const error = new Error("Discount price should be below the regular price");
    return next(error);
  }
  next();
});

propertySchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Property = mongoose.model("Property", propertySchema, "Property");

module.exports = Property;
