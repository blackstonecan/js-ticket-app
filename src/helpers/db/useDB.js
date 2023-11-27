const MongoClient = require('mongodb').MongoClient;

const Response = require('../../helpers/models/Response');
const CustomError = require('../../helpers/models/CustomError');

const URL = 'mongodb://IP:PORT';
const dbName = 'DB_NAME';

const useDB = async (func)  => {
  const client = new MongoClient(URL);
  try {
    await client.connect();
    const db = client.db(dbName);
    let response = await func(db);
    if(!response) return new Response(true, null);
    
    return response;
  } catch (error) {
    return new Response(false, new CustomError(error, 503));
  } finally {
    await client.close();
  }
}

module.exports = useDB;