import { Router } from "express";
import { resolveModuleNameFromCache } from "typescript";
import cartController from "../../Controllers/cart-details";

//Invocamos la ruta de express
const router = Router();

//GET
router.get("/", cartController.get)

//POST
router.post("/", cartController.add)

//DELETE
router.delete("/:name_product", cartController.delete)

//PUT
router.put("/", cartController.put)

export default router;