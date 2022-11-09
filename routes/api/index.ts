import expressRoutes, { Router } from "express";
import productosRoutes from "./products";
import carritodetailsRoutes from "./cart-detail";
import carritoRoutes from "./cart"

//Creación de variable para enrutar los distintos modelos 
//Esto serán las rutas donde nos podremos comunicar con la API
const router = Router();

router.use("/products", productosRoutes)
router.use("/cart-details", carritodetailsRoutes)
router.use("/cartList", carritoRoutes)


export default router;