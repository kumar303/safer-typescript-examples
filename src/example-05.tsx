async function request<
  D extends { BodyType: undefined | {}; ResponseType: {} }
>(
  method: "GET" | "POST",
  endpoint: string,
  body?: D["BodyType"]
): Promise<D["ResponseType"]> {
  const response = await fetch(`https://api.com/v1${endpoint}`, {
    method,
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json();
}

type User = { name: string };

async function getUser(userId: number): Promise<User> {
  return request<{ BodyType: undefined; ResponseType: User }>(
    "GET",
    `/users/${userId}`
  );
}

async function createUser(user: User): Promise<User> {
  return request<{ BodyType: User; ResponseType: User }>(
    "POST",
    "/users",
    user
  );
}

// You can ignore this. It's just here to exercise some of the types
// above and to trick TypeScrpt into thinking this file is a module.
export default async (): Promise<void> => {
  console.log(await getUser(1));
  console.log(await createUser({ name: "Kumar" }));
};
