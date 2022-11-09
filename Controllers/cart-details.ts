import { Console, info } from "console";
import { Request, Response} from "express";
import { Server } from "http";
import { Query } from "mongoose";
import { type } from "os";
import cartDetailsModel from "../Models/cart-detail";
//Para poder obtener los products de la base de datos, deberé importar el modelo de producto
import productsModel from "../Models/products";
import cartModel from "../Models/cart";
import { getRandomValues, randomBytes } from "crypto";

const cart_DetailsController = {
        //Req tendrá la información sobre la petición HTTP del Evento
        //Res devolverá la repuesta HTTP deseada.   
    
        get: async (req: Request, res: Response) => {
            try
            {
                const existCart = await cartModel.find()
                if(existCart)
                {
                //Obtener Products
                const findProducts = await cartDetailsModel.find()
                //Se mostrará la lista de products en el carrito
                res.status(200).send(findProducts)
                }else
                {
                    //Creará el carrito y se podrá operar
                   createCart()
                   res.status(200).send(`Se creo un carrito.`)
                }
               
            }
            catch (error)
            {
                //Código de error 500
                res.status(500).send(error)
            }
        },

        add: async (req: Request, res: Response) => {
            try
            {

                //Producto que se desea agregar, para agregar un producto se deberá escribir desde body
                const findProducts = await productsModel.findOne({name_product: req.body.name_product});
                const existCart = await cartModel.findOne({cart_name: "Carrito"})
                                    //Consultas mongoose
                if(!existCart)
                {
                    createCart();
                }
                
                
                //Revisar si existe el producto antes de agregarlo
                if(findProducts?.name_product && existCart){
                //OperationsCART es la quantity de products que se quiuere tener ahora y también tendrá el price que se obtendrá de la base de datos products
                const OperationsCART = {quantity: req.body.quantity, price: findProducts.price}
                if(OperationsCART.quantity <= findProducts.quantity ){
                    //Si se cumple la condición, se agregará el producto y se descontará la quantity de products del model producto                   
                    //La variable Totalprice guardará el nuevo price según la quantity de products ingresados
                    const Totalprice = getpriceTOTAL(OperationsCART.price, OperationsCART.quantity);
                    //La variable Totalprice pondrá el nuevo price del producto en el carrito
                    const addProduct = new cartDetailsModel({name_product: findProducts?.name_product, quantity: req.body.quantity, price: Totalprice}); 
                    await addProduct.save();
                    //Actualizar products // La variable TotalStock guardará el stock total que quedo en la base de datos de Products
                    const stockRestante = getstockRestante(OperationsCART.quantity, findProducts.quantity);
                    //carritoLenght obtenemos el tamaño del array
                    const carritoLenght = existCart.cart_details.length
                    //Para comprobar sí es 0 el Stock, sí es 0 se borrará el producto de la base de datos
                    if(stockRestante == 0)
                    {
                        
                        existCart?.cart_details.push(addProduct)
                        existCart.total_price = getpricecarritoList(existCart.total_price, Totalprice);
                        existCart.save();
                        findProducts.delete();
                        
                    }else{
                        findProducts.quantity = stockRestante;
                        findProducts.save();
                        existCart?.cart_details.push(addProduct)
                        existCart.total_price = getpricecarritoList(existCart.total_price, Totalprice);
                        existCart.save();
                    }                            
                    //COndicionales para subir en array
                    res.status(200).send(addProduct);
                    }else
                    {
                        res.status(400).send(`No se puede agregar el producto porque el producto ${req.body.name_product}\nno tiene stock suficiente.`);
                    }             
                }else{
                    res.status(404).send(`El producto ${req.body.name_product} no existe en la base de datos.`)
                //HTTP STATUS NOT FOUND
                }
                
            }
            catch(error)
            {
                res.status(500).send(error);
            }
            
        },

        delete: async (req: Request, res: Response) => {
            try
            {
                //Buscar el producto a eliminar del carrito con parametros
                const FindProduct = await cartDetailsModel.findOne({name_product: req.params.name_product})
                //Antes de eliminarlo creo también una variable que conecta con la base de datos de Producto
                const Products = await productsModel.findOne({name_product: req.params.name_product})
                const existCart = await cartModel.findOne({cart_name: "Carrito"})
                if(!existCart)
                {
                    createCart()
                }
                
                //Este if sirve para comprobar si existe el producto deseado y también existe en la base de datos de Producto
                if(FindProduct?.name_product && Products?.name_product){
                //Creo la variable del producto del carrito que se está por eliminar para devolver el stock en la base de datos de Producto
                    const StockCarrito = {quantity: FindProduct?.quantity}
                    //Guardo el stock que tiene almacenado la base de datos de Producto
                    const StockProducts = {quantity: Products?.quantity}
                    //Ahora creo una variable que guardará el stock de ProductoCarrito y sumará ese Stock con el Stock de la base de datos de Producto
                    const TotalStock = getquantityTOTAL(StockCarrito.quantity, StockProducts.quantity);
                    const productoNombre = await cartDetailsModel.findOneAndDelete({name_product: req.params.name_product})
                    //Una vez eliminado la base de datos, se guardará los stock sumados a la base de datos de PRODUCTS
                    Products.quantity = TotalStock;
                    
                    if(existCart && FindProduct.price)
                    {
                        //Eliminar valores del array
                        const deleteProductArray = existCart.cart_details.filter((FindProduct => FindProduct.name_product != req.params.name_product))
                        existCart.cart_details = deleteProductArray;
                        existCart.total_price = existCart.total_price - FindProduct.price
                        existCart.save();
                    }
                    Products.save()
                    res.status(200).send(`El producto ${FindProduct.name_product} se elimino con exito del carrito y \nse devolvió el stock del carrito a la base de datos de Products`);                         
                //Sí esta condiciíon se activa es porque existe el producto en la base de datos Carrito pero no en la base de datos Products
                }else if(FindProduct?.name_product && !Products?.name_product && FindProduct.price) 
                {
                    //Operaciones Matemáticas para devolver el price Original
                    const OperationsCART = {quantity: FindProduct.quantity, price: FindProduct.price}
                    const priceProduct = getprice(OperationsCART.price, OperationsCART.quantity);
                    //Volver a crear el producto en la base de datos products
                    const newProduct = new productsModel({name_product: FindProduct.name_product, quantity: FindProduct.quantity, price: priceProduct});
                    newProduct.save();
                    //Actualizar array
                    if(existCart)
                    {
                        //Eliminar valores del array
                        const deleteProductArray = existCart.cart_details.filter((FindProduct => FindProduct.name_product != req.params.name_product))
                        existCart.cart_details = deleteProductArray;
                        existCart.total_price = existCart.total_price - FindProduct.price
                        existCart.save();
                    }
                    //Ahora borrará el producto del carrito y lo devolverá a la base de datos products
                    FindProduct.delete();
                    res.status(200).send(`El producto ${FindProduct.name_product} se elimino con exito del carrito y \nse devolvió el stock del carrito a la base de datos de Products`)
                }else{
                    res.status(404).send(`El producto ${req.params.name_product} no existe en la base de datos`);
                }
                
            }
            catch(error)
            {
                res.status(500);
            }
        },

        put: async (req: Request, res: Response) => {
            try
            {
                //Se obtendrá el producto de la base de datos del carrito
                const getProductCART = await cartDetailsModel.findOne({name_product: req.body.name_product})
                //Se obtendrá el producto de la base de datos de producto
                const getProduct = await productsModel.findOne({name_product: req.body.name_product})
                //El condicional este nos dirá si existen los dos products en sus respectivas base de datos
                const existCart = await cartModel.findOne({cart_name: "Carrito"})
                if(!existCart)
                {
                    createCart();
                }

                if(getProductCART && getProduct)
                {
                    //Obtenemos el quantityTOTAL
                    const stockTOTAL = getquantityTOTAL(getProductCART?.quantity, getProduct?.quantity)
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const priceProduct = getProduct?.price;
                    //Obtenemos la nueva quantity que se quiere modificar
                    const newquantity = {quantity: req.body.quantity}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const stockRestante = getstockRestante(newquantity.quantity, stockTOTAL)
                     //Crear una variable para guardar el price antiguo
                    const priceCARTold = getProductCART.price;
                    //En el siguiente condicional, se comprobará que la quantity nueva de products no sea negativa
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(stockRestante >= 0 && priceProduct && existCart && getProductCART && priceCARTold)
                    {
                        
                     if(newquantity.quantity != 0)
                     {
                        //Sí stock restante es 0 se borrará el producto de la base de datos
                        if(stockRestante == 0)
                        {
                            getProduct?.delete();
                        }else if(getProduct?.quantity != null)
                        {
                            getProduct.quantity = stockRestante
                            getProduct.save();
                        }
                       
                        getProductCART.quantity = newquantity.quantity
                        getProductCART.price = priceProduct * newquantity.quantity;
                        getProductCART.save();
                        //Actualizar Array
                        const index = existCart.cart_details.findIndex((producto) => {
                            return producto.name_product == getProductCART.name_product
                        });
                        const updateArray = existCart.cart_details.splice(index, 1)
                        existCart.cart_details.push(getProductCART);
                        //Comprobar si existe solo un producto en el carritp
                        existCart.total_price = existCart.total_price + getProductCART.price - priceCARTold 
                        existCart.save();
                        res.status(200).send(`Se actualizo con exito el producto del carrito:\n* ${req.body.name_product}\n* quantity: ${newquantity.quantity}\n\n`)
                     }
                     else
                      {
                        if(existCart && getProductCART.price)
                        {
                        //Eliminar valores del array
                           
                        existCart.cart_details = existCart.cart_details.filter((producto) => {
                            return producto.name_product != getProductCART.name_product
                        })
                        existCart.total_price = existCart.total_price - getProductCART.price
                        existCart.save();
                        }           
                        //Se eliminará el producto del carrito sí la nueva quantity es 0
                        getProduct.quantity = stockRestante;
                        getProduct.save();
                        getProductCART.delete();
                        res.status(200).send(`Se elimino el producto del carrito y se envió el stock restante a \nla base de datos de Products.`)
                      }    
                        
                    }else
                    {
                        res.status(400).send(`No hay stock suficiente.`);
                    }
                } 
                //El condicional este nos dirá si no existe en la base de datos carrito pero si existe el producto en la base de datos de producto     
                if(!getProductCART && getProduct)
                {
                    res.status(400).send(`No se puede actualizar, el producto ${req.body.name_product} no existe en el carrito.`)
                }
                // El condicional se activa si existe el producto en el carrito pero no en la base de datos de producto          
                if(getProductCART && !getProduct)
                {
                    //Obtenemos el quantityTOTAL
                    const stockTOTAL = getProductCART.quantity
                    //Obtenemos el price del producto, no el price del producto en el carrito 
                    const priceProduct = getprice(getProductCART.price, stockTOTAL)
                    //Obtenemos la nueva quantity que se quiere modificar
                    const newquantity = {quantity: req.body.quantity}
                    //Obtenemos el stock restante que será devuelto a la base de datos de producto
                    const stockRestante = getstockRestante(newquantity.quantity, stockTOTAL)
                    const priceCARTold = getProductCART.price;
                    //En el siguiente condicional, se comprobará que la quantity nueva de products no sea negativa ni 0
                    //También si el price del producto del carrito existe y también el price del producto de la base de datos
                    if(stockRestante > 0)
                    {
                        //Sí la nueva quantity es 0, entonces se borrará el producto de la base de datos y se devolverá todo sus valores a la base de datos products
                        if(newquantity.quantity == 0 && existCart && getProductCART.price)
                        {
                            const createProduct = new productsModel({name_product: getProductCART.name_product, quantity: stockRestante, price: priceProduct})
                            createProduct.save();
                           //Eliminar valores del array
                            existCart.cart_details = existCart.cart_details.filter((producto) => {
                            return producto.name_product != getProductCART.name_product
                            })
                            existCart.total_price = existCart.total_price - getProductCART.price
                            existCart.save();
                            getProductCART.delete();
                            res.status(200).send(`Se elimino el producto ${req.body.name_product} del carrito \ny se devolvió el stock a la base de datos Products.`)
                        } 
                        if (newquantity.quantity > 0 && existCart && getProductCART.price && priceCARTold)
                        {
                            const createProduct = new productsModel({name_product: getProductCART.name_product, quantity: stockRestante, price: priceProduct})
                            getProductCART.quantity = newquantity.quantity
                            getProductCART.price = getpriceTOTAL(priceProduct, newquantity.quantity)
                            createProduct.save();
                            getProductCART.save();
                            //Actualizar Array
                            const index = existCart.cart_details.findIndex((producto) => {
                                return producto.name_product == getProductCART.name_product
                                });
                                const updateArray = existCart.cart_details.splice(index, 1)
                                existCart.cart_details.push(getProductCART);
                                //Comprobar si existe solo un producto en el carritp
                                existCart.total_price = existCart.total_price + getProductCART.price - priceCARTold 
                                existCart.save();
                            res.status(200).send(`Se actualizo con exito el producto del carrito:\n* Producto: ${getProductCART.name_product}\n* Nueva quantity: ${getProductCART.quantity}\n* Nuevo price: ${getProductCART.price}\n\nSe devolvió a la base de datos producto:\n* Producto: ${req.body.name_product}\n* Stock devuelto: ${stockRestante}`)
                        }                       
                    }else
                    {
                        res.status(400).send(`No se pudo actualizar, debido a que supero la quantity de stock, el stock total del producto ${getProductCART.name_product} es de: ${getProductCART.quantity}`)
                    }
                }
                if(!getProductCART && !getProduct)
                {
                    res.status(400).send(`El producto ${req.body.name_product} no existe.`)
                }
                
            }
            catch (error)
            {
                res.status(500).send(`Error en el servidor`);
            }
               
        },

}

function getprice(priceTOTAL: any, quantity: any)
{
    //Ecuación utilizada: price = priceTOTAL/quantity
    return priceTOTAL/quantity;
}

function getquantityTOTAL(quantity: any, stockRestante: any)
{
    return quantity + stockRestante;
}

function getstockRestante(newquantity: any, stockTOTAL: any) // pasar a number los any
{
    //Ecuación utilizada: stockRestante = stockTOTAL - newquantity
    return stockTOTAL - newquantity;
}

function getpriceTOTAL(price: number, quantity: number)
{
    //Ecuación utilizada: priceTOTAL = price * quantity
    return price * quantity;
}

function createCart()
{
    const newCarrito = new cartModel({cart_name: "Carrito", cart_details: [], total_price: 0}); 
    newCarrito.save();
}

function getpricecarritoList(priceTOTALCARRITOLIST: any, priceTOTALCARRITODETAILS: any)
{
    return priceTOTALCARRITODETAILS + priceTOTALCARRITOLIST;
}

export default cart_DetailsController;