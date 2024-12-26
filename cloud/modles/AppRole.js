class AppRole extends Parse.Role {
  constructor(name, ACL) {
    super(name, ACL);
  }

  static async assignUser(roleName, user) {
    const roleQuery = new Parse.Query("_Role");
    roleQuery.equalTo("name", roleName);
    const role = await roleQuery.first({ useMasterKey: true });

    if (role === undefined) {
      return undefined;
    }

    const relation = role.getUsers();
    relation.add(user);
    await role.save(null, { useMasterKey: true });
    return role;
  }

  static async devCreatRole(req) {
    const roleACL = new Parse.ACL();
    roleACL.setPublicReadAccess(true);

    const roleName = ["admin", "user"];

    const roles = roleName.map((role) => new AppRole(role, roleACL));
    Parse.Object.saveAll(roles, { useMasterKey: true });
  }

  static registerClass() {
    Parse.Object.registerSubclass("_Role", AppRole);
  }
}

module.exports = AppRole;
