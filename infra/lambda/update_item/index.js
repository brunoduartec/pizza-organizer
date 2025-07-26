const Joi = require("joi");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

exports.handler = async (event) => {
  const item = decodeURIComponent(event.pathParameters.item);
  const body = JSON.parse(event.body);
  const { quantidade, unidade, quemVaiLevar } = body;

  const schema = Joi.object({
    quantidade: Joi.number().integer().min(1).optional(),
    unidade: Joi.string().min(1).optional(),
    quemVaiLevar: Joi.array().items(Joi.string().min(1)).optional()
  });

  const { error } = schema.validate({ quantidade, unidade, quemVaiLevar });
  if (error) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.details[0].message }),
    };
  }

  let UpdateExpression = [];
  let ExpressionAttributeValues = {};

  if (quantidade !== undefined) {
    UpdateExpression.push("quantidade = :q");
    ExpressionAttributeValues[":q"] = quantidade;
  }

  if (unidade !== undefined) {
    UpdateExpression.push("unidade = :u");
    ExpressionAttributeValues[":u"] = unidade;
  }

  if (quemVaiLevar !== undefined) {
    UpdateExpression.push("SET quemVaiLevar = list_append(if_not_exists(quemVaiLevar, :emptyList), :p)");
    ExpressionAttributeValues[":p"] = quemVaiLevar;
    ExpressionAttributeValues[":emptyList"] = [];
  }

  if (UpdateExpression.length === 0) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Nenhum campo para atualizar." }),
    };
  }

  await docClient.update({
    TableName: "PizzaPartyItems",
    Key: { item },
    UpdateExpression: UpdateExpression.join(", "),
    ExpressionAttributeValues,
    ReturnValues: "UPDATED_NEW"
  }).promise();

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ success: true }),
  };
};