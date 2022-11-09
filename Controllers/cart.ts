import { Request, Response } from "express";
import {Server} from "http";
import {Query} from "mongoose";
import {type} from "os";
import carritoDetailsModel from "../Models/cart-detail";
import cartModel from "../Models/cart";

const cartController = {

    get: async(req: Request, res: Response) => {
        try
        {
            const getCart = await cartModel.find()
            if(getCart)
            {   
                res.status(200).send(getCart)
            }else
            {
                res.status(400).send(`No existen carritos registrados en la base de datos.`)
            }
        }
        catch(error)
        {
            res.status(500).send(error)
        }



    },
}

export default cartController;

