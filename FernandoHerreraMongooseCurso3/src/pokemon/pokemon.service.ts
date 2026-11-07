import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

/**
 * Fields this service reads from a MongoDB driver error.
 * Duplicate-key failures arrive as a normal thrown value with a numeric `code`.
 */
interface MongoErrorLike {
  code?: number;
  keyValue?: unknown;
}

/**
 * All Pokemon reads and writes.
 *
 * `@Injectable()` registers this class as a provider Nest can construct
 * and inject. `PokemonModule` lists it in `providers`, and the controller
 * receives the same shared instance (the default singleton scope).
 */
@Injectable()
export class PokemonService {
  /**
   * Logger bound to this class. `PokemonService.name` is the string
   * `"PokemonService"`, printed beside each line so the source is obvious.
   * Details of unexpected errors stay in this log. The HTTP response uses
   * a short message and does not echo the driver error.
   */
  private readonly logger = new Logger(PokemonService.name);

  /**
   * `@InjectModel(Pokemon.name)` asks Nest for the model registered in
   * `PokemonModule` with that same name. `Model<Pokemon>` is Mongoose's
   * typed collection handle: `find`, `create`, `deleteOne`, and the rest.
   */
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  /**
   * Inserts one Pokemon.
   *
   * The DTO is copied and the stored name is the normalized form. The
   * caller's object is left unchanged. The unique indexes on `name` and `no`
   * are what reject duplicates; that failure is handled below.
   *
   * `Model.create` validates against the schema and inserts in one step.
   * The return type `never` on `handleExceptions` tells TypeScript that the
   * `catch` path always throws, so this method's result is always a `Pokemon`.
   */
  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    const pokemonToStore = {
      ...createPokemonDto,
      name: this.nameForStorage(createPokemonDto.name),
    };

    try {
      return await this.pokemonModel.create(pokemonToStore);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Reads the whole `pokemons` collection.
   *
   * `find()` with no filter matches every document. The order is the order
   * MongoDB returns. `.exec()` turns the query into a Promise Nest can await
   * and serialize as a JSON array.
   */
  findAll() {
    return this.pokemonModel.find().exec();
  }

  /**
   * Loads one Pokemon by pokedex number, MongoDB id, or name.
   *
   * The three lookups run in that order, and each one runs only when the
   * previous one did not find a document. A digit-only string is tried as a
   * number first. When that misses, the same string is tried as an ObjectId
   * if its shape is valid.
   *
   * `NotFoundException` becomes HTTP 404. The message lists every accepted
   * form of `term` so the caller knows what was searched.
   */
  async findOne(term: string): Promise<Pokemon> {
    let pokemon: Pokemon | null = null;

    if (/^\d+$/.test(term.trim())) {
      pokemon = await this.pokemonModel
        .findOne({ no: Number(term) })
        .exec();
    }

    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term).exec();
    }

    if (!pokemon) {
      pokemon = await this.pokemonModel
        .findOne({ name: this.normalizeName(term) })
        .exec();
    }

    if (!pokemon) {
      throw new NotFoundException(
        `Pokemon with id, name or no "${term}" not found`,
      );
    }

    return pokemon;
  }

  /**
   * Applies a partial update to the Pokemon identified by `term`.
   *
   * `findOne` resolves number, id, or name and throws 404 when nothing matches.
   * `document.updateOne` writes the given fields. It does not refresh the
   * in-memory document, so the response is built by spreading the current
   * JSON and laying the new fields on top. Those new fields win.
   *
   * A duplicate `name` or `no` still raises MongoDB error 11000, handled below.
   */
  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    const updates: UpdatePokemonDto = { ...updatePokemonDto };

    if (updates.name) {
      updates.name = this.nameForStorage(updates.name);
    }

    try {
      await pokemon.updateOne(updates).exec();
      return { ...pokemon.toJSON(), ...updates };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Deletes by MongoDB id.
   *
   * The controller already ran `ParseMongoIdPipe`, so `id` has a valid shape.
   * `deleteOne` removes the matching document and reports how many were removed.
   * A `deletedCount` of 0 means the id was well formed and no document had it.
   * That case answers 400 with `BadRequestException`, which is the response
   * this method is written to produce.
   *
   * There is no response body. Nest turns a resolved `void` into `200` with
   * an empty body.
   */
  async remove(id: string): Promise<void> {
    const { deletedCount } = await this.pokemonModel
      .deleteOne({ _id: id })
      .exec();

    if (!deletedCount) {
      throw new BadRequestException(`Pokemon with id "${id}" not found`);
    }
  }

  /**
   * One stored spelling for every name: surrounding spaces removed, letters
   * lowercased. Create, update, and name lookup all call this, so the value
   * written to the unique index is the value later searched.
   *
   * `toLowerCase()` follows a fixed mapping on every machine.
   */
  private normalizeName(name: string): string {
    return name.toLowerCase().trim();
  }

  /**
   * Normalized name ready to persist.
   * `@MinLength(1)` accepts a string of spaces. After `trim` that string is
   * empty, which would occupy the unique index, so the write is rejected.
   */
  private nameForStorage(name: string): string {
    const normalized = this.normalizeName(name);

    if (!normalized) {
      throw new BadRequestException(
        'name must include at least 1 character besides spaces',
      );
    }

    return normalized;
  }

  /**
   * Maps a database failure to an HTTP exception.
   *
   * Declared `never` because every branch throws. Callers can `await` a write
   * inside `try` and TypeScript still treats the success path as the only
   * path that returns a value.
   *
   * An `HttpException` (400, 404, and the other Nest HTTP errors) is thrown
   * again unchanged. Error code 11000 is MongoDB's duplicate-key error.
   * `keyValue` is the field that collided, for example `{ name: "pikachu" }`.
   * The client gets 400. Any other error is logged and answered with 500.
   */
  private handleExceptions(error: unknown): never {
    // A 400 or 404 thrown closer to the call is already the right HTTP response.
    if (error instanceof HttpException) {
      throw error;
    }

    const mongoError = error as MongoErrorLike;

    if (mongoError?.code === 11000) {
      throw new BadRequestException(
        `Pokemon exists in db ${JSON.stringify(mongoError.keyValue)}`,
      );
    }

    this.logger.error(
      error instanceof Error ? error.message : 'Unexpected error',
      error instanceof Error ? error.stack : undefined,
    );

    throw new InternalServerErrorException(
      `Can't complete Pokemon operation - Check server logs`,
    );
  }
}
