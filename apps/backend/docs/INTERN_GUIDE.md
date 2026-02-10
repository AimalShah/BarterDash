# 🎓 BarterDash Intern Guide & Crash Course

Welcome to the **BarterDash Engineering Team**! 👋

If you are reading this, you are probably new here and might be feeling a bit overwhelmed by terms like "Dependency Injection", "guards", or "webhooks". **Don't panic!** This guide is designed to be your mentor and accelerate your onboarding.

---

## 🏗️ Part 1: NestJS Crash Course

We use **NestJS** because it provides structure. Unlike Express.js where you can put code anywhere, NestJS forces you to be organized.

### The Big Three: Modules, Controllers, Services

Everything in NestJS revolves around these three concepts:

1.  **Modules (`*.module.ts`)**: Think of these as **folders** or **containers**. They group related code together.
    *   *Example*: `AuthModule` contains everything related to authentication.
    *   *Key*: Every piece of code MUST belong to a module.

2.  **Controllers (`*.controller.ts`)**: These are the **traffic cops**. They handle incoming HTTP requests (GET, POST, etc.) and decide who should handle them.
    *   *Role*: Check input -> Call Service -> Return Response.
    *   *Rule*: **NO BUSINESS LOGIC IN CONTROLLERS!** Keep them dumb.

3.  **Services (`*.service.ts`)**: This is where the **magic happens**. This is where your business logic lives.
    *   *Example*: "Calculate total price", "Save user to DB", "Send email".
    *   *Role*: Do the work -> Return data to Controller.

### Dependency Injection (DI) - The "Magical Wiring"

You will see `constructor` code like this everywhere:

```typescript
// cats.controller.ts
constructor(private catsService: CatsService) {}
```

**What is happening?**
You don't say `new CatsService()`. NestJS does it for you. It sees you need `CatsService`, finds the existing instance, and hands it to you. This makes testing easier and code cleaner.

### Pipes, Guards, and Filters (The Middlemen)

*   **Pipes**: Transform/Validate data. (e.g., "Is '123' a number?"). We use `ZodValidationPipe` extensively.
*   **Guards**: Authorization. (e.g., "Are you logged in?", "Are you an Admin?"). Checking for JWT tokens happens here.
*   **Filters**: Error handling. (e.g., "Catch any crash and send a nice 500 JSON response").

---

## ⚡ Part 2: Supabase (The Database)

We don't manage a raw PostgreSQL server; we use **Supabase**.

### What is it?
It's "Firebase for SQL". It gives us a Postgres database, Authentication, and File Storage out of the box.

### How we use it
We don't use an ORM like TypeORM or Prisma currently. We use the **Supabase JS Client** directly in our services.

**Example Pattern:**

```typescript
// auth.repository.ts
async findProfile(userId: string) {
  const { data, error } = await this.supabase
    .getClient() // <--- We use a wrapper service!
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}
```

**Intern Tip:** Always check the `error` object! Supabase doesn't throw exceptions by default; it returns them.

---

## 💳 Part 3: Stripe (Payments)

Payments are hard. Stripe makes them manageable.

### The Flow
1.  **Frontend** asks Backend: "I want to buy Item X."
2.  **Backend** talks to Stripe: "Create a `PaymentIntent` for $50."
3.  **Stripe** gives Backend a `client_secret`.
4.  **Backend** gives `client_secret` to Frontend.
5.  **Frontend** uses it to show the Credit Card form.
6.  **User** pays. Stripe says "Success".
7.  **Webhook**: Stripe calls *our* Backend (via a Webhook URL) to say "Hey, PaymentIntent `pi_123` succeeded!".
8.  **Backend** updates the database: "Order Paid".

### Important Concept: Webhooks
Code doesn't stop after step 4. The actual confirmation comes asynchronously via a **Webhook**.
*   **Local Development**: You need to use the Stripe CLI to forward these events to `localhost:3000/api/v1/payments/webhook`.

---

## 💡 Top Tips for Success

1.  **Environment Variables**: If the app crashes saying "URL undefined", check your `.env` file. Do you have `SUPABASE_URL` set?
2.  **DTOs (Data Transfer Objects)**: Always define a class for your inputs.
    *   *Bad*: `create(@Body() body: any)`
    *   *Good*: `create(@Body() createCatDto: CreateCatDto)`
3.  **Async/Await**: Database calls are slow. Don't forget `await`.
    *   *Bug*: `const user = this.userService.find(id); console.log(user); // prints 'Promise { <pending> }'`
    *   *Fix*: `const user = await this.userService.find(id);`
4.  **Ask Questions**: The codebase is evolving. If you see something weird, ask!

## 📚 Resources

*   [NestJS Docs](https://docs.nestjs.com/) (The Bible)
*   [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
*   [Stripe API Reference](https://stripe.com/docs/api)
*   [Zod Documentation](https://zod.dev/)

Happy Coding! 🚀
