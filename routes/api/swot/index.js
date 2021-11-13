const { parse } = require('dotenv');
var express = require('express');
var router = express.Router();
var SwotDao = require('./swot.dao');
var Swot = new SwotDao();

router.get('/all', async(req, res, next)=>{
    try{
        const allSwotEntries = await Swot.getAll(req.user._id); 
        return res.status(200).json(allSwotEntries);
    }catch(ex){
        console.log(ex);
        return res.status(500).json({msg: "Error al procesar la petición"});
    }
});

// SWOT == FODA

router.get('/byid/:id', async (req, res, next)=>{
    
    try{
        const {id} = req.params;
        const oneSwotEntry = await Swot.getById(id); 
        return res.status(200).json(oneSwotEntry);
    }catch(ex){
        console.log(ex);
        return res.status(500).json({msg: "Error al procesar la petición"});
    }
});

router.get('/bytype/:type', async(req, res, next) => {
    try{
        const {type} = req.params;
        const swots = await Swot.getByType(type, req.user._id);
        return res.status(200).json(swots);
    }catch(ex){
        console.log(ex);
    }
})

router.get('/bymeta/:meta', async (req, res, next) => {
    try {
      const { meta } = req.params;
      const swots = await Swot.getByMetaKey(meta, req.user._id);
      return res.status(200).json(swots);
    } catch (ex) {
      console.log(ex);
      return res.status(500).json({ msg: "Error al procesar petición" });
    }
  });
   
router.get('/facet/:page/:items/:text', async(req, res, next) =>{
    try{
        let {page, items, text} = req.params;
        page = parseInt(page) || 1;
        items = parseInt(items) || 10;

        const swots = await Swot.getByFacet(text, page, items, req.user._id);
        
        return res.status(200).json(swots);
    }catch(ex){
        console.log(ex);
        return res.status(500).json({ msg: "Error al procesar petición" });
      }
  });

router.get('/byrelevancerange/:lower/:upper/:extremes', async (req, res, next)=>{
    try{
        const {lower, upper, extremes } = req.params;
        const filter = (parseInt(extremes) > 0 ) ?
        {
            swotRelevance: {
            "$gte": parseFloat(lower),
            "$lte": parseFloat(upper)
            }
        }
        :
        {
        swotRelevance: {
            "$gt": parseFloat(lower),
            "$lt": parseFloat(upper)
        }
        };
        const swots = await Swot.getWithFilterAndProjection(filter, {});
        return res.status(200).json(swots);
    }catch (ex) {
        console.log(ex);
        return res.status(500).json({ msg: "Error al procesar petición" });
    }
});

router.get('/dashboard', async (req, res, next) =>{
    try{
        const swots = await Swot.getAggregateedData(req.user._id);
        return res.status(200).json(swots);
    }catch(ex){
        console.log(ex);
        return res.status(500).json({msg: "Error al presentar petición"});
    }
})
  

router.post('/new', async (req, res, next)=>{
    try{
        const {
            swoType,
            swotDesc,
            swotDate,
            swotMeta
        } = req.body;

        const swotMetaArray = swotMeta.split('|');

        //Validaciones
        let result = await Swot.addNew(swoType,swotDesc,swotMetaArray, req.user._id);
        console.log(result);
        return res.status(200).json({msg: "Agregando satisfactoriamente"});
        
    }catch(ex){
        console.log(ex);
        return res.status(500).json({msg: "Error al presentar petición"});
    }
});

router.put('/update/:id', async (req, res, next) => {
    try{
        const {id} = req.params;
        const {swotMetaKey} = req.body;
        const result = await Swot.addMetaSwot(swotMetaKey, id);
        console.log(result);
        return res.status(200).json({"msg":"Modificado con éxito"});
    }catch(ex){
        console.log(ex);
        return res.status(500).json({msg: "Error al presentar petición"});
    }
});

router.delete('/delete/:id', async(req, res, next) => {
    try{
        const {id} = req.params;
        const result = await Swot.deleteById(id);
        console.log(result);
        return res.status(200).json({"msg":"Eliminado con éxito"});
    }catch(ex){
        console.log(ex);
        return res.status(500).json({msg: "Error al presentar petición"});
    }
});

//Método para corregir documentos masivos
router.get('/fix', async (req, res, next)=>{
    try {
      let swots = await Swot.getWithFilterAndProjection(
        {},
        { _id: 1, swotRelevance:1}
      );

      swots.map(async (o)=>{
        await Swot.updateRelevanceRandom(o._id);
      });

      return res.status(200).json(swots);

    }catch(ex){
      console.log(ex);
      return res.status(500).json({ msg: "Error al procesar petición" });
    }
  });
  

module.exports = router;