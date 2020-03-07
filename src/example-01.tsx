/* eslint-disable @typescript-eslint/explicit-function-return-type */

async function request(endpoint: string) {
  const response = await fetch(`https://api.com/v1${endpoint}`);
  return response.json();
}

async function getUserName(userId: number) {
  const user = await request(`/users/${userId}`);
  return user.name;
}

// You can ignore this. It's just here to exercise some of the types
// above and to trick TypeScrpt into thinking this file is a module.
export default () => {
  console.log(getUserName(1));
};
