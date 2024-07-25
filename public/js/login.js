import axios from "axios";
import Cookies from 'js-cookie';
import { showAlert } from "./alert";

// login.js
import axios from 'axios';
import { showAlert } from './alert';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Basic validation
  if (!email || !password) {
    return showAlert('error', 'Please provide both email and password');
  }

  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:5000/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      // Store the JWT token in local storage
      localStorage.setItem('jwt', res.data.token);
      // Store the agent ID in localStorage
      localStorage.setItem('agentId', res.data.data.user._id); // Assuming the backend returns the user ID 
      Cookies.set('jwt', res.data.token, { expires: 90 }); // Set cookie for 90 days
      showAlert('success', 'Logged in successfully');
      console.log("Stored Token", res.data.token);

      // Redirect to home page after successful login
      setTimeout(() => {
        window.location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Login failed. Please try again.');
  }
});



export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });

    if ((res.data.status = "success")) {
      window.setTimeout(() => {
        location.reload(true);
        location.assign("/");
      }, 1000);
    }

    //true` force a reload from server
  } catch (err) {
    showAlert("error", "Error logging out! Try again.");
  }
};

export const signup = async (name, email, countryCode, mobileno, password, passwordConfirm, role) => {
  try {
    const data = {
      name,
      email,
      countryCode,
      mobileno,
      password,
      passwordConfirm,
      role
  };
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
      data,
    });
    if (res.data.status === "success") {
      showAlert("success", "Account created successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};
