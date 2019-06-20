// @ts-check
const CosmosClient = require("../../../").CosmosClient;

class TaskDao {
  /**
   *
   * @param {CosmosClient} cosmosClient
   * @param {*} databaseId
   * @param {*} containerId
   */
  constructor(cosmosClient, databaseId, containerId) {
    this.client = cosmosClient;
    this.databaseId = databaseId;
    this.collectionId = containerId;

    this.database = null;
    this.container = null;
  }

  async init() {
    const dbResponse = await this.client.databases.createIfNotExists({ id: this.databaseId });
    this.database = dbResponse.database;
    const coResponse = await this.database.containers.create({ id: this.collectionId });
    this.container = coResponse.container;
  }

  async find(querySpec) {
    if (!this.container) {
      throw new Error("Collection is not initialized.");
    }
    const { resources: results } = await this.container.items.query(querySpec).fetchAll();
    return results;
  }

  async addItem(item) {
    item.date = Date.now();
    item.completed = false;
    const { resource: doc } = await this.container.items.create(item);
    return doc;
  }

  async updateItem(itemId) {
    const doc = await this.getItem(itemId);
    doc.completed = true;

    const { resource: replaced } = await this.container.item(itemId, undefined).replace(doc);
    return replaced;
  }

  async getItem(itemId) {
    const { resource } = await this.container.item(itemId, undefined).read();

    return resource;
  }
}

module.exports = TaskDao;
