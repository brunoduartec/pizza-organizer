const { DynamoDB } = require("aws-sdk");

const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const item = decodeURIComponent(event.pathParameters.item);
  const body = JSON.parse(event.body);
  const person = body.name;

  await docClient.update({
    TableName: "PizzaPartyItems",
    Key: { item },
    UpdateExpression: "ADD quemVaiLevar :p",
    ExpressionAttributeValues: { ":p": docClient.createSet([person]) },
    ReturnValues: "UPDATED_NEW"
  }).promise();

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ success: true }),
  };
};