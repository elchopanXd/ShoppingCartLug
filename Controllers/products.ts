import { Request, Response} from "express";
import productsModel from "../Models/products";

//Controladora de Productos
const productController = {
    //Req tendrá la información sobre la petición HTTP del Evento
    //Res devolverá la repuesta HTTP deseada.
    get: async (req: Request, res: Response) => {
        try
        {
            //Obtener Productos
            const findProducts = await productsModel.find()
            res.status(200).send(findProducts)
        }
        catch (error)
        {
            //Código de error 500
            res.status(500).send(error)
        }
    },

    //Getunique es utilizado para buscar un producto en especifico
    getunique: async (req: Request, res: Response) => {
        try
        {
            const findProductsUnique = await productsModel.findOne({... req.params})
            
            //Sí el producto no existe la API mandará un HTTP STATUS NOT FOUND
            if(findProductsUnique?.name_product != undefined)
            {
                res.status(200).send(findProductsUnique)
            }else{
                res.status(404).send(`El producto escrito en los parametros no existe en la base de datos.`);
            }
        }
        catch (error)
        {
            res.status(500).send(error)
        }
    },

    //Para agregar productos
    add: async (req: Request, res: Response) => {
        try 
        {
             //Aquí se programó para que se escriba en el body todo los datos deseados para agregar
            const existProducts = await productsModel.findOne({name_product: req.body.name_product})
            if(existProducts){
                //Solicitud Incorrecta HTTP STATUS 400, Server no procesa una solicitud por algo ya existente
                res.status(400).send(`El producto ${existProducts.name_product} ya se encuentra en la base de datos`)
            }else
            {
                const addProduct = new productsModel({... req.body})
                if(addProduct.quantity > 0 && addProduct.name_product != "" && addProduct.price >= 0)
                {
                await addProduct.save()
                res.status(200).send(addProduct) // codigo 201
                }else
                {
                    //BAD REQUEST 
                    res.status(400).send(`* La quantity de productos que se desea agregar no puede ser de 0 ni inferior a este\n* Tampoco puede tener un nombre de caracter vacio\n* Los prices deben ser superior o igual a 0`);
                }                           
            }         
        } catch (error) {
            //Los valos de status son los tipos de errores que nosotros queremos que salga -> 500 es error de servidor
            res.status(500).send(error)
        }
    },

    //Para eliminar los productos
    delete: async (req: Request, res: Response) => {
        try
        {
            //Aquí se programó para que sólo se escriba el parametro que se desea eliminar
            const find_product = await productsModel.findOne({... req.params})
            //Revisará sí existe el producto deseado
            if(find_product?.name_product != undefined || find_product?.name_product != null){
                const productName = await productsModel.findOneAndDelete({... req.params});
                res.status(200).send(`Se elimino ${productName?.name_product} y sus respectivos valores de la base de datos.`);
            }
            else
            {
                res.status(404).send(`El producto ${req.params.name_product} no existe en la base de datos.`)
                //HTTP STATUS NOT FOUND
                
            }
        }
        catch(error)
        {
            res.status(500);
        }
    },

    
}
//Exportar los controladores
export default productController