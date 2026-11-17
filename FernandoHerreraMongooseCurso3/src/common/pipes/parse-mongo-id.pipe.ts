// A pipe runs on one argument before the controller method is called.
// This pipe protects DELETE /api/v2/pokemon/:id.
// If :id is not a MongoDB ObjectId (24 hex characters), the request
// ends here with HTTP 400 and PokemonService.remove is never called.

import { ArgumentMetadata, Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

// @Injectable() lets Nest construct this class. PipeTransform is the
// interface every pipe implements: one transform() method.
@Injectable()
export class ParseMongoIdPipe implements PipeTransform {


  // value is the raw :id string from the URL.
  // metadata describes where it came from (param, query, or body) and its name.
  // The interface requires the second parameter even though we only use value.
  transform(value: string, metadata: ArgumentMetadata) {
    // console.log({ value, metadata });

    if ( !isValidObjectId(value) ) {
      throw new BadRequestException(`${ value } is not a valid MongoID`);
    }

    // The controller receives whatever transform returns.
    // Here the id is already a string, so we pass it through unchanged.
    return value;
  }


}
