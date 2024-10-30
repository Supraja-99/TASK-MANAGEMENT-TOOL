const router = require("express").Router();
const Task = require("../models/task");
const User = require("../models/user");
const { authenticateToken } = require("./auth");

router.post("/create-task", authenticateToken, async (req, res) => {
  try {
    const { title, desc, priority, deadline } = req.body;
    const { id } = req.headers;
    const newTask = new Task({
      title,
      desc,
      priority: priority || "Medium", // Default to "Medium" if not provided
      deadline,
    });
    const saveTask = await newTask.save();
    const taskId = saveTask._id;
    await User.findByIdAndUpdate(id, { $push: { tasks: taskId } });
    res.status(200).json({ message: "Task Created" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

// Get All Tasks with optional filters
router.get("/get-all-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { query, priority, deadline } = req.query;

    // Find the user and populate tasks sorted by creation date in descending order
    const userData = await User.findById(id).populate({
      path: "tasks",
      options: { sort: { createdAt: -1 } },
    });

    // Check if user exists and has tasks
    if (!userData || !userData.tasks) {
      return res.status(404).json({ message: "User or tasks not found" });
    }

    // Filter tasks based on query parameters
    let filteredTasks = userData.tasks;

    if (query) {
      filteredTasks = filteredTasks.filter((task) =>
        task.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (priority) {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === priority
      );
    }

    if (deadline) {
      // Convert the deadline string to a Date object
      const targetDate = new Date(deadline);

      // Filter tasks by comparing the date part of the task's deadline
      filteredTasks = filteredTasks.filter((task) => {
        const taskDate = new Date(task.deadline); // Convert the task's deadline to a Date object
        return (
          taskDate.getFullYear() === targetDate.getFullYear() &&
          taskDate.getMonth() === targetDate.getMonth() &&
          taskDate.getDate() === targetDate.getDate()
        );
      });
    }

    res.status(200).json({ data: { tasks: filteredTasks } });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;

//delete Task
router.delete("/delete-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers.id;
    await Task.findByIdAndDelete(id);
    await User.findByIdAndUpdate(userId, { $pull: { tasks: id } });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

//update Task
router.put("/update-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, desc, priority, deadline } = req.body;
    await Task.findByIdAndUpdate(id, { title, desc, priority, deadline });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

//update-Important Task
router.put("/update-imp-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const TaskData = await Task.findById(id);
    const ImpTask = TaskData.important;
    await Task.findByIdAndUpdate(id, { important: !ImpTask });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

//update-Complete Task
router.put("/update-complete-task/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const TaskData = await Task.findById(id);
    const CompleteTask = TaskData.complete;
    await Task.findByIdAndUpdate(id, { complete: !CompleteTask });
    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

//get important tasks
router.get("/get-imp-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const Data = await User.findById(id).populate({
      path: "tasks",
      match: { important: true },
      options: { sort: { createdAt: -1 } },
    });
    const ImpTaskData = Data.tasks;
    res.status(200).json({ data: ImpTaskData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

//get completed tasks
router.get("/get-complete-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const Data = await User.findById(id).populate({
      path: "tasks",
      match: { complete: true },
      options: { sort: { createdAt: -1 } },
    });
    const CompTaskData = Data.tasks;
    res.status(200).json({ data: CompTaskData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

//get incompleted tasks
router.get("/get-incomplete-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const Data = await User.findById(id).populate({
      path: "tasks",
      match: { complete: false },
      options: { sort: { createdAt: -1 } },
    });
    const CompTaskData = Data.tasks;
    res.status(200).json({ data: CompTaskData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

//search tasks
router.get("/search-tasks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { query } = req.query;

    const userData = await User.findById(id).populate({
      path: "tasks",
      match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { desc: { $regex: query, $options: "i" } },
        ],
      },
      options: { sort: { createdAt: -1 } },
    });

    res.status(200).json({ data: userData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
