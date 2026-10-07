# Mastering NestJS

A short guide for C# / ASP.NET Core / Entity Framework developers.
This project is NestJS 12 (`@nestjs/common` ^12) and uses ESM, so imports end in `.js`.

Read it in order. Each section is one idea, one analogy, and one small example.
The **Decorator catalog** near the end lists every NestJS annotation: what it means, when to use it, and how.

## Contents

- [What NestJS is](#what-nestjs-is)
- [Concept map](#concept-map)
- [Your app, annotated](#your-app-annotated)
- [1. Modules](#1-modules)
- [2. Controllers and routing](#2-controllers-and-routing)
- [3. Dependency injection](#3-dependency-injection)
  - [Interfaces cannot be injected](#interfaces-cannot-be-injected)
  - [Custom providers](#custom-providers)
  - [Interfaces, tokens, and custom providers](#interfaces-tokens-and-custom-providers)
  - [Dynamic modules](#dynamic-modules)
  - [Lifetime: the trap coming from .NET](#lifetime-the-trap-coming-from-net)
  - [Lifecycle hooks](#lifecycle-hooks)
- [4. The request pipeline](#4-the-request-pipeline)
  - [Middleware as a class](#middleware-as-a-class)
  - [Guard ≈ `[Authorize]`](#guard-%E2%89%88-authorize)
  - [Authentication as a flow](#authentication-as-a-flow)
  - [Exception filter ≈ a domain exception mapped to HTTP](#exception-filter-%E2%89%88-a-domain-exception-mapped-to-http)
  - [Logging](#logging)
  - [Request context](#request-context)
- [5. DTOs and validation](#5-dtos-and-validation)
  - [DTO families and HTTP exceptions](#dto-families-and-http-exceptions)
- [6. Configuration](#6-configuration)
- [7. Persistence: which ORM](#7-persistence-which-orm)
  - [Prisma (recommended)](#prisma-recommended)
  - [Transactions](#transactions)
  - [TypeORM (EF entity style)](#typeorm-ef-entity-style)
  - [MikroORM (unit of work)](#mikroorm-unit-of-work)
  - [What maps from EF](#what-maps-from-ef)
- [8. One feature, end to end](#8-one-feature-end-to-end)
- [9. Testing](#9-testing)
- [10. Commands you will actually use](#10-commands-you-will-actually-use)
- [Decorator catalog](#decorator-catalog)
  - [Structure and dependency injection](#structure-and-dependency-injection)
  - [Routes](#routes)
  - [Parameter binding](#parameter-binding)
  - [Response control](#response-control)
  - [Pipeline](#pipeline)
  - [Other Nest packages](#other-nest-packages)
  - [Decorators that are not Nest](#decorators-that-are-not-nest)
- [Traps that waste a day](#traps-that-waste-a-day)
- [What to learn next, in order](#what-to-learn-next-in-order)

---

## What NestJS is

NestJS is a TypeScript framework for HTTP APIs (and other transports) on top of Node.js.
The default HTTP engine is Express. Fastify is a drop-in alternative.

Think of it as **ASP.NET Core with Angular-style structure**:

- `main.ts` is `Program.cs`
- a **module** is a bag of DI registrations (like a block of `builder.Services.Add...()`)
- a **controller** is a controller
- a **provider** is a class registered in DI (a service)
- **decorators** (`@Get()`, `@Injectable()`) are attributes (`[HttpGet]`, service registration)

Nest does not replace the language. It organizes classes, wires dependency injection, and runs a request pipeline.

---

## Concept map

| NestJS | ASP.NET Core / EF | What it does |
|---|---|---|
| `main.ts` | `Program.cs` | Builds and starts the app |
| `NestFactory.create(AppModule)` | `WebApplication.CreateBuilder` + `Build` | Creates the host |
| `@Module()` | A feature's `AddX()` registrations | Declares controllers, providers, imports |
| `@Controller('users')` | `[Route("users")]` | Marks a controller and its route prefix |
| `@Get(':id')` | `[HttpGet("{id}")]` | Maps a method to HTTP |
| `@Injectable()` | A class you register in DI | Marks a class Nest can construct |
| constructor param | constructor injection | Nest injects it; you do not `new` it |
| abstract class, or `@Inject(token)` | `AddScoped<IUserRepository, UserRepository>()` | An interface is erased; the lookup key must still exist at runtime |
| `useClass` / `useValue` / `useFactory` / `useExisting` | `AddSingleton<IFoo, Foo>()`, a constant, a factory, an alias | The four ways to register a provider |
| token + custom provider | The DI map: a key and a recipe | An interface types the field; `provide` is the key |
| `forRoot` / `forRootAsync` / `forFeature` | An `IServiceCollection` extension method | A library builds its own module from your options |
| `OnModuleInit` / `OnApplicationBootstrap` / `OnModuleDestroy` | `IHostedService`, startup, `IDisposable` | One-time startup and shutdown of a provider |
| DTO class | request/response model | Shape of input or output |
| `ValidationPipe` | automatic model validation | Rejects bad input before the action |
| `class-validator` | Data Annotations / FluentValidation | Rules on the DTO |
| Guard | `[Authorize]` / authorization filter | Allows or denies the request |
| JWT login + `@Roles()` | Identity + `AddJwtBearer` + `[Authorize(Roles = "admin")]` | Hash a password, sign a token, require a role |
| `PartialType` / `PickType` / `OmitType` | A second request model, derived | One DTO owns the rules; the others are generated from it |
| `NotFoundException` / `ConflictException` / `BadRequestException` | `return NotFound()` / `Conflict()` / `BadRequest()` | Throw; Nest writes the status |
| `prisma.$transaction` | `BeginTransaction` / `TransactionScope` | Several writes commit or roll back together |
| `Logger` | `ILogger<T>` | Log an outcome from a service, or the request from an interceptor |
| `NestMiddleware` + `forRoutes` | `app.Use(...)` | A class that runs before guards, on the routes you name |
| pass the user, or `nestjs-cls` | `IHttpContextAccessor` | How a singleton reads the current caller |
| Interceptor | action filter | Runs code before and after the handler |
| Pipe | model binder / param filter | Validates or transforms one argument |
| Exception filter | `IExceptionFilter` / exception handler | Turns errors into HTTP responses |
| `ConfigModule` | `IConfiguration` + `appsettings.json` | Reads env and config |
| Prisma | generated client + EF-style migrations | Recommended ORM for new apps |
| TypeORM | EF entities + `DbSet<T>` | Closest everyday feel to EF |
| MikroORM | EF change tracker (unit of work) | Closest to `DbContext.SaveChanges()` |

---

## Your app, annotated

`src/main.ts` — the host:

```ts
const app = await NestFactory.create(AppModule);
await app.listen(process.env.PORT ?? 3000);
```

Same job as:

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.Run();
```

`src/app.module.ts` — the composition root for this feature:

```ts
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

`controllers` is "these classes handle HTTP."
`providers` is "these classes can be injected."
`imports` is "pull in other modules" (like referencing another DI extension).

`src/app.controller.ts` — the endpoint:

```ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

`private readonly appService` in the constructor parameter is both the field and the injection point. Nest creates `AppService` and passes it in. You never call `new AppService()`.

---

## 1. Modules

A module groups one feature: its controllers, services, and the other modules it needs.

```
AppModule
  imports: [UsersModule, ConfigModule]
UsersModule
  controllers: [UsersController]
  providers: [UsersService]
  exports: [UsersService]   // other modules may inject this
```

`exports` is the public surface. If `UsersService` is not exported, another module cannot inject it. That is like `internal` versus `public`: registration is not the same as sharing.

Rules that prevent the usual mess:

- One feature, one module (`UsersModule`, `OrdersModule`).
- The controller stays thin. The service holds the use case.
- Import a module when you need its exported providers. Do not reach into its files and `new` a class.

Generate the skeleton:

```bash
npx nest g module users
npx nest g controller users
npx nest g service users
```

---

## 2. Controllers and routing

```ts
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }
}
```

| Decorator | ASP.NET | Reads |
|---|---|---|
| `@Param('id')` | `[FromRoute]` | `/users/42` → `"42"` |
| `@Query('q')` | `[FromQuery]` | `?q=ada` |
| `@Body()` | `[FromBody]` | JSON body |
| `@Headers('authorization')` | `[FromHeader]` | one header |

Route params arrive as **strings**. Parse them yourself, or use a pipe (`ParseIntPipe`) the way ASP.NET model binding parses `{id:int}`.

Return a plain object or array. Nest serializes it to JSON and sends `200`. To set the status, use `@HttpCode(201)` — the Nest version of `[ProducesResponseType]` plus the status you want.

---

## 3. Dependency injection

`@Injectable()` marks a class Nest is allowed to construct.

```ts
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
}
```

Nest reads the constructor type and looks up a matching provider. `emitDecoratorMetadata` in `tsconfig.json` is what makes that type visible at runtime. Without it, injection has nothing to read.

### Interfaces cannot be injected

In C#, an interface is a real type. The container still sees `IUserRepository` when it runs:

```csharp
services.AddScoped<IUserRepository, UserRepository>();
```

TypeScript deletes interface types at compile time. After `tsc`, `IUserRepository` is gone. Nest looks up values that still exist at runtime: classes, strings, and symbols. This constructor leaves nothing to search for:

```ts
constructor(private readonly repo: IUserRepository) {}
```

`emitDecoratorMetadata` records each parameter's design type. An interface has none, so the recorded token is `Object`. Nest looks for a provider registered as `Object` and fails to start.

The fix is an abstract class, or a string or symbol token. Both are the same registration as `AddScoped<IUserRepository, UserRepository>()`. This is the largest mental shift from that line: in .NET the interface is the key; in Nest the key has to survive compilation.

**Abstract class.** The class is a runtime value, so Nest can read it off the constructor. No `@Inject` is required. This is the closest shape to the .NET habit.

```ts
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
}

@Injectable()
export class PrismaUserRepository extends UserRepository {
  async findById(id: string): Promise<User | null> {
    return null;
  }
}

@Module({
  providers: [{ provide: UserRepository, useClass: PrismaUserRepository }],
  exports: [UserRepository],
})
export class UsersModule {}

@Injectable()
export class UsersService {
  constructor(private readonly repo: UserRepository) {}
}
```

`provide` is the lookup key. `useClass` is the class Nest constructs. Inject the abstract class, `UserRepository`. `{ provide, useClass }` is one of the four custom providers below. Registering only `PrismaUserRepository` and then asking for `UserRepository` misses: those are two tokens.

**Symbol or string token.** Keep a TypeScript `interface` when the contract must stay a type only: a shared package, or you do not want a class in the runtime. The interface still type-checks the field. Nest ignores it and reads `@Inject`.

```ts
export const USER_REPO = Symbol('USER_REPO');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return null;
  }
}

@Module({
  providers: [{ provide: USER_REPO, useClass: PrismaUserRepository }],
  exports: [USER_REPO],
})
export class UsersModule {}

@Injectable()
export class UsersService {
  constructor(@Inject(USER_REPO) private readonly repo: IUserRepository) {}
}
```

A string works the same way: `provide: 'USER_REPO'` and `@Inject('USER_REPO')`. Prefer a `Symbol`. Two modules can reuse the same string by accident; a symbol is unique.

Use the abstract class when one implementation is enough and you want the constructor to look like .NET. Use a symbol when the contract has to remain an interface.

### Custom providers

`providers: [UsersService]` is shorthand for `{ provide: UsersService, useClass: UsersService }`. The object form is the rest of the container. `provide` is always the lookup key. One of the four fields says what Nest should do with it.

| Field | What Nest does | .NET |
|---|---|---|
| `useClass` | Constructs that class and caches it under the token | `AddSingleton<IFoo, Foo>()` |
| `useValue` | Stores the object you already built | `AddSingleton(instance)` or a constant |
| `useFactory` | Calls your function. `inject` is the parameter list | `AddSingleton(sp => new Foo(sp.GetRequiredService<Bar>()))` |
| `useExisting` | Makes a second token for a provider that is already registered. Same instance | `AddSingleton<IFoo>(sp => sp.GetRequiredService<Foo>())` |

```ts
export const API_URL = Symbol('API_URL');

@Module({
  imports: [ConfigModule],
  providers: [
    UsersService,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: API_URL, useValue: 'https://api.example.com' },
    {
      provide: 'GREETING',
      useFactory: (config: ConfigService) => config.getOrThrow<string>('GREETING'),
      inject: [ConfigService],
    },
    { provide: 'USERS_ALIAS', useExisting: UsersService },
  ],
  exports: [UsersService, UserRepository, API_URL],
})
export class UsersModule {}
```

`inject` is positional: the first token becomes the first factory argument. The factory may return a `Promise`. Nest awaits it.

```ts
constructor(
  private readonly users: UsersService,
  private readonly repo: UserRepository,
  @Inject(API_URL) private readonly apiUrl: string,
  @Inject('GREETING') private readonly greeting: string,
  @Inject('USERS_ALIAS') private readonly sameUsers: UsersService,
) {}
```

`sameUsers` and `users` are the same object. `useExisting` does not construct anything. `{ provide: 'USERS_ALIAS', useClass: UsersService }` would construct a second `UsersService`.

`useValue` is also how a test plants a fake. Section 9 does this with `PrismaService`.

Export the token you want other modules to inject. Exporting `PrismaUserRepository` does not export `UserRepository`.

### Interfaces, tokens, and custom providers

The two sections above are the pieces. This is the one picture.

Nest's container is a map. The key is a **token**. The value is a **custom provider**: a recipe for the object Nest returns when a constructor asks for that key. `@Injectable()` does not choose the key. The key is either the class Nest reads off the constructor, or the argument of `@Inject`.

A token is a value that still exists after `tsc`. A class (including an abstract class), a string, and a `Symbol` are tokens. An interface is not a token, and neither is a type alias. Both are erased, so they can type a field and still be invisible to the map. That is why `AddScoped<IUserRepository, UserRepository>()` has no direct translation: in .NET the interface is the key, and in Nest the key is whatever you pass to `provide`.

| Idea | What it is | Where it shows up |
|---|---|---|
| Interface | The compile-time contract | `repo: IUserRepository` |
| Token | The runtime key | `provide: UserRepository`, `provide: USER_REPO`, `provide: 'API_URL'` |
| Custom provider | The recipe hung on that key | `useClass`, `useValue`, `useFactory`, `useExisting` |

`providers: [UsersService]` is the recipe written short, and only when the token and the class are the same object. The object form is what you write when they differ. **Interfaces cannot be injected** shows the two ways to make a legal key. **Custom providers** shows the four recipes. The registration below uses both at once: one instance, two tokens, plus a constant.

```ts
export const USER_REPO = Symbol('USER_REPO');
export const API_URL = 'API_URL';

@Module({
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: USER_REPO, useExisting: UserRepository },
    { provide: API_URL, useValue: 'https://api.example.com' },
  ],
  exports: [UserRepository, USER_REPO, API_URL],
})
export class UsersModule {}

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UserRepository,
    @Inject(USER_REPO) private readonly sameRepo: IUserRepository,
    @Inject(API_URL) private readonly apiUrl: string,
  ) {}
}
```

`UserRepository` is a class token, so the parameter type is enough and `@Inject` is optional. `USER_REPO` is a symbol token, so `@Inject` is required. `useExisting` makes that symbol point at the instance Nest already built for `UserRepository`. `repo` and `sameRepo` are the same object. `IUserRepository` only type-checks `sameRepo`. Nest never looks it up. `API_URL` is a string token whose recipe is `useValue`: a constant, the same job as `AddSingleton` of an object you already built.

Export each token a caller will ask for. Exporting the class `PrismaUserRepository` exports neither `UserRepository` nor `USER_REPO`.

### Dynamic modules

A dynamic module is a static method that returns module metadata. The class often wears an empty `@Module({})`. The method fills in `providers`, `imports`, and `exports` from the arguments you pass. Putting that return value in `imports` is calling an `IServiceCollection` extension method.

`ConfigModule.forRoot()`, `TypeOrmModule.forRoot()`, and `TypeOrmModule.forFeature()` are this pattern. The names are convention. Nest does not reserve them.

| Method | Call it | When |
|---|---|---|
| `forRoot(options)` | Once, from `AppModule` | The options are plain values: a URL, a flag |
| `forRootAsync(options)` | Once, from `AppModule` | An option must be read from another provider, usually `ConfigService` |
| `forFeature(...)` | In the feature module | Register only what that feature needs, on the connection `forRoot` already opened |

The static method runs while Nest is still building the module graph. Providers do not exist yet, so `forRoot` cannot call `config.get()`. `forRootAsync` hands Nest a factory and an `inject` list. Nest calls the factory later, after DI exists. That is the only reason both methods exist.

```ts
export const DATABASE_URL = Symbol('DATABASE_URL');

@Module({})
export class DatabaseModule {
  static forRoot(url: string): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        { provide: DATABASE_URL, useValue: url },
        PrismaService,
      ],
      exports: [PrismaService],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => string | Promise<string>;
  }): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DATABASE_URL,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        PrismaService,
      ],
      exports: [PrismaService],
    };
  }
}
```

`module: DatabaseModule` is required. It tells Nest which class this metadata belongs to. `global: true` is `@Global()` for this registration. Write `PrismaService` so its constructor takes `@Inject(DATABASE_URL)` and opens the client with that string. Importing `DatabaseModule` by itself registers nothing, because the decorator is empty.

```ts
// AppModule — once
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  DatabaseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => config.getOrThrow<string>('DATABASE_URL'),
  }),
]

// UsersModule — this feature only
imports: [TypeOrmModule.forFeature([User])]
```

`forFeature([User])` registers `Repository<User>` in `UsersModule`. It does not open a second database. `forRoot` in every feature module does. Call `forRoot` / `forRootAsync` once.

### Lifetime: the trap coming from .NET

ASP.NET Core registers most services as **scoped** (one instance per HTTP request).
Nest registers providers as **singletons** by default (one instance for the whole process).

| Nest scope | .NET equivalent |
|---|---|
| default (singleton) | `AddSingleton` |
| `@Injectable({ scope: Scope.REQUEST })` | `AddScoped` |
| `Scope.TRANSIENT` | `AddTransient` |

Those scopes apply to `useClass` and `useFactory` as well. `useValue` is the object you passed in, so it lives for the process. Set `scope: Scope.REQUEST` on the provider object when the factory must run once per request.

Do not put per-request state on a default provider. The next request will see it. The current user is the value people try to store. **Request context** in section 4 is the way a singleton reads that caller.

A long-lived database client (Prisma, a connection pool) **should** be a singleton. A unit-of-work object that tracks changes for one request **should** be request-scoped. That split is the same reason `DbContext` is scoped and `HttpClient` (via `IHttpClientFactory`) is not created per method call.

### Lifecycle hooks

A provider can run code once at startup and once at shutdown. Implement the interface on the class. Nest calls the method. There is no separate `AddHostedService` registration: if Nest constructed the provider, it will call the hook.

The interface is a compile-time contract. Nest looks for the method on the instance (`onModuleInit`, and the others). It does not inject the interface. A module class can implement the same hooks.

| Hook | When Nest calls it | .NET |
|---|---|---|
| `OnModuleInit` | This module's dependencies are constructed. Imported modules run first | `IHostedService.StartAsync` for this service |
| `OnApplicationBootstrap` | Every `onModuleInit` has finished. The process is about to listen | Startup finished. `ApplicationStarted` |
| `OnModuleDestroy` | Shutdown has started. Reverse of init, so a feature stops before the module it imported | `StopAsync`, then `IDisposable.Dispose` |
| `beforeApplicationShutdown` / `onApplicationShutdown` | After every `onModuleDestroy`. The argument is the signal, such as `'SIGTERM'` | `ApplicationStopping` / `ApplicationStopped` |

A thrown `onModuleInit` rejects `NestFactory.create`. `listen` never runs. That is a host that fails `StartAsync`.

```ts
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Injectable()
export class ReadyCheck implements OnApplicationBootstrap {
  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
```

`$connect` belongs in `onModuleInit`: the pool is open before any feature starts. The `ReadyCheck` query belongs in `onApplicationBootstrap`: it runs only after that connect has finished. `$disconnect` belongs in `onModuleDestroy`: features that imported the database module have already stopped.

```ts
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
await app.listen(process.env.PORT ?? 3000);
```

Call `app.enableShutdownHooks()` in `main.ts`. That subscribes to SIGINT and SIGTERM (Ctrl+C, and the signal a platform sends to stop a process) and runs the destroy hooks. `app.close()` runs them too, which is what a test should call. Without the line above, a SIGTERM exits the process and skips `$disconnect`, so the database keeps the connections until they time out.

These hooks run for singletons. A request-scoped provider is born and thrown away with the request, and Nest does not call them on it.

---

## 4. The request pipeline

One request passes through fixed stages. Order matters.

```
incoming HTTP
  → middleware          app.Use(...)           early, framework-wide
  → guard               [Authorize]            allow or deny
  → interceptor (before)
  → pipe                validation / parsing   then the controller method runs
  → interceptor (after)
  → exception filter    if something threw
```

Use each one for its job:

| Piece | Use it for | Leave it alone for |
|---|---|---|
| Middleware | raw body, CORS-style work | business rules, handler timing |
| Guard | authentication and authorization | changing the response body |
| Pipe | validate or transform **one value** | database calls |
| Interceptor | access log, timing, mapping, caching, wrapping the response | deciding who is allowed in |
| Exception filter | turn a thrown error into status + JSON | normal control flow |

### Middleware as a class

Middleware is `app.Use(...)`. It runs before guards, on the raw request, and it does not know which controller method will handle the call. Nest's class form is `NestMiddleware`. The module opts in by implementing `NestModule` and calling `consumer.apply(...).forRoutes(...)`.

```ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const id = randomUUID();
    res.setHeader('x-request-id', id);
    this.logger.log(`${req.method} ${req.originalUrl} ${id}`);
    next();
  }
}

@Module({
  imports: [UsersModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL })
      .forRoutes(UsersController);
  }
}
```

`apply` is the registration. The class does not also go in `providers`. Nest constructs it, so the constructor can take `ConfigService` or anything else that module can see. `Request`, `Response`, and `NextFunction` come from `express`. `randomUUID` comes from `node:crypto`. `apply(First, Second)` runs first, then second, the same order as two `app.Use` calls.

`forRoutes(UsersController)` limits the class to that controller's routes. A path works too: `forRoutes({ path: 'users', method: RequestMethod.GET })`. `exclude` skips a path inside that set. A function in `main.ts` is the unlimited form, and it is still `app.Use`:

```ts
const app = await NestFactory.create(AppModule);
app.use(helmet());
```

Use that for a library that is already a function (Helmet, cookie parsing). Use the class when you want dependency injection or a route limit.

Call `next()`, or the request never reaches the guard. That is forgetting to invoke the next middleware in ASP.NET. If this class sends the response itself, it stops the chain and does not call `next()`.

This class is one instance for the process. A field set from `req` would leak into the next request. The id above is a local. Middleware also runs before `JwtAuthGuard`, so `req.user` does not exist yet. Reading the caller here is the wrong stage. That belongs to **Request context** below.

### Guard ≈ `[Authorize]`

```ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    return Boolean(req.headers.authorization);
  }
}

@UseGuards(AuthGuard)
@Get('me')
me() {
  return { ok: true };
}
```

Returning `false` becomes `403`. Throwing `UnauthorizedException` becomes `401`.

### Authentication as a flow

Nest does not ship Identity. You assemble the same three pieces ASP.NET gives you:

- a user row that stores a **password hash**, never the password
- a login action that checks the hash and **signs a JWT**
- a bearer check on later requests, which is `AddJwtBearer`

A guard is `[Authorize]`. `@Roles('admin')` plus a second guard is `[Authorize(Roles = "admin")]`. The object the JWT strategy returns becomes `req.user`, which is `HttpContext.User`.

```
POST /auth/login          no guard          email + password in, token out
later request             JwtAuthGuard      verifies the bearer token, sets req.user
                          RolesGuard        reads @Roles and compares req.user.roles
                          handler           @CurrentUser() is req.user
```

Login stays on a controller that does not wear the guard. Unknown email and wrong password both throw `UnauthorizedException` (401), so the response does not reveal which emails exist.

```ts
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({ data: { email, passwordHash } });
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException();
    }
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      roles: user.roles,
    });
    return { accessToken };
  }
}
```

`bcrypt.hash` stores a salted hash. `bcrypt.compare` checks a password against that hash. The `12` is the cost factor. The token payload is claims: `sub` is the user id (`ClaimTypes.NameIdentifier`), `roles` is the role list. Do not put the hash or the password in the payload. A JWT is signed, not encrypted; anyone who has the token can read it.

`@nestjs/jwt` signs. `@nestjs/passport` and `passport-jwt` validate. `JwtStrategy` must be listed in `providers`, or Passport never registers the `'jwt'` scheme.

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; roles: string[] }) {
    return { userId: payload.sub, roles: payload.roles };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

Whatever `validate` returns is `req.user`. Returning `null` rejects the request with 401. Re-read the user inside `validate` when a role change must take effect before the token expires. Returning the payload alone means the token's roles stand until `expiresIn`.

```ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>('JWT_SECRET'),
    signOptions: { expiresIn: '1h' },
  }),
})
```

That `registerAsync` is a dynamic module. The secret comes from config, the same place as `AddJwtBearer` reading `IConfiguration`.

Roles are metadata. `SetMetadata` writes them; `Reflector` reads them back. The catalog entry for `@SetMetadata` shows the `Roles` helper.

```ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;
    const user = ctx.switchToHttp().getRequest().user;
    return required.some((role) => user?.roles?.includes(role));
  }
}
```

`getAllAndOverride` checks the method, then the class, and stops at the first value it finds. A method `@Roles('admin')` is the list the guard uses when the class also has `@Roles`. No `@Roles` means the role guard allows the request through, and `JwtAuthGuard` is still the authentication check.

The `User` model for this flow adds `passwordHash` and `roles` to the smaller `User` in section 7. `LoginDto` is the `PickType` in section 5.

```ts
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { userId: string; roles: string[] }) {
    return user;
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.users.remove(id);
  }
}
```

`@Post` answers `201` unless you set `@HttpCode(200)`. Login is a `200`.

Guard order is left to right. `JwtAuthGuard` runs first and sets `req.user`. `RolesGuard` reads it. Swapping them checks roles before a user exists. A missing or bad token is `401` from the JWT guard. A signed-in user without the role makes `RolesGuard` return `false`, which Nest turns into `403`. That split is `Unauthorized()` versus `Forbid()`.

`@CurrentUser()` is the parameter decorator in the catalog (`createParamDecorator`). It returns `req.user`. How a service uses that value is **Request context** below.

Install `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/jwt`, and `bcryptjs`. `passport-local` is optional: it moves the email-and-password check into a strategy named `'local'`. The service method above is the same check, and it is easier to follow.

### Exception filter ≈ a domain exception mapped to HTTP

```ts
export class NotFoundError extends Error {}

@Catch(NotFoundError)
export class NotFoundFilter implements ExceptionFilter {
  catch(err: NotFoundError, host: ArgumentsHost) {
    host.switchToHttp().getResponse().status(404).json({ message: err.message });
  }
}
```

Prefer Nest's built-in HTTP exceptions in simple code: `throw new NotFoundException('User not found')`. They already carry the status code. Which exception to throw is in **DTO families and HTTP exceptions** below. A filter is for errors you want to translate in one place, the way `UseExceptionHandler` does.

### Logging

`Logger` from `@nestjs/common` is `ILogger<T>`. The string you pass to the constructor is the category, the same job as `ILogger<UsersService>`.

```ts
private readonly logger = new Logger(UsersService.name);
```

A logger stores no request data, so a singleton is the right lifetime. ASP.NET registers `ILogger<T>` the same way. Do not mark it `Scope.REQUEST`. The method, the user id, and the duration go in the arguments of one log call. A field such as `this.userId` on a singleton would show the previous request's caller. That is the lifetime trap from section 3.

Log in two places, for two different facts.

| Place | What it knows | What to write |
|---|---|---|
| Service | The outcome of the use case | "Created user 4", "Email already used" |
| Interceptor | The HTTP call: method, path, how long, whether it threw | One access line per request |

The controller stays quiet. It only forwards into the service, so a log there repeats the service. Leave passwords, tokens, and the `Authorization` header out of both.

```ts
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(email: string) {
    const user = await this.prisma.user.create({ data: { email } });
    this.logger.log(`Created user ${user.id}`);
    return user;
  }
}
```

`log` is `LogInformation`. `warn` is `LogWarning`. `error` is `LogError`. `debug` and `verbose` are `LogDebug` and `LogTrace`. The service line is the business fact: an id and an outcome. The interceptor records the request around it.

An interceptor wraps the handler. `next.handle()` is the rest of the pipeline as an Observable. `tap` (from `rxjs`, which Nest already depends on) sees the result and leaves it unchanged.

```ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{ method: string; url: string }>();
    const started = Date.now();
    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(`${req.method} ${req.url} ${Date.now() - started}ms`),
        error: (err: Error) =>
          this.logger.error(`${req.method} ${req.url} failed`, err.stack),
      }),
    );
  }
}
```

`started` is a local. Each request gets its own. The interceptor instance is still one object for the process.

Register it once, through DI, so the singleton container owns it:

```ts
providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }]
```

`APP_INTERCEPTOR` comes from `@nestjs/core`. That provider is the global form of `@UseInterceptors(LoggingInterceptor)`. `new LoggingInterceptor()` in `main.ts` also works while the constructor has no dependencies. The provider form is the one that can grow a dependency later.

`app.useLogger(...)` swaps the destination for every `Logger` call. The service and the interceptor keep calling `log` and `error`. That is an `ILogger` implementation registered in the host.

### Request context

There is no `IHttpContextAccessor`. The request is an argument that lives on the Express `req` object, and Nest does not hand that object to every service. A service is a singleton, so a field on it is shared by every request in the process. Storing `this.user` there is the lifetime trap from section 3: request 2 reads the user from request 1.

`Scope.REQUEST` is the wrong fix for this. That scope is for a unit of work (the MikroORM `EntityManager`). A request-scoped `UsersService` is a new instance per call, and Nest resolves the services it injects per call too. The caller is not a unit of work. Pass the caller in, or put it in continuation-local storage.

**Pass it in.** The controller reads `@CurrentUser()` and hands the id to the service. The method takes that id the same way an application service takes a user id you already resolved from `ClaimsPrincipal`, instead of pulling `HttpContext` from a static.

```ts
@Get('me')
me(@CurrentUser() user: { userId: string }) {
  return this.users.findMine(user.userId);
}

