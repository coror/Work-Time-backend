const AppRole = require("./modles/AppRole");
const AppUser = require("./modles/AppUser");

Parse.Cloud.define("createUser", AppUser.createUser);

Parse.Cloud.define("updatePassword", AppUser.updatePassword);

Parse.Cloud.define("deleteUser", AppUser.deleteUser);

Parse.Cloud.define(
  "requestPasswordResetEmail",
  AppUser.requestPasswordResetEmail
);

Parse.Cloud.define("devCreateRole", AppRole.devCreatRole);

Parse.Cloud.define("saveStudyData", async (request) => {
  const { userId, monthYearKey, programmingHours, fitnessHours, workData } =
    request.params;

  try {
    // Step 1: Verify that the user exists
    const userQuery = new Parse.Query("_User");
    const user = await userQuery.get(userId, { useMasterKey: true }); // Fetch the user by ID

    if (!user) {
      throw new Error("User with the provided ID does not exist.");
    }

    // Query to find an existing record with the same userId and monthYearKey
    const query = new Parse.Query("StudyData");
    query.equalTo("user", {
      __type: "Pointer",
      className: "_User",
      objectId: userId,
    });
    query.equalTo("storageKey", monthYearKey);

    const existingStudyData = await query.first(); // Get the first match

    let studyData;

    if (existingStudyData) {
      // If data exists, update it
      studyData = existingStudyData;
    } else {
      // If no data exists, create a new object
      studyData = new Parse.Object("StudyData");
      studyData.set("user", {
        __type: "Pointer",
        className: "_User",
        objectId: userId,
      });
      studyData.set("storageKey", monthYearKey);
    }

    // Set the data for programming, fitness, and work hours
    studyData.set("programmingHours", programmingHours);
    studyData.set("fitnessHours", fitnessHours);
    studyData.set("workData", workData);

    // Save the data (will update if it already exists, or create a new entry if it doesn't)
    await studyData.save();

    return "Data saved successfully!";
  } catch (error) {
    throw new Error("Error saving data to Back4App: " + error.message);
  }
});

Parse.Cloud.define("fetchStudyData", async (request) => {
  const { userId } = request.params;

  try {
    // Step 1: Query for study data linked to the user
    const query = new Parse.Query("StudyData");
    query.equalTo("user", {
      __type: "Pointer",
      className: "_User",
      objectId: userId,
    });

    const results = await query.find();

    // Step 2: Map the results into a format suitable for the chart
    const data = results.map((record) => ({
      storageKey: record.get("storageKey"), // e.g., "January_2023"
      programmingHours: record.get("programmingHours") || [],
      fitnessHours: record.get("fitnessHours") || [],
    }));

    return data;
  } catch (error) {
    throw new Error("Error fetching study data: " + error.message);
  }
});
