import {Schema, model, SchemaTypes, Types} from "mongoose"

const cartSchema = new Schema({
    cart_name: {type: String, unique: true},
    cart_details: {type: Array},
    total_price: {type: Number, default: 0}
});

export default model("Cart", cartSchema);