findMine(userId: string) {
  return this.prisma.user.findUnique({ where: { id: userId } });
}
```

The singleton holds no caller. A unit test calls `findMine('user-1')` and never builds a request. This is the default.

**`nestjs-cls`**, when threading the user through many methods is the noise. CLS is `AsyncLocalStorage`: a value that follows this async call chain and no other. That is the mechanism behind `IHttpContextAccessor`. The service reads it without a parameter. Other requests have their own slot.

```ts
ClsModule.forRoot({
  global: true,
  middleware: { mount: true },
})
```

`middleware: { mount: true }` opens the slot at the start of the request. The slot is empty of a user until something writes it. Middleware runs before the JWT guard, so the write happens in an interceptor, after `req.user` exists.

```ts
@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<{ user?: { userId: string } }>();
    if (req.user) this.cls.set('user', req.user);
    return next.handle();
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly cls: ClsService) {}

  findMine() {
    const user = this.cls.get<{ userId: string }>('user');
    if (!user) throw new UnauthorizedException();
    return this.prisma.user.findUnique({ where: { id: user.userId } });
  }
}
```

Register `UserContextInterceptor` with `APP_INTERCEPTOR`, the same way as the logging interceptor. Install `nestjs-cls`. On a public route `req.user` is missing, so `get` returns `undefined` and the service throws `401`.

Prefer the parameter. Use CLS when a deep call, such as a Prisma extension or a logger wrapper, needs the caller and the parameter would have to be added to every method in between. Neither approach stores the user on the singleton.

---

## 5. DTOs and validation

A DTO is a class that describes the body. Validation is opt-in until you register the pipe.

```ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

