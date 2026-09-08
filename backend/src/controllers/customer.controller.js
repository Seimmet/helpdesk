import { Customer } from "../models/customer.model.js";

export async function createCustomer(req, res) {
  try {
    const {
      name,
      email,
      phoneNumber,
      avatarUrl,
      externalCustomerId,
      metadata,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: "Name and email are required",
      });
    }

    const organizationId = req.user.organizationId;

    const existingCustomer = await Customer.findOne({
      organizationId,
      email: email.toLowerCase(),
    });

    if (existingCustomer) {
      return res.status(200).json({
        message: "Customer already exists",
        customer: existingCustomer,
      });
    }

    const customer = await Customer.create({
      organizationId,
      name,
      email: email.toLowerCase(),
      phoneNumber,
      avatarUrl,
      externalCustomerId,
      metadata,
    });

    res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Error in createCustomer controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getCustomers(req, res) {
  try {
    const {
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      organizationId: req.user.organizationId,
    };

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getCustomers controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getCustomer(req, res) {
  try {
    const { id: customerId } = req.params;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: req.user.organizationId,
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    res.status(200).json({
      customer,
    });
  } catch (error) {
    console.error("Error in getCustomer controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateCustomer(req, res) {
  try {
    const { id: customerId } = req.params;

    const {
      name,
      email,
      phoneNumber,
      avatarUrl,
      externalCustomerId,
      metadata,
    } = req.body;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: req.user.organizationId,
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    customer.name = name || customer.name;
    customer.email = email
      ? email.toLowerCase()
      : customer.email;

    customer.phoneNumber =
      phoneNumber !== undefined
        ? phoneNumber
        : customer.phoneNumber;

    customer.avatarUrl =
      avatarUrl !== undefined
        ? avatarUrl
        : customer.avatarUrl;

    customer.externalCustomerId =
      externalCustomerId !== undefined
        ? externalCustomerId
        : customer.externalCustomerId;

    if (metadata) {
      customer.metadata = {
        ...customer.metadata,
        ...metadata,
      };
    }

    await customer.save();

    res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error in updateCustomer controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteCustomer(req, res) {
  try {
    const { id: customerId } = req.params;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: req.user.organizationId,
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCustomer controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}