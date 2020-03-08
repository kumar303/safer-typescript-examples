[TypeScript](https://www.typescriptlang.org/)
makes JavaScript safer and even opens up new
architectural possibilities such as
[better unit tests](http://farmdev.com/thoughts/106/safer-unit-testing-in-react-with-typescript/).
I highly recommend it.
However, the default configuration encourages unsafe patterns
that developers might not be aware of.

Specifically, I wanted to illustrate the dangers of
[`any`](https://www.typescriptlang.org/docs/handbook/basic-types.html#any)
and show how you can define custom
[generics](https://www.typescriptlang.org/docs/handbook/generics.html)
instead.
I'll also offer some lint rules that will help your team
write safer TypeScript.

## Tightening up the config

For starters, a [config](https://storybook.js.org/docs/configurations/typescript-config/)
with at least
these options will buy you some safety:

<pre class="language-json">
<code class="language-json">{
  "compilerOptions": {
    "noImplicitAny": true,
    "strict": true
  }
}</code>
</pre>

Let's look at some examples using this config.

## Working with an API

Imagine you're working with a [RESTful API](https://en.wikipedia.org/wiki/Representational_state_transfer)
in TypeScript and you want to create a helper function that calls
[`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
It will take a `string` endpoint and return a Promise for the JSON result:

<pre class="language-ts">
<code class="language-ts">async function request(endpoint: string) {
  const response = await fetch(`https://api.com/v1${endpoint}`);
  return response.json();
}</code>
</pre>

Here's a function to fetch a user and return their name:

<pre class="language-ts">
<code class="language-ts">async function getUserName(userId: number) {
  const user = await request(`/users/${userId}`);
  return user.name;
}</code>
</pre>

This compiles without any errors. Wait, what?!
You didn't define a type for `user` so how does the compiler know it has a `name` attribute?
What happens if the API renames it
to `user.firstName` and you want to be sure you've updated all your code?

TypeScript aims to
[preserve](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Design-Goals)
runtime behavior of all JavaScript code
which, I guess, is why many things are unsafe by default.
Let's add more type safety.

## Enforcing return types

The two functions above don't define return types which means TypeScript
[inferred](https://www.typescriptlang.org/docs/handbook/type-inference.html)
them.
In the case of calling `response.json()`, the return value was typed as
[`Promise<any>`](https://github.com/microsoft/TypeScript/blob/a5796cf3b21a1641a85670fe33144cc2d59fb26c/lib/lib.dom.d.ts#L2582)
which is where
all type safety went out the window.
TypeScript lets you call `user.name` because `user` is of type
[`any`](https://www.typescriptlang.org/docs/handbook/basic-types.html#any)
so, whatever, man.

You can begin protecting against this by configuring a [linter](https://eslint.org/) with the
[`explicit-function-return-type`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-function-return-type.md)
rule.
This will make the above code fail linting with something like:

<pre>
<code>error  Missing return type on function</code>
</pre>

Let's fix it:

<pre class="language-ts">
<code class="language-ts">type User = { name: string };

async function request(endpoint: string): Promise&lt;User&gt; {
  const response = await fetch(`https://api.com/v1${endpoint}`);
  return response.json();
}

async function getUserName(userId: number): Promise&lt;string&gt; {
  const user = await request(`/users/${userId}`);
  return user.name;
}</code>
</pre>

This forced us to define a `User` type so that the compiler knows `user.name`
is a valid property.

Type inferrence is a nice feature but I came to regret not
enforcing explicit function types in a recent application I worked on.
It was convenient but I can think of several production bugs that
would have been caught by it.
It's worth the extra effort.

## I see diamonds! <>

Yep, I snuck some [generics](https://www.typescriptlang.org/docs/handbook/basic-types.html#any)
into the previous example.
The type definition `Promise<string>` uses the generic type,
[`Promise`](https://github.com/microsoft/TypeScript/blob/a5796cf3b21a1641a85670fe33144cc2d59fb26c/lib/lib.es2015.promise.d.ts#L33),
to say `getUserName()` returns a Promise resolving to a `string` type.
I'll show examples of defining custom generics in a minute.

## The case for generics

Let's say you need another function to call a different endpoint,
this time to fetch user roles:

<pre class="language-ts">
<code class="language-ts">type UserRole = { type: "admin" | "staff" };

async function getUserRoles(userId: number): Promise&lt;UserRole[]&gt; {
  return request(`/users/${userId}/roles`);
}</code>
</pre>

This won't compile because `request()` was defined as always
returning a `User` object which was only true for the other endpoint.
What can we do?

We _could_ say that `request()` returns `Promise<any>`, right? Let's try it:

<pre class="language-ts">
<code class="language-ts">async function request(endpoint: string): Promise&lt;any&gt; {
  const response = await fetch(`https://api.com/v1${endpoint}`);
  return response.json();
}</code>
</pre>

Yep, that compiles. Huh. Now we're back to the first problem where `any`
lets us do anything without type safety.
The most dangerous part is that `any` crept into the code and
made everything unsafe but there was no _error_.
A code reviewer might even miss it.

## Enhancing safety by disallowing any

`any` is a dangerous drug
so let's quit cold turkey
by adding the
[`no-explicit-any`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md)
lint rule.
This wouldn't catch how `response.json()` is defined _internally_ by
TypeScript to return
[`Promise<any>`](https://github.com/microsoft/TypeScript/blob/a5796cf3b21a1641a85670fe33144cc2d59fb26c/lib/lib.dom.d.ts#L2582)
but at least it will catch `any`
within our own code, showing something like:

<pre>
<code>error  Unexpected any. Specify a different type</code>
</pre>

## Defining a custom generic

To ditch `any` and safely call `request()` on endpoints of differing types,
we need to give it a type variable. We'll call it `Data`:

<pre class="language-ts">
<code class="language-ts">async function request&lt;Data&gt;(endpoint: string): Promise&lt;Data&gt; {
  const response = await fetch(`https://api.com/v1${endpoint}`);
  return response.json();
}</code>
</pre>

The `<Data>` part lets us say the `/users/:id`
endpoint (but not others) returns a Promise resolving to a `User`:

<pre class="language-ts">
<code class="language-ts">type User = { name: string };

async function getUserName(userId: number): Promise&lt;string&gt; {
  const user = await request&lt;User&gt;(`/users/${userId}`);
  return user.name;
}</code>
</pre>

This now makes it safe to access `user.name` and would allow
us to easily
change it to `user.firstName` or anything else in the future
if we need to.

Let's rewrite the other one:

<pre class="language-ts">
<code class="language-ts">type UserRole = { type: "admin" | "staff" };

async function getUserRoles(userId: number): Promise&lt;UserRole[]&gt; {
  return request&lt;UserRole[]&gt;(`/users/${userId}/roles`);
}</code>
</pre>

This says `request()` will return a Promise resolving
to a `UserRole` array and
adds all of the same safety benefits.

## A more complex generic

So far our `request()` helper deals with `GET` requests but what if
we add support for `POST`, which introduces a request body?
We'll need an additional type variable, something like
`request<ResponseType, BodyType>(...)`
or, more typically, `request<R, B>(...)` (you'll see a lot of single letter type variables in the wild).

Instead, I prefer
to define the type variable as an object with meaningful keys since
it makes the calling code easier to read.
Here's a new definition of `request()` that supports both `GET` and `POST` requests:

<pre class="language-ts">
<code class="language-ts">async function request&lt;
  D extends { BodyType: undefined | {}; ResponseType: {} }
&gt;(
  method: "GET" | "POST",
  endpoint: string,
  body?: D["BodyType"]
): Promise&lt;D["ResponseType"]&gt; {
  const response = await fetch(`https://api.com/v1${endpoint}`, {
    method,
    body: body ? JSON.stringify(body) : undefined
  });
  return response.json();
}</code>
</pre>

This required a bit more code and we now have a
[type constraint](https://www.typescriptlang.org/docs/handbook/generics.html#generic-constraints)
(via the `extends` keyword)
to denote the object shape.
Specifically, we're saying `request()` takes a type variable `D` which
is an object having the keys `BodyType` and `ResponseType`.

Let's define a function to make a `GET` request:

<pre class="language-ts">
<code class="language-ts">type User = { name: string };

async function getUser(userId: number): Promise&lt;User&gt; {
  return request&lt;{ BodyType: undefined; ResponseType: User }&gt;(
    "GET",
    `/users/${userId}`
  );
}</code>
</pre>

This defines `D` as an object where `BodyType` is `undefined`
(`GET` requests typically don't have them) and `ResponseType` is `User`.

Here's a function that makes a `POST` request:

<pre class="language-ts">
<code class="language-ts">async function createUser(user: User): Promise&lt;User&gt; {
  return request&lt;{ BodyType: User; ResponseType: User }&gt;(
    "POST",
    "/users",
    user
  );
}</code>
</pre>

This defines `D` where both `BodyType` and `ResponseType` are a `User`.

## Bolt-on solutions

I've shown how out of the box TypeScript isn't very safe and presented
some techniques for making it safer.
I also suggest hunting for third party libraries
that seek to specifically address type safety, as there are quite a few.

One in particular,
[io-ts](https://github.com/gcanti/io-ts)
helps make `fetch()` and other common I/O patterns type safe.
When working in
[Redux](https://redux.js.org/),
[`typesafe-actions`](https://github.com/piotrwitek/typesafe-actions)
adds type safety to actions as well as reducers, for example.

## The case for any types

Hopefully by now I've convinced you not to build a TypeScript app
with `any` types but there are still valid cases for them.
If you're converting a legacy code base to TypeScript,
falling back on `any` is a powerful way
to maintain forward momentum.
Converting a large code base could take longer than you think.
It's a good investment but it still takes time away from shipping
product features so one often has to do it incrementally.

There are other powerful
[escape hatches](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
in TypeScript
like `@ts-ignore` and `@ts-nocheck`.
I'm a big fan of
[spike, test, break, fix](http://farmdev.com/thoughts/113/spike-test-break-fix/)
development.
During the spike phase, it's super helpful to let
the TypeScript compiler guide you.
However, you may want to ignore type errors in things like
test files while experimenting with architectural changes.
Using `@ts-nocheck` in test files (just temporarily)
is really handy.

## Ship with confidence

The TypeScript learning curve steepens when approaching
generics but hopefully this gives someone a boost.
I showed how to add type safety to a flexible function
and call it in different ways.
Check out TypeScript's docs on
[generics](https://www.typescriptlang.org/docs/handbook/generics.html)
for more details.

I also provided some lint rules to help keep a codebase safe as it evolves.
All of this has to be enforced with
[continuous integration](http://farmdev.com/thoughts/114/if-it-s-not-in-ci-it-doesn-t-exist/)
for it to add lasting value.

If you'd like to play around with these code examples,
I've made them
[available](https://github.com/kumar303/safer-typescript-examples).
However, they are just examples.
Rather than building a type safe API client from scratch,
check out
[axios](https://github.com/axios/axios).
It supports TypeScript and is
[designed for type safety](https://levelup.gitconnected.com/a-typescript-safe-api-82cc22c4f92d).

To go further, here is a
[deep dive](https://basarat.gitbook.io/typescript/)
into TypeScript that was written to address
many common problems people run into when getting started.
