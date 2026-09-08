import { Tag } from "../models/tag.model.js";

export async function createTag(req, res) {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Tag name is required",
      });
    }

    const tag = await Tag.create({
      organizationId: req.user.organizationId,
      name: name.toLowerCase(),
      color,
    });

    res.status(201).json({
      message: "Tag created successfully",
      tag,
    });
  } catch (error) {
    console.error("Error in createTag controller:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Tag already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getTags(req, res) {
  try {
    const tags = await Tag.find({
      organizationId: req.user.organizationId,
    }).sort({ name: 1 });

    res.status(200).json({
      tags,
    });
  } catch (error) {
    console.error("Error in getTags controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateTag(req, res) {
  try {
    const { id: tagId } = req.params;
    const { name, color } = req.body;

    const tag = await Tag.findOne({
      _id: tagId,
      organizationId: req.user.organizationId,
    });

    if (!tag) {
      return res.status(404).json({
        error: "Tag not found",
      });
    }

    tag.name = name
      ? name.toLowerCase()
      : tag.name;

    tag.color =
      color !== undefined ? color : tag.color;

    await tag.save();

    res.status(200).json({
      message: "Tag updated successfully",
      tag,
    });
  } catch (error) {
    console.error("Error in updateTag controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteTag(req, res) {
  try {
    const { id: tagId } = req.params;

    const tag = await Tag.findOne({
      _id: tagId,
      organizationId: req.user.organizationId,
    });

    if (!tag) {
      return res.status(404).json({
        error: "Tag not found",
      });
    }

    await tag.deleteOne();

    res.status(200).json({
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteTag controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}