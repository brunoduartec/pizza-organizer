const Joi = require("joi");
const { DynamoDB } = require("aws-sdk");

const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const item = decodeURIComponent(event.pathParameters.item);
  const body = JSON.parse(event.body);
  const { quantidade, unidade, name } = body;

  const schema = Joi.object({
    name: Joi.string().min(1).optional(),
    quantidade: Joi.number().integer().min(1).required(),
    unidade: Joi.string().min(1).required()
  });

  const { error } = schema.validate({ name, quantidade, unidade });
  if (error) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.details[0].message }),
    };
  }

  const updateParams = {
    TableName: "PizzaPartyItems",
    Key: { item },
    UpdateExpression: "SET quantidade = if_not_exists(quantidade, :q), unidade = if_not_exists(unidade, :u)",
    ExpressionAttributeValues: {
      ":q": quantidade,
      ":u": unidade
    },
    ReturnValues: "UPDATED_NEW"
  };

  if (name) {
    updateParams.UpdateExpression = "ADD quemVaiLevar :p, " + updateParams.UpdateExpression;
    updateParams.ExpressionAttributeValues[":p"] = docClient.createSet([name]);
  }

  await docClient.update(updateParams).promise();

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ success: true }),
  };
};