
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams
} from "react-router-dom";
import axios from "axios";
import "./App.css";

const API = "https://student-feedback-admin.onrender.com/api/feedback";

function Dashboard() {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");

  async function loadFeedback() {
    try {
      const res = await axios.get(API);
      setFeedback(res.data);
      setError("");
    } catch {
      setError("Unable to connect. Check the backend and MongoDB Atlas.");
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function deleteFeedback(id) {
    if (!window.confirm("Are you sure you want to delete this feedback?")) {
      return;
    }

    try {
      await axios.delete(`${API}/${id}`);
      await loadFeedback();
    } catch {
      alert("Delete failed. Please check the server.");
    }
  }

  const average = feedback.length
    ? (
        feedback.reduce((sum, item) => sum + Number(item.rating), 0) /
        feedback.length
      ).toFixed(1)
    : "0.0";

  return (
    <main className="container">
      <div className="heading">
        <div>
          <p className="eyebrow">ADMIN PANEL</p>
          <h1>Feedback Dashboard</h1>
          <p className="muted">Manage course feedback efficiently.</p>
        </div>
        <Link className="primary-btn" to="/add">
          + Add Feedback
        </Link>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span>Total Feedback</span>
          <h2>{feedback.length}</h2>
        </div>
        <div className="stat-card">
          <span>Average Rating</span>
          <h2>⭐ {average}/5</h2>
        </div>
        <div className="stat-card">
          <span>Courses Reviewed</span>
          <h2>
            {new Set(feedback.map(f => f.courseName.toLowerCase())).size}
          </h2>
        </div>
      </div>

      <section className="panel">
        <h2>Course Feedback List</h2>

        {error && <p className="error">{error}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course ID</th>
                <th>Course Name</th>
                <th>Duration</th>
                <th>Overall Rating</th>
                <th>Comments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map(item => (
                <tr key={item._id}>
                  <td>CRS-{item._id.slice(-5).toUpperCase()}</td>
                  <td><strong>{item.courseName}</strong></td>
                  <td>{item.duration}</td>
                  <td><span className="rating">★ {item.rating}/5</span></td>
                  <td>{item.comments}</td>
                  <td>
                    <div className="actions">
                      <Link className="edit-btn" to={`/edit/${item._id}`}>
                        Update
                      </Link>
                      <button
                        className="delete-btn"
                        onClick={() => deleteFeedback(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!error && feedback.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty">
                    No feedback available. Add your first feedback!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function FeedbackForm() {
  const [courseName, setCourseName] = useState("");
  const [duration, setDuration] = useState("4 Weeks");
  const [comments, setComments] = useState("");
  const [rating, setRating] = useState("5");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    axios.get(API)
      .then(res => {
        const item = res.data.find(f => f._id === id);

        if (!item) {
          setError("Feedback record not found.");
          return;
        }

        setCourseName(item.courseName);
        setDuration(item.duration);
        setComments(item.comments);
        setRating(String(item.rating));
      })
      .catch(() => setError("Could not load feedback."));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const data = {
      courseName: courseName.trim(),
      duration,
      comments: comments.trim(),
      rating: Number(rating)
    };

    try {
      if (id) {
        await axios.put(`${API}/${id}`, data);
      } else {
        await axios.post(API, data);
      }

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container form-container">
      <p className="eyebrow">{id ? "EDIT FEEDBACK" : "NEW FEEDBACK"}</p>
      <h1>{id ? "Update Feedback" : "Add Feedback"}</h1>
      <p className="muted">Please complete all the fields below.</p>

      <form className="panel feedback-form" onSubmit={handleSubmit}>
        <label>
          Course Name
          <input
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            placeholder="Enter course name"
            required
          />
        </label>

        <label>
          Course Duration
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
          >
            <option>2 Weeks</option>
            <option>4 Weeks</option>
            <option>6 Weeks</option>
            <option>8 Weeks</option>
            <option>12 Weeks</option>
          </select>
        </label>

        <label>
          Feedback Comments
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Write your feedback"
            rows="4"
            required
          />
        </label>

        <label>
          Feedback Rating
          <select
            value={rating}
            onChange={e => setRating(e.target.value)}
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Very Good</option>
            <option value="3">3 - Good</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>
        </label>

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button className="primary-btn" disabled={saving}>
            {saving
              ? "Saving..."
              : id
                ? "Update Feedback"
                : "Submit Feedback"}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <header className="navbar">
        <Link className="brand" to="/">
          <span className="brand-icon">F</span>
          FeedbackHub
        </Link>

        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/add">Add Feedback</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add" element={<FeedbackForm />} />
        <Route path="/edit/:id" element={<FeedbackForm />} />
      </Routes>

      <footer>FeedbackHub | Course Feedback Management</footer>
    </BrowserRouter>
  );
}

export default App;
