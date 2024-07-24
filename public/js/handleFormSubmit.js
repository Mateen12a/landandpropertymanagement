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
    const propertyType = document.querySelector('.type').value.trim().toLowerCase();

    if (propertyType !== 'land') {
      const amenities = [
        {
          amenity: type === 'new' ? 'bed' : document.querySelector('.amenity-bed').dataset.amenity,
          quantity: +document.querySelector('.quantity-bed').value.trim(),
        },
        {
          amenity: type === 'new' ? 'bath' : document.querySelector('.amenity-bath').dataset.amenity,
          quantity: +document.querySelector('.quantity-bath').value.trim(),
        },
        {
          amenity: type === 'new' ? 'toilet' : document.querySelector('.amenity-toilet').dataset.amenity,
          quantity: +document.querySelector('.quantity-toilet').value.trim(),
        },
      ];
      data.append('amenities', JSON.stringify(amenities));
    } else {
      data.append('amenities', JSON.stringify([]));
    }

    // Fetch agentId from localStorage
    const agentId = localStorage.getItem('agentId');

    if (!agentId) {
      showAlert('error', 'No agent ID found. Please log in again.');
      return;
    }

    // Append agentId to the data
    data.append('agent', agentId);

    const id = window.location.pathname.split('/').find((el) => el.length > 11 && (el !== 'property' && el !== 'update'));
    
    const url = type === 'new'
      ? 'http://localhost:5000/api/v1/property/new'
      : `http://localhost:5000/api/v1/property/${id}`;

    const token = localStorage.getItem('jwt');
    if (!token) {
      console.log('No authentication token found. Please log in again.');
      return showAlert('error', 'No authentication token found. Please log in again.');
    }

    const res = await axios({
      method: type === 'new' ? 'POST' : 'PATCH',
      url,
      data,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Property Posted Successfully');
      setTimeout(() => {
        window.location.assign('/properties');
      }, 1500);
    }
  } catch (err) {
    console.error('Error response:', err.response);
    if (err.response && err.response.data) {
      showAlert('error', err.response.data.message || 'An error occurred');
    } else {
      showAlert('error', 'An unknown error occurred');
    }
  }
};

// Function to delete a property
export const deleteProperty = async () => {
  try {
    const id = window.location.pathname.split("/").find((el) => el.length > 11 && (el !== "property" && el !== "update"));
    const url = `http://localhost:5000/api/v1/property/${id}`;
    const token = localStorage.getItem('jwt'); // Retrieve the token from localStorage

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
        ? "http://localhost:5000/api/v1/users/updateMyPassword/"
        : "http://localhost:5000/api/v1/users/updateMe";

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
        ? "http://localhost:5000/api/v1/users/bookMark/add"
        : "http://localhost:5000/api/v1/users/bookMark/remove";

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
    const url = "http://localhost:5000/api/v1/users/bookMark/remove";

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
      url: "http://localhost:5000/api/v1/users/bookmarks",
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
      const url = "http://localhost:5000/api/v1/users/updateMe";
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
      const url = "http://localhost:5000/api/v1/users/updateMyPassword";
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
      const url = "http://localhost:5000/api/v1/users/updateMe"; // Adjust URL if different
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

