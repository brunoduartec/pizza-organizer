const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async () => {
  const data = await docClient.scan({ TableName: "PizzaPartyItems" }).promise();
  
  const items = data.Items.map(({ item, quemVaiLevar, quantidade, unidade }) => ({
    item,
    quemVaiLevar: Array.isArray(quemVaiLevar) ? quemVaiLevar : [],
    quantidade,
    unidade
  }));

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(items),
  };
};