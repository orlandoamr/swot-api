var conn = require('../../../utils/dao');
var ObjectID = require('mongodb').ObjectId;
var _db;

class Swot{

    swotColl = null;

    constructor(){
        this.initModel();
    }

    async initModel(){
        try{
            _db = await conn.getDB();
            this.swotColl = await _db.collection("SWOT");
        }catch(ex){
            console.log(ex);
            process.exit(1);
        }
    }

    async getAll(id){
        const filter = {"user_id": new ObjectID(id)};
        let swots = this.swotColl.find(filter);
        return swots.toArray();
    }

    async getById(id){
        const filter = {"_id": new ObjectID(id)};
        let swotDocument = this.swotColl.findOne(filter);
        return swotDocument;
    }

    async getWithFilterAndProjection(filter, projection){
        let p = {
            "projection" : projection
        };

        let swots = await this.swotColl.find(filter, p);

        return swots.toArray();
    }

    async updateRelevanceRandom(id){
        const filter = {"_id" : new ObjectID(id)};
        const updateAction = {"$set" : {swotRelevance: Math.round(Math.random() * 100)/100}};
        let result = await this.swotColl.updateOne(filter, updateAction);
        return result;
    }

    async getById(id){
        const filter = { "_id" : new ObjectID(id)};
        let swotDocument = await this.swotColl.findOne(filter);

        return swotDocument;
    }

    async getByType(type, userId){
        const filter = {"swotType": type, "user_id":new ObjectID(userId)};
        let cursor = await this.swotColl.find(filter);

        return cursor.toArray();
    }

    async getByMetaKey(key, userId){
        const filter = {"swotMeta" : key, "user_id":new ObjectID(userId)};
        let cursor = await this.swotColl.find(filter);
        
        return cursor.toArray();
    }

    async getByFacet(textToSearch, page, itemsPerPage, userId){
        const filter = {swotDesc : RegExp(textToSearch, 'g'),"user_id":new ObjectID(userId)};
        console.log(filter);

        // const options = {
        //     projection: {},
        //     limit: itemsPerPage,
        //     skip: (itemsPerPage * (page - 1))
        // };

        let cursor = await this.swotColl.find(filter);
        let docsMatched = await cursor.count();
        cursor.skip((itemsPerPage * (page-1)));
        cursor.limit(itemsPerPage);

        let documents = await cursor.toArray();

        return {
            docsMatched,
            documents,
            page,
            itemsPerPage
        }

    }

    async getAggregateedData(userId){
        const PipeLine = [
            {
              '$match': {
                'user_id': new ObjectID(userId)
              }
            }, {
              '$group': {
                '_id': '$swotType',
                'swotTypeCount': {
                  '$sum': 1
                }
              }
            }, {
              '$sort': {
                '_id': 1
              }
            }
          ];
        const cursor = this.swotColl.aggregate(PipeLine);
        return await cursor.toArray();
    }

    async addNew(swoType,swotDesc,swotMetaArray, id){
        let newSwot = {
            swoType,
            swotDesc,
            swotMeta: swotMetaArray,
            swotDate: new Date().getTime(),
            user_id: new ObjectID(id)
        }

        let result = await this.swotColl.insertOne(newSwot);
        return result;
    }

    async addMetaSwot(swotMetaKey, id){
        let filter = {"_id" : new ObjectID(id)};
        let updateJSON = {
            "$push" : {"swotMeta" : swotMetaKey}
        };
        let result = await this.swotColl.updateOne(filter, updateJSON);
        
        return result;
    }

    async deleteById(id){
        let filter = {"_id" : new ObjectID(id)};
        let result = await this.swotColl.deleteOne(filter);
        
        return result;
    }
    
    async getByEmail(email){
        const filter = ""
    }
}

module.exports = Swot;