Turn it on once, in `main.ts`. This is the global equivalent of automatic `[ApiController]` validation:

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

- `whitelist: true` strips properties that are not on the DTO (mass-assignment protection).
- `transform: true` builds a real `CreateUserDto` instance, not a plain object.

A bad body never enters `create()`. Nest responds `400` with the failed rules. Same outcome as a failed `ModelState`.

Install when you add this: `class-validator` and `class-transformer`.

### DTO families and HTTP exceptions

`CreateUserDto` is the source of truth. The other shapes are derived from it, so each validation attribute is written once. `@nestjs/mapped-types` builds the derived class and copies the decorators. A hand-copied `UpdateUserDto` drifts the first time a rule changes on only one of the two classes.

| Helper | The derived class | Use it for |
|---|---|---|
| `PartialType(Dto)` | Every field optional | `PATCH`, where the client sends some fields |
| `PickType(Dto, keys)` | Only the listed fields | Login, which needs email and password and nothing else |
| `OmitType(Dto, keys)` | Every field except the listed ones | A response that must not contain `password` |

```ts
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}

export class LoginDto extends PickType(CreateUserDto, ['email', 'password'] as const) {}

export class UserResponseDto extends OmitType(CreateUserDto, ['password'] as const) {}
```

`as const` keeps the key list literal, so a typo in `'email'` fails to compile. `UpdateUserDto` is "every create field except password, and all of them optional." A `PATCH` that includes `email` still runs `@IsEmail()`. A missing field is allowed. `PartialType` does not turn off validation for fields that are present.

