import { KnowledgeBaseArticle } from "../models/knowledge-base-article.model.js";

export async function createArticle(req, res) {
  try {
    const {
      title,
      slug,
      content,
      category,
      status,
      visibility,
    } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({
        error: "Title, slug, and content are required",
      });
    }

    const article = await KnowledgeBaseArticle.create({
      organizationId: req.user.organizationId,
      title,
      slug: slug.toLowerCase(),
      content,
      category,
      status: status || "draft",
      visibility: visibility || "internal",
      source: "manual",
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    res.status(201).json({
      message: "Knowledge base article created successfully",
      article,
    });
  } catch (error) {
    console.error("Error in createArticle controller:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Article slug already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getArticles(req, res) {
  try {
    const {
      status,
      visibility,
      category,
      search,
    } = req.query;

    const query = {
      organizationId: req.user.organizationId,
    };

    if (status) query.status = status;
    if (visibility) query.visibility = visibility;
    if (category) query.category = category;

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          content: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const articles = await KnowledgeBaseArticle.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      articles,
    });
  } catch (error) {
    console.error("Error in getArticles controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getArticle(req, res) {
  try {
    const { id: articleId } = req.params;

    const article = await KnowledgeBaseArticle.findOne({
        _id: articleId,
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!article) {
      return res.status(404).json({
        error: "Article not found",
      });
    }

    res.status(200).json({
      article,
    });
  } catch (error) {
    console.error("Error in getArticle controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateArticle(req, res) {
  try {
    const { id: articleId } = req.params;

    const {
      title,
      slug,
      content,
      category,
      status,
      visibility,
    } = req.body;

    const article = await KnowledgeBaseArticle.findOne({
      _id: articleId,
      organizationId: req.user.organizationId,
    });

    if (!article) {
      return res.status(404).json({
        error: "Article not found",
      });
    }

    article.title = title || article.title;

    article.slug = slug
      ? slug.toLowerCase()
      : article.slug;

    article.content = content || article.content;

    article.category =
      category !== undefined
        ? category
        : article.category;

    article.status = status || article.status;

    article.visibility =
      visibility || article.visibility;

    article.updatedBy = req.user.id;

    await article.save();

    res.status(200).json({
      message: "Knowledge base article updated successfully",
      article,
    });
  } catch (error) {
    console.error("Error in updateArticle controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteArticle(req, res) {
  try {
    const { id: articleId } = req.params;

    const article = await KnowledgeBaseArticle.findOne({
      _id: articleId,
      organizationId: req.user.organizationId,
    });

    if (!article) {
      return res.status(404).json({
        error: "Article not found",
      });
    }

    article.status = "archived";
    article.updatedBy = req.user.id;

    await article.save();

    res.status(200).json({
      message: "Knowledge base article archived successfully",
    });
  } catch (error) {
    console.error(
      "Error in deleteArticle controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function publishArticle(req, res) {
  try {
    const { id: articleId } = req.params;

    const article = await KnowledgeBaseArticle.findOne({
      _id: articleId,
      organizationId: req.user.organizationId,
    });

    if (!article) {
      return res.status(404).json({
        error: "Article not found",
      });
    }

    article.status = "published";
    article.updatedBy = req.user.id;

    await article.save();

    res.status(200).json({
      message: "Article published successfully",
      article,
    });
  } catch (error) {
    console.error(
      "Error in publishArticle controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function markArticleHelpful(req, res) {
  try {
    const { id: articleId } = req.params;

    const article = await KnowledgeBaseArticle.findOne({
      _id: articleId,
      organizationId: req.user.organizationId,
    });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    article.helpfulCount += 1;
    await article.save();

    return res.status(200).json({
      message: "Article feedback recorded",
      article,
    });
  } catch (error) {
    console.error("Error marking article helpful:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
