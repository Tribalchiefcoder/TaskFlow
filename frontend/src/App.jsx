
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";
const TASKS_PER_PAGE = 10;


function TaskFlowLogo() {
  return (
    <div className="brand-logo">
      <div className="brand-icon">
        <svg
          viewBox="0 0 48 48"
          width="34"
          height="34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 16L12 20L19 12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 16H40"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M8 32L12 36L19 28"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 32H40"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span>TaskFlow</span>
    </div>
  );
}


function App() {
  // THEME STATE (saved between visits)
  const [theme, setTheme] = useState(
    localStorage.getItem("taskflow-theme") || "light"
  );

  useEffect(() => {
    localStorage.setItem("taskflow-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  // TASK STATES
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AUTHENTICATION STATES
  const [isRegister, setIsRegister] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // CREATE TASK STATES
  const [showForm, setShowForm] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
  });

  // EDIT TASK STATES
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
  });

  // NAVIGATION STATE
  const [activeView, setActiveView] = useState("dashboard");

  // SEARCH, FILTER AND SORT STATES
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  // DATABASE-WIDE ANALYTICS
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    overdue: 0,
  });

  // FETCH TASKS
  const fetchTasks = async (authToken, page = currentPage) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(TASKS_PER_PAGE),
        sort: sortBy,
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      // Completed view always shows completed tasks
      const effectiveStatus =
        activeView === "completed"
          ? "Completed"
          : statusFilter;

      if (effectiveStatus) {
        params.append("status", effectiveStatus);
      }

      if (priorityFilter) {
        params.append("priority", priorityFilter);
      }

      const response = await fetch(
        `${API_URL}/tasks?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch tasks"
        );
      }

      setTasks(data.tasks || []);
      setCurrentPage(data.currentPage || page);
      setTotalPages(data.totalPages || 1);
      setTotalTasks(data.totalTasks || 0);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // FETCH DATABASE-WIDE ANALYTICS
  const fetchAnalytics = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/tasks/analytics`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch task analytics"
        );
      }

      setAnalytics(data.analytics || {
        totalTasks: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        overdue: 0,
      });
    } catch (err) {
      console.error("Analytics fetch error:", err.message);
      setError(err.message);
    }
  };

  // FETCH WHEN CONTROLS CHANGE
  useEffect(() => {
    if (token) {
      fetchTasks(token, currentPage);
    }
  }, [
    token,
    currentPage,
    search,
    statusFilter,
    priorityFilter,
    sortBy,
    activeView,
  ]);

  // Fetch analytics after login and whenever the authenticated user changes
  useEffect(() => {
    if (token) {
      fetchAnalytics(token);
    } else {
      setAnalytics({
        totalTasks: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
        overdue: 0,
      });
    }
  }, [token]);

  // RESET PAGE WHEN FILTER CHANGES
  const resetAndUpdate = (setter, value) => {
    setCurrentPage(1);
    setter(value);
  };

  // WORKSPACE NAVIGATION
  const navigateTo = (view) => {
    setActiveView(view);
    setCurrentPage(1);
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setSortBy("newest");
    setShowForm(false);
    setEditingTaskId(null);
    setError("");
  };

  // LOGIN AND REGISTER
  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    const endpoint = isRegister ? "register" : "login";

    try {
      const response = await fetch(
        `${API_URL}/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed"
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setForm({
        name: "",
        email: "",
        password: "",
      });

    } catch (err) {
      setError(err.message);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setTasks([]);
    setError("");
    setShowForm(false);
    setEditingTaskId(null);

    setCurrentPage(1);
    setTotalPages(1);
    setTotalTasks(0);
    setAnalytics({
      totalTasks: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      overdue: 0,
    });
    setActiveView("dashboard");
  };

  // CREATE TASK
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTask,
          dueDate: newTask.dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create task"
        );
      }

      setNewTask({
        title: "",
        description: "",
        status: "Pending",
        priority: "Medium",
        dueDate: "",
      });

      setShowForm(false);
      setCurrentPage(1);
      fetchAnalytics(token);

      // Refresh tasks after creation
      if (currentPage === 1) {
        fetchTasks(token, 1);
      }

    } catch (err) {
      setError(err.message);
    }
  };

  // OPEN EDIT FORM
  const handleEditClick = (task) => {
    setEditingTaskId(task._id);

    setEditTask({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "Pending",
      priority: task.priority || "Medium",
      dueDate: task.dueDate
        ? new Date(task.dueDate)
            .toISOString()
            .split("T")[0]
        : "",
    });

    setError("");
    setShowForm(false);
  };

  // UPDATE TASK
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/tasks/${editingTaskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editTask,
            dueDate: editTask.dueDate || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update task"
        );
      }

      setEditingTaskId(null);
      fetchTasks(token, currentPage);
      fetchAnalytics(token);

    } catch (err) {
      setError(err.message);
    }
  };

  // DELETE TASK
  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete task"
        );
      }

      if (editingTaskId === taskId) {
        setEditingTaskId(null);
      }

      const nextPage =
        tasks.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      setCurrentPage(nextPage);
      fetchTasks(token, nextPage);
      fetchAnalytics(token);

    } catch (err) {
      setError(err.message);
    }
  };

  // CHART DATA FROM THE COMPLETE DATABASE COLLECTION
  const statusCounts = {
    Completed: analytics.completed,
    "In Progress": analytics.inProgress,
    Pending: analytics.pending,
  };

  const priorityCounts = {
    High: analytics.highPriority,
    Medium: analytics.mediumPriority,
    Low: analytics.lowPriority,
  };

  const chartMaximum = Math.max(
    ...Object.values(statusCounts),
    ...Object.values(priorityCounts),
    1
  );

  const completionPercentage = analytics.totalTasks
    ? Math.round(
        (analytics.completed / analytics.totalTasks) * 100
      )
    : 0;

  // AUTHENTICATION SCREEN
  if (!token) {
    return (
      <div className={`auth-page ${theme === "dark" ? "theme-dark" : ""}`}>
        <form
          className="auth-card"
          onSubmit={handleAuth}
        >
          <TaskFlowLogo />

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span>{theme === "light" ? "☾" : "☀"}</span>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>

          <h2>
            {isRegister
              ? "Create your account"
              : "Welcome back"}
          </h2>

          <p>
            {isRegister
              ? "Sign up to start managing your tasks."
              : "Log in to continue to your dashboard."}
          </p>

          {isRegister && (
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            required
          />

          {error && (
            <p className="error-message">{error}</p>
          )}

          <button type="submit">
            {isRegister
              ? "Create Account"
              : "Login"}
          </button>

          <p className="auth-switch">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}

            <span
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
            >
              {isRegister ? " Login" : " Register"}
            </span>
          </p>
        </form>
      </div>
    );
  }

  // DYNAMIC PAGE TITLES
  const pageTitle =
    activeView === "dashboard"
      ? "Dashboard"
      : activeView === "tasks"
      ? "My Tasks"
      : "Completed Tasks";

  const pageDescription =
    activeView === "dashboard"
      ? `Welcome back, ${user?.name || "User"}! Here's your task overview.`
      : activeView === "tasks"
      ? "Manage, organize, and track all your tasks."
      : "Take a look at everything you've accomplished.";

  // DASHBOARD
  return (
    <div className={`app ${theme === "dark" ? "theme-dark" : ""}`}>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <TaskFlowLogo />

        <p className="nav-heading">WORKSPACE</p>

        <button
          type="button"
          className={`nav-item ${
            activeView === "dashboard" ? "active" : ""
          }`}
          onClick={() => navigateTo("dashboard")}
        >
          <span>▦</span>
          Dashboard
        </button>

        <button
          type="button"
          className={`nav-item ${
            activeView === "tasks" ? "active" : ""
          }`}
          onClick={() => navigateTo("tasks")}
        >
          <span>☷</span>
          My Tasks
        </button>

        <button
          type="button"
          className={`nav-item ${
            activeView === "completed" ? "active" : ""
          }`}
          onClick={() => navigateTo("completed")}
        >
          <span>✓</span>
          Completed
        </button>

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <span>{theme === "light" ? "☾" : "☀"}</span>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* HEADER */}
        <header>
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>

          <button
            className="add-button"
            onClick={() => {
              setShowForm(!showForm);
              setEditingTaskId(null);
              setError("");
            }}
          >
            + New Task
          </button>
        </header>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {/* CREATE TASK FORM */}
        {showForm && (
          <form
            className="task-form"
            onSubmit={handleCreateTask}
          >
            <h2>Create New Task</h2>

            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  title: e.target.value,
                })
              }
              required
            />

            <textarea
              placeholder="Task description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  description: e.target.value,
                })
              }
            />

            <label>Priority</label>

            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  priority: e.target.value,
                })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <label>Status</label>

            <select
              value={newTask.status}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  status: e.target.value,
                })
              }
            >
              <option value="Pending">Pending</option>
              <option value="In-Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <label>Due Date</label>

            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  dueDate: e.target.value,
                })
              }
            />

            <button
              type="submit"
              className="add-button"
            >
              Save Task
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        )}

        {/* SEARCH AND FILTERS */}
        <section className="task-controls">

          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) =>
              resetAndUpdate(setSearch, e.target.value)
            }
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              resetAndUpdate(
                setStatusFilter,
                e.target.value
              )
            }
            disabled={activeView === "completed"}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In-Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) =>
              resetAndUpdate(
                setPriorityFilter,
                e.target.value
              )
            }
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              resetAndUpdate(setSortBy, e.target.value)
            }
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>

        </section>

        {/* TASK STATISTICS */}
        <section className="stats">

          <div className="stat-card">
            <p>Total Tasks</p>
            <h2>{analytics.totalTasks}</h2>
          </div>

          <div className="stat-card">
            <p>Completed</p>
            <h2>{statusCounts.Completed}</h2>
          </div>

          <div className="stat-card">
            <p>In Progress</p>
            <h2>{analytics.inProgress}</h2>
          </div>

          <div className="stat-card">
            <p>Pending</p>
            <h2>{analytics.pending}</h2>
          </div>

        </section>

        {/* VISUAL ANALYTICS */}
        {activeView === "dashboard" && (
          <section className="analytics-section">

            <div className="analytics-header">
              <div>
                <h2>Task Analytics</h2>
                <p>
                  Statistics across all your tasks
                </p>
              </div>
            </div>

            <div className="analytics-grid">

              {/* COMPLETION CHART */}
              <div className="chart-card">
                <h3>Task Completion</h3>

                <div className="completion-chart">
                  <div
                    className="completion-ring"
                    style={{
                      background: `conic-gradient(
                        #22c55e ${completionPercentage * 3.6}deg,
                        #e5e7eb ${completionPercentage * 3.6}deg
                      )`,
                    }}
                  >
                    <div className="completion-inner">
                      <strong>{completionPercentage}%</strong>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>

                <p className="chart-caption">
                  {analytics.completed} of {analytics.totalTasks} total tasks completed
                </p>
                <p className="chart-caption">
                  {analytics.overdue} overdue tasks
                </p>
              </div>

              {/* STATUS CHART */}
              <div className="chart-card">
                <h3>Tasks by Status</h3>

                {Object.entries(statusCounts).map(
                  ([label, count]) => (
                    <div className="chart-row" key={label}>
                      <div className="chart-label">
                        <span>{label}</span>
                        <strong>{count}</strong>
                      </div>

                      <div className="chart-track">
                        <div
                          className={`chart-bar ${
                            label === "Completed"
                              ? "bar-completed"
                              : label === "In Progress"
                              ? "bar-progress"
                              : "bar-pending"
                          }`}
                          style={{
                            width: `${(count / chartMaximum) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* PRIORITY CHART */}
              <div className="chart-card">
                <h3>Tasks by Priority</h3>

                {Object.entries(priorityCounts).map(
                  ([label, count]) => (
                    <div className="chart-row" key={label}>
                      <div className="chart-label">
                        <span>{label} Priority</span>
                        <strong>{count}</strong>
                      </div>

                      <div className="chart-track">
                        <div
                          className={`chart-bar ${
                            label === "High"
                              ? "bar-high"
                              : label === "Medium"
                              ? "bar-medium"
                              : "bar-low"
                          }`}
                          style={{
                            width: `${(count / chartMaximum) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

            </div>
          </section>
        )}

        {/* TASK LIST */}
        <section className="task-section">

          <h2>
            {activeView === "completed"
              ? "Completed Tasks"
              : activeView === "tasks"
              ? "All My Tasks"
              : "Recent Tasks"}
          </h2>

          {loading ? (
            <p>Loading your tasks...</p>
          ) : tasks.length === 0 ? (
            <p>
              {activeView === "completed"
                ? "No completed tasks yet. Complete a task to see it here."
                : "No tasks found. Try changing your search or filters."}
            </p>
          ) : (

            tasks.map((task) => (
              <div
                className="task-card"
                key={task._id}
              >

                {editingTaskId === task._id ? (

                  // EDIT TASK FORM
                  <form
                    className="task-form"
                    onSubmit={handleUpdateTask}
                  >
                    <h3>Edit Task</h3>

                    <input
                      type="text"
                      placeholder="Task title"
                      value={editTask.title}
                      onChange={(e) =>
                        setEditTask({
                          ...editTask,
                          title: e.target.value,
                        })
                      }
                      required
                    />

                    <textarea
                      placeholder="Description"
                      value={editTask.description}
                      onChange={(e) =>
                        setEditTask({
                          ...editTask,
                          description: e.target.value,
                        })
                      }
                    />

                    <label>Priority</label>

                    <select
                      value={editTask.priority}
                      onChange={(e) =>
                        setEditTask({
                          ...editTask,
                          priority: e.target.value,
                        })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>

                    <label>Status</label>

                    <select
                      value={editTask.status}
                      onChange={(e) =>
                        setEditTask({
                          ...editTask,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In-Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <label>Due Date</label>

                    <input
                      type="date"
                      value={editTask.dueDate}
                      onChange={(e) =>
                        setEditTask({
                          ...editTask,
                          dueDate: e.target.value,
                        })
                      }
                    />

                    <button
                      type="submit"
                      className="add-button"
                    >
                      Update Task
                    </button>

                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() =>
                        setEditingTaskId(null)
                      }
                    >
                      Cancel
                    </button>
                  </form>

                ) : (

                  // NORMAL TASK DISPLAY
                  <>
                    <div>
                      <h3>{task.title}</h3>

                      <p>{task.status}</p>

                      {task.description && (
                        <p>{task.description}</p>
                      )}

                      {task.dueDate && (
                        <p>
                          Due:{" "}
                          {new Date(
                            task.dueDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div>
                      <span
                        className={`priority ${(
                          task.priority || "Medium"
                        ).toLowerCase()}`}
                      >
                        {task.priority || "Medium"}
                      </span>

                      <div className="task-actions">

                        <button
                          type="button"
                          className="edit-button"
                          onClick={() =>
                            handleEditClick(task)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            handleDeleteTask(task._id)
                          }
                        >
                          Delete
                        </button>

                      </div>
                    </div>
                  </>
                )}

              </div>
            ))
          )}

          {/* PAGINATION */}
          {totalTasks > 0 && (
            <div className="pagination">

              <p>
                Showing {tasks.length} of {totalTasks} matching tasks
              </p>

              <button
                disabled={currentPage <= 1 || loading}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={
                  currentPage >= totalPages || loading
                }
                onClick={() =>
                  setCurrentPage((page) => page + 1)
                }
              >
                Next
              </button>

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default App;
