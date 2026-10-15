import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerCustomer } from "../services/api";
import '../css/Register.css'
function Register() {
  const navigate = useNavigate();

  // Controlled form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  // Field-level validation errors
  const [errors, setErrors] = useState({});
  // Server / general error (e.g. "email already exists")
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the field's error as the user edits it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
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
      const res = await registerCustomer(formData);
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      // On success -> redirect to Login page
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Something went wrong while registering. Please try again.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <h2 className="heading">Create your ShopKart account</h2>

        {serverError && <p className="serverError">{serverError}</p>}

        <div className="field">
          <label htmlFor="fullName" className="label">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            className="input"
            placeholder="Jane Doe"
          />
          {errors.fullName && <p className="error">{errors.fullName}</p>}
        </div>

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
            placeholder="At least 6 characters"
          />
          {errors.password && <p className="error">{errors.password}</p>}
        </div>

        <div className="field">
          <label htmlFor="phone" className="label">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="9876543210"
          />
          {errors.phone && <p className="error">{errors.phone}</p>}
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="footerText">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}



export default Register;