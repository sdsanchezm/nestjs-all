// Shape of one Pokemon document in MongoDB.
// A class plus decorators replaces a hand-written Mongoose schema object.
// This describes storage. Incoming HTTP data is described by the DTOs.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// @Schema() tells Nest/Mongoose that this class is a document schema.
// Extending Document adds methods such as save(), updateOne(), and toJSON().
@Schema()
export class Pokemon extends Document {

    // MongoDB assigns _id by itself, so this class does not declare an id.
    // id: string // Mongo me lo da

    // @Prop() maps a TypeScript field to a field in the document.
    // unique: the database rejects a second Pokemon with the same name.
    // index: MongoDB keeps an extra lookup structure so name searches stay fast.
    @Prop({
        unique: true,
        index: true,
    })
    name: string;

    // Pokedex number (1 = Bulbasaur). This is not the MongoDB _id.
    @Prop({
        unique: true,
        index: true,
    })
    no: number;

}


// Reads the @Prop() decorators and builds the Mongoose schema
// that PokemonModule registers with forFeature().
export const PokemonSchema = SchemaFactory.createForClass( Pokemon );
