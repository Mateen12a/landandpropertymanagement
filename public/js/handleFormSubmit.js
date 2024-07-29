import axios from "axios";
import { showAlert } from "./alert";

// Function to collect form data
export const formFields = (imageCover, imageList) => {
  const form = new FormData();
  const location = {
      state: document.querySelector(".location-state").value,
      city: document.querySelector(".location-city").value,
      street: document.querySelector(".location-street").value
  };
  const tags = [...document.querySelectorAll(".chec-tag")].map((el) => el.textContent.trim());
  form.append("name", document.querySelector(".name").value);
  form.append("price", +document.querySelector(".price").value.trim());
  form.append("priceDiscount", +document.querySelector(".priceDiscount").value.trim());
  form.append("description", document.querySelector(".description").value.trim());
  form.append("area", document.querySelector(".area").value.trim());
  form.append("type", document.querySelector(".type").value.trim());
  tags.forEach((tag) => form.append("tags", tag));
  form.append("location", JSON.stringify(location));

  if (imageCover) {
      form.append("imageCover", imageCover);
  }

  // Include existing images in the form data
  const existingImages = document.querySelectorAll('.property__images-item');
  existingImages.forEach((img) => {
      const imgSrc = img.src.split('/').pop();
      form.append("existingImages", imgSrc);
  });

  for (let i = 0; i < imageList.length; i++) {
      form.append("images", imageList[i]);
  }

  // Only append status if present (for updates)
  const status = document.querySelector(".status")?.value;
  if (status) {
      form.append("status", status);
  }

  return form;
};

export const addProperty = async (data) => {
  try {
      if (document.querySelector(".type").value.trim().toLowerCase() !== "land") {
          const amenities = [
              {
                  amenity: "bed",
                  quantity: +document.querySelector(".quantity-bed").value.trim()
              },
              {
                  amenity: "bath",
                  quantity: +document.querySelector(".quantity-bath").value.trim()
              },
              {
                  amenity: "toilet",
                  quantity: +document.querySelector(".quantity-toilet").value.trim()
              }
          ];
          data.append("amenities", JSON.stringify(amenities));
      } else {
          data.append("amenities", JSON.stringify([]));
      }

      const url = "http://landandpropertymanagement.com/api/v1/property/new";
      const token = localStorage.getItem('jwt');
      if (!token) {
          console.log('No authentication token found. Please log in again.');
          return showAlert('error', 'No authentication token found. Please log in again.');
      }
      const res = await axios({
          method: "POST",
          url,
          data,
      });

      if (res.data.status === "success") {
          showAlert("success", "Property Added Successfully");
          setTimeout(() => {
              window.location.assign(`/property/${res.data.data.data._id}`);
          }, 5000);
      }
  } catch (err) {
      showAlert("error", err.response ? err.response.data.message : "An error occurred");
  }
};

