import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

/**
 * Pipe that accepts only a MongoDB ObjectId string.
 *
 * A pipe is a small class that runs on one handler argument before the
 * controller method does. It may transform the value or reject the request.
 *
 * `@Injectable()` lets Nest construct the class through dependency injection.
 * This pipe asks for nothing in its constructor, so Nest can create it from
 * the class reference on `@Param`.
 *
 * `PipeTransform<string, string>` documents the contract: the incoming value
 * is a string (a route param) and the returned value is a string too.
 * This pipe checks the value and passes the same string through.
 */
@Injectable()
export class ParseMongoIdPipe implements PipeTransform<string, string> {
  /**
   * `value` is the raw route parameter.
   * `metadata` describes where it came from:
   * - `type`: `'param' | 'body' | 'query' | 'custom'`
   * - `metatype`: the TypeScript type, here `String`
   * - `data`: the name written in the decorator, here `'id'`
   *
   * `isValidObjectId` checks the shape (a 24-character hex string, or another
   * form Mongoose accepts). It does not query the database. A well-formed id
   * can still point at a missing document; `PokemonService.remove` handles that.
   *
   * Throwing `BadRequestException` stops the request and Nest responds with 400.
   * The controller method is not called.
   */
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isValidObjectId(value)) {
      throw new BadRequestException(
        `${value} is not a valid MongoID (${metadata.type}: ${String(metadata.data)})`,
      );
    }

    return value;
  }
}
