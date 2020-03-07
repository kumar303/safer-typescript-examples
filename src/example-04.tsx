async function request<Data>(endpoint: string): Promise<Data> {
  const response = await fetch(`https://api.com/v1${endpoint}`);
  return response.json();
}

type User = { name: string };

async function getUserName(userId: number): Promise<string> {
  const user = await request<User>(`/users/${userId}`);
  return user.name;
}

type UserRole = { type: "admin" | "staff" };

async function getUserRoles(userId: number): Promise<UserRole[]> {
  return request<UserRole[]>(`/users/${userId}/roles`);
}

// You can ignore this. It's just here to exercise some of the types
// above and to trick TypeScrpt into thinking this file is a module.
export default (): void => {
  console.log(getUserName(1));
  console.log(getUserRoles(1));
};
