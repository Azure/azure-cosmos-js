//@ts-check

const { CosmosClient } = require("../..");

async function run() {
  const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });

  const query1 = "Select * from c order by c._ts";
  const query2 = "Select * from c";
  const query3 = "Select value count(c.id) from c";

  const container = client.database("testdb").container("testColl2-24KRUs");
  const query = query2;
  const options = {
    maxItemCount: 10000,
    maxDegreeOfParallelism: 1000
  };

  const queryIterator = container.items.query(query, options);
  let count = 0;
  const start = Date.now();
  while (queryIterator.hasMoreResults() && count <= 100000) {
    const { resources: results } = await queryIterator.fetchNext();
    if (results != undefined) {
      count = count + results.length;
    }
    console.log(count);
  }
  console.log('done - "' + query + '" - took ' + (Date.now() - start) / 1000 + "s");
}

run().catch(console.error);
