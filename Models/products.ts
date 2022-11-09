import {Schema , model} from "mongoose";

//Creación del Schema Productos
const productsSchema = new Schema({
    name_product: {type: String, required: true, unique: true},
    quantity: {type: Number, required: true},
    price: {type: Number, required: true}
});

export default model("Products", productsSchema);