If you document the API with Swagger, import these three helpers from `@nestjs/swagger` instead. That package re-exports them and updates the OpenAPI schema. The `@nestjs/mapped-types` versions do not.

Install `@nestjs/mapped-types` when you are not already pulling it in through Swagger.

The matching HTTP results are thrown, not returned. ASP.NET Core returns `NotFound()` from the action. Nest throws, and the built-in exception layer writes the status and a JSON body. The controller stays a call into the service.

| Throw | Status | ASP.NET |
|---|---|---|
| `BadRequestException` | 400 | `return BadRequest()` |
| `UnauthorizedException` | 401 | `return Unauthorized()` |
| `ForbiddenException` | 403 | `return Forbid()` |
| `NotFoundException` | 404 | `return NotFound()` |
| `ConflictException` | 409 | `return Conflict()` |

`ValidationPipe` already throws `BadRequestException` when a DTO rule fails. Throw `BadRequestException` yourself only for a rule the attributes cannot see, such as "this email is not on an allowed domain" after a lookup. Throw `NotFoundException` when the id is well-formed and no row exists. Throw `ConflictException` when a unique field is already taken (Prisma error `P2002` is this case). The login flow throws `UnauthorizedException`. The role guard's `false` is the `403`.

```ts
async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException('User not found');

  if (dto.email && dto.email !== user.email) {
    const taken = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (taken) throw new ConflictException('Email already used');
  }

  const saved = await this.prisma.user.update({ where: { id }, data: dto });
  return { id: saved.id, email: saved.email, name: saved.name };
}
```

