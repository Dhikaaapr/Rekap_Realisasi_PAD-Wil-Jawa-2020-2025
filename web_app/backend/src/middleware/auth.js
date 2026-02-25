const supabase = require('../config/supabase');

exports.checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // In a real app, we'd get the user from the JWT/Session
      // Using a header for now as a placeholder for testing
      const userRole = req.headers['x-user-role'] || 'admin'; // Default to admin for dev
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
      }
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };
};

exports.validateProvinsiAdmin = async (req, res, next) => {
    // Custom logic: Admin Provinsi can only edit Prov regions
    // This is a placeholder for the specific logic requested
    next();
};

exports.validateKabKotaAdmin = async (req, res, next) => {
    // Custom logic: Admin KabKota can only edit KabKota regions
    next();
};
