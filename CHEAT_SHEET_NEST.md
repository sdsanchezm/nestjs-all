# NestJS — Quick Reference Guide

## 1. Nest CLI and Controllers

### Installing the NestJS CLI

```
npm i -g @nestjs/cli
```

### Creating a New Project

In the current directory:

```
nest new project-name
```

### Useful CLI Commands

```
nest generate <command>
nest g <command>
```

Display help:

```
nest -h
nest g -h
nest g s name -h
```

Add `-h` to components to view additional options.

### Common Components

| Action                     | Command                  |
| -------------------------- | ------------------------ |
| Create a class             | `nest g cl <path/name>`  |
| Create a controller        | `nest g co <path/name>`  |
| Create a decorator         | `nest g d <path/name>`   |
| Create a guard             | `nest g gu <path/name>`  |
| Create an interceptor      | `nest g in <path/name>`  |
| Create a module            | `nest g mo <path/name>`  |
| Create a pipe              | `nest g pi <path/name>`  |
| Create a service           | `nest g s <path/name>`   |
| Create a complete resource | `nest g resource <name>` |

### Useful Additional Flags

```
# Preview what the command will do
nest g s name --dry-run
# Alternative: -d

# Do not automatically generate the test file
nest g s name --no-spec
```

## 2. HTTP Methods and Request Data

### Common HTTP Methods

```
import {
  Get,
  Post,
  Put,
  Patch,
  Delete,
} from '@nestjs/common';
```

### HTTP Method Arguments

These apply to any HTTP method.

```
// Default route
@Get()

// Dynamic segment
@Get(':id')

// Specific route
@Get('cats/breed')
@Get(['cats', 'breed'])

// Dynamic segments
@Get(':product/:size')
```

### Extracting Request Information

| Information                 | Decorator      |
| --------------------------- | -------------- |
| Parameters / route segments | `@Param('id')` |
| Request body                | `@Body()`      |
| Query parameters            | `@Query()`     |
| Express/Fastify response    | `@Res()`       |

### Converting a Route Parameter to an Integer

```
@Get(':id')
async findOne(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.catsService.findOne(id);
}
```

### Built-in Pipes

- `ValidationPipe`
- `ParseBoolPipe`
- `ParseFloatPipe`
- `ParseIntPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`

## 3. Validation and Module Structure

### Useful External Libraries

```
npm i class-validator class-transformer
```

### Some Class Validator Decorators

- `IsOptional`
- `IsArray`
- `IsDecimal`
- `IsBoolean`
- `IsPositive`
- `IsString`
- `IsDate`
- `IsEmail`
- `IsMongoId`
- `IsUUID`
- `IsDateString`
- `IsUrl`

### Global Pipe Configuration

```
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```

- `whitelist`: Removes properties that are not included in the DTOs.
- `forbidNonWhitelisted`: Returns a `Bad Request` response if the object contains properties that are not allowed.

### Recommended Module Structure

```
src/
└── common/
    ├── decorators/
    ├── dtos/
    ├── filters/
    ├── guards/
    ├── interceptors/
    ├── middleware/
    ├── pipes/
    ├── common.controller.ts
    ├── common.module.ts
    └── common.service.ts
```

### Global Configurations

Configurations that do not require the `execution context`:

```
const app = await NestFactory.create(AppModule);

app.useGlobalFilters(new Filter1(), ...);
app.useGlobalGuards(new Guard1(), ...);
app.useGlobalInterceptors(new Inter1(), ...);
app.useGlobalPipes(new Pipe1(), ...);
```

## 4. NestJS Building Blocks

### Guards

Used to allow or prevent access to a route.

Example: This is where a request should be authorized.

### Interceptors

- **Before Interceptor:** Intercepts the request and can completely transform it according to specific requirements.
- Examples: Caching or logging.
- **After Interceptor:** Intercepts the response that the controller is about to send and can completely transform it according to specific requirements.
- Examples: Standardizing responses, adding additional information, or caching the response.

### Pipes

Transform data received in requests to ensure a specific type, value, or object instance.

Examples: Converting values to numbers and performing validations.

### Controllers

Manage routes; they listen for incoming requests and return responses.

Example: CRUD routes.

### Decorators

Can be applied at any level. They extend the functionality of the method, property, or class to which they are attached. NestJS strongly promotes the DRY principle through decorators.

Examples:

```
@Controller('users')
@Ip()
@CustomDecorator()
```

### Services

Contain business logic so that it can be reused through dependency injection.

Example: `MoviesService`, responsible for retrieving, saving, updating, or deleting movie information.

### Exception Filters

Handle code errors and convert them into HTTP response messages. NestJS already includes common use cases, but these can be extended according to specific requirements.

Exceptions mentioned:

- `BadRequestException`
- `NotFoundException`
- `RequestTimeoutException`
- `PayloadTooLargeException`
- `UnauthorizedException`
- `ForbiddenException`
- `GoneException`
- `InternalServerErrorException`

## 5. Modules, Middlewares, and Lifecycle

### Module

Group and decouple a set of features specific to a particular domain.

Example: `auth.module.ts`, responsible for everything related to authentication.

### Middlewares

Modify or enhance request and response objects (`request` / `response`). They can terminate the execution cycle, but they do not have access to the route handler's result.

### Lifecycle

In general, these are the traditional execution steps, although decorators can participate at each stage:

1. Middlewares
2. Guards
3. Before Interceptor
4. Pipes
5. Controllers and decorators
6. After Interceptor (the same interceptor)
7. Exception Filters (when an exception occurs)

Simplified representation:

```
Request
  |
  v
Middlewares
  |
  v
Guards
  |
  v
Before Interceptor
  |
  v
Pipes
  |
  v
Controllers
  |
  v
After Interceptor
  |
  v
Response

Exception Filters: Handle exceptions during the lifecycle.
```

## 6. Additional Configurations

### Enabling CORS

```
const app = await NestFactory.create(AppModule);

app.enableCors();
app.enableCors(options);
```

For WebSockets:

```
@WebSocketGateway({ cors: true }) // Socket
```

### Cookies

First, install the required dependencies:

```
npm i cookie-parser
npm i -D @types/cookie-parser
```

Configuration:

```
import * as cookieParser from 'cookie-parser';

const app = await NestFactory.create(AppModule);
app.use(cookieParser());
```

### Environment Variables: `.env` Files

Create the `.env` file in the project's root directory.

Install:

```
npm i @nestjs/config
```

In `app.module.ts`:

```
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

Accessing `.env` variables through dependency injection:

```
constructor(
  private readonly configService: ConfigService,
) {}
```

### Serving Static Content

Create a `public` directory and install:

```
npm i @nestjs/serve-static
```

Module configuration:

```
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
})
export class AppModule {}
```

## Documentation

- [Official NestJS Documentation](https://docs.nestjs.com/)

Add complete runnable examplesAdd missing imports to code samples