The return value is `UserResponseDto`, the `OmitType` that dropped `password`. Returning the Prisma row would send `passwordHash` to the client.

---

## 6. Configuration

`@nestjs/config` is `IConfiguration`.

```ts
// app.module.ts
imports: [ConfigModule.forRoot({ isGlobal: true })]

// any service
constructor(private readonly config: ConfigService) {}
const port = this.config.get<string>('DATABASE_URL');
```

`.env` is the local stand-in for `appsettings.Development.json`. Do not commit secrets. `forRoot({ isGlobal: true })` is a dynamic module: an `IServiceCollection` extension that registers `ConfigService` for the whole app, so child modules do not re-import it. See **Dynamic modules** in section 3.

---

## 7. Persistence: which ORM

Node has no single official ORM the way .NET has Entity Framework. Nest stays ORM-agnostic. Pick one and wrap it in a provider.

| ORM | Pick it when | .NET analogue | Nest package |
|---|---|---|---|
| **Prisma** | You are starting a new app | EF migrations + a generated typed API | `prisma`, `@prisma/client` |
| **TypeORM** | You want classes, attributes, and repositories | EF entities + `DbSet<T>` | `@nestjs/typeorm`, `typeorm` |
| **MikroORM** | You want a change tracker and `SaveChanges` | `DbContext` unit of work | `@mikro-orm/nestjs` |
| **Drizzle** | You want SQL, fully typed | Dapper + a typed query builder | `drizzle-orm` |

**Recommendation:** use **Prisma** for new NestJS work. The schema is the source of truth, the client is generated and type-safe, and migrations are a normal part of the workflow. Use **TypeORM** if your team thinks in EF entities and wants the first-party Nest module (`TypeOrmModule.forFeature`). Use **MikroORM** if you specifically miss the change tracker. Use **Drizzle** if you want to write SQL and still have types.

There is no `DbContext` hiding inside Nest. You create a service and inject it.

### Prisma (recommended)

Schema (`prisma/schema.prisma`):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

`npx prisma migrate dev` is `dotnet ef migrations add` + `database update` for local work.
`npx prisma generate` rebuilds the client after schema edits. The generated client is the thing you call; you do not hand-write entity classes.

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(email: string) {
    return this.prisma.user.create({ data: { email } });
  }

  findAll() {
    return this.prisma.user.findMany();
  }
}
```

Register `PrismaService` in the module `providers` and `exports`. One process-wide client owns the pool. That is the correct singleton. `$connect` and `$disconnect` are lifecycle hooks. `$disconnect` runs on SIGTERM only when `main.ts` calls `app.enableShutdownHooks()`. See **Lifecycle hooks** in section 3.

Prisma does **not** track changes. An update is an explicit call:

```ts
return this.prisma.user.update({ where: { id }, data: { email } });
```

That is closer to `ExecuteUpdate` than to mutating an entity and calling `SaveChanges()`.

### Transactions

Each `create`, `update`, or `delete` commits on its own. Two `await`s are two transactions. If the second throws, the first row stays. `prisma.$transaction` is the `DbContext` transaction and `TransactionScope`: the writes inside it commit together, or they all roll back.

```csharp
await using var tx = await db.Database.BeginTransactionAsync();
var user = new User { Email = email };
db.Users.Add(user);
db.AuditLogs.Add(new AuditLog { User = user, Action = "user.created" });
await db.SaveChangesAsync();
await tx.CommitAsync();
```

```ts
async createWithAudit(email: string) {
  return this.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email } });
    await tx.auditLog.create({
      data: { userId: user.id, action: 'user.created' },
    });
    return user;
  });
}
```

The callback receives a client, `tx`, bound to one transaction. Both writes use `tx`. The value you `return` is the value `$transaction` resolves to. If `auditLog.create` throws, Prisma rolls the user insert back and the exception keeps going, so the exception filter still turns it into HTTP. Swallowing the error inside the callback commits, the same way a `TransactionScope` completes when nobody rethrows.

`this.prisma.user.create` inside that callback opens a different transaction. The audit row can roll back while the user row stays. Every write that must share the fate of the others goes through `tx`.

The array form, `this.prisma.$transaction([query1, query2])`, is the same commit-or-rollback for queries you can build up front. It cannot use `user.id` from the first insert in the second, because both queries are created before either runs. The callback is the form that has to read one row and then write the next. A balance check and the withdrawal that follows belong in one callback too, or two requests can both pass the check.

Keep the callback to the database work. The default time limit is five seconds. An HTTP call inside it holds a pooled connection until the call returns.

TypeORM's version is `dataSource.transaction(async (manager) => { ... })`. MikroORM's is `em.transactional(async (em) => { ... })`.

### TypeORM (EF entity style)

```ts
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;
}
```

```ts
TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL, autoLoadEntities: true })
TypeOrmModule.forFeature([User])  // registers Repository<User> for this module
```

```ts
constructor(
  @InjectRepository(User) private readonly users: Repository<User>,
) {}

create(email: string) {
  return this.users.save(this.users.create({ email }));
}
```

`forRoot` belongs in `AppModule`, once. `forFeature` belongs in the feature module. Both are dynamic modules.

`Repository<User>` feels like `DbSet<User>`. Keep `synchronize: false` outside toy projects. Ship migrations (`typeorm migration:generate`) the way you ship EF migrations. `synchronize: true` alters the database from entities on startup and will drop data.

### MikroORM (unit of work)

You load entities, change fields, and call `em.flush()`. That is `SaveChanges()`. The identity map is per unit of work, so the EntityManager you inject into a request must be request-scoped (`@mikro-orm/nestjs` does this). A singleton EntityManager would share tracked entities across requests — the same bug as a singleton `DbContext`.

### What maps from EF

| You do this in EF | Do this in Prisma | Do this in TypeORM |
|---|---|---|
| Entity class | `model` in `schema.prisma` | `@Entity()` class |
| `DbSet<User>` | `prisma.user` | `Repository<User>` |
| `Add` + `SaveChanges` | `user.create` | `repo.save` |
| LINQ | `findMany({ where })` | `find({ where })` or QueryBuilder |
| Migration | `prisma migrate dev` | `migration:generate` |
| Relation | `User` field on `Post` | `@ManyToOne` |
| `BeginTransaction` / `TransactionScope` | `prisma.$transaction(async tx => ...)` | `dataSource.transaction` |

---

## 8. One feature, end to end

Build a users slice in this order. Stop and run the app after each step (`npm run start:dev`).

1. `npx nest g resource users` — module, controller, service, and empty DTOs.
2. Add `CreateUserDto` with `class-validator` rules. Derive `UpdateUserDto` and `UserResponseDto` with `PartialType` and `OmitType`. Register `ValidationPipe` in `main.ts`.
3. Add `ConfigModule` and `DATABASE_URL`.
4. Add Prisma, model `User`, run `prisma migrate dev`.
5. Inject `PrismaService` into `UsersService` and implement `create` and `findAll`.
6. Call `POST /users` with a bad email and confirm `400`. Call it with a good email and confirm a row.

Controller:

```ts
@Post()
create(@Body() dto: CreateUserDto) {
  return this.users.create(dto.email);
}
```

Service:

```ts
create(email: string) {
  return this.prisma.user.create({ data: { email } });
}
```

The controller names the route and the input. The service names the use case. Prisma names the SQL. That split is Controller / application service / `DbContext`.

---

## 9. Testing

Unit test the service by replacing the database with a fake. `@nestjs/testing` is the test host (a small DI container), similar to `WebApplicationFactory` only when you boot the whole app.

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    UsersService,
    { provide: PrismaService, useValue: { user: { create: vi.fn() } } },
  ],
}).compile();
```

