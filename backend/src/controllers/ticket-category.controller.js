import { TicketCategory } from "../models/ticket-category.model.js";

export async function createCategory(req, res) {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Category name is required",
      });
    }

    const category = await TicketCategory.create({
      organizationId: req.user.organizationId,
      name,
      description,
      color,
    });

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Error in createCategory controller:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Category already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getCategories(req, res) {
  try {
    const categories = await TicketCategory.find({
      organizationId: req.user.organizationId,
    }).sort({ name: 1 });

    res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error("Error in getCategories controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getCategory(req, res) {
  try {
    const { id: categoryId } = req.params;

    const category = await TicketCategory.findOne({
      _id: categoryId,
      organizationId: req.user.organizationId,
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    res.status(200).json({
      category,
    });
  } catch (error) {
    console.error("Error in getCategory controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id: categoryId } = req.params;
    const { name, description, color, isActive } = req.body;

    const category = await TicketCategory.findOne({
      _id: categoryId,
      organizationId: req.user.organizationId,
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    category.name = name || category.name;
    category.description =
      description !== undefined
        ? description
        : category.description;

    category.color =
      color !== undefined ? color : category.color;

    category.isActive =
      isActive !== undefined
        ? isActive
        : category.isActive;

    await category.save();

    res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(
      "Error in updateCategory controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id: categoryId } = req.params;

    const category = await TicketCategory.findOne({
      _id: categoryId,
      organizationId: req.user.organizationId,
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    category.isActive = false;

    await category.save();

    res.status(200).json({
      message: "Category deactivated successfully",
    });
  } catch (error) {
    console.error(
      "Error in deleteCategory controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}