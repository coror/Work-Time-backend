const AppRole = require("./AppRole");

class AppUser extends Parse.User {
  constructor(att) {
    super(att);
  }

  static async createUser(req) {
    const { email, password, roleName } = req.params;

    const userData = {
      email,
      username: email,
      password,
      roleName,
    };

    let user;

    try {
      user = new AppUser(userData);
      await user.signUp();
      const role = await AppRole.assignUser(roleName, user);

      await Parse.Object.saveAll([user, role], {
        useMasterKey: true,
      });

      return "User was created successfully!";
    } catch (e) {
      if (user && user.id) {
        await user.destroy({ useMasterKey: true });
      }
      throw new Error(e);
    }
  }

  static async updatePassword(req) {
    const { userId, oldPassword, newPassword } = req.params;
    const userQuery = new Parse.Query("_User");
    const user = await userQuery.get(userId, { useMasterKey: true });

    if (user === undefined) {
      return "User was not found";
    }

    const isOldPasswordValid = await Parse.User.login(
      user.get("username"),
      oldPassword
    );
    if (!isOldPasswordValid) {
      throw new Error("invalid old password");
    }

    user.set("password", newPassword);
    await user.save(null, { useMasterKey: true });
    return "Password was succesfully updated!";
  }

  static async deleteUser(req) {
    const { userId } = req.params;
    const userQuery = new Parse.Query("_User");
    const user = await userQuery.get(userId, { useMasterKey: true });

    if (user === undefined) {
      return "User was not found";
    }
    user.destroy({ useMasterKey: true });
  }

  static async requestPasswordResetEmail(req) {
    const { email } = req.params;

    try {
      const userQuery = new Parse.Query("_User");
      userQuery.equalTo("email", email);
      const user = await userQuery.first();

      if (!user || user === undefined) {
        // Return a custom error message in the response
        return {
          success: false,
          message: "Email address not found in the database",
          status: 404, // Set the status code to 404 (Not Found)
        };
      }

      await Parse.User.requestPasswordReset(email);

      return {
        success: true,
        message: "Password reset request sent successfully!",
      };
    } catch (error) {
      console.log(error);
      // You can handle different types of errors here if needed
      return {
        success: false,
        message: "An error occurred while sending the password reset email.",
        status: 500, // Set the status code to 500 (Internal Server Error)
      };
    }
  }

  static registerClass() {
    Parse.Object.registerSubclass("_User", AppUser);
  }
}

module.exports = AppUser;
