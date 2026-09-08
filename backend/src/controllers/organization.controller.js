import { Organization } from "../models/organization.model.js";

export async function createOrganization(req, res) {
  try {
    const { name, slug, logoUrl, websiteUrl, supportEmail, timezone } =
      req.body;

    if (!name || !slug || !supportEmail) {
      return res.status(400).json({
        error: "Name, slug, and support email are required",
      });
    }

    const existingOrganization = await Organization.findOne({
      slug: slug.toLowerCase(),
    });

    if (existingOrganization) {
      return res.status(400).json({
        error: "Organization slug already exists",
      });
    }

    const organization = await Organization.create({
      name,
      slug: slug.toLowerCase(),
      logoUrl,
      websiteUrl,
      supportEmail: supportEmail.toLowerCase(),
      timezone: timezone || "Africa/Lagos",
    });

    res.status(201).json({
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error("Error in createOrganization controller:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getOrganization(req, res) {
  try {
    const organization = await Organization.findById(
      req.user.organizationId
    );

    if (!organization) {
      return res.status(404).json({
        error: "Organization not found",
      });
    }

    res.status(200).json({
      organization,
    });
  } catch (error) {
    console.error("Error in getOrganization controller:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateOrganization(req, res) {
  try {
    const {
      name,
      logoUrl,
      websiteUrl,
      supportEmail,
      timezone,
      settings,
    } = req.body;

    const organization = await Organization.findById(
      req.user.organizationId
    );

    if (!organization) {
      return res.status(404).json({
        error: "Organization not found",
      });
    }

    organization.name = name || organization.name;
    organization.logoUrl =
      logoUrl !== undefined ? logoUrl : organization.logoUrl;
    organization.websiteUrl =
      websiteUrl !== undefined
        ? websiteUrl
        : organization.websiteUrl;

    organization.supportEmail =
      supportEmail !== undefined
        ? supportEmail.toLowerCase()
        : organization.supportEmail;

    organization.timezone = timezone || organization.timezone;

    if (settings) {
      organization.settings = {
        ...organization.settings.toObject(),
        ...settings,
      };
    }

    await organization.save();

    res.status(200).json({
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Error in updateOrganization controller:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateOrganizationSettings(req, res) {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        error: "Settings are required",
      });
    }

    const organization = await Organization.findById(
      req.user.organizationId
    );

    if (!organization) {
      return res.status(404).json({
        error: "Organization not found",
      });
    }

    Object.keys(settings).forEach((key) => {
      if (key in organization.settings) {
        organization.settings[key] = settings[key];
      }
    });

    await organization.save();

    res.status(200).json({
      message: "Organization settings updated successfully",
      settings: organization.settings,
    });
  } catch (error) {
    console.error(
      "Error in updateOrganizationSettings controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}