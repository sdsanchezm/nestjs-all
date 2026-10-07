# Mastering NestJS — Advanced

The next layer after [MASTERING_NESTJS.md](MASTERING_NESTJS.md), for when the API is no longer a sample.
Same audience: C# / ASP.NET Core / Entity Framework. Same app: NestJS 12, ESM imports that end in `.js`, Prisma as the database client.

Read the first guide before this one. Each section here is one idea, the .NET name for it, and one small example.

## Contents

- [Concept map](#concept-map)
- [1. Global prefix, versioning, and CORS](#1-global-prefix-versioning-and-cors)
- [2. Security defaults](#2-security-defaults)
- [3. Do not return entities](#3-do-not-return-entities)
- [4. List endpoints](#4-list-endpoints)
- [5. Query shape](#5-query-shape)
- [6. Production migrations](#6-production-migrations)
- [7. OpenAPI setup](#7-openapi-setup)
- [8. Outbound HTTP](#8-outbound-http)
- [9. Cache](#9-cache)
- [10. Health checks](#10-health-checks)
- [11. Background work](#11-background-work)
- [12. Tests that substitute DI](#12-tests-that-substitute-di)
- [Leave these until you build one](#leave-these-until-you-build-one)
- [Traps that waste a day](#traps-that-waste-a-day)

---

## Concept map

| NestJS | ASP.NET Core / EF | What it does |
|---|---|---|
| `setGlobalPrefix` / `enableVersioning` / `enableCors` | Path base, API versioning, `UseCors` in `Program.cs` | Where the API lives, and who may call it |
| Helmet + Throttler + env schema | Security headers, rate limiting, `ValidateOnStart` | Fail closed before the first request |
| Response DTO + `@Exclude()` | A response model + `[JsonIgnore]` | The password hash never leaves the process |
| `skip` / `take` | `Skip` / `Take` | One page of a list |
| `select` / `include` | `Select` / `Include` | Which columns and which relations |
| `prisma migrate deploy` | `dotnet ef database update` in CI | Apply committed migrations, no prompts |
| `DocumentBuilder` + `SwaggerModule.setup` | Swashbuckle `AddSwaggerGen` + `UseSwaggerUI` | The docs site, not only the attributes |
| `HttpModule` / `HttpService` | `IHttpClientFactory` | Outbound HTTP with a shared pool |
| `CacheModule` | `IMemoryCache` / `IDistributedCache` | Remember a value for a short time |
| `@nestjs/terminus` | `AddHealthChecks()` | A URL a platform can probe |
| `@nestjs/bullmq` | Hangfire | Work that runs outside the request |
| `@Cron()` | A timer inside the process | A small in-process job |
| `overrideProvider` | Replace a service in `WebApplicationFactory` | A test supplies a fake |

WebSockets, GraphQL, and microservices stay in the decorator catalog of the first guide until you build one. `@nestjs/cqrs` is MediatR. Add it only when one service file is doing too many jobs.

---

## 1. Global prefix, versioning, and CORS

`Program.cs` decides the path base, the version scheme, and which browsers may call the API. In Nest those three calls live in `main.ts`, after `NestFactory.create` and before `listen`.

- `setGlobalPrefix('api')` puts `/api` in front of every controller. `/users` becomes `/api/users`.
- `enableVersioning` adds a version the way API versioning does. `VersioningType.URI` makes the path `/api/v1/users`.
- `enableCors` is `UseCors`. Pass the origins you trust.

```ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api');
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
app.enableCors({
  origin: ['https://app.example.com'],
  credentials: true,
});
app.enableShutdownHooks();
await app.listen(process.env.PORT ?? 3000);
```

`defaultVersion: '1'` means a controller with no `@Version()` still answers on `/api/v1/...`. A new behavior gets its own version on the method, and the old one stays:

```ts
@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return this.users.list();
  }

  @Version('2')
  @Get()
  findAllV2() {
    return this.users.listV2();
  }
}
```

`/api/v1/users` hits `findAll`. `/api/v2/users` hits `findAllV2`.

A host constraint is the other `Program.cs` route decision. It lives on the controller, not in `main.ts`:

```ts
@Controller({ path: 'users', host: ':account.example.com' })
export class AccountUsersController {}
```

`:account` is the tenant label in the host, the same job as a host pattern in endpoint routing.

Call `enableCors` with a list. An open origin plus `credentials: true` is rejected by browsers, and it is the wrong default. A health probe that must ignore versions uses `version: VERSION_NEUTRAL` on that controller, so the path stays `/api/health`.

---

## 2. Security defaults

Turn these on before the first real caller. Each one fails closed: a bad request is rejected, and a missing setting stops the process during startup instead of failing on the first query.

**Helmet** sets the safe HTTP headers (`X-Content-Type-Options`, and the rest). It is middleware, the same `app.use` as in the first guide:

```ts
app.use(helmet());
```

**Rate limiting** is `@nestjs/throttler`. One hundred calls per minute from one client, then `429`. Registering `ThrottlerGuard` as `APP_GUARD` applies it to every route, the way a global authorization filter applies to every action.

```ts
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

`ttl` is milliseconds. `@SkipThrottle()` on the health controller keeps the platform probe from consuming the budget.

**Env validation** is `ValidateOnStart` on the options object. The process must refuse to boot when `DATABASE_URL` is missing. Zod parses `process.env` inside `ConfigModule.forRoot`. A failed parse throws, Nest stops, and `listen` never runs.

```ts
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
});

ConfigModule.forRoot({
  isGlobal: true,
  validate: (config) => {
    const parsed = envSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }
    return parsed.data;
  },
});
```

Joi does the same job if you already use it. `validationSchema` is the built-in hook:

```ts
ConfigModule.forRoot({
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().min(16).required(),
  }),
});
```

Pick one library. The requirement is the failure at startup, not the brand of the parser.

Install `helmet`, `@nestjs/throttler`, and `zod` (or `joi`).

---

## 3. Do not return entities

A Prisma row is the table. The table holds `passwordHash`. The HTTP response is a different type, the way a response model is not the EF entity.

The first guide builds that type with `OmitType` and returns `UserResponseDto`. Keep doing that. This section is the second lock: if a class instance still has the hash, strip it on the way out.

`@Exclude()` is `[JsonIgnore]`. `ClassSerializerInterceptor` is the formatter that honors it. It only sees class instances. A plain object from `prisma.user.findUnique` has no decorators at runtime, so the interceptor leaves `passwordHash` on it. Map to an instance first, or keep returning the response DTO by hand.

```ts
export class UserResponse {
  id: number;
  email: string;

  @Exclude()
  passwordHash: string;
}
```

```ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

```ts
async findOne(id: number): Promise<UserResponse> {
  const row = await this.prisma.user.findUnique({ where: { id } });
  if (!row) throw new NotFoundException('User not found');
  return plainToInstance(UserResponse, row);
}
```

`plainToInstance` copies the row onto `UserResponse`. The interceptor then drops `passwordHash`. Returning `{ id: row.id, email: row.email }` from a `UserResponseDto` does the same job without the interceptor. Use the DTO when you want the shape to be obvious in the method. Use `@Exclude()` when the class you return still carries the column and you want a safety net.

`@Expose()` plus `excludeExtraneousValues: true` on the interceptor is the stricter form: only listed fields are sent. Prefer that on a class that has more columns than the client should see.

---

## 4. List endpoints

A list route takes a page, a page size, a filter, and a sort. Prisma's `skip` and `take` are EF's `Skip` and `Take`.

Query values arrive as strings. `@Type(() => Number)` from `class-transformer` turns `page` into a number before `@IsInt()` runs. The first guide's `ValidationPipe` must have `transform: true` for that to happen.

```ts
export class ListUsersQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  email?: string;

  @IsIn(['email', 'createdAt'])
  sort: 'email' | 'createdAt' = 'createdAt';

  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'asc';
}
```

`@Max(100)` is the cap. Without it a caller can ask for every row in one response.

```ts
@Get()
list(@Query() query: ListUsersQuery) {
  return this.users.list(query);
}
```

```ts
async list(query: ListUsersQuery) {
  const skip = (query.page - 1) * query.pageSize;
  const where = query.email
    ? { email: { contains: query.email, mode: 'insensitive' as const } }
    : undefined;

  const [items, total] = await this.prisma.$transaction([
    this.prisma.user.findMany({
      where,
      orderBy: { [query.sort]: query.order },
      skip,
      take: query.pageSize,
      select: { id: true, email: true },
    }),
    this.prisma.user.count({ where }),
  ]);

  return { items, page: query.page, pageSize: query.pageSize, total };
}
```

Page 1 with size 20 skips 0 rows and takes 20. The `@IsIn` list is the allow-list for `orderBy`. A free-form sort string is a column name the client invented.

`count` is a second query, so the caller can build a pager. The two queries share a `$transaction` array so they see one consistent moment. The `select` drops `passwordHash` even if someone later adds the column to the model.

---

## 5. Query shape

`select` is EF `Select`: only these columns. `include` is EF `Include`: also load this relation. At one level of a Prisma query you use one of them, not both.

```ts
this.prisma.user.findMany({
  select: { id: true, email: true },
});

this.prisma.user.findMany({
  include: { posts: true },
});
```

The first query never reads `passwordHash`. The second loads each user's posts in one extra query, not one query per user.

The N+1 trap is a loop that queries inside itself:

```ts
const users = await this.prisma.user.findMany();
for (const user of users) {
  user.posts = await this.prisma.post.findMany({ where: { userId: user.id } });
}
```

Ten users become eleven round trips: one for the users, then one per user. `include: { posts: true }` is two round trips no matter how many users came back: the users, then the posts for those ids. Filter the relation in the same place when you do not want every post:

```ts
include: { posts: { where: { published: true }, select: { id: true, title: true } } }
```

That is `Include` plus a filtered `Select` on the related set.

---

## 6. Production migrations

`prisma migrate dev` is the local command. It can create a new migration and it will ask questions. CI and production run `prisma migrate deploy`, which only applies migrations that are already committed. That is `dotnet ef database update` against the migrations folder, not `migrations add`.

```bash
npx prisma migrate deploy
npx prisma db seed
```

Order in the pipeline: database is up, `migrate deploy` runs, seed runs, then the app starts. The app does not migrate itself on boot.

A seed inserts the reference rows (an admin, a set of roles). Make it safe to run twice, or the second deploy fails on a unique email. `upsert` is that:

```ts
const prisma = new PrismaClient();

await prisma.user.upsert({
  where: { email: 'admin@example.com' },
  update: {},
  create: { email: 'admin@example.com', passwordHash: 'replace-with-a-hash' },
});

await prisma.$disconnect();
```

Point Prisma at the script in `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

`migrate dev` stays on your machine. `migrate deploy` is the command the pipeline runs.

---

## 7. OpenAPI setup

The `@Api*` decorators in the first guide's catalog are the Swashbuckle attributes. They do nothing until the app builds a document and mounts the UI. That setup is `AddSwaggerGen` plus `UseSwaggerUI`, and it lives in `main.ts`.

```ts
const config = new DocumentBuilder()
  .setTitle('Users API')
  .setDescription('The users HTTP API')
  .setVersion('1')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

Open `/docs`. `addBearerAuth()` draws the lock. A route still needs `@ApiBearerAuth()` from the catalog if that one operation requires the token. DTO fields show up when the class uses `@ApiProperty()`, or when you import `PartialType` and its siblings from `@nestjs/swagger` so the schema and the validation class stay in step.

`SwaggerModule.setup` mounts on the HTTP adapter beside your controllers. The path `docs` is `/docs`, not `/api/v1/docs`, unless you pass `{ useGlobalPrefix: true }`. Leaving it beside the prefix makes the UI easy to open.

Mount the UI in local and test. In production, leave it off or put it behind the same auth as the API. The document describes every route, including the ones a stranger should not browse.

Install `@nestjs/swagger`.

---

## 8. Outbound HTTP

`HttpModule` is `IHttpClientFactory`. You do not `new` a client per call. The module owns the connection pool, the timeout, and the redirect limit. `HttpService` is the client you inject, and it is a singleton. That is the correct lifetime.

```ts
@Module({
  imports: [
    HttpModule.register({
      timeout: 5_000,
      maxRedirects: 2,
    }),
  ],
})
export class NotifyModule {}
```

`HttpService` returns an Observable, not a Promise. A cold Observable does nothing until something subscribes. `firstValueFrom` is the `await`.

```ts
@Injectable()
export class NotifyClient {
  constructor(private readonly http: HttpService) {}

  status() {
    return firstValueFrom(
      this.http.get<{ ok: boolean }>('https://example.com/status'),
    );
  }
}
```

`firstValueFrom` comes from `rxjs`, which Nest already depends on. The value you await is the Axios response. The body is `response.data`.

A named client in .NET is a second `HttpModule.registerAsync` in the feature that needs a different base URL and timeout. The call site still injects `HttpService`. It does not build URLs from unsanitized input and send them out: a caller-supplied URL is server-side request forgery.

Install `@nestjs/axios`.

---

## 9. Cache

`CacheModule` with the default store is `IMemoryCache`: one process, gone on restart. The same injection token pointed at Redis is `IDistributedCache`: every instance sees the same entries.

Use it for a read that is expensive and acceptable to be a few seconds old. Do not use it as the source of truth for a write.

```ts
CacheModule.register({ isGlobal: true, ttl: 10_000 })
```

`ttl` here is milliseconds. Ten seconds.

```ts
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findOne(id: number) {
    const key = `user:${id}`;
    const hit = await this.cache.get<UserResponse>(key);
    if (hit) return hit;

    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('User not found');
    const user = { id: row.id, email: row.email };
    await this.cache.set(key, user, 10_000);
    return user;
  }
}
```

Cache the response shape, not the Prisma row. The row still has `passwordHash`. After an update, `cache.del('user:' + id)` or the next reader sees the old email until the ttl ends.

`CACHE_MANAGER` is a string token. `@Inject` is required. The interface `Cache` is only the TypeScript type.

A second API process has its own memory. When that matters, register a Redis store in `CacheModule.registerAsync` and keep this service unchanged. The calls stay `get` and `set`.

Install `@nestjs/cache-manager` and `cache-manager`.

---

## 10. Health checks

`@nestjs/terminus` is `AddHealthChecks()` plus `MapHealthChecks("/health")`. The platform calls one URL. A 200 means the process can do its job. A 503 means it should not receive traffic.

The database check is a query, not a TCP guess. Prisma has no built-in indicator. A thin class runs `SELECT 1`.

```ts
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (err) {
      throw new HealthCheckError('database', this.getStatus(key, false));
    }
  }
}

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @SkipThrottle()
  check() {
    return this.health.check([() => this.db.isHealthy('database')]);
  }
}
```

`VERSION_NEUTRAL` keeps the path at `/api/health` when URI versioning is on. `@SkipThrottle()` keeps the probe off the rate limit. Do not put `JwtAuthGuard` on this controller. A probe has no user.

`TerminusModule` must be in the module `imports`, and both the indicator and the controller must be registered. The body on success names each check. On failure the status is 503 and the failed check is listed.

Install `@nestjs/terminus`.

---

## 11. Background work

Two kinds of "later":

- `@Cron()` runs a method on a schedule **inside this process**. It is a timer. There is no queue and no retry.
- `@nestjs/bullmq` is Hangfire. A request enqueues a job. A worker process runs it, retries it, and survives a restart. The broker is Redis.

Use `@Cron()` when the app runs as one instance and the job is small and safe to skip or repeat: a nightly cleanup you can stand to run twice. `ScheduleModule.forRoot()` once, then:

```ts
@Injectable()
export class DigestJob {
  @Cron('0 7 * * *')
  run() {
    return this.reports.buildDailyDigest();
  }
}
```

`'0 7 * * *'` is 07:00 UTC every day. Two replicas both fire at 07:00. If the job must run once, do not use `@Cron()`.

Use BullMQ when the work is "send this mail" or "resize this image": it must happen once, it can fail, and it should retry.

```ts
BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } })
BullModule.registerQueue({ name: 'mail' })
```

```ts
@Injectable()
export class MailProducer {
  constructor(@InjectQueue('mail') private readonly queue: Queue) {}

  welcome(userId: number) {
    return this.queue.add('welcome', { userId }, { attempts: 3 });
  }
}

@Processor('mail')
export class MailProcessor extends WorkerHost {
  async process(job: Job<{ userId: number }>) {
    await this.mailer.sendWelcome(job.data.userId);
  }
}
```

The controller calls `welcome` and returns. The HTTP request does not wait for the mail server. `attempts: 3` is the retry. The processor is a provider in the same module. `@InjectQueue('mail')` is a custom token from `registerQueue`, the same `provide` / `@Inject` pair as in the first guide.

`@Cron()` stays a one-liner until you need a queue. Reach for BullMQ when a second instance, a retry, or a crash in the middle of the work would lose or double the job.

Install `@nestjs/schedule` for cron. Install `@nestjs/bullmq` and `bullmq` for the queue, and run Redis.

---

## 12. Tests that substitute DI

`overrideProvider` replaces a registration in the test host. That is `WebApplicationFactory` swapping a service before the host is built. The token you override is the token the class injects. If production registers `UserRepository` with `useClass`, the test overrides `UserRepository`, not some other name.

**Unit test.** The service and a fake Prisma. No HTTP.

```ts
const moduleRef = await Test.createTestingModule({
  providers: [UsersService, PrismaService],
})
  .overrideProvider(PrismaService)
  .useValue({
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: 1, email: 'a@b.co' }]),
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  })
  .compile();

const users = moduleRef.get(UsersService);
const page = await users.list({ page: 1, pageSize: 20, sort: 'email', order: 'asc' });
expect(page.total).toBe(1);
```

`useValue` is the fake from the custom-provider section. `vi.fn()` is Vitest, which this repo already uses.

**E2E test.** One real route through the real pipe and prefix. The database is still a fake, so the test does not need Postgres.

The prefix, versioning, and `ValidationPipe` live in `main.ts`. A test that only calls `createNestApplication()` skips them, and the path under test is not the path production serves. Put the host setup in one function and call it from both places.

```ts
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
```

```ts
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(PrismaService)
  .useValue({
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: 1, email: 'a@b.co' }]),
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  })
  .compile();

const app = moduleRef.createNestApplication();
configureApp(app);
await app.init();

const res = await request(app.getHttpServer())
  .get('/api/v1/users')
  .query({ page: 1, pageSize: 20 })
  .expect(200);

expect(res.body.total).toBe(1);
await app.close();
```

`request` is Supertest. `.expect(200)` fails the test on any other status. Keep these tests few: one per important route. Keep the service tests many.

`app.close()` runs the shutdown hooks, including Prisma's `$disconnect` when the real client is in the graph. The fake should tolerate that call or omit the hook in this module.

---

## Leave these until you build one

WebSockets, GraphQL, and microservices are already catalog entries in the first guide. They replace the HTTP controller for a different transport. Adding them here would be a second framework in the middle of learning this one. Open that catalog section when a feature needs a socket, a schema, or a message broker.

`@nestjs/cqrs` is MediatR: a command or a query, a handler, and a bus. A `UsersService` method is the handler until that class is doing several jobs and the file is hard to follow. Split into handlers at that point, not before.

---

## Traps that waste a day

1. **`pageSize` with no cap.** `take` follows the query. `@Max(100)` or you ship the whole table.
2. **A query inside a loop.** That is the N+1. `include` the relation, or `select` it.
3. **`migrate dev` in CI.** It is interactive and it can create migrations. CI runs `migrate deploy`.
4. **A Prisma row as the response.** `passwordHash` is on it. Return a response DTO, or `plainToInstance` a class that `@Exclude()`s the hash. The interceptor does not decorate plain objects by itself.
5. **`this.http.get(...)` without `firstValueFrom`.** The Observable never runs. No request is sent.
6. **`@Cron()` on two replicas.** Both fire. Use BullMQ when the job must run once.
7. **An e2e test that skips `configureApp`.** The test calls `/users` and production serves `/api/v1/users`.
8. **Swagger UI in production with no gate.** The document lists every route. Mount it where you mount other internal tools.
9. **Caching the entity.** The cached value is what you will return later. Cache `{ id, email }`, and delete the key when the row changes.
