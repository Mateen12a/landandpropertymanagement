import axios from "axios";
import { showAlert } from "./alert";

// Function to collect form data
export const formFields = (imageCover, imageList) => {
  const form = new FormData();

  const location = {
    state: document.querySelector(".location-state").value,
  city: document.querySelector(".location-city").value,
  street: document.querySelector(".location-street").value,

  };

  const tags = [...document.querySelectorAll(".chec-tag")].map((el) =>
    el.textContent.trim()
  );

  form.append("name", document.querySelector(".name").value);
  form.append("price", +document.querySelector(".price").value.trim());
  form.append("priceDiscount", +document.querySelector(".priceDiscount").value.trim());
  form.append("description", document.querySelector(".description").value.trim());
  form.append("area", document.querySelector(".area").value.trim());
  form.append("type", document.querySelector(".type").value.trim());
  form.append("location", JSON.stringify(location));
  form.append("imageCover", imageCover);

  // Append tags
  tags.forEach((tag) => form.append("tags", tag));

  // Append images
  for (let i = 0; i < imageList.length; i++) {
    form.append("images", imageList[i]);
  }

  return form;
};

export const addProperty = async (data, type) => {
  try {
    const propertyType = document.querySelector(".type").value.trim().toLowerCase();
    if (propertyType !== "land") {
      const amenities = [
        {
          amenity: type === "new" ? "bed" : document.querySelector(".amenity-bed").dataset.amenity,
          quantity: +document.querySelector(".quantity-bed").value.trim(),
        },
        {
          amenity: type === "new" ? "bath" : document.querySelector(".amenity-bath").dataset.amenity,
          quantity: +document.querySelector(".quantity-bath").value.trim(),
        },
        {
          amenity: type === "new" ? "toilet" : document.querySelector(".amenity-toilet").dataset.amenity,
          quantity: +document.querySelector(".quantity-toilet").value.trim(),
        },
      ];
      data.append("amenities", JSON.stringify(amenities));
    } else {
      data.append("amenities", JSON.stringify([]));
    }
    sessionStorage.setItem('agentId', agentId);

// During property creation, retrieve agent ID from session storage
const agentId = sessionStorage.getItem('agentId');
if (!agentId) {
  showAlert("error", "No agent ID found. Please log in again.");
  return;
}

// Include agent ID in the data sent to the backend
data.append("agent", agentId);
    data.append("agent", agentId);

    const id = window.location.pathname.split("/").find((el) => el.length > 11 && (el !== "property" && el !== "update"));

    const url = type === "new"
      ? "https://landandpropertymanagement.com/api/v1/property/new"
      : `https://landandpropertymanagement.com/api/v1/property/${id}`;

    const token = sessionStorage.getItem('jwt'); // Retrieve the token from localStorage
    if (!token) {
      console.log("No authentication token found. Please log in again.");
      return showAlert("error", "No authentication token found. Please log in again.");
    }

    const res = await axios({
      method: type === "new" ? "POST" : "PATCH",
      url,
      data,
      headers: {
        'Authorization': `Bearer ${token}`, // Include the token in the headers
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Property Posted Successfully");
      setTimeout(() => {
        window.location.assign(`/properties`);
      }, 1500);
    }
  } catch (err) {
    console.error("Error response:", err.response); // Detailed error logging
    showAlert("error", err.response.data.message);
  }
};

// Function to delete a property
export const deleteProperty = async () => {
  try {
    const id = window.location.pathname.split("/").find((el) => el.length > 11 && (el !== "property" && el !== "update"));
    const url = `https://landandpropertymanagement.com/api/v1/property/${id}`;
    const token = sessionStorage.getItem('jwt'); // Retrieve the token from localStorage

    if (!token) {
      showAlert("error", "No authentication token found. Please log in again.");
      return;
    }

    const res = await axios({
      url,
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${token}`, // Include the token in the headers
      },
    });

    if (res.status === 204) {
      showAlert("success", "Deleted");
      setTimeout(() => {
        window.location.assign("/");
      }, 1500);
    }
  } catch (err) {
    console.error("Error response:", err.response); // Detailed error logging
    showAlert("error", err.response.data.message);
  }
};

// Function to update user settings
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === "password"
        ? "https://landandpropertymanagement.com/api/v1/users/updateMyPassword/"
        : "https://landandpropertymanagement.com/api/v1/users/updateMe";

    const token = sessionStorage.getItem('jwt'); // Retrieve the token from localStorage

    if (!token) {
      showAlert("error", "No authentication token found. Please log in again.");
      return;
    }

    const res = await axios({
      method: "PATCH",
      url,
      data,
      headers: {
        'Authorization': `Bearer ${token}`, // Include the token in the headers
      },
    });

    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} Updated successfully`);
      setTimeout(() => {
        window.location.assign("/me");
      }, 1500);
    }
  } catch (err) {
    console.error("Error response:", err.response); // Detailed error logging
    showAlert("error", err.response.data.message);
  }
};

// Function to add or remove a bookmark
export const addBookmark = async (data, type, el = null) => {
  try {
    const url =
      type === "add"
        ? "https://landandpropertymanagement.com/api/v1/users/bookMark/add"
        : "https://landandpropertymanagement.com/api/v1/users/bookmark/remove";

    const token = sessionStorage.getItem('jwt'); // Retrieve the token from localStorage

    if (!token) {
      showAlert("error", "No authentication token found. Please log in again.");
      return;
    }

    const res = await axios({
      method: "PATCH",
      url,
      data,
      headers: {
        'Authorization': `Bearer ${token}`, // Include the token in the headers
      },
    });

    if (res.data.status === "success") {
      if (type === "add") el.classList.add("active");
      showAlert("success", `Bookmark ${type === "add" ? "added" : "removed"}`);
    }
  } catch (err) {
    console.error("Error response:", err.response); // Detailed error logging
    showAlert("error", err.response.data.message);
  }
};
