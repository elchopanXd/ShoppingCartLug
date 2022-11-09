import { Router } from "express";
import { resolveModuleNameFromCache } from "typescript";
import cartController from "../../Controllers/cart";

const router = Router();

//Get
router.get("/", cartController.get);


export default router;