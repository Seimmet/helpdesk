import { AutomationRule } from "../models/automation-rule.model.js";

export async function createAutomationRule(req, res) {
  try {
    const {
      name,
      description,
      trigger,
      conditions,
      actions,
      isActive,
    } = req.body;

    if (!name || !trigger || !actions?.length) {
      return res.status(400).json({
        error: "Name, trigger, and actions are required",
      });
    }

    const rule = await AutomationRule.create({
      organizationId: req.user.organizationId,
      name,
      description,
      trigger,
      conditions: conditions || [],
      actions,
      isActive:
        isActive !== undefined
          ? isActive
          : true,
    });

    res.status(201).json({
      message: "Automation rule created successfully",
      rule,
    });
  } catch (error) {
    console.error(
      "Error in createAutomationRule controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getAutomationRules(req, res) {
  try {
    const rules = await AutomationRule.find({
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      rules,
    });
  } catch (error) {
    console.error(
      "Error in getAutomationRules controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getAutomationRule(req, res) {
  try {
    const { id: ruleId } = req.params;

    const rule = await AutomationRule.findOne({
      _id: ruleId,
      organizationId: req.user.organizationId,
    });

    if (!rule) {
      return res.status(404).json({
        error: "Automation rule not found",
      });
    }

    res.status(200).json({
      rule,
    });
  } catch (error) {
    console.error(
      "Error in getAutomationRule controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateAutomationRule(req, res) {
  try {
    const { id: ruleId } = req.params;

    const {
      name,
      description,
      trigger,
      conditions,
      actions,
      isActive,
    } = req.body;

    const rule = await AutomationRule.findOne({
      _id: ruleId,
      organizationId: req.user.organizationId,
    });

    if (!rule) {
      return res.status(404).json({
        error: "Automation rule not found",
      });
    }

    rule.name = name || rule.name;

    rule.description =
      description !== undefined
        ? description
        : rule.description;

    rule.trigger = trigger || rule.trigger;

    rule.conditions =
      conditions !== undefined
        ? conditions
        : rule.conditions;

    rule.actions =
      actions !== undefined
        ? actions
        : rule.actions;

    rule.isActive =
      isActive !== undefined
        ? isActive
        : rule.isActive;

    await rule.save();

    res.status(200).json({
      message: "Automation rule updated successfully",
      rule,
    });
  } catch (error) {
    console.error(
      "Error in updateAutomationRule controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteAutomationRule(req, res) {
  try {
    const { id: ruleId } = req.params;

    const rule = await AutomationRule.findOne({
      _id: ruleId,
      organizationId: req.user.organizationId,
    });

    if (!rule) {
      return res.status(404).json({
        error: "Automation rule not found",
      });
    }

    await rule.deleteOne();

    res.status(200).json({
      message: "Automation rule deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error in deleteAutomationRule controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function toggleAutomationRule(req, res) {
  try {
    const { id: ruleId } = req.params;

    const rule = await AutomationRule.findOne({
      _id: ruleId,
      organizationId: req.user.organizationId,
    });

    if (!rule) {
      return res.status(404).json({
        error: "Automation rule not found",
      });
    }

    rule.isActive = !rule.isActive;

    await rule.save();

    res.status(200).json({
      message: `Automation rule ${
        rule.isActive ? "activated" : "deactivated"
      } successfully`,
      rule,
    });
  } catch (error) {
    console.error(
      "Error in toggleAutomationRule controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}