`provide` / `useValue` is `services.AddSingleton(fake)` in a test. Same custom provider as in section 3. The fake replaces `PrismaService` for this module only.

E2E tests in this repo use Vitest + Supertest (`test/app.e2e-spec.ts`). They boot `AppModule` and call HTTP. That is the full-pipeline test. Keep those few, and keep service tests many.

---

## 10. Commands you will actually use

| Command | When |
|---|---|
| `npm run start:dev` | Code, refresh, repeat |
| `npm run test` | Unit tests |
| `npm run test:e2e` | HTTP tests |
| `npx nest g resource <name>` | New feature skeleton |
| `npx prisma migrate dev` | Apply a schema change locally |

---

## Decorator catalog

A Nest decorator is metadata attached to a class, a method, or a parameter. At startup Nest reads that metadata and builds routes, the DI graph, and the pipeline. In C# the same idea is an attribute: `[HttpGet]`, `[FromBody]`, `[Authorize]`.

Decorators do no work by themselves. `@IsEmail()` does nothing until `ValidationPipe` is registered. `@Injectable()` does nothing until the class is listed in `providers`.

Three places you can put one:

| Placed on | Examples |
|---|---|
| Class | `@Module`, `@Controller`, `@Injectable`, `@Catch`, `@UseGuards` |
| Method | `@Get`, `@Post`, `@HttpCode`, `@Header` |
| Parameter | `@Body`, `@Param`, `@Query`, `@Inject` |

Class and method can both carry `@UseGuards`, `@UseInterceptors`, `@UsePipes`, and `@UseFilters`. The class one runs for every route. The method one runs only for that route, after the class one.

