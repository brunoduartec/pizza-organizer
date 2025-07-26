#!/bin/bash

set -e

echo "🔄 Limpando zips antigos..."
rm -f infra/lambda/*.zip

echo "📦 Empacotando Lambdas..."

cd infra/lambda

echo "📦 Empacotando GET"
cd get_items && zip -r ../get_items.zip . 
cd ..

echo "📦 Empacotando ADD"
cd add_item && zip -r ../add_item.zip . 
cd ..

echo "📦 Empacotando UPDATE"
cd update_item && zip -r ../update_item.zip . 
cd ..

echo "📦 Empacotando PATCH 1"
cd patch_item 
echo "📦 Empacotando PATCH 2"
zip -r ../patch_item.zip . 
cd ../..

echo "🧹 Limpando cache do Terraform..."
rm -rf .terraform .terraform.lock.hcl

echo "⚙️ Inicializando Terraform..."
terraform init

echo "✅ Executando Terraform Apply..."
terraform apply -auto-approve

echo "🔄 Atualizando index.html com URL da API..."

API_URL=$(terraform output -raw pizza_api_url)
NOME_DO_SEU_BUCKET=$(terraform output -raw s3_bucket_name)

# Substitui o marcador __API_URL__ pelo valor real no arquivo index.html
sed "s|__API_URL__|$API_URL|g" ../frontend/index.template.html > ../frontend/index.html

echo "📤 Subindo index.html para o S3..."
aws s3 cp ../frontend/index.html s3://$NOME_DO_SEU_BUCKET/index.html