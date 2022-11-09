import { Router } from "express";
import productsController from "../../Controllers/products";

const router = Router();


//Aquí utilizaremos las controladoras creadas para productos.

//GET
router.get("/", productsController.get)
//Utilizar parametros para seleccionar un producto único
router.get('/:name_product', productsController.getunique)

//POST
router.post("/", productsController.add)

//DELETE
router.delete("/:name_product", productsController.delete)

export default router;