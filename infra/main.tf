provider "aws" {
  region = "sa-east-1"
}

resource "aws_dynamodb_table" "pizza_items" {
  name         = "PizzaPartyItems"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "item"

  attribute {
    name = "item"
    type = "S"
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda_pizza_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy_attachment" "lambda_basic" {
  name       = "lambda-logs"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "dynamodb_policy" {
  name = "dynamodb-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:*"]
        Resource = aws_dynamodb_table.pizza_items.arn
      }
    ]
  })
}

resource "aws_lambda_function" "get_items" {
  filename         = "${path.module}/lambda/get_items.zip"
  function_name    = "get_items"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = filebase64sha256("${path.module}/lambda/get_items.zip")
}

resource "aws_lambda_function" "add_item" {
  filename         = "${path.module}/lambda/add_item.zip"
  function_name    = "add_item"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = filebase64sha256("${path.module}/lambda/add_item.zip")
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "pizza-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "get_items" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_items.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "add_item" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.add_item.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_items_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /items"
  target    = "integrations/${aws_apigatewayv2_integration.get_items.id}"
}

resource "aws_apigatewayv2_route" "add_item_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /items/{item}"
  target    = "integrations/${aws_apigatewayv2_integration.add_item.id}"
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "prod"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_get_items" {
  statement_id  = "AllowAPIGatewayInvokeGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_items.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_add_item" {
  statement_id  = "AllowAPIGatewayInvokePost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.add_item.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

data "local_file" "raw_index" {
  filename = "${path.module}/../frontend/index.html"
}

locals {
  index_with_api = replace(
    data.local_file.raw_index.content,
    "__API_URL__",
    "${aws_apigatewayv2_api.http_api.api_endpoint}/${aws_apigatewayv2_stage.prod.name}"
  )
}

resource "aws_s3_bucket" "pizza_site" {
  bucket = "pizza-party-site-${random_id.suffix.hex}"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  tags = {
    Name = "PizzaPartyStaticSite"
  }
}

resource "aws_s3_object" "site_index" {
  bucket       = aws_s3_bucket.pizza_site.bucket
  key          = "index.html"
  content      = local.index_with_api
  content_type = "text/html"
  acl          = "public-read"
}

resource "aws_s3_bucket_ownership_controls" "pizza_site_controls" {
  bucket = aws_s3_bucket.pizza_site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "pizza_site_block" {
  bucket                  = aws_s3_bucket.pizza_site.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "pizza_site_policy" {
  bucket = aws_s3_bucket.pizza_site.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = "*",
      Action = ["s3:GetObject"],
      Resource = "${aws_s3_bucket.pizza_site.arn}/*"
    }]
  })
}

resource "random_id" "suffix" {
  byte_length = 4
}

output "s3_static_site_url" {
  value = aws_s3_bucket.pizza_site.bucket_regional_domain_name
}

output "pizza_api_url" {
  value = "${aws_apigatewayv2_api.http_api.api_endpoint}/${aws_apigatewayv2_stage.prod.name}"
}