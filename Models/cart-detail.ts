import { Schema, model } from "mongoose";

interface ICart {
    name_product: string
    quantity: number
    price: number
}

//Creación del Schema Carrito
const cartDetailsSchema = new Schema({
    name_product: {type: String, required: true, unique: true},
    quantity: {type: Number, required: true},
    price: {type: Number}
});

export default model<ICart>("cart-detail", cartDetailsSchema);
