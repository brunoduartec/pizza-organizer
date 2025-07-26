const Joi = require("joi");
const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

exports.handler = async (event) => {
  const item = decodeURIComponent(event.pathParameters.item);
  const body = JSON.parse(event.body);
  const { quantidade, unidade, quemVaiLevar, remover } = body;

  const schema = Joi.object({
    quantidade: Joi.number().integer().min(1).optional(),
    unidade: Joi.string().min(1).optional(),
    quemVaiLevar: Joi.array().items(Joi.string().min(1)).optional(),
    remover: Joi.string().min(1).optional()
  });

  const { error } = schema.validate({ quantidade, unidade, quemVaiLevar, remover });
  if (error) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.details[0].message }),
    };
  }

  let UpdateExpression = [];
  let ExpressionAttributeValues = {};
  let ExpressionAttributeNames = {};

  if (quantidade !== undefined) {
    UpdateExpression.push("#q = :q");
    ExpressionAttributeValues[":q"] = quantidade;
    ExpressionAttributeNames["#q"] = "quantidade";
  }

  if (unidade !== undefined) {
    UpdateExpression.push("#u = :u");
    ExpressionAttributeValues[":u"] = unidade;
    ExpressionAttributeNames["#u"] = "unidade";
  }

  if (quemVaiLevar !== undefined) {
    UpdateExpression.push("quemVaiLevar = list_append(if_not_exists(quemVaiLevar, :emptyList), :p)");
    ExpressionAttributeValues[":p"] = quemVaiLevar;
    ExpressionAttributeValues[":emptyList"] = [];
  }

  if (remover !== undefined) {
    const data = await docClient.get({
      TableName: "PizzaPartyItems",
      Key: { item }
    }).promise();

    const listaAtual = data.Item?.quemVaiLevar || [];
    const novaLista = listaAtual.filter(nome => nome !== remover);

    if (JSON.stringify(listaAtual) !== JSON.stringify(novaLista)) {
      UpdateExpression.push("quemVaiLevar = :novaLista");
      ExpressionAttributeValues[":novaLista"] = novaLista;
    }
  }

  if (UpdateExpression.length === 0) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Nenhum campo para atualizar." }),
    };
  }

  const updateParams = {
    TableName: "PizzaPartyItems",
    Key: { item },
    UpdateExpression: "SET " + UpdateExpression.join(", "),
    ExpressionAttributeValues,
    ReturnValues: "UPDATED_NEW",
    // só inclui ExpressionAttributeNames se não estiver vazio
    ...(Object.keys(ExpressionAttributeNames).length > 0 && { ExpressionAttributeNames })
  };

  await docClient.update(updateParams).promise();

  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ success: true }),
  };
};