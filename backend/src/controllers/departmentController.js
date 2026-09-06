import Department from "../models/Department.js";

// Get all departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .sort({ code: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};


// Get active departments
export const getActiveDepartments = async (req, res) => {
  try {
    const departments = await Department.find({
      isActive: true,
    }).sort({ code: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Get active departments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch active departments",
    });
  }
};


// Get single department
export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(
      req.params.id
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    console.error("Get department error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch department",
    });
  }
};


// Create department
export const createDepartment = async (req, res) => {
  try {
    const {
      code,
      name,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "Code and name are required",
      });
    }

    const existingDepartment =
      await Department.findOne({
        $or: [
          { code: code.toUpperCase() },
          { name: name.trim() },
        ],
      });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message:
          "Department with this code or name already exists",
      });
    }

    const department =
      await Department.create({
        code: code.toUpperCase().trim(),
        name: name.trim(),
      });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("Create department error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create department",
    });
  }
};


// Update department
export const updateDepartment = async (req, res) => {
  try {
    const {
      code,
      name,
      isActive,
    } = req.body;

    const department =
      await Department.findById(
        req.params.id
      );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    if (code !== undefined) {
      department.code =
        code.toUpperCase().trim();
    }

    if (name !== undefined) {
      department.name =
        name.trim();
    }

    if (isActive !== undefined) {
      department.isActive = isActive;
    }

    await department.save();

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    console.error("Update department error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update department",
    });
  }
};


// Delete department
export const deleteDepartment = async (req, res) => {
  try {
    const department =
      await Department.findByIdAndDelete(
        req.params.id
      );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete department",
    });
  }
};