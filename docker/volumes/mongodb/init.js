// MongoDB initialization for CV Enhancer
db = db.getSiblingDB('cv_enhancer');

// Create application user
db.createUser({
  user: 'cvuser',
  pwd: 'cvpass123',
  roles: ['readWrite']
});

// Create indexes for better performance
db.cvs.createIndex({ userId: 1 });
db.cvs.createIndex({ status: 1 });
db.cvs.createIndex({ "parsedData.data.personal.email": 1 });
db.cvs.createIndex({ "optimizedVersions.atsScore": 1 });
db.cvs.createIndex({ updatedAt: 1 });

print("✅ CV Enhancer MongoDB initialized successfully");
