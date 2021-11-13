const express = require('express');
let router = express.Router();
const jwt = require('jsonwebtoken');
const mailSender = require('../../../utils/mailer.js');
let SecModelClass = require('./sec.model.js');
let SecModel = new SecModelClass();

router.post('/login', async(req, res, next) => {
    try{
        const {email, pswd} = req.body;
        let userLogged = await SecModel.getByEmail(email);
        if (userLogged){
            const  isPswdOk = await SecModel.comparePassword(pswd, userLogged.password);
            if (isPswdOk){
                delete userLogged.password;
                delete userLogged.oldpasswords;
                delete userLogged.laslogin;
                delete userLogged.lastpasswordchange;
                
                let payload = {
                    jwt : jwt.sign(
                        {
                            email : userLogged.email,
                            _id : userLogged._id,
                            roles : userLogged.roles
                        },
                        process.env.JWT_SECRET,
                        {expiresIn : '1d'}
                    ),
                    user : userLogged
                };

                return res.status(200).json(payload);
            }
        }
        //console.log({email, userLogged});
        return res.status(200).json({msg : "Las credenciales no son válidas"})
    }catch(ex){
        res.status(500).json({"msg" : "Error"});
    }
});

router.post('/signin', async(req, res, next) => {
    try{
        const {email, pswd} = req.body;
        console.log(email + " " + pswd);
        let userAdded = await SecModel.createNewUser(email, pswd);
        delete userAdded.password;
        console.log(userAdded);
        res.status(200).json({"msg":"Usuario creado satisfactoriamente"});
    }catch(ex){
        res.status(500).json({"msg" : "Error"});
    }
});

router.put('/forgotpassword/:email', async (req, res, next) => {
    try{
        const {email} = req.params;
        //const {id} = req.body;
        let user = await SecModel.getByEmail(email);
        console.log(user);
        if(user){
            const token = jwt.sign({_id:user._id}, process.env.JWT_SECRET, {expiresIn:'20m'});
            const resetKeyUpdated = await SecModel.updateResetKey(token, user._id);
            mailSender(
                email,
                "Recuperación de contraseña",
                `<h3>Haga click <a href='http://localhost:3000/${token}>aquí</a> para recuperar su contraseña </h1>`
            );
            return res.status(200).json({msg : "Recuperación en proceso, link de recuperación enviado al correo.", token: token});
        }else{
            return res.status(200).json({msg : "No existe una cuenta relacionada a este correo."});
        }
    }catch (ex){
        console.log(ex);
        return res.status(500).json({"msg" : "Error"});
    }
   
});

router.put('/resetpassword', async (req, res, next) => {
    try{
        const {token, newPass} = req.body;

        jwt.verify(token, process.env.JWT_SECRET, async (error,decodeOne) => {
            if (error){
                return res.status(200).json({msg:"Token inválido o expirado"});
            }else{
                let user = await SecModel.getByResetKey(token);
                if (user){
                    let passUpdated = await SecModel.updatePassword(user._id, newPass);
                    let keyDeleted = await SecModel.deleteResetKey(user._id);

                    return res.status(200).json({msg:"Contraseña actualizada exitosamente"});
                }else{
                    return res.status(200).json({msg:"Token inválido"});
                }
            }
        });
    }catch(ex){
        console.log(ex);
        return res.status(500).json({"msg" : "Error"});
    }
    
});

module.exports = router;

