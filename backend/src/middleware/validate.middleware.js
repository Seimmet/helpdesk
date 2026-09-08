export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const result = await schema.safeParseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Request validation failed",
          errors,
        });
      }

      // Replace request data with validated/transformed data
      req.body = result.data.body;
      req.params = result.data.params;
      req.query = result.data.query;

      next();
    } catch (error) {
      next(error);
    }
  };
};
