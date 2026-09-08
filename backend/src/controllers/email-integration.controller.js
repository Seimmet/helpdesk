import { EmailIntegration } from "../models/email-integration.model.js";

export async function createEmailIntegration(req, res) {
  try {
    const {
      provider,
      emailAddress,
      displayName,
      credentials,
      settings,
    } = req.body;

    if (!provider || !emailAddress) {
      return res.status(400).json({
        error: "Provider and email address are required",
      });
    }

    const integration = await EmailIntegration.create({
      organizationId: req.user.organizationId,
      provider,
      emailAddress: emailAddress.toLowerCase(),
      displayName,
      credentials,
      settings,
    });

    res.status(201).json({
      message: "Email integration created successfully",
      integration,
    });
  } catch (error) {
    console.error(
      "Error in createEmailIntegration controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getEmailIntegrations(req, res) {
  try {
    const integrations = await EmailIntegration.find({
      organizationId: req.user.organizationId,
    });

    res.status(200).json({
      integrations,
    });
  } catch (error) {
    console.error(
      "Error in getEmailIntegrations controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getEmailIntegration(req, res) {
  try {
    const { id: integrationId } = req.params;

    const integration = await EmailIntegration.findOne({
      _id: integrationId,
      organizationId: req.user.organizationId,
    });

    if (!integration) {
      return res.status(404).json({
        error: "Email integration not found",
      });
    }

    res.status(200).json({
      integration,
    });
  } catch (error) {
    console.error(
      "Error in getEmailIntegration controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateEmailIntegration(req, res) {
  try {
    const { id: integrationId } = req.params;

    const {
      displayName,
      emailAddress,
      credentials,
      settings,
      isActive,
    } = req.body;

    const integration = await EmailIntegration.findOne({
      _id: integrationId,
      organizationId: req.user.organizationId,
    });

    if (!integration) {
      return res.status(404).json({
        error: "Email integration not found",
      });
    }

    integration.displayName =
      displayName !== undefined
        ? displayName
        : integration.displayName;

    integration.emailAddress = emailAddress
      ? emailAddress.toLowerCase()
      : integration.emailAddress;

    if (credentials) {
      integration.credentials = credentials;
    }

    if (settings) {
      integration.settings = {
        ...integration.settings,
        ...settings,
      };
    }

    integration.isActive =
      isActive !== undefined
        ? isActive
        : integration.isActive;

    await integration.save();

    res.status(200).json({
      message: "Email integration updated successfully",
      integration,
    });
  } catch (error) {
    console.error(
      "Error in updateEmailIntegration controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteEmailIntegration(req, res) {
  try {
    const { id: integrationId } = req.params;

    const integration = await EmailIntegration.findOne({
      _id: integrationId,
      organizationId: req.user.organizationId,
    });

    if (!integration) {
      return res.status(404).json({
        error: "Email integration not found",
      });
    }

    await integration.deleteOne();

    res.status(200).json({
      message: "Email integration deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error in deleteEmailIntegration controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}