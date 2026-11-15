
import mongoose from "mongoose";
import Task from "../models/Task.js";

// ======================================
// CREATE TASK
// POST /api/tasks
// ======================================

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required"
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      status,
      priority,
      dueDate,
      user: req.userId
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task
    });

  } catch (error) {
    console.error("Create task error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Unable to create task",
      error: error.message
    });
  }
};


// ======================================
// GET ALL TASKS
// GET /api/tasks
// ======================================

export const getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      search,
      sort = "newest",
      page = 1,
      limit = 10
    } = req.query;

    // Validate pagination
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(
      100,
      Math.max(1, Number(limit) || 10)
    );

    // Build filter
    const filter = {
      user: req.userId
    };

    if (status) {
      if (!["Pending", "In-Progress", "Completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status"
        });
      }

      filter.status = status;
    }

    if (priority) {
      if (!["Low", "Medium", "High"].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority"
        });
      }

      filter.priority = priority;
    }

    // Search task titles
    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.title = {
        $regex: escapedSearch,
        $options: "i"
      };
    }

    // Sorting
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      dueDate: { dueDate: 1 },
      priority: { priority: 1 }
    };

    const sortBy = sortOptions[sort];

    if (!sortBy) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting option"
      });
    }

    // Get total matching tasks
    const totalTasks = await Task.countDocuments(filter);

    // Fetch paginated tasks
    const tasks = await Task.find(filter)
      .sort(sortBy)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      totalTasks,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalTasks / limitNumber),
      tasks
    });

  } catch (error) {
    console.error("Get tasks error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tasks"
    });
  }
};


// ======================================
// GET SINGLE TASK
// GET /api/tasks/:id
// ======================================

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    const task = await Task.findOne({
      _id: id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    return res.status(200).json({
      success: true,
      task
    });

  } catch (error) {
    console.error("Get task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task"
    });
  }
};


// ======================================
// UPDATE TASK
// PATCH /api/tasks/:id
// ======================================

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided"
      });
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" ||
        !updates.title.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Task title cannot be empty"
      });
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        user: req.userId
      },
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task
    });

  } catch (error) {
    console.error("Update task error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Unable to update task",
      error: error.message
    });
  }
};


// ======================================
// DELETE TASK
// DELETE /api/tasks/:id
// ======================================

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID"
      });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      user: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {
    console.error("Delete task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete task"
    });
  }
};
// ======================================
// GET TASK ANALYTICS
// GET /api/tasks/analytics
// ======================================

export const getTaskAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();

    const result = await Task.aggregate([
      {
        $match: {
          user: userId
        }
      },
      {
        $group: {
          _id: null,

          totalTasks: { $sum: 1 },

          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0]
            }
          },

          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, 1, 0]
            }
          },

          inProgress: {
            $sum: {
              $cond: [{ $eq: ["$status", "In-Progress"] }, 1, 0]
            }
          },

          highPriority: {
            $sum: {
              $cond: [{ $eq: ["$priority", "High"] }, 1, 0]
            }
          },

          mediumPriority: {
            $sum: {
              $cond: [{ $eq: ["$priority", "Medium"] }, 1, 0]
            }
          },

          lowPriority: {
            $sum: {
              $cond: [{ $eq: ["$priority", "Low"] }, 1, 0]
            }
          },

          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "Completed"] },
                    { $ne: ["$dueDate", null] },
                    { $lt: ["$dueDate", now] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalTasks: 1,
          completed: 1,
          pending: 1,
          inProgress: 1,
          highPriority: 1,
          mediumPriority: 1,
          lowPriority: 1,
          overdue: 1
        }
      }
    ]);

    const analytics = result[0] || {
      totalTasks: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      overdue: 0
    };

    return res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error("Task analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task analytics"
    });
  }
};