const updateProperty = async (data, id) => {
  try {
    if (document.querySelector(".type").value.trim().toLowerCase() !== "land") {
      const amenities = [
        {
          amenity: "bed",
          quantity: +document.querySelector(".quantity-bed").value.trim()
        },
        {
          amenity: "bath",
          quantity: +document.querySelector(".quantity-bath").value.trim()
        },
        {
          amenity: "toilet",
          quantity: +document.querySelector(".quantity-toilet").value.trim()
        }
      ];
      data.append("amenities", JSON.stringify(amenities));
    } else {
      data.append("amenities", JSON.stringify([]));
    }
<<<<<<< HEAD
=======
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
>>>>>>> d8bbd524af2c9af6314c0e019afdcbd4dddb2f72

    const url = `http://landandpropertymanagement.com/api/v1/property/${id}`;
    const res = await axios({
      method: "PATCH",
      url,
      data,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.data.status === "success") {
      showAlert("success", "Property Updated Successfully");
      setTimeout(() => {
        window.location.assign(`/property/${res.data.data.data._id}`);
      }, 1500);
    }
  } catch (err) {
      showAlert("error", err.response ? err.response.data.message : "An error occurred");
  }
};

// Function to delete a property
export const deleteProperty = async () => {
  try {
    const id = window.location.pathname.split("/").find((el) => el.length > 11 && (el !== "property" && el !== "update"));
<<<<<<< HEAD
    const url = `http://landandpropertymanagement.com/api/v1/property/${id}`;
    const token = localStorage.getItem('jwt'); // Retrieve the token from localStorage
=======
    const url = `https://landandpropertymanagement.com/api/v1/property/${id}`;
    const token = sessionStorage.getItem('jwt'); // Retrieve the token from localStorage
>>>>>>> d8bbd524af2c9af6314c0e019afdcbd4dddb2f72

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
<<<<<<< HEAD
        ? "http://landandpropertymanagement.com/api/v1/users/updateMyPassword/"
        : "http://landandpropertymanagement.com/api/v1/users/updateMe";
=======
        ? "https://landandpropertymanagement.com/api/v1/users/updateMyPassword/"
        : "https://landandpropertymanagement.com/api/v1/users/updateMe";
>>>>>>> d8bbd524af2c9af6314c0e019afdcbd4dddb2f72

    const token = localStorage.getItem('jwt'); // Retrieve the token from localStorage

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
<<<<<<< HEAD
        ? "http://landandpropertymanagement.com/api/v1/users/bookMark/add"
        : "http://landandpropertymanagement.com/api/v1/users/bookMark/remove";
=======
        ? "https://landandpropertymanagement.com/api/v1/users/bookMark/add"
        : "https://landandpropertymanagement.com/api/v1/users/bookmark/remove";

    const token = sessionStorage.getItem('jwt'); // Retrieve the token from localStorage

    if (!token) {
      showAlert("error", "No authentication token found. Please log in again.");
      return;
    }
>>>>>>> d8bbd524af2c9af6314c0e019afdcbd4dddb2f72

    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      if (type === "add") {
        el.classList.add("active");
        el.innerHTML = '<i class="fas fa-heart"></i>'; // Change to filled heart icon
      } else {
        el.classList.remove("active");
        el.classList.add("remove-bookmark-btn");
        el.innerHTML = '<i class="far fa-heart"></i>'; // Change to outlined heart icon
      }
      showAlert("success", `Bookmark ${type === "add" ? "added" : "removed"}`);
    } else {
      showAlert("error", "Failed to update bookmark");
    }
  } catch (err) {
    console.error(err);
    showAlert("error", err.response ? err.response.data.message : "An error occurred");
  }
};
export const removeBookmark = async (data, el = null) => {
  try {
    const url = "http://landandpropertymanagement.com/api/v1/users/bookMark/remove";

    const res = await axios({
      method: "PATCH",
      url,
      data,
    });

    if (res.data.status === "success") {
      el.classList.remove("active");
      el.innerHTML = '<i class="far fa-heart"></i>'; // Change to outlined heart icon
      showAlert("success", "Bookmark removed");
    } else {
      showAlert("error", "Failed to remove bookmark");
    }
  } catch (err) {
    console.error(err);
    showAlert("error", err.response ? err.response.data.message : "An error occurred");
  }
};


export const getBookmarks = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://landandpropertymanagement.com/api/v1/users/bookmarks",
    });

    if (res.data.status === "success") {
      return res.data.data.bookmarks;
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
export const updateProfileSettings = async (formData) => {
  try {
      const url = "http://landandpropertymanagement.com/api/v1/users/updateMe";
      const res = await axios({
          method: "PATCH",
          url,
          data: formData,
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      });
      if (res.data.status === "success") {
          showAlert("success", `Profile Updated successfully`);
          setTimeout(() => {
              window.location.assign("/me");
          }, 1500);
      }
  } catch (err) {
      showAlert("error", err.response.data.message);
  }
};

export const updatePasswordSettings = async (formData) => {
  try {
      const url = "http://landandpropertymanagement.com/api/v1/users/updateMyPassword";
      const res = await axios({
          method: "PATCH",
          url,
          data: formData,
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      });
      if (res.data.status === "success") {
          showAlert("success", `Password Updated successfully`);
          setTimeout(() => {
              window.location.assign("/me");
          }, 1500);
      }
  } catch (err) {
      showAlert("error", err.response.data.message);
  }
};

export const updatePhotoSettings = async (formData) => {
  try {
      const url = "http://landandpropertymanagement.com/api/v1/users/updateMe"; // Adjust URL if different
      const res = await axios({
          method: "PATCH",
          url,
          data: formData,
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      });
      if (res.data.status === "success") {
          showAlert("success", `Photo Updated successfully`);
          setTimeout(() => {
              window.location.assign("/me");
          }, 1500);
      }
  } catch (err) {
      showAlert("error", err.response.data.message);
  }
};

