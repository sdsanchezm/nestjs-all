import { Module } from '@nestjs/common';

/**
 * Shared module.
 *
 * A module with empty metadata is still a valid module. Nest loads it because
 * `AppModule` imports it. Shared building blocks live in this folder so
 * feature modules can depend on one place later.
 *
 * `ParseMongoIdPipe` is used directly on a route parameter
 * (`@Param('id', ParseMongoIdPipe)`). Nest constructs that pipe itself.
 * The pipe has no constructor dependencies, so it does not need to be listed
 * in `providers` for that usage to work.
 */
@Module({})
export class CommonModule {}