Built-in pipes are classes you pass into a parameter decorator. They are the parsing half of ASP.NET model binding:

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}
```

`ParseIntPipe`, `ParseBoolPipe`, `ParseFloatPipe`, `ParseUUIDPipe`, `ParseEnumPipe`, `ParseArrayPipe`, `DefaultValuePipe`, `ValidationPipe`.

---

### Structure and dependency injection

#### `@Module({ imports, controllers, providers, exports })`

**What:** Declares one feature: which controllers it owns, which services it can construct, which other modules it needs, and which services it shares.
**When:** Every feature has one module. `AppModule` is the root.
**.NET:** A block of `builder.Services.Add...()` plus the controllers for that area.
**How:**

```ts
@Module({
  imports: [ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

#### `@Global()`

**What:** Marks a module so its `exports` can be injected anywhere, with no `imports` entry.
**When:** Cross-cutting infrastructure: config, logging, the database client. One or two modules in an app.
**.NET:** A service registered once in `Program.cs` and visible to every project.
**How:** `@Global() @Module({ providers: [PrismaService], exports: [PrismaService] })`

#### `@Controller(prefix?)`

**What:** Marks a class as an HTTP controller and sets the path prefix for every method.
**When:** Any class that handles routes. Keep one resource per controller (`users`, `orders`).
**.NET:** `[Route("users")]` on the controller class.
**How:** `@Controller('users')` serves `/users`. `@Controller({ path: 'users', version: '1' })` is the versioned form. `@Controller({ host: ':account.example.com' })` limits the controller to that host.

#### `@Injectable(options?)`

**What:** Marks a class Nest is allowed to construct and inject.
**When:** Services, guards, interceptors, pipes, filters. If Nest creates it, it needs this.
**.NET:** A class you register in DI. Nest's default lifetime is singleton (`AddSingleton`), so pass `{ scope: Scope.REQUEST }` when you need one instance per request (`AddScoped`).
**How:**

```ts
@Injectable({ scope: Scope.REQUEST })
export class AuditContext {}
```

#### `@Inject(token)`

**What:** Tells Nest which provider to pass when the TypeScript type is not enough.
**When:** The parameter type is an interface (deleted at compile time), or the provider is registered under a string, symbol, or factory. See **Interfaces cannot be injected** and **Interfaces, tokens, and custom providers** in section 3.
**.NET:** A keyed service, `[FromKeyedServices("api")]`. For an interface, .NET uses the interface itself as the key; Nest cannot.
**How:**

```ts
constructor(@Inject(USER_REPO) private readonly repo: IUserRepository) {}
```

#### `@Optional()`

**What:** If that provider was never registered, inject `undefined` and still start the app.
**When:** A feature that works with or without an extra integration (metrics, a cache).
**.NET:** `GetService<T>()` rather than `GetRequiredService<T>()`.
**How:** `constructor(@Optional() @Inject(Cache) private readonly cache?: Cache) {}`

#### `@Dependencies(...tokens)`

**What:** Lists constructor dependencies by hand when TypeScript cannot emit design types.
**When:** A bundler or compiler setup strips `emitDecoratorMetadata`. A normal Nest app leaves this unused.
**.NET:** Writing the DI registration yourself because reflection is unavailable.
**How:** `@Dependencies(UsersService) @Controller('users') export class UsersController { ... }`

---

### Routes

These go on controller methods. The argument is the path under the controller prefix. `:id` is a route parameter.

| Decorator | HTTP | Typical use |
|---|---|---|
| `@Get(path?)` | GET | Read. Safe to retry. |
| `@Post(path?)` | POST | Create. Default success status is **201**. |
| `@Put(path?)` | PUT | Replace a whole resource. |
| `@Patch(path?)` | PATCH | Update part of a resource. |
| `@Delete(path?)` | DELETE | Remove. |
| `@Options(path?)` | OPTIONS | CORS preflight or capability checks. Rare in hand-written controllers. |
| `@Head(path?)` | HEAD | Headers only, no body. Existence or caching checks. |
| `@All(path?)` | any verb | One method for every verb on that path. Rare. |
| `@Sse(path?)` | GET (event stream) | Server-Sent Events: one-way live updates. |

**.NET:** `[HttpGet("{id}")]`, `[HttpPost]`, and the rest of the `[Http*]` attributes. `@Sse()` is an `IAsyncEnumerable` response with `text/event-stream`.

**How:**

```ts
@Get(':id')
findOne(@Param('id') id: string) {
  return this.users.findOne(id);
}
```

`@Sse('events')` returns an Observable of `{ data }` messages. Use it for progress and notifications. Two-way chat belongs to the WebSocket decorators further down.

#### `@Version(version)`

**What:** Puts this controller or this route on one API version.
**When:** `/v1/users` and `/v2/users` must both stay up. Turn versioning on in `main.ts` first (`app.enableVersioning(...)`).
**.NET:** `[Route("v1/users")]` or an API-version attribute.
**How:** `@Version('1')` on the class, or on a single method to override it.

---

### Parameter binding

These go on constructor or method parameters. They pull one piece of the HTTP request into the argument. Pair them with a pipe when the raw value is a string and the method wants a number, a UUID, or a validated DTO.

#### `@Param(name?)`

**What:** Reads the route: `/users/42` with `@Get(':id')`.
**When:** The id (or slug) is part of the path.
**.NET:** `[FromRoute]`.
**How:** `@Param('id', ParseIntPipe) id: number`. `@Param()` with no name returns the whole params object.

#### `@Query(name?)`

**What:** Reads the query string: `?page=2&q=ada`.
**When:** Filters, paging, and sort. Use one DTO for a query with several fields.
**.NET:** `[FromQuery]`.
**How:** `@Query() query: ListUsersDto` or `@Query('page', ParseIntPipe) page: number`.

#### `@Body(property?)`

**What:** Reads the parsed JSON body.
**When:** POST, PUT, and PATCH. Prefer a DTO class over a single property.
**.NET:** `[FromBody]`.
**How:** `@Body() dto: CreateUserDto`.

#### `@Headers(name?)`

**What:** Reads request headers.
**When:** A token, an idempotency key, a content type you branch on.
**.NET:** `[FromHeader(Name = "authorization")]`.
**How:** `@Headers('authorization') auth: string`. `@Header()` is a different decorator: it **sets** a response header.

#### `@Ip()`

**What:** The client IP address.
**When:** Audit logs and rate limits. Behind a proxy, configure the platform so this is the real client, not the proxy.
**.NET:** `HttpContext.Connection.RemoteIpAddress`.
**How:** `create(@Ip() ip: string)`.

#### `@Session()`

**What:** The server session object.
**When:** You installed `express-session`. Token APIs usually skip sessions.
**.NET:** `HttpContext.Session`.
**How:** `@Session() session: Record<string, unknown>`.

#### `@HostParam(name)`

**What:** A value captured from the controller's host pattern.
**When:** Multi-tenant routing by subdomain (`:account.example.com`).
**.NET:** A host route constraint value.
**How:** On `@Controller({ host: ':account.example.com' })`, a method takes `@HostParam('account') account: string`.

#### `@Req()` and `@Request()`

**What:** The raw platform request (Express or Fastify). Same decorator, two names.
**When:** You need a field Nest does not bind: cookies, the socket, a raw stream.
**.NET:** `HttpContext.Request`.
**How:** `@Req() req: Request`. For `body`, `params`, and `query`, prefer `@Body`, `@Param`, and `@Query` so the method lists its real inputs.

#### `@Res()` and `@Response()`

**What:** The raw platform response.
**When:** Streaming a file, or writing a response Nest cannot express as a return value. Pass `{ passthrough: true }` when you still want Nest to send the returned value.
**.NET:** Writing `HttpContext.Response` inside the action.
**How:** `@Res({ passthrough: true }) res: Response`, then `res.cookie(...)` and `return { ok: true }`. A bare `@Res()` means you send the response yourself (`res.json(...)`).

#### `@Next()`

**What:** The platform `next` function.
**When:** Almost never in a controller. Middleware calls `next` to continue the chain. Controllers throw HTTP exceptions instead.
**.NET:** Invoking the rest of the middleware pipeline from inside an action.
**How:** `@Next() next: NextFunction`. The class form is **Middleware as a class** in section 4.

#### `@UploadedFile()` and `@UploadedFiles()`

**What:** A file (or files) from `multipart/form-data`.
**When:** An upload route. Attach `FileInterceptor` / `FilesInterceptor` from `@nestjs/platform-express` on the same method.
**.NET:** `IFormFile` and `IFormFileCollection`.
**How:**

```ts
@Post('avatar')
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File) {
  return { name: file.originalname };
}
```

#### `@RawBody()`

**What:** The unparsed request body as a `Buffer`.
**When:** Webhook signature checks (Stripe and similar), where JSON parsing would change the bytes.
**.NET:** Enabling buffering and reading the raw body before the model binder.
**How:** Create the app with `NestFactory.create(AppModule, { rawBody: true })`, then `@RawBody() raw: Buffer`.

#### Custom parameter: `createParamDecorator`

**What:** A factory for your own parameter decorator.
**When:** The same request lookup shows up on many routes, such as the current user.
**.NET:** A custom model binder, or an attribute that reads `HttpContext.User`.
**How:**

```ts
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user;
});

@Get('me')
me(@CurrentUser() user: User) {
  return user;
}
```

The JWT strategy's `validate` return value is `req.user`. See **Authentication as a flow** in section 4.

---

### Response control

#### `@HttpCode(status)`

**What:** Sets the status used when the handler returns normally.
**When:** The default is wrong for this route. POST defaults to 201. Everything else defaults to 200.
**.NET:** `return NoContent()` or `[ProducesResponseType(StatusCodes.Status204NoContent)]`.
**How:** `@HttpCode(204)` on a delete that returns nothing.

#### `@Header(name, value)`

**What:** Sets a response header.
**When:** A fixed header such as `Cache-Control`. For a header computed per request, set it on `@Res({ passthrough: true })`.
**.NET:** `Response.Headers.Append`.
**How:** `@Header('Cache-Control', 'no-store')`.

#### `@Redirect(url, status?)`

**What:** Answers with a redirect. Return `{ url, statusCode }` from the method to override the decorator values.
**When:** Browser flows (login, a moved page). JSON APIs rarely redirect.
**.NET:** `return Redirect(url)`.
**How:** `@Redirect('https://example.com', 302)`.

#### `@Render(view)`

**What:** Renders a server-side view instead of JSON.
**When:** You configured a view engine (Handlebars, EJS, Pug). A JSON API leaves this unused.
**.NET:** `return View("Index", model)`.
**How:** `@Render('index')` and return the view model object.

---

### Pipeline

#### `@UseGuards(...guards)`

**What:** Runs guards before the handler. A guard returns `true` or `false`, or throws.
**When:** Authentication and authorization, on one route or a whole controller.
**.NET:** `[Authorize]`.
**How:** `@UseGuards(JwtAuthGuard, RolesGuard)`. Left to right. `false` becomes 403. `throw new UnauthorizedException()` becomes 401. See **Authentication as a flow** in section 4.

#### `@UseInterceptors(...interceptors)`

**What:** Wraps the handler. Code runs before the method and again on the way out (including the returned value).
**When:** Timing, response envelopes, cache, mapping an entity to a DTO.
**.NET:** An action filter (`OnActionExecutionAsync`).
**How:** `@UseInterceptors(LoggingInterceptor)`, or `{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }` for every route. See **Logging** in section 4.

#### `@UsePipes(...pipes)`

**What:** Runs pipes that validate or transform arguments.
**When:** The check applies to a whole method or controller. For one argument, pass the pipe to that parameter instead: `@Param('id', ParseIntPipe)`.
**.NET:** A validation filter, or a type converter.
**How:** `@UsePipes(new ValidationPipe({ whitelist: true }))`.

#### `@UseFilters(...filters)`

**What:** Attaches exception filters that turn thrown errors into HTTP responses.
**When:** This controller or route needs a mapping the global filter does not have.
**.NET:** `[TypeFilter(typeof(SomeExceptionFilter))]` on a controller.
**How:** `@UseFilters(NotFoundFilter)`.

#### `@Catch(...exceptions)`

**What:** Declares which error types a filter handles. `@Catch()` with no arguments handles every error.
**When:** You are writing the filter class. `@UseFilters` then attaches that class.
**.NET:** An exception filter limited to one exception type.
**How:**

```ts
@Catch(NotFoundError)
export class NotFoundFilter implements ExceptionFilter {
  catch(err: NotFoundError, host: ArgumentsHost) {
    host.switchToHttp().getResponse().status(404).json({ message: err.message });
  }
}
```

#### `@SetMetadata(key, value)`

**What:** Stores a value on the class or method. Guards and interceptors read it back with `Reflector`.
**When:** You need your own attribute, such as roles or "this route is public."
**.NET:** A custom attribute that an `IAuthorizationHandler` inspects.
**How:**

```ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Roles('admin')
@UseGuards(RolesGuard)
@Delete(':id')
remove(@Param('id') id: string) {
  return this.users.remove(id);
}
```

The guard calls `this.reflector.getAllAndOverride('roles', [handler, class])`. The full login flow is **Authentication as a flow** in section 4.

#### `@ApplyDecorators(...)`

**What:** Combines several decorators into one you can reuse.
**When:** The same stack repeats: guards, swagger metadata, and `@Post`.
**.NET:** One custom attribute that applies several others, without a first-class language feature for it.
**How:** `export const AdminOnly = () => ApplyDecorators(Roles('admin'), UseGuards(RolesGuard));`

---

### Other Nest packages

These ship in optional packages. Import them from that package. They follow the same rules: metadata on a class, method, or parameter.

#### WebSockets — `@nestjs/websockets` and `@nestjs/platform-socket.io`

Two-way connections. This is SignalR's niche.

| Decorator | What | When |
|---|---|---|
| `@WebSocketGateway(port?)` | Marks a gateway class, the Socket.IO entry point | One class per realtime feature |
| `@WebSocketServer()` | Injects the server so you can broadcast | A property on the gateway |
| `@SubscribeMessage('name')` | Handles one client event | Each incoming message type |
| `@MessageBody()` | The event payload | The parameter that is the message |
| `@ConnectedSocket()` | The client socket | Reply to that client only |

```ts
@WebSocketGateway()
export class EventsGateway {
  @SubscribeMessage('ping')
  ping(@MessageBody() body: string, @ConnectedSocket() client: Socket) {
    client.emit('pong', body);
  }
}
```

#### Microservices — `@nestjs/microservices`

Message handlers beside HTTP. This is a consumer of a broker (NATS, RabbitMQ, Kafka, Redis), in the same role as a `BackgroundService` plus a message listener.

| Decorator | What | When |
|---|---|---|
| `@MessagePattern(pattern)` | Request-response message | The caller waits for a reply |
| `@EventPattern(pattern)` | Event, no reply | Publish/subscribe |
| `@Payload()` | The message body | The handler parameter |
| `@Ctx()` | Transport context (ack, headers) | You need broker-specific details |

#### Scheduled tasks — `@nestjs/schedule`

| Decorator | What | When |
|---|---|---|
| `@Cron(expression)` | Runs on a cron schedule | Nightly jobs |
| `@Interval(ms)` | Runs on a fixed interval | Polling |
| `@Timeout(ms)` | Runs once after a delay | A deferred startup task |

**.NET:** `IHostedService` / Hangfire / Quartz triggers.

#### GraphQL — `@nestjs/graphql`

Skip these on a REST app. They replace controllers for a GraphQL schema.

| Decorator | What | .NET analogue |
|---|---|---|
| `@Resolver(() => User)` | Class of field resolvers for a type | A GraphQL resolver class |
| `@Query(() => [User])` | A root read field | Query method |
| `@Mutation(() => User)` | A root write field | Mutation method |
| `@Args()` | A field argument | Parameter |
| `@ResolveField()` | A nested field | Field resolver |
| `@Parent()` | The parent object | Parent value passed into the field resolver |

---

### Decorators that are not Nest

Tutorials mix these in. They come from other libraries. Nest only runs them if something in the pipeline reads them.

#### `class-validator` — rules on a DTO

These are Data Annotations. They run when `ValidationPipe` is registered.

| Decorator | Checks |
|---|---|
| `@IsString()` `@IsEmail()` `@IsInt()` `@IsBoolean()` `@IsUUID()` `@IsEnum()` `@IsDate()` | Type or format |
| `@IsNotEmpty()` `@MinLength()` `@MaxLength()` `@Min()` `@Max()` `@Length()` | Presence and range |
| `@IsOptional()` | Allow `null` or missing; other rules apply only when the value is present |
| `@IsArray()` `@ValidateNested({ each: true })` | Arrays and nested DTOs. Nested objects also need `@Type(() => ChildDto)` from `class-transformer` |
| `@Matches(regex)` `@IsIn(values)` | Pattern or allow-list |

```ts
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

#### `@nestjs/swagger` — OpenAPI docs

These describe the API for Swagger UI. They do not change runtime behavior.

| Decorator | What |
|---|---|
| `@ApiTags('users')` | Groups routes in the UI |
| `@ApiOperation({ summary })` | One-line description of a route |
| `@ApiResponse({ status, type })` | A documented status and body |
| `@ApiBearerAuth()` | Route requires the bearer scheme |
| `@ApiProperty()` | A DTO field included in the schema |

**.NET:** Swashbuckle attributes such as `[ProducesResponseType]` and `[SwaggerOperation]`.

#### TypeORM — only if you chose that ORM

Prisma does not use these. With TypeORM they are EF-style attributes on entity classes.

| Decorator | What | EF |
|---|---|---|
| `@Entity()` | This class is a table | Entity class mapped to a table |
| `@PrimaryGeneratedColumn()` | Identity key | `ValueGeneratedOnAdd` |
| `@Column()` | A column | A mapped property |
| `@CreateDateColumn()` `@UpdateDateColumn()` | Timestamps Nest/TypeORM fills in | Shadow or convention timestamps |
| `@ManyToOne()` `@OneToMany()` `@OneToOne()` `@ManyToMany()` | Relations | Navigation properties |
| `@JoinColumn()` | The foreign key lives on this table | The dependent side of the relationship |
| `@InjectRepository(User)` | Inject `Repository<User>` | Inject `DbSet<User>` via a repository |

`@InjectRepository` comes from `@nestjs/typeorm`. The entity decorators come from `typeorm`.

---

## Traps that waste a day

1. **Injecting an interface.** `constructor(repo: IUserRepository)` has no runtime token. Use an abstract class, or `@Inject(Symbol)` with `{ provide, useClass }`.
2. **Singleton services.** Default scope is one instance for the process. Do not store request data on it.
3. **Forgetting `exports`.** The provider exists, but another module still cannot inject it.
4. **`synchronize: true`.** TypeORM will reshape the database on boot. Use migrations.
5. **Validation never runs.** Rules on the DTO do nothing until `ValidationPipe` is registered.
6. **Route params are strings.** `@Param('id') id: number` does not parse. Use `ParseIntPipe` or convert in the service.
7. **Prisma client is stale.** After a schema edit, run `npx prisma generate` or the TypeScript types lie.
8. **Import paths in this repo end in `.js`.** TypeScript compiles `.ts` files, but ESM resolution points at the emitted `.js` file. Match the style already used in `src/`.
9. **`useClass` where you wanted an alias.** `useClass` constructs a new instance. `useExisting` reuses the provider already registered under that token.
10. **`forRoot` in every feature.** That opens a second client. Call `forRoot` or `forRootAsync` once from `AppModule`. Use `forFeature` for the local pieces.
11. **Shutdown hooks left off.** `onModuleDestroy` does not run on SIGTERM until `main.ts` calls `app.enableShutdownHooks()`. `$disconnect` is skipped and the pool stays open on the database.
12. **Guard order.** `JwtAuthGuard` must run before `RolesGuard`. The role check reads `req.user`, which the JWT guard sets.
13. **Password in the response.** Store a bcrypt hash, compare with `bcrypt.compare`, and return `UserResponseDto` (`OmitType` without `password`). A JWT payload is readable by anyone holding the token.
14. **`this.prisma` inside `$transaction`.** Writes that must roll back together go through the `tx` argument. The outer client starts its own transaction.
15. **Request data on a logger field.** `Logger` is a singleton. Pass the method, the id, and the duration into the log call. A field on the logger shows the previous request.
16. **Current user stored on a service.** A singleton field is shared by every request. Pass the user in from the controller, or use `nestjs-cls`. `Scope.REQUEST` is for a unit of work, not for the caller.
17. **Reading `req.user` in middleware.** Middleware runs before guards, so the JWT guard has not set `req.user` yet. Set `nestjs-cls` from an interceptor.

---

## What to learn next, in order

1. Modules, controllers, services, and constructor injection — you already have the seed in `src/`. Then tokens: an interface cannot be the DI key. **Interfaces, tokens, and custom providers** in section 3 ties that key to the four recipes.
2. Custom providers (`useClass`, `useValue`, `useFactory`, `useExisting`) and dynamic modules (`forRoot`, `forRootAsync`, `forFeature`).
3. Lifecycle hooks: `onModuleInit` to connect, `onModuleDestroy` to disconnect, and `enableShutdownHooks()` in `main.ts`.
4. DTOs + `ValidationPipe`, then `PartialType` / `PickType` / `OmitType`, and `NotFoundException` / `ConflictException` / `BadRequestException`.
5. Prisma: one model, one migration, one service method, then `$transaction` when two writes must commit or roll back together.
6. The auth flow: hash a password, `POST /auth/login`, JWT, `@Roles('admin')`, `@CurrentUser()`.
7. `Logger` in the service, and a logging interceptor for the request. Exception filters when one error mapping should cover many call sites.
8. Middleware as a class (`consumer.apply().forRoutes()`), and request context: pass the user in, or `nestjs-cls`.
9. One e2e test per important route.

When those are in place, continue in [MASTERING_NESTJS_ADVANCED.md](MASTERING_NESTJS_ADVANCED.md): the host setup from `Program.cs`, security defaults, lists and query shape, production migrations, OpenAPI, outbound HTTP, cache, health checks, background work, and tests that replace a provider.

Official reference: [https://docs.nestjs.com](https://docs.nestjs.com). Prisma reference: [https://www.prisma.io/docs](https://www.prisma.io/docs).
