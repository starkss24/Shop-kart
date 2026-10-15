import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginCustomer } from "../services/api";
import '../css/Login.css'
function Login() {
  const navigate = useNavigate();

  // Controlled form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    try {
      setLoading(true);
      // withCredentials: true (set globally in api.js) ensures the
      const res = await loginCustomer(formData);
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      // On success -> navigate to /home
      navigate("/home");
    } catch (err) {
      // Backend returns 401 for wrong email/password
      if (err.response?.status === 401) {
        setServerError("Invalid Credentials");
      } else {
        setServerError(
          err.response?.data?.message ||
            "Something went wrong while logging in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h2 className="heading">Login to ShopKart</h2>

        {serverError && <p className="serverError">{serverError}</p>}

        <div className="field">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
            placeholder="jane@example.com"
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>

        <div className="field">
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="input"
            placeholder="Your password"
          />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="footerText">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}


export default Login;