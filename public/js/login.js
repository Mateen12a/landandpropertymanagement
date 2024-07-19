import axios from "axios";
import { showAlert } from "./alert";

// login.js
import axios from 'axios';
import { showAlert } from './alert';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

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
      sessionStorage.setItem('jwt', res.data.token); // Store the token in local storage
      showAlert('success', 'Logged in successfully');
      console.log("Stored Token", res.data.token)
      setTimeout(() => {
        window.location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
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

export const signup = async (name, email, password, passwordConfirm, role) => {
  try {
    const data = {
      name,
      email,
      password,
      passwordConfirm,
      role,
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
