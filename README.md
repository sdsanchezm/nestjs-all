# NestJS setup

Step-by-step notes for creating a NestJS app with the official CLI. This guide uses the ESM starter, which ships with Vitest.

## Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Install the Nest CLI](#2-install-the-nest-cli)
- [3. Create a project](#3-create-a-project)
  - [3.1 Run the generator](#31-run-the-generator)
  - [3.2 Choose ESM so the project uses Vitest](#32-choose-esm-so-the-project-uses-vitest)
  - [3.3 Wait for install](#33-wait-for-install)
  - [3.4 Enter the project](#34-enter-the-project)
  - [3.5 Start it](#35-start-it)
  - [Other flags](#other-flags)
- [4. What the starter creates](#4-what-the-starter-creates)
- [5. Packages](#5-packages)
  - [Runtime dependencies](#runtime-dependencies)
  - [Dev dependencies](#dev-dependencies)
- [6. Commands](#6-commands)
  - [Run the app](#run-the-app)
  - [Build, format, lint](#build-format-lint)
  - [Tests](#tests)
  - [CLI info](#cli-info)
- [7. Generate files](#7-generate-files)
  - [Available schematics](#available-schematics)
  - [Examples](#examples)
- [8. How a request is wired](#8-how-a-request-is-wired)
  - [Minimal example](#minimal-example)
  - [Running with environment variables](#running-with-environment-variables)
- [9. Packages added after the starter](#9-packages-added-after-the-starter)
  - [Config (`.env` files)](#config-env-files)
  - [Input validation](#input-validation)
  - [OpenAPI / Swagger docs](#openapi--swagger-docs)
  - [Database with TypeORM](#database-with-typeorm)
  - [Database with Mongoose (MongoDB)](#database-with-mongoose-mongodb)
  - [Authentication & JWT](#authentication--jwt)
  - [Logging](#logging)
- [10. First run checklist](#10-first-run-checklist)
- [11. Best practices](#11-best-practices)
  - [File organization](#file-organization)
  - [Use feature modules](#use-feature-modules)
  - [Type safety](#type-safety)
  - [Testing](#testing)
  - [Environment variables](#environment-variables)
  - [Error handling](#error-handling)
  - [API documentation](#api-documentation)

## 1. Prerequisites

- Node.js 20.11 or newer (22 recommended). The Nest CLI requires `>= 20.11`.
- npm 10+, yarn 4+, pnpm 9+, or bun

Check the versions:

```bash
node -v
npm -v
```

## 2. Install the Nest CLI

Global install (available as the `nest` command in any folder):

```bash
npm install -g @nestjs/cli
```

Check it:

```bash
nest --version
```

Without a global install, every command below can be run with `npx`:

```bash
npx @nestjs/cli new my-app --package-manager npm --no-observe
```

## 3. Create a project

Work from the folder where the app should live. The generator asks a few questions, installs dependencies, and initializes git.

### 3.1 Run the generator

```bash
nest new my-app --package-manager npm --no-observe
```

What those flags do:

- `--package-manager npm` skips the package-manager question. `yarn`, `pnpm`, and `bun` are the other choices.
- `--no-observe` skips the optional `@nestjs/observe` question so the starter stays minimal.

If you omit the flags, the CLI asks:

1. Which package manager would you like to use? (`npm`, `yarn`, `pnpm`, or `bun`)
2. Would you like to set up `@nestjs/observe`? Answer **No** for the starter described in this guide.

### 3.2 Choose ESM so the project uses Vitest

The schematic then asks which module system to use:

```text
Which module system would you like to use?
> ESM (ES Modules)         [ with vitest ]
  CJS (CommonJS)           [ with jest ]
```

Select **ESM (ES Modules) [ with vitest ]**. That option is the default. It writes `"type": "module"` in `package.json` and sets up Vitest.

The CJS option generates a Jest project. This guide follows the ESM + Vitest starter, so leave the highlight on ESM and confirm it.

### 3.3 Wait for install

The CLI installs dependencies and runs `git init` inside `my-app`. Pass `--skip-git` to skip the repository, or `--skip-install` to skip `npm install`.

### 3.4 Enter the project

```bash
cd my-app
```

If you skipped install:

```bash
cd my-app
npm install
```

### 3.5 Start it

```bash
npm run start:dev
```

Open `http://localhost:3000`. The response is `Hello World!`.

Stop the process with `Ctrl+C`.

### Other flags

```bash
nest new my-app --package-manager npm --no-observe
nest new my-app --skip-git
nest new my-app --skip-install
nest new my-app --skip-tests
nest new my-app --directory path/to/my-app
```

Strict TypeScript is on by default. `--skip-tests` omits `*.spec.ts` and the e2e spec. `--directory` sets the output folder (the default folder name is the project name).

## 4. What the starter creates

```text
my-app/
  src/
    main.ts                 # bootstrap: creates the app and listens on a port
    app.module.ts           # root module
    app.controller.ts       # routes
    app.controller.spec.ts  # unit test for the controller (Vitest)
    app.service.ts          # business logic
  test/
    app.e2e-spec.ts         # end-to-end test (Vitest + supertest)
  .oxlintrc.json            # oxlint config
  .gitignore
  .prettierrc               # Prettier config
  nest-cli.json             # Nest CLI config (source root, compiler)
  package.json              # "type": "module"
  package-lock.json
  tsconfig.json             # includes "types": ["vitest/globals", "node"]
  tsconfig.build.json
  vitest.config.ts          # unit tests (*.spec.ts)
  vitest.config.e2e.ts      # e2e tests (*.e2e-spec.ts)
```

`main.ts` calls `NestFactory.create(AppModule)` and `app.listen(3000)`. The default route is `GET /` and returns `Hello World!`.

The project is an ES module. Relative imports use the `.js` extension (`./app.module.js`). TypeScript resolves that to the `.ts` source file. `tsconfig.json` sets `"module": "nodenext"`.

## 5. Packages

`nest new` writes these into `package.json` and installs them. Versions follow the CLI release; do not pin them by hand unless you have a reason.

### Runtime dependencies

| Package | Role |
| --- | --- |
| `@nestjs/common` | Decorators and building blocks (`@Module`, `@Controller`, `@Injectable`, `@Get`) |
| `@nestjs/core` | Nest runtime and `NestFactory` |
| `@nestjs/platform-express` | HTTP adapter. Express is the default |
| `reflect-metadata` | Required so decorators can store metadata. Loaded by `@nestjs/core` |
| `rxjs` | Reactive streams used internally by Nest |

### Dev dependencies

| Package | Role |
| --- | --- |
| `@nestjs/cli` | `nest` commands (`build`, `start`, `generate`) |
| `@nestjs/schematics` | Templates used by `nest generate` |
| `@nestjs/testing` | Test utilities (`Test.createTestingModule`) |
| `@nestjs/mau` | Deploy helper used by `nest deploy` |
| `typescript` | Compiles `.ts` to `.js` (v6 in the current starter) |
| `vitest` | Test runner |
| `@vitest/coverage-v8` | V8 coverage reporter for `test:cov` |
| `vite-tsconfig-paths` | Resolves `tsconfig.json` path aliases inside Vitest |
| `supertest` | HTTP assertions in e2e tests |
| `@types/node` | Node.js types |
| `@types/express` | Express types |
| `@types/supertest` | Supertest types |
| `oxlint` | Linter (`npm run lint`) |
| `oxlint-tsgolint` | Type-aware rules used by oxlint |
| `prettier` | Code formatting |
| `source-map-support` | Source maps in stack traces |

Install a missing package later with npm. Runtime packages stay in `dependencies`. Tooling stays in `devDependencies`.

```bash
npm install @nestjs/config
npm install --save-dev @types/node
```

## 6. Commands

Scripts live in `package.json`. Run them with `npm run <script>`.

### Run the app

Development with hot-reload (recommended):

```bash
npm run start:dev
```

Watches files and restarts on changes. Default URL: `http://localhost:3000`.

One-shot start (no watch):

```bash
npm run start
```

Debug mode (inspector plus watch). Attach a debugger on port `9229`:

```bash
npm run start:debug
```

Production (build first, then run the compiled JavaScript):

```bash
npm run build
npm run start:prod
```

`start:prod` runs `node dist/main`. It does not compile. `npm run build` compiles `src` into `dist` using `tsconfig.build.json`.

### Build, format, lint

```bash
npm run build
npm run format
npm run lint
```

`lint` runs `oxlint --type-aware` on `src/` and `test/`.

### Tests

Vitest is the test runner. `describe`, `it`, `expect`, and `beforeEach` are globals (`"types": ["vitest/globals"]` in `tsconfig.json`), so spec files do not import them.

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
npm run test:debug
```

| Script | Command | What it runs |
| --- | --- | --- |
| `test` | `vitest run` | Unit tests, once (`vitest.config.ts`, `**/*.spec.ts`) |
| `test:watch` | `vitest` | Unit tests, rerun on save |
| `test:cov` | `vitest run --coverage` | Unit tests plus a V8 coverage report |
| `test:e2e` | `vitest run --config ./vitest.config.e2e.ts` | e2e tests (`**/*.e2e-spec.ts`) with supertest |
| `test:debug` | `vitest --inspect-brk --no-file-parallelism` | Unit tests with the Node inspector |

Unit config (`vitest.config.ts`):

```ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
```

E2e config (`vitest.config.e2e.ts`) is the same shape with `include: ['**/*.e2e-spec.ts']`.

### CLI info

```bash
nest info
```

Prints the Nest package versions and the Node/npm versions in this project.

## 7. Generate files

Run these from the project root. The CLI updates the module imports automatically. Generated files use `.js` on relative imports, matching the ESM starter.

### Available schematics

Use `nest generate <name> <arguments>` or its alias, `nest g <alias> <arguments>`. The descriptions below explain what each schematic creates; examples show a typical invocation.

| Name | Alias | Description |
| --- | --- | --- |
| `application` | `application` | Generate a new application workspace |
| `class` | `cl` | Generate a new class |
| `configuration` | `config` | Generate a CLI configuration file |
| `controller` | `co` | Generate a controller declaration |
| `decorator` | `d` | Generate a custom decorator |
| `filter` | `f` | Generate a filter declaration |
| `gateway` | `ga` | Generate a gateway declaration |
| `guard` | `gu` | Generate a guard declaration |
| `interceptor` | `itc` | Generate an interceptor declaration |
| `interface` | `itf` | Generate an interface |
| `library` | `lib` | Generate a new library within a monorepo |
| `middleware` | `mi` | Generate a middleware declaration |
| `module` | `mo` | Generate a module declaration |
| `pipe` | `pi` | Generate a pipe declaration |
| `provider` | `pr` | Generate a provider declaration |
| `resolver` | `r` | Generate a GraphQL resolver declaration |
| `resource` | `res` | Generate a new CRUD resource |
| `service` | `s` | Generate a service declaration |
| `sub-app` | `app` | Generate a new application within a monorepo |

### Schematics: Examples and Uses

Schematics generate files with a standard NestJS structure. Each example below shows the command and explains what the generated code is for.

- **Application:** creates a runnable Nest app in a monorepo. Use it when one repository needs multiple applications, such as an API and a background worker.
  - `nest generate application storefront`
- **Class:** creates a plain TypeScript class. Use it for a simple object or utility that does not need Nest dependency injection.
  - `nest g cl users/user`
- **Configuration:** creates the Nest CLI configuration file (`nest-cli.json`), which controls CLI and build settings. Most projects only need the file created during project setup.
  - `nest g config`
- **Controller:** creates a controller for the users feature. Controllers define routes and receive requests, then typically pass the work to a service.
  - `nest g co users`
- **Decorator:** creates a custom decorator. Use one to attach reusable metadata or behavior to a class, method, or parameter, such as the roles allowed to access a route.
  - `nest g d roles`
- **Filter:** creates an exception filter. Use it to catch exceptions and shape error responses consistently.
  - `nest g f http-exception`
- **Gateway:** creates a WebSocket gateway. Use it for real-time, two-way communication such as broadcasting notifications to connected clients.
  - `nest g ga notifications`
- **Guard:** creates a guard that allows or blocks a request before its handler runs. Guards are commonly used for authentication and permission checks.
  - `nest g gu auth`
- **Interceptor:** creates an interceptor that runs around a handler. Use it for shared behavior such as logging, timing, or transforming returned data.
  - `nest g itc logging`
- **Interface:** creates a TypeScript interface for describing the shape of a value. It helps the compiler check code, but it does not exist at runtime or validate incoming data by itself.
  - `nest g itf users/user`
- **Library:** creates a reusable library in a monorepo. Use it to share code between applications in the same workspace.
  - `nest g lib shared`
- **Middleware:** creates middleware that runs for a request before its route handler. Use it for general request processing, such as recording request details or adding data to the request.
  - `nest g mi logger`
- **Module:** creates a module that groups related controllers and providers. Use modules to organize features, such as users or payments, and connect them to the rest of the app.
  - `nest g mo users`
- **Pipe:** creates a pipe that transforms or validates values before they reach a handler. Pipes commonly validate request data or convert route parameters, such as an ID to a number.
  - `nest g pi validation`
- **Provider:** creates an injectable class. Use a provider for reusable dependencies that do not have a more specific role, such as a mail client.
  - `nest g pr mailer`
- **Resolver:** creates a GraphQL resolver for handling queries, mutations, or fields. It serves a role similar to an HTTP controller and requires Nest's GraphQL integration.
  - `nest g r users`
- **Resource:** scaffolds a CRUD feature, typically including a module, controller or resolver, service, DTOs, and tests. The CLI asks for the transport type and whether to include CRUD endpoints; choose REST for a typical HTTP API.
  - `nest g res users`
- **Service:** creates an injectable service for feature logic, such as finding or creating users. Controllers and resolvers call services to perform that work.
  - `nest g s users`
- **Sub-app:** adds another application to an existing monorepo. Use it for a separately configured app; a module, by contrast, is a feature inside an application.
  - `nest g app admin`

For a typical HTTP feature, a **module** groups a **controller** and a **service**: the controller handles routes, and the service does the work. Add a **guard** to control access, a **pipe** to validate or convert input, an **interceptor** for behavior around the handler, and a **filter** to shape errors. Options can customize generated files; for example, `nest g co users/profile` places a controller in a subfolder, `nest g s users --no-spec` skips its unit test, and `nest g res posts --flat` generates a flat resource structure.


## 8. How a request is wired

1. `main.ts` bootstraps `AppModule` using `NestFactory.create()`.
2. `AppModule` declares controllers and providers in its `@Module()` decorator.
3. A controller method (decorated with `@Get()`, `@Post()`, etc.) handles the route.
4. The controller injects and calls a service. Nest injects it because it's in `providers` and marked `@Injectable()`.

### Minimal example

These match the ESM starter. Relative imports keep the `.js` extension.

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
await bootstrap();
```

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

```ts
// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

```ts
// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

### Running with environment variables

Set the port before starting:

```bash
# PowerShell
$env:PORT=3001; npm run start:dev

# Bash
PORT=3001 npm run start:dev
```

Or use a `.env` file with `@nestjs/config` (see section 9).

## 9. Packages added after the starter

Install only what the feature needs. Keep `package.json` lean.

### Config (`.env` files)

```bash
npm install @nestjs/config
```

In `app.module.ts`:

```ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  // ...
})
export class AppModule {}
```

In any service, inject `ConfigService`:

```ts
import { ConfigService } from '@nestjs/config';

constructor(private configService: ConfigService) {}

const dbUrl = this.configService.get('DATABASE_URL');
```

### Input validation

```bash
npm install class-validator class-transformer
```

In `main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';

const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```

DTO example:

```ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}
```

### OpenAPI / Swagger docs

```bash
npm install @nestjs/swagger
```

In `main.ts`:

```ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('My API')
  .setDescription('API description')
  .setVersion('1.0')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

Swagger UI runs at `http://localhost:3000/api`.

### Database with TypeORM

PostgreSQL:

```bash
npm install @nestjs/typeorm typeorm pg
```

MySQL:

```bash
npm install @nestjs/typeorm typeorm mysql2
```

In `app.module.ts`:

```ts
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'mydb',
      entities: [],
      synchronize: true, // false in production
    }),
  ],
})
export class AppModule {}
```

### Database with Mongoose (MongoDB)

```bash
npm install @nestjs/mongoose mongoose
```

In `app.module.ts`:

```ts
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/mydb')],
})
export class AppModule {}
```

### Authentication & JWT

```bash
npm install @nestjs/passport passport @nestjs/jwt passport-jwt
npm install --save-dev @types/passport-jwt
```

Create a JWT strategy:

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

### Logging

Use Nest's built-in `Logger`:

```ts
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Action completed');
    this.logger.error('Error occurred');
    this.logger.warn('Warning message');
  }
}
```

For advanced logging, add Winston:

```bash
npm install nest-winston winston
```

## 10. First run checklist

```bash
npm install -g @nestjs/cli
nest new my-app --package-manager npm --no-observe
```

At the module-system prompt, select **ESM (ES Modules) [ with vitest ]**.

```bash
cd my-app
npm run start:dev
```

Open `http://localhost:3000` in your browser. You should see `Hello World!`.

Stop the process with `Ctrl+C`, then run the tests:

```bash
npm run test
npm run test:e2e
```

## 11. Best practices

### File organization

```text
src/
  modules/
    users/
      controllers/
        users.controller.ts
      services/
        users.service.ts
      dtos/
        create-user.dto.ts
        update-user.dto.ts
      entities/
        user.entity.ts
      users.module.ts
  common/
    filters/
    guards/
    interceptors/
    pipes/
  config/
    config.ts
  main.ts
  app.module.ts
```

### Use feature modules

Group related functionality into feature modules. Keep the `.js` extension on relative imports.

```ts
// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller.js';
import { UsersService } from './services/users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export if used in other modules
})
export class UsersModule {}
```

### Type safety

The starter enables `strict` and turns off `strictPropertyInitialization` so Nest constructor injection does not need definite-assignment assertions.

```json
{
  "compilerOptions": {
    "strict": true,
    "strictPropertyInitialization": false,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Testing

Run tests with Vitest:

```bash
npm run test                # Unit tests
npm run test:watch          # Watch mode
npm run test:cov            # Coverage report
npm run test:e2e            # End-to-end tests
```

Example unit test. `describe` and `expect` come from Vitest globals.

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Environment variables

Use `.env` for local development:

```bash
# .env
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=your-secret-key
API_PORT=3000
NODE_ENV=development
```

The starter `.gitignore` already ignores `.env`, `.env.local`, `dist/`, and `node_modules/`.

### Error handling

Use NestJS exceptions:

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';

if (!user) {
  throw new NotFoundException('User not found');
}

if (!email) {
  throw new BadRequestException('Email is required');
}
```

### API documentation

Document endpoints with Swagger:

```ts
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll() {
    // ...
  }
}
```
